# Typhoon Kestrel AI-Mode Demo

## Scenario

Typhoon Kestrel has pushed coastal surge and inland flooding into a mid-size metro area on June 12, 2026. The emergency operations team needs to decide where to prioritize evacuations, shelter overflow support, water delivery, medical response, sanitation support, and generator deployment.

## Demo files

Upload these files together through the dashboard:

- `typhoon-kestrel-districts.csv`
- `typhoon-kestrel-incident-reports.csv`
- `typhoon-kestrel-shelters.csv`
- `typhoon-kestrel-resource-inventory.csv`
- `typhoon-kestrel-needs-assessments.csv`

Copies are available in both `data/samples/` and `public/samples/`.

## What the app should notice

- `district_id` is the common join key across all five datasets.
- Old Market, Riverbend, South Flats, and East Lagoon should rise as high-priority districts.
- Old Market has the strongest combined signal: highest flood risk, severe incident reports, high evacuee count, near-full shelter, power outage impact, and high medical need.
- East Lagoon should surface as a shelter and water stress concern because its shelter is nearly full, generator availability is false, and available water inventory is low.
- Hillcrest should stand out as a medical-response exception: lower flood risk but high injury and medical-priority signals.
- Lower Green has lower-confidence assessment data and missing resource and potable-water values, so quality caveats should remain visible.

## Safe cleaning signals

This scenario intentionally includes only safe, row-preserving cleaning issues:

- one `district_id` value with leading and trailing whitespace in incident reports
- missing numeric values in district poverty percentage, shelter potable-water hours, and resource quantity
- boolean strings such as `true` and `false`
- numeric strings that should be coercible during parsing

Do not demo row deletion, imputation, deduplication, fuzzy matching, or category recoding as automatic cleaning behavior with this data.

## AI-mode prompt angle

Use AI recommendations to ask for an operations dashboard that answers:

- Which districts need immediate evacuation or shelter overflow action?
- Where are water, meal, generator, sanitation, and medical resources mismatched to need?
- Which recommendations depend on lower-confidence or incomplete data?
- What dashboard views should an incident commander review first?

Expected useful outputs include district priority ranking, shelter occupancy pressure, water gap analysis, medical exception detection, power outage impact, and data quality caveats.
