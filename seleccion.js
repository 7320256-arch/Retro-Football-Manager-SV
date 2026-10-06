/* seleccion.js — Selección de El Salvador (Retro Football Manager SV v2.0)
 * Convocatoria de 23 desde la liga + legionarios, Liga de Naciones, Copa Oro, Eliminatorias y Mundial.
 * Las plantillas rivales NO se guardan: cada selección se define por una tabla estática + una semilla.
 * Los partidos de selección no afectan al club (v1). Expone window.SEL; el juego lo invoca con ganchos protegidos. */
(function (root) {
'use strict';
const $ = id => document.getElementById(id);
const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cl = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- universo de selecciones (id, nombre, confederación, rating en la escala del juego) ---------- */
const TEAMS = [
  ['MEX', 'México', 'CON', 79], ['USA', 'Estados Unidos', 'CON', 79], ['CAN', 'Canadá', 'CON', 75], ['PAN', 'Panamá', 'CON', 72], ['CRC', 'Costa Rica', 'CON', 71],
  ['JAM', 'Jamaica', 'CON', 69], ['HON', 'Honduras', 'CON', 68], ['HAI', 'Haití', 'CON', 65], ['CUW', 'Curazao', 'CON', 64], ['GUA', 'Guatemala', 'CON', 63],
  ['SUR', 'Surinam', 'CON', 62], ['TRI', 'Trinidad y Tobago', 'CON', 61], ['DOM', 'Rep. Dominicana', 'CON', 56], ['NCA', 'Nicaragua', 'CON', 55], ['CUB', 'Cuba', 'CON', 55], ['SLV', 'El Salvador', 'CON', 66],
  ['GUY', 'Guyana', 'CON', 55], ['PUR', 'Puerto Rico', 'CON', 54], ['MTQ', 'Martinica', 'CON', 53], ['GRN', 'Granada', 'CON', 51], ['BER', 'Bermudas', 'CON', 50],
  ['ATG', 'Antigua y Barbuda', 'CON', 49], ['SKN', 'San Cristóbal y Nieves', 'CON', 48], ['BLZ', 'Belice', 'CON', 48], ['LCA', 'Santa Lucía', 'CON', 47], ['VIN', 'San Vicente', 'CON', 47],
  ['BRB', 'Barbados', 'CON', 45], ['DMA', 'Dominica', 'CON', 44], ['CAY', 'Islas Caimán', 'CON', 43], ['ARU', 'Aruba', 'CON', 42], ['BAH', 'Bahamas', 'CON', 40],
  ['MSR', 'Montserrat', 'CON', 38], ['GLP', 'Guadalupe', 'CON', 50], ['GUF', 'Guayana Francesa', 'CON', 40], ['BON', 'Bonaire', 'CON', 35], ['VIR', 'Islas Vírgenes EE.UU.', 'CON', 34],
  ['TCA', 'Islas Turcas y Caicos', 'CON', 33], ['SMA', 'San Martín', 'CON', 33], ['VGB', 'Islas Vírgenes Británicas', 'CON', 32], ['SXM', 'Sint Maarten', 'CON', 31], ['AIA', 'Anguila', 'CON', 30],
  ['ARG', 'Argentina', 'SUD', 90], ['BRA', 'Brasil', 'SUD', 87], ['URU', 'Uruguay', 'SUD', 82], ['COL', 'Colombia', 'SUD', 81], ['ECU', 'Ecuador', 'SUD', 77], ['PAR', 'Paraguay', 'SUD', 73],
  ['CHI', 'Chile', 'SUD', 71], ['PER', 'Perú', 'SUD', 69], ['VEN', 'Venezuela', 'SUD', 66], ['BOL', 'Bolivia', 'SUD', 62],
  ['FRA', 'Francia', 'EUR', 88], ['ESP', 'España', 'EUR', 88], ['ENG', 'Inglaterra', 'EUR', 87], ['POR', 'Portugal', 'EUR', 86], ['GER', 'Alemania', 'EUR', 85], ['NED', 'Países Bajos', 'EUR', 84],
  ['ITA', 'Italia', 'EUR', 83], ['BEL', 'Bélgica', 'EUR', 82], ['CRO', 'Croacia', 'EUR', 81], ['DEN', 'Dinamarca', 'EUR', 78], ['SUI', 'Suiza', 'EUR', 78], ['AUT', 'Austria', 'EUR', 77],
  ['TUR', 'Turquía', 'EUR', 76], ['NOR', 'Noruega', 'EUR', 76], ['SWE', 'Suecia', 'EUR', 75], ['SRB', 'Serbia', 'EUR', 74], ['UKR', 'Ucrania', 'EUR', 74], ['POL', 'Polonia', 'EUR', 73],
  ['SCO', 'Escocia', 'EUR', 72], ['CZE', 'Chequia', 'EUR', 72],
  ['MAR', 'Marruecos', 'AFR', 79], ['SEN', 'Senegal', 'AFR', 78], ['NGA', 'Nigeria', 'AFR', 75], ['CIV', 'Costa de Marfil', 'AFR', 75], ['EGY', 'Egipto', 'AFR', 74], ['ALG', 'Argelia', 'AFR', 73],
  ['CMR', 'Camerún', 'AFR', 72], ['TUN', 'Túnez', 'AFR', 71], ['GHA', 'Ghana', 'AFR', 71], ['MLI', 'Malí', 'AFR', 70], ['COD', 'RD Congo', 'AFR', 67], ['RSA', 'Sudáfrica', 'AFR', 66],
  ['JPN', 'Japón', 'ASI', 79], ['KOR', 'Corea del Sur', 'ASI', 78], ['IRN', 'Irán', 'ASI', 76], ['AUS', 'Australia', 'ASI', 74], ['KSA', 'Arabia Saudita', 'ASI', 70], ['UZB', 'Uzbekistán', 'ASI', 68],
  ['QAT', 'Catar', 'ASI', 66], ['JOR', 'Jordania', 'ASI', 66], ['IRQ', 'Irak', 'ASI', 65], ['UAE', 'Emiratos Árabes', 'ASI', 64],
  ['NZL', 'Nueva Zelanda', 'OCE', 61], ['NCL', 'Nueva Caledonia', 'OCE', 45]
];
const BY = {}; TEAMS.forEach(t => { BY[t[0]] = { id: t[0], n: t[1], c: t[2], r: t[3] }; });
const A0 = ['MEX', 'USA', 'CAN', 'PAN', 'CRC', 'JAM', 'HON', 'HAI', 'CUW', 'GUA', 'SUR', 'TRI', 'DOM', 'NCA', 'CUB', 'SLV'];
const B0 = ['GUY', 'PUR', 'MTQ', 'GRN', 'BER', 'ATG', 'SKN', 'BLZ', 'LCA', 'VIN', 'BRB', 'DMA', 'CAY', 'ARU', 'BAH', 'MSR'];
const KINDS = ['NL', 'GOLD', 'WCQ', 'WC']; // ciclo de 4 temporadas: 2026 NL, 2027 Copa Oro, 2028 Eliminatorias, 2029 Mundial
const KNAME = { NL: 'Liga de Naciones', GOLD: 'Copa Oro', WCQ: 'Eliminatorias mundialistas', WC: 'Mundial' };
const KICON = { NL: '🌎', GOLD: '🥇', WCQ: '🧭', WC: '🏆' };
const ROUND_NAME = { SF: 'Semifinales', F: 'Final', QF: 'Cuartos de final', R32: 'Dieciseisavos', R16: 'Octavos de final' };
const WINJOR = [8, 16];
const POSN = { POR: 'Porteros', DEF: 'Defensas', MED: 'Medios', DEL: 'Delanteros' };
const QUOTA = { POR: 3, DEF: 7, MED: 8, DEL: 5 };

/* ---------- utilidades ---------- */
function mulberry(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hstr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function bracketOrder(n) { let o = [1]; while (o.length < n) { const m = o.length * 2; const nx = []; o.forEach(s => { nx.push(s, m + 1 - s); }); o = nx; } return o; }
function nm(id) { return BY[id] ? BY[id].n : id; }
function money$(n) { return typeof money === 'function' ? money(n) : '$' + n; }

/* ---------- estado ---------- */
function newSel() {
  return { on: false, seed: (Math.random() * 1e9) | 0, since: 0, conf: 60, ban: 0, offerY: 0, year: 0, comp: null, conv: [], form: '4-3-3', ment: 'Equilibrada',
    A: A0.slice(), B: B0.slice(), drift: {}, win: null, hist: [], stats: {}, rec: { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 }, wcq: [], tab: 'res', spent: 0 };
}
function S() { if (!G.sel) G.sel = newSel(); return G.sel; }
function isPres() { return !!(root.PRES && PRES.isPres && PRES.isPres()); }
function usable() { return !!(typeof G !== 'undefined' && G && G.clubes && !G.reto && !isPres() && !(root.PRES && PRES.isFund && PRES.isFund())); }

/* ---------- jugadores: club + legionarios (semilla) ---------- */
let LEGC = null;
function mkLeg(pos, k) {
  const s = S(), y = s.year || G.temporada;
  const rn = mulberry(s.seed + k * 977), ry = mulberry(s.seed + k * 131 + y);
  const nom = NOMBRES[Math.floor(rn() * NOMBRES.length)] + ' ' + APELLIDOS[Math.floor(rn() * APELLIDOS.length)];
  const ovr = cl(Math.round(63 + rn() * 9 + (ry() - 0.5) * 5), 58, 80);
  const o = { ataque: ovr, defensa: ovr, fisico: ovr, porteria: 20 };
  if (pos === 'POR') { o.defensa = Math.round(ovr * 0.8); o.fisico = Math.round(ovr * 0.8); o.porteria = Math.round(ovr * 1.133); o.ataque = 15; }
  else if (pos === 'DEF') { o.ataque = Math.round(ovr * 0.7); o.fisico = ovr; o.defensa = Math.round(ovr * 1.109); o.porteria = 15; }
  else if (pos === 'DEL') { o.fisico = Math.round(ovr * 0.9); o.defensa = Math.round(ovr * 0.6); o.ataque = Math.round(ovr * 1.142); o.porteria = 10; }
  const org = ['Estados Unidos', 'México', 'Guatemala', 'Costa Rica', 'España', 'Italia', 'Canadá', 'Honduras'][Math.floor(rn() * 8)];
  const p = { id: 'L' + k, nombre: nom, posicion: pos, edad: 23 + Math.floor(rn() * 10), atributos: o, energia: 100, lesionado: false, suspended: 0, nacionalidad: 'El Salvador', equipoOrigen: org, legion: true, stats: { goles: 0, asistencias: 0, atajadas: 0, pj: 0 } };
  p.media = calcMedia(p); return p;
}
function legionarios() {
  const s = S(), key = s.seed + '|' + (s.year || G.temporada);
  if (LEGC && LEGC.key === key) return LEGC.list;
  const plan = ['POR', 'DEF', 'DEF', 'MED', 'MED', 'MED', 'DEL', 'DEL'];
  LEGC = { key, list: plan.map((pos, k) => mkLeg(pos, k)) }; return LEGC.list;
}
function pool() {
  const out = [];
  Object.values(G.clubes).forEach(c => c.plantilla.forEach(p => { if (p.nacionalidad === 'El Salvador') out.push({ p, club: c.nombre, cid: c.id }); }));
  legionarios().forEach(p => out.push({ p, club: p.equipoOrigen, cid: null }));
  return out;
}
function pmap() { const m = {}; pool().forEach(x => { m[x.p.id] = x; }); return m; }
function autoConv() {
  const s = S(), all = pool(), ids = [], used = new Set();
  POS.forEach(pos => all.filter(x => x.p.posicion === pos && !x.p.lesionado).sort((a, b) => b.p.media - a.p.media).slice(0, QUOTA[pos]).forEach(x => { ids.push(x.p.id); used.add(x.p.id); }));
  if (ids.length < 23) all.filter(x => !used.has(x.p.id) && !x.p.lesionado).sort((a, b) => b.p.media - a.p.media).slice(0, 23 - ids.length).forEach(x => ids.push(x.p.id));
  s.conv = ids.slice(0, 23); return s.conv;
}
function convCheck() {
  const s = S(), m = pmap(), c = { POR: 0, DEF: 0, MED: 0, DEL: 0 }; let n = 0;
  s.conv.forEach(id => { const x = m[id]; if (x) { c[x.p.posicion]++; n++; } });
  const errs = []; if (n !== 23) errs.push('Debes convocar 23 jugadores (llevas ' + n + ')'); if (c.POR < 2 || c.POR > 4) errs.push('Entre 2 y 4 porteros'); if (c.DEF < 5) errs.push('Mínimo 5 defensas'); if (c.MED < 5) errs.push('Mínimo 5 medios'); if (c.DEL < 3) errs.push('Mínimo 3 delanteros');
  return { n, c, errs, ok: !errs.length };
}
function fixConv() {
  const s = S(), m = pmap(); const before = s.conv.length; let ch = 0;
  s.conv = s.conv.filter(id => { const x = m[id]; if (!x || x.p.lesionado) { ch++; return false; } return true; });
  const need = 23 - s.conv.length;
  if (need > 0) {
    const have = new Set(s.conv); const cnt = { POR: 0, DEF: 0, MED: 0, DEL: 0 }; s.conv.forEach(id => cnt[m[id].p.posicion]++);
    const cand = Object.values(m).filter(x => !have.has(x.p.id) && !x.p.lesionado).sort((a, b) => b.p.media - a.p.media);
    for (let i = 0; i < need; i++) {
      let pick1 = cand.find(x => !have.has(x.p.id) && cnt[x.p.posicion] < QUOTA[x.p.posicion]) || cand.find(x => !have.has(x.p.id));
      if (!pick1) break; have.add(pick1.p.id); s.conv.push(pick1.p.id); cnt[pick1.p.posicion]++;
    }
  }
  if (!s.conv.length) autoConv();
  return ch || before !== s.conv.length;
}
function squadPlayers() { const m = pmap(); return S().conv.map(id => m[id] && m[id].p).filter(Boolean); }
function slvXI(form) { return bestXI(squadPlayers(), form || S().form); }
function slvRating(form) {
  const xi = slvXI(form); if (!xi.length) return BY.SLV.r;
  return Math.round((xi.reduce((a, p) => a + p.media, 0) / xi.length + ((G.reputacion || 50) - 50) / 25 - 4) * 10) / 10;
}

/* ---------- fuerza de cada selección ---------- */
function base(id) { return BY[id].r + (S().drift[id] || 0); }
function strength(id) { return id === 'SLV' ? slvRating() : base(id); }
function driftYear(y) {
  const s = S(); const r = mulberry(s.seed + y * 31);
  TEAMS.forEach(t => { if (t[0] === 'SLV') return; const d = (s.drift[t[0]] || 0) + (r() - 0.5) * 3; s.drift[t[0]] = Math.round(cl(d, -6, 6) * 10) / 10; });
}

/* ---------- motor de partido ---------- */
function eg(ra, rb, homeA, ment) {
  const diff = ra - rb + (homeA || 0), ratio = Math.exp(diff / 20);
  let la = cl(1.22 * ratio, 0.18, 3.8), lb = cl(1.0 / ratio, 0.10, 3.2);
  if (diff > 8) { lb *= cl(1 - (diff - 8) * 0.035, 0.35, 1); la *= 1 + Math.min(0.28, (diff - 8) * 0.015); }
  if (diff < -8) { la *= cl(1 - (-diff - 8) * 0.035, 0.35, 1); lb *= 1 + Math.min(0.28, (-diff - 8) * 0.015); }
  if (ment === 'Ofensiva') { la *= 1.12; lb *= 1.10; } else if (ment === 'Defensiva') { la *= 0.88; lb *= 0.84; }
  return { la, lb, diff };
}
function shootout(ra, rb) {
  const pa = cl(0.76 + (ra - rb) / 400, 0.68, 0.84), pb = cl(0.76 - (ra - rb) / 400, 0.68, 0.84); let a = 0, b = 0;
  for (let i = 0; i < 5; i++) { if (Math.random() < pa) a++; if (Math.random() < pb) b++; }
  while (a === b) { if (Math.random() < pa) a++; if (Math.random() < pb) b++; }
  return [a, b];
}
function simGame(ra, rb, o) {
  o = o || {}; const g = eg(ra, rb, o.homeA, o.ment);
  let ga = poisson(g.la), gb = poisson(g.lb);
  if (g.diff >= 9 && gb - ga >= 3) gb = ga + 1 + rnd(2); if (g.diff <= -9 && ga - gb >= 3) ga = gb + 1 + rnd(2);
  const res = { ga, gb, et: false, pen: null, ea: 0, eb: 0 };
  if (o.ko && ga === gb) {
    res.et = true; res.ea = poisson(g.la * 0.32); res.eb = poisson(g.lb * 0.32); res.ga += res.ea; res.gb += res.eb;
    if (res.ga === res.gb) res.pen = shootout(ra, rb);
  }
  res.w = res.ga > res.gb ? 'a' : res.ga < res.gb ? 'b' : res.pen ? (res.pen[0] > res.pen[1] ? 'a' : 'b') : 'd';
  return res;
}

/* ---------- competiciones ---------- */
const SCHED_S = [[[0, 3], [1, 2]], [[0, 2], [3, 1]], [[0, 1], [2, 3]]];
const SCHED_D = SCHED_S.concat(SCHED_S.map(r => r.map(p => [p[1], p[0]])));
function kindOf(y) { return KINDS[((y - 2026) % 4 + 4) % 4]; }
function potGroups(ids, ng, r) {
  const sorted = ids.slice().sort((a, b) => strength(b) - strength(a) || (a < b ? -1 : 1)), size = Math.ceil(ids.length / ng);
  const gs = Array.from({ length: ng }, () => []);
  for (let pot = 0; pot < size; pot++) { const p = sorted.slice(pot * ng, (pot + 1) * ng); shuffle(p, r); p.forEach((id, g) => gs[g].push(id)); }
  return gs.map(g => ({ ids: g, res: [] }));
}
function wcTeams() {
  const s = S(); const out = [];
  let con = s.wcq && s.wcq.length ? s.wcq.slice() : s.A.slice().sort((a, b) => base(b) - base(a)).slice(0, 6);
  con = con.slice(0, 6); out.push(...con);
  const by = c => TEAMS.filter(t => t[3] && t[2] === c && !out.includes(t[0])).map(t => t[0]).sort((a, b) => base(b) - base(a));
  const take = (c, n) => by(c).slice(0, n).forEach(id => out.push(id));
  take('EUR', 16); take('SUD', 7); take('AFR', 9); take('ASI', 8); take('OCE', 1);
  const rest = TEAMS.map(t => t[0]).filter(id => !out.includes(id)).sort((a, b) => base(b) - base(a));
  while (out.length < 48) out.push(rest.shift());
  return out;
}
function buildComp(kind, y) {
  const s = S(), r = mulberry(s.seed + y * 7 + hstr(kind));
  const c = { k: kind, y, name: KNAME[kind], si: 0, ko: [], q: null, done: false, slots: [], groups: [], double: false };
  if (kind === 'NL') { c.groups = potGroups(s.A, 4, r); c.double = true; c.slots = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'SF', 'F']; }
  else if (kind === 'GOLD') { c.groups = potGroups(s.A, 4, r); c.slots = ['G1', 'G2', 'G3', 'QF', 'SF', 'F']; }
  else if (kind === 'WCQ') { c.groups = potGroups(s.A, 4, r); c.double = true; c.slots = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']; }
  else { c.groups = potGroups(wcTeams(), 12, r); c.slots = ['G1', 'G2', 'G3', 'R32', 'R16', 'QF', 'SF', 'F']; }
  return c;
}
function gRows(c, gi) {
  const g = c.groups[gi], t = {}; g.ids.forEach(id => { t[id] = { id, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }; });
  g.res.forEach(x => { const h = t[x[1]], a = t[x[2]]; h.pj++; a.pj++; h.gf += x[3]; h.gc += x[4]; a.gf += x[4]; a.gc += x[3]; if (x[3] > x[4]) { h.g++; a.p++; h.pts += 3; } else if (x[3] < x[4]) { a.g++; h.p++; a.pts += 3; } else { h.e++; a.e++; h.pts++; a.pts++; } });
  return Object.values(t).map(x => { x.dg = x.gf - x.gc; return x; }).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || strength(b.id) - strength(a.id));
}
function buildQ(c) {
  if (c.q) return c.q;
  const rows = c.groups.map((_, i) => gRows(c, i));
  const cmp = (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || strength(b.id) - strength(a.id);
  if (c.k === 'NL') { const w = rows.map(r => r[0]).sort(cmp); c.q = bracketOrder(4).map(s => w[s - 1].id); }
  else if (c.k === 'GOLD') { const R = rows; c.q = [R[0][0], R[1][1], R[1][0], R[0][1], R[2][0], R[3][1], R[3][0], R[2][1]].map(x => x.id); }
  else {
    const all = []; rows.forEach(r => { all.push(Object.assign({ pos: 0 }, r[0]), Object.assign({ pos: 1 }, r[1])); });
    const thirds = rows.map(r => Object.assign({ pos: 2 }, r[2])).sort(cmp).slice(0, 8); all.push(...thirds);
    all.sort((a, b) => a.pos - b.pos || cmp(a, b)); c.q = bracketOrder(32).map(s => all[s - 1].id);
  }
  return c.q;
}
function koRound(c, lab) {
  let rd = c.ko.find(x => x.lab === lab); if (rd) return rd;
  let ids; if (!c.ko.length) ids = buildQ(c); else { const prev = c.ko[c.ko.length - 1]; ids = prev.ties.map(t => t.w); }
  rd = { lab, ties: [] }; for (let i = 0; i < ids.length; i += 2) rd.ties.push({ a: ids[i], b: ids[i + 1], done: false });
  c.ko.push(rd); return rd;
}
function fixturesAt(c, i) {
  const lab = c.slots[i], out = [];
  if (!lab) return out;
  if (lab[0] === 'G') {
    const md = +lab.slice(1) - 1, sc = c.double ? SCHED_D : SCHED_S;
    c.groups.forEach((g, gi) => sc[md].forEach(([x, y], k) => out.push({ gi, md, a: g.ids[x], b: g.ids[y], home: c.double ? g.ids[x] : null })));
  } else { const rd = koRound(c, lab); rd.ties.forEach((t, k) => { if (!t.done) out.push({ lab, ti: k, a: t.a, b: t.b, ko: true }); }); }
  return out;
}
function userFix(c, i) { return fixturesAt(c, i).find(f => f.a === 'SLV' || f.b === 'SLV') || null; }
function applyResult(c, f, r) {
  if (f.ko) { const t = koRound(c, f.lab).ties[f.ti]; t.ga = r.ga; t.gb = r.gb; t.et = r.et; t.pen = r.pen; t.w = r.w === 'a' ? t.a : t.b; t.done = true; }
  else c.groups[f.gi].res.push([f.md, f.a, f.b, r.ga, r.gb]);
}
function playFix(c, f, o) {
  const ra = strength(f.a), rb = strength(f.b), homeA = f.home ? 3 : 0;
  const r = simGame(ra, rb, { ko: f.ko, homeA, ment: o && o.ment });
  applyResult(c, f, r); return r;
}
/* Juega la jornada i completa. userRes (opcional) trae el resultado ya jugado del usuario. */
function runMatchday(c, userRes) {
  const i = c.si, fx = fixturesAt(c, i), digest = []; let mine = null;
  fx.forEach(f => {
    const isMine = f.a === 'SLV' || f.b === 'SLV'; let r;
    if (isMine && userRes) { r = userRes; applyResult(c, f, r); mine = { f, r }; }
    else { r = playFix(c, f); if (isMine) mine = { f, r }; else digest.push({ f, r }); }
  });
  c.si++; if (c.si >= c.slots.length) finishComp(c);
  return { mine, digest };
}
function stageOfSLV(c) {
  const inGroups = c.groups.some(g => g.ids.includes('SLV')), inKO = c.ko.some(rd => rd.ties.some(t => t.a === 'SLV' || t.b === 'SLV'));
  if (!inGroups && !inKO) return 'No participó';
  let st = 'Fase de grupos';
  c.ko.forEach(rd => { if (rd.ties.some(t => t.a === 'SLV' || t.b === 'SLV')) st = ROUND_NAME[rd.lab] || rd.lab; });
  const fin = c.ko.find(x => x.lab === 'F');
  if (fin && fin.ties[0] && fin.ties[0].done) { const t = fin.ties[0]; if (t.w === 'SLV') return 'Campeón'; if (t.a === 'SLV' || t.b === 'SLV') return 'Subcampeón'; }
  return st;
}
function finishComp(c) {
  const s = S(); c.done = true;
  const fin = c.ko.find(x => x.lab === 'F'); c.champ = fin && fin.ties[0] ? fin.ties[0].w : null;
  c.res = s.on ? stageOfSLV(c) : '—';
  if (c.k === 'WCQ') {
    const rows = c.groups.map((_, i) => gRows(c, i)); const w = rows.map(r => r[0]);
    const seconds = rows.map(r => r[1]).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf).slice(0, 2);
    s.wcq = w.concat(seconds).map(x => x.id); c.res = s.wcq.includes('SLV') ? '¡Clasificó al Mundial!' : 'No clasificó';
    c.qual = s.wcq.slice();
  }
  if (c.k === 'NL') {
    const rows = c.groups.map((_, i) => gRows(c, i)), rel = rows.map(r => r[3].id);
    const up = s.B.slice().sort((a, b) => base(b) - base(a)).slice(0, 4);
    s.A = s.A.filter(id => !rel.includes(id)).concat(up); s.B = s.B.filter(id => !up.includes(id)).concat(rel);
    c.rel = rel; c.up = up;
    if (s.on) { if (rel.includes('SLV')) c.res += ' · Descendió a Liga B'; }
  }
  if (s.on && c.res !== 'No participó') rewardComp(c);
  s.hist.unshift({ y: c.y, k: c.k, name: c.name, res: c.res, champ: c.champ, on: s.on }); if (s.hist.length > 24) s.hist.length = 24;
}
function rewardComp(c) {
  const s = S(), r = c.res || ''; let rep = 0, conf = 0, wal = 0;
  if (r.startsWith('Campeón')) { rep = 6; conf = 20; wal = 60000; } else if (r.startsWith('Subcamp')) { rep = 3; conf = 10; wal = 30000; }
  else if (/Semifinal/.test(r)) { rep = 2; conf = 7; wal = 15000; } else if (/Cuartos|Octavos|Dieciseis/.test(r)) { rep = 1; conf = 4; wal = 8000; }
  else if (/Clasific/.test(r)) { rep = 4; conf = 8; wal = 20000; } else if (/No clasific/.test(r)) { conf = -12; } else if (/Fase de grupos/.test(r)) { conf = c.k === 'WC' || c.k === 'GOLD' ? -4 : -3; }
  if (rep) G.reputacion = Math.min(100, (G.reputacion || 50) + rep);
  if (wal) G.managerWallet = (G.managerWallet || 0) + wal;
  addConf(conf);
  pushNews(`${KICON[c.k]} ${c.name} ${c.y}: ${r}${wal ? ' · premio ' + money$(wal) : ''}.`, conf >= 0 ? 'bueno' : 'malo', 'club');
}
function addConf(d) {
  const s = S(); if (!d || !s.on) return; s.conf = cl(s.conf + d, 0, 100);
  if (s.conf <= 0) { s.on = false; s.ban = G.temporada + 2; s.win = null; pushNews('🏛 La federación te destituye como seleccionador. Podrás volver a ser candidato en 2 temporadas.', 'malo', 'club'); setTimeout(() => { try { openModal('<div class="modal-title">🚪 Destituido de la selección</div><p>La federación perdió la confianza en ti. Tu club sigue siendo tuyo; en dos temporadas podrás volver a ser candidato.</p><div class="center"><button class="btn btn-p" onclick="closeModal()">Entendido</button></div>'); } catch (e) { } }, 60); }
}

/* ---------- ventanas FIFA y ciclo anual ---------- */
function windowNow() { // índice de la última ventana cuyo punto de apertura ya pasó (según jornada del club)
  const j = G.jornadaActual || 1, ap = (G.campania || 'Apertura') === 'Apertura'; let n = ap ? -1 : 1;
  if (j > WINJOR[0]) n += 1; if (j > WINJOR[1]) n += 1; return n;
}
function ensureYear() {
  const s = S(); if (!usable()) return;
  if (s.year === G.temporada && s.comp) return;
  if (s.comp && !s.comp.done) { while (!s.comp.done) runMatchday(s.comp, null); }
  s.win = null; s.year = G.temporada; LEGC = null; driftYear(s.year); if (!s.conv.length) autoConv();
  s.comp = buildComp(kindOf(s.year), s.year);
  if (s.on) { fixConv(); catchUp(); }
}
function catchUp() { // resuelve en automático las ventanas ya pasadas del año en curso
  const s = S(), c = s.comp; if (!c) return; const wn = windowNow();
  while (!c.done && Math.floor(c.si / 2) <= wn) {
    const f = s.on ? userFix(c, c.si) : null;
    if (f) { const r = userMatch(f, true); finishUserMatch(f, r, true); } else runMatchday(c, null);
  }
}
function openWindow(n) {
  const s = S(), c = s.comp; if (!c || c.done) return;
  const idx = [2 * n, 2 * n + 1].filter(i => i < c.slots.length && i >= c.si);
  if (!idx.length) { s.win = null; return; }
  s.win = { n, open: G.jornadaActual, camp: G.campania, left: idx.length };
  if (s.on) fixConv();
  autoSkip();
  if (s.on && s.win && s.win.left > 0) { const f = userFix(c, c.si); if (f) { const op = f.a === 'SLV' ? f.b : f.a; pushNews(`📅 Ventana FIFA: ${KNAME[c.k]} · El Salvador vs ${nm(op)}.`, 'info', 'club'); try { toast('📅 Ventana FIFA abierta: juega en 🇸🇻 Selección'); } catch (e) { } } }
}
function autoSkip() { // partidos sin la selección del usuario o con el cargo inactivo: se juegan solos
  const s = S(), c = s.comp; if (!c || !s.win) return;
  while (s.win && s.win.left > 0 && !c.done) {
    if (s.on && userFix(c, c.si)) break;
    runMatchday(c, null); s.win.left--;
  }
  if (s.win && (s.win.left <= 0 || c.done)) s.win = null;
}
function resolveWindow() { // el usuario no jugó: simulamos con la convocatoria automática
  const s = S(), c = s.comp; if (!s.win || !c) return;
  let n = 0;
  while (s.win && s.win.left > 0 && !c.done) {
    const f = s.on ? userFix(c, c.si) : null;
    if (f) { const r = userMatch(f, true); finishUserMatch(f, r, true); n++; } else { runMatchday(c, null); s.win.left--; }
  }
  s.win = null;
  if (n && s.on) pushNews('🏛 La federación simuló la ventana FIFA que no jugaste (convocatoria automática).', 'info', 'club');
}
function afterMatchday() {
  if (!usable()) return;
  const s = S(); ensureYear(); if (!s.comp) return;
  const j = G.jornadaActual, ap = (G.campania || 'Apertura') === 'Apertura';
  if (s.win && (j - s.win.open >= 3 || s.win.camp !== G.campania)) resolveWindow();
  if (WINJOR.includes(j)) { if (s.win) resolveWindow(); openWindow((ap ? 0 : 2) + WINJOR.indexOf(j)); }
  if (!s.on && j === 5 && ap && eligible().ok && s.offerY !== G.temporada) { s.offerY = G.temporada; pushNews('🇸🇻 La federación está interesada en ti como seleccionador. Revisa la pestaña Selección.', 'bueno', 'club'); }
  try { chrome(); } catch (e) { }
}

/* ---------- cargo ---------- */
function eligible() {
  const s = S(), rep = Math.round(G.reputacion || 50), need = 56;
  const banned = s.ban && G.temporada < s.ban;
  return { ok: rep >= need && !banned, rep, need, banned: !!banned, ban: s.ban };
}
function accept() {
  const e = eligible(); if (!e.ok) { toast(e.banned ? 'Aún no puedes volver a ser candidato' : 'Necesitas reputación ' + e.need); return; }
  const s = S(); s.on = true; s.conf = 60; s.since = G.temporada; ensureYear(); autoConv(); if (!s.comp.done) catchUp();
  pushNews('🇸🇻 ' + G.managerName + ' es el nuevo seleccionador de El Salvador.', 'bueno', 'club');
  closeModal(); chrome(); render(); toast('Eres el seleccionador de El Salvador');
}
function resign() {
  openModal('<div class="modal-title">🇸🇻 ¿Dejar la selección?</div><p>Seguirás con tu club. Podrás volver a ser candidato si tu reputación lo permite.</p><div class="center" style="margin-top:10px"><button class="btn btn-d" onclick="SEL._resign()">Dejar el cargo</button> <button class="btn" onclick="closeModal()">Cancelar</button></div>');
}
function _resign() { const s = S(); s.on = false; s.win = null; s.ban = G.temporada + 1; closeModal(); chrome(); render(); }

/* ---------- partido del usuario ---------- */
function userMatch(f, auto) { // genera el resultado + eventos
  const s = S(), c = s.comp, ment = auto ? 'Equilibrada' : s.ment, form = s.form;
  const homeSLV = f.home === 'SLV'; const rSLV = slvRating(form);
  const opp = f.a === 'SLV' ? f.b : f.a, rOpp = base(opp);
  const r = f.a === 'SLV' ? simGame(rSLV, rOpp, { ko: f.ko, homeA: homeSLV ? 3 : (f.home ? 0 : 0), ment }) : simGame(rOpp, rSLV, { ko: f.ko, homeA: f.home === opp ? 3 : 0, ment: ment === 'Ofensiva' ? 'Defensiva' : ment === 'Defensiva' ? 'Ofensiva' : 'Equilibrada' });
  // normalizamos a la orientación (a,b) del fixture; también guardamos goles de SLV
  const slvA = f.a === 'SLV'; r.gs = slvA ? r.ga : r.gb; r.go = slvA ? r.gb : r.ga; r.opp = opp;
  r.xi = slvXI(form).map(p => p.id);
  return r;
}
function finishUserMatch(f, r, silent) {
  const s = S(), c = s.comp, slvA = f.a === 'SLV', gs = slvA ? r.ga : r.gb, go = slvA ? r.gb : r.ga;
  const won = r.w === (slvA ? 'a' : 'b'), draw = r.w === 'd';
  // eventos de goles (solo para mostrar y para goleadores)
  r.ev = genEvents(r, f, slvA);
  const out = runMatchday(c, r);
  s.rec.pj++; s.rec.gf += gs; s.rec.gc += go; if (won) s.rec.g++; else if (draw) s.rec.e++; else s.rec.p++;
  r.ev.filter(e => e.u && e.id).forEach(e => { const k = s.stats[e.id] || (s.stats[e.id] = { n: e.who, g: 0 }); k.g++; });
  addConf(won ? 3 : draw ? 0 : (f.ko ? -5 : -4));
  G.managerWallet = (G.managerWallet || 0) + 3000;
  if (s.win) { s.win.left--; if (s.win.left <= 0) s.win = null; else autoSkip(); }
  r.out = out; r.won = won; r.draw = draw; return out;
}
function foreign(opp, k) { const rn = mulberry(hstr(opp) + k * 53); const a = NOMBRES[Math.floor(rn() * NOMBRES.length)], b = APELLIDOS[Math.floor(rn() * APELLIDOS.length)]; return a[0] + '. ' + b; }
function genEvents(r, f, slvA) {
  const ev = []; const gsReg = (slvA ? r.ga - r.ea : r.gb - r.eb), goReg = (slvA ? r.gb - r.eb : r.ga - r.ea);
  const gsET = slvA ? r.ea : r.eb, goET = slvA ? r.eb : r.ea; const opp = slvA ? f.b : f.a;
  const xi = (r.xi || []).map(id => (pmap()[id] || {}).p).filter(Boolean);
  const w = p => p.posicion === 'DEL' ? 5 : p.posicion === 'MED' ? 2.2 : p.posicion === 'DEF' ? 0.7 : 0;
  const pickP = () => { const t = xi.reduce((a, p) => a + w(p), 0); let x = Math.random() * t; for (const p of xi) { x -= w(p); if (x <= 0) return p; } return xi[0]; };
  const add = (n, u, lo, hi) => { for (let i = 0; i < n; i++) { const m = lo + rnd(hi - lo + 1); if (u) { const p = pickP(); ev.push({ m, u: true, who: p ? p.nombre : 'Jugador', id: p && p.id }); } else ev.push({ m, u: false, who: foreign(opp, ev.length + i) }); } };
  add(gsReg, true, 1, 90); add(goReg, false, 1, 90); add(gsET, true, 91, 120); add(goET, false, 91, 120);
  return ev.sort((a, b) => a.m - b.m);
}
function slvLine(f, r) { const a = f.a === 'SLV'; return a ? [nm(f.a), r.ga, r.gb, nm(f.b)] : [nm(f.a), r.ga, r.gb, nm(f.b)]; }

/* ---------- interfaz ---------- */
let TAB = 'res';
function css() {
  if ($('sel-style')) return; const st = document.createElement('style'); st.id = 'sel-style';
  st.textContent = `.sel-top{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:10px}.sel-k{border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:rgba(255,255,255,.03)}.sel-k small{display:block;color:var(--dim);font-size:10px}.sel-k b{font-size:15px}
  .sel-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}.sel-tabs button{padding:7px 12px;border:1px solid var(--line2);background:transparent;color:var(--ink2);border-radius:6px;cursor:pointer;font-family:inherit}.sel-tabs button.on{background:var(--green-d);color:#fff;border-color:var(--green)}
  .sel-fx{display:flex;align-items:center;justify-content:center;gap:12px;font-size:15px;margin:8px 0;flex-wrap:wrap}.sel-cod{display:inline-block;min-width:38px;text-align:center;padding:3px 6px;border-radius:4px;border:1px solid var(--line2);font-size:11px;font-weight:700;background:rgba(255,255,255,.06)}.sel-cod.me{border-color:var(--cyan);color:var(--cyan)}
  .sel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}.sel-g .me td{background:rgba(63,208,255,.12)!important}
  .sel-pl{display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid var(--line);cursor:pointer}.sel-pl.on{background:rgba(63,209,42,.12)}.sel-pl.out{opacity:.45}.sel-pl b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sel-pl small{color:var(--dim)}
  .sel-ev{display:grid;gap:3px;margin:8px 0;font-size:13px}.sel-ev .u{color:var(--green)}.sel-ev .o{color:var(--red)}.sel-bad{color:var(--red)}.sel-ok{color:var(--green)}.sel-ko td{padding:4px 6px}
  @media(max-width:700px){.sel-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(st);
}
function ensureView() {
  const main = document.querySelector('main'); if (!main) return;
  if (!$('view-seleccion')) { const sec = document.createElement('section'); sec.id = 'view-seleccion'; sec.className = 'view hidden'; sec.innerHTML = '<div class="panel" id="seleccion-panel"></div>'; main.appendChild(sec); }
}
function chrome() {
  const nav = $('nav'); if (!nav) return; let b = nav.querySelector('[data-v="seleccion"]');
  if (!G || !G.clubes || isPres() || (G.reto)) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement('button'); b.className = 'tab'; b.dataset.v = 'seleccion'; b.setAttribute('onclick', "switchView('seleccion')"); const before = nav.querySelector('[data-v="clasificacion"]') || nav.querySelector('.go'); nav.insertBefore(b, before); }
  const s = G.sel, dot = s && !s.on && eligible().ok ? ' ✨' : s && s.on && s.win && s.win.left > 0 ? ' 📅' : '';
  b.textContent = '🇸🇻 Selección' + dot; if (G && CUR === 'seleccion') b.classList.add('active');
}
function cod(id) { return `<span class="sel-cod ${id === 'SLV' ? 'me' : ''}">${E(id)}</span>`; }
function onSwitch(v) { if (v === 'seleccion') { ensureView(); css(); ensureYear(); render(); } }
function render() {
  ensureView(); css(); const host = $('seleccion-panel'); if (!host || !usable()) { if (host) host.innerHTML = '<p class="muted">La selección solo está disponible en modo Director técnico.</p>'; return; }
  ensureYear(); const s = S(), c = s.comp, e = eligible();
  if (!s.on) { host.innerHTML = offerHTML(e); return; }
  const tabs = [['res', 'Resumen'], ['conv', 'Convocatoria'], ['torneo', 'Torneo'], ['rank', 'Ranking'], ['hist', 'Historial']];
  const rk = rankList().findIndex(x => x.id === 'SLV') + 1;
  host.innerHTML = `<div class="panel-title">🇸🇻 Selección de El Salvador</div>
  <div class="sel-top"><div class="sel-k"><small>Confianza federación</small><b class="${s.conf >= 50 ? 'green' : s.conf >= 30 ? 'amber' : 'red'}">${Math.round(s.conf)}%</b></div><div class="sel-k"><small>Fuerza (XI)</small><b>${slvRating()}</b></div><div class="sel-k"><small>Ranking</small><b>#${rk}</b></div><div class="sel-k"><small>Récord</small><b>${s.rec.g}-${s.rec.e}-${s.rec.p}</b></div></div>
  <div class="sel-tabs">${tabs.map(t => `<button class="${TAB === t[0] ? 'on' : ''}" onclick="SEL.tab('${t[0]}')">${t[1]}</button>`).join('')}</div>
  <div id="sel-body">${TAB === 'res' ? resHTML() : TAB === 'conv' ? convHTML() : TAB === 'torneo' ? torneoHTML() : TAB === 'rank' ? rankHTML() : histHTML()}</div>`;
}
function tab(t) { TAB = t; render(); }
function offerHTML(e) {
  const s = S();
  return `<div class="panel-title">🇸🇻 Selección de El Salvador</div>
  <div class="offer"><b class="gold">${e.ok ? '¡La federación te ofrece el cargo!' : 'Aún no eres seleccionador'}</b><br>
  <small>Dirige a la selección en la Liga de Naciones, Copa Oro, Eliminatorias y Mundial. Convocas 23 jugadores de la liga (más legionarios). Los partidos de selección <b>no afectan a tu club</b>; ganas dinero para tu probador 3D y reputación.</small><br>
  <div style="margin-top:8px">Reputación: <b class="${e.rep >= e.need ? 'green' : 'amber'}">${e.rep}/${e.need}</b> ${e.banned ? `<br><span class="red">Podrás volver a ser candidato en la temporada ${e.ban}.</span>` : ''}</div>
  <div style="margin-top:10px">${e.ok ? '<button class="btn btn-p" onclick="SEL.accept()">🇸🇻 Aceptar el cargo</button>' : '<small class="muted">Sube tu reputación con buenos resultados, objetivos cumplidos y títulos.</small>'}</div></div>
  ${s.hist.length ? '<div class="panel-title" style="margin-top:12px">Historial</div>' + histHTML() : ''}`;
}
function curLabel(c) { const lab = c.slots[c.si]; if (!lab) return 'Finalizado'; if (lab[0] === 'G') return 'Fase de grupos · fecha ' + lab.slice(1) + '/' + c.slots.filter(x => x[0] === 'G').length; return ROUND_NAME[lab] || lab; }
function resHTML() {
  const s = S(), c = s.comp, wn = windowNow(); let h = '';
  h += `<div class="offer"><b class="gold">${KICON[c.k]} ${E(c.name)} · temporada ${c.y}</b><br><small>${c.done ? 'Competición terminada: <b>' + E(c.res || '—') + '</b>' : 'Etapa actual: <b>' + E(curLabel(c)) + '</b>'}</small></div>`;
  const f = c.done ? null : userFix(c, c.si);
  if (s.win && s.win.left > 0 && f) {
    const opp = f.a === 'SLV' ? f.b : f.a, rs = slvRating(), ro = base(opp), g = eg(f.a === 'SLV' ? rs : ro, f.a === 'SLV' ? ro : rs, f.home === f.a ? 3 : 0, '');
    const p = outcomeProbFromEG(g.la, g.lb), pw = f.a === 'SLV' ? p : { win: p.loss, draw: p.draw, loss: p.win };
    h += `<div class="offer" style="border-color:var(--green)"><b class="green">📅 Ventana FIFA abierta · ${E(curLabel(c))}</b>
    <div class="sel-fx">${cod(f.a)} <b>${E(nm(f.a))}</b> <span class="muted">vs</span> <b>${E(nm(f.b))}</b> ${cod(f.b)}</div>
    <div class="center"><small>${f.home ? (f.home === 'SLV' ? 'LOCAL' : 'VISITA') : 'CAMPO NEUTRAL'} · tu XI ${rs} vs ${ro}</small><br><span class="pill good">G ${pw.win}%</span> <span class="pill">E ${f.ko ? '—' : pw.draw + '%'}</span> <span class="pill bad">P ${pw.loss}%</span></div>
    <div class="center" style="margin-top:10px"><button class="btn btn-p" onclick="SEL.prematch()">▶ Preparar y jugar</button></div></div>`;
  } else if (!c.done) {
    const nextW = nextWindowText();
    const out = !userFix(c, c.si) && (c.ko.length || c.slots[c.si] && c.slots[c.si][0] !== 'G') ? '<br><span class="red">Tu selección no juega en esta etapa.</span>' : '';
    h += `<div class="offer"><b>Sin partido ahora.</b> ${nextW}${out}</div>`;
  }
  h += groupBlock(c, true);
  h += `<div class="center" style="margin-top:10px"><button class="btn btn-sm" onclick="SEL.resign()">Dejar el cargo</button></div>`;
  return h;
}
function nextWindowText() {
  const j = G.jornadaActual, ap = (G.campania || 'Apertura') === 'Apertura'; let nj = WINJOR.find(x => x >= j), camp = G.campania || 'Apertura';
  if (!nj) { if (ap) { nj = WINJOR[0]; camp = 'Clausura'; } else return 'La próxima ventana será el año que viene.'; }
  if (nj === j && S().win == null) return `La próxima ventana abre al terminar la jornada ${nj} del ${camp}.`;
  return `La próxima ventana abre al terminar la jornada ${nj} del ${camp}.`;
}
function groupBlock(c, mineOnly) {
  const idx = c.groups.findIndex(g => g.ids.includes('SLV')); let h = '';
  const draw = gi => `<div class="sel-g"><b class="cyan">Grupo ${String.fromCharCode(65 + gi)}</b><table class="tbl" style="min-width:0;width:100%"><thead><tr><th>#</th><th>Selección</th><th class="center">PJ</th><th class="center">DG</th><th class="center">Pts</th></tr></thead><tbody>${gRows(c, gi).map((r, i) => `<tr class="${r.id === 'SLV' ? 'me' : ''}"><td>${i + 1}</td><td>${E(nm(r.id))}</td><td class="center">${r.pj}</td><td class="center">${r.dg > 0 ? '+' : ''}${r.dg}</td><td class="center"><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div>`;
  if (idx >= 0) h += draw(idx); else if (!c.ko.length) h += '<p class="muted">El Salvador no participa en este torneo.</p>';
  if (c.ko.length) h += koHTML(c);
  return h;
}
function koHTML(c) {
  return c.ko.map(rd => `<div style="margin-top:10px"><b class="amber">${E(ROUND_NAME[rd.lab] || rd.lab)}</b><table class="tbl sel-ko" style="min-width:0;width:100%"><tbody>${rd.ties.map(t => `<tr class="${t.a === 'SLV' || t.b === 'SLV' ? 'me' : ''}"><td>${E(nm(t.a))}</td><td class="center"><b>${t.done ? t.ga + '-' + t.gb : 'vs'}</b>${t.done && t.pen ? ' <small>(pen ' + t.pen[0] + '-' + t.pen[1] + ')</small>' : t.et ? ' <small>(t.s.)</small>' : ''}</td><td style="text-align:right">${E(nm(t.b))}</td></tr>`).join('')}</tbody></table></div>`).join('');
}
function torneoHTML() {
  const c = S().comp; let h = `<div class="offer"><b class="gold">${KICON[c.k]} ${E(c.name)} ${c.y}</b></div>`;
  h += '<div class="sel-grid">' + c.groups.map((_, gi) => `<div class="sel-g"><b class="cyan">Grupo ${String.fromCharCode(65 + gi)}</b><table class="tbl" style="min-width:0;width:100%"><tbody>${gRows(c, gi).map((r, i) => `<tr class="${r.id === 'SLV' ? 'me' : ''}"><td>${i + 1}</td><td>${E(nm(r.id))}</td><td class="center">${r.pj}</td><td class="center"><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div>`).join('') + '</div>';
  if (c.ko.length) h += koHTML(c);
  return h;
}
function rankList() { return TEAMS.map(t => ({ id: t[0], n: t[1], c: t[2], r: strength(t[0]) })).sort((a, b) => b.r - a.r); }
function rankHTML() {
  const L = rankList(); const mi = L.findIndex(x => x.id === 'SLV'); const top = L.slice(0, 25);
  if (mi >= 25) top.push(L[mi]);
  return `<table class="tbl" style="min-width:0;width:100%"><thead><tr><th>#</th><th>Selección</th><th class="center">Zona</th><th class="center">Fuerza</th></tr></thead><tbody>${top.map(x => `<tr class="${x.id === 'SLV' ? 'me' : ''}"><td>${L.indexOf(x) + 1}</td><td>${E(x.n)}</td><td class="center">${x.c}</td><td class="center"><b>${(Math.round(x.r * 10) / 10)}</b></td></tr>`).join('')}</tbody></table><small class="muted">Escala del juego (media del mejor XI). Las selecciones cambian poco cada año.</small>`;
}
function histHTML() {
  const s = S(); let h = '';
  h += s.hist.length ? `<table class="tbl" style="min-width:0;width:100%"><thead><tr><th>Año</th><th>Torneo</th><th>Resultado</th><th>Campeón</th></tr></thead><tbody>${s.hist.map(x => `<tr><td>${x.y}</td><td>${E(x.name)}</td><td>${E(x.on ? x.res : '—')}</td><td>${E(x.champ ? nm(x.champ) : '—')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Aún sin torneos terminados.</p>';
  const sc = Object.values(s.stats).sort((a, b) => b.g - a.g).slice(0, 8);
  if (sc.length) h += `<div class="panel-title" style="margin-top:12px">⚽ Goleadores de la selección</div>${sc.map(x => `<div class="sel-pl"><b>${E(x.n)}</b><span>${x.g}</span></div>`).join('')}`;
  return h;
}
function convHTML() {
  const s = S(), m = pmap(), chk = convCheck(), set = new Set(s.conv), all = Object.values(m);
  const forms = Object.keys(FORMACIONES).filter(k => k !== 'Libre');
  let h = `<div class="offer"><b>Convocatoria: ${chk.n}/23</b> · POR ${chk.c.POR} · DEF ${chk.c.DEF} · MED ${chk.c.MED} · DEL ${chk.c.DEL}${chk.ok ? ' <span class="sel-ok">✓ válida</span>' : '<br><span class="sel-bad">' + chk.errs.join(' · ') + '</span>'}
  <div style="margin-top:8px"><button class="btn btn-sm btn-p" onclick="SEL.auto()">⚡ Convocar a los mejores</button> <button class="btn btn-sm" onclick="SEL.clear()">Vaciar</button></div>
  <div style="margin-top:8px"><small class="muted">Esquema</small> ${forms.map(f => `<button class="btn btn-sm ${s.form === f ? 'btn-p' : ''}" onclick="SEL.setForm('${f}')">${f}</button>`).join(' ')}</div></div>`;
  POS.forEach(pos => {
    const L = all.filter(x => x.p.posicion === pos).sort((a, b) => (set.has(b.p.id) - set.has(a.p.id)) || b.p.media - a.p.media);
    h += `<div class="panel-title" style="margin-top:10px">${POSN[pos]} <small class="muted">${chk.c[pos]} convocados</small></div>` + L.slice(0, 18).map(x => `<div class="sel-pl ${set.has(x.p.id) ? 'on' : ''} ${x.p.lesionado ? 'out' : ''}" onclick="SEL.toggle('${x.p.id}')"><span>${set.has(x.p.id) ? '☑' : '☐'}</span><b>${E(x.p.nombre)}${x.p.legion ? ' 🌍' : ''}</b><small>${E(x.club)}${x.p.lesionado ? ' · 🩹' : ''}</small><span class="gold">${x.p.media}</span></div>`).join('');
  });
  return h;
}
function toggle(id) {
  const s = S(), i = s.conv.indexOf(id); if (i >= 0) s.conv.splice(i, 1); else { if (s.conv.length >= 23) { toast('Ya tienes 23. Quita a alguien primero'); return; } s.conv.push(id); }
  render();
}
function auto() { autoConv(); render(); toast('Convocatoria automática lista'); }
function clear() { S().conv = []; render(); }
function setForm(f) { S().form = f; render(); }
function setMent(m) { S().ment = m; prematch(); }

/* ---------- flujo de partido ---------- */
function prematch() {
  const s = S(), c = s.comp; if (!s.on || !s.win || s.win.left <= 0) { toast('No hay ventana FIFA abierta'); return; }
  const f = userFix(c, c.si); if (!f) { toast('Tu selección no juega ahora'); return; }
  fixConv(); const chk = convCheck();
  const opp = f.a === 'SLV' ? f.b : f.a, ro = base(opp), forms = Object.keys(FORMACIONES).filter(k => k !== 'Libre');
  const rs = slvRating(), g = eg(f.a === 'SLV' ? rs : ro, f.a === 'SLV' ? ro : rs, f.home === f.a ? 3 : 0, '');
  const xi = slvXI(); const lines = ['POR', 'DEF', 'MED', 'DEL'].map(p => `<b>${p}</b> ${xi.filter(x => x.posicion === p).map(x => E(x.nombre.split(' ').slice(-1)[0])).join(', ')}`).join('<br>');
  openModal(`<div class="modal-title">${KICON[c.k]} ${E(curLabel(c))}</div>
  <div class="sel-fx">${cod(f.a)} <b>${E(nm(f.a))}</b> <span class="muted">vs</span> <b>${E(nm(f.b))}</b> ${cod(f.b)}</div>
  <div class="center"><small>Tu XI ${rs} · rival ${ro}${f.ko ? ' · eliminación directa (prórroga y penales)' : ''}</small></div>
  <div class="offer" style="margin-top:8px"><small class="muted">Esquema</small><br>${forms.map(x => `<button class="btn btn-sm ${s.form === x ? 'btn-p' : ''}" onclick="SEL.setForm2('${x}')">${x}</button>`).join(' ')}
  <br><small class="muted">Mentalidad</small><br>${['Defensiva', 'Equilibrada', 'Ofensiva'].map(x => `<button class="btn btn-sm ${s.ment === x ? 'btn-p' : ''}" onclick="SEL.setMent('${x}')">${x}</button>`).join(' ')}</div>
  <div class="offer"><small>${lines}</small></div>
  ${chk.ok ? '' : '<p class="sel-bad">' + chk.errs.join(' · ') + '</p>'}
  <div class="center" style="margin-top:10px"><button class="btn btn-p" ${chk.ok ? '' : 'disabled'} onclick="SEL.play()">▶ Jugar</button> <button class="btn" onclick="closeModal()">Cancelar</button></div>`);
}
function setForm2(f) { S().form = f; prematch(); }
function play() {
  const s = S(), c = s.comp; const f = userFix(c, c.si); if (!f || !s.win || s.win.left <= 0) { closeModal(); return; }
  const chk = convCheck(); if (!chk.ok) { toast(chk.errs[0]); return; }
  const r = userMatch(f, false); const before = c.si;
  const out = finishUserMatch(f, r, false);
  resultModal(f, r, out, before);
  chrome(); try { renderTopbar(); } catch (e) { } if (CUR === 'seleccion') render(); try { autoSave(); } catch (e) { }
}
function resultModal(f, r, out, mdIdx) {
  const c = S().comp, slvA = f.a === 'SLV', gs = slvA ? r.ga : r.gb, go = slvA ? r.gb : r.ga;
  const head = r.won ? '<b class="green">¡VICTORIA!</b>' : r.draw ? '<b class="amber">EMPATE</b>' : '<b class="red">DERROTA</b>';
  const ev = r.ev.map(e => `<div class="${e.u ? 'u' : 'o'}">${e.m}' ⚽ ${E(e.who)} <small>(${e.u ? 'SLV' : E(r.opp)})</small></div>`).join('') || '<div class="muted">Sin goles.</div>';
  const dg = out.digest.slice(0, 5).map(d => `<div><small>${E(nm(d.f.a))} <b>${d.r.ga}-${d.r.gb}</b> ${E(nm(d.f.b))}${d.r.pen ? ' (pen ' + d.r.pen[0] + '-' + d.r.pen[1] + ')' : ''}</small></div>`).join('');
  const more = S().win && S().win.left > 0 && userFix(c, c.si);
  const done = c.done ? `<div class="offer"><b class="gold">${KICON[c.k]} ${E(c.name)} terminado: ${E(c.res || '')}</b></div>` : '';
  openModal(`<div class="modal-title">🇸🇻 Resultado</div>
  <div class="sel-fx">${cod(f.a)} <b>${E(nm(f.a))}</b> <span style="font-size:22px"><b>${r.ga} - ${r.gb}</b></span> <b>${E(nm(f.b))}</b> ${cod(f.b)}</div>
  <div class="center">${head}${r.et ? '<br><small>Tras prórroga' + (r.pen ? ' y penales (' + r.pen[0] + '-' + r.pen[1] + ')' : '') + '</small>' : ''}</div>
  <div class="sel-ev">${ev}</div>${done}
  ${dg ? '<hr class="sep"><div class="muted" style="font-size:11px">Otros resultados</div>' + dg : ''}
  <div class="center" style="margin-top:10px">${more ? '<button class="btn btn-p" onclick="SEL.prematch()">▶ Siguiente partido de la ventana</button> ' : ''}<button class="btn ${more ? '' : 'btn-p'}" onclick="closeModal();switchView('seleccion')">Continuar</button></div>`);
}

/* ---------- ganchos del juego ---------- */
function migrate() { try { if (!G || !G.clubes) return; if (!G.sel) G.sel = newSel(); else { const d = newSel(); Object.keys(d).forEach(k => { if (G.sel[k] === undefined) G.sel[k] = d[k]; }); } if (usable()) ensureYear(); } catch (e) { console.error('SEL.migrate', e); } }
function onLoad() { migrate(); try { chrome(); } catch (e) { } }

root.SEL = { migrate, onLoad, chrome, onSwitch, afterMatchday, render, tab, accept, resign, _resign, auto, clear, toggle, setForm, setForm2, setMent, prematch, play,
  S, TEAMS, BY, strength, slvRating, pool, autoConv, convCheck, fixConv, ensureYear, buildComp, fixturesAt, userFix, runMatchday, simGame, gRows, windowNow, openWindow, resolveWindow, eligible, rankList, kindOf, legionarios, bracketOrder, finishUserMatch, userMatch };
})(typeof window !== 'undefined' ? window : globalThis);
