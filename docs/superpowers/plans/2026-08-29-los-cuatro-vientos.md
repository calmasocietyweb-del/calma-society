# Los cuatro vientos — plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa `superpowers:subagent-driven-development`
> (recomendada) o `superpowers:executing-plans` para ejecutar este plan tarea a tarea.
> Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** un sistema que produzca y programe **una imagen al día** para Instagram con los
cuatro personajes de Calma Society, atada a un artículo publicado y a un sitio real de Menorca.

**Arquitectura:** el sistema está partido en dos mitades con una frontera explícita. Los
**scripts Node** planifican la escena, construyen el prompt exacto, validan y publican en
Metricool. La **llamada a Higgsfield la hace el agente por MCP** (no hay clave de API en este
repo: `integraciones/higgsfield.mjs` ya lo documenta). Todo lo que es lógica pura vive en Node
y se prueba con tests; el único paso no determinista es la generación de la imagen.

**Stack:** Node 20 ESM, `node --test` (runner nativo, sin dependencias nuevas), los módulos ya
existentes de `REDES-SOCIALES/sistema/`.

**Spec:** `docs/superpowers/specs/2026-08-29-redes-animalitos-los-cuatro-vientos-design.md`

## Restricciones globales

- **Nada de dependencias nuevas.** El `package.json` de `REDES-SOCIALES/` no crece.
- **Todo el código nuevo vive en `REDES-SOCIALES/vientos/`.** Nada fuera de ahí salvo la
  línea `test` del `package.json` y el archivado de la Tarea 9.
- **`REDES-SOCIALES/` está en `.gitignore`**: el código de este plan **no se commitea**. Los
  commits de cada tarea son de `docs/` cuando aplique; para el resto, el "commit" del paso
  final se sustituye por dejar constancia en Jira **KAN-137**. No intentes `git add` sobre
  `REDES-SOCIALES/`: fallará en silencio y parecerá que funcionó.
- **Idioma:** comentarios y mensajes de consola en español; identificadores en inglés cuando
  sea la convención, pero los bancos creativos usan claves en español porque son contenido
  editorial (`migjorn`, `plano-cenital`), igual que el resto de `REDES-SOCIALES/`.
- **Los prompts a Higgsfield van SIEMPRE en inglés.** El modelo rinde mucho peor en español.
- **Modelo fijo:** `nano_banana_pro`, `aspect_ratio: '4:5'`, `resolution: '2k'`,
  `use_unlim: false`. Coste medido: 2 créditos por imagen.
- **Element ids (fuente de verdad de la identidad, no inventarlos):**
  - migjorn `2e67021d-3c03-4f96-89d0-429eb19fa39c`
  - tramuntana `5b2b0c4c-eb37-4a4d-96b7-9f45c9535872`
  - llevant `aba8c55e-f428-4b09-b023-99c6a9887ec3`
  - ponent `6025cb75-bfa4-4a44-911c-9f269aa24373`

## Estructura de ficheros

| Fichero | Responsabilidad |
|---|---|
| `vientos/personajes.mjs` | Los 4 personajes: element id, animal, marca de identidad, territorio |
| `vientos/bancos.mjs` | Los 12 planos, las 37 acciones y el vestuario por estación |
| `vientos/escena.mjs` | Estación por fecha y utilidades puras de escena |
| `vientos/prompt.mjs` | Construye el prompt en inglés a partir de una escena. El corazón |
| `vientos/gate.mjs` | Valida una escena antes de gastar créditos o programar |
| `vientos/planificar.mjs` | Genera `escenas.json` aplicando las reglas de rotación |
| `vientos/brief.mjs` | CLI: imprime lo que el agente necesita para llamar al MCP |
| `vientos/cerrar.mjs` | CLI: descarga la imagen, escribe el manifest y pasa el gate |
| `vientos/*.test.mjs` | Tests de cada módulo |

**Se reutiliza sin tocar:** `sistema/captions.mjs` (`construirCaption`, `validarVoz`),
`sistema/leer-articulos.mjs` (`leerArticulos`, `agruparPorClave`), `sistema/config.mjs`
(`CONFIG`, `urlArticulo`), `integraciones/publicar-metricool.mjs`.

**Dato clave descubierto y verificado el 29-ago-2026:** los **83** artículos ES publicados
tienen los **83** un `heroImage` que apunta a `/uploads/<foto>.webp`, y un `heroImageAlt`
descriptivo. Esa es la referencia de lugar. No hace falta ningún mapa manual.

---

### Tarea 1: Los personajes y el runner de tests

**Ficheros:**
- Crear: `REDES-SOCIALES/vientos/personajes.mjs`
- Crear: `REDES-SOCIALES/vientos/personajes.test.mjs`
- Modificar: `REDES-SOCIALES/package.json` (añadir el script `test`)

**Interfaces:**
- Consume: nada.
- Produce: `PERSONAJES` (objeto indexado por id), `IDS` (array de ids en orden fijo),
  `personaje(id)` → el objeto o lanza `Error`.

- [ ] **Paso 1: Añadir el runner de tests**

En `REDES-SOCIALES/package.json`, dentro de `"scripts"`, añade:

```json
"test": "node --test vientos/"
```

> Lección aprendida el 29-ago-2026 en este repo: un `npm test` que enumera ficheros a mano
> deja de ejecutar los tests nuevos sin avisar. `node --test <dir>` los descubre solo. Aun
> así, **comprueba siempre el número de tests ejecutados** al final de la salida: si no sube
> al añadir un fichero, el test nuevo no se está ejecutando.

- [ ] **Paso 2: Escribir el test que falla**

Crea `REDES-SOCIALES/vientos/personajes.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { PERSONAJES, IDS, personaje } from './personajes.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test('hay exactamente cuatro personajes', () => {
  assert.equal(IDS.length, 4);
  assert.deepEqual(IDS, ['migjorn', 'tramuntana', 'llevant', 'ponent']);
});

test('cada personaje tiene un element id de Higgsfield valido y unico', () => {
  const vistos = new Set();
  for (const id of IDS) {
    const p = PERSONAJES[id];
    assert.match(p.elementId, UUID, `${id} no tiene un elementId con forma de UUID`);
    assert.equal(vistos.has(p.elementId), false, `${id} repite el elementId de otro personaje`);
    vistos.add(p.elementId);
  }
});

test('cada personaje declara su marca de identidad en ingles y su territorio', () => {
  for (const id of IDS) {
    const p = PERSONAJES[id];
    assert.ok(p.marcaIdentidad.length > 30, `${id}: la marca de identidad es demasiado vaga`);
    assert.ok(p.animalEn.length > 0, `${id}: falta animalEn`);
    assert.ok(p.secciones.length > 0, `${id}: no cubre ninguna seccion`);
  }
});

test('entre los cuatro cubren las seis secciones de la revista', () => {
  const cubiertas = new Set(IDS.flatMap((id) => PERSONAJES[id].secciones));
  for (const s of ['descubrir', 'comer-y-beber', 'cultura', 'vivir', 'practica', 'agenda']) {
    assert.ok(cubiertas.has(s), `ninguna personaje cubre la seccion ${s}`);
  }
});

test('personaje() devuelve el objeto y lanza si el id no existe', () => {
  assert.equal(personaje('migjorn').nombre, 'Migjorn');
  assert.throws(() => personaje('inexistente'), /inexistente/);
});
```

- [ ] **Paso 3: Ejecutar y comprobar que falla**

```
cd REDES-SOCIALES && npm test
```
Esperado: FALLA con `Cannot find module './personajes.mjs'`.

- [ ] **Paso 4: Escribir la implementación**

Crea `REDES-SOCIALES/vientos/personajes.mjs`:

```js
/**
 * LOS CUATRO VIENTOS — el reparto de Calma Society.
 *
 * Cuatro residentes que viven Menorca los 365 dias del anyo, con los nombres de
 * los vientos de la isla. La marca se llama Calma, que es lo que queda cuando los
 * vientos descansan.
 *
 * `elementId` es un Reference Element de Higgsfield creado el 29-ago-2026 a partir
 * de una ficha de tres vistas mas su foto de casting. Es la FUENTE DE VERDAD de la
 * identidad: sin el, el personaje deriva de una imagen a otra.
 *
 * `marcaIdentidad` va en INGLES porque entra literalmente en el prompt, y existe
 * para poder VERIFICAR A OJO que el personaje no ha derivado: si la muesca de la
 * oreja de Migjorn no esta, la pieza se descarta y se regenera.
 */

export const PERSONAJES = {
  migjorn: {
    id: 'migjorn',
    nombre: 'Migjorn',
    viento: 'el viento del sur',
    animal: 'gato mediterraneo de pelo corto color crema',
    animalEn: 'cream-and-apricot Mediterranean shorthair cat',
    elementId: '2e67021d-3c03-4f96-89d0-429eb19fa39c',
    marcaIdentidad:
      'with a small distinctive nick in its LEFT ear tip, warm amber-gold eyes, a clean white chest bib and white paws, and faint pale-ginger tabby rings on the tail',
    territorio: ['pueblos blancos', 'mesa', 'mercados', 'terrazas', 'siesta', 'sur'],
    secciones: ['comer-y-beber', 'vivir'],
  },
  tramuntana: {
    id: 'tramuntana',
    nombre: 'Tramuntana',
    viento: 'el viento del norte',
    animal: 'cavalier king charles blenheim',
    animalEn: 'Blenheim Cavalier King Charles Spaniel',
    elementId: '5b2b0c4c-eb37-4a4d-96b7-9f45c9535872',
    marcaIdentidad:
      'with a pearl-white silky coat marked with rich chestnut patches, a symmetrical chestnut mask over both eyes split by a clean white blaze down the muzzle, long feathered chestnut ears and large round dark-brown eyes',
    territorio: ['calas bravas', 'cami de cavalls', 'barcos', 'llegadas', 'norte'],
    secciones: ['descubrir', 'practica'],
  },
  llevant: {
    id: 'llevant',
    nombre: 'Llevant',
    viento: 'el viento del este, el del amanecer',
    animal: 'conejo holland lop color crema',
    animalEn: 'cream Holland Lop rabbit',
    elementId: 'aba8c55e-f428-4b09-b023-99c6a9887ec3',
    marcaIdentidad:
      'with dense velvety cream-and-ivory fur, a faint fawn saddle across the shoulders, long soft drooping ears with one ear tipped slightly darker sand, and dark liquid brown eyes',
    territorio: ['campo', 'huerta', 'primavera', 'mercados de primera hora'],
    secciones: ['descubrir', 'comer-y-beber'],
  },
  ponent: {
    id: 'ponent',
    nombre: 'Ponent',
    viento: 'el viento del oeste, el del atardecer',
    animal: 'mochuelo (Athene noctua), especie que vive en Menorca',
    animalEn: 'little owl (Athene noctua), a species that lives in Menorca',
    elementId: '6025cb75-bfa4-4a44-911c-9f269aa24373',
    marcaIdentidad:
      'with speckled cream-and-warm-brown plumage, huge lemon-amber eyes, and bold white eyebrow markings meeting in a distinctive pale V between the eyes',
    territorio: ['ciutadella', 'historia', 'interiores', 'noches', 'invierno'],
    secciones: ['cultura', 'agenda'],
  },
};

/** Orden fijo. NO reordenar: la rotacion del planificador depende de el. */
export const IDS = ['migjorn', 'tramuntana', 'llevant', 'ponent'];

/** Devuelve un personaje por id, o lanza si no existe (nunca devuelve undefined). */
export function personaje(id) {
  const p = PERSONAJES[id];
  if (!p) throw new Error(`No existe el personaje "${id}". Los validos son: ${IDS.join(', ')}`);
  return p;
}

export default { PERSONAJES, IDS, personaje };
```

- [ ] **Paso 5: Ejecutar y comprobar que pasa**

```
cd REDES-SOCIALES && npm test
```
Esperado: `# pass 5`, `# fail 0`.

- [ ] **Paso 6: Dejar constancia**

`REDES-SOCIALES/` no va a git. Anota en el comentario de **KAN-137**: "Tarea 1 hecha:
personajes + runner de tests (5 tests en verde)".

---

### Tarea 2: Los bancos creativos

**Ficheros:**
- Crear: `REDES-SOCIALES/vientos/bancos.mjs`
- Crear: `REDES-SOCIALES/vientos/bancos.test.mjs`

**Interfaces:**
- Consume: nada.
- Produce: `PLANOS` (array de 12 `{id, nombre, camaraEn}`), `ACCIONES` (array de 37
  `{id, es, en, secciones, estaciones, riesgo?}`), `VESTUARIO`
  (`{verano, entretiempo, invierno, noche, accesorios}`, cada uno array de strings en inglés),
  `ESTACIONES` (array de 4 strings).

- [ ] **Paso 1: Escribir el test que falla**

Crea `REDES-SOCIALES/vientos/bancos.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANOS, ACCIONES, VESTUARIO, ESTACIONES } from './bancos.mjs';

test('hay 12 planos con id unico y una instruccion de camara en ingles', () => {
  assert.equal(PLANOS.length, 12);
  const ids = new Set();
  for (const p of PLANOS) {
    assert.equal(ids.has(p.id), false, `plano ${p.id} duplicado`);
    ids.add(p.id);
    assert.ok(p.camaraEn.length > 40, `plano ${p.id}: la instruccion de camara es demasiado corta`);
    assert.match(p.camaraEn, /^[\x00-\x7F—’]+$/, `plano ${p.id}: la camara debe ir en ingles sin acentos`);
  }
});

test('hay al menos 37 acciones, con id unico y traduccion al ingles', () => {
  assert.ok(ACCIONES.length >= 37, `solo hay ${ACCIONES.length} acciones`);
  const ids = new Set();
  for (const a of ACCIONES) {
    assert.equal(ids.has(a.id), false, `accion ${a.id} duplicada`);
    ids.add(a.id);
    assert.ok(a.es.length > 0 && a.en.length > 0, `accion ${a.id}: falta es o en`);
    assert.ok(Array.isArray(a.secciones) && a.secciones.length > 0, `accion ${a.id}: sin secciones`);
    assert.ok(Array.isArray(a.estaciones) && a.estaciones.length > 0, `accion ${a.id}: sin estaciones`);
    for (const e of a.estaciones) {
      assert.ok(ESTACIONES.includes(e), `accion ${a.id}: estacion desconocida "${e}"`);
    }
  }
});

test('las seis secciones de la revista tienen acciones disponibles', () => {
  for (const s of ['descubrir', 'comer-y-beber', 'cultura', 'vivir', 'practica', 'agenda']) {
    const hay = ACCIONES.filter((a) => a.secciones.includes(s));
    assert.ok(hay.length >= 3, `la seccion ${s} solo tiene ${hay.length} accion(es)`);
  }
});

test('fumar esta en el banco pero marcada como de riesgo', () => {
  const fumar = ACCIONES.find((a) => a.id === 'fumar');
  assert.ok(fumar, 'la accion "fumar" deberia existir: el dueno la pidio expresamente');
  assert.ok(fumar.riesgo, 'la accion "fumar" debe llevar el campo riesgo explicando por que');
});

test('el vestuario cubre las cuatro estaciones y no propone nada azul', () => {
  for (const k of ['verano', 'entretiempo', 'invierno', 'noche', 'accesorios']) {
    assert.ok(Array.isArray(VESTUARIO[k]) && VESTUARIO[k].length >= 4, `vestuario.${k} es demasiado corto`);
  }
  const todo = Object.values(VESTUARIO).flat().join(' ').toLowerCase();
  for (const prohibido of ['blue', 'navy', 'teal', 'azul']) {
    assert.equal(todo.includes(prohibido), false, `el vestuario menciona "${prohibido}" y la regla 5 lo prohibe`);
  }
});
```

- [ ] **Paso 2: Ejecutar y comprobar que falla**

```
cd REDES-SOCIALES && npm test
```
Esperado: FALLA con `Cannot find module './bancos.mjs'`.

- [ ] **Paso 3: Escribir la implementación**

Crea `REDES-SOCIALES/vientos/bancos.mjs` con las tres constantes. El contenido íntegro
(12 planos, 37 acciones y el vestuario) está en la spec, §5, §6 y §7:
`docs/superpowers/specs/2026-08-29-redes-animalitos-los-cuatro-vientos-design.md`.
**Cópialo de ahí, no lo reinventes.** Forma exacta de cada estructura:

```js
export const ESTACIONES = ['primavera', 'verano', 'otono', 'invierno'];

export const PLANOS = [
  {
    id: 'general-amplisimo',
    nombre: 'General amplisimo',
    camaraEn:
      'EXTREME WIDE SHOT: the animal is very small in the frame, placed low and off-centre, the composition dominated by the landscape or architecture and by empty space',
  },
  // ... los 11 restantes, con la misma forma
];

export const ACCIONES = [
  {
    id: 'gin-terraza',
    es: 'Tomando un gin con limon en una terraza del puerto',
    en: 'sitting at a harbourside terrace table with a tall gin and lemon, one paw resting on the glass',
    secciones: ['comer-y-beber'],
    estaciones: ['primavera', 'verano', 'otono'],
  },
  // ... las 36 restantes
  {
    id: 'fumar',
    es: 'Fumando un cigarrillo delgado en un balcon al atardecer',
    en: 'leaning on a balcony rail at dusk with a thin cigarette between two claws',
    secciones: ['vivir', 'agenda'],
    estaciones: ['primavera', 'verano', 'otono', 'invierno'],
    riesgo:
      'Meta restringe el alcance del contenido con tabaco y choca con el territorio de calma de la marca. El dueno la pidio expresamente. No usar en las primeras tandas; decidir con datos.',
  },
];

export const VESTUARIO = {
  verano: ['an open natural undyed linen shirt', 'rolled linen trousers', 'a woven straw panama hat', /* ... */],
  entretiempo: [/* ... */],
  invierno: [/* ... */],
  noche: [/* ... */],
  accesorios: ['a woven willow basket', 'a leather suitcase', 'an analogue camera', 'a folded newspaper', 'a brass spyglass', 'a pair of menorquina avarcas', /* ... */],
};

export default { PLANOS, ACCIONES, VESTUARIO, ESTACIONES };
```

**Al escribir las acciones en inglés, respeta la regla 1 de la spec:** el animal **puede** estar
de pie sobre dos patas y sujetar cosas con las patas como si fueran manos. Eso es deliberado y
es lo que pidió el dueño. Lo que nunca aparece es una cara humana, piel humana ni estética de
dibujo animado — eso lo impone el prompt (Tarea 4), no las acciones.

- [ ] **Paso 4: Ejecutar y comprobar que pasa**

```
cd REDES-SOCIALES && npm test
```
Esperado: `# pass 10`, `# fail 0`. **Comprueba que el total subió de 5 a 10.**

- [ ] **Paso 5: Dejar constancia en KAN-137.**

---

### Tarea 3: Estación por fecha

**Ficheros:**
- Crear: `REDES-SOCIALES/vientos/escena.mjs`
- Crear: `REDES-SOCIALES/vientos/escena.test.mjs`

**Interfaces:**
- Consume: `ESTACIONES` de `./bancos.mjs`.
- Produce: `estacionDe(fechaISO)` → `'primavera'|'verano'|'otono'|'invierno'`;
  `slugPieza(fecha, tema)` → `'AAAA-MM-DD_post_<tema>'`.

- [ ] **Paso 1: Escribir el test que falla**

Crea `REDES-SOCIALES/vientos/escena.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { estacionDe, slugPieza } from './escena.mjs';

test('la estacion sale del mes de la fecha', () => {
  assert.equal(estacionDe('2026-01-15'), 'invierno');
  assert.equal(estacionDe('2026-04-02'), 'primavera');
  assert.equal(estacionDe('2026-08-29'), 'verano');
  assert.equal(estacionDe('2026-10-20'), 'otono');
  assert.equal(estacionDe('2026-12-31'), 'invierno');
});

test('estacionDe rechaza una fecha con formato invalido', () => {
  assert.throws(() => estacionDe('29-08-2026'), /formato/i);
  assert.throws(() => estacionDe(''), /formato/i);
});

test('slugPieza produce el nombre de carpeta que espera publicar-metricool', () => {
  assert.equal(slugPieza('2026-09-01', 'cala-pregonda'), '2026-09-01_post_cala-pregonda');
});

test('slugPieza limpia el tema para que sea un nombre de carpeta valido', () => {
  assert.equal(slugPieza('2026-09-01', 'Cala Mitjana (sur)'), '2026-09-01_post_cala-mitjana-sur');
});
```

- [ ] **Paso 2: Ejecutar y comprobar que falla.** Esperado: `Cannot find module './escena.mjs'`.

- [ ] **Paso 3: Escribir la implementación**

Crea `REDES-SOCIALES/vientos/escena.mjs`:

```js
/** Utilidades puras de escena. Sin efectos, sin lectura de disco: todo testeable. */

const MESES_ESTACION = {
  1: 'invierno', 2: 'invierno', 3: 'primavera', 4: 'primavera',
  5: 'primavera', 6: 'verano', 7: 'verano', 8: 'verano',
  9: 'otono', 10: 'otono', 11: 'otono', 12: 'invierno',
};

/** Estacion editorial de una fecha AAAA-MM-DD. */
export function estacionDe(fechaISO) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fechaISO ?? ''))) {
    throw new Error(`Fecha con formato invalido: "${fechaISO}". Se espera AAAA-MM-DD.`);
  }
  const mes = Number(fechaISO.slice(5, 7));
  return MESES_ESTACION[mes];
}

/**
 * Nombre de la carpeta de la pieza. Tiene que casar EXACTAMENTE con lo que espera
 * integraciones/publicar-metricool.mjs: /^\d{4}-\d{2}-\d{2}_/ y formato 'post'.
 */
export function slugPieza(fecha, tema) {
  const limpio = String(tema)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${fecha}_post_${limpio}`;
}

export default { estacionDe, slugPieza };
```

- [ ] **Paso 4: Ejecutar y comprobar que pasa.** Esperado: `# pass 14`.
- [ ] **Paso 5: Dejar constancia en KAN-137.**

---

### Tarea 4: El constructor de prompt

Es el corazón del sistema y la única pieza cuya redacción exacta está validada por las 8
imágenes de prueba del 29-ago-2026. No la "mejores" sin volver a probar con créditos.

**Ficheros:**
- Crear: `REDES-SOCIALES/vientos/prompt.mjs`
- Crear: `REDES-SOCIALES/vientos/prompt.test.mjs`

**Interfaces:**
- Consume: `personaje()` de `./personajes.mjs`; `PLANOS`, `ACCIONES`, `VESTUARIO` de `./bancos.mjs`.
- Produce: `construirPrompt(escena)` → `string`, donde `escena` es
  `{ personaje, planoId, accionId, lugar, lugarEn, vestuario, estacion, momento }`.
  También `COLA_ESTILO`, `CLAUSULA_COMPORTAMIENTO` y `NEGATIVOS` como constantes exportadas.

- [ ] **Paso 1: Escribir el test que falla**

Crea `REDES-SOCIALES/vientos/prompt.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { construirPrompt, COLA_ESTILO, CLAUSULA_COMPORTAMIENTO, NEGATIVOS } from './prompt.mjs';
import { PERSONAJES } from './personajes.mjs';

const ESCENA = {
  personaje: 'migjorn',
  planoId: 'primerisimo',
  accionId: 'gin-terraza',
  lugar: 'Cales Fonts, Es Castell',
  lugarEn: 'Cales Fonts in Es Castell, Menorca, its waterside restaurant lanterns behind',
  vestuario: 'an open natural undyed linen shirt and a woven straw panama hat',
  estacion: 'verano',
  momento: 'golden hour',
};

test('el prompt inyecta el element id del personaje con la sintaxis <<<uuid>>>', () => {
  const p = construirPrompt(ESCENA);
  assert.ok(p.includes(`<<<${PERSONAJES.migjorn.elementId}>>>`),
    'sin el placeholder <<<uuid>>> Higgsfield no aplica el Reference Element y el personaje deriva');
});

test('el prompt lleva la marca de identidad, para poder verificar a ojo que no derivo', () => {
  const p = construirPrompt(ESCENA);
  assert.ok(p.includes('nick in its LEFT ear tip'));
});

test('el prompt lleva la instruccion de camara del plano y la accion en ingles', () => {
  const p = construirPrompt(ESCENA);
  assert.ok(p.includes('EXTREME CLOSE-UP'), 'falta la instruccion de camara del plano');
  assert.ok(p.toLowerCase().includes('gin'), 'falta la accion');
});

test('el prompt ancla el lugar a la foto de referencia', () => {
  const p = construirPrompt(ESCENA);
  assert.ok(p.includes('taken faithfully from the reference image'));
  assert.ok(p.includes('Cales Fonts'));
});

test('el prompt permite el comportamiento humano y prohibe el aspecto de dibujo', () => {
  assert.match(CLAUSULA_COMPORTAMIENTO, /stand on two legs/i);
  assert.match(CLAUSULA_COMPORTAMIENTO, /never a cartoon/i);
  assert.match(CLAUSULA_COMPORTAMIENTO, /never a human face/i);
});

test('los negativos prohiben texto, logos, personas y ropa azul', () => {
  for (const re of [/no text/i, /no logos/i, /no human people/i, /no blue or teal clothing/i]) {
    assert.match(NEGATIVOS, re);
  }
});

test('el prompt va entero en ingles: ni una palabra del banco en espanol', () => {
  const p = construirPrompt(ESCENA);
  for (const palabra of ['Tomando', 'terraza del puerto', 'gato mediterraneo']) {
    assert.equal(p.includes(palabra), false, `se ha colado el espanol: "${palabra}"`);
  }
});

test('construirPrompt lanza si el plano o la accion no existen', () => {
  assert.throws(() => construirPrompt({ ...ESCENA, planoId: 'no-existe' }), /no-existe/);
  assert.throws(() => construirPrompt({ ...ESCENA, accionId: 'no-existe' }), /no-existe/);
});
```

- [ ] **Paso 2: Ejecutar y comprobar que falla.** Esperado: `Cannot find module './prompt.mjs'`.

- [ ] **Paso 3: Escribir la implementación**

Crea `REDES-SOCIALES/vientos/prompt.mjs`:

```js
/**
 * Constructor del prompt de Higgsfield. Redaccion VALIDADA el 29-ago-2026 con 8
 * imagenes reales (8 planos distintos, 4 personajes, 8 sitios de Menorca). No la
 * cambies "a ojo": cada frase esta ahi porque su ausencia rompio algo en las pruebas.
 *
 * Orden deliberado: el modelo pesa mas los primeros tokens, asi que va primero la
 * CAMARA (el plano es lo que mas se pierde), luego la IDENTIDAD, luego la accion,
 * luego el sitio, y al final estilo y negativos.
 */
import { personaje } from './personajes.mjs';
import { PLANOS, ACCIONES } from './bancos.mjs';

/** El "look de la casa". Fijo en todas las piezas: es lo que hace que el feed sea uno. */
export const COLA_ESTILO =
  'Ultra-photorealistic editorial travel-magazine photograph, medium format camera, ' +
  'natural light, quiet-luxury aesthetic, generous negative space, muted warm palette of ' +
  'linen, sand, clay and terracotta, subtle film grain, serene and unhurried.';

/**
 * La clausula que define el registro entero de la campana, y la que mas cuidado
 * pide: ULTRARREALISTA EN EL ASPECTO, HUMANO EN EL COMPORTAMIENTO.
 * Decision expresa del dueno el 29-ago-2026: «como si los animales fueran los humanos».
 */
export const CLAUSULA_COMPORTAMIENTO =
  'The animal looks completely real — photographic individual-hair fur or feather detail, ' +
  'real animal eyes and a real animal expression, anatomically accurate — but it lives like ' +
  'a person: it may stand on two legs, hold objects and use its paws as hands, and wear real ' +
  'tailored clothing. Never a cartoon, never an illustration, never a 3D render, never a ' +
  'plush toy, never a human face and never human skin.';

export const NEGATIVOS =
  'No text, no lettering, no logos, no watermark, no human people, no blue or teal clothing.';

/**
 * @param {object} e
 * @param {string} e.personaje  id del personaje
 * @param {string} e.planoId    id del banco de planos
 * @param {string} e.accionId   id del banco de acciones
 * @param {string} e.lugar      nombre del sitio (para el manifest y los humanos)
 * @param {string} e.lugarEn    descripcion del sitio EN INGLES (sale de heroImageAlt)
 * @param {string} e.vestuario  prendas y accesorios, en ingles
 * @param {string} e.estacion   primavera | verano | otono | invierno
 * @param {string} [e.momento]  hora del dia, en ingles
 * @returns {string} el prompt completo
 */
export function construirPrompt(e) {
  const p = personaje(e.personaje);
  const plano = PLANOS.find((x) => x.id === e.planoId);
  if (!plano) throw new Error(`No existe el plano "${e.planoId}".`);
  const accion = ACCIONES.find((x) => x.id === e.accionId);
  if (!accion) throw new Error(`No existe la accion "${e.accionId}".`);

  const momento = e.momento ? `, ${e.momento}` : '';

  return [
    `${plano.camaraEn}.`,
    `<<<${p.elementId}>>> ${p.nombre}, a ${p.animalEn} ${p.marcaIdentidad}, ${accion.en}.`,
    `SETTING taken faithfully from the reference image: ${e.lugarEn}${momento}.`,
    `WARDROBE: ${e.vestuario}.`,
    COLA_ESTILO,
    CLAUSULA_COMPORTAMIENTO,
    NEGATIVOS,
  ].join(' ');
}

export default { construirPrompt, COLA_ESTILO, CLAUSULA_COMPORTAMIENTO, NEGATIVOS };
```

> Para que el test del plano `primerisimo` pase, su `camaraEn` en `bancos.mjs` debe empezar por
> `EXTREME CLOSE-UP`. Redacción validada:
> `'EXTREME CLOSE-UP MACRO PORTRAIT: only the animal face fills the frame, edge to edge, whiskers or feathers razor sharp, the eyes in critical focus, everything behind dissolved into soft bokeh'`

- [ ] **Paso 4: Ejecutar y comprobar que pasa.** Esperado: `# pass 22`.
- [ ] **Paso 5: Dejar constancia en KAN-137.**

---

### Tarea 5: El gate de escena

Sustituye a los gates del sistema antiguo, que iban de fotos reales y resolución y aquí ya no
aplican. Este valida lo que ahora importa.

**Ficheros:**
- Crear: `REDES-SOCIALES/vientos/gate.mjs`
- Crear: `REDES-SOCIALES/vientos/gate.test.mjs`

**Interfaces:**
- Consume: `PERSONAJES` de `./personajes.mjs`; `PLANOS`, `ACCIONES` de `./bancos.mjs`.
- Produce: `validarEscena(escena, {articulosPublicados})` → `{ok: boolean, fallos: string[]}`.
  `articulosPublicados` es un `Set` de slugs.

- [ ] **Paso 1: Escribir el test que falla**

Crea `REDES-SOCIALES/vientos/gate.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validarEscena } from './gate.mjs';

const PUBLICADOS = new Set(['cala-pregonda-binimella', 'alaior-queso-y-calzado']);
const BASE = {
  fecha: '2026-09-01',
  personaje: 'migjorn',
  planoId: 'primerisimo',
  accionId: 'gin-terraza',
  articuloSlug: 'cala-pregonda-binimella',
  fotoReferencia: '/uploads/cala-pregonda.webp',
  lugar: 'Cala Pregonda',
  lugarEn: 'Cala Pregonda, Menorca',
  vestuario: 'an open natural undyed linen shirt',
  estacion: 'verano',
};

test('una escena completa y coherente pasa el gate', () => {
  const r = validarEscena(BASE, { articulosPublicados: PUBLICADOS });
  assert.deepEqual(r.fallos, []);
  assert.equal(r.ok, true);
});

test('rechaza una escena cuyo articulo no esta publicado', () => {
  const r = validarEscena({ ...BASE, articuloSlug: 'borrador-cualquiera' }, { articulosPublicados: PUBLICADOS });
  assert.equal(r.ok, false);
  assert.ok(r.fallos.some((f) => /no esta publicado/i.test(f)));
});

test('rechaza una foto de referencia que no viva en /uploads/', () => {
  const r = validarEscena({ ...BASE, fotoReferencia: 'https://unsplash.com/foo.jpg' }, { articulosPublicados: PUBLICADOS });
  assert.equal(r.ok, false);
  assert.ok(r.fallos.some((f) => /uploads/i.test(f)));
});

test('rechaza un personaje, un plano o una accion inexistentes', () => {
  for (const campo of [['personaje', 'zzz'], ['planoId', 'zzz'], ['accionId', 'zzz']]) {
    const r = validarEscena({ ...BASE, [campo[0]]: campo[1] }, { articulosPublicados: PUBLICADOS });
    assert.equal(r.ok, false, `deberia rechazar ${campo[0]}="zzz"`);
  }
});

test('rechaza vestuario azul: es la regla 5 de la spec', () => {
  const r = validarEscena({ ...BASE, vestuario: 'a navy blue linen shirt' }, { articulosPublicados: PUBLICADOS });
  assert.equal(r.ok, false);
  assert.ok(r.fallos.some((f) => /azul/i.test(f)));
});

test('acumula TODOS los fallos, no solo el primero', () => {
  const r = validarEscena(
    { ...BASE, personaje: 'zzz', articuloSlug: 'no-existe', vestuario: 'a teal shirt' },
    { articulosPublicados: PUBLICADOS },
  );
  assert.ok(r.fallos.length >= 3, `deberia acumular 3+ fallos, dio ${r.fallos.length}`);
});
```

- [ ] **Paso 2: Ejecutar y comprobar que falla.** Esperado: `Cannot find module './gate.mjs'`.

- [ ] **Paso 3: Escribir la implementación**

Crea `REDES-SOCIALES/vientos/gate.mjs`:

```js
/**
 * GATE DE ESCENA — el cortafuegos del sistema nuevo.
 *
 * Sustituye a los gates viejos (verificacion de foto real y resolucion minima), que
 * ya no aplican: aqui la imagen se genera a medida, asi que nunca esta estirada, y
 * la foto "real" es la REFERENCIA, no el resultado.
 *
 * Acumula todos los fallos en vez de parar en el primero: si vas a mirar una escena,
 * mejor ver de una vez todo lo que le pasa.
 */
import { PERSONAJES } from './personajes.mjs';
import { PLANOS, ACCIONES } from './bancos.mjs';

const COLORES_PROHIBIDOS = ['blue', 'navy', 'teal', 'azul', 'turquoise'];

export function validarEscena(escena, { articulosPublicados } = {}) {
  const fallos = [];
  const e = escena ?? {};

  if (!PERSONAJES[e.personaje]) {
    fallos.push(`Personaje desconocido: "${e.personaje}".`);
  }
  if (!PLANOS.some((p) => p.id === e.planoId)) {
    fallos.push(`Plano desconocido: "${e.planoId}".`);
  }
  if (!ACCIONES.some((a) => a.id === e.accionId)) {
    fallos.push(`Accion desconocida: "${e.accionId}".`);
  }
  if (!articulosPublicados || !articulosPublicados.has(e.articuloSlug)) {
    fallos.push(`El articulo "${e.articuloSlug}" no esta publicado: sin articulo no hay post.`);
  }
  if (!/^\/uploads\/[^/]+\.(webp|jpe?g|png)$/i.test(String(e.fotoReferencia ?? ''))) {
    fallos.push(`La foto de referencia debe vivir en /uploads/ (es la unica verificada): "${e.fotoReferencia}".`);
  }
  const vest = String(e.vestuario ?? '').toLowerCase();
  const azul = COLORES_PROHIBIDOS.find((c) => vest.includes(c));
  if (azul) {
    fallos.push(`El vestuario menciona "${azul}": la paleta de marca no lleva azul (el mar si, la ropa no).`);
  }
  if (!vest.trim()) {
    fallos.push('La escena no tiene vestuario.');
  }

  return { ok: fallos.length === 0, fallos };
}

export default { validarEscena };
```

- [ ] **Paso 4: Ejecutar y comprobar que pasa.** Esperado: `# pass 28`.
- [ ] **Paso 5: Dejar constancia en KAN-137.**

---

### Tarea 6: El planificador con reglas de rotación

**Ficheros:**
- Crear: `REDES-SOCIALES/vientos/planificar.mjs`
- Crear: `REDES-SOCIALES/vientos/planificar.test.mjs`

**Interfaces:**
- Consume: `IDS` de `./personajes.mjs`; `PLANOS`, `ACCIONES`, `VESTUARIO` de `./bancos.mjs`;
  `estacionDe` de `./escena.mjs`; `leerArticulos` y `agruparPorClave` de
  `../sistema/leer-articulos.mjs`.
- Produce: `planificar({desde, dias, articulos})` → array de escenas.
  `articulos` se inyecta para poder testear sin tocar disco.

- [ ] **Paso 1: Escribir el test que falla**

Crea `REDES-SOCIALES/vientos/planificar.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { planificar } from './planificar.mjs';

/** 40 articulos de mentira, repartidos por las 6 secciones. */
const SECCIONES = ['descubrir', 'comer-y-beber', 'cultura', 'vivir', 'practica', 'agenda'];
const ARTICULOS = Array.from({ length: 40 }, (_, i) => ({
  slug: `articulo-${i}`,
  lang: 'es',
  translationKey: `k${i}`,
  section: SECCIONES[i % SECCIONES.length],
  title: `Articulo ${i}`,
  heroImage: `/uploads/foto-${i}.webp`,
  heroImageAlt: `Un sitio de Menorca numero ${i}`,
  url: `https://calmasociety.com/articulo/articulo-${i}`,
}));

test('planifica una escena por dia, con fechas consecutivas', () => {
  const plan = planificar({ desde: '2026-09-01', dias: 30, articulos: ARTICULOS });
  assert.equal(plan.length, 30);
  assert.equal(plan[0].fecha, '2026-09-01');
  assert.equal(plan[29].fecha, '2026-09-30');
});

test('no repite personaje dos dias seguidos', () => {
  const plan = planificar({ desde: '2026-09-01', dias: 30, articulos: ARTICULOS });
  for (let i = 1; i < plan.length; i++) {
    assert.notEqual(plan[i].personaje, plan[i - 1].personaje, `dias ${i - 1} y ${i} repiten personaje`);
  }
});

test('no repite plano dentro de 7 dias', () => {
  const plan = planificar({ desde: '2026-09-01', dias: 30, articulos: ARTICULOS });
  for (let i = 0; i < plan.length; i++) {
    for (let j = Math.max(0, i - 6); j < i; j++) {
      assert.notEqual(plan[i].planoId, plan[j].planoId, `los dias ${j} y ${i} repiten el plano ${plan[i].planoId}`);
    }
  }
});

test('no repite articulo dentro de 30 dias', () => {
  const plan = planificar({ desde: '2026-09-01', dias: 30, articulos: ARTICULOS });
  const vistos = plan.map((e) => e.articuloSlug);
  assert.equal(new Set(vistos).size, vistos.length, 'hay un articulo repetido dentro de los 30 dias');
});

test('la foto de referencia y el texto del lugar salen del propio articulo', () => {
  const plan = planificar({ desde: '2026-09-01', dias: 5, articulos: ARTICULOS });
  for (const e of plan) {
    const a = ARTICULOS.find((x) => x.slug === e.articuloSlug);
    assert.equal(e.fotoReferencia, a.heroImage);
    assert.equal(e.lugarEn, a.heroImageAlt);
  }
});

test('la accion elegida encaja con la seccion del articulo y con la estacion', async () => {
  const { ACCIONES } = await import('./bancos.mjs');
  const plan = planificar({ desde: '2026-01-05', dias: 20, articulos: ARTICULOS });
  for (const e of plan) {
    const a = ARTICULOS.find((x) => x.slug === e.articuloSlug);
    const accion = ACCIONES.find((x) => x.id === e.accionId);
    assert.ok(accion.secciones.includes(a.section), `la accion ${accion.id} no sirve para ${a.section}`);
    assert.ok(accion.estaciones.includes('invierno'), `la accion ${accion.id} no es de invierno`);
  }
});

test('la accion de riesgo (fumar) nunca entra en un plan automatico', () => {
  const plan = planificar({ desde: '2026-09-01', dias: 60, articulos: ARTICULOS });
  assert.equal(plan.some((e) => e.accionId === 'fumar'), false,
    'fumar solo se usa a mano y con decision del dueno, nunca automatico');
});

test('es determinista: el mismo plan dos veces da el mismo resultado', () => {
  const a = planificar({ desde: '2026-09-01', dias: 30, articulos: ARTICULOS });
  const b = planificar({ desde: '2026-09-01', dias: 30, articulos: ARTICULOS });
  assert.deepEqual(a, b);
});
```

- [ ] **Paso 2: Ejecutar y comprobar que falla.** Esperado: `Cannot find module './planificar.mjs'`.

- [ ] **Paso 3: Escribir la implementación**

Crea `REDES-SOCIALES/vientos/planificar.mjs`. Requisitos que imponen los tests:

- Recorre los días desde `desde`, uno por uno, `dias` veces.
- **Personaje:** rota por `IDS` en orden (`IDS[i % 4]`). Eso garantiza que no se repite dos días
  seguidos, y es determinista.
- **Artículo:** elige el primero, de los que aún no han salido en los últimos 30 días, cuya
  `section` esté en `PERSONAJES[personaje].secciones` **y** para el que exista al menos una
  acción compatible con su sección y la estación del día. Si ninguno cumple, relaja la
  restricción de sección del personaje (pero nunca la de acción compatible) y deja un aviso en
  `escena.avisos`.
- **Plano:** el primero del banco que no haya salido en los últimos 6 días.
- **Acción:** la primera compatible con `articulo.section` y `estacionDe(fecha)` que no haya
  salido en los últimos 30 días, **excluyendo siempre las que tengan `riesgo`**.
- **Vestuario:** una prenda de `VESTUARIO[bloque]` + un accesorio, donde `bloque` es `verano`
  para verano, `invierno` para invierno y `entretiempo` para primavera y otoño. La selección es
  determinista (índice derivado del número de día), nunca aleatoria.
- **`lugar`** = `articulo.title`; **`lugarEn`** = `articulo.heroImageAlt`;
  **`fotoReferencia`** = `articulo.heroImage`.
- Devuelve un array de objetos con exactamente estos campos: `fecha`, `personaje`, `planoId`,
  `accionId`, `articuloSlug`, `fotoReferencia`, `lugar`, `lugarEn`, `vestuario`, `estacion`,
  `avisos`.
- **Nada de `Math.random()`.** El test de determinismo lo exige y además permite reproducir un
  plan que salió bien.

Añade al final un modo CLI que escriba el plan a disco:

```js
// CLI: node vientos/planificar.mjs 2026-09-01 60
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const [desde = new Date().toISOString().slice(0, 10), dias = '60'] = process.argv.slice(2);
  const { leerArticulos } = await import('../sistema/leer-articulos.mjs');
  const articulos = leerArticulos({ soloPublicados: true }).filter((a) => a.lang === 'es');
  const plan = planificar({ desde, dias: Number(dias), articulos });
  const fs = await import('node:fs');
  const path = await import('node:path');
  const destino = path.join(import.meta.dirname, 'escenas.json');
  fs.writeFileSync(destino, JSON.stringify(plan, null, 2));
  console.log(`\n🗓️  ${plan.length} escenas planificadas desde ${desde} → ${destino}\n`);
  const conAvisos = plan.filter((e) => e.avisos?.length);
  if (conAvisos.length) console.log(`⚠️  ${conAvisos.length} escena(s) con avisos. Revisalas.`);
}
```

- [ ] **Paso 4: Ejecutar y comprobar que pasa.** Esperado: `# pass 36`.

- [ ] **Paso 5: Generar el plan real y mirarlo**

```
cd REDES-SOCIALES && node vientos/planificar.mjs 2026-09-01 60
```
Abre `vientos/escenas.json` y **lee de verdad las 10 primeras escenas**. Comprueba a ojo que la
acción tiene sentido con el artículo (un gato tomando gin en una terraza encaja con un artículo
de gastronomía; no encaja con uno sobre el aeropuerto). Si alguna chirría, el problema está en
las `secciones` de esa acción en `bancos.mjs`, no en el planificador.

- [ ] **Paso 6: Dejar constancia en KAN-137.**

---

### Tarea 7: El brief diario (la frontera con el agente)

**Ficheros:**
- Crear: `REDES-SOCIALES/vientos/brief.mjs`
- Crear: `REDES-SOCIALES/vientos/brief.test.mjs`
- Modificar: `REDES-SOCIALES/package.json` (añadir scripts `vientos:plan` y `vientos:brief`)

**Interfaces:**
- Consume: `construirPrompt` de `./prompt.mjs`; `validarEscena` de `./gate.mjs`.
- Produce: `briefDe(escena, {articulosPublicados, baseUrl})` →
  `{ok, fallos, prompt, urlReferencia, elementId, modelo}` donde `modelo` es el objeto de
  parámetros listo para pasar al MCP.

- [ ] **Paso 1: Escribir el test que falla**

Crea `REDES-SOCIALES/vientos/brief.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { briefDe } from './brief.mjs';

const PUBLICADOS = new Set(['articulo-1']);
const ESCENA = {
  fecha: '2026-09-01',
  personaje: 'migjorn',
  planoId: 'primerisimo',
  accionId: 'gin-terraza',
  articuloSlug: 'articulo-1',
  fotoReferencia: '/uploads/foto-1.webp',
  lugar: 'Cales Fonts',
  lugarEn: 'Cales Fonts in Es Castell, Menorca',
  vestuario: 'an open natural undyed linen shirt',
  estacion: 'verano',
};

test('el brief da la URL publica de la foto de referencia', () => {
  const b = briefDe(ESCENA, { articulosPublicados: PUBLICADOS, baseUrl: 'https://calmasociety.com' });
  assert.equal(b.urlReferencia, 'https://calmasociety.com/uploads/foto-1.webp');
});

test('el brief trae los parametros exactos del modelo, ya fijados', () => {
  const b = briefDe(ESCENA, { articulosPublicados: PUBLICADOS, baseUrl: 'https://calmasociety.com' });
  assert.equal(b.modelo.model, 'nano_banana_pro');
  assert.equal(b.modelo.aspect_ratio, '4:5');
  assert.equal(b.modelo.resolution, '2k');
  assert.equal(b.modelo.use_unlim, false);
  assert.equal(b.modelo.prompt, b.prompt);
});

test('una escena que no pasa el gate NO trae prompt: no se gastan creditos', () => {
  const b = briefDe({ ...ESCENA, articuloSlug: 'no-publicado' }, { articulosPublicados: PUBLICADOS, baseUrl: 'https://calmasociety.com' });
  assert.equal(b.ok, false);
  assert.equal(b.prompt, null, 'si el gate falla no debe haber prompt que copiar y pegar');
  assert.ok(b.fallos.length > 0);
});
```

- [ ] **Paso 2: Ejecutar y comprobar que falla.** Esperado: `Cannot find module './brief.mjs'`.

- [ ] **Paso 3: Escribir la implementación**

Crea `REDES-SOCIALES/vientos/brief.mjs`:

```js
/**
 * BRIEF DIARIO — la frontera entre el script y el agente.
 *
 * No hay clave de API de Higgsfield en este repo (ver integraciones/higgsfield.mjs):
 * la generacion la hace Claude por MCP. Este modulo prepara TODO lo que esa llamada
 * necesita, ya validado, para que el agente no tenga que decidir nada por su cuenta.
 *
 * Si el gate falla, NO se devuelve prompt. Es deliberado: sin prompt no hay forma de
 * gastar creditos en una escena rota por descuido.
 */
import { construirPrompt } from './prompt.mjs';
import { validarEscena } from './gate.mjs';
import { personaje } from './personajes.mjs';

export function briefDe(escena, { articulosPublicados, baseUrl } = {}) {
  const { ok, fallos } = validarEscena(escena, { articulosPublicados });
  if (!ok) return { ok: false, fallos, prompt: null, urlReferencia: null, elementId: null, modelo: null };

  const prompt = construirPrompt(escena);
  const modelo = {
    model: 'nano_banana_pro',
    aspect_ratio: '4:5',
    resolution: '2k',
    use_unlim: false,
    prompt,
  };
  return {
    ok: true,
    fallos: [],
    prompt,
    urlReferencia: `${baseUrl}${escena.fotoReferencia}`,
    elementId: personaje(escena.personaje).elementId,
    modelo,
  };
}

export default { briefDe };
```

Añade el modo CLI al final del fichero, que lee `escenas.json`, busca la fecha pedida y lo
imprime en un formato que el agente pueda seguir sin pensar: los pasos MCP (`media_import_url`
con `urlReferencia` → `generate_image` con `modelo` más el `media` importado como
`image_references`), y a continuación el comando de cierre de la Tarea 8.

Añade a `package.json`:

```json
"vientos:plan": "node vientos/planificar.mjs",
"vientos:brief": "node vientos/brief.mjs"
```

- [ ] **Paso 4: Ejecutar y comprobar que pasa.** Esperado: `# pass 39`.

- [ ] **Paso 5: Probarlo de verdad contra el plan real**

```
cd REDES-SOCIALES && npm run vientos:brief 2026-09-01
```
Comprueba que imprime un prompt en inglés completo, la URL de la foto y los pasos MCP. **Copia
la URL de referencia en el navegador**: si da 404, la foto no está publicada y el gate tiene un
agujero — arréglalo antes de seguir.

- [ ] **Paso 6: Dejar constancia en KAN-137.**

---

### Tarea 8: El cierre — manifest y publicación

**Ficheros:**
- Crear: `REDES-SOCIALES/vientos/cerrar.mjs`
- Crear: `REDES-SOCIALES/vientos/cerrar.test.mjs`
- Modificar: `REDES-SOCIALES/package.json` (añadir `vientos:cerrar`)

**Interfaces:**
- Consume: `construirCaption` de `../sistema/captions.mjs`; `slugPieza` de `./escena.mjs`;
  `CONFIG` y `urlArticulo` de `../sistema/config.mjs`.
- Produce: `construirManifest(escena, {articuloEn, jobId, prompt})` → el objeto manifest que
  `integraciones/publicar-metricool.mjs` sabe leer.

- [ ] **Paso 1: Escribir el test que falla**

Crea `REDES-SOCIALES/vientos/cerrar.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { construirManifest } from './cerrar.mjs';

const ESCENA = {
  fecha: '2026-09-01',
  personaje: 'migjorn',
  planoId: 'primerisimo',
  accionId: 'gin-terraza',
  articuloSlug: 'alaior-queso-y-calzado',
  fotoReferencia: '/uploads/alaior.webp',
  lugar: 'Alaior',
  lugarEn: 'Alaior, Menorca',
  vestuario: 'an open natural undyed linen shirt',
  estacion: 'verano',
};
const ARTICULO_EN = { slug: 'alaior-cheese-and-shoes', url: 'https://calmasociety.com/en/article/alaior-cheese-and-shoes', section: 'comer-y-beber' };
const OPTS = { articuloEn: ARTICULO_EN, jobId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', prompt: 'un prompt cualquiera', ganchoEn: 'Alaior is where the cheese comes from.' };

test('el manifest usa formato post: es lo unico que publicar-metricool sabe subir aqui', () => {
  const m = construirManifest(ESCENA, OPTS);
  assert.equal(m.formato, 'post');
});

test('el manifest pasa los gates heredados de publicar-metricool', () => {
  const m = construirManifest(ESCENA, OPTS);
  assert.equal(m.verificacion.ok, true);
  assert.deepEqual(m.verificacion.fallidos, []);
  assert.equal(m.asunto?.falta?.length ?? 0, 0);
  assert.equal(m.asunto?.fotosCortas?.length ?? 0, 0);
});

test('se publica en INGLES: el idioma del manifest es en', () => {
  const m = construirManifest(ESCENA, OPTS);
  assert.equal(m.idioma, 'en');
  assert.ok(m.captionEn.length > 0);
});

test('el caption enlaza al articulo en ingles', () => {
  const m = construirManifest(ESCENA, OPTS);
  assert.equal(m.enlaceEn, ARTICULO_EN.url);
});

test('el manifest guarda la trazabilidad de la generacion', () => {
  const m = construirManifest(ESCENA, OPTS);
  assert.equal(m.vientos.jobId, OPTS.jobId);
  assert.equal(m.vientos.personaje, 'migjorn');
  assert.equal(m.vientos.planoId, 'primerisimo');
  assert.equal(m.vientos.fotoReferencia, '/uploads/alaior.webp');
  assert.equal(m.vientos.prompt, OPTS.prompt);
});

test('los avisos de voz del caption viajan en el manifest, no se tiran', () => {
  const m = construirManifest(ESCENA, { ...OPTS, ganchoEn: 'The most AMAZING incredible beach you MUST see!' });
  assert.ok(m.avisosVoz.length > 0, 'un gancho con clickbait tiene que dejar avisos');
});
```

- [ ] **Paso 2: Ejecutar y comprobar que falla.** Esperado: `Cannot find module './cerrar.mjs'`.

- [ ] **Paso 3: Escribir la implementación**

Crea `REDES-SOCIALES/vientos/cerrar.mjs` con `construirManifest`. Requisitos exactos, sacados
de leer `integraciones/publicar-metricool.mjs` (que **no se toca**):

- `formato: 'post'` — es lo que hace que `mediaDePieza()` busque `post.png` en la carpeta.
- `fecha`, `hora: CONFIG.horas.post` (`'13:30'`).
- `verificacion: { ok: true, fallidos: [], nota: 'escena IA — gate propio de Los cuatro vientos' }`.
- `asunto: { conceptos: [], falta: [], fotosCortas: [] }` — vacíos, para pasar los gates
  heredados sin `--force`.
- `idioma: 'en'`, `captionEn` construido con `construirCaption({gancho: ganchoEn, idioma: 'en',
  formato: 'post', temaHashtags: articuloEn.section, semilla})`, y `captionEs` como respaldo.
- `enlaceEn: articuloEn.url`.
- `assetsFuente: [{ ruta: <ruta absoluta a la foto de referencia en public/uploads>, lugar:
  escena.lugar, nivel: 'referencia-ia', tipo: 'imagen' }]` — sirve de `alt` en Metricool.
- `avisosVoz`: los `avisos` que devuelva `construirCaption`.
- `vientos: { personaje, planoId, accionId, articuloSlug, fotoReferencia, vestuario, estacion,
  jobId, prompt, generadoEn: new Date().toISOString() }` — la trazabilidad completa, para poder
  reconstruir cualquier pieza meses después.

Y el modo CLI: `node vientos/cerrar.mjs <fecha> <urlDelResultado> <jobId>` que
1. lee la escena de `escenas.json`,
2. crea `publicaciones/<slugPieza(fecha, lugar)>/`,
3. descarga la URL a `post.png` (con `fetch` y `fs.writeFileSync`),
4. escribe `manifest.json`,
5. imprime el siguiente paso: `node integraciones/publicar-metricool.mjs <fecha>`.

Añade a `package.json`: `"vientos:cerrar": "node vientos/cerrar.mjs"`.

- [ ] **Paso 4: Ejecutar y comprobar que pasa.** Esperado: `# pass 45`.

- [ ] **Paso 5: Recorrido completo de una pieza real, de punta a punta**

Esto es lo que valida el sistema entero. Con el agente:

1. `npm run vientos:brief 2026-09-01` → copia el brief.
2. El agente llama a `media_import_url` con `urlReferencia`, luego a `generate_image` con
   `modelo` más ese `media_id` como `image_references`.
3. **Abre la imagen y míra­la.** Comprueba los 8 puntos de la "definición de hecho" (spec §12).
   Lo más importante: **que la marca de identidad del personaje esté** (la muesca de la oreja,
   el blaze, la oreja más oscura, la V blanca). Si no está, descarta y regenera.
4. `npm run vientos:cerrar 2026-09-01 <url> <jobId>`.
5. `node integraciones/publicar-metricool.mjs 2026-09-01`.
6. **Entra en Metricool y comprueba que el post está ahí, programado, con su imagen y su
   caption en inglés.** No des por bueno el "Resumen: 1 creados" de la consola.

- [ ] **Paso 6: Dejar constancia en KAN-137.**

---

### Tarea 9: Enterrar el sistema antiguo

**Ficheros:**
- Modificar: `REDES-SOCIALES/sistema/config.mjs` (la sección `cadencia`)
- Modificar: `REDES-SOCIALES/COMO-SE-HACE-UN-POST.md`
- Crear: `REDES-SOCIALES/_archivo-2026-08-29/` (carpeta destino)

- [ ] **Paso 1: Cambiar la cadencia**

En `sistema/config.mjs`, dentro de `cadencia`, deja:

```js
    // 2026-08-29 · LOS CUATRO VIENTOS. Se acabaron los carruseles, los reels y las
    // stories generadas (decision del dueno). Se publica 1 post de 1 imagen al dia,
    // generado con IA sobre foto real de Menorca. La story la republica el dueno a
    // mano desde esa misma imagen. Ver docs/superpowers/specs/2026-08-29-…-design.md
    diasReel: [],
    diasCarrusel: [],
    diasStory: [],
    diasPost: [0, 1, 2, 3, 4, 5, 6],
```

**No borres las claves vacías**: `generar-calendario.mjs` y `publicar-metricool.mjs` siguen
leyéndolas y romperían si desaparecen.

- [ ] **Paso 2: Comprobar que no se planifica nada del sistema viejo**

```
cd REDES-SOCIALES && node calendario/generar-calendario.mjs 2>&1 | tail -20
```
Esperado: 0 carruseles, 0 reels, 0 stories. Si sale alguno, la cadencia no se ha aplicado.

- [ ] **Paso 3: Archivar lo que ya no se usa**

```
cd REDES-SOCIALES
mkdir -p _archivo-2026-08-29
mv contenido _archivo-2026-08-29/
mv calendario/ideas-banco.json calendario/semillas-ideas.json calendario/generar-ideas.mjs _archivo-2026-08-29/
mv entregables _archivo-2026-08-29/
```

**No muevas** `remotion/`, `sistema/` ni `integraciones/`: `publicar-metricool.mjs`,
`captions.mjs`, `leer-articulos.mjs` y `config.mjs` siguen en uso y `remotion/` es la vía de
vuelta si algún día se reactivan los reels.

- [ ] **Paso 4: Reescribir la fuente de verdad**

En `REDES-SOCIALES/COMO-SE-HACE-UN-POST.md`, sustituye las secciones §1bis, §2, §3 y §4 por el
flujo nuevo (plan → brief → generar por MCP → verificar a ojo → cerrar → publicar), y deja al
principio un aviso grande de que el resto del documento describe un sistema **retirado el
29-ago-2026** que se conserva solo como historia. Enlaza a la spec.

- [ ] **Paso 5: Comprobar que todo sigue en verde**

```
cd REDES-SOCIALES && npm test
```
Esperado: `# pass 45`, `# fail 0`.

- [ ] **Paso 6: Cerrar KAN-137**

Pásala a **En revisión** (no a Finalizado): el dueño tiene que ver la primera semana de piezas
programadas en Metricool antes de darla por buena. Es el cortafuegos de aprobación de la §6bis
del CLAUDE.md.

---

## Auto-revisión del plan

**Cobertura de la spec:**

| Sección de la spec | Tarea que la implementa |
|---|---|
| §2 concepto de los cuatro vientos | 1 (los datos), 4 (el prompt lo materializa) |
| §3 el reparto y las marcas de identidad | 1 |
| §4.1 ultrarrealista + comportamiento humano | 4 (`CLAUSULA_COMPORTAMIENTO`) |
| §4.2 siempre sitio real | 5 (gate `/uploads/`), 6 (sale del `heroImage`) |
| §4.3 siempre artículo publicado | 5 (gate), 6 (planifica desde artículos publicados) |
| §4.4 rotación de planos y personajes | 6 |
| §4.5 paleta sin azul | 5 (gate) y 2 (test del vestuario) |
| §4.6 sin texto en la imagen | 4 (`NEGATIVOS`) |
| §4.7 sin personas | 4 (`NEGATIVOS`) |
| §4.8 IA declarada en la bio | **No es código.** Lo hace el dueño en Instagram; queda en KAN-137 |
| §4.9 coherencia de estación | 3 (`estacionDe`), 6 (filtro de acción y vestuario) |
| §5 banco de 12 planos | 2 |
| §6 banco de 37 acciones + la marca de riesgo de fumar | 2, y 6 la excluye del automático |
| §7 banco de vestuario | 2 |
| §8 modelo de datos de escena | 6 (lo produce), 8 (lo persiste en el manifest) |
| §9 operativa diaria | 7 y 8 |
| §10 qué se retira y qué se conserva | 9 |
| §12 definición de hecho | Tarea 8 paso 5 (verificación a ojo, obligatoria) |

**Hueco declarado:** §4.8 (declarar la IA en la bio de Instagram) no tiene tarea de código
porque es una acción manual del dueño en la app. Queda anotada en KAN-137 como pendiente suya.

**Consistencia de tipos:** `escena` tiene los mismos campos en la Tarea 6 (que la produce), la 5
(que la valida), la 4 (que la convierte en prompt), la 7 (que la empaqueta) y la 8 (que la
persiste): `fecha`, `personaje`, `planoId`, `accionId`, `articuloSlug`, `fotoReferencia`,
`lugar`, `lugarEn`, `vestuario`, `estacion`. `construirPrompt` es el único que además acepta
`momento`, y es opcional.
