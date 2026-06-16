# Guía: panel de edición ONLINE con login (Vercel + GitHub)

Esta guía monta el **panel de edición accesible desde cualquier ordenador**, con
**login** y varios editores. La web pública (`calmasociety.com`) **no se toca**:
sigue estática en Cloudflare. El panel vive aparte, en **Vercel** (gratis).

> Cómo encaja todo:
> - **Web pública** → Cloudflare (estática, como siempre).
> - **Panel de edición** → Vercel (`tu-proyecto.vercel.app/keystatic`), con login de GitHub.
> - Los dos leen/escriben el **mismo repositorio** de GitHub. Cuando se aprueba
>   y publica algo, la web pública se actualiza sola.

---

## Resumen de pasos
1. Crear cuenta en Vercel (gratis, con GitHub).
2. Importar el repositorio y desplegar.
3. Conectar Keystatic con GitHub (crea una "GitHub App").
4. Pegar 3 variables secretas en Vercel y volver a desplegar.
5. Entrar al panel con login.
6. Invitar a tu equipo y darles permisos.

---

## Paso 1 — Crear cuenta en Vercel
1. Entra en **https://vercel.com** → **Sign Up**.
2. Elige **"Continue with GitHub"** (usa la cuenta de GitHub del proyecto: `calmasocietyweb-del`).
3. Acepta los permisos. Elige el plan **Hobby (gratis)**.

## Paso 2 — Importar el proyecto
1. En Vercel: **Add New… → Project**.
2. Busca el repositorio **`calma-society`** y pulsa **Import**.
3. Vercel detecta solo que es **Astro**. No cambies nada de la configuración.
4. Pulsa **Deploy** y espera 1-2 min.
5. Te dará una dirección tipo **`https://calma-society-xxxx.vercel.app`**. **Cópiala.**

> En este punto, si entras en `…vercel.app/keystatic`, te pedirá configurar GitHub
> (paso 3). Es normal.

## Paso 3 — Conectar Keystatic con GitHub
1. Entra en **`https://TU-URL.vercel.app/keystatic`**.
2. Verás una pantalla de **configuración de GitHub**. Pulsa el botón para
   **crear la GitHub App** (te lleva a GitHub con todo rellenado).
3. En GitHub, confirma la creación e **instálala en el repositorio `calma-society`**.
4. Al volver, Keystatic te mostrará dos códigos:
   - **Client ID**
   - **Client Secret**
   Déjalos a mano (los pegas en el paso 4). **No los compartas con nadie.**

## Paso 4 — Pegar las variables secretas en Vercel
1. En Vercel: tu proyecto → **Settings → Environment Variables**.
2. Añade estas **tres** variables (para todos los entornos):

   | Nombre | Valor |
   |---|---|
   | `KEYSTATIC_GITHUB_CLIENT_ID` | el *Client ID* del paso 3 |
   | `KEYSTATIC_GITHUB_CLIENT_SECRET` | el *Client Secret* del paso 3 |
   | `KEYSTATIC_SECRET` | una cadena larga al azar (te la doy yo, o cualquier texto de 40+ caracteres) |

3. Ve a **Deployments → (último) → ⋯ → Redeploy** para aplicar las variables.

## Paso 5 — Entrar al panel
1. Entra en **`https://TU-URL.vercel.app/keystatic`**.
2. Pulsa **Sign in with GitHub** → autoriza.
3. ¡Ya estás dentro! Verás el mismo panel que en tu ordenador (Artículos, etc.),
   pero ahora los cambios van al repositorio y se reflejan en la web tras aprobarse.

## Paso 6 — Invitar a tu equipo (cuando contrates)
1. En GitHub: repo `calma-society` → **Settings → Collaborators → Add people**.
2. Invita a cada persona por su usuario/email de GitHub.
3. Rol recomendado:
   - **Tú** = *Admin* (apruebas y publicas).
   - **Editores** = *Write* (proponen; ver "Aprobación" abajo).
4. Cada editor entra en `…vercel.app/keystatic`, **Sign in with GitHub**, y a trabajar.

---

## Aprobación (que los editores propongan, no publiquen)
- Por defecto, **el campo Estado** ya es tu control: los editores guardan en
  **Borrador / Pendiente**, y la web pública **solo** muestra lo que tú pongas en
  **Publicado**.
- **Blindaje fuerte (opcional, recomendado con equipo):** en GitHub →
  repo → **Settings → Branches → Add rule** sobre `main`, marcando
  *"Require a pull request before merging"*. Así nadie publica en la web sin que
  **tú apruebes** el cambio. (Te lo configuro cuando quieras.)

## Dirección bonita (opcional)
Para que el panel sea, p. ej., **`editar.calmasociety.com`** en vez de la de
`vercel.app`: en Vercel → Settings → Domains → añadir `editar.calmasociety.com`,
y en Cloudflare crear el registro DNS que Vercel indique. (Te guío cuando llegues.)

## Importante
- La web pública (`calmasociety.com`) **nunca** depende de Vercel: si Vercel
  fallara, la web sigue online. Vercel es solo la "puerta de edición".
- El panel de Vercel está marcado como **noindex**: Google no lo indexa (no compite
  con tu web real).
