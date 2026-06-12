# 06 — Simulated Data Spec

> Archive notice: this is a historical visualization-guardrails sample-data spec, not current project guidance. Use current `public/samples/`, `data/samples/`, and `README.md` sample guidance for active app behavior.

## Goal

Create deterministic synthetic data to test visualization policy without external data or network calls.

## Required files

```text
public/samples/needs_assessment_synthetic.csv
public/samples/population_synthetic.csv
public/samples/admin_boundaries_synthetic.geojson
```

If production samples should not be modified, put them under `tests/fixtures/`.

## Required edge cases

- 12+ districts.
- Multiple dates.
- Valid response gap percentages.
- One invalid percentage greater than 100.
- One negative affected household count.
- One missing district name.
- One missing response gap.
- One outlier.
- Geographic key shared across CSV and GeoJSON.
- Population denominator for normalized rates.

## Suggested fields

### `needs_assessment_synthetic.csv`

```text
district_code
district_name
reported_at
affected_households
response_gap_percent
damage_severity
shelter_capacity
shelter_occupied
water_access_percent
data_source
notes
```

### `population_synthetic.csv`

```text
district_code
district_name
population
households
admin_level
```

### `admin_boundaries_synthetic.geojson`

Use simple rectangles. Do not represent real boundaries unless authoritative data is approved.

## Test scenarios

### S1 — Comparison

Question:
- Which districts have the highest response gap?

Expected:
- sorted bar;
- `value_desc`;
- unit `%`;
- top-N mobile behavior.

### S2 — Trend

Question:
- How did affected households change over time?

Expected:
- line if at least two dates;
- `time_asc`;
- threshold annotation if present.

### S3 — Invalid pie

Question:
- Show share of affected households by district.

Expected:
- pie request converts to bar because many categories.

### S4 — Quality block

Question:
- Chart response gap where a value is greater than 100.

Expected:
- quality badge `block` or `warn`;
- source note/caveat visible.

### S5 — Raw count choropleth

Question:
- Map affected households by district.

Expected:
- no choropleth;
- ranked bar/table fallback;
- rationale explains raw counts.

### S6 — Normalized choropleth

Question:
- Map affected households per 1,000 population.

Expected:
- choropleth spec allowed if map component and geometry exist;
- otherwise fallback with map-ready metadata.

## Fixture generation notes

Keep values deterministic. Do not use random generation in tests unless seeded.
