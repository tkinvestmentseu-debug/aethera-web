/**
 * Vercel Serverless Function — POST /api/contact
 */

// ─── Rate limiting ────────────────────────────────────────────────────────────
const rateMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateMap.get(ip) || []).filter(t => now - t < 60_000);
  hits.push(now);
  rateMap.set(ip, hits);
  return hits.length > 5;
}

// ─── Resend ───────────────────────────────────────────────────────────────────
async function sendResend({ apiKey, from, to, subject, html, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, ...(replyTo && { reply_to: replyTo }) }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend ${res.status}: ${err}`);
  }
  return res.json();
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Admin notification ───────────────────────────────────────────────────────
function adminHtml({ name, email, company, subject, message, lang, ts }) {
  const rows = [
    ['Name', name || '—'],
    ['Email', email],
    ...(company ? [['Company', company]] : []),
    ...(subject ? [['Subject', subject]] : []),
    ['Message', message],
    ['Language', lang],
    ['Time', ts],
  ];
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#04020C;font-family:Arial,sans-serif;color:#F0EBF8">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#04020C;padding:24px 16px"><tr><td align="center">
<table width="560" style="max-width:560px;background:linear-gradient(135deg,#0D0520,#120828);border:1px solid rgba(139,92,246,0.3);border-radius:18px;overflow:hidden">
  <tr><td style="background:linear-gradient(135deg,#1a0835,#0f0520);padding:24px 28px;border-bottom:1px solid rgba(139,92,246,0.15)">
    <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:4px;color:#CEAE72">✦ AETHERA</div>
    <div style="display:inline-block;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;letter-spacing:2px;color:#A78BFA;margin-top:8px">📨 NEW CONTACT</div>
  </td></tr>
  <tr><td style="padding:24px 28px">
    ${rows.map(([l, v]) => `
    <div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#CEAE72;text-transform:uppercase;margin-bottom:5px">${l}</div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(139,92,246,0.18);border-radius:8px;padding:10px 14px;font-size:14px;color:#F0EBF8;white-space:pre-wrap;word-break:break-word">${esc(String(v))}</div>
    </div>`).join('')}
    <a href="mailto:${esc(email)}?subject=Re%3A+${encodeURIComponent(subject || 'Aethera')}" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#6D28D9);color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;margin-top:8px">↩ Reply</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ─── Autoresponder ────────────────────────────────────────────────────────────
function autoresponderHtml(name) {
  const greeting = name ? `Hello ${esc(name)}` : 'Hello';
  return {
    subject: 'Thank you for reaching out ✦ Aethera',
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#04020C;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#04020C;padding:32px 16px"><tr><td align="center">
<table width="560" style="max-width:560px;background:linear-gradient(160deg,#0D0520,#0a0318);border:1px solid rgba(139,92,246,0.32);border-radius:22px;overflow:hidden">
  <tr><td style="background:linear-gradient(160deg,#1a0840,#0f0520);padding:36px 40px;text-align:center;border-bottom:1px solid rgba(206,174,114,0.12)">
    <div style="font-size:13px;letter-spacing:8px;color:rgba(206,174,114,0.35);margin-bottom:16px">· · ✦ · ·</div>
    <div style="font-family:Georgia,serif;font-size:30px;font-weight:700;letter-spacing:6px;color:#CEAE72">AETHERA</div>
    <div style="font-size:9px;letter-spacing:4px;color:#9D8CB5;margin-top:6px;text-transform:uppercase">Ancient Wisdom · Modern Technology</div>
  </td></tr>
  <tr><td style="padding:32px 40px">
    <p style="font-size:18px;color:#F0EBF8;margin:0 0 16px;font-weight:600">${greeting},</p>
    <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 14px">Thank you for reaching out to Aethera. We've received your message and will get back to you within 24–48 hours.</p>
    <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 24px">If your inquiry is urgent, write directly to <a href="mailto:contact@aethera.pl" style="color:#A78BFA">contact@aethera.pl</a>.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px">
      <a href="https://aethera.pl#download" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#CEAE72);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px">Download Aethera ✦</a>
    </td></tr></table>
    <p style="font-size:15px;line-height:1.8;color:#F0EBF8;margin:0">With love and stardust,<br><strong>The Aethera Team</strong></p>
  </td></tr>
  <tr><td style="background:rgba(0,0,0,0.4);padding:16px 40px;text-align:center;border-top:1px solid rgba(139,92,246,0.08)">
    <p style="margin:0;font-size:11px;color:rgba(157,140,181,0.5)">© 2026 Aethera DuniAI &amp; Oracle</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests.' });

  const body = req.body || {};
  const { name, email, company, subject, message, lang, _hp } = body;

  if (_hp) return res.status(200).json({ ok: true });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (!message || message.trim().length < 5) {
    return res.status(400).json({ error: 'Message is too short.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfiguration.' });

  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  try {
    await sendResend({
      apiKey,
      from: 'Aethera Contact <noreply@aethera.pl>',
      to: ['contact@aethera.pl'],
      subject: `📨 Contact: ${subject || 'New message'} — ${name || email}`,
      html: adminHtml({ name, email, company, subject, message, lang: lang || 'en', ts }),
      replyTo: email,
    });

    const ar = autoresponderHtml(name);
    await sendResend({
      apiKey,
      from: 'Aethera ✦ <noreply@aethera.pl>',
      to: [email],
      subject: ar.subject,
      html: ar.html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact error]', err.message);
    return res.status(500).json({ error: 'Failed to send. Please try again.' });
  }
};
