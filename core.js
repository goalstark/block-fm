// ===== 코어 v2: 월드 · 일정 · 하루 진행 · 대회 · 대표팀 · 유스 · 뉴스 · 이적 =====
const Eng = (typeof E !== 'undefined') ? E : require('./engine2.js');
const DD = (typeof DATA_CLUBS !== 'undefined') ? { DATA_CLUBS, EU, COUNTRIES, CODES, REG, SYM, HS_SUF, UN_SUF, COLS, NAT_KO, NAT_CODES, FLAG, FOREIGN, NGRP, SUR, G1, G2, P } : require('./data.js');
let G = null;
const SUBS_ALL = ['GK','CB','FB','DM','CM','AM','W','ST'];
const POS_KO = { GK:'골키퍼', CB:'센터백', FB:'풀백', DM:'수비형 MF', CM:'중앙 MF', AM:'공격형 MF', W:'윙어', ST:'스트라이커' };
const MIN_PLAN = { GK:2, CB:3, FB:3, DM:1, CM:2, AM:1, W:2, ST:2 };
const SQ = { p1:{GK:3,CB:4,FB:4,DM:2,CM:4,AM:2,W:4,ST:3}, p2:{GK:2,CB:4,FB:4,DM:2,CM:3,AM:2,W:3,ST:3}, youth:{GK:2,CB:3,FB:3,DM:1,CM:3,AM:2,W:3,ST:3}, univ:{GK:2,CB:4,FB:3,DM:2,CM:3,AM:2,W:3,ST:3} };
const TARGET = { p1:25, p2:23, youth:19, univ:21, ext:22 };
const DAY0 = Date.UTC(2026,0,1);
const dayOf = (y,m,d) => Math.round((Date.UTC(y,m-1,d)-DAY0)/86400000);
const dateOf = (n) => { const t = new Date(DAY0+n*86400000); return { y:t.getUTCFullYear(), m:t.getUTCMonth()+1, d:t.getUTCDate(), dow:t.getUTCDay() }; };
const DOW_KO = ['일','월','화','수','목','금','토'];
const fmtDate = (n) => { const t = dateOf(n); return `${t.y}.${String(t.m).padStart(2,'0')}.${String(t.d).padStart(2,'0')} (${DOW_KO[t.dow]})`; };
const nextDow = (n, dow) => { let x = n; while (dateOf(x).dow !== dow) x++; return x; };
function rnd() { G.rs = (G.rs + 0x6D2B79F5) | 0; let t = Math.imul(G.rs ^ G.rs >>> 15, 1 | G.rs); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const ri = (a,b) => a + Math.floor(rnd()*(b-a+1));
const pick = (arr) => arr[Math.floor(rnd()*arr.length)];
const gauss = () => { let u=0; for (let i=0;i<6;i++) u+=rnd(); return (u-3)/Math.sqrt(0.5); };
function shuffle(a) { for (let i=a.length-1;i>0;i--) { const j = Math.floor(rnd()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function jong(n){ const c = String(n).trim().slice(-1); const code = c.charCodeAt(0); if (code>=0xAC00 && code<=0xD7A3) return ((code-0xAC00)%28)!==0; return false; }
const iga = (n) => n + (jong(n)?'이':'가'), eul = (n) => n + (jong(n)?'을':'를'), eun = (n) => n + (jong(n)?'은':'는');
const clamp = (x,a,b) => Math.max(a, Math.min(b, x));
const NATK = (c) => (DD.FLAG[c] ? DD.FLAG[c] + ' ' : '') + (DD.NAT_KO[c] || c);

// ----- 이름 / 선수 / 클럽 -----
function nameFor(nat) {
  if (nat==='KOR') return pick(DD.SUR)+pick(DD.G1)+pick(DD.G2);
  if (nat==='JPN') return pick(DD.P.J1)+' '+pick(DD.P.J2);
  const g = DD.NGRP[nat] || 'L'; return pick(DD.P[g+'1'])+' '+pick(DD.P[g+'2']);
}
function tacticFor(style) {
  const t = Eng.defaultTactic();
  if (style==='wide') t.width=2; if (style==='direct') t.build=0; if (style==='tiki') { t.build=2; t.width=0; }
  if (style==='counter') { t.trans=2; t.line=0; } if (style==='press') { t.press=2; t.line=2; }
  return t;
}
const blankSt = () => ({ a:0, s:0, m:0, g:0, as:0, rs:0, y:0, r:0 });
function natFor(c) {
  if (c.kind==='youth') return rnd() < 0.04 ? pick(DD.FOREIGN) : c.nat;
  if (c.kind==='univ') return c.nat;
  const fr = c.kind==='ext' ? 0.5 : c.cc==='KOR' ? 0.07 : c.cc==='USA' ? 0.3 : 0.28;
  if (rnd() >= fr) return c.nat;
  let n = pick(DD.FOREIGN); if (n===c.nat) n = 'BRA'; return n;
}
function yOvr(c, age) { return c.kind==='univ' ? c.strength + (age-20)*1.5 : c.strength + (age-17)*3; }
function newPlayer(club, sub, ovr, style, age, nat) {
  const id = G.nextPid++;
  const p = Eng.makePlayer(rnd, id, sub, ovr, style, nameFor(nat));
  p.age = age; p.club = club ? club.id : null; p.nat = nat;
  let pot = p.ovr + Math.max(0, 26-age)*1.3 + rnd()*5; if (age<=18 && rnd()<0.08) pot += ri(6,14);
  p.pot = Math.min(95, Math.round(pot));
  p.birthM = ri(1,12); p.ct = { until: dateOf(G.day).y + ri(1,4), wage: Math.max(2, Math.round(Math.exp((p.ovr-50)*0.1)*3)) };
  p.hist = []; p.st = blankSt(); p.cst = blankSt(); p.nst = blankSt(); p.inj = 0; p.form = 6.0;
  G.players[id] = p; if (club) club.pl.push(id);
  return p;
}
function sqKey(c) { return c.kind==='pro' ? (c.tier===1?'p1':'p2') : c.kind==='ext' ? 'p2' : c.kind; }
function newFor(c, sub, i, intake) {
  let age, ovr;
  if (c.kind==='youth') { age = intake ? ri(15,16) : ri(15,18); ovr = yOvr(c,age) + gauss()*3 - i*1.5; }
  else if (c.kind==='univ') { age = intake ? ri(19,20) : ri(19,22); ovr = yOvr(c,age) + gauss()*3 - i*1.5; }
  else { age = intake ? ri(18,22) : ri(18,34); ovr = c.strength + gauss()*3 - i*2.2 - (intake?4:0) - (age<22 ? (22-age)*1.5 : age>31 ? (age-31)*0.8 : 0); }
  return newPlayer(c, sub, ovr, c.style, age, natFor(c));
}
function buildClubSquad(c) { const plan = SQ[sqKey(c)]; for (const sub of SUBS_ALL) for (let i=0;i<plan[sub];i++) newFor(c, sub, i, false); }
function ensureSquad(c) {
  const cnt = {}; for (const id of c.pl) { const p = G.players[id]; cnt[p.sub] = (cnt[p.sub]||0)+1; }
  for (const sub of SUBS_ALL) for (let i=(cnt[sub]||0); i<MIN_PLAN[sub]; i++) newFor(c, sub, 2, true);
  const tg = TARGET[sqKey(c)] || 22;
  while (c.pl.length < tg) newFor(c, pick(['CB','FB','CM','W','ST','CM','FB','AM','DM']), 2, true);
}
function addClub(o) {
  const c = { id: G.clubs.length, name:o.name, lg:o.lg, col:o.col, col2:o.col2, strength:o.strength, region:o.region||'', nat:o.nat, cc:o.cc, kind:o.kind||'pro', tier:o.tier, parent:o.parent, pl:[], style: pick(['balanced','balanced','balanced','wide','press']), budget: Math.round(Math.exp((o.strength-50)*0.11)*10) };
  c.tactic = tacticFor(c.style); G.clubs.push(c); return c;
}
const clubOf = (id) => id >= 10000 ? G.nt[id] : G.clubs[id];
const leagueOf = (lgId) => G.leagues.find(l => l.id===lgId);
const compById = (id) => G.comps.find(c => c.id===id);

// ----- 일정 -----
function circle(ids) {
  const t = ids.slice(); if (t.length % 2) t.push(null);
  const n = t.length, rounds = [];
  for (let r=0;r<n-1;r++) {
    const ms = [];
    for (let i=0;i<n/2;i++) { const a=t[i], b=t[n-1-i]; if (a!==null && b!==null) ms.push(r%2? [b,a]:[a,b]); }
    rounds.push(ms); t.splice(1,0,t.pop());
  }
  return rounds;
}
function buildSchedule(lg, startDay) {
  const base = circle(lg.clubs), rd = [];
  for (let k=0;k<lg.rounds;k++) for (const r of base) rd.push(k%2 ? r.map(([h,a])=>[a,h]) : r.map(m=>m.slice()));
  lg.gap = clamp(Math.floor((lg.cal==='E'?280:250)/(rd.length+(lg.split?7:0))),4,7);
  lg.rd = rd.map((ms,i) => ({ day: startDay + lg.gap*i, ms }));
  lg.ptr = 0; lg.half = 0; lg.sp = false; lg.spl = null; lg.table = {}; for (const id of lg.clubs) lg.table[id] = { p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 };
  lg.start = startDay;
}
function makeSplit(lg) {
  const tb = sortedTable(lg), half = Math.ceil(tb.length/2), top = tb.slice(0,half), bot = tb.slice(half);
  const A = circle(top), B = circle(bot), n = Math.max(A.length, B.length), last = lg.rd[lg.rd.length-1].day;
  for (let i=0;i<n;i++) lg.rd.push({ day: last + lg.gap*(i+1), ms: (A[i]||[]).concat(B[i]||[]) });
  lg.sp = true; lg.spl = { top, bot };
  addNews('league', `${lg.name} 스플릿 확정 — 상위 ${top.length}팀 ${top.slice(0,3).map(id=>clubOf(id).name).join(', ')} 등, 하위 ${bot.length}팀은 잔류 경쟁`, false);
}
function seasonStart(lg, year) { return lg.cal==='S' ? nextDow(dayOf(year,3,1), 6) : nextDow(dayOf(year,8,14), 6); }
const lgEnd = (lg) => lg.rd[lg.rd.length-1].day + 1;

// ----- 월드 생성 -----
function genNames(key, n, used) {
  const regs = shuffle(DD.REG[key].slice()), out = []; let i = 0;
  while (out.length < n && i < 2000) { const nm = regs[i%regs.length] + ' ' + pick(DD.SYM); if (!used.has(nm)) { used.add(nm); out.push(nm); } i++; }
  return out;
}
function mkLeague(id, name, cc, tier, rounds, cal, split) { const lg = { id, name, cc, tier, rounds, cal, split: !!split, clubs: [], hist: [] }; G.leagues.push(lg); return lg; }
function buildCountry(code, used) {
  const C = DD.COUNTRIES[code];
  const gen = {};
  const names1 = DD.EU[code] ? DD.EU[code].slice() : null;
  const need = code==='KOR' ? 0 : (names1 ? 0 : C.l1.n) + (C.l2 ? C.l2.n : 0);
  const pool = need ? genNames(code, need, used) : [];
  const tiers = [[1, C.l1], [2, C.l2]];
  for (const [tier, cfg] of tiers) {
    if (!cfg) continue;
    const lg = mkLeague(cfg.id, cfg.name, code, tier, cfg.rounds, C.cal, cfg.split);
    if (code==='KOR') {
      for (const d of DD.DATA_CLUBS) if (d[0]===cfg.id) { const c = addClub({ name:d[1], lg:cfg.id, col:d[2], col2:d[3], strength:d[4], region:d[5], nat:'KOR', cc:code, tier }); lg.clubs.push(c.id); }
    } else {
      const names = tier===1 && names1 ? names1 : pool.splice(0, cfg.n);
      names.forEach((nm,i) => { const col = pick(DD.COLS); const c = addClub({ name:nm, lg:cfg.id, col:col[0], col2:col[1], strength: cfg.mean - i*cfg.spread/names.length + gauss(), nat:code, cc:code, tier }); lg.clubs.push(c.id); });
    }
  }
  // 유스 · 학교 · 대학
  const l1 = leagueOf(C.l1.id), cal = C.cal;
  if (code==='KOR') {
    const hs = mkLeague('KHS', '고교·유스 리그', code, 'Y', 2, cal);
    for (const id of l1.clubs) { const p = G.clubs[id]; const c = addClub({ name:p.name+' U18', lg:'KHS', col:p.col, col2:p.col2, strength:p.strength-10, nat:code, cc:code, kind:'youth', tier:'Y', parent:id }); hs.clubs.push(c.id); }
    const regs = shuffle(DD.REG.KOR_HS.slice());
    for (let i=0;i<10;i++) { const nm = regs[i] + pick(DD.HS_SUF), col = pick(DD.COLS); const c = addClub({ name:nm, lg:'KHS', col:col[0], col2:col[1], strength: 41 + ri(0,11), nat:code, cc:code, kind:'youth', tier:'Y' }); hs.clubs.push(c.id); }
    const un = mkLeague('KUN', '대학 U리그', code, 'U', 2, cal);
    const ur = shuffle(DD.REG.KOR_UN.slice());
    for (let i=0;i<16;i++) { const nm = ur[i%ur.length] + pick(DD.UN_SUF), col = pick(DD.COLS); const c = addClub({ name:nm+(i>=ur.length?' 2':''), lg:'KUN', col:col[0], col2:col[1], strength: 52 + ri(0,6), nat:code, cc:code, kind:'univ', tier:'U' }); un.clubs.push(c.id); }
  } else {
    const y = mkLeague('Y'+code, C.name+' U18 리그', code, 'Y', 2, cal);
    for (const id of l1.clubs) { const p = G.clubs[id]; const c = addClub({ name:p.name+' U18', lg:y.id, col:p.col, col2:p.col2, strength:p.strength-10, nat:code, cc:code, kind:'youth', tier:'Y', parent:id }); y.clubs.push(c.id); }
  }
}
function newWorld(seed, sel) {
  sel = (sel && sel.length) ? sel : ['KOR','ENG','ESP','ITA','GER'];
  G = { v:2, rs: seed|0, day: dayOf(2026,8,1), nextPid: 1, clubs: [], players: {}, leagues: [], comps: [], news: [], inbox: [], me: null, hall: [], flags: {}, fx: {}, nt: {}, sel, compHist: [], ntLog: [], lastRes: {}, fa: [] };
  const used = new Set();
  for (const code of sel) buildCountry(code, used);
  // 대륙대회 보충용 외부 클럽
  for (const cont of ['EU','AS']) {
    const cs = sel.filter(c => DD.COUNTRIES[c].cont===cont && DD.COUNTRIES[c].slots>0); if (!cs.length) continue;
    const slots = cs.reduce((s,c)=>s+DD.COUNTRIES[c].slots,0), need = Math.max(0, 16-slots);
    const nm = genNames(cont==='EU'?'EXT_EU':'EXT_AS', need, used);
    nm.forEach(n => { const col = pick(DD.COLS); addClub({ name:n, lg:'EXT', col:col[0], col2:col[1], strength: cont==='EU' ? 60+ri(0,8) : 54+ri(0,7), nat:pick(cont==='EU'?['FRA','POR','NED','BEL','CRO','SRB','DEN','SUI']:['CHN','AUS','IRN','JPN','KOR','SAU']), cc:cont, kind:'ext', tier:0 }); });
  }
  for (const c of G.clubs) buildClubSquad(c);
  for (const lg of G.leagues) { const y = lg.cal==='S' ? 2027 : 2026; buildSchedule(lg, seasonStart(lg, y)); lg.season = y; }
  for (const code of sel) G.flags['pr_'+code] = {};
  buildComps('E', 2026);
  addNews('world','2026/27 시즌, 월드가 열렸습니다.',false);
  while (G.day < dayOf(2027,1,1)) step(true);
  return G;
}

// ----- 주인공 -----
function createMe(opts) {
  const club = G.clubs[opts.club] || G.clubs.find(c => c.kind==='pro' && c.tier===2) ;
  const age = opts.age || 19, sub = opts.pos || 'ST';
  const ovr = club.kind==='pro' ? club.strength - 1 : club.strength - 8 + (age-15)*2;
  const p = newPlayer(club, sub, ovr, 'balanced', age, opts.nat || 'KOR');
  p.name = opts.name || '김도윤'; p.look = opts.look || { skin:'tan', hair:'brown', style:'sidepart' };
  p.pot = Math.max(78, p.ovr + (26-age)*2.6) + ri(0,6); p.pot = Math.round(Math.min(95, p.pot));
  p.ct = { until: dateOf(G.day).y + 3, wage: club.kind==='pro' ? 12 : 0 }; p.me = true; p.trust = 55; p.mor = 70; p.fat = 10; p.plan = 'shoot'; p.acc = {}; p.log = []; p.fame = 5; p.offers = []; p.goalsAll = 0; p.callup = null;
  G.me = p.id; G.mePlan = 'shoot';
  addNews('me', `${iga(club.name)} ${club.kind==='pro'?'신인':'유망주'} ${p.name}(${age}, ${POS_KO[sub]})과 계약했습니다.`, false);
  return p;
}
const me = () => G.players[G.me];
const stageOf = (c) => c.kind==='pro' ? '프로' : c.kind==='youth' ? (c.cc==='KOR'?'고교·유스':'유스') : c.kind==='univ' ? '대학' : '';
// ----- 뉴스 -----
function addNews(type, text, big, extra) {
  G.news.unshift(Object.assign({ d: G.day, type, text, big: !!big }, extra||{}));
  if (G.news.length > 500) G.news.length = 500;
}
// ----- 경기 -----
function availableSquad(c, excludeMe) {
  const arr = [];
  for (const id of c.pl) { const p = G.players[id]; if (!p || p.inj > 0) continue; if (excludeMe && p.me) continue; arr.push(p); }
  return arr.length >= 14 ? arr : c.pl.map(id => G.players[id]).filter(p => p && !(excludeMe && p.me));
}
const STARTERS = { GK:1, CB:2, FB:2, CM:2, W:2, ST:2 };
function startersOf(squad) {
  const by = {}; for (const p of squad) (by[p.sub] = by[p.sub]||[]).push(p);
  const out = [];
  for (const sub of Object.keys(by)) by[sub].sort((a,b)=>b.ovr-a.ovr);
  for (const sub of Object.keys(STARTERS)) {
    let pool = (by[sub]||[]).slice(); if (sub==='CM') pool = pool.concat(by.DM||[], by.AM||[]).sort((a,b)=>b.ovr-a.ovr);
    for (let i=0;i<STARTERS[sub] && i<pool.length;i++) out.push(pool[i]);
  }
  return out;
}
const SC_W = { ST:5, W:3, AM:3, CM:1.5, DM:0.7, FB:0.8, CB:0.7, GK:0 };
const AS_W = { ST:1.2, W:3, AM:3.5, CM:2, DM:0.8, FB:1.8, CB:0.3, GK:0.05 };
function wpick(list, w, excl) {
  let tot = 0; const ws = list.map(p => { const x = p===excl ? 0 : (w[p.sub]||1)*Math.pow(p.ovr/60, 2); tot += x; return x; });
  let r = rnd()*tot; for (let i=0;i<list.length;i++) { r -= ws[i]; if (r<=0) return list[i]; } return list[0];
}
function record(T, h, a, gh, ga) {
  const H = T[h], A = T[a];
  H.p++; A.p++; H.gf+=gh; H.ga+=ga; A.gf+=ga; A.ga+=gh;
  if (gh>ga) { H.w++; A.l++; H.pts+=3; } else if (gh<ga) { A.w++; H.l++; A.pts+=3; } else { H.d++; A.d++; H.pts++; A.pts++; }
}
function genEvents(club, goals, starters, bench) {
  const ev = [];
  for (let i=0;i<goals;i++) {
    const sc = wpick(starters.concat(bench.slice(0,3)), SC_W);
    const asp = rnd() < 0.72 ? wpick(starters, AS_W, sc) : null;
    ev.push({ min: ri(2,90), side: club.id, sc, as: asp });
  }
  return ev.sort((a,b)=>a.min-b.min);
}
function applyStats(club, starters, bench, gF, gA, evs, key) {
  const rs = {};
  for (const p of starters) { const s = p[key]; s.a++; s.s++; s.m += 90; rs[p.id] = 6.0 + gauss()*0.35 + (gF-gA)*0.12 + (p.sub==='GK'||p.sub==='CB'||p.sub==='FB' ? (gA===0 ? 0.45 : -0.1*gA) : 0); }
  const subs = bench.filter(()=>rnd()<0.35).slice(0,3);
  for (const p of subs) { const s = p[key]; s.a++; s.m += ri(10,35); rs[p.id] = 5.9 + gauss()*0.3; }
  for (const e of evs) { if (rs[e.sc.id]!==undefined) rs[e.sc.id] += 0.9; e.sc[key].g++; if (e.as) { e.as[key].as++; if (rs[e.as.id]!==undefined) rs[e.as.id] += 0.5; } }
  for (const id in rs) { const p = G.players[id]; const r = clamp(rs[id],4,10); p[key].rs += r; p.form = clamp(p.form*0.8 + r*0.2, 4, 9); }
  for (const p of starters) {
    if (rnd() < 0.006) { p.inj = pick([3,5,7,10,14,21,30,45,70]); if (club.kind==='pro' && p.ovr >= club.strength+2 && !p.me) addNews('injury', `${club.name}의 ${iga(p.name)} 부상으로 ${p.inj}일 결장합니다.`, p.ovr>=75); }
    if (rnd() < 0.07) p[key].y++; if (rnd() < 0.004) p[key].r++;
  }
  return rs;
}
const KEYOF = { lg:'st', cup:'cst', cont:'cst', po:'cst', nt:'nst' };
function simMatch(ctx, h, a) {
  const ch = clubOf(h), ca = clubOf(a);
  const sqH = availableSquad(ch, true), sqA = availableSquad(ca, true);
  const neutral = ctx.t==='po' || (ctx.t==='cont' && ctx.fin);
  const o = Eng.simulate(rnd, { squad: sqH, tactic: ch.tactic }, { squad: sqA, tactic: ca.tactic }, { homeA: !neutral });
  return finishMatch(ctx, h, a, o.gA, o.gB, sqH, sqA);
}
function finishMatch(ctx, h, a, gh, ga, sqH, sqA, mine) {
  const ch = clubOf(h), ca = clubOf(a), key = KEYOF[ctx.t];
  const stH = startersOf(sqH), stA = startersOf(sqA);
  const bH = sqH.filter(p=>!stH.includes(p)).sort((x,y)=>y.ovr-x.ovr), bA = sqA.filter(p=>!stA.includes(p)).sort((x,y)=>y.ovr-x.ovr);
  const evH = (mine && mine.evH) || genEvents(ch, gh, stH, bH), evA = (mine && mine.evA) || genEvents(ca, ga, stA, bA);
  applyStats(ch, stH, bH, gh, ga, evH, key); applyStats(ca, stA, bA, ga, gh, evA, key);
  const hn = ch.name, an = ca.name;
  const hat = (evs) => { const c = {}; for (const e of evs) c[e.sc.id] = (c[e.sc.id]||0)+1; for (const id in c) if (c[id]>=3) return G.players[id]; };
  const ht = hat(evH) || hat(evA);
  const where = ctx.t==='lg' ? '' : ctx.t==='nt' ? '' : '';
  if (ht) addNews(ctx.t==='nt'?'nat':'match', `${ht.name} 해트트릭! ${hn} ${gh}-${ga} ${an}`, true);
  else if (Math.abs(gh-ga)>=5) addNews(ctx.t==='nt'?'nat':'match', `${gh>ga?hn:an}, ${Math.max(gh,ga)}-${Math.min(gh,ga)} 대승`, false);
  else if (ctx.t!=='nt' && (((gh>ga) && ch.strength+6<ca.strength) || ((ga>gh) && ca.strength+6<ch.strength))) addNews('match', `이변! ${iga(gh>ga?hn:an)} ${eul(gh>ga?an:hn)} ${Math.max(gh,ga)}-${Math.min(gh,ga)}로 꺾었습니다`, false);
  G.lastRes[h] = G.lastRes[a] = { h, a, gh, ga, day: G.day };
  const res = { ctx, h, a, gh, ga, evH, evA, day: G.day };
  afterMatch(ctx, h, a, gh, ga, evH, evA);
  return res;
}
function afterMatch(ctx, h, a, gh, ga, evH, evA) {
  if (ctx.t==='lg') { const lg = leagueOf(ctx.id); if (lg) record(lg.table, h, a, gh, ga); return; }
  if (ctx.t==='nt') { const th = clubOf(h), ta = clubOf(a); G.ntLog.unshift(`${th.name} ${gh}-${ga} ${ta.name}`); if (G.ntLog.length>60) G.ntLog.length=60; if (th.cat==='A' && (gh+ga>=4 || DD.COUNTRIES[th.nat] || DD.COUNTRIES[ta.nat])) addNews('nat', `A매치 — ${th.nat?NATK(th.nat):''} ${gh}-${ga} ${NATK(ta.nat)}`, false); return; }
  const comp = compById(ctx.id); if (!comp) return;
  for (const e of evH.concat(evA)) comp.sc[e.sc.id] = (comp.sc[e.sc.id]||0)+1;
  compResult(comp, ctx, h, a, gh, ga);
}
// ----- 대회 -----
const ROUND_N = { 2:'결승', 4:'준결승', 8:'8강', 16:'16강', 32:'32강', 64:'64강', 128:'128강' };
function mkComp(id, name, kind, cc, season) { G.comps = G.comps.filter(c => c.id!==id); const c = { id, name, kind, cc, season, stage:'KO', ties:[], round:0, groups:[], alive:[], rdays:[], win:null, sc:{}, rl:'' }; G.comps.push(c); return c; }
function addFx(day, h, a, ctx) { (G.fx[day] = G.fx[day] || []).push({ ctx, h, a }); }
function koRound(comp, pairs) {
  let pool;
  if (!pairs) { pool = comp.round===0 && comp.byes && comp.byes.length ? comp.alive.filter(x=>!comp.byes.includes(x)) : comp.alive.slice(); shuffle(pool); pairs = []; for (let i=0;i+1<pool.length;i+=2) pairs.push([pool[i],pool[i+1]]); }
  const tot = pairs.length*2 + (comp.round===0 && comp.byes ? comp.byes.length : 0);
  comp.rl = ROUND_N[tot] || (tot+'강');
  comp.ties = pairs.map(([a,b]) => ({ a, b, legs:[], w:null }));
  const days = comp.rdays[comp.round] || comp.rdays[comp.rdays.length-1];
  comp.ties.forEach((t,i) => {
    t.n = days.length;
    days.forEach((d,l) => { const day = Math.max(d, G.day+1); const home = l%2===0 ? t.a : t.b, away = l%2===0 ? t.b : t.a; addFx(day, home, away, { t:comp.kind, id:comp.id, ti:i, leg:l, fin: comp.kind==='cont' && days.length===1 }); });
  });
}
function compResult(comp, ctx, h, a, gh, ga) {
  if (comp.stage==='G' && ctx.g!==undefined) {
    const g = comp.groups[ctx.g]; record(g.table, h, a, gh, ga); comp.left--;
    if (comp.left===0) startContKO(comp);
    return;
  }
  const t = comp.ties[ctx.ti]; if (!t) return;
  t.legs[ctx.leg] = { h, a, gh, ga };
  if (t.legs.filter(Boolean).length < t.n) return;
  let sa = 0, sb = 0; for (const L of t.legs) { if (L.h===t.a) { sa += L.gh; sb += L.ga; } else { sb += L.gh; sa += L.ga; } }
  t.sa = sa; t.sb = sb;
  if (sa!==sb) t.w = sa>sb ? t.a : t.b;
  else { t.pen = true; const pa = clamp(0.5 + (clubOf(t.a).strength - clubOf(t.b).strength)*0.004, 0.3, 0.7); t.w = rnd()<pa ? t.a : t.b; }
  if (comp.ties.every(x => x.w!==null)) advanceRound(comp);
}
function advanceRound(comp) {
  const winners = comp.ties.map(t => t.w);
  comp.last = comp.ties;
  if (winners.length===1 && comp.ties.length===1) { return finishComp(comp, winners[0]); }
  comp.alive = winners.concat(comp.round===0 && comp.byes && comp.kind==='cup' ? comp.byes : []);
  comp.round++;
  if (comp.kind==='cont') { // 준결승·결승은 직전 승자끼리 추첨
    const w = shuffle(winners.slice()), pairs = []; for (let i=0;i+1<w.length;i+=2) pairs.push([w[i], w[i+1]]); koRound(comp, pairs);
  } else if (comp.kind==='po') {
    koRound(comp, [[winners[0], winners[1]]]);
  } else koRound(comp);
}
function finishComp(comp, champ) {
  comp.win = champ; comp.stage = 'END';
  const c = clubOf(champ), lastT = comp.ties[0];
  G.compHist.push({ id: comp.id, name: comp.name, season: comp.season, champ });
  if (comp.kind==='po') { G.flags['pr_'+comp.cc].po = champ; addNews('league', `승격 플레이오프 — ${c.name} 승리, 승격 확정`, true); tryPromo(comp.cc); return; }
  const top = Object.keys(comp.sc).map(id => [G.players[id], comp.sc[id]]).filter(x=>x[0]).sort((a,b)=>b[1]-a[1])[0];
  addNews('cup', `${comp.name} 우승 — ${c.name}${top?` (득점왕 ${top[0].name} ${top[1]}골)`:''}`, true);
  for (const id of c.pl) { const p = G.players[id]; if (p && p.me) addNews('me', `${p.name}, ${comp.name} 우승!`, true, { me:true }); }
}
function buildComps(cal, year) {
  for (const code of G.sel) { const C = DD.COUNTRIES[code]; if (C.cal===cal) buildCup(code); }
  if (cal==='E') for (const cont of ['EU','AS']) buildCont(cont, year);
}
function buildCup(cc) {
  const C = DD.COUNTRIES[cc], l1 = leagueOf(C.l1.id), l2 = C.l2 ? leagueOf(C.l2.id) : null;
  const teams = l1.clubs.concat(l2 ? l2.clubs : []).sort((a,b) => G.clubs[b].strength - G.clubs[a].strength);
  const n = teams.length; let size = 1; while (size < n) size *= 2;
  const comp = mkComp('CUP_'+cc, C.cup, 'cup', cc, l1.season);
  comp.alive = teams.slice(); comp.byes = teams.slice(0, size-n);
  const rounds = Math.round(Math.log2(size));
  const used = new Set(); for (const lg of [l1,l2]) if (lg) for (const r of lg.rd) { used.add(r.day); used.add(r.day+1); }
  const st = l1.start + 12, en = lgEnd(l1) - 12;
  for (let i=0;i<rounds;i++) { const target = Math.round(st + (en-st) * (rounds>1 ? i/(rounds-1) : 1)); let d = nextDow(target, 3); while (used.has(d)) d += 7; comp.rdays.push([d]); }
  koRound(comp);
}
function contTeams(cont) {
  const rank = [];
  for (const code of G.sel) { const C = DD.COUNTRIES[code]; if (C.cont!==cont || !C.slots) continue; const lg = leagueOf(C.l1.id);
    const ids = lg.ptr >= lg.rd.length*0.6 ? sortedTable(lg) : lg.last ? lg.last.table.map(x=>x.id) : lg.clubs.slice().sort((a,b)=>G.clubs[b].strength-G.clubs[a].strength);
    ids.slice(0, C.slots).forEach((id,i) => rank.push([i, -G.clubs[id].strength, id])); }
  if (!rank.length) return null;
  rank.sort((a,b)=>a[0]-b[0] || a[1]-b[1]);
  const t = rank.slice(0,16).map(x=>x[2]);
  const ext = shuffle(G.clubs.filter(c=>c.kind==='ext' && c.cc===cont).map(c=>c.id));
  while (t.length < 16 && ext.length) t.push(ext.pop());
  return t.length>=8 ? t : null;
}
const CONT_NAME = { EU:'유럽 챔피언스컵', AS:'아시아 챔피언스' };
function buildCont(cont, year) {
  const teams = contTeams(cont); if (!teams) return;
  const sorted = teams.slice().sort((a,b)=>G.clubs[b].strength-G.clubs[a].strength);
  const ng = Math.floor(sorted.length/4);
  const comp = mkComp('CONT_'+cont, CONT_NAME[cont], 'cont', cont, `${year}/${String((year+1)%100).padStart(2,'0')}`);
  comp.stage = 'G'; comp.groups = [];
  for (let g=0; g<ng; g++) comp.groups.push({ teams:[], table:{} });
  for (let pot=0; pot<4; pot++) { const p = shuffle(sorted.slice(pot*ng, pot*ng+ng)); p.forEach((id,g) => { comp.groups[g].teams.push(id); comp.groups[g].table[id] = { p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 }; }); }
  const gd = [[9,15],[9,29],[10,20],[11,3],[11,24],[12,8]].map(([m,d]) => nextDow(dayOf(year,m,d), 2));
  comp.left = 0;
  for (const [gi,g] of comp.groups.entries()) {
    const base = circle(g.teams), md = base.concat(base.map(r => r.map(([h,a]) => [a,h])));
    md.forEach((ms, i) => ms.forEach(([h,a]) => { addFx(gd[i], h, a, { t:'cont', id:comp.id, g:gi }); comp.left++; }));
  }
  comp.rdays = [[nextDow(dayOf(year+1,2,16),2), nextDow(dayOf(year+1,3,9),2)], [nextDow(dayOf(year+1,4,6),2), nextDow(dayOf(year+1,4,20),2)], [nextDow(dayOf(year+1,5,30),6)]];
  comp.rl = '조별리그';
}
function startContKO(comp) {
  const rk = comp.groups.map(g => g.teams.slice().sort((x,y)=>{ const a=g.table[x], b=g.table[y]; return (b.pts-a.pts)||((b.gf-b.ga)-(a.gf-a.ga))||(b.gf-a.gf)||(x-y); }));
  comp.gres = rk; comp.stage = 'KO'; comp.round = 0;
  const pairs = []; const n = rk.length;
  for (let i=0;i<n;i+=2) { pairs.push([rk[i][0], rk[i+1][1]]); pairs.push([rk[i+1][0], rk[i][1]]); }
  koRound(comp, pairs);
  addNews('cup', `${comp.name} 조별리그 종료 — 8강 진출: ${pairs.flat().slice(0,4).map(id=>clubOf(id).name).join(', ')} 등`, false);
}
// 승격 플레이오프
function buildPO(cc) {
  const C = DD.COUNTRIES[cc], l2 = leagueOf(C.l2.id), tb = l2.last.table.map(x=>x.id), a = C.swap.auto;
  const t = tb.slice(a, a+4); if (t.length<4) { G.flags['pr_'+cc].po = null; return; }
  const comp = mkComp('PO_'+cc, `승격 플레이오프(${C.name})`, 'po', cc, l2.last.season);
  const d1 = G.day + 3, d2 = G.day + 8; comp.rdays = [[d1],[d2]]; comp.alive = t;
  koRound(comp, [[t[0],t[3]],[t[1],t[2]]]);
  G.flags['pr_'+cc].po = undefined; G.flags['pr_'+cc].poOn = true;
}
function tryPromo(cc) {
  const f = G.flags['pr_'+cc], C = DD.COUNTRIES[cc]; if (!f || !C.l2) return;
  if (!f.d1 || !f.d2) return; if (f.poOn && f.po===undefined) return;
  const l1 = leagueOf(C.l1.id), l2 = leagueOf(C.l2.id), a = C.swap.auto;
  const ups = l2.last.table.slice(0,a).map(x=>x.id); if (f.po!==undefined && f.po!==null && !ups.includes(f.po)) ups.push(f.po);
  const downs = l1.last.table.slice(-ups.length).map(x=>x.id);
  l1.clubs = l1.clubs.filter(x => !downs.includes(x)).concat(ups); l2.clubs = l2.clubs.filter(x => !ups.includes(x)).concat(downs);
  for (const id of downs) { G.clubs[id].lg = l2.id; G.clubs[id].tier = 2; } for (const id of ups) { G.clubs[id].lg = l1.id; G.clubs[id].tier = 1; }
  G.flags['pr_'+cc] = {};
  buildSchedule(l1, l1.start); buildSchedule(l2, l2.start);
  addNews('league', `${C.name} 승강 확정 — 승격 ${ups.map(id=>G.clubs[id].name).join(', ')} / 강등 ${downs.map(id=>G.clubs[id].name).join(', ')}`, true);
  for (const id of ups.concat(downs)) { const m = G.me!==null ? me() : null; if (m && m.club===id) addNews('me', `${G.clubs[id].name}, ${ups.includes(id)?'승격':'강등'}했습니다 (${leagueOf(G.clubs[id].lg).name})`, true, { me:true }); }
}
// ----- 대표팀 -----
const NT_CATS = [['A',99,17],['U23',23,15],['U20',20,15],['U17',17,14],['U15',15,13]];
const NT_WIN = [[3,24],[6,5],[9,4],[10,9],[11,13]];
function pickSquad(list) {
  const Q = { GK:2, CB:3, FB:3, DM:2, CM:3, AM:2, W:3, ST:3 }, out = [], cnt = {};
  for (const p of list) if ((cnt[p.sub]||0) < Q[p.sub]) { out.push(p); cnt[p.sub] = (cnt[p.sub]||0)+1; }
  for (const p of list) { if (out.length>=23) break; if (!out.includes(p)) out.push(p); }
  return out;
}
function callups() {
  G.nt = {}; let seq = 10000; const by = {};
  for (const id in G.players) { const p = G.players[id]; if (p.retired || p.club===null || p.inj>0) continue; (by[p.nat] = by[p.nat]||[]).push(p); }
  const teams = {}; const m = G.me!==null ? me() : null; if (m) m.callup = null;
  for (const nat in by) {
    const all = by[nat].sort((a,b)=>b.ovr-a.ovr); if (all.length < 20) continue; const used = new Set();
    for (const [cat, maxA, minA] of NT_CATS) {
      const el = all.filter(p => p.age<=maxA && p.age>=minA && !used.has(p.id));
      const sq = pickSquad(el); if (sq.length < 16 || sq.filter(p=>p.sub==='GK').length < 1) continue;
      sq.forEach(p => used.add(p.id));
      const col = DD.COLS[(nat.charCodeAt(0)*7 + nat.charCodeAt(1)*3) % DD.COLS.length];
      const st = startersOf(sq), str = st.reduce((s,p)=>s+p.ovr,0)/Math.max(1,st.length);
      const t = { id: seq++, name: `${NATK(nat)} ${cat==='A'?'대표팀':cat+' 대표팀'}`, nat, cat, kind:'nt', lg:'NT', col:col[0], col2:col[1], strength: str, pl: sq.map(p=>p.id), tactic: Eng.defaultTactic(), style:'balanced', budget:0 };
      G.nt[t.id] = t; (teams[cat] = teams[cat]||[]).push(t.id);
      if (m && sq.some(p=>p.me)) { m.callup = { id:t.id, cat, nat, name:t.name }; G.inbox.unshift({ d:G.day, text:`${m.name}, ${t.name}에 소집되었습니다!` }); addNews('me', `${m.name}, ${t.name} 소집`, true, { me:true }); }
    }
  }
  for (const cat in teams) for (let r=0;r<2;r++) { const ids = shuffle(teams[cat].slice()); for (let i=0;i+1<ids.length;i+=2) { const day = G.day + 1 + r*2; addFx(day, ids[i], ids[i+1], { t:'nt', cat }); } }
  const a = Object.values(G.nt).filter(t=>t.cat==='A');
  if (a.length) addNews('nat', `A매치 기간 — ${a.length}개국 대표팀 소집`, false);
}
// ----- 하루 진행 -----
const pendingFinish = [];
function mineIn(id) { const mp = me(); if (!mp) return false; if (id >= 10000) { const t = G.nt[id]; return !!t && t.pl.includes(mp.id); } return mp.club===id; }
function step(silent) {
  G.day++;
  const t = dateOf(G.day);
  G.pendingMine = null;
  if (t.m===8 && t.d===1 && G.day > dayOf(2026,8,1)) buildComps('E', t.y);
  if (t.m===2 && t.d===1) buildComps('S', t.y);
  if (NT_WIN.some(w => w[0]===t.m && w[1]===t.d)) callups();
  if (G.day > 0 && Object.keys(G.nt).length) { const w = NT_WIN.find(w => { const s = dayOf(t.y, w[0], w[1]); return G.day === s+5; }); if (w) { G.nt = {}; if (G.me!==null) me().callup = null; } }
  const fixtures = [];
  for (const lg of G.leagues) {
    const r = lg.rd[lg.ptr]; if (!r) continue;
    if (G.day !== r.day + lg.half) continue;
    for (const [h,a] of r.ms.filter((m,i)=> (i%2)===lg.half)) fixtures.push({ ctx:{ t:'lg', id:lg.id }, h, a });
    if (lg.half===0) lg.half = 1; else { lg.half = 0; lg.ptr++; if (lg.ptr >= lg.rd.length) { if (lg.split && !lg.sp) makeSplit(lg); else pendingFinish.push(lg); } }
  }
  const fl = G.fx[G.day]; if (fl) { for (const f of fl) fixtures.push(f); delete G.fx[G.day]; }
  for (const f of fixtures) {
    if (G.me!==null && !silent && !G.pendingMine && (mineIn(f.h) || mineIn(f.a))) { G.pendingMine = { ctx:f.ctx, h:f.h, a:f.a }; continue; }
    simMatch(f.ctx, f.h, f.a);
  }
  if (!G.pendingMine) flushFinish();
  for (const id in G.players) { const p = G.players[id]; if (p.inj>0) p.inj--; }
  if (G.me!==null) { trainingDay(); gradDeadline(t); }
  market(t);
  if (t.m===1 && t.d===1) yearEnd();
  if (!silent) { if (t.dow===1) weeklyNews(); dailyNews(t); }
  return G.pendingMine;
}
function flushFinish() { while (pendingFinish.length) finishSeason(pendingFinish.shift()); }
function sortedTable(lg) {
  const cmp = (x,y)=>{ const a=lg.table[x], b=lg.table[y]; return (b.pts-a.pts)||((b.gf-b.ga)-(a.gf-a.ga))||(b.gf-a.gf)||(x-y); };
  if (lg.sp && lg.spl) return lg.spl.top.slice().sort(cmp).concat(lg.spl.bot.slice().sort(cmp));
  return lg.clubs.slice().sort(cmp);
}
function topList(lg, key, n) {
  const out = [];
  for (const id of lg.clubs) for (const pid of G.clubs[id].pl) { const p = G.players[pid]; if (p.st[key] > 0) out.push(p); }
  return out.sort((a,b)=>b.st[key]-a.st[key] || b.st.rs/(b.st.a||1)-a.st.rs/(a.st.a||1)).slice(0,n);
}
function ratingList(lg, n, minApps) {
  const out = [];
  for (const id of lg.clubs) for (const pid of G.clubs[id].pl) { const p = G.players[pid]; if (p.st.a >= minApps) out.push(p); }
  return out.sort((a,b)=>b.st.rs/b.st.a - a.st.rs/a.st.a).slice(0,n);
}
function seasonLabel(lg) { return lg.cal==='S' ? String(lg.season) : `${lg.season}/${String((lg.season+1)%100).padStart(2,'0')}`; }
function pushHist(p, lg) {
  if (p.st.a > 0 || p.cst.a > 0 || p.me) p.hist.push([ seasonLabel(lg), p.club, lg.id, p.st.a, p.st.s, p.st.g, p.st.as, p.st.a ? Math.round(p.st.rs/p.st.a*10)/10 : 0, p.st.m, p.st.y, p.st.r, p.cst.a, p.cst.g ]);
  p.st = blankSt(); p.cst = blankSt();
}
function finishSeason(lg) {
  const tb = sortedTable(lg), champ = G.clubs[tb[0]];
  const ts = topList(lg,'g',1)[0], mvp = ratingList(lg,1,Math.max(8,Math.floor(lg.rd.length/3)))[0];
  lg.hist.push({ season: seasonLabel(lg), champ: tb[0], top: ts ? [ts.name, ts.st.g, ts.club] : null, mvp: mvp ? [mvp.name, mvp.club] : null, table: tb.map(id => [id, lg.table[id].pts]) });
  const big = lg.tier===1 || lg.tier===2;
  addNews('season', `${lg.name} ${seasonLabel(lg)} 종료 — 우승 ${champ.name}${ts?`, 득점왕 ${ts.name}(${ts.st.g}골)`:''}${mvp?`, MVP ${mvp.name}`:''}`, lg.tier===1);
  for (const id of lg.clubs) for (const pid of G.clubs[id].pl) pushHist(G.players[pid], lg);
  lg.last = { season: seasonLabel(lg), table: tb.map(id => Object.assign({ id }, lg.table[id])) };
  const mm = G.me!==null ? me() : null;
  if (mm && lg.clubs.includes(mm.club)) { const pos = tb.indexOf(mm.club)+1; addNews('me', `${lg.name} ${seasonLabel(lg)} 시즌 종료 — ${G.clubs[mm.club].name} ${pos}위`, false, { me:true }); }
  const cc = lg.cc, C = DD.COUNTRIES[cc];
  if (lg.tier===1) { G.flags['pr_'+cc].d1 = true; if (!C.l2) G.flags['pr_'+cc].d2 = true; }
  if (lg.tier===2) { G.flags['pr_'+cc].d2 = true; if (C.swap.po) buildPO(cc); }
  lg.season += 1; buildSchedule(lg, seasonStart(lg, lg.season));
  if (lg.tier===1 || lg.tier===2) tryPromo(cc);
}
// ----- 연말: 성장·나이·계약·은퇴·졸업 -----
function dropPlayer(p) { p.retired = true; if (p.club!==null) { const c = G.clubs[p.club]; c.pl = c.pl.filter(x=>x!==p.id); p.club = null; } if (p.ovr < 66) delete G.players[p.id]; }
function graduateAI(p) {
  const c = G.clubs[p.club]; c.pl = c.pl.filter(x=>x!==p.id); pushHistPartial(p, c); p.club = null;
  const pros = G.clubs.filter(x => x.kind==='pro' && x.cc===c.cc && x.pl.length<31);
  let dest = null;
  if (c.kind==='youth') {
    if (c.cc==='KOR' && p.ovr < 63 && rnd() < 0.6) dest = pick(G.clubs.filter(x=>x.kind==='univ' && x.pl.length<27));
    if (!dest && c.parent!==undefined && G.clubs[c.parent].pl.length<31 && p.ovr >= G.clubs[c.parent].strength-14 && rnd()<0.6) dest = G.clubs[c.parent];
  }
  if (!dest) { const ok = pros.filter(x => x.strength-14 <= p.ovr); if (ok.length) dest = pick(ok); }
  if (!dest) { p.retired = true; if (p.ovr < 66) delete G.players[p.id]; return; }
  dest.pl.push(p.id); p.club = dest.id; p.ct = { until: dateOf(G.day).y + ri(2,4), wage: dest.kind==='pro' ? Math.max(2, Math.round(Math.exp((p.ovr-50)*0.1)*3)) : 0 };
}
function yearEnd() {
  const y = dateOf(G.day).y;
  for (const id in G.players) {
    const p = G.players[id]; if (p.retired) continue; p.age++;
    let base = p.age<=21?3.2 : p.age<=24?1.5 : p.age<=28?0.2 : p.age<=31?-0.6 : -1.6;
    if (p.me) base *= 0.55;
    let d = Math.round(base + gauss()*(p.me?0.6:1.2)); if (p.ovr+d > p.pot) d = Math.max(0, p.pot - p.ovr);
    if (d!==0) { for (const k in p.a) p.a[k] = clamp(p.a[k] + d + (rnd()<0.3? ri(-1,1):0), 20, 97); Eng.finalize(p); }
    if (!p.me && p.age >= 34 && p.club!==null && rnd() < (p.age-33)*0.18) retire(p);
  }
  for (const c of G.clubs) c.pl = c.pl.filter(id => G.players[id] && !G.players[id].retired);
  // 유스·대학 졸업
  for (const c of G.clubs) {
    if (c.kind!=='youth' && c.kind!=='univ') continue; const lim = c.kind==='youth' ? 18 : 22;
    for (const id of c.pl.slice()) { const p = G.players[id]; if (p.me || p.age<=lim) continue; graduateAI(p); }
  }
  // 계약 만료 (프로만)
  for (const id in G.players) {
    const p = G.players[id]; if (p.retired || p.me || p.club===null) continue; if (G.clubs[p.club].kind!=='pro') continue;
    if (p.ct.until <= y) { if (rnd() < 0.85) { p.ct.until = y + ri(1,4); } else release(p); }
  }
  for (const c of G.clubs) ensureSquad(c);
  if (G.me!==null) {
    const m = me(), c = G.clubs[m.club]; addNews('me', `${m.name}, ${m.age}세가 되었습니다. 종합 ${m.ovr} (잠재 ${m.pot}).`, false, { me:true });
    if (c.kind==='pro') { if (m.ct.until <= y) meContractExpire(); }
    else if ((c.kind==='youth' && m.age>=18) || (c.kind==='univ' && m.age>=21)) gradOffers();
  }
}
function retire(p) { p.retired = true; p.club = null; if (p.ovr >= 78) addNews('retire', `${iga(p.name)}(${p.age}) 현역 은퇴를 선언했습니다.`, true); G.hall.push({ name:p.name, hist:p.hist.slice(-4) }); if (G.hall.length>200) G.hall.shift(); }
function release(p) { const c = G.clubs[p.club]; c.pl = c.pl.filter(x=>x!==p.id); pushHistPartial(p, c); p.club = null; G.fa.push(p.id); }
function pushHistPartial(p, c) { if (p.st.a>0 || p.cst.a>0) { const lg = leagueOf(c.lg); p.hist.push([ lg ? seasonLabel(lg) : '-', c.id, c.lg, p.st.a, p.st.s, p.st.g, p.st.as, p.st.a ? Math.round(p.st.rs/p.st.a*10)/10 : 0, p.st.m, p.st.y, p.st.r, p.cst.a, p.cst.g ]); } p.st = blankSt(); p.cst = blankSt(); }
// ----- 이적 시장 -----
const inWindow = (t) => (t.m===1) || (t.m===2 && t.d<=14) || (t.m>=7 && t.m<=8) || (t.m===9 && t.d<=1);
function price(p) { return Math.max(0.1, Math.round(0.4*Math.exp(0.15*(p.ovr-50))*(p.age<=23?1.3: p.age>=31?0.5:1)*10)/10); }
function market(t) {
  if (!inWindow(t)) return;
  const pros = G.clubs.filter(c => c.kind==='pro');
  const tries = Math.ceil(pros.length/22);
  for (let k=0;k<tries;k++) {
    if (rnd() > 0.6) continue;
    const buyer = pick(pros); const sub = pick(SUBS_ALL);
    const mine = buyer.pl.map(id=>G.players[id]).filter(p=>p.sub===sub).sort((a,b)=>b.ovr-a.ovr);
    const need = mine.length ? mine[Math.min(1, mine.length-1)].ovr : buyer.strength;
    const sellers = pros.filter(c => c!==buyer && c.strength <= buyer.strength+4 && c.pl.length>21 && (c.cc===buyer.cc || rnd()<0.3));
    const s = pick(sellers); if (!s) continue;
    const cand = s.pl.map(id=>G.players[id]).filter(p=>p.sub===sub && !p.me && p.ovr >= need-1 && p.ovr <= need+6 && p.age<=33);
    if (!cand.length) continue;
    const p = pick(cand), pr = price(p);
    if (buyer.budget < pr) continue;
    transfer(p, buyer, pr, true);
  }
  if (G.fa.length && rnd()<0.6) { const id = G.fa.shift(); const p = G.players[id]; if (p && !p.retired) { const c = pick(pros.filter(c=>c.strength <= p.ovr+4 && c.pl.length<28)); if (c) transfer(p, c, 0, true); } }
  if (G.me!==null && !me().retired) meOffers(t);
}
function transfer(p, to, fee, news) {
  const from = p.club!==null ? G.clubs[p.club] : null;
  if (from) { from.pl = from.pl.filter(x=>x!==p.id); from.budget += fee*0.9; pushHistPartial(p, from); }
  to.budget -= fee; to.pl.push(p.id); p.club = to.id; p.ct = { until: dateOf(G.day).y + ri(2,4), wage: to.kind==='pro' ? Math.max(2, Math.round(Math.exp((p.ovr-50)*0.1)*3)) : 0 };
  p.xfers = p.xfers||[]; p.xfers.push([G.day, from?from.id:null, to.id, fee]);
  if (from && from.kind==='pro') ensureSquad(from);
  if (news && (p.ovr >= 72 || fee >= 20)) addNews('transfer', `${p.name}(${POS_KO[p.sub]}, ${p.age}) ${from?from.name:'자유계약'} → ${to.name}${fee>0?`, 이적료 약 ${fee}억 원`:' (자유계약)'}`, p.ovr>=80);
}
// ----- 주인공 로직 -----
const PLANS = {
  shoot:{ n:'슈팅 집중', k:['FIN','COM'] }, sprint:{ n:'스피드·민첩', k:['PAC','AGI'] }, tech:{ n:'드리블·테크닉', k:['DRI','TEC'] },
  pass:{ n:'패스·시야', k:['PAS','VIS'] }, body:{ n:'체력·피지컬', k:['STA','STR'] }, mind:{ n:'판단·위치선정', k:['DEC','POS','OTB'] }, rest:{ n:'휴식', k:[] }
};
function trainingDay() {
  const m = me(); const t = dateOf(G.day);
  const hasMatch = G.pendingMine || (G.lastRes[m.club] && G.lastRes[m.club].day===G.day);
  if (m.plan==='rest' || t.dow===0) { m.fat = Math.max(0, m.fat-(m.plan==='rest'?8:5)); return; }
  const pl = PLANS[m.plan]; const age = m.age;
  const gain = (age<=17?0.03: age<=21?0.026: age<=24?0.016: 0.008) * (m.fat>75?0.5:1) * (1+(m.trust-50)/300);
  m.acc = m.acc||{};
  for (const k of pl.k) { m.acc[k] = (m.acc[k]||0) + gain; if (m.acc[k] >= 1 && m.a[k] < 97 && m.ovr < m.pot) { m.a[k]++; m.acc[k] -= 1; m.log.unshift([G.day, `${k} +1`]); if (m.log.length>40) m.log.length=40; Eng.finalize(m); } }
  m.fat = clamp(m.fat + 3.2 - 2.2 + (hasMatch?8:0), 0, 100);
  if (m.fat > 85 && rnd() < 0.01) m.inj = ri(3,14);
  m.mor = clamp(m.mor + (rnd()-0.5)*1.2, 20, 100);
}
function meRole(team) {
  const m = me();
  if (m.inj>0) return 'inj';
  const mates = team.pl.map(id=>G.players[id]).filter(p=>p && !p.me && p.sub===m.sub && p.inj===0).sort((a,b)=>b.ovr-a.ovr);
  const slots = { GK:1, CB:2, FB:2, DM:1, CM:2, AM:1, W:2, ST:2 }[m.sub];
  const refOvr = mates.length >= slots ? mates[slots-1].ovr : 40;
  const p = clamp(0.5 + (m.ovr-refOvr)/9 + (m.trust-50)/250 + (m.fat>85?-0.2:0), 0.04, 0.97);
  const r = rnd();
  if (r < p) return 'start'; if (r < p + (1-p)*0.55) return 'sub'; return 'bench';
}
function matchTitle(ctx) {
  if (ctx.t==='lg') return leagueOf(ctx.id).name; if (ctx.t==='nt') return '국가대표 경기';
  const c = compById(ctx.id); return c ? (c.name + (c.rl?` · ${c.rl}`:'')) : '대회';
}
function genExtras(stMine, stOpp, evAll) {
  const ex = [];
  const nm = (l) => { const a = l.filter(p => !p.me); return a.length ? pick(a) : null; };
  const add = (min, t, ms, p) => { if (p) ex.push({ min, t, ms, p, shown: false }); };
  for (let i = ri(1,4); i > 0; i--) { const ms = rnd() < 0.5; add(ri(8,89), 'yc', ms, nm(ms ? stMine : stOpp)); }
  if (rnd() < 0.07) { const ms = rnd() < 0.5, min = ri(30,88); const l = (ms ? stMine : stOpp).filter(p => !p.me && p.sub !== 'GK' && !evAll.some(e => e.min >= min && (e.sc === p || e.as === p))); add(min, 'rc', ms, l.length ? pick(l) : null); }
  for (let i = ri(1,3); i > 0; i--) { const ms = rnd() < 0.5; const gk = (ms ? stMine : stOpp).find(p => p.sub === 'GK' && !p.me); add(ri(5,89), 'sv', ms, gk); }
  for (let i = ri(0,2); i > 0; i--) { const ms = rnd() < 0.5; add(ri(5,89), 'pt', ms, nm((ms ? stMine : stOpp).filter(p => ['ST','W','AM','CM'].includes(p.sub)))); }
  return ex.sort((a, b) => a.min - b.min);
}
function mvpOf(M) {
  if (M.mvp) return M.mvp;
  const m = me(), tally = new Map();
  const put = (p, mine, v) => { if (!p || p.me) return; const o = tally.get(p) || { p, mine, v: 0 }; o.v += v; tally.set(p, o); };
  M.evMine.forEach(e => { put(e.sc, true, 2.2); put(e.as, true, 1.1); });
  M.evOpp.forEach(e => { put(e.sc, false, 2.2); put(e.as, false, 1.1); });
  const gm = M.evMine.length, go = M.evOpp.length;
  const cand = [...tally.values()].map(o => ({ p: o.p, me: false, mine: o.mine, v: o.v + (o.mine ? (gm > go ? 0.5 : 0) : (go > gm ? 0.5 : 0)) + rnd() * 0.8 + o.p.ovr / 60 }));
  if (go === 0) { const g = (M.stMine || []).find(p => p.sub === 'GK' && !p.me); if (g) cand.push({ p: g, me: false, mine: true, v: 1.6 + rnd() * 0.8 + g.ovr / 60 }); }
  if (gm === 0) { const g = (M.stOpp || []).find(p => p.sub === 'GK' && !p.me); if (g) cand.push({ p: g, me: false, mine: false, v: 1.6 + rnd() * 0.8 + g.ovr / 60 }); }
  if (M.role === 'start' || M.role === 'sub') cand.push({ p: m, me: true, mine: true, v: (M.myRate - 6) * 1.5 + M.myGoals * 2.2 + M.myAssists * 1.1 + (gm > go ? 0.5 : 0) + rnd() * 0.8 + m.ovr / 60 });
  if (!cand.length) { const l = (M.stMine || []).filter(p => !p.me); if (l.length) cand.push({ p: pick(l), me: false, mine: true, v: 1 }); }
  cand.sort((a, b) => b.v - a.v);
  return (M.mvp = cand[0] || null);
}
function prepareMine() {
  const pm = G.pendingMine, m = me();
  const h = clubOf(pm.h), a = clubOf(pm.a), mineHome = mineIn(pm.h);
  const sqH = availableSquad(h, true), sqA = availableSquad(a, true);
  const neutral = pm.ctx.t==='po' || (pm.ctx.t==='cont' && pm.ctx.fin);
  const o = Eng.simulate(rnd, { squad: sqH, tactic: h.tactic }, { squad: sqA, tactic: a.tactic }, { homeA: !neutral });
  const stH = startersOf(sqH), stA = startersOf(sqA);
  const bH = sqH.filter(p=>!stH.includes(p)), bA = sqA.filter(p=>!stA.includes(p));
  const mine = mineHome ? h : a, opp = mineHome ? a : h;
  const role = meRole(mine);
  const mineGoals = mineHome ? o.gA : o.gB, oppGoals = mineHome ? o.gB : o.gA;
  const evMine = genEvents(mine, mineGoals, mineHome?stH:stA, mineHome?bH:bA), evOpp = genEvents(opp, oppGoals, mineHome?stA:stH, mineHome?bA:bH);
  const evx = genExtras(mineHome?stH:stA, mineHome?stA:stH, evMine.concat(evOpp));
  const nChance = role==='start' ? ri(2,3) : role==='sub' ? ri(1,2) : 0;
  const from = role==='sub' ? ri(55,70) : 3;
  const moments = [];
  for (let i=0;i<nChance;i++) moments.push({ min: ri(Math.max(from,5), 88), kind: pick(['box','through','counter','cross']), done:false });
  moments.sort((x,y)=>x.min-y.min);
  G.mm = { pm, ctx: pm.ctx, title: matchTitle(pm.ctx), h, a, mineHome, mine, opp, evMine, evOpp, evx, stMine: mineHome?stH:stA, stOpp: mineHome?stA:stH, role, moments, mi: 0, oppStr: opp.strength, mg: mineHome? sqH:sqA, myGoals: 0, myAssists: 0, myRate: 6.0, sh: 0, from, state: 'ready', sqH, sqA };
  return G.mm;
}
function momentOptions(mo) {
  const m = me(), a = m.a, os = (G.mm.oppStr-60)*0.004;
  const pb = { ST:0.04, W:0.02, AM:0.02, CM:0.0 }[m.sub] || -0.04;
  const shoot = clamp(0.07 + pb + ((0.5*a.FIN+0.25*a.COM+0.25*a.TEC)-50)*0.0085 - os, 0.05, 0.65);
  const pass = clamp(0.45 + ((0.5*a.PAS+0.5*a.VIS)-50)*0.011 - os*1.5, 0.15, 0.92);
  const drib = clamp(0.28 + ((0.5*a.DRI+0.25*a.AGI+0.25*a.PAC)-50)*0.011 - os*1.5, 0.1, 0.85);
  return [ { id:'shoot', n:'슛', p:shoot, shown:shoot }, { id:'pass', n:'패스', p:pass*0.55, shown:pass }, { id:'drib', n:'드리블 돌파', p:drib*0.55, shown:drib } ];
}
function resolveMoment(choice) {
  const M = G.mm, m = me(), mo = M.moments[M.mi]; const opts = momentOptions(mo); const o = opts.find(x=>x.id===choice) || opts[0];
  let text, goal = false, assist = false;
  if (o.id==='shoot') { M.sh++; if (rnd() < o.p) { goal = true; text = pick(['오른발 슛! 골망을 흔듭니다!','침착하게 마무리! 골입니다!','강력한 슛이 구석에 꽂힙니다!']); M.myRate += 1.3; } else { text = pick(['슛이 골대를 살짝 벗어납니다.','골키퍼가 막아냅니다.','수비수 몸에 맞고 나갑니다.']); M.myRate -= 0.05; } }
  else if (o.id==='pass') { if (rnd() < o.shown) { if (rnd() < 0.55) { assist = true; text = '날카로운 패스! 동료가 마무리합니다 — 어시스트!'; M.myRate += 0.9; } else { text = '패스는 정확했지만 동료의 슛이 막힙니다.'; M.myRate += 0.15; } } else { text = '패스가 끊깁니다.'; M.myRate -= 0.15; } }
  else { if (rnd() < o.shown) { if (rnd() < 0.55) { goal = true; text = '수비수를 제치고 직접 마무리! 골입니다!'; M.myRate += 1.3; } else { text = '수비를 벗겨냈지만 마무리가 아쉽습니다.'; M.myRate += 0.2; } } else { text = '돌파가 막힙니다.'; M.myRate -= 0.2; } }
  mo.done = true; mo.result = { choice: o.id, goal, assist, text };
  if (goal) { M.myGoals++;
    const fut = M.evMine.filter(e => e.min > mo.min && !e.mine); if (fut.length) { M.evMine.splice(M.evMine.indexOf(fut[0]),1); } M.evMine.push({ min: mo.min, side: M.mine.id, sc: m, as: null, mine: true }); }
  if (assist) { M.myAssists++; const fut = M.evMine.filter(e => e.min > mo.min && !e.mine); const tm = pick(startersOf(M.mg).filter(p=>!p.me)); if (fut.length) { M.evMine.splice(M.evMine.indexOf(fut[0]),1); } M.evMine.push({ min: mo.min, side: M.mine.id, sc: tm, as: m, mine: true }); }
  M.evMine.sort((x,y)=>x.min-y.min);
  M.mi++; return mo.result;
}
function finishMine() {
  const M = G.mm, m = me(); const mineGoals = M.evMine.length, oppGoals = M.evOpp.length;
  const gh = M.mineHome ? mineGoals : oppGoals, ga = M.mineHome ? oppGoals : mineGoals;
  const evH = M.mineHome ? M.evMine : M.evOpp, evA = M.mineHome ? M.evOpp : M.evMine;
  const key = KEYOF[M.ctx.t];
  const res = finishMatch(M.ctx, M.h.id, M.a.id, gh, ga, M.sqH, M.sqA, { evH, evA });
  let rating = null;
  if (M.role==='start' || M.role==='sub') {
    const mins = M.role==='start' ? 90 : 90 - M.from; const win = (mineGoals-oppGoals);
    rating = clamp(M.myRate + win*0.15 + gauss()*0.2, 4.5, 10);
    const s = m[key]; s.a++; if (M.role==='start') s.s++; s.m += mins; s.rs += rating;
    m.form = clamp(m.form*0.7 + rating*0.3, 4, 9);
    if (M.ctx.t!=='nt') m.trust = clamp(m.trust + (rating-6.3)*2.2, 0, 100);
    m.fame = clamp(m.fame + (M.myGoals*2 + M.myAssists)*(M.ctx.t==='nt'||M.ctx.t==='cont'?1.5:1), 0, 100);
    m.mor = clamp(m.mor + (win>0?3: win<0?-3:0) + (M.myGoals?4:0), 0, 100);
  } else if (M.ctx.t!=='nt') { m.trust = clamp(m.trust - 0.4, 0, 100); }
  m.lastMatch = { day: G.day, h: M.h.id, a: M.a.id, gh, ga, role: M.role, rating, g: M.myGoals, as: M.myAssists, title: M.title };
  m.log.unshift([G.day, `${M.h.name} ${gh}-${ga} ${M.a.name}${rating?` · 평점 ${rating.toFixed(1)}`:''}`]); if (m.log.length>40) m.log.length = 40;
  const fame = M.ctx.t==='nt' ? '대표팀' : M.title;
  if (M.myGoals>0) addNews('me', `${m.name}, ${M.myGoals>1?M.myGoals+'골':'골'} 기록! ${M.mine.name} ${mineGoals}-${oppGoals} ${M.opp.name} (${fame})`, M.myGoals>=2, { me:true });
  if (rating && rating >= 8.5) addNews('me', `${m.name}, 평점 ${rating.toFixed(1)}의 맹활약`, false, { me:true });
  if (M.ctx.t==='lg' && m.st.g===1 && M.myGoals===1 && !m.firstGoal) { m.firstGoal = G.day; addNews('me', `${m.name}, 프로 데뷔골!`, true, { me:true }); }
  if (M.ctx.t==='nt' && M.role!=='bench' && M.role!=='inj' && !m.firstCap) { m.firstCap = G.day; addNews('me', `${m.name}, ${M.mine.name} 데뷔!`, true, { me:true }); }
  if (M.mvp && M.mvp.me) { m.mvps = (m.mvps||0) + 1; addNews('me', `${m.name}, 경기 MVP 선정! ${M.mine.name} ${mineGoals}-${oppGoals} ${M.opp.name} (${fame})`, M.ctx.t!=='lg', { me:true }); }
  G.mm = null; G.pendingMine = null; flushFinish();
  return { mvp: M.mvp ? { name: M.mvp.p.name, me: M.mvp.me } : null, res, rating, role: M.role, myGoals: M.myGoals, myAssists: M.myAssists, mineGoals, oppGoals, title: M.title };
}
function autoMine() {
  const M = G.mm; while (M.mi < M.moments.length) { const opts = momentOptions(M.moments[M.mi]); const att = ['ST','W','AM'].includes(me().sub); resolveMoment((att && rnd()<0.65) ? 'shoot' : opts.sort((a,b)=>b.p-a.p)[0].id); }
  return finishMine();
}
// ----- 오퍼 / 졸업 -----
function lvl(c) { if (c.kind==='youth' || c.kind==='univ') return 0; if (c.kind==='ext') return 2; if (c.tier===2) return 1; return DD.COUNTRIES[c.cc].l1.mean < 64 ? 2 : 3; }
function meOffers(t) {
  const m = me(); if (m.offers.length>=3) return;
  const cur = G.clubs[m.club];
  if (cur.kind!=='pro') { // 유스: 조기 프로 콜업
    if (m.age < 17 || m.ovr < 52 || rnd() > 0.03) return;
    const cands = G.clubs.filter(c => c.kind==='pro' && c.cc===cur.cc && c.strength-9 <= m.ovr && lvl(c)<=2); if (!cands.length) return;
    const c = pick(cands); if (m.offers.some(o=>o.club===c.id)) return;
    m.offers.push({ club: c.id, wage: Math.max(3, Math.round(m.ovr/5)), years: ri(2,4), fee: 0, until: G.day+20, early:true });
    G.inbox.unshift({ d: G.day, text: `${c.name}이(가) ${m.name}에게 프로 계약을 제안했습니다. (조기 콜업)` }); return;
  }
  if (m.st.a < 6 && m.hist.length===0) return;
  if (rnd() > 0.06 + (m.fame/100)*0.08) return;
  const good = clamp(m.form,4,9) >= 6.3 || m.fame > 30;
  if (!good) return;
  const maxL = lvl(cur) + (m.ovr>=72 ? 2 : 1);
  const cands = G.clubs.filter(c => c.kind==='pro' && c.id!==m.club && lvl(c) <= maxL && c.strength >= cur.strength-2 && c.strength <= cur.strength + 8 + m.fame/12 && m.ovr >= c.strength-9);
  if (!cands.length) return; const c = pick(cands);
  if (m.offers.some(o=>o.club===c.id)) return;
  const wage = Math.round(m.ct.wage*(1+ (c.strength-cur.strength)*0.08 + 0.1)*10)/10;
  m.offers.push({ club: c.id, wage, years: ri(2,4), fee: price(m), until: G.day+14 });
  G.inbox.unshift({ d: G.day, text: `${c.name}(${leagueOf(c.lg).name})이(가) ${m.name} 영입 제안을 보냈습니다.` });
  addNews('me', `${c.name}, ${m.name} 영입에 관심`, false, { me:true });
}
function gradOffers() {
  const m = me(), cur = G.clubs[m.club], y = dateOf(G.day).y; m.offers = [];
  let cands = G.clubs.filter(c => c.kind==='pro' && c.cc===cur.cc && c.strength-10 <= m.ovr && c.strength+3 >= m.ovr-0 - 8).sort((a,b)=>b.strength-a.strength);
  cands = cands.filter(c => lvl(c) <= 2 || m.ovr >= c.strength-4);
  const out = [];
  if (cur.parent!==undefined) out.push(G.clubs[cur.parent]);
  for (const c of shuffle(cands.slice(0,12))) { if (out.length>=3) break; if (!out.includes(c)) out.push(c); }
  if (cur.kind==='youth' && cur.cc==='KOR') { const un = G.clubs.filter(c=>c.kind==='univ'); if (un.length) out.push(pick(un)); }
  if (!out.length) out.push(pick(G.clubs.filter(c=>c.kind==='pro' && c.tier===2 && c.cc===cur.cc)) || G.clubs.find(c=>c.kind==='pro'));
  for (const c of out) m.offers.push({ club:c.id, wage: c.kind==='pro' ? Math.max(3, Math.round(m.ovr/5)) : 0, years: c.kind==='pro' ? ri(2,4) : 4, fee:0, until: dayOf(y,3,1), grad:true });
  G.inbox.unshift({ d: G.day, text: `${m.name}, 졸업 시즌입니다. ${out.length}개 팀에서 입단 제안이 도착했습니다. 3월 1일까지 선택하세요.` });
  addNews('me', `${m.name}, 졸업 후 진로 — ${out.length}개 팀이 관심`, true, { me:true });
}
function gradDeadline(t) {
  const m = me(); if (!(t.m===3 && t.d===1)) return;
  const g = m.offers.filter(o=>o.grad); if (!g.length) return;
  const best = m.offers.indexOf(g.slice().sort((a,b)=>G.clubs[b.club].strength-G.clubs[a.club].strength)[0]);
  acceptOffer(best); G.inbox.unshift({ d: G.day, text: '기한이 지나 가장 높은 수준의 팀으로 자동 입단했습니다.' });
}
function acceptOffer(i) {
  const m = me(), o = m.offers[i]; if (!o) return;
  const to = G.clubs[o.club], from = G.clubs[m.club];
  transfer(m, to, o.fee, false); m.ct = { until: dateOf(G.day).y + o.years, wage: o.wage }; m.offers = []; m.trust = to.kind==='pro' ? 45 : 55;
  const lf = leagueOf(from.lg), lt = leagueOf(to.lg);
  addNews('transfer', `${m.name}(${m.age}), ${from.name} → ${to.name} ${o.grad?'입단':'이적'}${lt && lf && lt.cc!==lf.cc?` · ${DD.COUNTRIES[lt.cc].name} 진출`:''}!`, true, { me:true });
}
function declineOffer(i) { me().offers.splice(i,1); }
function meContractExpire() { const m = me(); m.renewal = { wage: Math.round(m.ct.wage*1.15*10)/10, years: 3 }; G.inbox.unshift({ d: G.day, text: `${iga(G.clubs[m.club].name)} 재계약을 제안했습니다.` }); }
function acceptRenewal() { const m = me(); if (m.renewal) { m.ct = { until: dateOf(G.day).y + m.renewal.years, wage: m.renewal.wage }; m.renewal = null; } }
// ----- 뉴스 생성 -----
function weeklyNews() {
  for (const code of G.sel) {
    const lg = leagueOf(DD.COUNTRIES[code].l1.id); const r = lg.rd[lg.ptr]; if (!r || lg.ptr<4) continue;
    if (rnd() < 0.3) { const tb = sortedTable(lg), ts = topList(lg,'g',1)[0]; addNews('table', `${lg.name} 선두 ${G.clubs[tb[0]].name} (${lg.table[tb[0]].pts}점)${ts?`, 득점 선두 ${ts.name} ${ts.st.g}골`:''}`, false); }
  }
  for (const comp of G.comps) if (comp.stage==='G' && comp.groups.length && rnd()<0.5) { const g = pick(comp.groups); const tb = g.teams.slice().sort((x,y)=>g.table[y].pts-g.table[x].pts); if (g.table[tb[0]].p>0) addNews('cup', `${comp.name} 조별리그 — ${clubOf(tb[0]).name} 선두 (${g.table[tb[0]].pts}점)`, false); }
}
function dailyNews(t) {
  if (rnd() < 0.35) { // 이적설
    const pros = G.clubs.filter(c=>c.kind==='pro'); const s = pick(pros); const cand = s.pl.map(id=>G.players[id]).filter(p=>p && p.ovr >= s.strength+3 && p.age<=30);
    if (cand.length) { const p = pick(cand), b = pick(pros.filter(c=>c.strength > s.strength+2)); if (b) addNews('rumor', `[이적설] ${b.name}, ${s.name}의 ${p.name}(${p.age}) 영입 관심`, false); }
  }
  if (rnd() < 0.2) { // 유망주
    const ys = G.clubs.filter(c=>c.kind==='youth'); const c = pick(ys); if (!c) return; const cand = c.pl.map(id=>G.players[id]).filter(p=>p && !p.me && p.st.a>=8 && p.st.g>=4);
    if (cand.length) { const p = pick(cand); addNews('youth', `[유망주] ${c.name}의 ${p.name}(${p.age}) ${p.st.a}경기 ${p.st.g}골 — ${NATK(p.nat)} 스카우트들이 주목`, false); }
  }
}
// ----- 저장 -----
function serialize() { return JSON.stringify(G, (k,v) => { if (k==='ab'||k==='mm') return undefined; if ((k==='st'||k==='cst'||k==='nst') && v && v.a===0 && v.g===0 && v.as===0 && v.m===0 && v.y===0) return undefined; if (k==='form' || k==='rs') return Math.round(v*100)/100; return v; }); }
function load(str) { const g = JSON.parse(str); if (g.v !== 2) throw new Error('old save'); G = g; for (const id in G.players) { const p = G.players[id]; if (!p.st) p.st = blankSt(); if (!p.cst) p.cst = blankSt(); if (!p.nst) p.nst = blankSt(); Eng.finalize(p); } G.mm = null; return G; }
const API2 = { mvpOf, get G() { return G; }, newWorld, createMe, me, clubOf, leagueOf, compById, step, prepareMine, momentOptions, resolveMoment, finishMine, autoMine, sortedTable, topList, ratingList, acceptOffer, declineOffer, acceptRenewal, serialize, load, fmtDate, dateOf, dayOf, POS_KO, PLANS, price, flushFinish, startersOf, stageOf, lvl, seasonLabel, COUNTRIES: DD.COUNTRIES, NAT_KO: DD.NAT_KO, FLAG: DD.FLAG, NAT_CODES: DD.NAT_CODES, CODES: DD.CODES, NATK, matchTitle, mineIn, NT_WIN };
if (typeof module !== 'undefined') module.exports = API2;
