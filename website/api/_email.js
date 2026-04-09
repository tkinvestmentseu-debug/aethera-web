/**
 * Shared email templates + Resend sender
 * Used by both signup.js and contact.js
 */

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Welcome / Signup email ───────────────────────────────────────────────────
function welcomeHtml({ name, lang }) {
  const features = [
    ['🔮', 'AI Oracle — ask anything, receive cosmic wisdom'],
    ['🌙', 'Daily tarot cards, horoscopes & moon rituals'],
    ['🧘', 'Guided meditations & breathwork sessions'],
    ['🌊', 'Sound baths, binaural beats & healing frequencies'],
    ['👁', 'Shadow work, dream interpreter & numerology'],
    ['✨', 'Community — live rituals, energy circles, soul match'],
  ];

  const greeting = name ? `Welcome, ${esc(name)}` : 'Welcome';

  const featureRows = features.map(([icon, text]) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid rgba(139,92,246,0.10)">
        <table cellpadding="0" cellspacing="0" style="width:100%"><tr>
          <td style="width:38px;vertical-align:middle;font-size:22px">${icon}</td>
          <td style="padding-left:14px;font-size:14px;color:#C4B5FD;line-height:1.55;vertical-align:middle">${text}</td>
        </tr></table>
      </td>
    </tr>`).join('');

  return {
    subject: 'Welcome to Aethera ✦ Your world of magic begins now',
    html: `<!DOCTYPE html><html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Welcome to Aethera ✦</title></head>
<body style="margin:0;padding:0;background-color:#04020C;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">

<!--[if mso]><table width="100%"><tr><td><![endif]-->
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#04020C;min-height:100vh">
<tr><td align="center" style="padding:32px 16px">

  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;border:1px solid rgba(206,174,114,0.28);box-shadow:0 40px 80px rgba(0,0,0,0.7),0 0 60px rgba(139,92,246,0.12)">

    <!-- ── HERO HEADER ── -->
    <tr><td style="background:linear-gradient(160deg,#1a0840 0%,#0f0520 50%,#080318 100%);padding:52px 40px 48px;text-align:center;border-bottom:1px solid rgba(206,174,114,0.15)">
      <!-- Stars -->
      <div style="font-size:13px;letter-spacing:10px;color:rgba(206,174,114,0.40);margin-bottom:24px">· · ✦ · · ✦ · ·</div>
      <!-- Logo -->
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:40px;font-weight:700;letter-spacing:8px;margin-bottom:4px;background:linear-gradient(135deg,#CEAE72 0%,#E8C87A 50%,#A78BFA 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;color:#CEAE72">AETHERA</div>
      <div style="font-size:10px;letter-spacing:4px;color:#9D8CB5;text-transform:uppercase;margin-bottom:32px">DuniAI &amp; Oracle</div>
      <!-- Main headline -->
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.35;color:#F0EBF8;margin-bottom:14px">Welcome to the World of Magic</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.5;color:#C4B5FD;margin-bottom:28px">Your soul has found its compass.</div>
      <!-- Badge -->
      <div style="display:inline-block;background:linear-gradient(135deg,rgba(206,174,114,0.15),rgba(139,92,246,0.15));border:1px solid rgba(206,174,114,0.35);border-radius:30px;padding:9px 24px;font-size:11px;font-weight:700;letter-spacing:2px;color:#CEAE72;text-transform:uppercase">✦ Account Created</div>
    </td></tr>

    <!-- ── BODY ── -->
    <tr><td style="background:linear-gradient(180deg,#0D0520,#0a0318);padding:40px 40px 32px">

      <!-- Greeting -->
      <p style="font-size:20px;font-weight:600;color:#F0EBF8;margin:0 0 18px;line-height:1.4">${greeting},</p>

      <!-- Intro -->
      <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 16px">You've just stepped through the portal. Your Aethera account is ready — a sanctuary where <strong style="color:#F0EBF8">ancient wisdom meets modern technology</strong>, and your spiritual journey truly begins.</p>
      <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 28px">With over <strong style="color:#F0EBF8">130 spiritual features</strong> at your fingertips, you have everything you need to explore, heal, and grow:</p>

      <!-- Features table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.025);border:1px solid rgba(139,92,246,0.18);border-radius:16px;padding:8px 20px;margin-bottom:36px">
        ${featureRows}
      </table>

      <!-- Download CTA section -->
      <div style="background:linear-gradient(135deg,rgba(206,174,114,0.06),rgba(139,92,246,0.08));border:1px solid rgba(206,174,114,0.20);border-radius:18px;padding:28px 24px;text-align:center;margin-bottom:32px">
        <div style="font-family:Georgia,serif;font-size:17px;color:#F0EBF8;margin-bottom:8px">Download Aethera today</div>
        <div style="font-size:13px;color:#9D8CB5;margin-bottom:22px">Available on iOS &amp; Android — free to download</div>
        <a href="https://aethera.pl#download" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#A78BFA,#CEAE72);color:#ffffff;text-decoration:none;padding:16px 44px;border-radius:14px;font-weight:700;font-size:16px;letter-spacing:0.5px;box-shadow:0 0 40px rgba(139,92,246,0.40);border:1px solid rgba(206,174,114,0.2)">Download the App ✦</a>
      </div>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent);padding:0;margin-bottom:28px"></td></tr></table>

      <!-- Closing -->
      <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:16px 0 20px">The stars have been waiting for you. May every session bring you clarity, healing, and wonder.</p>
      <p style="font-size:15px;line-height:1.8;color:#F0EBF8;margin:0">With love and stardust,<br><strong>Tomasz &amp; The Aethera Team</strong></p>

    </td></tr>

    <!-- ── FOOTER ── -->
    <tr><td style="background:rgba(0,0,0,0.5);padding:22px 40px;text-align:center;border-top:1px solid rgba(139,92,246,0.10)">
      <p style="margin:0 0 8px">
        <a href="https://aethera.pl" style="color:#8B5CF6;text-decoration:none;font-size:13px;margin:0 8px">aethera.pl</a>
        <span style="color:rgba(157,140,181,0.4)">·</span>
        <a href="https://aethera.pl#legal" style="color:#8B5CF6;text-decoration:none;font-size:13px;margin:0 8px">Privacy Policy</a>
        <span style="color:rgba(157,140,181,0.4)">·</span>
        <a href="mailto:contact@aethera.pl" style="color:#8B5CF6;text-decoration:none;font-size:13px;margin:0 8px">contact@aethera.pl</a>
      </p>
      <p style="margin:0;font-size:11px;color:rgba(157,140,181,0.5)">© 2026 Aethera DuniAI &amp; Oracle. All rights reserved.</p>
    </td></tr>

  </table>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</body></html>`,
  };
}

// ─── Admin notification email ─────────────────────────────────────────────────
function adminNotifyHtml({ type, name, email, company, subject, message, lang, ua, ts }) {
  const isContact = type === 'contact';
  const color = isContact ? '#8B5CF6' : '#10B981';
  const label = isContact ? '📨 New Contact Form' : '🌟 New Signup / Early Access';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#04020C;font-family:Arial,sans-serif;color:#F0EBF8">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#04020C;padding:24px 16px"><tr><td align="center">
<table width="580" style="max-width:580px;background:linear-gradient(135deg,#0D0520,#120828);border:1px solid rgba(139,92,246,0.3);border-radius:18px;overflow:hidden">
  <tr><td style="background:linear-gradient(135deg,#1a0835,#0f0520);padding:28px 32px;border-bottom:1px solid rgba(139,92,246,0.15)">
    <div style="font-family:Georgia,serif;font-size:24px;font-weight:700;letter-spacing:4px;color:#CEAE72">✦ AETHERA</div>
    <div style="display:inline-block;background:rgba(${isContact ? '139,92,246' : '16,185,129'},0.15);border:1px solid rgba(${isContact ? '139,92,246' : '16,185,129'},0.3);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:700;letter-spacing:2px;color:${color};margin-top:10px;text-transform:uppercase">${label}</div>
  </td></tr>
  <tr><td style="padding:28px 32px">
    ${[
      ['Name', name || '—'],
      ['Email', email],
      ...(company ? [['Company', company]] : []),
      ...(subject ? [['Subject', subject]] : []),
      ...(isContact && message ? [['Message', message]] : []),
      ['Language', lang || 'pl'],
      ['Time', ts],
    ].map(([l, v]) => `
    <div style="margin-bottom:16px">
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#CEAE72;text-transform:uppercase;margin-bottom:6px">${l}</div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(139,92,246,0.18);border-radius:10px;padding:11px 14px;font-size:14px;color:#F0EBF8;white-space:pre-wrap;word-break:break-word;line-height:1.6">${esc(v)}</div>
    </div>`).join('')}
    <div style="margin-top:20px">
      <a href="mailto:${esc(email)}?subject=Re%3A ${encodeURIComponent(subject || 'Aethera')}" style="display:inline-block;background:linear-gradient(135deg,${color},${color}BB);color:#fff;text-decoration:none;padding:11px 22px;border-radius:10px;font-weight:700;font-size:13px">↩ Reply to ${esc(name || email)}</a>
    </div>
  </td></tr>
  <tr><td style="background:rgba(0,0,0,0.35);padding:14px 32px;border-top:1px solid rgba(139,92,246,0.1);font-size:11px;color:#9D8CB5">
    📍 Source: aethera.pl &nbsp;·&nbsp; 🌐 ${esc(lang || 'pl')} &nbsp;·&nbsp; 🕐 ${esc(ts)}
    ${ua ? `<br><span style="opacity:0.5">🖥 ${esc(ua.slice(0, 90))}</span>` : ''}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ─── Autoresponder (contact form) ─────────────────────────────────────────────
function autoresponderHtml({ name, lang }) {
  const copy = {
    en: {
      subject: 'Thank you for reaching out ✦ Aethera',
      greeting: `Hello ${name || 'there'}`,
      p1: "Thank you for reaching out to Aethera. We've received your message and will get back to you within 24–48 hours.",
      p2: 'If your inquiry is urgent, you can always write directly to <a href="mailto:contact@aethera.pl" style="color:#A78BFA">contact@aethera.pl</a>.',
      p3: "In the meantime, if you haven't already, download Aethera and explore 130+ spiritual features.",
      cta: 'Download Aethera',
      sign: 'With love and stardust,<br><strong>The Aethera Team</strong>',
    },
    pl: {
      subject: 'Dziękujemy za wiadomość ✦ Aethera',
      greeting: `Cześć ${name || ''}`,
      p1: 'Dziękujemy za kontakt z Aetherą. Otrzymaliśmy Twoją wiadomość i odpiszemy w ciągu 24–48 godzin.',
      p2: 'Jeśli sprawa jest pilna, możesz napisać bezpośrednio na <a href="mailto:contact@aethera.pl" style="color:#A78BFA">contact@aethera.pl</a>.',
      p3: 'Tymczasem — pobierz Aetherę i odkryj ponad 130 funkcji duchowych.',
      cta: 'Pobierz Aetherę',
      sign: 'Z miłością i gwiazdami,<br><strong>Zespół Aethera</strong>',
    },
  };
  const c = copy[lang] || copy.en;
  return {
    subject: c.subject,
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#04020C;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#04020C;padding:32px 16px"><tr><td align="center">
<table width="580" style="max-width:580px;background:linear-gradient(160deg,#0D0520,#0a0318);border:1px solid rgba(139,92,246,0.32);border-radius:22px;overflow:hidden">
  <tr><td style="background:linear-gradient(160deg,#1a0840,#0f0520);padding:40px;text-align:center;border-bottom:1px solid rgba(206,174,114,0.12)">
    <div style="font-size:13px;letter-spacing:8px;color:rgba(206,174,114,0.35);margin-bottom:18px">· · ✦ · ·</div>
    <div style="font-family:Georgia,serif;font-size:30px;font-weight:700;letter-spacing:6px;color:#CEAE72">AETHERA</div>
    <div style="font-size:9px;letter-spacing:4px;color:#9D8CB5;margin-top:6px;text-transform:uppercase">Ancient Wisdom · Modern Technology</div>
  </td></tr>
  <tr><td style="padding:36px 40px">
    <p style="font-size:18px;color:#F0EBF8;margin:0 0 18px;font-weight:600">${c.greeting},</p>
    <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 14px">${c.p1}</p>
    <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 14px">${c.p2}</p>
    <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.25),transparent);margin:24px 0"></div>
    <p style="font-size:15px;line-height:1.75;color:#C4B5FD;margin:0 0 22px">${c.p3}</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:28px">
      <a href="https://aethera.pl#download" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#CEAE72);color:#fff;text-decoration:none;padding:15px 38px;border-radius:14px;font-weight:700;font-size:15px">${c.cta} ✦</a>
    </td></tr></table>
    <p style="font-size:15px;line-height:1.8;color:#F0EBF8;margin:0">${c.sign}</p>
  </td></tr>
  <tr><td style="background:rgba(0,0,0,0.4);padding:18px 40px;text-align:center;border-top:1px solid rgba(139,92,246,0.08)">
    <p style="margin:0 0 6px"><a href="https://aethera.pl" style="color:#8B5CF6;font-size:12px;text-decoration:none">aethera.pl</a> · <a href="https://aethera.pl#legal" style="color:#8B5CF6;font-size:12px;text-decoration:none">Privacy Policy</a></p>
    <p style="margin:0;font-size:11px;color:rgba(157,140,181,0.5)">© 2026 Aethera DuniAI &amp; Oracle</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  };
}

module.exports = { sendResend, welcomeHtml, adminNotifyHtml, autoresponderHtml, esc };
