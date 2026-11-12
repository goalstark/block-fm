// ===== UI =====
const Core = API2;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const SKIN_C = { fair:'F6D2B4', tan:'E0A67A', olive:'C58C5E', brown:'8F5B3A', deep:'5E3A26' };
const HAIR_C = { black:'1E1A1D', dark:'3A2A22', brown:'6B4429', blond:'D9B45A', red:'A9432A', gray:'B0B5BA', navy:'27325A' };
const STYLE_N = { short:'짧은 머리', sidepart:'가르마', buzz:'삭발풍', curly:'곱슬', mohawk:'모히칸', long:'긴 머리', bun:'올림머리' };
const POS_ORDER = ['GK','CB','FB','DM','CM','AM','W','ST'];
const AT_KO = { FIN:'마무리',PAS:'패스',CRS:'크로스',DRI:'드리블',TEC:'테크닉',HEA:'헤딩',TAK:'태클',MAR:'마크',VIS:'시야',OTB:'오프더볼',POS:'위치선정',DEC:'판단력',COM:'침착성',WOR:'활동량',AGG:'적극성',PAC:'스피드',STA:'스태미나',STR:'몸싸움',AGI:'민첩성',JUM:'점프',REF:'반사신경',HAN:'캐칭',KIC:'킥',AER:'공중볼' };
const spriteCache = {};
function sprite(look, kit, num) {
  const key = JSON.stringify([look, kit]); if (spriteCache[key]) return spriteCache[key];
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 34; const g = cv.getContext('2d');
  let seed = 7; const rn = () => { seed = (seed*1664525 + 1013904223) % 4294967296; return seed/4294967296; };
  const rgb = (h) => [0,2,4].map(i => parseInt(h.substr(i,2),16)); const sh = (h,f) => 'rgb(' + rgb(h).map(v => Math.max(0,Math.min(255,Math.round(v*f)))).join(',') + ')';
  const S = SKIN_C[look.skin], Hc = HAIR_C[look.hair], main = (kit && kit[0] || '#1E8F4E').slice(1), sec = (kit && kit[1] || '#F3F3F3').slice(1);
  const rect = (x0,y0,x1,y1,c) => { g.fillStyle = c; g.fillRect(x0,y0,x1-x0+1,y1-y0+1); };
  const noisy = (x0,y0,x1,y1,h,amt=0.06) => { for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++) { g.fillStyle = sh(h,1+(rn()*2-1)*amt); g.fillRect(x,y,1,1); } };
  for (const x0 of [4,8]) { noisy(x0,22,x0+3,33,S); noisy(x0,28,x0+3,31,sec); noisy(x0,32,x0+3,33,'2B2E38'); }
  noisy(4,10,11,21,main); rect(4,19,11,21,sec); rect(6,10,9,10,S);
  for (const x0 of [0,12]) { noisy(x0,10,x0+3,15,main); noisy(x0,16,x0+3,21,S); }
  noisy(4,2,11,9,S,0.035);
  const st = look.style; noisy(4,1,11,3,Hc,0.08); rect(4,4,4,5,Hc); rect(11,4,11,5,Hc);
  if (st==='sidepart') rect(4,4,7,4,Hc);
  if (st==='curly') { noisy(3,1,12,3,Hc,0.1); rect(3,4,3,6,Hc); rect(12,4,12,6,Hc); }
  if (st==='mohawk'||st==='bun') rect(7,0,8,1,Hc);
  if (st==='long') { rect(3,2,3,13,Hc); rect(12,2,12,13,sh(Hc,0.85)); rect(4,4,4,9,Hc); rect(11,4,11,9,sh(Hc,0.85)); }
  if (st==='buzz') { rect(4,1,11,1,sh(S,0.7)); rect(4,2,11,2,sh(Hc,0.9)); rect(4,3,11,3,sh(S,0.9)); }
  rect(5,6,6,6,'#FFFFFF'); rect(6,6,6,6,'#2A2A44'); rect(9,6,10,6,'#FFFFFF'); rect(9,6,9,6,'#2A2A44'); rect(7,8,8,8,'#8A3B3B');
  const id = g.getImageData(0,0,16,34), d = id.data;
  for (const [x0,y0,x1,y1] of [[4,2,11,9],[4,10,11,21],[0,10,3,21],[12,10,15,21],[4,22,7,33],[8,22,11,33]]) for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++) { const i=(y*16+x)*4; if (!d[i+3]) continue; let f=1; if (x===x1) f*=0.82; if (y===y1) f*=0.85; if (x===x0||y===y0) f*=1.06; d[i]=Math.min(255,d[i]*f); d[i+1]=Math.min(255,d[i+1]*f); d[i+2]=Math.min(255,d[i+2]*f); }
  g.putImageData(id,0,0);
  return spriteCache[key] = cv.toDataURL();
}
const mySprite = (w) => { const m = Core.me(); const c = Core.clubOf(m.club); return `<span class="spr" style="width:${w}px;height:${w*34/16}px;background-image:url(${sprite(m.look,[c.col,c.col2])})"></span>`; };
const S = { step:'boot', tab:'home', lc:null, ld:null, lt:'table', cv:null, modal:null, nf:'all', sel:['KOR','ENG','ESP','ITA','GER'], cr:{ name:'김도윤', skin:'tan', hair:'brown', style:'sidepart', pos:'ST', nat:'KOR', stage:'youth', cc:'KOR', club:null }, resetArm:false, busy:false };
const G0 = () => Core.G;
const f1 = (x) => (Math.round(x*10)/10).toFixed(1);
const CO = Core.COUNTRIES;
const clubLink = (id) => { const c = Core.clubOf(id); return c ? `<a data-act="club" data-id="${id}">${esc(c.name)}</a>` : '-'; };
const pLink = (p) => `<a data-act="pl" data-id="${p.id}" class="${p.me?'me':''}">${esc(p.name)}</a>`;
const lgName = (id) => { const l = Core.leagueOf(id); return l ? l.name : '-'; };
// ---------- 저장 (IndexedDB, 실패하면 무시) ----------
function idb() { return new Promise((res, rej) => { try { const r = indexedDB.open('fsim', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); }
async function idbSet(k, v) { try { const d = await idb(); await new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = rej; }); } catch (e) {} }
async function idbGet(k) { try { const d = await idb(); return await new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = rej; }); } catch (e) { return null; } }
async function idbDel(k) { try { const d = await idb(); await new Promise((res) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }
function save() { try { idbSet('save', Core.serialize()); } catch (e) {} }
async function loadSave() { try { const s = await idbGet('save'); if (s) { Core.load(s); return true; } } catch (e) {} return false; }
// ---------- 다음 경기 ----------
function compLabel(ctx) { if (ctx.t==='lg') return lgName(ctx.id); if (ctx.t==='nt') return '국가대표 경기'; const c = Core.compById(ctx.id); return c ? c.name + (ctx.g!==undefined ? ' 조별리그' : c.rl ? ' '+c.rl : '') : '대회'; }
function nextFixture(clubId) {
  const G = G0(), m = Core.me(); const c = Core.clubOf(clubId), lg = Core.leagueOf(c.lg); let best = null;
  if (lg) for (let i=lg.ptr;i<lg.rd.length && !best;i++) { const r = lg.rd[i]; for (let k=0;k<r.ms.length;k++) { const [h,a] = r.ms[k]; if ((h===clubId||a===clubId) && (r.day + (k%2)) >= G.day) { best = { day: r.day + (k%2), h, a, label: `${lg.name} ${i+1}R` }; break; } } }
  const lim = best ? best.day : G.day + 90, cu = m.callup ? m.callup.id : -1;
  for (let d=G.day; d<=lim; d++) { const fl = G.fx[d]; if (!fl) continue; for (const f of fl) if (f.h===clubId || f.a===clubId || f.h===cu || f.a===cu) { if (!best || d < best.day) best = { day:d, h:f.h, a:f.a, label: compLabel(f.ctx), nt: f.ctx.t==='nt' }; } }
  return best;
}
// ---------- 공통 ----------
function topbar() {
  const G = G0(), m = Core.me(), c = Core.clubOf(m.club);
  return `<div class="top"><div><div class="dim">${Core.fmtDate(G.day)}</div><div class="ttl">${esc(m.name)} <span class="dim">${Core.POS_KO[m.sub]} · ${m.age}세 · ${Core.NATK(m.nat)}</span></div></div><div class="pill"><i style="background:${c.col}"></i>${esc(c.name)}</div></div>`;
}
function tile(k,v,s,c) { return `<div class="tile"><div class="dim">${k}</div><div class="big">${v}</div><div class="s" style="color:${c||'#9DB0A4'}">${s}</div></div>`; }
function offerCard(o, i) {
  const c = Core.clubOf(o.club), lg = Core.leagueOf(c.lg), tag = o.grad ? '입단 제안 (3월 1일까지)' : o.early ? '조기 프로 콜업' : '영입 제안';
  return `<div class="card gl"><div class="dim">${tag}</div><b>${esc(c.name)}</b> <span class="dim">${lg?lg.name:''} · ${Core.stageOf(c)||''}</span><div class="dim">${c.kind==='pro'?`주급 ${o.wage}만 원 · ${o.years}년${o.fee?` · 이적료 약 ${o.fee}억 원`:''}`:`${o.years}년 과정 · 전력 ${Math.round(c.strength)}`}</div><div class="row g8"><button class="btn" data-act="acc" data-id="${i}">수락</button><button class="btn sec" data-act="dec" data-id="${i}">거절</button></div></div>`;
}
function homeView() {
  const G = G0(), m = Core.me(), c = Core.clubOf(m.club);
  const nf = nextFixture(m.club); let nx = '';
  if (nf) { const h = Core.clubOf(nf.h), a = Core.clubOf(nf.a); const d = nf.day - G.day; nx = `<div class="card"><div class="row"><span class="dim">다음 경기 · ${Core.fmtDate(nf.day)} ${d===0?'· 오늘':'· D-'+d}</span><span class="tag">${esc(nf.label)}</span></div><div class="vs"><div><i class="dot" style="background:${h.col}"></i>${esc(h.name)}</div><b>VS</b><div><i class="dot" style="background:${a.col}"></i>${esc(a.name)}</div></div><div class="dim">전력 ${Math.round(h.strength)} : ${Math.round(a.strength)}</div></div>`; }
  const plans = Object.entries(Core.PLANS).map(([id,p]) => `<button class="opt ${m.plan===id?'on':''}" data-act="plan" data-id="${id}"><b>${p.n}</b><span class="dim">${p.k.map(k=>AT_KO[k]).join('·')||'피로 회복'}</span></button>`).join('');
  const offers = m.offers.map(offerCard).join('');
  const ren = m.renewal ? `<div class="card gl"><b>${esc(c.name)} 재계약 제안</b><div class="dim">주급 ${m.renewal.wage}만 원 · ${m.renewal.years}년</div><div class="row g8"><button class="btn" data-act="ren">수락</button></div></div>` : '';
  const logs = m.log.slice(0,5).map(l => `<div class="li"><span class="dim">${Core.fmtDate(l[0]).slice(5,10)}</span> ${esc(l[1])}</div>`).join('') || '<div class="dim">아직 기록이 없습니다.</div>';
  const inj = m.inj>0 ? `<div class="card warn">부상 중 · ${m.inj}일 남음</div>` : '';
  const cu = m.callup ? `<div class="card gl">${esc(m.callup.name)} 소집 중 — 대표팀 경기를 앞두고 있습니다.</div>` : '';
  const stage = Core.stageOf(c);
  return topbar() + `<div class="body">${inj}${cu}${offers}${ren}${nx}
  <div class="tiles">${tile('종합',m.ovr,'잠재 '+m.pot)}${tile('피로',Math.round(m.fat),m.fat>70?'위험':'양호',m.fat>70?'#FFB27A':'#C6F36B')}${tile('사기',Math.round(m.mor),'')}${tile('신뢰',Math.round(m.trust),m.trust<45?'부족':'보통')}</div>
  <div class="dim">현재 단계: ${stage==='프로' ? '프로 · '+lgName(c.lg) : lgName(c.lg)}</div>
  <div class="sec">오늘 훈련 <span class="dim">매일 적용</span></div><div class="opts">${plans}</div>
  <div class="sec">최근 기록</div><div class="card">${logs}</div></div>`;
}
const NCHIPS = [['all','전체'],['me','내 소식'],['transfer','이적'],['rumor','이적설'],['match','경기'],['cup','대회'],['nat','대표팀'],['youth','유망주'],['season','시즌']];
function newsView() {
  const G = G0();
  const list = G.news.filter(n => S.nf==='all' || (S.nf==='me' ? n.me : n.type===S.nf));
  let html = '', last = -1;
  for (const n of list.slice(0,70)) { if (n.d!==last) { html += `<div class="dh">${Core.fmtDate(n.d)}</div>`; last = n.d; } html += `<div class="news ${n.big?'big':''} ${n.me?'mine':''}">${esc(n.text)}</div>`; }
  return `<div class="top"><div class="ttl">뉴스</div></div><div class="chips">${NCHIPS.map(([i,n])=>`<button class="chip ${S.nf===i?'on':''}" data-act="nf" data-id="${i}">${n}</button>`).join('')}</div><div class="body">${html||'<div class="dim">뉴스가 없습니다.</div>'}</div>`;
}
function tableView(lg) {
  const tb = Core.sortedTable(lg), m = Core.me();
  const rows = tb.map((id,i) => { const t = lg.table[id]; const sep = lg.spl && i===lg.spl.top.length ? `<tr><td colspan=6 class="sepr">하위 스플릿</td></tr>` : ''; return `${sep}<tr class="${id===m.club?'hl':''}"><td>${i+1}</td><td>${clubLink(id)}</td><td>${t.p}</td><td>${t.w}-${t.d}-${t.l}</td><td>${t.gf-t.ga>0?'+':''}${t.gf-t.ga}</td><td><b>${t.pts}</b></td></tr>`; }).join('');
  return `${lg.spl?'<div class="dim">상위 스플릿 진행 중 — 점수 승계</div>':''}<table class="tb"><tr><th>#</th><th>팀</th><th>경기</th><th>승무패</th><th>득실</th><th>승점</th></tr>${rows}</table>`;
}
function listView(lg, key) {
  const arr = key==='rt' ? Core.ratingList(lg,20,Math.max(3,Math.floor(lg.ptr/3))) : Core.topList(lg,key,20);
  const rows = arr.map((p,i) => `<tr><td>${i+1}</td><td>${pLink(p)}</td><td>${clubLink(p.club)}</td><td><b>${key==='rt'?f1(p.st.rs/p.st.a):p.st[key]}</b></td></tr>`).join('');
  return `<table class="tb"><tr><th>#</th><th>선수</th><th>팀</th><th>${{g:'골',as:'도움',rt:'평점'}[key]}</th></tr>${rows || '<tr><td colspan=4 class="dim">기록 없음</td></tr>'}</table>`;
}
const DIVN = (l) => l.tier===1 ? '1부' : l.tier===2 ? '2부' : l.tier==='Y' ? (l.cc==='KOR'?'고교·유스':'유스') : '대학';
function tieRow(t) {
  const legs = t.legs.map(L => L ? (L.h===t.a ? `${L.gh}-${L.ga}` : `${L.ga}-${L.gh}`) : '-').join(', ');
  const st = t.w===null ? (t.legs.length ? legs : '예정') : `${t.sa}-${t.sb}${t.n>1?` (${legs})`:''}${t.pen?' 승부차기':''}`;
  return `<div class="tie"><div class="${t.w===t.a?'w':''}">${clubLink(t.a)}</div><div class="dim">${st}</div><div class="${t.w===t.b?'w':''}" style="text-align:right">${clubLink(t.b)}</div></div>`;
}
function compView() {
  const G = G0(); const list = G.comps.filter(c => c.kind!=='po' || c.stage!=='END');
  if (!list.length) return '<div class="dim">진행 중인 대회가 없습니다.</div>';
  if (!S.cv || !list.some(c=>c.id===S.cv)) S.cv = list[0].id;
  const comp = list.find(c=>c.id===S.cv);
  let h = `<div class="chips">${list.map(c=>`<button class="chip s ${S.cv===c.id?'on':''}" data-act="cv" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>`;
  h += `<div class="card"><div class="row"><b>${esc(comp.name)}</b><span class="tag">${esc(comp.season)}</span></div>${comp.win!==null?`<div>우승 ${clubLink(comp.win)}</div>`:`<div class="dim">현재: ${esc(comp.rl||'')}</div>`}</div>`;
  if (comp.kind==='cont' && comp.groups.length) h += comp.groups.map((g,i) => { const tb = g.teams.slice().sort((x,y)=>{ const a=g.table[x], b=g.table[y]; return (b.pts-a.pts)||((b.gf-b.ga)-(a.gf-a.ga))||(b.gf-a.gf); }); return `<div class="sec">${String.fromCharCode(65+i)}조</div><table class="tb"><tr><th></th><th>팀</th><th>경기</th><th>득실</th><th>승점</th></tr>${tb.map((id,k)=>`<tr class="${id===Core.me().club?'hl':''}"><td>${k+1}</td><td>${clubLink(id)}</td><td>${g.table[id].p}</td><td>${g.table[id].gf-g.table[id].ga}</td><td><b>${g.table[id].pts}</b></td></tr>`).join('')}</table>`; }).join('');
  if (comp.ties.length) h += `<div class="sec">${esc(comp.rl)}</div>` + comp.ties.map(tieRow).join('');
  const sc = Object.keys(comp.sc).map(id => [G.players[id], comp.sc[id]]).filter(x=>x[0]).sort((a,b)=>b[1]-a[1]).slice(0,8);
  if (sc.length) h += `<div class="sec">득점 순위</div><table class="tb">${sc.map(([p,g],i)=>`<tr><td>${i+1}</td><td>${pLink(p)}</td><td>${clubLink(p.club)}</td><td><b>${g}</b></td></tr>`).join('')}</table>`;
  const hist = G.compHist.filter(x=>x.id===comp.id).slice(-6).reverse();
  if (hist.length) h += `<div class="sec">역대 우승</div>` + hist.map(x=>`<div class="li"><span class="dim">${esc(x.season)}</span> ${clubLink(x.champ)}</div>`).join('');
  return h;
}
function natView() {
  const G = G0(), m = Core.me(), nat = m.nat;
  const pl = Object.values(G.players).filter(p => p.nat===nat && !p.retired && p.club!==null && p.age>=17).sort((a,b)=>b.ovr-a.ovr).slice(0,16);
  const now = G.day, y = Core.dateOf(now).y; let next = null;
  for (const yy of [y, y+1]) for (const [mo,d] of Core.NT_WIN) { const dd = Core.dayOf(yy,mo,d); if (dd > now && (next===null || dd < next)) next = dd; }
  const log = G.ntLog.slice(0,8).map(x=>`<div class="li">${esc(x)}</div>`).join('') || '<div class="dim">아직 A매치가 없습니다.</div>';
  const rec = m.nst.a>0 ? `대표팀 ${m.nst.a}경기 ${m.nst.g}골` : '대표팀 경기 기록 없음';
  return `<div class="card"><div class="row"><b>${Core.NATK(nat)} 대표팀</b><span class="tag">${m.callup?m.callup.name+' 소집':'소집 대기'}</span></div><div class="dim">${rec}${next?` · 다음 소집 ${Core.fmtDate(next)}`:''}</div><div class="dim">U15·U17·U20·U23·A대표 — 활약과 종합 능력치가 상위권이면 자동으로 소집됩니다.</div></div>
  <div class="sec">${Core.NATK(nat)} 선수 상위 16 (A대표 후보)</div><table class="tb"><tr><th>선수</th><th>팀</th><th>나이</th><th>종합</th></tr>${pl.map(p=>`<tr><td>${pLink(p)}</td><td>${clubLink(p.club)}</td><td>${p.age}</td><td>${p.ovr}</td></tr>`).join('')}</table>
  <div class="sec">최근 대표팀 결과</div><div class="card">${log}</div>`;
}
function leagueView() {
  const G = G0(), me = Core.me(), mc = Core.clubOf(me.club);
  if (!S.lc) S.lc = mc.cc || G.sel[0];
  const ctop = G.sel.map(c=>`<button class="chip ${S.lc===c?'on':''}" data-act="lc" data-id="${c}">${CO[c].name}</button>`).join('') + `<button class="chip ${S.lc==='_C'?'on':''}" data-act="lc" data-id="_C">대회</button><button class="chip ${S.lc==='_N'?'on':''}" data-act="lc" data-id="_N">대표팀</button>`;
  let inner = '', sub = '', head = '';
  if (S.lc==='_C') inner = compView();
  else if (S.lc==='_N') inner = natView();
  else {
    const lgs = G.leagues.filter(l=>l.cc===S.lc);
    if (!lgs.length) S.lc = G.sel[0];
    if (!S.ld || !lgs.some(l=>l.id===S.ld)) S.ld = (lgs.find(l=>l.tier===1)||lgs[0]).id;
    const lg = Core.leagueOf(S.ld); const lts = [['table','순위'],['g','득점'],['as','도움'],['rt','평점'],['hist','역대']];
    sub = `<div class="chips">${lgs.map(l=>`<button class="chip s ${S.ld===l.id?'on':''}" data-act="ld" data-id="${l.id}">${DIVN(l)}</button>`).join('')}</div><div class="chips">${lts.map(([i,n])=>`<button class="chip s ${S.lt===i?'on':''}" data-act="lt" data-id="${i}">${n}</button>`).join('')}</div>`;
    inner = S.lt==='table' ? tableView(lg) : S.lt==='hist' ? (lg.hist.length ? lg.hist.slice().reverse().map(h => `<div class="card"><b>${h.season}</b> 우승 ${clubLink(h.champ)}<div class="dim">${h.top?`득점왕 ${esc(h.top[0])} ${h.top[1]}골`:''}${h.mvp?` · MVP ${esc(h.mvp[0])}`:''}</div></div>`).join('') : '<div class="dim">아직 끝난 시즌이 없습니다.</div>') : listView(lg, S.lt);
    head = `<div class="dim">${lg.name} · ${Math.min(lg.ptr,lg.rd.length)}/${lg.rd.length}라운드</div>`;
  }
  return `<div class="top"><div class="ttl">순위·대회</div>${head}</div><div class="chips">${ctop}</div>${sub}<div class="body">${inner}</div>`;
}
function attrBars(p) { const keys = p.sub==='GK' ? ['REF','HAN','KIC','AER','DEC'] : Object.keys(p.a); return `<div class="attrs">${keys.map(k => `<div class="at"><span>${AT_KO[k]||k}</span><i><b style="width:${p.a[k]}%;background:${p.a[k]>=75?'#C6F36B':p.a[k]>=55?'#6FBF8A':'#7A8F82'}"></b></i><em>${p.a[k]}</em></div>`).join('')}</div>`; }
function histTable(p) {
  const rows = p.hist.slice(p.me?0:-15).slice().reverse();
  const cup = (a,g) => a ? `${a}-${g}` : '';
  const cur = (p.st.a>0||p.cst.a>0) ? `<tr class="hl"><td>진행중</td><td>${clubLink(p.club)}</td><td>${p.st.a}</td><td>${p.st.g}</td><td>${p.st.as}</td><td>${p.st.a?f1(p.st.rs/p.st.a):'-'}</td><td>${cup(p.cst.a,p.cst.g)}</td></tr>` : '';
  const tot = p.hist.reduce((a,h)=>[a[0]+h[3],a[1]+h[5],a[2]+h[6]],[p.st.a,p.st.g,p.st.as]);
  return `<table class="tb"><tr><th>시즌</th><th>팀</th><th>출전</th><th>골</th><th>도움</th><th>평점</th><th>컵</th></tr>${cur}${rows.map(h=>`<tr><td>${h[0]}</td><td>${clubLink(h[1])}<div class="dim s9">${esc(lgName(h[2]))}</div></td><td>${h[3]}</td><td>${h[5]}</td><td>${h[6]}</td><td>${h[7]?f1(h[7]):'-'}</td><td>${cup(h[11]||0,h[12]||0)}</td></tr>`).join('')}<tr class="sum"><td colspan=2>통산${p.me?'':' (표시 구간)'}</td><td>${tot[0]}</td><td>${tot[1]}</td><td>${tot[2]}</td><td></td><td></td></tr></table>${(!p.me && p.hist.length>15)?'<div class="dim">최근 15시즌만 표시됩니다.</div>':''}<div class="dim">컵 = 컵·대륙대회 출전-골</div>`;
}
function xferList(p) { if (!p.xfers||!p.xfers.length) return ''; return `<div class="sec">이적 이력</div><div class="card">${p.xfers.slice().reverse().map(x=>`<div class="li"><span class="dim">${Core.fmtDate(x[0]).slice(0,10)}</span> ${x[1]!==null?esc(Core.clubOf(x[1]).name):'자유계약'} → ${esc(Core.clubOf(x[2]).name)} ${x[3]>0?`<span class="dim">(${x[3]}억)</span>`:''}</div>`).join('')}</div>`; }
function profileHTML(p) {
  const c = p.club!==null ? Core.clubOf(p.club) : null;
  const head = p.me ? mySprite(56) : `<span class="spr" style="width:56px;height:119px;background-image:url(${sprite({skin:['fair','tan','olive','brown','deep'][p.id%5],hair:['black','dark','brown','blond','red','gray','navy'][p.id%7],style:['short','sidepart','buzz','curly','long','mohawk'][p.id%6]},c?[c.col,c.col2]:null)})"></span>`;
  const nt = p.nst && p.nst.a>0 ? `<span class="tag">대표 ${p.nst.a}경기 ${p.nst.g}골</span>` : '';
  return `<div class="prof">${head}<div><div class="ttl">${esc(p.name)}</div><div class="dim">${Core.POS_KO[p.sub]} · ${p.age}세 · ${Core.NATK(p.nat)} · ${c?esc(c.name):'무소속'}</div><div class="row g8" style="flex-wrap:wrap"><span class="tag">종합 ${p.ovr}</span>${p.me?`<span class="tag">잠재 ${p.pot}</span>`:''}<span class="tag">계약 ${p.ct.until}</span>${nt}</div>${p.inj>0?`<div class="dim" style="color:#FFB27A">부상 ${p.inj}일</div>`:''}</div></div><div class="sec">시즌별 기록</div>${histTable(p)}${xferList(p)}<div class="sec">능력치</div>${attrBars(p)}`;
}
function meView() { const m = Core.me(); return `<div class="top"><div class="ttl">내 선수</div></div><div class="body">${profileHTML(m)}</div>`; }
function contractView() {
  const m = Core.me(), c = Core.clubOf(m.club), G = G0();
  const mt = G.news.filter(n=>n.type==='transfer').slice(0,12).map(n=>`<div class="news">${esc(n.text)}</div>`).join('');
  const msgs = G.inbox.slice(0,6).map(x=>`<div class="li"><span class="dim">${Core.fmtDate(x.d).slice(5,10)}</span> ${esc(x.text)}</div>`).join('') || '<div class="dim">받은 메시지가 없습니다.</div>';
  const ofs = m.offers.map(offerCard).join('');
  const pro = c.kind==='pro';
  return `<div class="top"><div class="ttl">계약·이적</div></div><div class="body"><div class="card"><div class="row"><b>${esc(c.name)}</b><span class="dim">${lgName(c.lg)}</span></div><div class="dim">${pro?`계약 ${m.ct.until}년까지 · 주급 ${m.ct.wage}만 원`:`${Core.stageOf(c)} 과정 · 18세 졸업 시즌에 프로·대학 제안이 옵니다`}</div></div>${ofs}<div class="sec">받은 메시지</div><div class="card">${msgs}</div><div class="sec">이적 시장 소식</div>${mt||'<div class="dim">아직 소식이 없습니다.</div>'}<div class="sec">시장 정보</div><div class="dim">이적 가능 기간: 1~2월 중순, 7~9월 초. 오퍼는 활약과 인지도에 따라 들어옵니다.</div><div class="sec">게임</div><button class="btn sec wide" data-act="reset">${S.resetArm?'정말 지우고 새 게임 시작 (다시 누르면 삭제)':'새 게임 시작'}</button></div>`;
}
function clubModal(id) {
  const c = Core.clubOf(id), G = G0(), lg = Core.leagueOf(c.lg);
  const pl = c.pl.map(x=>G.players[x]).filter(Boolean).sort((a,b)=>POS_ORDER.indexOf(a.sub)-POS_ORDER.indexOf(b.sub)||b.ovr-a.ovr);
  return `<div class="ttl"><i class="dot" style="background:${c.col}"></i>${esc(c.name)}</div><div class="dim">${lg?lg.name:'대표팀'} · ${Core.stageOf(c)} · 전력 ${Math.round(c.strength)} · 선수 ${pl.length}명</div><table class="tb"><tr><th>포지션</th><th>선수</th><th>국적</th><th>나이</th><th>종합</th><th>출전</th><th>골</th></tr>${pl.map(p=>`<tr><td>${p.sub}</td><td>${pLink(p)}</td><td>${Core.NATK(p.nat)}</td><td>${p.age}</td><td>${p.ovr}</td><td>${p.st.a}</td><td>${p.st.g}</td></tr>`).join('')}</table>`;
}
// ---------- 시작 화면 ----------
function setupView() {
  const n = S.sel.length, est = S.sel.reduce((s,c)=>s+(c==='KOR'?1560:c==='USA'?1250:1380),0) + (S.sel.some(c=>CO[c].cont==='AS')||S.sel.some(c=>CO[c].cont==='EU')?300:0);
  const cards = Core.CODES.map(c => { const C = CO[c], on = S.sel.includes(c); return `<button class="opt ${on?'on':''}" data-act="sel" data-id="${c}"><b>${on?'✓ ':''}${C.name}</b><span class="dim">${C.l1.name}${C.l2?' · '+C.l2.name:''}</span></button>`; }).join('');
  return `<div class="top"><div class="ttl">월드 설정</div><div class="dim">${n}/5개국</div></div><div class="body"><div class="dim">진행할 나라를 최대 5개까지 고르세요. 고른 나라의 1부·2부·유스 리그, 컵대회, 승강제가 전부 정밀 시뮬레이션되고, 선택하지 않은 나라는 만들어지지 않습니다.</div><div class="opts">${cards}</div><div class="card"><div class="dim">예상 선수 수 약 ${est.toLocaleString()}명 · 대륙대회(유럽·아시아)는 선택한 나라 팀과 외부 초청팀이 함께 참가합니다. 월드 생성에 몇 초가 걸립니다.</div></div><button class="btn wide" data-act="world" ${n<1?'disabled':''}>이 월드로 시작하기</button></div>`;
}
function creatorClubs() {
  const G = G0(), c = S.cr; const C = CO[c.cc];
  if (c.stage==='youth') return G.clubs.filter(x=>x.kind==='youth' && x.cc===c.cc).sort((a,b)=>b.strength-a.strength);
  const tier = C.l2 ? 2 : 1; return G.clubs.filter(x=>x.kind==='pro' && x.cc===c.cc && x.tier===tier).sort((a,b)=>b.strength-a.strength);
}
function fixCreator() { const c = S.cr; if (!S.sel.includes(c.cc)) c.cc = S.sel[0]; const l = creatorClubs(); if (!l.some(x=>x.id===c.club)) c.club = l.length ? l[Math.floor(l.length/2)].id : null; }
function creatorView() {
  fixCreator(); const c = S.cr, G = G0(); const clubs = creatorClubs();
  const ch = (key,arr,map) => `<div class="chips w">${arr.map(v=>`<button class="chip ${c[key]===v?'on':''}" data-act="cr" data-k="${key}" data-id="${v}">${map?map[v]:v}</button>`).join('')}</div>`;
  const sw = (key,map) => `<div class="chips">${Object.keys(map).map(v=>`<button class="sw ${c[key]===v?'on':''}" data-act="cr" data-k="${key}" data-id="${v}" style="background:#${map[v]}" aria-label="${v}"></button>`).join('')}</div>`;
  const age = c.stage==='youth' ? 15 : 19;
  const natOpts = ['KOR'].concat(Core.NAT_CODES.filter(x=>x!=='KOR')).map(n=>`<option value="${n}" ${c.nat===n?'selected':''}>${Core.NATK(n)}</option>`).join('');
  return `<div class="top"><div class="ttl">캐릭터 만들기</div><div class="dim">${Core.fmtDate(G.day)} 시작</div></div><div class="body"><div class="card row g8"><span class="spr" style="width:96px;height:204px;background-image:url(${sprite({skin:c.skin,hair:c.hair,style:c.style},['#1E8F4E','#F3F3F3'])})"></span><div class="grow"><div class="dim">이름</div><input id="nm" value="${esc(c.name)}" maxlength="8"><div class="dim" style="margin-top:8px">${age}세 · ${c.stage==='youth'?'유스·학생 단계에서 시작':'프로 신인'}</div></div></div>
  <div class="sec">국적 <span class="dim">대표팀 선발에 영향</span></div><select id="natsel">${natOpts}</select>
  <div class="sec">피부색</div>${sw('skin',SKIN_C)}<div class="sec">머리 모양</div>${ch('style',Object.keys(STYLE_N),STYLE_N)}<div class="sec">머리 색</div>${sw('hair',HAIR_C)}<div class="sec">포지션</div>${ch('pos',['ST','W','AM','CM','DM','FB','CB','GK'],Core.POS_KO)}
  <div class="sec">시작 단계</div>${ch('stage',['youth','pro'],{youth:'유스·학교 (15세)',pro:'프로 신인 (19세)'})}
  <div class="sec">리그 국가</div><div class="chips w">${S.sel.map(x=>`<button class="chip ${c.cc===x?'on':''}" data-act="cr" data-k="cc" data-id="${x}">${CO[x].name}</button>`).join('')}</div>
  <div class="sec">입단 팀</div><select id="clubsel">${clubs.map(x=>`<option value="${x.id}" ${c.club===x.id?'selected':''}>${esc(x.name)} (${lgName(x.lg)} · 전력 ${Math.round(x.strength)})</option>`).join('')}</select>
  <button class="btn wide" data-act="start">이 선수로 시작하기</button></div>`;
}
// ---------- 경기 ----------
let MV = null;
function startMatch() {
  const M = Core.prepareMine(); MV = { min: 0, timer: null, paused: false, log: [], over: false, momentOpen: null, speed: 90 };
  S.matchOpen = true; if (M.role==='bench' || M.role==='inj') MV.speed = 25; renderMatch(); MV.timer = setInterval(tick, MV.speed);
}
function scoreAt(min) {
  const M = G0().mm; const mine = M.evMine.filter(e => e.min <= min).length, opp = M.evOpp.filter(e => e.min <= min).length;
  return M.mineHome ? [mine, opp] : [opp, mine];
}
function tick() {
  const M = G0().mm; if (!M || MV.paused) return;
  MV.min++;
  const m = Core.me();
  for (const e of M.evMine.concat(M.evOpp)) if (e.min === MV.min && !e.shown) { e.shown = true; const mineSide = M.evMine.includes(e); MV.log.unshift(`${e.min}' ⚽ ${mineSide?M.mine.name:M.opp.name} 득점 — ${e.sc.name}${e.as?` (도움 ${e.as.name})`:''}`); }
  if (M.role==='sub' && MV.min===M.from) MV.log.unshift(`${MV.min}' 교체 투입 — ${m.name}`);
  const mo = M.moments[M.mi];
  if (mo && !mo.done && mo.min === MV.min) { MV.paused = true; MV.momentOpen = mo; }
  if (MV.min >= 90) { clearInterval(MV.timer); MV.over = true; }
  renderMatch();
}
const MOM_TXT = { box:'박스 안에서 볼이 내 앞에 떨어집니다!', through:'동료의 스루패스가 수비 뒷공간으로 들어옵니다!', counter:'역습 상황, 앞에 수비수 한 명뿐입니다!', cross:'측면에서 크로스가 올라옵니다!' };
function renderMatch() {
  const G = G0(), M = G.mm; if (!M) return; const m = Core.me(); const [sh, sa] = scoreAt(MV.min);
  let dec = '';
  if (MV.momentOpen) { const mo = MV.momentOpen; const opts = Core.momentOptions(mo); dec = `<div class="card gl"><b>${MOM_TXT[mo.kind]}</b><div class="dim">${MV.min}분 · 어떻게 할까?</div><div class="opts3">${opts.map(o => `<button class="opt" data-act="mv" data-id="${o.id}"><b>${o.n}</b><span class="dim">성공 ${Math.round(o.shown*100)}%</span></button>`).join('')}</div></div>`; }
  else if (MV.over) { const st = M.role==='start'?'선발':M.role==='sub'?'교체':M.role==='inj'?'부상 결장':'벤치(결장)'; dec = `<div class="card"><b>경기 종료</b> <span class="dim">내 역할: ${st}${M.myGoals?` · ${M.myGoals}골`:''}${M.myAssists?` · ${M.myAssists}도움`:''}</span><button class="btn wide" data-act="mend">결과 확인</button></div>`; }
  const roleTxt = M.role==='start' ? '선발 출전' : M.role==='sub' ? `벤치 → ${M.from}분 투입 예정` : M.role==='inj' ? '부상으로 결장' : '벤치 (출전 명단 제외)';
  $('#match').innerHTML = `<div class="mh"><div class="dim">${esc(M.title)} · ${Core.fmtDate(G.day)}</div><div class="sc"><div>${esc(M.h.name)}</div><b>${sh} : ${sa}</b><div>${esc(M.a.name)}</div></div><div class="dim">${MV.min}' · ${roleTxt}</div><div class="bar"><i style="width:${MV.min/90*100}%"></i></div></div>
  <div class="mb">${dec}<div class="sec">경기 흐름</div>${MV.log.map(x=>`<div class="li">${esc(x)}</div>`).join('') || '<div class="dim">킥오프!</div>'}</div>
  <div class="mf">${MV.over||MV.momentOpen ? '' : '<button class="btn sec" data-act="mskip">끝까지 자동 진행</button>'}</div>`;
  $('#match').style.display = 'flex';
}
function endMatchUI() {
  const r = Core.finishMine(); $('#match').style.display = 'none'; S.matchOpen = false; MV = null; save();
  const rt = r.rating ? ` · 평점 ${f1(r.rating)}` : ''; toast(`종료 ${r.res.gh}-${r.res.ga}${rt}`); render();
}
// ---------- 렌더 ----------
const NAV = [['home','홈'],['news','뉴스'],['league','순위·대회'],['me','내 선수'],['ctr','계약']];
function render() {
  const app = $('#app');
  if (S.step==='setup') { app.innerHTML = `<div class="scr">${setupView()}</div>`; return; }
  if (S.step==='create') { app.innerHTML = `<div class="scr">${creatorView()}</div>`; return; }
  let v = S.tab==='home' ? homeView() : S.tab==='news' ? newsView() : S.tab==='league' ? leagueView() : S.tab==='me' ? meView() : contractView();
  app.innerHTML = `<div class="scr">${v}</div><div class="act"><button class="btn big" data-act="day">다음 날 ▶</button><button class="btn sec" data-act="week">7일</button><button class="btn sec" data-act="match">경기까지</button></div><nav>${NAV.map(([id,n])=>`<button class="nv ${S.tab===id?'on':''}" data-act="tab" data-id="${id}">${n}</button>`).join('')}</nav>`;
  if (S.modal) { $('#modal').innerHTML = `<div class="sheet"><button class="x" data-act="close">닫기</button>${S.modal}</div>`; $('#modal').style.display = 'block'; } else $('#modal').style.display = 'none';
}
function toast(t) { const el = $('#toast'); el.textContent = t; el.style.opacity = 1; setTimeout(() => el.style.opacity = 0, 2200); }
function advance(days) {
  let stopped = null;
  for (let i=0;i<days;i++) {
    const m0 = Core.me(), before = m0.offers.length, cu0 = !!m0.callup;
    const pm = Core.step();
    if (pm) { stopped = 'match'; break; }
    const m1 = Core.me();
    if (m1.offers.length > before) { stopped = 'offer'; break; }
    if (!cu0 && m1.callup && days>1) { stopped = 'call'; break; }
    if (m1.renewal && days>1) { stopped = 'ren'; break; }
  }
  save(); render();
  if (stopped==='match') { setTimeout(startMatch, 50); }
  else if (stopped==='offer') toast('제안이 도착했습니다');
  else if (stopped==='call') toast('대표팀에 소집되었습니다');
}
function makeWorld() {
  S.busy = true; $('#app').innerHTML = '<div class="load">월드를 만드는 중… (선수 수천 명을 만들고 5개월을 미리 진행합니다)</div>';
  setTimeout(() => { Core.newWorld(Date.now() % 1000000, S.sel.slice()); S.step = 'create'; S.busy = false; if (S.sel.includes('KOR')) { S.cr.cc = 'KOR'; S.cr.nat = 'KOR'; } else { S.cr.cc = S.sel[0]; S.cr.nat = S.sel[0]; } S.cr.club = null; render(); }, 60);
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]'); if (!t || S.busy) return; const a = t.dataset.act, id = t.dataset.id;
  if (a==='sel') { const i = S.sel.indexOf(id); if (i>=0) S.sel.splice(i,1); else if (S.sel.length<5) S.sel.push(id); else toast('최대 5개국입니다'); render(); return; }
  if (a==='world') { if (S.sel.length) makeWorld(); return; }
  if (a==='cr') { const nm = $('#nm'); if (nm) S.cr.name = nm.value; S.cr[t.dataset.k] = id; if (t.dataset.k==='cc' && !S.cr.natTouched) S.cr.nat = id; render(); return; }
  if (a==='start') { const nm = $('#nm'); const name = (nm && nm.value.trim()) || '김도윤'; fixCreator(); Core.createMe({ name, pos: S.cr.pos, club: S.cr.club, nat: S.cr.nat, age: S.cr.stage==='youth'?15:19, look: { skin:S.cr.skin, hair:S.cr.hair, style:S.cr.style } }); S.step = 'game'; S.lc = null; S.ld = null; save(); render(); return; }
  if (a==='tab') { S.tab = id; S.modal = null; }
  else if (a==='plan') Core.me().plan = id;
  else if (a==='nf') S.nf = id; else if (a==='lc') { S.lc = id; S.ld = null; } else if (a==='ld') S.ld = id; else if (a==='lt') S.lt = id; else if (a==='cv') S.cv = id;
  else if (a==='pl') S.modal = profileHTML(G0().players[id]);
  else if (a==='club') S.modal = clubModal(+id);
  else if (a==='close') S.modal = null;
  else if (a==='acc') { Core.acceptOffer(+id); save(); toast('계약이 완료되었습니다'); }
  else if (a==='dec') Core.declineOffer(+id);
  else if (a==='ren') { Core.acceptRenewal(); save(); }
  else if (a==='reset') { if (!S.resetArm) { S.resetArm = true; } else { S.resetArm = false; idbDel('save'); S.step = 'setup'; S.tab = 'home'; } }
  else if (a==='day') { advance(1); return; }
  else if (a==='week') { advance(7); return; }
  else if (a==='match') { advance(120); return; }
  else if (a==='mv') { const r = Core.resolveMoment(id); MV.log.unshift(`${MV.min}' ${r.text}`); MV.momentOpen = null; MV.paused = false; renderMatch(); return; }
  else if (a==='mskip') { clearInterval(MV.timer); const M = G0().mm; while (MV.min < 90) { MV.min++; const mo = M.moments[M.mi]; for (const ev of M.evMine.concat(M.evOpp)) if (ev.min===MV.min && !ev.shown) { ev.shown = true; MV.log.unshift(`${ev.min}' ⚽ ${M.evMine.includes(ev)?M.mine.name:M.opp.name} 득점 — ${ev.sc.name}`); } if (mo && !mo.done && mo.min===MV.min) { MV.paused = true; MV.momentOpen = mo; MV.timer = setInterval(tick, 40); renderMatch(); return; } } MV.over = true; renderMatch(); return; }
  else if (a==='mend') { endMatchUI(); return; }
  render();
});
document.addEventListener('input', (e) => { if (e.target.id==='nm') S.cr.name = e.target.value; });
document.addEventListener('change', (e) => {
  if (e.target.id==='clubsel') { S.cr.club = +e.target.value; }
  if (e.target.id==='natsel') { S.cr.nat = e.target.value; S.cr.natTouched = true; }
});
async function boot() {
  $('#app').innerHTML = '<div class="load">불러오는 중…</div>';
  const ok = await loadSave();
  if (ok) { S.step = 'game'; render(); if (G0().pendingMine) setTimeout(startMatch, 50); }
  else { S.step = 'setup'; render(); }
}
boot();
