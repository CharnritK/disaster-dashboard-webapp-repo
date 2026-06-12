# Problem Statement Alignment

> Archive notice: this alignment note belongs to the historical handoff package, not current project guidance. Use `README.md`, `AGENTS.md`, and `docs/README.md` for current setup and product contract.

The demo must visibly solve these pain points:

## Fragmentation
Data comes from different organizations, formats, and geographic identifiers.

Demo proof:
- Load needs assessment, population baseline, and service capacity CSV files.
- Use different key names such as `admin_pcode`, `admin_code`, and `district_id`.

## Understanding datasets
Users spend time finding and understanding datasets.

Demo proof:
- Show profile cards.
- Show Evidence Coverage Map that translates columns into decision evidence.

## Determining relationships
Users need to understand how datasets relate.

Demo proof:
- Show join/combine recommendation and match-rate caveat.
- Human must accept or adjust before combining.

## Harmonizing schemas and identifiers
Users manually align schemas and identifiers.

Demo proof:
- Join recommendation bridges different key names.
- Transformation log records what happened.

## Cleaning and validating
Users need quality checks.

Demo proof:
- Show missingness, duplicates, invalid values, join completeness, and decision readiness.
- Load risky sample to demonstrate `decision_unsafe`.

## Documentation and auditability
Information management officers need to explain how outputs were produced.

Demo proof:
- Export decision handoff log with evidence coverage, readiness, join review, quality, transformations.

## No-code accessibility
Users may not be data engineers.

Demo proof:
- Template-first UX.
- Plain-language labels.
- Status text, not color only.
- Downloadable suggested collection template.
