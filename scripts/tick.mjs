// One tick of the made-up market. Run by the scheduled job every 5 minutes (and by hand while testing).
//   node scripts/tick.mjs <data-dir>        env: NO_NET=1 skips the news feeds, NOW=<ms> fakes the clock, SEED=<n> fixes the dice
import fs from 'node:fs';
import path from 'node:path';
import { buildWorld, SECTORS } from './world.mjs';
import { FEEDS, fetchFeed, classify } from './news.mjs';
import { macroReturn, marketReturn } from './history.mjs';
import { GOOD, BAD, SECTOR_GOOD, SECTOR_BAD, MARKET_GOOD, MARKET_BAD, DEKS, WILD, BRRR, SCHED } from './templates.mjs';

const dir = process.argv[2] || 'data';
fs.mkdirSync(dir, { recursive: true });
const now = Number(process.env.NOW) || Date.now();
const MAX_POINTS = 288;      // 24 hours at one point per 5 minutes
const MAX_EVENTS = 300;

const read = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return d; } };
const write = (f, o) => fs.writeFileSync(path.join(dir, f), JSON.stringify(o));
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(Number(process.env.SEED) || (now % 2147483647));
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const pick = a => a[Math.floor(rnd() * a.length)];
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const r1 = x => Math.round(x * 10) / 10;

// ---- load / start
const world = buildWorld();
write('world.json', world);
const bySector = {}; world.companies.forEach(c => (bySector[c.s] = bySector[c.s] || []).push(c));
const secInfo = {}; SECTORS.forEach(s => { secInfo[s.id] = s; });
const coInfo = {}; world.companies.forEach(c => { coInfo[c.t] = c; });
const back = world.companies;
const idx = world.indices, allT = back.concat(idx.map(i => ({ t: i.t, s: 'index' })));
const byT = {}; back.forEach(c => { byT[c.t] = c; });
let st = read('state.json', null);
let market = read('market.json', null);
let H = read('hist.json', null);                       // longer views: w 30 min, m 2 h, d 1 day
let events = read('events.json', { events: [] }).events;
const SPACING = { w: 30 * 60e3, m: 2 * 3600e3, d: 86400e3 }, KEEP = { w: 336, m: 360, d: 1200 };
let fresh = false;
if (!st || !market || !H) {
  fresh = true;
  st = { t: now, p: {}, o: {}, seen: [], lastReal: 0, lastRun: now };
  world.companies.forEach(c => { st.p[c.t] = c.p; st.o[c.t] = 0; });
  market = { t: 0, ts: [], c: {} };
  H = { w: { ts: [], c: {} }, m: { ts: [], c: {} }, d: { ts: [], c: {} } };
  allT.forEach(c => { market.c[c.t] = []; ['w', 'm', 'd'].forEach(k => { H[k].c[c.t] = []; }); });
  events = [];
}
// a renamed ticker keeps its history
for (const [from, to] of Object.entries({ TWLN: 'DOUG' })) {
  if (st.p[from] !== undefined && st.p[to] === undefined) { st.p[to] = st.p[from]; delete st.p[from]; if (st.o) { st.o[to] = st.o[from]; delete st.o[from]; } }
  for (const m of [market, H.w, H.m, H.d]) if (m.c && m.c[from] && !m.c[to]) { m.c[to] = m.c[from]; delete m.c[from]; }
}
const seen = new Set(st.seen);
let vmul = 1, extra = {}, seeding = false, seedT = 0;      // extra: log return per sector the real curves ask for in this stretch                       // volatility of the minutes being simulated (a wild minute is a spike)

// ---- helpers for events
function fill(t, c, c2) {
  const s = secInfo[c.s];
  return t.replace(/\{co2\}/g, c2 ? c2.n : c.n).replace(/\{co\}/g, c.n).replace(/\{ceo\}/g, c.ceo).replace(/\{thing\}/g, s.thing).replace(/\{sector\}/g, s.name);
}
const fill0 = x => x;
const newEvents = [];
// the same template or sub line never appears twice near each other: a sliding window of what the last events used
const recentQ = [], recentD = [];
events.slice(0, 12).reverse().forEach(e => { if (e.tpl) recentQ.push(e.tpl); if (e.dek) recentD.push(e.dek); });
let lastKey = '';
const keyOf = x => hash(typeof x === 'string' ? x : x.t).toString(36);
function pickT(arr) {
  const win = recentQ.slice(-Math.min(8, arr.length - 1)), ok = arr.filter(x => !win.includes(keyOf(x)));
  const t = pick(ok.length ? ok : arr); lastKey = keyOf(t); recentQ.push(lastKey); return t;
}
function pickDek(arr) {
  const win = recentD.slice(-Math.min(6, arr.length - 1)), ok = arr.filter(x => !win.includes(x));
  const d = pick(ok.length ? ok : arr); recentD.push(d); return d;
}
let uid = 0;
const mkId = () => (now.toString(36) + (uid++).toString(36));

function realEvents(items) {
  const cands = [];
  for (const it of items) {
    const id = hash(it.title).toString(36);
    if (seen.has(id)) continue;
    seen.add(id);
    if (it.t && now - it.t > 6 * 3600e3) continue;          // stale
    const tie = hash(it.title + 'x') % 2 ? 1 : -1;
    const k = classify(it.title, tie);
    if (!k) continue;
    const score = Math.max(...Object.values(k.fx).map(Math.abs), k.macro ? Math.abs(k.macroMove) : 0);
    cands.push({ it, k, id, score });
  }
  cands.sort((a, b) => b.score - a.score);
  const usedSectors = new Set(), out = [];
  for (const { it, k, id } of cands) {
    if (out.length >= 3) break;
    const sector = k.macro ? 'macro' : k.primary;
    if (usedSectors.has(sector)) continue;
    usedSectors.add(sector);
    const h = hash(it.title);
    let fx = {}, cos = {}, head, dek, sec, tpl = '';
    if (k.macro) {
      SECTORS.forEach(s => { fx[s.id] = r1(k.macroMove * s.beta * 0.8); });
      head = fill0(pickT(k.macroMove > 0 ? MARKET_GOOD : MARKET_BAD)); sec = 'market'; tpl = lastKey;
    } else {
      Object.entries(k.fx).forEach(([s, v]) => { if (Math.abs(v) >= 0.3) fx[s] = r1(v); });
      const pm = fx[k.primary] || 0, list = bySector[k.primary], co = list[h % list.length], co2 = list[(h >>> 5) % list.length === h % list.length ? (h + 1) % list.length : (h >>> 5) % list.length];
      sec = k.primary;
      if (h % 5 < 3) {            // one company takes the hit
        cos[co.t] = r1((pm >= 0 ? 1 : -1) * (2 + Math.abs(pm) * 1.4));
        head = fill(pickT(pm >= 0 ? GOOD : BAD), co, co2); tpl = lastKey;
      } else { head = fill(pickT(pm >= 0 ? SECTOR_GOOD : SECTOR_BAD), co, co2); tpl = lastKey; }
    }
    dek = pickDek(DEKS);
    out.push({ id: mkId(), t: now, kind: 'real', sec, head, dek, tpl, src: it.src, url: it.link || '', fx, cos });
  }
  return out;
}
function wildEvent() {
  const w = pickT(WILD), s = pick(SECTORS), list = bySector[s.id], co = pick(list), co2 = pick(list);
  const mag = w.mag * (0.8 + rnd() * 0.5) * (w.good ? 1 : -1);
  const wk = lastKey; recentD.push(w.d);
  return { id: mkId(), t: now, kind: 'wild', sec: s.id, tpl: wk, head: fill(w.t, co, co2), dek: w.d, src: null, fx: { [s.id]: r1(mag * 0.12) }, cos: { [co.t]: r1(mag) } };
}
function brrrEvent() {
  const amt = pick([250, 500, 500, 1000, 2500]);
  const b = pick(BRRR);
  return { id: mkId(), t: now, kind: 'brrr', sec: 'market', head: b.t.replace('{amt}', '$' + amt.toLocaleString('en-US')), dek: b.d, src: null, fx: {}, cos: {}, amt };
}

// ---- 1. news
let items = [];
if (!process.env.NO_NET) {
  const got = await Promise.all(FEEDS.map(([s, u]) => fetchFeed(s, u)));
  items = got.flat();
  console.log('feed items', items.length);
}
const firstRun = !st.seen.length;
const real = realEvents(items);
newEvents.push(...real);
if (real.length) st.lastReal = now;
// quiet hours: the invented news fills in
const quiet = now - (st.lastReal || 0) > 90 * 60e3;
if (rnd() < (quiet ? 0.1 : 0.025)) newEvents.push(wildEvent());
if (rnd() < 0.005) newEvents.push(brrrEvent());

// ---- 2. simulation
const sf = {}; SECTORS.forEach(s => { sf[s.id] = 0; });
function advance(minutes) {
  const steps = Math.max(1, Math.min(Math.round(minutes), 240)), dt = minutes / steps;
  for (let k = 0; k < steps; k++) {
    const zm = gauss();
    SECTORS.forEach(s => { sf[s.id] = gauss(); });
    for (const c of back) {
      const vm = c.v / 100 / Math.sqrt(1440) * Math.sqrt(dt) * vmul;
      const sec = secInfo[c.s];
      let r = vm * (0.65 * gauss() + 0.55 * sf[c.s] * sec.beta + 0.5 * zm);
      r += st.o[c.t] * 0.04 * dt; st.o[c.t] *= Math.pow(0.96, dt);
      if (!seeding) r += 0.0005 * dt * Math.log(c.p / st.p[c.t]);
      else r += 0.00002 * dt * (Math.log(c.p) + macroReturn(c.s, now, seedT) - Math.log(st.p[c.t]));   // the past follows the real curves, with room to wander
      r += (extra[c.s] || 0) / steps;
      st.p[c.t] = Math.min(5000, Math.max(1, st.p[c.t] * Math.exp(r)));
    }
  }
}
function land(evs) {
  for (const ev of evs) {
    if (ev.kind === 'brrr') continue;
    const apply = (t, pct) => {
      const jump = pct / 100;
      st.p[t] = Math.min(5000, Math.max(1, st.p[t] * (1 + jump * 1.35)));
      st.o[t] -= jump * 0.35;
    };
    Object.entries(ev.fx).forEach(([s, pct]) => (bySector[s] || []).forEach(c => apply(c.t, pct * (0.6 + 0.8 * ((hash(c.t + ev.id) % 100) / 100)))));
    Object.entries(ev.cos).forEach(([t, pct]) => apply(t, pct));
  }
}
const dayOf = t => Math.floor(t / 86400e3);
function syncIdx() { for (const i of idx) st.p[i.t] = i.base * i.m.reduce((a, t) => a + st.p[t], 0) / i.p0; }
function push(series, at) { series.ts.push(at); for (const c of allT) series.c[c.t].push(Math.round(st.p[c.t] * 100)); }
function trim(series, n) { while (series.ts.length > n) { series.ts.shift(); for (const c of allT) series.c[c.t].shift(); } }
function record(at) {
  syncIdx();
  push(market, at); trim(market, MAX_POINTS); market.t = at;
  for (const k of ['w', 'm']) { const l = H[k].ts[H[k].ts.length - 1] || 0; if (at - l >= SPACING[k] - 90e3) { push(H[k], at); trim(H[k], KEEP[k]); } }
  const ld = H.d.ts[H.d.ts.length - 1]; if (ld === undefined || dayOf(at) !== dayOf(ld)) { push(H.d, at); trim(H.d, KEEP.d); }
}
// scheduled appointments (UTC): rate decision Wednesdays 18:00, jobs report Fridays 13:30, earnings hour weekdays 21:00
function slotsBetween(a, b) {
  const out = [];
  for (let d = dayOf(a); d <= dayOf(b); d++) {
    const t0 = d * 86400e3, dow = new Date(t0).getUTCDay(), date = new Date(t0).toISOString().slice(0, 10);
    const add = (kind, h, m) => { const at = t0 + (h * 60 + m) * 60e3; if (at > a && at <= b) out.push({ id: kind + date, kind, at, date }); };
    if (dow === 3) add('rate', 18, 0);
    if (dow === 5) add('jobs', 13, 30);
    if (dow >= 1 && dow <= 5) add('earn', 21, 0);
  }
  return out;
}
function slotOutcome(slot) {
  const h = hash('o:' + slot.id), dir = (h & 1) ? 1 : -1, u = ((h >>> 3) % 1000) / 1000;
  const co = slot.kind === 'earn' ? back[hash('earn' + slot.date) % back.length] : null;
  const hint = ((h >>> 12) % 10) < 7 ? dir : -dir;                       // a tip is right 70 percent of the time
  return { dir, mag: slot.kind === 'earn' ? 4 + u * 11 : 0.8 + u * 2.7, co, hint };
}
function slotEvent(slot) {
  const o = slotOutcome(slot), T = SCHED[slot.kind], h = hash('t:' + slot.id);
  const co = o.co;
  const deks = [T.dek].concat(T.more || []), dek = deks[hash('d:' + slot.id) % deks.length];
  const arr = o.dir > 0 ? T.up : T.down, head = arr[h % arr.length].replace('{co}', co ? co.n : '').replace('{ceo}', co ? co.ceo : '');
  const ev = { id: 's-' + slot.id, t: slot.at, kind: 'sched', label: T.label, sec: co ? co.s : 'market', head, dek, src: null, fx: {}, cos: {} };
  if (co) ev.cos[co.t] = r1(o.dir * o.mag);
  else SECTORS.forEach(s => { ev.fx[s.id] = r1(o.dir * o.mag * s.beta * 0.8); });
  return ev;
}
function upcoming() {
  return slotsBetween(now, now + 40 * 3600e3).map(sl => {
    const o = slotOutcome(sl), T = SCHED[sl.kind];
    return { id: sl.id, at: sl.at, label: T.label + (o.co ? ': ' + o.co.t : ''), tk: o.co ? o.co.t : null, k: Buffer.from('k' + (o.hint > 0 ? 'u' : 'd') + (hash(sl.id) % 89)).toString('base64') };
  });
}
function seedWalk(from, to, step, wild) {
  for (let t = from + step; t <= to; t += step) {
    for (const sct of SECTORS) extra[sct.id] = macroReturn(sct.id, t - step, t);
    seedT = t; vmul = 0.5 * (1 + Math.min(2, 25 * Math.abs(marketReturn(t - step, t))));        // calmer than the live game, noisier in a crash
    advance(step / 60e3);
    if (wild && rnd() < wild * step / 86400e3) { const e = wildEvent(); e.t = t; land([e]); if (now - t < 72 * 3600e3) events.unshift(e); }
    for (const sl of slotsBetween(t - step, t)) { const e = slotEvent(sl); land([e]); if (now - t < 72 * 3600e3) events.unshift(e); }
    record(t);
  }
}
if (fresh) {
  // three pretend years of history: days first, then two hours, thirty minutes and five minutes toward now
  const D = 86400e3, t0 = now - 1095 * D;
  seeding = true;
  for (const c of back) st.p[c.t] = c.p * Math.exp(macroReturn(c.s, now, t0));     // start where the real curves say it was
  seedWalk(t0, now - 30 * D, D, 1.5);
  seedWalk(now - 30 * D, now - 7 * D, 2 * 3600e3, 1.5);
  seedWalk(now - 7 * D, now - D, 30 * 60e3, 1.5);
  seedWalk(now - D, now - 5 * 60e3, 5 * 60e3, 1.5);
  seeding = false; extra = {}; vmul = 1;
  // every company ends the past at its starting price, so the long charts finish where the game begins
  for (const c of back) { const f = c.p / st.p[c.t]; st.p[c.t] *= f; for (const m of [market, H.w, H.m, H.d]) { const a = m.c[c.t]; for (let j = 0; j < a.length; j++) a[j] = Math.round(a[j] * f); } }
  for (const m of [market, H.w, H.m, H.d]) for (const i of idx) { const a = m.c[i.t]; for (let j = 0; j < m.ts.length; j++) a[j] = Math.round(i.base * i.m.reduce((acc, t) => acc + m.c[t][j] / 100, 0) / i.p0 * 100); }
  syncIdx();
  st.t = now - 5 * 60e3; st.lastRun = now - 5 * 60e3;
  events.sort((a, b) => b.t - a.t);
}
// the scheduled events that came due since the last run, then this run's news
for (const sl of slotsBetween(st.lastRun || now, now)) newEvents.push(slotEvent(sl));
vmul = rnd() < 0.07 ? 3 + rnd() * 3 : rnd() < 0.2 ? 0.5 : 1;             // now and then one minute goes wild
advance(Math.max(1, (now - st.t) / 60e3));
land(newEvents);
st.t = now; st.lastRun = now;
record(now);

// ---- 3. write
events = newEvents.concat(events).slice(0, MAX_EVENTS);
st.seen = [...seen].slice(-2500);
write('market.json', market);
write('events.json', { t: now, events, upcoming: upcoming() });
write('state.json', st); write('hist.json', H);
bySector.index = idx.map(i => ({ t: i.t }));
for (const s of SECTORS.map(x => x.id).concat('index')) {
  const out = {}; for (const k of ['w', 'm', 'd']) { out[k] = { ts: H[k].ts, c: {} }; bySector[s].forEach(c => { out[k].c[c.t] = H[k].c[c.t]; }); }
  write('hist-' + s + '.json', out);
}
console.log(`tick ${new Date(now).toISOString()} points ${market.ts.length}/${H.w.ts.length}/${H.m.ts.length}/${H.d.ts.length} events ${newEvents.map(e => e.kind + ':' + e.head.slice(0, 60)).join(' | ') || 'none'}`);
