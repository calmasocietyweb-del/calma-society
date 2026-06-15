/// <reference types="astro/client" />

// Las fuentes de Fontsource se importan por su efecto secundario (cargan CSS)
// y no incluyen declaraciones de tipos. Declaramos el módulo para que
// `astro check` no marque error.
declare module "@fontsource-variable/*";
