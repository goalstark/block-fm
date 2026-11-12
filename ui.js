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
const LK_S = ['fair','tan','olive','brown','deep'], LK_H = ['black','dark','brown','blond','red','gray','navy'], LK_ST = ['short','sidepart','buzz','curly','long','mohawk'];
const lookOf = (p) => p.me && p.look ? p.look : { skin: LK_S[p.id % 5], hair: LK_H[p.id % 7], style: LK_ST[p.id % 6] };
function sprH(p, club, w, cls) { const c = club || (p.club !== null && p.club !== undefined ? Core.clubOf(p.club) : null); return `<span class="spr ${cls||''}" style="width:${w}px;height:${Math.round(w*34/16)}px;background-image:url(${sprite(lookOf(p), c ? [c.col, c.col2] : null)})"></span>`; }
function regionOf(c) { const G = G0(); if (c.region) return c.region; if (c.parent !== undefined && c.parent !== null && G.clubs[c.parent]) return regionOf(G.clubs[c.parent]); return String(c.name).replace(/ U18$/, '').split(' ')[0]; }
const mySprite = (w) => { const m = Core.me(); const c = Core.clubOf(m.club); return `<span class="spr" style="width:${w}px;height:${w*34/16}px;background-image:url(${sprite(m.look,[c.col,c.col2])})"></span>`; };
const S = { step:'boot', tab:'home', lc:null, ld:null, lt:'table', cv:null, modal:null, nf:'all', sel:['KOR','ENG','ESP','ITA','GER'], cr:{ h:178, prefs:[], trait:'grinder', name:'김도윤', skin:'tan', hair:'brown', style:'sidepart', pos:'ST', nat:'KOR', stage:'youth', cc:'KOR', club:null }, resetArm:false, busy:false, mt:'prof', ct:'offer' };
const G0 = () => Core.G;
const f1 = (x) => (Math.round(x*10)/10).toFixed(1);
const CO = Core.COUNTRIES;

const SV = (w, h, vb, body) => `<svg class="ic" width="${w}" height="${h}" viewBox="${vb}" aria-hidden="true">${body}</svg>`;
const IC = {
  ball: SV(16,16,'0 0 24 24','<circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#16221B" stroke-width="1.6"/><path d="M12 7.2l3.6 2.6-1.4 4.2H9.8L8.4 9.8z" fill="#16221B"/><path d="M12 7.2V2.5M15.6 9.8l4.4-1.4M14.2 14l2.7 3.6M9.8 14l-2.7 3.6M8.4 9.8L4 8.4" stroke="#16221B" stroke-width="1.4" fill="none"/>'),
  boot: SV(20,16,'0 0 28 24','<path d="M2 3h8l1.6 6.2 8.2 1.9c3.5.8 6 3 6.2 6V19H2z" fill="#F29B3C" stroke="#16221B" stroke-width="1.5" stroke-linejoin="round"/><path d="M2 19h24v2.4H2z" fill="#16221B"/><path d="M6 21.4v2.2M12 21.4v2.2M18 21.4v2.2M23 21.4v2.2" stroke="#16221B" stroke-width="2"/><path d="M10 11.5l2.2-1M12.8 13l2.2-1" stroke="#fff" stroke-width="1.2"/>'),
  yc: SV(12,16,'0 0 12 16','<rect x=".8" y=".8" width="10.4" height="14.4" rx="1.6" fill="#F7D117" stroke="#16221B" stroke-width="1.2"/>'),
  rc: SV(12,16,'0 0 12 16','<rect x=".8" y=".8" width="10.4" height="14.4" rx="1.6" fill="#E5322D" stroke="#16221B" stroke-width="1.2"/>'),
  glove: '🧤', post: '🥅', crown: '👑', star: '⭐', target: '🎯', swap: '🔁'
};
const NEWS_IC = { match: IC.ball, nat: '🛡️', cup: '🏆', league: '📊', season: '📅', transfer: '🔁', rumor: '👀', injury: '🩹', youth: '🌱', retire: '👋', me: '⭐', table: '📊', world: '🌍' };
const hs = (str) => { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; };
const ART = {
  match: ['이날 경기는 초반부터 양 팀이 팽팽하게 맞서며 긴장감 있게 전개됐다. 전반의 흐름을 가져간 쪽이 후반에도 압박의 강도를 유지하며 결과를 만들어 냈다.', '경기를 지켜본 현지 관계자들은 "세트피스 집중력과 마지막 10분의 체력 관리가 승부를 갈랐다"고 평가했다.', '패한 쪽 벤치는 경기 후 "찬스를 살리지 못한 것이 아쉽다. 다음 경기에서 바로 잡겠다"고 밝혔다.', '이 결과로 리그 순위 경쟁에도 작은 변화가 생겼다. 다음 라운드 결과에 따라 판도가 다시 흔들릴 수 있다.'],
  cup: ['토너먼트 특유의 한 경기 승부 속에서 두 팀은 연장 가능성까지 염두에 둔 신중한 운영을 보였다.', '우승팀 관계자는 "선수단 전원이 한 경기 한 경기에 집중한 결과"라며 팬들에게 감사를 전했다.', '이번 대회 성적은 다음 시즌 대륙 대회 출전권과 구단 재정에도 영향을 줄 전망이다.'],
  league: ['리그 사무국은 이번 결정이 시즌 운영 규정에 따라 확정됐다고 밝혔다.', '해당 구단들은 곧바로 다음 시즌 준비 체제에 들어간다. 코칭스태프 개편과 선수단 보강 소식이 이어질 것으로 보인다.', '팬 커뮤니티에서는 환영과 우려가 엇갈리는 반응이 나왔다.'],
  season: ['한 시즌 동안 이어진 긴 레이스가 마무리됐다. 우승 구단은 꾸준한 경기력으로 시즌 내내 상위권을 지켰다.', '개인 타이틀 경쟁도 끝까지 치열했다. 득점왕과 MVP 모두 마지막 라운드에서야 윤곽이 드러났다.', '각 구단은 이제 재계약과 이적 시장을 통해 다음 시즌 전력을 구상한다.'],
  transfer: ['이번 영입은 구단의 전력 보강 계획에 따른 것으로, 협상은 비교적 빠르게 마무리된 것으로 알려졌다.', '구단 관계자는 "포지션 경쟁을 자극하고 선수단 깊이를 더하는 영입"이라고 설명했다.', '선수는 곧 메디컬 테스트와 입단식을 거쳐 새 팀 훈련에 합류한다. 등번호와 데뷔 시점은 추후 공개될 예정이다.'],
  rumor: ['현지 매체들은 협상이 초기 단계라고 전했지만, 구단 간 접촉이 이미 있었다는 보도도 나왔다.', '다만 양 구단 모두 공식 입장은 내놓지 않았다. 이적 시장이 열리는 시점에 맞춰 상황이 급진전될 수 있다.', '이적설의 당사자는 "지금은 소속팀 경기에 집중하고 있다"고 말을 아꼈다.'],
  injury: ['구단 의료진은 정밀 검진 결과를 바탕으로 재활 일정을 확정했다고 밝혔다.', '감독은 "중요한 선수의 공백이지만 다른 선수들에게 기회가 될 것"이라며 대체 자원 가동을 예고했다.', '복귀 시점은 회복 속도에 따라 달라질 수 있으며, 무리한 조기 복귀는 없을 것이라고 구단은 덧붙였다.'],
  youth: ['유소년 지도자들은 "기본기와 경기 이해도가 또래보다 뛰어나다"고 평가했다.', '여러 스카우트가 이미 경기장을 찾아 선수의 움직임을 기록한 것으로 전해졌다.', '성장 속도에 따라 1군 합류 시점이 앞당겨질 수도 있다는 전망이 나온다.'],
  retire: ['선수는 기자회견에서 "축구와 함께한 시간은 가장 큰 행운이었다"며 동료와 팬들에게 감사를 전했다.', '구단은 은퇴 기념 행사를 준비 중이며, 지도자 과정 참여 가능성도 열려 있다고 밝혔다.'],
  nat: ['대표팀 소집 명단에는 새 얼굴과 베테랑이 고르게 포함됐다. 감독은 "조직력을 끌어올릴 시간이 충분하지 않다"며 빠른 적응을 주문했다.', '이번 A매치 기간은 다음 대회 예선을 앞두고 전력을 점검할 중요한 무대로 평가된다.', '선수들은 소속팀 일정과 병행하며 컨디션 관리에 신경 쓰고 있다.'],
  me: ['소식을 전해 들은 구단 관계자는 "성실하게 훈련에 임해 온 결과"라며 앞으로의 성장을 기대한다고 말했다.', '동료 선수들도 SNS를 통해 축하 메시지를 전했다. 팬들 사이에서는 다음 경기에서의 활약을 기대하는 목소리가 높다.', '코칭스태프는 현재의 흐름을 유지하되 체력 관리에도 신경 쓸 계획이다.'],
  table: ['선두권 팀들 사이의 간격은 아직 크지 않다. 남은 일정에서 상대 전적과 부상자 관리가 변수가 될 전망이다.', '득점 경쟁에서도 상위권 선수들이 근소한 차이로 이어지고 있어 타이틀 향방을 가늠하기 어렵다.'],
  world: ['새 시즌은 많은 이야기와 함께 시작된다. 신인과 베테랑, 새로운 도전자가 함께 그라운드에 선다.', '각 리그와 대회는 일정에 맞춰 차례로 개막하며, 이적 시장도 분주하게 움직이고 있다.']
};
function articleOf(n) {
  const pool = ART[n.type] || ART.me, h = hs(n.text);
  const picks = []; for (let i = 0; i < pool.length && picks.length < 3; i++) { const k = (h + i * 7) % pool.length; if (!picks.includes(pool[k])) picks.push(pool[k]); }
  for (const x of pool) if (picks.length < 3 && !picks.includes(x)) picks.push(x);
  const face = n.me ? `<div class="artface">${sprH(Core.me(), null, 36, 'idle')}</div>` : '';
  return `<div class="art">${face}<div class="dim">${Core.fmtDate(n.d)} · 블록 풋볼 뉴스</div><h3>${NEWS_IC[n.type] || ''} ${esc(n.text)}</h3><p class="lede">${esc(n.text)}${/[.!?)]$/.test(n.text) ? '' : '.'} 자세한 내용은 다음과 같다.</p>${picks.map(x => `<p>${esc(x)}</p>`).join('')}</div>`;
}
const crestCache = {};
function crest(c, w) {
  w = w || 16;
  const key = c.id + ':' + c.col + c.col2 + ':' + w;
  if (crestCache[key]) return crestCache[key];
  let h = 7; const s = c.name + c.id; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const shapeI = h % 3, patI = (h >> 3) % 6, symI = (h >> 6) % 3;
  const A = c.col, B = c.col2;
  const shapes = ['M2 2H22V16C22 22 17 26 12 28C7 26 2 22 2 16Z', 'M12 1A11 11 0 1 1 12 23A11 11 0 1 1 12 1Z', 'M3 2H21Q22 2 22 3V19Q22 22 19 23L12 27L5 23Q2 22 2 19V3Q2 2 3 2Z'];
  const sh = shapes[shapeI], vh = shapeI === 1 ? 24 : 28;
  const pats = ['', '<rect x="8" y="0" width="8" height="30" fill="' + B + '"/>', '<rect x="0" y="9" width="30" height="7" fill="' + B + '"/>', '<path d="M0 0H30V30Z" fill="' + B + '"/>', '<path d="M0 6L12 16L24 6V13L12 23L0 13Z" fill="' + B + '"/>', '<rect x="0" y="0" width="12" height="30" fill="' + B + '"/>'];
  const ink = patI === 0 ? B : '#FFFFFF';
  const ch = [...c.name.replace(/\s/g, '')][0] || '?';
  const sym = symI === 0 ? '<path d="M12 7L13.8 11.2L18.4 11.6L14.9 14.6L16 19L12 16.6L8 19L9.1 14.6L5.6 11.6L10.2 11.2Z" fill="' + ink + '" stroke="#000" stroke-opacity=".35" stroke-width=".6"/>' : symI === 1 ? '<circle cx="12" cy="13" r="4" fill="' + ink + '" stroke="#000" stroke-opacity=".35" stroke-width=".6"/>' : '<text x="12" y="17.5" text-anchor="middle" font-size="12" font-weight="700" font-family="sans-serif" fill="' + ink + '" stroke="#000" stroke-opacity=".4" stroke-width=".5">' + esc(ch) + '</text>';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 ' + vh + '"><defs><clipPath id="k"><path d="' + sh + '"/></clipPath></defs><g clip-path="url(#k)"><rect width="30" height="30" fill="' + A + '"/>' + pats[patI] + '</g><path d="' + sh + '" fill="none" stroke="#111" stroke-opacity=".7" stroke-width="1.4"/>' + sym + '</svg>';
  const url = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  return (crestCache[key] = `<img class="crest" src="${url}" width="${w}" height="${Math.round(w * vh / 24)}" alt="">`);
}
const clubLink = (id) => { const c = Core.clubOf(id); return c ? `${crest(c, 14)}<a data-act="club" data-id="${id}">${esc(c.name)}</a>` : '-'; };
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
  return `<div class="top"><div><div class="dim">${Core.fmtDate(G.day)}</div><div class="ttl">${esc(m.name)} <span class="dim">${Core.POS_KO[m.sub]} · ${m.age}세 · ${Core.NATK(m.nat)}</span></div></div><div class="row g8"><div class="pill" data-act="club" data-id="${m.club}">${crest(c,18)}${esc(c.name)} ›</div><button class="gear" data-act="settings" aria-label="설정">⚙</button></div></div>`;
}
function tile(k,v,s,c) { return `<div class="tile"><div class="dim">${k}</div><div class="big">${v}</div><div class="s" style="color:${c||'#9DB0A4'}">${s}</div></div>`; }
const won = (v) => { v = Math.round(v); const a = Math.abs(v); return (v<0?'-':'') + (a >= 10000 ? (a/10000).toFixed(a>=100000?0:1)+'억' : a.toLocaleString()+'만') + ' 원'; };
function offerModal(i) {
  const m = Core.me(), o = m.offers[i]; if (!o) return '';
  const c = Core.clubOf(o.club), lg = Core.leagueOf(c.lg), pt = Core.pitchOf(o), pro = c.kind==='pro';
  const rows = pro ? `<div class="li"><span class="dim">주급</span> <b>${won(o.wage)}</b> <span class="dim">(연봉 약 ${won(o.wage*52)} · 현재 주급 ${won(m.ct.wage)})</span></div><div class="li"><span class="dim">계약 기간</span> ${o.years}년</div>${o.bonus?`<div class="li"><span class="dim">계약 보너스</span> ${won(o.bonus)}</div>`:''}${o.fee?`<div class="li"><span class="dim">이적료</span> 약 ${o.fee}억 원</div>`:''}${o.clause?`<div class="li"><span class="dim">바이아웃</span> 약 ${o.clause}억 원</div>`:''}` : `<div class="li"><span class="dim">기간</span> ${o.years}년 과정</div>`;
  const sq = pro ? `<div class="li"><span class="dim">내 포지션 팀 내 순위</span> ${pt.rank}위 / ${pt.n}명 <span class="dim">(주전 ${pt.need}자리 · 주전 하한 ${pt.stOvr} · 최고 ${pt.best})</span></div><div class="li"><span class="dim">전술</span> ${pt.styleKo} · 예상 역할 <b>${pt.role.n}</b></div>` : '';
  const stage = o.kind ? `<div class="card"><div class="dim">진행 단계</div><div class="li">${o.kind==='pre'?'① 계약 만료 선수와 사전 협상 (소속팀 이적료 없음)':'① 구단 간 이적료 합의 완료'}</div><div class="li"><b>② 개인 협상 (지금)</b> ${o.negd?'· 이미 한 번 협상했습니다':''}</div><div class="li dim">③ ${o.kind==='pre'?Core.fmtDate(Math.max(Core.G.day+1, Core.dayOf(m.ct.until,1,1)))+' 계약 만료 후 자유계약으로 합류':(Core.inWindow(Core.dateOf(Core.G.day))?'이적 시장이 열려 있어 며칠 뒤 합류':'이적 시장이 열리는 '+Core.fmtDate(Core.nextWindowDay())+'에 합류')}</div><div class="dim">제안 유효 ${Core.fmtDate(o.until)}까지 · 소속팀이 보내주지 않을 수도 있습니다.</div></div>` : '';
  return `<div class="ttl">${crest(c,28)} ${esc(c.name)}</div><div class="dim">${lg?lg.name:''} · ${Core.stageOf(c)||''} · 전력 ${Math.round(c.strength)}</div><div class="card gl"><div class="row"><span class="tag">${esc(pt.tag)}</span><span class="dim">예상 출전 비중 ${pt.pt}%</span></div><div class="pbar"><i style="width:${pt.pt}%"></i></div><div class="dim" style="margin-top:6px">${pt.desc}</div></div><div class="card">${rows}${sq}</div>${stage}<div class="row g8" style="flex-wrap:wrap"><button class="btn" data-act="acc" data-id="${i}">${o.kind?'이 조건으로 개인 합의':'수락'}</button>${o.kind&&!o.negd?`<button class="btn sec" data-act="ngk" data-id="${i}">주급 인상 요구</button><button class="btn sec" data-act="ngp" data-id="${i}">출전 보장 요구</button>`:''}<button class="btn sec" data-act="dec" data-id="${i}">거절</button></div>`;
}
function offerCard(o, i) {
  const c = Core.clubOf(o.club), lg = Core.leagueOf(c.lg), tag = o.grad ? '입단 제안 (3월 1일까지)' : o.early ? '조기 프로 콜업' : o.kind==='pre' ? '자유계약 사전 협상 제안' : '영입 제안 · 구단 합의 완료';
  return `<div class="card gl"><div class="dim">${tag}</div><b>${esc(c.name)}</b> <span class="dim">${lg?lg.name:''} · ${Core.stageOf(c)||''}</span><div class="dim">${c.kind==='pro'?`주급 ${won(o.wage)} · ${o.years}년${o.fee?` · 이적료 약 ${o.fee}억 원`:''}`:`${o.years}년 과정 · 전력 ${Math.round(c.strength)}`}</div>${c.kind==='pro'?`<div class="dim">${esc(Core.pitchOf(o).tag)} 제안</div>`:''}<div class="row g8"><button class="btn" data-act="ofd" data-id="${i}">상세 보기</button><button class="btn sec" data-act="dec" data-id="${i}">거절</button></div></div>`;
}
function pendCard(m) {
  const pd = m.pending; if (!pd) return '';
  const c = Core.clubOf(pd.club);
  return `<div class="card gl"><b>${esc(c.name)} 이적 합의</b><div class="dim">${Core.fmtDate(pd.eff)} 합류 예정 · ${pd.kind==='pre'?'자유계약':'이적료 '+pd.fee+'억 원'} · 주급 ${won(pd.wage)} · ${pd.years}년${pd.promise?' · 출전 약속':''}</div><div class="dim">그때까지는 현재 팀 소속으로 뜁니다.</div><button class="btn sec" data-act="npd">합의 파기</button></div>`;
}
function trainCard(m) {
  Core.normPlan(m); const pl0 = Core.plansOf(m)[m.plan]; const pl = m.plan==='custom' ? { n:'개인 특훈', k:(m.cust&&m.cust.length?m.cust:[m.sub==='GK'?'REF':'FIN']) } : pl0; const fx = S.trfx; S.trfx = null;
  if (!pl || !pl.k.length) { const d = fx && fx.fat0 !== undefined ? Math.round(fx.fat0 - m.fat) : 0; return `<div class="card trn"><b>😴 휴식 중</b><div class="dim">피로 회복${d>0?` <span class="up">-${d}</span>`:''}</div><div class="pbar"><i data-to="${100-m.fat}" style="width:${fx?100-fx.fat0:100-m.fat}%"></i></div></div>`; }
  const bars = pl.k.map(k => { const cur = Math.min(1, (m.acc && m.acc[k]) || 0), prev = fx && fx.acc0 && fx.acc0[k] !== undefined ? fx.acc0[k] : cur, lv = fx && fx.a0 && m.a[k] > fx.a0[k]; const dlt = lv ? null : Math.round((cur - prev) * 100);
    return `<div class="trow ${lv?'lvup':''}"><span class="tn">${AT_KO[k]||k}</span><span class="tv">${m.a[k]}</span><div class="pbar"><i data-to="${Math.round(cur*100)}" style="width:${lv?100:Math.round(prev*100)}%"></i></div><span class="td">${lv?'<b class="up">▲ 상승!</b>':(dlt>0?`<span class="up">+${dlt}%</span>`:'')}</span></div>`; }).join('');
  return `<div class="card trn ${fx?'live':''}"><b>💪 ${pl.n} 진행</b> <span class="dim">${fx?'오늘 훈련 완료':'다음 날을 누르면 진행돼요'}</span>${bars}</div>`;
}
function animBars() { requestAnimationFrame(() => requestAnimationFrame(() => document.querySelectorAll('.pbar i[data-to]').forEach(e => { e.style.width = e.dataset.to + '%'; }))); }
function roleCard(m) {
  const c = Core.clubOf(m.club); if (c.kind==='nt') return '';
  const r = Core.roleOf(m), fit = Math.round(r.fit), lab = fit >= 2 ? '잘 맞음' : fit >= -3 ? '보통' : '부족', col = fit >= 2 ? '#C6F36B' : fit >= -3 ? '#9DB0A4' : '#FFB27A';
  return `<div class="card"><div class="row"><b>감독이 원하는 역할</b><span class="tag">${Core.STYLE_KO[r.style]||''}</span></div><div class="dim">${esc(c.name)}은(는) ${Core.STYLE_DESC[r.style]||''}</div><div class="row" style="margin-top:6px"><span><b>${r.n}</b> <span class="dim">(${r.k.map(k=>AT_KO[k]).join('·')})</span></span><span style="color:${col}">적합도 ${lab}</span></div><div class="dim">역할에 맞을수록 경기 후 신뢰가 더 오르고, 어긋나면 덜 오릅니다.</div><button class="btn sec wide" data-act="roletrain">역할 맞춤 특훈 시작</button></div>`;
}
function custPick(m) {
  const keys = m.sub==='GK' ? ['REF','HAN','KIC','AER','DEC'] : ['FIN','PAS','CRS','DRI','TEC','HEA','TAK','MAR','VIS','OTB','POS','DEC','COM','WOR','AGG','PAC','STA','STR','AGI','JUM'];
  const sel = m.cust || [];
  return `<div class="card"><div class="dim">집중할 능력치를 최대 2개 고르세요 (1개면 더 빠름)</div><div class="chips w">${keys.map(k=>`<button class="chip ${sel.includes(k)?'on':''}" data-act="cust" data-id="${k}">${AT_KO[k]} ${m.a[k]}</button>`).join('')}</div></div>`;
}
function mentorCard(m) {
  const t = Core.mentorOf(m), tr = Core.TRAITS[m.trait] || Core.TRAITS.grinder;
  const adv = (m.tutorLog||[]).map(x=>`<div class="li"><span class="dim">${Core.fmtDate(x.d).slice(5,10)}</span> ${esc(x.t)}</div>`).join('');
  return `<div class="card"><div class="row"><b>팀 내 멘토</b><span class="tag">${tr.n}</span></div>${t?`<div>${pLink(t)} <span class="dim">${Core.POS_KO[t.sub]} · ${t.age}세 · 종합 ${t.ovr}</span></div><div class="dim">같은 계열 선배의 조언으로 훈련 성장이 빨라집니다.</div>${adv}`:'<div class="dim">아직 멘토가 없습니다. 같은 포지션 계열의 3살 이상 선배가 있으면 자동으로 배정됩니다.</div>'}</div>`;
}
function finCard(m) {
  const f = Core.finOf(m), c = Core.clubOf(m.club), pro = c.kind==='pro';
  const spOn = f.sps.map(x=>`<div class="li"><b>${esc(x.b)}</b> <span class="dim">월 ${won(x.m)} · ${Core.fmtDate(x.until).slice(0,7)}까지</span></div>`).join('') || '<div class="dim">진행 중인 스폰서가 없습니다. 인지도가 오르면 제안이 옵니다.</div>';
  const spOf = f.spOff.map((o,i)=>`<div class="card gl"><b>${esc(o.b)}</b> <span class="dim">월 ${won(o.m)} · ${o.years}년</span><div class="row g8"><button class="btn" data-act="spa" data-id="${i}">수락</button><button class="btn sec" data-act="spd" data-id="${i}">거절</button></div></div>`).join('');
  const out = f.tax + f.cost + f.inv, inv = Core.INV.map((x,i)=>`<button class="opt ${(m.inv||0)===i?'on':''}" data-act="inv" data-id="${i}"><b>${x.n}</b><span class="dim">${x.c?'월 '+won(x.c)+' · 성장 +'+Math.round((x.g-1)*100)+'%':'비용 없음'}</span></button>`).join('');
  const led = f.log.slice(0,6).map(l=>`<tr><td>${l.y%100}.${String(l.m).padStart(2,'0')}</td><td>${l.wage}</td><td>${l.sp+l.bonus}</td><td>${l.tax+l.live+l.inv}</td><td><b style="color:${l.net>=0?'#C6F36B':'#FFB27A'}">${l.net}</b></td></tr>`).join('');
  return `<div class="sec">재정</div><div class="tiles">${tile('주급', pro?won(m.ct.wage):'—', pro?'연봉 약 '+won(m.ct.wage*52):'프로 계약 전')}${tile('잔고', won(f.bal), '누적 순이익')}${tile('누적 수입', won(f.earn+f.sp+f.bonus), '급여 '+won(f.earn))}${tile('누적 지출', won(out), '세금 '+won(f.tax))}</div><div class="card"><div class="dim">수입 내역 — 급여 ${won(f.earn)} · 스폰서 ${won(f.sp)} · 보너스(골·도움·MVP·계약) ${won(f.bonus)}</div><div class="dim">지출 내역 — 세금 ${won(f.tax)} · 생활·에이전트 ${won(f.cost)} · 자기 투자 ${won(f.inv)}</div></div><div class="sec">스폰서</div>${spOf}<div class="card">${spOn}</div><div class="sec">자기 투자 <span class="dim">매달 비용</span></div><div class="opts">${inv}</div>${led?`<div class="sec">월별 수지 <span class="dim">(만 원)</span></div><div class="card"><table class="tb"><tr><th>월</th><th>급여</th><th>스폰·보너스</th><th>지출</th><th>순이익</th></tr>${led}</table></div>`:''}`;
}
function potCard(m) {
  const l = (m.potLog||[]).slice().reverse().map(x=>`<div class="li"><span class="dim">${x[0]}</span> 잠재 ${x[1]} → <b style="color:${x[2]>x[1]?'#C6F36B':x[2]<x[1]?'#FFB27A':'#9DB0A4'}">${x[2]}</b></div>`).join('');
  return `<div class="sec">잠재력 <span class="dim">매년 재평가</span></div><div class="card"><div class="row"><b>현재 ${m.ovr} / 잠재 ${m.pot}</b></div><div class="dim">성장 속도·경기 평점·인지도·나이에 따라 매년 1월 조정됩니다. 29세 이후에는 현재 능력에 가까워져요.</div>${l}</div>`;
}
function achCard(m) {
  const got = Object.keys(m.ach||{}); const all = Object.keys(Core.ACH);
  return `<div class="sec">업적 <span class="dim">${got.length}/${all.length}</span></div><div class="card">${all.map(id=>`<div class="li" style="opacity:${m.ach&&m.ach[id]?1:0.4}">${m.ach&&m.ach[id]?'🏅':'🔒'} <b>${Core.ACH[id][0]}</b> <span class="dim">${Core.ACH[id][1]}</span></div>`).join('')}</div>`;
}
function homeView() {
  const G = G0(), m = Core.me(), c = Core.clubOf(m.club);
  const nf = nextFixture(m.club); let nx = '';
  if (nf) { const h = Core.clubOf(nf.h), a = Core.clubOf(nf.a); const d = nf.day - G.day; nx = `<div class="card"><div class="row"><span class="dim">다음 경기 · ${Core.fmtDate(nf.day)} ${d===0?'· 오늘':'· D-'+d}</span><span class="tag">${esc(nf.label)}</span></div><div class="vs"><div><i class="dot" style="background:${h.col}"></i>${esc(h.name)}</div><b>VS</b><div><i class="dot" style="background:${a.col}"></i>${esc(a.name)}</div></div><div class="dim">전력 ${Math.round(h.strength)} : ${Math.round(a.strength)}</div></div>`; }
  const plans = (Core.normPlan(m), Object.entries(Core.plansOf(m))).map(([id,p]) => `<button class="opt ${m.plan===id?'on':''}" data-act="plan" data-id="${id}"><b>${p.n}</b><span class="dim">${id==='custom'?(m.cust&&m.cust.length?m.cust.map(k=>AT_KO[k]).join('·'):'직접 선택'):(p.k.map(k=>AT_KO[k]).join('·')||'피로 회복')}</span></button>`).join('');
  const offers = m.offers.map(offerCard).join('');
  const ren = m.renewal ? `<div class="card gl"><b>${esc(c.name)} 재계약 제안</b><div class="dim">주급 ${won(m.renewal.wage)} · ${m.renewal.years}년</div><div class="row g8"><button class="btn" data-act="ren">수락</button></div></div>` : '';
  const logs = m.log.slice(0,5).map(l => `<div class="li"><span class="dim">${Core.fmtDate(l[0]).slice(5,10)}</span> ${esc(l[1])}</div>`).join('') || '<div class="dim">아직 기록이 없습니다.</div>';
  const inj = m.inj>0 ? `<div class="card warn">부상 중 · ${m.inj}일 남음</div>` : '';
  const cu = m.callup ? `<div class="card gl">${esc(m.callup.name)} 소집 중 — 대표팀 경기를 앞두고 있습니다.</div>` : '';
  const stage = Core.stageOf(c);
  const feel = m.inj>0 ? '😣 부상 중이에요' : m.fat>75 ? '😮‍💨 많이 지쳤어요' : m.mor>=75 ? '😄 컨디션 최고!' : m.mor<45 ? '😟 사기가 낮아요' : '🙂 준비됐어요';
  const hero = `<div class="card hero"><div class="herochar">${sprH(m, c, 46, m.plan==='rest'?'sleepy':m.inj>0?'':'train')}</div><div><div class="dim">${feel}</div><div><b>${esc(m.name)}</b> <span class="dim">종합 ${m.ovr} · ${m.plan==='rest'?'휴식 중':'훈련 중'}</span></div></div></div>`;
  const meet = m.meet ? `<div class="card gl"><div class="row"><b>감독 면담 요청</b><span class="tag">${esc(m.meet.coach)}</span></div><div class="dim">${esc(m.meet.title)} — 감독이 불렀습니다.</div><button class="btn wide" data-act="meet">면담하러 가기</button></div>` : '';
  return topbar() + `<div class="body">${hero}${meet}${inj}${cu}${pendCard(m)}${offers}${ren}${nx}
  <div class="tiles">${tile('종합',m.ovr,'잠재 '+m.pot)}${tile('피로',Math.round(m.fat),m.fat>70?'위험':'양호',m.fat>70?'#FFB27A':'#C6F36B')}${tile('사기',Math.round(m.mor),'')}${tile('신뢰',Math.round(m.trust),m.trust<45?'부족':'보통')}</div>
  <div class="dim">현재 단계: ${stage==='프로' ? '프로 · '+lgName(c.lg) : lgName(c.lg)}</div>
  <div class="sec">오늘 훈련 <span class="dim">매일 적용</span></div><div class="opts">${plans}</div>${m.plan==='custom'?custPick(m):''}${trainCard(m)}<div class="card lnk" data-act="gogrow"><b>역할·멘토·잠재력 보기</b><span class="dim">내 선수 › 성장 ›</span></div>
  <div class="sec">최근 기록</div><div class="card">${logs}</div></div>`;
}
const NCHIPS = [['all','전체'],['me','내 소식'],['transfer','이적'],['rumor','이적설'],['match','경기'],['cup','대회'],['nat','대표팀'],['youth','유망주'],['season','시즌']];
function newsView() {
  const G = G0();
  const list = G.news.filter(n => S.nf==='all' || (S.nf==='me' ? n.me : n.type===S.nf));
  let html = '', last = -1;
  for (const n of list.slice(0,70)) { if (n.d!==last) { html += `<div class="dh">${Core.fmtDate(n.d)}</div>`; last = n.d; } html += `<div class="news ${n.big?'big':''} ${n.me?'mine':''}" data-act="news" data-id="${G.news.indexOf(n)}"><span class="nic">${NEWS_IC[n.type]||''}</span><span>${esc(n.text)}</span><span class="chev">›</span></div>`; }
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
  return `<table class="tb"><tr><th>#</th><th>선수</th><th>팀</th><th>${{g:IC.ball+' 골',as:IC.boot+' 도움',rt:IC.star+' 평점'}[key]}</th></tr>${rows || '<tr><td colspan=4 class="dim">기록 없음</td></tr>'}</table>`;
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
  const ctop = G.sel.map(c=>`<button class="chip ${S.lc===c?'on':''}" data-act="lc" data-id="${c}">${Core.FLAG[c]||''} ${CO[c].name}</button>`).join('') + `<button class="chip ${S.lc==='_C'?'on':''}" data-act="lc" data-id="_C">대회</button><button class="chip ${S.lc==='_N'?'on':''}" data-act="lc" data-id="_N">대표팀</button>`;
  let inner = '', sub = '', head = '';
  if (S.lc==='_C') inner = compView();
  else if (S.lc==='_N') inner = natView();
  else {
    const TO = { 1:0, 2:1, U:2, Y:3 };
    const lgs = G.leagues.filter(l=>l.cc===S.lc).slice().sort((a,b) => (TO[a.tier] ?? 9) - (TO[b.tier] ?? 9));
    if (!lgs.length) S.lc = G.sel[0];
    if (!S.ld || !lgs.some(l=>l.id===S.ld)) S.ld = (lgs.find(l=>l.tier===1)||lgs[0]).id;
    const lg = Core.leagueOf(S.ld); const lts = [['table','순위'],['team','팀 기록'],['g',IC.ball+' 득점'],['as',IC.boot+' 도움'],['rt',IC.star+' 평점'],['hist','역대']];
    sub = `<div class="chips">${lgs.map(l=>`<button class="chip s ${S.ld===l.id?'on':''}" data-act="ld" data-id="${l.id}">${DIVN(l)}</button>`).join('')}</div><div class="chips">${lts.map(([i,n])=>`<button class="chip s ${S.lt===i?'on':''}" data-act="lt" data-id="${i}">${n}</button>`).join('')}</div>`;
    inner = S.lt==='table' ? tableView(lg) : S.lt==='team' ? teamView(lg) : S.lt==='hist' ? (lg.hist.length ? lg.hist.slice().reverse().map(h => `<div class="card"><b>${h.season}</b> 우승 ${clubLink(h.champ)}<div class="dim">${h.top?`득점왕 ${esc(h.top[0])} ${h.top[1]}골`:''}${h.mvp?` · ${IC.crown} MVP ${esc(h.mvp[0])}`:''}</div></div>`).join('') : '<div class="dim">아직 끝난 시즌이 없습니다.</div>') : listView(lg, S.lt);
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
  return `<table class="tb"><tr><th>시즌</th><th>팀</th><th>출전</th><th>${IC.ball}</th><th>${IC.boot}</th><th>${IC.star}</th><th>컵</th></tr>${cur}${rows.map(h=>`<tr><td>${h[0]}</td><td>${clubLink(h[1])}<div class="dim s9">${esc(lgName(h[2]))}</div></td><td>${h[3]}</td><td>${h[5]}</td><td>${h[6]}</td><td>${h[7]?f1(h[7]):'-'}</td><td>${cup(h[11]||0,h[12]||0)}</td></tr>`).join('')}<tr class="sum"><td colspan=2>통산${p.me?'':' (표시 구간)'}</td><td>${tot[0]}</td><td>${tot[1]}</td><td>${tot[2]}</td><td></td><td></td></tr></table>${(!p.me && p.hist.length>15)?'<div class="dim">최근 15시즌만 표시됩니다.</div>':''}<div class="dim">컵 = 컵·대륙대회 출전-골</div>`;
}
function xferList(p) { if (!p.xfers||!p.xfers.length) return ''; return `<div class="sec">이적 이력</div><div class="card">${p.xfers.slice().reverse().map(x=>`<div class="li"><span class="dim">${Core.fmtDate(x[0]).slice(0,10)}</span> ${x[1]!==null?esc(Core.clubOf(x[1]).name):'자유계약'} → ${esc(Core.clubOf(x[2]).name)} ${x[3]>0?`<span class="dim">(${x[3]}억)</span>`:''}</div>`).join('')}</div>`; }
function profileHTML(p) {
  const c = p.club!==null ? Core.clubOf(p.club) : null;
  const head = p.me ? mySprite(56) : `<span class="spr" style="width:56px;height:119px;background-image:url(${sprite({skin:['fair','tan','olive','brown','deep'][p.id%5],hair:['black','dark','brown','blond','red','gray','navy'][p.id%7],style:['short','sidepart','buzz','curly','long','mohawk'][p.id%6]},c?[c.col,c.col2]:null)})"></span>`;
  const nt = p.nst && p.nst.a>0 ? `<span class="tag">대표 ${p.nst.a}경기 ${p.nst.g}골</span>` : '';
  return `<div class="prof">${head}<div><div class="ttl">${esc(p.name)}</div><div class="dim">${Core.POS_KO[p.sub]} · ${p.age}세 · ${Core.NATK(p.nat)} · ${c?esc(c.name):'무소속'}</div><div class="row g8" style="flex-wrap:wrap"><span class="tag">종합 ${p.ovr}</span>${p.me?`<span class="tag">잠재 ${p.pot}</span>`:''}<span class="tag">계약 ${p.ct.until}</span>${nt}</div>${p.inj>0?`<div class="dim" style="color:#FFB27A">부상 ${p.inj}일</div>`:''}</div></div><div class="sec">시즌별 기록</div>${histTable(p)}${xferList(p)}<div class="sec">능력치</div>${attrBars(p)}`;
}
const ME_TABS = [['prof','프로필'],['grow','성장'],['fin','재정'],['ach','업적·면담']];
function subChips(cur, tabs, act) { return `<div class="chips">${tabs.map(([i,n])=>`<button class="chip ${cur===i?'on':''}" data-act="${act}" data-id="${i}">${n}</button>`).join('')}</div>`; }
function meView() {
  const m = Core.me(), tr = Core.TRAITS[m.trait] || Core.TRAITS.grinder; let body = '';
  const pf = (m.prefs||[]).map(x => (Core.PREFS[x]||{}).n).filter(Boolean);
  if (S.mt==='prof') body = `${profileHTML(m)}<div class="card"><div class="row"><b>신체·성향</b><span class="tag">${tr.n}</span></div><div class="dim">키 ${m.h||178}cm · 선호 플레이: ${pf.length?pf.join(', '):'없음'}</div><div class="dim">${tr.d}</div></div>`;
  else if (S.mt==='grow') body = `${roleCard(m)}${potCard(m)}${mentorCard(m)}`;
  else if (S.mt==='fin') body = finCard(m);
  else body = `${achCard(m)}${meetLogCard(m)}`;
  return `<div class="top"><div class="ttl">내 선수</div></div>${subChips(S.mt, ME_TABS, 'mt')}<div class="body">${body}</div>`;
}
function meetLogCard(m) {
  const l = (m.meetLog||[]).map(x=>`<div class="li"><span class="dim">${Core.fmtDate(x.d).slice(5,10)}</span> <b>${esc(x.title)}</b><div class="dim">나: ${esc(x.pick)}</div><div class="dim">감독: ${esc(x.resp)} (${x.fx})</div></div>`).join('') || '<div class="dim">아직 면담 기록이 없습니다.</div>';
  return `<div class="sec">감독 면담 기록</div><div class="card">${l}</div>`;
}
function meetModal() {
  const m = Core.me(), mt = m.meet; if (!mt) return '';
  const d = Core.MEET[mt.type];
  return `<div class="ttl">${esc(mt.title)}</div><div class="dim">${esc(Core.clubOf(m.club).name)} 감독 · ${esc(mt.coach)}</div><div class="card gl"><div>“${esc(mt.q)}”</div></div><div class="sec">어떻게 답할까?</div><div class="optsn">${d.opts.map((o,i)=>`<button class="opt" data-act="ma" data-id="${i}"><b>${esc(o.t)}</b></button>`).join('')}</div><div class="dim">감독의 성향에 따라 같은 답도 반응이 달라집니다.</div>`;
}
const CT_TABS = [['offer','제안·계약'],['market','이적시장'],['scout','스카우트 평가']];
function scoutView(m) {
  const sc = Core.scoutOf(m), stars = '★'.repeat(Math.floor(sc.stars)) + (sc.stars%1 ? '½' : '') + '☆'.repeat(5 - Math.ceil(sc.stars));
  const fk = (k) => `${AT_KO[k]||k} ${m.a[k]}`;
  const gc = { S:'#FFE45C', A:'#C6F36B', 'B+':'#8EDB8A', B:'#9DB0A4', C:'#FFB27A', D:'#FF8A7A' }[sc.grade];
  const ints = sc.interest.map(x => `<div class="li">${clubLink(x.id)} <span class="tag">${x.lv}</span> <span class="dim">${lgName(Core.clubOf(x.id).lg)}</span></div>`).join('') || '<div class="dim">아직 관심을 보이는 구단이 없습니다.</div>';
  return `<div class="card gl"><div class="row"><b>스카우트 종합 평가</b><span class="dim">정확도 ${sc.unc<=2?'높음':sc.unc<=4?'보통':'낮음'} (인지도 ${Math.round(sc.fame)})</span></div><div class="tiles t3"><div class="tile"><div class="dim">현재 능력</div><div class="big" style="color:${gc}">${sc.grade}</div><div class="s">종합 ${m.ovr}</div></div><div class="tile"><div class="dim">성장 잠재력</div><div class="big">${stars}</div><div class="s">추정 ${sc.lo}~${sc.hi}</div></div><div class="tile"><div class="dim">시장 가치</div><div class="big">${sc.value}억</div><div class="s">원</div></div></div></div>
  <div class="sec">강점 · 약점</div><div class="card"><div class="dim">강점</div><div class="chips w">${sc.strong.map(k=>`<span class="tag">${fk(k)}</span>`).join('')}</div><div class="dim">약점</div><div class="chips w">${sc.weak.map(k=>`<span class="tag warn">${fk(k)}</span>`).join('')}</div></div>
  <div class="sec">스카우트 코멘트</div><div class="card">${sc.tips.map(t=>`<div class="li">• ${esc(t)}</div>`).join('')}</div>
  <div class="sec">관심을 보이는 구단</div><div class="card">${ints}<div class="dim">실제 제안은 이적 시장 기간에 구단 합의 후 도착합니다.</div></div>`;
}
function marketView(m) {
  const G = G0(), mi = Core.marketInfo(), c = Core.clubOf(m.club);
  const mt = G.news.filter(n=>n.type==='transfer').slice(0,12).map(n=>`<div class="news">${esc(n.text)}</div>`).join('');
  const fa = mi.fa.map(p => `<div class="li">${pLink(p)} <span class="dim">${Core.POS_KO[p.sub]} · ${p.age}세</span> <span class="tag">종합 ${p.ovr}</span></div>`).join('') || '<div class="dim">자유계약 선수가 없습니다.</div>';
  const contract = c.kind==='pro' ? (m.ct.until <= Core.dateOf(G.day).y + (Core.dateOf(G.day).m>=7?1:0) ? '계약 만료 임박 — 사전 협상(자유계약) 제안이 올 수 있습니다.' : `계약 ${m.ct.until}년까지 — 이적하려면 구단 합의 후 이적 시장에 합류합니다.`) : '프로 계약 전입니다.';
  return `<div class="card ${mi.open?'gl':''}"><div class="row"><b>이적 시장</b><span class="tag ${mi.open?'on':''}">${mi.open?'열려 있음':'마감'}</span></div><div class="dim">${mi.open?'지금은 이적이 가능한 기간입니다.':`다음 이적 시장까지 ${mi.days}일 (${Core.fmtDate(mi.next).slice(0,10)})`}</div><div class="dim">이적 기간: 1월~2월 중순, 7월~9월 초</div><div class="dim">${contract}</div></div>
  <div class="sec">자유계약(FA) 선수 <span class="dim">상위 10명</span></div><div class="card">${fa}</div>
  <div class="sec">최근 이적 소식</div>${mt||'<div class="dim">아직 소식이 없습니다.</div>'}`;
}
function contractView() {
  const m = Core.me(), c = Core.clubOf(m.club), G = G0(); let body = '';
  const pro = c.kind==='pro';
  if (S.ct==='offer') {
    const msgs = G.inbox.slice(0,6).map(x=>`<div class="li"><span class="dim">${Core.fmtDate(x.d).slice(5,10)}</span> ${esc(x.text)}</div>`).join('') || '<div class="dim">받은 메시지가 없습니다.</div>';
    const ren = m.renewal ? `<div class="card gl"><b>${esc(c.name)} 재계약 제안</b><div class="dim">주급 ${won(m.renewal.wage)} · ${m.renewal.years}년</div><button class="btn" data-act="ren">수락</button></div>` : '';
    body = `<div class="card"><div class="row"><b>${crest(c,22)} ${esc(c.name)}</b><span class="dim">${lgName(c.lg)}</span></div><div class="dim">${pro?`계약 ${m.ct.until}년까지 · 주급 ${won(m.ct.wage)} (연봉 약 ${won(m.ct.wage*52)})`:`${Core.stageOf(c)} 과정 · 18세 졸업 시즌에 프로·대학 제안이 옵니다`}</div></div>${pendCard(m)}${ren}${m.offers.map(offerCard).join('') || '<div class="dim">받은 제안이 없습니다.</div>'}<div class="sec">받은 메시지</div><div class="card">${msgs}</div>`;
  } else if (S.ct==='market') body = marketView(m);
  else body = scoutView(m);
  return `<div class="top"><div class="ttl">이적</div></div>${subChips(S.ct, CT_TABS, 'ct')}<div class="body">${body}</div>`;
}
async function gzEnc(str) { const cs = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip')); const u = new Uint8Array(await new Response(cs).arrayBuffer()); let b = ''; for (let i = 0; i < u.length; i += 0x8000) b += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return 'BFM1:' + btoa(b); }
async function gzDec(code) { if (!code.startsWith('BFM1:')) throw new Error('bad'); const bin = atob(code.slice(5)), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text(); }
function settingsModal() {
  return `<div class="ttl">설정</div><div class="sec">저장·불러오기</div><div class="dim">자동 저장은 매 진행마다 이뤄집니다. 칸에 따로 저장해 두면 되돌릴 수 있어요.</div>${slotRows(true)}<div class="sec">백업 코드</div><div class="dim">앱을 지우고 다시 설치할 때를 대비해 코드를 복사해 두세요(메모 앱 등에 붙여넣기). 새로 설치한 뒤 아래 칸에 붙여넣고 복원하면 이어서 할 수 있습니다.</div><textarea id="bkbox" rows="3" style="width:100%;background:#101814;color:#EAF1EC;border:1px solid #2A3A30;border-radius:10px;padding:8px;font-size:11px" placeholder="백업 코드"></textarea><div class="row g8"><button class="btn sec" data-act="bkcopy" style="flex:1">백업 코드 복사</button><button class="btn sec" data-act="bkrestore" style="flex:1">코드로 복원</button></div><div class="sec">게임</div><button class="btn sec wide" data-act="reset">${S.resetArm?'정말 지우고 새 게임 시작 (다시 누르면 삭제)':'새 게임 시작'}</button>`;
}
function teamView(lg) {
  const G = G0(), me = Core.me();
  const rows = lg.clubs.map(id => { const c = Core.clubOf(id), t = lg.table[id], pl = c.pl.map(x => G.players[x]).filter(Boolean);
    const tg = pl.slice().sort((a,b) => b.st.g - a.st.g)[0], ta = pl.slice().sort((a,b) => b.st.as - a.st.as)[0];
    return { id, gf: t.gf, ga: t.ga, p: t.p, tg, ta }; }).sort((a,b) => b.gf - a.gf);
  return `<table class="tb"><tr><th>팀</th><th>${IC.ball}득점</th><th>실점</th><th>${IC.ball}팀내 1위</th><th>${IC.boot}팀내 1위</th></tr>${rows.map(r => `<tr class="${r.id===me.club?'hl':''}"><td>${clubLink(r.id)}</td><td><b>${r.gf}</b></td><td>${r.ga}</td><td>${r.tg && r.tg.st.g ? pLink(r.tg)+' '+r.tg.st.g : '-'}</td><td>${r.ta && r.ta.st.as ? pLink(r.ta)+' '+r.ta.st.as : '-'}</td></tr>`).join('')}</table>`;
}
function clubModal(id) {
  const c = Core.clubOf(id), G = G0(), lg = Core.leagueOf(c.lg), me = Core.me();
  const pl = c.pl.map(x=>G.players[x]).filter(Boolean).sort((a,b)=>POS_ORDER.indexOf(a.sub)-POS_ORDER.indexOf(b.sub)||b.ovr-a.ovr);
  let tm = '';
  if (lg && lg.table[id]) { const tb = Core.sortedTable(lg), t = lg.table[id]; tm = `<div class="tiles t5"><div class="tile"><div class="dim">순위</div><div class="big">${tb.indexOf(id)+1}</div></div><div class="tile"><div class="dim">승점</div><div class="big">${t.pts}</div></div><div class="tile"><div class="dim">승무패</div><div class="big s14">${t.w}-${t.d}-${t.l}</div></div><div class="tile"><div class="dim">${IC.ball} 득점</div><div class="big">${t.gf}</div></div><div class="tile"><div class="dim">실점</div><div class="big">${t.ga}</div></div></div>`; }
  const best = (k) => pl.slice().sort((a,b) => b.st[k] - a.st[k])[0];
  const bg = best('g'), ba = best('as'), br = pl.filter(p => p.st.a >= 3).sort((a,b) => b.st.rs/b.st.a - a.st.rs/a.st.a)[0];
  const lead = `<div class="chips w">${bg && bg.st.g ? `<span class="tag">${IC.ball} ${pLink(bg)} ${bg.st.g}</span>` : ''}${ba && ba.st.as ? `<span class="tag">${IC.boot} ${pLink(ba)} ${ba.st.as}</span>` : ''}${br ? `<span class="tag">${IC.star} ${pLink(br)} ${f1(br.st.rs/br.st.a)}</span>` : ''}</div>`;
  return `<div class="ttl">${crest(c,28)} ${esc(c.name)}${c.id===me.club?' <span class="tag">마이팀</span>':''}</div><div class="dim">${lg?lg.name:'대표팀'} · ${Core.stageOf(c)} · 전력 ${Math.round(c.strength)} · 선수 ${pl.length}명</div>${tm}${lead}<table class="tb"><tr><th>포지션</th><th>선수</th><th>나이</th><th>종합</th><th>출전</th><th>${IC.ball}</th><th>${IC.boot}</th><th>${IC.star}</th></tr>${pl.map(p=>`<tr class="${p.me?'hl':''}"><td>${p.sub}</td><td>${pLink(p)}</td><td>${p.age}</td><td>${p.ovr}</td><td>${p.st.a}</td><td>${p.st.g}</td><td>${p.st.as}</td><td>${p.st.a?f1(p.st.rs/p.st.a):'-'}</td></tr>`).join('')}</table>`;
}
function setupView() {
  const n = S.sel.length, est = S.sel.reduce((s,c)=>s+(c==='KOR'?1560:c==='USA'?1250:1380),0) + (S.sel.some(c=>CO[c].slots>0)?300:0);
  const cards = Core.CODES.map(c => { const C = CO[c], on = S.sel.includes(c); return `<button class="opt ${on?'on':''}" data-act="sel" data-id="${c}"><b>${on?'✓ ':''}${Core.FLAG[c]||''} ${C.name}</b><span class="dim">${C.l1.name}${C.l2?' · '+C.l2.name:''}</span></button>`; }).join('');
  return `<div class="top"><div class="ttl">월드 설정</div><div class="dim">${n}/5개국</div></div><div class="body"><div class="dim">진행할 나라를 최대 5개까지 고르세요. 고른 나라의 1부·2부·유스 리그, 컵대회, 승강제가 전부 정밀 시뮬레이션되고, 선택하지 않은 나라는 만들어지지 않습니다.</div><div class="opts">${cards}</div><div class="card"><div class="dim">예상 선수 수 약 ${est.toLocaleString()}명 · 대륙대회(유럽·아시아·남미·북중미)는 선택한 나라 팀과 외부 초청팀이 함께 참가합니다. 월드 생성에 몇 초가 걸립니다.</div></div><button class="btn wide" data-act="world" ${n<1?'disabled':''}>이 월드로 시작하기</button>${Object.keys(S.slots||{}).length?`<div class="sec">저장된 게임 불러오기</div>${slotRows(false)}`:''}</div>`;
}
function creatorClubs() {
  const G = G0(), c = S.cr; const C = CO[c.cc];
  if (c.stage==='youth') return G.clubs.filter(x=>x.kind==='youth' && x.cc===c.cc).sort((a,b)=>b.strength-a.strength);
  const tier = C.l2 ? 2 : 1; return G.clubs.filter(x=>x.kind==='pro' && x.cc===c.cc && x.tier===tier).sort((a,b)=>b.strength-a.strength);
}
function creatorRegions() { const m = {}; for (const x of creatorClubs()) { const r = regionOf(x); if (r) m[r] = (m[r]||0) + 1; } return Object.entries(m).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])); }
function rollHome() { const c = S.cr; if (!c.home) return; const l = creatorClubs().filter(x => regionOf(x) === c.home); if (l.length) c.club = l[Math.floor(Math.random()*l.length)].id; }
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
  <div class="sec">키 <span class="dim">${c.h}cm · 크면 헤딩·몸싸움↑ 작으면 스피드·민첩↑</span></div><input type="range" id="hrange" min="160" max="200" value="${c.h}" style="width:100%">
  <div class="sec">선호 플레이 <span class="dim">최대 3개 · ${(c.prefs||[]).length}/3</span></div><div class="chips w">${(Core.PREF_POS[c.pos]||[]).map(k=>`<button class="chip ${(c.prefs||[]).includes(k)?'on':''}" data-act="pref" data-id="${k}">${Core.PREFS[k].n}</button>`).join('')}</div><div class="dim">선호 플레이는 경기 중 해당 선택지의 성공률이 오르고 관련 능력치가 조금 높게 시작합니다.</div>
  <div class="sec">플레이 성향 <span class="dim">성장 방식에 영향</span></div><div class="opts">${Object.entries(Core.TRAITS).map(([id,t])=>`<button class="opt ${c.trait===id?'on':''}" data-act="cr" data-k="trait" data-id="${id}"><b>${t.n}</b><span class="dim">${t.d}</span></button>`).join('')}</div>
  <div class="sec">시작 단계</div>${ch('stage',['youth','pro'],{youth:'유스·학교 (15세)',pro:'프로 신인 (19세)'})}
  <div class="sec">리그 국가</div><div class="chips w">${S.sel.map(x=>`<button class="chip ${c.cc===x?'on':''}" data-act="cr" data-k="cc" data-id="${x}">${Core.FLAG[x]||''} ${CO[x].name}</button>`).join('')}</div>
  <div class="sec">고향 <span class="dim">고향 지역 팀에서 랜덤 시작</span></div><div class="row g8"><select id="homesel" style="flex:1"><option value="">전체 지역</option>${creatorRegions().map(([r,n])=>`<option value="${esc(r)}" ${c.home===r?'selected':''}>${esc(r)} (${n}팀)</option>`).join('')}</select><button class="btn sec" data-act="rehome">🎲 다시 뽑기</button></div>
  <div class="sec">입단 팀</div><select id="clubsel">${clubs.map(x=>`<option value="${x.id}" ${c.club===x.id?'selected':''}>${esc(x.name)} (${lgName(x.lg)} · 전력 ${Math.round(x.strength)})</option>`).join('')}</select>
  <button class="btn wide" data-act="start">이 선수로 시작하기</button></div>`;
}
// ---------- 경기 ----------
let MV = null;
const FORM = [[5,50],[22,12],[20,37],[20,63],[22,88],[44,12],[42,37],[42,63],[44,88],[66,36],[66,64]];
const c01 = (v, a, b) => Math.max(a, Math.min(b, v));
const sortSt = (l) => (l||[]).slice().sort((a,b) => POS_ORDER.indexOf(a.sub) - POS_ORDER.indexOf(b.sub));
// ---- 경기장 잔디/바닥: 홈 구장에 따라 색과 무늬가 다름 ----
const PITCHES = [
  { n: '천연잔디', base: '#2E8B4A', a: '#319550', b: '#2A8445', pat: 'v' },
  { n: '짙은 잔디', base: '#26763F', a: '#2A7F44', b: '#226B39', pat: 'v' },
  { n: '연두 잔디', base: '#4FA85A', a: '#55B060', b: '#469A50', pat: 'h' },
  { n: '건조한 잔디', base: '#7E9A44', a: '#869F4A', b: '#748E3C', pat: 'v' },
  { n: '인조잔디', base: '#2F9C7A', a: '#33A481', b: '#2B9172', pat: 'c' },
  { n: '흙 운동장', base: '#B08658', a: '#B58B5C', b: '#A77D50', pat: 'n' },
  { n: '야간 구장', base: '#1F6B3C', a: '#226F40', b: '#1B6036', pat: 'v' },
  { n: '푸른 인조잔디', base: '#2C7F8F', a: '#308896', b: '#287686', pat: 'h' }];
function pickPitch(M) { const h = M.h; let x = ((h.id | 0) * 2654435761) >>> 0, hs = (x >> 7) % 8; if (h.lg === 'KHS' || h.kind === 'youth') hs = [0, 3, 5, 4, 1, 3][(x >> 5) % 6]; return PITCHES[hs]; }
function pitchBg(pt) { const st = pt.pat, rect = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`; let o = '';
  if (st === 'v') for (let i = 0; i < 8; i++) o += rect(i * 12.5, 0, 12.5, 64, i % 2 ? pt.b : pt.a);
  else if (st === 'h') for (let i = 0; i < 8; i++) o += rect(0, i * 8, 100, 8, i % 2 ? pt.b : pt.a);
  else if (st === 'c') for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) o += rect(i * 12.5, j * 16, 12.5, 16, (i + j) % 2 ? pt.b : pt.a);
  else o = rect(0, 0, 100, 64, pt.a) + `<g fill="${pt.b}" fill-opacity=".5">${[[12, 10], [40, 50], [70, 20], [85, 48], [25, 36], [58, 8]].map(q => `<ellipse cx="${q[0]}" cy="${q[1]}" rx="7" ry="3"/>`).join('')}</g>`;
  return `<rect width="100" height="64" fill="${pt.base}"/>` + o; }
// ---- 유니폼: 홈/원정 색이 비슷하면 원정팀이 대체 유니폼을 입고, 골키퍼는 별도 색 ----
const rgbOf = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
function cdist(a, b) { const [r1, g1, b1] = rgbOf(a), [r2, g2, b2] = rgbOf(b), rm = (r1 + r2) / 2; return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2); }
function pickKits(M, pt) {
  const h = M.h, a = M.a, hk = [h.col, h.col2], T = 160; let ak = [a.col, a.col2], away = false;
  const okC = (c) => cdist(hk[0], c[0]) >= T && cdist(c[0], pt.base) > 90;
  if (cdist(hk[0], ak[0]) < T) { away = true;
    const cands = [[a.col2, a.col], ['#F2F2F2', a.col], ['#1A1A1A', a.col], ['#F2C230', '#1A1A1A'], ['#5BB2E6', '#1A1A1A'], ['#E8741A', '#1A1A1A'], ['#C8202F', '#F2F2F2']];
    ak = cands.find(okC) || cands.slice().sort((x, y) => cdist(hk[0], y[0]) - cdist(hk[0], x[0]))[0]; }
  const GKC = ['#F2C230', '#2BD9C5', '#C77DFF', '#FF8A3D', '#E94F9E', '#1A1A1A'];
  const gkPick = (avoid) => GKC.slice().sort((x, y) => Math.min(...avoid.map(c => cdist(y, c))) - Math.min(...avoid.map(c => cdist(x, c))))[0];
  const hg = gkPick([hk[0], ak[0], pt.base]), ag = gkPick([hk[0], ak[0], hg, pt.base]);
  const mh = M.mineHome; return { m: mh ? hk : ak, o: mh ? ak : hk, gk: { m: mh ? hg : ag, o: mh ? ag : hg }, away: away ? (mh ? 'o' : 'm') : null };
}
const kitClub = (club, kit) => ({ id: 'k' + club.id + kit[0], name: club.name, col: kit[0], col2: kit[1] });
function pitchHTML(M) {
  const dots = (st, col0, pre) => st.map((p,i) => { const col = p.sub === 'GK' ? MV.kit.gk[pre] : col0; const lk = lookOf(p), sk = '#' + SKIN_C[lk.skin], hr = '#' + HAIR_C[lk.hair], ol = pre==='o' ? '#fff' : '#000';
    const fig = `<rect x="-1.4" y="-1.4" width="2.8" height="2.9" fill="${col}" stroke="${ol}" stroke-width="0.28"/><rect x="-1.1" y="-4" width="2.2" height="2.3" fill="${sk}" stroke="${ol}" stroke-width="0.22"/><rect x="-1.1" y="-4" width="2.2" height="0.8" fill="${hr}"/><rect x="-1.2" y="1.5" width="1" height="1.5" fill="#232A26"/><rect x="0.2" y="1.5" width="1" height="1.5" fill="#232A26"/>`;
    return p.me ? `<g class="dot me" id="${pre}${i}" transform="translate(50 32)"><circle class="mering" cy="0" r="4.2" fill="none" stroke="#FFE45C" stroke-width="0.6"/><g transform="scale(1.45)">${fig}</g><path d="M0 -8.4 L-1.8 -10.8 L1.8 -10.8 Z" fill="#FFE45C"/><text y="-11.6" text-anchor="middle" font-size="3.4" font-weight="800" fill="#FFE45C" stroke="#000" stroke-width="0.5" paint-order="stroke">나</text></g>` : `<g class="dot" id="${pre}${i}" transform="translate(50 32)">${fig}</g>`; }).join('');
  return `<div class="pwrap"><svg id="pitch" viewBox="0 0 100 64" preserveAspectRatio="xMidYMid meet">${pitchBg(MV.pitch)}<g fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".4"><rect x="1" y="1" width="98" height="62"/><path d="M50 1V63"/><circle cx="50" cy="32" r="8"/><rect x="1" y="17" width="14" height="30"/><rect x="85" y="17" width="14" height="30"/><rect x="1" y="25" width="5" height="14"/><rect x="94" y="25" width="5" height="14"/></g>${dots(MV.ost, MV.kit.o[0], 'o')}${dots(MV.mst, MV.kit.m[0], 'm')}<g id="ball" transform="translate(50 32)"><circle r="1.25" fill="#fff" stroke="#000" stroke-width=".35"/></g></svg><div id="fx"></div></div>`;
}
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// ---- 연속 이동 엔진: 포메이션 기준점 + 공 영향 + 역할 + 스티어링(속도/가속), 매 프레임 갱신 ----
const ROLE_U = { GK: [2, 14], CB: [10, 60], FB: [10, 82], DM: [18, 70], CM: [20, 84], AM: [28, 90], W: [25, 96], ST: [38, 97] };
const SUBX = { ST: 9, W: 5, AM: 4, CM: 0, DM: -5, FB: -2, CB: -6, GK: 0 };
const FTS = { ST: [89, 7], W: [85, 0], AM: [77, 11], CM: [63, 0], FB: [70, 0], DM: [54, 0], CB: [44, 10] };   // 공격 3분의 1 지역에서의 팀 구조(자기 편 기준 좌표)
const PA = (p, k) => (p && p.a && p.a[k]) || 50;
const uOf = (x, d) => d > 0 ? x : 100 - x;
const dM_ = (M) => M.mineHome ? 1 : -1;
const tsOf = () => (MV && MV.fast) ? 3 : (S.spd || 1);
function initPos(M) {
  const dM = dM_(M); MV.pos = { m: [], o: [] }; MV.tgt = { m: [], o: [] }; MV.run = {};
  const f = (st, pre, d) => st.forEach((p, i) => { const b = FORM[Math.min(i, FORM.length - 1)]; MV.pos[pre][i] = { x: d > 0 ? b[0] : 100 - b[0], y: b[1] * 0.64, vx: 0, vy: 0 }; });
  f(MV.mst, 'm', dM); f(MV.ost, 'o', -dM);
  const k = Math.min(6, MV.mst.length - 1); MV.holder = null; MV.act = { k: 'pass', to: { s: 'm', i: k }, sp: 40 }; MV.poss = 'm'; MV.dec = 0.6;
}
function runOf(key, p, d, atk, sub) {
  let r = MV.run[key]; if (r && r.until > MV.t) return r;
  const amp = sub === 'CB' ? 3 : sub === 'FB' ? 5 : sub === 'DM' ? 5 : sub === 'CM' ? 7 : 9, fw = atk ? (PA(p, 'OTB') - 40) / 60 : -0.25;
  return MV.run[key] = { dx: d * amp * (Math.random() * 1.2 - 0.4 + fw * 0.8) * 0.7, dy: (Math.random() * 2 - 1) * amp * (0.5 + PA(p, 'WOR') / 140), until: MV.t + 1.6 + Math.random() * 2.6 };
}
function retarget(M) {
  const b = MV.ball, pos = MV.pos, act = MV.act, kick = MV.kick > 0, hold = MV.holder, D = { m: dM_(M), o: -dM_(M) }, SS = { m: MV.mst, o: MV.ost };
  const line = {};                                       // 오프사이드 라인: 상대 최종 수비수 위치
  for (const pre of ['m', 'o']) { const op = pre === 'm' ? 'o' : 'm'; let mx = 55; SS[op].forEach((p, i) => { const q = pos[op][i]; if (i === 0 || !q || MV.red[op + i]) return; mx = Math.max(mx, uOf(q.x, D[pre])); }); line[pre] = Math.max(mx, uOf(b.x, D[pre])); }
  const place = (pre) => {
    const st = SS[pre], d = D[pre], atk = MV.poss === pre, op = pre === 'm' ? 'o' : 'm', ball = uOf(b.x, d), fin = atk && ball > 64 && !kick;
    const hp = hold && hold.s === pre && pos[pre][hold.i] ? pos[pre][hold.i] : null;
    const near = st.map((p, i) => ({ i, d2: pos[pre][i] ? (pos[pre][i].x - b.x) ** 2 + (pos[pre][i].y - b.y) ** 2 : 1e9 })).filter(o => st[o.i].sub !== 'GK' && !MV.red[pre + o.i]).sort((a, c) => a.d2 - c.d2).map(o => o.i);
    const taken = new Set(), foes = SS[op].map((p, j) => ({ j, q: pos[op][j] })).filter(o => o.j !== 0 && o.q && !MV.red[op + o.j]);
    st.forEach((p, i) => { const f = FORM[Math.min(i, FORM.length - 1)];
      const A = (k) => PA(p, k), sub = p.sub || 'CM', gk = sub === 'GK', isH = hold && hold.s === pre && hold.i === i, wideY = (f[1] * 0.64 < 32) ? 1 : -1;
      let u = f[0] + (SUBX[sub] || 0), y = f[1] * 0.64, sprint = false, chase = null;
      if (sub === 'W' || sub === 'FB') y = wideY > 0 ? 8 + (sub === 'FB' ? 3 : 0) : 56 - (sub === 'FB' ? 3 : 0);
      if (!kick) {
        const lineK = gk ? 0.1 : 0.2 + (70 - A('POS')) / 260 + (sub === 'CB' ? -0.06 : sub === 'ST' ? 0.05 : 0);
        u += (ball - 50) * (0.18 + lineK); y += (b.y - y) * (gk ? 0.3 : 0.18);
        if (!gk) {
          const r = runOf(pre + i, p, d, atk, sub); u += r.dx * d; y += r.dy;
          if (atk) {
            if (sub === 'ST' || sub === 'W') u += 4 + (A('OTB') - 50) / 6 + (A('PAC') - 50) / 12; else if (sub === 'AM' || sub === 'CM') u += 2 + (A('OTB') - 50) / 14;
            if (sub === 'FB' && (A('PAC') + A('STA')) / 2 > 58) u += 8 + (A('PAC') - 55) / 8;
            const tm = (A('STR') + A('HEA')) / 2 - (A('PAC') + A('OTB')) / 2, b2b = (A('STA') + A('WOR')) / 2 - (A('PAS') + A('VIS')) / 2, cutIn = (A('FIN') + A('DRI')) / 2 - A('CRS');
            if (sub === 'ST') { if (tm > 8) u -= 6; else if (tm < -8) u += 3; y += (32 - y) * 0.1; }                 // 타깃맨은 내려와 연계, 침투형은 수비 라인에 붙음
            else if (sub === 'AM') { u -= 3; y += ((b.y > 32 ? 24 : 40) - y) * 0.2; }                               // 라인 사이 공간(하프스페이스)
            else if (sub === 'CM') { if (b2b > 8) u += 6; else if (b2b < -8) u -= 5; }                               // 박스 투 박스 vs 딥라잉 플레이메이커
            else if (sub === 'DM') u = Math.min(u, ball - 14);                                                    // 수비 앞 스크린 유지
            else if (sub === 'FB' && (A('PAC') + A('STA')) / 2 < 50) u -= 6;                                       // 체력/스피드 낮으면 오버래핑 안 함
            else if (sub === 'CB') u = Math.min(u, Math.max(ball - 24, 8));
            if (fin && FTS[sub] && !isH) { const t = FTS[sub]; const ty = t[1] === 0 ? (sub === 'W' ? (cutIn > 10 ? (wideY > 0 ? 17 : 47) : (wideY > 0 ? 9 : 55)) : sub === 'FB' ? (wideY > 0 ? 10 : 54) : f[1] * 0.64) : 32 + (i % 2 ? 1 : -1) * t[1]; u = u * 0.3 + t[0] * 0.7; y = y * 0.3 + ty * 0.7; }
            if (hp && !isH) { const hu = uOf(hp.x, d), dx = hu - u, dy = hp.y - y, dist = Math.hypot(dx, dy);
              if (dist > 9 && (sub === 'AM' || sub === 'CM' || sub === 'DM' || sub === 'W')) { const k = clampN((A('VIS') + A('PAS') - 80) / 260, 0.05, 0.4); u += dx * k; y += dy * k; } }
            if (isH && (!MV.paused || MV.pg)) { u += MV.pg ? 16 : 7; if (MV.pg) sprint = true; }                                                     // 공 가진 선수는 드리블로 전진
            if (!isH) u = Math.min(u, line[pre] + 0.5);                                                  // 오프사이드 라인 지킴
          } else {
            if (sub === 'ST' || sub === 'W') u -= (A('WOR') > 60 ? 8 : 2);
            if (sub === 'CB' || sub === 'DM') u += (A('POS') > 62 ? 3 : 0);
            else if (sub === 'CM') u += (ball - u) * 0.12;
            y += (b.y - y) * 0.12;
          }
          if (act && act.k === 'pass' && act.to.s === pre && act.to.i === i) { u += (ball - u) * 0.55; y += (b.y - y) * 0.55; sprint = true; }   // 패스 받으러 마중
        }
        const tired = clampN((60 - A('STA')) / 120 * (MV.min / 90), 0, 0.35); u = f[0] + (u - f[0]) * (1 - tired);
      } else sprint = true;
      let x = d > 0 ? u : 100 - u;
      if (!kick && !gk && !atk) {
        const ci = near.indexOf(i);
        if (ci === 0) { x = b.x; y = b.y; sprint = true; }                                                // 가장 가까운 선수는 공 압박
        else if (ci === 1) { const k = clampN(0.35 + (A('AGG') + A('WOR') - 80) / 220, 0.2, 0.8); x += (b.x - x) * k; y += (b.y - y) * k; }
        else { let best = null, bd = 24; foes.forEach(o => { if (taken.has(o.j)) return; const dd = Math.hypot(o.q.x - x, o.q.y - y); if (dd < bd) { bd = dd; best = o; } });          // 가까운 공격수 마크(골문 쪽에서)
          if (best) { taken.add(best.j); const mk = clampN(0.45 + (A('MAR') - 50) / 150, 0.3, 0.8); x += (best.q.x - d * 2.8 - x) * mk; y += (best.q.y + (32 - best.q.y) * 0.1 - y) * mk; } }
      }
      if (gk && act && act.k === 'shot' && act.s !== pre) { y = act.out === 'goal' ? act.ty + (act.ty > 32 ? -3 : 3) : act.ty; sprint = true; }   // 슛 막으러 몸을 던짐
      const rg = ROLE_U[sub] || [3, 97]; let uu = uOf(x, d); uu = c01(uu, rg[0], rg[1]); x = d > 0 ? uu : 100 - uu;
      MV.tgt[pre][i] = { x: c01(x, 2.5, 97.5), y: c01(y, 3, 61), sprint };
    });
  };
  place('m'); place('o');
}
function movePitch() { const M = G0().mm; if (!M || !MV || !MV.pos) return; retarget(M); if (!MV.raf) MV.raf = requestAnimationFrame(frame); }
function sideOf(s) { return s === 'm' ? MV.mst : MV.ost; }
function passTo(s, i, sp) { MV.act = { k: 'pass', to: { s, i }, sp }; MV.holder = null; }
function shoot(M, out) {
  const h = MV.holder, s = h.s, d = s === 'm' ? dM_(M) : -dM_(M), os = s === 'm' ? 'o' : 'm', cur = MV.pos[s][h.i], gx = d > 0 ? 99 : 1;
  let t = { x: gx, y: 32 }, to = null;
  if (out === 'goal') t = { x: gx, y: 32 + (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3) };
  else if (out === 'wide') t = { x: gx, y: 32 + (Math.random() < 0.5 ? -1 : 1) * (9 + Math.random() * 5) };
  else if (out === 'post') t = { x: gx, y: 32 + (Math.random() < 0.5 ? -1 : 1) * 4.2 };
  else if (out === 'save') t = { x: MV.pos[os][0].x, y: MV.pos[os][0].y };
  else { let bi = -1, bd = 1e9; MV.pos[os].forEach((q, i) => { if (i === 0 || !q || MV.red[os + i]) return; const dd = Math.hypot(q.x - cur.x, q.y - cur.y); if (dd < bd) { bd = dd; bi = i; } }); if (bi < 0) { out = 'wide'; t = { x: gx, y: 32 + 10 }; } else to = { s: os, i: bi }; }
  MV.act = { k: 'shot', tx: t.x, ty: t.y, sp: 78, out, s, to }; MV.holder = null;
}
function decide(M) {
  const h = MV.holder; if (!h) return;
  const s = h.s, d = s === 'm' ? dM_(M) : -dM_(M), st = sideOf(s), arr = MV.pos[s], cur = arr[h.i], who = st[h.i], os = s === 'm' ? 'o' : 'm', oarr = MV.pos[os]; if (!cur) return;
  const u = uOf(cur.x, d), gd = Math.hypot(100 - u, cur.y - 32), pg = MV.pg && MV.pg.s === s ? MV.pg : null;
  let nd = 1e9, ni = -1; oarr.forEach((q, i) => { if (i === 0 || !q || MV.red[os + i]) return; const dd = Math.hypot(q.x - cur.x, q.y - cur.y); if (dd < nd) { nd = dd; ni = i; } });
  const line = (() => { let mx = 55; oarr.forEach((q, i) => { if (i && q && !MV.red[os + i]) mx = Math.max(mx, uOf(q.x, d)); }); return mx; })();
  const mates = []; arr.forEach((q, i) => { if (!q || i === h.i || MV.red[s + i]) return; const pu = uOf(q.x, d); let od = 1e9; oarr.forEach((o, j) => { if (j && o && !MV.red[os + j]) od = Math.min(od, Math.hypot(o.x - q.x, o.y - q.y)); });
    mates.push({ i, q, pu, dist: Math.hypot(q.x - cur.x, q.y - cur.y), open: clampN(od / 10, 0.3, 1.6), sub: st[i].sub, who: st[i] }); });
  const pickBy = (arr2, wf) => { const c = arr2.map(m => ({ m, w: wf(m) })).filter(o => o.w > 0); if (!c.length) return null; let r = Math.random() * c.reduce((a, o) => a + o.w, 0); for (const o of c) { r -= o.w; if (r <= 0) return o.m; } return c[0].m; };
  // 득점 연출: 골이 예정된 팀은 득점자가 마무리하도록 공을 몰아 줌
  if (pg) {
    if (h.i === 0) { const t = pickBy(mates.filter(m => m.i), m => Math.exp(-m.dist / 25) * (m.pu > 40 ? 1.5 : 0.7)); if (t) passTo(s, t.i, 46); else MV.dec = 0.5; return; }
    const si = pg.si;
    if (si === h.i || (si < 0 && gd < 30) || MV.pg.t > 8) { if (gd < 32 || MV.pg.t > 8) { shoot(M, 'goal'); return; } MV.dec = 0.35; return; }
    const sc = si >= 0 ? mates.find(m => m.i === si) : null; if (sc && (u > 45 || pg.t > 2.5)) { passTo(s, si, 52); return; }
    const t = pickBy(mates.filter(m => m.i && m.pu > u - 6), m => Math.exp(-m.dist / 22) * (m.pu > u ? 2 : 0.6) * m.open); if (t) passTo(s, t.i, 44); else MV.dec = 0.4; return;
  }
  // 골키퍼: 잡은 뒤 배급 (짧게 풀어 나가거나 길게 전방으로)
  if (h.i === 0) { const long = Math.random() < 0.35 + (PA(who, 'KIC') - 50) / 250;
    const t = pickBy(mates.filter(m => m.i), m => long ? (m.sub === 'ST' || m.sub === 'W' || m.sub === 'AM' ? 1 + m.open : 0.2) : (m.sub === 'CB' || m.sub === 'FB' || m.sub === 'DM' ? Math.exp(-m.dist / 20) * m.open : 0.15));
    if (t) passTo(s, t.i, long ? 55 : 38); else MV.dec = 0.5; return; }
  const R = who.sub, pm = c01(0.5 + (M.mine.strength - M.opp.strength) / 160, 0.3, 0.7), press = nd < 6 ? 1 : nd < 12 ? 0.5 : 0.15, foe = ni >= 0 ? sideOf(os)[ni] : null;
  const lose = clampN(0.05 + press * 0.14 + (s === 'm' ? -(pm - 0.5) * 0.2 : (pm - 0.5) * 0.2) - (PA(who, 'DRI') - 50) / 700 + (PA(foe, 'TAK') - 50) / 500 + (PA(foe, 'AGG') - 50) / 900, 0.03, 0.42);
  const pass = (t, sp, lead) => { const err = clampN((55 - PA(who, 'PAS')) / 220 + press * 0.08 + (t.dist > 30 ? 0.05 : 0) + (lead ? 0.04 : 0), 0, 0.3);   // 패스 정확도: 능력치/압박/거리
    if (Math.random() < err && ni >= 0) { let bi = -1, bd = 1e9; oarr.forEach((q, i) => { if (i && q && !MV.red[os + i]) { const dd = Math.hypot(q.x - t.q.x, q.y - t.q.y); if (dd < bd) { bd = dd; bi = i; } } }); if (bi >= 0) { passTo(os, bi, sp); return; } }
    passTo(s, t.i, sp); if (lead) MV.act.lead = d * lead; };
  if (ni >= 0 && Math.random() < lose) { passTo(os, ni, 55); return; }                                          // 태클/인터셉트
  if (MV.finS !== s) { MV.finS = s; MV.fin = 0; } if (u < 60) MV.fin = 0;
  const wide = cur.y < 16 || cur.y > 48;
  const roleShot = R === 'ST' ? 0.15 : R === 'W' || R === 'AM' ? 0.05 : R === 'CB' || R === 'FB' || R === 'DM' ? -0.25 : 0, range = 24 + (PA(who, 'FIN') - 50) / 5 + (R === 'ST' ? 5 : 0) - (R === 'CB' || R === 'DM' ? 8 : 0);
  if (u > 62 && gd < range) {                                                                                    // 슈팅 / 크로스 / 컷백 (포지션·결정력에 따라 슈팅 거리와 빈도가 다름)
    const shotP = clampN(0.26 + (PA(who, 'FIN') - 50) / 150 + roleShot + (gd < 18 ? 0.25 : 0) - press * 0.08 + MV.fin * 0.22 - (wide ? 0.22 : 0), 0.04, 0.95);
    if (Math.random() < shotP) { const r = Math.random(), fin = (PA(who, 'FIN') - 50) / 400, out = r < 0.38 - fin ? 'save' : r < 0.62 - fin ? 'wide' : r < 0.85 ? 'block' : 'post'; shoot(M, out); MV.fin = 0; return; }
    MV.fin++;
    if (wide && Math.random() < 0.55 + (PA(who, 'CRS') - 50) / 200) { const t = pickBy(mates.filter(m => m.pu > 78), m => 1 + (PA(m.who, 'HEA') - 50) / 80 + m.open); if (t) { pass(t, 48 + (PA(who, 'CRS') - 50) / 8); return; } }
  }
  if (u < 30 && press > 0.5 && Math.random() < 0.35) { const t = pickBy(mates.filter(m => m.i), m => m.sub === 'ST' || m.sub === 'W' || m.sub === 'AM' ? 1 + m.open : 0.15); if (t) { pass(t, 54 + (R === 'CB' ? (PA(who, 'STR') - 50) / 10 : 0)); return; } }   // 위험 지역 걷어내기
  if ((R === 'CM' || R === 'AM' || R === 'DM') && PA(who, 'VIS') > 55 && Math.random() < (PA(who, 'VIS') - 40) / 140) {   // 시야 좋은 미드필더: 수비 뒷공간 스루패스
    const t = pickBy(mates.filter(m => m.i && m.pu > u + 8 && m.pu <= line + 4 && (m.sub === 'ST' || m.sub === 'W' || m.sub === 'AM')), m => m.open * (1 + (PA(m.who, 'OTB') - 50) / 60)); if (t) { pass(t, 46 + PA(who, 'PAS') / 10, 6); return; } }
  if (R === 'ST' && (PA(who, 'STR') + PA(who, 'HEA')) / 2 > PA(who, 'PAC') + 4 && gd > 16 && Math.random() < 0.35) {          // 타깃맨: 등지고 받아 내려주기
    const t = pickBy(mates.filter(m => m.i && m.pu < u && (m.sub === 'AM' || m.sub === 'CM' || m.sub === 'W')), m => m.open); if (t) { pass(t, 38); return; } }
  if (PA(who, 'VIS') > 58 && (R === 'CM' || R === 'DM' || R === 'CB') && Math.random() < 0.18) {                                // 사이드 체인지
    const t = pickBy(mates.filter(m => m.i && Math.abs(m.q.y - cur.y) > 26 && m.pu >= u - 4), m => m.open); if (t) { pass(t, 46); return; } }
  if (nd > 8 && u < 72 && Math.random() < 0.12 + (PA(who, 'DRI') - 50) / 300 + (R === 'W' ? 0.15 : R === 'AM' ? 0.08 : R === 'CB' || R === 'DM' ? -0.1 : 0)) { MV.dec = 0.5 + Math.random() * 0.5; return; }   // 드리블 전진
  const t = pickBy(mates, m => { if (m.i === 0 && (u > 25 || Math.random() < 0.85)) return 0; const fw = m.pu - u; return Math.exp(-m.dist / 22) * (fw > 4 ? 1.5 : fw < -8 ? 0.45 : 1) * (m.dist < 5 ? 0.1 : 1) * m.open * (m.pu > line + 1 ? 0.15 : 1) * (1 + (PA(who, 'VIS') - 50) / 150) * (fw > 4 && (m.sub === 'ST' || m.sub === 'W') ? 1 + (PA(m.who, 'OTB') - 50) / 100 : 1) * (R === 'CB' || R === 'FB' ? (m.sub === 'DM' || m.sub === 'CM' || m.sub === 'FB' || m.sub === 'CB' ? 1.3 : 0.8) : 1); });
  if (t) pass(t, 34 + PA(who, 'PAS') / 4); else MV.dec = 0.5;
}
function stepBall() { if (MV) MV.dec = Math.min(MV.dec == null ? 0.2 : MV.dec, 0.2); }
function goalFx(M) {
  const pg = MV.pg; if (!pg) return; MV.pg = null;
  pg.logs.slice().reverse().forEach(o => MV.log.unshift(o)); MV.goalRes = pg.ms ? 'o' : 'm';
  fxShow(pg.html, pg.ms ? 'goal' : 'goal opp', 1700, true); renderMatch();
}
function flushPg() { const pg = MV && MV.pg; if (!pg) return; MV.pg = null; pg.logs.slice().reverse().forEach(o => MV.log.unshift(o)); }
function frame(ts) {
  if (!MV) return; MV.raf = requestAnimationFrame(frame);
  const M = G0().mm; if (!M || !MV.pos) return;
  let dt = MV.last ? Math.min(0.05, (ts - MV.last) / 1000) : 0.016; MV.last = ts; dt *= tsOf();
  MV.t += dt; MV.rt -= dt; if (MV.kick > 0) MV.kick -= dt; if (MV.pg) MV.pg.t += dt; if (MV.rt <= 0) { retarget(M); MV.rt = 0.22; }
  const all = [];
  for (const pre of ['m', 'o']) sideOf(pre).forEach((p, i) => {
    const c = MV.pos[pre][i], g = MV.tgt[pre][i]; if (!c || !g) return;
    if (MV.red[pre + i]) { c.vx = c.vy = 0; return; }
    const dx = g.x - c.x, dy = g.y - c.y, dist = Math.hypot(dx, dy) || 1e-6, tired = clampN((60 - PA(p, 'STA')) / 200 * (MV.min / 90), 0, 0.2);
    const vmax = (8 + PA(p, 'PAC') / 9) * (g.sprint || dist > 12 ? 1 : 0.72) * (1 - tired) * (MV.kick > 0 ? 1.15 : 1), want = Math.min(vmax, dist * 3.2), acc = (30 + PA(p, 'AGI') / 2) * dt;
    c.vx += clampN(dx / dist * want - c.vx, -acc, acc); c.vy += clampN(dy / dist * want - c.vy, -acc, acc);
    c.x += c.vx * dt; c.y += c.vy * dt; all.push(c);
  });
  for (let a = 0; a < all.length; a++) for (let b2 = a + 1; b2 < all.length; b2++) {
    const p = all[a], q = all[b2], dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy; if (d2 < 5.5 && d2 > 1e-4) { const d = Math.sqrt(d2), push = (2.35 - d) * 0.5; p.x -= dx / d * push; p.y -= dy / d * push; q.x += dx / d * push; q.y += dy / d * push; } }
  const b = MV.ball, act = MV.act;
  if (MV.pg && !MV.act && MV.holder && MV.holder.s !== MV.pg.s) {                                // 득점 연출 중에는 득점 팀이 공을 가져옴
    const s = MV.pg.s, arr = MV.pos[s]; let bi = -1, bd = 1e9; arr.forEach((q, i) => { if (!q || i === 0 || MV.red[s + i]) return; const dd = Math.hypot(q.x - b.x, q.y - b.y); if (dd < bd) { bd = dd; bi = i; } }); if (bi >= 0) passTo(s, bi, 70); }
  if (MV.act) {
    const A2 = MV.act; let tx, ty;
    if (A2.k === 'pass') { const q = MV.pos[A2.to.s][A2.to.i]; if (!q) { MV.act = null; return; } tx = c01(q.x + (A2.lead || 0), 1.5, 98.5); ty = q.y; }
    else if (A2.k === 'shot' && (A2.out === 'save' || A2.out === 'block')) { const tt = A2.out === 'save' ? { s: A2.s === 'm' ? 'o' : 'm', i: 0 } : A2.to, q = tt && MV.pos[tt.s][tt.i]; tx = q ? q.x : A2.tx; ty = q ? q.y : A2.ty; }
    else { tx = A2.tx; ty = A2.ty; }
    const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy), step = A2.sp * dt;
    if (d <= step + 0.9) { b.x = tx; b.y = ty; MV.act = null;
      if (A2.k === 'pass') { if (MV.holder === null && MV.poss !== A2.to.s) MV.fin = 0; MV.holder = A2.to; MV.poss = A2.to.s; MV.dec = A2.to.i === 0 ? 1.1 + Math.random() * 0.5 : 0.45 + Math.random() * 0.7; retarget(M); }
      else if (A2.k === 'shot') { const os = A2.s === 'm' ? 'o' : 'm';
        if (A2.out === 'goal') goalFx(M);
        else if (A2.out === 'save') { MV.holder = { s: os, i: 0 }; MV.poss = os; MV.dec = 1.2 + Math.random() * 0.5; retarget(M); }
        else if (A2.out === 'block') { MV.holder = A2.to; MV.poss = os; MV.dec = 0.4; retarget(M); }
        else if (A2.out === 'post') { let bi = -1, bd = 1e9; MV.pos[os].forEach((q, i) => { if (i === 0 || !q || MV.red[os + i]) return; const dd = Math.hypot(q.x - b.x, q.y - b.y); if (dd < bd) { bd = dd; bi = i; } }); if (bi >= 0) passTo(os, bi, 40); }
        else { MV.rs = { t: 0.9, s: os, i: 0 }; MV.holder = null; MV.poss = os; } }            // 골킥 준비
    } else { b.x += dx / d * step; b.y += dy / d * step; }
  } else if (MV.rs) {
    MV.rs.t -= dt; if (MV.rs.t <= 0) { const q = MV.pos[MV.rs.s][MV.rs.i]; b.x = q.x; b.y = q.y; MV.holder = { s: MV.rs.s, i: MV.rs.i }; MV.poss = MV.rs.s; MV.dec = 1.0; MV.rs = null; retarget(M); }
  } else if (MV.holder && MV.pos[MV.holder.s][MV.holder.i]) {
    const hp = MV.pos[MV.holder.s][MV.holder.i], dd = MV.holder.s === 'm' ? dM_(M) : -dM_(M), k = Math.min(1, dt * 16);
    b.x += (c01(hp.x + dd * 1.7, 1.5, 98.5) - b.x) * k; b.y += (hp.y - b.y) * k;
    if ((!MV.paused || MV.pg) && !MV.over) { MV.dec -= dt; if (MV.dec <= 0) decide(M); }
  }
  if (MV.goalRes && !MV.paused && !MV.act) {
    const s = MV.goalRes, st = sideOf(s); MV.goalRes = null; b.x = 50; b.y = 32; MV.holder = { s, i: Math.min(6, st.length - 1) }; MV.poss = s; MV.dec = 1.2; MV.kick = 2.2; MV.fin = 0; retarget(M); }
  const els = MV.els || (MV.els = { m: MV.mst.map((_, i) => document.getElementById('m' + i)), o: MV.ost.map((_, i) => document.getElementById('o' + i)) });
  for (const pre of ['m', 'o']) els[pre].forEach((el, i) => { const c = MV.pos[pre][i]; if (!el || !c) return; const sp = Math.hypot(c.vx, c.vy), bob = Math.abs(Math.sin(MV.t * 11 + i * 1.3)) * Math.min(0.6, sp / 25);
    el.setAttribute('transform', `translate(${c.x.toFixed(2)} ${(c.y - bob).toFixed(2)})`); if (MV.red[pre + i]) el.style.opacity = 0.12; });
  const be = document.getElementById('ball'); if (be) be.setAttribute('transform', `translate(${b.x.toFixed(2)} ${b.y.toFixed(2)})`);
}
function toMe(M) { const i = MV.mst.findIndex(p => p.me); if (i >= 0) { MV.holder = null; MV.act = { k: 'pass', to: { s: 'm', i }, sp: 70 }; MV.poss = 'm'; MV.dec = 1; } }
function fxShow(html, cls, ms, pause) {
  const el = $('#fx'); if (!el) return; el.innerHTML = `<div class="fxb ${cls}">${html}</div>`;
  if (pause) { MV.paused = true; }
  clearTimeout(MV.fxT); MV.fxT = setTimeout(() => { const e = $('#fx'); if (e) e.innerHTML = ''; if (pause && MV && !MV.momentOpen) MV.paused = false; }, ms);
}
function emitAt(M, min, anim) {
  const out = []; const dM = M.mineHome ? 1 : -1;
  for (const e of M.evMine.concat(M.evOpp)) if (e.min === min && !e.shown) {
    e.shown = true; const ms = M.evMine.includes(e), team = ms ? M.mine : M.opp;
    const lg = [{ min, ic: IC.ball, cls: 'g ' + (ms ? 'mine' : 'opp'), t: `<b>골! ${esc(e.sc.name)}</b> <span class="dim">${esc(team.name)}</span>` }];
    if (e.as) lg.push({ min, ic: IC.boot, cls: 'a ' + (ms ? 'mine' : 'opp'), t: `도움 ${esc(e.as.name)}` });
    if (anim && MV.pos && MV.pos.m.length) { const sd = ms ? 'm' : 'o', si = (ms ? MV.mst : MV.ost).indexOf(e.sc), html = `<div class="gchar">${sprH(e.sc, MV.kc[ms ? 'm' : 'o'], 40)}</div><div class="gb">${IC.ball.replace('width="16" height="16"','width="44" height="44"')}</div><div class="gt">GOAL!</div><div class="gs">${esc(e.sc.name)}${e.as ? `<br><span class="gsa">${IC.boot} ${esc(e.as.name)}</span>` : ''}</div>`;
      MV.pg = { s: sd, ms, si, html, logs: lg, t: 0 }; MV.paused = true; MV.dec = Math.min(MV.dec, 0.3); }
    else lg.forEach(o => out.push(o));
  }
  for (const x of M.evx || []) if (x.min === min && !x.shown) {
    x.shown = true; const team = x.ms ? M.mine : M.opp, nmx = esc(x.p.name);
    if (x.t === 'yc') { out.push({ min, ic: IC.yc, cls: 'c', t: `경고 ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) fxShow(`${IC.yc.replace('width="12" height="16"','width="30" height="40"')}<div class="gs">${nmx}</div>`, 'card', 1000, false); }
    else if (x.t === 'rc') { out.push({ min, ic: IC.rc, cls: 'c r', t: `<b>퇴장!</b> ${nmx} <span class="dim">${esc(team.name)}</span>` }); const idx = (x.ms ? MV.mst : MV.ost).indexOf(x.p); if (idx >= 0) MV.red[(x.ms ? 'm' : 'o') + idx] = true; if (anim) fxShow(`${IC.rc.replace('width="12" height="16"','width="30" height="40"')}<div class="gs">${nmx}</div>`, 'card red', 1300, false); }
    else if (x.t === 'sv') { out.push({ min, ic: IC.glove, cls: 's', t: `<b>슈퍼세이브!</b> ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) fxShow(`<div class="gb">🧤</div><div class="gs">슈퍼세이브</div>`, 'save', 1000, false); }
    else if (x.t === 'pt') { out.push({ min, ic: IC.post, cls: 'p', t: `${nmx}의 슛, 골대를 강타!` }); if (anim) fxShow(`<div class="gb">🥅</div><div class="gs">골대 강타!</div>`, 'save', 900, false); }
  }
  for (const o of out.reverse()) MV.log.unshift(o);
}
const SPD = [1, 1.5, 2], BASE_MS = 450;
function spdGet() { try { const v = +localStorage.getItem('bfm_spd'); if (SPD.includes(v)) return v; } catch (e) {} return 1; }
function spdMs() { return Math.round(BASE_MS / (S.spd || (S.spd = spdGet()))); }
function lockOrient(mode) { try { const P = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.ScreenOrientation;
  if (P && P.lock) P.lock({ orientation: mode }).catch(() => {});
  else if (screen.orientation && screen.orientation.lock) screen.orientation.lock(mode).catch(() => {}); } catch (e) {} }
function startMatch() {
  const M = Core.prepareMine();
  const PT = pickPitch(M);
  MV = { min: 0, timer: null, paused: false, log: [], over: false, momentOpen: null, speed: spdMs(), ball: { x: 50, y: 32 }, poss: 'm', holder: null, pos: { m: [], o: [] }, ballFree: false, red: {}, pitch: PT, kit: pickKits(M, PT), t: 0, rt: 0, kick: 0, act: null, dec: 1, els: null, raf: 0, last: 0, run: {}, tgt: { m: [], o: [] }, mst: sortSt(M.stMine), ost: sortSt(M.stOpp), fxT: null };
  MV.kc = { m: kitClub(M.mine, MV.kit.m), o: kitClub(M.opp, MV.kit.o) }; S.matchOpen = true; if (M.role==='bench' || M.role==='inj') { MV.speed = 60; MV.fast = true; }
  $('#match').innerHTML = `<div class="mh" id="mh"></div><div id="pitchbox">${pitchHTML(M)}</div><div class="mb" id="mb"></div><div class="mf" id="mf"></div>`;
  lockOrient('landscape'); $('#match').classList.add('on'); initPos(M); renderMatch(); movePitch(); MV.timer = setInterval(tick, MV.speed);
}
function scoreAt(min) {
  const M = G0().mm; const mine = M.evMine.filter(e => e.min <= min).length, opp = M.evOpp.filter(e => e.min <= min).length;
  return M.mineHome ? [mine, opp] : [opp, mine];
}
function finishLog(M) { const mv = Core.mvpOf(M); MV.log.unshift({ min: 90, ic: IC.crown, cls: 'mvp', t: mv ? `<b>MVP ${esc(mv.p.name)}</b>${mv.me ? ' <span class="tag">나!</span>' : ''} <span class="dim">${esc((mv.mine ? M.mine : M.opp).name)}</span>` : '경기 종료' }); }
function tick() {
  const M = G0().mm; if (!M || !MV || MV.paused || MV.over) return;
  MV.min++;
  const m = Core.me();
  emitAt(M, MV.min, true);
  if (M.role==='sub' && MV.min===M.from) MV.log.unshift({ min: MV.min, ic: IC.swap, cls: '', t: `교체 투입 — ${esc(m.name)}` })
  if (M.role==='sub' && MV.min===M.from && !MV.mst.some(p => p.me)) { let ix = MV.mst.findIndex(p => p.sub === m.sub && p.sub !== 'GK'); if (ix < 0) ix = MV.mst.findIndex(p => p.sub !== 'GK'); if (ix >= 0) { MV.mst[ix] = m; const pb = $('#pitchbox'); if (pb) { pb.innerHTML = pitchHTML(M); MV.els = null; } } }
  const mo = M.moments[M.mi];
  if (mo && !mo.done && mo.min === MV.min) { MV.paused = true; MV.momentOpen = mo; toMe(M); }
  if (MV.min >= 90 && !MV.pg) { MV.min = 90; clearInterval(MV.timer); MV.over = true; finishLog(M); }
  movePitch(); renderMatch();
}
function skipMatch() {
  clearInterval(MV.timer); const M = G0().mm; if (!M) return; MV.skipping = true; flushPg(); MV.paused = false;
  while (MV.min < 90) { MV.min++; emitAt(M, MV.min, false); const mo = M.moments[M.mi];
    if (M.role==='sub' && MV.min===M.from) MV.log.unshift({ min: MV.min, ic: IC.swap, cls: '', t: `교체 투입 — ${esc(Core.me().name)}` });
    if (mo && !mo.done && mo.min===MV.min) { MV.paused = true; MV.momentOpen = mo; MV.timer = setInterval(tick, 40); stepBall(M); toMe(M); movePitch(); renderMatch(); return; } }
  MV.over = true; finishLog(M); movePitch(); renderMatch();
}

const lvl3 = (p) => p >= 0.62 ? ['높음', 'hi'] : p >= 0.4 ? ['보통', 'mid'] : ['낮음', 'lo'];
function renderMatch() {
  const G = G0(), M = G.mm; if (!M || !MV || !$('#mh')) return; const [sh, sa] = scoreAt(MV.pg ? MV.min - 1 : MV.min);
  let dec = '';
  if (MV.momentOpen) { const mo = MV.momentOpen; const opts = Core.momentOptions(mo); dec = `<div class="card gl"><div class="row g8" style="align-items:flex-end"><span class="mebub">${sprH(Core.me(), MV.kc.m, 28, 'idle')}</span><b>${Core.momentText(mo.kind)}</b></div><div class="dim">${MV.min}분 · 어떻게 할까?</div><div class="${opts.length===3?'opts3':'optsn'}">${opts.map(o => { const lv = lvl3(o.shown); return `<button class="opt ${o.fav?'fav':''}" data-act="mv" data-id="${o.id}"><b>${o.fav?'★ ':''}${o.n}</b><span class="lv ${lv[1]}">${lv[0]}</span><span class="pbar sm"><i class="${lv[1]}" style="width:${Math.round(o.shown*100)}%"></i></span><span class="dim s11">성공 ${Math.round(o.shown*100)}%</span></button>`; }).join('')}</div></div>`; }
  else if (MV.over) { const st = M.role==='start'?'선발':M.role==='sub'?'교체':M.role==='inj'?'부상 결장':'벤치(결장)'; const mv = M.mvp; dec = `<div class="card"><div class="row g8" style="align-items:flex-end"><span class="mebub">${sprH(Core.me(), MV.kc.m, 32, mv&&mv.me?'jump':'idle')}${mv&&mv.me?'<i class="crown">'+IC.crown+'</i>':''}</span><div><b>경기 종료</b> <span class="dim">내 역할: ${st}</span></div></div><div class="row g8 wrapx">${M.myGoals?`<span class="tag">${IC.ball} ${M.myGoals}골</span>`:''}${M.myAssists?`<span class="tag">${IC.boot} ${M.myAssists}도움</span>`:''}${mv?`<span class="tag ${mv.me?'gold':''}">${IC.crown} MVP ${esc(mv.p.name)}</span>`:''}</div><button class="btn wide" data-act="mend">결과 확인</button></div>`; }
  const roleTxt = M.role==='start' ? '선발 출전' : M.role==='sub' ? `벤치 → ${M.from}분 투입 예정` : M.role==='inj' ? '부상으로 결장' : '벤치 (출전 명단 제외)';
  $('#mh').innerHTML = `<div class="dim">${esc(M.title)} · ${Core.fmtDate(G.day)}</div><div class="sc"><div>${crest(M.h,18)} ${esc(M.h.name)}</div><b>${sh} : ${sa}</b><div>${esc(M.a.name)} ${crest(M.a,18)}</div></div><div class="dim">${MV.min}' · ${roleTxt}</div><div class="bar"><i style="width:${MV.min/90*100}%"></i></div>`;
  $('#mb').innerHTML = `${dec}<div class="sec">경기 흐름</div>${MV.log.map(x => `<div class="li ev ${x.cls||''}"><span class="mn">${x.min}'</span><span class="ico">${x.ic}</span><span class="et">${x.t}</span></div>`).join('') || '<div class="dim">킥오프!</div>'}`;
  $('#mf').innerHTML = MV.over ? '' : `<div class="spd">${SPD.map(v => `<button class="chip ${(S.spd||1)===v?'on':''}" data-act="mspd" data-id="${v}">${v}배속</button>`).join('')}${MV.momentOpen ? '' : '<button class="btn sec" data-act="mskip">끝까지 자동 진행</button>'}</div>`;
}
function endMatchUI() {
  if (MV && MV.raf) cancelAnimationFrame(MV.raf);
  const r = Core.finishMine(); $('#match').classList.remove('on'); lockOrient('portrait'); S.matchOpen = false; MV = null; save();
  const rt = r.rating ? ` · 평점 ${f1(r.rating)}` : ''; toast(`종료 ${r.res.gh}-${r.res.ga}${rt}`); render();
}
// ---------- 렌더 ----------
const NAV = [['home','홈'],['me','내 선수'],['ctr','이적'],['league','순위·대회'],['news','뉴스']];
function navBadge(id) { try { const m = Core.me(); if (id==='home') return m.meet ? '●' : ''; if (id==='ctr') return (m.offers.length || m.pending || m.renewal) ? '●' : ''; } catch (e) {} return ''; }
function render() {
  const app = $('#app');
  if (S.step==='setup') { app.innerHTML = `<div class="scr">${setupView()}</div>`; return; }
  if (S.step==='create') { app.innerHTML = `<div class="scr">${creatorView()}</div>`; return; }
  const oldSc = document.querySelector('.scr'); const keyNow = S.step + '|' + S.tab; const keepTop = (oldSc && S._sk === keyNow) ? oldSc.scrollTop : 0;
  let v = S.tab==='home' ? homeView() : S.tab==='news' ? newsView() : S.tab==='league' ? leagueView() : S.tab==='me' ? meView() : contractView();
  app.innerHTML = `<div class="scr">${v}</div>${actBar()}<nav>${NAV.map(([id,n])=>`<button class="nv ${S.tab===id?'on':''}" data-act="tab" data-id="${id}">${n}${navBadge(id)?'<i class="bdg"></i>':''}</button>`).join('')}</nav>`;
  { const ns = document.querySelector('.scr'); if (ns && keepTop) ns.scrollTop = keepTop; S._sk = keyNow; }
  if (S.tab!=='home') S.trfx = null; else animBars();
  if (S.modalKind==='settings') S.modal = settingsModal();
  if (S.modal) { $('#modal').innerHTML = `<div class="sheet"><button class="x" data-act="close">닫기</button>${S.modal}</div>`; $('#modal').style.display = 'block'; } else $('#modal').style.display = 'none';
}
function toast(t) { const el = $('#toast'); el.textContent = t; el.style.opacity = 1; setTimeout(() => el.style.opacity = 0, 2200); }
function actBar() {
  let ev = null; try { ev = Core.nextEvent(); } catch (e) {} const mt = ev && ev.match, mv = ev && ev.move, m = Core.me();
  const dd = (n) => n <= 0 ? '오늘' : n === 1 ? '내일' : n + '일 뒤';
  const md = (day) => { const t = Core.dateOf(day); return `${t.m}/${t.d}`; };
  const info = m.meet ? '감독 면담 요청이 있습니다' : m.offers.length ? `이적 제안 ${m.offers.length}건 — 확인하세요` : mt ? `다음 경기 · ${dd(mt.days)} (${md(mt.day)}) ${mt.home ? 'vs' : '@'} ${esc(mt.opp)}` : mv ? `${esc(mv.club)} 합류 ${dd(mv.days)}` : '예정된 경기가 없습니다';
  const sub = mv && mt && mv.days < mt.days ? ` · ${esc(mv.club)} 합류 ${dd(mv.days)}` : '';
  const go = mt && mt.days === 1 && !m.meet && !m.offers.length ? '경기 시작 ⚽' : '계속 ▶';
  const open = S.skipOpen ? `<div class="skiprow"><button class="chip" data-act="skip" data-id="1">하루만</button><button class="chip" data-act="skip" data-id="7">일주일</button><button class="chip" data-act="skip" data-id="30">한 달</button></div>` : '';
  return `<div class="act"><div class="actinfo">${info}${sub}</div>${open}<div class="actrow"><button class="btn big" data-act="go">${go}</button><button class="btn sec skp ${S.skipOpen?'on':''}" data-act="skipm" aria-label="건너뛰기 메뉴">⏩</button></div></div>`;
}
function advance(days) {
  let stopped = null;
  { const m = Core.me(); S.trfx = { acc0: Object.assign({}, m.acc||{}), a0: Object.assign({}, m.a), fat0: m.fat }; }
  for (let i=0;i<days;i++) {
    const m0 = Core.me(), before = m0.offers.length, cu0 = !!m0.callup;
    const pm = Core.step();
    if (pm) { stopped = 'match'; break; }
    const m1 = Core.me();
    if (m1.offers.length > before) { stopped = 'offer'; break; }
    if (!m0.meet && m1.meet) { stopped = 'meet'; break; }
    if (m0.club !== m1.club) { stopped = 'move'; break; }
    if (!cu0 && m1.callup && days>1) { stopped = 'call'; break; }
    if (m1.renewal && days>1) { stopped = 'ren'; break; }
  }
  save(); render();
  if (stopped==='match') { setTimeout(startMatch, 50); }
  else if (stopped==='offer') toast('제안이 도착했습니다');
  else if (stopped==='meet') toast('감독이 면담을 요청했습니다');
  else if (stopped==='move') toast('새 팀에 합류했습니다');
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
  if (a==='cr') { const nm = $('#nm'); if (nm) S.cr.name = nm.value; S.cr[t.dataset.k] = id; if (t.dataset.k==='pos') S.cr.prefs = []; if (t.dataset.k==='cc' || t.dataset.k==='stage') { S.cr.home = ''; S.cr.club = null; } if (t.dataset.k==='cc' && !S.cr.natTouched) S.cr.nat = id; render(); return; }
  if (a==='start') { const nm = $('#nm'); const name = (nm && nm.value.trim()) || '김도윤'; fixCreator(); Core.createMe({ name, h: S.cr.h, prefs: (S.cr.prefs||[]).filter(k => (Core.PREF_POS[S.cr.pos]||[]).includes(k)), trait: S.cr.trait, pos: S.cr.pos, club: S.cr.club, nat: S.cr.nat, age: S.cr.stage==='youth'?15:19, look: { skin:S.cr.skin, hair:S.cr.hair, style:S.cr.style } }); S.step = 'game'; S.lc = null; S.ld = null; save(); render(); return; }
  if (a==='tab') { S.tab = id; S.modal = null; S.modalKind = null; S._sk = null; }
  else if (a==='plan') { Core.me().plan = id; }
  else if (a==='cust') { const m = Core.me(); let l = (m.cust||[]).slice(); const ix = l.indexOf(id); if (ix>=0) l.splice(ix,1); else { l.push(id); if (l.length>2) l.shift(); } m.cust = l; m.plan = 'custom'; }
  else if (a==='roletrain') { Core.setRoleTraining(); toast('역할에 맞는 부족한 능력치를 집중 훈련합니다'); }
  else if (a==='spa') { Core.sponsorAccept(+id); toast('스폰서 계약 완료'); }
  else if (a==='spd') Core.sponsorDecline(+id);
  else if (a==='inv') { Core.setInv(+id); }
  else if (a==='ofd') S.modal = offerModal(+id);
  else if (a==='nf') S.nf = id; else if (a==='lc') { S.lc = id; S.ld = null; } else if (a==='ld') S.ld = id; else if (a==='lt') S.lt = id; else if (a==='cv') S.cv = id;
  else if (a==='pl') S.modal = profileHTML(G0().players[id]);
  else if (a==='club') S.modal = clubModal(+id);
  else if (a==='close') { S.modal = null; S.modalKind = null; }
  else if (a==='news') { const n = G0().news[+id]; if (n) S.modal = articleOf(n); }
  else if (a==='acc') { S.modal = null; const k = (Core.me().offers[+id]||{}).kind; const r = Core.acceptOffer(+id); save(); toast(k ? (r||'합의') : '계약이 완료되었습니다'); }
  else if (a==='ngk' || a==='ngp') { const r = Core.negotiate(+id, a==='ngk'?'ask':'promise'); toast(r); S.modal = Core.me().offers[+id] ? offerModal(+id) : null; }
  else if (a==='npd') { Core.cancelPending(); }
  else if (a==='rehome') { rollHome(); const nm = $('#nm'); if (nm) S.cr.name = nm.value; if (!S.cr.home) toast('고향을 먼저 골라 주세요'); }
  else if (a==='pref') { const l = S.cr.prefs || (S.cr.prefs = []); const ix = l.indexOf(id); if (ix>=0) l.splice(ix,1); else if (l.length < 3) l.push(id); const nm = $('#nm'); if (nm) S.cr.name = nm.value; }
  else if (a==='mt') { S.mt = id; }
  else if (a==='ct') { S.ct = id; }
  else if (a==='gogrow') { S.tab = 'me'; S.mt = 'grow'; }
  else if (a==='bkcopy') { gzEnc(Core.serialize()).then(c => { const ta = $('#bkbox'); if (ta) ta.value = c; return navigator.clipboard.writeText(c).then(() => toast('백업 코드를 복사했습니다'), () => toast('아래 코드를 직접 복사해 주세요')); }).catch(() => toast('백업에 실패했습니다')); return; }
  else if (a==='bkrestore') { const v = (($('#bkbox') || {}).value || '').trim(); gzDec(v).then(str => { Core.load(str); S.step = 'game'; S.tab = 'home'; S.lc = null; S.ld = null; S.modal = null; save(); render(); toast('복원했습니다'); }).catch(() => toast('백업 코드가 올바르지 않습니다')); return; }
  else if (a==='settings') { S.modalKind = 'settings'; S.modal = settingsModal(); refreshSlots0().then(() => { if (S.modal) { S.modal = settingsModal(); render(); } }); }
  else if (a==='meet') { S.modal = meetModal(); }
  else if (a==='ma') { const r = Core.answerMeeting(+id); if (r) { S.modal = `<div class="ttl">면담 결과</div><div class="card gl"><div>“${esc(r.resp)}”</div><div class="dim">${r.fx}</div></div><button class="btn wide" data-act="close">확인</button>`; save(); } }
  else if (a==='ssave') { slotSave(id); return; }
  else if (a==='sload') { slotLoad(id); return; }
  else if (a==='sdel') { slotDel(id); return; }
  else if (a==='dec') { S.modal = null; Core.declineOffer(+id); }
  else if (a==='ren') { Core.acceptRenewal(); save(); }
  else if (a==='reset') { if (!S.resetArm) { S.resetArm = true; } else { S.resetArm = false; idbDel('save'); S.step = 'setup'; S.tab = 'home'; refreshSlots0().then(render); } }
  else if (a==='go') { S.skipOpen = false; advance(200); return; }
  else if (a==='skipm') { S.skipOpen = !S.skipOpen; render(); return; }
  else if (a==='skip') { S.skipOpen = false; advance(+id); return; }
  else if (a==='day') { advance(1); return; }
  else if (a==='week') { advance(7); return; }
  else if (a==='match') { advance(120); return; }
  else if (a==='mv') { const M = G0().mm, mo = MV.momentOpen; const r = Core.resolveMoment(id); if (r.goal || r.assist) { MV.ballFree = false; } MV.log.unshift({ min: MV.min, ic: IC.target, cls: '', t: esc(r.text) }); MV.momentOpen = null; MV.paused = false; stepBall(M); emitAt(M, mo ? mo.min : MV.min, true); movePitch(); renderMatch(); return; }
  else if (a==='mspd') { S.spd = +id; try { localStorage.setItem('bfm_spd', String(S.spd)); } catch (e) {} if (MV) { MV.speed = spdMs(); if (MV.timer && !MV.skipping && !MV.over) { clearInterval(MV.timer); MV.timer = setInterval(tick, MV.speed); } renderMatch(); } return; }
  else if (a==='mskip') { skipMatch(); return; }
  else if (a==='mend') { endMatchUI(); return; }
  render();
});
document.addEventListener('input', (e) => { if (e.target.id==='nm') S.cr.name = e.target.value; if (e.target.id==='hrange') { S.cr.h = +e.target.value; const lab = e.target.previousElementSibling; if (lab) lab.querySelector('.dim').textContent = S.cr.h + 'cm · 크면 헤딩·몸싸움↑ 작으면 스피드·민첩↑'; } });
document.addEventListener('change', (e) => {
  if (e.target.id==='clubsel') { S.cr.club = +e.target.value; }
  if (e.target.id==='homesel') { S.cr.home = e.target.value; rollHome(); const nm = $('#nm'); if (nm) S.cr.name = nm.value; render(); }
  if (e.target.id==='natsel') { S.cr.nat = e.target.value; S.cr.natTouched = true; }
});
// ---------- 저장 슬롯 (자동 저장 + 수동 3칸) ----------
const SLOTS = ['slot1','slot2','slot3'];
function slotMeta() { try { const m = Core.me(), c = Core.clubOf(m.club); return { name: m.name, club: c.name, age: m.age, ovr: m.ovr, date: Core.fmtDate(G0().day), at: Date.now() }; } catch (e) { return null; } }
async function refreshSlots() { await refreshSlots0(); render(); }
async function slotSave(k) { const meta = slotMeta(); if (!meta) return; await idbSet(k, { meta, d: Core.serialize() }); toast('저장했습니다'); await refreshSlots(); }
async function slotLoad(k) { try { const o = await idbGet(k); const d = typeof o === 'string' ? o : (o && o.d); if (!d) return; Core.load(d); S.step = 'game'; S.tab = 'home'; S.lc = null; S.ld = null; S.modal = null; save(); render(); toast('불러왔습니다'); if (G0().pendingMine) setTimeout(startMatch, 50); } catch (e) { toast('불러오기에 실패했습니다'); } }
async function slotDel(k) { await idbDel(k); await refreshSlots(); }
async function refreshSlots0() { const out = {}; for (const k of ['save'].concat(SLOTS)) { try { const v = await idbGet(k); if (v) out[k] = (typeof v === 'string') ? { meta: null, d: v } : v; } catch (e) {} } S.slots = out; }
function slotRows(inGame) {
  const sl = S.slots || {}; const rows = [];
  const row = (k, label) => { const o = sl[k]; const meta = o && o.meta; const info = o ? (meta ? `${esc(meta.name)} · ${meta.age}세 · 종합 ${meta.ovr} · ${esc(meta.club)} · ${meta.date}` : '자동 저장 데이터') : '<span class="dim">비어 있음</span>';
    return `<div class="card"><div class="row"><b>${label}</b><span class="dim">${meta&&meta.at?new Date(meta.at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''}</span></div><div class="dim">${info}</div><div class="row g8" style="flex-wrap:wrap">${inGame && k!=='save' ? `<button class="btn" data-act="ssave" data-id="${k}">${o?'덮어쓰기':'여기에 저장'}</button>` : ''}${o ? `<button class="btn sec" data-act="sload" data-id="${k}">불러오기</button>` : ''}${o && k!=='save' ? `<button class="btn sec" data-act="sdel" data-id="${k}">삭제</button>` : ''}</div></div>`; };
  rows.push(row('save', '자동 저장'));
  SLOTS.forEach((k,i) => rows.push(row(k, '저장 칸 ' + (i+1))));
  return rows.join('');
}
async function boot() {
  $('#app').innerHTML = '<div class="load">불러오는 중…</div>';
  refreshSlots0();
  const ok = await loadSave();
  if (ok) { S.step = 'game'; render(); if (G0().pendingMine) setTimeout(startMatch, 50); }
  else { S.step = 'setup'; render(); }
}
boot();
