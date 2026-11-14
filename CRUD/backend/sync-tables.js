// Table definitions in setup.js are the single source for creation and updates.
// Keep existing rows and extra legacy columns. Apply schema changes atomically.
const quote = (name) => `"${name.replace(/"/g, '""')}"`;

async function syncTables(pool, tables) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [table, definitions] of Object.entries(tables)) {
      const tableSql = quote(table);
      await client.query(`CREATE TABLE IF NOT EXISTS ${tableSql} (${definitions.join(', ')})`);
      const { rows } = await client.query(
        `SELECT attname, format_type(atttypid, atttypmod) AS type, attnotnull
         FROM pg_attribute
         WHERE attrelid = $1::regclass AND attnum > 0 AND NOT attisdropped`,
        [tableSql]
      );
      const existing = new Map(rows.map((row) => [row.attname, row]));

      for (const definition of definitions) {
        // Table-level constraints are already included when creating a table.
        if (/^(UNIQUE|PRIMARY|FOREIGN|CHECK|CONSTRAINT)\b/i.test(definition)) continue;
        const match = definition.match(/^(\w+)\s+(SERIAL|INTEGER|VARCHAR\(\d+\)|NUMERIC\(\d+,\s*\d+\)|DATE|TIME)(?=\s|$)(.*)$/i);
        if (!match) throw new Error(`Unsupported column definition: ${definition}`);
        const [, column, declaredType, options] = match;
        const columnSql = quote(column);
        if (!existing.has(column)) {
          await client.query(`ALTER TABLE ${tableSql} ADD COLUMN ${definition}`);
          continue;
        }

        // Preserve existing SERIAL sequences and IDENTITY settings.
        if (declaredType.toUpperCase() === 'SERIAL') continue;
        const current = existing.get(column);
        const notNull = /\bNOT NULL\b|\bPRIMARY KEY\b/i.test(options);
        if (current.attnotnull && !notNull) {
          await client.query(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} DROP NOT NULL`);
        }
        const type = declaredType.toLowerCase()
          .replace(/^varchar/, 'character varying')
          .replace(/^time$/, 'time without time zone')
          .replace(/,\s+/g, ',');
        if (current.type !== type) {
          // PostgreSQL's explicit VARCHAR cast can silently truncate strings.
          // Refuse the change if an existing value exceeds the new length.
          const length = declaredType.match(/^VARCHAR\((\d+)\)$/i);
          if (length) {
            const { rows: tooLong } = await client.query(
              `SELECT 1 FROM ${tableSql} WHERE length(${columnSql}::text) > $1 LIMIT 1`,
              [Number(length[1])]
            );
            if (tooLong.length) {
              throw new Error(`${table}.${column} contains values longer than ${length[1]} characters; increase its length in TABLES.`);
            }
          }
          // Old text time/date columns can contain empty strings for missing values.
          const fromText = /^(character varying|character|text)\b/.test(current.type);
          const value = fromText && /^(TIME|DATE)$/i.test(declaredType)
            ? `NULLIF(trim(${columnSql}::text), '')`
            : columnSql;
          await client.query(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} DROP DEFAULT`);
          await client.query(
            `ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} TYPE ${declaredType}
             USING ${value}::${declaredType}`
          );
        }
        const defaultValue = options.match(/\bDEFAULT\s+('(?:[^']|'')*'|[-\d.]+)/i);
        if (defaultValue) {
          await client.query(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} SET DEFAULT ${defaultValue[1]}`);
        }
        if (notNull && !current.attnotnull) {
          await client.query(`ALTER TABLE ${tableSql} ALTER COLUMN ${columnSql} SET NOT NULL`);
        }
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { syncTables };
