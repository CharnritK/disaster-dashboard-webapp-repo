# Chart Selection Rules

Use the simplest truthful view that answers the operational question.

## Defaults

- Comparison and ranking: bar chart sorted by value descending.
- Trend: line chart sorted by time ascending, only with at least two valid time points.
- Relationship: scatter chart for two numeric fields.
- Details: table when row-level review matters.
- Missingness and quality: explicit quality view, not hidden hover text.

## Part-To-Whole

Pie charts are allowed only when:

- the values are additive and positive;
- the category count is small;
- the chart is truly part-to-whole;
- labels and text alternatives remain readable.

Otherwise convert to bar.

## Policy Ownership

The LLM can suggest a chart, but `enforceVizPolicy()` owns the final chart type, sort order, mobile behavior, quality badge, and map fallback.
