// ===== 코어 v2: 월드 · 일정 · 하루 진행 · 대회 · 대표팀 · 유스 · 뉴스 · 이적 =====
const Eng = (typeof E !== 'undefined') ? E : require('./engine2.js');
const DD = (typeof DATA_CLUBS !== 'undefined') ? { DATA_CLUBS, EU, COUNTRIES, CODES, REG, SYM, HS_SUF, UN_SUF, COLS, NAT_KO, NAT_CODES, FLAG, FOREIGN, NGRP, SUR, G1, G2, P } : require('./data.js');
let G = null;
const SUBS_ALL = ['GK','CB','FB','DM','CM','AM','W','ST'];
const POS_KO = { GK:'골키퍼', CB:'센터백', FB:'풀백', DM:'수비형 MF', CM:'중앙 MF', AM:'공격형 MF', W:'윙어', ST:'스트라이커' };
const MIN_PLAN = { GK:2, CB:3, FB:3, DM:1, CM:2, AM:1, W:2, ST:2 };
const SQ = { nat:{GK:3,CB:4,FB:4,DM:3,CM:4,AM:2,W:3,ST:3}, p1:{GK:3,CB:4,FB:4,DM:2,CM:4,AM:2,W:4,ST:3}, p2:{GK:2,CB:4,FB:4,DM:2,CM:3,AM:2,W:3,ST:3}, youth:{GK:2,CB:3,FB:3,DM:1,CM:3,AM:2,W:3,ST:3}, univ:{GK:2,CB:4,FB:3,DM:2,CM:3,AM:2,W:3,ST:3} };
const TARGET = { nat:26, p1:25, p2:23, youth:19, univ:21, ext:22 };
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
const WCN = { ARG:[0,0,84], FRA:[0,0,84], ESP:[0,0,84], ENG:[0,0,83], BRA:[0,0,83], POR:[0,0,82], NED:[0,0,81], GER:[0,0,81], BEL:[0,0,79], CRO:[0,0,78], URU:[0,0,78], COL:[0,0,77], MAR:[0,0,77], JPN:[0,0,76], USA:[0,0,76], MEX:[0,0,75], SUI:[0,0,75], SEN:[0,0,75], KOR:[0,0,74], AUT:[0,0,74], TUR:[0,0,74], NOR:['노르웨이','🇳🇴',74,'N'], ECU:['에콰도르','🇪🇨',73,'L'], SWE:['스웨덴','🇸🇪',72,'N'], IRN:[0,0,71], CIV:[0,0,71], CAN:['캐나다','🇨🇦',71,'N'], AUS:[0,0,70], EGY:[0,0,70], SCO:[0,0,70], ALG:['알제리','🇩🇿',70,'A'], PAR:['파라과이','🇵🇾',69,'L'], TUN:['튀니지','🇹🇳',69,'A'], GHA:[0,0,68], SAU:[0,0,67], QAT:[0,0,66], PAN:['파나마','🇵🇦',66,'L'], UZB:['우즈베키스탄','🇺🇿',66,'A'], JOR:['요르단','🇯🇴',64,'A'], RSA:[0,0,64], NZL:['뉴질랜드','🇳🇿',62,'N'], CZE:['체코','🇨🇿',71,'N'], BIH:['보스니아','🇧🇦',69,'N'], HAI:['아이티','🇭🇹',62,'F'], CUW:['퀴라소','🇨🇼',61,'L'], CPV:['카보베르데','🇨🇻',64,'F'], IRQ:['이라크','🇮🇶',65,'A'], COD:['콩고민주공화국','🇨🇩',66,'F'] };
const WCCOL = { KOR:['#CD2E3A','#FFFFFF'], BRA:['#F7D117','#009739'], ARG:['#75AADB','#FFFFFF'], FRA:['#1F3A93','#FFFFFF'], ESP:['#C60B1E','#F1BF00'], ENG:['#F3F3F3','#1F3A93'], GER:['#F3F3F3','#222222'], ITA:['#1F6FD0','#FFFFFF'], NED:['#F36C21','#FFFFFF'], POR:['#B01E2A','#0B6B3A'], JPN:['#1F3A93','#FFFFFF'], USA:['#1F3A93','#C8102E'], MEX:['#0B6B3A','#C8102E'], BEL:['#C8102E','#111111'], CRO:['#E11B22','#FFFFFF'], URU:['#7EB6E8','#111111'], COL:['#F7D117','#1F3A93'], MAR:['#C1272D','#0B6B3A'], SEN:['#0B8F4D','#F7D117'], NGA:['#0B8F4D','#FFFFFF'], CAN:['#D52B1E','#FFFFFF'], AUS:['#F7D117','#0B6B3A'] };
const NATK = (c) => (DD.FLAG[c] || (WCN[c] && WCN[c][1]) ? (DD.FLAG[c] || WCN[c][1]) + ' ' : '') + (DD.NAT_KO[c] || (WCN[c] && WCN[c][0]) || c);

// ----- 이름 / 선수 / 클럽 -----
function nameFor(nat) {
  if (nat==='KOR') return pick(DD.SUR)+pick(DD.G1)+pick(DD.G2);
  if (nat==='JPN') return pick(DD.P.J1)+' '+pick(DD.P.J2);
  const g = DD.NGRP[nat] || (WCN[nat] && WCN[nat][3]) || 'L'; return pick(DD.P[g+'1'])+' '+pick(DD.P[g+'2']);
}
function tacticFor(style) {
  const t = Eng.defaultTactic();
  if (style==='wide') t.width=2; if (style==='direct') t.build=0; if (style==='tiki') { t.build=2; t.width=0; }
  if (style==='counter') { t.trans=2; t.line=0; } if (style==='press') { t.press=2; t.line=2; }
  return t;
}
const blankSt = () => ({ a:0, s:0, m:0, g:0, as:0, rs:0, y:0, r:0 });
function natFor(c) {
  if (c.kind==='nat') return c.nat;
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
  p.birthM = ri(1,12); p.ct = { until: dateOf(G.day).y + ri(1,4), wage: wageFor(p, club) };
  p.hist = []; p.st = blankSt(); p.cst = blankSt(); p.nst = blankSt(); p.inj = 0; p.form = 6.0;
  G.players[id] = p; if (club) club.pl.push(id);
  return p;
}
function sqKey(c) { return c.kind==='pro' ? (c.tier===1?'p1':'p2') : c.kind==='ext' ? 'p2' : c.kind; }
function newFor(c, sub, i, intake) {
  let age, ovr;
  if (c.kind==='youth') { age = intake ? ri(15,16) : ri(15,18); ovr = yOvr(c,age) + gauss()*3 - i*1.5; }
  else if (c.kind==='univ') { age = intake ? ri(19,20) : ri(19,22); ovr = yOvr(c,age) + gauss()*3 - i*1.5; }
  else { age = intake ? ri(18,22) : ri(18,34); ovr = c.strength + gauss()*3 - i*2.2 - (intake?4:0) - (c.kind==='nat'?4:0) - (age<22 ? (22-age)*1.5 : age>31 ? (age-31)*0.8 : 0); }
  return newPlayer(c, sub, ovr, c.style, age, natFor(c));
}
function buildClubSquad(c) { const plan = SQ[sqKey(c)]; for (const sub of SUBS_ALL) for (let i=0;i<plan[sub];i++) newFor(c, sub, i, false); seedStars(c); }
// 실제 스타를 연상시키는 가상 선수 심기: 같은 포지션의 가장 약한 선수를 대체
function seedStars(c) {
  let list = null;
  if (c.kind==='nat') list = STARS.nat[c.nat];
  else if (c.kind==='pro') {
    list = STARS.club[c.name];
    if (!list && STARS.rank[c.lg]) {
      const lgc = G.clubs.filter(x => x.lg===c.lg && x.kind==='pro').sort((a,b) => b.strength-a.strength);
      const rk = lgc.findIndex(x => x===c); if (rk>=0) list = STARS.rank[c.lg][rk];
    }
  }
  if (!list) return;
  for (const s of list) {
    const [nm, sub, ovr, age, nat, mix] = s.split('|'); const T = +ovr;
    const same = c.pl.map(id => G.players[id]).filter(p => p && p.sub===sub && !p.star).sort((a,b) => a.ovr-b.ovr);
    if (same.length) { const w = same[0]; delete G.players[w.id]; c.pl.splice(c.pl.indexOf(w.id), 1); }
    const p = newPlayer(c, sub, T, c.style, +age, nat);
    const d = T - p.ovr; if (d) { for (const k of Object.keys(p.a)) p.a[k] = Math.max(20, Math.min(97, p.a[k] + d)); Eng.finalize(p); }
    p.name = nm; p.star = 1; p.pot = Math.max(p.ovr, p.pot); if (mix) p.mix = mix;
  }
}
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
function* newWorldGen(seed, sel) {
  sel = (sel && sel.length) ? sel : ['KOR','ENG','ESP','ITA','GER'];
  G = { v:2, rs: seed|0, day: dayOf(2026,1,31), nextPid: 1, clubs: [], players: {}, leagues: [], comps: [], news: [], inbox: [], me: null, hall: [], flags: {}, fx: {}, nt: {}, sel, compHist: [], ntLog: [], lastRes: {}, fa: [] };
  const used = new Set();
  { let ci = 0; for (const code of sel) { yield [0.03 + 0.27 * ci / sel.length, (DD.COUNTRIES[code].name || code) + ' 리그와 구단 만드는 중']; buildCountry(code, used); ci++; } }
  yield [0.31, '대륙 대회 준비 중'];
  // 대륙대회 보충용 외부 클럽
  for (const cont of ['EU','AS','AF','SA','NA']) {
    const cs = sel.filter(c => DD.COUNTRIES[c].cont===cont && DD.COUNTRIES[c].slots>0); if (!cs.length) continue;
    const slots = cs.reduce((s,c)=>s+DD.COUNTRIES[c].slots,0), need = Math.max(cont==='EU' ? 4 : 0, 16-slots);
    const nm = genNames('EXT_'+cont, need, used);
    nm.forEach(n => { const col = pick(DD.COLS); addClub({ name:n, lg:'EXT', col:col[0], col2:col[1], strength: ({EU:64+ri(0,9), AF:52+ri(0,7), AS:54+ri(0,7), SA:56+ri(0,8), NA:50+ri(0,7)})[cont], nat:pick({EU:['FRA','POR','NED','BEL','CRO','SRB','DEN','SUI'], AS:['CHN','AUS','IRN','JPN','KOR','SAU'], AF:['EGY','MAR','NGA','SEN','GHA','CIV'], SA:['ARG','URU','COL','BRA'], NA:['MEX','MEX','USA']}[cont]), cc:cont, kind:'ext', tier:0 }); });
  }
  { const cl = G.clubs; for (let k = 0; k < cl.length; k++) { if (k % 10 === 0) yield [0.34 + 0.28 * k / cl.length, '선수를 만드는 중 (' + k + '/' + cl.length + '개 팀)']; buildClubSquad(cl[k]); } }
  yield [0.63, '시즌 일정을 짜는 중'];
  for (const lg of G.leagues) { const y = 2026; buildSchedule(lg, seasonStart(lg, y)); lg.season = y; }
  for (const code of sel) G.flags['pr_'+code] = {};
  buildComps('E', 2026);
  addNews('world','2026/27 시즌, 월드가 열렸습니다.',false);
  { const d0 = G.day, tot = dayOf(2026,7,31) - d0; let n = 0; while (G.day < dayOf(2026,7,31)) { step(true); if (++n % 6 === 0) yield [0.66 + 0.33 * (G.day - d0) / tot, '시즌을 미리 진행하는 중 (' + Math.min(6, Math.floor((G.day - d0) / 30) + 1) + '/6개월)']; } }
  return G;
}
function newWorld(seed, sel) { const g = newWorldGen(seed, sel); let r; while (!(r = g.next()).done); return r.value; }

// 현실 기준 주급(만 원): 능력·리그 수준에 따른 연봉 ÷ 52
const WMULT = { 1: 0.45, 2: 1.0, 3: 3.0 };
function wageFor(p, c) {
  if (!c || c.kind!=='pro') return 0;
  let L = lvl(c), mult = WMULT[L] || 0.45; if (c.cc==='KOR') mult *= 0.8;
  const annual = Math.exp((p.ovr-50)*0.11) * 1500 * mult * (0.9 + (c.strength - 60)/200);
  return Math.max(15, Math.round(annual/52));
}
// ----- 주인공 -----
function createMe(opts) {
  const club = G.clubs[opts.club] || G.clubs.find(c => c.kind==='pro' && c.tier===2) ;
  const age = opts.age || 19, sub = opts.pos || 'ST';
  const ovr = club.kind==='pro' ? club.strength - 1 : club.strength - 8 + (age-15)*2;
  const p = newPlayer(club, sub, ovr, 'balanced', age, opts.nat || 'KOR');
  p.name = opts.name || '양메시'; p.look = opts.look || { skin:'tan', hair:'brown', style:'sidepart' };
  p.pot = Math.max(78, p.ovr + (26-age)*2.6) + ri(0,6); p.pot = Math.round(Math.min(95, p.pot));
  p.ct = { until: dateOf(G.day).y + 3, wage: wageFor(p, club) }; p.me = true; p.h = clamp(Math.round(opts.h || 178), 155, 205); p.prefs = (opts.prefs || []).filter(x => PREFS[x]).slice(0,3); p.trait = TRAITS[opts.trait] ? opts.trait : 'grinder'; p.cust = []; p.ach = {}; p.trust = 55; p.mor = 70; p.fat = 10; p.plan = 'shoot'; p.acc = {}; p.log = []; p.fame = 5; p.offers = []; p.goalsAll = 0; p.callup = null;
  { const dh = (p.h - 178)/10; const adj = (k, v) => { if (p.a[k] !== undefined) p.a[k] = clamp(Math.round(p.a[k] + v), 20, 97); };
    adj('HEA', dh*5); adj('JUM', dh*3); adj('STR', dh*4); adj('AER', dh*5); adj('PAC', -dh*4); adj('AGI', -dh*5); adj('DRI', -dh*2); adj('REF', -dh*2);
    for (const pr of p.prefs) for (const k of (PREF_AT[pr]||[])) adj(k, 3); Eng.finalize(p); }
  p.pot = Math.min(97, p.pot + TRAITS[p.trait].pot); G.me = p.id; G.mePlan = 'shoot'; pickMentor(p);
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
  { const fm = (ch, g1, g2) => { const c0 = G.clubs[ch]; if (!c0) return; (c0.form5 = c0.form5 || []).push(g1 > g2 ? 'W' : g1 < g2 ? 'L' : 'D'); if (c0.form5.length > 5) c0.form5.shift(); }; try { fm(h, gh, ga); fm(a, ga, gh); } catch (e) {} }
  if (gh>ga) { H.w++; A.l++; H.pts+=3; } else if (gh<ga) { A.w++; H.l++; A.pts+=3; } else { H.d++; A.d++; H.pts++; A.pts++; }
}
function genEvents(club, goals, starters, bench) {
  const ev = [];
  for (let i=0;i<goals;i++) {
    const pen = rnd() < 0.09;                                                           // 페널티킥 득점(약 9%): 키커는 결정력 높은 선발 선수
    let sc = wpick(starters.concat(bench.slice(0,3)), SC_W);
    if (pen) { const f = starters.filter(p => p.sub !== 'GK' && !p.me); if (f.length) { f.sort((a, b) => ((b.a && b.a.FIN) || 50) - ((a.a && a.a.FIN) || 50)); sc = f[Math.min(f.length - 1, rnd() < 0.7 ? 0 : 1)]; } }
    const asp = !pen && rnd() < 0.72 ? wpick(starters, AS_W, sc) : null;
    ev.push({ min: ri(2,90), side: club.id, sc, as: asp, pen });
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
    if (rnd() < 0.006 * (1 - 0.07*mgrFx(club,'fit'))) { p.inj = Math.max(1, Math.round(pick([3,5,7,10,14,21,30,45,70]) * (1 - 0.08*mgrFx(club,'med')))); if (club.kind==='pro' && p.ovr >= club.strength+2 && !p.me) addNews('injury', `${club.name}의 ${iga(p.name)} 부상으로 ${p.inj}일 결장합니다.`, p.ovr>=75); }
    if (rnd() < 0.07) p[key].y++; if (rnd() < 0.004) p[key].r++;
  }
  return rs;
}
const KEYOF = { lg:'st', cup:'cst', cont:'cst', po:'cst', nt:'nst', wc:'nst' };
function simMatch(ctx, h, a) {
  const ch = clubOf(h), ca = clubOf(a);
  const sqH = availableSquad(ch, true), sqA = availableSquad(ca, true);
  const neutral = ctx.t==='po' || ctx.t==='wc' || (ctx.t==='cont' && ctx.fin);
  const o = Eng.simulate(rnd, { squad: sqH, tactic: ch.tactic }, { squad: sqA, tactic: ca.tactic }, { homeA: !neutral });
  return finishMatch(ctx, h, a, o.gA, o.gB, sqH, sqA);
}
function finishMatch(ctx, h, a, gh, ga, sqH, sqA, mine) {
  const ch = clubOf(h), ca = clubOf(a), key = KEYOF[ctx.t];
  const stH = startersFor(ch, sqH), stA = startersFor(ca, sqA);
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
    const dd = (comp.tdays && comp.tdays[comp.round] && comp.tdays[comp.round][i] != null) ? [comp.tdays[comp.round][i]] : days;
    t.n = dd.length;
    dd.forEach((d,l) => { const day = Math.max(d, G.day+1); const home = l%2===0 ? t.a : t.b, away = l%2===0 ? t.b : t.a; addFx(day, home, away, { t:comp.kind, id:comp.id, ti:i, leg:l, fin: comp.kind==='cont' && dd.length===1 }); });
  });
}
function compResult(comp, ctx, h, a, gh, ga) {
  if (comp.stage==='G' && ctx.g!==undefined) {
    const g = comp.groups[ctx.g]; record(g.table, h, a, gh, ga); comp.left--;
    if (comp.left===0) { if (comp.kind==='wc') startWcKO(comp); else startContKO(comp); }
    return;
  }
  const t = comp.ties[ctx.ti]; if (!t) return;
  t.legs[ctx.leg] = { h, a, gh, ga };
  if (t.legs.filter(Boolean).length < t.n) return;
  let sa = 0, sb = 0; for (const L of t.legs) { if (L.h===t.a) { sa += L.gh; sb += L.ga; } else { sb += L.gh; sa += L.ga; } }
  t.sa = sa; t.sb = sb;
  if (sa===sb && comp.kind==='wc' && !ctx.xt) {                                      // 월드컵: 90분 무승부 → 연장전(30분) → 승부차기
    const dA = clubOf(t.a).strength - clubOf(t.b).strength, poi = (l) => { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
    const ea = poi(0.36 * Math.exp(dA * 0.012)), eb = poi(0.36 * Math.exp(-dA * 0.012)); t.et = [ea, eb]; sa += ea; sb += eb; t.sa = sa; t.sb = sb;
  }
  if (ctx.xt) { const ha = h === t.a; t.et = [ha ? ctx.xt.eh : ctx.xt.ea, ha ? ctx.xt.ea : ctx.xt.eh]; }           // 경기장에서 이미 진행한 연장전(득점은 합산 완료)
  if (sa!==sb) t.w = sa>sb ? t.a : t.b;
  else { t.pen = true; if (ctx.xt) t.w = ctx.xt.w; else { const pa = clamp(0.5 + (clubOf(t.a).strength - clubOf(t.b).strength)*0.004, 0.3, 0.7); t.w = rnd()<pa ? t.a : t.b; } }
  if (t.pen || t.et) G.wcLast = { a: t.a, b: t.b, w: t.w, sa, sb, pen: !!t.pen, et: t.et || null };
  if (comp.ties.every(x => x.w!==null)) advanceRound(comp);
}
function advanceRound(comp) {
  if (comp.kind==='wc' && comp.ties.length===2 && comp.ties[1].third) {      // 결승 + 3·4위전 종료
    const fin = comp.ties[0], thd = comp.ties[1]; comp.last = comp.ties; comp.khist = comp.khist || [];
    comp.khist.push({ rl: '결승', ties: [fin] }); comp.khist.push({ rl: '3·4위전', ties: [thd] }); comp.thirdW = thd.w;
    addNews('cup', `${comp.name} 3·4위전 — ${clubOf(thd.w).name} 3위`, true);
    return finishComp(comp, fin.w);
  }
  const winners = comp.ties.map(t => t.w);
  comp.last = comp.ties; if (comp.kind==='wc') (comp.khist = comp.khist || []).push({ rl: comp.rl, ties: comp.ties });
  if (winners.length===1 && comp.ties.length===1) { return finishComp(comp, winners[0]); }
  comp.alive = winners.concat(comp.round===0 && comp.byes && comp.kind==='cup' ? comp.byes : []);
  comp.round++;
  if (comp.kind==='wc') {
    const pairs = []; for (let i=0;i+1<winners.length;i+=2) pairs.push([winners[i], winners[i+1]]);
    const semi = comp.last.length === 2 && pairs.length === 1, los = semi ? comp.last.map(t => t.w===t.a ? t.b : t.a) : null;
    koRound(comp, pairs);
    if (semi) {                                                              // 3·4위전: 결승 하루 전
      const fd = comp.rdays[comp.round] || comp.rdays[comp.rdays.length-1], d0 = Math.max((fd[0] || G.day + 2) - 1, G.day + 1);
      const tt = { a: los[0], b: los[1], legs: [], w: null, n: 1, third: true }; comp.ties.push(tt); addFx(d0, tt.a, tt.b, { t: comp.kind, id: comp.id, ti: 1, leg: 0, third: true });
    }
    return;
  }
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
  if (G.me!==null && me() && champ===me().club && comp.kind!=='po') mgrTrophy(comp.name + ' 우승', comp.season);
  for (const id of c.pl) { const p = G.players[id]; if (p && p.me) addNews('me', `${p.name}, ${comp.name} 우승!`, true, { me:true }); }
}
function buildComps(cal, year) {
  for (const code of G.sel) { const C = DD.COUNTRIES[code]; if (C.cal===cal) buildCup(code); }
  if (cal==='E') for (const cont of ['EU','AS','AF']) buildCont(cont, year);
  if (cal==='S') for (const cont of ['SA','NA']) buildCont(cont, year);
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
  const ext = shuffle(G.clubs.filter(c=>c.kind==='ext' && c.cc===cont).map(c=>c.id));
  const keep = cont==='EU' ? Math.min(3, ext.length) : 0;   // 유럽대회: 리그 없는 나라의 주요 클럽 3팀은 항상 참가
  const t = rank.slice(0, 16-keep).map(x=>x[2]);
  for (let k=0;k<keep;k++) t.push(ext.pop());
  while (t.length < 16 && ext.length) t.push(ext.pop());
  return t.length>=8 ? t : null;
}
const CONT_NAME = { EU:'유럽 챔피언스컵', AS:'아시아 챔피언스', SA:'남미 리베르타도레스컵', NA:'북중미 챔피언스컵', AF:'아프리카 챔피언스리그' };
function buildCont(cont, year) {
  const teams = contTeams(cont); if (!teams) return;
  const sorted = teams.slice().sort((a,b)=>G.clubs[b].strength-G.clubs[a].strength);
  const ng = Math.floor(sorted.length/4);
  const comp = mkComp('CONT_'+cont, CONT_NAME[cont], 'cont', cont, (cont==='SA'||cont==='NA') ? `${year}` : `${year}/${String((year+1)%100).padStart(2,'0')}`);
  comp.stage = 'G'; comp.groups = [];
  for (let g=0; g<ng; g++) comp.groups.push({ teams:[], table:{} });
  for (let pot=0; pot<4; pot++) { const p = shuffle(sorted.slice(pot*ng, pot*ng+ng)); p.forEach((id,g) => { comp.groups[g].teams.push(id); comp.groups[g].table[id] = { p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0 }; }); }
  const SC = cont==='SA' || cont==='NA';
  const gd = (SC ? [[4,14],[4,28],[5,19],[6,2],[6,23],[7,7]] : [[9,15],[9,29],[10,20],[11,3],[11,24],[12,8]]).map(([m,d]) => nextDow(dayOf(year,m,d), 2));
  comp.left = 0;
  for (const [gi,g] of comp.groups.entries()) {
    const base = circle(g.teams), md = base.concat(base.map(r => r.map(([h,a]) => [a,h])));
    md.forEach((ms, i) => ms.forEach(([h,a]) => { addFx(gd[i], h, a, { t:'cont', id:comp.id, g:gi }); comp.left++; }));
  }
  comp.rdays = SC ? [[nextDow(dayOf(year,8,11),2), nextDow(dayOf(year,8,25),2)], [nextDow(dayOf(year,9,15),2), nextDow(dayOf(year,9,29),2)], [nextDow(dayOf(year,11,2),6)]] : [[nextDow(dayOf(year+1,2,16),2), nextDow(dayOf(year+1,3,9),2)], [nextDow(dayOf(year+1,4,6),2), nextDow(dayOf(year+1,4,20),2)], [nextDow(dayOf(year+1,5,30),6)]];
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
  if (!G.wc && t.m===8 && t.d===1 && G.day > dayOf(2026,8,1)) buildComps('E', t.y);
  if (!G.wc && t.m===2 && t.d===1) buildComps('S', t.y);
  if (!G.wc && NT_WIN.some(w => w[0]===t.m && w[1]===t.d)) callups();
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
  if (G.me!==null && G.mode!=='mgr') { execPending(); meetCheck(t); trainingDay(); gradDeadline(t); if (t.d===1) finMonth(t); }
  if (G.mode==='mgr' && !G.wc && G.mgr && t.d===1) mgrMonth(t);
  market(t);
  if (t.m===1 && t.d===1) yearEnd();
  if (!silent && !G.wc) { if (t.dow===1) weeklyNews(); dailyNews(t); }
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
  const tb = sortedTable(lg), champ = G.clubs[tb[0]]; if (G.mode === 'mgr') mgrSeasonEnd(lg, tb);
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
  dest.pl.push(p.id); p.club = dest.id; p.ct = { until: dateOf(G.day).y + ri(2,4), wage: wageFor(p, dest) };
}
function yearEnd() {
  if (G.me!==null && G.mode!=='mgr') pickMentor(me());
  const y = dateOf(G.day).y;
  const PHYS = ['PAC','STA','AGI','JUM','STR','REF'];
  const yrRep = [];
  for (const id in G.players) {
    const p = G.players[id]; if (p.retired) continue; p.age++;
    // 몸 관리 점수(0~1): 주인공은 한 해 평균 피로·자기 투자, AI는 능력·무작위
    let care;
    if (p.me) { const avg = p.fatN ? p.fatSum/p.fatN : 50; care = clamp((avg<40?0.45: avg<55?0.3: avg<70?0.15:0) + (p.inv||0)*0.22 + (p.trait==='grinder'?0.05:0) + 0.1, 0, 1); p.care = care; p.fatSum = 0; p.fatN = 0; }
    else { if (p.care === undefined) p.care = clamp(0.25 + (p.ovr-60)/70 + gauss()*0.2, 0, 1); care = p.care; }
    const sh = p.sub==='GK' ? 4 : 0, ag = p.age - sh;   // 골키퍼는 늦게까지
    const tech = ag<=21?3.0 : ag<=24?1.6 : ag<=27?0.6 : ag<=30?0.1 : ag<=33?-0.3 : -0.9;
    const phys = ag<=21?2.8 : ag<=24?1.2 : ag<=27?0.1 : ag<=29?-0.5 : ag<=31?-1.2 : ag<=34?-2.0 : -2.8;
    const before = Object.assign({}, p.a), ovr0 = p.ovr;
    for (const k in p.a) {
      let d = PHYS.includes(k) ? phys : tech;
      if (d < 0) d *= (1 - 0.55*care); else if (p.me) d *= 0.55; else if (d > 0 && p.age <= 24 && p.club != null && G.clubs[p.club]) d *= 1 + 0.06*mgrFx(G.clubs[p.club],'coach');
      d += gauss()*(p.me?0.6:0.9);
      let v = Math.round(d);
      if (v > 0 && p.ovr >= p.pot) v = 0;
      p.a[k] = clamp(p.a[k] + v, 20, 97);
    }
    Eng.finalize(p);
    // 잠재력 재평가: 성장 속도, 활약(평점·인지도), 나이에 따라 조정. 젊을수록 변동 크고, 29세 이후엔 현재 능력에 수렴
    { const pot0 = p.pot, exp = ag<=21?3.0 : ag<=24?1.5 : ag<=27?0.5 : 0, gain = p.ovr - ovr0;
      let adj = (gain - exp) * 0.8;
      if (p.me) adj += clamp((p.form||6.3) - 6.5, -1.5, 2) * 1.6 + clamp(((p.fame||0) - 30)/40, -0.5, 1) + (p.trait==='genius' ? 0.4 : 0);
      else adj += gauss() * 1.1;
      if (ag >= 25) adj -= (ag - 24) * 0.35;
      const lim = ag<=21 ? 4 : ag<=24 ? 3 : 2;
      let np = pot0 + Math.round(clamp(adj, -lim, lim));
      if (ag >= 29) np = Math.min(np, p.ovr + Math.max(0, 33 - ag));
      np = clamp(np, p.ovr, 97);
      if (np !== pot0) { p.pot = np; if (p.me) { p.potLog = (p.potLog||[]).concat([[y, pot0, np]]).slice(-8); } }
      if (p.me) p.potCh = np - pot0; }
    if (p.me) { const ch = Object.keys(p.a).filter(k => p.a[k] !== before[k]).map(k => `${k} ${p.a[k]>before[k]?'+':''}${p.a[k]-before[k]}`); yrRep.push([p, ch]); }
    if (!p.me && p.age >= 34) { const ba = {34:0.04,35:0.08,36:0.15,37:0.25,38:0.35,39:0.5,40:0.65}[Math.min(p.age,40)] || 0.85; const pr = ba * (1.4 - care) * (1 - clamp((p.ovr-70)/60, 0, 0.5)) * (p.sub==='GK'?0.7:1) * (p.club===null?1.6:1); if (rnd() < pr) retire(p); }
  }
  for (const [p, ch] of yrRep) { p.yrRep = { y, age: p.age, ch, care: Math.round(p.care*100) }; p.log.unshift([G.day, `${p.age}세 연간 변화: ${ch.length?ch.slice(0,6).join(', '):'변화 없음'}`]); if (p.log.length>40) p.log.length = 40; const pc = p.potCh||0; p.log.unshift([G.day, `잠재력 재평가: ${p.pot-pc} → ${p.pot}${pc>0?' ▲':pc<0?' ▼':' (유지)'}`]); addNews('me', `📈 ${p.age}세 시즌 결산 — 종합 ${p.ovr}, 잠재 ${p.pot}${pc>0?' ▲'+pc:pc<0?' ▼'+(-pc):''} (몸 관리 ${Math.round(p.care*100)}점)`, false, { me:true }); }
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
  if (G.me!==null && G.mode!=='mgr') {
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
  if (!inWindow(t)) { if (G.me!==null && !me().retired) meOffers(t, true); return; }
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
  to.budget -= fee; to.pl.push(p.id); p.club = to.id; p.ct = { until: dateOf(G.day).y + ri(2,4), wage: wageFor(p, to) };
  p.xfers = p.xfers||[]; p.xfers.push([G.day, from?from.id:null, to.id, fee]);
  if (from && from.kind==='pro') ensureSquad(from);
  if (news && (p.ovr >= 72 || fee >= 20)) addNews('transfer', `${p.name}(${POS_KO[p.sub]}, ${p.age}) ${from?from.name:'자유계약'} → ${to.name}${fee>0?`, 이적료 약 ${fee}억 원`:' (자유계약)'}`, p.ovr>=80);
}
// ----- 주인공 로직 -----

const TRAITS = {
  grinder: { n:'노력파', d:'훈련 성장이 꾸준히 빠릅니다. 체력 소모가 조금 많아요.', gain:1.15, fat:1.08, trust:1, pot:0, b:{} },
  fighter: { n:'승부욕형', d:'슛·돌파 순간에 강합니다. 피로가 빨리 쌓입니다.', gain:1.0, fat:1.12, trust:1, pot:0, b:{ shoot:0.035, drib:0.035 } },
  maestro: { n:'플레이메이커형', d:'패스 성공률이 높고 도움 기회를 잘 만듭니다.', gain:1.0, fat:1.0, trust:1, pot:0, b:{ pass:0.08 } },
  genius: { n:'천재형', d:'잠재력이 높지만 훈련 성과가 들쭉날쭉하고 감독 신뢰를 천천히 얻습니다.', gain:1.0, fat:1.0, trust:0.8, pot:4, b:{ drib:0.05, shoot:0.02 } },
  team: { n:'팀플레이어형', d:'신뢰가 빨리 쌓이고 멘토에게 더 많이 배웁니다.', gain:1.0, fat:1.0, trust:1.3, pot:0, b:{ pass:0.04 } },
};
const traitOf = (m) => TRAITS[m.trait] || TRAITS.grinder;
const STYLE_KO = { balanced:'균형형', wide:'측면 공략형', direct:'롱볼 직선형', tiki:'점유·패스형', counter:'역습형', press:'압박형' };
const STYLE_DESC = { balanced:'공수 균형을 중시합니다.', wide:'측면에서 크로스로 기회를 만듭니다.', direct:'앞으로 길게 연결해 빠르게 마무리합니다.', tiki:'짧은 패스로 점유율을 높입니다.', counter:'수비 후 빠른 역습이 주무기입니다.', press:'높은 압박으로 공을 빼앗아 공격합니다.' };
const ROLES = {
  ST: [{ id:'tgt', n:'타깃맨', k:['FIN','HEA','STR'], st:['direct','wide'] }, { id:'poach', n:'침투형 스트라이커', k:['PAC','OTB','FIN'], st:['counter','balanced'] }, { id:'link', n:'연계형 스트라이커', k:['PAS','TEC','VIS'], st:['tiki','press'] }],
  W: [{ id:'crs', n:'크로스형 윙어', k:['CRS','PAC','DRI'], st:['wide','direct'] }, { id:'iw', n:'인사이드 포워드', k:['FIN','DRI','OTB'], st:['counter','balanced','tiki'] }, { id:'pw', n:'압박 윙어', k:['WOR','AGG','STA'], st:['press'] }],
  AM: [{ id:'pm', n:'플레이메이커', k:['PAS','VIS','TEC'], st:['tiki','balanced'] }, { id:'sh', n:'섀도 스트라이커', k:['OTB','FIN','DRI'], st:['counter','wide','direct'] }, { id:'tr', n:'트레커(활동형)', k:['WOR','PAS','STA'], st:['press'] }],
  CM: [{ id:'b2b', n:'박스 투 박스', k:['STA','WOR','PAS'], st:['press','counter','balanced'] }, { id:'dlp', n:'딥라잉 플레이메이커', k:['PAS','VIS','DEC'], st:['tiki','direct','wide'] }],
  DM: [{ id:'anc', n:'앵커맨', k:['TAK','POS','DEC'], st:['balanced','tiki','direct'] }, { id:'bw', n:'볼 위너', k:['TAK','AGG','STA'], st:['press','counter','wide'] }],
  FB: [{ id:'ov', n:'오버래핑 풀백', k:['CRS','PAC','STA'], st:['wide','direct','counter'] }, { id:'inv', n:'인버티드 풀백', k:['PAS','DEC','POS'], st:['tiki','press','balanced'] }],
  CB: [{ id:'stp', n:'스토퍼', k:['TAK','HEA','STR'], st:['direct','counter','wide'] }, { id:'bpc', n:'볼플레잉 센터백', k:['PAS','POS','DEC'], st:['tiki','press','balanced'] }],
  GK: [{ id:'ss', n:'슛스토퍼', k:['REF','HAN','AER'], st:['balanced','direct','counter','wide'] }, { id:'swk', n:'스위퍼 키퍼', k:['KIC','DEC','POS'], st:['tiki','press'] }],
};
function roleOf(m) {
  const c = G.clubs[m.club], st = c ? c.style : 'balanced'; const list = ROLES[m.sub] || ROLES.ST;
  const r = list.find(x => x.st.includes(st)) || list[0];
  const vals = r.k.map(k => m.a[k] || 0), avg = vals.reduce((x,y)=>x+y,0)/vals.length;
  return Object.assign({ style: st, fit: avg - m.ovr, avg }, r);
}
const GROUP = { GK:'g', CB:'d', FB:'d', DM:'m', CM:'m', AM:'m', W:'f', ST:'f' };
function pickMentor(m) {
  const c = G.clubs[m.club]; m.mentor = null; if (!c || c.kind==='nt') return;
  const cand = c.pl.map(id => G.players[id]).filter(p => p && !p.me && !p.retired && GROUP[p.sub]===GROUP[m.sub] && p.age >= m.age + 3);
  cand.sort((a,b) => (b.sub===m.sub) - (a.sub===m.sub) || b.ovr - a.ovr);
  m.mentor = cand.length ? cand[0].id : null;
}
function mentorOf(m) { const p = m.mentor!=null ? G.players[m.mentor] : null; return p && !p.retired && p.club===m.club ? p : null; }
const ADVICE = ['"공을 받기 전에 어디로 줄지 먼저 정해 둬."', '"훈련 때 하던 대로만 해. 경기장에서 바꾸려 하지 마."', '"수비 라인을 보고 움직임을 한 박자 빠르게 가져가 봐."', '"체력 관리도 실력이야. 쉬는 날엔 확실히 쉬어."', '"한 번 실수하면 다음 플레이에 바로 집중해."', '"감독이 원하는 역할을 이해하면 출전 시간이 늘어."'];
const ACH = { debut:['프로 데뷔','첫 공식 경기에 출전했습니다.'], goal1:['첫 골','첫 골을 기록했습니다.'], assist1:['첫 도움','첫 도움을 기록했습니다.'], hat:['해트트릭','한 경기 3골 이상.'], mvp1:['첫 MVP','경기 MVP로 뽑혔습니다.'], rate9:['평점 9점','평점 9.0 이상의 경기.'], goals10:['통산 10골','통산 10골을 넘겼습니다.'], nt1:['대표팀 데뷔','대표팀 경기에 출전했습니다.'], lvl1:['첫 성장','훈련으로 능력치가 올랐습니다.'], mentor1:['멘토의 가르침','멘토에게 조언을 받았습니다.'] };
function unlock(m, id) { m.ach = m.ach || {}; if (m.ach[id]) return; m.ach[id] = G.day; m.achNew = (m.achNew || []).concat(id); addNews('me', `🏅 업적 달성 — ${ACH[id][0]}`, false, { me:true }); }
function setCust(keys) { const m = me(); m.cust = keys.slice(0,2); m.plan = 'custom'; }
function setRoleTraining() { const m = me(), r = roleOf(m); const ks = r.k.slice().sort((a,b) => (m.a[a]||0) - (m.a[b]||0)).slice(0,2); setCust(ks); return ks; }

// ----- 재정 / 스폰서 / 오퍼 설명 -----
const BRANDS = ['나이키풋','아디다온','푸마스','뉴밸런스풋','언더암스','미즈노프로','스포츠존','에너지드링크 볼트','프로틴바 파워','게임기 플레이엑스','통신사 링크','자동차 모터원','시계 크로노','헤어 스타일 케어'];
const INV = [{ n:'없음', c:0, g:1 }, { n:'개인 트레이너', c:80, g:1.08 }, { n:'전담 코치 + 영양사', c:250, g:1.15 }];
function finOf(m) { if (!m.fin) m.fin = { earn:0, sp:0, bonus:0, out:0, tax:0, cost:0, inv:0, log:[], sps:[], spOff:[], bal:0, lm:null }; return m.fin; }
function pitchOf(o) {
  const m = me(), c = G.clubs[o.club]; if (!c) return null;
  const g = GROUP[m.sub]; const same = c.pl.map(id=>G.players[id]).filter(p=>p && !p.me && !p.retired && GROUP[p.sub]===g && p.sub===m.sub).sort((a,b)=>b.ovr-a.ovr);
  const need = STARTERS[m.sub] || 1; const rank = same.filter(p => p.ovr > m.ovr).length + 1;
  const best = same[0] ? same[0].ovr : 0, stOvr = same[Math.min(need, same.length)-1] ? same[Math.min(need, same.length)-1].ovr : 0;
  const young = m.age <= 20, gap = m.ovr - stOvr;
  let tag, desc, pt;
  if (c.kind!=='pro') { tag = '육성 과정'; desc = '경기 감각과 성장에 집중하는 과정입니다. 프로 콜업 기회는 성장에 달려 있습니다.'; pt = 80; }
  else if (rank <= 1 && gap >= 3) { tag = '팀의 핵심'; desc = `이 포지션 최고 평가(팀 내 1위)로 영입합니다. 팀 공격의 중심으로 기용할 계획입니다.`; pt = 92; }
  else if (rank <= need) { tag = young && m.pot - m.ovr >= 8 ? '주전 유망주' : '즉시 전력감'; desc = young && m.pot - m.ovr >= 8 ? '당장 주전 경쟁에 합류하면서 성장 기회도 보장하겠다는 제안입니다.' : '현재 전력으로 곧바로 주전 경쟁에 투입할 즉시 전력감으로 평가합니다.'; pt = 75; }
  else if (rank <= need + 2) { tag = young ? '성장 중심 유망주' : '로테이션 자원'; desc = young ? '당장은 교체로 시작하지만 훈련과 컵 대회에서 기회를 줄 계획입니다.' : '주전 경쟁을 하면서 교체와 컵 대회에서 출전하게 됩니다.'; pt = 45; }
  else { tag = '백업 · 장기 육성'; desc = '당분간 출전 기회가 적을 수 있습니다. 성장한 뒤를 보고 영입합니다.'; pt = 20; }
  const lg = G.leagues.find(l => l.id===c.lg);
  return { tag, desc, pt, rank, n: same.length, need, best, stOvr, style: c.style, styleKo: STYLE_KO[c.style]||'', role: (ROLES[m.sub]||ROLES.ST).find(x=>x.st.includes(c.style)) || (ROLES[m.sub]||ROLES.ST)[0], bonus: o.bonus||0, clause: o.clause||0 };
}
function finMonth(t) {
  const m = me(), f = finOf(m), c = G.clubs[m.club]; if (f.lm === t.y*100+t.m) return; f.lm = t.y*100+t.m;
  const wage = c && c.kind==='pro' ? m.ct.wage*4.3 : (c && c.kind==='univ' ? 0 : 30);
  const sp = f.sps.filter(x => x.until >= G.day).reduce((a,x)=>a + x.m, 0);
  f.sps = f.sps.filter(x => x.until >= G.day);
  const bonus = f.pend || 0; f.pend = 0;
  const gross = wage + sp + bonus, tax = gross * 0.18, agent = wage * 0.05, live = Math.min(120 + Math.min(600, gross*0.07), 40 + gross*0.4), inv = INV[m.inv||0].c;
  const cost = tax + agent + live + inv, net = gross - cost;
  f.earn += wage; f.sp += sp; f.bonus += bonus; f.tax += tax; f.cost += agent + live; f.inv += inv; f.bal += net;
  f.log.unshift({ y:t.y, m:t.m, wage:Math.round(wage), sp:Math.round(sp), bonus:Math.round(bonus), tax:Math.round(tax), live:Math.round(agent+live), inv, net:Math.round(net) }); if (f.log.length>12) f.log.length = 12;
  if (f.bal < 0 && m.inv) { m.inv = 0; G.inbox.unshift({ d:G.day, text:'잔고 부족으로 개인 지원 서비스가 중단되었습니다.' }); }
  // 스폰서 제안
  if (c && c.kind==='pro' && f.spOff.length < 2 && f.sps.length < 3 && m.fame >= 15 && rnd() < 0.12 + m.fame/400) {
    const used = f.sps.map(x=>x.b).concat(f.spOff.map(x=>x.b)); const b = pick(BRANDS.filter(x=>!used.includes(x))); if (b) {
      const mo = Math.round((30 + Math.pow(m.fame,1.4)*3*(m.ovr/60)) * (0.8 + rnd()*0.5) / 5) * 5; const o = { b, m: mo, years: ri(1,3), until: G.day + 21 };
      f.spOff.push(o); G.inbox.unshift({ d:G.day, text:`스폰서 제안: ${b} (월 ${mo}만 원 · ${o.years}년)` }); }
  }
  f.spOff = f.spOff.filter(x => x.until >= G.day);
}
function sponsorAccept(i) { const f = finOf(me()), o = f.spOff[i]; if (!o) return; f.spOff.splice(i,1); f.sps.push({ b:o.b, m:o.m, until: G.day + o.years*365 }); addNews('me', `${me().name}, ${o.b}과(와) 스폰서 계약`, false, { me:true }); }
function sponsorDecline(i) { finOf(me()).spOff.splice(i,1); }
function setInv(n) { const m = me(); if (INV[n]) m.inv = n; }

// ----- 감독 1대1 면담 -----
const COACH = ['엄격한 지도자','소통형 지도자','전술가형 지도자','원칙주의 지도자'];
const COACH_FX = [ { humble:2, ask:-2, ego:-3 }, { ask:2, humble:1, leave:-1 }, { tactic:3, humble:1 }, { team:2, ask:1, ego:-2, leave:-3 } ];
const coachOf = (c) => COACH[(c.id||0) % 4];
const MEET = {
  bench:{ title:'출전 시간 면담', q:'요즘 출전 시간이 적어서 신경 쓰이지? 솔직하게 얘기해 보게.', opts:[
    { ty:'humble', t:'더 열심히 훈련해서 기회를 잡겠습니다.', trust:4, mor:-1, push:6, resp:'그 자세면 됐네. 훈련에서 보여주면 기회를 주지.' },
    { ty:'ask', t:'출전 기회를 조금 더 주셨으면 합니다.', trust:-1, mor:3, push:3, resp:'기회는 실력으로 만드는 거야. 하지만 의견은 들었네.' },
    { ty:'team', t:'팀이 잘하고 있으니 괜찮습니다.', trust:2, mor:-3, push:0, resp:'팀을 먼저 생각하는 건 좋지만, 욕심도 필요하네.' },
    { ty:'leave', t:'뛸 수 있는 팀으로 이적하고 싶습니다.', trust:-8, mor:1, push:-4, out:1, resp:'…알겠네. 좋은 제안이 오면 검토해 보지.' } ] },
  slump:{ title:'부진 면담', q:'요즘 경기력이 많이 떨어졌어. 무슨 문제가 있나?', opts:[
    { ty:'humble', t:'제 실수입니다. 훈련으로 되찾겠습니다.', trust:3, mor:-1, push:3, rest:0, resp:'알고 있다면 됐어. 다음 경기를 기대하지.' },
    { ty:'tactic', t:'전술 이해를 더 도와주세요. 역할을 정확히 알고 싶습니다.', trust:2, mor:1, push:4, resp:'좋은 질문이야. 영상으로 같이 점검하자.' },
    { ty:'ask', t:'체력적으로 지쳤습니다. 휴식이 필요합니다.', trust:-1, mor:2, rest:1, resp:'알겠네. 이번 주는 회복에 집중하게.' },
    { ty:'ego', t:'동료들과 호흡이 안 맞아서 그렇습니다.', trust:-5, mor:-2, push:-3, resp:'남 탓은 곤란하네. 스스로부터 돌아보게.' } ] },
  praise:{ title:'칭찬·기대치 면담', q:'요즘 아주 좋은 활약이야. 앞으로 어떻게 하고 싶나?', opts:[
    { ty:'humble', t:'동료들 덕분입니다. 더 발전하겠습니다.', trust:4, mor:2, push:4, resp:'겸손하군. 그런 선수가 오래 가지.' },
    { ty:'ego', t:'더 높은 수준의 팀에서 뛰고 싶습니다.', trust:-2, mor:3, out:1, resp:'야망은 좋지만 지금 팀부터 챙기게.' },
    { ty:'ask', t:'제 역할을 더 중심으로 키워 주세요.', trust:1, mor:3, push:7, resp:'좋아, 공격 전개에서 더 많은 책임을 맡기겠네.' },
    { ty:'raise', t:'연봉 재협상을 요청드립니다.', trust:-1, mor:2, raise:1, resp:'구단과 상의해 보겠네.' } ] },
  role:{ title:'시즌 역할 면담', q:'이번 시즌 내가 자네에게 기대하는 역할은 이거야. 의견이 있나?', opts:[
    { ty:'humble', t:'역할을 받아들이고 맞춰 가겠습니다.', trust:4, mor:1, push:5, roleTrain:1, resp:'좋아. 부족한 부분은 따로 훈련시켜 주지.' },
    { ty:'tactic', t:'제 장점을 살릴 수 있는 방식으로 조금 조정해 주세요.', trust:1, mor:2, push:2, resp:'생각해 보지. 훈련에서 먼저 보여주게.' },
    { ty:'ego', t:'다른 역할이 저에게 더 맞습니다.', trust:-4, mor:1, push:-3, resp:'팀에는 팀의 계획이 있어. 그걸 먼저 따르게.' },
    { ty:'team', t:'팀이 필요한 곳이라면 어디서든 뛰겠습니다.', trust:3, mor:0, push:3, resp:'그런 헌신이 팀을 만든다네.' } ] },
};
function meetCheck(t) {
  const m = me(), c = G.clubs[m.club]; if (!c || c.kind!=='pro' || m.meet) return;
  if (m.lastMeet && G.day - m.lastMeet < 40) return;
  m.meetCd = m.meetCd || {}; const ok = (k) => !m.meetCd[k] || G.day - m.meetCd[k] > 110;
  let type = null;
  if ((t.m===8 || t.m===3) && t.d===5 && ok('role')) type = 'role';
  else if ((m.benchStreak||0) >= 3 && ok('bench')) type = 'bench';
  else if (m.form < 5.8 && m.st.a >= 4 && ok('slump') && rnd() < 0.2) type = 'slump';
  else if (m.form >= 7.4 && m.st.a >= 5 && ok('praise') && rnd() < 0.2) type = 'praise';
  if (!type) return;
  const d = MEET[type], r = roleOf(m);
  m.meet = { type, day: G.day, title: d.title, q: type==='role' ? `이번 시즌 자네의 역할은 ‘${r.n}’야. ${d.q.split('. ')[1] || d.q}` : d.q, coach: coachOf(c) };
  m.meetCd[type] = G.day; m.lastMeet = G.day;
  G.inbox.unshift({ d: G.day, text: `${c.name} 감독이 면담을 요청했습니다. (${d.title})` });
}
function answerMeeting(i) {
  const m = me(), mt = m.meet; if (!mt) return null; const d = MEET[mt.type], o = d.opts[i]; if (!o) return null;
  const c = G.clubs[m.club], cf = COACH_FX[(c.id||0)%4] || {}; const bonus = cf[o.ty] || 0;
  m.trust = clamp(m.trust + o.trust + bonus, 0, 100); m.mor = clamp(m.mor + (o.mor||0), 20, 100);
  m.push = clamp((m.push||0) + (o.push||0), -15, 20);
  if (o.rest) m.fat = Math.max(0, m.fat - 15);
  if (o.out) m.wantOut = G.day;
  if (o.roleTrain) setRoleTraining();
  let extra = '';
  if (o.raise) { const ok = m.trust >= 55 && m.form >= 6.8; if (ok) { m.ct.wage = Math.round(m.ct.wage * 1.1); extra = ` 주급이 ${m.ct.wage}만 원으로 올랐습니다.`; } else extra = ' 지금은 어렵다는 답을 받았습니다.'; }
  const fx = `신뢰 ${(o.trust+bonus)>=0?'+':''}${o.trust+bonus} · 사기 ${(o.mor||0)>=0?'+':''}${o.mor||0}`;
  m.meetLog = [{ d: G.day, title: mt.title, pick: o.t, resp: o.resp + extra, fx }].concat(m.meetLog||[]).slice(0,6);
  G.inbox.unshift({ d: G.day, text: `감독 면담 — ${o.resp}${extra}` });
  m.meet = null; return { resp: o.resp + extra, fx };
}
// ----- 스카우트 평가 -----
function scoutOf(m) {
  const c = G.clubs[m.club], seed = (m.id*131 + Math.floor(G.day/30)*17) % 1000;
  const nz = (k) => { const x = Math.sin(seed*12.9898 + k*78.233) * 43758.5453; return (x - Math.floor(x)) - 0.5; };
  const rel = m.ovr - (c ? c.strength : 60);
  const grade = rel>=7?'S' : rel>=4?'A' : rel>=1?'B+' : rel>=-2?'B' : rel>=-5?'C' : 'D';
  const unc = m.fame<25 ? 6 : m.fame<50 ? 4 : 2;
  const lo = Math.max(m.ovr, Math.round(m.pot - unc + nz(1)*3)), hi = Math.min(97, Math.max(lo, Math.round(m.pot + unc + nz(2)*3)));
  const stars = clamp(Math.round(((lo+hi)/2 - 58)/7.5*2)/2, 1, 5);
  const keys = (m.sub==='GK' ? ['REF','HAN','KIC','AER','DEC'] : Object.keys(m.a)).slice().sort((a,b)=>m.a[b]-m.a[a]);
  const strong = keys.slice(0,3), weak = keys.slice(-3).reverse();
  const cur = c ? c.strength : 60, maxL = lvl(c||{kind:'pro',tier:2,cc:'KOR'}) + (m.ovr>=72?2:1);
  const cands = G.clubs.filter(x => x.kind==='pro' && x.id!==m.club && lvl(x) <= maxL && x.strength <= cur + 8 + m.fame/12 && m.ovr >= x.strength-9).sort((a,b)=>b.strength-a.strength);
  const interest = cands.slice(0,12).filter((x,i) => (i*7 + seed) % 3 !== 0).slice(0,4).map(x => ({ id:x.id, lv: x.strength - cur > 4 ? '관심' : x.strength - cur > -2 ? '높음' : '관찰' }));
  const r = roleOf(m), tips = [];
  if (m.age <= 20 && m.pot - m.ovr >= 8) tips.push('성장 폭이 큰 유망주로 평가합니다.');
  if (m.age >= 30) tips.push('경험은 풍부하지만 신체 능력 하락을 주의해야 합니다.');
  if (m.form >= 7.2) tips.push('최근 경기력이 매우 좋습니다.'); else if (m.form < 5.9) tips.push('최근 경기력이 흔들리고 있습니다.');
  if (r.fit < -3) tips.push(`현재 팀 전술(${STYLE_KO[r.style]})의 ‘${r.n}’ 역할에는 능력이 조금 부족합니다.`); else if (r.fit >= 2) tips.push(`현재 팀의 ‘${r.n}’ 역할에 잘 맞습니다.`);
  if (m.fat > 75) tips.push('피로가 쌓여 부상 위험이 있습니다.');
  if (!tips.length) tips.push('꾸준히 성장 중인 선수입니다.');
  return { grade, stars, lo, hi, unc, strong, weak, interest, tips, value: price(m), fame: m.fame };
}
function marketInfo() {
  const t = dateOf(G.day), open = inWindow(t), next = open ? G.day : nextWindowDay();
  const fa = G.fa.map(id => G.players[id]).filter(p => p && !p.retired).sort((a,b)=>b.ovr-a.ovr).slice(0, 10);
  return { open, next, days: next - G.day, fa };
}
const PP = {
  ST:{ fin:{n:'골 결정력',k:['FIN','COM']}, head:{n:'헤딩·점프',k:['HEA','JUM']}, move:{n:'침투·오프더볼',k:['OTB','PAC']}, hold:{n:'몸싸움·키핑',k:['STR','TEC']}, link:{n:'연계 패스',k:['PAS','VIS']}, body:{n:'체력',k:['STA','WOR']} },
  W:{ drib:{n:'드리블·돌파',k:['DRI','AGI']}, spd:{n:'스피드',k:['PAC','AGI']}, cross:{n:'크로스·컷백',k:['CRS','PAS']}, fin:{n:'컷인 마무리',k:['FIN','TEC']}, link:{n:'2대1·연계',k:['PAS','OTB']}, body:{n:'체력·수비 가담',k:['STA','WOR']} },
  AM:{ pass:{n:'창의 패스',k:['PAS','VIS']}, tech:{n:'드리블·턴',k:['DRI','TEC']}, shot:{n:'중거리·프리킥',k:['FIN','TEC']}, move:{n:'침투 타이밍',k:['OTB','DEC']}, calm:{n:'침착성·판단',k:['COM','DEC']}, body:{n:'체력·압박',k:['STA','WOR','AGG']} },
  CM:{ pass:{n:'패스 레인지',k:['PAS','VIS']}, ctrl:{n:'볼 소유·턴',k:['TEC','DEC']}, def:{n:'수비 커버',k:['TAK','POS']}, run:{n:'활동량',k:['STA','WOR']}, shot:{n:'중거리 슛',k:['FIN','TEC']}, mind:{n:'판단·위치선정',k:['DEC','POS','OTB']} },
  DM:{ tkl:{n:'태클·인터셉트',k:['TAK','DEC']}, pos:{n:'위치선정·마킹',k:['POS','MAR']}, phy:{n:'피지컬',k:['STR','AGG']}, pass:{n:'전진 패스',k:['PAS','VIS']}, run:{n:'활동량',k:['STA','WOR']}, air:{n:'공중볼',k:['HEA','JUM']} },
  FB:{ run:{n:'오버래핑 스피드',k:['PAC','STA']}, cross:{n:'크로스',k:['CRS','PAS']}, def:{n:'1대1 수비',k:['MAR','TAK']}, drib:{n:'드리블',k:['DRI','AGI']}, pos:{n:'위치·커버',k:['POS','DEC']}, air:{n:'공중볼',k:['HEA','JUM']} },
  CB:{ mark:{n:'마킹·태클',k:['MAR','TAK']}, air:{n:'헤딩 수비',k:['HEA','JUM']}, phy:{n:'피지컬',k:['STR','AGG']}, pos:{n:'위치선정·판단',k:['POS','DEC']}, build:{n:'빌드업 패스',k:['PAS','VIS']}, spd:{n:'스피드 회복',k:['PAC','AGI']} },
  GK:{ ref:{n:'반사신경',k:['REF','HAN']}, air:{n:'공중볼·펀칭',k:['AER','HAN']}, kick:{n:'킥·배급',k:['KIC','DEC']}, mind:{n:'위치·판단',k:['DEC','REF']}, one:{n:'1대1 대응',k:['REF','AER']}, hand:{n:'핸들링',k:['HAN','AER']} }
};
const plansOf = (m) => Object.assign({}, PP[(m || me()).sub] || PP.ST, { custom:{ n:'개인 특훈', k:[] }, rest:{ n:'휴식', k:[] } });
function normPlan(m) { const P = plansOf(m); if (!P[m.plan]) m.plan = Object.keys(P)[0]; return P; }
const PLANS = plansOf({ sub:'ST' });
function trainingDay() {
  const m = me(); const t = dateOf(G.day);
  const hasMatch = G.pendingMine || (G.lastRes[m.club] && G.lastRes[m.club].day===G.day);
  const tr = traitOf(m); m.fatSum = (m.fatSum||0) + m.fat; m.fatN = (m.fatN||0) + 1; m.push = (m.push||0) * 0.992;
  if (m.plan==='rest' || t.dow===0) { m.fat = Math.max(0, m.fat-(m.plan==='rest'?8:5)); return; }
  const PL = normPlan(m); const pl = PL[m.plan]; const age = m.age;
  const keys = m.plan==='custom' ? (m.cust && m.cust.length ? m.cust : [m.sub==='GK'?'REF':'FIN']) : pl.k;
  let gain = (age<=17?0.03: age<=21?0.026: age<=24?0.016: 0.008) * (m.fat>75?0.5:1) * (1+(m.trust-50)/300) * tr.gain;
  if (m.trait==='genius') gain *= 0.6 + rnd()*0.9;
  if (m.plan==='custom') gain *= keys.length===1 ? 1.5 : 1.1;
  let mt = mentorOf(m); if (!mt && (G.day + m.id) % 30 === 0) { pickMentor(m); mt = mentorOf(m); }
  const mq = mt ? clamp((mt.ovr - m.ovr)/25, 0, 0.6) * (m.trait==='team' ? 1.4 : 1) : 0;
  gain *= 1 + mq*0.5; gain *= INV[m.inv||0].g;
  m.acc = m.acc||{};
  for (const k of keys) {
    let g = gain; if (mt && (mt.a[k]||0) > (m.a[k]||0) + 5) g *= 1.2;
    m.acc[k] = (m.acc[k]||0) + g;
    if (m.acc[k] >= 1 && m.a[k] < 97 && m.ovr < m.pot) { m.a[k]++; m.acc[k] -= 1; m.log.unshift([G.day, `${k} +1`]); if (m.log.length>40) m.log.length=40; Eng.finalize(m); unlock(m, 'lvl1'); }
  }
  if (mt && rnd() < 0.018) {
    const k = pick(keys.length ? keys : ['PAS']); m.acc[k] = (m.acc[k]||0) + 0.25; m.trust = clamp(m.trust + 1, 0, 100);
    const msg = `${mt.name} 선배: ${pick(ADVICE)}`; m.tutorLog = [{ d: G.day, t: msg }].concat(m.tutorLog || []).slice(0, 4); G.inbox.unshift({ d: G.day, text: `멘토 ${msg}` }); unlock(m, 'mentor1');
  }
  m.fat = clamp(m.fat + (3.2 - 2.2) * tr.fat + (hasMatch?8:0), 0, 100);
  if (m.fat > 85 && rnd() < 0.01) m.inj = ri(3,14);
  m.mor = clamp(m.mor + (rnd()-0.5)*1.2, 20, 100);
}
function meRole(team) {
  const m = me(); if (G.mode === 'mgr') return 'mgr';
  if (m.inj>0) return 'inj';
  const mates = team.pl.map(id=>G.players[id]).filter(p=>p && !p.me && p.sub===m.sub && p.inj===0).sort((a,b)=>b.ovr-a.ovr);
  const slots = { GK:1, CB:2, FB:2, DM:1, CM:2, AM:1, W:2, ST:2 }[m.sub];
  const refOvr = mates.length >= slots ? mates[slots-1].ovr : 40;
  const p = clamp(0.5 + (m.ovr-refOvr)/9 + (m.trust-50)/250 + (m.push||0)/100 + (m.fat>85?-0.2:0), 0.04, 0.97);
  const r = rnd();
  if (r < p) return 'start'; if (r < p + (1-p)*0.55) return 'sub'; return 'bench';
}
function matchTitle(ctx) {
  if (ctx.t==='lg') return leagueOf(ctx.id).name; if (ctx.t==='nt') return '국가대표 경기';
  const c = compById(ctx.id); return c ? (c.name + (ctx.third ? ' · 3·4위전' : c.rl?` · ${c.rl}`:'')) : '대회';
}
function genExtras(stMine, stOpp, evAll) {
  const ex = [];
  const nm = (l) => { const a = l.filter(p => !p.me); return a.length ? pick(a) : null; };
  const add = (min, t, ms, p) => { if (p) ex.push({ min, t, ms, p, shown: false }); };
  for (let i = ri(1,4); i > 0; i--) { const ms = rnd() < 0.5; const p = nm(ms ? stMine : stOpp); if (p && !ex.some(e => e.t === 'yc' && e.p === p)) add(ri(8,89), 'yc', ms, p); }
  if (rnd() < 0.12) { const c0 = ex.filter(e => e.t === 'yc' && e.min <= 80 && !evAll.some(g => g.sc === e.p || g.as === e.p)); if (c0.length) { const e0 = pick(c0); ex.push({ min: ri(e0.min + 4, 89), t: 'rc', ms: e0.ms, p: e0.p, second: true, shown: false }); } }   // 경고 2회 = 퇴장
  if (rnd() < 0.07) { const ms = rnd() < 0.5, min = ri(30,88); const l = (ms ? stMine : stOpp).filter(p => !p.me && p.sub !== 'GK' && !evAll.some(e => e.min >= min && (e.sc === p || e.as === p))); add(min, 'rc', ms, l.length ? pick(l) : null); }
  for (let i = ri(1,3); i > 0; i--) { const ms = rnd() < 0.5; const gk = (ms ? stMine : stOpp).find(p => p.sub === 'GK' && !p.me); add(ri(5,89), 'sv', ms, gk); }
  for (let i = ri(0,2); i > 0; i--) { const ms = rnd() < 0.5; add(ri(5,89), 'pt', ms, nm((ms ? stMine : stOpp).filter(p => ['ST','W','AM','CM'].includes(p.sub)))); }
  for (let i = ri(3,6); i > 0; i--) { const ms = rnd() < 0.5; add(ri(4,89), 'ch', ms, nm((ms ? stMine : stOpp).filter(p => ['ST','W','AM','CM'].includes(p.sub)))); }
  for (let i = ri(2,5); i > 0; i--) { const ms = rnd() < 0.5; add(ri(4,89), 'cn', ms, nm((ms ? stMine : stOpp).filter(p => ['W','FB','CM','AM'].includes(p.sub)))); }
  for (let i = ri(1,3); i > 0; i--) { const ms = rnd() < 0.5; add(ri(6,89), 'fl', ms, nm((ms ? stMine : stOpp).filter(p => p.sub !== 'GK'))); }
  if (rnd() < 0.3) { const ms = rnd() < 0.5; add(ri(15,85), 'ij', ms, nm((ms ? stMine : stOpp).filter(p => p.sub !== 'GK'))); }
  for (let i = ri(1,3); i > 0; i--) { const ms = rnd() < 0.5; add(ri(6,88), 'of', ms, nm((ms ? stMine : stOpp).filter(p => ['ST','W','AM'].includes(p.sub)))); }              // 오프사이드 깃발
  if (rnd() < 0.3) { const ms = rnd() < 0.5, min = ri(10,88); if (!evAll.some(e => Math.abs(e.min - min) <= 2)) { add(min, 'dg', ms, nm((ms ? stMine : stOpp).filter(p => ['ST','W','AM'].includes(p.sub)))); const e = ex[ex.length - 1]; if (e && e.t === 'dg') e.why = pick(['off','off','off','foul','hand']); } }   // VAR로 취소된 골(점수 불변)
  if (rnd() < 0.15) { const ms = rnd() < 0.5, min = ri(12,86); if (!evAll.some(e => Math.abs(e.min - min) <= 2)) { add(min, 'pk', ms, nm((ms ? stMine : stOpp).filter(p => ['ST','W','AM','CM'].includes(p.sub)))); const e = ex[ex.length - 1]; if (e && e.t === 'pk') { e.gk = (ms ? stOpp : stMine).find(p => p.sub === 'GK' && !p.me) || null; e.res = rnd() < 0.6 ? 'sv' : 'miss'; } } }   // 페널티킥 선언(VAR 확인) 후 실축/선방(점수 불변)
  for (const e of ex) if (e.t === 'rc' && !e.second && rnd() < 0.5) e.var = true;                                                                   // 직접 퇴장 일부는 VAR 확인
  const off = new Map(); ex.forEach(e => { if (e.t === 'rc' && e.p) off.set(e.p, Math.min(off.get(e.p) || 99, e.min)); });                          // 퇴장 선수는 이후 경기 이벤트 없음
  const out = ex.filter(e => !(e.p && off.has(e.p) && e.min > off.get(e.p)) && !(e.t === 'rc' && e.p && off.get(e.p) < e.min));
  return out.sort((a, b) => a.min - b.min);
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
// 월드컵 토너먼트 90분 무승부 → 경기장에서 연장전(91~120분) 진행: 연장 득점 생성 + 승부차기 승자 결정
function wcKO(M) { return !!(M && M.ctx && M.ctx.t === 'wc' && M.ctx.ti !== undefined && M.ctx.g === undefined); }
function wcExtra(M) {
  if (M.xt) return M.xt;
  const dA = M.mine.strength - M.opp.strength, poi = (l) => { let L = Math.exp(-l), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
  const gm = poi(0.36 * Math.exp(dA * 0.012)), go = poi(0.36 * Math.exp(-dA * 0.012));
  const mk = (club, n, st) => genEvents(club, n, st, []).map(e => { e.min = ri(91, 119); e.pen = false; return e; }).sort((a, b) => a.min - b.min);
  const em = mk(M.mine, gm, M.stMine), eo = mk(M.opp, go, M.stOpp);
  M.evMine.push(...em); M.evOpp.push(...eo);
  const pm = clamp(0.5 + dA * 0.004, 0.3, 0.7), mineWins = rnd() < pm;
  M.xt = { gm, go, eh: M.mineHome ? gm : go, ea: M.mineHome ? go : gm, mineWins, w: mineWins ? M.mine.id : M.opp.id };
  M.ctx.xt = M.xt; return M.xt;
}
function prepareMine() {
  const pm = G.pendingMine, m = me();
  if (G.mode==='mgr' && !G.wc && G.mgr) { const g = mgrX(), mc = G.clubs[m.club]; for (const id of mc.pl) { const q = G.players[id]; if (q && !q.mgr) q.cond = clamp(95 + (g.mood - 50)/8, 70, 100); } }
  const h = clubOf(pm.h), a = clubOf(pm.a), mineHome = mineIn(pm.h);
  const sqH = availableSquad(h, true), sqA = availableSquad(a, true);
  const neutral = pm.ctx.t==='po' || pm.ctx.t==='wc' || (pm.ctx.t==='cont' && pm.ctx.fin);
  const o = Eng.simulate(rnd, { squad: sqH, tactic: h.tactic }, { squad: sqA, tactic: a.tactic }, { homeA: !neutral });
  const stH = startersFor(h, sqH), stA = startersFor(a, sqA);
  const bH = sqH.filter(p=>!stH.includes(p)), bA = sqA.filter(p=>!stA.includes(p));
  const mine = mineHome ? h : a, opp = mineHome ? a : h;
  const role = meRole(mine);
  const mineGoals = mineHome ? o.gA : o.gB, oppGoals = mineHome ? o.gB : o.gA;
  const evMine = genEvents(mine, mineGoals, mineHome?stH:stA, mineHome?bH:bA), evOpp = genEvents(opp, oppGoals, mineHome?stA:stH, mineHome?bA:bH);
  const evx = genExtras(mineHome?stH:stA, mineHome?stA:stH, evMine.concat(evOpp));
  const sub0 = m.sub, nBase = (sub0==='ST'||sub0==='W'||sub0==='AM'||sub0==='GK') ? [5,7] : [4,6];
  const nChance = role==='start' ? ri(nBase[0], nBase[1]) : role==='sub' ? ri(2,4) : 0;
  const from = role==='sub' ? ri(55,70) : 3;
  const moments = [];
  const kinds = POSK[sub0] || POSK.ST;
  { const lo = Math.max(from,5), hi = 88; let gap = 7;                                  // 장면 사이 최소 간격(분) — 한 곳에 몰리지 않게
    for (let tries = 0; tries < 60 && moments.length < nChance; tries++) { const mn = ri(lo, hi); if (moments.every(o => Math.abs(o.min - mn) >= gap)) moments.push({ min: mn, kind: null, done:false }); if (tries === 30) gap = 4; }
    moments.sort((x,y)=>x.min-y.min); let prev = null;
    moments.forEach(o => { const pool = kinds.filter(k => k !== prev); o.kind = pick(pool.length ? pool : kinds); prev = o.kind; }); }
  G.mm = { pm, ctx: pm.ctx, title: matchTitle(pm.ctx), h, a, mineHome, mine, opp, evMine, evOpp, evx, stMine: mineHome?stH:stA, stOpp: mineHome?stA:stH, role, moments, mi: 0, oppStr: opp.strength, mg: mineHome? sqH:sqA, myGoals: 0, myAssists: 0, myRate: 6.0, sh: 0, from, state: 'ready', sqH, sqA };
  if (G.mode === 'mgr') { const mq = mineHome ? sqH : sqA, oq = mineHome ? sqA : sqH; Object.assign(G.mm, { neutral, mgrXi: Eng.buildLineup(mq, mine.tactic).map(e => e.p.id), benchMine: mineHome ? bH : bA, benchOpp: mineHome ? bA : bH, mgrSubs: 0, mgrChanges: 0, talk: 0 }); }
  return G.mm;
}
// ----- 포지션별 플레이 선택지 -----
const PREFS = {
  drib:{ n:'드리블 돌파' }, onetwo:{ n:'2대1 패스' }, long:{ n:'중거리 슛' }, fin:{ n:'박스 안 마무리' }, head:{ n:'헤딩' },
  cross:{ n:'크로스' }, thru:{ n:'스루패스' }, build:{ n:'빌드업 패스' }, tkl:{ n:'태클·인터셉트' }, aer:{ n:'공중볼 수비' },
  save:{ n:'슈팅 선방' }, dist:{ n:'킥 배급' },
};
const PREF_POS = { ST:['fin','head','long','onetwo','drib','thru'], W:['drib','onetwo','cross','fin','long','thru'], AM:['thru','onetwo','long','drib','fin','build'], CM:['build','thru','long','onetwo','tkl','drib'], DM:['tkl','build','aer','thru','long'], FB:['cross','tkl','drib','onetwo','build','aer'], CB:['aer','tkl','build','head','long'], GK:['save','dist','build','aer'] };
const PREF_AT = { drib:['DRI','AGI'], onetwo:['PAS','OTB'], long:['FIN','TEC'], fin:['FIN','COM'], head:['HEA','JUM'], cross:['CRS'], thru:['PAS','VIS'], build:['PAS','DEC'], tkl:['TAK','MAR'], aer:['HEA','JUM'], save:['REF','HAN'], dist:['KIC','DEC'] };
// k: 능력 가중치, b: 기본 성공률, s: 능력 계수, t: 성향 보너스키, g: 성공 시 골 확률(1=성공이 곧 골), a: 어시스트 확률, st/cn: 수비 성공 시 실점 차단 / 실패 시 실점 확률
const OPT = {
  shoot:{ n:'슛', tag:'fin', k:[['FIN',.5],['COM',.25],['TEC',.25]], b:.07, s:.0085, t:'shoot', g:1, lo:.05, hi:.65, pos:1, tg:['오른발 슛! 골망을 흔듭니다!','침착하게 마무리! 골입니다!','강력한 슛이 구석에 꽂힙니다!'], ko:['슛이 골대를 살짝 벗어납니다.','골키퍼가 막아냅니다.','수비수 몸에 맞고 나갑니다.'] },
  oneT:{ n:'원터치 슛', tag:'fin', k:[['FIN',.6],['TEC',.2],['OTB',.2]], b:.05, s:.0085, t:'shoot', g:1, lo:.04, hi:.6, pos:1, tg:['원터치 슛! 그대로 꽂힙니다!'], ko:['급하게 때린 슛이 빗나갑니다.','원터치 슛이 골키퍼 정면입니다.'] },
  chip:{ n:'칩슛', tag:'fin', k:[['FIN',.4],['TEC',.4],['COM',.2]], b:.04, s:.009, t:'shoot', g:1, lo:.04, hi:.55, pos:1, tg:['키퍼 머리 위로 사뿐히 넘깁니다! 골!'], ko:['칩슛이 크로스바 위로 뜹니다.','키퍼가 걷어냅니다.'] },
  long:{ n:'중거리 슛', tag:'long', k:[['FIN',.5],['TEC',.3],['COM',.2]], b:.02, s:.008, t:'shoot', g:1, lo:.03, hi:.32, tg:['중거리 슛! 골망 구석에 꽂힙니다!'], ko:['중거리 슛이 골대 위로 넘어갑니다.','멀리서 때린 슛을 키퍼가 처리합니다.'] },
  volley:{ n:'발리슛', tag:'fin', k:[['TEC',.5],['FIN',.5]], b:.04, s:.0085, t:'shoot', g:1, lo:.03, hi:.5, tg:['완벽한 발리슛! 골입니다!'], ko:['발리슛이 빗나갑니다.'] },
  head:{ n:'헤딩 슛', tag:'head', k:[['HEA',.6],['JUM',.2],['OTB',.2]], b:.05, s:.009, t:'shoot', g:1, lo:.03, hi:.55, tg:['높이 뛰어올라 헤딩! 골입니다!'], ko:['헤딩이 골대를 벗어납니다.','키퍼가 쳐냅니다.'] },
  cutin:{ n:'컷인 슛', tag:'drib', k:[['DRI',.3],['FIN',.4],['TEC',.3]], b:.06, s:.009, t:'shoot', g:1, lo:.04, hi:.55, tg:['안쪽으로 파고들며 감아 찹니다! 골!'], ko:['컷인 슛이 막힙니다.','수비수에게 차단당합니다.'] },
  setD:{ n:'직접 프리킥', tag:'long', k:[['TEC',.5],['FIN',.4],['COM',.1]], b:.04, s:.008, t:'shoot', g:1, lo:.03, hi:.38, tg:['프리킥이 벽을 넘어 골망을 흔듭니다!'], ko:['프리킥이 벽에 맞습니다.','프리킥이 골문을 벗어납니다.'] },
  drib:{ n:'드리블 돌파', tag:'drib', k:[['DRI',.5],['AGI',.25],['PAC',.25]], b:.28, s:.011, t:'drib', g:.3, lo:.1, hi:.85, osf:1.5, tg:['수비수를 제치고 직접 마무리! 골입니다!'], ok:['수비를 벗겨냈지만 마무리가 아쉽습니다.','돌파에 성공해 기회를 만듭니다.'], ko:['돌파가 막힙니다.','볼을 빼앗깁니다.'] },
  turn:{ n:'턴 후 전진', tag:'drib', k:[['DRI',.4],['AGI',.3],['STR',.3]], b:.4, s:.01, t:'drib', g:.1, a:.2, lo:.15, hi:.88, ok:['몸을 돌려세우고 공격을 전개합니다.'], tg:['턴으로 수비를 따돌리고 직접 마무리해 골을 터뜨립니다!'], ta:['턴 후 찔러준 패스가 골로 연결됩니다 — 어시스트!'], ko:['턴 동작에서 볼을 빼앗깁니다.'] },
  dribOut:{ n:'드리블로 탈출', tag:'drib', k:[['DRI',.5],['AGI',.5]], b:.35, s:.011, t:'drib', lo:.12, hi:.85, ok:['압박을 벗겨내며 공을 지켜냅니다.'], ko:['압박에 볼을 뺏깁니다.'] },
  onetwo:{ n:'2대1 패스', tag:'onetwo', k:[['PAS',.4],['OTB',.3],['TEC',.3]], b:.4, s:.011, t:'pass', g:.38, lo:.15, hi:.9, osf:1.5, tg:['2대1 패스로 수비를 허물고 마무리! 골!'], ok:['2대1 패스로 수비를 벗겨냅니다.','원투 패스가 깔끔하게 연결됩니다.'], ko:['리턴 패스가 수비에 끊깁니다.'] },
  thruP:{ n:'스루패스', tag:'thru', k:[['PAS',.5],['VIS',.5]], b:.38, s:.011, t:'pass', a:.5, lo:.12, hi:.88, osf:1.5, ta:['날카로운 스루패스! 동료가 마무리합니다 — 어시스트!'], ok:['스루패스는 정확했지만 동료의 슛이 막힙니다.'], ko:['스루패스가 수비에 끊깁니다.','패스가 길어 터치라인을 벗어납니다.'] },
  cutback:{ n:'컷백 패스', tag:'cross', k:[['PAS',.4],['CRS',.3],['VIS',.3]], b:.38, s:.011, t:'pass', a:.5, lo:.12, hi:.86, osf:1.5, ta:['컷백 패스! 동료가 밀어 넣습니다 — 어시스트!'], ok:['컷백 패스가 수비에 걸려 슛이 무산됩니다.'], ko:['컷백이 수비에 막힙니다.'] },
  crossO:{ n:'크로스', tag:'cross', k:[['CRS',.7],['TEC',.3]], b:.36, s:.012, t:'pass', a:.42, lo:.1, hi:.85, osf:1.5, ta:['정확한 크로스! 헤딩 골로 이어집니다 — 어시스트!'], ok:['크로스는 좋았지만 마무리가 안 됩니다.'], ko:['크로스가 수비수에게 걸립니다.','크로스가 라인 밖으로 나갑니다.'] },
  holdup:{ n:'키핑 후 연계', tag:'build', k:[['STR',.4],['TEC',.3],['PAS',.3]], b:.45, s:.01, t:'pass', a:.25, lo:.15, hi:.88, ta:['버텨낸 뒤 내준 패스가 골로 이어집니다 — 어시스트!'], ok:['공을 지켜내며 동료를 끌어올립니다.'], ko:['몸싸움에서 공을 잃습니다.'] },
  setCross:{ n:'세트피스 크로스', tag:'cross', k:[['CRS',.7],['VIS',.3]], b:.4, s:.011, t:'pass', a:.35, lo:.15, hi:.86, ta:['세트피스 크로스가 헤딩 골로 이어집니다 — 어시스트!'], ok:['크로스가 박스 안에서 걷어내집니다.'], ko:['크로스가 첫 수비에 막힙니다.'] },
  setShort:{ n:'짧게 연결', tag:'build', k:[['PAS',.6],['VIS',.4]], b:.55, s:.009, t:'pass', a:.1, lo:.2, hi:.9, ok:['짧은 패스로 안전하게 이어갑니다.'], ta:['짧은 패스가 결정적인 기회로 이어져 도움을 기록합니다!'], ko:['짧게 주려던 패스가 끊깁니다.'] },
  prog:{ n:'전진 패스', tag:'build', k:[['PAS',.6],['DEC',.4]], b:.5, s:.01, t:'pass', a:.1, lo:.2, hi:.9, ta:['전진 패스가 찬스로 이어집니다 — 어시스트!'], ok:['전진 패스로 공격 전개에 성공합니다.'], ko:['전진 패스가 수비에 끊깁니다.'] },
  longP:{ n:'롱패스 전환', tag:'build', k:[['PAS',.6],['VIS',.4]], b:.35, s:.011, t:'pass', a:.28, lo:.12, hi:.85, ta:['정확한 롱패스! 단숨에 득점으로 이어집니다 — 어시스트!'], ok:['롱패스로 공격 방향을 바꿉니다.'], ko:['롱패스가 라인 밖으로 나갑니다.','롱패스를 수비가 걷어냅니다.'] },
  safe:{ n:'안전한 패스', tag:'build', k:[['PAS',.5],['DEC',.5]], b:.7, s:.008, t:'pass', lo:.35, hi:.95, ok:['안전하게 공을 돌려 볼 점유를 지킵니다.'], ko:['쉬운 패스를 놓쳐 볼을 빼앗깁니다.'] },
  tackle:{ n:'태클', tag:'tkl', k:[['TAK',.6],['MAR',.2],['AGG',.2]], b:.42, s:.011, def:1, st:.55, cn:.3, lo:.1, hi:.88, ok:['깔끔한 태클로 공을 빼앗습니다!'], ko:['태클이 타이밍을 놓칩니다.','태클이 파울로 선언됩니다.'] },
  intercept:{ n:'인터셉트', tag:'tkl', k:[['DEC',.4],['POS',.3],['MAR',.3]], b:.48, s:.011, def:1, st:.45, cn:.15, lo:.12, hi:.88, ok:['패스 길을 읽고 끊어냅니다!'], ko:['패스를 읽었지만 닿지 못합니다.'] },
  block:{ n:'몸으로 막기', tag:'tkl', k:[['STR',.4],['MAR',.3],['POS',.3]], b:.55, s:.01, def:1, st:.3, cn:.12, lo:.2, hi:.9, ok:['몸을 던져 슛 각도를 막아냅니다!'], ko:['막아섰지만 밀려납니다.'] },
  jockey:{ n:'지연 수비', tag:'tkl', k:[['MAR',.4],['POS',.3],['AGI',.3]], b:.6, s:.01, def:1, st:.35, cn:.08, lo:.25, hi:.92, ok:['침착하게 지연시키며 동료를 기다립니다.'], ko:['지연 수비가 뚫립니다.'] },
  press:{ n:'압박', tag:'tkl', k:[['AGG',.4],['WOR',.3],['STA',.3]], b:.5, s:.01, def:1, st:.4, cn:.18, lo:.15, hi:.88, ok:['강한 압박으로 볼을 되찾습니다!'], ko:['압박이 한 박자 늦습니다.'] },
  cover:{ n:'커버링', tag:'tkl', k:[['POS',.5],['DEC',.5]], b:.55, s:.011, def:1, st:.4, cn:.15, lo:.2, hi:.9, ok:['빈 공간을 메우며 위기를 막아냅니다.'], ko:['커버가 늦어 공간을 내줍니다.'] },
  foul:{ n:'전술적 파울', tag:'tkl', k:[['AGG',.5],['DEC',.5]], b:.85, s:.004, def:1, st:.5, cn:.05, yc:.3, lo:.6, hi:.95, ok:['파울로 역습을 끊습니다.'], ko:['파울이 선언되지만 위험한 위치에서 프리킥을 허용합니다.'] },
  clear:{ n:'헤딩 클리어', tag:'aer', k:[['HEA',.5],['JUM',.3],['STR',.2]], b:.48, s:.011, def:1, st:.5, cn:.25, lo:.12, hi:.88, ok:['높이 솟아올라 크로스를 걷어냅니다!'], ko:['공중볼 경합에서 밀립니다.'] },
  aerial:{ n:'공중볼 경합', tag:'aer', k:[['JUM',.4],['HEA',.3],['STR',.3]], b:.5, s:.011, def:1, st:.45, cn:.2, lo:.12, hi:.88, ok:['몸싸움에서 이겨 공을 따냅니다!'], ko:['경합에서 상대에게 공을 내줍니다.'] },
  dive:{ n:'다이빙 선방', tag:'save', k:[['REF',.6],['HAN',.4]], b:.5, s:.012, def:1, gk:1, st:.65, cn:.35, lo:.15, hi:.9, ok:['몸을 날려 슛을 쳐냅니다! 선방!'], ko:['손이 닿지 않습니다.'] },
  stand:{ n:'위치 잡고 막기', tag:'save', k:[['DEC',.5],['REF',.3],['HAN',.2]], b:.55, s:.011, def:1, gk:1, st:.6, cn:.3, lo:.2, hi:.9, ok:['정확한 위치 선정으로 슛을 막아냅니다.'], ko:['위치가 약간 어긋납니다.'] },
  narrow:{ n:'각도 좁히며 나오기', tag:'save', k:[['DEC',.4],['REF',.3],['AER',.3]], b:.5, s:.011, def:1, gk:1, st:.7, cn:.45, lo:.15, hi:.88, ok:['과감히 뛰어나와 각도를 좁혀 막아냅니다!'], ko:['나온 사이 공이 키퍼를 넘어갑니다.'] },
  punch:{ n:'펀칭', tag:'aer', k:[['AER',.6],['REF',.4]], b:.6, s:.011, def:1, gk:1, st:.5, cn:.25, lo:.2, hi:.9, ok:['주먹으로 크로스를 멀리 쳐냅니다.'], ko:['펀칭이 짧아 위험한 공이 남습니다.'] },
  catchB:{ n:'캐치', tag:'save', k:[['HAN',.6],['AER',.4]], b:.55, s:.011, def:1, gk:1, st:.55, cn:.3, lo:.2, hi:.9, ok:['안정적으로 공을 잡아냅니다.'], ko:['공을 놓치며 위험한 상황이 됩니다.'] },
  wait:{ n:'기다리기', tag:'save', k:[['DEC',.5],['REF',.5]], b:.5, s:.011, def:1, gk:1, st:.5, cn:.35, lo:.15, hi:.88, ok:['끝까지 기다렸다 슛을 막아냅니다!'], ko:['움직임을 읽혀 실점 위기를 맞습니다.'] },
  sweep:{ n:'박스 밖 걷어내기', tag:'aer', k:[['DEC',.5],['KIC',.3],['REF',.2]], b:.45, s:.011, def:1, gk:1, st:.5, cn:.4, lo:.12, hi:.85, ok:['박스 밖까지 나와 위험한 공을 걷어냅니다!'], ko:['나왔지만 공을 놓쳐 빈 골문이 노출됩니다.'] },
  distL:{ n:'롱킥 배급', tag:'dist', k:[['KIC',.7],['DEC',.3]], b:.4, s:.011, t:'pass', a:.25, lo:.12, hi:.86, ta:['롱킥 한 방에 역습 골! — 어시스트!'], ok:['정확한 롱킥으로 공격을 시작합니다.'], ko:['롱킥이 상대에게 걸립니다.'] },
  distS:{ n:'짧게 빌드업', tag:'build', k:[['KIC',.4],['DEC',.6]], b:.65, s:.009, t:'pass', a:.05, lo:.25, hi:.92, ok:['짧은 패스로 후방 빌드업을 시작합니다.'], ta:['빌드업 패스가 골로 연결되어 도움을 기록합니다!'], ko:['빌드업 패스가 압박에 걸립니다.'] },
  throwQ:{ n:'빠른 던지기 역습', tag:'dist', k:[['KIC',.4],['DEC',.6]], b:.45, s:.011, t:'pass', a:.3, lo:.15, hi:.88, ta:['빠른 던지기 역습! 골로 이어집니다 — 어시스트!'], ok:['빠른 스로로 역습을 열어줍니다.'], ko:['던진 공이 상대에게 연결됩니다.'] },
};
// 선호 플레이 10개씩 (id가 OPT id면 해당 선택지에 ★)
const PREF10 = { ST:['fin','oneT','head','chip','volley','long','holdup','onetwo','drib','cutback'], W:['drib','cutin','crossO','onetwo','cutback','thruP','turn','fin','long','setD'], AM:['thruP','onetwo','long','drib','cutin','setD','prog','chip','cutback','press'], CM:['prog','longP','thruP','long','onetwo','tkl','intercept','press','dribOut','setShort'], DM:['tkl','intercept','cover','press','jockey','safe','longP','prog','aerial','foul'], FB:['crossO','drib','tkl','jockey','intercept','onetwo','cutback','prog','aerial','press'], CB:['clear','aerial','tkl','block','intercept','cover','longP','build','head','foul'], GK:['dive','stand','narrow','punch','catchB','sweep','distL','distS','throwQ','wait'] };
for (const pos in PREF10) { PREF_POS[pos] = PREF10[pos]; for (const id of PREF10[pos]) { if (!PREFS[id] && OPT[id]) { PREFS[id] = { n: OPT[id].n }; PREF_AT[id] = OPT[id].k.slice(0,2).map(x => x[0]); } } }

// 장면: txt(상황 문구), o(선택지)
const MOM = {
  box:{ txt:'박스 안에서 볼이 내 앞에 떨어집니다!', o:['shoot','oneT','chip','cutback','drib'] },
  through:{ txt:'동료의 스루패스가 수비 뒷공간으로 들어옵니다!', o:['shoot','chip','drib','cutback','oneT','long'] },
  crossIn:{ txt:'측면에서 크로스가 박스로 올라옵니다!', o:['head','volley','oneT','cutback'] },
  link:{ txt:'등을 지고 공을 받았습니다. 동료들이 올라오고 있습니다.', o:['holdup','onetwo','turn','shoot','thruP'] },
  counter:{ txt:'역습 상황, 앞에 수비수 한 명뿐입니다!', o:['shoot','drib','chip','thruP','long'] },
  wing:{ txt:'측면에서 수비수와 1대1 상황입니다!', o:['drib','onetwo','crossO','cutin','safe'] },
  cutinM:{ txt:'안쪽으로 파고들 공간이 보입니다!', o:['cutin','shoot','cutback','thruP','onetwo'] },
  counterW:{ txt:'역습 기회, 측면이 활짝 열렸습니다!', o:['drib','thruP','shoot','crossO','onetwo','turn','long'] },
  far:{ txt:'반대편에서 크로스가 넘어옵니다!', o:['volley','head','oneT','cutback'] },
  zone14:{ txt:'수비 라인 사이에서 공을 받았습니다!', o:['thruP','long','onetwo','drib','shoot','cutin','chip'] },
  setp:{ txt:'박스 앞 프리킥 기회입니다!', o:['setD','setCross','setShort'] },
  second:{ txt:'세컨볼이 박스 근처로 흘러옵니다!', o:['oneT','long','cutback','shoot','thruP'] },
  pressA:{ txt:'상대 압박이 거세게 들어옵니다!', o:['turn','safe','onetwo','dribOut','prog','press'] },
  longC:{ txt:'중거리 슛을 때릴 공간이 열렸습니다!', o:['long','thruP','safe','drib','onetwo'] },
  thruM:{ txt:'앞선 동료가 침투하고 있습니다. 킬패스 타이밍!', o:['thruP','onetwo','longP','safe','long'] },
  tackleM:{ txt:'상대 역습이 시작됩니다! 중원에서 끊어야 합니다.', o:['tackle','intercept','press','foul','jockey'] },
  interceptD:{ txt:'상대가 침투 패스를 노립니다!', o:['intercept','tackle','cover','foul','jockey'] },
  buildD:{ txt:'공을 잡았습니다. 빌드업을 이끌어야 합니다.', o:['prog','longP','safe','dribOut','thruP'] },
  secondD:{ txt:'세컨볼 경합 상황입니다!', o:['tackle','press','block','safe','aerial'] },
  overlap:{ txt:'오버래핑 공간이 활짝 열렸습니다!', o:['crossO','onetwo','drib','cutback','safe'] },
  duelD:{ txt:'상대 윙어와 1대1 상황입니다!', o:['tackle','jockey','block','foul','cover','intercept','aerial','press'] },
  buildFB:{ txt:'측면에서 공을 잡았습니다. 전개를 선택하세요.', o:['prog','longP','safe','drib','crossO'] },
  aerialM:{ txt:'상대 크로스가 위험지역으로 들어옵니다!', o:['clear','aerial','cover','block'] },
  duelCB:{ txt:'상대 공격수가 돌파해 들어옵니다!', o:['tackle','jockey','block','foul','cover','intercept'] },
  buildCB:{ txt:'수비 라인에서 공을 잡았습니다. 빌드업을 선택하세요.', o:['longP','prog','safe','dribOut'] },
  cornerH:{ txt:'코너킥! 공격에 가담합니다.', o:['head','safe','volley'] },
  shotG:{ txt:'강한 슈팅이 날아옵니다!', o:['dive','stand','narrow','punch','catchB'] },
  oneone:{ txt:'1대1 상황! 상대 공격수가 달려옵니다.', o:['narrow','wait','dive','sweep'] },
  crossG:{ txt:'크로스가 박스 안으로 올라옵니다!', o:['catchB','punch','sweep','wait'] },
  distG:{ txt:'공을 잡았습니다. 배급 기회!', o:['distL','distS','throwQ'] },
  penG:{ txt:'페널티킥! 키커와 마주합니다.', o:['dive','wait','stand','narrow'] },
  pressS:{ txt:'높은 압박으로 공을 가로챘습니다! 골문이 눈앞입니다.', o:['shoot','drib','thruP','onetwo','cutback'] },
  pressW:{ txt:'측면에서 압박해 공을 뺏었습니다! 수비가 흐트러졌습니다.', o:['drib','crossO','cutin','thruP','onetwo'] },
  winBall:{ txt:'공을 되찾았습니다! 빠르게 전개할 타이밍입니다.', o:['prog','thruP','onetwo','longP','dribOut','safe'] },
  cutbackD:{ txt:'상대가 측면 깊숙이 파고들어 컷백을 노립니다!', o:['block','cover','intercept','tackle','jockey'] },
  blockCB:{ txt:'상대가 박스 앞에서 슛 자세를 잡습니다!', o:['block','tackle','cover','clear','press'] },
};
const POSK = { ST:['box','through','crossIn','link','counter','pressS'], W:['wing','cutinM','counterW','far','setp','pressW'], AM:['zone14','setp','second','pressA','winBall'], CM:['pressA','longC','thruM','tackleM','setp','winBall'], DM:['interceptD','buildD','secondD','tackleM','winBall'], FB:['overlap','duelD','buildFB','cutbackD','aerialM'], CB:['aerialM','duelCB','buildCB','cornerH','blockCB'], GK:['shotG','oneone','crossG','distG','penG'] };
function optInfo(id) { const d = OPT[id] || {}; return { t: d.t || null, def: !!d.def, gk: !!d.gk }; }
function momentText(kind) { return (MOM[kind] || MOM.box).txt; }
function momentOptions(mo) {
  const m = me(), a = m.a, os = (G.mm.oppStr-60)*0.004, tb = traitOf(m).b, pf = m.prefs || [];
  const pb = { ST:0.04, W:0.02, AM:0.02, CM:0.0 }[m.sub] || -0.04;
  const ids = (MOM[mo.kind] || MOM.box).o;
  return ids.map(id => { const d = OPT[id]; let v = 0; for (const [k,w] of d.k) v += w * (a[k] || 45);
    let p = d.b + (v-50)*d.s - os*(d.osf||1) + (d.t ? (tb[d.t === 'pass' ? 'pass' : d.t] || 0) : 0) + (d.pos && d.g===1 ? pb : 0);
    const fav = pf.some(x => x === d.tag || x === id); if (fav) p += 0.06;
    p = clamp(p, d.lo || 0.05, d.hi || 0.9);
    return { id, n: d.n, p, shown: p, fav, def: !!d.def };
  });
}
function resolveMoment(choice) {
  const M = G.mm, m = me(), mo = M.moments[M.mi]; const opts = momentOptions(mo); const o = opts.find(x=>x.id===choice) || opts[0]; const d = OPT[o.id];
  let text, goal = false, assist = false, stop = false, conc = false; const ok = rnd() < o.p;
  const fav = (o.fav ? 0.1 : 0) + ((G.mm && G.mm.talk) || 0);
  if (d.def) {
    if (ok) { text = pick(d.ok); M.myRate += 0.3 + fav;
      const fut = M.evOpp.filter(e => e.min > mo.min);
      if (fut.length && rnd() < d.st) { M.evOpp.splice(M.evOpp.indexOf(fut[0]), 1); stop = true; M.myRate += 0.4; text += ' — 실점 위기를 막아냈습니다!'; } }
    else { text = pick(d.ko); M.myRate -= 0.25;
      if (rnd() < d.cn) { conc = true; M.myRate -= 0.6; text += ' — 실점으로 이어집니다.'; const cs = (M.stOpp || []).filter(p=>p.sub!=='GK'); M.evOpp.push({ min: mo.min, side: M.opp.id, sc: pick(cs.length?cs:M.stOpp), as: null, mine: false }); M.evOpp.sort((x,y)=>x.min-y.min); }
      if (d.yc && rnd() < d.yc) { (M.evx = M.evx || []).push({ min: mo.min, p: m, ms: true, t: 'yc' }); text += ' (경고)'; } }
  } else if (d.g === 1) {
    if (ok) { goal = true; text = pick(d.tg); M.myRate += 1.3 + fav; M.sh++; } else { text = pick(d.ko); M.myRate -= 0.05; M.sh++; }
  } else if (ok) {
    if (d.g && rnd() < d.g) { goal = true; text = pick(d.tg); M.myRate += 1.3 + fav; }
    else if (d.a && rnd() < d.a) { assist = true; text = pick(d.ta); M.myRate += 0.9 + fav; }
    else { text = pick(d.ok); M.myRate += 0.2 + fav; }
  } else { text = pick(d.ko); M.myRate -= 0.15; }
  { const futG = M.evMine.filter(e => e.min > mo.min && !e.mine);                       // 대체할 팀 득점이 없으면 '추가 득점'은 경기당 1번까지만 인정
    if ((goal || assist) && !futG.length) { if ((M.xg || 0) >= 1) { if (goal) { goal = false; M.myGoals = M.myGoals; M.myRate -= 1.1 + fav; } if (assist) { assist = false; M.myRate -= 0.7 + fav; } text = pick(d.ko || d.ok); M.myRate += 0.15; } else M.xg = 1; } }
  mo.done = true; mo.result = { choice: o.id, goal, assist, stop, conc, ok, text };
  if (goal) { M.myGoals++;
    const fut = M.evMine.filter(e => e.min > mo.min && !e.mine); if (fut.length) { M.evMine.splice(M.evMine.indexOf(fut[0]),1); } M.evMine.push({ min: mo.min, side: M.mine.id, sc: m, as: null, mine: true }); }
  if (assist) { M.myAssists++; const fut = M.evMine.filter(e => e.min > mo.min && !e.mine); const tm = pick(startersOf(M.mg).filter(p=>!p.me)); if (fut.length) { M.evMine.splice(M.evMine.indexOf(fut[0]),1); } M.evMine.push({ min: mo.min, side: M.mine.id, sc: tm, as: m, mine: true }); }
  M.evMine.sort((x,y)=>x.min-y.min);
  M.mi++; return mo.result;
}
// 홈 화면 "계속" 버튼 안내용: 다음 경기/이적 합류 일정
function nextEvent() {
  const m = me(); if (!m) return null; let best = null;
  const cur = G.clubs[m.club], lg = cur && leagueOf(cur.lg);
  if (lg) { let h = lg.half; for (let p = lg.ptr; p < lg.rd.length && !best; p++) { const r = lg.rd[p]; for (; h < 2; h++) { const d = r.day + h; if (d > G.day && r.ms.filter((x, i) => (i % 2) === h).some(([a, b]) => a === m.club || b === m.club)) { const f = r.ms.filter((x, i) => (i % 2) === h).find(([a, b]) => a === m.club || b === m.club); best = { day: d, h: f[0], a: f[1], ctx: { t: 'lg', id: lg.id } }; break; } } h = 0; } }
  for (let d = G.day + 1; d <= G.day + 120 && (!best || d < best.day); d++) { const fl = G.fx[d]; if (!fl) continue; const f = fl.find(x => mineIn(x.h) || mineIn(x.a)); if (f) { best = { day: d, h: f.h, a: f.a, ctx: f.ctx }; break; } }
  const out = { match: null, move: null };
  if (best) { const oppId = mineIn(best.h) ? best.a : best.h, oc = clubOf(oppId); out.match = { day: best.day, days: best.day - G.day, oppId: oc ? oc.id : null, opp: oc ? oc.name : '', title: matchTitle(best.ctx), home: mineIn(best.h) }; }
  if (m.pending) out.move = { day: m.pending.eff, days: m.pending.eff - G.day, club: G.clubs[m.pending.club].name, kind: m.pending.kind };
  return out;
}
function finishMine() {
  const M = G.mm, m = me(); m.benchStreak = (M.role==='start') ? 0 : (M.role==='sub' ? 1 : (m.benchStreak||0) + 1); const mineGoals = M.evMine.length, oppGoals = M.evOpp.length;
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
    if (M.ctx.t!=='nt') { const dt = (rating-6.3)*2.2, rf = clamp(roleOf(m).fit/8, -1, 1.2); m.trust = clamp(m.trust + (dt > 0 ? dt * traitOf(m).trust : dt) + rf, 0, 100); }
    m.gTot = (m.gTot||0) + M.myGoals; { const f = finOf(m); f.pend = (f.pend||0) + M.myGoals*Math.max(1, Math.round(m.ct.wage*0.25)) + M.myAssists*Math.max(1, Math.round(m.ct.wage*0.12)) + (M.mvp && M.mvp.me ? Math.round(m.ct.wage*0.5) : 0); } unlock(m, 'debut'); if (M.myGoals) unlock(m, 'goal1'); if (M.myAssists) unlock(m, 'assist1'); if (M.myGoals>=3) unlock(m, 'hat'); if (rating>=9) unlock(m, 'rate9'); if (m.gTot>=10) unlock(m, 'goals10'); if (M.ctx.t==='nt') unlock(m, 'nt1');
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
  if (M.mvp && M.mvp.me) { unlock(m, 'mvp1'); m.mvps = (m.mvps||0) + 1; addNews('me', `${m.name}, 경기 MVP 선정! ${M.mine.name} ${mineGoals}-${oppGoals} ${M.opp.name} (${fame})`, M.ctx.t!=='lg', { me:true }); }
  if (G.mode === 'mgr') mgrAfterMatch(M, mineGoals, oppGoals);
  G.mm = null; G.pendingMine = null; flushFinish();
  return { mvp: M.mvp ? { name: M.mvp.p.name, me: M.mvp.me } : null, res, rating, role: M.role, myGoals: M.myGoals, myAssists: M.myAssists, mineGoals, oppGoals, title: M.title };
}
function autoMine() {
  const M = G.mm; while (M.mi < M.moments.length) {
    const opts = momentOptions(M.moments[M.mi]);
    const sc = (o) => { const d = OPT[o.id]; return o.p * (d.def ? 1 : 1 + (d.g===1 ? 1.4 : (d.g||0)*1.2 + (d.a||0)*1.2)) + (o.fav ? 0.08 : 0) + rnd()*0.1; };
    opts.sort((a,b) => sc(b) - sc(a)); resolveMoment(opts[0].id);
  }
  return finishMine();
}
// ----- 오퍼 / 졸업 -----
function lvl(c) { if (c.kind==='youth' || c.kind==='univ') return 0; if (c.kind==='ext') return 2; if (c.tier===2) return 1; return DD.COUNTRIES[c.cc].l1.mean < 64 ? 2 : 3; }
function meOffers(t, outside) {
  const m = me(); m.offers = m.offers.filter(o => o.grad || o.until >= G.day); if (m.pending || m.offers.length>=3) return;
  const cur = G.clubs[m.club];
  if (cur.kind!=='pro') { // 유스: 조기 프로 콜업
    if (m.age < 17 || m.ovr < 52 || rnd() > 0.03) return;
    const cands = G.clubs.filter(c => c.kind==='pro' && c.cc===cur.cc && c.strength-9 <= m.ovr && lvl(c)<=2); if (!cands.length) return;
    const c = pick(cands); if (m.offers.some(o=>o.club===c.id)) return;
    m.offers.push({ club: c.id, wage: wageFor(m, c), years: ri(2,4), fee: 0, until: G.day+20, early:true, bonus: Math.round(wageFor(m, c)*ri(3,8)) });
    G.inbox.unshift({ d: G.day, text: `${c.name}이(가) ${m.name}에게 프로 계약을 제안했습니다. (조기 콜업)` }); return;
  }
  if (outside && cur.kind!=='pro') return;
  if (m.lastMove && G.day - m.lastMove < 240) return;
  const yy = t.y, pre = m.ct.until <= yy + (t.m>=7 ? 1 : 0) && m.ct.until >= yy;
  if (outside && !pre) return;
  if (m.st.a < 6 && m.hist.length===0) return;
  const wo = m.wantOut && G.day - m.wantOut < 90 ? 3 : 1;
  if (rnd() > (0.06 + (m.fame/100)*0.08) * wo) return;
  const good = clamp(m.form,4,9) >= 6.3 || m.fame > 30 || wo > 1;
  if (!good) return;
  const maxL = lvl(cur) + (m.ovr>=72 ? 2 : 1);
  const cands = G.clubs.filter(c => c.kind==='pro' && c.id!==m.club && lvl(c) <= maxL && c.strength >= cur.strength-2 && c.strength <= cur.strength + 8 + m.fame/12 && m.ovr >= c.strength-9);
  if (!cands.length) return; const c = pick(cands);
  if (m.offers.some(o=>o.club===c.id)) return;
  const wage = Math.max(wageFor(m, c), Math.round(m.ct.wage*(1+ (c.strength-cur.strength)*0.03 + 0.08)));
  if (pre) m.offers.push({ club: c.id, kind:'pre', wage: Math.round(wage*1.1), years: ri(2,4), fee: 0, until: G.day+30, bonus: Math.round(wage*(6+rnd()*8)), clause: Math.round(price(m)*(1.6+rnd())) });
  else m.offers.push({ club: c.id, kind:'transfer', wage, years: ri(2,4), fee: price(m), until: G.day+14, bonus: Math.round(wage*(3+rnd()*5)), clause: Math.round(price(m)*(1.6+rnd())) });
  G.inbox.unshift({ d: G.day, text: `${c.name}(${leagueOf(c.lg).name})이(가) ${m.name} ${pre?'자유계약 영입(사전 협상)':'영입'} 제안을 보냈습니다.${pre?'':' (구단 간 이적료 합의 완료)'}` });
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
  for (const c of out) m.offers.push({ club:c.id, wage: wageFor(m, c), years: c.kind==='pro' ? ri(2,4) : 4, fee:0, until: dayOf(y,3,1), grad:true });
  G.inbox.unshift({ d: G.day, text: `${m.name}, 졸업 시즌입니다. ${out.length}개 팀에서 입단 제안이 도착했습니다. 3월 1일까지 선택하세요.` });
  addNews('me', `${m.name}, 졸업 후 진로 — ${out.length}개 팀이 관심`, true, { me:true });
}
function gradDeadline(t) {
  const m = me(); if (!(t.m===3 && t.d===1)) return;
  const g = m.offers.filter(o=>o.grad); if (!g.length) return;
  const best = m.offers.indexOf(g.slice().sort((a,b)=>G.clubs[b.club].strength-G.clubs[a.club].strength)[0]);
  acceptOffer(best); G.inbox.unshift({ d: G.day, text: '기한이 지나 가장 높은 수준의 팀으로 자동 입단했습니다.' });
}
function doTransfer(o, silentNews) {
  const m = me(), to = G.clubs[o.club], from = G.clubs[m.club];
  transfer(m, to, o.fee||0, false); m.ct = { until: dateOf(G.day).y + o.years, wage: o.wage }; { const f = finOf(m); f.pend = (f.pend||0) + (o.bonus||0); }
  m.offers = []; m.pending = null; m.lastMove = G.day; m.trust = (to.kind==='pro' ? 45 : 55) + (o.promise ? 12 : 0); pickMentor(m);
  const lf = leagueOf(from.lg), lt = leagueOf(to.lg);
  const how = o.kind==='pre' ? '자유계약(계약 만료) 이적' : o.grad ? '입단' : '이적';
  addNews('transfer', `${m.name}(${m.age}), ${from.name} → ${to.name} ${how}${lt && lf && lt.cc!==lf.cc?` · ${DD.COUNTRIES[lt.cc].name} 진출`:''}!`, true, { me:true });
  G.inbox.unshift({ d: G.day, text: `${to.name} 합류 — ${how} 완료.` });
}
function nextWindowDay() { for (let d = G.day + 1; d < G.day + 400; d++) if (inWindow(dateOf(d))) return d; return G.day + 30; }
// 입단·졸업·조기 콜업은 바로 계약, 그 외는 구단 합의 → 개인 협상 → 이적 가능 시점에 이동
function acceptOffer(i) {
  const m = me(), o = m.offers[i]; if (!o) return;
  if (!o.kind) { doTransfer(o); return; }
  return negotiate(i, 'ok');
}
function negotiate(i, mode) {
  const m = me(), o = m.offers[i]; if (!o) return '';
  const c = G.clubs[o.club]; let msg = '';
  if (o.negd && mode !== 'ok') return '이미 한 번 협상했습니다';
  const base = Object.assign({}, o);
  if (mode === 'ask') {
    const ok = rnd() < 0.45 + m.fame/300 + Math.min(0.15, (m.ovr - c.strength + 8)/80);
    if (ok) { base.wage = Math.round(o.wage*1.2); msg = `${c.name}이(가) 주급 인상 요구를 받아들였습니다.`; }
    else if (rnd() < 0.4) { m.offers.splice(i,1); G.inbox.unshift({ d:G.day, text:`${c.name}이(가) 무리한 요구에 협상을 철회했습니다.` }); return '협상 결렬: 구단이 제안을 철회했습니다'; }
    else msg = `${c.name}은(는) 인상을 거부하고 기존 조건을 유지했습니다.`;
  } else if (mode === 'promise') {
    const ok = rnd() < 0.4 + (m.ovr - c.strength + 10)/60;
    if (ok) { base.promise = true; msg = `${c.name}이(가) 주전 경쟁 보장을 약속했습니다.`; }
    else msg = `${c.name}은(는) 출전을 보장할 수 없다고 합니다.`;
  }
  if (mode === 'ok' || mode === 'ask' || mode === 'promise') {
    if (mode !== 'ok') { m.offers[i] = base; m.offers[i].negd = true; return msg; }
  }
  // 최종 합의
  if (base.kind === 'transfer' && rnd() < 0.12) { m.offers.splice(i,1); G.inbox.unshift({ d:G.day, text:`${G.clubs[m.club].name}이(가) 선수 보호를 이유로 ${c.name}의 제안을 거절했습니다.` }); return '소속팀이 이적을 허가하지 않았습니다'; }
  const eff = base.kind==='pre' ? Math.max(G.day + 1, dayOf(m.ct.until,1,1)) : (inWindow(dateOf(G.day)) ? G.day + 3 : nextWindowDay());
  m.pending = Object.assign({}, base, { eff });
  m.offers = [];
  G.inbox.unshift({ d:G.day, text:`${c.name}과(와) 개인 합의 완료 — ${fmtDate(eff)} ${base.kind==='pre'?'계약 만료 후 자유계약으로':'이적으로'} 합류합니다.` });
  addNews('me', `${m.name}, ${c.name}행 합의 (${fmtDate(eff).slice(5)} 합류 예정)`, false, { me:true });
  return '개인 합의 완료';
}
function cancelPending() { const m = me(); if (!m.pending) return; G.inbox.unshift({ d:G.day, text:`${G.clubs[m.pending.club].name}과(와)의 합의를 파기했습니다.` }); m.pending = null; }
function execPending() {
  const m = me(), pd = m.pending; if (!pd || G.day < pd.eff) return;
  if (pd.kind==='transfer' && !inWindow(dateOf(G.day))) return;
  doTransfer(pd);
}
function declineOffer(i) { me().offers.splice(i,1); }
function meContractExpire() { const m = me(); m.renewal = { wage: Math.round(m.ct.wage*1.15), years: 3 }; G.inbox.unshift({ d: G.day, text: `${iga(G.clubs[m.club].name)} 재계약을 제안했습니다.` }); }
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
// ----- 하프타임 팀토크: 감독 말 + 내 반응 -----
function talkInfo(diff) {
  const t = diff < 0 ? pick(['아직 늦지 않았다. 한 골만 따라가면 분위기는 바뀐다!', '전반 내용은 나쁘지 않았다. 침착하게 기회를 만들자.', '실점은 잊어라. 후반 첫 15분에 승부를 건다.'])
    : diff > 0 ? pick(['좋은 흐름이다. 하지만 방심하면 바로 뒤집힌다.', '리드를 지키되 추가골 기회는 놓치지 말자.', '지금처럼만 하면 된다. 간격을 좁게 유지해라.'])
    : pick(['균형이 팽팽하다. 먼저 한 골 넣는 팀이 이긴다.', '아직 아무것도 정해지지 않았다. 후반에 더 날카롭게 가자.']);
  return { text: t, opts: [{ id: 'follow', t: '감독 지시를 그대로 따른다' }, { id: 'rally', t: '동료들을 독려한다' }, { id: 'ego', t: '내가 해결하겠다고 다짐한다' }] };
}
function talkPick(id) {
  const m = me(), M = G.mm; let text = '', talk = 0, mor = 0, trust = 0;
  if (id === 'follow') { talk = 0.03; mor = 1; text = '지시대로 라인을 지키며 후반을 준비합니다.'; }
  else if (id === 'rally') { if (m.mor >= 60 || rnd() < 0.5) { talk = 0.06; mor = 2; text = '"한 번 더 뛰자!" 동료들이 고개를 끄덕입니다. 라커룸 분위기가 살아납니다.'; } else { talk = 0.01; mor = -1; text = '말은 했지만 동료들의 표정이 굳어 있습니다.'; } }
  else { if (rnd() < 0.6) { talk = 0.08; mor = 2; text = '"내가 해결한다." 눈빛이 달라졌습니다. 후반이 기대됩니다.'; } else { talk = -0.04; mor = -1; trust = -1; text = '혼자 하려 한다는 시선이 느껴집니다. 감독이 고개를 젓습니다.'; } }
  if (M) M.talk = talk; m.mor = clamp(m.mor + mor, 20, 100); m.trust = clamp(m.trust + trust, 0, 100);
  return { text };
}


// ===================== 월드컵 모드 =====================
function wcRank(g) { return g.teams.slice().sort((x, y) => { const a = g.table[x], b = g.table[y]; return (b.pts - a.pts) || ((b.gf - b.ga) - (a.gf - a.ga)) || (b.gf - a.gf) || (x - y); }); }
function startWcKO(comp) {
  const rk = comp.groups.map(wcRank); comp.gres = rk;
  const gi = (id) => comp.groups.findIndex(g => g.teams.includes(id));
  const win = rk.map(r => r[0]), run = rk.map(r => r[1]);
  const th = rk.map(r => r[2]).sort((x, y) => { const g1 = comp.groups[gi(x)].table[x], g2 = comp.groups[gi(y)].table[y]; return (g2.pts - g1.pts) || ((g2.gf - g2.ga) - (g1.gf - g1.ga)) || (g2.gf - g1.gf) || (x - y); });
  const q3 = th.slice(0, 8); comp.q3 = q3; comp.out3 = th.slice(8);
  if (comp.draw === 'real') {
    const T = wcThirdSlots(q3, gi);
    if (T) {
      const ref = (sl, n) => sl[0] === 'T' ? T[n] : (sl[0] === '1' ? win : run)[sl.charCodeAt(1) - 65];
      const pairs = WC_R32_ORDER.map(n => [ref(WC_R32[n][0], n), ref(WC_R32[n][1], n)]);
      comp.stage = 'KO'; comp.round = 0; comp.alive = pairs.flat(); koRound(comp, pairs);
      addNews('cup', `${comp.name} 조별리그 종료 — 32강 대진이 확정됐습니다`, true);
      return;
    }
  }
  const A = win.concat(q3.slice(0, 4)), B = run.concat(q3.slice(4));
  let pairs = null;
  for (let tr = 0; tr < 200 && !pairs; tr++) { const b = shuffle(B.slice()); if (A.every((x, i) => gi(x) !== gi(b[i]))) pairs = A.map((x, i) => [x, b[i]]); }
  if (!pairs) { const b = shuffle(B.slice()); pairs = A.map((x, i) => [x, b[i]]); }
  shuffle(pairs);
  comp.stage = 'KO'; comp.round = 0; comp.alive = pairs.flat(); koRound(comp, pairs);
  addNews('cup', `${comp.name} 조별리그 종료 — 32강 대진이 확정됐습니다`, true);
}
const WC_REAL = [['MEX','RSA','KOR','CZE'],['CAN','BIH','QAT','SUI'],['BRA','MAR','HAI','SCO'],['USA','PAR','AUS','TUR'],['GER','CUW','CIV','ECU'],['NED','JPN','SWE','TUN'],['BEL','EGY','IRN','NZL'],['ESP','CPV','SAU','URU'],['FRA','SEN','IRQ','NOR'],['ARG','ALG','AUT','JOR'],['POR','COD','UZB','COL'],['ENG','CRO','GHA','PAN']];
// 실제 2026 월드컵 조별리그 일정(월, 일, 홈, 원정) — 조 순서 A~L
const WC_SCHED = [
  [[6,11,'MEX','RSA'],[6,11,'KOR','CZE'],[6,18,'CZE','RSA'],[6,18,'MEX','KOR'],[6,24,'CZE','MEX'],[6,24,'RSA','KOR']],
  [[6,12,'CAN','BIH'],[6,13,'QAT','SUI'],[6,18,'SUI','BIH'],[6,18,'CAN','QAT'],[6,24,'SUI','CAN'],[6,24,'BIH','QAT']],
  [[6,13,'BRA','MAR'],[6,13,'HAI','SCO'],[6,19,'SCO','MAR'],[6,19,'BRA','HAI'],[6,24,'SCO','BRA'],[6,24,'MAR','HAI']],
  [[6,12,'USA','PAR'],[6,13,'AUS','TUR'],[6,19,'TUR','PAR'],[6,19,'USA','AUS'],[6,25,'TUR','USA'],[6,25,'PAR','AUS']],
  [[6,14,'CIV','ECU'],[6,14,'GER','CUW'],[6,20,'GER','CIV'],[6,20,'ECU','CUW'],[6,25,'CUW','CIV'],[6,25,'ECU','GER']],
  [[6,14,'NED','JPN'],[6,14,'SWE','TUN'],[6,20,'NED','SWE'],[6,20,'TUN','JPN'],[6,25,'JPN','SWE'],[6,25,'TUN','NED']],
  [[6,15,'IRN','NZL'],[6,15,'BEL','EGY'],[6,21,'BEL','IRN'],[6,21,'NZL','EGY'],[6,26,'EGY','IRN'],[6,26,'NZL','BEL']],
  [[6,15,'SAU','URU'],[6,15,'ESP','CPV'],[6,21,'URU','CPV'],[6,21,'ESP','SAU'],[6,26,'CPV','SAU'],[6,26,'URU','ESP']],
  [[6,16,'FRA','SEN'],[6,16,'IRQ','NOR'],[6,22,'NOR','SEN'],[6,22,'FRA','IRQ'],[6,26,'NOR','FRA'],[6,26,'SEN','IRQ']],
  [[6,16,'ARG','ALG'],[6,16,'AUT','JOR'],[6,22,'ARG','AUT'],[6,22,'JOR','ALG'],[6,27,'ALG','AUT'],[6,27,'JOR','ARG']],
  [[6,17,'POR','COD'],[6,17,'UZB','COL'],[6,23,'POR','UZB'],[6,23,'COL','COD'],[6,27,'COL','POR'],[6,27,'COD','UZB']],
  [[6,17,'GHA','PAN'],[6,17,'ENG','CRO'],[6,23,'ENG','GHA'],[6,23,'PAN','CRO'],[6,27,'PAN','ENG'],[6,27,'CRO','GHA']]];
// 실제 토너먼트 대진표: 32강 경기번호별 [슬롯A, 슬롯B, 날짜]. '1E'=E조 1위, '2A'=A조 2위, 'T:ABCDF'=해당 조 3위 중 한 팀
const WC_R32 = { 73:['2A','2B',[6,28]], 74:['1E','T:ABCDF',[6,29]], 75:['1F','2C',[6,29]], 76:['1C','2F',[6,29]], 77:['1I','T:CDFGH',[6,30]], 78:['2E','2I',[6,30]], 79:['1A','T:CEFHI',[6,30]], 80:['1L','T:EHIJK',[7,1]],
  81:['1D','T:BEFIJ',[7,1]], 82:['1G','T:AEHIJ',[7,1]], 83:['2K','2L',[7,2]], 84:['1H','2J',[7,2]], 85:['1B','T:EFGIJ',[7,2]], 86:['1J','2H',[7,3]], 87:['1K','T:DEIJL',[7,3]], 88:['2D','2G',[7,3]] };
// 16강 이후 진행 순서(인접한 두 경기 승자끼리 만남): 32강 → 16강(89~96) → 8강(97~100) → 4강(101·102)
const WC_R32_ORDER = [74,77,73,75,83,84,81,82,76,78,79,80,86,88,85,87];
const WC_TDAYS = [WC_R32_ORDER.map(n => WC_R32[n][2]), [[7,4],[7,4],[7,6],[7,6],[7,5],[7,5],[7,7],[7,7]], [[7,9],[7,10],[7,11],[7,11]], [[7,14],[7,15]], [[7,19]]];
function wcThirdSlots(q3, gi) {                          // 3위 8팀을 규정의 허용 조 조건에 맞춰 슬롯에 배정(가능한 조합 탐색)
  const slots = WC_R32_ORDER.filter(n => WC_R32[n][1][0] === 'T'), res = {};
  const go = (k, used) => { if (k === slots.length) return true; const n = slots[k], allow = WC_R32[n][1].slice(2);
    for (const t of q3) { if (used.has(t) || !allow.includes(String.fromCharCode(65 + gi(t)))) continue; used.add(t); res[n] = t; if (go(k + 1, used)) return true; used.delete(t); } return false; };
  return go(0, new Set()) ? res : null;
}
function wcStart(opts) {
  const seed = opts.seed || (Date.now() % 1000000);
  rs = seed | 0;
  G = { v: 2, rs: seed | 0, day: dayOf(2026, 6, 10), nextPid: 1, clubs: [], players: {}, leagues: [], comps: [], news: [], inbox: [], me: null, hall: [], flags: {}, fx: {}, nt: {}, sel: [], compHist: [], ntLog: [], lastRes: {}, fa: [], wc: true };
  const codes = Object.keys(WCN).sort((a, b) => WCN[b][2] - WCN[a][2] || (a < b ? -1 : 1));
  for (const code of codes) { const col = WCCOL[code] || pick(DD.COLS); addClub({ name: (DD.NAT_KO[code] || WCN[code][0]), lg: 'WC', col: col[0], col2: col[1], strength: WCN[code][2] + (rnd() * 2 - 1), nat: code, cc: 'WORLD', kind: 'nat', tier: 1 }); }
  for (const c of G.clubs) { buildClubSquad(c); c.style = pick(['balanced', 'balanced', 'tiki', 'counter', 'press', 'direct', 'wide']); c.tactic = tacticFor(c.style); }
  const comp = mkComp('WC', '월드컵 2026', 'wc', 'WORLD', '2026'); comp.stage = 'G'; comp.groups = [];
  const ids = G.clubs.map(c => c.id).sort((a, b) => G.clubs[b].strength - G.clubs[a].strength);
  for (let g = 0; g < 12; g++) comp.groups.push({ teams: [], table: {} });
  const putG = (g, id) => { comp.groups[g].teams.push(id); comp.groups[g].table[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; };
  comp.draw = opts.draw === 'rand' ? 'rand' : 'real';
  if (comp.draw === 'real') WC_REAL.forEach((cs, g) => cs.forEach(cd => putG(g, G.clubs.find(c => c.nat === cd).id)));
  else for (let pot = 0; pot < 4; pot++) { const p = shuffle(ids.slice(pot * 12, pot * 12 + 12)); p.forEach((id, g) => putG(g, id)); }
  comp.left = 0;
  const md = [dayOf(2026, 6, 11), dayOf(2026, 6, 16), dayOf(2026, 6, 21)];
  if (comp.draw === 'real') { const idOf = (cd) => G.clubs.find(c => c.nat === cd).id; WC_SCHED.forEach((ms, gi) => ms.forEach(([m, d, h, a]) => { addFx(dayOf(2026, m, d), idOf(h), idOf(a), { t: 'wc', id: 'WC', g: gi }); comp.left++; })); comp.tdays = WC_TDAYS.map(r => r.map(([m, d]) => dayOf(2026, m, d))); }
  else comp.groups.forEach((g, gi) => circle(g.teams).forEach((ms, i) => ms.forEach(([h, a]) => { addFx(md[i] + (i < 2 ? gi % 4 : gi % 4), h, a, { t: 'wc', id: 'WC', g: gi }); comp.left++; })));
  comp.rdays = [[dayOf(2026, 6, 28)], [dayOf(2026, 7, 3)], [dayOf(2026, 7, 9)], [dayOf(2026, 7, 14)], [dayOf(2026, 7, 19)]];
  comp.rl = '조별리그';
  addNews('world', '월드컵 2026 개막 — 48개국이 우승을 향해 출발합니다', true);
  const club = G.clubs.find(c => c.nat === opts.nat);
  const p = createMe({ name: opts.name, look: opts.look, nat: opts.nat || 'KOR', club: club.id, age: 30, pos: 'CM', h: 178, prefs: [], trait: 'team' });
  club.pl = club.pl.filter(id => id !== p.id);
  for (const sub of ['GK','CB','CB','CB','FB','FB','DM','CM','CM','AM','W','W','ST','ST']) newFor(club, sub, ri(1, 3), false);   // 선발 후보 14명 추가(총 40명)
  p.mgr = true; p.retired = true; p.ovr = 1; p.pot = 1; p.fame = 0; p.ct = { until: 2300, wage: 0 }; p.offers = []; p.trust = 100; p.inj = 0;
  G.news = G.news.filter(n => !(n.type === 'me' && /계약했습니다/.test(n.text)));
  const rk = ids.indexOf(club.id) + 1;
  const goal = rk <= 4 ? '우승 도전 (4강 이상)' : rk <= 12 ? '8강 진출' : rk <= 30 ? '16강 진출' : '조별리그 1승';
  G.mode = 'mgr'; G.mgr = { name: opts.name, board: 60, cash: 0, target: rk, w: 0, d: 0, l: 0, seasons: [], sacked: false, wcGoal: goal, rank: rk };
  addNews('me', `${opts.name} 감독, ${club.name} 대표팀을 이끌고 월드컵에 나섭니다. 목표: ${goal}`, true, { me: true });
  return p;
}
const WC_QUOTA = { GK:3, CB:5, FB:4, DM:2, CM:3, AM:2, W:4, ST:3 };
function wcAutoPick() {
  const club = clubOf(me().club), pl = club.pl.map(id => G.players[id]).sort((a, b) => b.ovr - a.ovr), out = [];
  for (const sub of Object.keys(WC_QUOTA)) out.push(...pl.filter(p => p.sub === sub).slice(0, WC_QUOTA[sub]).map(p => p.id));
  for (const p of pl) { if (out.length >= 26) break; if (!out.includes(p.id)) out.push(p.id); }
  return out;
}
function wcSquadCheck(ids) {
  const pl = ids.map(id => G.players[id]).filter(Boolean), n = (...ss) => pl.filter(p => ss.includes(p.sub)).length;
  if (pl.length !== 26) return `26명을 골라야 합니다 (현재 ${pl.length}명)`;
  if (n('GK') < 3) return '골키퍼는 최소 3명이 필요합니다';
  if (n('CB', 'FB') < 8) return '수비수(CB·FB)는 최소 8명이 필요합니다';
  if (n('DM', 'CM', 'AM') < 5) return '미드필더는 최소 5명이 필요합니다';
  if (n('W', 'ST') < 5) return '공격수(W·ST)는 최소 5명이 필요합니다';
  return null;
}
function wcSquadSet(ids) {
  if (wcSquadCheck(ids)) return false;
  const club = clubOf(me().club), keep = new Set(ids);
  for (const id of club.pl) if (!keep.has(id)) delete G.players[id];
  club.pl = ids.slice(); if (club.tactic) { club.tactic.xi = null; club.tactic.roles = null; }
  return true;
}
function wcInfo() {
  const comp = compById('WC'); if (!comp) return null; const mine = me().club;
  return { comp, gi: comp.groups.findIndex(g => g.teams.includes(mine)), groups: comp.groups.map(g => ({ teams: wcRank(g), table: g.table })), stage: comp.stage, rl: comp.rl, ties: comp.ties || [], hist: comp.khist || [], champ: comp.win, q3: comp.q3 || [], mine, out: wcOut(comp, mine) };
}
function wcOut(comp, mine) {                                                 // 내 팀이 탈락했는지 / 최종 성적
  if (comp.stage === 'G') return null;
  if (comp.win === mine) return '우승';
  if (comp.stage !== 'END' && (comp.ties || []).some(t => t.third && (t.a === mine || t.b === mine) && t.w == null)) return null;
  const rounds = (comp.khist || []).concat(comp.stage === 'END' ? [] : [{ rl: comp.rl, ties: comp.ties }]);
  let last = null; for (const r of rounds) for (const t of r.ties) if (t.a === mine || t.b === mine) last = { rl: r.rl, w: t.w };
  if (!last) return '조별리그 탈락';
  if (last.rl === '3·4위전') return last.w === mine ? '3위' : '4위';
  if (last.w != null && last.w !== mine) return last.rl === '결승' ? '준우승' : last.rl + ' 탈락';
  return null;
}
// ===================== 감독 모드 =====================
const isMgr = () => !!G && G.mode === 'mgr';
const POS_ORD = ['GK','CB','FB','DM','CM','AM','W','ST'];
function startersFor(club, squad) {                                         // 감독 모드: 선발은 포메이션·감독 지정 선발대로
  if (G.mode === 'mgr' && squad.length >= 11) { try { return Eng.buildLineup(squad, club.tactic).map(e => e.p); } catch (e) {} }
  return startersOf(squad);
}
function mgrValue(p) { const x = Math.max(1, p.ovr - 40) / 10, af = p.age <= 21 ? 1.3 : p.age <= 26 ? 1.1 : p.age <= 29 ? 1 : p.age <= 32 ? 0.7 : 0.4; return Math.max(0.05, Math.round(Math.pow(x, 2.8) * 0.12 * af * 100) / 100); }
const mgrCash0 = (c) => Math.max(8, Math.round((c.strength - 40) * 1.4));
function mgrTier1(cc) { return G.clubs.filter(c => c.kind === 'pro' && c.cc === cc && c.tier === 1).sort((a, b) => b.strength - a.strength); }
function mgrGoal(club) {
  const l = mgrTier1(club.cc), n = l.length || 1, rk = (l.findIndex(c => c.id === club.id) + 1) || n, target = Math.max(1, Math.min(Math.max(1, n - 3), Math.round(rk * 0.85)));
  return { rank: rk, n, target, text: rk <= 3 ? `우승권 도전 · ${target}위 이내` : target <= n / 2 ? `상위권 진입 · ${target}위 이내` : `1부 잔류 · ${target}위 이내` };
}
function mgrOffers(cc) {
  const l = mgrTier1(cc), n = l.length; if (!n) return []; const idx = [Math.floor(n * 0.1), Math.floor(n * 0.5), Math.floor(n * 0.85)], tags = ['강호 · 기대가 높음', '중위권 · 균형형', '약체 · 잔류 도전'];
  return idx.map((i, k) => { const c = l[Math.min(n - 1, i)], g = mgrGoal(c); return { id: c.id, name: c.name, strength: Math.round(c.strength), tag: tags[k], goal: g.text, cash: mgrCash0(c), rank: g.rank, n }; });
}
function mgrJobs() { const m = me(), c = G.clubs[m.club]; return mgrOffers(c.cc).filter(o => o.id !== c.id).concat(mgrTier1(c.cc).length ? [] : []); }
function createMgr(opts) {
  const club = G.clubs[opts.club];
  const p = createMe({ name: opts.name, look: opts.look, nat: opts.nat || 'KOR', club: opts.club, age: 30, pos: 'CM', h: 178, prefs: [], trait: 'team' });
  club.pl = club.pl.filter(id => id !== p.id);
  p.mgr = true; p.retired = true; p.ovr = 1; p.pot = 1; p.fame = 0; p.ct = { until: 2300, wage: 0 }; p.offers = []; p.trust = 100; p.inj = 0;
  G.news = G.news.filter(n => !(n.type === 'me' && /계약했습니다/.test(n.text)));
  const g = mgrGoal(club);
  G.mode = 'mgr'; G.mgr = { name: opts.name, board: 60, cash: mgrCash0(club), target: g.target, w: 0, d: 0, l: 0, seasons: [], sacked: false };
  addNews('me', `${opts.name} 감독, ${club.name} 지휘봉을 잡았습니다. 목표: ${g.text}`, true, { me: true });
  return p;
}
function mgrSquad() { const m = me(), c = G.clubs[m.club]; return c.pl.map(id => G.players[id]).filter(p => p && !p.mgr && !p.retired).sort((a, b) => POS_ORD.indexOf(a.sub) - POS_ORD.indexOf(b.sub) || b.ovr - a.ovr); }
function mgrLineup() {
  const m = me(), c = G.clubs[m.club], sq = availableSquad(c, true).filter(p => !p.mgr), lu = sq.length >= 11 ? Eng.buildLineup(sq, c.tactic) : [], ids = new Set(lu.map(e => e.p.id));
  return { tactic: c.tactic, slots: lu, bench: sq.filter(p => !ids.has(p.id)).sort((a, b) => b.ovr - a.ovr), custom: !!(c.tactic.xi && lu.length && lu.every((e, i) => e.p.id === c.tactic.xi[i])), injured: mgrSquad().filter(p => p.inj > 0) };
}
function mgrSetXi(i, pid) { const c = G.clubs[me().club], L = mgrLineup(); if (!L.slots.length) return; const ids = L.slots.map(e => e.p.id), roles = (c.tactic.roles || []).slice(), j = ids.indexOf(pid); if (j >= 0) { ids[j] = ids[i]; roles[j] = null; } ids[i] = pid; roles[i] = null; c.tactic.xi = ids; c.tactic.roles = roles; }
function mgrSetRole(i, rid) { const c = G.clubs[me().club], roles = (c.tactic.roles || []).slice(); roles[i] = rid; c.tactic.roles = roles; }
function mgrSetFormation(f) { const c = G.clubs[me().club]; c.tactic.formation = f; c.tactic.xi = null; c.tactic.roles = null; }
function mgrSetInstr(k, v) { G.clubs[me().club].tactic[k] = v; }
function mgrAutoXi() { const t = G.clubs[me().club].tactic; t.xi = null; t.roles = null; }
function mgrMarket(pos) {
  const mine = G.clubs[me().club], out = [];
  for (const id in G.players) { const p = G.players[id]; if (!p || p.mgr || p.me || p.retired || p.club === null || p.club === mine.id) continue; if (pos && pos !== 'ALL' && p.sub !== pos) continue; const c = G.clubs[p.club]; if (!c || c.kind !== 'pro' || c.cc !== mine.cc) continue; out.push({ p, price: mgrValue(p), club: c.name }); }
  return out.sort((a, b) => b.p.ovr - a.p.ovr).slice(0, 60);
}
function mgrWin() { const t = dateOf(G.day), open = inWindow(t); return { open, days: open ? 0 : nextWindowDay() - G.day }; }
function mgrBuy(id) {
  { const w = mgrWin(); if (!w.open) return { ok: false, msg: `이적 시장이 닫혀 있습니다 (${w.days}일 뒤 개장)` }; }
  const m = me(), mine = G.clubs[m.club], p = G.players[id], g = G.mgr; if (!p) return { ok: false, msg: '선수를 찾을 수 없습니다' };
  const price = Math.round(mgrValue(p) * (1 - 0.03*mgrStaffLv('scout')) * 100) / 100; if (price > g.cash) return { ok: false, msg: `예산이 부족합니다 (필요 ${price}억 / 보유 ${g.cash}억)` }; if (mgrSquad().length >= 30) return { ok: false, msg: '선수단이 가득 찼습니다 (30명)' };
  const from = G.clubs[p.club]; from.pl = from.pl.filter(x => x !== p.id); p.club = mine.id; mine.pl.push(p.id); g.cash = Math.round((g.cash - price) * 100) / 100; mgrX().fin.tr -= price; p.ct = { until: dateOf(G.day).y + 3, wage: wageFor(p, mine) };
  addNews('transfer', `${mine.name}, ${from.name}에서 ${p.name}(${p.age}, ${POS_KO[p.sub]}) 영입 — 이적료 ${price}억 원`, price >= 3, { me: true });
  return { ok: true, msg: `${p.name} 영입 완료 (${price}억 원)` };
}
function mgrSell(id) {
  { const w = mgrWin(); if (!w.open) return { ok: false, msg: `이적 시장이 닫혀 있습니다 (${w.days}일 뒤 개장)` }; }
  const m = me(), mine = G.clubs[m.club], p = G.players[id], g = G.mgr; if (!p || p.club !== mine.id) return { ok: false, msg: '내 선수가 아닙니다' };
  if (mgrSquad().length <= 16) return { ok: false, msg: '선수단은 최소 16명이어야 합니다' };
  const buyers = mgrTier1(mine.cc).filter(c => c.id !== mine.id); if (!buyers.length) return { ok: false, msg: '구매할 구단이 없습니다' };
  const to = pick(buyers), price = Math.round(mgrValue(p) * (0.85 + 0.02*mgrStaffLv('scout')) * 100) / 100;
  mine.pl = mine.pl.filter(x => x !== p.id); to.pl.push(p.id); p.club = to.id; g.cash = Math.round((g.cash + price) * 100) / 100; mgrX().fin.tr += price;
  if (mine.tactic.xi) { mine.tactic.xi = null; mine.tactic.roles = null; }
  addNews('transfer', `${mine.name}, ${p.name}(${p.age}, ${POS_KO[p.sub]})를 ${to.name}에 매각 — ${price}억 원`, price >= 3, { me: true });
  return { ok: true, msg: `${p.name} 매각 완료 (${price}억 원)` };
}
function mgrStanding() {
  const m = me(), c = G.clubs[m.club], lg = leagueOf(c.lg); if (!lg || !lg.table) return null;
  const ids = sortedTable(lg), rk = ids.indexOf(c.id) + 1, t = lg.table[c.id] || { p: 0, pts: 0 };
  return { rank: rk, n: ids.length, p: t.p, pts: t.pts, lg: lg.name, w: t.w, d: t.d, l: t.l, gf: t.gf, ga: t.ga };
}
function mgrAfterMatch(M, mg, og) {
  if (G.wc) { const g = G.mgr; if (mg > og) g.w++; else if (mg < og) g.l++; else g.d++; return; }
  const g = mgrX(), mine = M.mine, opp = M.opp, diff = (mine.strength - opp.strength) / 25, res = mg > og ? 1 : mg < og ? -1 : 0;
  const derby = rivalOf(mine) === opp.id || rivalOf(opp) === mine.id, dm = derby ? 1.6 : 1;
  let d = res === 1 ? 2.2 - diff * 1.2 : res === -1 ? -2.2 - diff * 1.2 : -diff * 0.6; d = clamp(d * dm, -8, 8);
  g.board = Math.round(clamp(g.board + d * 0.9, 0, 100) * 10) / 10; if (res === 1) g.w++; else if (res === 0) g.d++; else g.l++;
  const fd = (res === 1 ? 1.4 + (mg - og >= 3 ? 0.8 : 0) : res === -1 ? -1.6 : 0.1) * (derby ? 2 : 1); g.fans = Math.round(clamp(g.fans + fd, 5, 100) * 10) / 10;
  const K = mgrK(), tk = M.mineHome ? K * 0.45 / 19 * (0.6 + g.fans / 150) * (derby ? 1.25 : 1) : 0;
  g.cash = Math.round((g.cash + tk) * 100) / 100; g.fin.tk += tk;
  if (derby) { if (res === 1) g.derby.w++; else if (res === 0) g.derby.d++; else g.derby.l++; addNews('me', `🔥 ${mine.name}, 라이벌 ${opp.name}와(과) ${mg}-${og}${res === 1 ? ' 승리! 팬들이 열광합니다' : res === -1 ? ' 패배… 팬들의 실망이 큽니다' : ' 무승부'}`, true, { me: true }); }
  g.lastRes = { mg, og, opp: opp.name, derby, day: G.day }; g.press = null;
  if (g.board < 12 && g.w + g.d + g.l >= 8 && !g.sacked) { g.sacked = true; addNews('me', `${g.name} 감독, 성적 부진으로 ${mine.name}에서 경질됐습니다`, true, { me: true }); }
}
function mgrSeasonEnd(lg, tb) {
  const m = me(), c = G.clubs[m.club], g = G.mgr; if (!c || c.lg !== lg.id || !g) return; mgrX();
  const rk = tb.indexOf(c.id) + 1, ok = rk > 0 && rk <= g.target;
  g.board = clamp(g.board + (ok ? 15 : -18), 0, 100); g.seasons.push({ season: seasonLabel(lg), rank: rk, target: g.target, ok, club: c.name });
  addNews('me', `${c.name} ${seasonLabel(lg)} ${rk}위 — 목표 ${g.target}위 ${ok ? '달성' : '미달'}`, true, { me: true });
  if (rk === 1) mgrTrophy(lg.name + ' 우승', seasonLabel(lg));
  g.fans = clamp(g.fans + (ok ? 3 : -4), 5, 100);
  if (!ok && g.board < 20) g.sacked = true;
  const K0 = mgrK(), pz = Math.round(K0 * (0.22 + (ok ? 0.05 : 0)) * 100) / 100; g.fin.pz += pz; mgrSponsorYear(rk, ok); g.cash = Math.round((g.cash + pz) * 100) / 100; g.target = mgrGoal(c).target;
}
// ===== 감독 모드 확장: 팬·라이벌·스태프·재정·트로피장·기자회견 =====
const STAFF = { coach: { n: '코치진', ic: '🎓', d: '24세 이하 선수 성장 +6% / 레벨' }, med: { n: '의료팀', ic: '🩺', d: '부상 기간 -8% / 레벨' }, fit: { n: '피지컬팀', ic: '💪', d: '부상 발생 -7% / 레벨' }, scout: { n: '스카우트', ic: '🔭', d: '영입가 -3%, 매각가 +2% / 레벨' } };
function mgrX() { const g = G.mgr; if (!g) return null; if (g.fans === undefined) { g.fans = 55; g.mood = 50; g.staff = { coach: 0, med: 0, fit: 0, scout: 0 }; g.trophies = []; g.fin = { tk: 0, sp: 0, mc: 0, pz: 0, tr: 0, st: 0, log: [] }; g.derby = { w: 0, d: 0, l: 0 }; }
  if (g.fin.wg === undefined) g.fin.wg = 0; if (!g.spons) { g.spons = { main: null, sleeve: null, stadium: null }; g.spOff = null; } return g; }
function mgrStaffLv(k) { if (G.mode !== 'mgr' || G.wc || !G.mgr) return 0; return (mgrX().staff[k]) || 0; }
function mgrFx(club, k) { if (G.mode !== 'mgr' || G.wc || !G.mgr || G.me === null || !club) return 0; const m = G.players[G.me]; if (!m || club.id !== m.club) return 0; return (mgrX().staff[k]) || 0; }
const mgrStaffCost = (lv) => (lv + 1) * 4;
function mgrStaffUp(k) {
  const g = mgrX(), lv = g.staff[k] || 0; if (!STAFF[k]) return { ok: false, msg: '잘못된 요청' }; if (lv >= 5) return { ok: false, msg: '이미 최고 레벨입니다' };
  const cost = mgrStaffCost(lv); if (g.cash < cost) return { ok: false, msg: `예산이 부족합니다 (필요 ${cost}억 / 보유 ${g.cash}억)` };
  g.cash = Math.round((g.cash - cost) * 100) / 100; g.fin.st -= cost; g.staff[k] = lv + 1;
  return { ok: true, msg: `${STAFF[k].n} Lv.${lv + 1} 강화 (${cost}억)` };
}
function rivalOf(c) {
  if (!c || c.kind !== 'pro') return null; if (c.rival !== undefined) return c.rival;
  let best = null, bs = -1; const f0 = c.name.split(' ')[0];
  for (const x of G.clubs) { if (x.kind !== 'pro' || x.lg !== c.lg || x.id === c.id) continue; let sc = (x.region && x.region === c.region ? 5 : 0) + (x.name.split(' ')[0] === f0 ? 4 : 0) + (Math.abs(x.strength - c.strength) <= 8 ? 1 : 0) + (((x.id * 7 + c.id * 13) % 10) / 10); if (sc > bs) { bs = sc; best = x.id; } }
  c.rival = best; return best;
}
function mgrTrophy(name, season) {
  const c = G.clubs[me().club], isM = G.mode === 'mgr';
  if (isM) { const g = mgrX(); g.trophies.push({ name, season: String(season), club: c.name }); g.fans = clamp(g.fans + 6, 5, 100); }
  G.cer = { name, season: String(season), club: c.name, cid: c.id, mgr: isM && !G.wc, wc: !!G.wc };
  addNews('me', `🏆 ${c.name}, ${name}!`, true, { me: true });
}
function mgrK() { return Math.max(8, mgrWage() * 52 / 10000 * 1.12); }       // 기준 연 수입(억): 주급 총액 기반
const SP_BRANDS = ['블록뱅크', '픽셀모터스', '쿼드텔레콤', '큐브에너지', '네모항공', '복셀푸드', '마인라이프', '샌드박스증권', '모듈전자', '큐비스포츠', '타일건설', '브릭생명', '픽토통신', '블로키맥주'];
const SP_SLOT = { main: ['가슴 메인 스폰서', 0.22], sleeve: ['소매 스폰서', 0.06], stadium: ['구장 네이밍', 0.1] };
function mgrSponsorGen() {
  const g = mgrX(), K = mgrK(); g.spOff = g.spOff || {};
  for (const sl of Object.keys(SP_SLOT)) {
    if (g.spons[sl] || (g.spOff[sl] && g.spOff[sl].length)) continue;
    const used = new Set(); g.spOff[sl] = [0, 1, 2].map(() => { let b; do { b = pick(SP_BRANDS); } while (used.has(b)); used.add(b); const y = Math.round(K * SP_SLOT[sl][1] * (0.85 + rnd() * 0.4) * 100) / 100, yrs = ri(1, 3); return { brand: b, slot: sl, yearly: y, years: yrs, bonus: Math.round(y * 0.25 * 100) / 100, rank: g.target }; });
  }
}
function mgrSponsorSign(sl, i) {
  const g = mgrX(); mgrSponsorGen(); const o = g.spOff && g.spOff[sl] && g.spOff[sl][i]; if (!o || g.spons[sl]) return { ok: false, msg: '체결할 수 없습니다' };
  g.spons[sl] = Object.assign({ left: o.years }, o); g.spOff[sl] = null; g.fans = clamp(g.fans + 0.5, 5, 100);
  addNews('me', `💼 ${o.brand}와(과) ${SP_SLOT[sl][0]} 계약 — 연 ${o.yearly}억 · ${o.years}년`, false, { me: true }); return { ok: true, msg: `${o.brand} ${SP_SLOT[sl][0]} 계약 체결 (연 ${o.yearly}억)` };
}
function mgrSponsorYear(rk, ok) {                                           // 시즌 종료 정산: 성적 보너스, 계약 만료
  const g = mgrX(); for (const sl of Object.keys(SP_SLOT)) { const c = g.spons[sl]; if (!c) continue;
    if (rk > 0 && rk <= c.rank) { g.cash = Math.round((g.cash + c.bonus) * 100) / 100; g.fin.sp += c.bonus; addNews('me', `💼 ${c.brand}, 성적 보너스 ${c.bonus}억 지급`, false, { me: true }); }
    c.left--; if (c.left <= 0) { g.spons[sl] = null; addNews('me', `💼 ${c.brand} ${SP_SLOT[sl][0]} 계약 만료 — 새 제안이 도착했습니다`, true, { me: true }); } }
  g.spOff = null; mgrSponsorGen();
}
function mgrMonth(t) {
  const g = mgrX(), c = G.clubs[me().club]; if (!c) return; mgrSponsorGen();
  const K = mgrK(), wg = Math.round(mgrWage() * 52 / 12 / 10000 * 100) / 100;
  let sp = 0; for (const sl of Object.keys(SP_SLOT)) if (g.spons[sl]) sp += g.spons[sl].yearly / 12; sp = Math.round(sp * 100) / 100;
  const mc = Math.round(K * 0.08 / 12 * (g.fans / 60) * 100) / 100;
  g.cash = Math.round((g.cash + sp + mc - wg) * 100) / 100; g.fin.sp += sp; g.fin.mc += mc; g.fin.wg -= wg;
  if (g.cash < 0) { g.board = Math.round(clamp(g.board - 2.5, 0, 100) * 10) / 10; addNews('me', `⚠ ${c.name} 재정 적자! 이사회가 긴축 재정을 요구합니다`, true, { me: true }); }
  g.fin.log.push({ y: t.y, m: t.m, cash: g.cash }); if (g.fin.log.length > 24) g.fin.log.shift();
  g.mood = Math.round(clamp(g.mood + (50 - g.mood) * 0.08, 0, 100) * 10) / 10;
}
function renamePlayer(id, nm) { const p = G.players[id], n = String(nm || '').trim().slice(0, 14); if (!p || !n) return false; p.name = n; return true; }
function renameClub(id, nm) { const c = G.clubs[id], n = String(nm || '').trim().slice(0, 16); if (!c || !n) return false; c.name = n; return true; }
function mgrWage() { const sq = mgrSquad(); return sq.reduce((s, p) => s + ((p.ct && p.ct.wage) || 0), 0); }
function mgrFanText() { const f = mgrX().fans; return f >= 85 ? ['"이 팀이 우리의 자부심이다!"', '경기장은 항상 만원입니다'] : f >= 65 ? ['"올 시즌 느낌이 좋다!"', '서포터즈가 응원가를 열창합니다'] : f >= 45 ? ['"결과만 보여 달라"', '팬들이 지켜보는 중입니다'] : f >= 25 ? ['"감독 책임져라"', '관중석에 빈자리가 늘고 있습니다'] : ['"감독 나가!"', '팬들의 분노가 극에 달했습니다']; }
function mgrPressGen() {
  const g = G.mgr && G.mode === 'mgr' && !G.wc ? mgrX() : null; const r = g && g.lastRes; if (!r) return null;
  const k = r.mg > r.og ? 'w' : r.mg < r.og ? 'l' : 'd', pre = r.derby ? '🔥 라이벌전 · ' : '';
  const Q = {
    w: { q: `${r.opp}전 ${r.mg}-${r.og} 승리. 오늘 승리의 비결은?`, o: [['humble', '선수들의 헌신 덕분입니다'], ['tactic', '준비한 전술이 완벽히 통했습니다'], ['bold', '아직 만족하지 않습니다. 더 높이 가겠습니다']] },
    l: { q: `${r.opp}전 ${r.mg}-${r.og} 패배. 부진의 원인은 무엇입니까?`, o: [['own', '책임은 감독인 저에게 있습니다'], ['ref', '판정이 아쉬웠습니다'], ['blame', '선수들의 집중력이 부족했습니다']] },
    d: { q: `${r.opp}전 ${r.mg}-${r.og} 무승부. 결과에 만족합니까?`, o: [['no', '만족스럽지 않습니다. 이겼어야 했습니다'], ['pt', '값진 승점 1점입니다'], ['good', '선수들이 좋은 경기를 해줬습니다']] }
  }[k];
  g.press = { q: pre + Q.q, opts: Q.o.map(([id, t]) => ({ id, t })), k, derby: r.derby, done: null }; return g.press;
}
function mgrPreGen() {
  const g = G.mode === 'mgr' && !G.wc ? mgrX() : null, pm = G.pendingMine; if (!g || !pm) return null; const m = me(), op = G.clubs[pm.h === m.club ? pm.a : pm.h], derby = rivalOf(G.clubs[m.club]) === op.id || rivalOf(op) === m.club;
  g.press = { q: (derby ? '🔥 라이벌전 · ' : '') + `${op.name}전을 앞두고 각오를 말씀해 주세요.`, opts: [{ id: 'conf', t: '자신 있습니다. 승점 3점을 가져오겠습니다' }, { id: 'resp', t: '상대를 존중합니다. 준비한 대로 하겠습니다' }, { id: 'push', t: '압박은 제가 받겠습니다. 선수들은 즐기면 됩니다' }], k: 'pre', derby, done: null, pre: true }; return g.press;
}
function mgrCerPress() {
  const g = mgrX(), cr = G.cer; if (!g || !cr) return null;
  g.press = { q: `🏆 ${cr.name} — 우승을 축하드립니다! 소감을 부탁드립니다.`, opts: [{ id: 'cfan', t: '팬 여러분 덕분입니다' }, { id: 'cteam', t: '선수단과 스태프가 만든 우승입니다' }, { id: 'cnext', t: '다음 목표는 더 큰 대회입니다' }], k: 'cer', derby: false, done: null }; return g.press;
}
function mgrPressPick(id) {
  const g = mgrX(), pr = g.press; if (!pr || pr.done) return null; const dm = pr.derby ? 1.6 : 1; let b = 0, f = 0, mo = 0, text = '';
  if (id === 'humble') { mo = 3; b = 0.5; f = 0.5; text = '"겸손한 감독이네요." 선수단 분위기가 좋아집니다.'; }
  else if (id === 'tactic') { mo = -1; b = 1.5; text = '이사회가 전술 지도력을 높이 평가합니다. 다만 선수들은 조금 서운해합니다.'; }
  else if (id === 'bold') { if (rnd() < 0.6) { f = 2; mo = 1; text = '"야망 있는 감독!" 팬들이 환호합니다.'; } else { b = -1; text = '"너무 앞서간다"는 비판이 나옵니다. 기대치가 높아집니다.'; } }
  else if (id === 'own') { mo = 4; b = -0.5; f = 1; text = '책임지는 모습에 선수단이 단단히 뭉칩니다.'; }
  else if (id === 'ref') { b = -1.5; f = 1.5; mo = 1; text = '팬들은 속 시원해하지만 이사회는 변명처럼 느낍니다.'; }
  else if (id === 'blame') { mo = -4; b = 0.5; text = '선수단 분위기가 급격히 가라앉습니다.'; }
  else if (id === 'no') { mo = 1; f = 1; text = '승리욕이 있는 감독이라는 평가를 받습니다.'; }
  else if (id === 'pt') { b = 0.5; text = '무난한 답변입니다. 이사회는 안정적이라 봅니다.'; }
  else if (id === 'good') { f = 0.5; mo = 2; text = '선수들이 자신감을 얻습니다.'; }
  else if (id === 'conf') { f = 1.5; mo = 1; b = 0.3; text = '"자신감 넘치는 감독!" 팬들의 기대가 커집니다.'; }
  else if (id === 'resp') { mo = 1; b = 0.5; text = '차분한 인터뷰입니다. 선수단과 이사회 모두 무난하게 받아들입니다.'; }
  else if (id === 'push') { mo = 3; f = 0.5; text = '선수들이 부담을 덜고 경기를 즐길 준비를 합니다.'; }
  else if (id === 'cfan') { f = 4; mo = 1; text = '팬들이 감동합니다. 도시 전체가 축제 분위기입니다.'; }
  else if (id === 'cteam') { mo = 5; f = 1; text = '선수단이 끈끈하게 뭉칩니다. 라커룸 분위기가 최고조입니다.'; }
  else if (id === 'cnext') { b = 2; f = 1; text = '이사회가 야망에 감동해 더 큰 지원을 약속합니다.'; }
  else return null;
  g.board = Math.round(clamp(g.board + b * dm, 0, 100) * 10) / 10; g.fans = Math.round(clamp(g.fans + f * dm, 5, 100) * 10) / 10; g.mood = Math.round(clamp(g.mood + mo * dm, 0, 100) * 10) / 10;
  pr.done = { id, text, b: b * dm, f: f * dm, mo: mo * dm }; return pr.done;
}
function mgrTakeJob(id) {
  const m = me(), g = G.mgr, c = G.clubs[id]; m.club = id; g.board = 60; g.cash = mgrCash0(c); g.target = mgrGoal(c).target; g.sacked = false; g.w = g.d = g.l = 0;
  G.pendingMine = null; addNews('me', `${g.name} 감독, ${c.name} 지휘봉을 잡았습니다. 목표 ${g.target}위 이내`, true, { me: true });
}
function mgrTalkInfo(diff) {
  const t = diff < 0 ? pick(['점수 차는 크지 않다. 후반에 반드시 따라잡는다.', '전반 내용은 나쁘지 않았다. 마무리만 정확하게 하자.'])
    : diff > 0 ? pick(['리드는 지금부터가 중요하다. 집중력을 잃지 마라.', '좋은 흐름이다. 추가골까지 노려 보자.']) : pick(['균형이 팽팽하다. 후반에 우리가 먼저 움직인다.', '아직 승부는 모른다. 계획대로만 가자.']);
  return { text: t, opts: [{ id: 'calm', t: '침착하게 전술대로 하자고 말한다' }, { id: 'cheer', t: '격려하며 자신감을 불어넣는다' }, { id: 'fire', t: '강하게 질책하며 분발을 요구한다' }] };
}
function mgrTalkPick(id, diff) {
  const M = G.mm; let talk = 0, text = '';
  if (id === 'calm') { talk = 0.03; text = '선수들이 차분히 전술을 다시 확인합니다.'; }
  else if (id === 'cheer') { if (rnd() < 0.75) { talk = diff < 0 ? 0.08 : 0.04; text = '선수들의 표정이 밝아졌습니다. 자신감이 돌아옵니다.'; } else { talk = 0; text = '분위기는 나쁘지 않지만 큰 변화는 없습니다.'; } }
  else { if (rnd() < (diff < 0 ? 0.65 : 0.4)) { talk = 0.07; text = '라커룸에 긴장감이 돕니다. 선수들이 눈빛을 바꿉니다.'; } else { talk = -0.05; text = '선수들이 위축된 듯합니다. 역효과가 났습니다.'; } }
  if (M) M.talk = talk; return { text, talk };
}
function mgrSub(outId, inId, min) {
  const M = G.mm; if (!M || G.mode !== 'mgr') return null; if ((M.mgrSubs || 0) >= 5) return null;
  const oi = M.stMine.findIndex(p => p.id === outId), bi = M.benchMine.findIndex(p => p.id === inId); if (oi < 0 || bi < 0) return null;
  const out = M.stMine[oi], inn = M.benchMine[bi]; M.stMine[oi] = inn; M.benchMine.splice(bi, 1); M.mgrSubs = (M.mgrSubs || 0) + 1;
  const k = M.mgrXi.indexOf(outId); if (k >= 0) M.mgrXi[k] = inId;
  for (const e of M.evMine) if (e.min > min) { if (e.sc === out) e.sc = wpick(M.stMine.concat(M.benchMine.slice(0, 3)), SC_W); if (e.as === out) e.as = wpick(M.stMine, AS_W, e.sc); }
  return { out, inn };
}
function mgrReplan(min) {                                                  // 전술 변경 반영: 남은 시간의 득점 기대치를 새 전술로 다시 계산
  const M = G.mm; if (!M || G.mode !== 'mgr') return; const c = M.mine, o = M.opp, mh = M.mineHome;
  const t = Object.assign({}, c.tactic, { xi: M.mgrXi.slice() }), sqM = M.stMine.concat(M.benchMine), sqO = M.stOpp.concat(M.benchOpp);
  let r; try { r = Eng.simulate(rnd, mh ? { squad: sqM, tactic: t } : { squad: sqO, tactic: o.tactic }, mh ? { squad: sqO, tactic: o.tactic } : { squad: sqM, tactic: t }, { homeA: !M.neutral }); } catch (e) { return; }
  const xm = mh ? r.xgA : r.xgB, xo = mh ? r.xgB : r.xgA, fr = Math.max(0, (90 - min) / 90), tk = 1 + (M.talk || 0);
  const pois = (l) => { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L && k < 9); return k - 1; };
  const gm = pois(xm * fr * tk), go = pois(xo * fr * (2 - tk));
  const retime = (ev) => { ev.forEach(e => { e.min = ri(Math.min(89, min + 1), 90); }); return ev.sort((a, b) => a.min - b.min); };
  M.evMine = M.evMine.filter(e => e.min <= min).concat(retime(genEvents(c, gm, M.stMine, M.benchMine)));
  M.evOpp = M.evOpp.filter(e => e.min <= min).concat(retime(genEvents(o, go, M.stOpp, M.benchOpp)));
}

const NATFLAG = (c) => DD.FLAG[c] || (WCN[c] && WCN[c][1]) || '';
const API2 = { wcKO, wcExtra, wcAutoPick, wcSquadCheck, wcSquadSet, mgrK, SP_SLOT, mgrSponsorGen, mgrSponsorSign, mgrPreGen, mgrCerPress, renamePlayer, renameClub, NATFLAG, mgrTrophy, mgrX, STAFF, mgrStaffUp, mgrStaffCost, mgrStaffLv, mgrWage, mgrFanText, mgrPressGen, mgrPressPick, rivalOf, wcStart, wcInfo, wcRank, WCN, Eng, isMgr, mgrWin, createMgr, mgrOffers, mgrJobs, mgrGoal, mgrSquad, mgrLineup, mgrSetXi, mgrSetRole, mgrSetFormation, mgrSetInstr, mgrAutoXi, mgrMarket, mgrBuy, mgrSell, mgrValue, mgrStanding, mgrTakeJob, mgrTalkInfo, mgrTalkPick, mgrSub, mgrReplan, talkInfo, talkPick, posKinds: (sub) => POSK[sub] || POSK.ST, optInfo, nextEvent, plansOf, normPlan, mvpOf, get G() { return G; }, newWorld, newWorldGen, createMe, me, clubOf, leagueOf, compById, step, prepareMine, momentOptions, resolveMoment, finishMine, autoMine, sortedTable, topList, ratingList, acceptOffer, declineOffer, acceptRenewal, serialize, load, fmtDate, dateOf, dayOf, POS_KO, PLANS, price, MEET, answerMeeting, scoutOf, marketInfo, coachOf, PREFS, PREF_POS, momentText, negotiate, cancelPending, inWindow, nextWindowDay, pitchOf, finOf, sponsorAccept, sponsorDecline, setInv, INV, TRAITS, STYLE_KO, STYLE_DESC, ROLES, roleOf, setCust, setRoleTraining, mentorOf, pickMentor, ACH, flushFinish, startersOf, stageOf, lvl, seasonLabel, COUNTRIES: DD.COUNTRIES, NAT_KO: DD.NAT_KO, FLAG: DD.FLAG, NAT_CODES: DD.NAT_CODES, CODES: DD.CODES, NATK, matchTitle, mineIn, NT_WIN };
if (typeof module !== 'undefined') module.exports = API2;
