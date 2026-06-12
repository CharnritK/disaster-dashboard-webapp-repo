# Agent: Repo Cartographer

> Archive notice: this agent role belongs to the historical handoff package, not current project guidance. Use `README.md`, `AGENTS.md`, and `docs/README.md` for current setup and product contract.

## Role
Verify branch and inspect only target files.

## Tasks
1. Run `git status --short --branch`.
2. Confirm branch is `001-decision-context-data-quality`.
3. Verify target files exist.
4. Summarize current workflow and any unexpected local changes.
5. Do not edit files.

## Stop if
- Wrong branch.
- Dirty working tree contains unknown user changes.
- Required files are missing.
