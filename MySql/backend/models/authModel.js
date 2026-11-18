const { pool } = require('./database');
exports.findByCode = code => pool.query("SELECT * FROM usdmast WHERE usdusd = ? AND usdactflg <> 'N' ORDER BY usdcomsno LIMIT 1", [code]);
exports.findById = id => pool.query('SELECT * FROM usdmast WHERE usdsno = ?', [id]);
