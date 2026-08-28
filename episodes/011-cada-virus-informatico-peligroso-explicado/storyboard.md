# ESCENAS — Cada Virus Informático Peligroso Explicado

> 02s ejecuta lo escrito. DENSO: un icono por CADA cosa mencionada, sincronizado a su palabra con ~palabra.
> `CHAP "Nombre" icono` fija el HUD del virus actual.

---

### BEAT 1 · 00:00 · T1
Narración: *"Unas pocas líneas de código. Eso es todo lo que hizo falta para paralizar hospitales, tumbar empresas gigantes y, una vez, para sabotear el programa nuclear de un país entero."*
```
+0.0  ICO  worm-code      @a  ~código   pop
+2.0  ICO  hospital       @b  ~hospitales  pop
+3.4  ICO  factory        @c  ~empresas  pop
+5.0  ICO  nuclear-plant  @b  ~nuclear   pop
+6.4  TXT  "unas líneas de código" @cap  handwrite  md
```

### BEAT 2 · 00:09 · T1
Narración: *"Hoy vas a conocer los virus informáticos más peligrosos de la historia."*
```
+0.0  ICO  virus-skull    @center  pop
+2.2  TXT  "los más peligrosos" @cap  stamp  lg  red
```

### BEAT 3 · 00:15 · T1
Narración: *"Cómo funcionaban, cuánto dinero se llevaron por delante, y cómo pasamos de bromas de estudiantes a auténticas armas de guerra."*
```
+0.0  ICO  hacker         @a  ~cómo     pop
+1.6  ICO  money-burning  @b  ~dinero   pop
+3.2  ICO  student        @c  ~bromas   pop
+4.4  ICO  weapon-war     @c  ~armas    stamp
+5.2  TXT  "de broma a arma de guerra" @cap  handwrite  md
```

### BEAT 4 · 00:22 · T1
Narración: *"Y antes de empezar, una aclaración rápida. Solemos llamar virus a todo, pero no todo es igual."*
```
+0.0  ICO  types-malware  @center  pop
+2.6  TXT  "no todo es igual" @cap  handwrite  md
```

### BEAT 5 · 00:29 · T1
Narración: *"Un virus necesita que abras un archivo para activarse. Un gusano, en cambio, viaja solo, sin que hagas nada. Y un troyano se disfraza de algo bueno para que lo dejes entrar tú mismo."*
```
+0.0  ICO  virus-skull    @a  ~virus    pop
+1.8  ICO  worm-code      @b  ~gusano   pop
+3.6  ICO  types-malware  @c  ~troyano  pop
+4.6  TXT  "virus · gusano · troyano" @cap  handwrite  md
```

### BEAT 6 · 00:39 · T1
Narración: *"Casi todos los monstruos de esta lista son gusanos, por eso se extendieron tan rápido."*
```
+0.0  ICO  worm-code      @left   pop
+1.6  ICO  spread-world   @right  ~extendieron  pop
+2.4  TXT  "GUSANOS que viajan solos" @cap  stamp  md  red
```

### BEAT 7 · 00:45 · T1
Narración: *"Empecemos por el principio de todo. El gusano Morris, mil novecientos ochenta y ocho."*
```
+0.0  CHAP "Gusano Morris (1988)" old-computer
+0.0  ICO  old-computer   @center  slide-l
+3.0  TXT  "Gusano Morris · 1988" @cap  stamp  lg
```

### BEAT 8 · 00:52 · T1
Narración: *"El primero que de verdad importó. Un estudiante de la universidad de Cornell soltó un gusano que infectó unos seis mil ordenadores."*
```
+0.0  ICO  student        @left   ~estudiante  pop
+1.6  IMG  photo-retro-pc @right  ~ordenadores  pop
+3.4  TXT  "6.000 ordenadores" @cap  stamp  lg  red
```

### BEAT 9 · 01:01 · T1
Narración: *"No suena a mucho, pero en aquella época eso era casi el diez por ciento de todo internet."*
```
+0.0  ICO  spread-world   @center  pop
+2.0  TXT  "el 10% de internet" @cap  stamp  lg  red
```

### BEAT 10 · 01:07 · T1
Narración: *"Y lo más curioso es que no pretendía hacer daño. Un simple error de programación hizo que se copiara a sí mismo sin control, saturando cada máquina que tocaba."*
```
+0.0  ICO  worm-code      @left  pop
+2.2  ICO  server-down    @right ~saturando  pop
+3.6  TXT  "un error, no maldad" @cap  handwrite  md
```

### BEAT 11 · 01:16 · T1
Narración: *"Su creador acabó siendo la primera persona condenada bajo la ley de fraude informático de Estados Unidos. Un accidente que escribió historia."*
```
+0.0  ICO  hacker         @center  fade
+3.4  TXT  "1ª condena de la historia" @cap  stamp  md
```

### BEAT 12 · 01:25 · T1
Narración: *"Y que enseñó al mundo una palabra nueva y aterradora: gusano. Un programa que no necesita que hagas nada. Que se copia y viaja solo de ordenador a ordenador."*
```
+0.0  ICO  worm-code      @left  ~gusano  pop
+2.4  ICO  spread-world   @right pop
+3.8  TXT  "GUSANO: viaja solo" @cap  stamp  lg  red
```

### BEAT 13 · 01:35 · T1
Narración: *"Ese concepto va a repetirse en casi toda esta lista."*
```
+0.0  ICO  worm-code      @center  fade
+1.6  TXT  "recuérdalo" @cap  handwrite  md
```

### BEAT 14 · 01:40 · T1
Narración: *"Saltamos once años. Melissa, mil novecientos noventa y nueve."*
```
+0.0  CHAP "Melissa (1999)" floppy-word
+0.0  ICO  floppy-word    @center  slide-l
+2.0  TXT  "Melissa · 1999" @cap  stamp  lg
```

### BEAT 15 · 01:46 · T1
Narración: *"Aquí ya vemos la primera gran táctica que se repetirá siempre. El engaño."*
```
+0.0  ICO  thief          @center  ~engaño  pop
+2.4  TXT  "el ENGAÑO" @cap  stamp  lg  red
```

### BEAT 16 · 01:52 · T1
Narración: *"Melissa llegaba por correo con un documento de Word adjunto. Al abrirlo, el virus cogía tu libreta de direcciones y se reenviaba solo a los primeros cincuenta contactos."*
```
+0.0  ICO  floppy-word    @a  ~correo  pop
+2.4  ICO  inbox-flood    @b  ~libreta  pop
+3.8  TXT  "se reenvía a 50 contactos" @cap  handwrite  md
```

### BEAT 17 · 02:02 · T1
Narración: *"Cincuenta correos por víctima. La cosa crecía tan rápido que tumbó los servidores de correo de empresas enteras."*
```
+0.0  ICO  inbox-flood    @left  pop
+1.8  ICO  server-down    @right ~servidores  pop
+3.0  TXT  "tumbó los servidores" @cap  stamp  md  red
```

### BEAT 18 · 02:09 · T1
Narración: *"Incluida la mismísima Microsoft, que tuvo que apagar su sistema."*
```
+0.0  ICO  server-down    @center  pop
+1.6  TXT  "hasta Microsoft cayó" @cap  stamp  lg  red
```

### BEAT 19 · 02:14 · T1
Narración: *"Y ahora llega una leyenda. ILOVEYOU, año dos mil."*
```
+0.0  CHAP "ILOVEYOU (2000)" love-email
+0.0  ICO  love-email     @center  slide-r
+2.0  TXT  "ILOVEYOU · 2000" @cap  stamp  lg
```

### BEAT 20 · 02:20 · T1
Narración: *"La genialidad estaba en su nombre. Te llegaba un correo con el asunto 'te quiero'. ¿Quién no siente curiosidad por abrir eso?"*
```
+0.0  ICO  love-email     @left  ~correo  pop
+2.8  ICO  click-warning  @right ~abrir  pop
+3.4  TXT  "¿quién no lo abre?" @cap  handwrite  md
```

### BEAT 21 · 02:28 · T1
Narración: *"Millones de personas hicieron clic. Y en cuanto lo hacían, el virus destruía archivos y se reenviaba a toda tu agenda."*
```
+0.0  ICO  click-warning  @left  ~clic  pop
+2.0  ICO  destruction-bomb @right ~destruía  pop
+3.0  TXT  "un clic = desastre" @cap  stamp  md  red
```

### BEAT 22 · 02:36 · T1
Narración: *"Se calcula que infectó unos cuarenta y cinco millones de ordenadores en pocos días."*
```
+0.0  IMG  photo-iloveyou @center  pop
+2.4  TXT  "45 millones de PCs" @cap  stamp  lg  red
```

### BEAT 23 · 02:43 · T1
Narración: *"Y causó entre cinco mil y diez mil millones de dólares en daños."*
```
+0.0  ICO  money-burning  @center  ~dólares  pop
+2.0  TXT  "hasta 10.000 M$" @cap  stamp  lg  red
```

### BEAT 24 · 02:49 · T1
Narración: *"Para que te hagas una idea, ILOVEYOU llegó a saltar dentro del Pentágono, de la CIA y de parlamentos enteros, que tuvieron que apagar sus sistemas de correo para frenarlo."*
```
+0.0  ICO  pentagon       @a  ~pentágono  pop
+2.4  ICO  hacker         @b  ~cia  pop
+4.0  TXT  "Pentágono y CIA cayeron" @cap  handwrite  md
```

### BEAT 25 · 03:00 · T1
Narración: *"Lo más increíble es el final. Sus creadores, dos jóvenes de Filipinas, quedaron completamente impunes."*
```
+0.0  ICO  hacker         @center  fade
+2.6  TXT  "quedaron IMPUNES" @cap  stamp  lg  red
```

### BEAT 26 · 03:07 · T1
Narración: *"¿Por qué? Porque en su país, en aquel momento, no existía ninguna ley que castigase escribir un virus."*
```
+0.0  ICO  virus-skull    @left  fade
+2.4  TXT  "no había ley que lo castigara" @right  handwrite  md
```

### BEAT 27 · 03:15 · T1
Narración: *"Seguimos. Dos mil uno fue un año negro, con dos monstruos. El primero, Code Red."*
```
+0.0  CHAP "Code Red / Nimda (2001)" defaced-web
+0.0  ICO  calendar       @left  ~año  pop
+1.6  ICO  defaced-web    @right ~code  pop
+3.0  TXT  "Code Red · 2001" @cap  stamp  lg
```

### BEAT 28 · 03:22 · T1
Narración: *"Este no robaba, desfiguraba. Entraba en servidores web y cambiaba las páginas por un mensaje suyo."*
```
+0.0  ICO  defaced-web    @center  ~desfiguraba  pop
+2.8  TXT  "desfiguraba webs" @cap  handwrite  md
```

### BEAT 29 · 03:29 · T1
Narración: *"Llegó a lanzar un ataque directo contra la web de la Casa Blanca."*
```
+0.0  ICO  white-house    @center  ~casa  pop
+2.0  TXT  "atacó la Casa Blanca" @cap  stamp  lg  red
```

### BEAT 30 · 03:35 · T1
Narración: *"El segundo, Nimda, fue aún más listo. Se propagaba por cinco vías distintas a la vez. Por correo, por webs infectadas, por redes locales."*
```
+0.0  ICO  worm-code      @a  ~nimda  pop
+2.0  ICO  spread-world   @b  ~propagaba  pop
+3.6  TXT  "Nimda: 5 vías a la vez" @cap  stamp  md  red
```

### BEAT 31 · 03:45 · T1
Narración: *"Batió todos los récords de velocidad. En solo veintidós minutos se convirtió en el malware más extendido de internet."*
```
+0.0  ICO  lightning-speed @left  ~velocidad  pop
+2.4  ICO  spread-world    @right ~extendido  pop
+3.0  TXT  "22 minutos al nº1" @cap  stamp  lg  red
```

### BEAT 32 · 03:53 · T1
Narración: *"Pero el récord absoluto de velocidad tiene nombre. SQL Slammer, dos mil tres."*
```
+0.0  CHAP "SQL Slammer (2003)" tiny-packet
+0.0  ICO  tiny-packet    @center  slide-l
+2.6  TXT  "SQL Slammer · 2003" @cap  stamp  lg
```

### BEAT 33 · 04:00 · T1
Narración: *"Este virus era minúsculo. Cabía entero en un solo paquete de datos de la red. Y esa era su arma."*
```
+0.0  ICO  tiny-packet    @center  ~paquete  pop
+3.0  TXT  "un solo paquete" @cap  handwrite  md
```

### BEAT 34 · 04:07 · T1
Narración: *"Al ser tan pequeño, se movía a una velocidad de locura. Doblaba el número de máquinas infectadas cada ocho segundos y medio."*
```
+0.0  ICO  lightning-speed @left  ~velocidad  pop
+2.4  ICO  spread-world    @right ~doblaba  pop
+3.4  TXT  "x2 cada 8,5 segundos" @cap  stamp  lg  red
```

### BEAT 35 · 04:16 · T1
Narración: *"Léelo otra vez. Cada ocho segundos, el doble."*
```
+0.0  ICO  lightning-speed @center  pop
+1.6  TXT  "el DOBLE, sin parar" @cap  stamp  lg  red
```

### BEAT 36 · 04:21 · T1
Narración: *"En apenas diez minutos, había infectado prácticamente todo lo que era vulnerable en el planeta."*
```
+0.0  ICO  spread-world   @center  ~planeta  pop
+2.6  TXT  "10 minutos = el mundo" @cap  handwrite  md
```

### BEAT 37 · 04:28 · T1
Narración: *"Dejó cajeros automáticos sin servicio, y llegó a afectar a los sistemas de una central nuclear."*
```
+0.0  ICO  atm-down       @left   ~cajeros  pop
+2.6  ICO  nuclear-plant  @right  ~nuclear  pop
+3.4  TXT  "cajeros y una nuclear" @cap  stamp  md  red
```

### BEAT 38 · 04:36 · T1
Narración: *"El siguiente ostenta un récord distinto. El del dinero. Mydoom, dos mil cuatro."*
```
+0.0  CHAP "Mydoom (2004)" email-storm
+0.0  ICO  money-burning  @left  ~dinero  pop
+1.6  ICO  email-storm    @right ~mydoom  pop
+3.0  TXT  "Mydoom · 2004" @cap  stamp  lg
```

### BEAT 39 · 04:43 · T1
Narración: *"Sigue siendo, a día de hoy, el gusano de correo que más rápido se ha propagado jamás."*
```
+0.0  ICO  email-storm    @left  pop
+1.8  ICO  lightning-speed @right ~rápido  pop
+2.6  TXT  "el más rápido de la historia" @cap  handwrite  md
```

### BEAT 40 · 04:50 · T1
Narración: *"En su punto más alto, uno de cada cuatro correos electrónicos enviados en todo el mundo era Mydoom. La cuarta parte de internet."*
```
+0.0  ICO  email-storm    @left  pop
+2.4  ICO  spread-world   @right ~mundo  pop
+3.6  TXT  "1 de cada 4 correos" @cap  stamp  lg  red
```

### BEAT 41 · 05:00 · T1
Narración: *"Sus daños se estiman en treinta y ocho mil millones de dólares. La cifra más alta de toda esta lista."*
```
+0.0  ICO  money-burning  @center  ~dólares  pop
+3.0  TXT  "38.000 M$" @cap  stamp  lg  red
```

### BEAT 42 · 05:08 · T1
Narración: *"Ahora uno inquietante. Conficker, dos mil ocho."*
```
+0.0  CHAP "Conficker (2008)" zombie-pc
+0.0  ICO  zombie-pc      @center  slide-r
+2.0  TXT  "Conficker · 2008" @cap  stamp  lg
```

### BEAT 43 · 05:13 · T1
Narración: *"Este llegó a controlar entre nueve y quince millones de ordenadores, formando un ejército de máquinas zombis a las órdenes de sus creadores."*
```
+0.0  ICO  zombie-pc      @center  ~ejército  pop
+3.8  TXT  "ejército de 15 millones" @cap  stamp  md  red
```

### BEAT 44 · 05:23 · T1
Narración: *"Infectó a la marina francesa y a hospitales británicos."*
```
+0.0  ICO  warship        @left   ~marina  pop
+1.4  ICO  hospital       @right  ~hospitales  pop
+2.2  TXT  "marina y hospitales" @cap  handwrite  md
```

### BEAT 45 · 05:29 · T1
Narración: *"Pero lo que pone los pelos de punta es otra cosa. Que nunca se supo del todo para qué servía."*
```
+0.0  ICO  zombie-pc      @center  fade
+2.8  TXT  "¿para qué? nadie lo supo" @cap  stamp  md  red
```

### BEAT 46 · 05:37 · T1
Narración: *"Tenían un ejército gigantesco esperando órdenes. Y esas órdenes casi nunca llegaron."*
```
+0.0  ICO  zombie-pc      @center  pop
+2.8  TXT  "un ejército que nunca atacó" @cap  handwrite  md
```

### BEAT 47 · 05:44 · T1
Narración: *"Era como si alguien hubiera reclutado al mayor ejército del mundo, lo hubiera dejado firme, y se hubiera marchado."*
```
+0.0  ICO  zombie-pc      @left  fade
+3.0  TXT  "reclutado y abandonado" @right  handwrite  md
```

### BEAT 48 · 05:52 · T1
Narración: *"Los expertos aún debaten si fue un fracaso, una prueba, o algo que nunca llegaron a activar. Y esa incertidumbre, todavía hoy, da más miedo que cualquier ataque."*
```
+0.0  ICO  virus-skull    @center  fade
+4.0  TXT  "el misterio da más miedo" @cap  stamp  md  red
```

### BEAT 49 · 06:02 · T1
Narración: *"Y aquí, en dos mil diez, todo cambia para siempre. Stuxnet."*
```
+0.0  CHAP "Stuxnet (2010)" centrifuge
+0.0  ICO  centrifuge     @center  slide-l
+2.2  TXT  "Stuxnet · 2010" @cap  stamp  lg
```

### BEAT 50 · 06:08 · T1
Narración: *"Hasta ahora hablábamos de estudiantes y ladrones. Esto era otra cosa. Un arma diseñada por gobiernos."*
```
+0.0  ICO  student        @a  ~estudiantes  pop
+1.4  ICO  thief          @b  ~ladrones  pop
+3.0  ICO  weapon-war     @c  ~arma  stamp
+3.6  TXT  "un ARMA de gobiernos" @cap  stamp  lg  red
```

### BEAT 51 · 06:16 · T1
Narración: *"Su único objetivo era una instalación nuclear en Irán. Su misión, sabotear las centrifugadoras que enriquecían uranio."*
```
+0.0  ICO  nuclear-plant  @left  ~nuclear  pop
+2.2  IMG  photo-stuxnet  @right ~centrifugadoras  pop
+3.6  TXT  "centrifugadoras de Irán" @cap  handwrite  md
```

### BEAT 52 · 06:26 · T1
Narración: *"Y lo hizo de una forma diabólica. Ordenaba a las máquinas girar cada vez más rápido, hasta destruirse físicamente."*
```
+0.0  ICO  gear-breaking  @center  ~girar  pop
+3.2  TXT  "girar hasta ROMPERSE" @cap  stamp  lg  red
```

### BEAT 53 · 06:34 · T1
Narración: *"Mientras tanto, mostraba a los operarios lecturas totalmente normales en sus pantallas. Ellos no entendían por qué se rompía todo."*
```
+0.0  ICO  fake-screen    @center  ~pantallas  pop
+3.6  TXT  "'todo normal' en pantalla" @cap  handwrite  md
```

### BEAT 54 · 06:43 · T1
Narración: *"Fue el primer virus de la historia que causó destrucción física en el mundo real."*
```
+0.0  ICO  gear-breaking  @center  ~destrucción  pop
+2.4  TXT  "daño FÍSICO real" @cap  stamp  lg  red
```

### BEAT 55 · 06:50 · T1
Narración: *"Piénsalo. Un archivo, unas líneas de código, capaces de romper máquinas de metal a miles de kilómetros de distancia."*
```
+0.0  ICO  worm-code      @left  ~código  pop
+2.4  ICO  gear-breaking  @right ~romper  pop
+3.2  TXT  "código que rompe metal" @cap  handwrite  md
```

### BEAT 56 · 06:59 · T1
Narración: *"Hasta ese día, un virus solo podía dañar información. A partir de Stuxnet, un virus podía atacar el mundo físico, la electricidad, el agua, las fábricas."*
```
+0.0  ICO  nuclear-plant  @a  ~electricidad  pop
+2.6  ICO  factory        @c  ~fábricas  pop
+3.8  TXT  "ahora ataca el mundo real" @cap  stamp  md  red
```

### BEAT 57 · 07:09 · T1
Narración: *"La ciberguerra acababa de nacer, y ya no habría vuelta atrás."*
```
+0.0  ICO  weapon-war     @center  ~ciberguerra  pop
+2.0  TXT  "nace la CIBERGUERRA" @cap  stamp  lg  red
```

### BEAT 58 · 07:15 · T1
Narración: *"Damos el salto a la era del secuestro. WannaCry, dos mil diecisiete."*
```
+0.0  CHAP "WannaCry (2017)" ransom-lock
+0.0  ICO  ransom-lock    @center  slide-r
+2.6  TXT  "WannaCry · 2017" @cap  stamp  lg
```

### BEAT 59 · 07:22 · T1
Narración: *"Esto es ransomware. La palabra viene de rescate. El virus entraba en tu ordenador, cifraba todos tus archivos con una contraseña imposible, y te pedía dinero para devolvértelos."*
```
+0.0  ICO  ransom-lock    @a  ~ransomware  pop
+3.0  ICO  money-burning  @c  ~dinero  pop
+4.2  TXT  "ransomware = secuestro" @cap  stamp  md  red
```

### BEAT 60 · 07:33 · T1
Narración: *"En un solo fin de semana, cifró doscientos mil ordenadores en ciento cincuenta países."*
```
+0.0  IMG  photo-wannacry @left  pop
+1.8  ICO  spread-world   @right ~países  pop
+3.0  TXT  "200.000 PCs · 150 países" @cap  stamp  lg  red
```

### BEAT 61 · 07:41 · T1
Narración: *"Paralizó el sistema de salud británico entero, obligando a cancelar operaciones y desviar ambulancias."*
```
+0.0  ICO  hospital       @left   ~salud  pop
+2.4  ICO  ambulance      @right  ~ambulancias  pop
+3.0  TXT  "paralizó hospitales" @cap  stamp  lg  red
```

### BEAT 62 · 07:49 · T1
Narración: *"Y el detalle más turbio, la herramienta que usaba para colarse había sido robada, ni más ni menos, que a la agencia de seguridad de Estados Unidos, la NSA."*
```
+0.0  ICO  stolen-key     @center  ~robada  pop
+4.0  TXT  "una llave robada a la NSA" @cap  stamp  md  red
```

### BEAT 63 · 07:59 · T1
Narración: *"Es decir, el propio gobierno había guardado en secreto una llave maestra para entrar en millones de ordenadores. Alguien se la robó. Y la soltó al mundo."*
```
+0.0  ICO  stolen-key     @left  pop
+2.8  ICO  spread-world   @right ~mundo  pop
+3.6  TXT  "la llave se escapó" @cap  handwrite  md
```

### BEAT 64 · 08:09 · T1
Narración: *"Curiosamente, WannaCry se detuvo casi por accidente, cuando un investigador encontró un interruptor oculto en el código y lo activó sin saber muy bien qué hacía."*
```
+0.0  ICO  shield-lock    @center  ~detuvo  pop
+4.2  TXT  "lo paró un interruptor secreto" @cap  handwrite  md
```

### BEAT 65 · 08:20 · T1
Narración: *"Y cerramos con el más caro de todos. NotPetya, también dos mil diecisiete."*
```
+0.0  CHAP "NotPetya (2017)" destruction-bomb
+0.0  ICO  destruction-bomb @center  pop
+3.0  TXT  "NotPetya · 2017" @cap  stamp  lg
```

### BEAT 66 · 08:27 · T1
Narración: *"Este fingía ser un ransomware, te pedía un rescate como WannaCry. Pero era una trampa."*
```
+0.0  ICO  ransom-lock    @left  ~ransomware  pop
+2.6  ICO  thief          @right ~trampa  pop
+3.4  TXT  "fingía pedir rescate" @cap  handwrite  md
```

### BEAT 67 · 08:34 · T1
Narración: *"Aunque pagaras, no había ninguna forma de recuperar tus archivos. No quería dinero. Solo quería destruir."*
```
+0.0  ICO  destruction-bomb @center  ~destruir  pop
+3.0  TXT  "solo quería DESTRUIR" @cap  stamp  lg  red
```

### BEAT 68 · 08:42 · T1
Narración: *"Se coló disfrazado en una actualización de un programa de contabilidad de Ucrania, y desde ahí saltó por todo el mundo."*
```
+0.0  ICO  worm-code      @left  pop
+2.4  ICO  spread-world   @right ~mundo  pop
+3.2  TXT  "por una actualización falsa" @cap  handwrite  md
```

### BEAT 69 · 08:51 · T1
Narración: *"Tumbó a gigantes como la naviera Maersk, la mensajería FedEx y la farmacéutica Merck."*
```
+0.0  IMG  photo-cargo    @left   ~maersk  pop
+2.0  ICO  factory        @right  ~farmacéutica  pop
+3.0  TXT  "Maersk · FedEx · Merck" @cap  stamp  md  red
```

### BEAT 70 · 08:59 · T1
Narración: *"Su factura final supera los diez mil millones de dólares. El malware más costoso jamás creado."*
```
+0.0  ICO  money-burning  @center  ~dólares  pop
+3.0  TXT  "+10.000 M$: el más caro" @cap  stamp  lg  red
```

### BEAT 71 · 09:07 · T1
Narración: *"Y lo más increíble es que la mayoría de sus víctimas ni siquiera eran el objetivo. Solo tuvieron la mala suerte de estar conectadas al sitio equivocado."*
```
+0.0  ICO  virus-skull    @left  fade
+3.6  TXT  "daño colateral masivo" @right  handwrite  md
```

### BEAT 72 · 09:16 · T1
Narración: *"Así que fíjate en la evolución."*
```
+0.0  CHAP ""
+0.0  ICO  hacker         @center  pop
+1.4  TXT  "la evolución" @cap  handwrite  md
```

### BEAT 73 · 09:20 · T5
Narración: *"Empezamos con un accidente de un estudiante. Pasamos por ladrones buscando dinero y fama. Y hemos acabado con armas creadas por gobiernos para la guerra, y con secuestros que paralizan países enteros."*
```
+0.0  ICO  student        @a  ~estudiante  pop
+2.0  ICO  thief          @b  ~ladrones  pop
+2.8  ICO  money-burning  @b  ~dinero  pop
+4.4  ICO  weapon-war     @c  ~armas  stamp
```

### BEAT 74 · 09:31 · T1
Narración: *"Cada uno de estos virus obligó al mundo a protegerse un poco más."*
```
+0.0  ICO  shield-lock    @center  ~protegerse  pop
+2.2  TXT  "nos hicieron protegernos" @cap  handwrite  md
```

### BEAT 75 · 09:37 · T1
Narración: *"Los antivirus, los cortafuegos, esas actualizaciones pesadas que siempre pospones, todo eso nació de las cicatrices que dejaron estos ataques."*
```
+0.0  ICO  shield-lock    @left  ~antivirus  pop
+2.4  ICO  virus-skull    @right ~ataques  pop
+3.6  TXT  "antivirus y cortafuegos" @cap  handwrite  md
```

### BEAT 76 · 09:47 · T1
Narración: *"Y esa es la gran lección. En internet, la mayor puerta de entrada casi nunca es un fallo del ordenador. Eres tú, haciendo clic donde no debes."*
```
+0.0  ICO  click-warning  @center  ~clic  pop
+4.0  TXT  "el fallo eres TÚ" @cap  stamp  lg  red
```

### BEAT 77 · 09:57 · T1
Narración: *"Los virus más devastadores de la historia no rompieron una máquina a la fuerza. Se aprovecharon de la curiosidad, del miedo o de las prisas de una persona normal."*
```
+0.0  ICO  hacker         @center  fade
+3.8  TXT  "curiosidad · miedo · prisas" @cap  handwrite  md
```

### BEAT 78 · 10:07 · T1
Narración: *"La tecnología ha mejorado muchísimo. El punto débil sigue siendo el mismo de siempre: nosotros."*
```
+0.0  ICO  shield-lock    @left  pop
+2.0  ICO  click-warning  @right ~débil  pop
+2.6  TXT  "el punto débil: NOSOTROS" @cap  stamp  lg  red
```

### BEAT 79 · 10:14 · T1
Narración: *"Así que la próxima vez que te llegue un correo raro, un archivo inesperado o un 'te quiero' de un desconocido, ya sabes lo que puede haber detrás."*
```
+0.0  ICO  love-email     @left  ~correo  pop
+2.6  ICO  click-warning  @right ~archivo  pop
+3.4  TXT  "cuidado con ese correo" @cap  stamp  md  red
```

### BEAT 80 · 10:24 · T1
Narración: *"Piénsatelo dos veces antes de hacer clic."*
```
+0.0  ICO  click-warning  @center  ~clic  pop
+1.4  TXT  "piénsalo antes de hacer CLIC" @cap  stamp  lg  red
```
