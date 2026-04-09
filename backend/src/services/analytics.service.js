/**
 * Analytics Service — Dashboard KPIs and chart data
 */
const db = require('../db');

function getStats(merchantId, dateFrom, dateTo) {
  const alerts = db.query('alerts', a => {
    if (a.merchantId !== merchantId) return false;
    if (dateFrom && new Date(a.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(a.createdAt) > new Date(dateTo)) return false;
    return true;
  });

  const total = alerts.length;
  const autoRefunded = alerts.filter(a => a.status === 'auto_refunded').length;
  const manualRefunded = alerts.filter(a => a.status === 'manual_refunded').length;
  const prevented = autoRefunded + manualRefunded;
  const pending = alerts.filter(a => a.status === 'pending').length;
  const ignored = alerts.filter(a => a.status === 'ignored').length;
  const expired = alerts.filter(a => a.status === 'expired').length;

  const totalRefunded = alerts
    .filter(a => ['auto_refunded', 'manual_refunded'].includes(a.status))
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const totalAlertCost = total * 35; // ~$35 per alert average

  // By source
  const bySource = {};
  alerts.forEach(a => {
    const src = a.source || 'Unknown';
    if (!bySource[src]) bySource[src] = { total: 0, prevented: 0, amount: 0 };
    bySource[src].total++;
    if (['auto_refunded', 'manual_refunded'].includes(a.status)) {
      bySource[src].prevented++;
      bySource[src].amount += a.amount || 0;
    }
  });

  // By reason
  const byReason = {};
  alerts.forEach(a => {
    const reason = a.reasonDescription || a.reasonCode || 'Unknown';
    if (!byReason[reason]) byReason[reason] = 0;
    byReason[reason]++;
  });

  return {
    total,
    prevented,
    autoRefunded,
    manualRefunded,
    pending,
    ignored,
    expired,
    preventionRate: total > 0 ? ((prevented / total) * 100) : 0,
    totalRefunded,
    totalAlertCost,
    moneySaved: totalRefunded, // The value of chargebacks prevented
    bySource,
    byReason,
  };
}

function getChartData(merchantId, dateFrom, dateTo, groupBy = 'day') {
  const alerts = db.query('alerts', a => {
    if (a.merchantId !== merchantId) return false;
    if (dateFrom && new Date(a.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(a.createdAt) > new Date(dateTo)) return false;
    return true;
  });

  const groups = {};
  alerts.forEach(a => {
    const date = new Date(a.createdAt);
    let key;
    if (groupBy === 'day') key = date.toISOString().split('T')[0];
    else if (groupBy === 'week') {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      key = d.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!groups[key]) groups[key] = { date: key, alerts: 0, prevented: 0, amount: 0 };
    groups[key].alerts++;
    if (['auto_refunded', 'manual_refunded'].includes(a.status)) {
      groups[key].prevented++;
      groups[key].amount += a.amount || 0;
    }
  });

  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
}

function getRecentActivity(merchantId, limit = 20) {
  return db.query('activityLog', a => a.merchantId === merchantId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

module.exports = { getStats, getChartData, getRecentActivity };
