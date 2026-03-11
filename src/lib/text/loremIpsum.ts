const WORDS = [
  'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do',
  'eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim',
  'ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi',
  'aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit',
  'voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint',
  'occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt',
  'mollit','anim','id','est','laborum','curabitur','pretium','tincidunt','lacus',
  'nec','tristique','urna','dui','semper','lacinia','odio','varius','hendrerit',
  'blandit','augue','vel','purus','gravida','sagittis','viverra','nam','libero',
];

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function randomWords(count: number, offset = 0): string[] {
  return Array.from({ length: count }, (_, i) => WORDS[(i + offset) % WORDS.length]);
}

function makeSentence(wordCount: number, offset: number): string {
  return capitalize(randomWords(wordCount, offset).join(' ')) + '.';
}

export type LoremMode = 'words' | 'sentences' | 'paragraphs';

export function generateLorem(mode: LoremMode, count: number, startWithLorem = true): string {
  if (count <= 0) return '';
  const prefix = startWithLorem ? 'Lorem ipsum dolor sit amet. ' : '';

  if (mode === 'words') {
    const words = randomWords(count, startWithLorem ? 5 : 0);
    return capitalize(words.join(' ')) + '.';
  }

  if (mode === 'sentences') {
    const sentences = Array.from({ length: count }, (_, i) => makeSentence(8 + (i % 5), i * 8));
    return (startWithLorem ? prefix : '') + sentences.join(' ');
  }

  // paragraphs
  const paragraphs = Array.from({ length: count }, (_, pi) => {
    const sentenceCount = 4 + (pi % 3);
    const sentences = Array.from({ length: sentenceCount }, (_, si) => makeSentence(8 + (si % 4), pi * 40 + si * 8));
    return sentences.join(' ');
  });
  return (startWithLorem && paragraphs.length > 0 ? prefix + paragraphs[0] + '\n\n' + paragraphs.slice(1).join('\n\n') : paragraphs.join('\n\n'));
}
