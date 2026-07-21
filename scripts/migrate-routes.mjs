#!/usr/bin/env node
/**
 * One-shot TanStack route → Next.js App Router migration helper.
 * Run from design_studio_plus root: node scripts/migrate-routes.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const routesDir = path.join(root, "src/routes");
const appDir = path.join(root, "src/app");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function stripRouteBoilerplate(src) {
  // Remove createFileRoute export block (multiline) — keep component + helpers
  let out = src.replace(
    /import\s*\{[^}]*\}\s*from\s*"@tanstack\/react-router";\n?/g,
    "",
  );
  out = out.replace(/export const Route = createFileRoute\([^)]*\)\(\{[\s\S]*?\}\);\n*/m, "");
  return out;
}

function addClientDirective(src) {
  if (src.startsWith('"use client"') || src.startsWith("'use client'")) return src;
  return `"use client";\n\n${src}`;
}

function rewriteImports(src) {
  return src
    .replace(/from "@tanstack\/react-router"/g, 'from "next/navigation"')
    .replace(/\bLink\b(?=\s+from)/g, "Link")
    .replace(/useNavigate\(\)/g, "useRouter()")
    .replace(/navigate\(\{\s*to:\s*"([^"]+)"\s*\}\)/g, 'router.push("$1")')
    .replace(/useRouterState\(\{\s*select:\s*\(s\)\s*=>\s*s\.location\.pathname\s*\}\)/g, "usePathname()")
    .replace(/Route\.useLoaderData\(\)/g, "/* loader replaced */ null");
}

// ---- kumas shared data ----
const kumasIndex = fs.readFileSync(path.join(routesDir, "kumas.index.tsx"), "utf8");
const collectionsMatch = kumasIndex.match(/export type RoomType[\s\S]*?export const collections: Collection\[\] = \[[\s\S]*?\];/);
const collectionTypes = kumasIndex.match(/export type RoomType[\s\S]*?roomType: RoomType;\n\};/)?.[0] ?? "";
const collectionsArr = kumasIndex.match(/export const collections: Collection\[\] = \[[\s\S]*?\];/)?.[0] ?? "";

const kumasColl = fs.readFileSync(path.join(routesDir, "kumas.$collection.index.tsx"), "utf8");
const partsBlock = kumasColl.match(/export type Part = \{[\s\S]*?export const parts: Part\[\] = \[[\s\S]*?\];/)?.[0] ?? "";

ensureDir(path.join(root, "src/lib"));
fs.writeFileSync(
  path.join(root, "src/lib/kumas-data.ts"),
  `${collectionTypes}\n\n${collectionsArr}\n\n${partsBlock}\n`,
);

// Simple page migrations: file → dest relative to app
const simplePages = [
  { src: "index.tsx", dest: "page.tsx", metadata: true },
  { src: "login.tsx", dest: "login/page.tsx", metadata: true },
  { src: "oda.tsx", dest: "oda/page.tsx", metadata: true },
  { src: "ai.tsx", dest: "ai/page.tsx", metadata: true },
  { src: "ai.upload.tsx", dest: "ai/upload/page.tsx", metadata: true },
  { src: "moduler.tsx", dest: "moduler/page.tsx", metadata: true },
  { src: "sosyal.tsx", dest: "sosyal/page.tsx", metadata: true },
  { src: "whatsapp-sms.tsx", dest: "whatsapp-sms/page.tsx", metadata: true },
  { src: "ayarlar.tsx", dest: "ayarlar/page.tsx", metadata: true },
  { src: "kullanicilar.tsx", dest: "kullanicilar/page.tsx", metadata: true },
];

function extractMetadata(src) {
  const m = src.match(/head:\s*\(\)\s*=>\s*\(\{\s*meta:\s*\[([\s\S]*?)\],?\s*\}\)/);
  if (!m) return null;
  const title = m[1].match(/\{\s*title:\s*"([^"]+)"\s*\}/)?.[1];
  const desc = m[1].match(/\{\s*name:\s*"description",\s*content:\s*"([^"]+)"\s*\}/)?.[1];
  if (!title) return null;
  return { title, description: desc };
}

function findComponentName(src) {
  const m = src.match(/component:\s*(\w+)/);
  return m?.[1] ?? null;
}

function transformSimple(fileSrc, opts = {}) {
  let raw = fs.readFileSync(path.join(routesDir, fileSrc), "utf8");
  const meta = extractMetadata(raw);
  const componentName = findComponentName(raw);

  raw = stripRouteBoilerplate(raw);

  // Fix Link: need next/link
  const needsLink = /\bLink\b/.test(raw);
  const needsNavigate = /useNavigate|useRouter\(\)|router\.push/.test(raw) || /navigate\(/.test(raw);
  const needsPathname = /useRouterState|usePathname/.test(raw);

  raw = raw.replace(/import\s*\{[^}]*\}\s*from\s*"@tanstack\/react-router";\n?/g, "");

  // login navigate
  raw = raw.replace(/const navigate = useNavigate\(\);/, "const router = useRouter();");
  raw = raw.replace(/navigate\(\{\s*to:\s*"\/"\s*\}\)/g, 'router.push("/")');

  // TanStack Link to="/x" → Next Link href="/x"
  raw = raw.replace(/<Link\s+([^>]*?)to=\{([^}]+)\}/g, "<Link $1href={$2}");
  raw = raw.replace(/<Link\s+([^>]*?)to="([^"]+)"/g, '<Link $1href="$2"');
  // Remove params= from Link (will fix kumas separately)
  raw = raw.replace(/\s+params=\{\{[^}]+\}\}/g, "");

  let imports = [];
  if (needsLink) imports.push('import Link from "next/link";');
  if (needsNavigate || raw.includes("useRouter") || raw.includes("router.push")) {
    imports.push('import { useRouter } from "next/navigation";');
  }
  if (needsPathname || raw.includes("usePathname")) {
    imports.push('import { usePathname } from "next/navigation";');
  }

  // Deduplicate lucide etc already there
  const headImports = imports.join("\n");
  raw = addClientDirective(raw);
  if (headImports) {
    raw = raw.replace(/^("use client";\n\n)/, `$1${headImports}\n`);
  }

  // Default export
  if (componentName && !raw.includes(`export default ${componentName}`)) {
    raw += `\nexport default ${componentName};\n`;
  }

  // Metadata as separate - for client pages we put metadata in a thin server wrapper later
  // For now attach as comment; we'll create page.tsx that re-exports
  return { body: raw, meta, componentName };
}

for (const page of simplePages) {
  const { body, meta, componentName } = transformSimple(page.src);
  const destPath = path.join(appDir, page.dest);
  ensureDir(path.dirname(destPath));

  // Write as ClientPage + thin page if metadata
  if (meta && componentName) {
    const clientPath = path.join(path.dirname(destPath), `${componentName}.tsx`);
    fs.writeFileSync(clientPath, body);
    fs.writeFileSync(
      destPath,
      `import type { Metadata } from "next";\nimport ${componentName} from "./${componentName}";\n\nexport const metadata: Metadata = {\n  title: ${JSON.stringify(meta.title)},\n  ${meta.description ? `description: ${JSON.stringify(meta.description)},` : ""}\n};\n\nexport default function Page() {\n  return <${componentName} />;\n}\n`,
    );
  } else {
    fs.writeFileSync(destPath, body);
  }
  console.log("wrote", page.dest);
}

console.log("done simple pages; kumas handled separately");
