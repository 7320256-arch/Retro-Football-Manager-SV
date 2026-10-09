/* embajador.js — Programa Embajador (Retro Football Manager SV v2.3)
 * Comparte el juego o el portafolio / invita amigos y desbloqueá ventajas permanentes (sin dinero, para no inflar la economía).
 * Todo se guarda en el dispositivo (rfm_emb). El conteo de invitados usa Firebase si las reglas lo permiten; si no, queda en 0 sin romper nada. */
(function (root) {
'use strict';
const KEY = 'rfm_emb';
const GAME = 'https://7320256-arch.github.io/Retro-Football-Manager-SV/';
const PORTA = 'https://7320256-arch.github.io/Portafolio-/';
const APK = 'https://www.mediafire.com/file/esjer0iy809cezm/FM_El_Salvador.apk/file';
const $ = id => document.getElementById(id);
const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const gg = () => (typeof G !== 'undefined' ? G : null);
const cur = () => (typeof CUR !== 'undefined' ? CUR : '');
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
/* Las ventajas son POR CLUB: viven en G.emb y se pierden si cambias de club. */
function club() {
  const g = gg(); if (!g || !g.clubes) return null;
  if (!g.emb || g.emb.club !== g.userClubId) g.emb = { club: g.userClubId, perks: [] };
  const s = load();
  if (s.welcome && !s.welcomeUsed) { s.welcomeUsed = true; ['badge', 'train'].forEach(k => { if (!g.emb.perks.includes(k)) g.emb.perks.push(k); }); save(); }
  return g.emb;
}
function has(id) { const c = club(); return !!(c && c.perks.includes(id)); }
function grantNext(why) {
  const c = club(); if (!c) return null; const p = PERKS.find(x => !c.perks.includes(x.id)); if (!p) return null;
  c.perks.push(p.id);
  if (p.id === 'rep') gg().reputacion = Math.min(100, (gg().reputacion || 50) + 5);
  try { root.pushNews(`🎁 Embajador: «${p.n}» activo en ${root.userClub().nombre}.`, 'bueno', 'club'); if (p.id === 'badge') root.unlockAchievement('embajador', 'Embajador', 'Compartiste el juego con tus amigos'); root.autoSave && root.autoSave(); } catch (e) { }
  try { toast('🎁 ¡Ventaja activa en tu club: ' + p.n + '!'); } catch (e) { }
  return p;
}
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
  const go = () => { try { const db = root.RFM_FIREBASE_DB, F = root.RFM_DB; let un = null; un = F.onValue(F.ref(db, 'referidos/' + load().code), snap => { const v = snap.val(); const n = v ? Object.keys(v).length : 0; remote = { n, ok: true }; const s = load(); if (n > (s.invCredited || 0)) { const k = n - (s.invCredited || 0); s.invCredited = n; save(); for (let i = 0; i < k; i++) grantNext('inv'); } try { un && un(); } catch (e) { } if (cur() === 'embajador') render(); }, () => { remote.ok = false; }); } catch (e) { } };
  if (fbReady()) go(); else root.addEventListener('rfm-firebase-ready', go, { once: true });
}

/* ---------- compartir ---------- */
function msgGame() {
  return '¡Prueba este juego, es increíble! ⚽ Retro Football Manager SV: dirigí o presidí un club salvadoreño, fichá jugadores, jugá la liguilla, la Copa Centroamericana y la CONCACAF, y hasta dirigí a la Selecta. Gratis.\n📲 Descargalo (APK): ' + APK + '\n🌐 O jugalo en el navegador: ' + link();
}
function share(kind) {
  const s = load(), porta = kind === 'porta';
  const text = porta ? 'Mirá el portafolio de Christopher Alejo (UX), creador de Retro Football Manager SV: ' + PORTA : msgGame();
  const done = () => {
    const d = day(), arr = s.shares[porta ? 'porta' : 'juego'];
    if (!arr.includes(d)) { arr.push(d); if (arr.length > 60) arr.shift(); save(); if (!grantNext('share')) { try { toast('✅ ¡Gracias por compartir! Ya tenés todas las ventajas en este club'); } catch (e) { } } }
    else { try { toast('Ya contó el de hoy en este canal; volvé mañana para más'); } catch (e) { } }
    render();
  };
  if (navigator.share) { navigator.share({ title: 'Retro Football Manager SV', text }).then(done).catch(() => { }); }
  else copy('', text, done);
}
function copy(url, text, cb) {
  const t = (text ? text + (url ? ' ' : '') : '') + url;
  const fin = () => { try { toast('📋 Enlace copiado'); } catch (e) { } cb && cb(); };
  try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(fin).catch(() => manual(t, cb)); return; } } catch (e) { }
  manual(t, cb);
}
function manual(t, cb) { try { cb && cb(); } catch (e) { } try { openModal(`<div class="modal-title">📋 Copiá el enlace</div><textarea readonly style="width:100%;height:90px" onfocus="this.select()">${E(t)}</textarea><div class="center" style="margin-top:8px"><button class="btn btn-p" onclick="closeModal()">Listo</button></div>`); } catch (e) { } }
function copyLink() { copy('', msgGame(), null); }

/* ---------- interfaz ---------- */
function ensureView() {
  const main = document.querySelector('main'); if (!main || $('view-embajador')) return;
  const sec = document.createElement('section'); sec.id = 'view-embajador'; sec.className = 'view hidden'; sec.innerHTML = '<div class="panel" id="embajador-panel"></div>'; main.appendChild(sec);
}
function chrome() {
  ensureView(); const nav = $('nav'); if (!nav) return; let b = nav.querySelector('[data-v="embajador"]');
  const g0 = gg(); if (!g0 || !g0.clubes) { if (b) b.remove(); return; }
  if (root.PRES && root.PRES.isPres && root.PRES.isPres()) { if (b) b.remove(); return; } // presidente: va dentro de Prensa
  if (!b) { b = document.createElement('button'); b.className = 'tab'; b.dataset.v = 'embajador'; b.setAttribute('onclick', "switchView('embajador')"); const before = nav.querySelector('[data-v="noticias"]') || nav.querySelector('.go'); nav.insertBefore(b, before); }
  b.textContent = '🎁 Embajador'; if (cur() === 'embajador') b.classList.add('active');
}
function onSwitch(v) { if (v === 'embajador') { ensureView(); const sec = $('view-embajador'); if (sec) sec.classList.remove('hidden'); render(); } }
function render() {
  ensureView(); const h = $('embajador-panel'); if (!h) return; const s = load(), c = club(), inv = invCount();
  const act = c ? c.perks.length : 0, nom = gg() && gg().clubes ? root.userClub().nombre : '';
  const rows = PERKS.map((p, i) => { const got = !!(c && c.perks.includes(p.id)), next = !got && i === act;
    return `<div class="offer" style="${got ? '' : 'opacity:.85'}"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:26px">${got ? p.ico : '🔒'}</span><div style="flex:1"><b class="${got ? 'gold' : 'cyan'}">${E(p.n)}</b><br><small class="muted">${E(p.d)}</small></div><div>${got ? '<b class="green">✔ Activo</b>' : next ? '<small class="amber">Siguiente</small>' : ''}</div></div></div>`; }).join('');
  h.innerHTML = `<div class="panel-title">🎁 Programa Embajador</div>
  <p class="muted" style="font-size:16px">Compartí el juego y tu club recibe una <b>ventaja permanente</b>. Cada día que compartís desbloqueás la siguiente. Sin dinero: son mejoras que valen la pena.</p>
  <div class="offer"><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-p" onclick="EMB.share('juego')">📲 Compartir juego</button><button class="btn" onclick="EMB.share('porta')">🌐 Compartir portafolio</button><button class="btn" onclick="EMB.copyLink()">📋 Copiar mensaje</button></div>
   <div class="muted" style="font-size:14px;margin-top:8px">Ventajas activas en <b class="cyan">${E(nom)}</b>: <b class="green">${act}/${PERKS.length}</b> · Amigos que entraron con tu enlace: <b class="green">${inv}</b>${remote.ok ? '' : ' <small>(se actualiza con internet)</small>'}<br><b class="amber">⚠ Las ventajas son solo de este club: si cambiás de club se pierden.</b>${s.from ? '<br>Te invitó el código <b>' + E(s.from) + '</b> · recibiste insignia y Plan del Embajador.' : ''}</div></div>
  ${rows}
  <p class="muted" style="font-size:14px">Contamos 1 compartida por canal y por día. Cada amigo que entre desde tu enlace también te da una ventaja.</p>`;
}
function badge() { return has('badge'); }

root.EMB = { onLoad, chrome, onSwitch, render, share, copyLink, has, mult, canteraBonus, badge, link, PERKS };
})(window);
