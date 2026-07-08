// Worker de Calma Society: sirve los archivos estáticos de ./dist (binding
// ASSETS) y, delante de ellos, un router MÍNIMO para las funciones de API que
// SÍ necesitan servidor (functions/api/*). No usamos el adaptador de Astro
// (meterlo congeló la web una vez): solo este despacho explícito por ruta, de
// modo que la web pública sigue siendo 100 % estática.
import { onRequestPost as suscribirPost } from "./functions/api/suscribir.ts";

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

    // Todo lo demás: los archivos estáticos generados por Astro.
    return env.ASSETS.fetch(request);
  },
};
