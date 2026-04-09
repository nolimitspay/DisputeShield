/**
 * Refund Service
 * Executes refunds through connected payment processors
 */

async function executeRefund(merchant, alert) {
  const processor = findProcessorForAlert(merchant, alert);
  if (!processor) {
    return { success: false, error: 'No processor connected for this transaction' };
  }

  try {
    let result;
    switch (processor.type) {
      case 'stripe':
        result = await refundViaStripe(processor, alert);
        break;
      case 'square':
        result = await refundViaSquare(processor, alert);
        break;
      default:
        return { success: false, error: `Unsupported processor: ${processor.type}` };
    }
    return { success: true, ...result };
  } catch (e) {
    console.error('Refund failed:', e.message);
    return { success: false, error: e.message };
  }
}

function findProcessorForAlert(merchant, alert) {
  if (!merchant.connectedProcessors || merchant.connectedProcessors.length === 0) return null;
  // For now, return the first connected processor
  // In the future, match by descriptor/MID mapping
  return merchant.connectedProcessors[0];
}

async function refundViaStripe(processor, alert) {
  const stripeKey = process.env.STRIPE_SECRET_KEY || processor.apiKey;
  if (!stripeKey) throw new Error('Stripe API key not configured');

  // If we have a Stripe charge/payment intent ID from the alert
  const chargeId = alert.processorTransactionId || alert.externalTransactionId;

  if (chargeId) {
    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        charge: chargeId,
        amount: Math.round((alert.amount || 0) * 100), // Stripe uses cents
        reason: 'fraudulent',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Stripe refund failed');
    return { refundId: data.id, processor: 'stripe', amount: alert.amount };
  }

  // If no charge ID, we can't process the refund automatically
  return { refundId: null, processor: 'stripe', amount: alert.amount, note: 'No transaction ID — manual refund needed' };
}

async function refundViaSquare(processor, alert) {
  // Square refund implementation placeholder
  return { refundId: null, processor: 'square', amount: alert.amount, note: 'Square refund — manual processing needed' };
}

module.exports = { executeRefund };
