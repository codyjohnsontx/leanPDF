export function downloadBytes(filename: string, bytes: Uint8Array, mimeType: string) {
  const blob = new Blob([Uint8Array.from(bytes)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, text: string, mimeType = 'text/plain;charset=utf-8'): void {
  downloadBlob(filename, new Blob([text], { type: mimeType }));
}
