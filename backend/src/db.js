/**
 * DisputeShield — db.js with MongoDB Atlas + in-memory fallback
 */
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

let _client = null;
let _db = null;
let _mem = {};
const useMongo = !!process.env.MONGODB_URI;

async function connect() {
  if (_client) return;
  try {
    _client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    await _client.connect();
    _db = _client.db('disputeshield');
    console.log('MongoDB Atlas connected');
  } catch (e) {
    console.error('MongoDB failed:', e.message);
    _client = null;
    _db = null;
  }
}

async function loadAll() {
  if (!_db) return;
  const cols = ['users', 'alerts', 'rules', 'activityLog', 'descriptors', 'notifications'];
  for (const c of cols) {
    const docs = await _db.collection(c).find({}).toArray();
    _mem[c] = docs.map(({ _id, ...rest }) => rest);
  }
  console.log('MongoDB loaded:', Object.entries(_mem).map(([k, v]) => k + ':' + v.length).join(' | '));
}

function ensureAdmin() {
  if (!_mem.users) _mem.users = [];
  const email = process.env.ADMIN_EMAIL || 'admin@disputeshield.com';
  const pass = process.env.ADMIN_PASSWORD || require('crypto').randomBytes(32).toString('hex');
  if (!_mem.users.find(u => u.email === email)) {
    const user = {
      id: uuidv4(),
      email,
      password: bcrypt.hashSync(pass, 10),
      role: 'admin',
      name: 'Admin',
      company: 'DisputeShield',
      plan: 'enterprise',
      onboardingComplete: true,
      connectedProcessors: [],
      notificationPrefs: { emailAlerts: true, autoRefundNotify: true, weeklyReport: true },
      createdAt: new Date().toISOString(),
    };
    _mem.users.push(user);
    if (_db) _db.collection('users').insertOne({ ...user }).catch(() => {});
  }
}

async function init() {
  if (useMongo) {
    await connect();
    await loadAll();
  }
  // Ensure collections exist in memory
  ['users', 'alerts', 'rules', 'activityLog', 'descriptors', 'notifications'].forEach(c => {
    if (!_mem[c]) _mem[c] = [];
  });
  ensureAdmin();
  console.log('[DB] Ready — users:', _mem.users.length, '| alerts:', _mem.alerts.length, '| rules:', _mem.rules.length);
}

function getAll(col) { return _mem[col] || []; }
function getById(col, id) { return (getAll(col)).find(i => i.id === id) || null; }

function insert(col, data) {
  const item = { id: uuidv4(), createdAt: new Date().toISOString(), ...data };
  if (!_mem[col]) _mem[col] = [];
  _mem[col].push(item);
  if (useMongo && _db) _db.collection(col).insertOne({ ...item }).catch(e => console.error('insert err:', e.message));
  return item;
}

function update(col, id, data) {
  if (!_mem[col]) _mem[col] = [];
  const idx = _mem[col].findIndex(i => i.id === id);
  if (idx === -1) return null;
  const updated = { ..._mem[col][idx], ...data, updatedAt: new Date().toISOString() };
  _mem[col][idx] = updated;
  if (useMongo && _db) _db.collection(col).updateOne({ id }, { $set: { ...data, updatedAt: updated.updatedAt } }).catch(e => console.error('update err:', e.message));
  return updated;
}

function del(col, id) {
  if (!_mem[col]) return;
  _mem[col] = _mem[col].filter(i => i.id !== id);
  if (useMongo && _db) _db.collection(col).deleteOne({ id }).catch(e => console.error('delete err:', e.message));
}

function query(col, fn) { return getAll(col).filter(fn); }

module.exports = { init, getAll, getById, insert, update, delete: del, query };
