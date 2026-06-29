import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_AUTH_REDIRECT_PATH,
  normalizeAuthRedirectPath,
} from "@/lib/auth/redirects";
import { getAuthAppBaseUrl } from "@/lib/auth/appBaseUrl";
import {
  buildLoginRedirectUrl,
  isProtectedAppPath,
  isPublicDemoPath,
  updateSupabaseSession,
} from "@/lib/supabase/middleware";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { signInErrorCode } from "@/lib/auth/signInErrors";

describe("supabase auth helpers", () => {
  it("reads only public Supabase auth configuration", () => {
    expect(
      getSupabasePublicConfig(env({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        SUPABASE_SECRET_KEY: "sb_secret_never_browser",
      })),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });

    expect(
      getSupabasePublicConfig(env({
        NEXT_PUBLIC_SUPABASE_URL: "not-a-url",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      })),
    ).toBeNull();

    expect(
      getSupabasePublicConfig(env({
        NEXT_PUBLIC_SUPABASE_URL: "http://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        NODE_ENV: "production",
      })),
    ).toBeNull();
  });

  it("pins auth callback origin to APP_BASE_URL when configured", () => {
    const request = new Request("http://spoofed.example/auth/signin");
    expect(
      getAuthAppBaseUrl(
        request,
        env({
          APP_BASE_URL: "https://dashboard.example.org",
          NODE_ENV: "production",
        }),
      )?.origin,
    ).toBe("https://dashboard.example.org");

    expect(
      getAuthAppBaseUrl(
        request,
        env({
          NODE_ENV: "production",
        }),
      ),
    ).toBeNull();
  });

  it("normalizes auth redirects to local paths only", () => {
    expect(normalizeAuthRedirectPath("/app/usage?day=today")).toBe(
      "/app/usage?day=today",
    );
    expect(normalizeAuthRedirectPath("https://evil.example/app")).toBe(
      DEFAULT_AUTH_REDIRECT_PATH,
    );
    expect(normalizeAuthRedirectPath("//evil.example/app")).toBe(
      DEFAULT_AUTH_REDIRECT_PATH,
    );
    expect(normalizeAuthRedirectPath("/auth/callback")).toBe(
      DEFAULT_AUTH_REDIRECT_PATH,
    );
    expect(normalizeAuthRedirectPath("/api/usage")).toBe(
      DEFAULT_AUTH_REDIRECT_PATH,
    );
  });

  it("protects app routes and leaves demo routes public", () => {
    expect(isProtectedAppPath("/app")).toBe(true);
    expect(isProtectedAppPath("/app/usage")).toBe(true);
    expect(isProtectedAppPath("/app/templates")).toBe(true);
    expect(isProtectedAppPath("/app/templates/new")).toBe(true);
    expect(isProtectedAppPath("/app/data")).toBe(true);
    expect(isProtectedAppPath("/demo")).toBe(false);
    expect(isPublicDemoPath("/demo/service-gap")).toBe(true);
  });

  it("builds same-origin login redirects for protected paths", () => {
    const request = new NextRequest("http://localhost/app?tab=usage");
    const redirectUrl = buildLoginRedirectUrl(request);

    expect(redirectUrl.origin).toBe("http://localhost");
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("next")).toBe("/app?tab=usage");
  });

  it("redirects protected app paths when Supabase Auth is not configured", async () => {
    const response = await updateSupabaseSession(
      new NextRequest("http://localhost/app"),
      {} as NodeJS.ProcessEnv,
    );

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBeTruthy();

    const url = new URL(location as string);
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/app");
    expect(url.searchParams.get("error")).toBe("auth_not_configured");
  });

  it("does not auth-gate public paths when Supabase Auth is not configured", async () => {
    const response = await updateSupabaseSession(
      new NextRequest("http://localhost/demo"),
      {} as NodeJS.ProcessEnv,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps sign-in invite-only and demo deterministic by construction", () => {
    const signinRoute = readFileSync(
      join(process.cwd(), "app", "auth", "signin", "route.ts"),
      "utf8",
    );
    const demoPage = readFileSync(
      join(process.cwd(), "app", "demo", "page.tsx"),
      "utf8",
    );

    expect(signinRoute).toContain("shouldCreateUser: false");
    expect(demoPage).toContain("forceDeterministic");
  });

  it("maps Supabase OTP resend limits to a user-actionable error", () => {
    expect(signInErrorCode({ status: 429, message: "Too many requests" })).toBe(
      "auth_rate_limited",
    );
    expect(
      signInErrorCode({
        message: "For security purposes, you can only request this after 60 seconds.",
      }),
    ).toBe("auth_rate_limited");
    expect(signInErrorCode({ message: "User not found" })).toBe("auth_failed");
  });

});

function env(values: Record<string, string>) {
  return values as unknown as NodeJS.ProcessEnv;
}
