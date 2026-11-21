const { pool } = require('../lib/db');

const UserModel = {
  async findByUsername(username) {
    const r = await pool.query(
      `SELECT usdsno, usdusd, usdpwd, usdnam, usddes, usdactive FROM usdmast WHERE usdusd = $1`,
      [username],
    );
    return r.rows[0] ?? null;
  },
};
module.exports = { UserModel };
