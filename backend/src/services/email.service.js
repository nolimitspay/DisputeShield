/**
 * Email Service — Alert notifications
 */
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendAlertNotification(merchant, alert, action) {
  const t = getTransporter();
  if (!t) return;

  const statusColor = action === 'auto_refund' ? '#22c55e' : action === 'flag_review' ? '#f59e0b' : '#64748b';
  const statusText = action === 'auto_refund' ? 'Auto-Refunded' : action === 'flag_review' ? 'Needs Review' : 'New Alert';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden">
      <div style="background:#1e293b;padding:24px 32px;border-bottom:1px solid #334155">
        <h1 style="margin:0;font-size:20px;color:#22c55e">DisputeShield</h1>
      </div>
      <div style="padding:32px">
        <div style="background:${statusColor}20;border:1px solid ${statusColor}40;border-radius:8px;padding:16px;margin-bottom:24px">
          <span style="color:${statusColor};font-weight:600;font-size:16px">${statusText}</span>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#94a3b8">Source</td><td style="padding:8px 0;font-weight:600">${alert.source}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Amount</td><td style="padding:8px 0;font-weight:600">$${(alert.amount || 0).toFixed(2)}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Reason</td><td style="padding:8px 0">${alert.reasonDescription || alert.reasonCode || 'N/A'}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Descriptor</td><td style="padding:8px 0">${alert.descriptor || 'N/A'}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Card Brand</td><td style="padding:8px 0">${alert.cardBrand || 'N/A'}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8">Alert Date</td><td style="padding:8px 0">${new Date(alert.alertDate || alert.createdAt).toLocaleDateString()}</td></tr>
        </table>
        ${action !== 'auto_refund' ? `
        <div style="margin-top:24px;text-align:center">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/alerts/${alert.id}" style="display:inline-block;background:#22c55e;color:#0f172a;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600">View Alert</a>
        </div>` : ''}
      </div>
      <div style="background:#1e293b;padding:16px 32px;text-align:center;color:#64748b;font-size:12px">
        DisputeShield — Chargeback Prevention Platform
      </div>
    </div>`;

  try {
    await t.sendMail({
      from: `"DisputeShield" <${process.env.SMTP_USER}>`,
      to: merchant.email,
      subject: `[DisputeShield] ${statusText}: $${(alert.amount || 0).toFixed(2)} ${alert.source} alert`,
      html,
    });
  } catch (e) {
    console.error('Email send failed:', e.message);
  }
}

async function sendWeeklyReport(merchant, stats) {
  const t = getTransporter();
  if (!t) return;
  // Weekly report email - simplified
  try {
    await t.sendMail({
      from: `"DisputeShield" <${process.env.SMTP_USER}>`,
      to: merchant.email,
      subject: `[DisputeShield] Weekly Report — ${stats.prevented} chargebacks prevented`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#22c55e">Weekly Report</h1>
        <p>Alerts received: <strong>${stats.received}</strong></p>
        <p>Chargebacks prevented: <strong>${stats.prevented}</strong></p>
        <p>Money saved: <strong>$${stats.saved.toFixed(2)}</strong></p>
        <p>Prevention rate: <strong>${stats.rate.toFixed(1)}%</strong></p>
      </div>`,
    });
  } catch (e) {
    console.error('Weekly report email failed:', e.message);
  }
}

module.exports = { sendAlertNotification, sendWeeklyReport };
