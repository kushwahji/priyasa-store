'use client';

import { useEffect, useState } from 'react';

/**
 * The Store cannot read its HttpOnly access cookie from the browser.
 * Protected API requests are the source of truth; the API client redirects
 * to login on a real 401 instead of depending on an undocumented /me/session route.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <main className="accountPage">
        <section className="authCard">
          <p className="muted">Loading your PRIYASA account…</p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
