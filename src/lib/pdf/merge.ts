import { PDFDocument } from 'pdf-lib';

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const output = await PDFDocument.create();
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let src: PDFDocument;
    try {
      src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch {
      throw new Error(`Could not load "${file.name}". It may be password-protected or corrupted.`);
    }
    if (src.isEncrypted) {
      throw new Error(`"${file.name}" is password-protected and cannot be merged.`);
    }
    const indices = src.getPageIndices();
    const copied = await output.copyPages(src, indices);
    copied.forEach((page) => output.addPage(page));
  }
  return output.save();
}
