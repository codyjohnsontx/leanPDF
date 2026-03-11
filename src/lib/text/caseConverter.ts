export type CaseMode = 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'snake' | 'kebab';

const SMALL_WORDS = new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is','it']);

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case 'upper': return text.toUpperCase();
    case 'lower': return text.toLowerCase();
    case 'title': {
      const tokens = text.toLowerCase().split(/\b/);
      let firstWordSeen = false;
      return tokens.map((word) => {
        if (!/\w/.test(word)) return word; // non-word token, pass through
        if (!firstWordSeen) {
          firstWordSeen = true;
          return word[0].toUpperCase() + word.slice(1);
        }
        return SMALL_WORDS.has(word.toLowerCase()) ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1);
      }).join('');
    }
    case 'sentence': {
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
    }
    case 'camel': {
      return text.toLowerCase()
        .replace(/[\s_-]+(.)/g, (_, c: string) => c.toUpperCase())
        .replace(/^(.)/, (c) => c.toLowerCase());
    }
    case 'snake': {
      return text.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^\w_]/g, '');
    }
    case 'kebab': {
      return text.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');
    }
  }
}
