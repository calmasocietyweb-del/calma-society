/**
 * apply-fiesta-fotos-wiki.mjs — sustituye las fotos de las fiestas de pueblo de
 * Menorca por JALEO AUTÉNTICO de Wikimedia Commons (licencia CC, con crédito).
 * Las fotos genéricas de caballos (Sevilla, Cerdeña, frisones…) no eran reales.
 *
 * Para cada fiesta: copia .tmp_wiki/<letra>.jpg → _stock/ag-<key>.jpg, la optimiza
 * a webp (1600/960/480) y parchea la ficha (image + imageCredit) por translationKey.
 * Registra autor/licencia/fuente en src/data/agenda-fotos-credits.json.
 *
 * Uso:  node scripts/apply-fiesta-fotos-wiki.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, readdirSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const TMP = ".tmp_wiki";
const STOCK = "MATERIAL FOTOS RRSS/Menorca/_stock";
const OUT = "public/uploads";
const DIR = "src/content/eventos";
const WIDTHS = [1600, 960, 480];
const C = "https://commons.wikimedia.org/wiki/File:";
const BY2 = "https://creativecommons.org/licenses/by/2.0";
const BYSA4 = "https://creativecommons.org/licenses/by-sa/4.0";
const BYSA3 = "https://creativecommons.org/licenses/by-sa/3.0";

// fiesta (translationKey) → foto auténtica de Wikimedia (curada viendo las imágenes).
const ASSIGN = {
  "sant-joan":            { l: "o", author: "Strykess",        lic: "CC BY-SA 4.0", licUrl: BYSA4, file: "Sant_Joan.jpg", desc: "Sant Joan de Ciutadella: caballo negro encabritado ante la catedral" },
  "sant-jaume":           { l: "b", author: "MANovillo",       lic: "CC BY 2.0",    licUrl: BY2,   file: "Festes_de_Sant_Jaume_2011_Es_Castell_(Menorca)_(6079460499).jpg", desc: "Festes de Sant Jaume, Es Castell" },
  "sant-marti":           { l: "g", author: "Antonio Sánchez", lic: "CC BY-SA 4.0", licUrl: BYSA4, file: "Jaleo_en_Mercadal_4.jpg", desc: "Jaleo en Es Mercadal" },
  "festes-sant-nicolau-es-mercadal": { l: "f", author: "Antonio Sánchez", lic: "CC BY-SA 4.0", licUrl: BYSA4, file: "Jaleo_en_Mercadal_1.jpg", desc: "Jaleo en Es Mercadal" },
  "sant-cristofol":       { l: "l", author: "Discasto",        lic: "CC BY-SA 4.0", licUrl: BYSA4, file: "Sant_Cristòfol_de_ses_Corregudes_-_09_(Es_Migjorn_Gran,_2_de_agosto_de_2015).JPG", desc: "Sant Cristòfol de ses Corregudes, Es Migjorn Gran" },
  "sant-llorenc":         { l: "i", author: "Slastic",         lic: "dominio público", licUrl: "", file: "Jaleo_nocturn_a_Alaior.jpg", desc: "Jaleo nocturno en Alaior" },
  "gracia":               { l: "h", author: "Susigilabert",    lic: "CC BY-SA 4.0", licUrl: BYSA4, file: "Jaleo_Mahón.jpg", desc: "Jaleo en Maó" },
  "sant-antoni-fornells": { l: "a", author: "MANovillo",       lic: "CC BY 2.0",    licUrl: BY2,   file: "Caballos_menorquines_(4877421778)_(3).jpg", desc: "Caballos menorquines en el jaleo" },
  "sant-bartomeu":        { l: "d", author: "jsogo",           lic: "CC BY 2.0",    licUrl: BY2,   file: "Jaleo_(4942913598).jpg", desc: "Jaleo de las fiestas de Menorca" },
  "sant-climent":         { l: "e", author: "jsogo",           lic: "CC BY 2.0",    licUrl: BY2,   file: "Jaleo_(5755983676).jpg", desc: "Jaleo de las fiestas de Menorca" },
  "sant-gaieta":          { l: "j", author: "Susigilabert",    lic: "CC BY-SA 4.0", licUrl: BYSA4, file: "Jaleo_y_fiestas.jpg", desc: "Caballos en el jaleo de las fiestas" },
  "festes-calan-porter-alaior": { l: "m", author: "Strykess",  lic: "CC BY-SA 4.0", licUrl: BYSA4, file: "Caballo_y_jinete.jpg", desc: "Caballo y caixer en el jaleo, Ciutadella" },
  "festes-es-caixers-alaior":   { l: "c", author: "MANovillo", lic: "CC BY 2.0",    licUrl: BY2,   file: "Fiestas_de_Sant_Jaume_en_Es_Castell_Menorca_(7831902056).jpg", desc: "Caixers a caballo, Es Castell" },
  "sant-lluis":           { l: "n", author: "Wmorella",        lic: "CC BY-SA 3.0", licUrl: BYSA3, file: "Córrer_s'ensortilla.JPG", desc: "Córrer s'ensortilla (joc d'ensortilla a caballo)" },
};

// Índice translationKey → { lang: archivo }.
const index = {};
for (const f of readdirSync(DIR)) {
  if (!f.endsWith(".json")) continue;
  const o = JSON.parse(readFileSync(join(DIR, f), "utf8"));
  if (o.translationKey) (index[o.translationKey] ||= {})[o.lang] = f;
}

const credits = existsSync("src/data/agenda-fotos-credits.json")
  ? JSON.parse(readFileSync("src/data/agenda-fotos-credits.json", "utf8")) : {};

let done = 0;
for (const [key, a] of Object.entries(ASSIGN)) {
  const src = join(TMP, `${a.l}.jpg`);
  if (!existsSync(src)) { console.log(`✗ falta ${src} (para ${key})`); continue; }
  const name = `ag-${key}`;
  // 1) copia la fuente a _stock (provenance) y optimiza.
  copyFileSync(src, join(STOCK, `${name}.jpg`));
  for (const w of WIDTHS) {
    const out = w === 1600 ? `${name}.webp` : `${name}-${w}.webp`;
    await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(join(OUT, out));
  }
  // 2) crédito visible (CC). Corto para la tarjeta.
  const credit = `${a.author} · Wikimedia (${a.lic})`;
  // 3) parchea la ficha (image + imageCredit) en ES y EN.
  const files = index[key];
  if (!files) { console.log(`⚠ sin ficha para ${key}`); continue; }
  for (const lang of Object.keys(files)) {
    const file = join(DIR, files[lang]);
    const o = JSON.parse(readFileSync(file, "utf8"));
    o.image = `/uploads/${name}.webp`;
    o.imageCredit = credit;
    writeFileSync(file, JSON.stringify(o, null, 2) + "\n");
  }
  // 4) registro de procedencia.
  credits[name] = {
    source: "Wikimedia Commons", author: a.author, license: a.lic,
    licenseUrl: a.licUrl || undefined,
    sourceUrl: C + encodeURIComponent(a.file),
    desc: a.desc, nota: "recortada/redimensionada para la web",
  };
  console.log(`✓ ${key.padEnd(34)} ← ${a.l}  ${credit}`);
  done++;
}

writeFileSync("src/data/agenda-fotos-credits.json", JSON.stringify(credits, null, 2) + "\n");
console.log(`\n✓ ${done}/${Object.keys(ASSIGN).length} fiestas con jaleo auténtico de Menorca.`);
