"use client";

import { useEffect, useState } from "react";

export type AiUsageState =
  | { status: "disabled" | "loading" }
  | {
      status: "ready";
      localDate: string;
      limit: number;
      remaining: number;
      used: number;
    }
  | { message: string; status: "unauthenticated" }
  | { message: string; status: "error" };

export function useAiUsage(enabled: boolean): AiUsageState {
  const [state, setState] = useState<AiUsageState>(
    enabled ? { status: "loading" } : { status: "disabled" },
  );

  useEffect(() => {
    if (!enabled) {
      setState({ status: "disabled" });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    fetch("/api/usage", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (response.status === 401) {
          setState({
            message: readMessage(body, "Sign in to use AI-assisted workflow."),
            status: "unauthenticated",
          });
          return;
        }
        if (!response.ok || !isUsageBody(body)) {
          setState({
            message: "AI usage is unavailable. Deterministic workflow remains available.",
            status: "error",
          });
          return;
        }
        setState({
          localDate: body.localDate,
          limit: body.limit,
          remaining: body.remaining,
          status: "ready",
          used: body.used,
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          message: "AI usage is unavailable. Deterministic workflow remains available.",
          status: "error",
        });
      });

    return () => controller.abort();
  }, [enabled]);

  return state;
}

export function usageCopy(usage: AiUsageState) {
  if (usage.status === "ready") {
    return {
      label: usage.remaining <= 0 ? "AI quota used" : "AI quota",
      value: `${usage.used} / ${usage.limit}`,
    };
  }
  if (usage.status === "unauthenticated") {
    return {
      label: "AI quota",
      value: "Sign in required",
    };
  }
  if (usage.status === "error") {
    return {
      label: "AI quota",
      value: "Unavailable",
    };
  }
  return {
    label: "AI quota",
    value: "Checking",
  };
}

function isUsageBody(value: unknown): value is {
  localDate: string;
  limit: number;
  remaining: number;
  used: number;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "localDate" in value &&
    "limit" in value &&
    "remaining" in value &&
    "used" in value &&
    typeof value.localDate === "string" &&
    typeof value.limit === "number" &&
    typeof value.remaining === "number" &&
    typeof value.used === "number"
  );
}

function readMessage(value: unknown, fallback: string) {
  return typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
    ? value.message
    : fallback;
}
