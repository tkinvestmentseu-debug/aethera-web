/**
 * Vercel Serverless Function — POST /api/login
 *
 * Signs in a user via Firebase Auth REST API (email + password).
 * FIREBASE_API_KEY is server-side only — never exposed to the client.
 *
 * Body: { email: string, password: string }
 * Returns: 200 { ok: true, email, displayName } | 400 | 401 | 429 | 500
 */

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const rateMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateMap.get(ip) || []).filter(t => now - t < 60_000);
  hits.push(now);
  rateMap.set(ip, hits);
  return hits.length > 10; // slightly higher limit for login
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

  const { email, password } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const firebaseKey = process.env.FIREBASE_API_KEY;
  if (!firebaseKey) return res.status(500).json({ error: 'Server configuration error.' });

  try {
    const fbRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, returnSecureToken: true }),
      }
    );
    const fbData = await fbRes.json();

    if (!fbRes.ok) {
      const code = fbData?.error?.message || 'UNKNOWN';
      if (
        code === 'INVALID_PASSWORD' ||
        code === 'EMAIL_NOT_FOUND' ||
        code === 'INVALID_LOGIN_CREDENTIALS' ||
        code.startsWith('INVALID_LOGIN_CREDENTIALS')
      ) {
        return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' });
      }
      if (code === 'USER_DISABLED') {
        return res.status(401).json({ error: 'USER_DISABLED', message: 'This account has been disabled.' });
      }
      if (code === 'TOO_MANY_ATTEMPTS_TRY_LATER' || code.startsWith('TOO_MANY_ATTEMPTS')) {
        return res.status(429).json({ error: 'Too many failed attempts. Please try again later or reset your password.' });
      }
      console.error('[login] Firebase error:', code);
      return res.status(500).json({ error: 'Login failed. Please try again.' });
    }

    return res.status(200).json({
      ok: true,
      email: fbData.email,
      displayName: fbData.displayName || null,
    });
  } catch (err) {
    console.error('[login] error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};
