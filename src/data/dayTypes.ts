/**
 * Librería de TIPOS DE DÍA del planificador (la "gran variedad de día").
 * El motor compone la estancia eligiendo tipos de día compatibles con la base,
 * el viento, el ritmo y los intereses, sin repetir zona dos días seguidos y
 * alternando día activo / día colchón. La secuencia intradía (mañana → comida →
 * tarde → atardecer → cena) y las reglas de no-saturar viven en el motor
 * (ver docs/PLANIFICADOR-BLUEPRINT.md). Aquí va el catálogo seleccionable.
 *
 * `zone` y `cluster` se cruzan con el campo `planner.zone`/`planner.cluster` de
 * cada lugar. `idealFor` se cruza con los intereses de la encuesta.
 */
export interface DayType {
  key: string;
  name: { es: string; en: string };
  zone: string; // zona/lado dominante del día (1 día = 1 lado)
  carNeeded: "si" | "no" | "recomendable";
  idealFor: string[]; // perfiles/intereses que sirve (cruza con la encuesta)
}

export const DAY_TYPES: DayType[] = [
  { key: "calas-suroeste", name: { es: "Calas del suroeste (las turquesa de postal)", en: "Southwest coves (the postcard turquoise)" }, zone: "sur-oeste", carNeeded: "recomendable", idealFor: ["primera-vez", "parejas", "calas", "fotografia"] },
  { key: "norte-agreste", name: { es: "Norte agreste (rojo, viento y faros)", en: "Wild north (red sand, wind and lighthouses)" }, zone: "norte", carNeeded: "si", idealFor: ["naturaleza", "calas", "fotografia", "sin-multitudes"] },
  { key: "cultura-talayotica", name: { es: "Cultura y Menorca talayótica", en: "Culture & Talayotic Menorca" }, zone: "centro", carNeeded: "recomendable", idealFor: ["cultura", "primera-vez", "dia-colchon", "calor-o-lluvia"] },
  { key: "gastronomico", name: { es: "Gastronómico con criterio (DOP y mar)", en: "Gastronomy with judgement (PDO & sea)" }, zone: "variable", carNeeded: "recomendable", idealFor: ["gastronomia", "lujo-tranquilo", "parejas"] },
  { key: "kayak-snorkel", name: { es: "Aventura en kayak y snorkel", en: "Kayak & snorkel adventure" }, zone: "variable", carNeeded: "recomendable", idealFor: ["nautica", "naturaleza", "aventura"] },
  { key: "sin-coche-barco", name: { es: "Sin coche: barco por el sur", en: "Car-free: by boat along the south" }, zone: "sur", carNeeded: "no", idealFor: ["sin-coche", "calas", "nautica", "primera-vez"] },
  { key: "familiar", name: { es: "Familiar (calas fáciles y poca caminata)", en: "Family (easy beaches, little walking)" }, zone: "sur-centro", carNeeded: "recomendable", idealFor: ["familias", "ninos-pequenos", "calas"] },
  { key: "atardeceres", name: { es: "Atardeceres encadenados (golden hour)", en: "Sunset day (golden hour)" }, zone: "variable", carNeeded: "recomendable", idealFor: ["parejas", "fotografia", "lujo-tranquilo"] },
  { key: "pueblos-mercados", name: { es: "Pueblos blancos y mercados", en: "White villages & markets" }, zone: "centro", carNeeded: "recomendable", idealFor: ["cultura", "gastronomia", "calor-o-lluvia"] },
  { key: "mar-snorkel", name: { es: "Mar y snorkel (vida marina)", en: "Sea & snorkel (marine life)" }, zone: "sur-este", carNeeded: "recomendable", idealFor: ["nautica", "naturaleza", "calas"] },
  { key: "cami-de-cavalls", name: { es: "Senderismo Camí de Cavalls (un tramo)", en: "Hiking the Camí de Cavalls (one stage)" }, zone: "variable", carNeeded: "recomendable", idealFor: ["naturaleza", "aventura", "senderismo"] },
  { key: "relax-lujo", name: { es: "Relax y lujo tranquilo", en: "Rest & quiet luxury" }, zone: "base", carNeeded: "no", idealFor: ["lujo-tranquilo", "parejas", "descanso"] },
  { key: "sureste-tranquilo", name: { es: "Sureste tranquilo (Maó y su entorno)", en: "Quiet south-east (Maó and around)" }, zone: "sur-este", carNeeded: "recomendable", idealFor: ["primera-vez", "cultura", "naturaleza"] },
  // Días especiales de logística (HUECO 2): llegada y salida.
  { key: "dia-llegada", name: { es: "Día de llegada", en: "Arrival day" }, zone: "base", carNeeded: "no", idealFor: ["llegada"] },
  { key: "dia-salida", name: { es: "Día de salida", en: "Departure day" }, zone: "cercano-aeropuerto", carNeeded: "no", idealFor: ["salida"] },
];
