/**
 * Vercel Serverless Function — POST /api/signup
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

// ─── Welcome email ────────────────────────────────────────────────────────────
function welcomeHtml(name) {
  const greeting = name ? `Welcome, ${esc(name)}` : 'Welcome';
  const features = [
    ['🔮', 'AI Oracle — ask anything, receive cosmic wisdom'],
    ['🌙', 'Daily tarot cards, horoscopes &amp; moon rituals'],
    ['🧘', 'Guided meditations &amp; breathwork sessions'],
    ['🌊', 'Sound baths, binaural beats &amp; healing frequencies'],
    ['👁', 'Shadow work, dream interpreter &amp; numerology'],
    ['✨', 'Community — live rituals, energy circles, soul match'],
  ];
  const featureRows = features.map(([icon, text]) => `
    <tr><td style="padding:12px 0;border-bottom:1px solid rgba(139,92,246,0.10)">
      <table cellpadding="0" cellspacing="0" style="width:100%"><tr>
        <td style="width:38px;vertical-align:middle;font-size:22px">${icon}</td>
        <td style="padding-left:14px;font-size:14px;color:#C4B5FD;line-height:1.55;vertical-align:middle">${text}</td>
      </tr></table>
    </td></tr>`).join('');

  return {
    subject: 'Welcome to Aethera ✦ Your world of magic begins now',
    html: `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to Aethera</title></head>
<body style="margin:0;padding:0;background-color:#04020C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#04020C">
<tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;border:1px solid rgba(206,174,114,0.28);box-shadow:0 40px 80px rgba(0,0,0,0.7)">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(160deg,#1a0840 0%,#0f0520 50%,#080318 100%);padding:52px 40px 48px;text-align:center;border-bottom:1px solid rgba(206,174,114,0.15)">
    <div style="font-size:13px;letter-spacing:10px;color:rgba(206,174,114,0.40);margin-bottom:24px">· · ✦ · · ✦ · ·</div>
    <div style="font-family:Georgia,serif;font-size:40px;font-weight:700;letter-spacing:8px;margin-bottom:4px;color:#CEAE72">AETHERA</div>
    <div style="font-size:10px;letter-spacing:4px;color:#9D8CB5;text-transform:uppercase;margin-bottom:32px">DuniAI &amp; Oracle</div>
    <div style="font-family:Georgia,serif;font-size:28px;line-height:1.35;color:#F0EBF8;margin-bottom:14px">Welcome to the World of Magic</div>
    <div style="font-family:Georgia,serif;font-size:16px;color:#C4B5FD;margin-bottom:28px">Your soul has found its compass.</div>
    <div style="display:inline-block;background:linear-gradient(135deg,rgba(206,174,114,0.15),rgba(139,92,246,0.15));border:1px solid rgba(206,174,114,0.35);border-radius:30px;padding:9px 24px;font-size:11px;font-weight:700;letter-spacing:2px;color:#CEAE72;text-transform:uppercase">✦ Account Created</div>
  </td></tr>

  <!-- BODY -->
  <tr><td style="background:linear-gradient(180deg,#0D0520,#0a0318);padding:40px 40px 32px">
    <p style="font-size:20px;font-weight:600;color:#F0EBF8;margin:0 0 18px">${greeting},</p>
    <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 16px">You've just stepped through the portal. Your Aethera account is ready — a sanctuary where <strong style="color:#F0EBF8">ancient wisdom meets modern technology</strong>, and your spiritual journey truly begins.</p>
    <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 28px">With over <strong style="color:#F0EBF8">130 spiritual features</strong> at your fingertips:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.025);border:1px solid rgba(139,92,246,0.18);border-radius:16px;padding:8px 20px;margin-bottom:36px">
      ${featureRows}
    </table>
    <div style="background:linear-gradient(135deg,rgba(206,174,114,0.06),rgba(139,92,246,0.08));border:1px solid rgba(206,174,114,0.20);border-radius:18px;padding:28px 24px;text-align:center;margin-bottom:32px">
      <div style="font-family:Georgia,serif;font-size:17px;color:#F0EBF8;margin-bottom:8px">Download Aethera today</div>
      <div style="font-size:13px;color:#9D8CB5;margin-bottom:22px">Available on iOS &amp; Android — free to download</div>
      <a href="https://aethera.pl#download" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#A78BFA,#CEAE72);color:#fff;text-decoration:none;padding:16px 44px;border-radius:14px;font-weight:700;font-size:16px;box-shadow:0 0 40px rgba(139,92,246,0.40)">Download the App ✦</a>
    </div>
    <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 20px">The stars have been waiting for you. May every session bring you clarity, healing, and wonder.</p>
    <p style="font-size:15px;line-height:1.8;color:#F0EBF8;margin:0">With love and stardust,<br><strong>Tomasz &amp; The Aethera Team</strong></p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:rgba(0,0,0,0.5);padding:22px 40px;text-align:center;border-top:1px solid rgba(139,92,246,0.10)">
    <p style="margin:0 0 8px">
      <a href="https://aethera.pl" style="color:#8B5CF6;text-decoration:none;font-size:13px;margin:0 8px">aethera.pl</a>
      <span style="color:rgba(157,140,181,0.4)">·</span>
      <a href="mailto:contact@aethera.pl" style="color:#8B5CF6;text-decoration:none;font-size:13px;margin:0 8px">contact@aethera.pl</a>
    </p>
    <p style="margin:0;font-size:11px;color:rgba(157,140,181,0.5)">© 2026 Aethera DuniAI &amp; Oracle. All rights reserved.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  };
}

// ─── Admin notification ───────────────────────────────────────────────────────
function adminHtml({ name, email, lang, ua, ts }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#04020C;font-family:Arial,sans-serif;color:#F0EBF8">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#04020C;padding:24px 16px"><tr><td align="center">
<table width="560" style="max-width:560px;background:linear-gradient(135deg,#0D0520,#120828);border:1px solid rgba(16,185,129,0.3);border-radius:18px;overflow:hidden">
  <tr><td style="background:linear-gradient(135deg,#1a0835,#0f0520);padding:24px 28px;border-bottom:1px solid rgba(16,185,129,0.15)">
    <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:4px;color:#CEAE72">✦ AETHERA</div>
    <div style="display:inline-block;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;letter-spacing:2px;color:#10B981;margin-top:8px">🌟 NEW SIGNUP</div>
  </td></tr>
  <tr><td style="padding:24px 28px">
    ${[['Name', name || '—'], ['Email', email], ['Language', lang], ['Time', ts]].map(([l, v]) => `
    <div style="margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#CEAE72;text-transform:uppercase;margin-bottom:5px">${l}</div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(16,185,129,0.18);border-radius:8px;padding:10px 14px;font-size:14px;color:#F0EBF8">${esc(String(v))}</div>
    </div>`).join('')}
    <a href="mailto:${esc(email)}" style="display:inline-block;background:linear-gradient(135deg,#10B981,#059669);color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;margin-top:8px">↩ Reply</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
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
  const { name, email, _hp } = body;

  if (_hp) return res.status(200).json({ ok: true }); // honeypot
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfiguration.' });

  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  try {
    const welcome = welcomeHtml(name);
    await sendResend({
      apiKey,
      from: 'Aethera ✦ <noreply@aethera.pl>',
      to: [email],
      subject: welcome.subject,
      html: welcome.html,
    });

    await sendResend({
      apiKey,
      from: 'Aethera Alerts <noreply@aethera.pl>',
      to: ['contact@aethera.pl'],
      subject: `🌟 New Signup: ${name || email}`,
      html: adminHtml({ name, email, lang: 'en', ua: req.headers['user-agent'] || '', ts }),
      replyTo: email,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[signup error]', err.message);
    return res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
};
