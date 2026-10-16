/* regional.js — RFM v2.8 · Modo Regional conectado.
 * Un mismo hilo de carrera para DT, Presidente y Fundador a través de los 6 países:
 *  - Ofertas de trabajo del extranjero (DT: banquillo; Presidente/Fundador: presidencia) que llegan al cerrar el año o al perder el cargo.
 *  - Mudanza de país: se reconstruye la liga del país nuevo (clubes, calendario, copas) y la carrera continúa (reputación, palmarés, logros, libro mayor).
 *  - Pestaña 🌎 Región: trayectoria, ofertas vigentes, mapa de ligas y mejores jugadores de la región (con acceso al Buscador).
 * No está disponible en retos ni durante la fase amateur del Fundador. */
(function (root) {
  'use strict';
  const CODES = ['SV', 'GT', 'HN', 'CR', 'PA', 'NI'];
  const NIVEL = { CR: 74, HN: 71, GT: 70, SV: 68, PA: 68, NI: 63 };       // fuerza relativa de la liga
  const FACT = { SV: 1.0, GT: 1.1, HN: 1.1, CR: 1.25, PA: 1.05, NI: 0.8 };  // factor salarial
  const MAXOFF = 4, MAXBRING = 2;

  const gg = () => (typeof G !== 'undefined' ? G : null);
  const lg = c => (root.RFM_LEAGUES && root.RFM_LEAGUES[c]) || null;
  const R = () => { const g = gg(); return g && g.reg; };
  const isPresRole = () => { const g = gg(); return !!(g && g.rol === 'presidente' && g.pres); };
  const fundPhase = () => { const g = gg(); return g && g.pres && g.pres.fund ? g.pres.fund.fase : null; };
  const roleKind = () => (isPresRole() ? 'PRES' : 'DT');
  const flag = c => (lg(c) ? lg(c).flag : '🌎');
  const cname = c => (lg(c) ? lg(c).country : c);
  const dname = (c, n) => { const l = lg(c); return (l && l.divNames && l.divNames[n]) || ('División ' + n); };

  function active() { const g = gg(); return !!(g && g.clubes && !g.reto && fundPhase() !== 'amateur'); }

  function migrate() {
    const g = gg(); if (!g || !g.clubes) return;
    if (!g.reg) g.reg = { v: 1, ofertas: [], tray: [], moves: 0, gen: '' };
    const r = g.reg; if (!r.ofertas) r.ofertas = []; if (!r.tray) r.tray = []; if (r.moves == null) r.moves = 0;
    try { sync(); } catch (e) { }
  }

  /* ---------- trayectoria ---------- */
  function sync() {
    const g = gg(), r = R(); if (!g || !r || !g.clubes || !g.clubes[g.userClubId]) return;
    const u = g.clubes[g.userClubId], rol = roleLabel(), pais = g.pais || 'SV';
    const last = r.tray[r.tray.length - 1];
    if (last && last.hasta == null && last.clubId === u.id && last.pais === pais && last.rol === rol) return;
    if (last && last.hasta == null) last.hasta = g.temporada;
    r.tray.push({ pais, clubId: u.id, club: u.nombre, rol, desde: g.temporada, hasta: null });
    if (r.tray.length > 40) r.tray.splice(0, r.tray.length - 40);
  }
  function titlesOf(e) {
    const g = gg(); return (g.palmares || []).filter(x => x.clubId === e.clubId && (x.pais || e.pais) === e.pais && x.temp >= e.desde && (e.hasta == null || x.temp <= e.hasta)).length;
  }
  function countries() { const r = R(); return new Set((r ? r.tray : []).map(e => e.pais)); }

  /* ---------- generación de ofertas ---------- */
  function foreignOk() {
    const g = gg(); if (!active()) return false;
    if (fundPhase() === 'pro') { const f = g.pres.fund; return g.reputacion >= 70 && (g.temporada - (f.ascendio || g.temporada)) >= 3; }
    return true;
  }
  function mkOffer(role, code, lvl, fired) {
    const g = gg(), l = lg(code); if (!l) return null;
    const pool = l.clubs.filter(d => d[0] === lvl); if (!pool.length) return null;
    const d = pick(pool), tier = d[5], rep = g.reputacion || 50;
    const sal = Math.round((lvl === 1 ? 22000 : lvl === 2 ? 11000 : 5500) * (1 + (5 - tier) * 0.1) * (0.6 + rep / 100) * (FACT[code] || 1) / 10) * 10;
    const caja = Math.round((typeof BUDGET_BASE !== 'undefined' ? BUDGET_BASE[lvl] : 100000) * (1 + (5 - tier) * 0.08));
    return { id: 'rg' + Date.now().toString(36) + rnd(999), role, pais: code, clubId: d[1], nombre: d[2], ciudad: d[3], color: d[4], nivel: lvl, tier, sal, caja, exp: g.temporada + 1, fired: !!fired, deja: role === 'PRES' && fundPhase() === 'pro' };
  }
  function genOffers(res, fired, role) {
    const g = gg(), r = R(); if (!r || !active()) return;
    const key = [res && res.season, res && res.campania, role, fired ? 'f' : 'y'].join('|');
    if (r.gen === key) return; r.gen = key;
    r.ofertas = (r.ofertas || []).filter(o => o.exp >= g.temporada && o.pais !== g.pais && !(o.role === role && !fired));
    if (role === 'PRES' && !foreignOk()) return;
    const rep = g.reputacion || 50;
    const score = rep + (res && res.met ? 5 : -5) + (res && res.titulo ? 10 : 0);
    let n = fired ? 1 + (rep >= 60 ? 1 : 0) : score >= 85 ? 2 : score >= 65 ? 1 : score >= 52 ? (Math.random() < 0.4 ? 1 : 0) : 0;
    if (!n) return;
    const maxLvl = fired ? 2 : score >= 85 ? 1 : score >= 62 ? 2 : 3;
    const codes = shuffle(CODES.filter(c => c !== g.pais && lg(c)));
    for (let i = 0; i < n && i < codes.length; i++) {
      const lvl = fired ? pick([2, 3, 3]) : clamp(maxLvl + (Math.random() < 0.4 ? 1 : 0), 1, 3);
      const o = mkOffer(role, codes[i], lvl, fired); if (o) r.ofertas.unshift(o);
    }
    if (r.ofertas.length > MAXOFF) r.ofertas.length = MAXOFF;
  }
  function onYearEnd(res, fired) {
    try { if (!active()) return; sync(); const role = fired ? 'DT' : roleKind(); if (fired || (res && res.campania === 'Clausura')) genOffers(res, !!fired, role); } catch (e) { console.error('REG.onYearEnd', e); }
  }
  function visible(role) { const g = gg(), r = R(); return r ? r.ofertas.filter(o => o.role === role && o.exp >= g.temporada && o.pais !== g.pais) : []; }

  /* ---------- tarjetas y bloque para los modales de fin de campaña ---------- */
  function card(o) {
    const lv = dname(o.pais, o.nivel), st = '★'.repeat(Math.max(1, 6 - o.tier)) + '☆'.repeat(Math.max(0, o.tier - 1));
    const extra = o.role === 'DT' ? `Sueldo ${money(o.sal)}/temporada` : `Mandato 4 temporadas · caja inicial ${money(o.caja)}`;
    return `<div class="offer"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><span class="badge" style="width:26px;height:26px;font-size:9px;background:${o.color};color:#fff;border-color:#000;vertical-align:middle">${esc(o.clubId.slice(0, 3))}</span> <b>${esc(o.nombre)}</b> <span class="muted">${flag(o.pais)} ${esc(cname(o.pais))} · ${esc(lv)}</span><br><span class="stars">${st}</span> <span class="muted">· ${extra}</span>${o.deja ? '<br><small class="amber">⚠ Dejarías el club que fundaste</small>' : ''}</div><button class="btn btn-p btn-sm" onclick="REG.ask('${o.id}')">Ver oferta</button></div></div>`;
  }
  function block(kind, res) {
    try {
      if (!active()) return '';
      const fired = kind === 'fired', role = fired ? 'DT' : roleKind();
      if (fired || (res && res.campania === 'Clausura')) genOffers(res, fired, role);
      const list = visible(role); if (!list.length) return '';
      return `<hr class="sep"><div class="panel-title">🌎 Ofertas del extranjero</div>${list.map(card).join('')}<p class="muted"><small>También quedan guardadas en la pestaña 🌎 Región.</small></p>`;
    } catch (e) { console.error('REG.block', e); return ''; }
  }

  /* ---------- mudanza ---------- */
  function whyNot() {
    const g = gg(); if (!active()) return 'No disponible ahora.';
    if (typeof isLiveRunning === 'function' && isLiveRunning()) return 'Terminá el partido en vivo.';
    if ((g.jornadaActual || 1) > 1) return 'Solo podés mudarte al inicio de una campaña (antes de la fecha 2).';
    return '';
  }
  function find(id) { const r = R(); return r ? r.ofertas.find(o => o.id === id) : null; }
  function ask(id) {
    const g = gg(), o = find(id); if (!o) { toast('La oferta ya no está disponible'); return; }
    const w = whyNot(), u = userClub();
    const cands = u.plantilla.slice().sort((a, b) => b.media - a.media).slice(0, 8);
    const pick2 = cands.map(p => `<label style="display:flex;gap:6px;align-items:center;padding:2px 0"><input type="checkbox" class="rg-b" value="${esc(p.id)}" onchange="REG.limit(this)"> <span class="posb pos-${p.posicion}">${p.posicion}</span> ${esc(p.nombre)} <b>${p.media}</b> <small class="muted">${p.edad} años</small></label>`).join('');
    const losing = o.role === 'PRES' && isPresRole() ? 'Tu cuerpo técnico, la cantera y los planteles se quedan en ' + esc(u.nombre) + '.' : 'Tu plantel y tus planteles juveniles se quedan en ' + esc(u.nombre) + '.';
    openModal(`<div class="modal-title">🌎 ${o.role === 'DT' ? 'Dirigir a' : 'Presidir a'} ${esc(o.nombre)}</div>
      <p>${flag(o.pais)} <b>${esc(cname(o.pais))}</b> · ${esc(dname(o.pais, o.nivel))} · ${o.role === 'DT' ? 'Sueldo ' + money(o.sal) + '/temporada' : 'Caja inicial ' + money(o.caja)}</p>
      <div class="pr-msgs"><div>🔄 Se arma la liga de ${esc(cname(o.pais))}: clubes, calendario y copas nuevos.</div><div>⭐ Conservás reputación, palmarés, logros y libro mayor.</div><div>📦 ${losing}</div>${o.deja ? '<div class="amber">⚠ Fundaste ' + esc(u.nombre) + ': al irte queda en tu trayectoria, pero ya no podrás volver a él.</div>' : ''}</div>
      <div class="panel-title" style="margin-top:8px">🤝 Hombres de confianza (hasta ${MAXBRING})</div><small class="muted">Se van contigo gratis.</small><div>${pick2}</div>
      ${w ? `<p class="red">${esc(w)}</p>` : ''}
      <div class="center" style="margin-top:12px"><button class="btn btn-p" ${w ? 'disabled' : ''} onclick="REG.go('${o.id}')">✈ Aceptar</button> <button class="btn" onclick="closeModal()">Volver</button></div>`);
  }
  function limit(el) { const n = document.querySelectorAll('.rg-b:checked').length; if (n > MAXBRING) { el.checked = false; toast('Máximo ' + MAXBRING + ' jugadores'); } }

  function relocate(o, bring) {
    const g = gg(), old = userClub(), oldName = old.nombre, oldPais = g.pais || 'SV';
    if (root.ECO && ECO.onClubChange) ECO.onClubChange();
    try { if (root.FIN && FIN.active()) { const y = FIN.year(false); if (y && !y.closed) { y.closed = true; y.close = Math.round(g.budget || 0); } } } catch (e) { }
    const brought = bring.map(id => old.plantilla.find(p => p.id === id)).filter(Boolean).map(p => Object.assign({}, p, { moral: Math.max(70, p.moral || 60), contrato: Math.max(2, p.contrato || 1), scouted: true }));
    if (root.SEL && g.sel && g.sel.on) { g.sel.on = false; g.sel.win = null; g.sel.comp = null; pushNews('🇸🇻 Dejás la selección al mudarte de país.', 'info'); }
    const W = root.RFM_newWorld(o.pais, o.clubId, g.managerName);
    ['pais', 'clubes', 'divisiones', 'calendarios', 'copa', 'centroCup', 'concacafCup', 'nextConcacafSeeds', 'concacafStats', 'regional', 'mercado', 'agentOffers'].forEach(k => { g[k] = W[k]; });
    g.inboxOffers = []; g.transferNews = []; g.regionalNews = []; g.repechajes = []; g.lastResults = {}; g.playoffStage = null; g.supercopaStage = null; g.matchMode = 'league'; g.jornadaActual = 1; g.bidLock = {};
    g.weekPrep = W.weekPrep;
    g.userClubId = o.clubId; const nc = g.clubes[o.clubId];
    brought.forEach(p => nc.plantilla.push(p));
    let cut = 0; while (nc.plantilla.length > 26) { const ids = new Set(brought.map(p => p.id)); const w = nc.plantilla.filter(p => !ids.has(p.id)).sort((a, b) => a.media - b.media)[0]; if (!w) break; nc.plantilla = nc.plantilla.filter(p => p !== w); cut++; }
    g.budget = nc.budget; g.estadio = nc.estadio; g.sponsor = null; g.sponsorOffers = genSponsorOffers(nc.nivel);
    g.tactics.alineacion = bestXI(nc.plantilla, g.tactics.formacion).map(p => p.id);
    g.objetivo = setObjectiveFor(nc, g.divisiones); g.confianza = 62;
    applyCountry(o.pais);
    if (root.PRES && PRES.relocateHook) PRES.relocateHook(o.role, o.sal); else { g.rol = o.role === 'PRES' ? 'presidente' : 'DT'; }
    if (o.role === 'DT') { g.salarioDT = o.sal; g.dtContract = { campaignsLeft: 4, lastRaise: 0 }; }
    if (root.FIN) FIN.reopen();
    if (root.PL) PL.reopen();
    const r = g.reg; r.moves = (r.moves || 0) + 1; r.ofertas = []; r.gen = '';
    sync();
    pushNews(`🌎 ${g.managerName} deja ${oldName} (${cname(oldPais)}) y ${o.role === 'DT' ? 'es nuevo DT de' : 'asume la presidencia de'} ${nc.nombre} (${cname(o.pais)}).${brought.length ? ' Lo acompañan ' + brought.map(p => p.nombre).join(' y ') + '.' : ''}`, 'info');
    return { club: nc, brought, cut };
  }
  function go(id) {
    const o = find(id); if (!o) { toast('La oferta ya no está disponible'); return; }
    const w = whyNot(); if (w) { toast(w); return; }
    const bring = Array.from(document.querySelectorAll('.rg-b:checked')).map(x => x.value).slice(0, MAXBRING);
    let res; try { res = relocate(o, bring); } catch (e) { console.error('REG.relocate', e); toast('No se pudo completar la mudanza'); return; }
    closeModal(); autoSave(); renderAll(); switchView(isPresRole() ? 'despacho' : 'dashboard'); try { updatePresence(); submitRanking(); } catch (e) { }
    openModal(`<div class="modal-title">✈ ¡Bienvenido a ${esc(cname(o.pais))}!</div><p>${flag(o.pais)} Ahora ${o.role === 'DT' ? 'dirigís' : 'presidís'} a <b>${esc(res.club.nombre)}</b> (${esc(dname(o.pais, o.nivel))}).</p>${res.brought.length ? `<p class="green">Te acompañan: ${res.brought.map(p => esc(p.nombre)).join(', ')}.</p>` : ''}<p class="muted">Tu historia sigue en 🌎 Región → Trayectoria.</p><div class="center" style="margin-top:10px"><button class="btn btn-p" onclick="closeModal()">▶ A trabajar</button></div>`);
  }

  /* ---------- pestaña Región ---------- */
  function topPlayers() {
    const g = gg(), out = [];
    try { CODES.filter(c => lg(c) && lg(c).country !== HOME()).forEach(c => { scoutPool(cname(c)).forEach(r => out.push({ p: r.p, club: r.club, country: cname(c), code: c })); }); } catch (e) { }
    return out.sort((a, b) => b.p.media - a.p.media).slice(0, 12);
  }
  function reqRow(c) {
    const rep = (gg().reputacion || 50), t = rep >= 78 ? 1 : rep >= 60 ? 2 : 3; return t;
  }
  function render() {
    const h = document.getElementById('region-panel'); if (!h) return; const g = gg(); if (!g) return;
    if (!active()) { h.innerHTML = `<div class="panel-title">🌎 Región</div><p class="muted">${g.reto ? 'No está disponible en los retos.' : 'Disponible cuando tu club se profesionalice (fase amateur del Fundador).'}</p>`; return; }
    sync(); const r = g.reg, u = userClub(), role = roleKind();
    const offs = visible(role), w = whyNot();
    const offHTML = offs.length ? offs.map(card).join('') : `<p class="muted">Sin ofertas por ahora. Llegan al cierre del año según tu reputación y tus resultados${role === 'PRES' ? ' (como presidente, se piden varios años de gestión)' : ''}.</p>`;
    const tray = r.tray.slice().reverse().map(e => `<tr><td>${flag(e.pais)}</td><td><b>${esc(e.club)}</b><br><small class="muted">${esc(cname(e.pais))}</small></td><td>${esc(e.rol)}</td><td class="center">${e.desde}${e.hasta == null ? '–hoy' : (e.hasta !== e.desde ? '–' + e.hasta : '')}</td><td class="center">${titlesOf(e) ? '🏆 ' + titlesOf(e) : '—'}</td></tr>`).join('');
    const t = reqRow();
    const ligas = CODES.filter(lg).map(c => `<tr class="${c === g.pais ? 'me' : ''}"><td>${flag(c)} ${esc(cname(c))}</td><td class="center">${NIVEL[c]}</td><td class="center">${Math.round((FACT[c] || 1) * 100)}%</td><td>${esc(dname(c, 1))}</td><td class="center">${c === g.pais ? '📍' : ''}</td></tr>`).join('');
    const tp = topPlayers().map(x => `<tr><td><span class="posb pos-${x.p.posicion}">${x.p.posicion}</span></td><td>${esc(x.p.nombre)}</td><td class="center"><b>${x.p.media}</b></td><td class="center">${x.p.edad}</td><td>${esc(x.club)}<br><small class="muted">${flag(x.code)} ${esc(x.country)}</small></td><td class="center"><button class="btn btn-sm" onclick="REG.look('${esc(x.country)}','${esc(x.p.nombre).replace(/'/g, '')}')">Ofertar</button></td></tr>`).join('');
    h.innerHTML = `<div class="panel-title">🌎 Región</div>
      <div class="offer"><b>${flag(g.pais)} ${esc(cname(g.pais))}</b> · ${esc(u.nombre)} · ${esc(roleLabel())} <span class="muted">· reputación ${Math.round(g.reputacion)}</span><br><small class="muted">${w ? esc(w) : 'Ventana abierta: podés aceptar ofertas ahora.'}</small></div>
      <div class="panel-title" style="margin-top:10px">💼 Ofertas vigentes</div>${offHTML}
      <div class="panel-title" style="margin-top:10px">🧳 Trayectoria <small class="muted">(${countries().size} país${countries().size === 1 ? '' : 'es'})</small></div>
      <div class="scroll"><table class="tbl"><thead><tr><th></th><th>Club</th><th>Cargo</th><th class="center">Años</th><th class="center">Títulos</th></tr></thead><tbody>${tray}</tbody></table></div>
      <div class="panel-title" style="margin-top:10px">🗺 Ligas de la región</div>
      <div class="scroll"><table class="tbl"><thead><tr><th>País</th><th class="center">Nivel</th><th class="center">Salarios</th><th>Primera</th><th></th></tr></thead><tbody>${ligas}</tbody></table></div>
      <small class="muted">Con tu reputación hoy te llegan ofertas del extranjero de ${['', 'Primera', 'Segunda', 'Tercera'][t]} división${t === 1 ? '' : ' hacia abajo'}.</small>
      <div class="panel-title" style="margin-top:10px">⭐ Mejores jugadores de la región <button class="btn btn-sm btn-a" style="float:right" onclick="openScout()">🔎 Buscador</button></div>
      <div class="scroll"><table class="tbl"><thead><tr><th>Pos</th><th>Jugador</th><th class="center">Med</th><th class="center">Edad</th><th>Club</th><th></th></tr></thead><tbody>${tp || '<tr><td colspan="6" class="muted">Sin datos</td></tr>'}</tbody></table></div>`;
  }
  function look(country, name) {
    try { openScout(); const c = document.getElementById('sc-c'), q = document.getElementById('sc-q'); if (c) c.value = country; if (q) q.value = name; scoutSearch(); } catch (e) { console.error(e); }
  }

  root.REG = { active, migrate, sync, onYearEnd, block, card, ask, go, limit, render, look, genOffers, visible, countries, titlesOf, whyNot, NIVEL, FACT };
})(typeof window !== 'undefined' ? window : globalThis);
