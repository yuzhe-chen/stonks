// Stonks accounts and the Wen Lambo leaderboard.
// No Google permissions at all: data lives in script properties, nothing here needs a scope.
// Passwords are salted and hashed, tokens are hashed, nothing readable is stored.
const P = PropertiesService.getScriptProperties();
const NAME_RE = /^[a-z0-9_]{3,16}$/;
const MAX_ACCOUNTS = 400, MAX_SAVE = 3200, ITER = 300, LB_KEEP = 100;

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function hex_(b) { return b.map(x => ((x < 0 ? x + 256 : x)).toString(16).padStart(2, '0')).join(''); }
function sha_(s) { return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)); }
function slow_(salt, pw) { let h = salt + ':' + pw; for (let i = 0; i < ITER; i++) h = sha_(h + salt); return h; }
function rand_(n) { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, n); }
function getAcct_(u) { const v = P.getProperty('a:' + u); return v ? JSON.parse(v) : null; }
function putAcct_(u, a) { P.setProperty('a:' + u, JSON.stringify(a)); }
function lb_() { const v = P.getProperty('lb'); return v ? JSON.parse(v) : []; }
function withLock_(f) { const l = LockService.getScriptLock(); l.waitLock(15000); try { return f(); } finally { l.releaseLock(); } }
function num_(x, lo, hi) { x = Number(x); return isFinite(x) && x >= lo && x <= hi ? x : null; }

// slow down guessing: 8 wrong tries per name per 15 minutes
function tooMany_(u) { return Number(CacheService.getScriptCache().get('f:' + u) || 0) >= 8; }
function miss_(u) { const c = CacheService.getScriptCache(), n = Number(c.get('f:' + u) || 0) + 1; c.put('f:' + u, String(n), 900); }

function authed_(u, t) {
  const a = getAcct_(u); if (!a || typeof t !== 'string' || t.length < 10) return null;
  return a.tk.indexOf(sha_(t)) >= 0 ? a : null;
}
function setRow_(u, nw, tn) {
  const l = lb_().filter(r => r[0] !== u);
  l.push([u, Math.round(nw * 100) / 100, tn, Date.now()]);
  l.sort((x, y) => y[1] - x[1]);
  P.setProperty('lb', JSON.stringify(l.slice(0, LB_KEEP)));
}
function newToken_(a) { const t = rand_(32); a.tk = [sha_(t)].concat(a.tk || []).slice(0, 4); return t; }

function handle_(o) {
  const op = String(o.op || '');
  if (op === 'board') return { ok: true, board: lb_().slice(0, 50) };
  const u = String(o.u || '').toLowerCase();
  if (!NAME_RE.test(u)) return { error: 'name' };
  if (op === 'signup') {
    const p = String(o.p || ''); if (p.length < 6 || p.length > 64) return { error: 'password' };
    return withLock_(() => {
      if (getAcct_(u)) return { error: 'taken' };
      const n = Number(P.getProperty('n') || 0); if (n >= MAX_ACCOUNTS) return { error: 'full' };
      const salt = rand_(16), code = rand_(12), rs = rand_(16);
      const a = { s: salt, h: slow_(salt, p), rs: rs, rh: slow_(rs, code), tk: [], nw: START_, tn: 0, ts: Date.now(), sv: '' };
      const t = newToken_(a);
      const nw = num_(o.nw, 0, 1e9); if (nw !== null) { a.nw = nw; a.tn = num_(o.tn, 0, 1e7) || 0; }
      if (typeof o.sv === 'string' && o.sv.length <= MAX_SAVE) a.sv = o.sv;
      try { putAcct_(u, a); P.setProperty('n', String(n + 1)); setRow_(u, a.nw, a.tn); } catch (e) { return { error: 'full' }; }
      return { ok: true, token: t, code: code };
    });
  }
  if (op === 'login') {
    if (tooMany_(u)) return { error: 'slow' };
    const a = getAcct_(u); const p = String(o.p || '');
    if (!a || slow_(a.s, p) !== a.h) { miss_(u); return { error: 'wrong' }; }
    return withLock_(() => { const b = getAcct_(u); const t = newToken_(b); putAcct_(u, b); return { ok: true, token: t, sv: b.sv || '' }; });
  }
  if (op === 'recover') {
    if (tooMany_(u)) return { error: 'slow' };
    const a = getAcct_(u), code = String(o.code || ''), p = String(o.p || '');
    if (p.length < 6 || p.length > 64) return { error: 'password' };
    if (!a || slow_(a.rs, code) !== a.rh) { miss_(u); return { error: 'wrong' }; }
    return withLock_(() => { const b = getAcct_(u); b.s = rand_(16); b.h = slow_(b.s, p); b.tk = []; const t = newToken_(b); putAcct_(u, b); return { ok: true, token: t, sv: b.sv || '' }; });
  }
  if (op === 'save') {
    if (!authed_(u, o.t)) return { error: 'auth' };
    const nw = num_(o.nw, 0, 1e9), tn = num_(o.tn, 0, 1e7); if (nw === null || tn === null) return { error: 'bad' };
    return withLock_(() => {
      const a = authed_(u, o.t); if (!a) return { error: 'auth' };
      a.nw = nw; a.tn = Math.floor(tn); a.ts = Date.now();
      if (typeof o.sv === 'string') a.sv = o.sv.length <= MAX_SAVE ? o.sv : a.sv;
      try { putAcct_(u, a); setRow_(u, nw, a.tn); } catch (e) { return { error: 'full' }; }
      return { ok: true };
    });
  }
  if (op === 'load') { const a = authed_(u, o.t); return a ? { ok: true, sv: a.sv || '' } : { error: 'auth' }; }
  if (op === 'logout') { return withLock_(() => { const a = authed_(u, o.t); if (a) { const h = sha_(o.t); a.tk = a.tk.filter(x => x !== h); putAcct_(u, a); } return { ok: true }; }); }
  if (op === 'delete') {
    return withLock_(() => {
      const a = authed_(u, o.t); if (!a) return { error: 'auth' };
      P.deleteProperty('a:' + u); P.setProperty('n', String(Math.max(0, Number(P.getProperty('n') || 1) - 1)));
      P.setProperty('lb', JSON.stringify(lb_().filter(r => r[0] !== u)));
      return { ok: true };
    });
  }
  return { error: 'op' };
}
const START_ = 10000;

function doPost(e) {
  let o; try { o = JSON.parse(e.postData.contents); } catch (x) { return out_({ error: 'bad' }); }
  try { return out_(handle_(o)); } catch (x) { return out_({ error: 'server' }); }
}
function doGet(e) { return out_(e && e.parameter && e.parameter.board ? { ok: true, board: lb_().slice(0, 50) } : { ok: true, game: 'stonks' }); }
