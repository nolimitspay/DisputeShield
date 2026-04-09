/**
 * Chargeblast API Service
 * Wraps all interactions with the Chargeblast Embedded API
 * Docs: https://docs.chargeblast.com/api-reference
 */

const API_BASE = 'https://api.chargeblast.com/v1';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.CHARGEBLAST_API_KEY,
  };
}

async function apiCall(method, path, body = null) {
  const opts = { method, headers: getHeaders() };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error(`Chargeblast API error [${method} ${path}]:`, res.status, data);
    throw new Error(data.message || `Chargeblast API error: ${res.status}`);
  }
  return data;
}

// Merchants
async function createMerchant(merchantData) {
  return apiCall('POST', '/merchants', merchantData);
}

async function getMerchant(merchantId) {
  return apiCall('GET', `/merchants/${merchantId}`);
}

// Descriptors (MIDs)
async function addDescriptor(merchantId, descriptor) {
  return apiCall('POST', `/merchants/${merchantId}/descriptors`, { descriptor });
}

async function listDescriptors(merchantId) {
  return apiCall('GET', `/merchants/${merchantId}/descriptors`);
}

async function removeDescriptor(merchantId, descriptorId) {
  return apiCall('DELETE', `/merchants/${merchantId}/descriptors/${descriptorId}`);
}

// Alerts
async function listAlerts(merchantId, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiCall('GET', `/merchants/${merchantId}/alerts${query ? '?' + query : ''}`);
}

async function getAlert(alertId) {
  return apiCall('GET', `/alerts/${alertId}`);
}

// Resolve an alert (notify Chargeblast that we refunded)
async function resolveAlert(alertId, resolution) {
  return apiCall('POST', `/alerts/${alertId}/resolve`, resolution);
}

// Webhook signature verification (Svix-based)
function verifyWebhookSignature(payload, headers) {
  const secret = process.env.CHARGEBLAST_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('CHARGEBLAST_WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }

  const crypto = require('crypto');
  const signature = headers['svix-signature'] || headers['webhook-signature'];
  const timestamp = headers['svix-timestamp'] || headers['webhook-timestamp'];
  const msgId = headers['svix-id'] || headers['webhook-id'];

  if (!signature || !timestamp) return false;

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const toSign = `${msgId}.${timestamp}.${payload}`;
  const secretBytes = Buffer.from(secret.replace('whsec_', ''), 'base64');
  const expectedSignature = crypto.createHmac('sha256', secretBytes).update(toSign).digest('base64');

  const signatures = signature.split(' ');
  return signatures.some(sig => {
    const sigValue = sig.split(',').pop();
    return crypto.timingSafeEqual(Buffer.from(sigValue), Buffer.from(expectedSignature));
  });
}

module.exports = {
  createMerchant,
  getMerchant,
  addDescriptor,
  listDescriptors,
  removeDescriptor,
  listAlerts,
  getAlert,
  resolveAlert,
  verifyWebhookSignature,
};
