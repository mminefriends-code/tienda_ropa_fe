import { removeBackground, type Config as RemovalConfig } from '@imgly/background-removal';

export interface CutoutProgress {
  stage: 'loading-model' | 'processing';
  percent: number;
}

const cutoutCache = new Map<string, string>();

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export function fastCanvasBackgroundRemoval(
  img: HTMLImageElement,
  onProgress?: (progress: CutoutProgress) => void,
): string {
  onProgress?.({ stage: 'processing', percent: 45 });
  const canvas = document.createElement('canvas');
  const maxDim = 900;
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (w > maxDim || h > maxDim) {
    if (w > h) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  onProgress?.({ stage: 'processing', percent: 65 });

  // Muestreo de esquinas y bordes
  const cornerPixels = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
    [Math.floor(w / 2), 0],
    [0, Math.floor(h / 2)],
    [w - 1, Math.floor(h / 2)],
  ];

  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  for (const [cx, cy] of cornerPixels) {
    const idx = (cy * w + cx) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR = Math.round(bgR / cornerPixels.length);
  bgG = Math.round(bgG / cornerPixels.length);
  bgB = Math.round(bgB / cornerPixels.length);

  const threshold = 38;
  const feather = 18;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
    const isBrightBg = bgR > 210 && bgG > 210 && bgB > 210 && (r > 225 && g > 225 && b > 225);

    if (dist < threshold || isBrightBg) {
      data[i + 3] = 0;
    } else if (dist < threshold + feather) {
      const factor = (dist - threshold) / feather;
      data[i + 3] = Math.round(data[i + 3] * factor);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  onProgress?.({ stage: 'processing', percent: 90 });
  return canvas.toDataURL('image/png');
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

export async function cutoutImage(
  source: Blob | string,
  onProgress?: (progress: CutoutProgress) => void,
): Promise<string> {
  const config: RemovalConfig = {
    model: 'isnet_quint8',
    output: { format: 'image/png', quality: 0.95 },
    progress: (key, current, total) => {
      const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
      onProgress?.({
        stage: key === 'fetch' ? 'loading-model' : 'processing',
        percent,
      });
    },
  };

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout procesando IA')), 4000);
  });

  const blob = await Promise.race([removeBackground(source, config), timeoutPromise]);
  return blobToDataUrl(blob);
}

export async function cutoutFromUrl(
  url: string,
  onProgress?: (progress: CutoutProgress) => void,
): Promise<string> {
  if (cutoutCache.has(url)) {
    onProgress?.({ stage: 'processing', percent: 100 });
    return cutoutCache.get(url)!;
  }

  onProgress?.({ stage: 'loading-model', percent: 20 });

  try {
    const result = await cutoutImage(url, onProgress);
    cutoutCache.set(url, result);
    onProgress?.({ stage: 'processing', percent: 100 });
    return result;
  } catch {
    onProgress?.({ stage: 'processing', percent: 40 });
    try {
      const img = await loadImage(url);
      const fastResult = fastCanvasBackgroundRemoval(img, onProgress);
      cutoutCache.set(url, fastResult);
      onProgress?.({ stage: 'processing', percent: 100 });
      return fastResult;
    } catch {
      onProgress?.({ stage: 'processing', percent: 100 });
      return url;
    }
  }
}


