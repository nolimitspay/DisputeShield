const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { getPlanFeatures, VALID_PLANS } = require('../config/plans');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || (() => {
  const s = require('crypto').randomBytes(64).toString('hex');
  console.warn('WARNING: JWT_SECRET not set! Using random secret.');
  return s;
})();

// Middleware: Verify JWT
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.split(' ')[1], SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  const { email, password, name, company } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Name, email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const existing = db.getAll('users').find(u => u.email === email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const user = db.insert('users', {
    email,
    password: bcrypt.hashSync(password, 10),
    name,
    company: company || '',
    role: 'user',
    plan: 'starter',
    onboardingComplete: false,
    connectedProcessors: [],
    descriptors: [],
    notificationPrefs: { emailAlerts: true, autoRefundNotify: true, weeklyReport: true },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, plan: user.plan },
    SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, company: user.company, role: user.role, plan: user.plan, onboardingComplete: user.onboardingComplete },
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.getAll('users').find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, plan: user.plan || 'starter' },
    SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, company: user.company, role: user.role, plan: user.plan || 'starter', onboardingComplete: user.onboardingComplete },
  });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const user = db.getAll('users').find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safe } = user;
  res.json(safe);
});

// PUT /api/auth/profile
router.put('/profile', auth, (req, res) => {
  const { name, company, notificationPrefs } = req.body;
  const data = {};
  if (name) data.name = name;
  if (company !== undefined) data.company = company;
  if (notificationPrefs) data.notificationPrefs = notificationPrefs;

  const updated = db.update('users', req.user.id, data);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { password, ...safe } = updated;
  res.json(safe);
});

module.exports = { router, auth, adminOnly, SECRET };
