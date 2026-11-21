/**
 * Describes every employee field once: name, type, max length.
 * Only these fields are ever read from the request (unknown fields are ignored).
 */

const SPEC = [
  ['empeno', 'int'],
  ['empinital', 'str', 20],
  ['empnam', 'str', 80],
  ['empcat', 'cat'],
  ['empactflg', 'yn'],
  ['empsts', 'str', 1],
  ['empmapcode', 'intn'],

  ['emplocsno', 'intn'],
  ['empdepsno', 'intn'],
  ['empsecsno', 'intn'],
  ['emparesno', 'intn'],
  ['empcossno', 'intn'],
  ['empbasisno', 'intn'],

  ['empsal', 'float'],
  ['empscgpcn', 'float'],
  ['empepfyn', 'yn'],
  ['empepfno', 'int'],
  ['emppayeyn', 'yn'],
  ['emptno', 'int'],
  ['empprl', 'float'],
  ['emptax', 'float'],
  ['empgin', 'float'],
  ['emptin', 'str', 18],
  ['empcob', 'float'],

  ['empmof', 'mf'],
  ['empidno', 'str', 20],
  ['emppasportno', 'str', 15],
  ['empdob', 'date'],
  ['empmrdtst', 'str', 1],
  ['empdesig', 'str', 60],
  ['empjoin', 'date'],
  ['empleft', 'date'],

  ['empbnkacno', 'str', 30],
  ['empbnkcode', 'str', 20],
  ['empbnkbranch', 'str', 20],
  ['empbnkid', 'str', 20],

  ['empad1', 'str', 40],
  ['empad2', 'str', 40],
  ['empad3', 'str', 40],
  ['empad4', 'str', 40],
  ['empemail', 'str', 40],
  ['emptel', 'str', 25],

  ['empanual', 'str', 4],
  ['empcasal', 'str', 4],
  ['empleuleu', 'str', 4],

  ['empotflg', 'yn'],
  ['empnopflg', 'yn'],
  ['empattincflg', 'yn'],
  ['emplateflg', 'yn'],
  ['empnsatlflg', 'yn'],
];


const isBlank = (v) => v === undefined || v === null || v === '';

function validateEmployee(body, partial) {
  const errors = [];
  const data = {};

  if (!partial) {
    if (isBlank(body.empeno)) errors.push('empeno is required');
    if (isBlank(body.empnam) || !String(body.empnam).trim()) errors.push('empnam is required');
  }

  for (const [name, kind, max] of SPEC) {
    if (!(name in body)) continue; // not sent -> leave as is (update) / DB default (create)
    const v = body[name];

    switch (kind) {
      case 'int':
      case 'intn': {
        if (isBlank(v)) {
          if (kind === 'intn') data[name] = null;
          else errors.push(`${name} must be an integer number`);
          break;
        }
        const n = Number(v);
        if (!Number.isInteger(n)) errors.push(`${name} must be an integer number`);
        else data[name] = n;
        break;
      }
      case 'float': {
        if (isBlank(v)) { data[name] = 0; break; }
        const n = Number(v);
        if (Number.isNaN(n)) errors.push(`${name} must be a number`);
        else data[name] = n;
        break;
      }
      case 'date': {
        if (isBlank(v)) { data[name] = null; break; }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) errors.push(`${name} must be a date (YYYY-MM-DD)`);
        else data[name] = String(v);
        break;
      }
      case 'yn':
        if (v !== 'Y' && v !== 'N') errors.push(`${name} must be Y or N`);
        else data[name] = v;
        break;
      case 'cat':
        if (v !== 'W' && v !== 'E' && v !== 'S') errors.push(`${name} must be W, E or S`);
        else data[name] = v;
        break;
      case 'mf':
        if (v !== 'M' && v !== 'F') errors.push(`${name} must be M or F`);
        else data[name] = v;
        break;
      case 'str': {
        const s = isBlank(v) ? '' : String(v).trim();
        if (max && s.length > max) errors.push(`${name} must be at most ${max} characters`);
        else if (name === 'empnam' && !s) errors.push('empnam should not be empty');
        else if (name === 'empemail' && s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) errors.push('empemail must be an email');
        else data[name] = s;
        break;
      }
    }
  }

  return { errors: Array.from(new Set(errors)), data };
}

module.exports = { validateEmployee };
