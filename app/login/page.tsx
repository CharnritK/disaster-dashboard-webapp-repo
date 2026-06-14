import Link from "next/link";

import {
  DEFAULT_AUTH_REDIRECT_PATH,
  firstQueryValue,
  normalizeAuthRedirectPath,
} from "@/lib/auth/redirects";
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
          workflow remains deterministic and session-only.
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
          <button
            className="primary-button"
            type="submit"
            disabled={!authConfigured}
          >
            Send sign-in link
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

function loginMessage({
  authConfigured,
  error,
  sent,
  status,
}: {
  authConfigured: boolean;
  error?: string;
  sent?: string;
  status?: string;
}) {
  if (!authConfigured) {
    return {
      tone: "warning",
      copy: "Supabase Auth is not configured in this environment.",
    };
  }

  if (sent === "1") {
    return {
      tone: "success",
      copy: "Check your email for the secure sign-in link.",
    };
  }

  if (status === "signed_out") {
    return {
      tone: "neutral",
      copy: "You have been signed out.",
    };
  }

  if (error === "invalid_email") {
    return {
      tone: "warning",
      copy: "Enter a valid email address.",
    };
  }

  if (error === "auth_rate_limited") {
    return {
      tone: "warning",
      copy:
        "A sign-in link was requested recently. Use the latest email link or wait a minute before requesting another.",
    };
  }

  if (error === "auth_failed" || error === "callback_failed") {
    return {
      tone: "warning",
      copy:
        "Sign-in could not be completed. Try again or check the provider configuration.",
    };
  }

  return null;
}
