/* embajador.js — Programa Embajador (Retro Football Manager SV v2.3)
 * Comparte el juego o el portafolio / invita amigos y desbloqueá ventajas permanentes (sin dinero, para no inflar la economía).
 * Todo se guarda en el dispositivo (rfm_emb). El conteo de invitados usa Firebase si las reglas lo permiten; si no, queda en 0 sin romper nada. */
(function (root) {
'use strict';
const KEY = 'rfm_emb';
const GAME = 'https://7320256-arch.github.io/Retro-Football-Manager-SV/';
const PORTA = 'https://7320256-arch.github.io/';
const $ = id => document.getElementById(id);
const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let ST = null, remote = { n: 0, ok: false };

const PERKS = [
  { id: 'badge', ico: '🎖', n: 'Insignia de Embajador + tema Dorado', d: 'Título dorado y un tema exclusivo (☰ → Temas y estilo).', sh: 1, inv: 0 },
  { id: 'train', ico: '🏋', n: 'Plan del Embajador', d: '+10% de progreso en el entrenamiento de todos tus jugadores.', sh: 3, inv: 0 },
  { id: 'cantera', ico: '🌱', n: 'Beca de cantera', d: '+1 juvenil en cada camada (DT y Presidente).', sh: 6, inv: 1 },
  { id: 'inj', ico: '🩺', n: 'Cuerpo médico VIP', d: '12% menos de lesiones en partidos.', sh: 10, inv: 3 },
  { id: 'fans', ico: '📣', n: 'Fanaticada fiel', d: '+6% de asistencia en tu estadio.', sh: 15, inv: 5 },
  { id: 'rep', ico: '🌟', n: 'Prestigio de Embajador', d: '+5 de reputación (una sola vez).', sh: 20, inv: 10 }
];
const MULT = { train: 1.10, inj: 0.88, fans: 1.06 };

function load() {
  if (ST) return ST;
  try { ST = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { ST = null; }
  if (!ST || typeof ST !== 'object') ST = {};
  ST.code = ST.code || mkCode(); ST.shares = ST.shares || { juego: [], porta: [] }; ST.claimed = ST.claimed || []; ST.welcome = !!ST.welcome;
  return ST;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) { } }
function myId() { try { return root.onlineUserId ? root.onlineUserId() : (localStorage.getItem('rfm_online_id') || 'anon'); } catch (e) { return 'anon'; } }
function mkCode() { let h = 5381; const s = (localStorage.getItem('rfm_online_id') || String(Math.random())) + 'rfm'; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36).toUpperCase().padStart(6, '0').slice(-6); }
function day() { return new Date().toISOString().slice(0, 10); }
function shareCount() { const s = load(); return s.shares.juego.length + s.shares.porta.length; }
function invCount() { return remote.n; }
function unlocked(p) { const s = load(); return s.claimed.includes(p.id); }
function eligible(p) { return shareCount() >= p.sh || invCount() >= p.inv && p.inv > 0; }
function has(id) { const s = load(); if (s.claimed.includes(id)) return true; if (s.welcome && (id === 'badge' || id === 'train')) return true; return false; }
function mult(k) { return has(k) ? MULT[k] : 1; }
function canteraBonus() { return has('cantera') ? 1 : 0; }
function link() { return GAME + '?ref=' + load().code; }

/* ---------- invitaciones (referencia en el enlace) ---------- */
function onLoad() {
  try {
    const s = load(); const ref = new URLSearchParams(location.search).get('ref');
    if (ref && /^[A-Z0-9]{4,10}$/i.test(ref) && !s.from && ref.toUpperCase() !== s.code) {
      s.from = ref.toUpperCase(); s.welcome = true; save();
      try { history.replaceState(null, '', location.pathname); } catch (e) { }
      sendInvite(s.from);
      setTimeout(() => { try { toast('🎁 Te invitó un amigo: insignia y Plan del Embajador desbloqueados'); } catch (e) { } }, 2500);
    }
    refreshRemote();
  } catch (e) { console.warn('EMB.onLoad', e); }
}
function fbReady() { return !!(root.RFM_FIREBASE_READY && root.RFM_FIREBASE_DB && root.RFM_DB); }
function sendInvite(code) {
  const go = () => { try { const db = root.RFM_FIREBASE_DB, F = root.RFM_DB; F.set(F.ref(db, 'referidos/' + code + '/' + myId()), Date.now()).catch(() => { }); } catch (e) { } };
  if (fbReady()) go(); else root.addEventListener('rfm-firebase-ready', go, { once: true });
}
function refreshRemote() {
  const go = () => { try { const db = root.RFM_FIREBASE_DB, F = root.RFM_DB; let un = null; un = F.onValue(F.ref(db, 'referidos/' + load().code), snap => { const v = snap.val(); remote = { n: v ? Object.keys(v).length : 0, ok: true }; try { un && un(); } catch (e) { } if (root.CUR === 'embajador') render(); }, () => { remote.ok = false; }); } catch (e) { } };
  if (fbReady()) go(); else root.addEventListener('rfm-firebase-ready', go, { once: true });
}

/* ---------- compartir ---------- */
function share(kind) {
  const s = load(), url = kind === 'porta' ? PORTA : link();
  const text = kind === 'porta' ? 'Mirá el portafolio de Christopher Alejo (UX), creador de Retro Football Manager SV' : '⚽ Retro Football Manager SV: dirigí o presidí un club salvadoreño. Jugalo gratis';
  const done = () => {
    const d = day(), arr = s.shares[kind === 'porta' ? 'porta' : 'juego'];
    if (!arr.includes(d)) { arr.push(d); if (arr.length > 60) arr.shift(); save(); try { toast('✅ Compartido. Cuenta para tu progreso de hoy'); } catch (e) { } } else { try { toast('Ya contaste este canal hoy; volvé mañana'); } catch (e) { } }
    render(); try { root.updateNovDot && root.updateNovDot(); } catch (e) { }
  };
  if (navigator.share) { navigator.share({ title: 'Retro Football Manager SV', text, url }).then(done).catch(() => { }); }
  else copy(url, text, done);
}
function copy(url, text, cb) {
  const t = (text ? text + ' ' : '') + url;
  const fin = () => { try { toast('📋 Enlace copiado'); } catch (e) { } cb && cb(); };
  try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(fin).catch(() => manual(t, cb)); return; } } catch (e) { }
  manual(t, cb);
}
function manual(t, cb) { try { openModal(`<div class="modal-title">📋 Copiá el enlace</div><textarea readonly style="width:100%;height:90px" onfocus="this.select()">${E(t)}</textarea><div class="center" style="margin-top:8px"><button class="btn btn-p" onclick="closeModal()">Listo</button></div>`); cb && cb(); } catch (e) { } }
function copyLink() { copy(link(), '', null); }

/* ---------- reclamar ---------- */
function claim(id) {
  const p = PERKS.find(x => x.id === id), s = load(); if (!p || s.claimed.includes(id)) return;
  if (!eligible(p)) { try { toast('Todavía no cumplís el requisito'); } catch (e) { } return; }
  s.claimed.push(id);
  if (id === 'rep' && root.G && root.G.clubes) { root.G.reputacion = Math.min(100, (root.G.reputacion || 50) + 5); }
  save();
  try { if (root.G) { root.pushNews(`🎁 Embajador: desbloqueaste «${p.n}».`, 'bueno', 'club'); if (id === 'badge') root.unlockAchievement('embajador', 'Embajador', 'Compartiste el juego con tus amigos'); root.autoSave && root.autoSave(); } } catch (e) { }
  try { toast('🎁 ¡Desbloqueado: ' + p.n + '!'); } catch (e) { }
  render();
}

/* ---------- interfaz ---------- */
function ensureView() {
  const main = document.querySelector('main'); if (!main || $('view-embajador')) return;
  const sec = document.createElement('section'); sec.id = 'view-embajador'; sec.className = 'view hidden'; sec.innerHTML = '<div class="panel" id="embajador-panel"></div>'; main.appendChild(sec);
}
function chrome() {
  ensureView(); const nav = $('nav'); if (!nav) return; let b = nav.querySelector('[data-v="embajador"]');
  if (!root.G || !root.G.clubes) { if (b) b.remove(); return; }
  if (root.PRES && root.PRES.isPres && root.PRES.isPres()) { if (b) b.remove(); return; } // presidente: va dentro de Prensa
  if (!b) { b = document.createElement('button'); b.className = 'tab'; b.dataset.v = 'embajador'; b.setAttribute('onclick', "switchView('embajador')"); const before = nav.querySelector('[data-v="noticias"]') || nav.querySelector('.go'); nav.insertBefore(b, before); }
  b.textContent = '🎁 Embajador'; if (root.CUR === 'embajador') b.classList.add('active');
}
function onSwitch(v) { if (v === 'embajador') { ensureView(); const sec = $('view-embajador'); if (sec) sec.classList.remove('hidden'); render(); } }
function render() {
  ensureView(); const h = $('embajador-panel'); if (!h) return; const s = load(), sh = shareCount(), inv = invCount();
  const rows = PERKS.map(p => {
    const got = unlocked(p) || has(p.id), ok = eligible(p), reqS = Math.min(sh, p.sh), reqI = p.inv ? Math.min(inv, p.inv) : null;
    const pct = Math.max(Math.round(reqS / p.sh * 100), p.inv ? Math.round(reqI / p.inv * 100) : 0);
    return `<div class="offer" style="${got ? '' : ok ? '' : 'opacity:.85'}"><div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:26px">${got ? p.ico : ok ? p.ico : '🔒'}</span><div><b class="${got ? 'gold' : 'cyan'}">${E(p.n)}</b><br><small class="muted">${E(p.d)}</small><br><small class="muted">Requisito: ${p.sh} compartidas${p.inv ? ' o ' + p.inv + ' amigo' + (p.inv > 1 ? 's' : '') + ' invitado' + (p.inv > 1 ? 's' : '') : ''}</small></div></div>
      <div style="min-width:120px;text-align:right">${got ? '<b class="green">✔ Activo</b>' : ok ? `<button class="btn btn-p btn-sm" onclick="EMB.claim('${p.id}')">Reclamar</button>` : `<small class="muted">${pct}%</small>`}</div></div></div>`;
  }).join('');
  h.innerHTML = `<div class="panel-title">🎁 Programa Embajador</div>
  <p class="muted" style="font-size:16px">Compartí el juego o el portafolio de su creador y desbloqueá ventajas <b>permanentes</b> para tu club y tus jugadores. Sin dinero: son mejoras que valen la pena.</p>
  <div class="offer"><div class="muted" style="font-size:14px">Tu código</div><b class="gold" style="font-size:22px;letter-spacing:2px">${E(s.code)}</b>
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-p" onclick="EMB.share('juego')">📲 Compartir el juego</button><button class="btn" onclick="EMB.share('porta')">🌐 Compartir el portafolio</button><button class="btn" onclick="EMB.copyLink()">📋 Copiar mi enlace</button></div>
   <div class="muted" style="font-size:14px;margin-top:8px">Compartidas: <b class="green">${sh}</b> (cuenta 1 por canal y por día) · Amigos invitados: <b class="green">${inv}</b>${remote.ok ? '' : ' <small>(se actualiza con internet)</small>'}${s.from ? '<br>Te invitó el código <b>' + E(s.from) + '</b> · ya tenés la insignia y el Plan del Embajador.' : ''}</div></div>
  ${rows}
  <p class="muted" style="font-size:14px">Quien entra con tu enlace recibe de regalo la insignia y el Plan del Embajador. Los amigos invitados se cuentan cuando abren el juego desde tu enlace.</p>`;
}
function badge() { return has('badge'); }

root.EMB = { onLoad, chrome, onSwitch, render, share, copyLink, claim, has, mult, canteraBonus, badge, link, PERKS };
})(window);
