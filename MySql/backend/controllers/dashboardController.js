const model = require('../models/dashboardModel');
exports.summary = async (req, res) => {
  const [customers, categories, months, recent] = await Promise.all([model.customers(), model.categories(), model.months(), model.recent()]);
  const users = req.user.is_admin ? (await model.users()).rows[0] : null;
  res.json({ customers: customers.rows[0], users, categories: categories.rows, months: months.rows, recent: recent.rows });
};
