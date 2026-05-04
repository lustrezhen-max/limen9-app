async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
  }
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(204).end();
  }

  try {
    const { prompt } = await readJsonBody(req);
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: { prompt },
          parameters: { sampleCount: 1 }
        })
      }
    );

    const text = await googleResponse.text();
    res.status(googleResponse.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(text || '{}');
  } catch (error) {
    return res.status(500).json({ error: 'Image generation proxy failed' });
  }
}
