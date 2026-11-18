const { pool, insertRow, updateRow } = require('../db');
const CATEGORY_TYPE = 16;
const CREDIT_TERMS_TYPE = 410;

exports.categories = (values = []) => pool.execute('SELECT syssno, sysdes FROM sysmast WHERE sysrtp = ? ORDER BY sysrno', values);

exports.creditTerms = (values = []) => pool.execute('SELECT syssno, sysdes FROM sysmast WHERE sysrtp = ? ORDER BY sysrno', values);

exports.representatives = (values = []) => pool.execute('SELECT repsno, reprep, repnam FROM repmast ORDER BY repnam', values);

exports.nextCode = (values = []) => pool.execute("SELECT COALESCE(MAX(CAST(cuscus AS UNSIGNED)), 0) + 1 AS next FROM cusmast WHERE cuscus REGEXP '^[0-9]{1,15}$'", values);

exports.list = (values = []) => pool.execute(`
    SELECT c.*,
           s.sysdes AS cat_name,
           t.sysdes AS credit_name,
           r.repnam AS rep_name
    FROM cusmast c
    LEFT JOIN sysmast s ON s.syssno = c.cuscatsno        AND s.sysrtp = ${CATEGORY_TYPE}
    LEFT JOIN sysmast t ON t.syssno = c.cuscredittmssno  AND t.sysrtp = ${CREDIT_TERMS_TYPE}
    LEFT JOIN repmast r ON r.repsno = c.cusrepsno
    ORDER BY c.cuscus`, values);

exports.find = (values = []) => pool.execute('SELECT * FROM cusmast WHERE cussno = ?', values);

exports.codeExists = (values = []) => pool.execute('SELECT 1 FROM cusmast WHERE lower(cuscus) = lower(?)', values);

exports.remove = (values = []) => pool.execute('DELETE FROM cusmast WHERE cussno = ?', values);

exports.create = values => insertRow('cusmast', values);

exports.update = (id, values) => updateRow('cusmast', 'cussno', id, values);
