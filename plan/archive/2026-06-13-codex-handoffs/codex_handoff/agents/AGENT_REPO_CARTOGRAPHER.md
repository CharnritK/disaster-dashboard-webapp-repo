# Agent: Repo Cartographer

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
