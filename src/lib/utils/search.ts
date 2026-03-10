export type SearchIndexEntry = {
  pageNumber: number;
  text: string;
};

export type SearchResult = {
  pageNumber: number;
  matchCount: number;
  snippet: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildSearchResults(entries: SearchIndexEntry[], query: string): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const matcher = new RegExp(escapeRegExp(normalizedQuery), 'gi');

  return entries
    .map((entry) => {
      const lowered = entry.text.toLowerCase();
      const firstIndex = lowered.indexOf(normalizedQuery);
      if (firstIndex < 0) {
        return null;
      }

      const matches = lowered.match(matcher);
      const start = Math.max(0, firstIndex - 36);
      const end = Math.min(entry.text.length, firstIndex + normalizedQuery.length + 64);
      const snippet = entry.text.slice(start, end).replace(/\s+/g, ' ').trim();

      return {
        pageNumber: entry.pageNumber,
        matchCount: matches?.length ?? 1,
        snippet,
      } satisfies SearchResult;
    })
    .filter((result): result is SearchResult => Boolean(result));
}
