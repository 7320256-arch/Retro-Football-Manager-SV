/* retos.js — Retos cortos (Retro Football Manager SV v2.0)
 * Escenarios de pocas fechas ("salva al club del descenso", "sube a Primera"...), con estrellas, reto del día y racha.
 * Usan una partida APARTE (clave rfm_sv_reto): tu carrera nunca se toca. No suben al ranking online. */
(function (root) {
'use strict';
const $ = id => document.getElementById(id);
const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RKEY = 'rfm_sv_reto', PKEY = 'rfm_retos_v1';
let LASTSAVE = 0;

/* ---------- progreso (estrellas, reto del día, racha) ---------- */
function prog() { try { const p = JSON.parse(localStorage.getItem(PKEY) || '{}'); p.best = p.best || {}; p.streak = p.streak || 0; return p; } catch (e) { return { best: {}, streak: 0 }; } }
function putProg(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) { } }
function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function hstr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ---------- plantillas de reto ---------- */
function posOf(g) { return sortedDivision(divisionLevel(g.userClubId)).findIndex(c => c.id === g.userClubId) + 1; }
const TPL = {
  descenso: { ico: '🛟', n: 'Salva al club del descenso', lvl: 1, pick: 'weak', start: 12, range: [10, 12], end: 22,
    goal: 'Termina la campaña en el puesto 9° o mejor.', hint: 'Quedan 10 fechas. Cada punto cuenta: rota con cabeza y cuida la energía.',
    status: g => `Puesto ${posOf(g)}° · meta 9° o mejor`, eval: g => { const p = posOf(g); return { ok: p <= 9, stars: p <= 5 ? 3 : p <= 7 ? 2 : p <= 9 ? 1 : 0, txt: `Terminaste ${p}°` }; } },
  ascenso: { ico: '🚀', n: 'Sube a Primera', lvl: 2, pick: 'strong', start: 12, range: [4, 7], end: 22,
    goal: 'Termina entre los 2 primeros de Segunda División.', hint: 'Estás en mitad de tabla alta. Busca la regularidad.',
    status: g => `Puesto ${posOf(g)}° · meta 2° o mejor`, eval: g => { const p = posOf(g); return { ok: p <= 2, stars: p === 1 ? 3 : p === 2 ? 2 : 0, txt: `Terminaste ${p}°` }; } },
  tercera: { ico: '🌱', n: 'El salto desde Tercera', lvl: 3, pick: 'strong', start: 12, range: [3, 6], end: 22,
    goal: 'Termina 1° o 2° en Tercera División.', hint: 'En Tercera no se baja, pero el ascenso se gana fecha a fecha.',
    status: g => `Puesto ${posOf(g)}° · meta 2° o mejor`, eval: g => { const p = posOf(g); return { ok: p <= 2, stars: p === 1 ? 3 : p === 2 ? 1 : 0, txt: `Terminaste ${p}°` }; } },
  rojo: { ico: '💸', n: 'Cuentas en rojo', lvl: 1, pick: 'mid', start: 12, range: [5, 9], end: 22, budget: -30000,
    goal: 'Cierra con la caja en positivo y la confianza de la directiva en 40% o más.', hint: 'Vende sueldos altos, aprovecha taquilla y no hundas al equipo.',
    status: g => `Caja ${money(g.budget)} · confianza ${Math.round(g.confianza)}%`, eval: g => { const b = g.budget, c = g.confianza; const ok = b >= 0 && c >= 40; return { ok, stars: !ok ? 0 : b >= 60000 ? 3 : b >= 20000 ? 2 : 1, txt: `Caja ${money(b)} · confianza ${Math.round(c)}%` }; } },
  racha: { ico: '🔥', n: 'Racha de fuego', lvl: 1, pick: 'mid', start: 7, range: [4, 9], end: 15, need: 5,
    goal: 'Gana 5 de los próximos 8 partidos de liga.', hint: 'Son 8 fechas seguidas: piensa en la fatiga y en las rotaciones.',
    status: g => `Victorias ${g.reto.wins}/${g.reto.need} · fecha ${Math.min(g.reto.played + 1, 8)}/8`,
    eval: g => { const w = g.reto.wins; return { ok: w >= 5, stars: w >= 7 ? 3 : w === 6 ? 2 : w === 5 ? 1 : 0, txt: `Ganaste ${w} de 8` }; } }
};
const ORDER = ['descenso', 'ascenso', 'racha', 'rojo', 'tercera'];

/* ---------- puesta en marcha ---------- */
function candidates(T) {
  const L = DEF.filter(d => d[0] === T.lvl).sort((a, b) => b[5] - a[5] || (a[1] < b[1] ? -1 : 1)); // más débiles primero
  if (T.pick === 'weak') return L.slice(0, 4); if (T.pick === 'strong') return L.slice(-4); const m = Math.floor(L.length / 2); return L.slice(m - 2, m + 2);
}
function presim(T) {
  const lvlUser = T.lvl; let ok = false;
  for (let t = 0; t < 80 && !ok; t++) {
    for (let lvl = 1; lvl <= 3; lvl++) {
      G.divisiones[lvl].forEach(id => { G.clubes[id].tabla = emptyTabla(); });
      for (let j = 0; j < T.start; j++) (G.calendarios[lvl][j] || []).forEach(m => { const r = quickSim(G.clubes[m.h], G.clubes[m.a]); applyTabla(G.clubes[m.h], r.gh, r.ga); applyTabla(G.clubes[m.a], r.ga, r.gh); });
    }
    const p = posOf(G); ok = p >= T.range[0] && p <= T.range[1];
  }
  G.jornadaActual = T.start + 1;
}
function start(id, opt) {
  const T = TPL[id]; if (!T) return; opt = opt || {};
  try { if (G && !G.reto) autoSave(); } catch (e) { }
  const cand = candidates(T), seed = opt.seed != null ? opt.seed : (Math.random() * 1e6) | 0;
  const d = opt.club ? DEF.find(x => x[1] === opt.club) : cand[seed % cand.length];
  const dev = typeof PICK_DEVICE !== 'undefined' ? PICK_DEVICE : 'pc';
  G = newGameState(d[1], 'DT'); G.device = dev; G.reto = { id, club: d[1], start: T.start, end: T.end, wins: 0, played: 0, need: T.need || 0, done: false, daily: !!opt.daily, day: opt.daily ? dayKey() : '', t0: Date.now() };
  if (root.PRES && PRES.newGameHook) PRES.newGameHook('dt'); if (root.SEL && SEL.migrate) SEL.migrate();
  presim(T); if (T.budget != null) G.budget = T.budget; G.confianza = 50;
  try { applyDevice(dev); } catch (e) { }
  const intro = $('intro'); if (intro) intro.classList.add('hidden'); const app = $('app'); if (app) app.classList.remove('hidden');
  save(true); closeModal(); renderAll(); switchView('dashboard'); chrome(); briefing();
}
function briefing() {
  const r = G.reto, T = TPL[r.id], u = userClub();
  openModal(`<div class="modal-title">${T.ico} ${E(T.n)}${r.daily ? ' · Reto del día' : ''}</div>
  <p>Diriges a <b class="cyan">${E(u.nombre)}</b> (${DIV_NAMES[u.nivel]}). Estás en el puesto <b>${posOf(G)}°</b> tras ${T.start} fechas.</p>
  <div class="offer"><b class="gold">🎯 Meta</b><br>${E(T.goal)}</div><p class="muted"><small>${E(T.hint)}</small></p>
  <p class="muted"><small>Es una partida aparte: tu carrera no se toca ni sube al ranking.</small></p>
  <div class="center" style="margin-top:10px"><button class="btn btn-p" onclick="closeModal()">▶ ¡A jugar!</button></div>`);
}

/* ---------- guardado aparte ---------- */
function save(force) {
  const now = Date.now(); if (!force && now - LASTSAVE < 4000) return; LASTSAVE = now;
  try { localStorage.setItem(RKEY, JSON.stringify(makeSaveEnvelope(slimPayload(G)))); } catch (e) { }
}
function hasSave() { try { return !!localStorage.getItem(RKEY); } catch (e) { return false; } }
function resume() {
  try {
    const s = readSaveObject(localStorage.getItem(RKEY));
    if (!s || !s.reto) { toast('No hay reto guardado'); return; }
    try { if (G && !G.reto) autoSave(); } catch (e) { }
    G = s; migrateState(); if (root.PRES && PRES.onLoad) PRES.onLoad();
    const intro = $('intro'); if (intro) intro.classList.add('hidden'); const app = $('app'); if (app) app.classList.remove('hidden');
    closeModal(); renderAll(); switchView('dashboard'); chrome();
    if (G.reto.done) showResult();
  } catch (e) { toast('No se pudo reanudar el reto'); }
}

/* ---------- seguimiento ---------- */
function afterMatchday(gf, ga) {
  const r = G && G.reto; if (!r || r.done) return;
  r.played++; if (gf > ga) r.wins++;
  const jor = G.jornadaActual, T = TPL[r.id]; let fin = jor >= r.end;
  if (r.id === 'racha') { const left = r.end - jor; if (r.wins + left < r.need) fin = true; }
  if (fin) { r.done = true; r.result = T.eval(G); persist(r); save(true); setTimeout(showResult, 120); } else { save(); }
}
function endSeasonHook() { const r = G && G.reto; if (!r) return false; if (!r.done) { r.done = true; r.result = TPL[r.id].eval(G); persist(r); save(true); } setTimeout(showResult, 150); return true; }
function persist(r) {
  const p = prog(), res = r.result, st = res.stars || 0;
  p.best[r.id] = Math.max(p.best[r.id] || 0, st);
  if (r.daily && st > 0 && p.daily !== r.day) {
    const y = new Date(); y.setDate(y.getDate() - 1); p.streak = p.lastDay === dayKey(y) ? (p.streak || 0) + 1 : 1; p.lastDay = r.day; p.daily = r.day;
  }
  putProg(p);
}
function stars(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
function showResult() {
  const r = G && G.reto; if (!r || !r.result) return; const T = TPL[r.id], res = r.result, p = prog();
  openModal(`<div class="modal-title">${res.ok ? '🏅 ¡Reto superado!' : '💥 Reto fallido'}</div>
  <div class="center" style="font-size:30px;letter-spacing:6px;color:var(--gold)">${stars(res.stars || 0)}</div>
  <p class="center"><b>${E(T.n)}</b><br><small class="muted">${E(res.txt)}</small></p>
  ${r.daily && res.ok ? `<p class="center green">🔥 Racha de retos diarios: <b>${p.streak}</b> día(s)</p>` : ''}
  <div class="center" style="margin-top:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
  <button class="btn btn-p" onclick="RETOS.retry()">↻ Reintentar</button><button class="btn" onclick="RETOS.open()">🎯 Más retos</button>
  <button class="btn" onclick="RETOS.share()">📤 Compartir</button><button class="btn" onclick="RETOS.exit()">⬅ Volver a mi carrera</button></div>`);
}
function retry() { const r = G.reto; if (!r) return; start(r.id, { club: r.club, daily: r.daily }); }
function share() {
  const r = G && G.reto; if (!r || !r.result) return; const T = TPL[r.id];
  const txt = `🎯 Retro Football Manager SV — «${T.n}» ${stars(r.result.stars || 0)} (${r.result.txt}). ¿Puedes superarlo?`;
  try { if (navigator.share) { navigator.share({ text: txt }).catch(() => { }); return; } navigator.clipboard.writeText(txt).then(() => toast('Resultado copiado')); } catch (e) { toast('No se pudo copiar'); }
}
function exit() { try { localStorage.removeItem(RKEY); } catch (e) { } try { location.reload(); } catch (e) { } }
function confirmExit() {
  openModal(`<div class="modal-title">🎯 Salir del reto</div><p>Se abandona el reto actual. Tu carrera no se toca.</p><div class="center" style="margin-top:10px"><button class="btn btn-d" onclick="RETOS.exit()">Salir del reto</button> <button class="btn" onclick="closeModal()">Seguir en el reto</button></div>`);
}

/* ---------- interfaz ---------- */
function daily() { const k = dayKey(), s = hstr('rfm' + k); return { id: ORDER[s % ORDER.length], seed: s >>> 3, day: k }; }
function open() {
  const p = prog(), d = daily(), done = p.daily === d.day;
  const card = (id, lab, extra) => { const T = TPL[id]; return `<div class="offer"><b class="gold">${T.ico} ${E(T.n)}</b> ${lab || ''}<br><small>${E(T.goal)}</small><br><span class="gold">${stars(p.best[id] || 0)}</span> <button class="btn btn-sm btn-p" onclick="${extra}">▶ Jugar</button></div>`; };
  openModal(`<div class="modal-title">🎯 Retos cortos</div>
  <p class="muted"><small>Partidas rápidas de 8-10 fechas con un objetivo. Son aparte de tu carrera.</small></p>
  <div class="offer" style="border-color:var(--gold)"><b class="gold">📅 Reto del día</b> <span class="tag amber">racha ${p.streak || 0}</span><br><b>${TPL[d.id].ico} ${E(TPL[d.id].n)}</b><br><small>${E(TPL[d.id].goal)}</small><br>${done ? '<span class="green">✔ Completado hoy</span>' : `<button class="btn btn-sm btn-p" onclick="RETOS.start('${d.id}',{daily:true,seed:${d.seed}})">▶ Jugar el de hoy</button>`}</div>
  ${ORDER.map(id => card(id, '', `RETOS.start('${id}')`)).join('')}
  ${hasSave() ? '<div class="center" style="margin-top:8px"><button class="btn btn-sm" onclick="RETOS.resume()">↻ Continuar reto guardado</button></div>' : ''}
  <div class="center" style="margin-top:8px"><button class="btn" onclick="closeModal()">Cerrar</button></div>`);
}
function chrome() {
  if (typeof document === 'undefined') return;
  const tb = document.querySelector('.topbtns');
  if (tb && !$('btn-retos')) { const b = document.createElement('button'); b.id = 'btn-retos'; b.className = 'btn btn-sm'; b.title = 'Retos cortos'; b.textContent = '🎯'; b.setAttribute('onclick', G && G.reto ? 'RETOS.confirmExit()' : 'RETOS.open()'); tb.insertBefore(b, tb.firstChild); }
  const btn = $('btn-retos'); if (btn) btn.setAttribute('onclick', G && G.reto ? 'RETOS.status()' : 'RETOS.open()');
  let bar = $('reto-bar'); const r = G && G.reto;
  if (!r) { if (bar) bar.remove(); return; }
  const app = $('app'), nav = $('nav'); if (!app || !nav) return;
  if (!bar) { bar = document.createElement('div'); bar.id = 'reto-bar'; bar.style.cssText = 'padding:6px 10px;background:#2a2000;border-bottom:1px solid var(--gold);color:var(--gold);font-size:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap'; nav.parentNode.insertBefore(bar, nav); }
  const T = TPL[r.id];
  bar.innerHTML = `<b>${T.ico} RETO</b> <span style="flex:1;min-width:140px">${E(T.n)} · ${E(T.status(G))}</span><button class="btn btn-sm" onclick="RETOS.confirmExit()">Salir</button>`;
}
function status() { const r = G.reto, T = TPL[r.id]; openModal(`<div class="modal-title">${T.ico} ${E(T.n)}</div><div class="offer"><b class="gold">🎯 Meta</b><br>${E(T.goal)}<br><small class="muted">${E(T.status(G))}</small></div><div class="center" style="margin-top:10px"><button class="btn btn-p" onclick="closeModal()">Seguir</button> <button class="btn" onclick="RETOS.confirmExit()">Salir del reto</button></div>`); }
function introHook() {
  chrome();
  const box = $('pr-modes'); if (!box || $('intro-retos')) return;
  const d = document.createElement('div'); d.id = 'intro-retos'; d.style.cssText = 'text-align:center;margin:8px 0';
  d.innerHTML = '<button class="btn" onclick="RETOS.open()">🎯 Retos cortos</button>' + (hasSave() ? ' <button class="btn" onclick="RETOS.resume()">↻ Continuar reto</button>' : '');
  box.parentNode.insertBefore(d, box.nextSibling);
}

root.RETOS = { TPL, ORDER, start, retry, share, exit, confirmExit, open, resume, status, save, afterMatchday, endSeasonHook, chrome, introHook, showResult, daily, prog };
})(typeof window !== 'undefined' ? window : globalThis);
