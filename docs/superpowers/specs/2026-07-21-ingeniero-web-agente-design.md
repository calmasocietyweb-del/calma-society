# Diseño: agente `ingeniero-web-calma-society` (2026-07-21)

> Aprobado por Cristian el 21-jul-2026 (enfoque A + ajuste de la regla del cierre).

## Problema

De los 7 agentes del proyecto, ninguno es de ingeniería web: varios prohíben expresamente
tocar la web («la web la lleva otro chat»). El rol de ingeniero/webmaster vive solo en el
chat principal de la carpeta, con el CLAUDE.md como manual. Cristian quiere además que ese
rol **le recomiende qué hacer para hacer crecer la web** — y no quiere tener que invocar
agentes a mano (no lo hace nunca).

## Decisión (enfoque A)

**Un solo agente con doble sombrero**: ejecutor técnico de la web + asesor de crecimiento
de la web. Descartados: dos agentes separados (burocracia, habría que saber a cuál llamar)
y ampliar el estratega (es de MARCA; su definición prohíbe tocar la web).

## El agente

- **Archivo:** `.claude/agents/ingeniero-web-calma-society.md` · `model: inherit` · todas
  las herramientas. NO se commitea (convención: `.claude/` va fuera de git, con su backup).
- **Ejecuta** sobre `src/`, `public/`, `scripts/`, `functions/` y config, con las mismas
  obligaciones que el chat principal: CLAUDE.md como ley, ficha Jira y bitácora del vault
  el mismo día, flujo de aprobación (nada a `published` sin visto bueno), definición de
  hecho con Lighthouse 95+.
- **Modo asesor de crecimiento**, dos disparadores:
  1. **Diagnóstico bajo demanda** («¿qué hago para crecer?»): lee DATOS reales antes de
     opinar (Umami, GSC, foto de analítica del vault, backlog Jira, plan de tráfico en
     `ESTRATEGIA/`) y entrega un plan corto: 3-5 acciones priorizadas por impacto vs
     esfuerzo, con métrica de éxito y quién ejecuta. Sin datos no recomienda: lo dice.
  2. **Cierre de cada trabajo**: una única recomendación («lo siguiente que más haría
     crecer la web»), ligada al plan vigente, no una ocurrencia nueva cada vez.
- **Frontera con el estratega:** el ingeniero recomienda y ejecuta el crecimiento DE LA
  WEB (SEO/GEO técnico, indexación, contenido web, conversión a newsletter, rendimiento,
  herramientas, idiomas). Si la palanca más rentable es de marca/canales externos, la
  recomienda igualmente pero la ejecución la remite al estratega con un brief.
- **Conocimiento operativo embebido** (lecciones que deben sobrevivir a los chats):
  verificar sobre `dist/`, no recortar la salida de un verificador, cache-buster tras
  deploy, comprobar que una URL existe antes de enlazarla, consultar el vault antes de
  proponer, arbitrar contra la fuente primaria.

## Cómo se dispara sin que Cristian lo llame

1. El chat principal lo invoca automáticamente cuando la tarea encaja con su descripción
   (igual que ya pasa con investigador/editor-jefe).
2. **La regla del cierre se duplica en la memoria persistente del proyecto** (tipo
   `feedback`): todo trabajo de web se cierra con la recomendación de crecimiento, lo haga
   el agente o el chat directamente. Sin esto, el chat (que hace la mayoría del trabajo
   inline) casi nunca la mostraría.

## Criterio de éxito

Cristian pregunta «¿qué hago para crecer?» en lenguaje normal y recibe un plan priorizado
basado en datos; y cada trabajo de web termina con una recomendación de crecimiento,
sin que él haya nombrado nunca al agente.
