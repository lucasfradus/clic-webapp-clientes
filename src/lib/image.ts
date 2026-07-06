// Convierte un archivo de imagen a data URI JPEG comprimido (canvas).
// El backend acepta png/jpg/webp; re-encodear a JPEG acota el tamaño del base64.
export async function fileToCompressedDataUri(
  file: File,
  maxDim = 1600,
  quality = 0.82
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () =>
        reject(new Error('No pudimos leer la imagen. Usá una foto JPG o PNG.'));
      i.src = url;
    });

    const scale = Math.min(
      1,
      maxDim / Math.max(img.naturalWidth, img.naturalHeight)
    );
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No pudimos procesar la imagen.');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
