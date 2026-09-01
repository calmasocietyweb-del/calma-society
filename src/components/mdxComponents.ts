/**
 * Componentes que el cuerpo de un artículo MDX puede usar.
 *
 * Se INYECTAN desde la ruta (`<Content components={mdxComponents} />`), no se
 * importan dentro de cada `.mdx`. Por eso un `.mdx` puede escribir
 * `<FlotaChofer />` sin ningún `import`: el mapa se lo da la página.
 *
 * ⚠️ POR QUÉ ESTE FICHERO EXISTE (1-sep-2026). Antes cada ruta de idioma
 * declaraba SU PROPIO mapa —seis copias— y habían derivado sin que nadie lo
 * notara:
 *
 *   es · en → los seis componentes
 *   fr      → sin FlotaChofer
 *   de      → sin NightlifeMap
 *   it · pt → sin FlotaChofer NI NightlifeMap
 *
 * El fallo no se veía porque los artículos que usaban los componentes que
 * faltaban estaban en `draft`: el francés reventó la build en el momento exacto
 * en que se publicaron sus 76 artículos, y el alemán se había librado solo
 * porque justo le faltaba el artículo de vida nocturna. Italiano y portugués
 * llevaban la misma mina puesta para el día que tuvieran artículos.
 *
 * Una sola fuente. Al añadir un componente nuevo se añade AQUÍ y lo tienen los
 * seis idiomas a la vez — que es la única forma de que no vuelva a pasar.
 */
import Figure from "./Figure.astro";
import MenorcaBusCTA from "./MenorcaBusCTA.astro";
import CruceroCalendar from "./CruceroCalendar.astro";
import FlotaChofer from "./FlotaChofer.astro";
import NightlifeMap from "./NightlifeMap.astro";
import ToolsCTA from "./ToolsCTA.astro";

export const mdxComponents = {
  Figure,
  MenorcaBusCTA,
  CruceroCalendar,
  FlotaChofer,
  NightlifeMap,
  ToolsCTA,
};
