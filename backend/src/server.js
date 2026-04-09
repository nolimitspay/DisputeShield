/**
 * NoLimitsDisputes — Main server
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4001;

// Security
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://nolimitsdisputes.netlify.app',
    'http://localhost:3001',
  ],
  credentials: true,
}));

// Parse JSON (except for webhook route which needs raw body)
app.use((req, res, next) => {
  if (req.path === '/api/webhooks/chargeblast') return next();
  express.json({ limit: '10mb' })(req, res, next);
});

// Routes
const { router: authRouter } = require('./routes/auth');
const alertsRouter = require('./routes/alerts');
const rulesRouter = require('./routes/rules');
const dashboardRouter = require('./routes/dashboard');
const merchantsRouter = require('./routes/merchants');
const webhooksRouter = require('./routes/webhooks');

app.use('/api/auth', authRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/merchants', merchantsRouter);
app.use('/api/webhooks', webhooksRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Cron: Check for expired alerts (every hour)
cron.schedule('0 * * * *', () => {
  const now = new Date();
  const pending = db.query('alerts', a => a.status === 'pending' && a.deadline);
  let expired = 0;
  pending.forEach(alert => {
    if (new Date(alert.deadline) < now) {
      db.update('alerts', alert.id, { status: 'expired', resolvedAt: now.toISOString() });
      db.insert('activityLog', {
        merchantId: alert.merchantId,
        alertId: alert.id,
        action: 'expired',
        details: `Alert expired (deadline passed): $${alert.amount}`,
      });
      expired++;
    }
  });
  if (expired > 0) console.log(`[CRON] ${expired} alerts expired`);
});

// Cron: Keep-alive ping (Render.com free tier)
cron.schedule('*/14 * * * *', () => {
  fetch(`http://localhost:${PORT}/health`).catch(() => {});
});

// Init DB and start
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`NoLimitsDisputes backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize:', err);
  process.exit(1);
});
