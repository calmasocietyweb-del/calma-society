# Revista Menorca *(nombre provisional)*

Revista digital independiente sobre Menorca, **multilingüe europea**, con criterio
editorial y cobertura de la isla los 365 días del año. Construida con [Astro](https://astro.build/).

> 📖 La **fuente de verdad** del proyecto es [`CLAUDE.md`](./CLAUDE.md). La estrategia
> completa está en [`docs/`](./docs/). Léelos antes de tocar nada.

## Puesta en marcha

Requisitos: [Node.js](https://nodejs.org) (LTS) y [Git](https://git-scm.com).

```bash
npm install      # instalar dependencias (una vez)
npm run dev      # arrancar el servidor de desarrollo → http://localhost:4321
npm run build    # generar el sitio para producción (carpeta dist/)
npm run preview  # previsualizar el build de producción
```

## Idiomas

- Español (`es`) — en la raíz: `/`
- Inglés (`en`) — bajo prefijo: `/en/`

Los idiomas activos se configuran en [`src/config/site.ts`](./src/config/site.ts).
Para añadir uno nuevo, ver [`docs/ESTRATEGIA-MULTIIDIOMA.md`](./docs/ESTRATEGIA-MULTIIDIOMA.md).

## Estado

Fase 0 (cimientos) completada: el esqueleto compila y despliega. Siguientes fases en
[`CLAUDE.md`](./CLAUDE.md) §10.
