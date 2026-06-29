import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminPage from "@/app/admin/page";
import AuthenticatedAppLayout from "@/app/app/layout";
import FeedbackPage from "@/app/app/feedback/page";
import TemplatesPage from "@/app/app/templates/page";
import NewTemplatePage from "@/app/app/templates/new/page";
import UsagePage from "@/app/app/usage/page";
import LoginPage from "@/app/login/page";

const mocks = vi.hoisted(() => ({
  aggregateUsageSummary: vi.fn(),
  getSupabasePublicConfig: vi.fn(),
  getSupabaseServerIdentity: vi.fn(),
  isAdminUser: vi.fn(),
  redirect: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerIdentity: mocks.getSupabaseServerIdentity,
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabasePublicConfig: mocks.getSupabasePublicConfig,
}));

vi.mock("@/lib/adminMetrics", () => ({
  aggregateUsageSummary: mocks.aggregateUsageSummary,
  isAdminUser: mocks.isAdminUser,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("staging-facing secondary pages with local mocks", () => {
  it("renders usage quota state from the metadata-only usage endpoint", async () => {
    stubFetch(async (url) => {
      expect(url).toBe("/api/usage");
      return jsonResponse({
        localDate: "2026-06-29",
        limit: 20,
        remaining: 16,
        used: 4,
      });
    });

    render(createElement(UsagePage));

    expect(screen.getByRole("heading", { name: /ai usage/i })).toBeTruthy();
    expect(
      screen.getByText(/deterministic workflow fallback remains available/i),
    ).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("4 / 20")).toBeTruthy();
    });
  });

  it("submits feedback as bounded metadata only", async () => {
    const user = userEvent.setup();
    let submittedBody: unknown;

    stubFetch(async (url, init) => {
      expect(url).toBe("/api/feedback");
      submittedBody = JSON.parse(String(init?.body));
      return jsonResponse({ ok: true });
    });

    render(createElement(FeedbackPage));

    expect(screen.getByRole("heading", { name: /review workflow output/i })).toBeTruthy();
    expect(screen.getByText(/metadata-only feedback/i)).toBeTruthy();
    await user.click(screen.getByLabelText("useful"));
    await user.click(screen.getByRole("button", { name: /submit feedback/i }));

    await waitFor(() => {
      expect(screen.getByText("Saved.")).toBeTruthy();
    });
    expect(submittedBody).toEqual({
      tags: ["useful"],
      thumb: "up",
    });
  });

  it("renders template drafts and reviewed templates without row content", async () => {
    stubFetch(async (url) => {
      expect(url).toBe("/api/templates");
      return jsonResponse({
        templates: [
          {
            id: "template-1",
            title: "Shelter prioritization",
            description: "Draft decision metadata.",
            status: "draft",
            visibility: "private",
          },
        ],
      });
    });

    render(createElement(TemplatesPage));

    expect(screen.getByRole("heading", { name: /decision templates/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /new template/i })).toHaveAttribute(
      "href",
      "/app/templates/new",
    );
    await waitFor(() => {
      expect(screen.getByText("Shelter prioritization")).toBeTruthy();
    });
    expect(screen.queryByText(/District,Need/i)).toBeNull();
  });

  it("saves a draft template using schema metadata instead of example values", async () => {
    const user = userEvent.setup();
    let submittedBody: unknown;

    stubFetch(async (url, init) => {
      expect(url).toBe("/api/templates");
      submittedBody = JSON.parse(String(init?.body));
      return jsonResponse({
        template: {
          id: "template-2",
          title: "Response triage",
        },
      }, 201);
    });

    render(createElement(NewTemplatePage));

    await user.type(screen.getByLabelText(/title/i), "Response triage");
    await user.type(
      screen.getByLabelText(/decision question/i),
      "Which areas need support first?",
    );
    await user.type(screen.getByLabelText(/intended action/i), "Prioritize support");
    await user.type(screen.getByLabelText(/decision maker/i), "Operations lead");
    await user.type(
      screen.getByLabelText(/geography and timeframe/i),
      "Admin 2, next 72 hours",
    );
    await user.type(screen.getByLabelText(/required evidence/i), "Need\nCapacity");
    await user.type(screen.getByLabelText(/suggested fields/i), "admin_code\nneed_score");
    fireEvent.change(screen.getByLabelText(/example schema/i), {
      target: { value: "{\"admin_code\":\"string\",\"need_score\":\"number\"}" },
    });
    await user.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByText("Draft saved.")).toBeTruthy();
    });
    expect(submittedBody).toMatchObject({
      decisionMaker: "Operations lead",
      decisionQuestion: "Which areas need support first?",
      geographyTimeframe: "Admin 2, next 72 hours",
      intendedAction: "Prioritize support",
      requiredEvidence: ["Need", "Capacity"],
      suggestedFields: [
        { field_name: "admin_code", role: "evidence" },
        { field_name: "need_score", role: "evidence" },
      ],
      title: "Response triage",
    });
    expect(JSON.stringify(submittedBody)).not.toMatch(/D01|District,Need|rows/i);
  });
});

describe("auth shell pages with local mocks", () => {
  it("renders preview-safe login unavailable state when public auth config is absent", async () => {
    mocks.getSupabasePublicConfig.mockReturnValue(null);

    render(
      await LoginPage({
        searchParams: Promise.resolve({
          error: "auth_not_configured",
          next: "/app/usage",
        }),
      }),
    );

    expect(screen.getByRole("heading", { name: /sign in to dashboard copilot/i })).toBeTruthy();
    expect(screen.getByText(/sign-in isn't available in this preview/i)).toBeTruthy();
    expect(screen.getByText(/explore the public demo/i)).toBeTruthy();
    expect(screen.getByLabelText("Work email")).toBeDisabled();
    expect(screen.getByRole("button", { name: /sign-in unavailable/i })).toBeDisabled();
    expect(document.querySelector('input[name="next"]')).toHaveAttribute(
      "value",
      "/app/usage",
    );
  });

  it("redirects unauthenticated app layout requests and renders authenticated chrome", async () => {
    mocks.getSupabaseServerIdentity.mockResolvedValueOnce(null);
    await expect(
      AuthenticatedAppLayout({
        children: createElement("p", null, "Private workspace"),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/login?next=/app");

    stubFetch(async (url) => {
      expect(url).toBe("/api/usage");
      return jsonResponse({
        localDate: "2026-06-29",
        limit: 20,
        remaining: 20,
        used: 0,
      });
    });
    mocks.getSupabaseServerIdentity.mockResolvedValueOnce({
      email: "analyst@example.org",
      userId: "analyst-1",
    });

    render(
      await AuthenticatedAppLayout({
        children: createElement("p", null, "Private workspace"),
      }),
    );

    expect(screen.getByRole("heading", { name: /dashboard copilot beta/i })).toBeTruthy();
    expect(screen.getByText("Private workspace")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("0 / 20")).toBeTruthy();
    });
  });
});

describe("admin metadata dashboard with local mocks", () => {
  it("redirects unauthenticated and non-admin identities", async () => {
    mocks.getSupabaseServerIdentity.mockResolvedValueOnce(null);
    await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT:/login?next=/admin");

    mocks.getSupabaseServerIdentity.mockResolvedValueOnce({
      email: "analyst@example.org",
      userId: "analyst-1",
    });
    mocks.isAdminUser.mockReturnValueOnce(false);

    await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  it("renders aggregate admin metadata without raw operational content", async () => {
    mocks.getSupabaseServerIdentity.mockResolvedValue({
      email: "admin@example.org",
      userId: "admin-1",
    });
    mocks.isAdminUser.mockReturnValue(true);
    mocks.aggregateUsageSummary.mockResolvedValue({
      fallbackReasons: [{ count: 2, value: "ai_disabled" }],
      feedbackCount: 3,
      feedbackTags: [{ count: 1, value: "useful" }],
      templateCount: 4,
      usageEvents: 5,
    });

    render(await AdminPage());

    expect(screen.getByRole("heading", { name: /metadata dashboard/i })).toBeTruthy();
    expect(screen.getByText(/aggregate usage, feedback, and template metadata only/i)).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("ai_disabled")).toBeTruthy();
    expect(screen.getByText("useful")).toBeTruthy();
    expect(screen.queryByText(/North District|prompt body|report content/i)).toBeNull();
  });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

function stubFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response> | Response,
) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
    return handler(url, init);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
