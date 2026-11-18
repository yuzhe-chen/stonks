// Stonks. No build step, no dependencies. Data comes from the data branch of the repo (see scripts/tick.mjs).
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const REPO = 'yuzhe-chen/stonks';
const LIVE = LOCAL ? ['/data/'] : [`https://raw.githubusercontent.com/${REPO}/data/`, `https://cdn.jsdelivr.net/gh/${REPO}@data/`];
const COLD = LIVE;                                  // the CDN keeps branch files for 12 hours, so it is only the fallback
const API = 'https://script.google.com/macros/s/AKfycbxYXFH6l7MikjO7xmTkDmKI95gPTzgykEAP8duVJvC9BEqBT5yaw5fhJU27R3Kl5a73/exec';   // accounts and the leaderboard (Apps Script, no Google permissions)
const START = 10000, TIP_COST = 40, LAWYER = 60, BAIL = 150;

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (x, d = 2) => (x < 0 ? '-' : '') + '$' + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const num = (x, d = 2) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = x => (x >= 0 ? '+' : '-') + Math.abs(x * 100).toFixed(2) + '%';
const arrow = x => x >= 0 ? '▲' : '▼';
const cls = x => x >= 0 ? 'up' : 'down';
const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
function ago(t) { const s = Math.max(0, (Date.now() - t) / 1000); if (s < 60) return 'now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; }
function countdown(ms) { if (ms <= 0) return 'now'; const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + 'h ' : '') + (h || m ? String(m).padStart(h ? 2 : 1, '0') + 'm ' : '') + String(x).padStart(2, '0') + 's'; }

/* ---------- save ---------- */
const KEY = 'stonks.v1';
const NAMES = ['Probably', 'Definitely', 'Mostly', 'Allegedly', 'Totally', 'Barely', 'Suspiciously', 'Confidently'], NAMES2 = ['Fine', 'Stonks', 'Solvent', 'Legal', 'Rich', 'Sorry', 'Liquid', 'Hodling'];
function fresh() {
  const rid = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join('');
  return { id: rid, name: NAMES[Math.random() * 8 | 0] + NAMES2[Math.random() * 8 | 0] + (10 + Math.random() * 89 | 0), cash: START, dep: START, pos: {}, trades: [], tendies: 0,
    claimed: {}, brrr: {}, badges: {}, read: {}, tips: {}, notify: false, seen: 0, last: null, peak: START, fines: 0, sells: {}, theme: 'dark', opts: [], optLog: [], jailUntil: 0, donated: 0, lawyers: 0 };
}
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = fresh(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } queueSync(); };

/* ---------- data ---------- */
let W = null, M = null, E = null, base24 = {}, co = {}, secName = {}, idxs = {}, histCache = {};
async function getJSON(bases, f) {
  for (const b of bases) { try { const r = await fetch(b + f + '?m=' + (Date.now() / 60000 | 0), { cache: 'no-store' }); if (r.ok) return await r.json(); } catch (e) { } }
  return null;
}
let anchors = {}, ease = {};   // anchors: latest published price per ticker; ease: moving from the old one to the new one
async function loadLive() {
  const [m, e] = await Promise.all([getJSON(LIVE, 'market.json'), getJSON(LIVE, 'events.json')]);
  if (m && (!M || m.t !== M.t)) {
    const was = {}; if (M) for (const t in anchors) was[t] = shown(t, true);       // what was on screen, so the new price eases in from it
    M = m; anchors = {};
    const i = Math.max(0, M.ts.findIndex(x => x >= M.t - 24 * 3600e3));
    for (const t in M.c) { const a = M.c[t]; anchors[t] = a[a.length - 1] / 100; base24[t] = a[i] / 100; ease[t] = { from: was[t] !== undefined ? was[t] : anchors[t], at: Date.now() }; }
  }
  if (e) { const first = !E; E = e; if (!first) maybeNotify(); }
}
async function loadWorld() { W = await getJSON(COLD, 'world.json'); if (W) { W.companies.forEach(c => { co[c.t] = c; }); W.indices.forEach(i => { co[i.t] = i; idxs[i.t] = i; }); W.sectors.forEach(s => { secName[s.id] = s.name; }); secName.index = 'Index funds'; } }

/* the price on screen: the published one, eased in over 20 seconds, plus a little noise every second (noise is part of the price, a trade fills at what you see) */
function shown(t, noNoise) {
  const a = anchors[t]; if (a === undefined) return 0;
  const e = ease[t]; let p = a;
  if (e) { const k = Math.min(1, (Date.now() - e.at) / 20000); p = e.from + (a - e.from) * (1 - Math.pow(1 - k, 3)); }
  if (noNoise) return p;
  const sec = Date.now() / 1000 | 0, v = (co[t] && co[t].v) || 2;
  const n = ((hash(t + ':' + sec) % 2001) - 1000) / 1000, n2 = ((hash(t + ':' + (sec - 1)) % 2001) - 1000) / 1000;
  const frac = (Date.now() % 1000) / 1000;
  return p * (1 + 0.0004 * v * (n2 + (n - n2) * frac));
}
const chg24 = t => { const b = base24[t]; return b ? shown(t) / b - 1 : 0; };

/* ---------- options: a call is the right to buy 100 shares at the strike, a put the right to sell, until the expiry ---------- */
const erf = x => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
const Ncdf = x => 0.5 * (1 + erf(x / Math.SQRT2));
const sigmaOf = t => ((co[t] && co[t].v) || 3) / 100 * 1.6;             // daily swing, a bit more for the news
function bs(S0, K, days, sig, call) {
  if (days <= 0) return Math.max(0, call ? S0 - K : K - S0);
  const v = sig * Math.sqrt(days), d1 = (Math.log(S0 / K) + 0.5 * v * v) / v, d2 = d1 - v;
  return call ? S0 * Ncdf(d1) - K * Ncdf(d2) : K * Ncdf(-d2) - S0 * Ncdf(-d1);
}
const optMark = o => bs(shown(o.tk), o.K, Math.max(0, o.exp - Date.now()) / 86400e3, sigmaOf(o.tk), o.call) * 100 * o.qty;
const optsValue = () => (S.opts || []).reduce((a, o) => a + optMark(o), 0);
const inJail = () => Date.now() < (S.jailUntil || 0);
function priceAt(t, at) { if (!M || !M.c[t]) return shown(t); const i = M.ts.findIndex(x => x >= at); return i < 0 ? shown(t, true) : M.c[t][i] / 100; }
function settleOptions() {
  let changed = false;
  for (const o of (S.opts || []).slice()) {
    if (Date.now() < o.exp) continue;
    const P = priceAt(o.tk, o.exp), pay = Math.max(0, o.call ? P - o.K : o.K - P) * 100 * o.qty;
    S.cash += pay; S.opts = S.opts.filter(x => x.id !== o.id);
    S.optLog = [{ tk: o.tk, call: o.call, K: o.K, qty: o.qty, paid: o.paid, pay, at: o.exp }].concat(S.optLog || []).slice(0, 10);
    changed = true;
  }
  // debt: deep enough and the court takes everything it can reach
  if (S.cash < -2000 && !inJail()) {
    let debt = -S.cash;
    for (const t of held().sort((a, b) => S.pos[b].sh * shown(b) - S.pos[a].sh * shown(a))) { if (debt <= 0) break; const v = S.pos[t].sh * shown(t); debt -= v; delete S.pos[t]; }
    S.cash = 0; S.opts = []; S.jailUntil = Date.now() + 24 * 3600e3; give('jail'); changed = true;
  }
  if (changed) { award(); save(); }
  return changed;
}
function donate() {
  if (netWorth() >= 25 || Date.now() - (S.donated || 0) < 3600e3) return false;
  S.cash += 100; S.donated = Date.now(); save(); return true;
}
const broke = () => M && netWorth() < 500 && !(S.opts || []).length;

/* ---------- portfolio math ---------- */
const held = () => Object.keys(S.pos).filter(t => S.pos[t].sh > 1e-9);
const posValue = () => held().reduce((a, t) => a + S.pos[t].sh * shown(t), 0);
const netWorth = () => S.cash + posValue() + optsValue();
const ret = () => netWorth() / S.dep - 1;
function ladder(r) {
  if (r < -0.25) return ['Rekt', 'down'];
  if (r < -0.005) return ['Not Stonks', 'down'];
  if (r < 0.03) return ['Stonks', ''];
  if (r < 0.15) return ['Big Stonks', 'up'];
  if (r < 0.5) return ['Big Big Stonks', 'up'];
  return ['Big Big Big Stonks', 'up'];
}
const TITLES = ['Paper Hands', 'Group Chat Lurker', 'Probably Fine', 'Hot Take Specialist', 'Chart Astrologer', 'Gigabrain', 'Big Big Brain', 'Wen Lambo Owner'];
const level = () => Math.floor(Math.sqrt(S.tendies / 20));
const title = () => TITLES[Math.min(level(), TITLES.length - 1)];

/* ---------- trading ---------- */
function trade(t, side, dollars, all) {
  if (inJail()) return 'You are in jail. Trading is not allowed.';
  const px = shown(t); if (!px || !(dollars > 0)) return 'Enter an amount.';
  if (side === 'buy') {
    if (dollars > S.cash + 0.005) return 'Not enough cash.';
    dollars = Math.min(dollars, S.cash);
    const sh = dollars / px, p = S.pos[t] || (S.pos[t] = { sh: 0, cost: 0 });
    p.sh += sh; p.cost += dollars; S.cash -= dollars;
    S.trades.push({ t: Date.now(), tk: t, side, sh, px, chg: chg24(t) });
  } else {
    const p = S.pos[t]; if (!p || p.sh < 1e-9) return 'You do not own any.';
    const val = p.sh * px, d = all ? val : Math.min(dollars, val), sh = d / px, frac = sh / p.sh, basis = p.cost * frac;
    p.sh -= sh; p.cost -= basis; S.cash += d;
    if (p.sh < 1e-9) delete S.pos[t];
    S.trades.push({ t: Date.now(), tk: t, side, sh, px, chg: chg24(t) });
    const day = new Date().toISOString().slice(0, 10), g = d / basis - 1;
    if (g >= 0.05 && (S.sells[day] || 0) < 3) { S.sells[day] = (S.sells[day] || 0) + 1; S.tendies += 10; }
  }
  S.trades = S.trades.slice(-400);
  award(); save(); submitBoard();
  return '';
}
function holdingAt(t, at) { let sh = 0; for (const x of S.trades) { if (x.t > at) break; if (x.tk === t) sh += x.side === 'buy' ? x.sh : -x.sh; } return sh; }

/* ---------- badges, quests ---------- */
const BADGES = { jail: ['Jailbird', 'shame'], rekt: ['Rekt', 'shame'], bigbig: ['Big Big Stonks', 'on'], diamond: ['Diamond Hanz', 'on'], brrr3: ['Brrr Believer', 'on'], basket: ['Basket Case', 'on'], martha: ['Martha', 'shame'], tipster: ['Insider', 'on'] };
function give(k) { if (!S.badges[k]) { S.badges[k] = Date.now(); S.tendies += 30; return true; } return false; }
function award() {
  const r = ret();
  if (r <= -0.25) give('rekt'); if (r >= 0.15) give('bigbig');
  if (Object.keys(S.brrr).length >= 3) give('brrr3');
  if (new Set(held().map(t => (co[t] || {}).s)).size >= 8) give('basket');
  if (E) for (const ev of E.events) {
    const age = Date.now() - ev.t; if (age < 2 * 3600e3 || age > 72 * 3600e3) continue;
    for (const [tk, v] of Object.entries(ev.cos || {})) if (v <= -8 && holdingAt(tk, ev.t) > 1e-6 && S.pos[tk]) give('diamond');
  }
  S.peak = Math.max(S.peak, netWorth());
}
const today = () => new Date().toISOString().slice(0, 10);
function quests() {
  const d = today(), sectors = new Set(held().map(t => (co[t] || {}).s));
  const dip = S.trades.some(x => x.side === 'buy' && x.chg <= -0.02 && new Date(x.t).toISOString().slice(0, 10) === d);
  const rd = S.read[d] || 0;
  return [
    { id: 'dip', t: 'Buy da Dip', d: 'Buy a stock that is down 2% or more over the last day.', ok: dip, p: dip ? 'Done' : 'Not yet', r: 25, pr: dip ? 1 : 0 },
    { id: 'bags', t: 'Spread the Bags', d: 'Hold shares in 4 different sectors at once.', ok: sectors.size >= 4, p: sectors.size + ' of 4 sectors', r: 25, pr: Math.min(1, sectors.size / 4) },
    { id: 'read', t: 'Read the Room', d: 'Open 3 headlines in the feed.', ok: rd >= 3, p: Math.min(rd, 3) + ' of 3', r: 15, pr: Math.min(1, rd / 3) },
  ].map(q => (q.claimed = !!S.claimed[d + ':' + q.id], q));
}

/* ---------- notifications and tab title ---------- */
function maybeNotify() {
  if (!S.notify || !E || !('Notification' in window) || Notification.permission !== 'granted') return;
  const fresh = E.events.filter(e => e.t > (S.seenEv || 0));
  S.seenEv = Math.max(S.seenEv || 0, ...E.events.map(e => e.t)); save();
  if (!document.hidden) return;
  const hs = held(); if (!hs.length) return;
  for (const ev of fresh.slice(0, 3)) {
    const hit = hs.filter(t => (ev.cos && ev.cos[t] !== undefined) || (ev.fx && co[t] && ev.fx[co[t].s] !== undefined) || (idxs[t] && Object.keys(ev.fx || {}).length > 1));
    if (hit.length) { try { new Notification(ev.head, { body: 'You hold ' + hit.slice(0, 3).join(', ') }); } catch (e) { } break; }
  }
}
function updateTitle() { const r = ret(), l = ladder(r); document.title = `${l[0].toUpperCase()} ${pct(r)} | Stonks`; }

/* ---------- accounts, cloud save and the leaderboard (a small Apps Script backend) ---------- */
async function api(body) {
  try { const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify(body) }); return await r.json(); }
  catch (e) { return { error: 'net' }; }
}
const SYNC_KEYS = ['cash', 'dep', 'pos', 'tendies', 'claimed', 'brrr', 'badges', 'read', 'tips', 'sells', 'peak', 'fines', 'opts', 'optLog', 'jailUntil', 'donated', 'lawyers', 'lists', 'sorts'];
const b64 = u8 => btoa(String.fromCharCode(...u8)), unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
async function packSave() {
  const o = {}; SYNC_KEYS.forEach(k => { o[k] = S[k]; });
  const j = JSON.stringify(o);
  try { const st = new Blob([j]).stream().pipeThrough(new CompressionStream('gzip')); return 'z:' + b64(new Uint8Array(await new Response(st).arrayBuffer())); } catch (e) { return 'j:' + j; }
}
async function unpackSave(sv) {
  if (!sv || sv.length < 3) return null;
  try {
    if (sv.startsWith('z:')) { const st = new Blob([unb64(sv.slice(2))]).stream().pipeThrough(new DecompressionStream('gzip')); return JSON.parse(await new Response(st).text()); }
    return JSON.parse(sv.slice(2));
  } catch (e) { return null; }
}
function applySave(o) { if (!o || typeof o !== 'object') return; SYNC_KEYS.forEach(k => { if (o[k] !== undefined) S[k] = o[k]; }); }
let syncT = 0, syncAt = 0;
function queueSync() { if (!S.acct || syncT) return; syncT = setTimeout(() => { syncT = 0; syncNow(); }, 20000); }
async function syncNow() {
  if (!S.acct || !M) return;
  clearTimeout(syncT); syncT = 0; syncAt = Date.now();
  const nw = Math.max(0, Math.round(netWorth() * 100) / 100);
  const r = await api({ op: 'save', u: S.acct.u, t: S.acct.t, nw, tn: S.tendies, sv: await packSave() });
  if (r && r.error === 'auth') { S.acct = null; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } renderMe(); }
}
const submitBoard = queueSync;
let accMode = 'in', accMsg = '', lastCode = '';
async function accountAction(kind) {
  const u = ($('#au') && $('#au').value || '').trim().toLowerCase(), p = $('#ap') ? $('#ap').value : '';
  const say = m => { accMsg = m; const e = $('#accmsg'); if (e) e.textContent = m; };
  if (!/^[a-z0-9_]{3,16}$/.test(u)) return say('Usernames are 3 to 16 letters, numbers or underscores.');
  if (p.length < 6) return say('Passwords need at least 6 characters.');
  say('Working on it...');
  let r;
  if (kind === 'up') {
    r = await api({ op: 'signup', u, p, nw: Math.max(0, netWorth()), tn: S.tendies, sv: await packSave() });
    if (r.ok) { S.acct = { u, t: r.token }; S.name = u; lastCode = r.code; save(); }
  } else if (kind === 'in') {
    r = await api({ op: 'login', u, p });
    if (r.ok) { S.acct = { u, t: r.token }; S.name = u; applySave(await unpackSave(r.sv)); lastCode = ''; save(); }
  } else if (kind === 'rec') {
    const code = ($('#ac') && $('#ac').value || '').trim();
    r = await api({ op: 'recover', u, code, p });
    if (r.ok) { S.acct = { u, t: r.token }; S.name = u; applySave(await unpackSave(r.sv)); lastCode = ''; save(); }
  }
  const errs = { taken: 'That username is taken.', wrong: 'Wrong username, password or code.', slow: 'Too many tries. Wait a few minutes.', full: 'The game is full for now.', net: 'Could not reach the server.', password: 'Passwords need 6 to 64 characters.', name: 'Pick a different username.' };
  if (!r.ok) return say(errs[r.error] || 'Something went wrong.');
  accMsg = ''; accMode = 'in'; renderMe(); if (!$('#settings').hidden) openSettings(); render();
}
async function signOut() { const a = S.acct; S.acct = null; lastCode = ''; save(); if (a) api({ op: 'logout', u: a.u, t: a.t }); openSettings(); renderMe(); }
async function deleteAccount() { const a = S.acct; if (!a) return; const r = await api({ op: 'delete', u: a.u, t: a.t }); if (r.ok) { S.acct = null; lastCode = ''; save(); openSettings(); renderMe(); } else { accMsg = 'Could not delete. Try again.'; openSettings(); } }
async function loadBoard() { const r = await api({ op: 'board' }); return r && r.ok ? r.board.map(x => ({ u: x[0], nw: x[1], tn: x[2] })) : null; }

/* ---------- charts ---------- */
const RANGES = [['1D', null], ['1W', 'w'], ['1M', 'm'], ['1Y', 'd'], ['All', 'd']];
function series(t, range) {
  if (range === '1D') { const a = M.c[t]; return M.ts.map((x, i) => [x, a[i] / 100]); }
  const sid = (co[t] || {}).s, h = histCache[sid]; if (!h) return null;
  const k = range === '1W' ? 'w' : range === '1M' ? 'm' : 'd', ts = h[k].ts, a = h[k].c[t] || [];
  let from = 0; if (range === '1Y') from = Math.max(0, ts.length - 365);
  const out = []; for (let i = from; i < ts.length; i++) out.push([ts[i], a[i] / 100]);
  return out;
}
async function ensureHist(t) { const sid = (co[t] || {}).s; if (!sid || histCache[sid]) return; const h = await getJSON(COLD, 'hist-' + sid + '.json'); if (h) histCache[sid] = h; }
function sparkSVG(pts, up) {
  if (!pts || pts.length < 2) return '';
  const v = pts.map(p => p[1]), lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1;
  const d = pts.map((p, i) => (i ? 'L' : 'M') + (i / (pts.length - 1) * 96).toFixed(1) + ' ' + (26 - (p[1] - lo) / r * 24 - 1).toFixed(1)).join('');
  return `<svg class="sp" viewBox="0 0 96 28" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${up ? 'var(--up)' : 'var(--down)'}" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}
function chartSVG(pts) {
  const v = pts.map(p => p[1]), lo = Math.min(...v), hi = Math.max(...v), r = hi - lo || 1, up = v[v.length - 1] >= v[0];
  const X = i => i / (pts.length - 1) * 600, Y = y => 228 - (y - lo) / r * 214;
  const d = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
  return `<svg class="chart" id="chart" viewBox="0 0 600 240" preserveAspectRatio="none"><line id="vl" x1="0" x2="0" y1="0" y2="240" stroke="var(--gray)" stroke-width="1" vector-effect="non-scaling-stroke" visibility="hidden"/><line x1="0" x2="600" y1="${Y(v[0]).toFixed(1)}" y2="${Y(v[0]).toFixed(1)}" stroke="var(--line)" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="${up ? 'var(--up)' : 'var(--down)'}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

/* ---------- views ---------- */
const ORDER_MS = 2500;
let pending = false;
function holdOrder(msgEl, sel) { pending = true; msgEl.className = 'msg'; msgEl.innerHTML = '<span class="prog"><i></i></span>Placing order...'; document.querySelectorAll(sel).forEach(x => { x.disabled = true; }); }
let mode = 'buy', route = 'feed', arg = '', rangeSel = '1D', search = '', sortBy = 'move', hoverPts = null;
const main = $('#main');
function setRoute() {
  const h = location.hash.replace(/^#/, '') || 'feed', p = h.split('/');
  route = p[0]; arg = decodeURIComponent(p[1] || '');
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.v === (route === 'co' ? 'market' : route)));
  render(); window.scrollTo(0, 0);
}
function chips(ev) {
  const out = [];
  Object.entries(ev.fx || {}).filter(([, v]) => Math.abs(v) >= 0.5).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, ev.kind === 'real' && ev.sec === 'market' ? 4 : 6)
    .forEach(([s, v]) => out.push(`<a class="chip ${cls(v)}" href="#market/${s}">${esc(secName[s] || s)} ${arrow(v)} ${Math.abs(v).toFixed(1)}%</a>`));
  Object.entries(ev.cos || {}).forEach(([t, v]) => out.push(`<a class="chip ${cls(v)}" href="#co/${t}">${t} ${arrow(v)} ${Math.abs(v).toFixed(1)}%</a>`));
  return out.join('');
}
function evHTML(ev) {
  const tag = ev.kind === 'real' ? 'Real news' : ev.kind === 'wild' ? 'Wild' : ev.kind === 'brrr' ? 'Brrr' : ev.label || 'Scheduled';
  const brrrOK = ev.kind === 'brrr' && !S.brrr[ev.id] && Date.now() - ev.t < 24 * 3600e3;
  return `<div class="ev${ev.url && /^https?:\/\//.test(ev.url) ? ' link' : ''}" data-id="${esc(ev.id)}" ${ev.url && /^https?:\/\//.test(ev.url) ? `data-url="${esc(ev.url)}"` : ev.kind !== 'real' ? `data-nosrc="${esc(ev.id)}"` : ''}><div class="tm">${ago(ev.t)}<span class="tag ${ev.kind === 'brrr' ? 'up' : ''}">${esc(tag)}</span></div>
    <div><div class="hd">${esc(ev.head)}</div><div class="dk">${esc(ev.dek || '')}</div>
    <div class="chips">${chips(ev)}</div>
    ${brrrOK ? `<div class="chips"><button class="go" data-brrr="${esc(ev.id)}" data-amt="${ev.amt}">Claim ${money(ev.amt, 0)}</button></div>` : ev.kind === 'brrr' && S.brrr[ev.id] ? '<div class="dk">Claimed.</div>' : ''}
    </div></div>`;
}
function awayHTML() {
  if (!S.last || !held().length) return '';
  const away = Date.now() - S.last.t; if (away < 10 * 60e3) return '';
  const d = netWorth() - S.last.nw, rows = held().map(t => ({ t, c: shown(t) / (S.last.px[t] || shown(t)) - 1 })).sort((a, b) => Math.abs(b.c) - Math.abs(a.c)).slice(0, 3);
  const evs = (E ? E.events : []).filter(e => e.t > S.last.t && held().some(t => (e.cos && e.cos[t] !== undefined) || (e.fx && co[t] && e.fx[co[t].s] !== undefined))).slice(0, 2);
  return `<div style="border:1px solid var(--line);padding:var(--b);margin-bottom:var(--c)"><div class="b">While you were away, ${ago(S.last.t).replace(' ago', '')}</div>
    <div>Net worth <span class="${cls(d)}">${arrow(d)} ${money(Math.abs(d))}</span>. ${rows.map(r => `<a href="#co/${r.t}">${r.t} <span class="${cls(r.c)}">${pct(r.c)}</span></a>`).join(', ')}.</div>
    ${evs.map(e => `<div class="gray">${esc(e.head)}</div>`).join('')}</div>`;
}
function upcomingHTML() {
  const up = (E && E.upcoming || []).filter(u => u.at > Date.now()).slice(0, 3);
  if (!up.length) return '';
  return `<h3>Coming up</h3><div class="qhead"><span>Event</span><span>Insider tip</span></div>` + up.map(u => {
    const tip = S.tips[u.id], can = S.tendies >= TIP_COST;
    return `<div class="q"><div><div class="qt">${esc(u.label)}</div><div class="qd">in <b data-cd="${u.at}">${countdown(u.at - Date.now())}</b></div></div>
      ${tip ? `<b class="${tip === 'u' ? 'up' : 'down'}">${tip === 'u' ? '\u25B2 Up' : '\u25BC Down'}, probably</b>` : `<button data-tip="${esc(u.id)}" ${can ? '' : 'disabled'}>${can ? TIP_COST + ' tendies' : 'Needs ' + TIP_COST}</button>`}</div>`;
  }).join('') + `<div class="gray" id="tipmsg"></div>`;
}
function vFeed() {
  if (!E) return '<div class="empty">Loading...</div>';
  main.innerHTML = `<h2>Feed</h2>${inJail() || S.cash < 0 || broke() ? statusBanner() : ''}${awayHTML()}${upcomingHTML()}<h3>Latest</h3>${E.events.slice(0, 40).map(evHTML).join('')}`;
}
/* ---------- sorting and watchlists ---------- */
const dchg = t => shown(t) - (base24[t] || shown(t));
const SORTS = { name: (a, b) => a.n.localeCompare(b.n), price: (a, b) => shown(a.t) - shown(b.t), chg: (a, b) => chg24(a.t) - chg24(b.t), dchg: (a, b) => dchg(a.t) - dchg(b.t) };
const SORT_LABEL = { custom: 'Custom', name: 'A to Z', price: 'Price', chg: '% change', dchg: '$ change' };
function sortOf(isList) { const v = (S.sorts || {})[isList ? 'list' : 'main']; return v || (isList ? { k: 'custom', d: 1 } : { k: 'chg', d: -1 }); }
const applySort = (list, isList) => { const s2 = sortOf(isList); return s2.k === 'custom' ? list : list.slice().sort((a, b) => SORTS[s2.k](a, b) * s2.d); };
function sortBar(isList) {
  const cur = sortOf(isList), ks = isList ? ['custom', 'name', 'price', 'chg', 'dchg'] : ['name', 'price', 'chg', 'dchg'];
  return `<div class="sortbar"><span class="gray">Sort</span>${ks.map(k => `<button data-sort="${k}" class="${cur.k === k ? 'on' : ''}">${SORT_LABEL[k]}${cur.k === k && k !== 'custom' ? (cur.d > 0 ? ' ▲' : ' ▼') : ''}</button>`).join('')}</div>`;
}
const wls = () => S.lists || (S.lists = []);
const inAny = t => wls().some(l => l.tks.includes(t));
function defaultList() { if (!wls().length) wls().push({ id: 'w' + Date.now().toString(36), name: 'Watchlist', tks: [] }); return wls()[0]; }
function toggleStar(t) { if (inAny(t)) wls().forEach(l => { l.tks = l.tks.filter(x => x !== t); }); else defaultList().tks.push(t); save(); }
function newList(name) { name = String(name || '').replace(/[<>]/g, '').trim().slice(0, 24); if (!name || wls().length >= 12) return null; const l = { id: 'w' + Date.now().toString(36), name, tks: [] }; wls().push(l); save(); return l; }
function moveTk(l, t, before) { const a = l.tks.filter(x => x !== t), i = before ? a.indexOf(before) : a.length; a.splice(i < 0 ? a.length : i, 0, t); l.tks = a; }
function rowsHTML(list, o = {}) {
  const sorted = applySort(list, !!o.list), custom = !!o.list && sortOf(true).k === 'custom';
  return `${sortBar(!!o.list)}<table><thead><tr>${custom ? '<th></th>' : ''}<th>Name</th><th>Price</th><th>24h</th><th class="hm">24h $</th><th class="hm"></th>${o.list ? '<th></th>' : ''}</tr></thead><tbody>${sorted.map(c => {
    const ch = chg24(c.t), d = dchg(c.t), pts = M ? series(c.t, '1D') : null;
    return `<tr class="row" data-go="co/${c.t}" ${custom ? `draggable="true" data-dt="${c.t}"` : ''}>${custom ? `<td class="ord"><button data-mv="up" data-t="${c.t}" aria-label="Move up">▲</button><button data-mv="dn" data-t="${c.t}" aria-label="Move down">▼</button></td>` : ''}
      <td><span class="nmrow"><button class="star ${inAny(c.t) ? 'on' : ''}" data-star="${c.t}" aria-label="Watch">${inAny(c.t) ? '★' : '☆'}</button><span><span class="b">${c.t}</span><span class="nm">${esc(c.n)}</span></span></span></td>
      <td data-px="${c.t}">${num(shown(c.t))}</td><td data-chg="${c.t}" class="${cls(ch)}">${pct(ch)}</td><td class="hm ${cls(d)}">${d >= 0 ? '+' : '-'}${num(Math.abs(d))}</td><td class="sp hm">${sparkSVG(pts, ch >= 0)}</td>
      ${o.list ? `<td><button data-wlrm="${o.list}" data-t="${c.t}" aria-label="Remove">✕</button></td>` : ''}</tr>`;
  }).join('')}</tbody></table>`;
}
function vMarket() {
  if (!W || !M) { main.innerHTML = '<div class="empty">Loading...</div>'; return; }
  const sectors = W.sectors;
  if (arg.startsWith('list:')) {
    const l = wls().find(x => x.id === arg.slice(5));
    if (!l) { location.hash = '#market'; return; }
    const items = l.tks.map(t => co[t]).filter(Boolean);
    main.innerHTML = `<div class="crumb"><a href="#market">Market</a> / ${esc(l.name)}</div><h2>${esc(l.name)}</h2>
      <form class="tools" id="wladdform"><input id="wladd" list="allco" placeholder="Add a ticker" autocomplete="off" autocapitalize="characters"><button>Add</button></form>
      <datalist id="allco">${W.companies.concat(W.indices).map(c => `<option value="${c.t}">${esc(c.n)}</option>`).join('')}</datalist>
      ${items.length ? rowsHTML(items, { list: l.id }) : '<div class="empty">Nothing here yet.</div>'}
      <div class="row-btns" style="margin-top:var(--c)"><button data-wlren="${l.id}">Rename</button><button class="stop" data-wldel="${l.id}">Delete list</button></div>`;
    return;
  }
  if (arg === 'all') { main.innerHTML = `<div class="crumb"><a href="#market">Market</a> / All stocks</div><h2>All stocks</h2>${rowsHTML(W.companies)}`; return; }
  if (arg === 'pennies') { const l = W.companies.filter(c => shown(c.t) < 10); main.innerHTML = `<div class="crumb"><a href="#market">Market</a> / Penny stocks</div><h2>Penny stocks</h2>${rowsHTML(l)}`; return; }
  if (arg === 'index') { main.innerHTML = `<div class="crumb"><a href="#market">Market</a> / Index funds</div><h2>Index funds</h2>${rowsHTML(W.indices)}`; return; }
  if (arg && !secName[arg]) arg = '';
  if (arg) { main.innerHTML = `<div class="crumb"><a href="#market">Market</a> / ${esc(secName[arg])}</div><h2>${esc(secName[arg])}</h2>${rowsHTML(W.companies.filter(c => c.s === arg))}`; return; }
  const q = search.trim().toLowerCase();
  const head = `<h2>Market</h2>${broke() ? `<div class="note"><div class="b">Broke?</div>These are what you can afford. <a href="#market/pennies">Penny stocks</a>, mostly pharma.</div>` : ''}<div class="tools"><input id="q" placeholder="Search a name or ticker" value="${esc(search)}" autocomplete="off"></div>`;
  if (q) {
    const list = W.companies.concat(W.indices).filter(c => (c.t + ' ' + c.n).toLowerCase().includes(q)).slice(0, 40);
    main.innerHTML = head + (list.length ? rowsHTML(list) : '<div class="empty">Nothing by that name. It might be a real company, those are not allowed here.</div>');
    const i = $('#q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); return;
  }
  const secs = sectors.map(s => { const l = W.companies.filter(c => c.s === s.id); return { s, ch: l.reduce((a, c) => a + chg24(c.t), 0) / l.length, n: l.length }; }).sort((a, b) => b.ch - a.ch);
  main.innerHTML = head + `<h3>Watchlists</h3><div class="sec">${wls().map(l => `<a href="#market/list:${l.id}"><div class="n">${esc(l.name)}</div><div class="k">${l.tks.length} stock${l.tks.length === 1 ? '' : 's'}</div></a>`).join('')}
      <div class="newlist"><form id="newlistform" class="nm-edit" style="justify-content:flex-start;margin:0"><input id="newlistin" maxlength="24" placeholder="New list" autocomplete="off"><button class="go">Make one</button></form></div></div>
    <h3>Index funds</h3>${rowsHTML(W.indices)}<h3>Sectors</h3>
    <div class="sec"><a href="#market/all"><div class="n">All stocks</div><div class="k">${W.companies.length} companies</div></a><a href="#market/pennies"><div class="n">Penny stocks</div><div class="k">Under $10</div></a>
      ${secs.map(x => `<a href="#market/${x.s.id}"><div class="n">${esc(x.s.name)}</div><div class="c ${cls(x.ch)}">${arrow(x.ch)} ${pct(x.ch)}</div><div class="k">${x.n} companies</div></a>`).join('')}</div>`;
}
async function vCompany() {
  if (!W || !M || !co[arg]) { main.innerHTML = '<div class="empty">Loading...</div>'; return; }
  const c = co[arg], t = c.t, isIdx = !!idxs[t], p = S.pos[t];
  const sector = isIdx ? 'Index fund' : secName[c.s];
  const ch = chg24(t);
  const facts = isIdx ? `<div class="fact">${esc(c.g)}. Made of ${c.m.length} companies.</div>` : `<div class="fact"><b>${esc(c.g)}.</b> CEO ${esc(c.ceo)}.</div>`;
  const rel = (E ? E.events : []).filter(e => (e.cos && e.cos[t] !== undefined) || (!isIdx && e.fx && e.fx[c.s] !== undefined)).slice(0, 4);
  mode = 'buy';
  main.innerHTML = `<div class="crumb"><a href="#market">Market</a> / ${isIdx ? '<a href="#market/index">Index funds</a>' : `<a href="#market/${c.s}">${esc(sector)}</a>`} / ${t}</div>
  <div class="co"><div><div class="b">${t}</div><h2 style="margin:0">${esc(c.n)}</h2><div class="px" data-px="${t}">${num(shown(t))}</div>
    <div class="pxc"><span data-chg="${t}" class="${cls(ch)}">${arrow(ch)} ${pct(ch)}</span> <span class="gray">past day</span></div>
    <div id="hov" class="gray" style="min-height:var(--c);margin-top:var(--b)"></div>
    <div id="chartbox"></div>
    <div class="ranges">${RANGES.map(r => `<button data-range="${r[0]}" class="${r[0] === rangeSel ? 'on' : ''}">${r[0]}</button>`).join('')}</div>${facts}
    <h3>Watchlists</h3><div class="row-btns" style="flex-wrap:wrap">${wls().map(l => `<button data-wlt="${l.id}" class="${l.tks.includes(t) ? 'on' : ''}">${esc(l.name)}</button>`).join('')}<button data-wlnew="${t}">New list</button></div>
    ${rel.length ? '<h3>Recent news</h3>' + rel.map(evHTML).join('') : ''}</div>
  <div><div class="trade"><div class="row2"><span>Cash</span><span class="b" id="tcash">${money(S.cash)}</span></div>
    <div class="row2"><span>You own</span><span class="b" id="town">${p ? num(p.sh, 4) + ' shares' : 'none'}</span></div>
    ${p ? `<div class="row2"><span>Worth</span><span class="b" id="tval">${money(p.sh * shown(t))}</span></div>` : ''}
    <input id="amt" inputmode="decimal" placeholder="Amount in dollars" autocomplete="off">
    <div class="btns" style="margin-top:0;margin-bottom:var(--a)"><button data-mode="buy" class="mode go">Buy</button><button data-mode="sell" class="mode">Sell</button></div>
    <div class="quick"><button data-pc="25">25%</button><button data-pc="50">50%</button><button data-pc="100">All</button></div>
    <div class="btns" style="grid-template-columns:1fr"><button class="go" id="confirm" data-side="buy">Buy ${t}</button></div>
    <div class="msg" id="tmsg"></div></div>
  <div class="trade" style="margin-top:var(--b)" id="optbox">${optPanel(t)}</div></div></div>`;
  drawChart(t);
}
let opt = { call: true, exp: 1, k: 2, qty: 1 };           // exp in hours
const STEPS = [-0.10, -0.05, 0, 0.05, 0.10];
function optQuote(t) {
  const S0 = shown(t), K = Math.round(S0 * (1 + STEPS[opt.k]) * 100) / 100, days = opt.exp / 24;
  const fair = bs(S0, K, days, sigmaOf(t), opt.call), ask = fair * 1.1 + 0.005;
  return { S0, K, ask, cost: ask * 100 * opt.qty };
}
function optPanel(t) {
  const q = optQuote(t);
  return `<div class="b" style="margin-bottom:var(--a)">Options</div>
  <div class="btns" style="margin-top:0"><button data-oc="1" class="${opt.call ? 'go' : ''}">Call</button><button data-oc="0" class="${opt.call ? '' : 'stop'}">Put</button></div>
  <div class="quick">${[1, 6, 24].map(h => `<button data-oe="${h}" class="${opt.exp === h ? 'on' : ''}">${h}h</button>`).join('')}</div>
  <div class="quick">${STEPS.map((x, i) => `<button data-ok="${i}" class="${opt.k === i ? 'on' : ''}">${x === 0 ? 'At' : (x > 0 ? '+' : '') + x * 100}</button>`).join('')}</div>
  <div class="row2" style="margin-top:var(--b)"><span>Strike</span><span class="b" id="ostrike">${num(q.K)}</span></div>
  <div class="row2"><span>Contracts of 100</span><input id="oqty" inputmode="numeric" value="${opt.qty}" style="width:96px;text-align:right" autocomplete="off"></div>
  <div class="row2"><span>Breakeven</span><b id="obe">${num(opt.call ? q.K + q.ask : q.K - q.ask)}</b></div>
  <div class="row2"><span>Cost</span><b id="ocost">${money(q.cost)}</b></div>
  <div class="btns" style="grid-template-columns:1fr"><button id="obuy" class="${opt.call ? 'go' : 'stop'}">Buy ${opt.call ? 'call' : 'put'}</button></div>
  <div class="msg" id="omsg"></div>`;
}
function buyOption(t) {
  if (inJail()) return 'You are in jail. Trading is not allowed.';
  const qty = Math.floor(Number(opt.qty)); if (!(qty >= 1) || qty > 50) return 'Pick 1 to 50 contracts.';
  opt.qty = qty; const q = optQuote(t);
  if (q.cost > Math.max(0, netWorth()) * 3) return 'The broker says that is too much, even for you.';
  S.cash -= q.cost; S.opts = (S.opts || []).concat([{ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), tk: t, call: opt.call, K: q.K, qty, paid: q.cost, exp: Date.now() + opt.exp * 3600e3 }]);
  save(); submitBoard(); return '';
}
async function drawChart(t) {
  const box = $('#chartbox'); if (!box) return;
  if (rangeSel !== '1D') { box.innerHTML = '<div class="empty" style="height:240px">Loading...</div>'; await ensureHist(t); }
  if (route !== 'co' || arg !== t) return;
  let pts = series(t, rangeSel);
  if (!pts || pts.length < 2) { box.innerHTML = '<div class="empty" style="height:240px">No history yet.</div>'; return; }
  pts = pts.concat([[Date.now(), shown(t, true)]]);
  hoverPts = pts; box.innerHTML = chartSVG(pts);
  const up = pts[pts.length - 1][1] >= pts[0][1];
  const span = pts[pts.length - 1][1] / pts[0][1] - 1;
  $('#hov').innerHTML = `<span class="${cls(span)}">${rangeSel}: ${pct(span)}</span>`;
  const svg = $('#chart');
  svg.addEventListener('pointermove', e => {
    const r = svg.getBoundingClientRect(), i = Math.max(0, Math.min(pts.length - 1, Math.round((e.clientX - r.left) / r.width * (pts.length - 1))));
    const d = new Date(pts[i][0]); const vl = $('#vl'); if (vl) { const x = i / (pts.length - 1) * 600; vl.setAttribute('x1', x); vl.setAttribute('x2', x); vl.setAttribute('visibility', 'visible'); }
    $('#hov').innerHTML = `<span class="b">${num(pts[i][1])}</span> ${d.toLocaleString([], rangeSel === '1D' || rangeSel === '1W' ? { weekday: 'short', hour: 'numeric', minute: '2-digit' } : { year: 'numeric', month: 'short', day: 'numeric' })}`;
  });
  svg.addEventListener('pointerleave', () => { const vl = $('#vl'); if (vl) vl.setAttribute('visibility', 'hidden'); $('#hov').innerHTML = `<span class="${cls(span)}">${rangeSel}: ${pct(span)}</span>`; });
}
function statusBanner() {
  if (inJail()) return `<div class="note rowflex"><div><div class="b">Jail</div>Release in <b data-cd="${S.jailUntil}">${countdown(S.jailUntil - Date.now())}</b>. Assets seized, debt cleared.</div><button id="bail" ${S.tendies >= BAIL ? '' : 'disabled'}>${S.tendies >= BAIL ? 'Bail ' + BAIL + ' tendies' : 'Bail needs ' + BAIL}</button></div>`;
  if (S.cash < 0) return `<div class="note"><div class="b down">Debt ${money(S.cash)}</div>Interest <b>5%</b> a day. Jail at <b>-$2,000</b>.</div>`;
  if (broke()) {
    const can = Date.now() - (S.donated || 0) >= 3600e3 && netWorth() < 25;
    return `<div class="note rowflex"><div><div class="b">Broke</div>${can ? 'A kind stranger donates <b>$100</b>.' : 'Only penny stocks are in reach.'}</div><div class="row-btns">${can ? '<button class="go" id="donate">Accept $100</button>' : ''}<a class="btnlink" href="#market/pennies">Penny stocks</a></div></div>`;
  }
  return '';
}
function optionsPortfolioHTML() {
  const o = S.opts || [], lg = S.optLog || [];
  if (!o.length && !lg.length) return '';
  return `<h3>Options</h3>${o.length ? `<table><thead><tr><th>Contract</th><th>Qty</th><th>Value</th><th>Expires</th></tr></thead><tbody>${o.map(x => `<tr class="row" data-go="co/${x.tk}"><td><span class="b">${x.tk} ${x.call ? 'CALL' : 'PUT'} ${num(x.K)}</span></td><td>${x.qty}</td><td>${money(optMark(x))}</td><td data-cd="${x.exp}">${countdown(x.exp - Date.now())}</td></tr>`).join('')}</tbody></table>` : ''}
  ${lg.length ? `<div class="gray" style="margin-top:var(--b)">Recently expired</div>${lg.slice(0, 5).map(x => `<div>${x.tk} ${x.call ? 'CALL' : 'PUT'} ${num(x.K)}: paid ${money(x.paid)}, got ${money(x.pay)} <span class="${cls(x.pay - x.paid)}">${arrow(x.pay - x.paid)}</span></div>`).join('')}` : ''}`;
}
function vPortfolio() {
  if (!M) { main.innerHTML = '<div class="empty">Loading...</div>'; return; }
  const nw = netWorth(), r = ret(), l = ladder(r), hs = held();
  const sectors = {}; hs.forEach(t => { const s = (co[t] || {}).s || 'index'; sectors[s] = (sectors[s] || 0) + S.pos[t].sh * shown(t); });
  const tot = posValue() || 1;
  const bag = hs.some(t => S.pos[t].sh * shown(t) <= S.pos[t].cost * 0.7);
  const shown_b = Object.keys(S.badges).map(k => `<span class="badge ${BADGES[k][1]}">${BADGES[k][0]}</span>`).join('') + (bag ? '<span class="badge shame">Bagholder</span>' : '');
  main.innerHTML = `<h2>Portfolio</h2>${statusBanner()}<div class="huge ${l[1]}" id="pfladder">${l[0]}</div>
  <div class="big"><div><div class="l">Net worth</div><div class="v" id="pfnw">${money(nw)}</div></div><div><div class="l">Return</div><div class="v ${cls(r)}" id="pfret">${pct(r)}</div></div>
    <div><div class="l">Cash</div><div class="v">${money(S.cash)}</div></div><div><div class="l">Invested</div><div class="v" id="pfinv">${money(posValue())}</div></div></div>
  ${hs.length ? `<table><thead><tr><th>Holding</th><th>Shares</th><th>Value</th><th>Gain</th></tr></thead><tbody>${hs.sort((a, b) => S.pos[b].sh * shown(b) - S.pos[a].sh * shown(a)).map(t => {
    const p = S.pos[t], v = p.sh * shown(t), g = v / p.cost - 1;
    return `<tr class="row" data-go="co/${t}"><td><span class="nmrow"><span><span class="b">${t}</span><span class="nm">${esc((co[t] || {}).n || '')}</span></span>${g <= -0.3 ? '<span class="badge shame">Bagholder</span>' : ''}</span></td><td>${num(p.sh, 3)}</td><td>${money(v)}</td><td class="${cls(g)}">${pct(g)}</td></tr>`;
  }).join('')}</tbody></table>` : '<div class="empty">Nothing owned. Cash does not make Big Stonks.</div>'}
  ${hs.length ? `<h3>Where it sits</h3><div class="bars">${Object.entries(sectors).sort((a, b) => b[1] - a[1]).map(([s, v]) => `<div class="bb"><span>${esc(secName[s] || s)}</span><span class="t"><i style="width:${v / tot * 100}%"></i></span><span>${(v / tot * 100).toFixed(0)}%</span></div>`).join('')}</div>` : ''}
  ${S.fines ? `<div class="gray" style="margin-top:var(--b)">Fined by the SEC so far: ${money(S.fines)}.</div>` : ''}
  ${optionsPortfolioHTML()}`;
}
const BADGE_INFO = { jail: 'Go to jail over options debt.', rekt: 'Fall 25% below your starting money.', bigbig: 'Reach 15% above your starting money.', diamond: 'Hold a stock through an 8% drop from one headline.',
  brrr3: 'Claim 3 Brrr handouts.', basket: 'Hold stocks in 8 sectors at once.', martha: 'Get caught by the SEC.', tipster: 'Buy an insider tip.' };
function vQuests() {
  const qs = quests(), lv = level(), cur = S.tendies, lo = lv * lv * 20, hi = (lv + 1) * (lv + 1) * 20, pc = Math.min(100, (cur - lo) / (hi - lo) * 100);
  main.innerHTML = `<h2>Quests</h2>
  <div class="card lvlcard"><div class="rowflex"><div><div class="gray">Level</div><div class="lvln">${lv}</div></div><div class="lvlt">${esc(title())}</div><div class="lvltn"><b>${cur.toLocaleString('en-US')}</b> tendies</div></div>
    <div class="lvlbar"><b>${lv}</b><div class="meter"><i style="width:${pc}%"></i></div><b>${lv + 1}</b></div>
    <div class="lvllbl"><span>${lo}</span><b>${cur} of ${hi}</b><span>${hi}</span></div>
    <div class="titles">${TITLES.map((t, i) => `<span class="${i < lv ? 'past' : i === lv ? 'now' : ''}">${i}. ${esc(t)}</span>`).join('')}</div></div>
  <h3>Today</h3><div class="cards">${qs.map(q => questCard(q.t, q.d, q.r, q.pr, q.p, q.claimed, q.ok, 'data-claim="' + q.id + '"')).join('')}</div>
  <h3>Special quests</h3><div class="cards">${Object.keys(BADGES).map(k => { const got = !!S.badges[k]; return `<div class="card ${got ? 'got-' + BADGES[k][1] : ''}"><div class="card-h"><span class="qt">${BADGES[k][0]}</span><span class="reward">+30</span></div><div class="qd">${BADGE_INFO[k]}</div><div class="card-f"><span class="${got ? 'b' : ''}">${got ? 'Done' : 'Not yet'}</span></div></div>`; }).join('')}</div>
  <h3>Shop</h3><div class="cards">
    ${shopCard('Lawyer', 'Wipes the next SEC fine.', LAWYER, 'lawyer', (S.lawyers || 0) ? `${S.lawyers} on retainer` : '')}
    ${shopCard('Bail', 'Walk out of jail right now.', BAIL, 'bail', inJail() ? '' : 'Not in jail', !inJail())}
  </div>`;
}
function questCard(t, d, r, pr, prog, claimed, ok, attr) {
  return `<div class="card"><div class="card-h"><span class="qt">${esc(t)}</span><span class="reward">+${r}</span></div><div class="qd">${esc(d)}</div><div class="meter"><i style="width:${Math.round(pr * 100)}%"></i></div>
    <div class="card-f"><b>${esc(prog)}</b>${claimed ? '<span class="gray">Claimed</span>' : `<button class="${ok ? 'go' : ''}" ${attr} ${ok ? '' : 'disabled'}>Claim</button>`}</div></div>`;
}
function shopCard(t, d, cost, key, note, off) {
  const can = S.tendies >= cost && !off;
  return `<div class="card"><div class="card-h"><span class="qt">${t}</span><b>${cost}</b></div><div class="qd">${d}</div>
    <div class="card-f"><span class="gray">${esc(note || '')}</span><button data-buy="${key}" ${can ? '' : 'disabled'}>${off ? 'Unavailable' : can ? cost + ' tendies' : 'Needs ' + cost}</button></div></div>`;
}
function vNoSource() {
  const ev = E && E.events.find(x => x.id === arg);
  if (!ev) { main.innerHTML = '<div class="empty">Loading...</div>'; if (E) location.hash = '#feed'; return; }
  const moves = chips(ev);
  main.innerHTML = `<div class="crumb"><a href="#feed">Feed</a> / No source</div>
  <h2>Wait a minute</h2>
  <div class="why"><div>Is this misinformation?</div><div>Is misinformation driving the market?</div><div class="down">There is no source???</div></div>
  <div class="card" style="margin-bottom:var(--c)"><div class="gray">The headline</div><div class="qt" style="font-size:var(--m);white-space:normal">${esc(ev.head)}</div><div class="gray">${esc(ev.dek || '')}</div></div>
  <h3>Source check</h3>
  <table class="chk"><tbody>
    <tr><td>Outlet</td><td><b class="down">None</b></td></tr>
    <tr><td>Author</td><td><b class="down">None</b></td></tr>
    <tr><td>Link</td><td><b class="down">Nowhere to go</b></td></tr>
    <tr><td>Company</td><td><b>Invented, like the rest of this</b></td></tr>
    <tr><td>Evidence</td><td><b>A feeling</b></td></tr>
    <tr><td>Posted</td><td><b>${ago(ev.t)}</b></td></tr>
  </tbody></table>
  <h3>The market did not check either</h3><div class="chips" style="margin-bottom:var(--c)">${moves || '<span class="gray">Nothing moved. Lucky.</span>'}</div>
  <div class="lead">Headlines marked <b>Real news</b> open the story they came from. This one has nothing behind it, and prices moved anyway.</div>
  <div class="row-btns" style="margin-top:var(--c)"><a class="btnlink" href="#feed">Back to the feed</a></div>`;
}
async function vBoard() {
  main.innerHTML = '<h2>Wen Lambo</h2><div class="empty">Loading...</div>';
  if (S.acct) await syncNow();
  const list = await loadBoard();
  if (route !== 'board') return;
  if (!list) { main.innerHTML = '<h2>Wen Lambo</h2><div class="empty">Could not reach the leaderboard. Try again in a minute.</div>'; return; }
  const mine = S.acct ? list.findIndex(x => x.u === S.acct.u) : -1;
  main.innerHTML = `<h2>Wen Lambo</h2>${S.acct ? `<div class="gray" style="margin-bottom:var(--b)">${mine >= 0 ? `You are number ${mine + 1}.` : 'You are not in the top 50 yet.'}</div>` : `<div class="note rowflex"><span>The board is for people with an account.</span><button id="openset">Make one</button></div>`}
  ${list.length ? `<table class="bd"><thead><tr><th>#</th><th>Player</th><th>Net worth</th><th>Status</th></tr></thead><tbody>${list.map((x, i) => `<tr class="${S.acct && x.u === S.acct.u ? 'me' : ''}"><td>${i + 1}</td><td class="nmcell">${esc(x.u)}</td><td>${money(x.nw)}</td><td>${esc(ladder(x.nw / START - 1)[0])}</td></tr>`).join('')}</tbody></table>` : '<div class="empty">Nobody yet. Be first.</div>'}`;
}
function render() {
  if (route === 'feed') vFeed(); else if (route === 'market') vMarket(); else if (route === 'co') vCompany(); else if (route === 'portfolio') vPortfolio(); else if (route === 'quests') vQuests(); else if (route === 'board') vBoard(); else if (route === 'nosource') vNoSource(); else { location.hash = '#feed'; }
  renderMe(); renderTape();
}
function renderMe() {
  const r = M ? ret() : 0, l = ladder(r), el = $('#me');
  el.innerHTML = `<div class="nw" id="menw">${M ? money(netWorth()) : ''}</div><div class="ladder ${l[1]}" id="meladder">${M ? l[0] : ''}</div>
  <div class="tn"><b id="metn">${S.tendies.toLocaleString('en-US')}</b> tendies</div>
  <div class="who">${esc(S.name)} <button id="openset">Settings</button></div>`;
}
function applyTheme() {
  const t = S.theme || 'dark', dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0c0d0b' : '#f3f0e7';
}
function accountHTML() {
  if (S.acct) return `<div style="margin-bottom:var(--a)">Signed in as <b>${esc(S.acct.u)}</b></div>
    ${lastCode ? `<div class="note"><div class="gray">Recovery code, shown once</div><div class="b" style="font-size:var(--m)">${esc(lastCode)}</div></div>` : ''}
    <div class="row-btns"><button id="signout">Sign out</button><button class="stop" id="delacct">Delete account</button></div><div class="gray" id="accmsg" style="margin-top:var(--a)">${esc(accMsg)}</div>`;
  const rec = accMode === 'rec';
  return `<div class="acc"><input id="au" maxlength="16" placeholder="Username" autocomplete="username" autocapitalize="off" spellcheck="false">
    ${rec ? '<input id="ac" maxlength="12" placeholder="Recovery code" autocomplete="off" autocapitalize="off" spellcheck="false">' : ''}
    <input id="ap" type="password" maxlength="64" placeholder="${rec ? 'New password' : 'Password'}" autocomplete="${rec ? 'new-password' : 'current-password'}"></div>
    <div class="row-btns">${rec ? '<button class="go" data-acc="rec">Reset password</button><button data-acc-mode="in">Back</button>' : '<button class="go" data-acc="in">Sign in</button><button data-acc="up">Create account</button><button data-acc-mode="rec">Forgot</button>'}</div>
    <div class="gray" id="accmsg" style="margin-top:var(--a)">${esc(accMsg)}</div>`;
}
function settingsHTML() {
  return `<div class="set-in"><div class="set-top"><h2>Settings</h2><button id="closeset">Close</button></div>
  <h3>Account</h3>${accountHTML()}
  ${S.acct ? '' : `<h3>Name</h3><form class="nm-edit" id="nmform"><input id="nmin" maxlength="16" value="${esc(S.name)}" autocomplete="off"><button class="go">Save</button></form>`}
  <h3>Theme</h3><div class="row-btns">${['dark', 'light', 'system'].map(t => `<button data-theme="${t}" class="${(S.theme || 'dark') === t ? 'on' : ''}">${t}</button>`).join('')}</div>
  <h3>Alerts</h3>
  <button id="alerts" class="${S.notify ? 'go' : ''}">Alerts ${S.notify ? 'on' : 'off'}</button>
  <h3>Fine print</h3><div class="gray">Every company here is made up. The news is real, the market is not. Prices move on headlines from the last hour or so. You cannot lose real money. Options can expire worthless and put you in debt, and debt ends in jail.</div></div>`;
}
function openSettings() { const d = $('#settings'); d.innerHTML = settingsHTML(); d.hidden = false; document.body.style.overflow = 'hidden'; }
function closeSettings() { const d = $('#settings'); d.hidden = true; d.innerHTML = ''; document.body.style.overflow = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSettings(); });
function renderTape() {
  if (!W || !M) return;
  const all = W.companies.slice().sort((a, b) => chg24(b.t) - chg24(a.t)), pick = all.slice(0, 14).concat(all.slice(-14)).concat(W.indices);
  const html = pick.map(c => { const ch = chg24(c.t); return `<a href="#co/${c.t}">${c.t} <span data-px="${c.t}">${num(shown(c.t))}</span> <span data-chg="${c.t}" class="${cls(ch)}">${arrow(ch)}${Math.abs(ch * 100).toFixed(2)}%</span></a>`; }).join('');
  const tin = $('#tapein'); if (tin.dataset.k !== String(M.t)) { tin.innerHTML = html + html; tin.dataset.k = String(M.t); }
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const go = t.closest('[data-go]'); if (go && !t.closest('a') && !t.closest('button')) { location.hash = '#' + go.dataset.go; return; }
  const ev = t.closest('.ev');
  const b = t.closest('button');
  if (b) {
    if (b.dataset.brrr) { S.brrr[b.dataset.brrr] = true; const a = Number(b.dataset.amt) || 0; S.cash += a; S.dep += a; award(); save(); render(); return; }
    if (b.dataset.tip) {
      const u = (E.upcoming || []).find(x => x.id === b.dataset.tip); if (!u || S.tendies < TIP_COST) return;
      let hint = 'u'; try { hint = atob(u.k).charAt(1); } catch (er) { }
      S.tendies -= TIP_COST; S.tips[u.id] = hint; give('tipster');
      let msg = '';
      if (Math.random() < 0.25) { if ((S.lawyers || 0) > 0) { S.lawyers--; msg = 'The SEC noticed. Your lawyer made it go away.'; } else { const f = Math.min(S.cash, netWorth() * 0.12); S.cash -= f; S.fines += f; give('martha'); msg = `The SEC noticed. Fine: ${money(f)}.`; } }
      save(); render(); const m = $('#tipmsg'); if (m) m.textContent = msg; return;
    }
    if (b.dataset.range) { rangeSel = b.dataset.range; document.querySelectorAll('.ranges button').forEach(x => x.classList.toggle('on', x === b)); drawChart(arg); return; }
    if (b.dataset.side) {
      if (pending) return;
      const amtEl = $('#amt'), v = parseFloat((amtEl.value || '').replace(/[$,]/g, '')), side = b.dataset.side, all = side === 'sell' && amtEl.dataset.all === '1', t0 = arg, msg = $('#tmsg');
      if (!(v > 0)) { msg.textContent = 'Enter an amount.'; msg.className = 'msg down'; return; }
      holdOrder(msg, '#confirm,.mode,[data-pc]');
      setTimeout(() => {
        const m = trade(t0, side, v, all); pending = false; renderMe();
        if (route === 'co' && arg === t0) { vCompany(); const e = $('#tmsg'); if (e) { e.textContent = m || (side === 'buy' ? 'Bought.' : 'Sold.'); e.className = 'msg ' + (m ? 'down' : 'up'); } }
      }, ORDER_MS);
      return;
    }
    if (b.dataset.oc !== undefined || b.dataset.oe || b.dataset.ok !== undefined || b.id === 'obuy') {
      if (b.dataset.oc !== undefined) opt.call = b.dataset.oc === '1'; if (b.dataset.oe) opt.exp = Number(b.dataset.oe); if (b.dataset.ok !== undefined) opt.k = Number(b.dataset.ok);
      if (b.id === 'obuy') {
        if (pending) return; const t0 = arg; holdOrder($('#omsg'), '#obuy,#optbox button');
        setTimeout(() => { const m = buyOption(t0); pending = false; renderMe(); if (route === 'co' && arg === t0) { $('#optbox').innerHTML = optPanel(t0); const e = $('#omsg'); e.textContent = m || 'Bought. It will settle at expiry.'; e.className = 'msg ' + (m ? 'down' : 'up'); refreshTrade(); } }, ORDER_MS);
        return;
      }
      $('#optbox').innerHTML = optPanel(arg); return;
    }
    if (b.dataset.mode) {
      mode = b.dataset.mode; const c = $('#confirm');
      document.querySelectorAll('button.mode').forEach(x => { x.classList.toggle('go', x === b); x.classList.toggle('stop', false); });
      if (mode === 'sell') { b.classList.remove('go'); b.classList.add('stop'); }
      c.dataset.side = mode; c.textContent = (mode === 'buy' ? 'Buy ' : 'Sell ') + arg; c.className = mode === 'buy' ? 'go' : 'stop'; return;
    }
    if (b.dataset.pc) {
      const p = S.pos[arg], f = Number(b.dataset.pc) / 100;
      const raw = mode === 'sell' ? (p ? p.sh * shown(arg) * f : 0) : S.cash * f, am = $('#amt');
      am.value = (Math.floor(raw * 100) / 100).toFixed(2); am.dataset.all = b.dataset.pc === '100' ? '1' : ''; return;
    }
    if (b.dataset.claim) { const d = today(), q = quests().find(x => x.id === b.dataset.claim); if (q && q.ok && !q.claimed) { S.claimed[d + ':' + q.id] = true; S.tendies += q.r; save(); render(); } return; }
    if (b.id === 'alerts') { S.notify = !S.notify; if (S.notify && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); save(); if (!$('#settings').hidden) openSettings(); else render(); return; }
    if (b.dataset.sort) { const cur = sortOf(arg.startsWith('list:')); S.sorts = S.sorts || {}; S.sorts[arg.startsWith('list:') ? 'list' : 'main'] = cur.k === b.dataset.sort && b.dataset.sort !== 'custom' ? { k: cur.k, d: -cur.d } : { k: b.dataset.sort, d: b.dataset.sort === 'name' || b.dataset.sort === 'custom' ? 1 : -1 }; save(); render(); return; }
    if (b.dataset.star) { toggleStar(b.dataset.star); render(); return; }
    if (b.dataset.mv) { const l = wls().find(x => x.id === arg.slice(5)); if (l) { const i = l.tks.indexOf(b.dataset.t), j = b.dataset.mv === 'up' ? i - 1 : i + 1; if (i >= 0 && j >= 0 && j < l.tks.length) { [l.tks[i], l.tks[j]] = [l.tks[j], l.tks[i]]; save(); render(); } } return; }
    if (b.dataset.wlrm) { const l = wls().find(x => x.id === b.dataset.wlrm); if (l) { l.tks = l.tks.filter(x => x !== b.dataset.t); save(); render(); } return; }
    if (b.dataset.wlt) { const l = wls().find(x => x.id === b.dataset.wlt); if (l) { l.tks = l.tks.includes(arg) ? l.tks.filter(x => x !== arg) : l.tks.concat([arg]); save(); b.classList.toggle('on'); } return; }
    if (b.dataset.wlnew) { const n = `List ${wls().length + 1}`, l = newList(n); if (l) { l.tks.push(b.dataset.wlnew); save(); vCompany(); } return; }
    if (b.dataset.wlren) { const l = wls().find(x => x.id === b.dataset.wlren); if (l) { b.outerHTML = `<form id="renform" data-id="${l.id}" class="nm-edit" style="margin:0"><input id="renin" maxlength="24" value="${esc(l.name)}" autocomplete="off"><button class="go">Save</button></form>`; $('#renin').focus(); } return; }
    if (b.dataset.wldel) { if (b.dataset.sure) { S.lists = wls().filter(x => x.id !== b.dataset.wldel); save(); location.hash = '#market'; } else { b.dataset.sure = '1'; b.textContent = 'Really? Click again'; } return; }
    if (b.dataset.acc) { accountAction(b.dataset.acc); return; }
    if (b.dataset.accMode) { accMode = b.dataset.accMode; accMsg = ''; openSettings(); return; }
    if (b.id === 'signout') { signOut(); return; }
    if (b.id === 'delacct') { if (b.dataset.sure) deleteAccount(); else { b.dataset.sure = '1'; b.textContent = 'Really? Click again'; } return; }
    if (b.id === 'openset') { openSettings(); return; }
    if (b.id === 'closeset') { closeSettings(); return; }
    if (b.dataset.theme) { S.theme = b.dataset.theme; save(); applyTheme(); openSettings(); return; }
    if (b.dataset.buy) { const k = b.dataset.buy; if (k === 'lawyer' && S.tendies >= LAWYER) { S.tendies -= LAWYER; S.lawyers = (S.lawyers || 0) + 1; save(); render(); renderMe(); } if (k === 'bail' && S.tendies >= BAIL && inJail()) { S.tendies -= BAIL; S.jailUntil = 0; save(); render(); renderMe(); } return; }
    if (b.id === 'bail') { if (S.tendies >= BAIL && inJail()) { S.tendies -= BAIL; S.jailUntil = 0; save(); render(); renderMe(); } return; }
    if (b.id === 'donate') { donate(); render(); renderMe(); return; }
    return;
  }
  if (ev && !t.closest('a')) {
    const d = today();
    if (ev.dataset.nosrc) { S.read[d] = (S.read[d] || 0) + 1; save(); location.hash = '#nosource/' + encodeURIComponent(ev.dataset.nosrc); return; }
    if (ev.dataset.url) { window.open(ev.dataset.url, '_blank', 'noopener,noreferrer'); S.read[d] = (S.read[d] || 0) + 1; save(); }
    else { ev.classList.toggle('open'); if (ev.classList.contains('open')) { S.read[d] = (S.read[d] || 0) + 1; save(); } }
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'amt') e.target.dataset.all = '';
  if (e.target.id === 'oqty') { opt.qty = Number(e.target.value) || 0; const q = optQuote(arg); $('#ocost').textContent = money(q.cost); return; }
  if (e.target.id === 'q') { search = e.target.value; vMarket(); }
});
let dragT = null;
document.addEventListener('dragstart', e => { const r = e.target.closest && e.target.closest('tr[data-dt]'); if (r) { dragT = r.dataset.dt; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragT); } });
document.addEventListener('dragover', e => { if (dragT && e.target.closest && e.target.closest('tr[data-dt]')) e.preventDefault(); });
document.addEventListener('drop', e => {
  const r = e.target.closest && e.target.closest('tr[data-dt]'); if (!dragT || !r) return; e.preventDefault();
  const l = wls().find(x => x.id === arg.slice(5)); if (l && dragT !== r.dataset.dt) { moveTk(l, dragT, r.dataset.dt); save(); render(); } dragT = null;
});
document.addEventListener('submit', e => {
  if (e.target.id === 'newlistform') { e.preventDefault(); const l = newList($('#newlistin').value); if (l) location.hash = '#market/list:' + l.id; return; }
  if (e.target.id === 'wladdform') { e.preventDefault(); const t = $('#wladd').value.trim().toUpperCase(), l = wls().find(x => x.id === arg.slice(5)); if (l && co[t] && !l.tks.includes(t)) { l.tks.push(t); save(); render(); } return; }
  if (e.target.id === 'renform') { e.preventDefault(); const l = wls().find(x => x.id === e.target.dataset.id), n = $('#renin').value.replace(/[<>]/g, '').trim().slice(0, 24); if (l && n) { l.name = n; save(); } render(); return; }
  if (e.target.id === 'nmform') { e.preventDefault(); const n = $('#nmin').value.replace(/[^A-Za-z0-9 _.-]/g, '').trim().slice(0, 16); if (n.length >= 2) { S.name = n; save(); submitBoard(true); } renderMe(); closeSettings(); }
});
function refreshTrade() { const p = S.pos[arg]; const c = $('#tcash'); if (c) c.textContent = money(S.cash); const o = $('#town'); if (o) o.textContent = p ? num(p.sh, 4) + ' shares' : 'none'; }
window.addEventListener('hashchange', setRoute);

/* ---------- the once-a-second pass: prices, tab title, countdowns ---------- */
function tick() {
  if (!M) return;
  document.querySelectorAll('[data-px]').forEach(el => { el.textContent = num(shown(el.dataset.px)); });
  document.querySelectorAll('[data-chg]').forEach(el => {
    const ch = chg24(el.dataset.chg); el.className = cls(ch);
    el.textContent = el.closest('#tapein') ? arrow(ch) + Math.abs(ch * 100).toFixed(2) + '%' : el.closest('.pxc') ? arrow(ch) + ' ' + pct(ch) : pct(ch);
  });
  document.querySelectorAll('[data-cd]').forEach(el => { el.textContent = countdown(Number(el.dataset.cd) - Date.now()); });
  const nw = netWorth(), r = ret(), l = ladder(r);
  const a = $('#menw'); if (a) a.textContent = money(nw);
  const tn = $('#metn'); if (tn) tn.textContent = S.tendies.toLocaleString('en-US');
  const b = $('#meladder'); if (b) { b.textContent = l[0]; b.className = 'ladder ' + l[1]; }
  const pn = $('#pfnw'); if (pn) { pn.textContent = money(nw); $('#pfret').textContent = pct(r); $('#pfret').className = 'v ' + cls(r); $('#pfladder').textContent = l[0]; $('#pfladder').className = 'huge ' + l[1]; $('#pfinv').textContent = money(posValue()); }
  const tv = $('#tval'); if (tv && S.pos[arg]) tv.textContent = money(S.pos[arg].sh * shown(arg));
  if (S.cash < 0) S.cash *= 1 + 0.05 / 86400;
  if (settleOptions()) { renderMe(); if (route === 'portfolio' || route === 'feed') render(); }
  if ($('#ocost') && co[arg]) { const q = optQuote(arg); $('#ocost').textContent = money(q.cost); $('#ostrike').textContent = num(q.K); }
  updateTitle();
}
function snapshot() { if (!M) return; const px = {}; held().forEach(t => { px[t] = shown(t, true); }); S.last = { t: Date.now(), nw: netWorth(), px }; save(); }

async function boot() {
  applyTheme();
  setRoute();
  await Promise.all([loadWorld(), loadLive()]);
  if (!M || !W) { main.innerHTML = '<div class="empty">Could not load the market. Check your connection and refresh.</div>'; return; }
  if (S.pos.TWLN) { S.pos.DOUG = S.pos.TWLN; delete S.pos.TWLN; }
  (S.opts || []).forEach(o => { if (o.tk === 'TWLN') o.tk = 'DOUG'; });
  S.seenEv = S.seenEv || Math.max(0, ...(E ? E.events.map(e => e.t) : [0]));
  applyTheme(); award(); render(); tick(); submitBoard();
  setInterval(tick, 1000);
  setInterval(async () => { const before = M && M.t; await loadLive(); if (M && M.t !== before) { if (route === 'feed' || route === 'market') render(); award(); renderTape(); } }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) snapshot(); else loadLive().then(() => { render(); }); });
  window.addEventListener('pagehide', () => { snapshot(); syncNow(); });
  setInterval(() => { if (!document.hidden) snapshot(); }, 30000);
}
boot();
