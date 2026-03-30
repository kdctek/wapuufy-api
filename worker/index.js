/**
 * Cloudflare Worker — CORS proxy for GitHub OAuth Device Flow.
 * Only proxies requests to github.com/login/device/code and
 * github.com/login/oauth/access_token. All other paths are rejected.
 */

const ALLOWED_ORIGINS = [
  'https://api.wapuufy.com',
  'http://localhost:5173',
  'http://localhost:4173',
];

const ALLOWED_PATHS = [
  'https://github.com/login/device/code',
  'https://github.com/login/oauth/access_token',
];

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';

    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('target');

    if (!target || !ALLOWED_PATHS.includes(target)) {
      return new Response('Invalid target', { status: 400 });
    }

    const body = await request.text();

    const ghResponse = await fetch(target, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
    });

    const ghBody = await ghResponse.text();

    return new Response(ghBody, {
      status: ghResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  },
};
