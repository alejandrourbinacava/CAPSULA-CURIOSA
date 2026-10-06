// Genera el storyboard del 025 (beats 110+) en la gramática de escenas, y añade los doodles nuevos a assets.json.
// Cada beat: s = primeras palabras (en el guion, en orden), t = plantilla [+variantes], n = nodos [asset, rótulo, palabra~], chap, stat
import fs from "node:fs";
const DIR = "episodes/025-cada-civilizacion-del-universo";

// ---------- doodles NUEVOS (id → descripción en inglés para gpt-image) ----------
const NEW = {
  "wood-logs": "a pile of burning wooden logs with flames",
  "coal-lump": "a big black lump of coal with smoke rising",
  "oil-barrel": "an oil barrel with a black oil drop and a small oil pump",
  "gas-flame": "a blue natural gas burner flame on a pipe",
  "plunder-planet": "a small planet being looted and drained, tiny people with pickaxes and buckets digging at it, cracks and holes",
  "human-crowd": "a crowd of tiny diverse humans standing together looking up, representing humanity",
  "meter-07": "a progress gauge dial showing 0.7 out of 1, needle at seventy percent, almost full but not quite",
  "energy-capture": "a planet surrounded by solar panels and energy collectors catching all the light of its sun",
  "planet-control": "two giant hands holding a small planet with control sliders and dials around it",
  "wind-turbine": "a white wind turbine on a green hill with wind lines",
  "engineer-fix": "a cheerful engineer in a hard hat easily fixing a small hurricane with a wrench, treating it as a simple engineering job",
  "infrared-star": "a star glowing with strange red infrared rings being scanned by a telescope",
  "colonize-galaxy": "a spiral galaxy with many tiny glowing flags and colony dots spreading across all its arms",
  "pure-energy-being": "a glowing humanoid being made of pure blue-white energy light",
  "cant-comprehend": "a confused caveman scratching his head looking at an advanced glowing spaceship",
  "theory-chalkboard": "a scientist pointing at a chalkboard full of theoretical equations and a question mark",
  "bubble-universes": "many soap-bubble universes floating, each containing a tiny galaxy, a hand reaching to hold them",
  "create-reality": "a glowing hand creating a new planet and stars out of light sparks",
  "destroy-reality": "a hand crushing a planet into dust and cracks, explosion of fragments",
  "ancient-universe": "an ancient hourglass with a galaxy inside and fourteen billion years symbolized by a long cosmic timeline",
  "radio-signals": "a radio antenna dish receiving colorful sound waves and signal pulses from space",
  "teeming-universe": "the universe full of life, many planets each with small life, plants and creatures, cheerful and crowded",
  "answers-doors": "five different doors in a row each with a question mark glowing, mystery choices",
  "barrier-wall": "a huge stone wall barrier blocking a road with a tiny rocket in front of it",
  "civilizations-fall": "many tiny civilizations cities collapsing and falling one after another like dominoes",
  "filter-behind": "a person looking back over their shoulder at a wall they have already passed, relieved",
  "nuclear-bomb": "a nuclear bomb mushroom cloud explosion over a small city",
  "planet-wrecked": "a polluted dying planet with smoke stacks, dry cracked ground and a gloomy sky",
  "civ-boom": "a futuristic city exploding in a fireball, self-destruction",
  "danger-tightrope": "a tiny human balancing on a thin tightrope over a dark deep abyss",
  "sprout-life": "a tiny green sprout growing on a small planet just starting to wake up",
  "young-universe": "a baby universe wearing a tiny party hat, young and new, with few stars",
  "galaxy-pioneer-flag": "an astronaut planting a flag on top of a spiral galaxy, pioneer",
  "aliens-watching": "advanced aliens in a spaceship watching Earth through a telescope from far away, observing quietly",
  "hands-off": "a hand with palm out in a stop gesture hovering respectfully above a small planet, not touching",
  "silent-civs": "several planets each with a finger over mouth saying shhh, silent in the dark",
  "announce-suicide": "a planet shouting into the dark with a megaphone while a huge shadowy eye looks at it",
  "shout-position": "a small planet shouting with a loudspeaker and a bright glowing arrow pointing at its location",
  "bigger-civ-strike": "a giant spaceship firing a laser beam to destroy a small planet",
  "hide-in-dark": "a small planet hiding in thick darkness with only two scared eyes visible, quiet",
  "rare-miracle": "a single glowing seed of life on a tiny planet in vast black space, miracle, sparkles",
  "lucky-dice-life": "many dice rolling with lucky numbers and a tiny planet with life growing from them",
  "habitable-zone": "a star and a planet at the exact perfect distance with a green ring habitable zone",
  "moon-big": "a planet with a large moon next to it stabilizing it",
  "magnetic-field": "a planet protected by a glowing magnetic field bubble deflecting radiation arrows from the sun",
  "no-catastrophe": "a planet with a long calendar of billions of years and no asteroid hitting it, calm and peaceful",
  "bacteria-world": "a planet whose life is only simple bacteria, microscopic colonies, a microscope view",
  "life-common": "a cheerful planet with plants and animals, life being common and abundant",
  "accident-life": "a tiny improbable accident, a single intelligent head popping out of a pile of simple cells, lucky mistake",
  "invisible-civ": "a ghostly almost transparent outline of an advanced alien city that we cannot see against the stars",
  "alien-different": "a strange abstract alien being that looks nothing like us, glowing geometric shapes, incomprehensible",
  "ant-highway": "a tiny ant standing next to a huge highway with cars, not understanding it",
  "civs-radio-contact": "several planets connected by radio waves in a communication network, a few lit up",
  "crowded-galaxy": "a galaxy crowded with millions of glowing civilization dots and tiny planets",
  "alone-human-space": "a single tiny human alone floating in a vast empty dark space",
  "astronomer-wow": "an astronomer circling a line of computer printout numbers in red pen, surprised face, scribbled note",
  "ear-to-sky": "a person with a hand cupped to ear listening to the starry sky",
  "distant-signal": "a faraway tiny planet sending a thin glowing signal beam across a huge dark distance",
  "million-years-clock": "an old clock with many calendar pages flying off, millions of years passing",
  "message-received": "a radio receiver and an envelope message arriving from space",
  "extinct-sender": "a dead dried-up planet with a skull-shaped cloud, extinct civilization, sad",
  "two-doors": "two big doors side by side, one glowing with stars and one dark empty, a person standing in front choosing",
  "lone-spark": "one tiny glowing spark of light in a vast empty dark, consciousness",
  "answer-above": "a person looking up at a starry night sky with a glowing question mark and answer waiting among the stars",
  "big-jump": "a tiny single cell making a big leap up a staircase to become a complex animal, jump",
  "ghost-message": "a ghostly translucent ghost holding a glowing message envelope floating in dark space",
  "origin-of-life": "a spark of the origin of life, a glowing seed in the deep sea",
  "space-vacuum": "a vast empty dark space void with only a tiny faraway star",
  "advanced-tech": "advanced futuristic technology combined: a robot arm, glowing circuits, a rocket and a microchip",
  "nature-reserve": "a fenced nature reserve safari where animals roam freely and a distant observer watches from a viewing tower",
  "billions-stars-chap": "stars",
};
delete NEW["billions-stars-chap"];

// ---------- fotos (Wikipedia pin) y clips nuevos ----------
const PHOTOS = { "photo-volcan": ["Volcán", "Volcán", "es"], "photo-huracan": ["Ciclón tropical", "Ciclón tropical", "es"], "photo-tornado25": ["Tornado", "Tornado", "es"], "photo-terremoto": ["Terremoto", "Terremoto", "es"] };
const CLIPS = { "clip-clouds": "clouds time lapse" };

// ---------- beats ----------
const B = [];
const add = (s, t, n, o = {}) => B.push({ s, t, n, ...o });
// TIPO 0
add("Empecemos por el escalón", "single", [["clip-earth", "el escalón más bajo: nosotros", "escalón"]], { chap: ["Tipo 0: nosotros", "type-zero"] });
add("La civilización de Tipo", "words", [["-", "Civilización de Tipo 0", "civilización"], ["-", "*obtiene su energía*", "obtiene"], ["-", "de fuentes primitivas", "fuentes"]]);
add("como quemar madera", "grid", [["wood-logs", "madera", "madera"], ["coal-lump", "carbón", "carbón"], ["oil-barrel", "petróleo", "petróleo"], ["gas-flame", "gas", "gas"]]);
add("No controla su", "single", [["plunder-planet", "no controla su planeta: lo saquea", "controla"]]);
add("Y aquí viene el", "flow", [["human-crowd", "la humanidad", "humanidad"], ["type-one-planet", "Tipo I", "uno"]], { v: "curve" });
add("Estamos en un", "stat", [["meter-07", "nuestro nivel actual", "estamos"]], { stat: ["0,7", "de 1 en la escala", "cero"] });
add("Somos unos adolescentes", "flow", [["cosmic-teenager", "adolescentes cósmicos", "adolescentes"], ["self-destruct-power", "poder para destruirnos", "poder"], ["photo-earth", "ni nuestro propio planeta", "dominar"]]);
// TIPO I
add("El siguiente escalón", "single", [["kardashev-ladder", "el siguiente escalón: Tipo I, planetaria", "siguiente"]], { chap: ["Tipo I: planetaria", "type-one-planet"] });
add("Una civilización de Tipo uno", "flow", [["energy-capture", "capturar toda la energía de su planeta", "capturar"], ["clip-sun", "desde su estrella", "estrella"]], { v: "curve" });
add("Toda. Imagina controlar", "radial", [["planet-control", "controlar por completo", "controlar"], ["harness-sun", "energía solar", "solar"], ["wind-turbine", "el viento", "viento"], ["photo-volcan", "los volcanes", "volcanes"], ["control-weather", "el clima", "clima"]]);
add("Podrían desviar huracanes", "flow", [["photo-huracan", "desviar huracanes", "huracanes"], ["photo-terremoto", "prevenir terremotos", "terremotos"], ["clip-clouds", "controlar el tiempo", "tiempo"]]);
add("Para ellos, un", "versus", [["photo-tornado25", "para nosotros: un desastre", "desastre"], ["engineer-fix", "para ellos: un problema de ingeniería", "ingeniería"]]);
add("Serían los amos", "single", [["masters-of-world", "los amos absolutos de su mundo", "amos"]]);
// TIPO II
add("Subimos un peldaño", "words", [["-", "Subimos un peldaño más", "subimos"], ["-", "*Civilización de Tipo II*", "civilización"], ["-", "la estelar", "estelar"]], { chap: ["Tipo II: estelar", "type-two-star"] });
add("Si el Tipo uno", "flow", [["photo-earth", "Tipo I: domina su planeta", "uno"], ["photo-sun", "Tipo II: domina su estrella entera", "dos"]]);
add("Y aquí aparece una", "words", [["-", "Una de las ideas más fascinantes", "ideas"], ["-", "*La esfera de Dyson*", "esfera"]]);
add("Sería una estructura", "focus", [["clip-sun", "alrededor de su sol", "estructura"], ["dyson-sphere", "estructura gigantesca", "gigantesca"], ["-", "toda su energía", "energía"]]);
add("No una parte", "stat", [["energy-bolt", "la energía de su estrella", "parte"]], { stat: ["100 %", "cada segundo", "toda"] });
add("Con esa cantidad", "single", [["indestructible", "prácticamente indestructible", "indestructible"]]);
add("Podría mover planetas", "list", [["move-planets", "mover planetas", "mover"], ["ancient-universe", "vivir millones de años", "vivir"], ["no-catastrophe", "resistir cualquier catástrofe", "resistir"]]);
add("Para nosotros, serían", "flow", [["godlike", "para nosotros, como dioses", "nosotros"], ["clip-telescope", "ya las estamos buscando", "buscando"]]);
add("Ahora mismo, los", "hub", [["photo-telescope", "astrónomos rastreando el cielo", "astrónomos"], ["infrared-star", "brillo infrarrojo extraño", "infrarrojo"]]);
add("por si alguna", "flow", [["dyson-sphere", "rodeada por una megaestructura", "rodeada"], ["empty-silence", "de momento, nada", "momento"]], { v: "curve" });
// TIPO III
add("Y ahora, prepárate", "focus", [["clip-galaxy", "desafía la imaginación", "prepárate"], ["-", "Tipo III: galáctica", "tres"]], { chap: ["Tipo III: galáctica", "type-three-galaxy"] });
add("Una civilización de Tipo tres", "flow", [["photo-milkyway", "controla la energía de toda una galaxia", "controla"], ["tame-stars", "domesticar cientos de miles de millones de estrellas", "domesticar"]]);
add("Habrían colonizado la", "hub", [["colonize-galaxy", "colonizado la galaxia entera", "colonizado"], ["ai-machines", "inteligencias artificiales", "inteligencias"], ["pure-energy-being", "o energía pura", "energía"]]);
add("Su tecnología sería", "flow", [["magic-tech", "indistinguible de la magia", "indistinguible"], ["cant-comprehend", "no podríamos comprenderla", "podríamos"]], { v: "curve" });
// TEÓRICOS
add("Pero la escala", "words", [["-", "La escala no se detiene", "escala"], ["-", "*hacia lo puramente teórico*", "hacia"]], { chap: ["Tipos IV y V: teóricos", "theory-chalkboard"] });
add("Una civilización de Tipo cuatro", "single", [["type-four-universe", "Tipo IV: la energía de todo el universo", "tipo"]]);
add("Y una de Tipo", "flow", [["type-five-multiverse", "Tipo V: la más extrema imaginable", "extrema"], ["bubble-universes", "manipular múltiples universos", "múltiples"]]);
add("Seres así estarían", "single", [["godlike", "al nivel de los dioses de la mitología", "dioses"]]);
add("Podrían crear y", "versus", [["create-reality", "crear realidades", "crear"], ["destroy-reality", "destruirlas", "destruir"]]);
// PARADOJA DE FERMI
add("Y aquí es donde", "words", [["-", "*El gran misterio*", "misterio"]], { chap: ["La paradoja de Fermi", "where-are-they"] });
add("Si el universo es", "stat", [["ancient-universe", "un universo antiquísimo", "antiguo"]], { stat: ["14.000", "millones de años", "catorce"] });
add("Deberíamos ver sus", "flow", [["dyson-sphere", "ver sus esferas de Dyson", "esferas"], ["radio-signals", "oír sus señales", "señales"]]);
add("Pero no vemos", "focus", [["clip-galaxy", "no vemos absolutamente nada", "vemos"], ["fermi-paradox", "la paradoja de Fermi", "paradoja"]]);
add("El universo debería estar", "versus", [["teeming-universe", "debería estar lleno de vida", "debería"], ["empty-silence", "pero parece vacío", "vacío"]]);
add("La ciencia tiene varias", "single", [["answers-doors", "varias respuestas, cada una más inquietante", "varias"]]);
// 1 GRAN FILTRO
add("La primera es el", "words", [["-", "*1. El gran filtro*", "filtro"]], { chap: ["1. El gran filtro", "great-filter"] });
add("Puede que exista una", "zigzag", [["barrier-wall", "una barrera casi imposible", "barrera"], ["civilizations-fall", "acaba con casi todas", "acaba"], ["clip-rocket", "antes de llegar a las estrellas", "estrellas"]]);
add("La pregunta escalofriante es", "versus", [["filter-behind", "¿en nuestro pasado?", "pasado"], ["filter-future", "¿o en nuestro futuro?", "futuro"]]);
// 2 AUTODESTRUCCIÓN
add("La segunda respuesta es", "single", [["self-destruct-power", "las civilizaciones se autodestruyen", "autodestruyen"]], { chap: ["2. Se autodestruyen", "self-destruction"] });
add("con armas nucleares", "radial", [["advanced-tech", "tecnología avanzada", "armas"], ["nuclear-bomb", "armas nucleares", "nucleares"], ["nuclear-ai-danger", "inteligencia artificial", "inteligencia"], ["planet-wrecked", "destruir su planeta", "destruyendo"]]);
add("se aniquilan a", "hub", [["civ-boom", "se aniquilan antes de expandirse", "aniquilan"], ["danger-tightrope", "nosotros: en el momento más peligroso", "nosotros"]]);
// 3 PRIMEROS
add("La tercera es casi", "timeline", [["we-are-beginning", "puede que seamos de los primeros", "simplemente"], ["young-universe", "un universo tan joven", "joven"], ["sprout-life", "la vida apenas empieza", "apenas"]], { chap: ["3. Somos de los primeros", "we-are-first"] });
add("Y nosotros seamos una", "hub", [["photo-astronaut", "una de las primeras en lograrlo", "primeras"], ["galaxy-pioneer-flag", "los pioneros de la galaxia", "pioneros"]]);
// 4 ZOO
add("La cuarta da un", "words", [["-", "*La hipótesis del zoo*", "hipótesis"]], { chap: ["4. La hipótesis del zoo", "zoo-hypothesis"] });
add("Imagina que las civilizaciones", "focus", [["photo-saturn", "nos observan desde lejos", "observan"], ["aliens-watching", "saben que existimos", "saben"], ["-", "deciden no contactar", "decidido"]]);
add("Como nosotros observamos a", "flow", [["nature-reserve", "como animales en una reserva natural", "animales"], ["hands-off", "sin interferir", "interferir"]], { v: "curve" });
// 5 BOSQUE OSCURO
add("La quinta es la", "words", [["-", "*El bosque oscuro*", "bosque"]], { chap: ["5. El bosque oscuro", "dark-forest"] });
add("Según esta idea, todas", "hub", [["silent-civs", "todas guardan silencio a propósito", "silencio"], ["announce-suicide", "anunciarse es un suicidio", "anunciarse"]]);
add("Cualquiera que grite", "flow", [["shout-position", "quien grita su posición", "grite"], ["bigger-civ-strike", "puede ser destruido", "destruido"], ["hide-in-dark", "todos se esconden callados", "esconden"]]);
// 6 RARÍSIMO
add("Otra posibilidad es que", "single", [["rare-miracle", "la vida inteligente, un milagro rarísimo", "milagro"]], { chap: ["6. Un milagro rarísimo", "origin-of-life"] });
add("Que, aunque haya millones", "flow", [["photo-saturn", "millones de planetas", "planetas"], ["lucky-dice-life", "tantísimas casualidades", "casualidades"]]);
add("un planeta a la", "list", [["habitable-zone", "un planeta a la distancia justa", "planeta"], ["moon-big", "una luna grande", "luna"], ["magnetic-field", "un campo magnético", "campo"], ["no-catastrophe", "sin catástrofes en miles de millones de años", "años"]]);
add("que la mayoría de", "flow", [["bacteria-world", "se quedan en vida simple, bacterias", "bacterias"], ["big-jump", "y nunca dan el salto", "salto"]]);
add("Quizá la vida sea", "versus", [["life-common", "la vida, común", "común"], ["accident-life", "la inteligente, un accidente", "accidente"]]);
// 7 NO PODEMOS VERLAS
add("Y por último, quizás", "words", [["-", "*Quizá no podemos verlas*", "verlas"]], { chap: ["7. No podemos verlas", "cant-recognize"] });
add("Puede que estén ahí", "single", [["alien-different", "tan avanzadas y tan diferentes", "avanzadas"]]);
add("Igual que una hormiga", "flow", [["ant-highway", "una hormiga no entiende una autopista", "hormiga"], ["type-three-galaxy", "no entendemos las señales de un Tipo III", "señales"]]);
// DRAKE
add("Hay incluso una fórmula", "hub", [["drake-equation", "la ecuación de Drake", "ecuación"], ["civs-radio-contact", "civilizaciones con las que comunicarnos", "civilizaciones"]], { v: "curve", chap: ["La ecuación de Drake", "billions-stars"] });
add("El problema es que", "versus", [["crowded-galaxy", "millones de civilizaciones", "millones"], ["alone-human-space", "o estamos solos", "solos"]]);
// WOW
add("Y hay un detalle", "words", [["-", "*Un detalle aún más frustrante*", "detalle"]]);
add("En mil novecientos setenta", "stat", [["clip-telescope", "un radiotelescopio capta una señal", "radiotelescopio"]], { stat: ["1977", "señal del espacio profundo", "mil"] });
add("tan clara y tan", "single", [["astronomer-wow", "el astrónomo escribió una sola palabra", "astrónomo"]]);
add("Wow. Nunca más", "words", [["-", "*¡WOW!*", "wow"], ["-", "Nunca volvió a repetirse", "nunca"], ["-", "ni sabemos qué la produjo", "jamás"]]);
add("Es lo más cerca", "flow", [["ear-to-sky", "lo más cerca de oír a alguien", "cerca"], ["distant-signal", "pero otro obstáculo: las distancias", "obstáculo"]]);
// DISTANCIAS
add("El universo es tan", "single", [["clip-nebula", "tan absurdamente grande", "absurdamente"]], { chap: ["Las distancias", "distant-signal"] });
add("podrían estar tan lejos", "timeline", [["radio-signals", "su luz y sus señales", "lejos"], ["million-years-clock", "millones de años en llegar", "millones"], ["photo-earth", "hasta nosotros", "nosotros"]]);
add("Puede que, cuando", "flow", [["message-received", "captamos un mensaje", "captemos"], ["extinct-sender", "quien lo envió, ya extinguido", "extinguido"]]);
add("Estaríamos escuchando a", "single", [["ghost-message", "fantasmas cósmicos: ecos de mundos que ya no existen", "fantasmas"]]);
// FINAL
add("Así que, al final", "words", [["-", "*Dos posibilidades*", "posibilidades"], ["-", "ambas sobrecogedoras", "ambas"]], { chap: ["Dos posibilidades", "two-doors"] });
add("O el universo está", "flow", [["teeming-universe", "el universo, lleno de vida", "universo"], ["godlike", "civilizaciones como dioses", "dioses"]]);
add("O estamos verdaderamente solos", "single", [["lone-spark", "la única chispa de consciencia", "chispa"]]);
add("No sabemos cuál", "words", [["-", "*¿Cuál da más miedo?*", "cuál"]]);
add("Cada vez que mires", "flow", [["clip-milkyway", "cada vez que mires las estrellas", "estrellas"], ["answer-above", "la respuesta está ahí arriba, esperando", "respuesta"]], { v: "curve" });
add("Y que quizá, solo", "single", [["we-are-beginning", "quizá nosotros seamos el comienzo de todo", "comienzo"]]);

// ---------- escribir storyboard ----------
const sbPath = `${DIR}/storyboard.md`;
let sb = fs.readFileSync(sbPath, "utf8");
const cut = sb.indexOf("### BEAT 4 ");
if (cut > 0) sb = sb.slice(0, cut); // quita los beats antiguos (4+)
sb = sb.replace(/\n### BEAT 1[1-9]\d[\s\S]*$/m, (m) => m); // (los 101-109 se conservan)
// elimina cualquier beat >=110 de una pasada anterior
const i110 = sb.search(/^### BEAT 1[1-9]\d /m); const first110 = sb.search(/^### BEAT 11\d /m);
if (first110 > 0) sb = sb.slice(0, first110);
let out = "";
B.forEach((b, i) => {
  const num = 110 + i;
  out += `### BEAT ${num} · 00:00 · T1\nNarración: *"${b.s}…"*\n\`\`\`\n`;
  if (b.chap) out += `+0.0  CHAP "${b.chap[0]}" ${b.chap[1]}\n`;
  out += `+0.0  SCENE ${b.t}${b.v ? " " + b.v : ""}\n`;
  if (b.stat) out += `+0.0  STAT "${b.stat[0]}" "${b.stat[1]}"\n`;
  for (const [id, label, w] of b.n) out += `+0.0  NODE ${id} "${label}" ~${w}\n`;
  out += "```\n\n";
});
fs.writeFileSync(sbPath, sb.trimEnd() + "\n\n" + out);

// ---------- assets.json ----------
const ap = `${DIR}/assets.json`; const A = JSON.parse(fs.readFileSync(ap, "utf8"));
let added = 0;
for (const [id, q] of Object.entries(NEW)) if (!A[id]) { A[id] = { kind: "vector", query: q }; added++; }
for (const [id, [q, wk, lang]] of Object.entries(PHOTOS)) if (!A[id]) { A[id] = { kind: "cutout", query: q, wiki: wk, lang }; added++; }
for (const [id, q] of Object.entries(CLIPS)) if (!A[id]) { A[id] = { kind: "clip", query: q, file: `assets/clips/${id}.mp4` }; added++; }
fs.writeFileSync(ap, JSON.stringify(A, null, 2));
console.log("beats:", B.length, "· assets nuevos:", added);
// comprobación: ids usados que no existen en assets
const used = new Set(B.flatMap(b => b.n.map(x => x[0])).filter(x => x !== "-")); const chapIcons = B.filter(b => b.chap).map(b => b.chap[1]);
for (const u of [...used, ...chapIcons]) if (!A[u]) console.log("  ✗ falta asset:", u);
let prev = ""; B.forEach((b, i) => { if (b.t === prev) console.log("  ⚠ misma plantilla seguida en beat", 110 + i, b.t); prev = b.t; });
