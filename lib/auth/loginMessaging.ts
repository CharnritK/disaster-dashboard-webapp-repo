export type LoginMessageInput = {
  authConfigured: boolean;
  error?: string;
  sent?: string;
  status?: string;
};

export type LoginMessage = {
  tone: "neutral" | "success" | "warning";
  copy: string;
};

export function loginMessage({
  authConfigured,
  error,
  sent,
  status,
}: LoginMessageInput): LoginMessage | null {
  if (!authConfigured || error === "auth_not_configured") {
    return {
      tone: "warning",
      copy:
        "Sign-in isn't available in this preview. Explore the public demo - no account needed.",
    };
  }

  if (sent === "1") {
    return { tone: "success", copy: "Check your email for the secure sign-in link." };
  }

  if (status === "signed_out") {
    return { tone: "neutral", copy: "You have been signed out." };
  }

  if (error === "invalid_email") {
    return { tone: "warning", copy: "Enter a valid email address." };
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
