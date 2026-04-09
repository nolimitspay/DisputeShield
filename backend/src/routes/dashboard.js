/**
 * Dashboard routes — KPIs and analytics
 */
const express = require('express');
const { auth } = require('./auth');
const analytics = require('../services/analytics.service');

const router = express.Router();

// GET /api/dashboard/stats — Main KPIs
router.get('/stats', auth, (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const stats = analytics.getStats(req.user.id, dateFrom, dateTo);
  res.json(stats);
});

// GET /api/dashboard/chart — Chart data
router.get('/chart', auth, (req, res) => {
  const { dateFrom, dateTo, groupBy } = req.query;
  const data = analytics.getChartData(req.user.id, dateFrom, dateTo, groupBy || 'day');
  res.json(data);
});

// GET /api/dashboard/activity — Recent activity log
router.get('/activity', auth, (req, res) => {
  const { limit } = req.query;
  const activity = analytics.getRecentActivity(req.user.id, parseInt(limit) || 20);
  res.json(activity);
});

module.exports = router;
