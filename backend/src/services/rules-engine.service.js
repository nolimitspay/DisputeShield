/**
 * Rules Engine Service
 * Evaluates merchant-configured rules against incoming alerts
 * First matching rule (by priority) wins
 */
const db = require('../db');

/**
 * Evaluate all rules for a merchant against an alert
 * Returns: { matched: true/false, rule: matchedRule, action: 'auto_refund'|'flag_review'|'ignore' }
 */
function evaluateRules(merchantId, alert) {
  const rules = db.query('rules', r => r.merchantId === merchantId && r.enabled)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));

  for (const rule of rules) {
    if (matchesRule(rule, alert)) {
      // Update rule stats
      db.update('rules', rule.id, {
        stats: {
          ...(rule.stats || {}),
          timesMatched: ((rule.stats?.timesMatched) || 0) + 1,
          totalRefunded: ((rule.stats?.totalRefunded) || 0) + (rule.action === 'auto_refund' ? (alert.amount || 0) : 0),
          lastMatchedAt: new Date().toISOString(),
        },
      });

      return { matched: true, rule, action: rule.action };
    }
  }

  return { matched: false, rule: null, action: null };
}

/**
 * Check if a single rule matches an alert
 * All conditions must pass (AND logic)
 */
function matchesRule(rule, alert) {
  const c = rule.conditions;
  if (!c) return false;

  // Max amount condition
  if (c.maxAmount !== undefined && c.maxAmount !== null) {
    if (alert.amount > c.maxAmount) return false;
  }

  // Min amount condition
  if (c.minAmount !== undefined && c.minAmount !== null) {
    if (alert.amount < c.minAmount) return false;
  }

  // Source/network filter (CDRN, Ethoca, RDR)
  if (c.sources && c.sources.length > 0) {
    if (!c.sources.includes(alert.source?.toUpperCase())) return false;
  }

  // Reason code filter
  if (c.reasonCodes && c.reasonCodes.length > 0) {
    if (!c.reasonCodes.includes(alert.reasonCode)) return false;
  }

  // Card brand filter
  if (c.cardBrands && c.cardBrands.length > 0) {
    if (!c.cardBrands.includes(alert.cardBrand?.toLowerCase())) return false;
  }

  // Descriptor filter
  if (c.descriptors && c.descriptors.length > 0) {
    const alertDesc = (alert.descriptor || '').toLowerCase();
    if (!c.descriptors.some(d => alertDesc.includes(d.toLowerCase()))) return false;
  }

  return true;
}

/**
 * Create default rules for a new merchant
 */
function createDefaultRules(merchantId) {
  const defaults = [
    {
      merchantId,
      name: 'Auto-refund small amounts',
      enabled: true,
      priority: 1,
      action: 'auto_refund',
      conditions: { maxAmount: 25, sources: [], reasonCodes: [], cardBrands: [] },
      stats: { timesMatched: 0, totalRefunded: 0 },
    },
    {
      merchantId,
      name: 'Flag high-value for review',
      enabled: true,
      priority: 2,
      action: 'flag_review',
      conditions: { minAmount: 100, sources: [], reasonCodes: [], cardBrands: [] },
      stats: { timesMatched: 0, totalRefunded: 0 },
    },
  ];

  return defaults.map(r => db.insert('rules', r));
}

module.exports = { evaluateRules, matchesRule, createDefaultRules };
