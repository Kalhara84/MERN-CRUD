const { pool } = require('../lib/db');

// employee + department name + location name
const SELECT_JOINED = `
  SELECT e.*, d.depdes AS department_name, l.locnam AS location_name
  FROM p_empmast e
  LEFT JOIN f_depmast d ON d.depsno = e.empdepsno
  LEFT JOIN s_locmast l ON l.locsno = e.emplocsno`;

const EmployeeModel = {
  /** list with search + paging */
  async list(search, page, limit) {
    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE (e.empnam ILIKE $1 OR CAST(e.empeno AS TEXT) LIKE $1 OR e.empidno ILIKE $1 OR e.empdesig ILIKE $1)`;
    }

    const count = await pool.query(`SELECT COUNT(*) FROM p_empmast e ${where}`, params);
    const total = Number(count.rows[0].count);

    const rows = await pool.query(
      `${SELECT_JOINED} ${where} ORDER BY e.empeno ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    );
    return { data: rows.rows, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  },

  async findById(id) {
    const r = await pool.query(`${SELECT_JOINED} WHERE e.empsno = $1`, [id]);
    return r.rows[0] ?? null;
  },

  async findByEmpNo(empeno) {
    const r = await pool.query('SELECT empsno FROM p_empmast WHERE empeno = $1', [empeno]);
    return r.rows[0] ?? null;
  },

  async findByMapCode(code) {
    const r = await pool.query('SELECT empsno FROM p_empmast WHERE empmapcode = $1', [code]);
    return r.rows[0] ?? null;
  },

  /** column names come from the validator whitelist, values are always parameters */
  async create(data) {
    const cols = Object.keys(data);
    const marks = cols.map((_, i) => `$${i + 1}`);
    const r = await pool.query(
      `INSERT INTO p_empmast (${cols.join(', ')}) VALUES (${marks.join(', ')}) RETURNING empsno`,
      Object.values(data),
    );
    return r.rows[0].empsno;
  },

  async update(id, data) {
    const cols = Object.keys(data);
    if (cols.length === 0) return;
    const sets = cols.map((c, i) => `${c} = $${i + 1}`);
    await pool.query(`UPDATE p_empmast SET ${sets.join(', ')} WHERE empsno = $${cols.length + 1}`, [
      ...Object.values(data),
      id,
    ]);
  },

  async remove(id) {
    await pool.query('DELETE FROM p_empmast WHERE empsno = $1', [id]);
  },
};
module.exports = { EmployeeModel };
