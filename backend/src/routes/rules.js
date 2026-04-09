/**
 * Rules routes — CRUD for auto-refund/review rules
 */
const express = require('express');
const db = require('../db');
const { auth } = require('./auth');

const router = express.Router();

// GET /api/rules — List rules sorted by priority
router.get('/', auth, (req, res) => {
  const rules = db.query('rules', r => r.merchantId === req.user.id)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
  res.json(rules);
});

// POST /api/rules — Create rule
router.post('/', auth, (req, res) => {
  const { name, action, conditions, priority, enabled } = req.body;
  if (!name || !action) return res.status(400).json({ error: 'Name and action required' });
  if (!['auto_refund', 'flag_review', 'ignore'].includes(action)) {
    return res.status(400).json({ error: 'Action must be auto_refund, flag_review, or ignore' });
  }

  const existingRules = db.query('rules', r => r.merchantId === req.user.id);

  const rule = db.insert('rules', {
    merchantId: req.user.id,
    name,
    action,
    enabled: enabled !== false,
    priority: priority || existingRules.length + 1,
    conditions: conditions || {},
    stats: { timesMatched: 0, totalRefunded: 0 },
  });

  res.status(201).json(rule);
});

// PUT /api/rules/:id — Update rule
router.put('/:id', auth, (req, res) => {
  const rule = db.getById('rules', req.params.id);
  if (!rule || rule.merchantId !== req.user.id) return res.status(404).json({ error: 'Rule not found' });

  const { name, action, conditions, priority, enabled } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (action !== undefined) data.action = action;
  if (conditions !== undefined) data.conditions = conditions;
  if (priority !== undefined) data.priority = priority;
  if (enabled !== undefined) data.enabled = enabled;

  const updated = db.update('rules', req.params.id, data);
  res.json(updated);
});

// DELETE /api/rules/:id — Delete rule
router.delete('/:id', auth, (req, res) => {
  const rule = db.getById('rules', req.params.id);
  if (!rule || rule.merchantId !== req.user.id) return res.status(404).json({ error: 'Rule not found' });

  db.delete('rules', req.params.id);
  res.json({ success: true });
});

// PUT /api/rules/reorder — Reorder priorities
router.put('/reorder', auth, (req, res) => {
  const { order } = req.body; // Array of { id, priority }
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Order array required' });

  order.forEach(({ id, priority }) => {
    const rule = db.getById('rules', id);
    if (rule && rule.merchantId === req.user.id) {
      db.update('rules', id, { priority });
    }
  });

  const rules = db.query('rules', r => r.merchantId === req.user.id)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
  res.json(rules);
});

module.exports = router;
