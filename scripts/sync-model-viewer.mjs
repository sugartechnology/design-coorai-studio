import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(
  root,
  "../3d-room-designer/dist-sugar-model-viewer/sugar-model-viewer.js",
);
const dest = join(root, "public/vendor/sugar-model-viewer.js");

if (!existsSync(source)) {
  console.error(
    `[sync:model-viewer] Missing build: ${source}\n` +
      `Run \`npm run build:sugar-model-viewer\` in 3d-room-designer first.`,
  );
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(source, dest);
console.log(`[sync:model-viewer] Copied → ${dest}`);
