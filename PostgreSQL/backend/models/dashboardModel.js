const {
  pool
} = require('../db');

exports.customers = (values = []) => {
  return pool.execute(
    `SELECT COUNT(*) AS total,
    COUNT(*) FILTER (WHERE cusactyn <> 'N') AS active,
    COALESCE(SUM(cuscreditlimit), 0) AS "creditLimit",
    COUNT(*) FILTER (WHERE custelno <> '' OR cusemail <> '') AS contactable
    FROM cusmast`, 
    values
  );
};

exports.categories = (values = []) => {
  return pool.execute(
    `SELECT COALESCE(s.sysdes, 'Uncategorized') AS label, COUNT(*) AS value
    FROM cusmast c LEFT JOIN sysmast s ON c.cuscatsno = s.syssno AND s.sysrtp = 16
    GROUP BY COALESCE(s.sysdes, 'Uncategorized') ORDER BY value DESC`, 
    values
  );
};

exports.months = (values = []) => {
  return pool.execute(
    `SELECT TO_CHAR(cusentddt, 'YYYY-MM') AS month, COUNT(*) AS value
    FROM cusmast WHERE cusentddt >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
    AND cusentddt <= CURRENT_DATE GROUP BY TO_CHAR(cusentddt, 'YYYY-MM') ORDER BY month`, 
    values
);
};

exports.recent = (values = []) => {
  return pool.execute(
    'SELECT cussno, cuscus, cusnam, custelno, cusactyn FROM cusmast ORDER BY cusentddt DESC NULLS LAST, cussno DESC LIMIT 5', 
    values
  );
};

exports.users = (values = []) => {
  return pool.execute(
    "SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE usdactflg <> 'N') AS active, COUNT(*) FILTER (WHERE usdadmin = 'Y') AS admins FROM usdmast", 
    values
  );
};
