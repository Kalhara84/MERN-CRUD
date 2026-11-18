// SQL for users; ? placeholders keep user input separate from SQL.
const { pool } = require('./database');
exports.codeExists = (params = []) => pool.query('SELECT 1 FROM usdmast WHERE lower(usdusd) = lower(?) AND usdcomsno = ? AND usdsno <> ?', params);

exports.find = (params = []) => pool.query('SELECT * FROM usdmast WHERE usdsno = ?', params);

exports.list = (params = []) => pool.query('SELECT * FROM usdmast ORDER BY usdsno', params);

exports.remove = (params = []) => pool.query('DELETE FROM usdmast WHERE usdsno = ?', params);
