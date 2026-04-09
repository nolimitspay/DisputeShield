/**
 * Merchant routes — Onboarding, descriptors, processors
 */
const express = require('express');
const db = require('../db');
const { auth } = require('./auth');
const chargeblast = require('../services/chargeblast.service');
const rulesEngine = require('../services/rules-engine.service');

const router = express.Router();

// POST /api/merchants/connect-processor — Connect Stripe/Square
router.post('/connect-processor', auth, (req, res) => {
  const { type, apiKey, accountId } = req.body;
  if (!type) return res.status(400).json({ error: 'Processor type required' });

  const user = db.getById('users', req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const processors = user.connectedProcessors || [];
  const existing = processors.findIndex(p => p.type === type);

  if (existing >= 0) {
    processors[existing] = { type, apiKey: apiKey || '', accountId: accountId || '', connectedAt: new Date().toISOString() };
  } else {
    processors.push({ type, apiKey: apiKey || '', accountId: accountId || '', connectedAt: new Date().toISOString() });
  }

  db.update('users', req.user.id, { connectedProcessors: processors });
  res.json({ success: true, processors: processors.map(p => ({ type: p.type, accountId: p.accountId, connectedAt: p.connectedAt })) });
});

// GET /api/merchants/processors — List connected processors
router.get('/processors', auth, (req, res) => {
  const user = db.getById('users', req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const safe = (user.connectedProcessors || []).map(p => ({ type: p.type, accountId: p.accountId, connectedAt: p.connectedAt }));
  res.json(safe);
});

// POST /api/merchants/descriptors — Add a descriptor (MID)
router.post('/descriptors', auth, async (req, res) => {
  const { value, label } = req.body;
  if (!value) return res.status(400).json({ error: 'Descriptor value required' });

  // Check for duplicate
  const existing = db.query('descriptors', d => d.merchantId === req.user.id && d.value.toLowerCase() === value.toLowerCase());
  if (existing.length > 0) return res.status(409).json({ error: 'Descriptor already registered' });

  const descriptor = db.insert('descriptors', {
    merchantId: req.user.id,
    value,
    label: label || value,
    status: 'active',
    networks: { rdr: false, ethoca: false, cdrn: false },
  });

  res.status(201).json(descriptor);
});

// GET /api/merchants/descriptors — List descriptors
router.get('/descriptors', auth, (req, res) => {
  const descriptors = db.query('descriptors', d => d.merchantId === req.user.id);
  res.json(descriptors);
});

// DELETE /api/merchants/descriptors/:id — Remove descriptor
router.delete('/descriptors/:id', auth, (req, res) => {
  const descriptor = db.getById('descriptors', req.params.id);
  if (!descriptor || descriptor.merchantId !== req.user.id) return res.status(404).json({ error: 'Descriptor not found' });

  db.delete('descriptors', req.params.id);
  res.json({ success: true });
});

// POST /api/merchants/complete-onboarding — Mark onboarding as done
router.post('/complete-onboarding', auth, (req, res) => {
  db.update('users', req.user.id, { onboardingComplete: true });

  // Create default rules
  const existingRules = db.query('rules', r => r.merchantId === req.user.id);
  if (existingRules.length === 0) {
    rulesEngine.createDefaultRules(req.user.id);
  }

  res.json({ success: true });
});

// GET /api/merchants/onboarding-status — Check onboarding progress
router.get('/onboarding-status', auth, (req, res) => {
  const user = db.getById('users', req.user.id);
  const descriptors = db.query('descriptors', d => d.merchantId === req.user.id);
  const rules = db.query('rules', r => r.merchantId === req.user.id);

  const steps = {
    account: true, // Already signed up
    processor: (user.connectedProcessors || []).length > 0,
    descriptors: descriptors.length > 0,
    rules: rules.length > 0,
    activated: user.onboardingComplete || false,
  };

  const completed = Object.values(steps).filter(Boolean).length;
  const total = Object.keys(steps).length;

  res.json({ steps, completed, total, percentage: Math.round((completed / total) * 100) });
});

module.exports = router;
