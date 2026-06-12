# Disaster Map Rules

Maps can mislead quickly in disaster response. Use map-like views only when the encoding is valid.

## Allowed

- Local coordinate plots from uploaded latitude and longitude fields.
- Choropleths only for normalized rate, ratio, density, or index measures with verified local boundary geometry.
- Ranked bars or tables for raw counts by area.

## Not Allowed

- Raw-count choropleths.
- Geocoding or remote basemap calls from browser code.
- Boundary maps without verified local geometry.
- Treating uploaded area names as authoritative boundaries.

## Phase 1 Policy

This repo currently has no GIS dependency and no full boundary renderer. `choropleth` specs therefore fall back to bar/table unless the policy is explicitly called with verified geometry support.
