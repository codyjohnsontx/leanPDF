export type CaseMode = 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'snake' | 'kebab';

const SMALL_WORDS = new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is','it']);

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case 'upper': return text.toUpperCase();
    case 'lower': return text.toLowerCase();
    case 'title': {
      const words = text.toLowerCase().split(/\b/);
      return words.map((word, i) => {
        if (!/\w/.test(word)) return word;
        if (i === 0 || !SMALL_WORDS.has(word)) return word.charAt(0).toUpperCase() + word.slice(1);
        return word;
      }).join('');
    }
    case 'sentence': {
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
    }
    case 'camel': {
      return text.toLowerCase()
        .replace(/[\s_\-]+(.)/g, (_, c: string) => c.toUpperCase())
        .replace(/^(.)/, (c) => c.toLowerCase());
    }
    case 'snake': {
      return text.toLowerCase().replace(/[\s\-]+/g, '_').replace(/[^\w_]/g, '');
    }
    case 'kebab': {
      return text.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w\-]/g, '');
    }
  }
}
