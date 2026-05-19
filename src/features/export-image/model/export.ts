export function generateCompositeDataUrl(
  webglCanvas: HTMLCanvasElement,
  vectorCanvas: HTMLCanvasElement,
  width: number,
  height: number,
): string {
  const compositeCanvas = document.createElement("canvas");
  compositeCanvas.width = width;
  compositeCanvas.height = height;

  const ctx = compositeCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create offscreen 2D composite context");
  }

  ctx.drawImage(webglCanvas, 0, 0, width, height);
  ctx.drawImage(vectorCanvas, 0, 0, width, height);

  return compositeCanvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
