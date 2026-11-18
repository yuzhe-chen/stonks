// Stonks. No build step, no dependencies. Data comes from the data branch of the repo (see scripts/tick.mjs).
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const REPO = 'yuzhe-chen/stonks';
const LIVE = LOCAL ? ['/data/'] : [`https://raw.githubusercontent.com/${REPO}/data/`, `https://cdn.jsdelivr.net/gh/${REPO}@data/`];
const COLD = LOCAL ? ['/data/'] : [`https://cdn.jsdelivr.net/gh/${REPO}@data/`, `https://raw.githubusercontent.com/${REPO}/data/`];
const BOARD = { project: '', key: '' };           // filled in when the leaderboard backend exists
const START = 10000, TIP_COST = 40;

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
    claimed: {}, brrr: {}, badges: {}, read: {}, tips: {}, notify: false, seen: 0, last: null, peak: START, fines: 0, sells: {}, theme: 'dark', opts: [], optLog: [], jailUntil: 0, donated: 0 };
}
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = fresh(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };

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
function trade(t, side, dollars) {
  if (inJail()) return 'You are in jail. Trading is not allowed.';
  const px = shown(t); if (!px || !(dollars > 0)) return 'Enter an amount.';
  if (side === 'buy') {
    if (dollars > S.cash + 1e-9) return 'Not enough cash.';
    const sh = dollars / px, p = S.pos[t] || (S.pos[t] = { sh: 0, cost: 0 });
    p.sh += sh; p.cost += dollars; S.cash -= dollars;
    S.trades.push({ t: Date.now(), tk: t, side, sh, px, chg: chg24(t) });
  } else {
    const p = S.pos[t]; if (!p || p.sh < 1e-9) return 'You do not own any.';
    const val = p.sh * px, d = Math.min(dollars, val), sh = d / px, frac = sh / p.sh, basis = p.cost * frac;
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
    { id: 'dip', t: 'Buy da Dip', d: 'Buy a stock that is down 2% or more over the last day.', ok: dip, p: dip ? 'Done' : 'Not yet', r: 25 },
    { id: 'bags', t: 'Spread the Bags', d: 'Hold shares in 4 different sectors at once.', ok: sectors.size >= 4, p: sectors.size + ' of 4 sectors', r: 25 },
    { id: 'read', t: 'Read the Room', d: 'Open 3 headlines in the feed.', ok: rd >= 3, p: Math.min(rd, 3) + ' of 3', r: 15 },
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

/* ---------- leaderboard (Firestore over REST, the document id is the player's random id) ---------- */
let boardAt = 0;
async function submitBoard(force) {
  if (!BOARD.project || Date.now() - boardAt < (force ? 0 : 60000)) return;
  boardAt = Date.now();
  const nw = Math.max(0, Math.round(netWorth() * 100) / 100);
  try {
    await fetch(`https://firestore.googleapis.com/v1/projects/${BOARD.project}/databases/(default)/documents/board/${S.id}?key=${BOARD.key}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fields: { name: { stringValue: S.name }, nw: { doubleValue: nw }, tendies: { integerValue: String(S.tendies) }, ts: { integerValue: String(Date.now()) } } }) });
  } catch (e) { }
}
async function loadBoard() {
  if (!BOARD.project) return null;
  try {
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${BOARD.project}/databases/(default)/documents:runQuery?key=${BOARD.key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'board' }], orderBy: [{ field: { fieldPath: 'nw' }, direction: 'DESCENDING' }], limit: 50 } }) });
    const j = await r.json();
    return j.filter(x => x.document).map(x => { const f = x.document.fields, id = x.document.name.split('/').pop(); return { id, name: f.name.stringValue, nw: Number(f.nw.doubleValue ?? f.nw.integerValue), tendies: Number(f.tendies ? f.tendies.integerValue : 0) }; });
  } catch (e) { return null; }
}

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
  return `<svg class="chart" id="chart" viewBox="0 0 600 240" preserveAspectRatio="none"><line x1="0" x2="600" y1="${Y(v[0]).toFixed(1)}" y2="${Y(v[0]).toFixed(1)}" stroke="var(--line)" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="${up ? 'var(--up)' : 'var(--down)'}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

/* ---------- views ---------- */
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
  const more = ev.kind === 'real' ? `<div class="src">Inspired by a headline from ${esc(ev.src || 'the news')}. The companies are invented.</div>` : '';
  return `<div class="ev" data-id="${esc(ev.id)}"><div class="tm">${ago(ev.t)}<span class="tag ${ev.kind === 'brrr' ? 'up' : ''}">${esc(tag)}</span></div>
    <div><div class="hd">${esc(ev.head)}</div><div class="dk">${esc(ev.dek || '')}</div>
    <div class="chips">${chips(ev)}</div>
    ${brrrOK ? `<div class="chips"><button class="go" data-brrr="${esc(ev.id)}" data-amt="${ev.amt}">Claim ${money(ev.amt, 0)}</button></div>` : ev.kind === 'brrr' && S.brrr[ev.id] ? '<div class="dk">Claimed.</div>' : ''}
    <div class="more">${more}</div></div></div>`;
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
  return `<h3>Coming up</h3>` + up.map(u => {
    const tip = S.tips[u.id];
    let hint = '';
    if (tip) hint = `<div class="b ${tip === 'u' ? 'up' : 'down'}">Your tip says ${tip === 'u' ? 'up' : 'down'}. Probably.</div>`;
    return `<div class="q ${''}"><div><div class="qt">${esc(u.label)}</div><div class="qd">in <span data-cd="${u.at}">${countdown(u.at - Date.now())}</span>${tip ? '' : `. A tip costs ${TIP_COST} tendies.`}</div>${hint}</div>
      ${tip ? '' : `<button data-tip="${esc(u.id)}" ${S.tendies < TIP_COST ? 'disabled' : ''}>Insider tip</button>`}</div>`;
  }).join('') + `<div class="gray" id="tipmsg"></div>`;
}
function vFeed() {
  if (!E) return '<div class="empty">Loading the news.</div>';
  main.innerHTML = `<h2>Feed</h2>${inJail() || S.cash < 0 || broke() ? statusBanner() : ''}${awayHTML()}${upcomingHTML()}<h3>Latest</h3>${E.events.slice(0, 40).map(evHTML).join('')}`;
}
function rowsHTML(list) {
  return `<table><thead><tr><th>Name</th><th>Price</th><th>24h</th><th></th></tr></thead><tbody>${list.map(c => {
    const ch = chg24(c.t), pts = M ? series(c.t, '1D') : null;
    return `<tr class="row" data-go="co/${c.t}"><td><span class="b">${c.t}</span><span class="nm">${esc(c.n)}</span></td><td data-px="${c.t}">${num(shown(c.t))}</td><td data-chg="${c.t}" class="${cls(ch)}">${pct(ch)}</td><td class="sp">${sparkSVG(pts, ch >= 0)}</td></tr>`;
  }).join('')}</tbody></table>`;
}
function vMarket() {
  if (!W || !M) { main.innerHTML = '<div class="empty">Loading the market.</div>'; return; }
  const sectors = W.sectors;
  if (arg && arg !== 'index' && arg !== 'pennies' && !secName[arg]) arg = '';
  if (arg === 'pennies') { const l = W.companies.filter(c => shown(c.t) < 10).sort((a, b) => b.v - a.v); main.innerHTML = `<div class="crumb"><a href="#market">Market</a> / Penny stocks</div><h2>Penny stocks</h2><div class="gray" style="margin-bottom:var(--b)">Everything under $10. Cheap to buy, wild to hold.</div>${rowsHTML(l)}`; return; }
  if (arg === 'index') { main.innerHTML = `<div class="crumb"><a href="#market">Market</a> / Index funds</div><h2>Index funds</h2>${rowsHTML(W.indices)}`; return; }
  if (arg) {
    const list = W.companies.filter(c => c.s === arg).sort((a, b) => sortBy === 'name' ? a.n.localeCompare(b.n) : chg24(b.t) - chg24(a.t));
    main.innerHTML = `<div class="crumb"><a href="#market">Market</a> / ${esc(secName[arg])}</div><h2>${esc(secName[arg])}</h2>${rowsHTML(list)}`; return;
  }
  const q = search.trim().toLowerCase();
  if (q) {
    const list = W.companies.concat(W.indices).filter(c => (c.t + ' ' + c.n).toLowerCase().includes(q)).slice(0, 40);
    main.innerHTML = `<h2>Market</h2><div class="tools"><input id="q" placeholder="Search a name or ticker" value="${esc(search)}" autocomplete="off"></div>${list.length ? rowsHTML(list) : '<div class="empty">Nothing by that name. It might be a real company, those are not allowed here.</div>'}`;
    const i = $('#q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); return;
  }
  const secs = sectors.map(s => { const l = W.companies.filter(c => c.s === s.id); return { s, ch: l.reduce((a, c) => a + chg24(c.t), 0) / l.length, n: l.length }; }).sort((a, b) => b.ch - a.ch);
  main.innerHTML = `<h2>Market</h2>${broke() ? `<div class="note"><div class="b">Broke?</div>These are what you can afford. <a href="#market/pennies">Penny stocks</a>, mostly pharma.</div>` : ''}<div class="tools"><input id="q" placeholder="Search a name or ticker" autocomplete="off"></div>
    <h3>Index funds</h3>${rowsHTML(W.indices)}<h3>Sectors</h3>
    <div class="sec">${secs.map(x => `<a href="#market/${x.s.id}"><div class="n">${esc(x.s.name)}</div><div class="c ${cls(x.ch)}">${arrow(x.ch)} ${pct(x.ch)}</div><div class="k">${x.n} companies</div></a>`).join('')}</div>`;
}
async function vCompany() {
  if (!W || !M || !co[arg]) { main.innerHTML = '<div class="empty">Loading.</div>'; return; }
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
  <div class="row2"><span>Cost</span><span class="b" id="ocost">${money(q.cost)}</span></div>
  <div class="btns" style="grid-template-columns:1fr"><button id="obuy" class="${opt.call ? 'go' : 'stop'}">Buy ${opt.call ? 'call' : 'put'}</button></div>
  <div class="msg" id="omsg"></div>
  <div class="gray">Worthless at expiry unless it ends past the strike. Buy more than you can pay for and you owe the difference.</div>`;
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
  if (rangeSel !== '1D') { box.innerHTML = '<div class="empty" style="height:240px">Loading.</div>'; await ensureHist(t); }
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
    const d = new Date(pts[i][0]);
    $('#hov').innerHTML = `<span class="b">${num(pts[i][1])}</span> ${d.toLocaleString([], rangeSel === '1D' || rangeSel === '1W' ? { weekday: 'short', hour: 'numeric', minute: '2-digit' } : { year: 'numeric', month: 'short', day: 'numeric' })}`;
  });
  svg.addEventListener('pointerleave', () => { $('#hov').innerHTML = `<span class="${cls(span)}">${rangeSel}: ${pct(span)}</span>`; });
}
function statusBanner() {
  if (inJail()) return `<div class="note"><div class="b">You are in jail</div>Options fraud, apparently. Release in <span data-cd="${S.jailUntil}">${countdown(S.jailUntil - Date.now())}</span>. Your assets were seized and the debt is forgiven. The commissary takes cash only.</div>`;
  if (S.cash < 0) return `<div class="note"><div class="b down">You are in debt: ${money(S.cash)}</div>Interest is 5% a day. Past -$2,000 the court takes your assets and you go to jail.</div>`;
  if (broke()) {
    const can = Date.now() - (S.donated || 0) >= 3600e3 && netWorth() < 25;
    return `<div class="note"><div class="b">You are broke</div>${can ? 'A kind stranger wants to donate $100.' : 'Penny stocks are all you can afford.'} <a href="#market/pennies">See the penny stocks</a>, mostly pharma. Tiny prices, huge swings.
    ${can ? '<div class="chips"><button class="go" id="donate">Accept the donation</button></div>' : ''}</div>`;
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
  if (!M) { main.innerHTML = '<div class="empty">Loading.</div>'; return; }
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
    return `<tr class="row" data-go="co/${t}"><td><span class="b">${t}</span><span class="nm">${esc((co[t] || {}).n || '')}</span></td><td>${num(p.sh, 3)}</td><td>${money(v)}</td><td class="${cls(g)}">${pct(g)}</td></tr>`;
  }).join('')}</tbody></table>` : '<div class="empty">Nothing owned. Cash does not make Big Stonks.</div>'}
  ${hs.length ? `<h3>Where it sits</h3><div class="bars">${Object.entries(sectors).sort((a, b) => b[1] - a[1]).map(([s, v]) => `<div class="bb"><span>${esc(secName[s] || s)}</span><span class="t"><i style="width:${v / tot * 100}%"></i></span><span>${(v / tot * 100).toFixed(0)}%</span></div>`).join('')}</div>` : ''}
  <h3>Badges</h3>${shown_b || '<div class="gray">None yet.</div>'}
  ${S.fines ? `<div class="gray" style="margin-top:var(--b)">Fined by the SEC so far: ${money(S.fines)}.</div>` : ''}
  ${optionsPortfolioHTML()}`;
}
function vQuests() {
  const qs = quests(), lv = level(), cur = S.tendies, lo = lv * lv * 20, hi = (lv + 1) * (lv + 1) * 20;
  main.innerHTML = `<h2>Quests</h2><div class="lvl"><div class="t">${esc(title())}</div><div class="s">Level ${lv}. ${cur} tendies.</div></div>
  <div class="meter"><i style="width:${Math.min(100, (cur - lo) / (hi - lo) * 100)}%"></i></div>
  <h3>Today</h3>${qs.map((q, i) => `<div class="q ${i ? '' : 'first'}"><div><div class="qt">${esc(q.t)}</div><div class="qd">${esc(q.d)}</div><div class="qd">${esc(q.p)}. Pays ${q.r} tendies.</div></div>
    ${q.claimed ? '<span class="gray">Claimed</span>' : `<button class="${q.ok ? 'go' : ''}" data-claim="${q.id}" ${q.ok ? '' : 'disabled'}>Claim</button>`}</div>`).join('')}
  <h3>Insider tips</h3><div class="qd">Scheduled events show up in the feed with a countdown. A tip costs ${TIP_COST} tendies and is right about 70 percent of the time. Each tip has a 1 in 4 chance of getting you noticed by the SEC.</div>
  <h3>Badges</h3>${Object.keys(BADGES).map(k => `<span class="badge ${S.badges[k] ? BADGES[k][1] : ''}">${BADGES[k][0]}</span>`).join('')}`;
}
async function vBoard() {
  main.innerHTML = '<h2>Wen Lambo</h2><div class="empty">Loading.</div>';
  if (!BOARD.project) { main.innerHTML = '<h2>Wen Lambo</h2><div class="empty">The leaderboard is not connected yet.</div>'; return; }
  await submitBoard(true);
  const list = await loadBoard();
  if (route !== 'board') return;
  if (!list) { main.innerHTML = '<h2>Wen Lambo</h2><div class="empty">Could not reach the leaderboard. Try again in a minute.</div>'; return; }
  const mine = list.findIndex(x => x.id === S.id);
  main.innerHTML = `<h2>Wen Lambo</h2><div class="gray" style="margin-bottom:var(--b)">${mine >= 0 ? `You are number ${mine + 1}.` : 'You are not in the top 50 yet.'}</div>
  <table class="bd"><thead><tr><th>#</th><th>Player</th><th>Net worth</th><th>Status</th></tr></thead><tbody>${list.map((x, i) => `<tr class="${x.id === S.id ? 'me' : ''}"><td>${i + 1}</td><td class="nmcell">${esc(x.name)}</td><td>${money(x.nw)}</td><td>${esc(ladder(x.nw / START - 1)[0])}</td></tr>`).join('')}</tbody></table>`;
}
function render() {
  if (route === 'feed') vFeed(); else if (route === 'market') vMarket(); else if (route === 'co') vCompany(); else if (route === 'portfolio') vPortfolio(); else if (route === 'quests') vQuests(); else if (route === 'board') vBoard(); else { location.hash = '#feed'; }
  renderMe(); renderTape();
}
function renderMe() {
  const r = M ? ret() : 0, l = ladder(r), el = $('#me');
  el.innerHTML = `<div class="nw" id="menw">${M ? money(netWorth()) : ''}</div><div class="ladder ${l[1]}" id="meladder">${M ? l[0] : ''}</div>
  <div class="who">${esc(S.name)} <button id="openset">Settings</button></div>`;
}
function applyTheme() {
  const t = S.theme || 'dark', dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = dark ? '#0c0d0b' : '#f3f0e7';
}
function settingsHTML() {
  return `<div class="set-in"><div class="set-top"><h2>Settings</h2><button id="closeset">Close</button></div>
  <h3>Name</h3><form class="nm-edit" id="nmform"><input id="nmin" maxlength="16" value="${esc(S.name)}" autocomplete="off"><button class="go">Save</button></form>
  <h3>Theme</h3><div class="row-btns">${['dark', 'light', 'system'].map(t => `<button data-theme="${t}" class="${(S.theme || 'dark') === t ? 'on' : ''}">${t}</button>`).join('')}</div>
  <h3>Alerts</h3><div class="gray" style="margin-bottom:var(--a)">A notification when news hits something you own. Works while the game is open in a tab.</div>
  <button id="alerts" class="${S.notify ? 'go' : ''}">Alerts ${S.notify ? 'on' : 'off'}</button>
  <h3>Fine print</h3><div class="gray">Every company here is made up. The news is real, the market is not. Prices move on headlines from the last hour or so. You cannot lose real money. Options can expire worthless and put you in debt, and debt ends in jail.</div></div>`;
}
function openSettings() { const d = $('#settings'); d.innerHTML = settingsHTML(); d.hidden = false; document.body.style.overflow = 'hidden'; }
function closeSettings() { const d = $('#settings'); d.hidden = true; d.innerHTML = ''; document.body.style.overflow = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSettings(); });
function renderTape() {
  if (!W || !M) return;
  const all = W.companies.slice().sort((a, b) => chg24(b.t) - chg24(a.t)), pick = all.slice(0, 14).concat(all.slice(-14)).concat(W.indices);
  const html = pick.map(c => { const ch = chg24(c.t); return `<span>${c.t} <span data-px="${c.t}">${num(shown(c.t))}</span> <span data-chg="${c.t}" class="${cls(ch)}">${arrow(ch)}${Math.abs(ch * 100).toFixed(2)}%</span></span>`; }).join('');
  const tin = $('#tapein'); if (tin.dataset.k !== String(M.t)) { tin.innerHTML = html + html; tin.dataset.k = String(M.t); }
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const go = t.closest('[data-go]'); if (go && !t.closest('a')) { location.hash = '#' + go.dataset.go; return; }
  const ev = t.closest('.ev');
  const b = t.closest('button');
  if (b) {
    if (b.dataset.brrr) { S.brrr[b.dataset.brrr] = true; const a = Number(b.dataset.amt) || 0; S.cash += a; S.dep += a; award(); save(); render(); return; }
    if (b.dataset.tip) {
      const u = (E.upcoming || []).find(x => x.id === b.dataset.tip); if (!u || S.tendies < TIP_COST) return;
      let hint = 'u'; try { hint = atob(u.k).charAt(1); } catch (er) { }
      S.tendies -= TIP_COST; S.tips[u.id] = hint; give('tipster');
      let msg = '';
      if (Math.random() < 0.25) { const f = Math.min(S.cash, netWorth() * 0.12); S.cash -= f; S.fines += f; give('martha'); msg = `The SEC noticed. Fine: ${money(f)}.`; }
      save(); render(); const m = $('#tipmsg'); if (m) m.textContent = msg; return;
    }
    if (b.dataset.range) { rangeSel = b.dataset.range; document.querySelectorAll('.ranges button').forEach(x => x.classList.toggle('on', x === b)); drawChart(arg); return; }
    if (b.dataset.side) {
      const v = parseFloat(($('#amt').value || '').replace(/[$,]/g, '')); const m = trade(arg, b.dataset.side, v);
      $('#tmsg').textContent = m || (b.dataset.side === 'buy' ? 'Bought.' : 'Sold.'); $('#tmsg').className = 'msg ' + (m ? 'down' : 'up'); if (!m) { $('#amt').value = ''; refreshTrade(); renderMe(); } return;
    }
    if (b.dataset.oc !== undefined || b.dataset.oe || b.dataset.ok !== undefined || b.id === 'obuy') {
      if (b.dataset.oc !== undefined) opt.call = b.dataset.oc === '1'; if (b.dataset.oe) opt.exp = Number(b.dataset.oe); if (b.dataset.ok !== undefined) opt.k = Number(b.dataset.ok);
      if (b.id === 'obuy') { const m = buyOption(arg); opt.qty = opt.qty; $('#optbox').innerHTML = optPanel(arg); const e = $('#omsg'); e.textContent = m || 'Bought. It will settle at expiry.'; e.className = 'msg ' + (m ? 'down' : 'up'); refreshTrade(); renderMe(); return; }
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
      $('#amt').value = (mode === 'sell' ? (p ? p.sh * shown(arg) * f : 0) : S.cash * f).toFixed(2); return;
    }
    if (b.dataset.claim) { const d = today(), q = quests().find(x => x.id === b.dataset.claim); if (q && q.ok && !q.claimed) { S.claimed[d + ':' + q.id] = true; S.tendies += q.r; save(); render(); } return; }
    if (b.id === 'alerts') { S.notify = !S.notify; if (S.notify && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission(); save(); if (!$('#settings').hidden) openSettings(); else render(); return; }
    if (b.id === 'openset') { openSettings(); return; }
    if (b.id === 'closeset') { closeSettings(); return; }
    if (b.dataset.theme) { S.theme = b.dataset.theme; save(); applyTheme(); openSettings(); return; }
    if (b.id === 'donate') { donate(); render(); renderMe(); return; }
    return;
  }
  if (ev && !t.closest('a')) {
    ev.classList.toggle('open');
    if (ev.classList.contains('open')) { const d = today(); S.read[d] = (S.read[d] || 0) + 1; save(); }
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'oqty') { opt.qty = Number(e.target.value) || 0; const q = optQuote(arg); $('#ocost').textContent = money(q.cost); return; }
  if (e.target.id === 'q') { search = e.target.value; vMarket(); }
});
document.addEventListener('submit', e => {
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
  S.seenEv = S.seenEv || Math.max(0, ...(E ? E.events.map(e => e.t) : [0]));
  applyTheme(); award(); render(); tick(); submitBoard();
  setInterval(tick, 1000);
  setInterval(async () => { const before = M && M.t; await loadLive(); if (M && M.t !== before) { if (route === 'feed' || route === 'market') render(); award(); renderTape(); } }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) snapshot(); else loadLive().then(() => { render(); }); });
  window.addEventListener('pagehide', snapshot);
  setInterval(() => { if (!document.hidden) snapshot(); }, 30000);
}
boot();
