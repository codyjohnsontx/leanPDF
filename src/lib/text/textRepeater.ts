export function repeatText(text: string, count: number, separator: string): string {
  if (count <= 0 || !text) return '';
  if (count > 10000) throw new Error('Count must be 10,000 or less.');
  const sep = separator.replace(/\\n/g, '\n');
  return Array(count).fill(text).join(sep);
}
