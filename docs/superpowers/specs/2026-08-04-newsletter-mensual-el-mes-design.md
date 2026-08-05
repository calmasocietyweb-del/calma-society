# «El mes» — newsletter mensual de Calma Society

**Fecha:** 2026-08-04 · **Estado:** diseño aprobado por Cristian, pendiente de producción
**Relacionado:** KAN-99 (embudo verificado), KAN-93 (copy sin cadencia), KAN-106 (plan editorial), KAN-5 (épica de captación)

---

## 1. Por qué existe este documento

El 4 de agosto de 2026 se verificó con datos que el embudo de captación **funciona**: de 0 a 6
suscriptores activos en 7 días, 0 sin confirmar, y una tasa de 1,3 % frente al 0,2 % del widget
anterior (×6). Al mirar el resto del sistema apareció el hueco: **en toda la vida del proyecto no se
ha enviado NUNCA una campaña.** Solo existen 2 borradores vacíos de junio y las 2 automatizaciones
de bienvenida del lead magnet.

La newsletter existe como lista, no como publicación. Este documento define la publicación.

### Las tres razones para enviar ya, con solo 5 lectores reales

1. **El envío de campañas es la única pieza del sistema que jamás se ha ejecutado.** Este verano ya
   se ha pagado dos veces el precio de dar por buena una pieza sin probarla: el alta por API estuvo
   3 semanas muerta (KAN-99) y los pines de Pinterest 3 semanas sin que nadie los viera (KAN-101).
   Probar con 5 destinatarios es gratis; descubrirlo con 500 no.
2. **La lista se enfría.** Los primeros entraron el 28 de julio. Una lista que consiente y luego no
   recibe nada responde peor y genera más quejas de spam cuando por fin se le escribe.
3. **Desbloquea la captación en la agenda.** Hoy la agenda es el **43 % del tráfico**
   (`/en/whats-on/` 52 visitantes + `/agenda/` 21 en 7 días) y capta **cero**. El gancho que
   funcionaría ahí —«te aviso de lo que viene»— sería mentira mientras no exista cadencia real.
   Con envíos reales deja de serlo.

---

## 2. Decisiones tomadas

| # | Decisión | Valor | Quién decidió |
|---|---|---|---|
| 1 | Cadencia | **Mensual**, comprometida | Cristian, 4-ago |
| 2 | Formato | «El mes que viene en Menorca» | Cristian, 4-ago |
| 3 | Idiomas | **ES + EN** desde el nº 1, dos envíos segmentados | Principio §3.4 del CLAUDE.md (no se reabrió) |
| 4 | Nombre | **«El mes»** / «The month» | Propuesto aquí |
| 5 | Rescate de `dechaide@gmail.com` | Se añade al grupo ES | Cristian, 4-ago |
| 6 | Momento del nº 1 | **Semana del 4-ago**, con septiembre como tema | Propuesto aquí |
| 7 | Tercera ancla | **`UNA LUZ`** (atardecer + amanecer), no `UNA MESA` | Cristian, 4-ago |

**Sobre la decisión 7 — por qué se aparca `UNA MESA`.** Decisión de Cristian: mientras no haya
acuerdos comerciales, la newsletter no destaca negocios. Es coherente con el modelo de monetización
ya fijado en el registro de colaboraciones (15-jul): los locales se monetizan por **cuota fija de
directorio**, no por clic. Regalar un destaque en la newsletter debilita esa venta.

Matiz para el futuro: los artículos de gastronomía son **editoriales**, criterio propio, no
publicidad pagada. `UNA MESA` queda **aparcada, no eliminada**: puede volver cuando existan acuerdos.

**Sobre la decisión 6:** no se espera a final de mes. Septiembre queda a 4 semanas, que es la ventana
en la que se planifica un viaje (45-60 días de antelación, mismo criterio que KAN-106), y cada semana
extra de silencio enfría la lista.

---

## 3. Estructura de la pieza (fija, todos los meses)

Que la estructura no cambie es parte del valor: el lector reconoce el correo en dos segundos.

1. **Asunto + preheader** — el asunto nombra el mes o su promesa; el preheader no repite el asunto.
2. **La carta** — 180-220 palabras. Qué le pasa a la isla ese mes. Voz de lujo tranquilo, sin
   superlativos huecos, sin emojis.
3. **Tres anclas** — `UNA FECHA` · `UNA CALA` · `UNA LUZ`. Una línea de contexto cada una y su
   enlace. Siempre tres, siempre en ese orden. `UNA LUZ` lleva las dos caras del día: el sol que
   cae y el que nace, un enlace cada uno.
4. **Un solo enlace principal** — un único *ask* por pieza (misma regla que en redes).
5. **Pie** — firma «Redacción de Calma Society», por qué recibes esto, baja en un clic.

### Reglas de contenido

- **Nada sin verificar.** Cada ancla enlaza a contenido `published` cuya URL se ha comprobado.
- **Nada de promesas que no se cumplen.** Si un mes no hay «una mesa» defendible, se sustituye por
  otra ancla; no se rellena.
- **Sin emojis** (regla de marca).
- **Foto:** si se usa, tiene que enseñar aquello de lo que habla la pieza (regla ya establecida en
  el pipeline de redes). Ante la duda, sin foto.

---

## 4. Contenido del número 1 — septiembre

**Ángulo de la carta:** en septiembre el mar de Menorca está más caliente que en junio y las calas
se vacían. Es un dato, no una opinión — el tipo de afirmación concreta y verificable que hace al
contenido citable por IA (principio §3.2, GEO).

### Anclas y destinos (URLs verificadas con `curl`, 4-ago-2026, todas 200)

| Ancla | Español | Inglés |
|---|---|---|
| UNA FECHA | Festes de Gràcia, 7-9 sept<br>`/agenda/festes-gracia-es/` | `/en/whats-on/festes-gracia-en/` |
| UNA CALA | Cala Pregonda<br>`/articulo/cala-pregonda-binimella/` | `/en/article/pregonda-binimella-coves/` |
| UNA MESA | Mesa para dos: la alta cocina discreta<br>`/articulo/alta-cocina-menorca/` | `/en/article/menorca-fine-dining/` |
| **Enlace principal** | Cuándo ir a Menorca<br>`/articulo/cuando-ir-a-menorca/` | `/en/article/when-to-visit-menorca/` |

**Ninguna pieza hay que escribirla.** Todo está publicado. El artículo «Menorca en septiembre y
octubre» de KAN-106 queda **desacoplado**: se escribe en agosto según su propia ventana y lanza el
número 2 (finales de septiembre, apuntando a octubre).

---

## 5. Segmentación y envío

Dos campañas, una por idioma. La asignación de grupo ya la hace el alta automáticamente
(`groupsForLocale` en `src/lib/newsletter/subscribe.ts`): todo suscriptor entra en el grupo general
más el de su idioma.

| Campaña | Grupo | Hoy | Tras el rescate |
|---|---|---|---|
| «El mes · septiembre» | `calas-en-calma` | 3 (incluye a `cristiancampsgili@`, interno) | **4** |
| «The month · September» | `calas-en-calma-en` | 3 | 3 |
| | | | **7 en total** |

**Antes de enviar** hay que añadir `dechaide@gmail.com` al grupo `calas-en-calma`. Hoy está solo en
el grupo general y no recibiría ninguna de las dos campañas. Es además el rescate que quedó
pendiente en KAN-99: su alta del 28-jul nunca recibió nada («Enviados 0»).

Con el rescate hecho, las dos campañas cubren a **los 7 activos**: nadie de la lista queda fuera.

---

## 6. Medición

- **UTM en todos los enlaces:** `?utm_source=newsletter&utm_medium=email&utm_campaign=el-mes-2026-09`
  (`the-month-2026-09` en la versión inglesa), para separarlo en el informe UTM de Umami.
- **MailerLite:** aperturas, clics y rebotes por campaña.

### Criterio de éxito del número 1

No es el alcance. Con 7 destinatarios —de los cuales 2 son internos— ninguna métrica de tráfico se
va a mover, y fingir lo contrario sería engañarse. El número 1 sale bien si:

1. **Sale y llega** — 0 rebotes, 0 quejas de spam.
2. **Apertura > 40 %** — la base de la lista es 63,6 %, así que 40 % es un listón prudente.
3. **Al menos 1 clic** — prueba de que el enlace funciona punta a punta.

Cualquier fallo aquí es información valiosa: es exactamente el tipo de defecto silencioso que se ha
escapado tres veces este verano.

---

## 7. Qué desbloquea (y solo si el nº 1 sale limpio)

1. **Recuperar el copy con cadencia** en toda la captación de la web. En julio (KAN-93) se suavizó a
   «te escribimos solo cuando hay algo que merece la pena» porque prometer «cada quince días» era
   falso. Con una mensual real y cumplida, «una vez al mes» pasa a ser verdad.
2. **Activar el gancho de la agenda** — el 43 % del tráfico que hoy capta cero.

Ambas cosas son trabajo aparte y necesitan su propia ficha. **No forman parte de este brief.**

---

## 8. Riesgos y avisos conocidos

- **Dos direcciones internas en la lista.** `hola@calmasociety.com` (centinela) y, desde el 4-ago,
  `cristiancampsgili@gmail.com`. Al leer métricas hay que **restar 2, no 1**. Los porcentajes de
  apertura y clic estarán inflados porque ambos van a abrir.
- **El francés no tiene grupo.** `groupsForLocale` solo asigna grupo de idioma a `es` y `en`; un
  lector FR se queda únicamente en el general y **no recibiría ninguna de las dos campañas**. Hoy no
  hay ningún suscriptor francés, así que no bloquea el nº 1, pero reaparecerá en cuanto lo haya.
  Necesita ficha propia.
- **La «mesa» puede haber cerrado.** Los locales citados en artículos de gastronomía hay que
  revisarlos periódicamente (misma cautela que en el artículo de atardeceres y copas). Verificar
  antes de enviar.
- **Riesgo de fallar la promesa por segunda vez.** Comprometerse a mensual y no cumplirlo repetiría
  el error de KAN-93, esta vez con lectores reales delante. La cadencia es un compromiso, no una
  intención.

---

## 9. Flujo de aprobación

La excepción de auto-publicación aprobada el 30-jul es **solo para redes sociales** (Metricool). La
newsletter **no** está cubierta por ella: es contenido editorial que sale a nombre de la marca hacia
la bandeja de entrada de un lector.

Por tanto se aplica la regla absoluta de §3.10: **Cristian ve el borrador completo de las dos
campañas y da el visto bueno antes de que se programe ningún envío.**
