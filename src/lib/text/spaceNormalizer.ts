export interface SpaceNormalizerOptions {
  collapseSpaces: boolean;
  trimLines: boolean;
  trimDocument: boolean;
}

export function normalizeSpaces(text: string, opts: SpaceNormalizerOptions): string {
  let result = text;
  if (opts.collapseSpaces) result = result.replace(/ {2,}/g, ' ');
  if (opts.trimLines) result = result.split('\n').map((l) => l.trim()).join('\n');
  if (opts.trimDocument) result = result.trim();
  return result;
}
