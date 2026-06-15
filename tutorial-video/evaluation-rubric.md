# Tutorial Video Evaluation Rubric

This rubric defines what "good" means for Dashboard Copilot tutorial videos.
Use it before publishing any tutorial, demo walkthrough, showcase clip, or
investor/judge-facing product video.

The bar is not cinematic polish alone. A good tutorial video helps the right
viewer understand the pain of fragmented disaster-response data, trust the
product boundaries, and take the next useful action without over-claiming what
the system can do.

## Research Basis

- Nielsen Norman Group: instructional videos should supplement text, not replace
  it, and should be discoverable, consistent, and accurately represented by
  thumbnails. NN/g also recommends measuring task success and time on task for
  quantitative usability benchmarks and using small, frequent qualitative tests.
- Mayer multimedia learning principles: reduce irrelevant content, signal what
  matters, chunk complex material, align narration with visuals, and avoid
  redundant text that overloads the viewer.
- TechSmith: tutorial videos are appropriate for step-by-step guidance, usually
  in the 2-10 minute range, but the real standard is whether every second
  delivers audience value.
- Wistia: for awareness videos under one minute, average engagement is around
  half the video length; use retention as a signal, not as the only success
  metric.
- W3C WAI: prerecorded video with meaningful audio needs captions; transcripts
  and captions improve access for people who cannot or prefer not to use audio.
- Kirkpatrick model: evaluate beyond reaction. Also test learning, behavior, and
  product/result impact.
- OCHA Centre for Humanitarian Data: humanitarian data work must remain safe,
  ethical, and effective. For this product, that means synthetic demo data,
  visible caveats, no sensitive operational details, and no claim that software
  approves action.

Sources:

- https://www.nngroup.com/articles/instructional-video-guidelines/
- https://www.nngroup.com/articles/usability-testing-101/
- https://www.nngroup.com/articles/success-rate-the-simplest-usability-metric/
- https://www.nngroup.com/videos/cognitive-load/
- https://www.digitallearninginstitute.com/blog/mayers-principles-multimedia-learning
- https://www.techsmith.com/blog/instructional-videos/
- https://www.techsmith.com/blog/ideal-training-video-length/
- https://wistia.com/learn/marketing/optimal-video-length
- https://www.w3.org/WAI/media/av/captions/
- https://www.kirkpatrickpartners.com/the-kirkpatrick-model/
- https://data.humdata.org/dataset/2048a947-5714-4220-905b-e662cbcd14c8/resource/8bc5b848-8ece-4f1f-a78b-18dd972bb21a/download/data-responsibility-guidelines-2025.pdf

## Non-Negotiable Release Gates

If any gate fails, do not publish the video even if the score is high.

1. No false product claim.
   The video must not imply that Dashboard Copilot approves operational action,
   predicts disaster outcomes, stores uploaded datasets, or replaces responders.

2. No sensitive-data exposure.
   Screenshots and generated imagery must use synthetic, sample, blurred, or
   non-readable data. No personal data, real beneficiary lists, operational
   coordinates, secrets, API keys, or live incident details.

3. Trust boundary is explicit.
   The viewer must hear or see that deterministic checks, evidence coverage,
   caveats, and human review remain authoritative.

4. The shown workflow must be reproducible.
   For tutorial videos, a first-time viewer should be able to follow the same
   visible steps in `/demo` without hidden setup, credentials, or provider keys.

5. No dev artifacts.
   No browser error overlay, console warning badge, broken image, stale UI, or
   mismatched step label in the final capture.

6. Accessibility baseline is met.
   Captions or on-screen equivalent must exist for narration. Text must be
   readable at 1080p and mobile preview size. No critical meaning may be audio
   only.

7. Ethical visual tone is acceptable.
   Do not use graphic harm, sensational disaster imagery, pity framing, or
   manipulative music. The emotional center is professional responsibility under
   uncertainty.

## Video-Specific Success Criteria

The current public tutorial release is a three-part series:

1. `FragmentedDataPainpoint`
2. `PublicDemoUserFlow`
3. `TrustRiskUserFlow`

The analyst deep dive and technical architecture explainer remain future modules
until they are storyboarded, rendered, embedded, and pilot-tested.

### Part 1: `FragmentedDataPainpoint`

Purpose: emotional opener for judges, executives, partners, and public showcase.

Current target length: 30-45 seconds. Hard maximum: 60 seconds.

Must achieve:

- Hook appears in first 8 seconds.
- Viewer can say the core pain in their own words: fragmented data makes trust
  hard, not just charting.
- Product proof appears by the halfway mark.
- The final line preserves human ownership of the decision.
- Emotional imagery supports the story but does not replace product evidence.
  Generated imagery should be limited to the opening moment unless a later image
  earns its place.

Minimum release threshold:

- 85/100 rubric score.
- 4 of 5 test viewers can explain the problem and trust boundary.
- 4 of 5 test viewers say the imagery feels respectful, not exploitative.
- Average pilot retention is at least 50% of video length for cold viewers.

### Part 2: `PublicDemoUserFlow`

Purpose: first-time user enablement for the deterministic public demo.

Current target length: 60-90 seconds. Hard maximum: 120 seconds.

Must achieve:

- Viewer can reproduce the path:
  `Use template and continue` -> `Use fragmented demo data needs + population +
  capacity` -> `Profile data` -> `Harmonize data` -> `Accept recommendation` ->
  `Generate dashboard` -> `Export dashboard` -> `Generate handoff summary`.
- Viewer understands no account, API key, or sensitive data is needed for the
  public demo.
- Viewer sees evidence coverage, join review, readiness, dashboard, and export.

Minimum release threshold:

- 85/100 rubric score.
- 80% unaided task success among first-time users.
- Median time to complete the demo after watching is under 5 minutes.
- No more than one minor confusion per test participant.

### Future Module: `AnalystWorkflowDeepDive`

Purpose: train analysts and beta testers to use the workflow responsibly.

Target length: 3-4 minutes. Hard maximum: 5 minutes.

Must achieve:

- Viewer can explain why the workflow starts with a decision template.
- Viewer can distinguish profiling, harmonization, readiness, dashboarding, and
  export.
- Viewer can state what cleaning is allowed: row-preserving, explainable, no
  silent deletion or imputation.
- Viewer can name at least two caveat or readiness signals to check before
  interpreting charts.

Minimum release threshold:

- 85/100 rubric score.
- 80% of analyst testers complete the workflow and identify the review stop
  points.
- 80% can explain why "ready for review" is not operational approval.

### Part 3: `TrustRiskUserFlow`

Purpose: reassure safety, privacy, and domain reviewers.

Current target length: 40-70 seconds. Hard maximum: 90 seconds.

Must achieve:

- Viewer sees a risky data sample produce visible warnings or blockers.
- Viewer understands AI is optional, gated, and not required for deterministic
  workflow continuity.
- Viewer can repeat the privacy boundary: uploaded data is session-only; only
  approved metadata may persist.
- Video shows caveats carrying into handoff/export.

Minimum release threshold:

- 90/100 rubric score because this is a trust video.
- 5 of 5 safety reviewers can identify the privacy boundary.
- 5 of 5 safety reviewers confirm the video does not imply automatic approval.

### Future Module: `TechnicalArchitectureExplainer`

Purpose: technical reviewer and buyer confidence.

Target length: 2-3 minutes. Hard maximum: 4 minutes.

Must achieve:

- Viewer can identify browser/session state, API boundary, optional AI path,
  metadata-only persistence, chart policy, and tests.
- Viewer understands deterministic validation remains authoritative.
- Viewer sees that provider calls are server-side and minimized when enabled.

Minimum release threshold:

- 85/100 rubric score.
- 4 of 5 technical reviewers can describe the data boundary accurately.
- 4 of 5 can name one test or verification gate they would expect before
  trusting a release.

## 100-Point Scoring Rubric

| Category | Points | What To Score |
| --- | ---: | --- |
| Audience fit and job-to-be-done | 10 | The video has one clear audience, one clear use case, and one next action. |
| Story arc | 15 | The video moves from pain to product proof to human-owned handoff. No bloated setup. |
| Instructional usability | 15 | Steps are accurate, visible, reproducible, and ordered around the user's task. |
| Trust and product truth | 15 | Claims are precise; caveats, fallback, privacy, and human review are explicit. |
| Cognitive load | 10 | One idea per scene; clean framing; short copy; visual cues guide attention. |
| Emotional credibility | 10 | The video feels field-aware, respectful, and specific without exploiting harm. |
| Accessibility | 10 | Captions or transcript, readable text, sufficient contrast, no audio-only meaning. |
| Production quality | 8 | Clear visuals, stable motion, readable screenshots, no broken media or dev overlays. |
| Conversion and handoff | 7 | Viewer knows what to do next: run demo, inspect export, review handoff, or ask for beta. |

Score bands:

- 90-100: publishable showcase quality.
- 85-89: publishable after minor copy or pacing cleanup.
- 75-84: useful draft; revise before external audience.
- 60-74: internal prototype only.
- Below 60: rebuild the storyline before polishing.

## Testing Scenarios

Run these before publishing a video externally.

### Scenario A: Cold Executive Or Judge

Participant: has not used the app; cares about value and credibility.

Task:

1. Watch `FragmentedDataPainpoint` once.
2. Answer four questions without prompting:
   - What problem is the product solving?
   - Why does it matter?
   - What proof did you see?
   - What would you do next?

Pass threshold:

- At least 4 of 5 viewers mention fragmented data, trust, caveats, or handoff.
- At least 4 of 5 identify that humans still own decisions.
- At least 3 of 5 want to see or try the demo next.

### Scenario B: First-Time Public Demo User

Participant: comfortable with web apps but unfamiliar with Dashboard Copilot.

Task:

1. Watch `PublicDemoUserFlow`.
2. Open `/demo`.
3. Complete the fragmented sample path to export.
4. Say where they would look for caveats before sharing output.

Pass threshold:

- 80% task success without facilitator rescue.
- Median completion time under 5 minutes.
- 80% can find or name readiness, source notes, caveats, or handoff summary.

### Future Scenario C: Analyst/Beta Tester

Participant: spreadsheet or data-heavy user.

Task:

1. Watch `AnalystWorkflowDeepDive`.
2. Complete the demo path.
3. Explain the difference between profiling, harmonization, and readiness.
4. Identify one unsafe cleaning behavior the product should not automate.

Pass threshold:

- 80% complete the path.
- 80% correctly explain at least 3 workflow stages.
- 80% understand row-preserving cleaning and no silent deletion/imputation.

### Scenario D: Safety And Privacy Reviewer

Participant: reviewer focused on risk, governance, or humanitarian data.

Task:

1. Watch `TrustRiskUserFlow`.
2. List what data is shown, what is not shown, and what persists.
3. Identify whether AI is required for the public demo.
4. Identify whether the tool approves operational action.

Pass threshold:

- 5 of 5 identify no raw uploaded rows/files should persist.
- 5 of 5 identify AI is optional or off for public deterministic demo.
- 5 of 5 identify the app supports review, not approval.

### Future Scenario E: Technical Reviewer

Participant: engineer, architect, or technical buyer.

Task:

1. Watch `TechnicalArchitectureExplainer`.
2. Describe the main boundaries: browser/session, API routes, provider calls,
   persistence, chart policy, and tests.
3. Name one verification they would ask for before trusting deployment.

Pass threshold:

- 4 of 5 accurately describe the session-only upload boundary.
- 4 of 5 correctly place AI provider calls server-side.
- 4 of 5 name a relevant verification gate.

### Scenario F: Silent Autoplay

Participant: any target user.

Task:

1. Watch the first 30 seconds muted.
2. State what the video is about.
3. Identify whether it is emotional story, walkthrough, trust video, or
   technical explainer.

Pass threshold:

- 80% can identify the topic.
- 80% can identify the video type.
- No critical message depends only on audio.

### Scenario G: Mobile Preview

Participant: any target user on a phone-size viewport.

Task:

1. Watch at mobile size.
2. Pause at three random moments.
3. Read the visible headline and explain the current point.

Pass threshold:

- Text is readable in all sampled pauses.
- No important UI detail is too small to interpret.
- No scene relies on dense screenshots without zoom/callout support.

## Test Sheet Template

Use one row per participant.

| Field | Value |
| --- | --- |
| Video ID |  |
| Participant persona | Executive / analyst / safety reviewer / technical reviewer / general user |
| Watched with sound? | Yes / No |
| Device | Desktop / laptop / tablet / mobile |
| Completion status | Full / partial / abandoned |
| Unaided task success | Success / partial / fail / not applicable |
| Time to complete follow-up task |  |
| Problem recall | 0-2 |
| Trust-boundary recall | 0-2 |
| Workflow recall | 0-2 |
| Emotional credibility | 1-5 |
| Respectful visual tone | Pass / fail |
| Accessibility issue observed |  |
| Quote worth keeping |  |
| Confusion or failure point |  |
| Required change before publish |  |

## Recommended Pilot Plan

Run one fast round before external release of the current three-part series:

1. Five viewers for the emotional opener.
2. Five first-time users for the public demo walkthrough.
3. Three safety/privacy reviewers for the trust path.

Run the future analyst and technical reviewer pilots only after those modules
are storyboarded, rendered, and embedded.

Do not average away serious failures. Fix any repeated confusion after two
participants, then retest the changed segment.

## Recommended Analytics Thresholds

Use these after publishing or sharing in a controlled beta. They are internal
decision thresholds, not universal industry laws.

| Video Type | Minimum Engagement Signal | Strong Signal |
| --- | --- | --- |
| Emotional opener under 90s | Average watch >= 50% | Average watch >= 65% and 10%+ click to demo/about |
| Public demo walkthrough | Average watch >= 45% | 80%+ demo task success after watching |
| Analyst deep dive | Average watch >= 35% | 70%+ completion of target workflow after watching |
| Trust/risk video | Average watch >= 45% | 90%+ trust-boundary recall |
| Technical explainer | Average watch >= 35% | 80%+ accurate boundary recall from technical reviewers |

If analytics are weak but task-success testing is strong, keep the video but
improve title, thumbnail, chaptering, or placement. If analytics are strong but
trust-boundary recall is weak, do not publish wider; the video is persuasive in
the wrong direction.

## Storyline Review Checklist

Before rendering:

- The first 8 seconds tell the viewer why to care.
- The audience is obvious by scene 2.
- Product proof appears before the halfway point.
- Every scene has one job.
- The emotional image is respectful and non-sensational.
- The app UI shown is current and reproducible.
- The video says or shows "review" rather than implying "approval".
- AI, privacy, and persistence boundaries are accurate.
- Captions or equivalent on-screen text exist.
- The final CTA is concrete: run demo, review handoff, inspect export, or ask for
  beta access.

## Scoring Decision Rule

Publish only when:

1. All release gates pass.
2. Overall score is at least 85.
3. The video-specific threshold passes.
4. The latest app path has been replayed against `/demo`.
5. A clean preview still or proof screenshot exists without dev overlays.

Anything below that is not a failed asset. It is a draft with a known repair
target.
