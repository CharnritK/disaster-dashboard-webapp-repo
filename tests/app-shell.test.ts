import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("authenticated app shell", () => {
  it("hosts authenticated workspace chrome and persistent workflow routes under /app", () => {
    const shell = readFileSync(join(process.cwd(), "components", "AppShell.tsx"), "utf8");
    const page = readFileSync(join(process.cwd(), "app", "app", "page.tsx"), "utf8");
    const layout = readFileSync(join(process.cwd(), "app", "app", "layout.tsx"), "utf8");
    const workflowShell = readFileSync(
      join(process.cwd(), "components", "workflow", "WorkspaceWorkflowShell.tsx"),
      "utf8",
    );

    expect(shell).toContain("UsageMeter");
    expect(layout).toContain("getSupabaseServerIdentity");
    expect(layout).toContain("<AppShell>");
    expect(page).toContain('redirect("/app/data")');
    expect(workflowShell).toContain("workspaceMode");
    expect(workflowShell).toContain("DashboardCopilotApp");
  });

  it("declares operational workspace routes and route-backed workflow state", () => {
    const routes = [
      join(process.cwd(), "app", "app", "(workflow)", "data", "page.tsx"),
      join(process.cwd(), "app", "app", "(workflow)", "prepare", "page.tsx"),
      join(process.cwd(), "app", "app", "(workflow)", "readiness", "page.tsx"),
      join(process.cwd(), "app", "app", "(workflow)", "dashboard", "page.tsx"),
      join(process.cwd(), "app", "app", "(workflow)", "export", "page.tsx"),
      join(process.cwd(), "app", "app", "usage", "page.tsx"),
      join(process.cwd(), "app", "app", "feedback", "page.tsx"),
    ];
    for (const route of routes) {
      expect(readFileSync(route, "utf8")).toBeTruthy();
    }

    const routeMap = readFileSync(
      join(process.cwd(), "components", "workflow", "workspaceRoutes.ts"),
      "utf8",
    );
    expect(routeMap).toContain("/app/data");
    expect(routeMap).toContain("/app/prepare");
    expect(routeMap).toContain("/app/readiness");
    expect(routeMap).toContain("/app/dashboard");
    expect(routeMap).toContain("/app/export");
  });

  it("keeps the mobile dashboard from becoming one stacked report", () => {
    const workflow = readFileSync(join(process.cwd(), "components", "WorkflowComponents.tsx"), "utf8");
    const styles = readFileSync(join(process.cwd(), "app", "styles.css"), "utf8");

    expect(workflow).toContain('role="tablist"');
    expect(workflow).toContain("dashboard-mobile-panel");
    expect(styles).toContain(".dashboard-mobile-tabs");
    expect(styles).toContain(".dashboard-mobile-panel.active");
  });
});
