import type { DeviceCodeResponse, GitHubUser } from '../types/wapuu';

const CLIENT_ID = 'Ov23liEjXU6GYL3oDQEc';
const TOKEN_KEY = 'wapuufy_gh_token';
const PROXY_URL = 'https://wapuufy-gh-auth.kdc.workers.dev';

async function proxyFetch(target: string, body: object): Promise<Response> {
  return fetch(`${PROXY_URL}?target=${encodeURIComponent(target)}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await proxyFetch('https://github.com/login/device/code', {
    client_id: CLIENT_ID,
    scope: 'public_repo',
  });

  if (!res.ok) {
    throw new Error('Failed to request device code');
  }

  return res.json();
}

export async function pollForToken(
  deviceCode: string,
  interval: number,
  expiresIn: number,
  signal?: AbortSignal,
): Promise<string> {
  const deadline = Date.now() + expiresIn * 1000;

  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error('Cancelled');

    await new Promise((r) => setTimeout(r, interval * 1000));

    const res = await proxyFetch('https://github.com/login/oauth/access_token', {
      client_id: CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    });

    const data = await res.json();

    if (data.access_token) {
      sessionStorage.setItem(TOKEN_KEY, data.access_token);
      return data.access_token;
    }

    if (data.error === 'slow_down') {
      interval = (data.interval || interval) + 1;
      continue;
    }

    if (data.error === 'authorization_pending') {
      continue;
    }

    if (data.error === 'expired_token') {
      throw new Error('Device code expired. Please try again.');
    }

    if (data.error === 'access_denied') {
      throw new Error('Authorization was denied.');
    }

    throw new Error(data.error_description || data.error || 'Unknown error');
  }

  throw new Error('Device code expired');
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function fetchUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch GitHub user');
  }

  return res.json();
}
