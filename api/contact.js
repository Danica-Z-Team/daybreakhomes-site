// Vercel serverless function (works with plain static sites, no Next.js needed).
// Lives at /api/contact.js -> reachable at https://www.daybreakhomes.com/api/contact
//
// Requires one environment variable set in the Vercel dashboard (Settings > Environment
// Variables), NOT in this file: FUB_API_KEY. Get the key from Follow Up Boss under
// Admin > API > Create API Key.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, message, website } = req.body || {};

  // Honeypot: a hidden field real visitors never fill in. If it has a value, it's a bot.
  // Pretend success so the bot doesn't learn anything.
  if (website) {
    return res.status(200).json({ ok: true });
  }

  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone is required.' });
  }

  if (!process.env.FUB_API_KEY) {
    console.error('Missing FUB_API_KEY environment variable');
    return res.status(500).json({ error: 'Server is not configured yet.' });
  }

  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
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
        message: message || '',
        person: {
          firstName,
          lastName,
          emails: email ? [{ value: email }] : [],
          phones: phone ? [{ value: phone }] : [],
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
