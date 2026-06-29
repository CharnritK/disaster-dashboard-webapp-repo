/** Bordered rounded table: panel sticky header, hairline horizontal rules only, hover tint #fafaf6. */
export interface DataTableProps {
  columns: string[];
  /** Row cells; ReactNode allowed (e.g. inline-code chips) */
  rows: Array<Array<React.ReactNode>>;
  /** Optional scroll cap, e.g. "300px" */
  maxHeight?: string;
}
