# Automatización y flujo editorial — "Asistido, no automático"

> Cómo la revista funciona "casi sola" **sin** perder la calidad que la hace ganar. La regla de oro: **nada se publica sin aprobación humana.** Acompaña a `CLAUDE.md` (§2 decisiones 9-10, §3 principio 10, §6 bis).

---

## 1. La regla de oro

> **Por mucho que se automatice, ningún contenido llega al público sin que una persona lo apruebe.**

Esto no es burocracia: es el **cortafuegos que protege el moat** del proyecto. El análisis de mercado (§0.4, §3.3) demuestra que el contenido generado en masa por IA **no posiciona, no fideliza y no lo cita la IA**. Lo que gana es criterio + primera mano + fotos propias. La automatización existe para **quitarte trabajo mecánico**, no para sustituir tu criterio.

---

## 2. Qué se automatiza y qué no

| Lo hace LA MÁQUINA (deja en `draft`) | Lo decide UNA PERSONA |
|---|---|
| Recoger eventos de fuentes oficiales (agenda) | Qué eventos/lugares merecen destacarse |
| Optimizar imágenes (AVIF/WebP, tamaños, `alt` sugerido) | Las fotos propias y la portada |
| Generar metadatos SEO y JSON-LD | El ángulo y la voz del artículo |
| Borradores de traducción a otros idiomas | Revisar y aprobar cada traducción |
| Borradores/esqueletos de artículo a partir de notas | Reescribir con criterio y verificar datos |
| Programar y enviar la newsletter | Aprobar el contenido de cada envío |
| Publicar en redes lo ya aprobado | Aprobar qué y cuándo |

**Principio:** la máquina propone, el humano dispone.

---

## 3. El ciclo de vida de todo contenido

```
   ┌─────────────┐      ┌──────────┐      ┌─────────────────┐      ┌─────────────┐
   │  PROPUESTA  │ ───► │  draft   │ ───► │  revisión dueño │ ───► │  published  │
   │ (máquina o  │      │ /pending │      │  (aprobar/      │      │ (al público)│
   │   humano)   │      │          │      │   editar/       │      └─────────────┘
   └─────────────┘      └──────────┘      │   descartar)    │
                                          └────────┬────────┘
                                                   │ descartado
                                                   ▼
                                            ┌─────────────┐
                                            │  archivado  │
                                            └─────────────┘
```

- Campo `status` en el modelo de contenido: `draft` → `pending` → `published` (o `descartado`).
- **La build de producción solo incluye `published`.** Todo lo demás es invisible para el público (pero visible para ti en la bandeja).
- Campo `source` registra qué lo originó (`humano`, `auto-agenda`, `auto-traduccion`…) para que sepas de un vistazo qué propuso la máquina.

---

## 4. La "bandeja de aprobación" (cómo la usas tú, sin código)

Se construye en **dos niveles**, de lo simple a lo cómodo:

**Nivel 1 — desde ya (Fases 2-3):** los borradores son archivos con `status: draft`. Una página interna de "Pendientes" (solo visible en desarrollo) lista todo lo que espera tu visto bueno. Apruebas cambiando `status` a `published` (o me lo dices y yo lo hago).

**Nivel 2 — cómodo (Fase 6):** **Keystatic**, un editor visual que funciona en el navegador (como un gestor de blog). Ahí ves cada propuesta con su foto y texto, y con un botón **Aprobar / Editar / Descartar**. Sin tocar código, sin terminal. Es tu "bandeja de entrada editorial".

> Mientras llega el Nivel 2, tú apruebas en lenguaje normal en el chat ("publica el evento X", "descarta el Y") y yo ejecuto.

---

## 5. Por dónde empieza la automatización (orden de fiabilidad)

Se automatiza primero lo **más fiable y menos arriesgado**:

1. **Agenda de eventos** desde fuentes oficiales (ayuntamientos, menorca.es, agendas culturales). Datos estructurados, bajo riesgo. → propuestas en `draft`.
2. **Optimización técnica** (imágenes, SEO, JSON-LD): no genera contenido, solo lo mejora.
3. **Borradores de traducción** (ver `docs/ESTRATEGIA-MULTIIDIOMA.md`).
4. **Distribución** (newsletter, redes) de lo ya aprobado.
5. **Borradores editoriales asistidos** (lo más delicado, siempre muy revisado): esqueletos a partir de tus notas/fotos, nunca publicación directa.

**Lo que NUNCA se automatiza hasta publicación:** la voz editorial, la valoración ("¿merece la pena este restaurante?"), las fotos propias, las afirmaciones que requieren verificación local.

---

## 6. Aspectos legales y de confianza

- **Fuentes:** la agenda automática enlaza y atribuye la fuente; no se copian textos con copyright (análisis y `CLAUDE.md` §12).
- **Contenido patrocinado:** siempre etiquetado (`sponsored: true`), aunque entre por flujo automático.
- **Transparencia con IA:** si una pieza se apoyó en IA, el criterio y la verificación humana son los que la hacen publicable; la autoría visible (E-E-A-T) se mantiene.
- **Datos personales / RGPD:** la agenda no recoge datos personales; la newsletter usa doble opt-in (ver doc de marketing).

---

## 7. Resumen para el dueño

- Trabajas **poco y bien**: revisas y apruebas, no produces todo a mano.
- **Nada se te escapa**: nada sale sin tu clic.
- La máquina te **ahorra lo aburrido** (agenda, traducción, SEO, envíos) y te deja lo **valioso** (criterio, fotos, voz).
- Empieza pequeño (agenda) y crece según confíes en cada pieza.
