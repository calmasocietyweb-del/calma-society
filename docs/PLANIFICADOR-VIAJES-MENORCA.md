# Planificador de viajes "Organiza tu viaje a Menorca" — Cimiento (investigacion)

> Documento de DISENO generado de una investigacion multi-agente (98 lugares verificados con fuentes). Es la base para construir el motor de reglas. Nada se publica sin revision.

## Veredicto

QUÉ TENEMOS Y CÓMO DE SÓLIDO ES EL CIMIENTO

Tienes los tres pilares para construir un planificador de itinerarios determinista de lujo tranquilo, y el cimiento es SÓLIDO (confianza global media-alta):

1) DATASET DE 98 LUGARES, ya verificado contra fuentes fiables. Reparto: 25 calas, 16 playas, 8 faros, 9 núcleos, 6 pueblos, 7 yacimientos, 4 monumentos, 2 miradores, 13 experiencias, 1 naturaleza, 7 gastronomía. Lo más valioso para el motor (las RESTRICCIONES DE COCHE en verano y el acceso a pie/lanzadera/barco) está bien capturado: ese es el moat del planificador. Hay 5 correcciones concretas que aplicar ANTES de cablear el motor (ver lagunas): zona de Cala Mesquida (este->norte), "Son Bou Beach Club" (nombre inventado -> usar Ses Grulles/Ses Garces/Es Corb Mari), duplicado de Faro de Favaritx (fusionar), municipio de Trepucó (->Maó), grafía Llucmaçanes.

2) PATRONES DE ITINERARIO de viajeros reales (1/3/5/7/14 días, con coche, sin coche, familias, senderismo), con una regla de oro clarísima: Menorca es una "espina de pez" (todo cuelga de la Me-1 Maó-Ciutadella; las costeras son ramales sin litoral continuo). El error #1 es zigzaguear. Se agrupa por COSTAS y por DÍAS. Esto da reglas deterministas: clustering por zona, regla del viento (Tramontana->sur; viento sur->norte), madrugar a las calas (parking lleno 10-11h), y la lógica con/sin coche.

3) MOVILIDAD detallada: líneas de bus reales (TMSA eje Maó-Ciutadella, Torrent/Torres a calas), lanzaderas de temporada (Macarella, Turqueta, Son Saura, Favaritx), qué calas NO tienen transporte público, ferries con coche, y el calendario de cierre estival al coche (1 jun-30 sep).

ESTADO DEL CÓDIGO: la colección "lugares" YA EXISTE en src/content.config.ts pero su esquema es editorial (area como texto libre tipo "Sur (Ciutadella)", type reducido a 6 valores, practicalInfo en prosa). NO tiene los campos máquina-legibles que el motor necesita (zona normalizada, carAccess, durationHint, idealFor, cluster, bestSeason). La recomendación es AÑADIR un bloque "planner" tipado a la ficha (sin romper lo editorial) — no reescribir las 98 fichas a mano, sino enriquecerlas con esos campos. El motor debe ser una función pura y determinista (mismos inputs -> mismo plan), nada de IA en tiempo de ejecución: las fuentes coinciden y las reglas son estables.

VEREDICTO: el cimiento aguanta. Con las 5 correcciones y el enriquecimiento de campos del planner sobre las 98 fichas existentes, se puede construir un motor de reglas fiable que produzca planes "calma" (pocas paradas, sin zigzag, madrugar, flexibilidad por viento, alternativa en barco/llaüt para el sur sin coche).

## Modelo de datos (bloque `planner` a anadir a las fichas)

CAMPOS POR LUGAR PARA ALIMENTAR EL MOTOR (bloque "planner" que se AÑADE al esquema existente de src/content.config.ts, sin romper lo editorial). Todos los slugs/enums en inglés por convención; textos visibles localizados por translationKey.

IDENTIDAD (ya existe, reutilizar):
- name, translationKey, lang, description, coordinates {lat,lng}, website, images, status, edition.
- type: AMPLIAR el enum actual (cala/restaurante/alojamiento/monumento/comercio/otro) a los tipos reales del dataset: 'cala'|'playa'|'faro'|'nucleo'|'pueblo'|'yacimiento'|'monumento'|'mirador'|'experiencia'|'naturaleza'|'gastronomia'|'restaurante'|'alojamiento'|'comercio'. (cala vs playa importa: playa = grande, con servicios y bus; cala = pequeña/virgen.)

GEOGRAFÍA / CLUSTERING (NUEVO, núcleo del anti-zigzag):
- zone: enum DETERMINISTA 'oeste'|'sur'|'norte'|'este'|'centro' (normaliza el actual "area" de texto libre). REGLA: una sola zona por lugar; es la unidad de agrupación por día.
- cluster: id de micro-zona que comparte ramal/parking/base de día. Ej: 'ciutadella-ciudad', 'calas-virgenes-ciutadella' (Turqueta/Son Saura/Es Talaier), 'galdana-macarella' (Galdana/Macarella/Macarelleta/Mitjana), 'son-bou-migjorn' (Son Bou/Sant Tomàs/Binigaus), 'fornells-cavalleria' (Fornells/Cavalleria/Pregonda/Binimel-la), 'mao-puerto' (Maó/Es Castell), 'albufera-favaritx' (Es Grau/s'Albufera/Favaritx), 'binibeca-sur-este' (Binibeca/Punta Prima/Binisafúller), 'interior-cultura' (Monte Toro/Naveta/Lithica/queserías). El motor agrupa por cluster dentro de zone para encadenar sin volver a la Me-1.
- municipality: uno de los 8 (Maó, Ciutadella, Alaior, Es Castell, Sant Lluís, Es Mercadal, Ferreries, Es Migjorn Gran). Para schema.org y filtros.
- baseProximity: lista de bases desde las que el lugar es "del día" sin cruzar la isla: ['ciutadella','mao','es-mercadal','galdana','son-bou'].

ACCESO COCHE / SIN COCHE (NUEVO, el moat):
- carAccess: 'direct' (coche llega + parking) | 'restricted-summer' (coche prohibido 1 jun-30 sep, ver carRestriction) | 'foot-only' (solo a pie/bici, p.ej. Binibeca, Escorxada) | 'boat-only' | 'none'.
- carRestriction: {from:'06-01', to:'09-30', note} — solo si restricted-summer. Lugares: Macarella, Macarelleta, Cala Tortuga, Cala Presili, S'Escala-Es Portitxol, Savinar de Mongofra, Favaritx; Punta Nati (1 jul-31 ago). Calendario exacto del Consell A VERIFICAR cada año.
- parkingFillsEarly: bool + parkingNote ('llega antes de 9:30/se llena hacia 10-11h'). Aplica a Turqueta, Son Saura, Es Talaier, Macarella (coche/parking lejano), etc.
- transitAccess: enum 'bus-direct' | 'bus-shuttle-seasonal' | 'bus+walk' | 'taxi-only' | 'boat-only' | 'none'.
- busLine: línea(s) reales si transitAccess usa bus (L32 Son Bou, L51/L52/L53 Galdana, L71/L72 Sant Tomàs, L23 Es Grau, L31 Cala en Porter, L92 Punta Prima, L62 Algaiarens, L43 Favaritx; eje Maó-Ciutadella TMSA).
- walkFromTransit: {minutes, path} si transitAccess='bus+walk' (Mitjana ~20min desde Galdana, Macarella ~30-45min, Pregonda ~30-35min desde Binimel-la).
- boatAccess: bool + boatNote (llaüt/taxi-boat BUS-MAR Macarella-Turqueta-Son Saura; catamarán norte ~3,5h; velero atardecer Fornells). Es la ALTERNATIVA al sur sin coche.

RITMO / PLANIFICACIÓN (NUEVO):
- durationHint: minutos típicos de visita (bandera para el ritmo): cala-baño ~120-240; faro/mirador ~30-45; pueblo/núcleo ~120-180; yacimiento ~30-60; experiencia barco ~210; queso/cata ~90.
- timeOfDay: tags 'sunrise'|'morning'|'midday'|'afternoon'|'sunset'|'evening'|'night'. Faros/miradores/Pont d'en Gil/Cova d'en Xoroi = 'sunset'; calas con parking = 'morning' (madrugar); vida nocturna = 'night'.
- windSensitivity: 'north-exposed' (malo con Tramontana, mejor con viento sur) | 'south-exposed' (malo con viento sur) | 'sheltered'. Motor lo usa para la regla del viento al reordenar el día.
- season: bestSeason ['may','jun','sep','oct'] preferentes para 'calma'; openSeason si el sitio es estacional (chiringuito, lanzadera, Finca Binillubet oct-jun, Eolo cierra martes).
- requiresBooking: bool (coche de alquiler, restaurantes 20-21h, Cova d'en Xoroi, excursiones barco).
- noServices: bool (sin chiringuito/agua/sombra -> el motor añade aviso "lleva agua, sombra, comida").

INTERESES / MATCHING (NUEVO):
- idealFor: tags de perfil 'first-timer'|'families'|'couples'|'hikers'|'foodies'|'culture'|'beach-purist'|'nightlife'|'photographers'|'luxury'|'no-car'. (families excluye foot-only largo y restricted salvo barco.)
- experienceTags: 'turquoise-cove'|'wild-beach'|'old-town'|'lighthouse'|'sunset-spot'|'talayotic'|'gastronomy-dop'|'lobster-stew'|'wine'|'boat-trip'|'hiking-cami-cavalls'|'natural-park'|'viewpoint'|'nightlife'|'craft' — el puente entre la encuesta y el dataset.
- luxuryLevel: 'quiet-luxury' (acorde marca) | 'premium' | 'standard' — para priorizar lo elevado y filtrar lo masificado.
- relatedArticle: reference al MDX editorial (ya existe relatedPlaces inverso) para enlazar la ficha del plan a la pieza de revista.

CERTEZA (gobernanza):
- certainty: 'alta'|'media'|'baja' (de la verificación). El motor puede preferir 'alta' y marcar 'baja/media' como "verificar".
- coordsEstimated: bool (las coords del dataset NO se verificaron una a una; marcar estimadas si se añaden).

## Motor de itinerario (reglas)

### Clustering (regla de oro anti-zigzag)
REGLA DE ORO (anti-zigzag): Menorca es una espina de pez radial sobre la Me-1; NO se encadenan calas de costas opuestas en un día. (1) UN lugar = UNA zone (oeste/sur/norte/este/centro). (2) Un DÍA = un cluster dominante (micro-zona que comparte ramal/parking/base), opcionalmente + 1 cluster contiguo de la misma zone. NUNCA mezclar dos zones en un día salvo transición a base nueva. (3) Orden dentro del día por geografía y timeOfDay: mañana cala con parking que se llena (madrugar), mediodía comida/pueblo, tarde segunda cala o cultura, atardecer faro/mirador/sunset-spot del MISMO ramal (Artrutx/Pont d'en Gil en oeste; Cavalleria/Favaritx en norte/este; Cova d'en Xoroi en sur-centro). (4) Bases por día: cada día arranca y vuelve a la base; si baseProximity no incluye la base, ese cluster va a otro día o se sugiere cambio de base. (5) Estancias 10-14d: cambiar de base a mitad (oeste-sur primero, este-norte después). (6) Regla del viento aplicada al ORDEN, no al plan fijo: el motor genera el plan y marca cada día como reordenable; con Tramontana se priorizan clusters south/sheltered y se posponen los north-exposed; con viento sur, al revés. Esto se expone como 'plan flexible: mira el parte cada mañana'.

### Coche / sin coche
El factor con/sin coche reescribe el plan, no solo lo decora. CON COCHE: máxima libertad; el motor (a) inserta avisos de madrugar en lugares con parkingFillsEarly (llegar <9:30), (b) BLOQUEA en verano (1 jun-30 sep) los carAccess='restricted-summer' y sustituye por su transitAccess (lanzadera) o walk/boat — nunca propone ir en coche a Macarella/Macarelleta/Favaritx/Tortuga/Presili/Punta Nati en temporada, (c) prefiere coche de alquiler reservado (requiresBooking). SIN COCHE: (a) fuerza base en Maó (mayor red) o Ciutadella; (b) solo incluye lugares con transitAccess in {bus-direct, bus-shuttle-seasonal, bus+walk} usando busLine real; (c) las calas del SUR sin coche se cubren con LANZADERA (Macarella/Turqueta/Son Saura desde Ciutadella) o, como alternativa estrella 'calma', con LLAÜT/taxi-boat (boatAccess) — el motor ofrece la excursión en barco como sustituto del día de calas vírgenes; (d) excluye o marca 'requiere taxi/barco' los foot-only-largos y el norte agreste sin lanzadera (Cavalleria, Pregonda dependen de coche+caminata); (e) menos paradas por día y ritmo más pausado (cruzar costa-a-costa obliga a volver al centro y cambiar de bus). Calendario de transporte may-oct: el motor avisa 'verificar horarios del año' fuera de temporada.

### Ritmo
Ritmo 'calma' = pocas paradas, sin prisa, madrugar para tener la cala vacía. Paradas-ancla por día según ritmo (excluye traslados, comidas y atardecer, que se suman): TRANQUILO = 1 ancla grande/día (p.ej. una sola cala + atardecer) — el ritmo por defecto de la marca. MEDIO = 2 anclas (cala mañana + pueblo/cultura tarde + atardecer). INTENSO = 3 anclas máximo (2 calas + 1 cultura), nunca más (zigzag). Reglas de tiempo: usar durationHint para no sobrecargar (cala-baño 2-4h ya 'come' una mañana); reservar el atardecer para 1 sunset-spot del mismo ramal; insertar pausa de comida 14-16h (avisar siesta: comercios/restaurantes cierran ~14-17h); en días de cala sin servicios (noServices) añadir aviso de agua/sombra/comida. Día 'colchón' flexible cada 4-5 días para repetir favoritas o reordenar por viento. Para familias: priorizar idealFor='families' (calas someras con servicios: Galdana, Es Grau, Son Bou, Fornells) y EXCLUIR foot-only largo (Pregonda, Macarelleta) salvo en barco.

### Intereses -> tags
La encuesta produce tags de perfil + tags de experiencia que el motor cruza determinísticamente contra idealFor y experienceTags del dataset (no IA, tabla de mapeo). Mapeo: 'Calas de postal/turquesa' -> experienceTags:['turquoise-cove'] (Turqueta, Macarella, Mitjana, Galdana). 'Naturaleza salvaje/menos gente' -> ['wild-beach','natural-park','hiking-cami-cavalls'] (Pregonda, Cavalleria, s'Albufera, tramos Camí de Cavalls). 'Gastronomía/producto local' -> ['gastronomy-dop','lobster-stew','wine'] (queserías DOP Mahón, Sa Llagosta/Fornells caldereta, bodegas Binifadet/Torralbenc). 'Cultura e historia' -> ['old-town','talayotic','craft'] (Ciutadella, Maó, Naveta des Tudons, Torre d'en Galmés, Lithica, La Mola). 'Atardeceres' -> ['sunset-spot','lighthouse','viewpoint'] (Artrutx, Cavalleria, Pont d'en Gil, Cova d'en Xoroi, Monte Toro). 'Vida nocturna/copas' -> ['nightlife'] (Cova d'en Xoroi, beach clubs, Jazzbah). 'Con niños' -> idealFor:'families'. 'Sin coche' -> idealFor:'no-car' + filtro transitAccess. Pesos: el motor ordena candidatos por (match de tags) -> (certainty alta) -> (luxuryLevel quiet-luxury) -> (timeOfDay encaja en el hueco del día). El viento y la temporada son filtros duros (descartan), los intereses son ranking (ordenan).

### Esqueletos de plan
- 1 DÍA (escala/primera vez) — ZONA ÚNICA suroeste, sin cruzar la isla. Mañana: Ciutadella casco antiguo + Catedral + puerto (cluster ciutadella-ciudad). Mediodía: comida en el puerto/casco. Baño: 1 cala del sur cercana según viento (Turqueta si parking libre, o Cala Galdana). Atardecer: Faro de Artrutx o Pont d'en Gil (oeste). Aviso: con 1 día NO se cruza norte-sur; elige un bolsillo.
- 3 DÍAS (primera vez) — D1 SUR/OESTE: Ciutadella + Naveta des Tudons + Macarella/Macarelleta (lanzadera/a pie en verano) + atardecer Pont d'en Gil. D2 SUR-CENTRO: Cala Turqueta temprano + Binibeca (a pie 10-22h) + Cova d'en Xoroi (reservar) + atardecer Faro d'Artrutx. D3 NORTE: Cala Pregonda o Cavalleria (caminata) + Fornells (caldereta, Sa Llagosta) + Monte Toro + atardecer Faro de Cavalleria. Coche recomendado; regla del viento activa.
- 7 DÍAS (primera vez completa) — D1 OESTE: Ciutadella + 1ª cala según viento. D2 SUR: calas turquesa (Turqueta temprano, Macarella/Es Talaier; tarde Mitjana/Trebaluger). D3 NORTE: Cavalleria o Pregonda + Fornells (caldereta) + atardecer Cavalleria. D4 ESTE: Maó (puerto, Illa del Rei) + Binibeca + s'Albufera des Grau + Favaritx (lanzadera verano). D5 MAR: excursión barco/llaüt norte o kayak (cubre calas solo por agua). D6 INTERIOR/CULTURA: Monte Toro + Naveta/Torre d'en Galmés + Lithica + La Mola + quesería DOP. D7 LIBRE/colchón: repetir favoritas, compras, comida tranquila. Agrupar por costas, coche esencial (o versión sin coche: base Maó/Ciutadella, lanzaderas + barco D5, ritmo más lento).

## Encuesta (preguntas recomendadas)
- ¿Cuántos días tienes en Menorca? (1 / 3 / 5 / 7 / 10+)
- ¿En qué fechas? (mes — para temporada, viento y cierres de coche en verano)
- ¿Tendrás coche de alquiler o irás sin coche? (Con coche / Sin coche / No lo sé aún)
- ¿Dónde te alojas o prefieres? (Ciutadella / Maó / Centro-Es Mercadal / Cala Galdana o Son Bou / Aún no lo sé)
- ¿Qué ritmo buscas? (Tranquilo: pocas paradas / Medio / Quiero ver mucho)
- ¿Qué te mueve más? (elige hasta 3: Calas de postal · Naturaleza salvaje · Gastronomía y producto local · Cultura e historia · Atardeceres · Vida nocturna)
- ¿Viajas con niños? (Sí / No)
- ¿Te apetece una experiencia en barco / al atardecer? (Sí, encántame / Quizá / No)

## Lagunas y correcciones antes de cablear

A VERIFICAR ANTES DE PUBLICAR / CABLEAR EL MOTOR:

CORRECCIONES OBLIGATORIAS EN EL DATASET (5, certeza alta de que son errores):
1. Cala Mesquida: zona 'este' -> 'norte' (está ~4 km al norte de Maó, expuesta a tramontana; agrupar con cluster albufera-favaritx/norte, no con sureste). carAccess directo correcto.
2. "Son Bou Beach Club": nombre probablemente INVENTADO. Sustituir por un local real (Ses Grulles, Ses Garces o Es Corb Mari) o por categoría 'Chiringuitos de Son Bou'. No publicar el nombre sin verificar.
3. Faro de Favaritx DUPLICADO (dos entradas: 'Faro de Favaritx (Cap de Favaritx)' y 'Faro de Favaritx'). Fusionar en una. Resolver discrepancia de calendario de cierre al coche: una dice 1 jun-30 sep, otra 1 jun-mediados oct -> VERIFICAR calendario exacto del Consell para 2026.
4. Trepucó: municipio 'Es Castell' -> 'Maó' (o anotar 'límite Maó/Es Castell'). Zona este correcta.
5. Grafía 'Llucmacanes' -> 'Llucmaçanes' (con ç). Pedanía rural de Maó; sin servicios turísticos relevantes (correcto).

VERIFICACIONES ESTACIONALES (cambian cada año, revisar antes de cada temporada):
- Calendario EXACTO de cierre estival al coche del Consell (Macarella, Macarelleta, Favaritx, Cala Tortuga, Cala Presili, S'Escala-Es Portitxol, Savinar de Mongofra; Punta Nati 1 jul-31 ago). El consenso es 1 jun-30 sep pero el Consell lo ajusta.
- Horarios y frecuencias de BUS/LANZADERAS 2026 (TMSA, Torrent/Torres, lanzaderas de calas). Certeza media en frecuencias; las líneas (L32, L51-53, L71-72, L23, L31, L92, L62, L43) son fiables, las frecuencias no. Temporada típica may-oct.
- Apertura estacional de sitios concretos: chiringuitos de calas vírgenes, Finca Binillubet (visitas ~oct-jun), Eolo Sunset Bar (cierra martes), excursiones en barco/llaüt (temporada).

DATOS QUE NO ELEVAR A FIRMES (de la verificación editorial):
- Precio de avarcas (mantener 'orientativo', sin cifra cerrada).
- 'Binifadet, única con espumosos' (suavizar a 'prácticamente la única'; dato dinámico).
- Distancia '1,5 km al este' de Es Talaier desde Son Saura (no respaldada; el acceso coche-a-Son-Saura + caminata 15-20 min sí es correcto).

LAGUNAS ESTRUCTURALES (el dataset no las trae aún; hay que generarlas para el motor):
- COORDENADAS no verificadas una a una -> marcar 'coordsEstimated' si se usan para mapa/distancias; no calcular rutas finas con ellas sin revisar.
- Los CAMPOS DEL PLANNER (zone, cluster, carAccess, transitAccess, busLine, durationHint, timeOfDay, windSensitivity, idealFor, experienceTags, luxuryLevel) NO existen todavía en las 98 fichas: hay que poblarlos. Recomendación: derivar zone/carAccess/transitAccess de los datos ya verificados (que son fiables en acceso) y revisar a mano solo los 'media/baja' certainty.
- Muchas fichas tienen certainty 'media/baja' que la verificación permite SUBIR a 'alta' (Es Calò Blanc, Binisafúller, Cala Roja, Llucalari, Escorxada, Finca Binillubet, Sa Llagosta, Pont d'en Gil, Eolo, llaüt al atardecer, Castell de Sant Nicolau, Sant Climent): actualizar el campo certainty al poblar el planner.
- Es Grau: añadir tag/cluster 'puerta del Parc Natural s'Albufera' para que el motor NO lo mezcle con el norte agreste de Cavalleria aunque geográficamente sea norte/noreste.

## Lugares (98) por zona

### OESTE (10)

- **Ciutadella de Menorca** — nucleo · Ciutadella · _coche directo_ · [alta]
- **Naveta des Tudons** — yacimiento · Ciutadella · _a pie_ · [alta]
- **Faro de Punta Nati** — faro · Ciutadella · _a pie_ · [alta]
- **Casco antiguo de Ciutadella** — nucleo · Ciutadella · _a pie_ · [alta]
- **Castell de Sant Nicolau** — monumento · Ciutadella · _a pie_ · [media]
- **Lithica - Pedreres de s'Hostal** — experiencia · Ciutadella · _coche directo_ · [alta]
- **Restaurante Smoix (Bib Gourmand, Guía Michelin)** — gastronomia · Ciutadella · _a pie_ · [alta]
- **Mercat Municipal de Ciutadella (mercado de pescado y producto)** — gastronomia · Ciutadella · _a pie_ · [alta]
- **Pont d'en Gil (arco natural, puesta de sol)** — mirador · Ciutadella · _a pie_ · [media]
- **Eolo Sunset Bar (chiringuito de atardecer, Cala'n Forcat)** — experiencia · Ciutadella · _a pie_ · [media]

### SUR (37)

- **Cala Macarella** — cala · Ciutadella · _coche restringido verano_ · [alta]
- **Cala Macarelleta** — cala · Ciutadella · _a pie_ · [alta]
- **Cala en Turqueta (Cala Turqueta)** — cala · Ciutadella · _a pie_ · [alta]
- **Son Saura del Sur (platja de Bellavista y des Banyuls)** — playa · Ciutadella · _a pie_ · [alta]
- **Cala des Talaier (Es Talaier)** — cala · Ciutadella · _a pie_ · [media]
- **Cala en Bosch (Cala'n Bosch)** — playa · Ciutadella · _coche directo_ · [alta]
- **Son Xoriguer** — playa · Ciutadella · _coche directo_ · [alta]
- **Cala Blanca** — cala · Ciutadella · _coche directo_ · [alta]
- **Cala Santandria** — cala · Ciutadella · _coche directo_ · [alta]
- **Cala Galdana (Cala Santa Galdana)** — playa · Ferreries · _bus/lanzadera_ · [alta]
- **Cala Mitjana (y Cala Mitjaneta)** — cala · Ferreries · _a pie_ · [alta]
- **Cala Trebaluger** — cala · Ferreries · _a pie_ · [alta]
- **Cala Escorxada** — cala · Es Migjorn Gran · _a pie_ · [media]
- **Platja de Binigaus** — playa · Es Migjorn Gran · _a pie_ · [alta]
- **Platja de Sant Tomas** — playa · Es Migjorn Gran · _bus/lanzadera_ · [alta]
- **Playa de Son Bou** — playa · Alaior · _bus/lanzadera_ · [alta]
- **Cala de Llucalari (Cala Llucalari)** — cala · Alaior · _a pie_ · [media]
- **Cala en Porter** — cala · Alaior · _coche directo_ · [alta]
- **Cales Coves** — cala · Alaior · _a pie_ · [alta]
- **Es Canutells (Cala Canutells)** — cala · Mao · _coche directo_ · [media]
- **Cala Binidali (Binidali)** — cala · Mao · _coche directo_ · [media]
- **Binibeca (Binibequer Vell / Platja de Binibeca)** — playa · Sant Lluis · _coche directo_ · [media]
- **Cala de Biniancolla** — cala · Sant Lluis · _a pie_ · [media]
- **Binisafua (Binisafuller)** — cala · Sant Lluis · _coche directo_ · [baja]
- **Punta Prima (Platja de Punta Prima)** — playa · Sant Lluis · _coche directo_ · [media]
- **Es Calo Blanc** — cala · Sant Lluis · _coche directo_ · [baja]
- **Sant Lluis** — pueblo · Sant Lluis · _coche directo_ · [alta]
- **Es Migjorn Gran** — pueblo · Es Migjorn Gran · _a pie_ · [alta]
- **Binibeca Vell (Binibequer Vell)** — nucleo · Sant Lluis · _coche directo_ · [alta]
- **Torre d'en Galmes** — yacimiento · Alaior · _coche directo_ · [alta]
- **Necropolis de Calescoves** — yacimiento · Alaior · _a pie_ · [media]
- **Faro de Artrutx (Cap d'Artrutx)** — faro · Ciutadella · _bus/lanzadera_ · [alta]
- **Cova d'en Xoroi** — experiencia · Alaior · _a pie_ · [alta]
- **Torralbenc (agroturismo de lujo, restaurante y bodega)** — experiencia · Alaior · _coche directo_ · [alta]
- **Cova d'en Xoroi (atardecer y copas en acantilado)** — experiencia · Alaior · _bus/lanzadera_ · [alta]
- **Son Bou Beach Club (beach club a pie de playa)** — experiencia · Alaior · _bus/lanzadera_ · [media]
- **Alquiler de llaut tradicional / barco privado al atardecer (calas turquesa del sur)** — experiencia · Ciutadella · _a pie_ · [media]

### SURESTE (1)

- **Bodegas Binifadet (vino IGP Illa de Menorca, enoturismo)** — experiencia · Sant Lluis · _coche directo_ · [alta]

### SUROESTE (1)

- **Faro de Cap d'Artrutx (puesta de sol)** — faro · Ciutadella · _coche directo_ · [media]

### CENTRO (9)

- **Alaior** — pueblo · Alaior · _coche directo_ · [alta]
- **Es Mercadal** — pueblo · Es Mercadal · _coche directo_ · [alta]
- **Ferreries** — pueblo · Ferreries · _coche directo_ · [alta]
- **Talati de Dalt** — yacimiento · Mao · _a pie_ · [alta]
- **Torralba d'en Salort** — yacimiento · Alaior · _coche directo_ · [alta]
- **Monte Toro (El Toro)** — mirador · Es Mercadal · _a pie_ · [alta]
- **Quesería Subaida (Mahón-Menorca DOP)** — experiencia · Es Mercadal · _coche directo_ · [alta]
- **Hort de Sant Patrici (quesería, museo del queso, bodega y jardines)** — experiencia · Ferreries · _coche directo_ · [alta]
- **Finca Binillubet (taller de queso y cata rural)** — experiencia · Es Mercadal · _coche directo_ · [media]

### ESTE (13)

- **Cala Mesquida** — playa · Mao · _coche directo_ · [media]
- **Mao (Mahon)** — nucleo · Mao · _coche directo_ · [alta]
- **Es Castell** — pueblo · Es Castell · _barco_ · [alta]
- **Sant Climent** — nucleo · Mao · _coche directo_ · [media]
- **Llucmacanes (Llucmacanes)** — nucleo · Mao · _coche directo_ · [baja]
- **Trepuco** — yacimiento · Es Castell · _coche directo_ · [media]
- **Fortaleza de La Mola (Fortalesa Isabel II)** — monumento · Es Castell · _coche directo_ · [alta]
- **Illa del Rei (Isla del Rey)** — monumento · Mao · _barco_ · [alta]
- **Puerto de Mao (Port de Mao)** — nucleo · Mao · _a pie_ · [alta]
- **Destilería Gin Xoriguer (Botiga del Puerto)** — experiencia · Mao · _a pie_ · [alta]
- **Restaurante Sant Joan de Binissaida (hotel rural gastronómico)** — gastronomia · Es Castell · _coche directo_ · [alta]
- **Mercat des Claustre del Carme (Mahón)** — gastronomia · Mao · _a pie_ · [alta]
- **Mercat des Peix (mercado del pescado, Mahón)** — gastronomia · Mao · _a pie_ · [alta]

### NORTE (26)

- **Cala Pregonda** — cala · Es Mercadal · _a pie_ · [alta]
- **Playa de Binimel·la (Binimel·la)** — playa · Es Mercadal · _coche directo_ · [alta]
- **Playa de Cavalleria (Platja de Cavalleria)** — playa · Es Mercadal · _a pie_ · [alta]
- **Cala Roja (Cala Rotja)** — cala · Es Mercadal · _a pie_ · [media]
- **Cala Mica** — cala · Es Mercadal · _a pie_ · [media]
- **Platja d'en Ferragut** — playa · Es Mercadal · _a pie_ · [media]
- **Cap de Cavalleria (faro y mirador)** — faro · Es Mercadal · _coche directo_ · [alta]
- **Cala Tirant (Platja de Tirant)** — playa · Es Mercadal · _coche directo_ · [alta]
- **Cala del Pilar (Cala Pilar)** — cala · Ferreries · _coche restringido verano_ · [alta]
- **Cala Algaiarens (La Vall) - es Tancats y es Bot** — playa · Ciutadella · _bus/lanzadera_ · [alta]
- **Cala Morell** — cala · Ciutadella · _bus/lanzadera_ · [alta]
- **Cala Tortuga** — cala · Maó · _coche restringido verano_ · [alta]
- **Cala Presili (Es Presili)** — cala · Maó · _coche restringido verano_ · [alta]
- **Faro de Favaritx (Cap de Favaritx)** — faro · Maó · _coche restringido verano_ · [alta]
- **Playa de Es Grau** — playa · Maó · _a pie_ · [alta]
- **Sa Torreta (Cala des Tamarells / Cala en Cavaller)** — cala · Maó · _a pie_ · [media]
- **Fornells** — nucleo · Es Mercadal · _coche directo_ · [alta]
- **Es Grau** — nucleo · Mao · _coche directo_ · [alta]
- **Necropolis de Cala Morell** — yacimiento · Ciutadella · _a pie_ · [alta]
- **Faro de Favaritx** — faro · Mao · _coche restringido verano_ · [alta]
- **Faro de Cavalleria** — faro · Es Mercadal · _coche directo_ · [alta]
- **Torre de Fornells** — monumento · Es Mercadal · _a pie_ · [media]
- **Parc Natural de s'Albufera des Grau** — naturaleza · Mao · _a pie_ · [alta]
- **Cami de Cavalls (GR-223)** — experiencia · Toda la isla (8 municipios) · _a pie_ · [alta]
- **Restaurante Es Cranc (caldereta de langosta)** — gastronomia · Es Mercadal · _bus/lanzadera_ · [alta]
- **Restaurant Sa Llagosta (caldereta de langosta)** — gastronomia · Es Mercadal · _coche directo_ · [media]

### NOROESTE (1)

- **Faro de Punta Nati (puesta de sol agreste)** — faro · Ciutadella · _coche directo_ · [media]

