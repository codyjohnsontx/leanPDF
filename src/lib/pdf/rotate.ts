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

export async function rotatePdfPerPage(
  bytes: Uint8Array,
  rotations: number[], // index = page index (0-based), value = additional degrees (0/90/180/270)
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const pageCount = doc.getPageCount();

  for (let i = 0; i < pageCount; i++) {
    if (!rotations[i]) continue;
    const page = doc.getPage(i);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rotations[i]) % 360));
  }
  return doc.save();
}
