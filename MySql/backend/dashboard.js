// Dashboard totals come directly from the customers and users tables.
const router = require('express').Router();
const { pool } = require('./db');

router.get('/', async (req, res) => {
  const [customers] = await pool.execute(`SELECT COUNT(*) total, COALESCE(SUM(cusactyn <> 'N'), 0) active,
  COALESCE(SUM(cuscreditlimit), 0) creditLimit, COALESCE(SUM(custelno <> '' OR cusemail <> ''), 0) contactable FROM cusmast`);
  const [categories] = await pool.execute(`SELECT COALESCE(s.sysdes, 'Uncategorized') label, COUNT(*) value
  FROM cusmast c LEFT JOIN sysmast s ON c.cuscatsno = s.syssno AND s.sysrtp = 16
  GROUP BY COALESCE(s.sysdes, 'Uncategorized') ORDER BY value DESC`);
  const [months] = await pool.execute(`SELECT DATE_FORMAT(cusentddt, '%Y-%m') month, COUNT(*) value
  FROM cusmast WHERE cusentddt >= DATE_SUB(DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01'), INTERVAL 11 MONTH)
  AND cusentddt <= CURRENT_DATE() GROUP BY DATE_FORMAT(cusentddt, '%Y-%m') ORDER BY month`);
  const [recent] = await pool.execute('SELECT cussno, cuscus, cusnam, custelno, cusactyn FROM cusmast ORDER BY cusentddt DESC, cussno DESC LIMIT 5');
  let users = null;
  if (req.user.is_admin) {
    const [rows] = await pool.execute("SELECT COUNT(*) total, COALESCE(SUM(usdactflg <> 'N'), 0) active, COALESCE(SUM(usdadmin = 'Y'), 0) admins FROM usdmast");
    users = rows[0];
  }
  res.json({ customers: customers[0], users, categories, months, recent });
});
module.exports = router;
