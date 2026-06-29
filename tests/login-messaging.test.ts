import { describe, expect, it } from "vitest";
import { loginMessage } from "@/lib/auth/loginMessaging";

describe("login messaging", () => {
  it("explains unavailable auth without showing raw config language", () => {
    const message = loginMessage({ authConfigured: false });
    expect(message?.tone).toBe("warning");
    expect(message?.copy).toContain("Sign-in isn't available in this preview");
    expect(message?.copy).toContain("public demo");
    expect(message?.copy).not.toMatch(/Supabase|auth_not_configured/i);
  });

  it("maps auth_not_configured to the same preview-safe message", () => {
    const message = loginMessage({
      authConfigured: false,
      error: "auth_not_configured",
    });
    expect(message?.copy).toContain("Sign-in isn't available in this preview");
  });

  it("shows resend cooldown copy without blaming provider configuration", () => {
    const message = loginMessage({
      authConfigured: true,
      error: "auth_rate_limited",
    });

    expect(message?.tone).toBe("warning");
    expect(message?.copy).toContain("Use the latest email link");
    expect(message?.copy).not.toContain("provider configuration");
  });
});
