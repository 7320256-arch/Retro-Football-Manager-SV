/* ============================================================================
 * finanzas.js — v2.5 · Libro mayor + Informe económico anual
 * ----------------------------------------------------------------------------
 * - Todo movimiento de caja pasa por fin() -> FIN.record() (libro mayor por club/año).
 * - Caja inicial + movimientos = caja final. Lo que no tenga asiento se muestra
 *   como "Movimientos no clasificados" (nunca se esconde).
 * - Informe anual al cerrar el Clausura (año futbolístico). Consultarlo no modifica nada.
 * - Es una capa de LECTURA/REGISTRO: no cambia ingresos ni gastos del juego.
 * ========================================================================== */
(function (root) {
  'use strict';
  const gg = () => (typeof G !== 'undefined' ? G : null);
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => (typeof root.money === 'function' ? root.money(n) : '$' + Math.round(n).toLocaleString('en-US'));
  const signed = n => (n >= 0 ? '+' : '−') + money(Math.abs(n)).replace('-', '');

  // ---- plan de cuentas ----
  const CATS = {
    taq: { n: 'Taquilla local', g: 'in', rec: 1 },
    taqv: { n: 'Reparto de visitante', g: 'in', rec: 1 },
    tv: { n: 'Televisión y participación', g: 'in', rec: 1 },
    pat: { n: 'Patrocinio fijo', g: 'in', rec: 1 },
    bonos: { n: 'Bonos y primas comerciales', g: 'in' },
    prem: { n: 'Premios deportivos (nacionales)', g: 'in' },
    premi: { n: 'Premios continentales', g: 'in', extra: 1 },
    vent: { n: 'Ventas de jugadores', g: 'in', tras: 1 },
    oin: { n: 'Otros ingresos', g: 'in' },
    nom: { n: 'Nómina', g: 'out', rec: 1 },
    op: { n: 'Operación de estadio e instalaciones', g: 'out', rec: 1 },
    cant: { n: 'Entrenamiento, cantera y salud', g: 'out', rec: 1 },
    fich: { n: 'Fichajes, primas, scouting y agentes', g: 'out', tras: 1 },
    inv: { n: 'Inversión: estadio e instalaciones', g: 'out', inv: 1 },
    oex: { n: 'Otros gastos', g: 'out' },
    res: { n: 'Movimientos con la reserva del club', g: 'res' }
  };
  const INTL = /Centroamericana|CONCACAF/i;

  function classify(t, tipo, monto, det) {
    const T = String(t || ''), D = String(det || '');
    if (tipo === 'reserva' || T === 'Reserva') return 'res';
    if (T === 'Directiva') return /reserva/i.test(D) ? 'res' : (monto >= 0 ? 'oin' : 'oex');
    if (T === 'Liga') { if (/^Taquilla visita/i.test(D)) return 'taqv'; if (/^Taquilla/i.test(D)) return 'taq'; if (/resultado/i.test(D)) return 'bonos'; return 'prem'; }
    if (T === 'TV') return 'tv';
    if (T === 'Patrocinador') return /prima|bono|firma/i.test(D) ? 'bonos' : 'pat';
    if (T === 'Plantilla') return /^Nómina/i.test(D) ? 'nom' : 'fich';
    if (T === 'Plantel' || T === 'Cantera') return 'cant';
    if (T === 'Scouting' || T === 'Agente') return 'fich';
    if (T === 'Mercado' || T === 'Mercado élite') return monto >= 0 && /^Venta/i.test(D) ? 'vent' : (monto >= 0 ? 'oin' : 'fich');
    if (T === 'Estadio') return /Mantenimiento|Alquiler/i.test(D) ? 'op' : 'inv';
    if (T === 'Infraestructura') return /Mantenimiento/i.test(D) ? 'op' : 'inv';
    if (T === 'Marketing') return 'op';
    if (T === 'Evento') return monto >= 0 ? 'oin' : 'oex';
    if (INTL.test(T)) return 'premi';
    if (/^(Copa|Liguilla|Supercopa)/i.test(T)) return 'prem';
    return monto >= 0 ? 'oin' : 'oex';
  }

  // ---- estado ----
  function active() { const g = gg(); return !!(g && g.clubes && g.userClubId && !g.reto && g.rol !== 'presidente' && !(g.pres && g.pres.on)); }
  function led() {
    const g = gg(); if (!g.ledger) g.ledger = { v: 1, seq: 0, years: {}, order: [], rows: [], keys: {} };
    const L = g.ledger; L.years = L.years || {}; L.order = L.order || []; L.rows = L.rows || []; L.keys = L.keys || {}; return L;
  }
  function clubName() { try { return userClub().nombre; } catch (e) { return ''; } }
  function divName() { try { return DIV_NAMES[userClub().nivel]; } catch (e) { return ''; } }
  function yearKey() { const g = gg(); return g.temporada + ':' + g.userClubId; }
  function year(create) {
    const g = gg(), L = led(), k = yearKey();
    let y = L.years[k];
    if (!y && create !== false) {
      y = L.years[k] = { k, temp: g.temporada, clubId: g.userClubId, club: clubName(), div: divName(), open: Math.round(g.budget || 0), cats: {}, n: 0, md: 0, closed: false };
      L.order.push(k); trimYears(L);
    }
    return y;
  }
  function trimYears(L) { while (L.order.length > 40) { const k = L.order.shift(); delete L.years[k]; } }
  function openYear(note) { if (!active()) return; const y = year(); if (note && !y.note) y.note = note; return y; }
  // el usuario cambió de club o de rol: abrir un libro nuevo con la caja actual
  function reopen() { if (!active()) return; const y = year(); y.open = Math.round(gg().budget || 0); y.cats = {}; y.n = 0; y.md = 0; return y; }

  function record(t, tipo, monto, det, key) {
    try {
      if (!active()) return false;
      monto = Math.round(Number(monto) || 0);
      if (!monto) return false;
      const L = led();
      if (key) { if (L.keys[key]) return false; L.keys[key] = 1; const ks = Object.keys(L.keys); if (ks.length > 200) ks.slice(0, 80).forEach(x => delete L.keys[x]); }
      const cat = classify(t, tipo, monto, det), y = year();
      y.cats[cat] = (y.cats[cat] || 0) + monto; y.n++;
      if (cat === 'nom') y.md++;
      const g = gg();
      L.rows.push({ i: ++L.seq, t: g.temporada, c: String(g.campania || 'Apertura').charAt(0), j: g.jornadaActual, cat, amt: monto, det: String(det || '').slice(0, 80), club: g.userClubId });
      if (L.rows.length > 420) L.rows.splice(0, L.rows.length - 420);
      return true;
    } catch (e) { console.warn('ledger', e); return false; }
  }
  // Clave idempotente: devuelve true la primera vez; false si ya se procesó.
  function once(key) { try { if (!active()) return true; const L = led(); if (L.keys[key]) return false; L.keys[key] = 1; return true; } catch (e) { return true; } }

  // ---- cálculos ----
  function sums(y) {
    const c = y.cats || {}, S = k => c[k] || 0;
    let inc = 0, exp = 0, resMov = 0;
    Object.keys(c).forEach(k => { const d = CATS[k] || { g: c[k] >= 0 ? 'in' : 'out' }; if (d.g === 'res') resMov += c[k]; else if (c[k] >= 0) inc += c[k]; else exp += c[k]; });
    const recInc = S('taq') + S('taqv') + S('tv') + S('pat');
    const opCost = S('nom') + S('op') + S('cant');
    const operativo = recInc + S('bonos') + S('prem') + S('oin') + opCost + S('oex');
    const traspasos = S('vent') + S('fich');
    const inversion = S('inv');
    const extra = S('premi');
    const closeCash = y.closed ? y.close : Math.round(gg().budget || 0);
    const total = Object.keys(c).reduce((a, k) => a + c[k], 0);
    const residual = Math.round(closeCash - y.open - total);
    return { inc, exp, resMov, recInc, opCost, operativo, traspasos, inversion, extra, closeCash, total, residual, net: closeCash - y.open };
  }
  function status(y, s) {
    const nom = Math.abs((y.cats || {}).nom || 0), carga = s.recInc > 0 ? nom / s.recInc : (nom > 0 ? 9 : 0);
    const md = Math.max(1, y.md || 1), costMd = (Math.abs((y.cats || {}).nom || 0) + Math.abs((y.cats || {}).op || 0)) / md;
    const aut = costMd > 0 ? s.closeCash / costMd : 99;
    let est = 'estable', why = 'Caja y nómina sanas.';
    if (s.closeCash < 0) { est = 'riesgo'; why = 'La caja terminó en negativo.'; }
    else if (carga > 0.8) { est = 'riesgo'; why = 'La nómina consume ' + Math.round(carga * 100) + '% de los ingresos recurrentes (más de 80%).'; }
    else if (aut < 3) { est = 'riesgo'; why = 'La caja cubre menos de 3 jornadas de costes inevitables.'; }
    else if (carga > 0.65) { est = 'atención'; why = 'La nómina consume ' + Math.round(carga * 100) + '% de los ingresos recurrentes (entre 65% y 80%).'; }
    else if (aut < 6) { est = 'atención'; why = 'La caja cubre ' + aut.toFixed(1) + ' jornadas de costes inevitables (menos de 6).'; }
    else if (s.operativo < 0) { est = 'atención'; why = 'El resultado operativo fue negativo; la caja se sostuvo con ventas o premios.'; }
    return { est, why, carga, aut };
  }

  // ---- cierre de año / campaña ----
  function closeCampaign(camp) {
    if (!active()) return null;
    const y = year(), s = sums(y);
    if (camp === 'Apertura') {
      try { pushNews(`📊 Cierre ${camp}: ingresos ${money(s.inc)} · gastos ${money(Math.abs(s.exp))} · caja ${money(s.closeCash)}.`, s.net >= 0 ? 'bueno' : 'info', 'club'); } catch (e) { }
      return null;
    }
    y.closed = true; y.close = Math.round(gg().budget || 0);
    const s2 = sums(y), st = status(y, s2);
    y.rep = { inc: s2.inc, exp: s2.exp, operativo: s2.operativo, traspasos: s2.traspasos, inversion: s2.inversion, extra: s2.extra, net: s2.net, residual: s2.residual, est: st.est, why: st.why, carga: +st.carga.toFixed(3), aut: +Math.min(99, st.aut).toFixed(1), close: y.close };
    led().pending = y.k;
    try { if (root.ACH) ACH.onYearClose(y); } catch (e) { console.warn(e); }
    return y;
  }
  function prevYear(y) { const L = led(); const i = L.order.indexOf(y.k); for (let j = i - 1; j >= 0; j--) { const p = L.years[L.order[j]]; if (p && p.rep) return p; } return null; }

  // ---- UI ----
  const badge = e => `<b class="${e === 'estable' ? 'green' : e === 'atención' ? 'amber' : 'red'}">${e.toUpperCase()}</b>`;
  function row(label, v, cls) { return `<tr><td>${esc(label)}</td><td class="right ${cls || (v >= 0 ? 'green' : 'red')}">${signed(v)}</td></tr>`; }
  function catRows(y, group) {
    const c = y.cats || {}; return Object.keys(c).filter(k => (CATS[k] || {}).g === group).sort((a, b) => Math.abs(c[b]) - Math.abs(c[a])).map(k => row(CATS[k].n, c[k])).join('') || '<tr><td colspan="2" class="muted">Sin movimientos.</td></tr>';
  }
  function reportHTML(y, tab) {
    const s = sums(y), st = status(y, s), p = prevYear(y);
    const top = Object.keys(y.cats).filter(k => (CATS[k] || {}).g === 'in').sort((a, b) => y.cats[b] - y.cats[a])[0];
    const topEx = Object.keys(y.cats).filter(k => (CATS[k] || {}).g === 'out').sort((a, b) => y.cats[a] - y.cats[b])[0];
    let txt = '';
    if (top) txt += `Tu mayor ingreso fue <b>${esc(CATS[top].n.toLowerCase())}</b> (${money(y.cats[top])}). `;
    if (topEx) txt += `Tu mayor gasto fue <b>${esc(CATS[topEx].n.toLowerCase())}</b> (${money(Math.abs(y.cats[topEx]))}). `;
    if (p && p.rep) { const d = s.inc - p.rep.inc; txt += `Los ingresos ${d >= 0 ? 'subieron' : 'bajaron'} ${money(Math.abs(d))} frente a ${p.temp}. `; }
    if (s.recInc > 0) txt += `La nómina consumió <b>${Math.round(st.carga * 100)}%</b> de los ingresos recurrentes.`;
    const tabs = [['res', 'Resumen'], ['caja', 'Caja'], ['ing', 'Ingresos'], ['gas', 'Gastos'], ['prox', 'Próximo año']];
    const nav = `<div class="center" style="margin:6px 0">${tabs.map(t => `<button class="btn btn-sm ${tab === t[0] ? 'btn-p' : ''}" onclick="FIN.tab('${y.k}','${t[0]}')">${t[1]}</button>`).join(' ')}</div>`;
    let body = '';
    if (tab === 'res') {
      body = `<div class="offer"><b>Estado financiero: ${badge(st.est)}</b><br><small>${esc(st.why)}</small></div>
        <table class="tbl" style="width:100%"><tbody>
        <tr><td>Caja inicial</td><td class="right">${money(y.open)}</td></tr>
        <tr><td>Ingresos recibidos</td><td class="right green">${signed(s.inc)}</td></tr>
        <tr><td>Pagos realizados</td><td class="right red">${signed(s.exp)}</td></tr>
        <tr><td>Movimientos con la reserva</td><td class="right">${signed(s.resMov)}</td></tr>
        ${Math.abs(s.residual) > 0 ? `<tr><td>Movimientos no clasificados</td><td class="right amber">${signed(s.residual)}</td></tr>` : ''}
        <tr><td><b>Caja final</b></td><td class="right"><b>${money(s.closeCash)}</b></td></tr>
        <tr><td>Variación neta de caja</td><td class="right ${s.net >= 0 ? 'green' : 'red'}">${signed(s.net)}</td></tr></tbody></table>
        <p style="font-size:15px;margin:8px 0">${txt}</p>
        <div class="muted" style="font-size:14px">Resultado operativo ${signed(s.operativo)} · Saldo de traspasos ${signed(s.traspasos)} · Inversión ${signed(s.inversion)} · Premios continentales ${signed(s.extra)}. <i>Una venta de jugador no es ingreso normal del club; los premios grandes no están garantizados el próximo año.</i></div>`;
    } else if (tab === 'caja') {
      body = `<pre style="white-space:pre-wrap;font-size:14px;margin:0">Caja inicial                     ${money(y.open)}
+ Ingresos de operación          ${signed(s.recInc + ((y.cats.bonos) || 0) + ((y.cats.oin) || 0))}
+ Premios                        ${signed(((y.cats.prem) || 0) + s.extra)}
+ Ventas de jugadores            ${signed((y.cats.vent) || 0)}
− Nómina y operación             ${signed(s.opCost)}
− Fichajes, primas y agentes     ${signed((y.cats.fich) || 0)}
− Inversión                      ${signed(s.inversion)}
± Reserva del club               ${signed(s.resMov)}
${Math.abs(s.residual) > 0 ? '± No clasificado                 ' + signed(s.residual) + '\n' : ''}= Caja final                     ${money(s.closeCash)}</pre>
        <p class="muted" style="font-size:14px">${Math.abs(s.residual) === 0 ? '✔ Reconcilia exactamente.' : '⚠ Hay ' + money(Math.abs(s.residual)) + ' sin clasificar: movimientos que el juego no asentó en una categoría. Se muestran aparte, no se ocultan.'}</p>`;
    } else if (tab === 'ing') {
      body = `<table class="tbl" style="width:100%"><tbody>${catRows(y, 'in')}</tbody></table><div class="muted" style="font-size:14px;margin-top:6px">Los premios grandes (continentales) son extraordinarios: no cuentes con ellos el próximo año.</div>`;
    } else if (tab === 'gas') {
      body = `<table class="tbl" style="width:100%"><tbody>${catRows(y, 'out')}</tbody></table>
        <div class="muted" style="font-size:14px;margin-top:6px">Nómina sobre ingresos recurrentes: <b>${Math.round(st.carga * 100)}%</b> (alerta roja &gt; 80%, advertencia 65–80%). Autonomía de caja: <b>${st.aut >= 99 ? '—' : st.aut.toFixed(1)}</b> jornadas (roja &lt; 3, advertencia 3–6).</div>`;
    } else {
      const g = gg(); let wk = 0; try { wk = weeklyWage(); } catch (e) { }
      const fechas = Math.max(22, (y.md || 22)), base = s.recInc + (y.cats.bonos || 0) + (y.cats.oin || 0) - Math.abs(y.cats.op || 0) - Math.abs(y.cats.cant || 0) - wk * fechas;
      const cons = Math.round(base - Math.abs(s.recInc) * 0.10), opt = Math.round(base + Math.abs(s.recInc) * 0.08);
      const libre = s.closeCash - wk * 3;
      body = `<div class="offer"><b>Compromisos</b><br><small>Nómina actual: ${money(wk)} por fecha (≈ ${money(wk * fechas)} por año). Cuotas de traspaso pendientes: ninguna (los pagos del juego son al contado).</small></div>
        <div class="offer"><b>Caja libre</b> tras reservar 3 fechas de nómina: <b class="${libre >= 0 ? 'green' : 'red'}">${money(libre)}</b></div>
        <table class="tbl" style="width:100%"><tbody>${row('Previsión conservadora', cons)}${row('Previsión base', Math.round(base))}${row('Previsión optimista', opt)}</tbody></table>
        <div class="muted" style="font-size:14px">Supuestos: ingresos recurrentes del año ${y.temp} (−10% / igual / +8%), nómina actual, sin premios ni ventas. Gastos opcionales: estadio, academia y fichajes; no se pueden cancelar sin coste: la nómina firmada.</div>`;
    }
    return `<div class="modal-title">📊 Informe económico ${y.temp} · ${esc(y.club)}</div><div class="muted center" style="font-size:14px">${esc(y.div || '')}${y.note ? ' · ' + esc(y.note) : ''}</div>${nav}<div class="scroll" style="max-height:52vh">${body}</div>`;
  }
  let NEXT = null;
  function showReport(k, tab, next) {
    const L = led(), y = L.years[k]; if (!y) return;
    if (next !== undefined) NEXT = next;
    openModal(reportHTML(y, tab || 'res') + `<hr class="sep"><div class="center">
      <button class="btn btn-sm" onclick="FIN.compare()">📈 Comparar temporadas</button>
      <button class="btn btn-sm" onclick="FIN.exportYear('${y.k}','csv')">⬇ CSV</button>
      <button class="btn btn-sm" onclick="FIN.exportYear('${y.k}','json')">⬇ JSON</button>
      <button class="btn btn-p" onclick="FIN.cont()">▶ Continuar</button></div>`);
  }
  function tab(k, t) { showReport(k, t); }
  function cont() { closeModal(); const n = NEXT; NEXT = null; if (typeof n === 'function') setTimeout(n, 60); }
  function showPending(next) {
    const L = led(), k = L.pending;
    if (!k || !L.years[k]) { if (typeof next === 'function') next(); return false; }
    L.pending = null; showReport(k, 'res', next); return true;
  }
  function compare() {
    const L = led(), ys = L.order.map(k => L.years[k]).filter(y => y && y.rep).slice(-8);
    const rows = ys.map(y => `<tr><td class="center">${y.temp}</td><td>${esc(y.club)}</td><td class="right">${money(y.rep.inc)}</td><td class="right">${money(Math.abs(y.rep.exp))}</td><td class="right ${y.rep.net >= 0 ? 'green' : 'red'}">${signed(y.rep.net)}</td><td>${badge(y.rep.est)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Aún no hay temporadas cerradas. El primer informe sale al terminar el Clausura.</td></tr>';
    openModal(`<div class="modal-title">📈 Comparar temporadas</div><div class="scroll" style="max-height:55vh"><table class="tbl" style="width:100%"><thead><tr><th>Año</th><th>Club</th><th>Ingresos</th><th>Gastos</th><th>Caja</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div><div class="center" style="margin-top:8px"><button class="btn btn-p" onclick="closeModal()">Cerrar</button></div>`);
  }
  function download(name, mime, text) {
    try { const b = new Blob([text], { type: mime }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 300); } catch (e) { try { toast('No se pudo exportar'); } catch (x) { } }
  }
  function exportYear(k, fmt) {
    const L = led(), y = L.years[k]; if (!y) return;
    const rows = L.rows.filter(r => r.t === y.temp && r.club === y.clubId);
    const s = sums(y);
    if (fmt === 'json') return download('finanzas_' + y.temp + '_' + y.clubId + '.json', 'application/json', JSON.stringify({ year: y, summary: s, rows }, null, 1));
    const lines = ['id,temporada,campaña,fecha,categoría,importe,detalle'];
    rows.forEach(r => lines.push([r.i, r.t, r.c === 'A' ? 'Apertura' : 'Clausura', r.j, '"' + (CATS[r.cat] ? CATS[r.cat].n : r.cat) + '"', r.amt, '"' + String(r.det).replace(/"/g, '""') + '"'].join(',')));
    download('finanzas_' + y.temp + '_' + y.clubId + '.csv', 'text/csv;charset=utf-8', '﻿' + lines.join('\n'));
  }
  function openLedger() {
    if (!active()) { toast('El libro mayor es del modo DT'); return; }
    const y = year(), s = sums(y), L = led();
    const rows = L.rows.filter(r => r.t === y.temp && r.club === y.clubId).slice(-40).reverse();
    const tr = rows.map(r => `<tr><td class="center">${r.c}${r.j}</td><td>${esc(CATS[r.cat] ? CATS[r.cat].n : r.cat)}<br><small class="muted">${esc(r.det)}</small></td><td class="right ${r.amt >= 0 ? 'green' : 'red'}">${signed(r.amt)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Sin asientos este año.</td></tr>';
    openModal(`<div class="modal-title">📒 Libro mayor ${y.temp} · ${esc(y.club)}</div>
      <div class="offer"><small>Caja inicial ${money(y.open)} · ingresos ${signed(s.inc)} · pagos ${signed(s.exp)}${Math.abs(s.resMov) ? ' · reserva ' + signed(s.resMov) : ''}${Math.abs(s.residual) ? ' · <span class="amber">no clasificado ' + signed(s.residual) + '</span>' : ''} → caja ${money(s.closeCash)}</small></div>
      <div class="scroll" style="max-height:45vh"><table class="tbl" style="width:100%"><tbody>${tr}</tbody></table></div>
      <div class="center" style="margin-top:8px"><button class="btn btn-sm" onclick="FIN.exportYear('${y.k}','csv')">⬇ CSV</button> <button class="btn btn-sm" onclick="FIN.compare()">📈 Informes anuales</button> <button class="btn btn-p" onclick="closeModal()">Cerrar</button></div>`);
  }
  function panelHTML() {
    if (!active()) return '';
    const y = year(), s = sums(y), st = status(y, s);
    return `<div class="panel-title" style="margin-top:12px">📒 Libro mayor ${y.temp}</div>
      <div class="offer"><small>Estado: ${badge(st.est)} · ${esc(st.why)}<br>Ingresos ${signed(s.inc)} · pagos ${signed(s.exp)} · variación de caja ${signed(s.net)}</small>
      <div style="margin-top:6px"><button class="btn btn-sm btn-p" onclick="FIN.openLedger()">📒 Abrir libro mayor</button> <button class="btn btn-sm" onclick="FIN.compare()">📈 Informes anuales</button></div></div>`;
  }

  // ---- migración: partidas v2.3.1/2.4 entran con una línea de apertura (no se inventa historial) ----
  function migrate() {
    try {
      const g = gg(); if (!g) return;
      led();
      if (active()) { const y = year(); if (y && !y.note && y.n === 0) y.note = 'La contabilidad de este año empieza en tu partida actual (histórico previo no registrado)'; }
    } catch (e) { console.warn('FIN.migrate', e); }
  }

  root.FIN = { CATS, classify, record, once, openYear, reopen, closeCampaign, showPending, showReport, tab, cont, compare, exportYear, openLedger, panelHTML, migrate, active, sums, year };
})(typeof window !== 'undefined' ? window : globalThis);
