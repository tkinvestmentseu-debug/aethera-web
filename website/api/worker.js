/**
 * Aethera Contact & Lead Capture — Cloudflare Worker
 * ───────────────────────────────────────────────────
 * Deploy:  wrangler deploy (see wrangler.toml)
 * Secrets: wrangler secret put RESEND_API_KEY
 *          wrangler secret put GOOGLE_SHEETS_ID
 *          wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
 *
 * Routes handled:
 *   POST /api/contact  — contact form
 *   POST /api/signup   — early access / waitlist signup
 */

// ─── CORS ─────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ─── RATE LIMIT (simple in-memory per worker instance) ────────────────────────
const ipLog = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipLog.get(ip) || { count: 0, first: now };
  if (now - entry.first > 60_000) { ipLog.set(ip, { count: 1, first: now }); return false; }
  if (entry.count >= 5) return true;
  entry.count++;
  ipLog.set(ip, entry);
  return false;
}

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

function adminContactEmail({ name, email, company, subject, message, lang, ua, ts }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#04020C;font-family:'Inter',Arial,sans-serif;color:#F0EBF8}
  .wrap{max-width:600px;margin:0 auto;padding:32px 16px}
  .card{background:linear-gradient(135deg,#0D0520,#120828);border:1px solid rgba(139,92,246,0.35);border-radius:20px;overflow:hidden}
  .header{background:linear-gradient(135deg,#1a0a35,#0f0520);padding:32px;text-align:center;border-bottom:1px solid rgba(139,92,246,0.2)}
  .logo{font-family:Georgia,serif;font-size:28px;font-weight:700;letter-spacing:4px;background:linear-gradient(135deg,#CEAE72,#A78BFA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .badge{display:inline-block;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;letter-spacing:2px;color:#A78BFA;margin-top:10px;text-transform:uppercase}
  .body{padding:32px}
  .field{margin-bottom:20px}
  .label{font-size:10px;font-weight:700;letter-spacing:2px;color:#CEAE72;text-transform:uppercase;margin-bottom:6px}
  .value{background:rgba(255,255,255,0.04);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:12px 16px;font-size:15px;color:#F0EBF8;line-height:1.6;word-break:break-word}
  .message-value{min-height:80px;white-space:pre-wrap}
  .meta{background:rgba(0,0,0,0.3);padding:16px 32px;border-top:1px solid rgba(139,92,246,0.15);display:flex;justify-content:space-between;font-size:11px;color:#9D8CB5;flex-wrap:wrap;gap:8px}
  .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent);margin:24px 0}
  .reply-btn{display:inline-block;background:linear-gradient(135deg,#8B5CF6,#A78BFA);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;margin-top:20px}
</style></head>
<body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <div class="logo">✦ AETHERA</div>
      <div class="badge">📨 New Contact Form Submission</div>
    </div>
    <div class="body">
      <div class="field"><div class="label">Name</div><div class="value">${escHtml(name || '—')}</div></div>
      <div class="field"><div class="label">Email</div><div class="value">${escHtml(email)}</div></div>
      ${company ? `<div class="field"><div class="label">Company</div><div class="value">${escHtml(company)}</div></div>` : ''}
      ${subject ? `<div class="field"><div class="label">Subject</div><div class="value">${escHtml(subject)}</div></div>` : ''}
      <div class="field"><div class="label">Message</div><div class="value message-value">${escHtml(message)}</div></div>
      <div class="divider"></div>
      <a href="mailto:${escHtml(email)}?subject=Re: ${encodeURIComponent(subject || 'Your message to Aethera')}" class="reply-btn">↩ Reply to ${escHtml(name || email)}</a>
    </div>
    <div class="meta">
      <span>🕐 ${ts}</span>
      <span>🌐 ${escHtml(lang || 'pl')}</span>
      <span>📍 aethera.pl contact form</span>
      ${ua ? `<span style="flex-basis:100%;opacity:0.6">🖥 ${escHtml(ua.slice(0, 80))}</span>` : ''}
    </div>
  </div>
</div>
</body></html>`;
}

function autoresponderEmail({ name, lang }) {
  // Multilingual autoresponder copy
  const copy = {
    pl: {
      subject: 'Dziękujemy za wiadomość ✦ Aethera',
      greeting: `Cześć ${name || 'Podróżniku'}`,
      p1: 'Dziękujemy za kontakt z Aetherą. Otrzymaliśmy Twoją wiadomość i odpowiemy w ciągu 24–48 godzin.',
      p2: 'Jeśli Twoje pytanie jest pilne, możesz napisać bezpośrednio na contact@aethera.pl.',
      p3: 'Tymczasem — jeśli jeszcze nie masz naszej aplikacji — pobierz Aetherę i odkryj ponad 130 funkcji duchowych, w tym Oracle AI, tarot, horoskopy i wiele więcej.',
      cta: 'Pobierz Aetherę',
      sign: 'Z miłością i gwiazdami,<br><strong>Zespół Aethera</strong>',
    },
    en: {
      subject: 'Thank you for reaching out ✦ Aethera',
      greeting: `Hello ${name || 'Seeker'}`,
      p1: "Thank you for reaching out to Aethera. We've received your message and will get back to you within 24–48 hours.",
      p2: 'If your inquiry is urgent, feel free to write directly to contact@aethera.pl.',
      p3: "In the meantime — if you haven't already — download Aethera and explore 130+ spiritual features including AI Oracle, tarot, horoscopes and much more.",
      cta: 'Download Aethera',
      sign: 'With love and stardust,<br><strong>The Aethera Team</strong>',
    },
  };
  const c = copy[lang] || copy.en;

  return {
    subject: c.subject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#04020C;font-family:'Inter',Arial,sans-serif;color:#F0EBF8}
  .wrap{max-width:600px;margin:0 auto;padding:32px 16px}
  .card{background:linear-gradient(135deg,#0D0520,#120828);border:1px solid rgba(139,92,246,0.35);border-radius:20px;overflow:hidden}
  .header{background:linear-gradient(135deg,#1a0a35,#0f0520);padding:40px 32px;text-align:center;border-bottom:1px solid rgba(206,174,114,0.2)}
  .logo{font-family:Georgia,serif;font-size:32px;font-weight:700;letter-spacing:5px;background:linear-gradient(135deg,#CEAE72,#A78BFA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .logo-sub{font-size:11px;letter-spacing:4px;color:#9D8CB5;margin-top:8px;text-transform:uppercase}
  .symbol{font-size:56px;display:block;margin:20px 0 8px;filter:drop-shadow(0 0 20px rgba(206,174,114,0.5))}
  .body{padding:36px 32px}
  .greeting{font-family:Georgia,serif;font-size:22px;font-weight:600;color:#F0EBF8;margin-bottom:20px}
  p{font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 16px}
  .cta-wrap{text-align:center;margin:28px 0}
  .cta-btn{display:inline-block;background:linear-gradient(135deg,#8B5CF6,#CEAE72);color:#fff;text-decoration:none;padding:16px 36px;border-radius:14px;font-weight:700;font-size:16px;letter-spacing:0.5px;box-shadow:0 0 30px rgba(139,92,246,0.4)}
  .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent);margin:24px 0}
  .sign{font-size:15px;color:#F0EBF8;line-height:1.6}
  .footer{background:rgba(0,0,0,0.4);padding:20px 32px;text-align:center;border-top:1px solid rgba(139,92,246,0.1)}
  .footer a{color:#8B5CF6;text-decoration:none;font-size:12px}
  .footer p{font-size:11px;color:#9D8CB5;margin:6px 0 0}
</style></head>
<body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <div class="logo">✦ AETHERA</div>
      <div class="logo-sub">Ancient Wisdom · Modern Technology</div>
      <span class="symbol">🌟</span>
    </div>
    <div class="body">
      <div class="greeting">${c.greeting},</div>
      <p>${c.p1}</p>
      <p>${c.p2}</p>
      <div class="divider"></div>
      <p>${c.p3}</p>
      <div class="cta-wrap">
        <a href="https://aethera.pl#download" class="cta-btn">${c.cta} ✦</a>
      </div>
      <div class="divider"></div>
      <div class="sign">${c.sign}</div>
    </div>
    <div class="footer">
      <a href="https://aethera.pl">aethera.pl</a>
      <p>© 2026 Aethera DuniAI & Oracle · <a href="https://aethera.pl#legal">Privacy Policy</a></p>
    </div>
  </div>
</div>
</body></html>`,
  };
}

function welcomeEmail({ name, lang }) {
  // Welcome email for early-access/waitlist signup — English by default
  const copy = {
    en: {
      subject: 'Welcome to Aethera ✦ Your spiritual journey begins',
      greeting: `Welcome${name ? `, ${name}` : ''}`,
      headline: 'Your Soul Has Found Its Compass',
      p1: "You're on the list. We'll notify you the moment Aethera launches in your region — and we'll make sure it's worth the wait.",
      p2: 'Aethera brings together over <strong>130 spiritual features</strong> — AI Oracle, tarot, horoscopes, numerology, rituals, meditations, sound healing, and a living community of seekers from around the world.',
      features: [
        { icon: '🔮', text: 'AI Oracle — ask anything, receive cosmic wisdom' },
        { icon: '🌙', text: 'Daily tarot, horoscopes & moon rituals' },
        { icon: '🧘', text: 'Guided meditations & breathwork' },
        { icon: '🌊', text: 'Sound baths, binaural beats, healing frequencies' },
        { icon: '👁', text: 'Shadow work, dream interpreter, numerology' },
        { icon: '✨', text: 'Community — live rituals, energy circles, soul match' },
      ],
      p3: "Until launch, follow the stars. We'll see you on the other side.",
      cta: 'Explore Aethera',
      sign: 'With love and stardust,<br><strong>Tomasz & The Aethera Team</strong>',
    },
    pl: {
      subject: 'Witaj w Aetherze ✦ Twoja podróż duchowa się zaczyna',
      greeting: `Witaj${name ? `, ${name}` : ''}`,
      headline: 'Twoja Dusza Znalazła Swój Kompas',
      p1: 'Jesteś na liście. Powiadomimy Cię w chwili, gdy Aethera będzie dostępna — i zadbamy, żeby warto było czekać.',
      p2: 'Aethera łączy ponad <strong>130 funkcji duchowych</strong> — Oracle AI, tarot, horoskopy, numerologię, rytuały, medytacje, uzdrawianie dźwiękiem i żywą społeczność poszukiwaczy z całego świata.',
      features: [
        { icon: '🔮', text: 'Oracle AI — zadaj pytanie, otrzymaj kosmiczną mądrość' },
        { icon: '🌙', text: 'Codzienny tarot, horoskopy i rytuały księżycowe' },
        { icon: '🧘', text: 'Medytacje prowadzone i techniki oddechowe' },
        { icon: '🌊', text: 'Kąpiele dźwiękowe, fale dwójkowe, częstotliwości uzdrawiające' },
        { icon: '👁', text: 'Praca z Cieniem, interpretacja snów, numerologia' },
        { icon: '✨', text: 'Społeczność — rytuały na żywo, kręgi energii, Soul Match' },
      ],
      p3: 'Do premiery — podążaj za gwiazdami. Zobaczymy się po drugiej stronie.',
      cta: 'Odkryj Aetherę',
      sign: 'Z miłością i gwiazdami,<br><strong>Tomasz i Zespół Aethera</strong>',
    },
  };
  const c = copy[lang] || copy.en;

  const featuresHtml = c.features.map(f =>
    `<tr><td style="padding:10px 0;vertical-align:top">
      <table style="width:100%"><tr>
        <td style="width:36px;vertical-align:middle">
          <span style="font-size:22px">${f.icon}</span>
        </td>
        <td style="vertical-align:middle;padding-left:12px;font-size:14px;color:#C4B5FD;line-height:1.5">${f.text}</td>
      </tr></table>
      <div style="height:1px;background:rgba(139,92,246,0.1);margin-top:10px"></div>
    </td></tr>`
  ).join('');

  return {
    subject: c.subject,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#04020C;font-family:'Inter',Arial,sans-serif;color:#F0EBF8}
  .wrap{max-width:600px;margin:0 auto;padding:32px 16px}
  .card{background:linear-gradient(160deg,#0D0520,#120828,#0a0318);border:1px solid rgba(206,174,114,0.3);border-radius:24px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.6)}
  .header{background:linear-gradient(160deg,#1e0a40,#120520,#0a0318);padding:48px 32px;text-align:center;position:relative;border-bottom:1px solid rgba(206,174,114,0.15)}
  .stars{font-size:13px;letter-spacing:8px;color:rgba(206,174,114,0.4);margin-bottom:20px;display:block}
  .logo{font-family:Georgia,serif;font-size:36px;font-weight:700;letter-spacing:6px;background:linear-gradient(135deg,#CEAE72,#E8C87A,#A78BFA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .logo-sub{font-size:10px;letter-spacing:5px;color:#9D8CB5;margin-top:8px;text-transform:uppercase}
  .headline{font-family:Georgia,serif;font-size:22px;line-height:1.4;background:linear-gradient(135deg,#F0EBF8,#C4B5FD);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:24px 0 8px}
  .badge{display:inline-block;background:linear-gradient(135deg,rgba(206,174,114,0.15),rgba(139,92,246,0.15));border:1px solid rgba(206,174,114,0.3);border-radius:20px;padding:6px 18px;font-size:11px;font-weight:700;letter-spacing:2px;color:#CEAE72;text-transform:uppercase}
  .body{padding:36px 32px}
  p{font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 18px}
  .features-table{width:100%;margin:24px 0;background:rgba(255,255,255,0.02);border:1px solid rgba(139,92,246,0.15);border-radius:16px;padding:4px 16px;box-sizing:border-box}
  .cta-wrap{text-align:center;margin:32px 0}
  .cta-btn{display:inline-block;background:linear-gradient(135deg,#8B5CF6,#CEAE72);color:#fff;text-decoration:none;padding:18px 44px;border-radius:16px;font-weight:700;font-size:16px;letter-spacing:0.5px;box-shadow:0 0 40px rgba(139,92,246,0.4);border:1px solid rgba(206,174,114,0.3)}
  .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent);margin:28px 0}
  .sign{font-size:15px;color:#F0EBF8;line-height:1.8}
  .footer{background:rgba(0,0,0,0.5);padding:20px 32px;text-align:center;border-top:1px solid rgba(139,92,246,0.1)}
  .footer a{color:#8B5CF6;text-decoration:none;font-size:12px;margin:0 6px}
  .footer p{font-size:11px;color:rgba(157,140,181,0.6);margin:8px 0 0}
</style></head>
<body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <span class="stars">· · · ✦ · · ·</span>
      <div class="logo">AETHERA</div>
      <div class="logo-sub">Ancient Wisdom · Modern Technology · Your Soul</div>
      <div class="headline">${c.headline}</div>
      <div class="badge">✦ You're on the list</div>
    </div>
    <div class="body">
      <p><strong style="color:#F0EBF8;font-size:17px">${c.greeting},</strong></p>
      <p>${c.p1}</p>
      <p>${c.p2}</p>
      <table class="features-table" cellpadding="0" cellspacing="0">${featuresHtml}</table>
      <div class="cta-wrap">
        <a href="https://aethera.pl" class="cta-btn">${c.cta} ✦</a>
      </div>
      <div class="divider"></div>
      <p>${c.p3}</p>
      <div class="sign">${c.sign}</div>
    </div>
    <div class="footer">
      <a href="https://aethera.pl">aethera.pl</a> ·
      <a href="https://aethera.pl#legal">Privacy Policy</a> ·
      <a href="mailto:contact@aethera.pl">contact@aethera.pl</a>
      <p>© 2026 Aethera DuniAI & Oracle. All rights reserved.</p>
    </div>
  </div>
</div>
</body></html>`,
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

async function sendResend(env, { from, to, subject, html, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, reply_to: replyTo }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── GOOGLE SHEETS ─────────────────────────────────────────────────────────────
async function appendToSheets(env, row) {
  if (!env.GOOGLE_SHEETS_ID || !env.GOOGLE_SERVICE_ACCOUNT_JSON) return;
  try {
    const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const token = await getGoogleToken(sa);
    const range = 'Leads!A:J';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_ID}/values/${range}:append?valueInputOption=RAW`;
    await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    });
  } catch (e) {
    console.error('Sheets error:', e.message);
  }
}

async function getGoogleToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = btoa(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now,
  }));
  const unsigned = `${header}.${claim}`;
  // Sign with RSA-SHA256
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json();
  return data.access_token;
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────
async function handleContact(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (isRateLimited(ip)) return json({ ok: false, error: 'Too many requests' }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400); }

  const { name, email, company, subject, message, lang, honeypot, ua } = body;

  // Honeypot check
  if (honeypot) return json({ ok: true }); // silently discard bots

  // Validation
  if (!isValidEmail(email)) return json({ ok: false, error: 'Invalid email' }, 400);
  if (!message || message.trim().length < 5) return json({ ok: false, error: 'Message too short' }, 400);

  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // 1. Notify admin
  await sendResend(env, {
    from: 'Aethera Contact <noreply@aethera.pl>',
    to: 'contact@aethera.pl',
    subject: `[Contact] ${subject || 'New message'} — ${name || email}`,
    html: adminContactEmail({ name, email, company, subject, message, lang, ua, ts }),
    replyTo: email,
  });

  // 2. Autoresponder to user
  const auto = autoresponderEmail({ name, lang });
  await sendResend(env, {
    from: 'Aethera Team <contact@aethera.pl>',
    to: email,
    subject: auto.subject,
    html: auto.html,
  });

  // 3. Save to Google Sheets
  await appendToSheets(env, [
    ts, name || '', email, company || '', subject || '', message, 'contact_form',
    lang || 'pl', ua || '', 'new',
  ]);

  return json({ ok: true });
}

async function handleSignup(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (isRateLimited(ip)) return json({ ok: false, error: 'Too many requests' }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400); }

  const { name, email, lang, honeypot, ua } = body;

  if (honeypot) return json({ ok: true });
  if (!isValidEmail(email)) return json({ ok: false, error: 'Invalid email' }, 400);

  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // 1. Notify admin
  await sendResend(env, {
    from: 'Aethera Signups <noreply@aethera.pl>',
    to: 'contact@aethera.pl',
    subject: `[Signup] ${name || email} — Early Access Request`,
    html: `<div style="font-family:Arial;background:#04020C;color:#F0EBF8;padding:24px;border-radius:12px;max-width:500px">
      <h2 style="color:#CEAE72;margin:0 0 16px">✦ New Early Access Signup</h2>
      <p><strong>Name:</strong> ${escHtml(name || '—')}</p>
      <p><strong>Email:</strong> ${escHtml(email)}</p>
      <p><strong>Language:</strong> ${escHtml(lang || 'pl')}</p>
      <p><strong>Time:</strong> ${ts}</p>
    </div>`,
    replyTo: email,
  });

  // 2. Welcome email to user
  const welcome = welcomeEmail({ name, lang });
  await sendResend(env, {
    from: 'Aethera Team <contact@aethera.pl>',
    to: email,
    subject: welcome.subject,
    html: welcome.html,
  });

  // 3. Save to Sheets
  await appendToSheets(env, [
    ts, name || '', email, '', 'Early Access Signup', '', 'signup_form',
    lang || 'pl', ua || '', 'new',
  ]);

  return json({ ok: true });
}

// ─── MAIN FETCH HANDLER ───────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405);
    }

    try {
      if (url.pathname === '/api/contact') return handleContact(request, env);
      if (url.pathname === '/api/signup')  return handleSignup(request, env);
      return json({ ok: false, error: 'Not found' }, 404);
    } catch (err) {
      console.error(err);
      return json({ ok: false, error: 'Internal error' }, 500);
    }
  },
};
