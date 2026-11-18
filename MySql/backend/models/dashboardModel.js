const { pool } = require('./database');
exports.customers = () => pool.query(`SELECT COUNT(*) total, COALESCE(SUM(cusactyn <> 'N'), 0) active,
  COALESCE(SUM(cuscreditlimit), 0) creditLimit, COALESCE(SUM(custelno <> '' OR cusemail <> ''), 0) contactable FROM cusmast`);
exports.users = () => pool.query("SELECT COUNT(*) total, COALESCE(SUM(usdactflg <> 'N'), 0) active, COALESCE(SUM(usdadmin = 'Y'), 0) admins FROM usdmast");
exports.categories = () => pool.query(`SELECT COALESCE(s.sysdes, 'Uncategorized') label, COUNT(*) value
  FROM cusmast c LEFT JOIN sysmast s ON c.cuscatsno = s.syssno AND s.sysrtp = 16
  GROUP BY COALESCE(s.sysdes, 'Uncategorized') ORDER BY value DESC`);
exports.months = () => pool.query(`SELECT DATE_FORMAT(cusentddt, '%Y-%m') month, COUNT(*) value
  FROM cusmast WHERE cusentddt >= DATE_SUB(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL 11 MONTH)
  AND cusentddt <= CURRENT_DATE() GROUP BY DATE_FORMAT(cusentddt, '%Y-%m') ORDER BY month`);
exports.recent = () => pool.query('SELECT cussno, cuscus, cusnam, custelno, cusactyn FROM cusmast ORDER BY cusentddt DESC, cussno DESC LIMIT 5');
