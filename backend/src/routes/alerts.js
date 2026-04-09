/**
 * Alerts routes — List, view, and manage alerts
 */
const express = require('express');
const db = require('../db');
const { auth } = require('./auth');
const refundService = require('../services/refund.service');
const chargeblast = require('../services/chargeblast.service');
const emailService = require('../services/email.service');

const router = express.Router();

// GET /api/alerts — List alerts with filters and pagination
router.get('/', auth, (req, res) => {
  const { status, source, dateFrom, dateTo, search, page = 1, limit = 25 } = req.query;

  let alerts = db.query('alerts', a => a.merchantId === req.user.id);

  // Apply filters
  if (status) alerts = alerts.filter(a => a.status === status);
  if (source) alerts = alerts.filter(a => a.source === source.toUpperCase());
  if (dateFrom) alerts = alerts.filter(a => new Date(a.createdAt) >= new Date(dateFrom));
  if (dateTo) alerts = alerts.filter(a => new Date(a.createdAt) <= new Date(dateTo));
  if (search) {
    const s = search.toLowerCase();
    alerts = alerts.filter(a =>
      (a.descriptor || '').toLowerCase().includes(s) ||
      (a.externalAlertId || '').toLowerCase().includes(s) ||
      (a.reasonDescription || '').toLowerCase().includes(s)
    );
  }

  // Sort by date descending
  alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Paginate
  const total = alerts.length;
  const p = parseInt(page);
  const l = parseInt(limit);
  const paginated = alerts.slice((p - 1) * l, p * l);

  res.json({
    alerts: paginated,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
});

// GET /api/alerts/:id — Alert detail
router.get('/:id', auth, (req, res) => {
  const alert = db.getById('alerts', req.params.id);
  if (!alert || alert.merchantId !== req.user.id) return res.status(404).json({ error: 'Alert not found' });

  // Get matched rule info
  let rule = null;
  if (alert.matchedRuleId) rule = db.getById('rules', alert.matchedRuleId);

  // Get activity for this alert
  const activity = db.query('activityLog', a => a.alertId === alert.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ alert, rule, activity });
});

// POST /api/alerts/:id/refund — Manual refund
router.post('/:id/refund', auth, async (req, res) => {
  const alert = db.getById('alerts', req.params.id);
  if (!alert || alert.merchantId !== req.user.id) return res.status(404).json({ error: 'Alert not found' });
  if (alert.status !== 'pending') return res.status(400).json({ error: 'Alert is not pending' });

  const merchant = db.getById('users', req.user.id);
  const refundResult = await refundService.executeRefund(merchant, alert);

  db.update('alerts', alert.id, {
    status: 'manual_refunded',
    refundDetails: {
      refundId: refundResult.refundId || null,
      processor: refundResult.processor || 'manual',
      refundedAt: new Date().toISOString(),
      amount: alert.amount,
    },
    resolvedAt: new Date().toISOString(),
  });

  db.insert('activityLog', {
    merchantId: req.user.id,
    alertId: alert.id,
    action: 'manual_refund',
    details: `Manual refund: $${alert.amount}`,
  });

  // Notify Chargeblast
  try {
    if (alert.externalAlertId) {
      await chargeblast.resolveAlert(alert.externalAlertId, { action: 'refund' });
    }
  } catch (e) {
    console.error('Failed to notify Chargeblast:', e.message);
  }

  res.json({ success: true, alert: db.getById('alerts', alert.id) });
});

// POST /api/alerts/:id/ignore — Ignore alert
router.post('/:id/ignore', auth, (req, res) => {
  const alert = db.getById('alerts', req.params.id);
  if (!alert || alert.merchantId !== req.user.id) return res.status(404).json({ error: 'Alert not found' });
  if (alert.status !== 'pending') return res.status(400).json({ error: 'Alert is not pending' });

  db.update('alerts', alert.id, { status: 'ignored', resolvedAt: new Date().toISOString() });

  db.insert('activityLog', {
    merchantId: req.user.id,
    alertId: alert.id,
    action: 'ignored',
    details: 'Alert manually ignored',
  });

  res.json({ success: true });
});

module.exports = router;
