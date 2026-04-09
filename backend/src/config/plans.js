const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    maxDescriptors: 3,
    maxRules: 5,
    networks: ['ethoca'],
    autoRefund: false,
    analytics: 'basic',
    emailAlerts: true,
    apiAccess: false,
  },
  pro: {
    name: 'Pro',
    price: 149,
    maxDescriptors: 15,
    maxRules: 25,
    networks: ['ethoca', 'cdrn'],
    autoRefund: true,
    analytics: 'advanced',
    emailAlerts: true,
    apiAccess: false,
  },
  enterprise: {
    name: 'Enterprise',
    price: 399,
    maxDescriptors: Infinity,
    maxRules: Infinity,
    networks: ['ethoca', 'cdrn', 'rdr'],
    autoRefund: true,
    analytics: 'full',
    emailAlerts: true,
    apiAccess: true,
  },
};

const VALID_PLANS = Object.keys(PLANS);

function getPlanFeatures(plan) {
  return PLANS[plan] || PLANS.starter;
}

function getRequiredPlanForFeature(feature) {
  if (['rdr'].includes(feature)) return 'enterprise';
  if (['autoRefund', 'cdrn'].includes(feature)) return 'pro';
  return 'starter';
}

module.exports = { PLANS, VALID_PLANS, getPlanFeatures, getRequiredPlanForFeature };
