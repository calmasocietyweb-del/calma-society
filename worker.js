// Worker mínimo: sirve los archivos estáticos de ./dist (binding ASSETS).
// Sin sesiones ni KV → el despliegue no vuelve a fallar por aprovisionar bindings.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
