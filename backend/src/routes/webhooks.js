/**
 * Webhook receiver — Chargeblast alert ingestion
 * POST /api/webhooks/chargeblast — No auth, signature verification only
 */
const express = require('express');
const db = require('../db');
const chargeblast = require('../services/chargeblast.service');
const rulesEngine = require('../services/rules-engine.service');
const refundService = require('../services/refund.service');
const emailService = require('../services/email.service');

const router = express.Router();

// Chargeblast sends alerts via webhook
router.post('/chargeblast', express.raw({ type: 'application/json' }), async (req, res) => {
  const rawBody = typeof req.body === 'string' ? req.body : req.body.toString();

  // Verify webhook signature
  if (!chargeblast.verifyWebhookSignature(rawBody, req.headers)) {
    console.warn('Webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  try {
    await processAlert(payload);
    res.json({ received: true });
  } catch (e) {
    console.error('Webhook processing error:', e);
    res.status(500).json({ error: 'Processing failed' });
  }
});

async function processAlert(payload) {
  // Map Chargeblast payload to our alert format
  const alertData = {
    source: mapSource(payload.type || payload.alert_type),
    externalAlertId: payload.id || payload.alert_id,
    status: 'pending',
    cardBrand: (payload.card_brand || payload.cardBrand || '').toLowerCase(),
    amount: parseFloat(payload.amount || payload.transaction_amount || 0),
    currency: payload.currency || 'USD',
    descriptor: payload.descriptor || payload.merchant_descriptor || '',
    reasonCode: payload.reason_code || payload.reasonCode || '',
    reasonDescription: payload.reason || payload.reason_description || '',
    transactionDate: payload.transaction_date || payload.transactionDate || null,
    alertDate: payload.alert_date || payload.created_at || new Date().toISOString(),
    deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72h from now
    rawPayload: payload,
  };

  // Find merchant by descriptor matching
  const merchant = findMerchantByDescriptor(alertData.descriptor);
  if (!merchant) {
    console.warn('No merchant found for descriptor:', alertData.descriptor);
    // Store as unmatched
    alertData.merchantId = 'unmatched';
    db.insert('alerts', alertData);
    return;
  }

  alertData.merchantId = merchant.id;

  // Store the alert
  const alert = db.insert('alerts', alertData);

  // Log activity
  db.insert('activityLog', {
    merchantId: merchant.id,
    alertId: alert.id,
    action: 'alert_received',
    details: `${alertData.source} alert received: $${alertData.amount} — ${alertData.reasonDescription || alertData.reasonCode}`,
  });

  // Evaluate rules
  const { matched, rule, action } = rulesEngine.evaluateRules(merchant.id, alert);

  if (matched && action === 'auto_refund') {
    // Execute auto-refund
    const refundResult = await refundService.executeRefund(merchant, alert);

    if (refundResult.success) {
      db.update('alerts', alert.id, {
        status: 'auto_refunded',
        matchedRuleId: rule.id,
        refundDetails: {
          refundId: refundResult.refundId,
          processor: refundResult.processor,
          refundedAt: new Date().toISOString(),
          amount: alert.amount,
        },
        resolvedAt: new Date().toISOString(),
      });

      db.insert('activityLog', {
        merchantId: merchant.id,
        alertId: alert.id,
        action: 'auto_refund',
        details: `Auto-refunded $${alert.amount} via ${refundResult.processor} (rule: ${rule.name})`,
      });

      // Notify Chargeblast
      try {
        await chargeblast.resolveAlert(alertData.externalAlertId, { action: 'refund' });
      } catch (e) {
        console.error('Failed to notify Chargeblast of resolution:', e.message);
      }
    } else {
      // Refund failed, keep as pending
      db.update('alerts', alert.id, { status: 'pending', matchedRuleId: rule.id });
      db.insert('activityLog', {
        merchantId: merchant.id,
        alertId: alert.id,
        action: 'refund_failed',
        details: `Auto-refund failed: ${refundResult.error}. Manual action needed.`,
      });
    }

    // Email notification
    if (merchant.notificationPrefs?.autoRefundNotify) {
      emailService.sendAlertNotification(merchant, alert, 'auto_refund');
    }
  } else if (matched && action === 'flag_review') {
    db.update('alerts', alert.id, { matchedRuleId: rule.id });
    db.insert('activityLog', {
      merchantId: merchant.id,
      alertId: alert.id,
      action: 'rule_matched',
      details: `Flagged for review (rule: ${rule.name})`,
    });
    if (merchant.notificationPrefs?.emailAlerts) {
      emailService.sendAlertNotification(merchant, alert, 'flag_review');
    }
  } else if (matched && action === 'ignore') {
    db.update('alerts', alert.id, { status: 'ignored', matchedRuleId: rule.id });
  } else {
    // No rule matched — pending for manual review
    if (merchant.notificationPrefs?.emailAlerts) {
      emailService.sendAlertNotification(merchant, alert, 'new');
    }
  }
}

function mapSource(type) {
  if (!type) return 'UNKNOWN';
  const t = type.toUpperCase();
  if (t.includes('RDR')) return 'RDR';
  if (t.includes('ETHOCA')) return 'ETHOCA';
  if (t.includes('CDRN')) return 'CDRN';
  return t;
}

function findMerchantByDescriptor(descriptor) {
  if (!descriptor) return null;
  const desc = descriptor.toLowerCase();

  // Check all merchants' registered descriptors
  const users = db.getAll('users');
  for (const user of users) {
    const descriptors = db.query('descriptors', d => d.merchantId === user.id);
    for (const d of descriptors) {
      if (desc.includes((d.value || '').toLowerCase())) return user;
    }
  }

  return null;
}

module.exports = router;
