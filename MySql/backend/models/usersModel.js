const {
  pool,
  insertRow,
  updateRow
} = require('../db');
exports.codeExists = (values = []) => {
  return pool.execute('SELECT 1 FROM usdmast WHERE lower(usdusd) = lower(?) AND usdcomsno = ? AND usdsno <> ?', values);
};
exports.find = (values = []) => {
  return pool.execute('SELECT * FROM usdmast WHERE usdsno = ?', values);
};
exports.list = (values = []) => {
  return pool.execute('SELECT * FROM usdmast ORDER BY usdsno', values);
};
exports.remove = (values = []) => {
  return pool.execute('DELETE FROM usdmast WHERE usdsno = ?', values);
};
exports.create = values => {
  return insertRow('usdmast', values);
};
exports.update = (id, values) => {
  return updateRow('usdmast', 'usdsno', id, values);
};
exports.findForLogin = code => {
  return pool.execute("SELECT * FROM usdmast WHERE usdusd = ? AND usdactflg <> 'N' ORDER BY usdcomsno LIMIT 1", [code]);
};
