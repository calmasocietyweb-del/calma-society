# Guía del editor visual (Keystatic) — para editar sin tocar código

Esta guía explica cómo editar la revista con el **panel visual**, sin ver código,
y da **consejos para que tus artículos y fotos se posicionen bien** en Google y en
las IA (ChatGPT, Perplexity, Google AI…).

---

## 1. Cómo abrir el editor

1. Abre la carpeta del proyecto.
2. Arranca el editor (una sola vez al empezar a trabajar). En la terminal:
   ```
   npm run cms
   ```
   (o `npm run dev`, es lo mismo).
3. En el navegador, entra en: **http://localhost:4321/keystatic**

Verás el panel con tu contenido: **Artículos**, **Eventos**, **Lugares** y **Autores**.

> Para cerrar el editor: pulsa `Ctrl + C` en la terminal.

---

## 2. Trastear SIN RIESGO (importante)

En este modo (modo *local*), **todo lo que cambias se guarda solo en tu ordenador**.
**La web publicada (calmasociety.com) NO cambia** hasta que hagamos el paso de
"publicar de verdad" (desplegar). Por eso puedes practicar con total tranquilidad:
crear, borrar, romper, deshacer… nada de eso afecta a la web real.

- ✅ Editas y guardas → cambia el archivo en tu PC.
- ✅ La web real sigue igual hasta que se despliega.
- 🔜 **Siguiente fase:** añadir un *login* para que otras personas editen y para
  que los cambios aprobados se publiquen solos.

---

## 3. El flujo de aprobación (el control de calidad)

Cada artículo, evento o lugar tiene un campo **Estado**:

| Estado | Qué significa |
|---|---|
| 📝 **Borrador** | En cocina. **No se publica.** Aquí nace todo. |
| 👀 **Pendiente de revisión** | Alguien lo propone y espera tu visto bueno. |
| ✅ **Publicado** | Aprobado por ti. **Es lo único que se ve en la web.** |

**Regla de oro:** nada llega al público sin que tú lo pongas en *Publicado*.
Cuando otras personas editen, dejarán sus propuestas en *Borrador* / *Pendiente*,
y tú decides.

---

## 4. Consejos para posicionar bien (SEO + GEO)

> GEO = que las IA te citen. Se consigue con **datos concretos, experiencia real y
> autoría visible** — justo lo que una IA no puede inventar.

### Al escribir un artículo
- **Título claro con la idea y el lugar.** Ej.: *«Dónde comer caldereta de langosta en Fornells»* (mejor que *«Gastronomía menorquina»*).
- **Resumen (entradilla) con chicha.** Una o dos frases con la idea principal y un dato. Es lo que se ve en Google y al compartir.
- **Encabezados (H2) que respondan preguntas reales.** *«¿Cuándo ir?»*, *«¿Cómo llegar?»*, *«¿Cuánto cuesta?»*.
- **Datos concretos:** horarios, precios, cómo llegar, aparcamiento, mejor época. Esto es oro para las IA.
- **Voz propia y experiencia local.** Cuenta lo que sabes de primera mano. No copies de otras webs.
- **Enlaza lugares** (calas, restaurantes) en *Lugares relacionados*.
- **Fecha de actualización:** cuando retoques un artículo antiguo, ponla. Da frescura y confianza.

### Con las fotos
- **Siempre con «texto alternativo» (alt).** Describe la foto en una frase. Ayuda a personas ciegas y a Google a entenderla. Ej.: *«Mesa con queso de Mahón y vino en una terraza al atardecer»*.
- **Fotos propias mejor que de banco** (más confianza y autenticidad).

### Transparencia
- Si un contenido es **pagado**, marca la casilla **«Contenido patrocinado»**. Siempre.

---

## 5. Cómo añadir una foto nueva

Las fotos de la web están **optimizadas** para que pesen poco y carguen rápido
(clave para el rendimiento y el SEO). Por eso, de momento, añadir una foto nueva
tiene un pasito extra (lo automatizaremos más adelante):

1. Consigue la foto (cámara propia o banco de imágenes con licencia).
2. Pásamela y yo la optimizo (genera versiones ligeras en `public/uploads/`),
   **o** sigue el flujo de `scripts/optimize-photos.mjs`.
3. En el editor, en **Foto principal (ruta)**, pon la ruta resultante,
   p. ej. `/uploads/mi-foto.webp`, y escribe su **texto alternativo**.

> Mientras tanto, puedes **cambiar qué foto (de las que ya existen) usa un artículo**
> escribiendo su ruta. Las fotos disponibles están en la carpeta `public/uploads/`.

---

## 6. Resumen rápido

1. `npm run cms` → entra en `localhost:4321/keystatic`.
2. Edita con tranquilidad: **no afecta a la web real**.
3. Todo nace en **Borrador**; solo **Publicado** sale a la web.
4. Buenos títulos + datos concretos + fotos con *alt* + autoría = mejor posición.
5. Cuando quieras que se publique de verdad o que otras personas editen, avísame
   y montamos el *login* y el despliegue.
