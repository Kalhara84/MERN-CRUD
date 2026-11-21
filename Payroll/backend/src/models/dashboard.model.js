const { pool } = require('../lib/db');

const DashboardModel = {
  async summary() {
    const [totals, category, gender, department, location, payrollDept, joins, recent] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE empactflg = 'Y')::int AS active,
               COUNT(*) FILTER (WHERE empactflg <> 'Y')::int AS inactive,
               COALESCE(SUM(empsal) FILTER (WHERE empactflg = 'Y'), 0) AS payroll,
               COALESCE(AVG(empsal) FILTER (WHERE empactflg = 'Y'), 0) AS avg_salary,
               COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM empjoin) = EXTRACT(YEAR FROM CURRENT_DATE))::int AS joined_this_year
        FROM p_empmast`),
      pool.query(`SELECT empcat AS label, COUNT(*)::int AS value FROM p_empmast
                  WHERE empactflg = 'Y' GROUP BY empcat ORDER BY empcat`),
      pool.query(`SELECT empmof AS label, COUNT(*)::int AS value FROM p_empmast
                  WHERE empactflg = 'Y' GROUP BY empmof ORDER BY empmof`),
      pool.query(`SELECT COALESCE(d.depdes, 'Unassigned') AS label, COUNT(*)::int AS value
                  FROM p_empmast e LEFT JOIN f_depmast d ON d.depsno = e.empdepsno
                  WHERE e.empactflg = 'Y' GROUP BY 1 ORDER BY 2 DESC, 1`),
      pool.query(`SELECT COALESCE(l.locnam, 'Unassigned') AS label, COUNT(*)::int AS value
                  FROM p_empmast e LEFT JOIN s_locmast l ON l.locsno = e.emplocsno
                  WHERE e.empactflg = 'Y' GROUP BY 1 ORDER BY 2 DESC, 1`),
      pool.query(`SELECT COALESCE(d.depdes, 'Unassigned') AS label, COALESCE(SUM(e.empsal), 0) AS value
                  FROM p_empmast e LEFT JOIN f_depmast d ON d.depsno = e.empdepsno
                  WHERE e.empactflg = 'Y' GROUP BY 1 ORDER BY 2 DESC, 1`),
      pool.query(`SELECT EXTRACT(YEAR FROM empjoin)::int AS label, COUNT(*)::int AS value
                  FROM p_empmast WHERE empjoin IS NOT NULL GROUP BY 1 ORDER BY 1`),
      pool.query(`SELECT e.empsno, e.empeno, e.empnam, e.empdesig, d.depdes AS department_name, e.empjoin
                  FROM p_empmast e LEFT JOIN f_depmast d ON d.depsno = e.empdepsno
                  ORDER BY e.empsno DESC LIMIT 6`),
    ]);

    const t = totals.rows[0];
    return {
      totals: {
        total: t.total,
        active: t.active,
        inactive: t.inactive,
        payroll: Number(t.payroll),
        avgSalary: Number(t.avg_salary),
        joinedThisYear: t.joined_this_year,
      },
      byCategory: category.rows,
      byGender: gender.rows,
      byDepartment: department.rows,
      byLocation: location.rows,
      payrollByDepartment: payrollDept.rows.map((r) => ({ label: r.label, value: Number(r.value) })),
      joinsByYear: joins.rows,
      recent: recent.rows,
    };
  },
};
module.exports = { DashboardModel };
