// Dashboard totals come directly from the customers and users tables.
const model = require('../models/dashboardModel');
async function summary(req, res) {
  const [customers] = await model.customers();
  const [categories] = await model.categories();
  const [months] = await model.months();
  const [recent] = await model.recent();
  let users = null;
  if (req.user.is_admin) {
    const [rows] = await model.users();
    users = rows[0];
  }
  res.json({
    customers: customers[0],
    users,
    categories,
    months,
    recent
  });
}
module.exports = {
  summary
};
