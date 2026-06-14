# Build Guard

`npm run build` runs through `scripts/guarded-next-build.mjs`.

The guard preserves the existing build pipeline:

1. Run `next build`.
2. Run `scripts/prepare-sites-dist.mjs`.

The difference is operational safety. Each step has a hard wall-clock timeout.
If a child build process wedges, the guard terminates only the process tree it
started and exits with code `124` instead of leaving the session waiting
forever.

Default timeouts:

- `NEXT_BUILD_TIMEOUT_MS=600000` for `next build`.
- `BUILD_POSTPROCESS_TIMEOUT_MS=120000` for Sites dist post-processing.
- `BUILD_KILL_GRACE_MS=15000` for process-tree shutdown.

Use `npm run build:unguarded` only for manual diagnosis when you explicitly want
the old behavior.

Do not broad-kill `node.exe` during cleanup. If a build is already stuck outside
this guard, inspect command lines and stop only repo-local `next build`,
`next dev`, or `next start` process trees.
