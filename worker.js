// Worker de Calma Society: sirve los archivos estáticos de ./dist (binding
// ASSETS) y, delante de ellos, un router MÍNIMO para las funciones de API que
// SÍ necesitan servidor (functions/api/*). No usamos el adaptador de Astro
// (meterlo congeló la web una vez): solo este despacho explícito por ruta, de
// modo que la web pública sigue siendo 100 % estática.
import { onRequestPost as suscribirPost } from "./functions/api/suscribir.ts";
import { onRequest as sociosRequest, runSnapshot } from "./functions/api/socios.ts";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    // Alta de newsletter en MailerLite (KAN-38). Única función de API activa
    // hoy; /api/reservas se enrutará aquí cuando se encienda (necesita el
    // binding D1, ver docs/RESERVAS-TRANSFERS.md).
    if (pathname === "/api/suscribir") {
      if (request.method === "POST") return suscribirPost({ request, env });
      return new Response("Método no permitido", {
        status: 405,
        headers: { allow: "POST" },
      });
    }

    // Registro de socios y dinero (KAN-122, panel interno). Todos los métodos
    // exigen clave; sin la base D1 creada responde 503 con mensaje claro
    // (runbook docs/PANEL-SOCIOS-DINERO.md).
    if (pathname === "/api/socios") {
      return sociosRequest({ request, env });
    }

    // Todo lo demás: los archivos estáticos generados por Astro.
    return env.ASSETS.fetch(request);
  },

  // Foto mensual del valor entregado a cada socio (KAN-122): el cron del día 2
  // (wrangler.jsonc → triggers.crons) fotografía el MES ANTERIOR completo desde
  // Umami a la tabla medicion_mensual. Sin base D1 o sin secretos de Umami no
  // hace nada: el sistema nace apagado y este handler es inofensivo.
  async scheduled(_event, env) {
    const mes = new Date(new Date().setUTCDate(0)).toISOString().slice(0, 7);
    const r = await runSnapshot(env, mes).catch((e) => ({ ok: false, motivo: String(e) }));
    console.log("socios: foto mensual", JSON.stringify(r));
  },
};
