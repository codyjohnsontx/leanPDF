import { describe, expect, it } from 'vitest';
import { buildSearchResults } from '../lib/utils/search';

describe('buildSearchResults', () => {
  it('returns page-level hits with snippets and counts', () => {
    const results = buildSearchResults(
      [
        { pageNumber: 1, text: 'leanPDF makes signing and annotation fast for personal files.' },
        { pageNumber: 2, text: 'Nothing relevant here.' },
        { pageNumber: 3, text: 'Signing twice means signing and then saving.' },
      ],
      'sign',
    );

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ pageNumber: 1, matchCount: 1 });
    expect(results[1]).toMatchObject({ pageNumber: 3, matchCount: 2 });
  });
});
