/**
 * COPIA DE SEGURIDAD de las carpetas que NO están en git.
 *
 * POR QUÉ EXISTE (KAN-53, abierta desde junio; escrito el 17-ago-2026 después de
 * que el mismo riesgo mordiera DOS VECES en un día):
 *   · por la mañana, el trabajo del planificador existía solo en este portátil,
 *     en una rama sin subir, con 1.123 líneas sin commitear;
 *   · por la tarde, los arreglos del escáner de fotos y del diccionario de
 *     lugares se quedaron en `REDES-SOCIALES/`, que está en `.gitignore`.
 *
 * QUÉ COPIA Y QUÉ NO. Lo irreemplazable del pipeline de redes son **542 ficheros
 * y 3,9 MB** de código, catálogos, diccionarios y bancos de contenido. Los otros
 * ~18 GB son vídeo y foto renderizados o de stock: pesan mucho y se recuperan
 * (se vuelven a renderizar o a licenciar). Así que esto copia la FUENTE y deja
 * fuera la media, y **dice en voz alta lo que ha dejado fuera** — un respaldo que
 * calla lo que no guarda es peor que ninguno, porque da falsa tranquilidad.
 *
 * USO:  node scripts/copia-carpetas-sin-git.mjs [carpeta-destino]
 * Por defecto escribe en  C:/Users/Cristian/Desktop/COPIAS-CALMA  (disco C:,
 * distinto del D: donde vive el proyecto: así un fallo de disco no se lleva las
 * dos). ⚠️ Esto NO protege del robo o la pérdida del portátil: para eso la copia
 * tiene que salir de la máquina.
 */
import fs from "node:fs";
import path from "node:path";

// Carpetas fuera de git que contienen trabajo propio irreemplazable.
const CARPETAS = [
  "REDES-SOCIALES",
  "marca",
  "ESTRATEGIA",
  "NEGOCIO",
  "COLABORACIONES",
  "_PANEL",
  "MARCA-PARA-ABRIR",
];

// Lo que nunca entra: dependencias y basura reinstalable.
const EXCLUIR_DIR = new Set(["node_modules", ".git", ".astro", "dist", ".cache", "out"]);

// Media pesada: se puede volver a renderizar o licenciar. No entra.
const EXT_MEDIA = new Set([
  ".mp4", ".mov", ".m4v", ".avi", ".webm",
  ".wav", ".mp3", ".m4a", ".aac",
  ".psd", ".ai", ".sketch", ".zip", ".tgz", ".tar", ".gz",
]);

// Las imágenes sí entran, pero solo si son pequeñas (logos, plantillas, muestras).
// Una foto de 8 MB es material, no fuente.
const EXT_IMAGEN = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg", ".gif", ".ico"]);
const LIMITE_IMAGEN = 1.5 * 1024 * 1024; // 1,5 MB

const destinoBase = process.argv[2] || "C:/Users/Cristian/Desktop/COPIAS-CALMA";
const sello = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const destino = path.join(destinoBase, `calma-sin-git-${sello}`);

const copiados = [];
const fuera = { media: [], imagenGrande: [], deps: 0 };

function recorrer(dir, rel = "") {
  let entradas;
  try {
    entradas = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entradas) {
    const abs = path.join(dir, e.name);
    const relativo = path.join(rel, e.name);
    if (e.isDirectory()) {
      if (EXCLUIR_DIR.has(e.name)) {
        fuera.deps++;
        continue;
      }
      recorrer(abs, relativo);
      continue;
    }
    if (!e.isFile()) continue;

    const ext = path.extname(e.name).toLowerCase();
    if (EXT_MEDIA.has(ext)) {
      fuera.media.push(relativo);
      continue;
    }
    let tam = 0;
    try {
      tam = fs.statSync(abs).size;
    } catch {
      continue;
    }
    if (EXT_IMAGEN.has(ext) && tam > LIMITE_IMAGEN) {
      fuera.imagenGrande.push(`${relativo} (${(tam / 1024 / 1024).toFixed(1)} MB)`);
      continue;
    }

    const salida = path.join(destino, relativo);
    fs.mkdirSync(path.dirname(salida), { recursive: true });
    fs.copyFileSync(abs, salida);
    copiados.push({ rel: relativo, tam });
  }
}

for (const c of CARPETAS) {
  if (!fs.existsSync(c)) {
    console.log(`  (no existe, se salta: ${c})`);
    continue;
  }
  recorrer(c, c);
}

const totalMB = copiados.reduce((a, f) => a + f.tam, 0) / 1024 / 1024;

// Manifiesto dentro de la propia copia: que el respaldo se explique solo.
const manifiesto = [
  `COPIA DE LAS CARPETAS SIN GIT — ${new Date().toISOString()}`,
  ``,
  `Origen : ${process.cwd()}`,
  `Destino: ${destino}`,
  ``,
  `COPIADO: ${copiados.length} ficheros · ${totalMB.toFixed(1)} MB`,
  ``,
  `DEJADO FUERA A PROPÓSITO (recuperable, no es fuente):`,
  `  · ${fuera.media.length} ficheros de vídeo/audio/comprimidos`,
  `  · ${fuera.imagenGrande.length} imágenes de más de 1,5 MB (material, no fuente)`,
  `  · ${fuera.deps} carpetas de dependencias o compilados`,
  ``,
  `⚠️ ESTA COPIA ES LOCAL. No protege del robo ni de la pérdida del portátil:`,
  `   para eso hay que sacarla de la máquina.`,
  ``,
  `--- imágenes grandes omitidas ---`,
  ...fuera.imagenGrande.slice(0, 40),
  fuera.imagenGrande.length > 40 ? `  … y ${fuera.imagenGrande.length - 40} más` : ``,
].join("\n");

fs.mkdirSync(destino, { recursive: true });
fs.writeFileSync(path.join(destino, "_LEEME-QUE-ES-ESTO.txt"), manifiesto + "\n");

console.log(manifiesto);
console.log(`\n✓ Copia hecha en: ${destino}`);
