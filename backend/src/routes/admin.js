/**
 * Admin routes — Client management (admin only)
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { auth, adminOnly } = require('./auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, adminOnly);

// GET /api/admin/clients — List all merchant clients
router.get('/clients', (req, res) => {
  const users = db.getAll('users').filter(u => u.role !== 'admin');

  const clients = users.map(u => {
    const alerts = db.query('alerts', a => a.merchantId === u.id);
    const rules = db.query('rules', r => r.merchantId === u.id);
    const descriptors = db.query('descriptors', d => d.merchantId === u.id);

    const prevented = alerts.filter(a => ['auto_refunded', 'manual_refunded'].includes(a.status)).length;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      company: u.company || '',
      plan: u.plan || 'starter',
      onboardingComplete: u.onboardingComplete || false,
      alertsCount: alerts.length,
      preventedCount: prevented,
      rulesCount: rules.length,
      descriptorsCount: descriptors.length,
      moneySaved: alerts
        .filter(a => ['auto_refunded', 'manual_refunded'].includes(a.status))
        .reduce((sum, a) => sum + (a.amount || 0), 0),
      createdAt: u.createdAt,
    };
  });

  clients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(clients);
});

// POST /api/admin/clients — Create new merchant
router.post('/clients', (req, res) => {
  const { name, email, password, company, plan } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.getAll('users').find(u => u.email === email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const user = db.insert('users', {
    email,
    password: bcrypt.hashSync(password, 10),
    name,
    company: company || '',
    role: 'user',
    plan: plan || 'starter',
    onboardingComplete: false,
    connectedProcessors: [],
    descriptors: [],
    notificationPrefs: { emailAlerts: true, autoRefundNotify: true, weeklyReport: true },
  });

  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company,
    plan: user.plan,
    createdAt: user.createdAt,
  });
});

// GET /api/admin/clients/:id — Single client details
router.get('/clients/:id', (req, res) => {
  const user = db.getById('users', req.params.id);
  if (!user || user.role === 'admin') return res.status(404).json({ error: 'Client not found' });

  const alerts = db.query('alerts', a => a.merchantId === user.id);
  const rules = db.query('rules', r => r.merchantId === user.id);
  const descriptors = db.query('descriptors', d => d.merchantId === user.id);
  const activity = db.query('activityLog', a => a.merchantId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);

  const prevented = alerts.filter(a => ['auto_refunded', 'manual_refunded'].includes(a.status));

  const { password, ...safe } = user;
  res.json({
    ...safe,
    stats: {
      totalAlerts: alerts.length,
      prevented: prevented.length,
      pending: alerts.filter(a => a.status === 'pending').length,
      ignored: alerts.filter(a => a.status === 'ignored').length,
      expired: alerts.filter(a => a.status === 'expired').length,
      preventionRate: alerts.length > 0 ? ((prevented.length / alerts.length) * 100) : 0,
      moneySaved: prevented.reduce((sum, a) => sum + (a.amount || 0), 0),
      rulesCount: rules.length,
      descriptorsCount: descriptors.length,
    },
    recentActivity: activity,
  });
});

// PUT /api/admin/clients/:id — Update client
router.put('/clients/:id', (req, res) => {
  const user = db.getById('users', req.params.id);
  if (!user || user.role === 'admin') return res.status(404).json({ error: 'Client not found' });

  const { name, company, plan, email } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (company !== undefined) data.company = company;
  if (plan !== undefined) data.plan = plan;
  if (email !== undefined) data.email = email;

  const updated = db.update('users', req.params.id, data);
  const { password, ...safe } = updated;
  res.json(safe);
});

// DELETE /api/admin/clients/:id — Delete client and all their data
router.delete('/clients/:id', (req, res) => {
  const user = db.getById('users', req.params.id);
  if (!user || user.role === 'admin') return res.status(404).json({ error: 'Client not found' });

  // Delete all client data
  db.query('alerts', a => a.merchantId === user.id).forEach(a => db.delete('alerts', a.id));
  db.query('rules', r => r.merchantId === user.id).forEach(r => db.delete('rules', r.id));
  db.query('descriptors', d => d.merchantId === user.id).forEach(d => db.delete('descriptors', d.id));
  db.query('activityLog', a => a.merchantId === user.id).forEach(a => db.delete('activityLog', a.id));

  // Delete the user
  db.delete('users', user.id);

  res.json({ success: true });
});

module.exports = router;
