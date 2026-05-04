import { deflateSync } from 'node:zlib';

export const config = {
  maxDuration: 60
};

const IMAGEN_MODELS = ['imagen-4.0-generate-001', 'imagen-3.0-generate-002'];
const GEMINI_IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
  'gemini-3.1-flash-image-preview'
];

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);

  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
  }
  return raw ? JSON.parse(raw) : {};
}

function toImagePayload(bytesBase64Encoded, mimeType, meta = {}) {
  return {
    imageUrl: `data:${mimeType};base64,${bytesBase64Encoded}`,
    predictions: [{ bytesBase64Encoded, mimeType }],
    ...meta
  };
}

function parseImagenResponse(data) {
  const prediction = data?.predictions?.find((item) => item?.bytesBase64Encoded || item?.image?.bytesBase64Encoded);
  const bytesBase64Encoded = prediction?.bytesBase64Encoded || prediction?.image?.bytesBase64Encoded;
  if (!bytesBase64Encoded) return null;

  return {
    bytesBase64Encoded,
    mimeType: prediction?.mimeType || prediction?.image?.mimeType || 'image/png'
  };
}

function parseGeminiImageResponse(data) {
  const parts = data?.candidates?.flatMap((candidate) => candidate?.content?.parts || []) || [];
  const inlineData = parts
    .map((part) => part?.inlineData || part?.inline_data)
    .find((item) => item?.data);

  if (!inlineData?.data) return null;

  return {
    bytesBase64Encoded: inlineData.data,
    mimeType: inlineData.mimeType || inlineData.mime_type || 'image/png'
  };
}

async function postJson(url, apiKey, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000)
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { raw: text };
  }

  return { response, data, text };
}

async function tryImagen(prompt, apiKey, model) {
  const { response, data, text } = await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`,
    apiKey,
    {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        personGeneration: 'allow_adult',
        aspectRatio: '1:1'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Imagen ${model} failed ${response.status}: ${text.slice(0, 500)}`);
  }

  const image = parseImagenResponse(data);
  if (!image) {
    throw new Error(`Imagen ${model} returned no image`);
  }

  return toImagePayload(image.bytesBase64Encoded, image.mimeType, {
    provider: 'imagen',
    model
  });
}

async function tryGeminiImage(prompt, apiKey, model) {
  const { response, data, text } = await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    apiKey,
    {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE']
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini image ${model} failed ${response.status}: ${text.slice(0, 500)}`);
  }

  const image = parseGeminiImageResponse(data);
  if (!image) {
    throw new Error(`Gemini image ${model} returned no image`);
  }

  return toImagePayload(image.bytesBase64Encoded, image.mimeType, {
    provider: 'gemini',
    model
  });
}

function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createFallbackPng(prompt) {
  const width = 512;
  const height = 512;
  const accent = prompt.includes('58') ? [245, 158, 11] : prompt.includes('28') ? [56, 189, 248] : [251, 113, 133];
  const raw = Buffer.alloc((width * 4 + 1) * height);

  const setPixel = (x, y, rgba) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const offset = y * (width * 4 + 1) + 1 + x * 4;
    raw[offset] = rgba[0];
    raw[offset + 1] = rgba[1];
    raw[offset + 2] = rgba[2];
    raw[offset + 3] = rgba[3] ?? 255;
  };

  const blend = (base, top, alpha) => base.map((value, index) => Math.round(value * (1 - alpha) + top[index] * alpha));

  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const dx = x - width / 2;
      const dy = y - height / 3;
      const glow = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 390);
      const base = blend([226, 232, 240], [236, 254, 255], glow);
      setPixel(x, y, [...base, 255]);
    }
  }

  const drawCircle = (cx, cy, radius, color) => {
    const r2 = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const distance = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (distance <= r2) setPixel(x, y, color);
      }
    }
  };

  const drawLine = (x1, y1, x2, y2, color, thickness = 3) => {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x1 + ((x2 - x1) * i) / steps);
      const y = Math.round(y1 + ((y2 - y1) * i) / steps);
      drawCircle(x, y, thickness, color);
    }
  };

  drawCircle(256, 184, 92, [248, 250, 252, 255]);
  drawCircle(256, 184, 98, [...accent, 120]);
  drawCircle(256, 184, 84, [248, 250, 252, 255]);

  for (let y = 278; y < 455; y++) {
    const t = (y - 278) / 177;
    const halfWidth = 62 + Math.sin(t * Math.PI) * 130;
    for (let x = Math.floor(256 - halfWidth); x <= Math.ceil(256 + halfWidth); x++) {
      setPixel(x, y, [248, 250, 252, 255]);
    }
  }

  drawLine(95, 120, 170, 330, [...accent, 180], 4);
  drawLine(417, 120, 342, 330, [...accent, 180], 4);
  drawLine(120, 220, 392, 220, [...accent, 85], 2);
  drawLine(154, 382, 358, 382, [...accent, 110], 3);

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND')
  ]).toString('base64');
}

function fallbackImage(prompt, reason) {
  return toImagePayload(createFallbackPng(prompt), 'image/png', {
    provider: 'fallback',
    model: 'local-png',
    fallbackReason: reason
  });
}

export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
  const preferredModel = process.env.GOOGLE_IMAGE_MODEL?.trim();
  const imagenModels = preferredModel?.startsWith('imagen') ? [preferredModel, ...IMAGEN_MODELS.filter((model) => model !== preferredModel)] : IMAGEN_MODELS;
  const geminiModels = preferredModel?.startsWith('gemini') ? [preferredModel, ...GEMINI_IMAGE_MODELS.filter((model) => model !== preferredModel)] : GEMINI_IMAGE_MODELS;

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      hasApiKey: Boolean(apiKey),
      imagenModels,
      geminiModels
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = await readJsonBody(req);
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    if (!apiKey) {
      return res.status(200).json(fallbackImage(prompt, 'missing GOOGLE_AI_API_KEY'));
    }

    const errors = [];

    for (const model of imagenModels) {
      try {
        return res.status(200).json(await tryImagen(prompt, apiKey, model));
      } catch (error) {
        errors.push(error.message);
      }
    }

    for (const model of geminiModels) {
      try {
        return res.status(200).json(await tryGeminiImage(prompt, apiKey, model));
      } catch (error) {
        errors.push(error.message);
      }
    }

    console.error('All image generation providers failed:', errors);
    return res.status(200).json(fallbackImage(prompt, 'google generation failed'));
  } catch (error) {
    console.error('Image generation proxy failed:', error);
    return res.status(200).json(fallbackImage('Limen-9 patient portrait', 'proxy error'));
  }
}
