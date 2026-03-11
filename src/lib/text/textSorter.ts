export type SortMode = 'alpha-asc' | 'alpha-desc' | 'numeric-asc' | 'numeric-desc' | 'reverse' | 'length-asc' | 'length-desc';

export interface SortOptions {
  mode: SortMode;
  removeEmptyLines: boolean;
  caseSensitive: boolean;
}

export function sortText(text: string, opts: SortOptions): string {
  let lines = text.replace(/\r\n/g, '\n').split('\n');
  if (opts.removeEmptyLines) lines = lines.filter((l) => l.trim().length > 0);

  const key = (s: string) => opts.caseSensitive ? s : s.toLowerCase();

  switch (opts.mode) {
    case 'alpha-asc':
      lines.sort((a, b) => key(a).localeCompare(key(b)));
      break;
    case 'alpha-desc':
      lines.sort((a, b) => key(b).localeCompare(key(a)));
      break;
    case 'numeric-asc':
      lines.sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        if (isNaN(na) && isNaN(nb)) return 0;
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        return na - nb;
      });
      break;
    case 'numeric-desc':
      lines.sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        if (isNaN(na) && isNaN(nb)) return 0;
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        return nb - na;
      });
      break;
    case 'reverse':
      lines.reverse();
      break;
    case 'length-asc':
      lines.sort((a, b) => a.length - b.length);
      break;
    case 'length-desc':
      lines.sort((a, b) => b.length - a.length);
      break;
  }
  return lines.join('\n');
}
