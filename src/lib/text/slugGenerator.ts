export function generateSlug(text: string, separator: '-' | '_' = '-'): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, `-and-`)
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`${separator}{2,}`, 'g'), separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
}
