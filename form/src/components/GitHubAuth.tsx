import { useEffect, useRef, useState } from 'react';
import { requestDeviceCode, pollForToken, fetchUser, getStoredToken, clearToken } from '../lib/auth';
import type { GitHubUser } from '../types/wapuu';

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

interface Props {
  onAuth: (token: string, user: GitHubUser) => void;
  token: string | null;
  user: GitHubUser | null;
}

export function GitHubAuth({ onAuth, token, user }: Props) {
  const [deviceCode, setDeviceCode] = useState<{ userCode: string; verificationUri: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const stored = getStoredToken();
    if (stored && !token) {
      fetchUser(stored)
        .then((u) => onAuth(stored, u))
        .catch(() => clearToken());
    }
  }, []);

  async function startAuth() {
    setError('');
    setLoading(true);

    try {
      const code = await requestDeviceCode();
      setDeviceCode({
        userCode: code.user_code,
        verificationUri: code.verification_uri,
      });

      abortRef.current = new AbortController();
      const accessToken = await pollForToken(
        code.device_code,
        code.interval,
        code.expires_in,
        abortRef.current.signal,
      );

      const ghUser = await fetchUser(accessToken);
      onAuth(accessToken, ghUser);
      setDeviceCode(null);
    } catch (err) {
      if (err instanceof Error && err.message !== 'Cancelled') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function cancelAuth() {
    abortRef.current?.abort();
    setDeviceCode(null);
    setLoading(false);
  }

  if (user && token) {
    return (
      <div className="wapuu-auth">
        <div className="wapuu-auth__user">
          <img src={user.avatar_url} alt={user.login} className="wapuu-auth__avatar" />
          <span>Signed in as <strong>{user.login}</strong></span>
          <button
            type="button"
            className="wapuu-btn wapuu-btn--ghost"
            onClick={() => {
              clearToken();
              onAuth('', null as unknown as GitHubUser);
            }}
            style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (deviceCode) {
    return (
      <div className="wapuu-card wapuu-auth">
        <div className="wapuu-auth__title">Enter this code on GitHub</div>
        <div className="wapuu-auth__desc">
          Copy the code below, then click the link to authorize Wapuufy on GitHub.
        </div>
        <div className="wapuu-auth__code">{deviceCode.userCode}</div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={deviceCode.verificationUri}
            target="_blank"
            rel="noopener noreferrer"
            className="wapuu-btn wapuu-btn--primary"
          >
            Open GitHub
          </a>
          <button type="button" className="wapuu-btn wapuu-btn--secondary" onClick={cancelAuth}>
            Cancel
          </button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <span className="wapuu-spinner" /> <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>Waiting for authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="wapuu-card wapuu-auth">
      <div className="wapuu-auth__icon">
        <GitHubIcon />
      </div>
      <div className="wapuu-auth__title">Sign in with GitHub</div>
      <div className="wapuu-auth__desc">
        To submit a Wapuu, you need a GitHub account. The form will create a pull request on your behalf.
      </div>
      {error && (
        <div style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
      )}
      <button
        type="button"
        className="wapuu-btn wapuu-btn--primary wapuu-btn--lg"
        onClick={startAuth}
        disabled={loading}
      >
        {loading ? <><span className="wapuu-spinner" /> Connecting...</> : 'Continue with GitHub'}
      </button>
    </div>
  );
}
