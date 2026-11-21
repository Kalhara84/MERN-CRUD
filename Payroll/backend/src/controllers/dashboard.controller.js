const { DashboardModel } = require('../models/dashboard.model');

const DashboardController = {
  /** GET /api/dashboard */
  async summary(_req, res) {
    res.json(await DashboardModel.summary());
  },
};
module.exports = { DashboardController };
