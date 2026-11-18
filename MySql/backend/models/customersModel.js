// SQL for customers; ? placeholders keep user input separate from SQL.
const { pool } = require('./database');
const CATEGORY_TYPE = 16;
const CREDIT_TERMS_TYPE = 410;
exports.categories = (params = []) => pool.query('SELECT syssno, sysdes FROM sysmast WHERE sysrtp = ? ORDER BY sysrno', params);

exports.creditTerms = (params = []) => pool.query('SELECT syssno, sysdes FROM sysmast WHERE sysrtp = ? ORDER BY sysrno', params);

exports.representatives = (params = []) => pool.query('SELECT repsno, reprep, repnam FROM repmast ORDER BY repnam', params);

exports.nextCode = (params = []) => pool.query("SELECT COALESCE(MAX(CAST(cuscus AS UNSIGNED)), 0) + 1 AS next FROM cusmast WHERE cuscus REGEXP '^[0-9]{1,15}$'", params);

exports.list = (params = []) => pool.query(`
    SELECT c.*,
           s.sysdes AS cat_name,
           t.sysdes AS credit_name,
           r.repnam AS rep_name
    FROM cusmast c
    LEFT JOIN sysmast s ON s.syssno = c.cuscatsno        AND s.sysrtp = ${CATEGORY_TYPE}
    LEFT JOIN sysmast t ON t.syssno = c.cuscredittmssno  AND t.sysrtp = ${CREDIT_TERMS_TYPE}
    LEFT JOIN repmast r ON r.repsno = c.cusrepsno
    ORDER BY c.cuscus`, params);

exports.find = (params = []) => pool.query('SELECT * FROM cusmast WHERE cussno = ?', params);

exports.codeExists = (params = []) => pool.query('SELECT 1 FROM cusmast WHERE lower(cuscus) = lower(?)', params);

exports.remove = (params = []) => pool.query('DELETE FROM cusmast WHERE cussno = ?', params);