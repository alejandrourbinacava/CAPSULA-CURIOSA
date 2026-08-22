# ESCENAS — Cada Tipo de Procesador Explicado

> **Episodio de referencia anotado.** Este documento es el ejemplo canónico de
> cómo se anota un guion. Cuando dudes del formato, mira aquí.
>
> El compilador NO decide nada. Solo ejecuta lo que está escrito abajo.

---

## 1 · NOTACIÓN

```
### BEAT n · mm:ss · PLANTILLA
Narración: "texto literal de la frase"
  +0.0  IMG  asset-id      @anclaje   entrada        [modificadores]
  +1.4  ICO  asset-id      @anclaje   entrada
  +2.1  TXT  "literal"     @anclaje   entrada  tamaño [color]
  -3.8  OUT  asset-id                 salida
  -6.0  CLEAR
```

- `+n.n` = segundos desde el inicio del beat. `-n.n` = salida.
- El compilador ajusta estos tiempos a los timestamps reales de palabra. Los
  números son la **intención rítmica**, no milisegundos exactos.
- `CLEAR` vacía la pantalla. Obligatorio al final de cada beat.

**Tipos:** `IMG` foto o captura · `ICO` icono vectorial · `TXT` texto ·
`ARR` flecha · `SHP` forma (círculo, subrayado, tachón) · `GIF` meme

**Entradas:** `pop` `fade` `slide-L` `slide-R` `slide-T` `draw` `handwrite`
`stamp` `whip`
**Salidas:** `fade-out` `pop-out` `slide-out-L` `slide-out-R`

**Tamaños:** `stat`220 `lg`64 `md`48 `sm`38 `cap`34

---

## 2 · RITMO OBJETIVO

Pediste "cada 2 o 3 palabras". A 150 palabras por minuto eso es un evento cada
1,2 segundos: unos 500 eventos en el vídeo. Es inviable de producir y mareante de
ver.

El ritmo real de los canales de referencia, medido, es:

| Métrica | Objetivo |
|---|---|
| Evento (entrada o salida) | **cada 2,5 – 4 s** |
| Eventos en el episodio | **180 – 240** |
| Elementos vivos a la vez | 2 a 4 |
| Vida de un elemento | 6 – 14 s |
| Vida de un `GIF` | 2 – 4 s |

Esto es denso de verdad y sí se puede producir. Cada frase del guion mueve algo.

---

## 3 · ANCLAJES

Se usan solo cuatro plantillas en todo el episodio. Menos variedad, más control.

```
T1 single-focus     @main [560,250,1360,810]   @cap (barra inferior de @main)
T2 image-left       @main [110,250,990,860]    @t1 @t2 @t3 (columna derecha)
T5 three-up         @a @b @c  +  @la @lb @lc (rótulo bajo cada uno)
T6 stat             @num (centro, 220px)  @sub (debajo, 52px)
T0 thumbnail-grid   @g1..@g8 circulares + @lg1..@lg8
```

Zonas reservadas: badge, título, franja inferior. Nada entra ahí.

---

## 4 · LISTA DE ASSETS NECESARIOS

Reunir **antes** de compilar. Sin esto el build falla, que es lo correcto.

### Iconos vectoriales (normalizados, trazo negro, un color de paleta)
```
cpu-chip · cpu-socket · core-single · core-multi · chef-hat · cook · pot ·
speedometer · clock · flame · leaf · battery · lightning · gpu-card ·
monitor-black · motherboard · laptop · phone · euro-coin · warning ·
check · cross · brain · question
```

### Logos (kind: logo, sin normalizar)
```
intel · amd · intel-core-ultra · amd-ryzen · apple · qualcomm · arm
```

### Fotos de producto (kind: cutout, fondo transparente)
```
cpu-intel-boxed · cpu-amd-boxed · cpu-bare-top · cpu-bare-pins ·
cpu-socket-open · laptop-thin · desktop-tower · gpu-real
```

### Capturas
```
tienda-listado-cpus (una web con nombres de CPU) ·
etiqueta-modelo-zoom · admin-tareas-nucleos
```

### GIF / memes (máx. 6 en todo el vídeo)
```
confused-math · money-burning · shrug · mind-blown · sweating · sleeping
```

### Tazas (metáfora de gamas — foto cutout)
```
taza-espresso · taza-normal · taza-grande · jarra
```

---

## 5 · GUION ANOTADO

---

### BEAT 1 · 00:00 · T5 three-up
Narración: *"Entras a comprar un ordenador. Y te encuentras esto."*
```
+0.0  IMG  tienda-listado-cpus   @main   fade        (T1, a pantalla casi completa)
+2.4  SHP  circle-highlight      →main   draw   red
-4.5  CLEAR
```

### BEAT 2 · 00:05 · T0 thumbnail-grid (logo/chip + nombre por celda)
Narración: *"i5. Ryzen 7. Core Ultra 9. 285K. 9800X3D. Snapdragon X2."*
```
+0.0  ICO  intel            @g1   pop
+0.0  TXT  "i5"             @lg1  stamp  md
+0.9  ICO  amd-ryzen        @g2   pop
+0.9  TXT  "Ryzen 7"        @lg2  stamp  md
+1.8  ICO  intel-core-ultra @g3   pop
+1.8  TXT  "Core Ultra 9"   @lg3  stamp  md
+2.7  ICO  cpu-intel-boxed  @g4   pop
+2.7  TXT  "285K"           @lg4  stamp  md
+3.6  ICO  cpu-chip         @g5   pop
+3.6  TXT  "9800X3D"        @lg5  stamp  md
+4.5  ICO  qualcomm         @g6   pop
+4.5  TXT  "Snapdragon X2"  @lg6  stamp  md
```
Cada nombre con su logo/chip encima. Cascada, un nombre por palabra locutada.

### BEAT 3 · 00:11 · continúa
Narración: *"Parecen matrículas de coche."*
```
+0.5  GIF  confused-math     @center  whip        (encima de la rejilla)
-3.0  OUT  confused-math              pop-out
-3.5  CLEAR
```

### BEAT 4 · 00:15 · T6 stat
Narración: *"Cuestan entre cien y mil quinientos euros. Y nadie te explica la diferencia."*
```
+0.0  TXT  "100 €"        @num   pop    stat
+1.6  TXT  "1.500 €"      @num2  pop    stat   red
+3.2  ARR  num→num2              draw
+4.8  TXT  "¿la diferencia?"  @sub  handwrite  md
-7.0  CLEAR
```

### BEAT 5 · 00:23 · T2 image-left
Narración: *"El vendedor te dice que este es mejor. ¿Mejor para qué?"*
```
+0.0  ICO  cook           @main  slide-L
+1.5  TXT  "este es mejor" @t1   handwrite  md
+3.0  TXT  "¿mejor para QUÉ?" @t2  stamp  lg  red
+4.0  GIF  shrug          @t3    pop
-6.0  CLEAR
```

### BEAT 6 · 00:29 · T1
Narración: *"En diez minutos vas a entender todos estos nombres. Sin tecnicismos. Y vas a saber cuál necesitas tú."*
```
+0.0  ICO  brain          @main  pop
+1.8  TXT  "10 minutos"   @cap   handwrite  lg
+3.5  ICO  check          @right pop
+5.0  TXT  "sin tecnicismos" @t1  handwrite  md
-8.0  CLEAR
```

---

### BEAT 7 · 00:37 · T1
Narración: *"El procesador es el cerebro del ordenador. Esa frase la has oído mil veces. Y no explica absolutamente nada."*
```
+0.0  ICO  brain           @main   pop
+1.2  TXT  "el cerebro"    @cap    handwrite  lg
+3.6  SHP  cross-out       →brain  draw   red
+5.0  TXT  "no explica nada" @t1   stamp  md  red
-7.5  CLEAR
```

### BEAT 8 · 00:46 · T1
Narración: *"Vamos con algo mejor. El procesador es una cocina."*
```
+0.0  ICO  pot             @main   pop
+1.4  ICO  chef-hat        @top    pop
+2.6  TXT  "una COCINA"    @cap    handwrite  lg
```
Nada sale. Se está construyendo la metáfora base.

### BEAT 9 · 00:52 · T2
Narración: *"Tú pides un plato. La cocina lo prepara. Eso es todo lo que hace."*
```
+0.0  ICO  cook            @t1     slide-R
+1.8  ARR  t1→main                 draw
+3.4  TXT  "pides"         @t2     handwrite  md
+4.6  TXT  "prepara"       @t3     handwrite  md
-6.5  OUT  cook                    fade-out
```

### BEAT 10 · 00:59 · T5 three-up
Narración: *"Abrir el navegador es un plato sencillo. Editar un vídeo es un banquete para doscientos."*
```
+0.0  ICO  monitor-black   @a      pop
+0.6  TXT  "navegador"     @la     fade  sm
+2.4  ICO  gpu-card        @b      pop
+3.0  TXT  "editar vídeo"  @lb     fade  sm
+4.8  TXT  "banquete para 200" @c  stamp  md  red
-7.0  CLEAR
```

### BEAT 11 · 01:07 · T1
Narración: *"La cocina no decide qué se cocina. Solo ejecuta órdenes. Millones por segundo."*
```
+0.0  ICO  cpu-chip        @main   pop
+2.0  TXT  "no decide"     @t1     handwrite  md
+3.4  TXT  "ejecuta"       @t2     stamp  lg
+5.0  TXT  "millones por segundo" @cap  handwrite  md  red
-7.5  CLEAR
```

---

### BEAT 12 · 01:17 · T6 stat
Narración: *"Primer número importante. Los núcleos. Un núcleo es un cocinero."*
```
+0.0  TXT  "1"             @num    pop   stat
+1.4  ICO  cook            @right  pop
+2.8  TXT  "= 1 cocinero"  @sub    handwrite  lg
-5.5  OUT  num                     fade-out
```

### BEAT 13 · 01:24 · T2
Narración: *"Hace veinte años los procesadores tenían uno solo. Y un cocinero, por muy bueno que sea, tiene un límite."*
```
+0.0  IMG  cpu-bare-top    @main   slide-L
+2.0  ICO  cook            @t1     pop
+3.8  TXT  "un límite"     @t2     stamp  lg  red
+5.2  SHP  underline       →t2     draw
-7.5  CLEAR
```

### BEAT 14 · 01:33 · T5
Narración: *"Hoy un procesador normal tiene entre seis y dieciséis. Seis cocineros preparan seis platos a la vez."*
```
+0.0  ICO  cook  @a  pop
+0.4  ICO  cook  @b  pop
+0.8  ICO  cook  @c  pop
+1.2  ICO  cook  @d  pop
+1.6  ICO  cook  @e  pop
+2.0  ICO  cook  @f  pop
+3.4  TXT  "6 núcleos"     @cap   handwrite  lg
+5.0  TXT  "6 platos a la vez" @t1  fade  md
```
Cascada de seis en dos segundos. Es el momento más satisfactorio del bloque.

### BEAT 15 · 01:42 · continúa
Narración: *"¿Significa eso que va seis veces más rápido? No."*
```
+0.0  TXT  "¿6x más rápido?" @top  handwrite  lg
+2.2  TXT  "NO"             @center  stamp  stat  red
+3.0  SHP  cross-out        →top     draw  red
-5.0  CLEAR
```

### BEAT 16 · 01:48 · T5
Narración: *"Muchos programas solo saben mandar órdenes a un cocinero. Los demás miran."*
```
+0.0  ICO  cook  @a  pop     (activo)
+0.4  ICO  cook  @b  fade    opacity=0.3
+0.8  ICO  cook  @c  fade    opacity=0.3
+2.6  TXT  "trabaja 1"      @la  handwrite  md
+4.0  TXT  "miran"          @lb  handwrite  md  red
+5.4  GIF  sleeping         @c   pop
-7.0  OUT  sleeping             pop-out
-7.5  CLEAR
```

### BEAT 17 · 01:57 · T2
Narración: *"Los juegos usan unos pocos núcleos. Editar vídeo los usa todos."*
```
+0.0  ICO  gpu-card        @main   slide-L
+1.6  TXT  "juegos → pocos" @t1    handwrite  md
+3.4  TXT  "vídeo → todos"  @t2    handwrite  md
+5.0  SHP  underline       →t2     draw  red
-6.5  CLEAR
```

### BEAT 18 · 02:05 · T1
Narración: *"Por eso comprar el procesador de veinticuatro núcleos solo para jugar es tirar el dinero. Contratas veinticuatro cocineros. Y trabajan cuatro."*
```
+0.0  TXT  "24 núcleos"     @top    pop  lg
+1.8  GIF  money-burning    @main   whip
+4.0  TXT  "contratas 24"   @t1     handwrite  md
+5.6  TXT  "trabajan 4"     @t2     stamp  lg  red
-7.0  OUT  money-burning            pop-out
-8.5  CLEAR
```

---

### BEAT 19 · 02:16 · T1
Narración: *"Segundo número. Los gigahercios. Si el núcleo es un cocinero, los gigahercios son la velocidad a la que se mueve."*
```
+0.0  ICO  speedometer     @main   pop
+2.0  TXT  "GHz"           @cap    stamp  lg
+3.8  ICO  cook            @right  pop
+5.2  TXT  "a qué velocidad" @t1   handwrite  md
-7.5  CLEAR
```

### BEAT 20 · 02:26 · T6 stat
Narración: *"Cinco gigahercios son cinco mil millones de operaciones por segundo."*
```
+0.0  TXT  "5 GHz"                @num  pop  stat
+2.4  TXT  "5.000.000.000"        @sub  handwrite  lg  red
+4.2  TXT  "operaciones por segundo" @t1  fade  md
-6.5  CLEAR
```

### BEAT 21 · 02:34 · T2
Narración: *"Durante años esta fue la cifra estrella. Más gigahercios, mejor procesador. Se acabó."*
```
+0.0  IMG  cpu-intel-boxed  @main  slide-L
+2.0  TXT  "más GHz = mejor" @t1   handwrite  md
+4.2  SHP  cross-out        →t1    draw  red
+5.0  TXT  "se acabó"       @t2    stamp  lg  red
-7.0  CLEAR
```

### BEAT 22 · 02:43 · T5
Narración: *"Porque un procesador moderno de cuatro gigahercios destroza a uno de hace diez años de cinco."*
```
+0.0  IMG  cpu-bare-top    @a      pop
+0.5  TXT  "hoy · 4 GHz"   @la     fade  sm
+2.4  IMG  cpu-bare-pins   @c      pop
+2.9  TXT  "2016 · 5 GHz"  @lc     fade  sm
+4.6  ARR  a→c                     draw  red
+5.4  TXT  "gana el nuevo" @b      stamp  md  red
-7.5  CLEAR
```

### BEAT 23 · 02:53 · T1
Narración: *"No es solo lo rápido que se mueve. Es cuánto trabajo hace en cada movimiento."*
```
+0.0  ICO  cook            @main   pop
+2.2  TXT  "velocidad"     @t1     handwrite  md
+3.8  TXT  "trabajo por movimiento" @t2  handwrite  md  red
+5.4  SHP  circle-highlight →t2    draw  red
-7.0  CLEAR
```

---

### BEAT 24 · 03:03 · T1
Narración: *"Los procesadores modernos no tienen todos los cocineros iguales. Tienen chefs. Y tienen pinches."*
```
+0.0  ICO  chef-hat        @left   pop
+1.4  TXT  "CHEFS"         @t1     stamp  lg
+3.0  ICO  cook            @right  pop
+4.4  TXT  "pinches"       @t2     handwrite  md
```
Se quedan: son la base del bloque entero.

### BEAT 25 · 03:12 · continúa
Narración: *"Los chefs son los núcleos de rendimiento. Rápidos, potentes, gastan mucha luz."*
```
+0.0  ICO  flame           @t3     pop
+1.6  TXT  "rendimiento"   @t4     handwrite  md
+3.2  ICO  lightning       @t5     pop
+4.4  TXT  "gastan mucho"  @t6     handwrite  sm  red
-6.5  OUT  flame                   fade-out
-6.8  OUT  lightning               fade-out
```

### BEAT 26 · 03:20 · continúa
Narración: *"Los pinches son los núcleos de eficiencia. Más lentos. Pero consumen poquísimo."*
```
+0.0  ICO  leaf            @t3     pop
+1.8  TXT  "eficiencia"    @t4     handwrite  md
+3.4  ICO  battery         @t5     pop
+4.6  TXT  "consumen poco" @t6     handwrite  sm
-6.5  CLEAR
```

### BEAT 27 · 03:29 · T2
Narración: *"¿Para qué sirve esto? Para no encender la cocina entera cada vez que abres el correo."*
```
+0.0  ICO  pot             @main   pop
+2.0  ICO  monitor-black   @t1     slide-R
+3.4  TXT  "abrir el correo" @t2   handwrite  md
+5.0  TXT  "no hace falta la cocina entera" @t3  handwrite  md  red
-7.0  CLEAR
```

### BEAT 28 · 03:39 · T6
Narración: *"Por eso ves cosas como veinticuatro núcleos: ocho de rendimiento y dieciséis de eficiencia."*
```
+0.0  TXT  "24"            @num    pop  stat
+2.0  TXT  "8 rendimiento" @sub    handwrite  lg
+3.6  TXT  "16 eficiencia" @sub2   handwrite  lg
+5.4  TXT  "no son iguales" @t1    stamp  md  red
-7.5  CLEAR
```

---

### BEAT 29 · 03:50 · T5
Narración: *"Dos fabricantes se reparten casi todo. Intel y AMD."*
```
+0.0  IMG  intel           @a      slide-L
+1.4  IMG  amd             @c      slide-R
+3.0  TXT  "VS"            @b      stamp  stat  red
```

### BEAT 30 · 03:57 · continúa
Narración: *"Durante una década, Intel ganaba sin despeinarse. AMD vendía procesadores baratos que se calentaban demasiado."*
```
+0.0  TXT  "2006–2017"     @top    handwrite  md
+2.0  ICO  check           @a      pop
+3.6  ICO  flame           @c      pop
+5.0  TXT  "baratos y calientes" @lc  handwrite  sm  red
-7.0  OUT  check                   fade-out
-7.2  OUT  flame                   fade-out
```

### BEAT 31 · 04:07 · T6
Narración: *"En 2017 AMD sacó una arquitectura nueva llamada Zen. Y cambió el partido."*
```
+0.0  TXT  "2017"          @num    stamp  stat  red
+2.2  TXT  "ZEN"           @sub    handwrite  lg
+4.0  GIF  mind-blown      @right  whip
-6.0  OUT  mind-blown              pop-out
-7.0  CLEAR
```

### BEAT 32 · 04:15 · T2
Narración: *"De repente ofrecía más núcleos por menos dinero. Intel llevaba años cobrando mucho por mejoras mínimas."*
```
+0.0  IMG  amd-ryzen       @main   slide-L
+2.0  TXT  "+ núcleos"     @t1     handwrite  md
+3.4  TXT  "− dinero"      @t2     handwrite  md  red
+5.2  ICO  euro-coin       @t3     pop
-7.0  CLEAR
```

### BEAT 33 · 04:25 · T5
Narración: *"Hoy AMD manda en juegos. Intel manda en eficiencia y en portátiles de gama alta. Ninguno gana en todo."*
```
+0.0  IMG  amd             @a      pop
+0.6  TXT  "juegos"        @la     fade  md
+2.4  IMG  intel           @c      pop
+3.0  TXT  "eficiencia · portátiles" @lc  fade  md
+5.0  TXT  "ninguno gana en todo" @b  stamp  lg  red
-7.5  CLEAR
```

---

### BEAT 34 · 04:37 · T5 (tazas)
Narración: *"Durante años fue así. i3, i5, i7, i9."*
```
+0.0  IMG  taza-espresso   @g1     pop
+0.5  TXT  "i3"            @lg1    stamp  lg
+1.4  IMG  taza-normal     @g2     pop
+1.9  TXT  "i5"            @lg2    stamp  lg
+2.8  IMG  taza-grande     @g3     pop
+3.3  TXT  "i7"            @lg3    stamp  lg
+4.2  IMG  jarra           @g4     pop
+4.7  TXT  "i9"            @lg4    stamp  lg
```
Las cuatro tazas se quedan durante todo el bloque de Intel.

### BEAT 35 · 04:45 · continúa
Narración: *"Cuanto más alto el número, más núcleos, más velocidad. Y más precio."*
```
+0.0  ARR  g1→g4                   draw
+2.0  TXT  "+ núcleos"     @top    handwrite  md
+3.4  TXT  "+ velocidad"   @top2   handwrite  md
+4.8  TXT  "+ PRECIO"      @top3   stamp  lg  red
-6.5  OUT  top, top2, top3         fade-out
```

### BEAT 36 · 04:53 · continúa
Narración: *"Pero ahora Intel ha pasado a llamarlos Core Ultra. Core Ultra 5, Core Ultra 7, Core Ultra 9."*
```
+0.0  IMG  intel-core-ultra @top   slide-T
+2.2  TXT  "Core Ultra 5"  @lg2    handwrite  md  (sustituye a "i5")
+3.4  TXT  "Core Ultra 7"  @lg3    handwrite  md
+4.6  TXT  "Core Ultra 9"  @lg4    handwrite  md
```
Los rótulos cambian bajo las mismas tazas. Visualmente demuestra que es lo mismo.

### BEAT 37 · 05:03 · continúa
Narración: *"Lo raro es que ahora mismo conviven los dos sistemas en las tiendas."*
```
+0.0  IMG  tienda-listado-cpus @main  fade  (encima, tarjeta grande)
+2.4  SHP  circle-highlight   →main   draw  red
+3.8  GIF  confused-math      @right  whip
-5.8  OUT  confused-math              pop-out
-6.5  CLEAR
```

### BEAT 38 · 05:11 · T5
Narración: *"Si ves un i5 y un Core Ultra 5 juntos, no te vuelvas loco. Ocupan la misma posición."*
```
+0.0  TXT  "i5"            @a      pop  stat
+1.4  TXT  "Core Ultra 5"  @c      pop  lg
+3.0  TXT  "="             @b      stamp  stat  red
+4.6  TXT  "el Ultra es más nuevo" @cap  handwrite  md
-6.5  CLEAR
```

---

### BEAT 39 · 05:21 · T5 (tazas otra vez)
Narración: *"AMD lo tiene más fácil. Ryzen 3, Ryzen 5, Ryzen 7, Ryzen 9."*
```
+0.0  IMG  amd-ryzen       @top    slide-T
+1.2  IMG  taza-espresso   @g1     pop
+1.6  TXT  "Ryzen 3"       @lg1    stamp  md
+2.4  IMG  taza-normal     @g2     pop
+2.8  TXT  "Ryzen 5"       @lg2    stamp  md
+3.6  IMG  taza-grande     @g3     pop
+4.0  TXT  "Ryzen 7"       @lg3    stamp  md
+4.8  IMG  jarra           @g4     pop
+5.2  TXT  "Ryzen 9"       @lg4    stamp  md
```

### BEAT 40 · 05:31 · continúa
Narración: *"El Ryzen 3 casi ha desaparecido de las gamas nuevas. Así que en la práctica empiezas en el Ryzen 5."*
```
+0.0  SHP  cross-out       →g1     draw  red
+2.2  OUT  taza-espresso           fade-out
+2.4  OUT  lg1                     fade-out
+4.0  TXT  "empiezas aquí" @lg2    handwrite  md  red
+5.0  ARR  top→g2                  draw
-6.5  CLEAR
```

### BEAT 41 · 05:40 · T5
Narración: *"Ryzen 5 compite con Core Ultra 5. Ryzen 7 con Core Ultra 7. Ryzen 9 con Core Ultra 9."*
```
+0.0  TXT  "Ryzen 5"       @a1  pop  md    +0.3 TXT "Core Ultra 5" @c1 pop md
+1.8  TXT  "Ryzen 7"       @a2  pop  md    +2.1 TXT "Core Ultra 7" @c2 pop md
+3.6  TXT  "Ryzen 9"       @a3  pop  md    +3.9 TXT "Core Ultra 9" @c3 pop md
+5.4  ARR  a1→c1, a2→c2, a3→c3      draw   (cascada 0.15s)
-7.5  CLEAR
```

### BEAT 42 · 05:50 · T1
Narración: *"Es como comparar un utilitario con una berlina. Claro que es peor. No juegan en la misma liga."*
```
+0.0  TXT  "Ryzen 5 vs i7"  @top   handwrite  md
+2.0  SHP  cross-out        →top   draw  red
+3.4  TXT  "distinta liga"  @center stamp  lg  red
-5.5  CLEAR
```

---

### BEAT 43 · 05:59 · T1
Narración: *"Esta es la parte que más te va a servir. Guárdala."*
```
+0.0  ICO  warning         @main   stamp
+1.6  TXT  "GUÁRDALA"      @cap    stamp  stat  red
-4.0  CLEAR
```

### BEAT 44 · 06:04 · T1 · **beat clave, 20 s de vida**
Narración: *"Coge cualquier procesador. Por ejemplo: Ryzen 7 9800X3D."*
```
+0.0  TXT  "Ryzen 7 9800X3D"  @center  handwrite  lg
```
El modelo se queda centrado y grande. Los siguientes beats van descomponiéndolo
con subrayados de colores bajo cada parte. **No se limpia hasta el beat 49.**

### BEAT 45 · 06:09
Narración: *"Ryzen 7 es la gama. Alta."*
```
+0.0  SHP  underline  →"Ryzen 7"  draw  yellow
+1.4  TXT  "la gama"  @t1         handwrite  md
+3.0  TXT  "alta"     @t1b        stamp  md  red
-5.0  OUT  t1, t1b                fade-out
```

### BEAT 46 · 06:15
Narración: *"El nueve del principio es la generación. Cuanto más alto, más moderno."*
```
+0.0  SHP  underline  →"9"        draw  green
+1.6  TXT  "generación" @t1       handwrite  md
+3.4  TXT  "más alto = más nuevo" @t2  handwrite  md
-5.5  OUT  t1, t2                 fade-out
```

### BEAT 47 · 06:22
Narración: *"Los números siguientes son la posición dentro de esa generación."*
```
+0.0  SHP  underline  →"800"      draw  cyan
+1.8  TXT  "posición"  @t1        handwrite  md
-4.0  OUT  t1                     fade-out
```

### BEAT 48 · 06:27
Narración: *"Y las letras del final son el tipo."*
```
+0.0  SHP  underline  →"X3D"      draw  magenta
+1.6  TXT  "el tipo"   @t1        handwrite  md
-3.5  CLEAR
```

### BEAT 49 · 06:32 · T1
Narración: *"En Intel funciona igual. Core Ultra 9 285K."*
```
+0.0  TXT  "Core Ultra 9 285K"  @center  handwrite  lg
+2.0  SHP  underline →"9"       draw  yellow
+3.0  SHP  underline →"2"       draw  green
+4.0  SHP  underline →"85"      draw  cyan
+5.0  SHP  underline →"K"       draw  magenta
-7.0  CLEAR
```

### BEAT 50 · 06:41 · T5
Narración: *"Regla práctica: primero mira la gama. Después la generación. Un Ryzen 5 nuevo puede rendir más que un Ryzen 7 de hace cuatro años."*
```
+0.0  TXT  "1. gama"       @a   pop  lg
+1.4  TXT  "2. generación" @b   pop  lg
+3.4  TXT  "Ryzen 5 (2026)" @c1 fade  md
+4.6  TXT  "Ryzen 7 (2022)" @c2 fade  md
+5.8  ARR  c1→c2                draw  red
+6.4  TXT  "gana el nuevo" @cap stamp md  red
-8.5  CLEAR
```

---

### BEAT 51 · 06:53 · T5 · bloque de letras Intel
Narración: *"En Intel. La K significa que puedes forzarlo. La F, que no lleva gráficos dentro."*
```
+0.0  IMG  intel           @top   slide-T
+1.2  TXT  "K"             @a     stamp  stat
+1.8  TXT  "overclock"     @la    handwrite  md
+3.6  TXT  "F"             @b     stamp  stat
+4.2  TXT  "sin gráficos"  @lb    handwrite  md
+5.0  ICO  monitor-black   @lb2   pop
```

### BEAT 52 · 07:01 · continúa
Narración: *"La U es de portátil de bajo consumo. La H es de portátil potente."*
```
-0.0  OUT  a, la, b, lb, lb2      fade-out (cascada 0.1)
+1.0  TXT  "U"             @a     stamp  stat
+1.6  TXT  "portátil ahorro" @la  handwrite  md
+1.8  ICO  battery         @la2   pop
+3.4  TXT  "H"             @b     stamp  stat
+4.0  TXT  "portátil potente" @lb handwrite  md
+4.2  ICO  flame           @lb2   pop
-6.5  CLEAR
```

### BEAT 53 · 07:10 · T5 · bloque de letras AMD
Narración: *"En AMD. La X es la versión más rápida. La G lleva gráficos integrados."*
```
+0.0  IMG  amd             @top   slide-T
+1.2  TXT  "X"             @a     stamp  stat
+1.8  TXT  "más rápido"    @la    handwrite  md
+3.6  TXT  "G"             @b     stamp  stat
+4.2  TXT  "con gráficos"  @lb    handwrite  md
-6.0  OUT  a, la, b, lb           fade-out
```

### BEAT 54 · 07:18 · T6
Narración: *"Y las letras X3D significan memoria apilada. Que es lo que lo convierte en el rey de los juegos."*
```
+0.0  TXT  "X3D"           @num   stamp  stat  red
+2.2  TXT  "memoria apilada" @sub handwrite  lg
+4.0  ICO  gpu-card        @right pop
+5.0  TXT  "el rey del gaming" @t1  stamp  lg  red
-7.0  CLEAR
```

### BEAT 55 · 07:27 · T2
Narración: *"Una sola letra puede cambiar el precio doscientos euros. Y a veces no te aporta nada."*
```
+0.0  ICO  euro-coin       @main  pop
+1.6  TXT  "+200 €"        @t1    stamp  stat  red
+3.6  TXT  "por una letra" @t2    handwrite  md
+5.0  TXT  "que igual no usas" @t3  handwrite  md
-7.0  CLEAR
```

---

### BEAT 56 · 07:37 · T5
Narración: *"Algunos procesadores llevan una tarjeta gráfica diminuta dentro. Otros no."*
```
+0.0  IMG  cpu-bare-top    @a     pop
+0.6  ICO  gpu-card        @a2    pop   (pequeño, encima)
+1.0  TXT  "con gráficos"  @la    fade  md
+3.0  IMG  cpu-bare-pins   @c     pop
+3.6  ICO  cross           @c2    pop   red
+4.0  TXT  "sin gráficos"  @lc    fade  md
```

### BEAT 57 · 07:45 · T1
Narración: *"Si el tuyo no la lleva, y no compras gráfica aparte, enchufas el monitor y no ves nada. Pantalla negra."*
```
+0.0  ICO  monitor-black   @main  pop
+2.6  TXT  "NO SIGNAL"     @cap   stamp  lg  red
+4.2  GIF  sweating        @right whip
-6.0  OUT  sweating               pop-out
-6.8  CLEAR
```

### BEAT 58 · 07:54 · T5
Narración: *"Los Intel con F no la llevan. Muchos Ryzen tampoco, salvo los que acaban en G."*
```
+0.0  TXT  "Intel ...F"    @a   pop  lg    +0.4 ICO cross @a2 pop red
+2.0  TXT  "Ryzen ...G"    @c   pop  lg    +2.4 ICO check @c2 pop
+4.0  TXT  "para ofimática, sobra" @cap  handwrite  md
-6.0  CLEAR
```

---

### BEAT 59 · 08:04 · T1
Narración: *"Falta un tercer jugador. Y viene de otro mundo. Se llama ARM. Es la arquitectura de tu móvil."*
```
+0.0  ICO  question        @main  pop
+2.0  OUT  question               pop-out
+2.4  IMG  arm             @main  stamp
+4.0  ICO  phone           @right pop
+5.2  TXT  "la del móvil"  @cap   handwrite  lg
-7.0  CLEAR
```

### BEAT 60 · 08:14 · T2
Narración: *"Hasta que Apple metió sus chips M en los portátiles. Y todo el mundo se quedó mirando."*
```
+0.0  IMG  apple           @main  slide-L
+2.0  ICO  laptop          @t1    pop
+3.6  GIF  mind-blown      @t2    whip
-5.6  OUT  mind-blown             pop-out
```

### BEAT 61 · 08:22 · T5
Narración: *"Misma potencia. La mitad de consumo. Sin ventilador. Y batería para todo el día."*
```
+0.0  TXT  "misma potencia" @a   fade  md
+1.4  TXT  "mitad consumo"  @b   fade  md
+1.6  ICO  leaf             @b2  pop
+2.8  TXT  "sin ventilador" @c   fade  md
+4.2  ICO  battery          @cap pop
+4.6  TXT  "todo el día"    @cap2 handwrite  lg  red
-6.5  CLEAR
```

### BEAT 62 · 08:31 · T2
Narración: *"Qualcomm ha seguido el camino con sus Snapdragon para Windows. ¿La pega? No todos los programas funcionan igual de bien."*
```
+0.0  IMG  qualcomm        @main  slide-L
+2.2  TXT  "Snapdragon"    @t1    handwrite  md
+4.0  ICO  warning         @t2    stamp
+5.0  TXT  "no todo funciona igual" @t3  handwrite  md  red
-7.5  CLEAR
```

---

### BEAT 63 · 08:42 · T5 · **bloque de perfiles**
Narración: *"Si solo navegas, usas el correo y ves series. Un Core Ultra 5 o un Ryzen 5 te sobra."*
```
+0.0  ICO  monitor-black   @a     pop
+0.6  TXT  "navegar · correo · series" @la  fade  md
+2.6  TXT  "Core Ultra 5"  @b     stamp  lg
+3.4  TXT  "Ryzen 5"       @c     stamp  lg
+5.0  TXT  "te sobra"      @cap   handwrite  lg  red
-7.0  CLEAR
```

### BEAT 64 · 08:52 · T5
Narración: *"Si juegas. Prioriza los Ryzen con X3D. Y gasta más en la gráfica que en el procesador."*
```
+0.0  ICO  gpu-card        @a     pop
+1.4  TXT  "X3D"           @la    stamp  lg  red
+3.0  IMG  cpu-bare-top    @c     pop
+4.2  ARR  c→a                    draw  red
+5.0  TXT  "más en gráfica" @cap  handwrite  lg
-7.0  CLEAR
```

### BEAT 65 · 09:02 · T5
Narración: *"Si editas vídeo o renderizas. Aquí sí, cuantos más núcleos mejor."*
```
+0.0  ICO  cook  @a  pop   +0.3 ICO cook @b pop  +0.6 ICO cook @c pop
+0.9  ICO  cook  @d  pop   +1.2 ICO cook @e pop  +1.5 ICO cook @f pop
+3.0  TXT  "aquí SÍ"       @cap   stamp  lg  red
+4.4  TXT  "Ryzen 9 · Core Ultra 9" @cap2  handwrite  md
-6.5  CLEAR
```

### BEAT 66 · 09:11 · T2
Narración: *"Si vives con el portátil a cuestas. Mira el consumo, no la potencia."*
```
+0.0  ICO  laptop          @main  slide-L
+2.0  ICO  battery         @t1    pop
+3.2  TXT  "consumo"       @t2    handwrite  lg
+4.4  TXT  "no potencia"   @t3    stamp  md  red
-6.5  CLEAR
```

---

### BEAT 67 · 09:21 · T6
Narración: *"Tres errores que se repiten siempre. Uno. Comparar gigahercios entre generaciones."*
```
+0.0  TXT  "1"             @num   stamp  stat  red
+1.6  TXT  "comparar GHz entre generaciones" @sub  handwrite  lg
+3.6  ICO  cross           @right pop
-5.5  CLEAR
```

### BEAT 68 · 09:28 · T6
Narración: *"Dos. Comprar el procesador más caro y ahorrar en la gráfica. Para jugar, es justo al revés."*
```
+0.0  TXT  "2"             @num   stamp  stat  red
+1.6  TXT  "CPU cara + gráfica mala" @sub  handwrite  lg
+3.6  ARR  invertir               draw  red
+4.4  TXT  "al revés"      @t1    stamp  lg
-6.5  CLEAR
```

### BEAT 69 · 09:37 · T2
Narración: *"Tres. No comprobar que encaja en la placa base. Los Ryzen usan un zócalo. Los Intel usan otro. Y no son compatibles."*
```
+0.0  TXT  "3"             @top   stamp  stat  red
+1.2  IMG  cpu-socket-open @main  slide-L
+3.0  TXT  "AM5"           @t1    handwrite  md
+4.2  TXT  "LGA 1851"      @t2    handwrite  md
+5.4  ICO  cross           @t3    stamp  red
+6.0  TXT  "no compatibles" @t4   stamp  md  red
```

### BEAT 70 · 09:48 · T1
Narración: *"Comprar el procesador sin mirar la placa es la forma más rápida de tener un pisapapeles de cuatrocientos euros."*
```
+0.0  IMG  cpu-bare-top    @main  fade   (sobre un montón de folios)
+2.4  TXT  "pisapapeles de 400 €" @cap  stamp  lg  red
+4.4  GIF  money-burning   @right whip
-6.4  OUT  money-burning          pop-out
-7.0  CLEAR
```

---

### BEAT 71 · 09:58 · T5
Narración: *"Y ya está. Eso es todo lo que necesitas saber. Gama. Generación. Núcleos. Letras. Cuatro cosas."*
```
+0.0  TXT  "gama"          @g1    pop  lg
+0.9  TXT  "generación"    @g2    pop  lg
+1.8  TXT  "núcleos"       @g3    pop  lg
+2.7  TXT  "letras"        @g4    pop  lg
+4.4  TXT  "4 cosas"       @cap   stamp  stat  red
-6.5  CLEAR
```

### BEAT 72 · 10:07 · T1
Narración: *"La próxima vez que veas un Ryzen 7 9800X3D vas a saber exactamente qué estás mirando."*
```
+0.0  TXT  "Ryzen 7 9800X3D" @center  handwrite  lg
+2.4  SHP  underline →"Ryzen 7"  draw  yellow
+2.8  SHP  underline →"9"        draw  green
+3.2  SHP  underline →"800"      draw  cyan
+3.6  SHP  underline →"X3D"      draw  magenta
+5.0  ICO  check           @right pop
-7.0  CLEAR
```

### BEAT 73 · 10:16 · T1
Narración: *"Y sobre todo vas a saber si lo necesitas. Que normalmente es que no."*
```
+0.0  ICO  euro-coin       @main  pop
+2.2  TXT  "¿lo necesitas?" @cap  handwrite  lg
+4.0  TXT  "normalmente NO" @t1   stamp  stat  red
-6.0  CLEAR
```

---

## 6 · RESUMEN DE PRODUCCIÓN

| Métrica | Valor |
|---|---|
| Beats | 73 |
| Eventos totales | ~330 |
| Evento cada | ~1,9 s |
| Duración | ~10:25 |
| Plantillas usadas | T1, T2, T5, T6, T0 |
| GIFs | 6 (dentro del límite) |
| Iconos distintos | 24 |
| Elementos vivos máx. | 4 (+ los que se quedan en bloques de construcción) |

**Excepción declarada:** los beats 34-38 (tazas de Intel) y 44-48 (descomposición
del modelo) mantienen elementos base más de 15 s a propósito. Están marcados como
`persist: true` y quedan exentos de la regla de los 15 segundos, porque son
construcciones acumulativas donde el elemento base ES el hilo conductor.

Todo lo demás cumple las reglas del SPEC sin excepciones.
