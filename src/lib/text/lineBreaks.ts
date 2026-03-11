export type LineBreakMode = 'remove-single' | 'remove-all' | 'add-after-sentence' | 'add-every-n-words';

export function processLineBreaks(text: string, mode: LineBreakMode, n = 10): string {
  const normalized = text.replace(/\r\n/g, '\n');
  switch (mode) {
    case 'remove-single':
      return normalized.replace(/(?<!\n)\n(?!\n)/g, ' ');
    case 'remove-all':
      return normalized.replace(/\n+/g, ' ').replace(/ {2,}/g, ' ').trim();
    case 'add-after-sentence':
      return normalized.replace(/([.!?])\s+/g, '$1\n');
    case 'add-every-n-words': {
      if (n <= 0) return normalized;
      const words = normalized.replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += n) chunks.push(words.slice(i, i + n).join(' '));
      return chunks.join('\n');
    }
  }
}
