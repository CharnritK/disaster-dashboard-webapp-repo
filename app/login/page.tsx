import Link from "next/link";

import {
  DEFAULT_AUTH_REDIRECT_PATH,
  firstQueryValue,
  normalizeAuthRedirectPath,
} from "@/lib/auth/redirects";
import { loginMessage } from "@/lib/auth/loginMessaging";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const nextPath = normalizeAuthRedirectPath(
    firstQueryValue(params.next),
    DEFAULT_AUTH_REDIRECT_PATH,
  );
  const error = firstQueryValue(params.error);
  const sent = firstQueryValue(params.sent);
  const status = firstQueryValue(params.status);
  const authConfigured = Boolean(getSupabasePublicConfig());
  const message = loginMessage({ authConfigured, error, sent, status });

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="login-title">
        <p className="eyebrow">Controlled beta</p>
        <h1 id="login-title">Sign in to Dashboard Copilot</h1>
        <p className="auth-lede">
          Authenticated access unlocks quota-governed AI assistance. The public
          demo remains a guided, session-only flow.
        </p>

        {message ? (
          <p className={`auth-status auth-status-${message.tone}`}>
            {message.copy}
          </p>
        ) : null}

        <form className="auth-form" method="post" action="/auth/signin">
          <input type="hidden" name="next" value={nextPath} />
          <label htmlFor="email">Work email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            disabled={!authConfigured}
            required
          />
          <p className="auth-helper">
            We use your email only to send a sign-in link.
          </p>
          <button
            className="primary-button"
            type="submit"
            disabled={!authConfigured}
          >
            {authConfigured ? "Send sign-in link" : "Sign-in unavailable"}
          </button>
        </form>

        <div className="auth-links" aria-label="Navigation">
          <Link href="/">Public workflow</Link>
          <Link href="/about">About</Link>
        </div>
      </section>
    </main>
  );
}
