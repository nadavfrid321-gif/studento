import { supabase } from './supabase';
import type { TaskType } from '../types/database';

export interface ExtractedTask {
  type: TaskType;
  title: string;
  description?: string;
  due_date?: string; // ISO
  weight?: number;
  course_name_hint?: string;
  confidence: number;
}

export interface ExtractedImage {
  media_type: string; // image/png, image/jpeg, image/webp, image/gif
  data: string; // base64 (no data: prefix)
}

const ALLOWED_MEDIA = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function fileToImagePart(file: File): Promise<ExtractedImage> {
  let blob: Blob = file;
  let mediaType = file.type;

  // HEIC and other unsupported types: re-encode via canvas (browser must decode it natively;
  // Safari decodes HEIC, others may not — falls back with a clear error).
  if (!ALLOWED_MEDIA.has(mediaType)) {
    const reencoded = await reencodeToPng(file);
    blob = reencoded;
    mediaType = 'image/png';
  }

  const data = await blobToBase64(blob);
  return { media_type: mediaType, data };
}

async function reencodeToPng(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error(`לא ניתן לפענח את ${file.name}. נסה PNG או JPG.`));
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function pdfToImageParts(file: File, maxPages = 4): Promise<ExtractedImage[]> {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const pages = Math.min(pdf.numPages, maxPages);
  const out: ExtractedImage[] = [];

  for (let i = 1; i <= pages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
    );
    out.push({ media_type: 'image/png', data: await blobToBase64(blob) });
  }

  return out;
}

export async function extractTask(input: {
  text?: string;
  images?: ExtractedImage[];
}): Promise<ExtractedTask> {
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; task?: ExtractedTask; error?: string }>(
    'extract-task',
    { body: input },
  );
  if (error) throw new Error(error.message);
  if (!data?.ok || !data.task) throw new Error(data?.error ?? 'חילוץ המשימה נכשל.');
  return data.task;
}
