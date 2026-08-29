# Los cuatro vientos — rediseño completo de las redes sociales de Calma Society

> **Estado:** aprobado por el dueño el 29-ago-2026.
> **Sustituye** por completo al sistema de redes anterior (`REDES-SOCIALES/`: carruseles,
> reels, stories generadas, plantillas Remotion, banco de ideas). El sistema antiguo se
> **archiva, no se borra**; lo ya publicado en Instagram **se queda** y el feed nuevo lo entierra.

---

## 1. Por qué

El sistema anterior producía carruseles y stories con foto real de Menorca y el texto
incrustado en el visual. Funcionaba como pieza informativa pero no generaba alcance frío: sin
reels desde el 6-ago-2026, la cuenta perdió su única vía de llegar a no-seguidores, y las
piezas informativas compiten con miles de guías idénticas.

La decisión del dueño (29-ago-2026) es cambiar de palanca: **dejar de competir por
información y competir por atención**, con un activo que nadie más en el nicho tiene — un
reparto propio de personajes.

### El principio que lo hace compatible con la marca

**Separamos la puerta del salón.**

- **La puerta** (Instagram) pasa a ser emocional, imaginativa y de IA declarada. Su trabajo es
  detener el scroll y ganarse un clic.
- **El salón** (calmasociety.com) no cambia: artículos con datos reales, verificados y de
  primera mano. Ese es el moat que hace que la IA nos cite y no se toca.

El animal **nunca aporta el dato**. El dato vive en el pie de foto y, sobre todo, en el
artículo al que lleva. Se le pone un imán delante al contenido serio; no se sustituye.

---

## 2. El concepto: los cuatro vientos

Cuatro **residentes** que viven Menorca los 365 días del año y la enseñan viviéndola. Llevan
los nombres de los vientos de la isla. La marca se llama *Calma*, que es exactamente lo que
queda cuando los vientos descansan.

> *Cuando los cuatro vientos descansan, queda la calma.*

Es una idea **ownable**: nadie puede copiarla sin copiarnos, y ata la campaña a la geografía
real de la isla (Migjorn es literalmente el nombre de la costa sur de Menorca).

---

## 3. El reparto

Los cuatro personajes existen como **Reference Elements** en Higgsfield, creados el
29-ago-2026 a partir de una ficha de personaje de tres vistas (perfil, tres cuartos y primer
plano) combinada con su foto de casting. Los ids son la fuente de verdad de la identidad:

| Personaje | Animal | `element_id` | Territorio | Secciones |
|---|---|---|---|---|
| **Migjorn** (viento del sur) | Gato mediterráneo color crema | `2e67021d-3c03-4f96-89d0-429eb19fa39c` | Pueblos blancos, mesa, mercados, terrazas, siesta, sur | comer-y-beber · vivir |
| **Tramuntana** (viento del norte) | Cavalier King Charles blenheim | `5b2b0c4c-eb37-4a4d-96b7-9f45c9535872` | Calas bravas, Camí de Cavalls, barcos, llegadas, norte | descubrir · practica |
| **Llevant** (viento del este, el amanecer) | Conejo Holland Lop crema | `aba8c55e-f428-4b09-b023-99c6a9887ec3` | Campo, huerta, primavera, mercados de primera hora | descubrir · comer-y-beber |
| **Ponent** (viento del oeste, el atardecer) | Mochuelo (*Athene noctua*) | `6025cb75-bfa4-4a44-911c-9f269aa24373` | Ciutadella, historia, interiores, noches, invierno | cultura · agenda |

Dos de los cuatro (el mochuelo y, en el entorno, el conejo de campo) son **fauna real de
Menorca**: eso da autenticidad al conjunto sin renunciar a la ternura del gato y el cavalier.

### Marcas de identidad (lo que impide que el personaje derive)

Cada personaje lleva un rasgo concreto que se repite en cada prompt y que permite **verificar
a ojo** que no ha derivado:

- **Migjorn:** pelaje crema-albaricoque con anillos atigrados pálidos en la cola, pechera
  blanca, ojos ámbar-dorados y **una muesca en la punta de la oreja izquierda**.
- **Tramuntana:** capa blanco perla con manchas castañas, **máscara castaña simétrica partida
  por un blaze blanco**, orejas largas con flecos castaños, ojos redondos oscuros.
- **Llevant:** pelaje crema-marfil aterciopelado, **silla color cervato sobre los hombros**,
  orejas caídas largas con **una punta ligeramente más oscura**, ojos oscuros líquidos.
- **Ponent:** plumaje moteado crema y pardo, **ceja blanca que forma una V pálida entre los
  ojos**, ojos enormes ámbar-limón, disco facial plano.

> Verificado el 29-ago-2026: la muesca de la oreja de Migjorn aparece correctamente en un
> primerísimo plano generado en otra escena y con otro vestuario. El mecanismo aguanta.

### Fichas y material de referencia

- Fichas de personaje: `REDES-SOCIALES/CASTING-ANIMALITOS-PARA-ABRIR/fichas-de-personaje/`
- Casting completo (8 candidatos): `REDES-SOCIALES/CASTING-ANIMALITOS-PARA-ABRIR/`
- Prueba de planos (8 escenas): `REDES-SOCIALES/CASTING-ANIMALITOS-PARA-ABRIR/prueba-de-planos/`

---

## 4. El registro visual — las reglas de hierro

Sustituyen a los gates del sistema antiguo (que iban de fotos reales y resolución).

1. **Ultrarrealista en el ASPECTO, humano en el COMPORTAMIENTO.**
   El animal se ve como un animal de verdad: pelo a pelo, plumas, humedad del hocico,
   asimetrías, expresión animal real, grano de película. **Jamás** dibujo animado, ilustración,
   render 3D, peluche ni estética Pixar.
   Pero **vive como una persona**: puede estar a dos patas, sujetar cosas, beber, leer, bailar,
   conducir, descansar. Es el registro de una fotografía editorial de gama alta protagonizada
   por animales, no una foto de fauna.
   *(Decisión expresa del dueño, 29-ago-2026: «como si los animales fueran los humanos».)*

2. **Siempre un sitio real de Menorca.** Toda escena parte de una foto verificada del
   catálogo (`public/uploads/`) como referencia de lugar. Cero "cala genérica", cero paisaje
   inventado. El sitio debe ser reconocible por alguien que haya estado allí.

3. **Siempre atada a un artículo publicado.** Sin artículo no hay post: el artículo decide el
   lugar, la estación y la acción, y es el destino del enlace.

4. **Un plano distinto cada día.** Rotación obligatoria del banco de 12 planos (§5). No se
   repite plano dentro de 7 días, ni personaje dos días seguidos, ni artículo dentro de 30 días.

5. **Paleta de marca en el vestuario:** lino, arena, terracota, arcilla, oro, champán, crema.
   **Cero azul ni teal** en la ropa (el mar y el cielo sí, obviamente).

6. **Sin texto en la imagen. Nunca.** Ni rótulos, ni logos, ni marcas de agua, ni sello. Todo
   el texto vive en el pie de foto.

7. **Sin personas humanas en el encuadre.** El mundo es de los animales.

8. **IA declarada** en la bio de Instagram. Meta va a etiquetar las piezas de todos modos
   (metadatos C2PA); adelantarnos protege la confianza, que es el activo del negocio.

9. **Coherencia de estación.** El vestuario y la luz corresponden a la época real del año en
   que se publica. En enero no hay bañadores.

---

## 5. Banco de planos (12)

| # | Plano | Qué aporta |
|---|---|---|
| 1 | General amplísimo | El animal pequeño, manda el paisaje. El plano más "lujo tranquilo" |
| 2 | General | Cuerpo entero en su contexto |
| 3 | Medio | Medio cuerpo, ambiente reconocible, el plano de trabajo |
| 4 | Primer plano | Cabeza y hombros, expresión |
| 5 | Primerísimo / macro | Solo la cara. El que más para el scroll |
| 6 | Detalle | Patas, un objeto, una textura. El animal puede estar cortado |
| 7 | Cenital | Desde arriba en vertical. Muy gráfico |
| 8 | Contrapicado | Desde abajo. Monumentaliza el sitio |
| 9 | De espaldas | El espectador ve lo que ve el animal. Muy identificativo |
| 10 | Contraluz / silueta | Atardeceres, interiores, ventanas |
| 11 | A través de | Enmarcado por una puerta, un arco, una ventana, follaje |
| 12 | Con movimiento | Barrido, orejas o pelo al viento, agua en movimiento |

---

## 6. Banco de acciones (37)

El motor creativo. Acciones **humanas** ejecutadas por los animales, agrupadas por sección de
la revista. Se amplía con el tiempo; nunca se repite una acción dentro de 30 días.

**Mesa y sobremesa** — *comer y beber*
1. Tomando un gin con limón en una terraza del puerto
2. Partiendo una cuña de queso de Mahón sobre tabla de madera
3. Leyendo la carta de un restaurante con gafas de leer en la punta del hocico
4. Sobremesa larga: servilleta de lino, copa a medio beber, luz de las cuatro
5. Haciendo la compra en el mercado con cesto de mimbre
6. Cocinando una caldereta en una cocina encalada
7. Brindando con otro personaje del reparto
8. Pelando higos sentado en un murete

**Viaje y llegada** — *práctica*
9. Esperando en el muelle con una maleta de cuero
10. Bajando del ferry con el equipaje
11. Conduciendo un descapotable clásico por una carretera entre paredes de piedra seca
12. Peleándose con un mapa de papel que se lleva el viento
13. Dormido en un asiento con el sombrero sobre la cara
14. Consultando un horario en una parada

**Playa y mar** — *descubrir*
15. Tumbado en una toalla de lino leyendo una novela
16. Flotando de espaldas en agua turquesa
17. Poniéndose crema solar en el hombro
18. Buscando conchas agachado en la orilla
19. Saltando desde una roca al agua
20. Al timón de una barca de madera
21. Sacudiendo la arena de una toalla al viento

**Cultura y ocio** — *cultura · agenda*
22. Leyendo el periódico en un banco de plaza
23. Bailando en una fiesta de pueblo bajo farolillos
24. Escuchando un concierto con los ojos cerrados
25. Pintando una acuarela frente al paisaje
26. Fotografiando con una cámara analógica
27. Visitando un yacimiento talayótico con la guía de papel abierta
28. Jugando a las cartas en una mesa de bar

**Casa y estación** — *vivir*
29. Regando macetas en un patio encalado
30. Leyendo junto a la chimenea con una manta, en invierno
31. Tendiendo ropa de lino al viento
32. Tomando café en la ventana al amanecer
33. Recogiendo aceitunas o higos
34. Durmiendo la siesta en una hamaca

**Noche** — *agenda*
35. Tomando una copa en una cala al anochecer, con farol
36. Mirando las estrellas con un catalejo
37. Volviendo a casa con los zapatos en la mano

> **Acción marcada:** fumar. El dueño la propuso expresamente. Queda en el banco pero
> **señalada como de riesgo**: Meta restringe el alcance de contenido con tabaco y choca con
> el territorio de calma y bienestar de la marca. Recomendación: no usarla en las primeras
> tandas y decidir con datos.

---

## 7. Banco de vestuario

- **Verano:** camisa de lino abierta, pantalón de lino remangado, sombrero panamá, gafas de
  sol de carey, pañuelo al cuello, toalla de lino, vestido camisero, bañador de talle alto.
- **Entretiempo:** chaleco de punto, sahariana de lino, camisa de algodón, pañuelo de seda.
- **Invierno:** jersey grueso color arcilla, abrigo de lana camel, bufanda de lino grueso,
  gorro de punto.
- **Noche:** blazer de lino arrugado, vestido de seda champán, camisa sin corbata.
- **Accesorios:** cesto de mimbre, maleta de cuero, cámara analógica, libro, periódico
  doblado, catalejo, **avarcas menorquinas** (ancla local: tenemos artículo propio sobre ellas).

---

## 8. El modelo de datos de una escena

```
Escena {
  fecha            // AAAA-MM-DD, una por día
  personaje        // migjorn | tramuntana | llevant | ponent
  elementId        // el Reference Element del personaje
  articuloSlug     // artículo publicado al que lleva (decide lugar y estación)
  lugar            // nombre del sitio real
  fotoReferencia   // fichero de public/uploads usado como referencia de lugar
  plano            // 1-12 del banco de planos
  accion           // id del banco de acciones
  vestuario        // prendas + accesorios, coherentes con la estación
  estacion         // primavera | verano | otono | invierno
  captionEs        // pie de foto en español
  captionEn        // pie de foto en inglés (el que se publica: el social va en inglés)
  jobId            // id de la generación en Higgsfield (trazabilidad)
  estado           // propuesta | generada | programada | publicada
}
```

---

## 9. La operativa diaria

**Un post de una imagen al día. Sin carruseles. Sin reels.** La story la republica el dueño a
mano desde la misma imagen (decisión suya, 29-ago-2026).

1. **Planificar** — se construye el banco de escenas a partir de los 83 artículos publicados
   en español, los eventos vigentes de la agenda y el calendario estacional, aplicando las
   reglas de rotación (§4.4).
2. **Producir** — se genera la imagen con `nano_banana_pro` a 4:5 y 2K, pasando el
   `<<<element_id>>>` del personaje y la foto real del lugar como referencia. Se descarga y se
   guarda un sidecar con prompt, `jobId`, lugar y artículo.
3. **Escribir** — pie de foto con la fórmula de voz ya existente (gancho → dato de primera
   mano → CTA de guardado → «enlace en la bio»), validada por `sistema/captions.mjs`. En
   inglés por defecto.
4. **Programar** — se sube a Metricool con autopublicación, según la decisión del 30-jul-2026.
   El derecho de veto del dueño se conserva: puede editar o borrar en Metricool antes de la hora.

**Coste medido:** 2 créditos por imagen a 2K en 4:5 → **~60 créditos/mes**. Saldo actual 5.290
en plan Ultra. El coste no es una restricción de diseño.

---

## 10. Qué se retira y qué se conserva

**Se retira** (se archiva, no se borra — el código sigue en el repo por si se reactiva):
- Carruseles, reels y stories generadas.
- Las composiciones Remotion (`remotion/src/composiciones/`).
- El banco de ideas y el generador de calendario antiguos.
- El gate de resolución de foto (`medidas-imagen.mjs`, `encuadrar.mjs`, `brillo-imagen.mjs`):
  ya no recortamos fotos reales, las generamos a medida.

**Se conserva y se reutiliza:**
- `sistema/captions.mjs` — el validador de voz de marca sigue siendo válido y necesario.
- `integraciones/publicar-metricool.mjs` — la publicación no cambia.
- `sistema/leer-articulos.mjs` — mapear post → artículo sigue siendo el corazón del enlace.
- `sistema/config.mjs` — se reescribe la cadencia; el resto (marca, enlaces, UTM) se mantiene.
- El catálogo de fotos verificadas cambia de papel: deja de ser *material publicable* y pasa a
  ser **banco de referencias de lugar**.

---

## 11. Riesgos declarados

1. **Instagram etiquetará las piezas como generadas con IA.** No es evitable ni se pretende:
   se declara en la bio y se asume.
2. **Ruptura visual con lo publicado.** Los seguidores actuales verán otra cuenta. Mitigación:
   el volumen actual es bajo, y es precisamente el objetivo del dueño.
3. **Riesgo de cansancio.** Mitigado por 4 personajes × 12 planos × 37 acciones × 4 estaciones
   y las reglas de no repetición.
4. **Deriva del personaje.** Mitigado por las marcas de identidad (§3) y por la verificación a
   ojo antes de programar: si la marca no está, la pieza se descarta y se regenera.
5. **El dato deja de estar en la imagen.** Todo el peso informativo pasa al pie de foto. Si el
   pie de foto se descuida, la cuenta se queda en monería sin sustancia. Es el punto más
   frágil del diseño y hay que vigilarlo.

---

## 12. Definición de "hecho" de una pieza

Una imagen está lista para programarse cuando:

1. El personaje es reconocible y **su marca de identidad está presente** (verificado abriendo
   la imagen, no dando el prompt por bueno).
2. El aspecto es fotográfico: cero dibujo, cero render, cero peluche.
3. El sitio de Menorca es reconocible y corresponde al artículo.
4. La acción es humana y creíble dentro de la escena.
5. El vestuario está en paleta y en estación, y no lleva azul.
6. No hay texto, logos, marcas de agua ni personas en el encuadre.
7. El plano no se ha usado en los 7 días anteriores y el artículo no en los 30.
8. El pie de foto aporta un dato de primera mano y pasa el validador de voz.
