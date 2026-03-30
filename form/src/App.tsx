import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GitHubAuth } from './components/GitHubAuth';
import { SubmitForm } from './components/SubmitForm';
import type { GitHubUser } from './types/wapuu';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);

  function handleAuth(t: string, u: GitHubUser) {
    setToken(t || null);
    setUser(t ? u : null);
  }

  return (
    <>
      <Header />
      <main className="wapuu-container" style={{ flex: 1, paddingBottom: 'var(--space-2xl)' }}>
        <div className="wapuu-hero">
          <h1 className="wapuu-hero__title">Submit a Wapuu</h1>
          <p className="wapuu-hero__desc">
            Share your custom Wapuu character with the community. Once approved, it will appear in the Wapuufy app at WordCamps worldwide.
          </p>
        </div>

        {!token || !user ? (
          <GitHubAuth onAuth={handleAuth} token={token} user={user} />
        ) : (
          <>
            <GitHubAuth onAuth={handleAuth} token={token} user={user} />
            <div style={{ marginTop: 'var(--space-xl)' }}>
              <SubmitForm token={token} user={user} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
