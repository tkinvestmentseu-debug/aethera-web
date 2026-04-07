/**
 * Vercel Serverless Function — POST /api/register
 *
 * Creates a Firebase Auth account (email + password) and sends a welcome email.
 * FIREBASE_API_KEY and RESEND_API_KEY are server-side env vars only.
 *
 * Body: { name?: string, email: string, password: string }
 * Returns: 200 { ok: true, email } | 400 | 409 (email exists) | 429 | 500
 */

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const rateMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateMap.get(ip) || []).filter(t => now - t < 60_000);
  hits.push(now);
  rateMap.set(ip, hits);
  return hits.length > 5;
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Welcome email (reused from signup.js) ────────────────────────────────────
function welcomeHtml(name) {
  const greeting = name ? `Welcome, ${esc(name)}` : 'Welcome';
  const features = [
    ['🔮','AI Oracle — ask anything, receive cosmic wisdom'],
    ['🌙','Daily tarot cards, horoscopes & moon rituals'],
    ['🧘','Guided meditations & breathwork sessions'],
    ['🌊','Sound baths, binaural beats & healing frequencies'],
    ['👁','Shadow work, dream interpreter & numerology'],
    ['✨','Community — live rituals, energy circles, soul match'],
  ];
  const rows = features.map(([icon,text]) => `<tr><td style="padding:12px 0;border-bottom:1px solid rgba(139,92,246,0.10)"><table cellpadding="0" cellspacing="0" style="width:100%"><tr><td style="width:38px;vertical-align:middle;font-size:22px">${icon}</td><td style="padding-left:14px;font-size:14px;color:#C4B5FD;line-height:1.55;vertical-align:middle">${text}</td></tr></table></td></tr>`).join('');
  return {
    subject: 'Welcome to Aethera ✦ Your world of magic begins now',
    html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Welcome to Aethera</title></head><body style="margin:0;padding:0;background:#04020C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="background:#04020C"><tr><td align="center" style="padding:32px 16px"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;border:1px solid rgba(206,174,114,0.28);box-shadow:0 40px 80px rgba(0,0,0,0.7)"><tr><td style="background:linear-gradient(160deg,#1a0840 0%,#0f0520 50%,#080318 100%);padding:52px 40px 48px;text-align:center;border-bottom:1px solid rgba(206,174,114,0.15)"><div style="font-family:Georgia,serif;font-size:40px;font-weight:700;letter-spacing:8px;color:#CEAE72">AETHERA</div><div style="font-family:Georgia,serif;font-size:28px;line-height:1.35;color:#F0EBF8;margin-top:20px">Welcome to the World of Magic</div></td></tr><tr><td style="background:linear-gradient(180deg,#0D0520,#0a0318);padding:40px 40px 32px"><p style="font-size:20px;font-weight:600;color:#F0EBF8;margin:0 0 18px">${greeting},</p><p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 28px">Your Aethera account is ready. With over <strong style="color:#F0EBF8">130 spiritual features</strong>:</p><table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.025);border:1px solid rgba(139,92,246,0.18);border-radius:16px;padding:8px 20px;margin-bottom:36px">${rows}</table><div style="text-align:center;margin-bottom:32px"><a href="https://aethera.pl#download" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#A78BFA,#CEAE72);color:#fff;text-decoration:none;padding:16px 44px;border-radius:14px;font-weight:700;font-size:16px;box-shadow:0 0 40px rgba(139,92,246,0.40)">Download the App ✦</a></div><p style="font-size:15px;line-height:1.8;color:#F0EBF8;margin:0">With love and stardust,<br><strong>Tomasz & The Aethera Team</strong></p></td></tr><tr><td style="background:rgba(0,0,0,0.5);padding:22px 40px;text-align:center;border-top:1px solid rgba(139,92,246,0.10)"><p style="margin:0;font-size:11px;color:rgba(157,140,181,0.5)">© 2026 Aethera DuniAI & Oracle. All rights reserved. · <a href="https://aethera.pl" style="color:#8B5CF6;text-decoration:none">aethera.pl</a></p></td></tr></table></td></tr></table></body></html>`,
  };
}

async function sendResend({ apiKey, from, to, subject, html, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, ...(replyTo && { reply_to: replyTo }) }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── Handler ──────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });

  const { name, email, password } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const firebaseKey = process.env.FIREBASE_API_KEY;
  if (!firebaseKey) return res.status(500).json({ error: 'Server configuration error.' });

  try {
    // Create Firebase Auth account
    const fbRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, returnSecureToken: true }),
      }
    );
    const fbData = await fbRes.json();

    if (!fbRes.ok) {
      const code = fbData?.error?.message || 'UNKNOWN';
      if (code === 'EMAIL_EXISTS') {
        return res.status(409).json({ error: 'EMAIL_EXISTS', message: 'This email is already registered.' });
      }
      if (code === 'WEAK_PASSWORD : Password should be at least 6 characters' || code.startsWith('WEAK_PASSWORD')) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }
      if (code === 'INVALID_EMAIL') {
        return res.status(400).json({ error: 'Invalid email address.' });
      }
      console.error('[register] Firebase error:', code);
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }

    // Update display name if provided
    if (name && name.trim()) {
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: fbData.idToken, displayName: name.trim() }),
        }
      ).catch(() => {}); // non-fatal
    }

    // Send welcome email (non-fatal if fails)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const welcome = welcomeHtml(name);
      await sendResend({
        apiKey: resendKey,
        from: 'Aethera ✦ <noreply@aethera.pl>',
        to: [email.trim()],
        subject: welcome.subject,
        html: welcome.html,
      }).catch(err => console.error('[register] Resend error:', err.message));

      // Admin notification (non-fatal)
      const timestamp = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
      const displayName = (name && name.trim()) ? name.trim() : email.trim();
      const adminHtml = `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8"><title>Nowe konto — Aethera</title></head>
<body style="margin:0;padding:0;background:#07071A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07071A;min-height:100vh;">
<tr><td align="center" style="padding:40px 20px;">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
<tr><td align="center" style="padding:0 0 24px;">
  <div style="font-size:30px;font-weight:800;letter-spacing:4px;color:#CEAE72;">AETHERA</div>
  <div style="color:rgba(196,181,253,0.6);font-size:11px;letter-spacing:2px;margin-top:6px;">RAPORT ADMINA — NOWE KONTO</div>
</td></tr>
<tr><td style="background:rgba(255,255,255,0.04);border:1px solid rgba(206,174,114,0.20);border-radius:20px;padding:32px 28px;">
  <p style="margin:0 0 6px;color:rgba(196,181,253,0.55);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Nowa dusza dołączyła do Aethery</p>
  <h2 style="margin:0 0 24px;color:#F5F1EA;font-size:22px;font-weight:700;">✦ ${esc(displayName)}</h2>
  <table cellpadding="0" cellspacing="0" width="100%">
    <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <span style="color:rgba(196,181,253,0.55);font-size:12px;">📧 Email: </span>
      <span style="color:#F5F1EA;font-size:13px;font-weight:600;">${esc(email.trim())}</span>
    </td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <span style="color:rgba(196,181,253,0.55);font-size:12px;">👤 Imię: </span>
      <span style="color:#F5F1EA;font-size:13px;font-weight:600;">${esc(displayName)}</span>
    </td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <span style="color:rgba(196,181,253,0.55);font-size:12px;">🌐 Źródło: </span>
      <span style="color:#F5F1EA;font-size:13px;font-weight:600;">Strona www</span>
    </td></tr>
    <tr><td style="padding:10px 0;">
      <span style="color:rgba(196,181,253,0.55);font-size:12px;">🕐 Czas: </span>
      <span style="color:#F5F1EA;font-size:13px;font-weight:600;">${esc(timestamp)}</span>
    </td></tr>
  </table>
</td></tr>
<tr><td align="center" style="padding:20px 0 0;">
  <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">Automatyczny raport Aethera · contact@aethera.pl</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
      await sendResend({
        apiKey: resendKey,
        from: 'Aethera ✦ <noreply@aethera.pl>',
        to: ['contact@aethera.pl'],
        subject: `✦ Nowe konto: ${displayName} — Web`,
        html: adminHtml,
      }).catch(err => console.warn('[register] Admin notification error:', err.message));
    }

    return res.status(200).json({ ok: true, email: email.trim() });
  } catch (err) {
    console.error('[register] error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again or contact contact@aethera.pl' });
  }
};
