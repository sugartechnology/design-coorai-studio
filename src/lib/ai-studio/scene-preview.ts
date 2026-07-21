"use client";

/**
 * Renders a flattened scene preview (room bg + product thumbs) for CRM drag-drop generate.
 */
export async function renderScenePreviewBlob(input: {
  stageWidth: number;
  stageHeight: number;
  backgroundImageUrl?: string | null;
  objects: Array<{
    src?: string | null;
    xPct: number;
    yPct: number;
    scale: number;
    name: string;
  }>;
}): Promise<Blob | null> {
  const width = Math.max(640, Math.round(input.stageWidth) || 1280);
  const height = Math.max(360, Math.round(input.stageHeight) || 720);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(0, 0, width, height);

  if (input.backgroundImageUrl) {
    try {
      const bg = await loadImage(input.backgroundImageUrl);
      ctx.drawImage(bg, 0, 0, width, height);
    } catch {
      /* keep solid bg */
    }
  }

  for (const obj of input.objects) {
    const size = Math.round(96 * (obj.scale || 1));
    const x = (obj.xPct / 100) * width - size / 2;
    const y = (obj.yPct / 100) * height - size / 2;
    if (obj.src) {
      try {
        const img = await loadImage(obj.src);
        ctx.drawImage(img, x, y, size, size);
        continue;
      } catch {
        /* fall through to placeholder */
      }
    }
    ctx.fillStyle = "rgba(31,95,168,0.25)";
    roundRect(ctx, x, y, size, size, 12);
    ctx.fill();
    ctx.fillStyle = "#1f5fa8";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(obj.name.slice(0, 16), x + size / 2, y + size / 2);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
