// Stonks accounts and the When Lambo leaderboard.
// Accounts live in a Google Sheet (one row each), so there is no account limit. The owner approves the Sheets permission once;
// visitors never see a permission screen. Passwords are salted and hashed, tokens are hashed, nothing readable is stored.
const P = PropertiesService.getScriptProperties();
const NAME_RE = /^[a-z0-9_]{3,16}$/;
const MAX_SAVE = 30000, ITER = 300, LB_KEEP = 100;

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function hex_(b) { return b.map(x => ((x < 0 ? x + 256 : x)).toString(16).padStart(2, '0')).join(''); }
function sha_(s) { return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)); }
function slow_(salt, pw) { let h = salt + ':' + pw; for (let i = 0; i < ITER; i++) h = sha_(h + salt); return h; }
function rand_(n) { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, n); }
// run this once from the Apps Script editor: it makes the spreadsheet and approves the permission
function setup() {
  if (P.getProperty('ssid')) return 'already set up';
  const ss = SpreadsheetApp.create('Stonks accounts'); ss.getSheets()[0].setName('a');
  P.setProperty('ssid', ss.getId());
  return ss.getUrl();
}
function sh_() { const id = P.getProperty('ssid'); if (!id) throw new Error('run setup first'); return SpreadsheetApp.openById(id).getSheetByName('a'); }
function rowOf_(u) {
  const sh = sh_(), c = CacheService.getScriptCache(), hit = Number(c.get('r:' + u) || 0);
  if (hit && sh.getRange(hit, 1).getValue() === u) return hit;
  const f = sh.getRange('A:A').createTextFinder(u).matchEntireCell(true).findNext();
  if (!f) return 0; c.put('r:' + u, String(f.getRow()), 21600); return f.getRow();
}
function getAcct_(u) { const r = rowOf_(u); return r ? JSON.parse(sh_().getRange(r, 2).getValue()) : null; }
function putAcct_(u, a) { const r = rowOf_(u), j = JSON.stringify(a); if (r) sh_().getRange(r, 2).setValue(j); else sh_().appendRow([u, j]); }
function delAcct_(u) { const r = rowOf_(u); if (r) { sh_().deleteRow(r); CacheService.getScriptCache().remove('r:' + u); } }
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
const weekKey_ = t => Math.floor((t / 864e5 + 3) / 7);                   // weeks start Monday 00:00 UTC
const weekEnd_ = k => ((k * 7 - 3) + 7) * 864e5;
function lw_() { const v = P.getProperty('lw'); return v ? JSON.parse(v) : []; }
function setRow_(u, nw, tn, wg) {
  const l = lb_().filter(r => r[0] !== u);
  l.push([u, Math.round(nw * 100) / 100, tn, Date.now()]);
  l.sort((x, y) => y[1] - x[1]);
  P.setProperty('lb', JSON.stringify(l.slice(0, LB_KEEP)));
  const w = lw_().filter(r => r[0] !== u);
  w.push([u, Math.round((wg || 0) * 10000) / 10000, Math.round(nw * 100) / 100, Date.now()]);
  w.sort((x, y) => y[1] - x[1]);
  P.setProperty('lw', JSON.stringify(w.filter(r => weekKey_(r[3]) === weekKey_(Date.now())).slice(0, LB_KEEP)));
}
// the week's gain: a new week starts from the last value known before it
function weekGain_(a, nw) { const wk = weekKey_(Date.now()); if (a.wk !== wk) { a.wk = wk; a.w0 = a.nw || START_; } return a.w0 > 0 ? nw / a.w0 - 1 : 0; }
function newToken_(a) { const t = rand_(32); a.tk = [sha_(t)].concat(a.tk || []).slice(0, 4); return t; }

function handle_(o) {
  const op = String(o.op || '');
  if (op === 'board') return { ok: true, board: lb_().slice(0, 50), week: lw_().slice(0, 50), wkEnd: weekEnd_(weekKey_(Date.now())) };
  if (op === 'peek') {
    const names = (Array.isArray(o.names) ? o.names : []).slice(0, 30).map(x => String(x || '').toLowerCase()).filter(x => NAME_RE.test(x)), out = [];
    const inLb = {}; lb_().forEach(r => { inLb[r[0]] = r; }); const inLw = {}; lw_().forEach(r => { inLw[r[0]] = r; });
    names.forEach(n => { if (inLb[n]) out.push([n, inLb[n][1], inLb[n][2], inLw[n] ? inLw[n][1] : 0]); else { const a = getAcct_(n); if (a) out.push([n, a.nw || START_, a.tn || 0, a.wk === weekKey_(Date.now()) && a.w0 > 0 ? (a.nw / a.w0 - 1) : 0]); } });
    return { ok: true, people: out };
  }
  const u = String(o.u || '').toLowerCase();
  if (!NAME_RE.test(u)) return { error: 'name' };
  if (op === 'signup') {
    const p = String(o.p || ''); if (p.length < 6 || p.length > 64) return { error: 'password' };
    return withLock_(() => {
      if (getAcct_(u)) return { error: 'taken' };
      const salt = rand_(16), code = rand_(12), rs = rand_(16);
      const a = { s: salt, h: slow_(salt, p), rs: rs, rh: slow_(rs, code), tk: [], nw: START_, tn: 0, ts: Date.now(), sv: '', wk: weekKey_(Date.now()), w0: START_ };
      const t = newToken_(a);
      const nw = num_(o.nw, 0, 1e9); if (nw !== null) { a.nw = nw; a.tn = num_(o.tn, 0, 1e7) || 0; }
      if (typeof o.sv === 'string' && o.sv.length <= MAX_SAVE) a.sv = o.sv;
      putAcct_(u, a); setRow_(u, a.nw, a.tn, a.w0 > 0 ? a.nw / a.w0 - 1 : 0);
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
      const wg = weekGain_(a, nw); a.nw = nw; a.tn = Math.floor(tn); a.ts = Date.now();
      if (typeof o.sv === 'string') a.sv = o.sv.length <= MAX_SAVE ? o.sv : a.sv;
      putAcct_(u, a); setRow_(u, nw, a.tn, wg);
      return { ok: true };
    });
  }
  if (op === 'manip') {
    const tk = String(o.tk || ''), dir = Number(o.dir) > 0 ? 1 : -1, lv = Math.floor(Number(o.lv));
    if (!/^[A-Z0-9]{2,5}$/.test(tk) || !(lv >= 6 && lv <= 40)) return { error: 'bad' };
    return withLock_(() => {
      const a = authed_(u, o.t); if (!a) return { error: 'auth' };
      const now = Date.now(); if (a.mc && now - a.mc < 6 * 3600e3) return { error: 'cooldown', next: a.mc + 6 * 3600e3 };
      let q = []; try { q = JSON.parse(P.getProperty('mq') || '[]'); } catch (e) { }
      q = q.filter(x => now - x[1] < 24 * 3600e3); q.push([rand_(8), now, tk, dir, lv]); P.setProperty('mq', JSON.stringify(q.slice(-60)));
      a.mc = now; putAcct_(u, a); return { ok: true, next: now + 6 * 3600e3 };
    });
  }
  if (op === 'load') { const a = authed_(u, o.t); return a ? { ok: true, sv: a.sv || '' } : { error: 'auth' }; }
  if (op === 'logout') { return withLock_(() => { const a = authed_(u, o.t); if (a) { const h = sha_(o.t); a.tk = a.tk.filter(x => x !== h); putAcct_(u, a); } return { ok: true }; }); }
  if (op === 'delete') {
    return withLock_(() => {
      const a = authed_(u, o.t); if (!a) return { error: 'auth' };
      delAcct_(u);
      P.setProperty('lb', JSON.stringify(lb_().filter(r => r[0] !== u))); P.setProperty('lw', JSON.stringify(lw_().filter(r => r[0] !== u)));
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
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.manip) { let q = []; try { q = JSON.parse(P.getProperty('mq') || '[]'); } catch (x) { } return out_({ ok: true, q: q }); }
  return out_(p.board ? { ok: true, board: lb_().slice(0, 50), week: lw_().slice(0, 50), wkEnd: weekEnd_(weekKey_(Date.now())) } : { ok: true, game: 'stonks' });
}
