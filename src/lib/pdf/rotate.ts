import { PDFDocument, degrees } from 'pdf-lib';

export async function rotatePdf(
  bytes: Uint8Array,
  angle: 90 | 180 | 270,
  target: 'all' | number[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const pageCount = doc.getPageCount();
  const indices = target === 'all'
    ? Array.from({ length: pageCount }, (_, i) => i)
    : (target as number[]).map((n) => n - 1).filter((i) => i >= 0 && i < pageCount);

  for (const i of indices) {
    const page = doc.getPage(i);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }
  return doc.save();
}

const VALID_ROTATIONS = new Set([0, 90, 180, 270]);

export async function rotatePdfPerPage(
  bytes: Uint8Array,
  rotations: number[], // index = page index (0-based), value = additional degrees (0/90/180/270)
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const pageCount = doc.getPageCount();

  for (let i = 0; i < pageCount; i++) {
    if (!rotations[i]) continue;
    if (!VALID_ROTATIONS.has(rotations[i])) {
      throw new Error(`Invalid rotation ${rotations[i]} for page ${i}; must be 0, 90, 180, or 270`);
    }
    const page = doc.getPage(i);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rotations[i]) % 360));
  }
  return doc.save();
}
