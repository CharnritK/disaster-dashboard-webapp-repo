# Sora-Assisted Storyline Plan

This plan explains how Sora can help the existing tutorial series without
turning generated video into product proof.

The current three-part Remotion series stays canonical:

1. `FragmentedDataPainpoint` - why trust breaks before the chart.
2. `PublicDemoUserFlow` - the reproducible public `/demo` path.
3. `TrustRiskUserFlow` - blockers, caveats, AI limits, and privacy boundary.

Sora should be used only for offline, static production assets that are edited
back into Remotion and shipped as regular MP4/poster files. It should not be
called by the app at runtime, added to beta workflow code, or used as the
source of truth for any product behavior.

## Product Decision

Use Sora as a restrained story layer, not as a tutorial engine.

Best use:

- short conceptual openers
- visual metaphors for fragmented evidence and review gates
- optional teaser/social variants
- poster/thumbnail exploration

Do not use Sora for:

- exact UI walkthroughs
- generated app screens
- real disaster scenes, people, victims, public figures, logos, or agencies
- operational-looking maps, coordinates, names, or incident details
- uploaded data, row-like content, or realistic private records
- any claim that AI approves response action

OpenAI's current docs schedule the Videos API, `sora-2`, and `sora-2-pro` for
removal on 2026-09-24. Treat Sora as a short-term asset-generation tool, not as
a durable system dependency.

## Story Spine

The tutorial should move through one clear argument:

1. Response teams are under pressure before the data is ready.
2. Dashboard Copilot makes uncertainty visible before it recommends anything.
3. The public demo can be reproduced safely with synthetic samples.
4. Bad data must block or qualify outputs instead of being hidden.
5. The final handoff supports human review; it does not approve action.

Sora can help with the emotional and conceptual beats. Real app footage must
carry every product proof beat.

## Sora Asset Strategy

Use a maximum of four Sora clips in the public tutorial package.

| Asset id | Target part | Duration | Role | Keep app proof? |
| --- | --- | ---: | --- | --- |
| `sora-01-evidence-pressure` | Part 1 | 6-8s | Replace or improve the opener pressure moment | Yes, immediately after |
| `sora-02-fragmented-evidence` | Part 1 | 4-6s | Optional bridge from pressure to fragmented files | Yes |
| `sora-03-review-gate` | Part 3 | 4-6s | Visual metaphor for blockers staying visible | Yes |
| `sora-04-handoff-package` | Teaser or end card | 4-6s | Optional handoff/summary metaphor | Yes |

Part 2 should remain app-footage only. Its value is reproducibility, not mood.

## Claim-To-Proof Map

Every generated metaphor needs a nearby proof moment. This is the main guardrail
against making the tutorial feel like a concept ad instead of a product
walkthrough.

| Product claim | Sora can help with | Proof must remain |
| --- | --- | --- |
| Fragmented inputs break trust before charts exist. | Blank spreadsheet cards, disconnected evidence lanes, quiet planning table. | Real bundled fragmented sample loading and parsed previews. |
| Start with the decision question, not a chart. | Neutral decision board where scattered cards align around one question. | Real template selection and suggested collection fields. |
| Data enters a safe session-only workflow. | Abstract files crossing a transparent browser/session boundary, then fading after use. | Real public demo sample loading, profiling UI, and privacy copy. |
| Harmonization is reviewable, not magic. | Evidence streams aligning while warning markers remain visible. | Join recommendations, safe cleaning text, and readiness validation. |
| Risk remains visible when data is not ready. | Review gate, checkpoint, or barrier metaphor. | Risky sample blockers and "not safe for action yet" app footage. |
| Handoff supports review, not operational approval. | Generic handoff packet assembled from abstract charts and caveat notes. | Export/project kit and handoff summary footage. |

If a Sora clip does not map to one of these claims, cut it.

## Scene Plan

### Part 1: Why Trust Breaks Before The Chart

Job: make fragmented-data pressure felt, then quickly prove the real app path.

Recommended structure:

| Time | Scene | Source | Story job |
| --- | --- | --- | --- |
| 0-7s | Quiet operations table | Sora asset `sora-01-evidence-pressure` | Establish pressure without sensationalism. |
| 7-12s | Fragmented evidence metaphor | Optional Sora asset `sora-02-fragmented-evidence` | Show that files do not agree yet. |
| 12-19s | Load bundled fragmented sample | Current app capture | Prove the public demo uses synthetic sample data. |
| 19-27s | Evidence coverage | Current app capture | Show uncertainty before recommendation. |
| 27-35s | Reviewable join and readiness | Current app capture | Prove joins and cleaning are reviewed. |
| 35-42s | Handoff | Current app capture | Close on human-owned action. |

Cut if needed: `sora-02-fragmented-evidence`. The opener alone is enough if the
video starts to feel too cinematic.

Prompt direction for `sora-01-evidence-pressure`:

```text
Wide restrained shot of an empty emergency coordination table at night,
unbranded laptops closed, printed generic charts and sticky notes spread out,
soft overhead light, calm documentary tone, no people, no logos, no readable
private data, no disaster damage, slow push-in, realistic but not dramatic.
```

Prompt direction for `sora-02-fragmented-evidence`:

```text
Close-up of abstract paper cards and simple spreadsheet printouts with
unreadable placeholder marks, mismatched columns gradually aligning into three
clear lanes labeled generically as needs, population, and capacity, clean
documentary lighting, no real names, no maps, no coordinates, no people.
```

### Part 2: Run The Public Demo

Job: show the exact deterministic path a first-time viewer can reproduce.

Recommended structure: no Sora inside the main cut.

Keep current app-proof sequence:

1. decision template
2. bundled fragmented sample
3. profiling and evidence coverage
4. harmonization and join review
5. readiness checkpoint
6. dashboard with caveats
7. export and handoff

Optional Sora use: make a separate 10-15 second social teaser that leads into
Part 2. Do not insert it into Part 2 unless viewer testing shows the current
opening loses attention.

Do not build a fourth Sora-led showcase unless there is a specific external
need for a 60-75 second trailer. The three-part tutorial remains the main
product asset.

Teaser prompt direction:

```text
Minimal abstract motion graphic style, clean evidence cards moving from
scattered to review-ready, neutral blue gray and warm amber accents, no people,
no maps, no logos, no readable data, calm civic technology tone, slow movement,
final frame leaves space for title text.
```

### Part 3: When Data Is Not Ready

Job: prove the product does not hide risk, overstate AI, or blur privacy.

Recommended structure:

| Time | Scene | Source | Story job |
| --- | --- | --- | --- |
| 0-8s | Risky sample quality | Current app capture | Show bad inputs plainly. |
| 8-15s | Review gate metaphor | Sora asset `sora-03-review-gate` | Give blockers a clear visual beat. |
| 15-25s | Readiness blockers | Current app capture | Prove the actual stop condition. |
| 25-34s | Evidence before advice | Current app capture | Reassert deterministic validation. |
| 34-43s | Session boundary | Current app capture | State browser/session data boundary. |
| 43-50s | Handoff caveats | Current app capture | Keep risk in the handoff. |

Prompt direction for `sora-03-review-gate`:

```text
Abstract close-up of a review board with three simple status cards, one card
clearly marked "needs review" in generic text, a transparent barrier pauses the
cards before they move forward, calm product-documentary lighting, no people,
no emergency scene, no logos, no real data.
```

Prompt direction for `sora-04-handoff-package`:

```text
Clean tabletop shot of a generic review packet being assembled from abstract
charts, caveat notes, and source labels, pages slide into an unbranded folder,
warm neutral light, no people, no real data, no official seals, no readable
private information, calm civic technology tone.
```

## Editorial Rules

- Every Sora clip must be followed by app footage that proves the claim.
- No Sora clip should run longer than the product proof it introduces.
- Use Sora at the start of a thought, not at the end of a claim.
- Avoid cinematic disaster language: no smoke, floodwater, damage, sirens, or
  field suffering.
- Keep generated visuals non-operational: no realistic maps, road names,
  facility names, agency marks, or coordinates.
- Add title/caption text in Remotion, not in the Sora prompt, unless the text is
  generic and easy to QA.
- Do not rely on generated audio. Keep the existing voiceover and transcript
  pipeline authoritative.

## Production Sequence

1. Select one asset first: `sora-01-evidence-pressure`.
2. Generate 3 rough variants at low commitment.
3. Pick one variant only if it improves the first 7 seconds without making the
   package feel like an AI ad.
4. Edit that clip into `FragmentedDataPainpoint` in Remotion.
5. Re-render Part 1 and inspect the muted preview.
6. Only then decide whether `sora-03-review-gate` is worth generating for Part
   3.
7. Leave Part 2 unchanged unless viewer testing shows a specific attention
   problem.
8. Copy final static assets into `public/tutorial/` only after QA.

## Approval Gates

Before any Sora API call:

- User approves using an OpenAI video-generation API key or account capacity.
- The prompt contains no sensitive, row-like, real incident, or private data.
- The intended output is offline static media only.
- The generated video will not be committed until reviewed.

Before publishing a Sora-assisted cut:

- It does not look like real disaster footage.
- It cannot be mistaken for actual app output.
- It does not weaken the session-only uploaded-data boundary.
- It does not imply AI authority or operational approval.
- The transcript and visible captions still match the final video.
- `/about` still serves static assets only.
- `production-qa.md` records which Sora assets were used and why.

## Acceptance Criteria

The Sora-assisted storyline succeeds only if a viewer can say:

- "I understand why fragmented data creates trust risk."
- "I saw the actual public demo path, not a simulated product promise."
- "I understand the app supports review and handoff, not operational approval."
- "I understand bad data can block or qualify outputs."
- "I understand uploaded rows stay session-only."

If the generated clips make the product feel more impressive but less credible,
reject them.
