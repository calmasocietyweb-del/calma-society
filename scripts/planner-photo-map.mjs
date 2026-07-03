/**
 * Tabla CURADA de fotos del Planificador — id (translationKey) → foto de
 * public/uploads (nombre base, sin extensión) + crédito cuando la licencia
 * lo exige (Wikimedia CC BY / CC BY-SA; Adobe Stock y fotos propias no lo piden).
 *
 * REGLA (veredicto del council, jul 2026): cascada HONESTA. Solo se asigna una
 * foto si retrata EL LUGAR (o su entorno inmediato: el pueblo de la actividad,
 * el parque del avistamiento). NUNCA la foto de otra cala/negocio fingiendo ser
 * este (misatribución = dato visual inventado, viola el principio §3.8).
 * Un lugar sin foto verificada va SIN foto: es lo honesto.
 *
 * Pendiente (decisión de dueño): talati-de-dalt, trepuco y torre-den-galmes
 * tienen foto de Wikimedia CC descargada (public/uploads/talayotico-*.jpg,
 * usada en redes) pero sin AUTOR registrado → no se publican en la web hasta
 * anotar autor y licencia exactos.
 */
export const PHOTO_MAP = {
  // ── El lugar, retratado por sí mismo ───────────────────────────────────────
  "alaior": { img: "alaior", credit: "Mathewr1999 · Wikimedia Commons, CC BY-SA 4.0" },
  "cala-galdana": { img: "cala-galdana" }, // Adobe Stock
  "cala-macarelleta": { img: "cala-macarelleta", credit: "Pelayo Arbués · Unsplash" },
  "cala-mitjana": { img: "cala-mitjana" },
  "cala-pregonda": { img: "cala-pregonda" },
  "cala-turqueta": { img: "cala-turqueta" }, // CC (misma foto que su ficha)
  "ciutadella": { img: "ciutadella" },
  "cova-den-xoroi": { img: "cova-den-xoroi", credit: "Travelinho · Wikimedia Commons, CC BY-SA 3.0" },
  "fornells": { img: "fornells" }, // Adobe Stock
  "illa-del-rei": { img: "illa-del-rei", credit: "Florent Pécassou · Wikimedia Commons, CC BY-SA 4.0" },
  "lithica": { img: "lithica", credit: "Ben Salter · Wikimedia Commons, CC BY 2.0" },
  "monte-toro": { img: "monte-toro", credit: "Ian Kirk · Wikimedia Commons, CC BY 2.0" },
  "naveta-tudons": { img: "naveta-tudons", credit: "Menorquino · Wikimedia Commons, CC BY-SA 3.0" },
  "son-bou": { img: "son-bou", credit: "Wasquewhat · Wikimedia Commons, CC BY-SA 4.0" },

  // ── El lugar, por su vista/entorno inmediato (sigue siendo ese sitio) ─────
  "faro-de-punta-nati": { img: "menorca-punta-nati" }, // Adobe Stock (es Punta Nati)
  "fortaleza-de-la-mola": { img: "la-mola", credit: "Alvaro Ortiz · Wikimedia Commons, CC BY-SA 3.0" },
  "mao": { img: "puerto-mao" }, // Adobe Stock (el puerto ES la postal de Maó)
  "es-castell": { img: "cales-fonts" }, // Adobe Stock (Cales Fonts, el puerto de Es Castell)
  "binibeca-vell": { img: "binibeca" }, // Adobe Stock
  "platja-de-binigaus": { img: "binigaus" }, // Adobe Stock
  "parc-natural-de-salbufera-des-grau": { img: "albufera-des-grau", credit: "Nicolas G. Mertens · Wikimedia Commons, CC BY-SA 4.0" },
  "birdwatching-salbufera-des-grau": { img: "albufera-badia", credit: "Discasto · Wikimedia Commons, CC BY-SA 4.0" },
  "destileria-gin-xoriguer": { img: "gin-menorca" }, // Adobe Stock (el gin de Menorca es Xoriguer)

  // ── El Camí de Cavalls, retratado por el propio sendero ───────────────────
  "cami-de-cavalls-es-grau-sa-mesquida-familiar": { img: "cami-de-cavalls", credit: "Pelayo Arbués · Unsplash" },
  "cami-de-cavalls-etapa-2-es-grau-favaritx": { img: "cami-de-cavalls", credit: "Pelayo Arbués · Unsplash" },
  "cami-de-cavalls-etapa-6-binimella-els-alocs": { img: "cami-de-cavalls", credit: "Pelayo Arbués · Unsplash" },
  "cami-de-cavalls-etapa-10-punta-nati-ciutadella": { img: "cami-de-cavalls", credit: "Pelayo Arbués · Unsplash" },
  "cami-de-cavalls-etapa-13-turqueta-galdana": { img: "cami-de-cavalls", credit: "Pelayo Arbués · Unsplash" },
  "cami-de-cavalls-etapa-20-sant-esteve-mao": { img: "cami-de-cavalls", credit: "Pelayo Arbués · Unsplash" },
};
