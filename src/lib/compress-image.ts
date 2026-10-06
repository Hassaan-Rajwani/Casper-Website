/** Firestore string fields must stay under ~1,048,487 bytes; leave headroom for JSON encoding. */
export const FIRESTORE_IMAGE_DATA_URL_MAX = 900_000;

function renderToCanvas(bitmap: ImageBitmap, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser cannot process images.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToCompactDataUrl(canvas: HTMLCanvasElement, quality: number) {
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) {
    return webp;
  }

  return canvas.toDataURL("image/jpeg", quality);
}

const COMPRESS_ATTEMPTS: Array<{ maxSide: number; quality: number }> = [
  { maxSide: 1200, quality: 0.82 },
  { maxSide: 1000, quality: 0.76 },
  { maxSide: 900, quality: 0.72 },
  { maxSide: 800, quality: 0.68 },
  { maxSide: 640, quality: 0.62 },
  { maxSide: 512, quality: 0.58 },
  { maxSide: 420, quality: 0.52 },
];

export async function compressImageForFirestore(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  try {
    for (const attempt of COMPRESS_ATTEMPTS) {
      const canvas = renderToCanvas(bitmap, attempt.maxSide);
      const dataUrl = canvasToCompactDataUrl(canvas, attempt.quality);
      if (dataUrl.length <= FIRESTORE_IMAGE_DATA_URL_MAX) {
        return dataUrl;
      }
    }

    throw new Error(
      "Image is still too large after compression. Use a smaller photo or paste a direct image URL (https://...) instead.",
    );
  } finally {
    bitmap.close();
  }
}

export function isFirestoreSafeImageUrl(imageUrl: string) {
  if (!imageUrl.startsWith("data:")) {
    return true;
  }

  return imageUrl.length <= FIRESTORE_IMAGE_DATA_URL_MAX;
}
