// =============================================================================
// Bandeja de aprobación (versión consola) — lista todo el contenido que está
// PENDIENTE de tu visto bueno (status distinto de "published").
//
// Uso:  node scripts/list-drafts.mjs   (o: npm run drafts)
//
// La versión visual sin código (Keystatic) llega al desplegar (Fase 7).
// Ver docs/AUTOMATIZACION-Y-FLUJO-EDITORIAL.md
// =============================================================================
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const base = join(process.cwd(), "src", "content");
const collections = ["articulos", "lugares", "eventos"];

/** Extrae un campo simple del frontmatter YAML o del JSON. */
function readMeta(file) {
  const text = readFileSync(file, "utf8");
  if (file.endsWith(".json")) {
    try {
      const o = JSON.parse(text);
      return { status: o.status ?? "draft", title: o.title ?? o.name ?? "", lang: o.lang, source: o.source };
    } catch {
      return { status: "draft", title: "(JSON ilegible)" };
    }
  }
  // Markdown/MDX: leer frontmatter entre --- ---
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  const block = fm ? fm[1] : "";
  const get = (k) => {
    const m = block.match(new RegExp(`^${k}:\\s*"?(.+?)"?\\s*$`, "m"));
    return m ? m[1] : undefined;
  };
  return { status: get("status") ?? "draft", title: get("title") ?? "", lang: get("lang"), source: get("source") };
}

let pending = 0;

for (const col of collections) {
  const dir = join(base, col);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter((f) => /\.(json|md|mdx)$/.test(f));
  const items = files
    .map((f) => ({ f, ...readMeta(join(dir, f)) }))
    .filter((i) => i.status !== "published");

  if (items.length) {
    console.log(`\n▸ ${col.toUpperCase()} (${items.length} pendiente/s)`);
    for (const i of items) {
      const src = i.source && i.source !== "humano" ? ` [${i.source}]` : "";
      console.log(`   · [${i.status}] ${i.title}${i.lang ? ` (${i.lang})` : ""}${src}  — ${i.f}`);
      pending++;
    }
  }
}

if (pending === 0) {
  console.log("\n✓ No hay nada pendiente: todo el contenido está publicado.\n");
} else {
  console.log(`\nTotal pendiente de aprobación: ${pending}.`);
  console.log(`Para publicar uno, cambia su "status" a "published" (o pídemelo a mí).\n`);
}
