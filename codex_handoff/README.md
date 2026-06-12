# Dashboard Copilot Codex Handoff Zip

This package is a copy-ready implementation handoff for Codex.

## How to use

1. Unzip this folder into the repository root as `codex_handoff/`.
2. Ensure you are on the target branch:

```bash
git checkout 001-decision-context-data-quality
git status --short --branch
```

3. Open `codex_handoff/CODEX_GOAL_PROMPT.md`.
4. Paste that entire file into Codex as the one goal prompt.
5. Codex should run the goals sequentially and call the red-team protocol after each test.

## Expected result for tomorrow's showcase

Build a deterministic **Evidence-to-Dashboard Decision Packet** that demonstrates:

1. Select a disaster-management decision template.
2. Load fragmented disaster data from multiple simulated source files.
3. Profile files and show an **Evidence Coverage Map**.
4. Recommend how to combine files with human review.
5. Validate decision readiness and unsafe/risky data.
6. Generate a dashboard with caveats.
7. Export a decision handoff packet with evidence coverage, quality checks, join review, and transformation history.

## Fast path

Run goals in this order:

1. `GOAL_00_PREFLIGHT.md`
2. `GOAL_01_EVIDENCE_COVERAGE_CORE.md`
3. `GOAL_02_EVIDENCE_COVERAGE_UI.md`
4. `GOAL_03_SIMULATED_DEMO_DATA.md`
5. `GOAL_04_HANDOFF_PACKET_FALLBACKS.md`
6. `GOAL_05_ACCESSIBLE_NO_CODE_UX.md`
7. `GOAL_07_FINAL_RELEASE_PASS.md`

Run `GOAL_06_TEMPLATE_PACK_OPTIONAL.md` only after the core demo passes.

## Review gates

Do not mark ready for showcase until:

- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` passes.
- Manual browser smoke test passes.
- No secrets, real PII, or production data were added.
- Human user approves the final demo path.

## Readiness

This handoff is implementation-ready for Codex, with assumptions:
- The repo branch exists locally.
- Node/npm environment is available.
- Codex can read and edit repo files.
- Browser smoke testing is available locally or can be performed by the user.
# Current Project Tutorial

Start with [../docs/digital-public-good-guide.md](../docs/digital-public-good-guide.md) for the plain-English project overview, scope, extension guidance, starter Codex prompts, and technical appendix. Use [../docs/README.md](../docs/README.md) as the project documentation index.
