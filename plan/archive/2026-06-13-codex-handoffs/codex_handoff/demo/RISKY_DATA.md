# Risky Quality Demo Data

Use this sample to show fallback/unsafe handling.

```csv
district_code,needs_score,response_gap_percent,affected_population
D01,78,125,-5
D02,64,40,100
D02,64,40,100
,70,55,200
```

Expected behavior:
- Duplicate records warning.
- Missing geography warning/failure.
- Invalid percent finding.
- Negative affected population finding.
- Decision readiness: `decision_unsafe` / `Not safe for action yet`.
- Dashboard still available for review, not automatic action.
