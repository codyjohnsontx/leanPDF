export type ParseResult =
  | { kind: 'ok'; pages: number[] }
  | { kind: 'error'; message: string };

export function parsePageRanges(input: string, pageCount: number): ParseResult {
  if (!input.trim()) return { kind: 'error', message: 'Enter at least one page or range.' };

  const pages: number[] = [];
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    const singleMatch = part.match(/^(\d+)$/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start < 1 || end > pageCount || start > end) {
        return { kind: 'error', message: `Range "${part}" is out of bounds (1–${pageCount}).` };
      }
      for (let i = start; i <= end; i++) pages.push(i);
    } else if (singleMatch) {
      const n = parseInt(singleMatch[1], 10);
      if (n < 1 || n > pageCount) {
        return { kind: 'error', message: `Page ${n} is out of bounds (1–${pageCount}).` };
      }
      pages.push(n);
    } else {
      return { kind: 'error', message: `"${part}" is not a valid page number or range.` };
    }
  }

  return { kind: 'ok', pages: [...new Set(pages)].sort((a, b) => a - b) };
}
