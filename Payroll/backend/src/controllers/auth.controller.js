const { signToken, verifyPassword } = require('../lib/auth');
const { UserModel } = require('../models/user.model');

const AuthController = {
  /** POST /api/auth/login   body: { username, password } */
  async login(req, res) {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!username || !password) return res.status(400).json({ message: 'Username and password are required' });

    const user = await UserModel.findByUsername(username);
    const ok = user && user.usdactive === 'Y' && verifyPassword(password, user.usdpwd);
    if (!ok) return res.status(401).json({ message: 'Invalid username or password' });

    const name = user.usdnam || user.usdusd;
    const token = signToken({ sub: user.usdsno, usr: user.usdusd, name });
    res.json({ token, user: { id: user.usdsno, username: user.usdusd, name, role: user.usddes || '' } });
  },

  /** GET /api/auth/me */
  me(req, res) {
    res.json({ id: req.user.sub, username: req.user.usr, name: req.user.name });
  },
};
module.exports = { AuthController };
