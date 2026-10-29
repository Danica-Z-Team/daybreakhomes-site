// Vercel serverless function: contact form -> Follow Up Boss.
// Nothing is forwarded to FUB unless every check below passes.
//
// Environment variables (set in Vercel > Settings > Environment Variables, never in code):
//   FUB_API_KEY            Follow Up Boss API key
//   TURNSTILE_SECRET_KEY   Cloudflare Turnstile secret key
//   EXTRA_ALLOWED_ORIGINS  (optional) comma-separated extra origins, e.g. a Vercel preview URL

const ALLOWED_ORIGINS = new Set([
  'https://www.daybreakhomes.com',
  'https://daybreakhomes.com',
]);
(process.env.EXTRA_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .forEach((o) => ALLOWED_ORIGINS.add(o));

const MIN_FILL_MS = 3000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamailblock.com', 'sharklasers.com', 'grr.la',
  '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org',
  'temp-mail.io', 'tempmail.net', 'tempr.email', 'throwawaymail.com', 'yopmail.com',
  'yopmail.net', 'trashmail.com', 'trashmail.net', 'getnada.com', 'nada.email',
  'maildrop.cc', 'dispostable.com', 'fakeinbox.com', 'mintemail.com', 'moakt.com',
  'emailondeck.com', 'mohmal.com', 'discard.email', 'mailnesia.com', 'spamgourmet.com',
  'mytemp.email', 'tmpmail.org', 'tmpmail.net', 'burnermail.io', 'inboxkitten.com',
  'mail.tm', 'emltmp.com', 'fakemail.net', 'owlymail.com', 'dropmail.me',
]);
const DISPOSABLE_SUFFIXES = ['.my.id'];

const CYRILLIC = /[Ѐ-ԯ]/;
const URL_LIKE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|info|biz|ru|io|co|me|xyz|top|site|online|shop|club|link|click|id)\b)/i;

function getOrigin(req) {
  const origin = req.headers.origin;
  if (origin) return origin;
  const referer = req.headers.referer || req.headers.referrer;
  if (!referer) return '';
  try {
    return new URL(referer).origin;
  } catch (e) {
    return '';
  }
}

function normalizeUsPhone(raw) {
  const digits = String(raw).replace(/\D/g, '');
  const ten = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits;
  if (ten.length !== 10) return null;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(ten)) return null; // valid area code + exchange
  if (/^(\d)\1{9}$/.test(ten)) return null;             // 5555555555 etc.
  return ten;
}

function isDisposableEmail(email) {
  const domain = email.split('@')[1].toLowerCase();
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  return DISPOSABLE_SUFFIXES.some((s) => domain.endsWith(s));
}

async function verifyTurnstile(token, ip) {
  const params = new URLSearchParams();
  params.append('secret', process.env.TURNSTILE_SECRET_KEY);
  params.append('response', token);
  if (ip) params.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: params,
    signal: AbortSignal.timeout(10000),
  });
  return r.json();
}

module.exports = async function handler(req, res) {
  // Rejections look like successes to the sender so bots don't adapt; the reason is logged.
  const reject = (reason) => {
    console.warn('Contact form rejected:', reason);
    return res.status(200).json({ ok: true });
  };

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 5. Own domain only
  const origin = getOrigin(req);
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return reject('origin not allowed: ' + (origin || 'none'));
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== 'object') return reject('unparseable body');

  const { name, email, phone, message, company_website, form_ts, turnstileToken } = body;

  // 2. Server-side honeypot
  if (company_website) return reject('honeypot filled');

  // 3. Timing check
  const ts = Number(form_ts);
  const elapsed = Date.now() - ts;
  if (!form_ts || !Number.isFinite(ts)) return reject('missing timestamp');
  if (elapsed < MIN_FILL_MS) return reject('submitted too fast: ' + elapsed + 'ms');
  if (elapsed > MAX_AGE_MS) return reject('stale timestamp');

  // 4. Field validation
  const fields = { name, email, phone, message };
  for (const key of Object.keys(fields)) {
    const v = fields[key];
    if (v !== undefined && v !== null && typeof v !== 'string') return reject('non-string field: ' + key);
  }
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').trim();
  const cleanMessage = (message || '').trim();

  if (!cleanName || cleanName.length > 100) return reject('bad name length');
  if (cleanMessage.length > 2000) return reject('message too long');
  if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return reject('invalid email');

  for (const key of ['name', 'email', 'phone', 'message']) {
    if (CYRILLIC.test(fields[key] || '')) return reject('cyrillic in ' + key);
  }
  // URLs: checked on free-text fields only (an email address legitimately contains a domain)
  if (URL_LIKE.test(cleanName)) return reject('url in name');
  if (URL_LIKE.test(cleanMessage)) return reject('url in message');
  if (URL_LIKE.test(cleanPhone)) return reject('url in phone');

  if (isDisposableEmail(cleanEmail)) return reject('disposable email domain: ' + cleanEmail.split('@')[1]);

  let normalizedPhone = null;
  if (cleanPhone) {
    normalizedPhone = normalizeUsPhone(cleanPhone);
    if (!normalizedPhone) return reject('invalid US phone');
  }

  // 1. Cloudflare Turnstile
  if (!process.env.TURNSTILE_SECRET_KEY || !process.env.FUB_API_KEY) {
    console.error('Missing TURNSTILE_SECRET_KEY or FUB_API_KEY environment variable');
    return res.status(500).json({ error: 'Server is not configured yet.' });
  }
  if (!turnstileToken || typeof turnstileToken !== 'string' || turnstileToken.length > 2048) {
    return reject('missing or oversized turnstile token');
  }

  const ip = ((req.headers['x-forwarded-for'] || '').split(',')[0] || '').trim();
  try {
    const verdict = await verifyTurnstile(turnstileToken, ip);
    if (!verdict.success) return reject('turnstile failed: ' + (verdict['error-codes'] || []).join(','));
    if (verdict.action !== 'contact') return reject('turnstile action mismatch: ' + verdict.action);
    if (verdict.hostname) {
      const host = verdict.hostname.toLowerCase();
      const hostOk = Array.from(ALLOWED_ORIGINS).some((o) => {
        try { return new URL(o).hostname === host; } catch (e) { return false; }
      });
      if (!hostOk) return reject('turnstile hostname mismatch: ' + host);
    }
  } catch (err) {
    console.error('Turnstile verification error', err);
    return res.status(502).json({ error: 'Could not verify.' });
  }

  // Passed every check: send to Follow Up Boss
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  const auth = Buffer.from(`${process.env.FUB_API_KEY}:`).toString('base64');

  try {
    const fubResponse = await fetch('https://api.followupboss.com/v1/events', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        source: 'DaybreakHomes.com',
        system: 'Website Contact Form',
        type: 'General Inquiry',
        message: cleanMessage,
        person: {
          firstName,
          lastName,
          emails: [{ value: cleanEmail }],
          phones: normalizedPhone ? [{ value: normalizedPhone }] : [],
          tags: ['Website Lead', 'DaybreakHomes'],
        },
      }),
    });

    if (!fubResponse.ok) {
      const detail = await fubResponse.text();
      console.error('FUB error', fubResponse.status, detail);
      return res.status(502).json({ error: 'Could not submit to CRM.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form error', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};
