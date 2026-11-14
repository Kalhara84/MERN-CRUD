const { Usdmast } = require('../models');

// GET /api/dashboard   (the user count cards are for admin users only)
exports.stats = async (req, res) => {
  if (!req.usd.isAdmin()) return res.json({ stats: null });

  const users = await Usdmast.findAll({ attributes: ['usdsno', 'usdactflg', 'usdadmin'], raw: true });

  res.json({
    stats: {
      total: users.length,
      // Active = not blocked, Admins = usdadmin 'Y'
      active: users.filter((u) => (u.usdactflg || '').toUpperCase() !== 'N').length,
      admins: users.filter((u) => (u.usdadmin || '').toUpperCase() === 'Y').length,
    },
  });
};
