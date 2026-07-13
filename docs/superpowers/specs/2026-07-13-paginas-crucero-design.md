# Páginas por barco de crucero — captar al crucerista hacia Menorca Bus

**Fecha:** 2026-07-13 · **Estado:** diseño aprobado por Cristian
**Origen:** «no solo quiero refrescar [el calendario] sino que necesito que se hagan post individuales de cada crucero asociándolo a Menorca Bus; necesitamos que los clientes del crucero nos encuentren si quieren ir a visitar algo».

## 1. El problema del lector (y por qué esto no es SEO de relleno)

El crucerista de Maó baja del barco a una hora y **tiene que estar de vuelta a otra**. Si pierde el barco, lo pierde de verdad. Su única pregunta es: **«¿qué me da tiempo a hacer?»** — y nadie se la responde con números.

Nosotros sí podemos, porque tenemos dos datos que casi nadie cruza:

- **la hora real de atraque y de zarpa de cada barco** (`src/data/cruceros-menorca-2026.json`, campos `arrival` / `departure`);
- **los tiempos de coche reales desde Maó** (`src/data/travelTimes.ts`, verificados: Ciutadella 45 min, Cala Galdana 34, Favàritx 30, Fornells 20, Es Grau 15).

Con eso, cada página dice algo distinto y **verdadero**, y el contenido no se repite porque **la escala de cada barco es distinta**.

## 2. Quién viene (y por qué encaja con la marca)

De las 97 escalas de 2026, **21 barcos repiten**. Entre ellos: **Ritz-Carlton (Evrima e Ilma), Seabourn, Regent Seven Seas, Crystal, Explora Journeys, MS Europa (Hapag-Lloyd), SeaDream, Scenic, Windstar**. Es crucero de lujo con 100-900 pasajeros: **el viajero que no se sube a un autobús de cincuenta**. Es exactamente el público de Calma Society y el cliente natural del chófer privado.

Y las escalas no se parecen en nada:

| Barco | Atraca → zarpa | Lo que cambia |
|---|---|---|
| MS Europa | 07:00 → 14:00 | solo la mañana; comen a bordo |
| MSC Opera | 09:00 → 16:00 | 7 h, y bajan 2.150 personas de golpe |
| Ritz-Carlton Evrima | 08:00 → 16:00 | 8 h, 298 pasajeros |
| Explora I | 09:00 → 21:00 | **12 h: le da tiempo al atardecer** |
| Wind Spirit / Wind Star | 08:00 → 22:00 | **14 h: puede cenar en tierra** |

## 3. Alcance

**Dentro:**
- Una página **por barco**, solo para los **15 que repiten Y tienen horas verificadas**, en **español e inglés** (30 páginas).
- Enlace desde el calendario de cruceros: cada barco lleva a su página.
- CTA de Menorca Bus: **chófer privado por horas** y **traslado puerto ↔ destino** (los dos productos que Cristian ha confirmado — y solo esos).

**Fuera (no-goals):**
- Nada de páginas por **escala** (97 páginas calcadas con la fecha cambiada = relleno; lo prohíbe CLAUDE.md §12).
- Nada de páginas para los **6 barcos sin horas** (Emerald Sakara, Star Flyer, Scenic Eclipse, Royal Clipper, Star Clipper, SeaDream I): sin horas, la página pierde justo lo que la hace útil. Entran cuando se consigan sus horarios.
- Nada de **excursión con guía**: Menorca Bus pone coche y chófer. No se inventan servicios (ver memoria «no inventar condiciones comerciales»).
- No se abre el locale **alemán**, aunque el AIDAstella traiga ~13.000 alemanes: eso es otro proyecto.

## 4. Qué contiene cada página

1. **Cabecera honesta.** Barco, naviera, pasajeros, y **sus fechas de escala en Maó este año**.
2. **«Cuánto tiempo tienes de verdad».** El cálculo, explicado:
   `horas útiles = (zarpa − atraca) − 30 min de desembarque − 60 min de margen de vuelta`.
   El margen no es un capricho: el *all aboard* suele ser entre 30 y 60 minutos antes de zarpar; tomamos el peor caso y lo decimos.
3. **«Qué te da tiempo a hacer».** Planes calculados con los tiempos reales: un destino a *T* minutos necesita `2T + estancia mínima`. Se ofrecen los que caben, y se ordenan por lo que la revista defiende (calma, no maratón).
4. **«Qué NO te da tiempo».** Esta sección es el moat: decir «con 5 horas útiles, Fornells y volver con margen no sale» vale más que veinte adjetivos.
5. **Cómo se sale del puerto de Maó** (el muelle está abajo y la ciudad, arriba).
6. **CTA Menorca Bus**: chófer que te espera y te devuelve al barco a tiempo · traslado puerto ↔ destino.
7. **Enlaces a la casa**: planificador, mar en calma (para elegir cala según el viento del día), atardeceres (solo si el barco zarpa tarde), comer y beber (solo si le da tiempo a cenar).

Los apartados 3, 4 y 7 **dependen de las horas del barco**, así que ninguna página se parece a otra.

## 5. Arquitectura

- **`src/lib/cruises.ts`** (nuevo, puro y testable): lee el JSON, agrupa por barco, calcula horas útiles y decide qué planes caben. Sin dependencias de Astro → **tests de node:test**.
- **`src/pages/crucero/[ship].astro`** y **`src/pages/en/cruise/[ship].astro`**: rutas estáticas (`getStaticPaths`) desde esa librería.
- **`CruceroCalendar.astro`**: cada barco con página pasa a ser un enlace.
- **SEO**: `Seo` + JSON-LD (`FAQPage` con las preguntas reales del crucerista + `BreadcrumbList`), `hreflang` ES↔EN, y las páginas al sitemap.

## 6. Honestidad (lo que puede fallar)

- **Las horas de escala cambian.** Se publican como «horario habitual» con la fecha de actualización y un aviso: *confirma con tu naviera*. Nunca como promesa.
- **La cobertura del calendario es del 76%** (97 de ~125-130 escalas). Se dice.
- Un barco puede dejar de venir: la página se genera **desde el JSON**, así que al actualizarlo, desaparece sola.

## 7. Definición de hecho

- 30 páginas (15 barcos × ES/EN) que compilan y despliegan, con `hreflang` y sitemap.
- `src/lib/cruises.ts` con **tests** (horas útiles, planes que caben y planes que no).
- Cada página enlaza al calendario, al planificador y a Menorca Bus; y a atardeceres/cena **solo** si sus horas lo permiten.
- `astro check` sin errores · tests verdes · Lighthouse intacto (cero JS de cliente nuevo).
