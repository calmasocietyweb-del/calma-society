# Terminar el francés — vía pragmática (diseño)

- **Fecha:** 2026-07-10
- **Tickets Jira:** KAN-25 (limpieza de enlaces), + nueva ficha para el goteo. KAN-24 (Planificateur + agenda FR) **sigue aplazado**.
- **Decisión de partida:** council de 4 voces (10-jul-2026). Veredicto: lanzar más artículos FR en volumen es **prematuro**; la secuencia correcta es *medir → caja → limpieza → goteo mínimo*. El dueño eligió la **vía del Pragmático**: goteo mínimo de perennes probados, con la caja FR verificada primero.

## Contexto

Calma Society despliega el francés **por mercados** (rollout `partial` en `src/config/site.ts`): hoy 7 artículos perennes (clúster chófer, atardeceres, mejores calas, cuándo ir, moverse con clase) + páginas-herramienta (`ou-la-mer-est-calme`, `couchers-et-cocktails`) + legales/newsletter/RSS. ES y EN tienen 69 artículos cada uno. El selector FR solo aparece donde la página declara su `alternate` → cero huérfanas.

La prioridad #1 del proyecto (8-jul) es **distribuir** el tráfico existente, no producir. Por eso el goteo es mínimo y acotado, no una campaña.

**Hallazgo que reduce el trabajo:** la "caja" de captación FR **ya está localizada**. `src/i18n/ui.ts` tiene todas las cadenas del formulario en francés (placeholder, CTA "Rejoindre la Société", privacidad, consentimiento RGPD, doble opt-in, mensajes de confirmación) y `NewsletterSignup.astro` las sirve por `currentLocale()` en cualquier ruta `/fr/…`. La condición del Pragmático ("traduce el embudo antes que el contenido") ya se cumple para la captación general.

## Alcance

### Dentro
- **A. Verificar la caja FR** (QA, no construir): confirmar que `/fr/newsletter`, el CTA inline de final de artículo y el popup captan en francés en las 7 páginas FR.
- **B. Limpieza (KAN-25):** re-apuntar los 4 enlaces huérfanos de `plus-belles-criques-minorque.mdx` (hoy → `/lugar/cala-*-es` en español) a su equivalente FR existente (mapa *Où la mer est calme* u otro destino FR) o dejarlos sin enlace. QA de `hreflang`/selector de los 7 FR.
- **C. Goteo de 3-5 perennes probados** ES→FR, en `status: draft`, para aprobación del dueño antes de publicar. Selección:
  1. `como-llegar` → *Comment venir et se déplacer à Minorque* (práctica; refuerza el moat transfer/chófer)
  2. `cinco-dias` → *Minorque en 5 jours* (práctica; planificación)
  3. `cami` → *Le Camí de Cavalls* (descubrir; icónico)
  4. `queso` → *Le fromage Mahón-Minorque* (comer y beber; abre el pilar gastronómico en FR)
  5. *(opcional)* `faros` → *Les phares de Minorque* (descubrir; visual, GEO)
- **D. Gate:** a las ~4-6 semanas revisar impresiones FR/Francia en GSC antes de pasar de ~12-15 perennes.

### Fuera (aplazado, a propósito)
- **Lead magnet en FR** ("Las calas con menos gente"): exige PDF francés + grupo y automatización en MailerLite. No es necesario para el goteo.
- **Planificateur + agenda FR (KAN-24):** dependen de dato FR fiable y de datos que rotan. Siguen aplazados.
- **Paridad total FR (69 artículos):** contraria a la estrategia de despliegue por mercados y a la prioridad de tráfico.

## Reglas / definición de hecho

- Cada artículo FR nuevo: voz de lujo tranquilo (revisado, no traducción automática), `translationKey` compartido con su ES/EN, slug francés, `lang: fr`, `hreflang`/selector correctos, `alt` e imágenes con crédito/licencia intactos.
- Todo contenido nuevo nace en `status: draft`; **nada se publica sin visto bueno humano** (§3.10). El dueño aprueba el lote antes de pasar a `published`.
- Anclar siempre "à Minorque" y keywords naturales (memoria: contenido-mercedes-geo-menorca).
- Perennes solamente (sin fechas) → mantenimiento casi cero.

## Ejecución y checkpoints

1. A + B: seguros y reversibles, sin publicar nada nuevo → los aplica el chat de la web.
2. C: se delega al agente `localizacion-idiomas`; produce los MDX FR como `draft`. Checkpoint humano: el dueño aprueba antes de `published`.
3. Al terminar: reflejar en Jira (mover fichas a Finalizado), actualizar el registro web del vault y la memoria FR.
