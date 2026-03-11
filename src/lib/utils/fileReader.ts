export function readFileAsBytes(file: File): Promise<Uint8Array> {
  return file.arrayBuffer().then((buf) => new Uint8Array(buf));
}

export function readFileAsText(file: File, encoding = 'utf-8'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, encoding);
  });
}
