/* economia.js — Reserva y préstamos, campañas, inversiones, decisiones del club y renuncias (Retro Football Manager SV v2.1). */
(function (root) {
'use strict';
const F = { 1: 1, 2: 0.5, 3: 0.22 };
const fl = () => F[userClub().nivel] || 0.22;
const R = n => Math.round(n / 100) * 100;
const pres = () => G && G.rol === 'presidente' && G.pres;
const fund = () => !!(root.PRES && PRES.isFund && PRES.isFund());
const active = () => !!G && !G.reto && !fund();

function E() {
  if (!G.eco) G.eco = {};
  const e = G.eco;
  if (!e.loans) e.loans = [];
  if (!e.inv) e.inv = { entren: 0, medico: 0, fund: 0, comercial: 0 };
  if (e.mkt === undefined) e.mkt = null;
  if (e.sec === undefined) e.sec = null;
  if (e.ev === undefined) e.ev = null;
  if (e.evCd == null) e.evCd = 4;
  if (e.depTot == null) e.depTot = 0;
  return e;
}
function migrate() { if (G) { E(); if (G.clubReserve == null) G.clubReserve = 0; } }

/* ---------------- catálogos ---------------- */
const MKT = [
  { id: 'radio', n: '📻 Radio y vallas', cost: 45000, fechas: 4, boost: 0.07, desc: 'Más gente en la cancha unas semanas.' },
  { id: 'redes', n: '📱 Redes e influencers', cost: 80000, fechas: 6, boost: 0.10, desc: 'Sube asistencia y atrae jóvenes (fans).' },
  { id: 'nacional', n: '📺 Campaña nacional', cost: 170000, fechas: 8, boost: 0.17, desc: 'Gran empuje de taquilla, tienda y fans.' }
];
const INV = {
  entren: { n: '🏋 Centro de entrenamiento', base: 300000, d: 'Mejora el rendimiento del equipo en cancha (+1.2% por nivel).', pres: true },
  medico: { n: '🩺 Centro médico', base: 240000, d: 'Menos lesiones (−12% por nivel).', pres: true },
  fund: { n: '🤝 Fundación del club', base: 180000, d: 'Sube el apoyo de los socios y los fans poco a poco.', pres: true },
  comercial: { n: '💼 Oficina comercial', base: 260000, d: '+6% sobre el patrocinio por nivel y habilita un patrocinador secundario.', pres: true }
};
function invCost(k) { const l = E().inv[k] || 0; return R(INV[k].base * fl() * (1 + l * 0.9)); }
function invUpkeep(k) { const l = E().inv[k] || 0; return l ? R(INV[k].base * 0.012 * l * fl()) : 0; }

/* ---------------- efectos que consulta el juego ---------------- */
function edge() { if (!pres()) return 0; return E().inv.entren * 0.012; }
function inj() { if (!pres()) return 1; return 1 - E().inv.medico * 0.12; }
function mktBoost() { const m = E().mkt; return m && m.left > 0 ? m.boost : 0; }

function secBase() { const s = E().sec; return s && s.left > 0 ? s.base : 0; }
function comBase() { const e = E(); return G.sponsor && e.inv.comercial ? Math.round(G.sponsor.base * 0.06 * e.inv.comercial) : 0; }
function loanInst() { return E().loans.reduce((s, l) => s + Math.min(l.inst, l.owed), 0); }
function upkeep() { return Object.keys(INV).reduce((s, k) => s + invUpkeep(k), 0); }
function projIncome() { return active() ? secBase() + comBase() : 0; }
function projCost() { return active() ? upkeep() + loanInst() : 0; }

/* ---------------- por jornada ---------------- */
function afterMatchday() {
  if (!active()) return;
  const e = E();
  let inc = 0;
  const sb = secBase(); if (sb) { inc += sb; fin('Patrocinador', 'ingreso', sb, 'Patrocinador secundario: ' + e.sec.nombre); e.sec.left--; if (e.sec.left <= 0) { pushNews('🤝 Venció el contrato de ' + e.sec.nombre + '.', 'info', 'club'); e.sec = null; } }
  const cb = comBase(); if (cb) { inc += cb; fin('Patrocinador', 'ingreso', cb, 'Oficina comercial'); }
  G.budget += inc;
  const up = upkeep(); if (up) { G.budget -= up; fin('Infraestructura', 'gasto', -up, 'Mantenimiento de centros e instalaciones'); }
  // préstamos
  let paid = 0;
  e.loans.forEach(l => { const p = Math.min(l.inst, l.owed); l.owed -= p; l.left--; paid += p; });
  if (paid) { G.budget -= paid; G.clubReserve = (G.clubReserve || 0) + paid; fin('Reserva', 'gasto', -paid, 'Cuota de préstamo a la reserva'); }
  const done = e.loans.filter(l => l.owed <= 0);
  done.forEach(l => pushNews('🏦 Terminaste de pagar el préstamo de ' + money(l.amt) + ' a la reserva.', 'bueno', 'club'));
  e.loans = e.loans.filter(l => l.owed > 0);
  // campaña
  if (e.mkt && e.mkt.left > 0) {
    e.mkt.left--; const u = userClub().estadio; if (u && Math.random() < 0.45) u.fans = clamp((u.fans == null ? 70 : u.fans) + 1, 25, 100);
    if (e.mkt.left <= 0) { pushNews('📣 Terminó la campaña "' + e.mkt.n + '".', 'info', 'club'); e.mkt = null; }
  }
  // fundación
  if (pres() && e.inv.fund) {
    const u = userClub().estadio; if (u && Math.random() < 0.25 * e.inv.fund) u.fans = clamp((u.fans == null ? 70 : u.fans) + 1, 25, 100);
    if (Math.random() < 0.18 * e.inv.fund) G.confianza = clamp((G.confianza || 50) + 1, 0, 100);
  }
  // decisiones de la directiva
  if (pres()) {
    if (e.ev) { /* pendiente */ } else { e.evCd--; if (e.evCd <= 0) { newEvent(); e.evCd = 5 + rnd(3); } }
  }
}

/* ---------------- reserva y préstamos ---------------- */
function deposit(amt) {
  if (blockIfLive('depositar')) return;
  amt = Math.round(amt); if (!(amt > 0)) { toast('Indicá un monto'); return; }
  if (G.budget < amt) { toast('La caja no alcanza'); return; }
  G.budget -= amt; G.clubReserve = (G.clubReserve || 0) + amt; fin('Reserva', 'gasto', -amt, 'Depósito en la reserva del club');
  autoSave(); renderAll(); toast('Depositaste ' + money(amt));
}
function depositPct(p) { deposit(Math.floor(Math.max(0, G.budget) * p / 100)); }
const TERMS = [[4, 0.02], [8, 0.04], [12, 0.06], [20, 0.09]];
function loanQuote(amt, term) { const t = TERMS.find(x => x[0] === term) || TERMS[1]; const owed = Math.round(amt * (1 + t[1])); return { owed, inst: Math.ceil(owed / term), rate: t[1] }; }
function takeLoan() {
  if (blockIfLive('pedir préstamo')) return;
  const e = E(); const amt = Math.round(Number(($('eco-amt') || {}).value) || 0), term = Number(($('eco-term') || {}).value) || 8;
  if (e.loans.length >= 3) { toast('Máximo 3 préstamos abiertos'); return; }
  if (!(amt >= 1000)) { toast('Monto mínimo $1,000'); return; }
  if (amt > (G.clubReserve || 0)) { toast('La reserva solo tiene ' + money(G.clubReserve || 0)); return; }
  const q = loanQuote(amt, term);
  G.clubReserve -= amt; G.budget += amt;
  e.loans.push({ id: uid(), amt, owed: q.owed, inst: q.inst, left: term, term, rate: q.rate });
  fin('Reserva', 'ingreso', amt, 'Préstamo de la reserva (' + term + ' fechas)');
  pushNews('🏦 Pediste ' + money(amt) + ' a la reserva. Devolverás ' + money(q.owed) + ' en ' + term + ' fechas (' + money(q.inst) + ' c/u).', 'info', 'club');
  autoSave(); renderAll(); toast('Préstamo aprobado');
}
function repayLoan(id) {
  if (blockIfLive('pagar préstamo')) return;
  const e = E(); const l = e.loans.find(x => x.id === id); if (!l) return;
  if (G.budget < l.owed) { toast('Para cancelar necesitás ' + money(l.owed)); return; }
  G.budget -= l.owed; G.clubReserve = (G.clubReserve || 0) + l.owed; fin('Reserva', 'gasto', -l.owed, 'Cancelación anticipada de préstamo');
  e.loans = e.loans.filter(x => x.id !== id); autoSave(); renderAll(); toast('Préstamo cancelado');
}
function quotePreview() {
  const h = $('eco-quote'); if (!h) return;
  const amt = Math.round(Number(($('eco-amt') || {}).value) || 0), term = Number(($('eco-term') || {}).value) || 8, q = loanQuote(amt, term);
  h.innerHTML = amt > 0 ? 'Devolverás <b>' + money(q.owed) + '</b> (+' + Math.round(q.rate * 100) + '%) · cuota <b>' + money(q.inst) + '</b> por fecha, descontada de los ingresos del club.' : '';
}
function finBox() {
  if (!G || G.reto) return '';
  const e = E(), res = G.clubReserve || 0;
  const loans = e.loans.map(l => '<div class="offer"><b>' + money(l.amt) + '</b> · debés ' + money(l.owed) + ' · cuota ' + money(l.inst) + ' · ' + l.left + ' fecha(s)<br><button class="btn btn-sm" onclick="ECO.repay(\'' + l.id + '\')">Pagar todo (' + money(l.owed) + ')</button></div>').join('');
  const mk = e.mkt ? '<div class="offer" style="border-color:var(--green)"><b class="green">' + e.mkt.n + '</b> · quedan ' + e.mkt.left + ' fecha(s) · +' + Math.round(e.mkt.boost * 100) + '% asistencia</div>' : '';
  const camp = MKT.map(m => '<button class="btn btn-sm" ' + (e.mkt ? 'disabled' : '') + ' onclick="ECO.campaign(\'' + m.id + '\')" title="' + m.desc + '">' + m.n + ' · ' + money(R(m.cost * fl())) + '</button>').join(' ');
  return '<hr class="sep"><div class="grid g2"><div><div class="panel-title">🏦 Reserva y préstamos</div><div class="offer"><b>Reserva del club:</b> <span class="cyan">' + money(res) + '</span><br><small class="muted">Es tu ahorro. Podés depositar caja y pedir préstamos de la reserva: elegís monto y plazo, y se devuelve sola con los ingresos de cada fecha (con un pequeño interés que vuelve a la reserva).</small>' +
    '<div style="margin-top:6px"><button class="btn btn-sm" onclick="ECO.depositPct(10)">Depositar 10% caja</button> <button class="btn btn-sm" onclick="ECO.depositPct(25)">25%</button> <button class="btn btn-sm" onclick="ECO.depositPct(50)">50%</button></div>' +
    '<div style="margin-top:8px"><input id="eco-amt" type="number" min="1000" step="1000" placeholder="Monto" oninput="ECO.quote()" style="width:110px"> <select id="eco-term" onchange="ECO.quote()">' + TERMS.map(t => '<option value="' + t[0] + '">' + t[0] + ' fechas (+' + Math.round(t[1] * 100) + '%)</option>').join('') + '</select> <button class="btn btn-p btn-sm" onclick="ECO.take()">Pedir préstamo</button><div id="eco-quote" class="muted" style="margin-top:4px"></div></div></div>' + loans + '</div>' +
    '<div><div class="panel-title">📣 Campañas de marketing</div>' + mk + '<div class="offer"><small class="muted">Más gente en el estadio y más fans durante unas fechas. Se pagan al lanzar.</small><div style="margin-top:6px">' + camp + '</div></div></div></div>';
}
function campaign(id) {
  if (blockIfLive('lanzar campaña')) return;
  const m = MKT.find(x => x.id === id), e = E(); if (!m || e.mkt) return;
  const c = R(m.cost * fl()); if (G.budget < c) { toast('No alcanza: ' + money(c)); return; }
  G.budget -= c; e.mkt = { id, n: m.n, left: m.fechas, boost: m.boost, gate: 1 }; fin('Marketing', 'gasto', -c, 'Campaña: ' + m.n);
  const st = userClub().estadio; if (st && id === 'nacional') st.fans = clamp((st.fans == null ? 70 : st.fans) + 3, 25, 100);
  pushNews('📣 Arranca la campaña "' + m.n + '" (' + money(c) + ').', 'bueno', 'club'); autoSave(); renderAll(); toast('Campaña lanzada');
}

/* ---------------- inversiones (presidente) ---------------- */
function build(k) {
  if (blockIfLive('invertir')) return;
  const e = E(), l = e.inv[k]; if (l >= 3) { toast('Ya está al máximo'); return; }
  const c = invCost(k); if (G.budget < c) { toast('No alcanza: ' + money(c)); return; }
  G.budget -= c; e.inv[k] = l + 1; fin('Infraestructura', 'gasto', -c, INV[k].n + ' nivel ' + (l + 1));
  pushNews('🏗 ' + INV[k].n + ' nivel ' + (l + 1) + ' inaugurado (' + money(c) + ').', 'bueno', 'club'); autoSave(); renderAll(); toast('Inversión realizada');
}
function secOffers() {
  const e = E(); if (!e.secOf || e.secOf.key !== G.temporada + '-' + G.campania) {
    const lv = userClub().nivel, pool = (typeof genSponsorOffers === 'function' ? genSponsorOffers(lv) : []).slice();
    const offs = pool.sort(() => Math.random() - 0.5).slice(0, 3).map(o => ({ id: o.id, nombre: o.nombre + ' (manga)', base: R(o.base * 0.45), up: R(o.up * 0.4) }));
    e.secOf = { key: G.temporada + '-' + G.campania, list: offs };
  }
  return e.secOf.list;
}
function signSec(id) {
  const e = E(), o = secOffers().find(x => x.id === id); if (!o) return;
  if (e.sec) { toast('Ya tenés patrocinador secundario'); return; }
  if (!e.inv.comercial) { toast('Primero construí la Oficina comercial'); return; }
  e.sec = { nombre: o.nombre, base: o.base, left: 22 }; G.budget += o.up; fin('Patrocinador', 'ingreso', o.up, 'Firma patrocinador secundario');
  pushNews('🤝 Patrocinador secundario: ' + o.nombre + '. Prima ' + money(o.up) + ' + ' + money(o.base) + '/fecha.', 'bueno', 'club'); autoSave(); renderAll(); toast('Firmado');
}

/* ---------------- decisiones de la directiva ---------------- */
const EVENTS = [
  { id: 'amistoso', t: '⚽ Amistoso internacional', x: 'Un club extranjero propone un amistoso de gala en tu estadio.', o: [
    ['Organizarlo', 'cuesta 60k y deja ~150k', () => { const c = R(60000 * fl()), g = R(150000 * fl()); G.budget += g - c; fin('Evento', 'ingreso', g - c, 'Amistoso internacional'); fan(3); return 'Amistoso exitoso: +' + money(g - c); }],
    ['Declinar', 'sin riesgo', () => 'Dejaste pasar la propuesta.']] },
  { id: 'naming', t: '🏟 Naming del estadio', x: 'Una empresa ofrece pagar por ponerle su nombre al estadio.', o: [
    ['Aceptar', 'ingreso fuerte, los fans se enojan', () => { const g = R(260000 * fl()); G.budget += g; fin('Evento', 'ingreso', g, 'Naming del estadio'); fan(-5); sup(-2); return 'Cobrás ' + money(g) + ' pero la hinchada protesta.'; }],
    ['Rechazar', 'apoyo de los socios', () => { fan(2); sup(3); return 'Los socios aplauden tu decisión.'; }]] },
  { id: 'concierto', t: '🎤 Concierto en el estadio', x: 'Una productora quiere alquilar el estadio un fin de semana.', o: [
    ['Alquilar', 'ingreso, riesgo en la cancha', () => { const g = R(130000 * fl()); G.budget += g; fin('Evento', 'ingreso', g, 'Concierto'); if (Math.random() < 0.4) { const c = R(45000 * fl()); G.budget -= c; fin('Evento', 'gasto', -c, 'Reparar la cancha'); return 'Ingresaste ' + money(g) + ', pero reparar la cancha costó ' + money(c) + '.'; } return 'Ingresaste ' + money(g) + ' sin daños.'; }],
    ['Negar', '', () => 'La cancha queda intacta.']] },
  { id: 'abonos', t: '🎟 Socios piden rebaja', x: 'Un grupo de abonados pide bajar los precios de este mes.', o: [
    ['Hacer descuento', 'cuesta caja, sube la hinchada', () => { const c = R(55000 * fl()); G.budget -= c; fin('Evento', 'gasto', -c, 'Descuento a socios'); fan(5); sup(4); return 'Descuento aplicado (' + money(c) + ').'; }],
    ['Mantener precios', 'los socios se quejan', () => { sup(-3); return 'Los socios se quejan.'; }]] },
  { id: 'primas', t: '💬 Vestuario pide primas', x: 'El plantel pide una prima colectiva por los resultados.', o: [
    ['Pagar prima', 'cuesta caja, sube la moral', () => { const c = R(85000 * fl()); G.budget -= c; fin('Evento', 'gasto', -c, 'Prima colectiva'); userClub().plantilla.forEach(p => p.moral = clamp((p.moral || 60) + 8, 0, 100)); return 'Moral arriba (' + money(c) + ').'; }],
    ['Negarse', 'cae la moral', () => { userClub().plantilla.forEach(p => p.moral = clamp((p.moral || 60) - 6, 0, 100)); return 'El plantel se enfría.'; }]] },
  { id: 'escuela', t: '🧒 Escuela de fútbol infantil', x: 'La alcaldía propone una escuela infantil con tu marca.', o: [
    ['Apoyarla', 'cuesta poco, suma imagen', () => { const c = R(40000 * fl()); G.budget -= c; fin('Evento', 'gasto', -c, 'Escuela infantil'); fan(4); sup(3); G.reputacion = clamp((G.reputacion || 50) + 1, 0, 100); return 'La escuela abre sus puertas.'; }],
    ['Pasar', '', () => 'Sin cambios.']] }
];
function fan(d) { const s = userClub().estadio; if (s) s.fans = clamp((s.fans == null ? 70 : s.fans) + d, 25, 100); }
function sup(d) { G.confianza = clamp((G.confianza || 50) + d, 0, 100); }
function newEvent() { const ev = EVENTS[rnd(EVENTS.length)]; E().ev = { id: ev.id }; pushNews('📬 La directiva tiene una decisión para vos: ' + ev.t + '.', 'info', 'club'); }
function decide(i) {
  const e = E(); if (!e.ev) return; const ev = EVENTS.find(x => x.id === e.ev.id); if (!ev || !ev.o[i]) { e.ev = null; return; }
  const msg = ev.o[i][2](); e.ev = null; pushNews('🗂 ' + ev.t + ': ' + msg, 'info', 'club'); autoSave(); renderAll(); toast(msg);
}
function eventCard() {
  const e = E(); const ev = e.ev && EVENTS.find(x => x.id === e.ev.id);
  if (!ev) return '<div class="offer"><small class="muted">Sin decisiones pendientes. La directiva te consulta cada pocas fechas.</small></div>';
  return '<div class="offer" style="border-color:var(--amber)"><b class="amber">' + ev.t + '</b><br>' + ev.x + '<div style="margin-top:6px">' + ev.o.map((o, i) => '<button class="btn btn-sm ' + (i === 0 ? 'btn-p' : '') + '" onclick="ECO.decide(' + i + ')">' + o[0] + '</button> <small class="muted">' + o[1] + '</small>').join('<br>') + '</div></div>';
}
function pending() { return !!(pres() && E().ev); }

function renderInv() {
  const h = $('inversiones-panel'); if (!h) return; const e = E();
  const rows = Object.keys(INV).map(k => { const l = e.inv[k]; return '<div class="pr-card"><h3>' + INV[k].n + ' <span class="tag amber">Nivel ' + l + '/3</span></h3><small class="muted">' + INV[k].d + '</small><div style="margin:6px 0">' + (l ? 'Mantenimiento: ' + money(invUpkeep(k)) + ' por fecha' : 'Aún no construido') + '</div>' + (l >= 3 ? '<span class="tag green">Máximo</span>' : '<button class="btn btn-p btn-sm" onclick="ECO.build(\'' + k + '\')">Mejorar · ' + money(invCost(k)) + '</button>') + '</div>'; }).join('');
  const so = e.inv.comercial ? (e.sec ? '<div class="offer" style="border-color:var(--green)"><b class="green">' + esc(e.sec.nombre) + '</b> · ' + money(e.sec.base) + '/fecha · ' + e.sec.left + ' fecha(s)</div>' : secOffers().map(o => '<div class="offer"><b>' + esc(o.nombre) + '</b> · prima ' + money(o.up) + ' · ' + money(o.base) + '/fecha<br><button class="btn btn-sm btn-p" onclick="ECO.signSec(\'' + o.id + '\')">Firmar</button></div>').join('')) : '<small class="muted">Construí la Oficina comercial para negociar un patrocinador secundario.</small>';
  h.innerHTML = '<div class="panel-title">🏗 Inversiones y decisiones</div><p class="muted">El DT manda en la cancha; vos manejás la estructura del club. Estas inversiones dan ventajas permanentes.</p><div class="pr-grid">' + rows + '</div>' +
    '<div class="panel-title" style="margin-top:12px">📬 Directiva</div>' + eventCard() + '<div class="panel-title" style="margin-top:12px">🤝 Patrocinio secundario</div>' + so +
    '<div class="center" style="margin-top:14px"><button class="btn btn-sm" onclick="ECO.resign()">🚪 Renunciar a la presidencia</button></div>';
}
function ensureView() {
  const main = document.querySelector('main'); if (!main) return;
  if (!$('view-inversiones')) { const s = document.createElement('section'); s.id = 'view-inversiones'; s.className = 'view hidden'; s.innerHTML = '<div class="panel pr-panel" id="inversiones-panel"></div>'; main.appendChild(s); }
}

/* ---------------- renuncias ---------------- */
let PEND = null;
function resignBtn() { return (!fund() && G.rol !== 'presidente') ? '<div class="center" style="margin-top:8px"><button class="btn btn-sm" onclick="ECO.resign()">🚪 Renunciar al cargo de DT</button></div>' : ''; }
function resign() {
  if (blockIfLive('renunciar')) return;
  const isP = G.rol === 'presidente', u = userClub();
  openModal('<div class="modal-title">🚪 ¿Renunciar ' + (isP ? 'a la presidencia' : 'como DT') + '?</div><p>' + (isP ? 'Dejarás la presidencia de <b>' + esc(u.nombre) + '</b>' + (fund() ? ' (el club que fundaste quedará sin vos)' : '') + ' y pasarás a ser <b>director técnico</b> de otro club.' : 'Dejarás el banquillo de <b>' + esc(u.nombre) + '</b> y buscarás otro club.') + '</p><div class="offer"><small>• Tu reputación baja un poco (-' + (isP ? 3 : 4) + ').<br>• Elegís entre las ofertas que te lleguen según tu reputación.<br>• Si no elegís ninguna, seguís en tu cargo actual.</small></div><div class="center"><button class="btn btn-p" onclick="ECO.confirmResign()">Sí, renunciar</button> <button class="btn" onclick="closeModal()">Cancelar</button></div>');
}
function confirmResign() {
  let offers = generateOffers(false); if (!offers.length) offers = generateOffers(true);
  PEND = { rol: G.rol };
  openModal('<div class="modal-title">💼 Ofertas para vos</div><p class="muted">Elegí dónde seguir. Si cerrás esta ventana, te quedás donde estás.</p><div id="offer-list">' + (offers.length ? offers.map(renderOffer).join('') : '<p class="muted">Nadie ofrece trabajo ahora. Te quedás en el cargo.</p>') + '</div><div class="center" style="margin-top:8px"><button class="btn" onclick="ECO.cancelResign()">Mejor me quedo</button></div>');
}
function cancelResign() { PEND = null; closeModal(); }
/* acceptOffer() lo llama al cambiar de club */
function onClubChange() {
  if (PEND) { G.reputacion = clamp((G.reputacion || 50) - (PEND.rol === 'presidente' ? 3 : 4), 0, 100); pushNews('🚪 ' + G.managerName + ' renunció a su cargo.', 'info'); PEND = null; }
  G.eco = null; G.clubReserve = 0; E();
}

root.ECO = { E, migrate, edge, inj, mktBoost, projIncome, projCost, afterMatchday, deposit, depositPct, take: takeLoan, repay: repayLoan, quote: quotePreview, finBox, campaign, build, signSec, decide, eventCard, pending, renderInv, ensureView, resign, resignBtn, confirmResign, cancelResign, onClubChange, active };
})(typeof window !== 'undefined' ? window : globalThis);
