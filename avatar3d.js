/* ============================================================================
   avatar3d.js — Probador 3D del DT / Presidente  (Retro Football Manager SV v1.9)
   Se carga bajo demanda. Usa three-lite.js (Three.js recortado, ~150 KB gzip).
   Datos y lógica de compra NO necesitan WebGL (se pueden probar en Node).
   Comparte el ámbito global del juego: G, userClub(), money(), toast(), autoSave()...
   ========================================================================== */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ catálogo */
  // slot: head face ear body neck wrist hand feet ball pet backL backR flag floor
  const SLOTS = [
    ['head', 'Cabeza', '🧢'], ['face', 'Rostro', '😎'], ['ear', 'Oídos', '🎧'], ['body', 'Cuerpo', '🧥'],
    ['neck', 'Cuello', '🧣'], ['wrist', 'Muñeca', '⌚'], ['hand', 'Mano', '📓'], ['feet', 'Pies', '👟'],
    ['ball', 'Balón', '⚽'], ['pet', 'Mascota', '🐕'], ['backL', 'Fondo izq.', '🏆'], ['backR', 'Fondo der.', '📋'],
    ['flag', 'Bandera', '🚩'], ['floor', 'Piso', '🟥']
  ];
  // [id, nombre, slot, precio, rareza, icono, descripción]   (ids antiguos se conservan: compras previas siguen válidas)
  const CATALOG = [
    ['gorra', 'Gorra del DT', 'head', 2500, 'c', '🧢', 'Gorra con los colores de tu club.'],
    ['sombrero', 'Sombrero panameño', 'head', 7500, 'r', '👒', 'Elegante, fresco y muy centroamericano.'],
    ['boina', 'Boina retro', 'head', 4200, 'c', '🎩', 'Estilo de entrenador de los años 70.'],
    ['corona', 'Corona del Cuscatlán', 'head', 28000, 'e', '👑', 'Solo para presidentes con ego sano.'],
    ['lentes', 'Lentes de campeón', 'face', 4200, 'c', '😎', 'Lentes oscuros con marco dorado.'],
    ['gafas', 'Gafas de analista', 'face', 3000, 'c', '🤓', 'Montura redonda: se nota que ves el video.'],
    ['bigote', 'Bigote clásico', 'face', 2000, 'c', '🥸', 'Un bigote con historia.'],
    ['audifonos', 'Audífonos de análisis', 'ear', 6200, 'r', '🎧', 'Siempre escuchando a la grada.'],
    ['traje', 'Traje de gala', 'body', 9000, 'r', '🤵', 'Traje oscuro con camisa blanca.'],
    ['camisa', 'Camiseta retro del club', 'body', 4000, 'c', '👕', 'Camiseta a rayas con el escudo.'],
    ['chamarra', 'Chamarra del club', 'body', 6500, 'c', '🧥', 'Chamarra deportiva con franjas.'],
    ['abrigo', 'Gabardina de invierno', 'body', 12000, 'r', '🧥', 'Para las noches frías de la Copa.'],
    ['sacoDorado', 'Saco dorado', 'body', 34000, 'e', '✨', 'Brilla más que el trofeo.'],
    ['corbata', 'Corbata de gala', 'neck', 3500, 'c', '👔', 'Roja, al estilo de la directiva.'],
    ['bufanda', 'Bufanda del club', 'neck', 2800, 'c', '🧣', 'Colores de la barra.'],
    ['cadena', 'Cadena de oro', 'neck', 9500, 'r', '📿', 'Con medallón del club.'],
    ['reloj', 'Reloj elegante', 'wrist', 7000, 'r', '⌚', 'Puntual para cada convocatoria.'],
    ['libreta', 'Libreta táctica', 'hand', 5500, 'c', '📓', 'Apuntes de cada jornada.'],
    ['megafono', 'Megáfono de barra', 'hand', 4500, 'c', '📣', 'Para animar desde el palco.'],
    ['baston', 'Bastón de mando', 'hand', 15000, 'e', '🦯', 'Con empuñadura dorada.'],
    ['botines', 'Botines clásicos', 'feet', 4800, 'c', '👟', 'Blancos con franja dorada.'],
    ['charol', 'Zapatos de charol', 'feet', 5200, 'c', '👞', 'Brillan bajo los reflectores.'],
    ['tenis', 'Tenis retro', 'feet', 3600, 'c', '👟', 'Blanco, rojo y azul.'],
    ['balon', 'Balón retro', 'ball', 3500, 'c', '⚽', 'El de toda la vida, a tus pies.'],
    ['mascota', 'Mascota del club (chucho)', 'pet', 12500, 'r', '🐕', 'Un chucho fiel con pañoleta del club.'],
    ['torogoz', 'Torogoz (ave nacional)', 'pet', 16000, 'e', '🦜', 'Se posa en tu hombro.'],
    ['trofeoMini', 'Mini vitrina', 'backL', 11000, 'r', '🏆', 'Muestra los trofeos que ganas de verdad.'],
    ['estante', 'Estante de recuerdos', 'backL', 6000, 'c', '📚', 'Libros, fotos y copas viejas.'],
    ['pizarra', 'Pizarra premium', 'backR', 8500, 'r', '📋', 'Esquemas tácticos a la vista.'],
    ['cuadro', 'Cuadro del escudo', 'backR', 5000, 'c', '🖼', 'El escudo del club, enmarcado.'],
    ['banderin', 'Banderín histórico', 'flag', 3000, 'c', '🚩', 'Banderín de la fundación.'],
    ['bandera', 'Bandera de El Salvador', 'flag', 6500, 'r', '🇸🇻', 'Azul, blanco y azul.'],
    ['bombin', 'Bombín inglés', 'head', 6800, 'r', '🎩', 'El sombrero de los técnicos de la vieja escuela.'],
    ['gorro', 'Gorro de lana', 'head', 2200, 'c', '🧶', 'Para los partidos de madrugada en Chalatenango.'],
    ['visera', 'Visera de sol', 'head', 2600, 'c', '🧢', 'Para los mediodías en el Cuscatlán.'],
    ['aviador', 'Gafas aviador', 'face', 5200, 'r', '🕶', 'Cristal ahumado, estilo de gran presidente.'],
    ['monoculo', 'Monóculo dorado', 'face', 15000, 'e', '🧐', 'Para firmar los contratos con calma.'],
    ['mono', 'Moño de gala', 'neck', 3800, 'c', '🎀', 'Elegancia para la noche de premios.'],
    ['panuelo', 'Pañuelo de la barra', 'neck', 2400, 'c', '🧣', 'Rojo y blanco, atado al cuello.'],
    ['pulsera', 'Pulsera del club', 'wrist', 2200, 'c', '📿', 'Con los colores de tu escudo.'],
    ['copa', 'Copa en mano', 'hand', 21000, 'e', '🏆', 'La que soñás levantar.'],
    ['cafe', 'Café de la mañana', 'hand', 1800, 'c', '☕', 'Sin café no hay conferencia de prensa.'],
    ['tablet', 'Tablet de análisis', 'hand', 7800, 'r', '📱', 'Estadísticas en tiempo real.'],
    ['alfombra', 'Alfombra roja', 'floor', 6000, 'r', '🟥', 'Entrada de campeones.'],
    ['tarima', 'Tarima dorada', 'floor', 19000, 'e', '🥇', 'Te eleva sobre todos los demás.']
  ];
  const RAR = { c: ['Común', '#9fb6a5'], r: ['Raro', '#4aa3ff'], e: ['Épico', '#ffb21f'] };
  const SKIN = ['#f1c9a5', '#e0a87c', '#c68642', '#a9683b', '#7a4a2b', '#4a2f1d'];
  const HAIRC = ['#1b1410', '#3a2415', '#6b4423', '#b8864b', '#8c8c8c', '#d9d9d9', '#a3281f'];
  const HAIRS = [['corto', 'Corto'], ['rizado', 'Rizado'], ['largo', 'Largo'], ['pompadour', 'Copete'], ['mohicano', 'Mohicano'], ['calvo', 'Calvo']];
  const BEARDS = [['ninguna', 'Sin barba'], ['barba', 'Barba'], ['candado', 'Candado'], ['sombra', 'Sombra']];
  const byId = {}; CATALOG.forEach(c => byId[c[0]] = { id: c[0], nombre: c[1], slot: c[2], precio: c[3], rareza: c[4], icono: c[5], desc: c[6] });
  const SLOT_ORDER = ['head', 'face', 'ear', 'body', 'neck', 'wrist', 'hand', 'feet', 'ball', 'pet', 'backL', 'backR', 'flag', 'floor'];
  const DEFAULT_LOOK = { piel: 1, pelo: 'corto', pcolor: 1, barba: 'ninguna' };

  /* ------------------------------------------------------------ estado / compras */
  function ensure() {
    if (typeof G === 'undefined' || !G) return null;
    if (!G.avatar) G.avatar = { items: [] };
    if (!Array.isArray(G.avatar.items)) G.avatar.items = [];
    if (!G.avatar.look) G.avatar.look = Object.assign({}, DEFAULT_LOOK);
    if (!G.avatar.eq) {
      G.avatar.eq = {};
      // equipar automáticamente lo ya comprado (un objeto por casilla; el más caro gana)
      G.avatar.items.slice().sort((a, b) => ((byId[b] || {}).precio || 0) - ((byId[a] || {}).precio || 0)).forEach(id => {
        const it = byId[id]; if (it && !G.avatar.eq[it.slot]) G.avatar.eq[it.slot] = id;
      });
    }
    if (G.managerWallet == null) G.managerWallet = 0;
    return G.avatar;
  }
  function owns(id) { const a = ensure(); return !!a && a.items.includes(id); }
  function buy(id) {
    const a = ensure(), it = byId[id];
    if (!a || !it) return { ok: false, msg: 'Objeto desconocido' };
    if (a.items.includes(id)) return { ok: false, msg: 'Ya lo tienes' };
    if ((G.managerWallet || 0) < it.precio) return { ok: false, msg: 'Te faltan ' + money(it.precio - (G.managerWallet || 0)) };
    G.managerWallet -= it.precio; a.items.push(id); a.eq[it.slot] = id;
    try { unlockAchievement('style_' + id, 'Estilo: ' + it.nombre, 'Compraste un elemento de apariencia'); } catch (e) { }
    try { autoSave(); } catch (e) { }
    return { ok: true, msg: it.nombre + ' comprado y puesto' };
  }
  function equip(slot, id) {
    const a = ensure(); if (!a) return false;
    if (id && !a.items.includes(id)) return false;
    if (id && (byId[id] || {}).slot !== slot) return false;
    if (id) a.eq[slot] = id; else delete a.eq[slot];
    try { autoSave(); } catch (e) { }
    return true;
  }
  function setLook(k, v) { const a = ensure(); if (!a) return; a.look[k] = v; try { autoSave(); } catch (e) { } }
  function dtSeedLook(seed) {
    let h = 7; String(seed || 'x').split('').forEach(c => h = (h * 31 + c.charCodeAt(0)) >>> 0);
    const r = n => { h = (h * 1664525 + 1013904223) >>> 0; return h % n; };
    return { piel: r(SKIN.length), pelo: ['corto', 'corto', 'rizado', 'pompadour', 'calvo', 'largo'][r(6)], pcolor: r(HAIRC.length - 1), barba: ['ninguna', 'barba', 'candado', 'sombra', 'ninguna'][r(5)], gafas: r(4) === 0 };
  }

  /* ----------------------------------------------------------------- 3D (lazy) */
  let T = null, loadP = null;
  function loadThree() {
    if (root.THREE_LITE) { T = root.THREE_LITE; return Promise.resolve(T); }
    if (loadP) return loadP;
    loadP = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = 'three-lite.js?v=' + (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '1');
      s.onload = () => { T = root.THREE_LITE; T ? res(T) : rej(new Error('three-lite vacío')); };
      s.onerror = () => { loadP = null; rej(new Error('No se pudo cargar three-lite.js')); };
      document.head.appendChild(s);
    });
    return loadP;
  }
  function webglOK() {
    try { const c = document.createElement('canvas'); return !!(root.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }

  let GRAD = null, OUT = null;
  function init3() {
    if (GRAD) return;
    const d = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]);
    GRAD = new T.DataTexture(d, 3, 1); GRAD.minFilter = T.NearestFilter; GRAD.magFilter = T.NearestFilter; GRAD.needsUpdate = true;
    OUT = new T.MeshBasicMaterial({ color: 0x0b0b14, side: T.BackSide });
  }
  const M = (c, o) => new T.MeshToonMaterial(Object.assign({ color: c, gradientMap: GRAD }, o || {}));
  function mk(geo, color, o) {
    o = o || {};
    const m = new T.Mesh(geo, o.mat || M(color, o.m));
    if (o.p) m.position.set(o.p[0], o.p[1], o.p[2]);
    if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]);
    if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
    if (o.ol !== false) { const ol = new T.Mesh(geo, OUT); ol.scale.setScalar(o.olw || 1.06); m.add(ol); }
    if (o.parent) o.parent.add(m);
    return m;
  }
  const box = (w, h, d) => new T.BoxGeometry(w, h, d);
  const sph = (r, a, b) => new T.SphereGeometry(r, a || 20, b || 14);
  const cyl = (rt, rb, h, s) => new T.CylinderGeometry(rt, rb, h, s || 16);
  const cap = (r, l) => new T.CapsuleGeometry(r, l, 6, 12);
  function ctex(w, h, fn) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function shade(hex, f) { const c = new T.Color(hex); c.multiplyScalar(f); return c; }
  function clubInitials(club) { return ((club && (club.id || club.nombre)) || 'CLU').slice(0, 3).toUpperCase(); }

  /* ---- figura humana ---- */
  function buildFigure(cfg) {
    // cfg: {look, eq, kit, club, role:'pres'|'dt'|'dtctl', scale}
    const look = Object.assign({}, DEFAULT_LOOK, cfg.look || {});
    const eq = cfg.eq || {};
    const kit = cfg.kit || '#0b6b8f';
    const skin = SKIN[look.piel % SKIN.length], hair = HAIRC[look.pcolor % HAIRC.length];
    const g = new T.Group(); g.userData.parts = {};
    const P = g.userData.parts;
    const suit = eq.body === 'traje' || eq.body === 'sacoDorado';
    const topColor = eq.body === 'traje' ? '#1c2233' : eq.body === 'sacoDorado' ? '#d9a521' : eq.body === 'abrigo' ? '#b89968' : eq.body === 'chamarra' ? kit : eq.body === 'camisa' ? '#ffffff' : (cfg.role === 'dt' ? kit : '#f4f1ea');
    const pantsColor = suit ? shade(topColor, 0.92).getStyle() : (cfg.role === 'dt' ? '#1d2230' : '#2a2f40');
    const raise = eq.floor === 'tarima' && cfg.role !== 'dt' ? 0.16 : 0;
    g.position.y = raise; g.userData.base = raise;

    // piernas
    ['L', 'R'].forEach((s, i) => {
      const x = i ? 0.115 : -0.115;
      const leg = new T.Group(); leg.position.set(x, 0.58, 0); g.add(leg); P['leg' + s] = leg;
      mk(cap(0.085, 0.3), pantsColor, { p: [0, -0.28, 0], parent: leg });
      const shoeC = eq.feet === 'charol' ? '#0c0c12' : eq.feet === 'botines' ? '#f4f4f4' : eq.feet === 'tenis' ? '#f4f4f4' : '#3b2a20';
      const shoe = mk(box(0.17, 0.1, 0.27), shoeC, { p: [0, -0.52, 0.05], parent: leg, m: eq.feet === 'charol' ? { emissive: 0x111118 } : {} });
      if (eq.feet === 'botines') {
        mk(box(0.175, 0.025, 0.1), '#e8b923', { p: [0, 0.02, 0.0], parent: shoe, ol: false });
        for (let k = 0; k < 4; k++) mk(new T.ConeGeometry(0.014, 0.04, 6), '#cfcfcf', { p: [(k % 2 ? 0.045 : -0.045), -0.07, k < 2 ? 0.07 : -0.06], parent: shoe, ol: false });
      }
      if (eq.feet === 'tenis') { mk(box(0.175, 0.03, 0.2), '#d33a2c', { p: [0, 0.01, 0.0], parent: shoe, ol: false }); mk(box(0.175, 0.03, 0.06), '#1d4ed8', { p: [0, 0.01, 0.1], parent: shoe, ol: false }); }
    });
    // torso
    const torso = new T.Group(); torso.position.y = 0.58; g.add(torso); P.torso = torso;
    mk(cap(0.22, 0.28), topColor, { p: [0, 0.3, 0], s: [1.08, 1, 0.78], parent: torso });
    if (suit) {
      mk(box(0.12, 0.34, 0.02), '#f6f6f6', { p: [0, 0.36, 0.165], parent: torso, ol: false });
      [-1, 1].forEach(sg => mk(box(0.07, 0.34, 0.03), shade(topColor, 1.25).getStyle(), { p: [sg * 0.1, 0.36, 0.17], r: [0, 0, -sg * 0.35], parent: torso, ol: false }));
      [0.42, 0.3, 0.18].forEach(y => mk(sph(0.014, 8, 6), '#e8c35a', { p: [0, y, 0.18], parent: torso, ol: false }));
    }
    if (eq.body === 'abrigo') {
      mk(box(0.5, 0.4, 0.3), '#b89968', { p: [0, -0.02, 0], parent: torso });
      mk(box(0.04, 0.6, 0.02), '#8a6f45', { p: [0, 0.18, 0.17], parent: torso, ol: false });
      [-1, 1].forEach(sg => mk(box(0.14, 0.12, 0.05), '#a08555', { p: [sg * 0.13, 0.5, 0.16], r: [0, 0, -sg * 0.5], parent: torso, ol: false }));
    }
    if (eq.body === 'camisa') {
      for (let k = 0; k < 4; k++) mk(box(0.5, 0.05, 0.26), kit, { p: [0, 0.14 + k * 0.12, 0], parent: torso, ol: false, s: [1, 1, 1] });
      const crest = mk(new T.CircleGeometry(0.055, 18), 0xffffff, { p: [0.1, 0.42, 0.172], parent: torso, ol: false, mat: new T.MeshBasicMaterial({ map: ctex(64, 64, (c, w, h) => { c.fillStyle = kit; c.beginPath(); c.arc(32, 32, 30, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke(); c.fillStyle = '#fff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText(clubInitials(cfg.club), 32, 40); }) }) });
    }
    if (eq.body === 'chamarra') {
      mk(box(0.04, 0.5, 0.02), '#ffffff', { p: [0, 0.3, 0.17], parent: torso, ol: false });
      [-1, 1].forEach(sg => mk(box(0.03, 0.4, 0.2), '#ffffff', { p: [sg * 0.225, 0.3, 0], parent: torso, ol: false }));
    }
    if (eq.body === 'sacoDorado') [-1, 1].forEach(sg => mk(box(0.06, 0.4, 0.03), '#fff3b0', { p: [sg * 0.09, 0.34, 0.172], r: [0, 0, -sg * 0.3], parent: torso, ol: false }));
    // cuello + cabeza
    mk(cyl(0.065, 0.075, 0.08, 10), skin, { p: [0, 0.64, 0], parent: torso, ol: false });
    // corbata / bufanda / cadena
    if (eq.neck === 'corbata') {
      mk(box(0.06, 0.05, 0.03), '#b3202a', { p: [0, 0.58, 0.18], parent: torso, ol: false });
      mk(new T.ConeGeometry(0.05, 0.3, 4), '#b3202a', { p: [0, 0.4, 0.178], r: [Math.PI, Math.PI / 4, 0], s: [1, 1, 0.3], parent: torso, ol: false });
    }
    if (eq.neck === 'bufanda') {
      mk(new T.TorusGeometry(0.115, 0.045, 8, 18), kit, { p: [0, 0.58, 0], r: [Math.PI / 2, 0, 0], s: [1, 1.05, 1], parent: torso });
      mk(box(0.09, 0.32, 0.035), kit, { p: [0.07, 0.4, 0.17], parent: torso }); mk(box(0.092, 0.04, 0.037), '#ffffff', { p: [0.07, 0.34, 0.17], parent: torso, ol: false }); mk(box(0.092, 0.04, 0.037), '#ffffff', { p: [0.07, 0.26, 0.17], parent: torso, ol: false });
    }
    if (eq.neck === 'mono') {
      mk(sph(0.03, 8, 6), '#b3202a', { p: [0, 0.58, 0.18], parent: torso, ol: false });
      [-1, 1].forEach(sg => mk(new T.ConeGeometry(0.05, 0.1, 4), '#b3202a', { p: [sg * 0.07, 0.58, 0.18], r: [0, 0, sg * -Math.PI / 2], parent: torso, ol: false }));
    }
    if (eq.neck === 'panuelo') {
      mk(new T.TorusGeometry(0.108, 0.03, 8, 18), '#d9d9d9', { p: [0, 0.58, 0], r: [Math.PI / 2, 0, 0], parent: torso });
      mk(new T.ConeGeometry(0.06, 0.13, 4), '#b3202a', { p: [0, 0.5, 0.17], r: [Math.PI, Math.PI / 4, 0], parent: torso, ol: false });
    }
    if (eq.neck === 'cadena') {
      mk(new T.TorusGeometry(0.13, 0.014, 8, 24), '#f4c430', { p: [0, 0.52, 0.04], r: [Math.PI / 2.4, 0, 0], parent: torso, ol: false, m: { emissive: 0x3b2a00 } });
      mk(new T.CylinderGeometry(0.035, 0.035, 0.012, 18), '#f4c430', { p: [0, 0.4, 0.165], r: [Math.PI / 2, 0, 0], parent: torso, ol: false, m: { emissive: 0x3b2a00 } });
    }
    // brazos
    ['L', 'R'].forEach((s, i) => {
      const sg = i ? 1 : -1;
      const arm = new T.Group(); arm.position.set(sg * 0.255, 0.5, 0); torso.add(arm); P['arm' + s] = arm;
      const sleeve = eq.body === 'camisa' ? topColor : (eq.body && eq.body !== 'camisa' ? topColor : topColor);
      const short = !eq.body || eq.body === 'camisa';
      mk(cap(0.062, short ? 0.12 : 0.26), sleeve, { p: [0, short ? -0.12 : -0.18, 0], parent: arm });
      if (short) mk(cap(0.055, 0.14), skin, { p: [0, -0.3, 0], parent: arm });
      const hand = mk(sph(0.06, 10, 8), skin, { p: [0, -0.43, 0], parent: arm });
      P['hand' + s] = hand;
      if (eq.body === 'chamarra') mk(cyl(0.07, 0.07, 0.04, 12), '#ffffff', { p: [0, -0.37, 0], parent: arm, ol: false });
    });
    P.armL.rotation.z = 0.08; P.armR.rotation.z = -0.08;
    // reloj en muñeca izquierda
    if (eq.wrist === 'reloj') {
      mk(cyl(0.07, 0.07, 0.04, 14), '#f4c430', { p: [0, -0.37, 0], parent: P.armL, ol: false, m: { emissive: 0x3b2a00 } });
      mk(cyl(0.045, 0.045, 0.045, 14), '#10243a', { p: [0.035, -0.37, 0.0], r: [0, 0, Math.PI / 2], parent: P.armL, ol: false });
    }
    if (eq.wrist === 'pulsera') {
      mk(cyl(0.065, 0.065, 0.05, 14), kit, { p: [0, -0.37, 0], parent: P.armL, ol: false });
      mk(cyl(0.067, 0.067, 0.012, 14), '#ffffff', { p: [0, -0.37, 0], parent: P.armL, ol: false });
    }
    // cabeza
    const head = new T.Group(); head.position.y = 1.05 + 0.2; torso.add(head); head.position.y = 0.88; P.head = head;
    mk(sph(0.28, 24, 18), skin, { s: [1, 0.96, 0.94], parent: head });
    [-1, 1].forEach(sg => {
      mk(sph(0.05, 10, 8), skin, { p: [sg * 0.28, -0.02, 0], s: [0.6, 1, 0.8], parent: head });
      const eye = mk(sph(0.036, 10, 8), '#14141c', { p: [sg * 0.095, 0.02, 0.255], s: [0.8, 1.15, 0.5], parent: head, ol: false }); P['eye' + (sg < 0 ? 'L' : 'R')] = eye;
      mk(sph(0.011, 6, 5), '#ffffff', { p: [sg * 0.095 + 0.01, 0.04, 0.275], parent: head, ol: false });
      mk(box(0.085, 0.016, 0.02), hair, { p: [sg * 0.095, 0.085, 0.255], r: [0, 0, -sg * 0.12], parent: head, ol: false });
      mk(sph(0.03, 8, 6), '#f08c7a', { p: [sg * 0.17, -0.07, 0.21], s: [1, 0.6, 0.4], parent: head, ol: false, m: { transparent: true, opacity: 0.55 } });
    });
    mk(sph(0.032, 8, 6), shade(skin, 0.92).getStyle(), { p: [0, -0.03, 0.27], parent: head, ol: false });
    const mouth = mk(new T.TorusGeometry(0.052, 0.011, 6, 12, Math.PI), '#7a2a2a', { p: [0, -0.1, 0.25], r: [0, 0, Math.PI], parent: head, ol: false }); P.mouth = mouth;
    // pelo
    const hairM = () => M(hair);
    const hs = look.pelo;
    if (hs === 'corto' || hs === 'largo' || hs === 'pompadour') {
      mk(new T.SphereGeometry(0.295, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, { p: [0, 0.02, -0.01], parent: head, mat: hairM(), olw: 1.04 });
      mk(box(0.4, 0.07, 0.08), hair, { p: [0, 0.2, 0.2], r: [-0.2, 0, 0], parent: head, ol: false });
    }
    if (hs === 'largo') { mk(box(0.5, 0.45, 0.12), hair, { p: [0, -0.15, -0.2], parent: head }); [-1, 1].forEach(sg => mk(box(0.07, 0.3, 0.2), hair, { p: [sg * 0.265, -0.08, -0.04], parent: head, ol: false })); }
    if (hs === 'pompadour') mk(box(0.34, 0.12, 0.22), hair, { p: [0, 0.3, 0.1], r: [-0.35, 0, 0], parent: head });
    if (hs === 'rizado') for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, rr = k < 9 ? 0.2 : 0.07; mk(sph(0.1, 8, 6), hair, { p: [Math.cos(a) * rr * (k < 9 ? 1 : 1), k < 9 ? 0.2 : 0.33, Math.sin(a) * rr - 0.01], parent: head, ol: false }); }
    if (hs === 'mohicano') for (let k = 0; k < 7; k++) mk(box(0.06, 0.12 + (k === 3 ? 0.05 : 0), 0.09), hair, { p: [0, 0.28, -0.16 + k * 0.065], parent: head, ol: false });
    // barba
    if (look.barba === 'barba') mk(new T.SphereGeometry(0.287, 18, 10, 0, Math.PI * 2, Math.PI * 0.58, Math.PI * 0.4), hair, { p: [0, 0.0, 0.01], parent: head, ol: false });
    if (look.barba === 'candado') mk(box(0.07, 0.07, 0.03), hair, { p: [0, -0.17, 0.25], parent: head, ol: false });
    if (look.barba === 'sombra') mk(new T.SphereGeometry(0.283, 18, 10, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.35), hair, { p: [0, 0.0, 0.01], parent: head, ol: false, m: { transparent: true, opacity: 0.35 } });
    if (eq.face === 'bigote') mk(box(0.15, 0.03, 0.04), hair, { p: [0, -0.065, 0.265], parent: head, ol: false });
    // accesorios de rostro/cabeza
    if (eq.face === 'lentes' || look.gafas) {
      const fr = eq.face === 'lentes' ? '#e8b923' : '#222';
      [-1, 1].forEach(sg => { mk(new T.TorusGeometry(0.06, 0.009, 6, 16), fr, { p: [sg * 0.095, 0.02, 0.265], parent: head, ol: false }); if (eq.face === 'lentes') mk(new T.CircleGeometry(0.058, 16), '#0a0a12', { p: [sg * 0.095, 0.02, 0.263], parent: head, ol: false, m: { transparent: true, opacity: 0.88 } }); });
      mk(box(0.06, 0.01, 0.01), fr, { p: [0, 0.03, 0.268], parent: head, ol: false });
    }
    if (eq.face === 'gafas') {
      [-1, 1].forEach(sg => { mk(new T.TorusGeometry(0.058, 0.009, 6, 16), '#3a2415', { p: [sg * 0.095, 0.02, 0.265], parent: head, ol: false }); });
      mk(box(0.05, 0.01, 0.01), '#3a2415', { p: [0, 0.03, 0.268], parent: head, ol: false });
    }
    if (eq.ear === 'audifonos') {
      mk(new T.TorusGeometry(0.3, 0.025, 8, 24, Math.PI), '#1b1b24', { p: [0, 0.0, 0], parent: head, ol: false });
      [-1, 1].forEach(sg => mk(cyl(0.075, 0.075, 0.06, 14), kit, { p: [sg * 0.3, -0.02, 0], r: [0, 0, Math.PI / 2], parent: head }));
    }
    if (eq.head === 'gorra') {
      mk(new T.SphereGeometry(0.31, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), kit, { p: [0, 0.04, 0], parent: head, olw: 1.04 });
      mk(cyl(0.2, 0.2, 0.025, 20, 1), kit, { p: [0, 0.075, 0.26], r: [0.1, 0, 0], s: [1.15, 1, 0.9], parent: head, ol: true });
      mk(sph(0.03, 8, 6), '#ffffff', { p: [0, 0.34, 0], parent: head, ol: false });
    }
    if (eq.head === 'sombrero') {
      mk(cyl(0.5, 0.5, 0.025, 28), '#e9d9a8', { p: [0, 0.2, 0], parent: head });
      mk(cyl(0.24, 0.27, 0.22, 20), '#efe0b2', { p: [0, 0.32, 0], parent: head });
      mk(cyl(0.272, 0.272, 0.05, 20), '#7a1f1f', { p: [0, 0.24, 0], parent: head, ol: false });
    }
    if (eq.head === 'boina') {
      mk(sph(0.33, 18, 10), '#2b2f4a', { p: [0.05, 0.2, 0], s: [1, 0.35, 1], parent: head });
      mk(cyl(0.02, 0.02, 0.06, 6), '#2b2f4a', { p: [0.05, 0.35, 0], parent: head, ol: false });
    }
    if (eq.head === 'corona') {
      mk(cyl(0.27, 0.25, 0.1, 22, 1), '#f4c430', { p: [0, 0.27, 0], parent: head, m: { emissive: 0x4a3300 } });
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; mk(new T.ConeGeometry(0.04, 0.14, 5), '#f4c430', { p: [Math.cos(a) * 0.26, 0.38, Math.sin(a) * 0.26], parent: head, m: { emissive: 0x4a3300 } }); mk(sph(0.018, 6, 5), k % 2 ? '#d62828' : '#2ec4b6', { p: [Math.cos(a) * 0.26, 0.46, Math.sin(a) * 0.26], parent: head, ol: false }); }
    }
    if (eq.head === 'bombin') {
      mk(cyl(0.25, 0.27, 0.2, 20), '#1d1d26', { p: [0, 0.3, 0], parent: head });
      mk(cyl(0.34, 0.34, 0.02, 24), '#1d1d26', { p: [0, 0.2, 0], parent: head });
      mk(cyl(0.262, 0.262, 0.04, 20), '#b3202a', { p: [0, 0.23, 0], parent: head, ol: false });
    }
    if (eq.head === 'gorro') {
      mk(new T.SphereGeometry(0.31, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), '#6b2d2d', { p: [0, 0.04, 0], parent: head, olw: 1.04 });
      mk(cyl(0.315, 0.315, 0.06, 18), '#e9e2d0', { p: [0, 0.06, 0], parent: head, ol: false });
      mk(sph(0.06, 8, 6), '#e9e2d0', { p: [0, 0.35, 0], parent: head, ol: false });
    }
    if (eq.head === 'visera') {
      mk(cyl(0.3, 0.3, 0.06, 20, 1, true), kit, { p: [0, 0.12, 0], parent: head, ol: false });
      mk(cyl(0.2, 0.2, 0.025, 20, 1), kit, { p: [0, 0.12, 0.26], r: [0.1, 0, 0], s: [1.15, 1, 0.9], parent: head, ol: true });
    }
    if (eq.face === 'aviador') {
      [-1, 1].forEach(sg => mk(sph(0.062, 12, 8), '#161a22', { p: [sg * 0.095, 0.02, 0.262], s: [1, 0.85, 0.3], parent: head, ol: false, m: { transparent: true, opacity: 0.92 } }));
      mk(box(0.07, 0.01, 0.01), '#c9c9c9', { p: [0, 0.04, 0.268], parent: head, ol: false });
    }
    if (eq.face === 'monoculo') {
      mk(new T.TorusGeometry(0.058, 0.01, 6, 16), '#f4c430', { p: [0.095, 0.02, 0.265], parent: head, ol: false, m: { emissive: 0x4a3300 } });
      mk(cyl(0.004, 0.004, 0.3, 4), '#f4c430', { p: [0.15, -0.12, 0.26], parent: head, ol: false });
    }
    // objetos de mano (derecha)
    const hr = P.handR;
    if (eq.hand === 'libreta') {
      const n = mk(box(0.2, 0.27, 0.035), '#1d3b66', { p: [0.02, 0.0, 0.1], r: [0.4, 0.4, 0.1], parent: hr });
      mk(box(0.17, 0.24, 0.005), '#f4f0e0', { p: [0, 0, 0.02], parent: n, ol: false });
      for (let k = 0; k < 5; k++) mk(cyl(0.008, 0.008, 0.04, 6), '#c8c8c8', { p: [-0.1, -0.1 + k * 0.05, 0], r: [Math.PI / 2, 0, 0], parent: n, ol: false });
    }
    if (eq.hand === 'megafono') {
      const m = new T.Group(); m.position.set(0.02, 0.0, 0.14); m.rotation.set(1.2, 0.0, 0.3); hr.add(m);
      mk(new T.ConeGeometry(0.13, 0.28, 16, 1, true), kit, { p: [0, 0.12, 0], r: [0, 0, Math.PI], parent: m, mat: M(kit, { side: 2 }) });
      mk(cyl(0.04, 0.04, 0.14, 10), '#2b2b33', { p: [0, -0.1, 0], parent: m });
    }
    if (eq.hand === 'baston') {
      mk(cyl(0.015, 0.018, 1.05, 8), '#3a2415', { p: [0, -0.2, 0.0], parent: hr });
      mk(sph(0.05, 12, 8), '#f4c430', { p: [0, 0.33, 0], parent: hr, m: { emissive: 0x4a3300 } });
    }
    if (eq.hand === 'copa') {
      mk(cyl(0.015, 0.03, 0.14, 8), '#f4c430', { p: [0, 0.0, 0.1], parent: hr, ol: false, m: { emissive: 0x4a3300 } });
      mk(cyl(0.1, 0.05, 0.14, 14), '#f4c430', { p: [0, 0.14, 0.1], parent: hr, m: { emissive: 0x4a3300 } });
      [-1, 1].forEach(sg => mk(new T.TorusGeometry(0.05, 0.012, 6, 10), '#f4c430', { p: [sg * 0.11, 0.15, 0.1], parent: hr, ol: false }));
    }
    if (eq.hand === 'cafe') {
      mk(cyl(0.05, 0.04, 0.1, 12), '#f2efe6', { p: [0, 0.02, 0.1], parent: hr });
      mk(cyl(0.044, 0.044, 0.01, 12), '#3a2415', { p: [0, 0.07, 0.1], parent: hr, ol: false });
    }
    if (eq.hand === 'tablet') {
      const n = mk(box(0.24, 0.32, 0.02), '#1b1b24', { p: [0.02, 0.0, 0.1], r: [0.4, 0.4, 0.1], parent: hr });
      mk(box(0.2, 0.28, 0.005), '#2ec4b6', { p: [0, 0, 0.012], parent: n, ol: false });
    }
    // balón
    if (eq.ball === 'balon') {
      const b = new T.Group(); b.position.set(0.32, 0.17, 0.32); g.add(b); P.ball = b;
      mk(sph(0.16, 18, 14), '#ffffff', { parent: b });
      const phi = (1 + Math.sqrt(5)) / 2; const vs = [];
      [[0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi], [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0], [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]].forEach(v => { const vv = new T.Vector3(...v).normalize(); const p = mk(sph(0.05, 8, 6), '#15151c', { p: [vv.x * 0.155, vv.y * 0.155, vv.z * 0.155], s: [1, 1, 0.35], parent: b, ol: false }); p.lookAt(vv.x * 2, vv.y * 2, vv.z * 2); });
    }
    // mascotas
    if (eq.pet === 'mascota') {
      const d = new T.Group(); d.position.set(-0.55, 0.0, 0.35); d.rotation.y = 0.5; g.add(d); P.pet = d;
      mk(cap(0.1, 0.18), '#c68a4e', { p: [0, 0.22, 0], r: [Math.PI / 2, 0, 0], parent: d });
      const dh = mk(sph(0.1, 12, 10), '#c68a4e', { p: [0, 0.32, 0.22], parent: d }); P.petHead = dh;
      mk(box(0.07, 0.06, 0.08), '#e6bd8a', { p: [0, -0.03, 0.09], parent: dh, ol: false });
      mk(sph(0.018, 6, 5), '#111', { p: [0, 0.0, 0.135], parent: dh, ol: false });
      [-1, 1].forEach(sg => { mk(sph(0.015, 6, 5), '#111', { p: [sg * 0.04, 0.04, 0.09], parent: dh, ol: false }); mk(box(0.04, 0.1, 0.05), '#8c5a2b', { p: [sg * 0.09, 0.07, -0.01], r: [0, 0, sg * 0.4], parent: dh, ol: false }); });
      [[-0.06, 0.12], [0.06, 0.12], [-0.06, -0.12], [0.06, -0.12]].forEach(p => mk(cyl(0.025, 0.025, 0.16, 8), '#c68a4e', { p: [p[0], 0.08, p[1]], parent: d, ol: false }));
      P.petTail = mk(cap(0.018, 0.1), '#c68a4e', { p: [0, 0.3, -0.24], r: [-0.8, 0, 0], parent: d, ol: false });
      mk(new T.TorusGeometry(0.075, 0.018, 6, 14), kit, { p: [0, 0.27, 0.15], r: [0.2, 0, 0], parent: d, ol: false });
    }
    if (eq.pet === 'torogoz') {
      const b = new T.Group(); b.position.set(-0.24, 0.62, 0.02); b.scale.setScalar(1.7); torso.add(b); P.bird = b;
      mk(sph(0.06, 10, 8), '#2f9e6a', { s: [1, 1, 1.4], parent: b });
      mk(sph(0.045, 10, 8), '#1f8a5b', { p: [0, 0.05, 0.08], parent: b }); mk(box(0.012, 0.012, 0.05), '#222', { p: [0, 0.04, 0.14], parent: b, ol: false });
      mk(sph(0.032, 8, 6), '#35c2d9', { p: [0, 0.075, 0.07], s: [1.1, 0.5, 1], parent: b, ol: false });
      mk(cyl(0.006, 0.006, 0.28, 5), '#222', { p: [0, -0.02, -0.2], r: [Math.PI / 2 + 0.2, 0, 0], parent: b, ol: false });
      [-1, 1].forEach(sg => mk(sph(0.03, 8, 6), '#2a5db0', { p: [sg * 0.012, -0.08, -0.33], s: [1, 0.35, 1.6], parent: b, ol: false }));
      mk(sph(0.008, 5, 4), '#fff', { p: [0.025, 0.06, 0.115], parent: b, ol: false }); mk(sph(0.008, 5, 4), '#fff', { p: [-0.025, 0.06, 0.115], parent: b, ol: false });
    }
    // piso
    if (eq.floor === 'alfombra') { mk(box(1.1, 0.025, 2.4), '#a3141f', { p: [0, 0.0125 - raise, 0.2], parent: g, ol: false }); mk(box(1.1, 0.026, 0.06), '#f4c430', { p: [0, 0.013 - raise, 1.35], parent: g, ol: false }); }
    if (eq.floor === 'tarima') { mk(cyl(0.8, 0.86, 0.16, 28), '#f4c430', { p: [0, 0.08 - raise, 0], parent: g, m: { emissive: 0x3b2a00 } }); mk(cyl(0.82, 0.82, 0.018, 28), '#fff3b0', { p: [0, 0.16 - raise, 0], parent: g, ol: false }); }
    g.scale.setScalar(cfg.scale || 1);
    return g;
  }

  /* ---- decoración de fondo ---- */
  function trophyMini(col) {
    const g = new T.Group();
    mk(cyl(0.05, 0.06, 0.03, 10), '#5a3b1d', { p: [0, 0.015, 0], parent: g, ol: false });
    mk(cyl(0.012, 0.012, 0.05, 6), col, { p: [0, 0.055, 0], parent: g, ol: false });
    mk(new T.CylinderGeometry(0.06, 0.025, 0.07, 12), col, { p: [0, 0.115, 0], parent: g, ol: false, m: { emissive: 0x3b2a00 } });
    return g;
  }
  function buildDeco(slot, id, cfg) {
    const g = new T.Group();
    const kit = cfg.kit || '#0b6b8f';
    if (slot === 'backL') {
      g.position.set(-1.6, 0, -1.0);
      mk(box(0.9, 1.6, 0.04), '#2a1d14', { p: [0, 0.8, -0.15], parent: g });
      [-1, 1].forEach(sg => mk(box(0.05, 1.6, 0.34), '#4a3426', { p: [sg * 0.425, 0.8, 0], parent: g }));
      mk(box(0.9, 0.06, 0.36), '#4a3426', { p: [0, 1.6, 0], parent: g }); mk(box(0.9, 0.06, 0.36), '#4a3426', { p: [0, 0.03, 0], parent: g });
      const glass = mk(box(0.78, 1.46, 0.02), '#9ad7ff', { p: [0, 0.8, 0.18], parent: g, ol: false, m: { transparent: true, opacity: 0.18 } });
      if (id === 'trofeoMini') {
        const n = Math.min(8, cfg.trophies || 0);
        for (let r = 0; r < 4; r++) { mk(box(0.78, 0.03, 0.3), '#6b4a2f', { p: [0, 0.3 + r * 0.38, 0], parent: g, ol: false }); }
        for (let k = 0; k < 8; k++) { const t = trophyMini(k < n ? '#f4c430' : '#41322a'); t.position.set(-0.27 + (k % 2) * 0.54, 0.31 + Math.floor(k / 2) * 0.38, 0.0); t.scale.setScalar(k < n ? 1 : 0.8); if (k < n) g.add(t); else { t.traverse(o => { if (o.material) o.material = M('#41322a'); }); g.add(t); } }
        g.userData.n = n;
      } else {
        for (let r = 0; r < 4; r++) mk(box(0.78, 0.03, 0.3), '#6b4a2f', { p: [0, 0.3 + r * 0.38, 0], parent: g, ol: false });
        const cols = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#16a085'];
        for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) mk(box(0.1, 0.22 - (k % 2) * 0.05, 0.2), cols[(r * 4 + k) % 6], { p: [-0.28 + k * 0.19, 0.42 + r * 0.38 - (k % 2) * 0.02, 0], parent: g, ol: false });
      }
    }
    if (slot === 'backR') {
      g.position.set(1.55, 0, -1.1);
      if (id === 'pizarra') {
        mk(box(1.1, 0.75, 0.05), '#f4f4ee', { p: [0, 1.1, 0], parent: g });
        mk(box(1.18, 0.83, 0.03), '#6b4a2f', { p: [0, 1.1, -0.03], parent: g, ol: false });
        mk(new T.PlaneGeometry(1.0, 0.65), 0xffffff, { p: [0, 1.1, 0.03], parent: g, ol: false, mat: new T.MeshBasicMaterial({ map: ctex(256, 160, (c, w, h) => { c.fillStyle = '#2f7d3a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(8, 8, w - 16, h - 16); c.beginPath(); c.moveTo(w / 2, 8); c.lineTo(w / 2, h - 8); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, 22, 0, 7); c.stroke(); c.fillStyle = '#ffd23f'; [[60, 50], [60, 110], [100, 80], [150, 40], [150, 120], [190, 80]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 7, 0, 7); c.fill(); }); c.strokeStyle = '#ff6b6b'; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(100, 80); c.lineTo(190, 44); c.stroke(); }) }) });
        [-0.5, 0.5].forEach(x => mk(cyl(0.025, 0.025, 1.3, 6), '#3a2a1f', { p: [x, 0.65, -0.05], r: [0, 0, x * 0.1], parent: g, ol: false }));
      } else {
        mk(box(0.95, 1.15, 0.06), '#4a3220', { p: [0, 1.15, 0], parent: g });
        mk(new T.PlaneGeometry(0.8, 1.0), 0xffffff, { p: [0, 1.15, 0.04], parent: g, ol: false, mat: new T.MeshBasicMaterial({ map: ctex(160, 200, (c, w, h) => { c.fillStyle = '#10151c'; c.fillRect(0, 0, w, h); c.fillStyle = kit; c.beginPath(); c.moveTo(20, 20); c.lineTo(w - 20, 20); c.lineTo(w - 20, h * 0.6); c.quadraticCurveTo(w / 2, h - 10, 20, h * 0.6); c.closePath(); c.fill(); c.strokeStyle = '#f4c430'; c.lineWidth = 6; c.stroke(); c.fillStyle = '#fff'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.fillText(clubInitials(cfg.club), w / 2, h * 0.5); }) }) });
      }
    }
    if (slot === 'flag') {
      g.position.set(1.75, 0, 0.55);
      mk(cyl(0.02, 0.02, 1.9, 6), '#cfcfcf', { p: [0, 0.95, 0], parent: g, ol: false });
      mk(sph(0.04, 8, 6), '#f4c430', { p: [0, 1.92, 0], parent: g, ol: false });
      const fl = mk(new T.PlaneGeometry(id === 'bandera' ? 0.8 : 0.55, id === 'bandera' ? 0.5 : 0.32, 8, 1), 0xffffff, { p: [id === 'bandera' ? 0.42 : 0.3, 1.6, 0], parent: g, ol: false, mat: new T.MeshBasicMaterial({ side: 2, map: ctex(160, 100, (c, w, h) => { if (id === 'bandera') { c.fillStyle = '#0f47af'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.fillRect(0, h / 3, w, h / 3); c.fillStyle = '#2a8f3a'; c.beginPath(); c.arc(w / 2, h / 2, 12, 0, 7); c.fill(); } else { c.fillStyle = kit; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, h / 2); c.lineTo(0, h); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 30px sans-serif'; c.fillText(clubInitials(cfg.club).slice(0, 2), 8, h / 2 + 10); } }) }) });
      g.userData.flag = fl;
    }
    return g;
  }

  /* ----------------------------------------------------------------- escena */
  function mountScene(canvasHost, opts) {
    opts = opts || {};
    const W = () => Math.max(160, canvasHost.clientWidth || 320), H = () => Math.max(220, canvasHost.clientHeight || 360);
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: !opts.low, alpha: true, powerPreference: 'low-power' });
    } catch (e) { return null; }
    const dpr = Math.min(root.devicePixelRatio || 1, opts.low ? 1.5 : 2);
    renderer.setPixelRatio(dpr); renderer.setSize(W(), H(), false);
    renderer.setClearColor(0x000000, 0);
    const cv = renderer.domElement; cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab;outline:none';
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Vista 3D de tu personaje. Arrastra para girar.');
    canvasHost.appendChild(cv);
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(30, W() / H(), 0.1, 50);
    const kitC = opts.kit || '#0b6b8f';
    // luces
    scene.add(new T.HemisphereLight(0xcfe6ff, 0x30283a, 1.35));
    const key = new T.DirectionalLight(0xfff0d6, 2.4); key.position.set(2.5, 4, 3.5); scene.add(key);
    const rimA = new T.SpotLight(new T.Color(kitC), 60, 12, 0.7, 0.6); rimA.position.set(-3, 3, -2.5); rimA.target.position.set(0, 1, 0); scene.add(rimA, rimA.target);
    const rimB = new T.SpotLight(0xffc15a, 45, 12, 0.7, 0.6); rimB.position.set(3, 3, -2.5); rimB.target.position.set(0, 1, 0); scene.add(rimB, rimB.target);
    // piso
    const plat = new T.Group(); scene.add(plat);
    mk(cyl(1.9, 2.0, 0.08, 48), '#161a26', { p: [0, -0.04, 0], parent: plat, ol: false, m: { emissive: 0x05060a } });
    mk(new T.RingGeometry(1.55, 1.7, 64), kitC, { p: [0, 0.006, 0], r: [-Math.PI / 2, 0, 0], parent: plat, ol: false, mat: new T.MeshBasicMaterial({ color: kitC, side: 2 }) });
    mk(new T.RingGeometry(1.8, 1.84, 64), '#f4c430', { p: [0, 0.007, 0], r: [-Math.PI / 2, 0, 0], parent: plat, ol: false, mat: new T.MeshBasicMaterial({ color: 0xf4c430, side: 2 }) });
    const clubTex = ctex(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.10)'; c.font = 'bold 120px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(clubInitials(opts.club), w / 2, h / 2); });
    mk(new T.CircleGeometry(1.4, 40), 0xffffff, { p: [0, 0.008, 0], r: [-Math.PI / 2, 0, 0], parent: plat, ol: false, mat: new T.MeshBasicMaterial({ map: clubTex, transparent: true, depthWrite: false }) });
    // haces de luz
    [[-2.2, -1.6, kitC], [2.2, -1.6, '#ffc15a'], [0, -2.4, '#7ad0ff']].forEach(b => {
      const beam = mk(new T.ConeGeometry(0.8, 4.6, 24, 1, true), b[2], { p: [b[0], 2.3, b[1]], parent: scene, ol: false, mat: new T.MeshBasicMaterial({ color: b[2], transparent: true, opacity: 0.075, blending: T.AdditiveBlending, depthWrite: false, side: 2 }) });
      beam.rotation.z = b[0] * 0.05; beam.userData.beam = true;
    });
    // chispas
    const NP = opts.low ? 30 : 70; const pg = new T.BufferGeometry(); const pp = new Float32Array(NP * 3), pv = new Float32Array(NP);
    for (let i = 0; i < NP; i++) { pp[i * 3] = (Math.random() - 0.5) * 4; pp[i * 3 + 1] = Math.random() * 3; pp[i * 3 + 2] = (Math.random() - 0.5) * 3 - 0.3; pv[i] = 0.05 + Math.random() * 0.12; }
    pg.setAttribute('position', new T.BufferAttribute(pp, 3));
    const sparks = new T.Points(pg, new T.PointsMaterial({ color: 0xffe08a, size: 0.035, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false }));
    scene.add(sparks);
    // confeti
    const NC = 120; const cg = new T.BufferGeometry(); const cp = new Float32Array(NC * 3), cc = new Float32Array(NC * 3), cvv = new Float32Array(NC * 3);
    cg.setAttribute('position', new T.BufferAttribute(cp, 3)); cg.setAttribute('color', new T.BufferAttribute(cc, 3));
    const confetti = new T.Points(cg, new T.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0, depthWrite: false })); scene.add(confetti);
    let confettiT = 0;
    function burst(x, y) {
      const pal = [kitC, '#f4c430', '#ffffff', '#4aa3ff', '#ff6b6b'].map(c => new T.Color(c));
      for (let i = 0; i < NC; i++) { cp[i * 3] = x || 0; cp[i * 3 + 1] = y == null ? 1.2 : y; cp[i * 3 + 2] = 0.3; cvv[i * 3] = (Math.random() - 0.5) * 3.2; cvv[i * 3 + 1] = 1.5 + Math.random() * 3; cvv[i * 3 + 2] = (Math.random() - 0.3) * 2.2; const c = pal[i % pal.length]; cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b; }
      cg.attributes.position.needsUpdate = true; cg.attributes.color.needsUpdate = true; confetti.material.opacity = 1; confettiT = 1.6;
    }
    // sombra blob
    const blobTex = ctex(64, 64, (c) => { const gr = c.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });

    // personajes
    const rig = { fig: null, dt: null, deco: {}, sh: [] };
    const state = { eq: Object.assign({}, opts.eq || {}), look: Object.assign({}, opts.look || {}), prev: null };
    const L = { px: 0, scale: 1 };
    function clearGroup(o) { if (!o) return; scene.remove(o); o.traverse(n => { if (n.geometry && !n.userData.shared) { } }); }
    function rebuild() {
      if (rig.fig) scene.remove(rig.fig);
      rig.sh.forEach(s => scene.remove(s)); rig.sh = [];
      Object.keys(rig.deco).forEach(k => scene.remove(rig.deco[k])); rig.deco = {};
      const eqNow = Object.assign({}, state.eq); if (state.prev) eqNow[(byId[state.prev] || {}).slot] = state.prev;
      const hasDT = !!opts.dt;
      rig.fig = buildFigure({ look: state.look, eq: eqNow, kit: kitC, club: opts.club, role: 'pres' });
      rig.fig.position.x = hasDT ? -0.55 : 0; scene.add(rig.fig);
      const sh = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(rig.fig.position.x, 0.012, 0); scene.add(sh); rig.sh.push(sh);
      if (hasDT && !rig.dt) { }
      if (rig.dt) scene.remove(rig.dt);
      if (hasDT) {
        const dl = Object.assign({}, dtSeedLook(opts.dt.seed));
        rig.dt = buildFigure({ look: dl, eq: Object.assign({ hand: 'libreta' }, opts.dt.eq || {}), kit: kitC, club: opts.club, role: 'dt', scale: 0.96 });
        rig.dt.position.set(0.7, 0, 0.1); rig.dt.rotation.y = -0.45; scene.add(rig.dt);
        const sh2 = sh.clone(); sh2.position.set(0.7, 0.012, 0.1); scene.add(sh2); rig.sh.push(sh2);
      } else rig.dt = null;
      ['backL', 'backR', 'flag'].forEach(sl => { const id = eqNow[sl]; if (id) { const d = buildDeco(sl, id, { kit: kitC, club: opts.club, trophies: opts.trophies || 0 }); rig.deco[sl] = d; scene.add(d); } });
      // balón y mascota cuelgan del personaje principal: ya están dentro de rig.fig
    }
    rebuild();

    // cámara / interacción
    let yaw = 0, yawV = 0, auto = true, lastTouch = 0, hold = false, px = 0;
    const camGoal = { x: 0, y: 1.15, z: 5.2, ty: 0.95, tx: 0 }, camCur = Object.assign({}, camGoal);
    const FOCUS = { head: [0, 1.62, 2.7, 1.5], face: [0, 1.62, 2.3, 1.5], ear: [0, 1.6, 2.5, 1.5], body: [0, 1.05, 3.6, 0.95], neck: [0, 1.4, 2.9, 1.3], wrist: [-0.3, 0.8, 2.8, 0.8], hand: [0.4, 0.85, 3.0, 0.8], feet: [0, 0.35, 3.1, 0.3], ball: [0.3, 0.35, 3.0, 0.2], pet: [-0.4, 0.5, 3.6, 0.35], backL: [-0.7, 1.2, 5.2, 0.9], backR: [0.7, 1.2, 5.2, 0.9], flag: [0.6, 1.3, 5.0, 1.0], floor: [0, 0.9, 5.4, 0.2] };
    function base() { const wide = !!opts.dt; camGoal.x = 0; camGoal.y = wide ? 1.25 : 1.15; camGoal.z = wide ? 6.4 : 5.2; camGoal.ty = 0.95; camGoal.tx = wide ? 0.05 : 0; }
    base();
    let focusTimer = 0;
    function focus(slot) { const f = FOCUS[slot]; if (!f) return; camGoal.x = f[0] * 0.6; camGoal.y = f[1]; camGoal.z = f[2] * (opts.dt ? 1.12 : 1); camGoal.ty = f[3]; camGoal.tx = f[0] * 0.3 - (opts.dt ? 0.3 : 0); focusTimer = 3.2; auto = false; }
    cv.addEventListener('pointerdown', e => { hold = true; px = e.clientX; yawV = 0; auto = false; cv.style.cursor = 'grabbing'; try { cv.setPointerCapture(e.pointerId); } catch (_) { } lastTouch = performance.now(); });
    cv.addEventListener('pointermove', e => { if (!hold) return; const dx = e.clientX - px; px = e.clientX; yaw += dx * 0.012; yawV = dx * 0.012; lastTouch = performance.now(); });
    const up = e => { if (hold && Math.abs(yawV) < 0.002 && performance.now() - lastTouch < 250) cheer(); hold = false; cv.style.cursor = 'grab'; lastTouch = performance.now(); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { hold = false; });
    cv.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') yaw -= 0.2; if (e.key === 'ArrowRight') yaw += 0.2; if (e.key === 'Enter' || e.key === ' ') cheer(); });
    cv.tabIndex = 0;
    let cheerT = 0;
    function cheer() { cheerT = 1.1; burst(rig.fig ? rig.fig.position.x : 0, 1.5); if (opts.onCheer) opts.onCheer(); }

    // bucle
    let running = true, visible = true, last = performance.now(), t = 0, slow = 0, raf = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!running || !visible || document.hidden) { last = now; return; }
      let dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      if (dt > 0.034) slow++; else slow = Math.max(0, slow - 1);
      if (slow > 90 && renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); renderer.setSize(W(), H(), false); slow = 0; }
      if (!hold) { yaw += yawV; yawV *= 0.92; if (!auto && performance.now() - lastTouch > 4500 && focusTimer <= 0) auto = true; }
      if (auto && !hold) yaw += (Math.sin(t * 0.35) * 0.42 - yaw) * dt * 0.9;
      if (focusTimer > 0) { focusTimer -= dt; if (focusTimer <= 0) base(); }
      const k = 1 - Math.pow(0.0005, dt);
      camCur.x += (camGoal.x - camCur.x) * k; camCur.y += (camGoal.y - camCur.y) * k; camCur.z += (camGoal.z - camCur.z) * k; camCur.ty += (camGoal.ty - camCur.ty) * k; camCur.tx += (camGoal.tx - camCur.tx) * k;
      const r = camCur.z, cx = camCur.tx, cz = 0;
      cam.position.set(cx + Math.sin(yaw) * r + camCur.x, camCur.y, cz + Math.cos(yaw) * r); cam.lookAt(cx, camCur.ty, 0);
      // animación de personajes
      [rig.fig, rig.dt].forEach((f, idx) => {
        if (!f) return; const P = f.userData.parts, ph = t * 1.6 + idx * 1.7;
        P.torso.scale.y = 1 + Math.sin(ph) * 0.012; P.head.rotation.y = Math.sin(t * 0.7 + idx) * 0.18; P.head.rotation.z = Math.sin(t * 0.5 + idx) * 0.03;
        P.armL.rotation.x = Math.sin(ph) * 0.05; P.armR.rotation.x = -Math.sin(ph) * 0.05;
        const bl = (Math.sin(t * 0.9 + idx * 2) > 0.985) ? 0.15 : 1; P.eyeL.scale.y = bl * 1.15; P.eyeR.scale.y = bl * 1.15;
        if (idx === 0 && cheerT > 0) { const p = 1 - cheerT / 1.1; f.position.y = (f.userData.base || 0) + Math.sin(p * Math.PI) * 0.35 + (f.position.y > 0.1 && !f.userData.base ? 0 : 0); P.armL.rotation.z = 0.08 + Math.sin(p * Math.PI) * 2.6; P.armR.rotation.z = -0.08 - Math.sin(p * Math.PI) * 2.6; P.mouth.scale.y = 1.4; }
        else if (idx === 0) { P.armL.rotation.z = 0.08; P.armR.rotation.z = -0.08; if (P.mouth) P.mouth.scale.y = 1; }
        if (P.petTail) P.petTail.rotation.z = Math.sin(t * 9) * 0.5;
        if (P.petHead) P.petHead.rotation.z = Math.sin(t * 1.2) * 0.12;
        if (P.ball) { P.ball.position.y = 0.17 + Math.abs(Math.sin(t * 2.2)) * 0.05; P.ball.rotation.y += dt * 1.5; }
        if (P.bird) P.bird.rotation.z = Math.sin(t * 2.6) * 0.06;
      });
      if (cheerT > 0) { cheerT -= dt; if (cheerT <= 0 && rig.fig) rig.fig.position.y = rig.fig.userData.base || 0; }
      const hf = rig.deco.flag && rig.deco.flag.userData.flag; if (hf) hf.rotation.y = Math.sin(t * 2.4) * 0.12;
      scene.children.forEach(o => { if (o.userData && o.userData.beam) o.material.opacity = 0.06 + Math.sin(t * 1.3 + o.position.x) * 0.02; });
      const a = sparks.geometry.attributes.position; for (let i = 0; i < NP; i++) { let y = a.array[i * 3 + 1] + pv[i] * dt * 2; if (y > 3.2) y = 0; a.array[i * 3 + 1] = y; } a.needsUpdate = true;
      if (confettiT > 0) { confettiT -= dt; const ca = cg.attributes.position; for (let i = 0; i < NC; i++) { cvv[i * 3 + 1] -= 6.5 * dt; ca.array[i * 3] += cvv[i * 3] * dt; ca.array[i * 3 + 1] += cvv[i * 3 + 1] * dt; ca.array[i * 3 + 2] += cvv[i * 3 + 2] * dt; } ca.needsUpdate = true; confetti.material.opacity = Math.max(0, Math.min(1, confettiT)); }
      renderer.render(scene, cam);
    }
    raf = requestAnimationFrame(frame);
    const ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(() => { renderer.setSize(W(), H(), false); cam.aspect = W() / H(); cam.updateProjectionMatrix(); }) : null; if (ro) ro.observe(canvasHost);
    cam.aspect = W() / H(); cam.updateProjectionMatrix();
    const io = (typeof IntersectionObserver !== 'undefined') ? new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.01 }) : null; if (io) io.observe(canvasHost);
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); running = false; if (opts.onLost) opts.onLost(); });
    cv.addEventListener('webglcontextrestored', () => { running = true; });

    return {
      el: cv, burst, cheer, focus, yaw(v) { yaw = v; auto = false; lastTouch = performance.now() + 60000; },
      setEq(eq) { state.eq = Object.assign({}, eq); state.prev = null; rebuild(); },
      setLook(l) { state.look = Object.assign({}, l); rebuild(); },
      preview(id) { state.prev = id || null; rebuild(); if (id) { focus((byId[id] || {}).slot); } },
      setOpts(o) { Object.assign(opts, o); rebuild(); base(); },
      snapshot() { renderer.render(scene, cam); return cv.toDataURL('image/png'); },
      destroy() { running = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { } if (cv.parentNode) cv.parentNode.removeChild(cv); }
    };
  }

  /* ---------------------------------------------------------- UI de probador */
  const esc2 = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let CUR = null; // instancia viva
  let tab = 'head', trying = null;

  function trophiesCount() { try { const h = hallStats(); const t = h.trofeos || {}; return (t.liga || 0) + (t.copaPresidente || 0) + (t.centroamericana || 0) + (t.concacaf || 0) + (t.campeonCampeones || 0); } catch (e) { return 0; } }
  function currentEq() { const a = ensure(); return a ? Object.assign({}, a.eq) : {}; }
  function roleName() { return (typeof G !== 'undefined' && G && G.rol === 'presidente') ? 'Presidente' : 'DT'; }

  function wardrobeHTML() {
    const a = ensure(); if (!a) return '';
    const own = a.items.length, tot = CATALOG.length;
    return `<div class="av-wrap" id="av-wrap">
      <div class="av-stage"><div class="av-canvas" id="av-canvas"><div class="av-loading" id="av-loading">⚽ Preparando el probador 3D…</div></div>
        <div class="av-hud"><span class="av-chip">${esc2(roleName())} <b>${esc2(G.managerName)}</b></span><span class="av-chip gold">💳 ${money(G.managerWallet || 0)}</span></div>
        <div class="av-hint">Arrastra para girar · toca al personaje para celebrar</div>
        <div class="av-try hidden" id="av-try"></div>
      </div>
      <div class="av-panel">
        <div class="av-title">👔 Probador · ${own}/${tot} objetos</div>
        <div class="av-tabs" id="av-tabs">${SLOTS.map(s => `<button class="av-tab ${s[0] === tab ? 'on' : ''}" data-slot="${s[0]}" onclick="AV3D.tab('${s[0]}')" title="${s[1]}"><span>${s[2]}</span><i>${s[1]}</i></button>`).join('')}<button class="av-tab ${tab === 'look' ? 'on' : ''}" data-slot="look" onclick="AV3D.tab('look')"><span>🧑</span><i>Aspecto</i></button></div>
        <div class="av-items" id="av-items"></div>
      </div></div>`;
  }
  function itemsHTML() {
    const a = ensure(); if (!a) return '';
    if (tab === 'look') {
      const l = a.look;
      return `<div class="av-look"><div class="av-lab">Piel</div><div class="av-sw">${SKIN.map((c, i) => `<button class="${l.piel === i ? 'on' : ''}" style="background:${c}" aria-label="Piel ${i + 1}" onclick="AV3D.look('piel',${i})"></button>`).join('')}</div>
      <div class="av-lab">Peinado</div><div class="av-chips">${HAIRS.map(h => `<button class="${l.pelo === h[0] ? 'on' : ''}" onclick="AV3D.look('pelo','${h[0]}')">${h[1]}</button>`).join('')}</div>
      <div class="av-lab">Color de pelo</div><div class="av-sw">${HAIRC.map((c, i) => `<button class="${l.pcolor === i ? 'on' : ''}" style="background:${c}" aria-label="Color ${i + 1}" onclick="AV3D.look('pcolor',${i})"></button>`).join('')}</div>
      <div class="av-lab">Barba</div><div class="av-chips">${BEARDS.map(h => `<button class="${l.barba === h[0] ? 'on' : ''}" onclick="AV3D.look('barba','${h[0]}')">${h[1]}</button>`).join('')}</div>
      <p class="av-note">El aspecto es gratis. Cámbialo cuando quieras.</p></div>`;
    }
    const list = CATALOG.filter(c => c[2] === tab);
    const eqId = a.eq[tab];
    return `<div class="av-grid">` + (list.map(c => {
      const it = byId[c[0]], has = a.items.includes(it.id), on = eqId === it.id, rr = RAR[it.rareza];
      const st = on ? '<em class="s on">PUESTO</em>' : has ? '<em class="s">EN ARMARIO</em>' : `<em class="s p">${money(it.precio)}</em>`;
      return `<button class="av-card r-${it.rareza} ${on ? 'on' : ''} ${trying === it.id ? 'try' : ''}" onclick="AV3D.try('${it.id}')"><span class="ico">${it.icono}</span><b>${esc2(it.nombre)}</b><small style="color:${rr[1]}">${rr[0]}</small>${st}</button>`;
    }).join('') || '<p class="muted">Nada aquí.</p>') + `</div>` + (eqId ? `<div class="av-actions"><button class="btn btn-sm" onclick="AV3D.unequip('${tab}')">Quitar ${esc2(byId[eqId].nombre)}</button></div>` : '');
  }
  function tryHTML() {
    const it = trying && byId[trying]; if (!it) return '';
    const has = owns(it.id), a = ensure(), on = a.eq[it.slot] === it.id;
    const can = (G.managerWallet || 0) >= it.precio;
    return `<div class="av-try-in"><div><b>${it.icono} ${esc2(it.nombre)}</b><br><small>${esc2(it.desc)}</small></div><div class="av-try-btns">${has ? (on ? `<button class="btn btn-sm" onclick="AV3D.unequip('${it.slot}')">Quitar</button>` : `<button class="btn btn-p btn-sm" onclick="AV3D.wear('${it.id}')">Ponérmelo</button>`) : `<button class="btn btn-p btn-sm" ${can ? '' : 'disabled'} onclick="AV3D.buyNow('${it.id}')">${can ? 'Comprar ' + money(it.precio) : 'Faltan ' + money(it.precio - (G.managerWallet || 0))}</button>`}<button class="btn btn-sm" onclick="AV3D.cancelTry()">✕</button></div></div>`;
  }
  function refreshUI() {
    const it = document.getElementById('av-items'); if (it) it.innerHTML = itemsHTML();
    const tb = document.querySelectorAll('#av-tabs .av-tab'); tb.forEach(b => b.classList.toggle('on', b.dataset.slot === tab));
    const tr = document.getElementById('av-try'); if (tr) { if (trying) { tr.classList.remove('hidden'); tr.innerHTML = tryHTML(); } else { tr.classList.add('hidden'); tr.innerHTML = ''; } }
    const hud = document.querySelector('.av-hud .gold'); if (hud) hud.textContent = '💳 ' + money(G.managerWallet || 0);
    const ttl = document.querySelector('.av-title'); if (ttl) { const a = ensure(); ttl.textContent = '👔 Probador · ' + a.items.length + '/' + CATALOG.length + ' objetos'; }
  }
  function sceneOpts() {
    const u = (typeof userClub === 'function') ? userClub() : null; const o = { kit: (u && u.color) || '#0b6b8f', club: u, trophies: trophiesCount(), look: ensure().look, eq: currentEq(), low: (typeof PICK_DEVICE !== 'undefined' && PICK_DEVICE === 'phone') };
    if (G.rol === 'presidente' && G.pres && G.pres.dt) o.dt = { seed: G.pres.dt.id || G.pres.dt.nombre };
    return o;
  }
  function destroy() { if (CUR) { try { CUR.destroy(); } catch (e) { } CUR = null; } }
  function mountInto(el, optsExtra) {
    destroy(); if (!el) return Promise.resolve(null);
    const host = el.querySelector('.av-canvas') || el;
    if (!webglOK()) { host.innerHTML = '<div class="av-fallback"><div style="font-size:64px">🧑‍💼</div><p>Tu dispositivo no permite gráficos 3D.<br><small>El probador funciona igual: elige objetos y compra.</small></p></div>'; return Promise.resolve(null); }
    return loadThree().then(() => {
      init3(); const so = Object.assign(sceneOpts(), optsExtra || {});
      const ld = host.querySelector('.av-loading'); if (ld) ld.remove();
      CUR = mountScene(host, so);
      if (!CUR) host.innerHTML = '<div class="av-fallback"><div style="font-size:64px">🧑‍💼</div><p>No se pudo iniciar el 3D en este dispositivo.</p></div>';
      return CUR;
    }).catch(err => { host.innerHTML = '<div class="av-fallback"><div style="font-size:64px">🧑‍💼</div><p>Sin conexión para cargar el 3D.<br><small>' + esc2(err.message) + '</small></p></div>'; return null; });
  }
  const API = {
    CATALOG, SLOTS, byId, DEFAULT_LOOK, SKIN, HAIRC, ensure, owns, buy, equip, setLook, dtSeedLook, webglOK, loadThree,
    wardrobeHTML, mountInto, destroy,
    tab(s) { tab = s; trying = null; if (CUR && CUR.setEq) CUR.setEq(currentEq()); refreshUI(); if (CUR && s !== 'look' && CUR.focus) CUR.focus(s); },
    try(id) { trying = id; const it = byId[id]; if (it) { tab = it.slot; } if (CUR && CUR.preview) CUR.preview(id); refreshUI(); },
    cancelTry() { trying = null; if (CUR) CUR.setEq(currentEq()); refreshUI(); },
    wear(id) { const it = byId[id]; if (equip(it.slot, id)) { trying = null; if (CUR) { CUR.setEq(currentEq()); CUR.burst(0, 1.3); } toast(it.nombre + ' puesto'); } refreshUI(); },
    unequip(slot) { equip(slot, null); trying = null; if (CUR) CUR.setEq(currentEq()); refreshUI(); },
    buyNow(id) { const r = buy(id); toast(r.msg); if (r.ok) { trying = null; if (CUR) { CUR.setEq(currentEq()); CUR.burst(0, 1.3); } if (typeof renderTopbar === 'function') renderTopbar(); } refreshUI(); },
    look(k, v) { setLook(k, v); if (CUR) CUR.setLook(ensure().look); refreshUI(); },
    // monta el probador completo dentro de un contenedor
    wardrobe(container) { if (!container) return; container.innerHTML = wardrobeHTML(); refreshUI(); return mountInto(container.querySelector('.av-wrap')); },
    // escenario sin tienda (Despacho)
    stageHTML(id) { return `<div class="av-stage av-stage-solo" id="${id || 'av-stage'}"><div class="av-canvas"><div class="av-loading">⚽ Cargando 3D…</div></div><div class="av-hint">Arrastra para girar · toca para celebrar</div></div>`; },
    mountStage(container, extra) { if (!container) return Promise.resolve(null); return mountInto(container, extra); },
    resetTab() { tab = 'head'; trying = null; }
  };
  root.AV3D = API;
})(typeof window !== 'undefined' ? window : globalThis);
