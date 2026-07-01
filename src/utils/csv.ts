// Safe CSV serialization (RFC 4180). Hand-rolled `row.join(',')` corrupts the file
// whenever a value contains a comma, quote, or newline (common in names, subjects,
// addresses). This escapes properly AND guards against CSV/formula injection — a real
// risk when the export is opened in Excel/Sheets, which execute cells starting with
// = + - @ (e.g. `=HYPERLINK(...)`).
function escapeCell(value: unknown): string {
  let s = value == null ? '' : String(value);
  // Formula-injection guard: neutralise a leading formula trigger.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  // RFC 4180: quote fields containing comma, double-quote, CR or LF; double internal quotes.
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build a CSV string from a header row and data rows, escaping every cell. */
export function toCsv(headers: readonly string[], rows: readonly unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}
