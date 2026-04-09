/**
 * Vercel Serverless Function — POST /api/reset-password
 *
 * Sends a Firebase Auth password reset email via the REST API.
 * The Firebase API key is stored server-side as FIREBASE_API_KEY env var —
 * it never appears in any client-side HTML/JS.
 *
 * Body: { email: string }
 * Returns: 200 OK | 400 | 429 | 500
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

// ─── Handler ──────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://aethera.pl');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });

  // Validate input
  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    console.error('FIREBASE_API_KEY env var not set');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: email.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const code = data?.error?.message || 'UNKNOWN';
      if (code === 'EMAIL_NOT_FOUND') {
        // Return success anyway to prevent email enumeration
        return res.status(200).json({ ok: true });
      }
      if (code === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
        return res.status(429).json({ error: 'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.' });
      }
      if (code === 'INVALID_EMAIL') {
        return res.status(400).json({ error: 'Nieprawidłowy format adresu email.' });
      }
      console.error('Firebase reset error:', code);
      return res.status(500).json({ error: 'Nie udało się wysłać emaila. Spróbuj ponownie.', _debug: code });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('reset-password error:', err);
    return res.status(500).json({ error: 'Błąd serwera. Napisz na contact@aethera.pl' });
  }
}
