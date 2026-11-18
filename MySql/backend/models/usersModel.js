const { pool, insertRow, updateRow } = require('../db');

exports.codeExists = (values = []) => pool.execute(
    'SELECT 1 FROM usdmast WHERE lower(usdusd) = lower(?) AND usdcomsno = ? AND usdsno <> ?', 
    values
);

exports.find = (values = []) => pool.execute(
    'SELECT * FROM usdmast WHERE usdsno = ?', 
    values
);

exports.list = (values = []) => pool.execute(
    'SELECT * FROM usdmast ORDER BY usdsno', 
    values
);

exports.remove = (values = []) => pool.execute(
    'DELETE FROM usdmast WHERE usdsno = ?', 
    values
);

exports.create = values => insertRow(
    'usdmast', 
    values
);

exports.update = (id, values) => updateRow(
    'usdmast', 'usdsno',
    id, 
    values
    );

exports.findForLogin = code => pool.execute(
    "SELECT * FROM usdmast WHERE usdusd = ? AND usdactflg <> 'N' ORDER BY usdcomsno LIMIT 1", 
    [code]
);
