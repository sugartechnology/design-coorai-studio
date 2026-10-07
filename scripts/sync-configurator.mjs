import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(
  root,
  "../3d-room-designer/dist-nconfigurator/sugar-configurator.js",
);
const dest = join(root, "public/vendor/sugar-configurator.js");

if (!existsSync(source)) {
  console.error(
    `[sync:configurator] Missing build: ${source}\n` +
      `Run \`npm run build:configurator\` in 3d-room-designer first.`,
  );
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(source, dest);
console.log(`[sync:configurator] Copied → ${dest}`);
