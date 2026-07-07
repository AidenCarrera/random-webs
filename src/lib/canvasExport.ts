export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Unable to create PNG blob."));
    }, "image/png");
  });
}

export async function downloadCanvasPng(
  canvas: HTMLCanvasElement,
  fileName: string,
): Promise<void> {
  const blob = await canvasToBlob(canvas);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.download = fileName;
  link.href = objectUrl;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
