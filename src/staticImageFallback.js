const STATIC_CASE_IMAGES = [
  {
    url: '/case-8131-f.svg',
    matches: ['58', 'watch', 'mechanical', 'hospital corridor']
  },
  {
    url: '/case-4402-s.svg',
    matches: ['28', 'office worker', 'corporate', 'lounge']
  },
  {
    url: '/case-2904-r.svg',
    matches: ['22', 'datapad', 'unanswered', 'futuristic white room']
  }
];

const imageCache = new Map();

function selectStaticImage(prompt = '') {
  const normalized = prompt.toLowerCase();
  return STATIC_CASE_IMAGES.find((item) =>
    item.matches.some((token) => normalized.includes(token.toLowerCase()))
  )?.url || STATIC_CASE_IMAGES[2].url;
}

async function imageToPrediction(originalFetch, imageUrl) {
  if (imageCache.has(imageUrl)) return imageCache.get(imageUrl);

  const response = await originalFetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Static image missing: ${imageUrl}`);
  }

  const blob = await response.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const bytesBase64Encoded = String(dataUrl).split(',')[1] || '';
  const payload = {
    imageUrl: dataUrl,
    predictions: [
      {
        bytesBase64Encoded,
        mimeType: blob.type || 'image/svg+xml'
      }
    ],
    provider: 'static-public',
    model: 'local-case-image'
  };

  imageCache.set(imageUrl, payload);
  return payload;
}

export function installStaticImageFallback() {
  if (typeof window === 'undefined' || window.__limenStaticImageFallbackInstalled) return;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const requestUrl = typeof input === 'string' ? input : input?.url;
    const pathname = requestUrl ? new URL(requestUrl, window.location.href).pathname : '';

    if (pathname === '/api/generate-image') {
      let prompt = '';
      try {
        prompt = JSON.parse(init?.body || '{}')?.prompt || '';
      } catch {
        prompt = '';
      }

      const payload = await imageToPrediction(originalFetch, selectStaticImage(prompt));
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return originalFetch(input, init);
  };

  window.__limenStaticImageFallbackInstalled = true;
}
