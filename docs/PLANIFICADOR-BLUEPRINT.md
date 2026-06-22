# Planificador de viajes — BLUEPRINT de construcción

> Spec definitiva (de una investigación multi-agente). Motor de reglas determinista sobre 204 lugares verificados. Web estática + island JS en cliente. Nada se publica sin revisión.

## Resumen

BLUEPRINT DEFINITIVO del planificador "Organiza tu viaje a Menorca con IA" de Calma Society sobre el cimiento existente (204 lugares, motor espina-de-pez, agenda de ~15 fiestas en src/content/eventos, Menorca Bus en site.ts). NO es IA generativa: MOTOR DE REGLAS DETERMINISTA sobre datos verificados. DECISION ARQUITECTONICA CLAVE: no se puede pre-renderizar un plan por cada combinacion de encuesta, asi que solucion HIBRIDA: el dataset (lugares, matriz de tiempos, tipos de dia, agenda) se compila en build a UN JSON estatico (planner-data.json); el motor es una funcion PURA TypeScript (src/lib/planner/engine.ts); la pagina planificador embebe UN island JS (~20-30 KB, client:idle) que ejecuta el motor EN EL NAVEGADOR. Cero backend, cero coste, Lighthouse intacto, plan compartible por querystring. PDF client-side (print CSS), email via MailerLite (KPI numero 1). Los 4 huecos: PLAN-B es un MODO del motor con indoorAlternative mas filtro por dia de semana; LLEGADA/SALIDA son 2 tipos de dia mas 8 pares aeropuerto-base; ACCESIBILIDAD es effortLevel A1 a D mas accessibleService; ALOJAMIENTO es el PASO 0 (zonas, no hoteles). VERIFICADO jun-2026: Museu de Menorca cerrado lunes, 4 euros, verano mar-sab 10-14 y 18-20 (alta); Linea 10 verano cada 30 min 05:45-00:25 solo aeropuerto-Mao (alta); 10 playas accesibles, Son Saura NO esta = baja; Macarella jun-sep solo bus Ciutadella 8:25-20:20 (alta); Favaritx coche prohibido jun-sep, bus 9:45-19:45 (alta); Lithica 9:30-14:30 mas tarde en temporada alta (media-alta); Hort de Sant Patrici 11:30 mas mar/mie/vie 18:00, reserva, 20 euros (media-alta); Subaida lun-sab 9-14, reserva, 1,5h (media-alta); Cova d'en Xoroi diurna jun-ago desde 11:30 (media-alta). Fuentes: museudemenorca.com, e-torres, apuntmenorca, menorca.info, lithica.es, santpatrici.com, subaida.com, covadenxoroi.com. El motor muestra horarios como confirma el dia de tu visita mas enlace oficial, nunca inmutable.

## Modelo de datos final

MODELO DEFINITIVO (Zod sobre src/content.config.ts real). NO romper el schema de lugares; AMPLIARLO con campos OPCIONALES (las 33 fichas siguen validando) mas tablas en src/data. A. CAMPOS NUEVOS en lugares (opcionales): zone (este, sur-este, sur-centro, sur-oeste, oeste, norte, centro, eje-me1); cluster (string); plannerType (cala, playa, pueblo, faro, yacimiento, mirador, atardecer, desayuno, comida, cena, actividad-acuatica, excursion, interior-cultural); durationMin (number); idealFor (primera-vez, parejas, familias, lujo-tranquilo, nautica, cultura, gastronomia, vida-nocturna, naturaleza, ninos-pequenos); carAccess (coche-directo, coche-mas-caminata, solo-bus-lanzadera, sin-coche-ok); busServed (bool). HUECO 3: effortLevel (A1, A2, B, C, D; A1=accesible-asistido hasta D=duro Cami de Cavalls); accessibleService (amphibiousChair, adaptedToilet, reservedParking, staff bool, seasonWindow def 1 mayo-31 octubre, certainty alta/media/baja) solo A1; effortNote (string). HUECO 1: isIndoor (bool); indoorAlternativeOf (clusters/zonas que cubre); weatherProof (cubierto, semicubierto, exterior). OPERATIVOS: openDays (lun a dom); seasonalHours (string); needsReservation (bool); carAccessClosedSummer (bool, Macarella/Favaritx); shuttleInfo (string); officialUrl (url); dataCertainty (alta/media/baja def media); lastVerified (string). Se conservan name, lang, translationKey, type, edition, description, coordinates lat/lng, area, images, practicalInfo (acceso/aparcamiento/servicios/mejorEpoca/horario), priceRange, website, tags, status, seo. B. 10 LUGARES NUEVOS interiores plan-B (ES y EN, plannerType interior-cultural, isIndoor true): museu-de-menorca (Mao, este, cubierto, sin lunes, 4 euros); xoriguer-destileria (Puerto Mao, este, reserva, tienda abre lunes); mercat-des-peix-claustre-carme (Mao, este, mar-sab 07-14); lithica-pedreres-shostal (Ciutadella, oeste, EXTERIOR = bueno para calor no para lluvia, 9:30-14:30 mas tarde temporada alta); museu-diocesa (Ciutadella, oeste, temporada alta); centre-artesanal-menorca (Es Mercadal, eje-me1, temporada alta); queseria-subaida (Es Mercadal/Addaya, centro, lun-sab 9-14, reserva); hort-de-sant-patrici (Ferreries, centro, 11:30 mas mar/mie/vie 18:00, reserva, 20 euros); cova-den-xoroi-diurna (Cala'n Porter, sur-centro, jun-ago desde 11:30, AMPLIA la ficha existente); spa-faustino-gran (Ciutadella, oeste) mas illa-spa (Mao, este). C. TABLA travelTime (src/data/travelTimes.ts) min en coche simetrica: 15 pares del cimiento mas 8 pares aeropuerto-base: Mao 12 (alta), Es Castell 15 (media-alta), Sant Lluis 14 (media), Alaior 20 (media), Es Mercadal 27 (media), Es Migjorn 28 (media), Fornells 32 (media), Ciutadella 45 (alta), Cala'n Porter 22 (media); peakSurcharge mas 12 min franja 18-20h verano en pares Me-1. D. TABLA dayTypes (src/data/dayTypes.ts) 13 mas 2: dia-llegada (presupuesto 8,5h menos buffer, clustersValidos solo base, secuencia check-in mas plan ligero mas comida/atardecer base); dia-salida (clustersValidos cercano aeropuerto/puerto, secuencia maleta mas cafe corto, PROHIBE calas-caminata/Cami de Cavalls/costa opuesta). E. PLAYAS A1 (effortLevel A1): Son Bou (sur-centro, primera), Cala Galdana (sur-centro, segunda), Sant Tomas (sur-centro), Punta Prima (sur-este), Cala en Porter (sur-centro), Es Grau (norte), Arenal d'en Castell (norte), Binibequer (sur-este), Santandria (oeste), Sa Platja Gran/Degollador (oeste); Son Saura NO A1 = baja, tratar B/C. F. ENCUESTA tipada (src/lib/planner/survey.ts): days, arrivalDate, departureDate, arrivalFlightTime opcional, departureFlightTime opcional, transport (coche-alquiler/coche-propio-ferry/sin-coche), ferryPort opcional, base opcional, pace (relajado/equilibrado/intenso), interests, kids (has mas ages), accessibility (ninguna/carrito/movilidad-reducida/mayores), boatSunset, budget (ajustado/medio/alto).

## Encuesta final

- BLOQUE 1 LO BASICO. P1 Cuantos dias (3-4/5-7/8 o mas), consume numero de dias-tipo y base unica vs split. P2 Fechas exactas (selector), CRUCE CON AGENDA de fiestas mas ventana servicios accesibles (1 may-31 oct) mas estacionalidad de interiores. P3 Como te mueves (Coche alquiler/Mi coche en ferry/Sin coche); si ferry sub-pregunta puerto (Mao/Ciutadella) que predetermina base este/oeste.
- BLOQUE 2 LLEGADA Y SALIDA (HUECO 2). P4 Hora aprox. de llegada mas P5 Hora aprox. de salida, selector OPCIONAL con microcopy esto afina tu primer y ultimo dia. Consume hora-util dia 1 (buffer mas 60-75 coche-alquiler, mas 30-45 transfer-taxi, mas 60-90 bus L10 solo si Mao) y hora-limite dia salida (vuelo menos 2h, menos 30min devolucion coche; Ciutadella menos 45min Me-1, aviso riesgo cruce isla).
- BLOQUE 3 DONDE DUERMES (HUECO 4). P6 Ya tienes alojamiento o quieres que te recomiende zona. (a) Ya tengo base, elige de lista de 6 (Ciutadella/Mao/Cala Galdana/Son Bou/Es Mercadal/Fornells). (b) Recomiendame, el motor ejecuta PASO 0 y propone 1-2 zonas con el porque. NUNCA hoteles concretos.
- BLOQUE 4 TU ESTILO. P7 Ritmo (Relajado/Equilibrado/Intenso) ajusta presupuesto 8,5h y numero de paradas. P8 Que te mueve (multi: Calas y playas/Gastronomia/Cultura e historia/Naturaleza y senderismo/Vida nocturna/Nautica/Lujo tranquilo) filtra plan y dias-tipo.
- BLOQUE 5 CONTIGO VIAJA. P9 Viajas con ninos (No, o Si con EDADES multi: 0-3 bebe-carrito, 4-8, 9-14, 15 o mas). Carrito activa R2 (excluir C/D); ninos pequenos priorizan calas someras (Son Bou, Galdana, Arenal), evitan excursiones duras y acortan presupuesto. P10 Necesidad de accesibilidad (Ninguna/Carrito/Movilidad reducida-silla/Personas mayores) activa R1 a R8 (HUECO 3).
- BLOQUE 6 EXTRAS. P11 Te interesan barco y atardeceres (Si/No), inserta atardecer mas cena en zona y si sin-coche CTA Menorca Bus barco/excursion. P12 Presupuesto general (Ajustado/Medio/Alto): Alto prioriza experiencias elevadas (alta cocina, spa, agroturismo, transfer privado); Ajustado evita extras de pago, prioriza calas gratis, avisa bus vs coche y self-catering en Son Bou.
- DISENO: 12 preguntas en 6 bloques cortos (progressive disclosure). P4/P5 opcionales. form nativo sin libreria; estado en URL (querystring) para plan COMPARTIBLE sin backend. El boton final dispara el motor en cliente.

## Algoritmo del motor

ALGORITMO (funcion pura src/lib/planner/engine.ts; input Survey mas dataset; output Plan trazable; semilla = hash de la encuesta para que el mismo input de el mismo plan compartible). PASO 0 BASE (HUECO 4): si sin-coche candidatos SOLO Mao/Ciutadella (vida-nocturna/oeste a Ciutadella; cultura/gastronomia/este a Mao; aviso calas top requieren bus mas taxi o EXCURSION, CTA Menorca Bus). Si ferryPort base del lado del puerto. Con coche y recomiendame mapea interests/perfil/dias a 6 zonas (primera-vez a Ciutadella o Galdana; familias-playa a Galdana/Son Bou; parejas/lujo a Ciutadella/Mao-puerto/Fornells; explorar-todo a Es Mercadal; nautica/Tramontana a Fornells). SPLIT solo si dias 8 o mas, o (oeste Y este intensos y dias 6 o mas); con 3-4 dias NUNCA; compensa solo si ahorra 1h o mas de coche/dia varios dias. Emite base mas porque. PASO 1 TIPOS DE DIA SIN REPETIR ZONA: dia 1 = dia-llegada, ultimo = dia-salida; clusters prioritarios = interseccion de interests y alcanzables desde base dentro del presupuesto, ordenados por afinidad/cercania/imperdibles; 1 cluster por dia pleno sin repetir zona consecutiva; cruce a costa opuesta max 1 vez = dia de traslado (resta presupuesto); reparte dias-tipo por perfil; inserta dia A1 si accesibilidad distinta de ninguna. PASO 2 CRUCE AGENDA (src/content/eventos): por fecha busca eventos published que solapen; fiesta en zona del dia (Sant Joan 23-24 jun, Gracia, Sant Jaume) INSERTA bloque mas AVISO reserva y mucha gente; fiesta en zona opuesta NO rompe espina de pez, ofrece moverla o solo informar; en plan-B lluvia PRIORIZA evento cubierto de la agenda (concierto Claustre del Carme) antes que interior generico. PASO 3 SECUENCIACION INTRADIA (comidas mas no-saturar): DESAYUNO (base), MANANA (cala/actividad del cluster), COMIDA (cerca de la cala), TARDE (2a parada mismo cluster o descanso), ATARDECER (mirador zona), CENA (misma zona); NO-SATURAR 8,5h = suma de durationMin mas coche travelTime mas comida 90min mas aparcar 20min mas colchon; pace relajado 7h y menos 1 parada, intenso 9,5h y mas 1; si supera elimina la parada de menor afinidad y lo dice; max paradas relajado 2, equilibrado 3, intenso 4. PASO 4 VIENTO (FLEXIBLE, el motor NO conoce el viento real): AVISO mas alternativa, no reordenacion forzada (Si hay Tramontana tu dia de norte sera incomodo, alternativa lista en el sur); cada dia de playa lleva plan-viento (cluster de respaldo en costa opuesta resguardada). PASO 5 ACCESIBILIDAD (HUECO 3, FILTRO sobre pasos 1-3): R1 movilidad-reducida solo A1/A2, bano solo A1 (Son Bou/Galdana), excluye B/C/D (aviso si fuerza, no bloqueo); R2 carrito A1 mas A2 mas B con aviso, excluye C/D; R3 mayores A1 mas A2 mas B y baja presupuesto 1-1,5h; R4 elige A1 del cluster del dia (no cruza isla); R6 fechas fuera 1 may-31 oct, A1 con acceso fisico si pero personal NO garantizado, confirma con ayuntamiento; R7 sin-coche mas movilidad CTA Menorca Bus transfer adaptado a A1 con parking reservado; R8 plan-B lluvia accesible interiores A1/A2 llanos (Catedral Ciutadella, paseo puerto Mao/Fornells), nunca C/D. PASO 6 PLAN-B MAL TIEMPO (HUECO 1, un MODO por dia embebido en toggle sin romper el cluster): 6a LLUVIA sustituye cala mas atardecer por 2-3 bloques de interior DENTRO de la zona (o eje Me-1 de paso): museo/queseria/destileria/spa mas COMIDA LARGA ancla 12-15h mas cena interior, max 2-3; 6b CALOR EXTREMO mayor de 34-35 grados NO cancela playa, REORDENA: cala/exterior temprano (antes de 12h) y tras 18h, central 12-17h interior climatizado o siesta, yacimientos (Naveta, Torre d'en Galmes) SIEMPRE temprano; 6c FILTRO POR DIA DE SEMANA critico: LUNES excluye Museu de Menorca/Subaida/Hort de Sant Patrici (cerrados), ofrece lo que SI abre (Catedral, Xoriguer tienda, mercados, Cova d'en Xoroi diurna, spa, comida), needsReservation muestra aviso requiere reserva y NO encadena dos reservas el mismo dia; 6d SIN-COCHE mas lluvia interiores en bus (museos ciudad, Xoriguer, mercados) mas CTA Menorca Bus excursion a queseria/Lithica, mal dia a venta. PASO 7 DIA LLEGADA (HUECO 2): hora-util = llegada mas buffer (coche-alquiler mas 60-75; transfer/taxi mas 30-45; bus L10 mas 60-90 solo si base Mao); manana antes de 13h instalarse mas plan ligero cluster-base; mediodia 13-17h check-in mas comida mas atardecer zona base; tarde/noche tras 18h solo logistica mas cena cercana, CERO playa; dia 1 SIEMPRE cluster base; sugiere agua/desayuno (super Mao/Ciutadella/Alaior); sin-coche/transfer CTA Menorca Bus aeropuerto-base. PASO 8 DIA SALIDA (HUECO 2): hora-limite = vuelo menos 2h, menos 30min (devolucion coche), menos travelTime base a aeropuerto, menos colchon-punta 12; plan solo cluster cercano al aeropuerto o maleta mas cafe corto; PROHIBE calas-caminata/Cami de Cavalls/costa opuesta; base Ciutadella mas vuelo manana AVISO riesgo cruce isla 45min Me-1, sal con holgura o valora ultima noche cerca de Mao; avisar repostar antes de devolver coche; ferry presentarse 45-60min antes. PASO 9 ENSAMBLAJE: cada decision deja un reason que alimenta el porque visible; salida Plan con base, baseReason, days (DayCard), globalNotices, menorcaBusHooks.

## Producto (plan que se entrega)

PRODUCTO DE SALIDA (estatico-friendly, render en cliente desde el Plan; estilo de marca: paleta Calma calida, Fraunces titulares, Inter texto). 1 CABECERA: Tu Menorca en N dias mas resumen (base, perfil, fechas); BLOQUE Por que esta base (PASO 0) con criterio de marca; avisos globales (reserva coche con antelacion en verano, ventana servicios accesibles, riesgo cruce isla salida, coincidencia con fiesta). 2 TARJETA POR DIA (DayCard) articulo editorial: etiqueta de dia-tipo (Dia de calas del sur, Dia de llegada, Dia de salida) mas zona/cluster; LINEA DE TIEMPO intradia (desayuno a cena) con hora orientativa, lugar enlazado a la pagina lugar/slug, durationMin y mini-icono; EL PORQUE en acordeon details (los reason del motor, criterio visible = E-E-A-T mas GEO); AVISOS en chips (Reserva, Ve temprano, Lleva agua y sombra, Parking limitado/lanzadera con shuttleInfo, Confirma horario con officialUrl, Requiere buena forma para effort C/D); TOGGLE Si llueve o hace mucho calor (PASO 6, interiores de la zona filtrados por dia de semana); TOGGLE Si hay viento (Tramontana); CHIP accesibilidad effortLevel mas nota; CTA contextual Menorca Bus. 3 MAPA POR DIA (estatico, sin JS pesado): NO Google Maps embebido (JS/cookies/Lighthouse). Opcion A mapa SVG estatico de Menorca (asset propio: costa mas ejes Me-1/Me-7) con puntos del dia por coordinates (proyeccion lat/lng a x/y en build); Opcion B boton Abrir en Maps con URL de direcciones (enlace externo); mini-mapa por tarjeta mas resumen del viaje. 4 ENTREGA en 3 canales: EN PAGINA render instantaneo en la pagina planificador (island client:idle), estado en querystring para URL COMPARTIBLE y guardable; EMAIL (KPI numero 1) CTA Recibe tu plan por email y unete a la Sociedad con MailerLite (ya en site.ts), envia el enlace al plan (querystring) y capta suscriptor, el plan se reconstruye desde la URL, no se genera en servidor; PDF boton Descargar PDF = print CSS (media print) mas window.print, maqueta dossier (portada con marca, una pagina por dia, mapa SVG, avisos), cero libreria de PDF y cero servidor, premium la Sociedad con PDF enriquecido. 5 ESTADOS Y A11Y: funciona sin JS hasta el submit (form nativo), el motor exige JS pero degrada con mensaje; semantico (article/section/time), navegable por teclado, foco visible, acordeones details/summary nativos (0 JS), alt en mapa e iconos, contraste AA con tokens.

## Monetización

MONETIZACION INTEGRADA (sin romper el lujo tranquilo: el dinero como SOLUCION util, no banner). 1 MENORCA BUS (negocio propio, site.ts partners.menorcaBus), el motor lo enchufa en 4 momentos: a) DIA LLEGADA/SALIDA mas sin-coche o transfer, CTA Transfer aeropuerto a tu base (resuelve el hueco de la Linea 10 que solo sirve a Mao, oro para Ciutadella/Fornells/sur); b) SIN-COCHE mas cala-no-conectada (Macarella, Mitjana, Cavalleria), CTA Excursion o transfer a esta cala (solucion premium, no fallo); c) SIN-COCHE mas LLUVIA, CTA excursion a queseria/Lithica (dificiles sin coche), mal dia a venta; d) ACCESIBILIDAD mas sin-coche, CTA transfer adaptado puerta-a-puerta a A1 con parking reservado (Son Bou, Galdana). Implementacion reutiliza MenorcaBusCTA.astro; el motor emite menorcaBusHooks (tipo, contexto, dia); medible con Umami (data-umami-event ya en uso). 2 AFILIACION (transparente, etiquetada, principio 8): coche de alquiler, el motor SIEMPRE avisa reserva con antelacion en verano con enlace afiliado a comparador (alto intent); restaurantes/experiencias con reserva (alta cocina, caldereta Fornells, queserias, Cova d'en Xoroi, spa) con afiliado/booking; alojamiento, el motor recomienda ZONA (no hotel) con enlace afiliado a buscador filtrado por esa zona (respeta no listamos hoteles pero monetiza la intencion); ferry con afiliado Balearia/Trasmed; todo afiliado pasa por OutboundLink.astro (ya existe) con rel y tracking. 3 CAPTACION DE EMAIL (KPI numero 1, principio 3.1): el planificador es el MEJOR iman de leads (el usuario invierte 2 min, alta motivacion para recibirlo por email); form MailerLite en el resultado Guarda tu plan y unete a la Sociedad; popup por scroll (35%) refuerza; segmentar con etiqueta MailerLite por perfil/intereses para newsletters personalizadas. 4 PREMIUM la Sociedad: Gratis = plan en pagina mas PDF basico; Premium (tras suscribirse o pago suave) = PDF-dossier enriquecido (mapa detallado, reservas pre-rellenadas, lista de la compra, contactos), variantes con/sin ninos, plan concierge donde Menorca Bus mas partners cierran reservas (encaja con membresia futura Fase 8). 5 REGLA DE ORO: max 1 CTA Menorca Bus mas 1 afiliado relevante por pantalla/dia; nunca display intrusivo (anti-patron 12); el plan es el producto, el dinero el servicio que lo completa.

## Fases de construcción

1. FASE P0 DATOS Y SCHEMA: ampliar src/content.config.ts anadiendo a lugares los campos opcionales del modelo (zone, cluster, plannerType, durationMin, idealFor, carAccess, busServed, effortLevel, accessibleService, isIndoor, indoorAlternativeOf, weatherProof, openDays, seasonalHours, needsReservation, carAccessClosedSummer, shuttleInfo, officialUrl, dataCertainty, lastVerified), todos opcionales para que las 33 fichas existentes sigan validando; crear src/data/travelTimes.ts y dayTypes.ts (13 mas 2). Commit feat(planner): amplia schema de lugares y tablas de tiempos/tipos-de-dia.
2. FASE P1 ENRIQUECER LUGARES mas 10 INTERIORES: backfill de campos planner en los 204 lugares (empezar por los ya en repo) con reglas por defecto del hueco 3 (urbano a A2, A1 de la lista, a pie/Cami a C/D, en duda el MAS exigente) via script semi-automatico que propone en draft para revision (flujo 6 bis); crear las 10 fichas de interior (ES y EN) con horarios VERIFICADOS mas dataCertainty/officialUrl/lastVerified; marcar las 10 playas A1 con accessibleService. Commit content(planner): atributos de zona/esfuerzo/accesibilidad mas 10 interiores plan-B.
3. FASE P2 MOTOR PURO (sin UI): src/lib/planner con types.ts, survey.ts, engine.ts y rules; PASOS 0-9 como funciones puras mas tests Vitest (5 dias coche Ciutadella; 4 dias sin-coche Mao; familia carrito; movilidad reducida; llegada noche; salida Ciutadella vuelo manana; semana con Sant Joan; dia de lluvia LUNES); script de build de planner-data.json (es/en) desde content mas tablas. Commit feat(planner): motor de reglas determinista mas dataset compilado mas tests.
4. FASE P3 UI ENCUESTA mas RESULTADO: paginas planificador y en/trip-planner con form nativo de 12 preguntas en 6 bloques, estado en querystring; island JS (client:idle) que ejecuta el motor y renderiza DayCards con details/summary; componentes PlannerForm, DayCard, IntradayTimeline, NoticeChip, PlanBToggle, reutilizar MenorcaBusCTA y OutboundLink. Commit feat(planner): encuesta y render de itinerario en cliente.
5. FASE P4 MAPA mas PDF mas EMAIL: mapa SVG estatico de Menorca mas proyeccion de coordinates, mini-mapa por dia mas resumen; print CSS (media print) para PDF dossier; integrar MailerLite (captura plan via URL); enlaces afiliados marcados. Commit feat(planner): mapa estatico, exportacion PDF y captacion de email.
6. FASE P5 CRUCE AGENDA mas PULIDO mas SEO/GEO: conectar PASO 2 con src/content/eventos; microcopy de marca en todos los porque y avisos; JSON-LD (TouristTrip/ItemList), meta y OG del planificador; auditoria Lighthouse mas a11y. Commit feat(planner): cruce con agenda de fiestas, GEO y pulido editorial.
7. FASE P6 APROBACION mas ANALITICA mas DOCS: status draft en lugares nuevos hasta visto bueno (eventos ya tienen status); eventos Umami en CTAs/PDF/email; documentar el motor y las fuentes/certezas en docs. Commit docs(planner): documenta motor, fuentes y certezas; analitica de conversion.
8. ARRANQUE INMEDIATO: P0 a P1 (lugares ya en repo mas 10 interiores) a P2 motor con tests. Con eso el nucleo funciona aunque la UI sea minima.

## Riesgos y mitigación

R1 ESTATICO vs COMBINATORIA (el grande): no se puede pre-generar un plan por combinacion. MITIGACION arquitectura hibrida (dataset JSON estatico mas motor puro ejecutado EN CLIENTE), cero backend, cero coste, plan compartible por querystring, el motor es codigo no datos pre-renderizados. R2 JS DE CLIENTE vs CLAUDE.md (JS solo si aporta valor real): el motor exige JS pero es valor real y justificado (sin JS no hay planificador sin servidor); UN island ligero 20-30 KB client:idle, acordeones details nativos (0 JS), form nativo; Lighthouse del resto del sitio intacto, la pagina planificador absorbe el unico JS y aun asi pequeno. R3 RENDIMIENTO/TAMANO DEL DATASET: 204 lugares mas traducciones podrian inflar el JSON; MITIGACION dos JSON (es/en) y servir solo el del idioma, incluir solo campos que el motor usa (NO descripciones largas: se cargan al enlazar a la pagina lugar/slug), minificar, gzip/brotli, objetivo menor de 150 KB. R4 MAPA SIN JS PESADO: Google Maps embebido rompe privacidad/Lighthouse/cookies; MITIGACION mapa SVG estatico propio mas enlace externo abrir en Maps, coste dibujar o conseguir un SVG de la costa de Menorca (asset unico, una vez). R5 DATOS ESTACIONALES Y CAMBIANTES (horarios museos, buses, lanzaderas, ventana accesible, fiestas) = riesgo de CREDIBILIDAD (principios 2 y 8); MITIGACION cada dato lleva dataCertainty mas lastVerified mas officialUrl; la UI NUNCA afirma un horario como inmutable, muestra Confirma el dia de tu visita mas enlace oficial; los datos de temporada (Macarella bus, Favaritx, Lithica tarde, museos verano) se centralizan en src/data para revisar cada temporada en UN sitio; la agenda usa fechas reales ya cargadas; NO inventar precios exactos, dar rangos. R6 COHERENCIA DEL PLAN (que no genere itinerarios absurdos): MITIGACION tests Vitest por escenario (P2) mas invariantes asertados (nunca cruzar costas opuestas 2 veces, nunca cala C/D con carrito, nunca museo lunes en plan-B, dia salida sin Cami de Cavalls, presupuesto de horas nunca excedido); si una regla no puede cumplirse el motor degrada con aviso explicito, no falla en silencio. R7 i18n DEL PLAN (no romper i18n): el plan mezcla datos (lugares es/en) y UI; MITIGACION dataset por idioma, strings de UI del motor en src/i18n/ui.ts (reasons y avisos traducidos POR CLAVE, no concatenando texto libre), paginas planificador y en/trip-planner enlazadas por hreflang. R8 MANTENIMIENTO DE LOS 204 BACKFILLS (trabajo manual): MITIGACION reglas de asignacion por defecto (hueco 3) en script semi-automatico que propone valores en draft para revision humana (6 bis), priorizar los lugares que el motor mas usa. R9 PRIVACIDAD/RGPD del email del plan: MITIGACION usar el MailerLite ya declarado en privacidad, NO guardar el plan en servidor (vive en la URL), consentimiento explicito, coherente con SocietyCaptureForm y popup ya implementados.

## Huecos cerrados (lógica)

### Plan-B de mal tiempo / lluvia / calor extremo (planes de interior y cultura) y su lógica de sustitución en el motor

GUÍA/REGLAS PARA EL MOTOR (faceta lógica + lugares de interior). El plan-B no es un "día aparte": es un MODO que el motor activa sobre el cluster del día que ya tocaba, para no romper la regla de oro (espina de pez: 1 día = 1 cluster, no cruzar costas opuestas).

== CUÁNDO SE ACTIVA EL MODO PLAN-B ==
Tres disparadores, independientes:
1) LLUVIA / TORMENTA (todo el día o franja): la cala/playa y el atardecer al aire libre se vuelven inviables.
2) CALOR EXTREMO (ola de calor, ~>34-35 °C, fuentes: menorcaaldia, AEMET): NO se cancela la playa; se REORDENA el día. Regla horaria: cala/baño y exterior TEMPRANO (antes de ~12:00) y a partir de ~18:00; el bloque central 12:00-17:00 se rellena con INTERIOR climatizado (museo, quesería, destilería, comida larga, spa) o siesta en la base. Yacimientos talayóticos SIEMPRE temprano (poca o nula sombra) o a última hora. Confirmado por guías y nota de calor (menorcaaldia 2025; noticiasdelvino 2026).
3) VIENTO FUERTE (encaja con regla del viento ya existente): si Tramontana muy fuerte arruina también el sur, o si hay aviso, se puede degradar a plan-B parcial.

== PRINCIPIO DE SUSTITUCIÓN SIN ROMPER EL CLUSTER ==
Regla maestra: el plan-B se sirve DENTRO de la zona/cluster del día (o, como mucho, en el eje central Me-1 Maó<->Ciutadella, que es de paso y está a <=45 min de casi todo). NO mandar al viajero de un extremo a otro por un museo. Por eso clasifico cada interior por zona y por proximidad al eje:
- BASE/ZONA ESTE (Maó y alrededores): Museu de Menorca, Mercat des Peix / Claustre del Carme, Destilería Xoriguer (puerto de Maó), Illa Spa (centro Maó). -> sustituye un día de calas del SUR-ESTE (Cala'n Porter, Binibèquer) o del puerto.
- BASE/ZONA OESTE (Ciutadella): Catedral de Santa Maria, Museu Diocesà (solo temporada alta), Can Saura/Museu Municipal, Lithica-Pedreres de s'Hostal (cantera-jardín, parcialmente cubierta pero ojo: es exterior, mejor para calor que para lluvia fuerte), Spa Faustino Gran (palacio s.XVI). -> sustituye calas del OESTE/SUR-OESTE.
- CENTRO / EJE Me-1 (de paso para todos): Centre Artesanal de Menorca (Es Mercadal), queserías DOP con visita (Subaida en Es Mercadal/Addaya, Hort de Sant Patrici en Ferreries), Naveta des Tudons (talayótico de paso Ciutadella-centro, hacer temprano por calor). Estos sirven a CUALQUIER base porque están en el camino.
- SUR (Cala'n Porter): Cova d'en Xoroi en visita DIURNA (mirador-café en cueva, 11:30 hasta anochecer; cubierto en parte, vistas aunque haya nubes) -> plan-B "de zona" para quien tenía calas del sur.

== REGLAS DE COMIDAS EN MODO PLAN-B ==
La lógica de comidas ya existente se mantiene pero se "alarga": en lluvia/calor, la COMIDA de mediodía pasa a ser el ancla del bloque central (restaurante con criterio, caldereta, queso DOP), ocupando 12:00-15:00. Encaja sin tocar el presupuesto de 8,5 h porque sustituye tiempo de cala. En lluvia, el atardecer+cena al aire libre se reconvierte en cena de interior en la misma zona.

== REGLAS DE RITMO / NO SATURAR EN PLAN-B ==
- Museos pequeños = 45-90 min reales; queserías y destilerías con visita guiada = ~1-1,5 h + reserva previa OBLIGATORIA (Subaida, Hort de Sant Patrici, visita completa Xoriguer). El motor debe avisar "requiere reserva" y NO encadenar dos visitas con reserva el mismo día sin holgura.
- Un día de lluvia "típico" = 2-3 bloques de interior máximo (p.ej. museo + comida larga + destilería/spa), NO una lista de 6 museos. Calidad sobre cantidad.

== CIERRES Y HORARIOS CRÍTICOS (el motor debe filtrar por día de la semana) ==
- LUNES es el gran agujero cultural: Museu de Menorca CERRADO lunes; muchas queserías cierran domingo/lunes (Subaida lun-sáb; Hort de Sant Patrici mar-sáb). El motor NO debe proponer un plan-B de museos un lunes lluvioso sin avisar; alternativas que sí abren lunes: Catedral, Xoriguer (tienda), mercados, Cova d'en Xoroi diurna, spa, comida.
- Museu Diocesà y Centre Artesanal: solo/ principalmente temporada alta. Marcar estacionalidad.
- Mercat des Peix: mar-sáb 07:00-14:00 (no funciona como plan-B de tarde ni domingo/lunes).

== INTEGRACIÓN CON LO QUE YA EXISTE ==
- AGENDA: en un día de lluvia, el motor debe PRIORIZAR proponer un evento/fiesta cubierto de la agenda existente si cae ese día (concierto en el Claustre del Carme, etc.) antes que un genérico.
- MENORCA BUS (sin-coche): el plan-B es ORO para monetizar al viajero sin coche, porque los interiores top están en Maó/Ciutadella/eje Me-1 (servidos por línea regular y por transfers). Cuando el motor detecta sin-coche + lluvia, debe enrutar a interiores accesibles en bus/transfer (museos de ciudad, Xoriguer, mercados) y ofrecer la excursión/transfer de Menorca Bus a quesería o Lithica (que en coche propio serían difíciles sin vehículo). Esto convierte un mal día en venta.

== CERTEZA ==
Horarios/precios concretos: certeza MEDIA (verificados en webs oficiales y portales jun. 2026, pero estacionales y cambiantes -> el motor debe mostrar "confirma horario el día de tu visita" y enlazar a la web oficial, no fijar el dato como inmutable). Lógica de zonas/sustitución y reglas de calor/lunes: certeza ALTA (coherente con la espina de pez y confirmada por múltiples fuentes).

### LLEGADA/SALIDA Y LOGISTICA (aeropuerto MAH, transfers/Menorca Bus/taxi/coche/ferry, logica del dia de llegada y del dia de salida)

FACETA LOGISTICA PURA. Esto NO genera lugares nuevos: produce REGLAS que el motor aplica al DIA 1 (llegada) y al ULTIMO DIA (salida), y que ajustan transfers segun base y modo (coche / sin-coche). Datos verificados; lo dudoso marcado.

== A. DATO MAESTRO: EL AEROPUERTO ==
- Aeropuerto de Menorca = MAH, situado a 4,5 km de Mao (Ctra. de Sant Climent s/n). Es un aeropuerto COMPACTO y de un solo nivel util (facturacion-embarque muy cerca). Pega a la Me-1 (eje espina de pez). Certeza ALTA.
- Implicacion clave para el motor: el aeropuerto esta en el LADO ESTE de la isla. Por la regla de oro espina-de-pez, las bases del este (Mao, Es Castell, Sant Lluis) estan a "mano"; las del oeste (Ciutadella) implican cruzar la isla entera por Me-1.

== B. TIEMPOS REALES AEROPUERTO <-> BASES (en coche, Me-1, sin trafico denso). AÑADIR a la matriz de 15 tiempos ==
- MAH -> Mao centro/puerto: 10-15 min (4,5 km). Certeza ALTA.
- MAH -> Es Castell: ~15 min (~7 km). Certeza MEDIA-ALTA.
- MAH -> Sant Lluis: ~12-15 min. Certeza MEDIA.
- MAH -> Alaior: ~20 min (centro de la isla). Certeza MEDIA.
- MAH -> Es Mercadal / Es Migjorn: ~25-30 min. Certeza MEDIA.
- MAH -> Fornells (norte): ~30-35 min (hay que subir al norte por Me-7). Certeza MEDIA.
- MAH -> Ciutadella: 42-50 min (44-47 km por Me-1); REGLA = contar 45 min. Certeza ALTA.
- MAH -> Cala en Porter / sur-centro: ~20-25 min. Certeza MEDIA.
REGLA: en hora punta de verano la SALIDA del aeropuerto (18:00-20:00) y la Me-1 pueden ir densas; sumar +10-15 min de colchon en esa franja. Certeza MEDIA (patron conocido, no horario oficial).

== C. MODOS DE LLEGADA AL AEROPUERTO (que ofrecer segun encuesta) ==
1) COCHE DE ALQUILER (recomendado por defecto si la persona marco "con coche"): se recoge en el propio aeropuerto. REGLA DURA: reservar con MUCHA antelacion para julio/agosto (la flota se agota y los precios se disparan en temporada alta). Mostrar siempre este aviso a quien viaja en verano. Certeza ALTA.
2) TRANSFER PRIVADO puerta-a-puerta (el conductor espera con cartel y lleva al alojamiento). Es la opcion premium/sin-coche -> ENGANCHE NATURAL CON MENORCA BUS (menorcabus.com) para monetizar el trafico sin-coche: ofrecer transfer aeropuerto->base y excursiones. Certeza ALTA (modelo de servicio estandar).
3) TAXI: parada oficial regulada en el aeropuerto. Orientativo ~20 EUR a Mao; hasta ~110-120 EUR a zonas lejanas (oeste/norte). Tarifas orientativas, NO fijar precio exacto -> certeza MEDIA.
4) BUS PUBLICO Linea 10 (Aeropuerto <-> Estacion de autobuses de Mao). CONSTRAINT CRITICO para el motor: la linea 10 SOLO une aeropuerto con la estacion de Mao; para cualquier otro destino hay que TRANSBORDAR en Mao a otra linea (TMSA/e-torres/AutosFornells). Frecuencia verano (1 jun-30 sep): cada 30 min gran parte del dia, ~05:55 a 00:15; en invierno hasta ~22:15. REGLA: el bus solo es comodo si la base es Mao; para Ciutadella/Fornells/sur, sin coche es mejor transfer/taxi (oportunidad Menorca Bus). Certeza ALTA en el constraint; horarios certeza MEDIA-ALTA (confirmar cada temporada en aena.es / e-torres / mou-t).

== D. LLEGADA EN FERRY CON COCHE (alternativa al avion; relevante para "vengo con mi coche") ==
- Puertos de entrada: MAO (este) y CIUTADELLA (oeste). El motor debe preguntar/derivar la base segun el puerto: si entras por Mao, base este; si por Ciutadella, base oeste (coherente con espina-de-pez).
- Desde BARCELONA: fast ferry a Ciutadella desde ~3 h 30 min; convencional (Mao o Ciutadella) ~7-9 h (suele ser nocturno). Certeza MEDIA-ALTA.
- Desde VALENCIA: ~1 salida semanal, ~16 h 30 min total (incluye escala tecnica en Ibiza). Llegada normalmente a Mao. Certeza MEDIA.
- Desde MALLORCA (Alcudia -> Ciutadella): la ruta mas corta, ~1 h a 2 h 30 min segun barco. Ideal para combinar islas o traer coche barato. Certeza MEDIA-ALTA.
- REGLA: con ferry, la "hora de llegada" del dia 1 la marca el desembarque (no un vuelo); contar 30-45 min extra para desembarcar coche y salir del puerto en temporada alta. Operadores: Balearia y Trasmed/Trasmediterranea. Confirmar horarios por temporada. Certeza MEDIA.

== E. LOGICA DEL DIA DE LLEGADA (DIA 1) -- REGLAS DEL MOTOR ==
Objetivo: NO saturar; encajar con la regla de 8,5 h utiles ya descontando el viaje. El dia 1 es SIEMPRE un dia "ligero y cercano a la base", nunca un cluster lejano.
1) Calcular "hora util de inicio" = hora de aterrizaje/desembarque + buffer logistico:
   - Con coche de alquiler: +60-75 min (desembarco avion + recoger maletas + papeleo coche + salir). 
   - Con transfer/taxi: +30-45 min (maletas + trayecto a base).
   - Sin coche con bus linea 10 + transbordo: +60-90 min y SOLO si base = Mao.
2) Asignar plan segun la hora util resultante:
   - Llega por la MAÑANA (util antes de ~13:00): dia 1 = instalarse + 1 plan ligero en el CLUSTER DE LA BASE (paseo por el casco, una cala de acceso facil cercana, comida tranquila). No meter excursion larga ni cala de caminata.
   - Llega a MEDIODIA/PRIMERA TARDE (util 13:00-17:00): dia 1 = check-in + comida cerca + atardecer+cena en la zona de la base (encaja con la logica de comidas ya existente).
   - Llega por la TARDE/NOCHE (util despues de ~18:00): dia 1 = solo logistica + cena cercana a la base; cero turismo. El motor NO debe proponer playa.
3) Coherencia espina-de-pez: el plan del dia 1 vive en el cluster de la base, NO al otro extremo. Si la base es Ciutadella y se llega tarde, el dia 1 NO incluye nada del este aunque el aeropuerto este alli.
4) Compra basica: sugerir (si hay tiempo y util) parar a por agua/desayuno para la base; supermercados estan sobre todo en Mao/Ciutadella/Alaior.

== F. LOGICA DEL DIA DE SALIDA (ULTIMO DIA) -- REGLAS DEL MOTOR ==
Objetivo: que nadie pierda el vuelo/ferry; plan minimo y CERCA del aeropuerto/puerto.
1) Calcular "hora limite de actividad" = hora del vuelo - margen total:
   - Vuelo: estar en el aeropuerto 2 h antes (1 h 30 min minimo en un aeropuerto pequeño, pero recomendar 2 h en verano por colas).
   - Devolucion de coche de alquiler: +30 min antes de esas 2 h (devolver, repostar, parking) -> restar ~2 h 30 min en total al coche de alquiler.
   - Trayecto base -> aeropuerto: usar tiempos del bloque B (p.ej. desde Ciutadella restar 45 min + colchon de trafico).
   - Sin coche: contar el bus linea 10 (solo desde Mao) o un transfer/taxi reservado (oportunidad Menorca Bus); reservar el transfer la vispera.
2) Plan del ultimo dia = SOLO cosas dentro del cluster del ESTE / cercanas al aeropuerto si la base lo permite, o directamente "maleta + un cafe/paseo corto" si el vuelo es temprano. REGLA: nada de calas de caminata, excursiones del Cami de Cavalls ni desplazamientos al extremo opuesto el dia de salida.
3) Si la base es Ciutadella (oeste) y el vuelo es por la mañana: AVISAR de los 45 min de Me-1 hasta el aeropuerto; recomendar salir con holgura o, si el vuelo es muy temprano, valorar dormir la ultima noche mas cerca de Mao. El motor debe marcar este "riesgo de cruce de isla el dia de salida".
4) Repostaje: avisar de repostar antes de devolver el coche (gasolineras en Mao y junto a la Me-1; no asumir que hay una pegada al aeropuerto).
5) Ferry de salida: presentarse en el puerto (Mao o Ciutadella) con antelacion de embarque de vehiculo (~45-60 min en alta temporada). Mismo principio de margen que el vuelo.

== G. ACOPLES CON LO YA EXISTENTE ==
- AÑADIR a la matriz de tiempos los 8 pares MAH<->base del bloque B.
- AÑADIR 2 "tipos de dia" nuevos: "Dia de llegada (ligero, cercano a base)" y "Dia de salida (margen aeropuerto/puerto)". Encajan en los 13 tipos ya definidos como casos especiales del primer y ultimo dia.
- MONETIZACION: cada vez que la encuesta marque "sin coche" o "transfer", el motor enchufa CTA a MENORCA BUS para transfer aeropuerto<->base y excursiones (cubre el hueco de movilidad sin coche, sobre todo a Ciutadella/Fornells/sur donde el bus publico obliga a transbordar).
- VARIABLES DE ENCUESTA que esta logica consume: dia/hora de llegada y de salida (AÑADIR a la encuesta de 8 preguntas como sub-pregunta opcional: "hora aprox. de vuelo de llegada y de salida" -> mejora muchisimo el dia 1 y el ultimo dia), base, con/sin coche, ferry-si/no.

NOTA DE CERTEZA GLOBAL: distancias y tiempo a Mao y a Ciutadella = ALTA; tiempos a Es Castell/Sant Lluis/Alaior/Fornells/sur = MEDIA (estimacion por carretera, confirmar con ruteo); horarios de bus y ferry = MEDIA (cambian por temporada, confirmar cada año en fuentes oficiales). NO inventar precios exactos de taxi/ferry: dar rangos orientativos.

### Accesibilidad y esfuerzo: clasificación del esfuerzo de calas/sitios (apto carrito/silla/mayores vs caminata dura del Camí de Cavalls), inventario de playas accesibles con servicios y REGLA para que el motor adapte el plan a familias con carrito, movilidad reducida y personas mayores.

=== GUIA/REGLAS DE ACCESIBILIDAD Y ESFUERZO PARA EL MOTOR ===

PROPOSITO: cuando la encuesta detecta CARRITO de bebé, MOVILIDAD REDUCIDA (silla de ruedas / movilidad limitada) o PERSONAS MAYORES, el motor debe FILTRAR y REORDENAR los lugares por nivel de esfuerzo, y priorizar el subconjunto de playas con servicio de baño asistido. Esta faceta NO añade lugares nuevos: AÑADE UN ATRIBUTO (effortLevel + accessibleService) a los 204 lugares existentes y una capa de reglas. Marco temporal de servicios: las playas accesibles operan servicio de baño asistido y socorrista del 1 de mayo al 31 de octubre (fuera de esas fechas: la infraestructura física puede seguir, pero NO el personal de apoyo). Certeza alta.

--- 1. ESCALA DE ESFUERZO (nuevo atributo effortLevel, asignar a cada lugar) ---
Cinco niveles, de menor a mayor esfuerzo:

- A1 ACCESIBLE-ASISTIDO (apto silla de ruedas + servicio de baño): playa con pasarela hasta la arena/orilla, silla anfibia, baño adaptado, parking reservado cercano y personal de apoyo (mayo-octubre). Apto para TODOS los perfiles, incluido baño de la persona con movilidad reducida.
- A2 FACIL / APTO CARRITO Y MAYORES: acceso llano o casi llano desde parking cercano (<150 m), poca o nula pendiente, terreno firme; carrito de bebé y persona mayor llegan sin dificultad aunque NO haya silla anfibia. (Ej.: paseos de puerto, núcleos urbanos llanos, miradores con parking pegado.)
- B MODERADO: caminata corta (5-15 min) o escaleras/rampa con pendiente moderada o tramo de tierra/grava; un carrito todoterreno o una persona con buena movilidad lo hace con esfuerzo; NO apto silla de ruedas ni movilidad muy reducida.
- C EXIGENTE: 15-40 min de sendero, desnivel, rocas, escaleras largas o pista de tierra; típico de calas vírgenes de acceso a pie. NO carrito, NO silla, NO mayores con movilidad limitada.
- D DURO (Camí de Cavalls / virgen remota): >40 min de caminata, terreno abrupto, sin servicios, sin sombra; solo caminantes en forma.

REGLA DE ASIGNACION POR DEFECTO (si un lugar no está clasificado aún): núcleos urbanos y paseos marítimos -> A2; playas de la lista accesible -> A1; calas con parking pegado y rampa -> A2/B; calas que en los datos ya marcan "acceso a pie / caminata / Camí de Cavalls" -> C o D según duración (>40 min o "sin servicios"/"abrupto" = D). En caso de duda, asignar el nivel MAS EXIGENTE (conservador, no frustrar al usuario). Certeza media-alta.

--- 2. INVENTARIO DE PLAYAS ACCESIBLES A1 (servicio asistido, mayo-oct) ---
Playas con pasarela + silla anfibia + baño adaptado + parking reservado + personal de apoyo (Cruz Roja/monitor). Lista verificada (la cifra oficial ronda 10-12 playas; consolidado de fuentes):
- Son Bou (Alaior, sur) — el arenal más completo: aparcamiento, rampas, pasarelas, baños adaptados, duchas, muletas, silla anfibia y caminador adaptado. RECOMENDADA #1 por servicios + aguas poco profundas. Certeza alta.
- Cala Galdana (Ferreries, sur) — pasarelas hasta el mar, silla anfibia, muletas anfibias, socorristas de apoyo al baño, rampas, vestuarios/WC, aguas tranquilas y poco profundas. RECOMENDADA #2. Certeza alta.
- Santo Tomás / Sant Tomàs (Es Migjorn Gran, sur) — silla anfibia, baño adaptado, rampas, pasarelas. Certeza alta.
- Punta Prima (Sant Lluís, sureste) — pasarela hasta la arena, sillas anfibias, socorristas, parking cercano, servicios y restaurantes accesibles. Familiar. Certeza alta.
- Cala en Porter (zona sur) — aparcamiento, rampas, pasarelas, baños adaptados, duchas, muletas, silla anfibia, caminador. Certeza alta (ojo: el núcleo está en alto; el servicio accesible es en la playa, confirmar pendiente local).
- Es Grau (Maó, norte) — aparcamiento, rampas, pasarelas, baños adaptados, duchas, muletas, silla anfibia, caminador; puerta del Parc Natural s'Albufera. Certeza alta.
- Arenal d'en Castell (norte) — aparcamiento próximo, accesos adaptados, baño, silla anfibia; bahía cerrada y poco profunda. Certeza alta.
- Binibèquer / Binibeca (Sant Lluís, sur) — aparcamiento, rampas, pasarelas, baños adaptados, muletas, silla anfibia. Certeza alta.
- Santandría (Ciutadella, oeste) — aparcamiento, rampas, pasarelas, muletas, silla anfibia, baño adaptado, monitor. Certeza alta.
- Sa Platja Gran / Cala des Degollador (Ciutadella, oeste) — silla anfibia, caminador adaptado, pasarelas, baño, monitor. Certeza alta.
NOTA: "Son Saura" del sur (Ciutadella) que cita la pregunta NO aparece confirmada en las listas oficiales de playas con servicio asistido -> certeza BAJA; NO marcar como A1 sin verificar in situ. Tratar como cala con parking + caminata (B/C).

--- 3. CALAS/SITIOS NO ACCESIBLES (clasificación de esfuerzo C/D) ---
Calas vírgenes y de difícil acceso a pie (NO carrito, NO silla, NO mayores con movilidad reducida):
- Macarella (Ciutadella, sur): parking a ~1,6 km; caminata ~5-15 min según parking; en TEMPORADA ALTA cierre de acceso en coche -> lanzadera desde Ciutadella + caminata. Nivel C. Macarelleta: +5 min sendero -> C/D.
- Cala Turqueta (sur): sendero desde parking; a ~1 h a pie de Macarella. Nivel C.
- Cala Mitjana (sur, Ferreries): caminata por pinar. Nivel B/C.
- Cala Pilar (oeste-norte): virgen, difícil acceso, caminata larga. Nivel D.
- Cala Pregonda y Cavalleria (norte): parajes abruptos; etapa Camí de Cavalls Binimel·là-Els Alocs ~8,9 km, dificultad ALTA, ~4 h, SIN servicios. Nivel D.
- Cualquier cala etiquetada en los datos como "Camí de Cavalls", "virgen", "sin servicios", "acceso a pie" -> C o D.
Certeza alta para la clasificación de esfuerzo; las duraciones exactas, certeza media (varían por punto de salida).

--- 4. MONUMENTOS / FAROS / PUEBLOS (esfuerzo) ---
- Ciutadella centro histórico y Catedral: adaptados con rampas, A2 (apto silla con asistencia). Certeza media-alta.
- Fornells (puerto/paseo marítimo) y Es Castell, Maó puerto: paseos llanos A2. Certeza media.
- Naveta des Tudons: parking junto a carretera Ciutadella-Maó, sendero corto de tierra hasta el monumento -> B (firme pero no pavimentado). Certeza media.
- Faro de Favàritx: en TEMPORADA cierre de acceso en coche privado; parking a ~2 km + lanzadera desde Maó; entorno rocoso -> el faro en sí NO accesible en silla; clasificar B/C según temporada. Certeza alta (cierre coche), media (terreno).
- Faros/miradores con parking pegado y mirador llano (ej. tipo Cap de Cavalleria mirador alto): A2/B; el descenso a la cala es otra cosa.

--- 5. REGLAS DEL MOTOR (cómo adaptar el plan) ---
R1. Si encuesta marca SILLA DE RUEDAS o MOVILIDAD REDUCIDA: el motor SOLO propone playas A1 para el baño (priorizar Son Bou y Cala Galdana por servicios + aguas someras), y para el resto del día SOLO lugares A1/A2. Excluir B/C/D. Si el usuario insiste en un lugar B+, mostrar aviso de esfuerzo, no bloquear.
R2. Si encuesta marca CARRITO DE BEBÉ: permitir A1, A2 y, con aviso "caminata X min / terreno irregular", B. Excluir C y D. Recomendar calas con parking pegado y arena de fácil acceso (las A1 más Cala Galdana/Son Bou por servicios y baño tranquilo de niños).
R3. Si encuesta marca PERSONAS MAYORES (sin silla, movilidad algo limitada): permitir A1, A2 y B con aviso; evitar C/D. Reducir nº de paradas (combinar con la regla de NO SATURAR: bajar el presupuesto de horas útiles ~1-1,5 h por descansos más frecuentes).
R4. RESPETAR LA ESPINA DE PEZ: las playas A1 cubren norte y sur (norte: Es Grau, Arenal d'en Castell; sur: Son Bou, Cala Galdana, Santo Tomás, Punta Prima, Binibèquer; oeste: Santandría, Sa Platja Gran). El motor elige la A1 del CLUSTER del día, no obliga a cruzar la isla.
R5. INTERACCION CON LA REGLA DEL VIENTO (Tramontana->sur): la mayoría de A1 con mejor servicio están en el sur (Son Bou, Galdana, Santo Tomás, Punta Prima), que además es el lado resguardado de Tramontana -> coherente; con Tramontana priorizar A1 del sur. Con viento de sur (Migjorn/Xaloc), Es Grau y Arenal d'en Castell (norte) como A1 de respaldo.
R6. VENTANA DE SERVICIO: si las fechas del viaje caen FUERA de 1-mayo/31-octubre, marcar las A1 como "acceso físico sí, pero SIN personal de apoyo ni silla anfibia garantizada" -> para silla de ruedas dependiente de asistencia, avisar de confirmar con el ayuntamiento/Cruz Roja antes de ir. Certeza alta.
R7. SINERGIA MENORCA BUS (sin coche + accesibilidad): para usuarios sin coche con movilidad reducida, los cierres de acceso en coche a Macarella y Favàritx en temporada YA obligan a lanzadera; ofrecer transfer adaptado/privado de Menorca Bus a las playas A1 con parking reservado (Son Bou, Galdana) como solución puerta-a-puerta. Oportunidad de monetización del tráfico accesible.
R8. PLAN B LLUVIA para perfil accesible: sustituir cala por lugares A1/A2 cubiertos y llanos (Ciutadella centro/Catedral adaptada, paseo de puerto de Maó/Fornells, restaurantes accesibles), nunca por calas C/D.

--- 6. DATOS QUE FALTAN (verificar in situ / certeza baja) ---
- Son Saura (sur, Ciutadella): no confirmado como A1; verificar.
- Pendientes locales exactas de Cala en Porter (núcleo alto) y firmeza del sendero de Naveta des Tudons.
- Lista oficial cerrada y nº exacto de playas con servicio cada temporada (varía 10-12): confirmar cada año en web del Consell Insular de Menorca / ayuntamientos antes de publicar.

### ALOJAMIENTO POR ZONA — qué base recomendar (no hoteles concretos)

OBJETIVO: el motor NO lista hoteles; recomienda 1-2 ZONAS BASE segun los inputs de la encuesta (coche/sin-coche + intereses + dias + perfil) y explica por que. Regla maestra coherente con la "espina de pez": la base se elige para MINIMIZAR coche diario y respetar "1 dia = 1 cluster". Con pocos dias, base unica; con mas dias o intereses en costas opuestas, se puede plantear "split" (2 bases). Certeza ALTA salvo donde se indique.

=== LAS 6 ZONAS BASE (pros/contras por perfil) ===

1) CIUTADELLA (oeste). La mas equilibrada para primera vez y sin-coche.
   PROS: casco historico precioso (gotico, catedral, puerto), MEJOR ambiente diurno y nocturno, gastronomia, gran oferta de alojamiento todo nivel; HUB de bus (Linea 1 a Mao cada hora; lineas a calas del oeste/sur cercanas: Cala en Bosc, Cala Blanca, Macarella en temporada). Acceso comodo a calas top del SO (Macarella, Macarelleta, Turqueta, Son Saura) y norte cercano (Cala Morell, Algaiarens).
   CONTRAS: lejos del este (Mao, Es Castell, Binibeca) -> mal si el viaje se centra en el este. Aparcamiento en casco complicado en verano.
   IDEAL PARA: primera vez, parejas, vida nocturna, sin-coche, lujo tranquilo (hay agroturismos premium en su entorno rural). 

2) MAO / MAHON (este). La mas urbana/practica y la mejor para SIN-COCHE puro.
   PROS: estacion de bus que conecta CON TODO (Linea 1 a Ciutadella; lineas a Son Bou, Punta Prima, Binibeca, Fornells/norte); UNICO nucleo con bus directo al AEROPUERTO; puerto natural enorme, restaurantes, servicios todo el ano; base de elccion si NO se alquila coche.
   CONTRAS: NO tiene playa propia; muchas cuestas; mucho parking de pago; ambiente mas de ciudad que de vacaciones de playa.
   IDEAL PARA: sin-coche, llegadas/salidas comodas, cultura/gastronomia, parejas urbanas, lujo (hoteles boutique en el puerto). Menos ideal para "modo resort de playa".

3) CALA GALDANA (sur-centro). La mejor "resort de playa" para primera vez en familia.
   PROS: playa amplia de aguas calmas, infraestructura hotelera (4-5*), posicion central en costa sur; a pie/kayak a calas miticas (Mitjana, Macarella via Cami de Cavalls); ambiente agradable al atardecer. Equilibrio playa+comodidad.
   CONTRAS: de las zonas mas caras y populares; muy estacional; bus limitado (mejor con coche); puede saturarse en agosto.
   IDEAL PARA: familias primera vez, parejas que quieren playa+comodidad. CON COCHE preferible. Sin-coche: posible pero limitado.

4) SON BOU / sur-centro (Sant Jaume/Torre Solí). Resort de playa larga.
   PROS: la playa de ARENA mas larga de Menorca (~4 km), aguas tranquilas, hoteles familiares con animacion, calas mas salvajes al caminar; humedal/Prat de Son Bou detras.
   CONTRAS: "falta de alma"; calidad de bares/restaurantes pobre (mejor self-catering/apartamento con cocina); ambiente de paquete vacacional; empieza a masificarse; aire acondicionado/resort, no encanto de pueblo.
   IDEAL PARA: familias que priorizan playa+piscina+animacion y presupuesto. NO ideal para parejas jovenes, lujo tranquilo ni vida nocturna autentica. Mejor con coche.

5) ES MERCADAL / centro (incl. Es Migjorn, Ferreries cerca). La base "slow" para explorar TODA la isla.
   PROS: CRUCE de caminos: equidistante, llega a cualquier costa en dia (las MEJORES conexiones de bus de la isla segun guias); pueblo autentico de interior, vivo todo el ano, no estacional; subida al Monte Toro; entorno rural con agroturismos.
   CONTRAS: NO esta junto al mar -> SIEMPRE hay que conducir/bus para playa o Cami de Cavalls; sin ambiente de "vacaciones playeras".
   IDEAL PARA: viajeros que cada dia salen a explorar (no "modo tumbona"), lujo tranquilo rural, repetidores, los que quieren visitar costas opuestas en el mismo viaje. CON COCHE casi imprescindible. Certeza ALTA (multiples guias coinciden).

6) FORNELLS (norte). La base de encanto tranquilo y nautica.
   PROS: antiguo pueblo pesquero con MUCHO encanto, puerto con restaurantes de pescado y la famosa caldereta de langosta; muy tranquilo, baja ocupacion, naturaleza; meca de deportes nauticos (vela, windsurf, kayak, buceo) por su bahia protegida; ideal viento (puerto resguardado).
   CONTRAS: el pueblo NO tiene playa (es puerto; playas como Cala Tirant a ~3 km, hay que moverse); oferta de alojamiento limitada (apartamentos/hostales simples, poco lujo de hotel); poco conectado en bus respecto a Mao; lejos del oeste.
   IDEAL PARA: parejas que buscan calma/encanto, amantes de la gastronomia marinera, nauticos, lujo tranquilo entendido como autenticidad (no como hotel 5*). Mejor con coche. Sin-coche: solo via Mao y limitado.

=== LOGICA DE RECOMENDACION DEL MOTOR (mapeo inputs -> base) ===

PASO 1 - FILTRO COCHE/SIN-COCHE (el mas decisivo):
  - SIN COCHE -> recomendar SOLO Mao o Ciutadella (los dos unicos hubs de bus reales). 
      * Si intereses = vida nocturna/casco historico/calas del oeste -> CIUTADELLA.
      * Si intereses = cultura/gastronomia/llegadas comodas/este -> MAO.
      * Avisar: las calas top sur (Macarella, Mitjana) y el norte (Fornells, Cavalleria) requieren combinar bus + a veces taxi/VTC o EXCURSION -> aqui enlazar MENORCA BUS (transfers/excursiones) como solucion. Resorts (Galdana, Son Bou) sin coche = bus limitado, descartar como base sin-coche salvo que el usuario acepte poca movilidad.
  - CON COCHE -> abrir las 6 zonas, decidir por intereses/perfil (paso 2).

PASO 2 - PERFIL/INTERESES (con coche):
  - PRIMERA VEZ (equilibrio): Ciutadella (si quieren ciudad+ambiente) o Cala Galdana (si quieren playa+resort). Es la recomendacion segura.
  - FAMILIAS playa/comodidad: Cala Galdana (mas bonita) o Son Bou (playa larga+animacion, avisar de cenar self-catering).
  - PAREJAS / LUJO TRANQUILO: Ciutadella casco o agroturismo rural (entorno Ciutadella/Ferreries/Es Migjorn), Mao puerto boutique, o Fornells (encanto marinero). Evitar Son Bou.
  - VIDA NOCTURNA: Ciutadella (1a opcion), Mao (2a). Resorts/Fornells/Es Mercadal NO.
  - EXPLORAR TODA LA ISLA / costas opuestas: Es Mercadal o Ferreries (centro) como base unica, por equidistancia.
  - NAUTICA / VIENTO Tramontana fuerte: Fornells (bahia protegida) para actividades de vela/windsurf.

PASO 3 - DIAS (numero):
  - 3-4 dias: SIEMPRE 1 sola base (evitar perder tiempo en cambios). Elegir la que cubra mejor sus 2-3 clusters prioritarios.
  - 5-7 dias: 1 base sigue siendo lo normal (la isla es pequena, eje Mao-Ciutadella 45 min). Plantear split SOLO si quieren oeste Y este intensos: p.ej. mitad Ciutadella + mitad Mao.
  - 8+ dias o intereses muy dispersos: split de 2 bases razonable (oeste + este, o costa + interior). 
  - REGLA: el coste/tiempo de cambiar de base solo compensa si ahorra >=1h de coche/dia varios dias seguidos. Con pocos dias, NUNCA dividir.

PASO 4 - COHERENCIA CON OTRAS REGLAS DEL MOTOR:
  - La base define que clusters son "dia facil" (mismo lado) y cuales son "dia de coche largo" (costa opuesta -> evitar o limitar a 1 en el viaje).
  - Cruzar a costa opuesta desde la base cuenta como "dia de traslado" en el presupuesto de 8,5 h.
  - Regla del viento: si la base es del sur y hay Tramontana, perfecto (playas sur protegidas); si la base es Fornells/norte con Tramontana fuerte, redirigir el dia de playa al sur (mas coche ese dia).

NOTA SIN-COCHE -> MONETIZACION: siempre que el motor detecte sin-coche + deseo de calas no conectadas, ofrecer la EXCURSION/TRANSFER de Menorca Bus como puente (no es un fallo del plan, es la solucion premium).
