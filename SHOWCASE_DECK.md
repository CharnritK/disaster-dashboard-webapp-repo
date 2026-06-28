# Disaster Response Dashboard Showcase Deck

Generated image input:

Place the eight final slide PNGs in `artifacts/showcase-deck/images`, set
`SHOWCASE_IMAGE_DIR`, or pass `--images <dir>` to the builder.

## Slide Order

1. Disaster Response Dashboard
   - Subtitle: From messy uploads to trusted response recommendations
   - Purpose: Product cover and positioning.

2. The Bottleneck: Critical Data Arrives Fragmented
   - Purpose: Show why disaster-response teams need a workflow for messy CSV/XLSX incident data.

3. A Recommendation-First Workflow
   - Purpose: Explain the actual app flow: upload, profile, harmonize, validate, recommend, export.
   - Keep: session-only uploaded data, optional AI, deterministic fallback, visible quality checks.
   - Avoid: persistence, authentication, background jobs, database export, API export.

4. Quality Caveats Stay Visible
   - Purpose: Make validation and uncertainty part of the value proposition.
   - Keep: completeness, validity, consistency, join confidence, unsupported fields.
   - Avoid: fuzzy matching, imputation, row deletion, deduplication.

5. AI Assists. Rules Still Verify.
   - Purpose: Show the privacy and reliability posture.
   - Keep: minimized profile payloads, server-side API key, schema sanitizer, deterministic fallback.
   - Avoid: full uploaded rows in model prompts, exposed API keys, autonomous decisions.

6. From Prepared Data to Actionable Dashboards
   - Purpose: Show dashboard recommendation outputs.
   - Keep: confidence badges, required fields, quality caveats, reviewable facts.
   - Export surfaces: CSV, PNG, PDF report, transformation log JSON.

7. Built for Safe Prototype Decisions
   - Purpose: Make the prototype contract explicit.
   - Keep: session-only not persisted, row-preserving cleaning, deterministic fallback, formula-safe exports.
   - Allowed cleaning only: trim whitespace, normalize empty strings, convert numeric strings, convert boolean strings.

8. What This Prototype Proves
   - Purpose: Executive close.
   - Message: faster triage, safer recommendations, clearer handoff.
   - Next decision: validate with sample incident data, tighten acceptance criteria, decide whether to expand beyond session-only prototype.

## Assembly Status

The slide images were generated one by one. The repo now includes a deterministic PPTX builder:

`scripts/build-showcase-deck.mjs`

Python builder, preferred:

`scripts/build-showcase-deck.py`

Expected output:

`artifacts/showcase-deck/disaster-response-dashboard-showcase.pptx`

Run:

```bash
node scripts/build-showcase-deck.mjs --images artifacts/showcase-deck/images
```

When the generated image folder includes rejected draft images as well as final
images, the builder can select final slide images by chronological generation
order:

`1,2,4,6,9,11,13,14`

The remaining step is to run the builder with the final PNG folder and verify
the PPTX contains the eight expected slides.

## Finish Checklist

To assemble the deck and verify the PPTX structure, run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\finish-showcase-deck.ps1
```

The wrapper runs the Python builder, which also verifies the PPTX structure.

Direct Python command:

```bash
python scripts/build-showcase-deck.py --images artifacts/showcase-deck/images
```

Node fallback:

```bash
node scripts/build-showcase-deck.mjs --images artifacts/showcase-deck/images
node scripts/verify-showcase-deck.mjs
```

Passing verification should report:

- the expected PPTX path
- `Slides: 8`
- a ZIP entry count

After structural verification, visually spot-check the resulting deck before treating the goal as complete.
