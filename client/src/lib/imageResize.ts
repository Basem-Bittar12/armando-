/**
 * تصغير صورة بالمتصفح قبل الرفع: ثلاث نسخ WebP بعرض 640 و1080 و1600 (لا تكبير لصورة أصغر).
 * Safari (آيفون) لا يُخرج WebP من canvas — حينها فقط نحمّل مُرمّز WebP صغيراً (WASM) فتبقى كل الصور WebP.
 */
import type { NewImage } from "@/lib/catalog/types";

export const IMAGE_WIDTHS = [640, 1080, 1600] as const;
const QUALITY = 0.82;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `img-${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      // imageOrientation يصحح صور الكاميرا المقلوبة (EXIF)
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // نكمل بالطريقة القديمة
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

type WasmEncode = (data: ImageData, options?: { quality?: number }) => Promise<ArrayBuffer>;
let wasmEncode: WasmEncode | null = null;

async function encodeWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  const native = await canvasToBlob(canvas, "image/webp", QUALITY);
  if (native && native.type === "image/webp") return native;
  // المتصفح أعاد PNG بدل WebP (Safari): نستعمل المُرمّز الاحتياطي
  if (!wasmEncode) wasmEncode = (await import("@jsquash/webp/encode")).default as unknown as WasmEncode;
  const context = canvas.getContext("2d")!;
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  const buffer = await wasmEncode!(data, { quality: Math.round(QUALITY * 100) });
  return new Blob([buffer], { type: "image/webp" });
}

/** صورة واحدة → النسخ الثلاث + معاينة */
export async function resizeImage(file: File): Promise<NewImage> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name}: ليس ملف صورة`);
  const source = await decode(file);
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const blobs = {} as NewImage["blobs"];
  for (const target of IMAGE_WIDTHS) {
    const scale = Math.min(1, target / width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d")!;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    blobs[target] = await encodeWebp(canvas);
  }
  // صورة المشاركة: JPEG (كل المتصفحات تُخرجه) لأن معاينة واتساب لا تعرض WebP دائماً
  const ogScale = Math.min(1, 1200 / width);
  const ogCanvas = document.createElement("canvas");
  ogCanvas.width = Math.round(width * ogScale);
  ogCanvas.height = Math.round(height * ogScale);
  ogCanvas.getContext("2d")!.drawImage(source, 0, 0, ogCanvas.width, ogCanvas.height);
  const og = (await canvasToBlob(ogCanvas, "image/jpeg", QUALITY)) ?? undefined;
  if ("close" in source) source.close();
  return { id: newId(), blobs, og, preview: URL.createObjectURL(blobs[640]) };
}
