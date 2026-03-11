export interface WordCountResult {
  words: number;
  charsWithSpaces: number;
  charsWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
}

export function countWords(text: string): WordCountResult {
  if (!text.trim()) {
    return { words: 0, charsWithSpaces: 0, charsWithoutSpaces: 0, sentences: 0, paragraphs: 0 };
  }
  const words = (text.match(/\S+/g) ?? []).length;
  const charsWithSpaces = text.length;
  const charsWithoutSpaces = text.replace(/\s/g, '').length;
  const sentences = (text.match(/[^.!?]*[.!?]+/g) ?? []).filter((s) => s.trim().length > 0).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  return { words, charsWithSpaces, charsWithoutSpaces, sentences, paragraphs };
}
