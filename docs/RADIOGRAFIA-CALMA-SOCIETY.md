# Radiografía de Calma Society — estado del proyecto (23 jun 2026)

> Auditoría exhaustiva de 10 dimensiones (identidad, web, contenido, herramientas, automatización, SEO/GEO, marca, redes, monetización, futuro), hecha leyendo los docs y el código reales del repo. **Madurez media: 70/100.**
>
> Resumen en una frase: **estrategia y producto de sobresaliente, motor de audiencia en pañales, negocio aún por nacer.** La distancia entre lo *declarado* y lo *demostrado* es el diagnóstico central.

---

## 1. Qué es

Revista digital independiente de **"lujo tranquilo" (*quiet luxury*)** sobre el Mediterráneo, con **Menorca como primera edición** y arquitectura de **marca paraguas** (ampliable a Mallorca, Cícladas…). Bilingüe ES/EN real. Cubre lo mismo que las guías (calas, gastronomía, qué hacer) pero **elevado**: criterio, estética y calma frente a la masificación de Mallorca/Ibiza.

No es papel: **en vivo en calmasociety.com** (Cloudflare, estático puro, 188 páginas), con 116 artículos (58 ES + 58 EN), 131 lugares, 74 eventos y dos herramientas propias funcionando.

## 2. Cuál es su función

Públicos por valor: **viajero exigente → propietario internacional → quien sueña con la isla.** Función real triple:
1. **Construir audiencia propia** (newsletter "la Society") — KPI #1, el único activo que la IA no quita.
2. **Ser citable por la IA (GEO)** con datos de primera mano, fechados y verificados.
3. **Monetizar sin traicionar la calma** — hoy, en la práctica, llevar tráfico al negocio propio del dueño (Menorca Bus).

## 3. Estado por áreas

| Área | Madurez | Estado |
|---|---|---|
| Web (técnica) | 82 | Casi terminada. Astro 6 estático, build limpio, en producción. |
| SEO / GEO / multiidioma | 82 | JSON-LD por tipo, hreflang, sitemap, RSS. Listo para lanzar. |
| Identidad / posicionamiento | 78 | Excepcional: análisis +90 fuentes, inteligencia competitiva verificada en vivo. |
| Marca visual | 78 | Sistema real y coherente con la web. |
| Mapa "Mar en calma" + Agenda | 72 | Ambas en vivo. IP genuina (viento AEMET × orientación de 75 calas). |
| Automatización / flujo editorial | 72 | Cortafuegos `status` real; doble bandeja (consola + Keystatic). |
| Contenido editorial | 68 | 116 artículos de criterio (media 1.177 palabras). Desequilibrado. |
| Planificador de viajes | 68 | Motor completo (9 pasos, 55 tests), en vivo. No capta email ni PDF. |
| Redes / marketing / crecimiento | 62 | Pipeline real (Remotion+voz+Metricool). 0 publicado, 0 suscriptores. |
| **Monetización / negocio** | **38** | Eslabón débil. 1 de 5 palancas activa (tráfico al negocio del dueño). |

## 4. Las verdades incómodas (contradicciones detectadas por varios analistas)

1. **Moat declarado, no demostrado.** Posicionamiento brillante y producto real, pero audiencia, citas IA e ingresos = 0.
2. **E-E-A-T de mentira.** 116 artículos firmados por **una sola persona** (Cristian Camps) con bio de una línea. El moat anti-IA "autoría visible" hoy es nominal.
3. **Conflicto de interés en el dueño.** Titular = Menorca Bus, S.L.; **119 artículos** empujan CTA a menorcabus.com y **0** están etiquetados como `sponsored`.
4. **Grieta en la "regla de oro".** `add-eventos.mjs` auto-publica eventos de confianza alta; los 148 eventos están **todos en `published`**. El estado `pending` es casi decorativo.
5. **El imán de leads #1 no capta leads.** El planificador no captura ni un correo (P4 sin hacer) y su versión inglesa está rota (22 vs 88 lugares).
6. **El motor de crecimiento está fuera de git.** `REDES-SOCIALES/`, `ESTRATEGIA/` y `marca/` no están versionados — riesgo de pérdida total.
7. **El robot diario no está demostrado en régimen.** Un solo commit de `calma-bot`; el dato lo metió un humano. GitHub apaga crons tras 60 días sin alerta.
8. **El medio ingresa 0 extra.** El propio plan lo admite: "la web no factura nada nuevo".
9. **Contenido desequilibrado.** 40 "descubrir" / 28 "práctica" vs **6 "vivir"** / 2 "agenda": el segmento más rentable (propiedad/lifestyle) infraconstruido.
10. **Inconsistencia de tagline.** Manual: "El arte del lujo tranquilo en el Mediterráneo"; web: "El Mediterráneo, sin prisa".
11. **Deuda técnica latente.** `astro check` da 56 errores TS (build verde engañoso: Astro no typecheckea). Artefactos `node_modules`/`.astro` dentro de `src/content/lugares`.
12. **Lugares a medias.** 98 ES vs 32 EN; 96/130 en draft.

## 5. Hacia dónde va

El próximo salto **no es de construcción, es de *prueba*** (demostrar el moat):
- **Activar el motor de audiencia:** reactivar newsletter + lead magnet + **cerrar P4 del planificador** (guardar/email el plan).
- **Hacer real el E-E-A-T:** 2-3 firmas con cara y especialidad; **etiquetar el conflicto Menorca Bus** con transparencia.
- **Reequilibrar contenido** hacia "vivir/propiedad/lifestyle" y agenda curada.
- **Demostrar monetización:** cerrar el círculo de atribución con datos del panel de Menorca Bus; activar afiliación.
- **Blindar lo existente:** sacar `REDES-SOCIALES/ESTRATEGIA/marca` del gitignore; formalizar las excepciones a la aprobación.

Veredicto: cimientos muy sólidos (estrategia, web, marca, herramientas, todo construido y coherente); está en el punto en que **un buen producto debe convertirse en un negocio con audiencia**. El coche está montado y afinado: falta arrancarlo y demostrar que rueda.

## 6. Prioridad de correcciones de la web (derivada del análisis)

**Tier 1 — Credibilidad y coherencia (rápido, sin dependencias externas):**
1. Unificar el tagline marca ↔ web.
2. Enriquecer la autoría (bio real con criterio/trayectoria + foto) y preparar más firmas.
3. Etiquetar la transparencia de Menorca Bus (decir que es negocio propio del medio).
4. Higiene técnica: limpiar artefactos en `src/content/lugares`, bajar los 56 errores TS, meter `astro check` en CI.

**Tier 2 — El motor de audiencia (apuesta estratégica):**
5. Cerrar **P4 del planificador**: captura de email + descarga PDF (print-CSS) — *requiere decidir proveedor de newsletter*.
6. Arreglar la **i18n EN del planificador** (dataset EN a paridad + textos del motor en inglés).

**Tier 3 — Profundidad y GEO:**
7. Enriquecer schemas que ya tienen los datos (Place: openingHours/telephone/image; Event: offers/performer/organizer) para rich results. **— PARCIAL HECHO (24 jun 2026):** se enchufó lo que el dato *ya* soporta — Event ahora emite `image` (148 eventos), `url` (sourceUrl, 124), `eventAttendanceMode` y `address` estructurada (`PostalAddress`); Place emite `image` (8 fichas publicadas con foto). **Lo demás NO se hizo por falta de dato (no se inventa):** `telephone` y horarios-máquina de Place (0 fichas con teléfono; solo 2 con `openDays` y sin horas), y `offers`/`performer`/`organizer`/geo-real de Event (0 datos: ningún evento usa `locationRef`). Para completarlo hace falta primero **añadir campos al schema y sembrar datos verificados** (tarea de `investigador-menorca`), no de ingeniería.
8. Cerrar paridad EN de lugares y publicar los 96 draft revisados.
9. Reequilibrar contenido hacia "vivir" (el segmento rentable, hoy solo 6 artículos).

---

*Documento de referencia generado por auditoría multiagente. Actualizar cuando cambie el estado.*
