const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as','is','was','are','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','this','that','these','those','it','its']);

export interface KeywordEntry {
  keyword: string;
  occurrences: number;
  density: number;
}

export function analyzeKeywordDensity(text: string, filterStopWords: boolean, minLength: number): KeywordEntry[] {
  if (!text.trim()) return [];
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
  const words = normalized.split(/\s+/).filter((w) => w.length >= minLength);
  if (words.length === 0) return [];

  const freq = new Map<string, number>();
  for (const word of words) {
    if (filterStopWords && STOP_WORDS.has(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  const total = words.length;
  return Array.from(freq.entries())
    .map(([keyword, occurrences]) => ({
      keyword,
      occurrences,
      density: parseFloat(((occurrences / total) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 30);
}
