// ===== UI =====
// 화면 호출 묶음(단계 A-0): 경기 로직은 이것만 불러 화면을 바꾼다. 화면 없는 측정 도구(node)는 이 함수들을 빈 함수로 바꿔 쓴다.
const PX = { ui: {
  render: () => renderMatch(), move: () => movePitch(), sfx: (k) => sfx(k), toast: (t, ms) => toast(t, ms),
  banner: (html, cls, ms) => { const el = $('#fx'); if (!el) return false; el.innerHTML = `<div class="fxb ${cls}">${html}</div>`; clearTimeout(PX.fxT); PX.fxT = setTimeout(() => { const e = $('#fx'); if (e) e.innerHTML = ''; }, ms); return true; } } };
const Core = API2;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const SKIN_C = { fair:'F6D2B4', tan:'E0A67A', olive:'C58C5E', brown:'8F5B3A', deep:'5E3A26' };
const HAIR_C = { black:'1E1A1D', dark:'3A2A22', brown:'6B4429', blond:'D9B45A', red:'A9432A', gray:'B0B5BA', navy:'27325A' };
const STYLE_N = { short:'짧은 머리', sidepart:'가르마', buzz:'삭발풍', curly:'곱슬', mohawk:'모히칸', long:'긴 머리', bun:'올림머리' };
const POS_ORDER = ['GK','CB','FB','DM','CM','AM','W','ST'];
const AT_KO = { FIN:'마무리',PAS:'패스',CRS:'크로스',DRI:'드리블',TEC:'테크닉',HEA:'헤딩',TAK:'태클',MAR:'마크',VIS:'시야',OTB:'오프더볼',POS:'위치선정',DEC:'판단력',COM:'침착성',WOR:'활동량',AGG:'적극성',PAC:'스피드',STA:'스태미나',STR:'몸싸움',AGI:'민첩성',JUM:'점프',REF:'반사신경',HAN:'캐칭',KIC:'킥',AER:'공중볼' };
const spriteCache = {};
const footOf = (p) => (p && p.foot) || (((((p && p.id) | 0) * 2654435761) >>> 0) % 100 < 23 ? 'L' : 'R');
function sprite(look, kit, num) {
  try { if (typeof V3D !== 'undefined' && V3D.portrait) { const u = V3D.portrait(look, kit); if (u) return u; } } catch (e) {}   // 선수 그림: 3D 블록 캐릭터(경기 화면과 같은 모습). 3D를 못 쓰면 아래 픽셀 그림
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
// 국적별 외모: 동아시아(한·일·중 등)는 황색계 피부·검은 머리, 아프리카·카리브는 어두운 피부, 유럽은 밝은 피부 위주(이민 2세대 일부 포함).
// p.mix === 'W'(백인 혼혈) / 'B'(흑인 혼혈)이면 국적과 상관없이 해당 외모로 표시(예: 독일계 한국 선수).
const LOOK_R = {
  EA: { sk: ['tan', 'fair', 'tan', 'fair', 'tan', 'fair', 'tan'], hr: ['black', 'black', 'dark', 'black', 'black', 'dark'], st: ['short', 'sidepart', 'buzz', 'short', 'sidepart', 'mohawk'] },
  CA: { sk: ['tan', 'fair', 'tan', 'olive', 'fair'], hr: ['black', 'black', 'dark', 'brown'], st: ['short', 'sidepart', 'buzz', 'curly'] },
  ME: { sk: ['olive', 'tan', 'olive', 'tan', 'fair', 'brown'], hr: ['black', 'dark', 'black', 'dark', 'brown'], st: ['short', 'sidepart', 'buzz', 'curly', 'short'] },
  AF: { sk: ['deep', 'brown', 'deep', 'brown', 'deep', 'brown', 'deep'], hr: ['black', 'black', 'dark', 'black', 'black'], st: ['buzz', 'short', 'curly', 'mohawk', 'buzz', 'short'] },
  LA: { sk: ['tan', 'olive', 'fair', 'tan', 'olive', 'brown', 'fair'], hr: ['black', 'dark', 'brown', 'black', 'dark', 'blond'], st: ['short', 'sidepart', 'curly', 'long', 'buzz', 'short'] },
  BR: { sk: ['fair', 'tan', 'olive', 'brown', 'deep', 'tan', 'brown', 'olive'], hr: ['black', 'dark', 'brown', 'black', 'blond', 'dark'], st: ['short', 'curly', 'buzz', 'sidepart', 'mohawk', 'curly'] },
  EU: { sk: ['fair', 'fair', 'tan', 'fair', 'olive', 'fair', 'fair', 'tan'], hr: ['brown', 'blond', 'dark', 'black', 'brown', 'red', 'blond', 'dark'], st: ['short', 'sidepart', 'buzz', 'curly', 'long', 'sidepart', 'short'] },
  EM: { sk: ['fair', 'fair', 'tan', 'brown', 'fair', 'deep', 'olive', 'fair'], hr: ['brown', 'blond', 'dark', 'black', 'brown', 'black', 'dark', 'red'], st: ['short', 'sidepart', 'buzz', 'curly', 'mohawk', 'short', 'sidepart'] },
  WE: { sk: ['fair', 'tan', 'fair', 'brown', 'olive', 'fair', 'deep', 'tan'], hr: ['brown', 'blond', 'dark', 'black', 'red', 'black', 'dark', 'brown'], st: ['short', 'sidepart', 'buzz', 'curly', 'long', 'short', 'mohawk'] }
};
const LOOK_REG = {};
[['EA', 'KOR JPN CHN PRK TWN HKG VNM THA SGP IDN MYS PHI'], ['CA', 'UZB KAZ KGZ TJK'], ['ME', 'SAU IRN IRQ QAT JOR TUR UAE KUW OMN BHR SYR LBN MAR ALG TUN EGY LBY'], ['AF', 'SEN GHA CIV COD CPV RSA NGA CMR HAI CUW MLI GUI GAB GNB ANG ZAM ZIM KEN UGA TAN'], ['LA', 'ARG URU PAR COL ECU MEX CHI PER VEN BOL CRC PAN HON SLV'], ['BR', 'BRA'], ['EU', 'CRO SRB BIH CZE POL SVK SVN HUN ROU BUL ALB MNE GEO UKR RUS NOR SWE DEN FIN ISL SCO IRL WAL NIR AUT NZL AUS CAN GRE MKD KOS'], ['EM', 'ENG USA FRA BEL NED SUI'], ['WE', 'GER ESP POR ITA']].forEach(([r, cs]) => cs.split(' ').forEach(c => LOOK_REG[c] = r));
function lookOf(p) {
  if (p.me && p.look) return p.look;
  const id = p.id, hs = (id * 2654435761 >>> 0);
  if (p.mix === 'W') return { skin: 'fair', hair: ['brown', 'blond', 'dark'][id % 3], style: ['sidepart', 'short', 'sidepart'][id % 3] };
  if (p.mix === 'B') return { skin: ['brown', 'deep'][id % 2], hair: 'black', style: ['curly', 'buzz', 'short'][id % 3] };
  const R = LOOK_R[LOOK_REG[p.nat]] ;
  if (!R) return { skin: LK_S[id % 5], hair: LK_H[id % 7], style: LK_ST[id % 6] };
  const pk = (a, k) => a[(hs >>> k) % a.length];
  if (LOOK_REG[p.nat] === 'EA' && (hs >>> 9) % 25 === 0) return { skin: 'fair', hair: ['brown', 'blond', 'dark'][id % 3], style: 'sidepart' };   // 소수는 혼혈 외모
  return { skin: pk(R.sk, 3), hair: pk(R.hr, 7), style: pk(R.st, 11) };
}
function sprH(p, club, w, cls) { const c = club || (p.club !== null && p.club !== undefined ? Core.clubOf(p.club) : null); return `<span class="spr ${cls||''}" style="width:${w}px;height:${Math.round(w*34/16)}px;background-image:url(${sprite(lookOf(p), c ? (p.sub === 'GK' ? gkKitFor(c) : [c.col, c.col2]) : null)})"></span>`; }
function regionOf(c) { const G = G0(); if (c.region) return c.region; if (c.parent !== undefined && c.parent !== null && G.clubs[c.parent]) return regionOf(G.clubs[c.parent]); return String(c.name).replace(/ U18$/, '').split(' ')[0]; }
const mySprite = (w) => { const m = Core.me(); const c = Core.clubOf(m.club); return `<span class="spr" style="width:${w}px;height:${w*34/16}px;background-image:url(${sprite(m.look,m.sub==='GK'?gkKitFor(c):[c.col,c.col2])})"></span>`; };
const S = { step:'boot', tab:'home', lc:null, ld:null, lt:'table', cv:null, modal:null, nf:'all', sel:['KOR','ENG','ESP','ITA','GER'], cr:{ h:178, prefs:[], trait:'grinder', name:'양메시', skin:'tan', hair:'brown', style:'sidepart', pos:'ST', nat:'KOR', stage:'youth', cc:'KOR', club:null }, resetArm:false, busy:false, mt:'prof', ct:'offer' };
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
function DD_FLAG(n) { try { return (Core.NATFLAG && Core.NATFLAG(n)) || ''; } catch (e) { return ''; } }
function crest(c, w) {
  w = w || 16;
  if (c.kind === 'nat') { const fl = (DD_FLAG(c.nat)); if (fl) return `<span class="flagc" style="font-size:${Math.round(w*0.82)}px;width:${w}px;height:${w}px">${fl}</span>`; }
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
function compLabel(ctx) { if (ctx.t==='lg') return lgName(ctx.id); if (ctx.t==='fr') return '🤝 ' + (ctx.name || '친선경기'); if (ctx.t==='nt') return ctx.cat && ctx.cat !== 'A' ? `${ctx.cat} 대표팀 친선경기` : 'A매치 친선경기'; const c = Core.compById(ctx.id); return c ? c.name + (ctx.g!==undefined ? ' 조별리그' : ctx.third ? ' 3·4위전' : c.rl ? ' '+c.rl : '') : '대회'; }
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
function mtile(k, v, s) {                                                           // 금액 타일: 숫자는 한 줄(자릿수에 따라 크기 자동), 단위는 아래 작게
  const t = String(v), m = t.match(/^(-?[\d.,]+)\s*(억|만)?\s*원?$/);
  if (!m) return tile(k, v, s);
  const num = m[1], unit = (m[2] || '') + ' 원', n = num.length, fs = n <= 5 ? 20 : n <= 6 ? 17 : n <= 7 ? 14.5 : 12.5;
  return `<div class="tile"><div class="dim">${k}</div><div class="big mny" style="font-size:${fs}px">${num}</div><div class="mu">${unit}</div><div class="s" style="color:#9DB0A4">${s}</div></div>`;
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
  return `<div class="card gl"><div class="dim">${tag}</div><b>${esc(c.name)}</b> <span class="dim">${lg?lg.name:''} · ${Core.stageOf(c)||''}</span><div class="dim">${c.kind==='pro'?`주급 ${won(o.wage)} · ${o.years}년${o.fee?` · 이적료 약 ${o.fee}억 원`:''}`:`${o.years}년 과정 · 전력 ${Math.round(c.strength)}`}</div>${c.kind==='pro'?`<div class="dim">${esc(Core.pitchOf(o).tag)} 제안</div>`:''}${(() => { const a = c.kind==='pro' ? Core.agentNote(o) : null; return a ? `<div class="agn"><b>🕴️ 에이전트: ${a.verdict}</b>${a.lines.map(l => `<div class="dim">· ${esc(l)}</div>`).join('')}</div>` : ''; })()}<div class="row g8"><button class="btn" data-act="ofd" data-id="${i}">상세 보기</button><button class="btn sec" data-act="dec" data-id="${i}">거절</button></div></div>`;
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
function shopCard(m) {
  const sh = Core.shopOf(m), now = Core.G.day, B = Core.BOOTS.map((x,i)=>i? `<button class="opt ${sh.boots===i&&now<=sh.bUntil?'on':''}" data-act="shop" data-id="boots:${i}"><b>${x.n}</b><span class="dim">${won(x.p)} · 평점 +${x.r} · 1년</span></button>`:'').join(''),
  G = Core.GEAR.map((x,i)=>i? `<button class="opt ${sh.gear===i?'on':''}" data-act="shop" data-id="gear:${i}"><b>${x.n}</b><span class="dim">${won(x.p)} · 부상 -${Math.round(x.inj*100)}% · 회복 +${x.rec}</span></button>`:'').join(''),
  A = Core.AGENTS.map((x,i)=>`<button class="opt ${sh.ag===i?'on':''}" data-act="shop" data-id="agent:${i}"><b>${x.n}</b><span class="dim">수수료 ${Math.round(x.fee*100)}% · 이적제안 ×${x.o} · 광고 ×${x.ad}${x.fame?' · 인지도 '+x.fame+'↑':''}</span></button>`).join('');
  return `<div class="card"><div class="dim">축구화 (현재: ${Core.BOOTS[now<=sh.bUntil?sh.boots:0].n})</div><div class="opts">${B}</div><div class="dim">회복 장비</div><div class="opts">${G}</div><div class="dim">에이전트</div><div class="opts">${A}</div></div>`;
}
function finCard(m) {
  const f = Core.finOf(m), c = Core.clubOf(m.club), pro = c.kind==='pro';
  const spOn = f.sps.map(x=>`<div class="li"><b>${esc(x.b)}</b> <span class="dim">월 ${won(x.m)} · ${Core.fmtDate(x.until).slice(0,7)}까지</span></div>`).join('') || '<div class="dim">진행 중인 스폰서가 없습니다. 인지도가 오르면 제안이 옵니다.</div>';
  const spOf = f.spOff.map((o,i)=>`<div class="card gl"><b>${esc(o.b)}</b> <span class="dim">월 ${won(o.m)} · ${o.years}년</span><div class="row g8"><button class="btn" data-act="spa" data-id="${i}">수락</button><button class="btn sec" data-act="spd" data-id="${i}">거절</button></div></div>`).join('');
  const out = f.tax + f.cost + f.inv, inv = Core.INV.map((x,i)=>`<button class="opt ${(m.inv||0)===i?'on':''}" data-act="inv" data-id="${i}"><b>${x.n}</b><span class="dim">${x.c?'월 '+won(x.c)+' · 성장 +'+Math.round((x.g-1)*100)+'%':'비용 없음'}</span></button>`).join('');
  const led = f.log.slice(0,6).map(l=>`<tr><td>${l.y%100}.${String(l.m).padStart(2,'0')}</td><td>${l.wage}</td><td>${l.sp+l.bonus}</td><td>${l.tax+l.live+l.inv}</td><td><b style="color:${l.net>=0?'#C6F36B':'#FFB27A'}">${l.net}</b></td></tr>`).join('');
  return `<div class="sec">재정</div><div class="tiles">${tile('주급', pro?won(m.ct.wage):'—', pro?'연봉 약 '+won(m.ct.wage*52):'프로 계약 전')}${mtile('잔고', won(f.bal), '누적 순이익')}${mtile('누적 수입', won(f.earn+f.sp+f.bonus), '급여 '+won(f.earn))}${mtile('누적 지출', won(out+(f.shopCost||0)), '세금 '+won(f.tax))}</div><div class="card"><div class="dim">수입 내역 — 급여 ${won(f.earn)} · 스폰서 ${won(f.sp)} · 보너스(골·도움·MVP·계약·광고) ${won(f.bonus)}</div><div class="dim">지출 내역 — 세금 ${won(f.tax)} · 생활·에이전트 ${won(f.cost)} · 자기 투자 ${won(f.inv)} · 장비 ${won(f.shopCost||0)}</div></div><div class="sec">스폰서</div>${spOf}<div class="card">${spOn}</div><div class="sec">광고 <span class="dim">월 1회 · 누적 ${won(f.ad)} (${f.adN}회)</span></div>${f.adOff.map((o,i)=>`<div class="card gl"><b>${esc(o.b)}</b> <span class="tag">${o.k}</span> <span class="dim">출연료 ${won(o.fee)} · 피로 +${o.fat} · ${o.d}일</span><div class="row g8"><button class="btn" data-act="ada" data-id="${i}">촬영</button><button class="btn sec" data-act="add" data-id="${i}">거절</button></div></div>`).join('') || '<div class="card dim">들어온 광고 제안이 없습니다. 인지도 20 이상이면 제안이 옵니다. 부진할 때 찍으면 감독 신뢰가 깎입니다.</div>'}<div class="sec">장비·에이전트 <span class="dim">게임 내 수입으로 구매</span></div>${shopCard(m)}<div class="sec">자기 투자 <span class="dim">매달 비용</span></div><div class="opts">${inv}</div>${led?`<div class="sec">월별 수지 <span class="dim">(만 원)</span></div><div class="card"><table class="tb"><tr><th>월</th><th>급여</th><th>스폰·보너스</th><th>지출</th><th>순이익</th></tr>${led}</table></div>`:''}`;
}
function potCard(m) {
  const l = (m.potLog||[]).slice().reverse().map(x=>`<div class="li"><span class="dim">${x[0]}</span> 잠재 ${x[1]} → <b style="color:${x[2]>x[1]?'#C6F36B':x[2]<x[1]?'#FFB27A':'#9DB0A4'}">${x[2]}</b></div>`).join('');
  return `<div class="sec">잠재력 <span class="dim">매년 재평가</span></div><div class="card"><div class="row"><b>현재 ${m.ovr} / 잠재 ${m.pot}</b></div><div class="dim">성장 속도·경기 평점·인지도·나이에 따라 매년 1월 조정됩니다. 29세 이후에는 현재 능력에 가까워져요.</div>${l}</div>`;
}
function achCard(m) {
  const got = Object.keys(m.ach||{}); const all = Object.keys(Core.ACH);
  return `<div class="sec">업적 <span class="dim">${got.length}/${all.length}</span></div><div class="card">${all.map(id=>`<div class="li" style="opacity:${m.ach&&m.ach[id]?1:0.4}">${m.ach&&m.ach[id]?'🏅':'🔒'} <b>${Core.ACH[id][0]}</b> <span class="dim">${Core.ACH[id][1]}</span></div>`).join('')}</div>`;
}
function evtCard() {                                                                          // 개인 선택 이벤트
  const e = Core.evtInfo(); if (!e) return '';
  return `<div class="card gl"><b>${esc(e.t)}</b><div class="dim">${esc(e.q)}</div><div class="optsn">${e.o.map((o, i) => `<button class="opt" data-act="evt" data-id="${i}"><b>${esc(o[0])}</b></button>`).join('')}</div></div>`;
}
function snsCard(m) {
  const L = (m.sns || []).slice(0, 4); if (!L.length) return '';
  return `<div class="sec">💬 팬 반응 (SNS)</div><div class="card">${L.map(x => `<div class="li"><span class="dim">${Core.fmtDate(x.d).slice(5, 10)}</span> ${x.ok ? '👍' : '👎'} ${esc(x.t)}${x.r ? ` <span class="dim">(평점 ${x.r})</span>` : ''}</div>`).join('')}</div>`;
}
function rivalCard(m) {                                                                       // 동기 라이벌 비교
  const I = Core.rivalInfo(); if (!I) return ''; const r = I.r, rc = Core.clubOf(r.club), mc = Core.clubOf(m.club), h = (m.rivalT && m.rivalT.h2h) || { w: 0, d: 0, l: 0 };
  const row = (k, a, b, hi) => `<tr><td class="dim">${k}</td><td><b style="color:${hi === 1 ? '#C6F36B' : 'inherit'}">${a}</b></td><td><b style="color:${hi === -1 ? '#C6F36B' : 'inherit'}">${b}</b></td></tr>`, cmp = (a, b) => a > b ? 1 : a < b ? -1 : 0;
  const ma = (m.awards || []).length;
  return `<div class="sec">🆚 동기 라이벌</div><div class="card"><div class="row g8">${sprH(r, rc || mc, 28)}<div class="grow"><b>${esc(r.name)}</b> <span class="dim">${r.age}세 · ${Core.POS_KO[r.sub]} · ${rc ? esc(rc.name) : '-'}</span></div></div><table class="tb"><tr><th></th><th>나</th><th>라이벌</th></tr>${row('종합', m.ovr, r.ovr, cmp(m.ovr, r.ovr))}${row('잠재력', m.pot, r.pot, cmp(m.pot, r.pot))}${row('이번 시즌', `${m.st.a}경기 ${m.st.g}골 ${m.st.as}도움`, `${r.st.a}경기 ${r.st.g}골 ${r.st.as}도움`, cmp(m.st.g + m.st.as, r.st.g + r.st.as))}${row('통산', `${I.cm.a}경기 ${I.cm.g}골`, `${I.cr.a}경기 ${I.cr.g}골`, cmp(I.cm.g, I.cr.g))}${row('수상', ma + '회', I.rAw + '회', cmp(ma, I.rAw))}</table><div class="dim">맞대결 ${h.w}승 ${h.d}무 ${h.l}패 · 라이벌 팀과 경기하면 특별 연출이 나옵니다</div></div>`;
}
function offCard(m) {                                                                         // 비시즌 개인 일정
  const I = Core.offInfo(); if (!I) return '';
  if (I.act) { const A = Core.OFF_ACTS[I.act.id], left = Math.max(0, I.act.until - G0().day); return `<div class="card gl"><b>${A.ic} ${A.n} 중</b><div class="dim">${left ? left + '일 남음 — 진행하면 끝납니다' : '오늘 마무리됩니다'}</div></div>`; }
  const btn = (id) => { const A = Core.OFF_ACTS[id], n = I.used[id] || 0, off = n >= A.max || (A.fame && m.fame < A.fame) || I.days < A.days; return `<button class="opt ${off ? 'dis' : ''}" data-act="offact" data-id="${id}"><b>${A.ic} ${A.n}</b><span class="dim s11">${A.d} · ${A.days}일 · ${n}/${A.max}</span></button>`; };
  const last = m.lastAct && G0().day - m.lastAct.d < 6 ? `<div class="dim">최근: ${esc(m.lastAct.txt)}</div>` : '';
  return `<div class="card"><div class="row"><b>🌴 비시즌 개인 일정</b><span class="tag">프리시즌까지 ${I.days}일</span></div><div class="dim">시즌이 끝났습니다. 남은 기간을 어떻게 보낼지 고르세요. 고르지 않으면 평소처럼 훈련합니다.</div>${last}<div class="optsn">${Object.keys(Core.OFF_ACTS).map(btn).join('')}</div></div>`;
}
function tourCard() {                                                                         // 감독 모드: 프리시즌 투어 선택
  const P = G0().pre, m = Core.me(); if (!P || P.done || P.cid !== m.club) return '';
  return `<div class="card gl"><b>✈️ 프리시즌 투어 선택</b><div class="dim">스폰서가 친선경기 3경기를 주최합니다. 일주일 안에 고르지 않으면 국내 친선전으로 정해집니다.</div><div class="optsn">${P.opts.map(o => `<button class="opt ${P.pick === o.id ? 'fav' : ''}" data-act="tour" data-id="${o.id}"><b>${esc(o.n)}</b><span class="dim s11">${esc(o.d)}${o.fee ? ` · 수익 약 ${(o.fee * 3).toFixed(1)}억` : ''}</span></button>`).join('')}</div>${P.pick ? `<div class="dim">선택: ${esc(P.opts.find(o => o.id === P.pick).n)} — 곧 일정이 확정됩니다.</div>` : ''}</div>`;
}
function homeView() {
  const G = G0(), m = Core.me(), c = Core.clubOf(m.club);
  const nf = nextFixture(m.club); let nx = '';
  if (nf) { const h = Core.clubOf(nf.h), a = Core.clubOf(nf.a); const d = nf.day - G.day; nx = `<div class="card"><div class="row"><span class="dim">다음 경기 · ${Core.fmtDate(nf.day)} ${d===0?'· 오늘':'· D-'+d}</span><span class="tag">${esc(nf.label)}</span></div><div class="vs"><div><i class="dot" style="background:${h.col}"></i>${esc(h.name)}</div><b>VS</b><div><i class="dot" style="background:${a.col}"></i>${esc(a.name)}</div></div><div class="dim">전력 ${Math.round(h.strength)} : ${Math.round(a.strength)}</div></div>`; }
  const plans = (Core.normPlan(m), Object.entries(Core.plansOf(m))).map(([id,p]) => `<button class="opt ${m.plan===id?'on':''}" data-act="plan" data-id="${id}"><b>${p.n}</b><span class="dim">${id==='custom'?(m.cust&&m.cust.length?m.cust.map(k=>AT_KO[k]).join('·'):'직접 선택'):(p.k.map(k=>AT_KO[k]).join('·')||'피로 회복')}</span></button>`).join('');
  const offers = m.offers.map(offerCard).join('');
  const ren = m.renewal ? `<div class="card gl"><b>${esc(c.name)} 재계약 제안</b><div class="dim">주급 ${won(m.renewal.wage)} · ${m.renewal.years}년</div><div class="row g8"><button class="btn" data-act="ren">수락</button></div></div>` : '';
  const logs = m.log.slice(0,5).map(l => `<div class="li"><span class="dim">${Core.fmtDate(l[0]).slice(5,10)}</span> ${esc(l[1])}</div>`).join('') || '<div class="dim">아직 기록이 없습니다.</div>';
  const inj = (m.inj>0 ? `<div class="card warn">부상 중 · ${m.inj}일 남음</div>` : '') + (m.sus && (m.sus.c > 0 || m.sus.n > 0) ? `<div class="card warn">🟥 출전 정지 · ${m.sus.c > 0 ? `클럽 경기 ${m.sus.c}경기` : ''}${m.sus.c > 0 && m.sus.n > 0 ? ' · ' : ''}${m.sus.n > 0 ? `대표팀 ${m.sus.n}경기` : ''} 남음</div>` : '') + (m.yc && m.yc.c >= 3 ? `<div class="card">🟨 경고 ${m.yc.c}회 누적 — 5회가 되면 1경기 출전 정지</div>` : '');
  const cu = m.callup ? `<div class="card gl">${esc(m.callup.name)} 소집 중 — 대표팀 경기를 앞두고 있습니다.</div>` : '';
  const stage = Core.stageOf(c);
  const feel = m.inj>0 ? '😣 부상 중이에요' : m.fat>75 ? '😮‍💨 많이 지쳤어요' : m.mor>=75 ? '😄 컨디션 최고!' : m.mor<45 ? '😟 사기가 낮아요' : '🙂 준비됐어요';
  const hero = `<div class="card hero"><div class="herochar">${sprH(m, c, 46, m.plan==='rest'?'sleepy':m.inj>0?'':'train')}</div><div><div class="dim">${feel}</div><div><b>${esc(m.name)}</b> <span class="dim">종합 ${m.ovr} · ${m.plan==='rest'?'휴식 중':'훈련 중'}</span></div></div></div>`;
  const meet = m.meet ? `<div class="card gl"><div class="row"><b>감독 면담 요청</b><span class="tag">${esc(m.meet.coach)}</span></div><div class="dim">${esc(m.meet.title)} — 감독이 불렀습니다.</div><button class="btn wide" data-act="meet">면담하러 가기</button></div>` : '';
  const fw = m.fat >= 75 && m.plan !== 'rest' ? `<div class="card warn"><b>😮‍💨 피로 ${Math.round(m.fat)} — 부상 위험</b><div class="dim">피로가 75를 넘으면 성장이 절반으로 줄고 선발 확률이 떨어집니다.${m.autoRest !== false ? ' 자동 관리가 켜져 있어 80부터 알아서 쉽니다.' : ''}</div><button class="btn sec wide" data-act="plan" data-id="rest">오늘부터 휴식으로 바꾸기</button></div>` : '';
  return topbar() + `<div class="body">${hero}${meet}${fw}${evtCard()}${offCard(m)}${inj}${cu}${pendCard(m)}${offers}${ren}${nx}${snsCard(m)}
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
function pastView(lg, h, key) {
  const m = Core.me();
  if (key==='table' || key==='team') {
    const rows = h.table.map((r,i) => `<tr class="${r[0]===m.club?'hl':''}"><td>${i+1}</td><td>${clubLink(r[0])}</td>${r.length>2?`<td>${r[2]+r[3]+r[4]}</td><td>${r[2]}-${r[3]}-${r[4]}</td><td>${r[5]-r[6]>0?'+':''}${r[5]-r[6]}</td>`:'<td></td><td></td><td></td>'}<td><b>${r[1]}</b></td></tr>`).join('');
    return `<table class="tb"><tr><th>#</th><th>팀</th><th>경기</th><th>승무패</th><th>득실</th><th>승점</th></tr>${rows}</table>`;
  }
  const arr = h[key==='g'?'sc':key] || [], lab = {g:IC.ball+' 골',as:IC.boot+' 도움',rt:IC.star+' 평점'}[key];
  const rows = arr.map((r,i) => `<tr><td>${i+1}</td><td>${esc(r[0])}</td><td>${clubLink(r[1])}</td><td><b>${key==='rt'?f1(r[2]):r[2]}</b></td></tr>`).join('');
  return `<table class="tb"><tr><th>#</th><th>선수</th><th>팀</th><th>${lab}</th></tr>${rows || '<tr><td colspan=4 class="dim">기록 없음 (이전 버전 저장분)</td></tr>'}</table>`;
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
  if ((comp.kind==='cont' || comp.kind==='nc') && comp.groups.length) h += comp.groups.map((g,i) => { const tb = g.teams.slice().sort((x,y)=>{ const a=g.table[x], b=g.table[y]; return (b.pts-a.pts)||((b.gf-b.ga)-(a.gf-a.ga))||(b.gf-a.gf); }); return `<div class="sec">${String.fromCharCode(65+i)}조</div><table class="tb"><tr><th></th><th>팀</th><th>경기</th><th>득실</th><th>승점</th></tr>${tb.map((id,k)=>`<tr class="${id===Core.me().club?'hl':''}"><td>${k+1}</td><td>${clubLink(id)}</td><td>${g.table[id].p}</td><td>${g.table[id].gf-g.table[id].ga}</td><td><b>${g.table[id].pts}</b></td></tr>`).join('')}</table>`; }).join('');
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
  ${ntQView(nat)}<div class="sec">최근 대표팀 결과</div><div class="card">${log}</div>`;
}
function ntQView(nat) {                                                                        // 국가대항전: 다음 본선 · 예선 순위 · 대표팀 커리어
  const nx = Core.ntNext(), cf = Core.confOf(nat), m = Core.me(), T = G0().ntTour;
  const title = nx.wc ? `${nx.y} 월드컵` : `${nx.y} ${Core.NC_NAME[cf] || '대륙컵'}`;
  const tb = Core.qTable(cf), rows = tb.slice(0, 10).map((r, i) => `<tr class="${r.nat === nat ? 'hl' : ''}"><td>${i + 1}</td><td>${Core.FLAG[r.nat] || ''} ${esc(Core.NATK(r.nat))}</td><td>${r.p}</td><td>${r.w}-${r.d}-${r.l}</td><td><b>${r.pts}</b></td></tr>`).join('');
  const now = T ? `<div class="card gl"><b>🏆 ${T.y} ${T.wc ? '월드컵' : '대륙컵'} 진행 중</b><div class="dim">'대회' 탭에서 조별리그·토너먼트를 볼 수 있습니다.</div></div>` : '';
  const hist = (m.ntHist || []).slice(-5).reverse().map(h => `<div class="li dim">${h[0]} ${esc(h[1])} — <b>${esc(h[2])}</b></div>`).join('');
  return `${now}<div class="sec">${esc(title)} ${T ? '' : '예선'} <span class="dim">(${nx.y}년 6월 본선 · A매치 기간 같은 대륙끼리 예선)</span></div>${rows ? `<table class="tb"><tr><th>#</th><th>나라</th><th>경기</th><th>승무패</th><th>승점</th></tr>${rows}</table>` : '<div class="dim">아직 예선 경기가 없습니다.</div>'}${hist ? `<div class="sec">내 국가대항전 기록</div><div class="card">${hist}</div>` : ''}`;
}
function leagueView() {
  const G = G0(), me = Core.me(), mc = Core.clubOf(me.club);
  if (!S.lc) S.lc = mc.cc || G.sel[0];
  const ctop = G.sel.map(c=>`<button class="chip ${S.lc===c?'on':''}" data-act="lc" data-id="${c}">${Core.FLAG[c]||''} ${CO[c].name}</button>`).join('') + `<button class="chip ${S.lc==='_C'?'on':''}" data-act="lc" data-id="_C">대회</button><button class="chip ${S.lc==='_N'?'on':''}" data-act="lc" data-id="_N">대표팀</button><button class="chip ${S.lc==='_H'?'on':''}" data-act="lc" data-id="_H">🏛 명예의 전당</button>`;
  let inner = '', sub = '', head = '';
  if (S.lc==='_C') inner = compView();
  else if (S.lc==='_N') inner = natView();
  else if (S.lc==='_H') inner = hallView();
  else {
    const TO = { 1:0, 2:1, U:2, Y:3 };
    const lgs = G.leagues.filter(l=>l.cc===S.lc).slice().sort((a,b) => (TO[a.tier] ?? 9) - (TO[b.tier] ?? 9));
    if (!lgs.length) S.lc = G.sel[0];
    if (!S.ld || !lgs.some(l=>l.id===S.ld)) S.ld = (lgs.find(l=>l.tier===1)||lgs[0]).id;
    const lg = Core.leagueOf(S.ld); const lts = [['table','순위'],['team','팀 기록'],['g',IC.ball+' 득점'],['as',IC.boot+' 도움'],['rt',IC.star+' 평점'],['hist','역대']];
    sub = `<div class="chips">${lgs.map(l=>`<button class="chip s ${S.ld===l.id?'on':''}" data-act="ld" data-id="${l.id}">${DIVN(l)}</button>`).join('')}</div><div class="chips">${lts.map(([i,n])=>`<button class="chip s ${S.lt===i?'on':''}" data-act="lt" data-id="${i}">${n}</button>`).join('')}</div>`;
    if (S.sea != null && !lg.hist[S.sea]) S.sea = null;
    const hs = lg.hist.length && S.lt!=='hist' ? `<div class="chips">${['이번 시즌'].concat(lg.hist.map(h=>h.season)).map((n,i)=>`<button class="chip s ${(S.sea==null?(!S.seaUser && S.lt!=='hist' && Object.values(lg.table||{}).every(t=>!t.p) ? lg.hist.length : 0):S.sea+1)===i?'on':''}" data-act="lsea" data-id="${i-1}">${n}</button>`).join('')}</div>` : '';
    sub += hs;
    const fresh = lg.hist.length && Object.values(lg.table || {}).every(t => !t.p), autoPast = S.sea == null && !S.seaUser && fresh && S.lt!=='hist';
    const past = S.sea != null && S.lt!=='hist' ? lg.hist[S.sea] : autoPast ? lg.hist[lg.hist.length - 1] : null;
    inner = past ? pastView(lg, past, S.lt) : S.lt==='table' ? tableView(lg) : S.lt==='team' ? teamView(lg) : S.lt==='hist' ? (lg.hist.length ? lg.hist.map((h,i)=>[h,i]).reverse().map(([h,i]) => `<div class="card" data-act="lsea" data-id="${i}" style="cursor:pointer"><b>${h.season}</b> 우승 ${clubLink(h.champ)} <span class="dim" style="float:right">상세 ›</span><div class="dim">${h.top?`득점왕 ${esc(h.top[0])} ${h.top[1]}골`:''}${h.mvp?` · ${IC.crown} MVP ${esc(h.mvp[0])}`:''}${h.aw && h.aw.young?` · 🌱 영플레이어 ${esc(h.aw.young[0])}`:''}${h.aw && h.aw.ast?` · 🅰 도움왕 ${esc(h.aw.ast[0])}`:''}</div>${h.aw && h.aw.b11 && h.aw.b11.length ? `<div class="dim s11">베스트11: ${h.aw.b11.map(r => esc(r[0])).join(', ')}</div>` : ''}</div>`).join('') : '<div class="dim">아직 끝난 시즌이 없습니다.</div>') : listView(lg, S.lt);
    head = past ? `<div class="dim">${autoPast ? '새 시즌 개막 전 · ' : ''}${lg.name} · ${past.season} 시즌 최종${past.n?` · ${past.n}경기`:''}</div>` : `<div class="dim">${lg.name} · ${Math.min(lg.ptr,lg.rd.length)}/${lg.rd.length}라운드</div>`;
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
  const head = p.me ? mySprite(56) : `<span class="spr" style="width:56px;height:119px;background-image:url(${sprite(lookOf(p),c?(p.sub==='GK'?gkKitFor(c):[c.col,c.col2]):null)})"></span>`;
  const nt = p.nst && p.nst.a>0 ? `<span class="tag">대표 ${p.nst.a}경기 ${p.nst.g}골</span>` : '';
  return `<div class="prof">${head}<div><div class="ttl">${esc(p.name)} <button class="btn sm sec" data-act="rnopen" data-id="p:${p.id}" aria-label="이름 변경">✏</button></div><div class="dim">${Core.POS_KO[p.sub]} · ${p.age}세 · ${Core.NATK(p.nat)} · ${c?esc(c.name):'무소속'}</div><div class="row g8" style="flex-wrap:wrap"><span class="tag">종합 ${p.ovr}</span>${p.me?`<span class="tag">잠재 ${p.pot}</span>`:''}<span class="tag">계약 ${p.ct.until}</span>${nt}</div>${p.inj>0?`<div class="dim" style="color:#FFB27A">부상 ${p.inj}일</div>`:''}</div></div><div class="sec">시즌별 기록</div>${histTable(p)}${xferList(p)}<div class="sec">능력치</div>${attrBars(p)}`;
}
const ME_TABS = [['prof','프로필'],['grow','성장'],['fin','재정'],['ach','업적·면담']];
function subChips(cur, tabs, act) { return `<div class="chips">${tabs.map(([i,n])=>`<button class="chip ${cur===i?'on':''}" data-act="${act}" data-id="${i}">${n}</button>`).join('')}</div>`; }
function meView() {
  const m = Core.me(), tr = Core.TRAITS[m.trait] || Core.TRAITS.grinder; let body = '';
  const pf = (m.prefs||[]).map(x => (Core.PREFS[x]||{}).n).filter(Boolean);
  if (S.mt==='prof') body = `${profileHTML(m)}${m.age >= 32 ? `<div class="card"><div class="row"><b>현역 은퇴</b><button class="btn sm sec" data-act="retire">은퇴하기</button></div><div class="dim">은퇴하면 명예의 전당에 오르고, 같은 세계에서 감독으로 이어서 할 수 있습니다.</div></div>` : ''}${(m.b11n || 0) ? `<div class="card"><b>⭐ 시즌 베스트11 ${m.b11n}회</b></div>` : ''}${(m.awards || []).length ? `<div class="card"><b>🏆 수상 경력</b>${m.awards.slice().reverse().map(a => `<div class="li dim">${esc(a[0])} ${esc(a[1])} — <b>${esc(a[2])}</b></div>`).join('')}</div>` : ''}<div class="card"><div class="row"><b>신체·성향</b><span class="tag">${tr.n}</span></div><div class="dim">키 ${m.h||178}cm · 선호 플레이: ${pf.length?pf.join(', '):'없음'}</div><div class="dim">${tr.d}</div></div>`;
  else if (S.mt==='grow') body = `${growCard(m)}${rivalCard(m)}${roleCard(m)}${potCard(m)}${mentorCard(m)}`;
  else if (S.mt==='fin') body = finCard(m);
  else body = `${achCard(m)}${meetLogCard(m)}`;
  return `<div class="top"><div class="ttl">내 선수</div></div>${subChips(S.mt, ME_TABS, 'mt')}<div class="body">${body}</div>`;
}
function growCard(m) {                                                                      // 성장 그래프: 월별 종합 능력치 + 처음 대비 많이 오른 능력치
  try { Core.ovrSnap(m); } catch (e) {}
  const h = (m.ovrH || []).slice(); if (h.length < 2) return `<div class="sec">성장 그래프</div><div class="card dim">한 달이 지나면 성장 기록이 쌓이기 시작합니다. (현재 종합 ${m.ovr})</div>`;
  const d0 = h[0][0], d1 = Math.max(d0 + 1, h[h.length - 1][0]), vmin = Math.min(...h.map(x => x[1])), vmax = Math.max(...h.map(x => x[1])), span = Math.max(8, vmax - vmin), lo = Math.max(0, vmin - Math.ceil(span * 0.25)), hi = Math.min(99, Math.max(vmax + Math.ceil(span * 0.25), (m.pot || 0) <= vmax + span ? (m.pot || 0) + 1 : 0));
  const X = d => 8 + (d - d0) / (d1 - d0) * 88, Y = v => 56 - (v - lo) / Math.max(1, hi - lo) * 50;
  const pts = h.map(x => `${X(x[0]).toFixed(1)},${Y(x[1]).toFixed(1)}`).join(' ');
  const yrs = []; { let py = null; h.forEach(x => { const y = Core.dateOf ? Core.dateOf(x[0]).y : null; if (y != null && y !== py) { yrs.push([x[0], y]); py = y; } }); }
  const potY = m.pot && m.pot <= hi ? Y(m.pot) : null;
  const svg = `<svg viewBox="0 0 100 64" class="gchart" preserveAspectRatio="none" style="width:100%;height:150px;background:var(--c2,#14241a);border-radius:10px"><g stroke="#ffffff" stroke-opacity=".12" stroke-width=".3">${[0, 1, 2, 3].map(i => `<line x1="8" x2="98" y1="${6 + i * 16.67}" y2="${6 + i * 16.67}"/>`).join('')}</g>${potY == null && m.pot ? `<text x="97" y="9" font-size="3.2" fill="#FFB27A" text-anchor="end">잠재력 ${m.pot} ↑</text>` : ''}${potY != null ? `<line x1="8" x2="98" y1="${potY.toFixed(1)}" y2="${potY.toFixed(1)}" stroke="#FFB27A" stroke-width=".4" stroke-dasharray="1.5 1.2"/><text x="97" y="${(potY - 1.2).toFixed(1)}" font-size="3.2" fill="#FFB27A" text-anchor="end">잠재력 ${m.pot}</text>` : ''}<polyline points="${pts}" fill="none" stroke="#C6F36B" stroke-width=".9" stroke-linejoin="round"/>${h.length < 40 ? h.map(x => `<circle cx="${X(x[0]).toFixed(1)}" cy="${Y(x[1]).toFixed(1)}" r=".9" fill="#C6F36B"/>`).join('') : ''}<text x="1" y="${(Y(hi) + 3).toFixed(1)}" font-size="3.2" fill="#9fb3a6">${hi}</text><text x="1" y="${Y(lo).toFixed(1)}" font-size="3.2" fill="#9fb3a6">${lo}</text>${yrs.map(([d, y]) => `<text x="${X(d).toFixed(1)}" y="63" font-size="3" fill="#9fb3a6">${y}</text>`).join('')}</svg>`;
  const a0 = m.a0 || {}, ups = Object.keys(m.a || {}).map(k => [k, (m.a[k] || 0) - (a0[k] == null ? m.a[k] : a0[k])]).filter(x => x[1] !== 0).sort((a, b) => b[1] - a[1]);
  const chip = ([k, v]) => `<span class="tag ${v < 0 ? 'warn' : ''}">${AT_KO[k] || k} ${v > 0 ? '+' : ''}${v}</span>`;
  return `<div class="sec">성장 그래프</div><div class="card">${svg}<div class="dim" style="margin-top:6px">시작 ${h[0][1]} → 현재 ${m.ovr} (${m.ovr - h[0][1] >= 0 ? '+' : ''}${m.ovr - h[0][1]})</div>${ups.length ? `<div class="dim" style="margin-top:6px">가장 많이 오른 능력치</div><div class="row g8 wrapx">${ups.slice(0, 5).map(chip).join('')}</div>${ups.filter(x => x[1] < 0).length ? `<div class="dim" style="margin-top:6px">떨어진 능력치</div><div class="row g8 wrapx">${ups.filter(x => x[1] < 0).slice(-3).map(chip).join('')}</div>` : ''}` : ''}</div>`;
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
const FS_OPT = [[0.9,'작게'],[1,'보통'],[1.15,'크게'],[1.3,'아주 크게']];
function fsGet() { try { const v = +localStorage.getItem('bfm_fs'); if (FS_OPT.some(o => o[0] === v)) return v; } catch (e) {} return 1; }
function fsApply() { document.documentElement.style.setProperty('--fs', String(fsGet())); }
fsApply();

// ================= 소리 (WebAudio 합성 · 외부 파일 없음) =================
const SND = { ctx: null, master: null, sfx: true, bgm: true, tm: null, nx: 0, st: 0 };
(function () { try { SND.sfx = localStorage.getItem('bfm_sfx') !== '0'; SND.bgm = localStorage.getItem('bfm_bgm') !== '0'; } catch (e) {} })();
function sndCtx() {
  if (SND.ctx) return SND.ctx;
  try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; SND.ctx = new AC(); SND.master = SND.ctx.createGain(); SND.master.gain.value = 0.6; SND.master.connect(SND.ctx.destination); } catch (e) { SND.ctx = null; }
  return SND.ctx;
}
function tone(f, t0, d, type, vol, fEnd, dest) {
  const c = SND.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t0);
  if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, t0 + d);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(g); g.connect(dest || SND.master); o.start(t0); o.stop(t0 + d + 0.03);
}
function noiseBurst(t0, d, vol, fc, fEnd) {
  const c = SND.ctx, n = Math.max(1, Math.floor(c.sampleRate * d)), buf = c.createBuffer(1, n, c.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(fc, t0); if (fEnd) f.frequency.linearRampToValueAtTime(fEnd, t0 + d); f.Q.value = 0.8;
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.25, d * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  src.connect(f); f.connect(g); g.connect(SND.master); src.start(t0);
}
function sfx(n) {
  if (!SND.sfx) return; const c = sndCtx(); if (!c) return; try { if (c.state === 'suspended') c.resume(); const t = c.currentTime;
    if (n === 'click') tone(740, t, 0.05, 'square', 0.04, 620);
    else if (n === 'goal') { noiseBurst(t, 1.9, 0.35, 700, 1500); [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.22, 'triangle', 0.16)); }
    else if (n === 'goalopp') { noiseBurst(t, 1.2, 0.18, 500, 300); tone(330, t, 0.5, 'sawtooth', 0.07, 150); }
    else if (n === 'whistle') { tone(2900, t, 0.16, 'sine', 0.13); tone(2900, t + 0.22, 0.4, 'sine', 0.13, 2700); }
    else if (n === 'save') { noiseBurst(t, 0.18, 0.25, 1800); tone(220, t, 0.14, 'triangle', 0.1, 120); }
    else if (n === 'shot') { noiseBurst(t, 0.12, 0.2, 900); tone(160, t, 0.1, 'triangle', 0.09, 90); }
    else if (n === 'coin') { tone(988, t, 0.09, 'square', 0.06); tone(1319, t + 0.09, 0.22, 'square', 0.06); }
    else if (n === 'crowd') { noiseBurst(t, 2.6, 0.2, 500, 1100); noiseBurst(t + 0.6, 2.0, 0.14, 900, 1400); }
    else if (n === 'trophy') { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.12, 0.3, 'triangle', 0.14)); noiseBurst(t + 0.4, 1.6, 0.25, 900, 1600); }
  } catch (e) {}
}
const BGM_CH = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]];
function bgmTick() {
  const c = SND.ctx; if (!c || !SND.bgm) return;
  if (S.matchOpen || document.visibilityState !== 'visible') { SND.nx = c.currentTime + 0.2; return; }
  if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
  const sp = 0.24;
  while (SND.nx < c.currentTime + 0.5) {
    const k = SND.st % 32, ch = BGM_CH[Math.floor(k / 8) % 4], step = k % 8, t = Math.max(SND.nx, c.currentTime + 0.02);
    if (step === 0) tone(ch[0] / 2, t, sp * 3.6, 'triangle', 0.05);
    tone(ch[[0, 1, 2, 1, 2, 1, 2, 1][step] % 3] * 2, t, sp * 0.9, 'square', 0.014);
    if (step === 4) tone(ch[1], t, sp * 3.5, 'triangle', 0.02);
    SND.nx += sp; SND.st++;
  }
}
function bgmApply() {
  if (SND.bgm) { const c = sndCtx(); if (!c) return; if (!SND.tm) { SND.nx = c.currentTime + 0.1; SND.tm = setInterval(bgmTick, 120); } }
  else if (SND.tm) { clearInterval(SND.tm); SND.tm = null; }
}
function sndSet(k, on) { SND[k] = on; try { localStorage.setItem('bfm_' + k, on ? '1' : '0'); } catch (e) {} if (k === 'bgm') bgmApply(); }
function settingsModal() {
  return `<div class="ttl">설정</div><div class="sec">저장·불러오기</div><div class="dim">자동 저장은 매 진행마다 이뤄집니다. 칸에 따로 저장해 두면 되돌릴 수 있어요.</div>${slotRows(true)}<div class="sec">백업 코드</div><div class="dim">앱을 지우고 다시 설치할 때를 대비해 코드를 복사해 두세요(메모 앱 등에 붙여넣기). 새로 설치한 뒤 아래 칸에 붙여넣고 복원하면 이어서 할 수 있습니다.</div><textarea id="bkbox" rows="3" style="width:100%;background:#101814;color:#EAF1EC;border:1px solid #2A3A30;border-radius:10px;padding:8px;font-size:11px" placeholder="백업 코드"></textarea><div class="row g8"><button class="btn sec" data-act="bkcopy" style="flex:1">백업 코드 복사</button><button class="btn sec" data-act="bkrestore" style="flex:1">코드로 복원</button></div><div class="sec">글자·버튼 크기</div><div class="row g8">${FS_OPT.map(([v,n])=>`<button class="btn ${fsGet()===v?'':'sec'}" data-act="fs" data-id="${v}" style="flex:1">${n}</button>`).join('')}</div><div class="dim">경기 화면 필드는 그대로, 메뉴·목록·버튼 크기만 바뀝니다.</div><div class="sec">소리</div><div class="row g8"><button class="btn ${SND.sfx?'':'sec'}" data-act="snd" data-id="sfx" style="flex:1">효과음 ${SND.sfx?'ON':'OFF'}</button><button class="btn ${SND.bgm?'':'sec'}" data-act="snd" data-id="bgm" style="flex:1">배경음악 ${SND.bgm?'ON':'OFF'}</button></div><div class="dim">경기 중에는 배경음악이 잠시 멈추고 경기 소리만 나옵니다.</div><div class="sec">경기 화면</div><div class="row g8">${['hy', 'lp'].map(k => `<button class="btn ${viewNow() === k ? '' : 'sec'}" data-act="mview" data-id="${k}" style="flex:1;white-space:nowrap">${VIEW_S[k]}</button>`).join('')}</div><div class="dim">로우폴리는 가볍고, 하이브리드는 조명·재질이 화려합니다. 하이브리드가 느린 폰에서는 자동으로 로우폴리로 바뀝니다. 그림만 바뀌고 경기 결과는 똑같습니다.</div><div class="sec">업데이트</div><div class="row g8" style="align-items:center"><div class="grow">현재 버전 <b>v${APP_VER}</b>${updNewer() ? ` <span class="tag">새 버전 v${esc(String(UPD.info.ver || ''))}</span>` : ''}</div><button class="btn sec" data-act="updchk">업데이트 확인</button></div><div class="dim">게임을 켤 때 새 버전이 있는지 자동으로 확인하고 알려드려요. 인터넷이 없으면 조용히 넘어갑니다.</div>${(() => { try { const g = G0(); if (!g || g.mode === 'mgr' || g.me == null) return ''; const m = Core.me(); const on = m.autoRest !== false; return `<div class="sec">선수 관리</div><div class="row g8" style="align-items:center"><div class="grow"><b>피로 자동 관리</b><div class="dim">피로가 80을 넘으면 55까지 자동으로 쉬어 갑니다.</div></div><button class="btn ${on ? '' : 'sec'}" data-act="autorest">${on ? 'ON' : 'OFF'}</button></div>`; } catch (e) { return ''; } })()}<div class="sec">게임</div><button class="btn sec wide" data-act="reset">새 게임 시작</button><div class="sec">사업자 정보</div><div class="card bizinfo"><div class="ddak l">${ddakLogo(34)}<b>딱알 솔루션</b></div><div class="dim">상호: 딱알 솔루션 | 대표: 양문희</div><div class="dim">사업자등록번호: 798-17-02137</div><div class="dim">통신판매업 신고: 제2024-광주동구-0120호</div><div class="dim">주소: 광주 동구 선교로 38-33 (선교동, 선교2차 우방아이유쉘 리포레) 207-1002</div><div class="dim">전화: 010-5642-4272 | 이메일: huraimuni@naver.com</div></div>`;
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
  if (S.cmid !== id) { S.cmid = id; S.cmt = 'sq'; }
  const tab = S.cmt || 'sq';
  const pl = c.pl.map(x => G.players[x]).filter(p => p && !p.mgr).sort((a, b) => POS_ORDER.indexOf(a.sub) - POS_ORDER.indexOf(b.sub) || b.ovr - a.ovr);
  const isMine = c.id === me.club;
  let tm = '', pos = 0;
  if (lg && lg.table[id]) { const tb = Core.sortedTable(lg), t = lg.table[id]; pos = tb.indexOf(id) + 1; tm = `<div class="tiles"><div class="tile"><div class="dim">순위</div><div class="big">${pos}</div><div class="s">/ ${tb.length}팀</div></div><div class="tile"><div class="dim">승점</div><div class="big">${t.pts}</div><div class="s">${t.p}경기</div></div><div class="tile"><div class="dim">승무패</div><div class="big s14">${t.w}-${t.d}-${t.l}</div></div><div class="tile"><div class="dim">득실</div><div class="big s14">${t.gf}:${t.ga}</div><div class="s">${t.gf - t.ga >= 0 ? '+' : ''}${t.gf - t.ga}</div></div></div>`; }
  const frm = (c.form5 || []).map(x => `<i class="fd ${x}">${x === 'W' ? '승' : x === 'D' ? '무' : '패'}</i>`).join('') || '<span class="dim">경기 전</span>';
  const hist = lg ? (lg.hist || []).filter(h => h.table.some(r => r[0] === id)) : [];
  const titles = hist.filter(h => h.champ === id).length;
  const hero = `<div class="chero" style="background:linear-gradient(135deg,${c.col},${c.col2})"><div class="cshade"></div><div class="crow">${crest(c, 56)}<div><div class="ctn">${esc(c.name)}${isMine ? ' <span class="tag">마이팀</span>' : ''} <button class="btn sm sec" data-act="rnopen" data-id="c:${c.id}" aria-label="이름 변경">✏</button></div><div class="cdn">${lg ? esc(lg.name) : '대표팀'} · ${Core.stageOf(c)}${regionOf(c) ? ' · ' + esc(regionOf(c)) : ''}</div></div></div><div class="cmeta"><span>전력 <b>${Math.round(c.strength)}</b></span><span>선수 <b>${pl.length}명</b></span><span>우승 <b>${titles ? '🏆'.repeat(Math.min(titles, 5)) + (titles > 5 ? '×' + titles : '') : '0'}</b></span></div></div>`;
  const TABS = [['sq', '선수단'], ['rec', '기록'], ['his', '역사']];
  const tabs = `<div class="chips">${TABS.map(([k, n]) => `<button class="chip ${tab === k ? 'on' : ''}" data-act="cmt" data-id="${k}">${n}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 'sq') {
    const mgrN = (G.mode === 'mgr' && isMine) ? 1 : 0;
    body = `<div class="pgrid">${pl.map(p => `<div class="pcard ${p.me ? 'me' : ''}" data-act="pl" data-id="${p.id}"><div class="pov ${p.ovr >= 80 ? 'g' : p.ovr >= 70 ? 's' : ''}">${p.ovr}</div>${sprH(p, c, 30)}<div class="pnm">${esc(p.name)}</div><div class="psb"><span class="tag pos">${p.sub}</span> ${p.age}세</div>${p.inj > 0 ? '<i class="pinj">🩹</i>' : ''}</div>`).join('')}</div>`;
  } else if (tab === 'rec') {
    const top = (k, n) => pl.slice().sort((a, b) => b.st[k] - a.st[k]).filter(p => p.st[k] > 0).slice(0, n);
    const board = (title, ic, arr, f) => `<div class="sec">${ic} ${title}</div><div class="card">${arr.map((p, i) => `<div class="sqr mini" data-act="pl" data-id="${p.id}"><b style="width:18px">${i + 1}</b>${sprH(p, c, 18)}<div class="grow">${esc(p.name)} <span class="dim">${p.sub}</span></div><b>${f(p)}</b></div>`).join('') || '<div class="dim">아직 기록이 없습니다.</div>'}</div>`;
    const rated = pl.filter(p => p.st.a >= 3).sort((a, b) => b.st.rs / b.st.a - a.st.rs / a.st.a).slice(0, 5);
    body = board('득점 순위', IC.ball, top('g', 5), p => p.st.g + '골') + board('도움 순위', IC.boot, top('as', 5), p => p.st.as + '도움') + board('평균 평점', IC.star, rated, p => f1(p.st.rs / p.st.a)) + board('출전 경기', '👟', top('a', 5), p => p.st.a + '경기');
  } else {
    const rows = hist.slice().reverse().map(h => { const rk = h.table.findIndex(r => r[0] === id) + 1; return `<tr><td>${esc(h.season)}</td><td><b>${rk}위</b>${rk === 1 ? ' 🏆' : ''}</td><td>${h.table[rk - 1][1]}점</td><td>${clubLink(h.champ)}</td></tr>`; }).join('');
    body = `<div class="sec">시즌별 성적</div>${rows ? `<table class="tb"><tr><th>시즌</th><th>순위</th><th>승점</th><th>우승팀</th></tr>${rows}</table>` : '<div class="dim">아직 지난 시즌 기록이 없습니다. 시즌이 끝나면 쌓입니다.</div>'}`;
    if ((c.legends || []).length) body = `<div class="sec">🏛️ 구단 레전드 · 영구결번</div><div class="card">${c.legends.slice().reverse().map(l => `<div class="li"><span class="tag">#${l.no}</span> <b>${esc(l.name)}</b>${l.me ? ' <span class="tag">나</span>' : ''} <span class="dim">${l.s}시즌 ${l.a}경기 ${l.g}골 · ${l.y}년 은퇴</span></div>`).join('')}</div>` + body;
    if (isMine && G.mode === 'mgr' && G.mgr.seasons.length) body += `<div class="sec">감독 기록</div><div class="card">${G.mgr.seasons.slice().reverse().map(s => `<div class="li">${esc(s.season)} · ${esc(s.club)} ${s.rank}위 (목표 ${s.target}위) <span class="tag ${s.ok ? '' : 'warn'}">${s.ok ? '달성' : '미달'}</span></div>`).join('')}</div>`;
  }
  return hero + tm + `<div class="crow2"><span class="dim">최근 5경기</span><span class="fds">${frm}</span></div>` + tabs + body;
}
function setupView() {
  const n = S.sel.length, est = S.sel.reduce((s,c)=>s+(c==='KOR'?1560:c==='USA'?1250:1380),0) + (S.sel.some(c=>CO[c].slots>0)?300:0);
  const cards = Core.CODES.map(c => { const C = CO[c], on = S.sel.includes(c); return `<button class="opt ${on?'on':''}" data-act="sel" data-id="${c}"><b>${on?'✓ ':''}${Core.FLAG[c]||''} ${C.name}</b><span class="dim">${C.l1.name}${C.l2?' · '+C.l2.name:''}</span></button>`; }).join('');
  return `<div class="top"><div class="ttl">월드 설정 <span class="dim">${S.mode==='mgr'?'· 감독 모드':'· 선수 육성'}</span></div><div class="dim">${n}/10개국</div></div><div class="body"><div class="dim">진행할 나라를 최대 10개까지 고르세요. 고른 나라의 1부·2부·유스 리그, 컵대회, 승강제가 전부 정밀 시뮬레이션되고, 선택하지 않은 나라는 만들어지지 않습니다.</div><div class="opts">${cards}</div><div class="card"><div class="dim">예상 선수 수 약 ${est.toLocaleString()}명 · 대륙대회(유럽·아시아·아프리카·남미·북중미)는 선택한 나라 팀과 외부 초청팀이 함께 참가합니다. 월드 생성에 몇 초가 걸립니다.</div></div><button class="btn wide" data-act="world" ${n<1?'disabled':''}>이 월드로 시작하기</button><button class="btn sec wide" data-act="modeback">← 모드 다시 고르기</button>${Object.keys(S.slots||{}).length?`<div class="sec">저장된 게임 불러오기</div>${slotRows(false)}`:''}</div>`;
}
const NAT_CONT = { EU: 'ENG ESP ITA GER FRA NED POR BEL CRO SRB DEN SUI SCO AUT TUR POL SWE NOR CZE GRE UKR RUS ROU HUN IRL WAL NIR FIN SVK SVN BIH ALB MKD MNE BUL ISL', AS: 'KOR JPN CHN AUS IRN SAU QAT VNM THA UZB IRQ UAE KSA IND IDN MAS', AF: 'EGY MAR RSA SEN NGA GHA CIV ALG TUN CMR MLI', SA: 'BRA ARG COL URU CHI PAR ECU PER VEN BOL', NA: 'USA MEX CAN CRC JAM HON PAN' };
function natToCc(nat) {                                                   // 국적 → 가장 가까운 선택 리그(같은 나라 > 같은 대륙에서 가장 강한 리그)
  if (S.sel.includes(nat)) return nat;
  let cont = CO[nat] && CO[nat].cont; if (!cont) for (const k in NAT_CONT) if (NAT_CONT[k].split(' ').includes(nat)) cont = k;
  const same = S.sel.filter(x => CO[x] && CO[x].cont === cont).sort((a, b) => (CO[b].l1.mean || 0) - (CO[a].l1.mean || 0));
  return same[0] || null;
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
// 포메이션별 선수 배치(x: 자기 골문 0 → 상대 골문 100, y: 0~100)
const FXY_CACHE = {};
function formXY(id) {
  if (FXY_CACHE[id]) return FXY_CACHE[id];
  const lines = id.split('-').map(Number), L = lines.length, slots = E.FORMATIONS[id] || E.FORMATIONS['4-4-2'];
  const xs = L === 3 ? [21, 44, 66] : L === 4 ? [21, 38, 52, 67] : [21, 36, 48, 58, 68];
  const ys = { 1: [50], 2: [36, 64], 3: [22, 50, 78], 4: [12, 37, 63, 88], 5: [10, 30, 50, 70, 90] };
  const out = [{ sub: 'GK', x: 5, y: 50 }]; let k = 1;
  lines.forEach((n, li) => { for (let j = 0; j < n; j++, k++) out.push({ sub: slots[k], x: xs[li], y: (ys[n] || ys[4])[j] }); });
  return (FXY_CACHE[id] = out);
}
// 현재 선수들의 포지션(sub)에 맞춰 포메이션 좌표를 배정
function fpos(st, formId) {
  const pool = formXY(formId).slice(), res = [];
  st.forEach((p, i) => {
    let ix = pool.findIndex(q => q && q.sub === p.sub);
    if (ix < 0) ix = pool.findIndex(q => q && q.sub !== 'GK' && p.sub !== 'GK');
    if (ix < 0) { res[i] = FORM[Math.min(i, FORM.length - 1)]; return; }
    res[i] = [pool[ix].x, pool[ix].y]; pool[ix] = null;
  });
  return res;
}
function fxy(pre, i) { const a = MV && MV.fxy && MV.fxy[pre]; return (a && a[i]) || FORM[Math.min(i, FORM.length - 1)]; }
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
function pickPitch(M) { const h = M.h; let x = ((h.id | 0) * 2654435761) >>> 0, hs = (x >>> 7) % 8; if (h.lg === 'KHS' || h.kind === 'youth') hs = [0, 3, 5, 4, 1, 3][(x >>> 5) % 6]; return PITCHES[hs] || PITCHES[0]; }
function pitchBg(pt) { const st = pt.pat, rect = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`; let o = '';
  if (st === 'v') for (let i = 0; i < 8; i++) o += rect(i * 12.5, 0, 12.5, 64, i % 2 ? pt.b : pt.a);
  else if (st === 'h') for (let i = 0; i < 8; i++) o += rect(0, i * 8, 100, 8, i % 2 ? pt.b : pt.a);
  else if (st === 'c') for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) o += rect(i * 12.5, j * 16, 12.5, 16, (i + j) % 2 ? pt.b : pt.a);
  else o = rect(0, 0, 100, 64, pt.a) + `<g fill="${pt.b}" fill-opacity=".5">${[[12, 10], [40, 50], [70, 20], [85, 48], [25, 36], [58, 8]].map(q => `<ellipse cx="${q[0]}" cy="${q[1]}" rx="7" ry="3"/>`).join('')}</g>`;
  return `<rect width="100" height="64" fill="${pt.base}"/>` + o + (viewHy() ? hyPitchFx() : ''); }
// ---- 경기 화면 보기 방식(그림만 바뀜, 결과·엔진과 무관): 기존 2D / 하이브리드 2D / 3D ----
function skinGet() { try { const v = localStorage.getItem('bfm_skin'); if (v === 'old' || v === 'hy') return v; } catch (e) {} return 'hy'; }
function gfxGet() { try { const v = localStorage.getItem('bfm_gfx'); if (v === 'lp' || v === 'hy') return v; } catch (e) {} return 'hy'; }   // 3D 그림 방식: 하이브리드(기본)·로우폴리
function viewHy() { return true; }                                             // 비상용 2D(3D가 멈춘 경기)는 하이브리드 2D 그림
function viewNow() { return S.gfx || (S.gfx = gfxGet()); }
const VIEW_N = { hy: '하이브리드 3D', lp: '로우폴리 3D' };
const VIEW_S = { hy: '하이브리드', lp: '로우폴리' };                       // 버튼용 짧은 이름(폰에서 두 줄로 쌓이지 않게)
function viewSet(id) {
  if (id === 'hy' || id === 'lp') S.gfx = id;
  try { localStorage.setItem('bfm_gfx', viewNow()); } catch (e) {}
  viewApply();
}
function viewApply() { viewNow(); const mt = $('#match'); if (mt) mt.classList.add('hy'); try { if (typeof V3D !== 'undefined') V3D.sync(); } catch (e) {} }
function hyPitchFx() {                                                                     // 하이브리드: 야간 조명·비네팅·잔디 결 (경기장 크기·좌표는 그대로)
  return `<defs><radialGradient id="hyV" cx="50%" cy="50%" r="72%"><stop offset="58%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".5"/></radialGradient><radialGradient id="hyL"><stop offset="0" stop-color="#FFF4D6" stop-opacity=".26"/><stop offset="1" stop-color="#FFF4D6" stop-opacity="0"/></radialGradient><linearGradient id="hyS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient></defs>`
    + `<rect width="100" height="64" fill="#06120B" fill-opacity=".22"/><rect width="100" height="64" fill="url(#hyS)"/>${[[0, 0], [100, 0], [0, 64], [100, 64]].map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="34" fill="url(#hyL)"/>`).join('')}<rect width="100" height="64" fill="url(#hyV)"/>`;
}
function hyPitchLines() {                                                                  // 하이브리드: 페널티 지점·아크·골대
  return `<g fill="none" stroke="#fff" stroke-opacity=".9" stroke-width=".35"><path d="M15 26.2A6 6 0 0 1 15 37.8"/><path d="M85 26.2A6 6 0 0 0 85 37.8"/><rect x="-.2" y="28.4" width="1.2" height="7.2" stroke-width=".3" fill="#fff" fill-opacity=".18"/><rect x="99" y="28.4" width="1.2" height="7.2" stroke-width=".3" fill="#fff" fill-opacity=".18"/></g><g fill="#fff" fill-opacity=".9"><circle cx="11" cy="32" r=".35"/><circle cx="89" cy="32" r=".35"/><circle cx="50" cy="32" r=".35"/></g>`;
}
function blockFig(col, sk, hr, ol, legs) {                                                 // 블록 선수 그림(기존/하이브리드)
  if (!viewHy()) return `<rect x="-1.4" y="-1.4" width="2.8" height="2.9" fill="${col}" stroke="${ol}" stroke-width="0.28"/><rect x="-1.1" y="-4" width="2.2" height="2.3" fill="${sk}" stroke="${ol}" stroke-width="0.22"/><rect x="-1.1" y="-4" width="2.2" height="0.8" fill="${hr}"/><rect x="-1.2" y="1.5" width="1" height="1.5" fill="${legs}"/><rect x="0.2" y="1.5" width="1" height="1.5" fill="${legs}"/>`;
  return `<ellipse cy="3.1" rx="2" ry=".6" fill="#000" fill-opacity=".38"/><rect x="-1.2" y="1.5" width="1" height="1.5" rx=".15" fill="${legs}"/><rect x="0.2" y="1.5" width="1" height="1.5" rx=".15" fill="${legs}"/><rect x="-1.4" y="-1.4" width="2.8" height="2.9" rx=".25" fill="${col}" stroke="${ol}" stroke-width="0.2"/><rect x="-1.3" y=".35" width="2.6" height="1.05" fill="#000" fill-opacity=".22"/><rect x="-1.3" y="-1.3" width=".5" height="1.6" fill="#fff" fill-opacity=".2"/><rect x="-1.1" y="-4" width="2.2" height="2.3" rx=".2" fill="${sk}" stroke="${ol}" stroke-width="0.16"/><rect x=".35" y="-3.25" width=".7" height="1.5" fill="#000" fill-opacity=".14"/><rect x="-1.1" y="-4" width="2.2" height="0.8" rx=".15" fill="${hr}"/>`;
}
// 명단·카드용 골키퍼 유니폼: 구단 색과 겹치지 않는 색을 고정 선택
function gkKitFor(c) {
  const GKC = ['#F2C230', '#2BD9C5', '#C77DFF', '#FF8A3D', '#E94F9E', '#1A1A1A'];
  const av = [c.col, c.col2].filter(Boolean); const pick = GKC.slice().sort((x, y) => Math.min(...av.map(a => cdist(y, a))) - Math.min(...av.map(a => cdist(x, a))))[0];
  return [pick, '#1A1A1A'];
}
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
// ---- 심판: 주심 1명(공을 따라 대각선으로 이동) + 부심 2명(터치라인, 각자 반쪽 담당) ----
function susTag(p) { const s = p && p.sus; if (!s) return ''; const n = (G.wc ? s.n : s.c) || 0; return n > 0 ? ` <span class="tag warn">🟥 징계 ${n}경기</span>` : (p.yc && (G.wc ? p.yc.n : p.yc.c) >= (G.wc ? 1 : 4) ? ` <span class="tag">🟨${G.wc ? p.yc.n : p.yc.c}</span>` : ''); }
function refCol() { const K = MV.kit, av = [K.m[0], K.o[0], K.gk.m, K.gk.o, MV.pitch.base]; return ['#1A1A1A', '#F2E14C', '#E94F9E', '#2BD9C5', '#FF8A3D'].sort((x, y) => Math.min(...av.map(c => cdist(y, c))) - Math.min(...av.map(c => cdist(x, c))))[0]; }
function refHTML() { const c = refCol(), ol = c === '#1A1A1A' ? '#fff' : '#000';
  const fig = (id, s, flag) => `<g id="${id}" transform="translate(50 32)"><g transform="scale(${s})">${blockFig(c, '#E8B98C', '#2B2420', ol, '#111')}${flag ? '<path d="M1.6 -3.2 V0.4" stroke="#333" stroke-width=".3"/><rect x="1.6" y="-3.2" width="1.6" height="1.1" fill="#FF5A2E"/>' : ''}</g>${id === 'refM' ? '<rect id="refC" x="-0.9" y="-8.4" width="1.8" height="2.5" rx=".2" fill="#F2D21B" stroke="#000" stroke-width=".25" opacity="0"/>' : ''}</g>`;
  return fig('refA1', .62, 1) + fig('refA2', .62, 1) + fig('refM', .7, 0); }
function refStep(M, dt) {                                                                  // 심판 위치 갱신(매 프레임)
  const b = MV.ball; if (!MV.ref) MV.ref = { x: 44, y: 40, a1: 50, a2: 50 }; const R = MV.ref; if (MV.intro && MV.introRef) return;
  const d = MV.poss === 'o' ? -dM_(M) : dM_(M); let tx = b.x - d * 9, ty = b.y + (b.y < 32 ? 11 : -11);
  if (MV.sp) { tx = MV.sp.sx - MV.sp.d * 7; ty = MV.sp.sy + (MV.sp.sy < 32 ? 8 : -8); }
  const rc = MV.refCard; if (rc && rc.until > MV.t) { const st = rc.ms ? MV.mst : MV.ost, i = st.indexOf(rc.p), q = i >= 0 && MV.pos[rc.ms ? 'm' : 'o'][i]; if (q) { tx = q.x + 3; ty = q.y + 1; } }
  if (MV.over || MV.goalRes || MV.cele) { tx = 50 - dM_(M) * 4; ty = 40; }
  tx = clampN(tx, 4, 96); ty = clampN(ty, 4, 60); const dx = tx - R.x, dy = ty - R.y, dd = Math.hypot(dx, dy), v = Math.min(dd, (dd > 10 ? 13 : 8) * dt); if (dd > 0.05) { R.x += dx / dd * v; R.y += dy / dd * v; }
  const tA1 = clampN(b.x, 50, 98), tA2 = clampN(b.x, 2, 50); R.a1 += clampN(tA1 - R.a1, -10 * dt, 10 * dt); R.a2 += clampN(tA2 - R.a2, -10 * dt, 10 * dt);
  const E = MV.refEl || (MV.refEl = { m: document.getElementById('refM'), a1: document.getElementById('refA1'), a2: document.getElementById('refA2'), c: document.getElementById('refC') });
  if (E.m) E.m.setAttribute('transform', `translate(${R.x.toFixed(2)} ${R.y.toFixed(2)})`); if (E.a1) E.a1.setAttribute('transform', `translate(${R.a1.toFixed(2)} 63.2)`); if (E.a2) E.a2.setAttribute('transform', `translate(${R.a2.toFixed(2)} 1.6)`);
  if (E.c) { const on = rc && rc.until > MV.t; E.c.setAttribute('opacity', on ? '1' : '0'); if (on) E.c.setAttribute('fill', rc.c === 'r' ? '#E0262F' : '#F2D21B'); }
}
function pitchHTML(M) {
  const dots = (st, col0, pre) => st.map((p,i) => { const col = p.sub === 'GK' ? MV.kit.gk[pre] : col0; const lk = lookOf(p), sk = '#' + SKIN_C[lk.skin], hr = '#' + HAIR_C[lk.hair], ol = pre==='o' ? '#fff' : '#000';
    const fig = blockFig(col, sk, hr, ol, '#232A26');
    return p.me ? `<g class="dot me" id="${pre}${i}" transform="translate(50 32)"><g transform="scale(.76)">${fig}</g><path d="M0 -6.6 L-1.5 -8.6 L1.5 -8.6 Z" fill="#FFE45C"/><text y="-9.4" text-anchor="middle" font-size="3.4" font-weight="800" fill="#FFE45C" stroke="#000" stroke-width="0.5" paint-order="stroke">나</text></g>` : `<g class="dot" id="${pre}${i}" transform="translate(50 32)"><g transform="scale(.76)">${fig}</g></g>`; }).join('');
  return `<div class="pwrap"><svg id="pitch" viewBox="0 0 100 64" preserveAspectRatio="xMidYMid meet">${pitchBg(MV.pitch)}<g fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".4"><rect x="1" y="1" width="98" height="62"/><path d="M50 1V63"/><circle cx="50" cy="32" r="8"/><rect x="1" y="17" width="14" height="30"/><rect x="85" y="17" width="14" height="30"/><rect x="1" y="25" width="5" height="14"/><rect x="94" y="25" width="5" height="14"/></g>${viewHy() ? hyPitchLines() : ''}<line id="pline" x1="0" y1="0" x2="0" y2="0" stroke="#fff" stroke-opacity="0" stroke-width=".4" stroke-dasharray="1.2 1"/><ellipse id="bsh" rx=".85" ry=".4" fill="#000" fill-opacity=".28" transform="translate(50 32)"/>${dots(MV.ost, MV.kit.o[0], 'o')}${dots(MV.mst, MV.kit.m[0], 'm')}${refHTML()}<g id="ball" transform="translate(50 32)"><circle r=".85" fill="#fff" stroke="#000" stroke-width="${viewHy() ? '.2' : '.28'}"/>${viewHy() ? '<circle r=".3" fill="#1d232b"/><circle cx="-.3" cy="-.32" r=".22" fill="#fff" fill-opacity=".9"/>' : ''}</g><text id="rpl" x="50" y="7" text-anchor="middle" font-size="4" font-weight="900" fill="#FFE45C" stroke="#000" stroke-width=".6" paint-order="stroke" opacity="0">⏪ 리플레이 · 탭해서 넘기기</text><text id="blbl" text-anchor="middle" font-size="3" font-weight="800" fill="#fff" stroke="#000" stroke-width=".55" paint-order="stroke" opacity="0" transform="translate(50 28)"></text></svg><div id="fx"></div></div>`;
}
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// ---- 연속 이동 엔진: 포메이션 기준점 + 공 영향 + 역할 + 스티어링(속도/가속), 매 프레임 갱신 ----
const ROLE_U = { GK: [2, 14], CB: [10, 60], FB: [10, 82], DM: [18, 70], CM: [20, 84], AM: [28, 90], W: [25, 96], ST: [38, 97] };
const SUBX = { ST: 9, W: 5, AM: 4, CM: 0, DM: -5, FB: -2, CB: -6, GK: 0 };
const FTS = { ST: [89, 7], W: [85, 0], AM: [77, 11], CM: [63, 0], FB: [70, 0], DM: [54, 0], CB: [44, 10] };   // 공격 3분의 1 지역에서의 팀 구조(자기 편 기준 좌표)
const PA = (p, k) => (p && p.a && p.a[k]) || 50;
const uOf = (x, d) => d > 0 ? x : 100 - x;
const dM_ = (M) => (M.mineHome ? 1 : -1) * (MV && MV.flip ? -1 : 1);                       // 후반·연장 후반에는 진영이 바뀜
const tsOf = () => (MV && (MV.fast || MV.hlFast)) ? 4 : (S.spd || 1);
const TK_DEF = { width: 1, build: 1, line: 1, press: 1, tempo: 1, ment: 1, trans: 1 }, DEPTHW = { GK: 0, CB: 1, FB: .9, DM: .8, CM: .6, AM: .4, W: .35, ST: .3 };
const tkOf = c => Object.assign({}, TK_DEF, (c && c.tactic) || {});                         // 전술 지시(폭·빌드업·라인·압박·템포·멘탈리티·전환)를 경기 화면 움직임에 반영
const TK = pre => (MV && MV.tk && MV.tk[pre]) || TK_DEF;
function initPos(M) {
  MV.tk = { m: tkOf(M.mine), o: tkOf(M.opp) };
  MV.tacR = { m: Core.mgrAbil(M.mine).tac, o: Core.mgrAbil(M.opp).tac };
  const dM = dM_(M); MV.pos = { m: [], o: [] }; MV.tgt = { m: [], o: [] }; MV.run = {};
  { const fm = (M.mine && M.mine.tactic && M.mine.tactic.formation) || '4-4-2', fo = (M.opp && M.opp.tactic && M.opp.tactic.formation) || '4-4-2'; MV.fxy = { m: fpos(MV.mst, fm), o: fpos(MV.ost, fo) }; }
  const f = (st, pre, d) => st.forEach((p, i) => { const b = fxy(pre, i); MV.pos[pre][i] = { x: d > 0 ? b[0] : 100 - b[0], y: b[1] * 0.64, vx: 0, vy: 0 }; });
  f(MV.mst, 'm', dM); f(MV.ost, 'o', -dM);
  const k = Math.min(6, MV.mst.length - 1); MV.holder = null; MV.act = { k: 'pass', to: { s: 'm', i: k }, sp: 40 }; MV.poss = 'm'; MV.dec = 0.6;
}
function runOf(key, p, d, atk, sub) {
  let r = MV.run[key]; if (r && r.until > MV.t) return r;
  const amp = sub === 'CB' ? 3 : sub === 'FB' ? 5 : sub === 'DM' ? 5 : sub === 'CM' ? 7 : 9, fw = atk ? (PA(p, 'OTB') - 40) / 60 : -0.25;
  return MV.run[key] = { dx: d * amp * (rnd2() * 1.2 - 0.4 + fw * 0.8) * 0.7, dy: (rnd2() * 2 - 1) * amp * (0.5 + PA(p, 'WOR') / 140), until: MV.t + 1.6 + rnd2() * 2.6 };
}
function retarget(M) {
  if (MV.pen) { penTargets(M); return; }
  try { runsUpdate(M); scanUpdate(M); } catch (e) {}
  const b = MV.ball, pos = MV.pos, act = MV.act, kick = MV.kick > 0, hold = MV.holder, D = { m: dM_(M), o: -dM_(M) }, SS = { m: MV.mst, o: MV.ost };
  const line = {};                                       // 오프사이드 라인: 상대 최종 수비수 위치
  for (const pre of ['m', 'o']) { const op = pre === 'm' ? 'o' : 'm'; let mx = 55; SS[op].forEach((p, i) => { const q = pos[op][i]; if (i === 0 || !q || MV.red[op + i]) return; mx = Math.max(mx, uOf(q.x, D[pre])); }); line[pre] = Math.max(mx, uOf(b.x, D[pre])); }
  const place = (pre) => {
    const st = SS[pre], d = D[pre], atk = MV.poss === pre, op = pre === 'm' ? 'o' : 'm', ball = uOf(b.x, d), fin = atk && ball > 64 && !kick;
    const hp = hold && hold.s === pre && pos[pre][hold.i] ? pos[pre][hold.i] : null;
    const near = st.map((p, i) => ({ i, d2: pos[pre][i] ? (pos[pre][i].x - b.x) ** 2 + (pos[pre][i].y - b.y) ** 2 : 1e9 })).filter(o => st[o.i].sub !== 'GK' && !MV.red[pre + o.i]).sort((a, c) => a.d2 - c.d2).map(o => o.i);
    const taken = new Set(), foes = SS[op].map((p, j) => ({ j, q: pos[op][j] })).filter(o => o.j !== 0 && o.q && !MV.red[op + o.j]);
    st.forEach((p, i) => { const f = fxy(pre, i);
      const A = (k) => PA(p, k), sub = p.sub || 'CM', gk = sub === 'GK', isH = hold && hold.s === pre && hold.i === i, wideY = (f[1] * 0.64 < 32) ? 1 : -1;
      let u = f[0] + (SUBX[sub] || 0), y = f[1] * 0.64, sprint = false, chase = null;
      const T = TK(pre), Lh = T.line - 1, Pr = T.press - 1, Wd = T.width - 1, Mn = T.ment - 1, Tr = T.trans - 1;
      if (sub === 'W' || sub === 'FB') y = wideY > 0 ? 8 + (sub === 'FB' ? 3 : 0) - Wd * 2.5 : 56 - (sub === 'FB' ? 3 : 0) + Wd * 2.5;
      if (!kick) {
        const lineK = gk ? 0.1 : 0.2 + (70 - A('POS')) / 260 + (sub === 'CB' ? -0.06 : sub === 'ST' ? 0.05 : 0);
        u += (ball - 50) * (0.18 + lineK); y += (b.y - y) * (gk ? 0.3 : 0.18);
        if (!gk && !atk) { const gp = ({ CB: 0, FB: -1, DM: 10, CM: 17, AM: 22, W: 26, ST: 28 })[sub]; u += (c01(ball * 0.6 - 4 + (gp == null ? 17 : gp), 6, 92) - u) * 0.7; }   // 수비 블록: 공 위치를 따라 라인 간격(약 10~17)을 유지하며 함께 오르내림
        if (!gk) { const dw = DEPTHW[sub] || 0.5; u += atk ? Mn * 2.5 * dw + Lh * 2 * (sub === 'CB' || sub === 'FB' ? 1 : 0.3) : Lh * 7 * dw + Mn * 2.2 * dw; y = 32 + (y - 32) * (1 + Wd * (atk ? 0.14 : 0.07)); }   // 라인 높이·멘탈리티·폭
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
            else if (sub === 'CB') u = Math.min(u, Math.max(ball - (24 - Lh * 5), 8));
            if (fin && FTS[sub] && !isH) { const t = FTS[sub]; const ty = t[1] === 0 ? (sub === 'W' ? (cutIn > 10 ? (wideY > 0 ? 17 : 47) : (wideY > 0 ? 9 : 55)) : sub === 'FB' ? (wideY > 0 ? 10 : 54) : f[1] * 0.64) : 32 + (i % 2 ? 1 : -1) * t[1]; u = u * 0.3 + t[0] * 0.7; y = y * 0.3 + ty * 0.7; }
            if (hp && !isH) { const hu = uOf(hp.x, d), dx = hu - u, dy = hp.y - y, dist = Math.hypot(dx, dy);
              if (dist > 9 && (sub === 'AM' || sub === 'CM' || sub === 'DM' || sub === 'W')) { const k = clampN((A('VIS') + A('PAS') - 80) / 260, 0.05, 0.4); u += dx * k; y += dy * k; } }
            if (isH && (!MV.paused || MV.pg)) { if (MV.pg && hp) { u = Math.max(u + 16, uOf(hp.x, d) + 15); if (!(MV.pg.pp && MV.pg.pp.as)) y = hp.y + (32 - hp.y) * 0.35; else y = hp.y; sprint = true; } else { u += MV.pg ? 16 : 7; const cr = MV.carry; if (!MV.pg && cr && cr.s === pre && cr.i === i && cr.until > MV.t) { u += PX_CFG.carry.push; if (ball > 50) y += ((Math.abs(y - 32) > 18 ? (y < 32 ? 21 : 43) : 32) - y) * PX_CFG.carry.inward; } } }                                                     // 공 가진 선수는 드리블로 전진
            if (!isH) { const pmv = MV.pm && MV.pm[pre + i], rn = MV.runs && MV.runs[pre + i];                       // 패스 앤 무브 / 미리 뛰는 침투
              if (rn && rn.t0 <= MV.t && rn.until > MV.t) { u = rn.tu; y = rn.ty; sprint = true; } else if (pmv && pmv.until > MV.t) { u = pmv.u; y = pmv.y; sprint = true; } }
            if (!isH) { const rn2 = MV.runs && MV.runs[pre + i]; u = Math.min(u, line[pre] + (rn2 && rn2.early && rn2.t0 <= MV.t && rn2.until > MV.t ? PX_CFG.run.earlyAhead : 0.5)); }                                                  // 오프사이드 라인 지킴(공이 나에게 나가면 아래 '받으러 감'에서 풀림)
          } else {
            if (sub === 'ST' || sub === 'W') u -= (A('WOR') > 60 ? 8 : 2) * (1 - 0.7 * Math.max(0, Tr)) + (Tr < 0 ? -Tr * 3 : 0);   // 역습 지향이면 공격수가 앞에 남음
            if (sub === 'CB' || sub === 'DM') u += (A('POS') > 62 ? 3 : 0);
            else if (sub === 'CM') u += (ball - u) * 0.12;
            y += (b.y - y) * 0.12;
          }
          if (atk && Tr > 0 && MV.tOverS === pre && MV.t - (MV.tOver || -99) < 5 && (sub === 'ST' || sub === 'W' || sub === 'AM') && !isH) { u += 7 * Tr; sprint = true; }   // 공 탈취 직후 빠른 역습 침투
          if (act && act.k === 'pass' && act.to.s === pre && act.to.i === i) { if (act.px != null) { const au = uOf(act.px, d), mt = (act.lead || act.thrC) ? 0 : PX_CFG.aim.meet; u = au + (ball - au) * mt; y = act.py + (b.y - act.py) * mt; } else { u += (ball - u) * 0.2; y += (b.y - y) * 0.2; } sprint = true; }   // 도착 지점으로 달려감(공간 패스는 마중 안 함, 발밑 패스는 1~3걸음)
        }
        const tired = clampN((60 - A('STA')) / 120 * (MV.min / 90), 0, 0.35); u = f[0] + (u - f[0]) * (1 - tired);
      } else sprint = true;
      let x = d > 0 ? u : 100 - u;
      if (!kick && !gk && !atk) {
        const ci = near.indexOf(i);
        const pressOn = Pr >= 0 || uOf(b.x, d) < 58;
        const soft = !!(MV.pg && MV.pg.s !== pre);                                                   // 득점 연출 중 수비측은 공을 둘러싸 막지 않고 물러서 대기(공 든 선수가 한 곳에서 제자리 맴돌지 않게)                                                   // 압박 낮음: 자기 진영에서만 압박
        if (!soft && ci === 0 && pressOn) { const J = PX_CFG.jockey, me0 = pos[pre][i], hd = me0 ? Math.hypot(me0.x - b.x, me0.y - b.y) : 99;
          if (hd <= J.dist && hold && hold.s !== pre) { x = b.x - d * J.gap; y = b.y + (32 - b.y > 0 ? 1 : -1) * J.inside; (MV.jk || (MV.jk = {}))[pre + i] = MV.t + 0.3; } else { x = b.x; y = b.y; sprint = true; } }                                                // 가장 가까운 선수는 공 압박
        else if (!soft && ci === 1 && pressOn) { const k = clampN((0.35 + (A('AGG') + A('WOR') - 80) / 220) * (1 + Pr * 0.3), 0.15, 0.9); x += (b.x - x) * k; y += (b.y - y) * k; }
        else if (!soft && ci === 2 && Pr > 0) { const k = clampN(0.3 + (A('AGG') + A('WOR') - 80) / 300, 0.2, 0.6); x += (b.x - x) * k; y += (b.y - y) * k; }   // 높은 압박: 세 번째 선수까지 가담
        else { let best = null, bd = 24; foes.forEach(o => { if (taken.has(o.j)) return; const dd = Math.hypot(o.q.x - x, o.q.y - y); if (dd < bd) { bd = dd; best = o; } });          // 가까운 공격수 마크(골문 쪽에서)
          if (best) { taken.add(best.j); const mk = clampN(0.45 + (A('MAR') - 50) / 150, 0.3, 0.8); x += (best.q.x - d * 2.8 - x) * mk; y += (best.q.y + (32 - best.q.y) * 0.1 - y) * mk; } }
      }
      if (gk && act && act.k === 'shot' && act.s !== pre) { y = act.out === 'goal' ? act.ty + (act.ty > 32 ? -3 : 3) : act.ty; sprint = true; }   // 슛 막으러 몸을 던짐
      const rcv = act && act.k === 'pass' && act.to.s === pre && act.to.i === i, rg = rcv ? [2, 98] : (ROLE_U[sub] || [3, 97]); let uu = uOf(x, d); uu = c01(uu, rg[0], rg[1]); x = d > 0 ? uu : 100 - uu;   // 받으러 가는 선수는 범위 제한 없음
      { let nx = c01(x, 2.5, 97.5), ny = c01(y, 3, 61);
        if (!gk && !sprint && !kick && !isH) {                                                                                  // 개인 능력치: 포지셔닝(POS)·판단(DEC)이 낮으면 위치가 흔들리고 반응이 늦음
          const tacR = MV.tacR ? MV.tacR[pre] : 60, amp = clampN((68 - A('POS')) / 10, 0, 3) * clampN(1.3 - (tacR - 40) / 100, 0.5, 1.2), ph = (MV.t || 0);
          nx += amp * Math.sin(ph * 0.37 + i * 1.7); ny += amp * Math.cos(ph * 0.29 + i * 2.3);
          const pv = MV.tgt[pre][i], kk = clampN(0.42 + (A('DEC') - 50) / 130 + (tacR - 60) / 400, 0.25, 0.95); if (pv) { nx = pv.x + (nx - pv.x) * kk; ny = pv.y + (ny - pv.y) * kk; } }
        MV.tgt[pre][i] = { x: c01(nx, 2.5, 97.5), y: c01(ny, 3, 61), sprint }; }
    });
  };
  place('m'); place('o');
  if (MV.cele || MV.regroup > 0 || (MV.goalRes && !MV.intro && !MV.pg)) applyCele(M); else if (MV.sp) applySp(M);   // 킥오프 대기 중엔 모두 자기 진영 킥오프 자리로
  if (MV.pg) pgTargets(M);
  if (MV.force) for (const k in MV.force) { const F = MV.force[k], tg = MV.tgt[k[0]]; if (tg && tg[+k.slice(1)]) tg[+k.slice(1)] = { x: F.x, y: F.y, sprint: !MV.introWalk }; }   // 장면 진입: 목표 위치로 전력 질주
  if (MV.offRun) { const R = MV.offRun, q = MV.pos[R.s][R.i], tg = MV.tgt[R.s]; if (MV.t - R.t > 5 || !q || MV.poss !== R.s || MV.sp || MV.pg) MV.offRun = null; else if (tg && tg[R.i]) { const d = R.s === 'm' ? dM_(M) : -dM_(M); tg[R.i] = { x: d > 0 ? R.u : 100 - R.u, y: q.y, sprint: true }; } }   // 엔진 오프사이드용 이른 침투
  if (MV.goalRes && !MV.intro) for (const pre of ['m', 'o']) sideOf(pre).forEach((p, i) => { const k = koSpot(M, pre, i); if (k && MV.tgt[pre][i]) MV.tgt[pre][i] = { x: k.x, y: k.y, sprint: true }; });   // 킥오프 대기: 차는 선수가 공 뒤로
}
function applyCele(M) {                                   // 골 세레머니·재정렬: 순간이동 없이 달려서 이동
  const C = MV.cele, D = { m: dM_(M), o: -dM_(M) };
  for (const pre of ['m', 'o']) sideOf(pre).forEach((p, i) => {
    if (!MV.tgt[pre][i]) return;
    const f = fxy(pre, i), fx = D[pre] > 0 ? f[0] : 100 - f[0], fy = f[1] * 0.64;
    if (!C) { const k = koXY(M, pre, i); MV.tgt[pre][i] = { x: k.x, y: k.y, sprint: true }; return; }
    if (pre === C.s && i === C.si) MV.tgt[pre][i] = { x: C.cx, y: C.cy, sprint: true };
    else if (pre === C.s && i > 0) { const sc = MV.pos[pre][C.si] || { x: C.cx, y: C.cy }, a = i * 0.85, r = 2.6 + (i % 3) * 0.9; MV.tgt[pre][i] = { x: c01(sc.x + Math.cos(a) * r, 2.5, 97.5), y: c01(sc.y + Math.sin(a) * r, 3, 61), sprint: true }; }
    else MV.tgt[pre][i] = { x: fx, y: fy, sprint: false };
  });
}
function movePitch() { const M = G0().mm; if (!M || !MV || !MV.pos) return; retarget(M); if (!MV.raf) MV.raf = requestAnimationFrame(frame); }
function lbl(t) { if (MV) MV.lbl = { t, l: 1 }; }
function koXY(M, pre, i) {                                                                // 킥오프 대형: 모두 자기 진영, 킥오프 안 하는 팀은 센터서클 밖
  const d = pre === 'm' ? dM_(M) : -dM_(M), b = fxy(pre, i), y = b[1] * 0.64, kick = MV && MV.goalRes ? MV.goalRes === pre : true; let u = Math.min(b[0], 47.5);
  if (!kick && Math.abs(y - 32) < 9.6) u = Math.min(u, 50 - Math.sqrt(9.6 * 9.6 - (y - 32) * (y - 32)));
  return { x: d > 0 ? u : 100 - u, y }; }
function resetPos(M, soft) { const f = (st, pre) => st.forEach((p, i) => { const c = MV.pos[pre][i], ko = koSpot(M, pre, i) || koXY(M, pre, i); if (c && !(soft && Math.hypot(c.x - ko.x, c.y - ko.y) > 2.4)) { c.x = ko.x; c.y = ko.y; c.vx = c.vy = 0; } }); f(MV.mst, 'm'); f(MV.ost, 'o'); MV.run = {}; }
function koSpot(M, pre, i) { if (!MV || MV.goalRes !== pre || MV.pg || i !== Math.min(6, sideOf(pre).length - 1)) return null; const d = pre === 'm' ? dM_(M) : -dM_(M); return { x: 50 - d * 0.9, y: 32 }; }   // 킥오프 차는 선수는 공 바로 뒤
function kickoffTargets(M) { const F = {}; for (const pre of ['m', 'o']) sideOf(pre).forEach((p, i) => { F[pre + i] = koSpot(M, pre, i) || koXY(M, pre, i); }); return F; }
function walkToKickoff(M, done, maxMs) {                                                  // 선수들이 실제로 걸어서 킥오프 위치로 이동 → 다 도착하면 시작
  MV.force = kickoffTargets(M); MV.introWalk = false; MV.paused = true; MV.regWalk = true; const t0 = nowR(), F0 = MV.force;
  const chk = () => { if (!MV || MV.over || MV.force !== F0) { if (MV) MV.regWalk = false; return; } let ok = true;
    for (const k in F0) { const c = MV.pos[k[0]][+k.slice(1)], F = F0[k]; if (c && !MV.red[k] && Math.hypot(c.x - F.x, c.y - F.y) > 1.6) { ok = false; break; } }
    if (ok || nowR() - t0 > (maxMs || 8000)) { MV.force = null; MV.regWalk = false; resetPos(G0().mm || M, true); if (done) done(); else if (!MV.htWait && !MV.talk && !MV.momentOpen && !MV.pg && !MV.lead && !MV.sp && !MV.pen && !MV.so && !MV.mgrPanel && !MV.intro) MV.paused = false; } else later(chk, 200); };
  later(chk, 400); }
function swapEnds(M, walk) {                                                              // 진영 교체: 공격 방향을 뒤집고 킥오프 대형으로(walk면 걸어서 이동)
  if (!MV || !MV.pos) return; if (MV.act && MV.act.cnEv) cnUndo(MV.act.cnEv); MV.flip = !MV.flip; MV.act = null; MV.rs = null; MV.sp = null; MV.ln = null; MV.holder = null; MV.lbl = null;
  if (walk && !MV.fast && !MV.hlFast && !MV.skipping) walkToKickoff(M); else { resetPos(M); MV.ball.x = 50; MV.ball.y = 32; } if (MV.ref) { MV.ref.x = 50 - dM_(M) * 6; MV.ref.y = 40; } }
function sideOf(s) { return s === 'm' ? MV.mst : MV.ost; }
// ===== 경기 화면 측정 카운터(MV.cnt, 판단에는 쓰지 않음) =====
function pstatOn() { return MV && !MV.pg && !MV.sp && !MV.pen && !MV.so && !MV.lead && !MV.over; }
function pstatPass(h0, s, i) { if (!h0 || h0.s !== s || !pstatOn()) return; const M = G0().mm, p0 = MV.pos[s][h0.i], p1 = MV.pos[s][i]; if (!M || !p0 || !p1) return;
  const d = s === 'm' ? dM_(M) : -dM_(M), u0 = uOf(p0.x, d), fw = uOf(p1.x, d) - u0, c = MV.cnt || (MV.cnt = {});
  c.passN = (c.passN || 0) + 1; if (fw > 4) c.fwd = (c.fwd || 0) + 1; else if (fw < -4) c.bwd = (c.bwd || 0) + 1;
  if (u0 > 66) { c.pa3 = (c.pa3 || 0) + 1; if (fw < -4) { c.back3 = (c.back3 || 0) + 1; if (u0 >= 84 && uOf(p1.x, d) > 83 && Math.abs(p1.y - 32) < 20) c.cut3 = (c.cut3 || 0) + 1; } } }
function pstatFrame(M) { const h = MV.holder; if (!h || !pstatOn()) return; const q = MV.pos[h.s][h.i]; if (!q) return; const d = h.s === 'm' ? dM_(M) : -dM_(M), u = uOf(q.x, d), c = MV.cnt || (MV.cnt = {});
  const P = MV.pst; if (P && P.s === h.s) { if (u > P.max) P.max = u; if (!P.f3 && u > 66) { P.f3 = 1; c.f3 = (c.f3 || 0) + 1; } }
  else { if (P) { c.prog = (c.prog || 0) + Math.max(0, P.max - P.u0); c.possN = (c.possN || 0) + 1; } MV.pst = { s: h.s, u0: u, max: u, f3: u > 66 ? 1 : 0 }; }
  const key = h.s + h.i; if (MV.pstH !== key) { MV.pstH = key; if (u > 83 && Math.abs(q.y - 32) < 20) c.box = (c.box || 0) + 1; } }
function pmChoose(s, pi, ri) { const M = G0().mm; if (!M || !MV.pos) return; const C = PX_CFG.pm, d = s === 'm' ? dM_(M) : -dM_(M), P0 = MV.pos[s][pi], R0 = MV.pos[s][ri], who = sideOf(s)[pi], sub = who.sub, os = s === 'm' ? 'o' : 'm'; if (!P0 || !R0) return;
  const ru = uOf(R0.x, d), X = (uu) => d > 0 ? uu : 100 - uu, foes = (MV.pos[os] || []).map((q, j) => ({ q, j })).filter(o => o.j && o.q && !MV.red[os + o.j]);
  const near = (x, y) => foes.reduce((a, o) => Math.min(a, Math.hypot(o.q.x - x, o.q.y - y)), 99), half = sub === 'DM' || sub === 'CB' ? C.defHalf : 1, opts = [];
  { let fj = null, fd = 3.5; foes.forEach(o => { const dd = Math.hypot(o.q.x - R0.x, o.q.y - R0.y); if (dd < fd) { fd = dd; fj = o; } });
    if (fj) { const tu = c01(uOf(fj.q.x, d) + 6, 5, 96), ty = c01(fj.q.y + (fj.q.y < 32 ? 2 : -2), 4, 60); opts.push({ k: 'onetwo', u: tu, y: ty, S: (C.onetwo[0] + C.onetwo[1] * nA(who, 'OTB')) * half }); } }
  const wide = R0.y < 16 || R0.y > 48;
  if (wide && (sub === 'FB' || sub === 'CM')) opts.push({ k: 'overlap', u: c01(ru + 12, 5, 96), y: R0.y < 32 ? 5 : 59, S: (C.overlap[0] + C.overlap[1] * nA(who, 'WOR') + .08 * (TK(s).ment - 1)) * half });
  if (wide) opts.push({ k: 'underlap', u: c01(ru + 10, 5, 96), y: R0.y < 32 ? 21 : 43, S: C.underlap[0] + C.underlap[1] * nA(who, 'OTB') });
  { const a1 = { u: c01(ru + 9, 5, 96), y: c01(R0.y + 10, 4, 60) }, a2 = { u: c01(ru + 9, 5, 96), y: c01(R0.y - 10, 4, 60) }, b = near(X(a1.u), a1.y) >= near(X(a2.u), a2.y) ? a1 : a2; opts.push({ k: 'support', u: b.u, y: b.y, S: C.support }); }
  opts.push({ k: 'home', u: null, S: C.home - C.homeWOR * nA(who, 'WOR') });
  opts.forEach(o => { if (o.u != null) o.S += C.free * Math.min(8, near(X(o.u), o.y)); });
  const pick = softPick(opts, C.tau); if (!pick) return; cntAdd('pm_' + pick.k); if (pick.k === 'home') return;
  const dur = C.durMin + rnd2() * (C.durMax - C.durMin); (MV.pm || (MV.pm = {}))[s + pi] = { u: pick.u, y: pick.y, until: MV.t + dur, k: pick.k };
  if (pick.k === 'onetwo') (MV.pmw || (MV.pmw = {}))[s + pi] = MV.t + dur; }
function passTo(s, i, sp) { const h0 = MV.holder; pstatPass(h0, s, i); MV.rt = 0;   // 패스 순간 바로 목표 다시 계산(받는 선수 즉시 출발)
  if (h0 && MV.st && !MV.pg) { const t0 = MV.st[h0.s]; t0.pa++; if (h0.s !== s) t0.pm++; if (h0.s === 'm' && MV.mst[h0.i] && MV.mst[h0.i].me) { MV.my.pa++; if (s !== 'm') MV.my.pm++; } }
  const ps = h0 && sideOf(h0.s)[h0.i]; MV.act = { k: 'pass', to: { s, i }, sp: sp * 0.78, pas: ps ? PA(ps, 'PAS') : 55, from: h0 ? h0.s : null }; MV.holder = null;
  if (h0 && h0.s === s && h0.i !== 0 && !MV.pg) { try { pmChoose(s, h0.i, i); } catch (e) {} }   // 패스 앤 무브: 원투·오버랩·언더랩·지원 각도 중 빈 곳으로
}
function passAim(A2, q) {                                                                     // 3-1 도착 지점: 받는 선수가 달리는 방향 × 속도 × 공 도착 시간(3번 반복) + 리드
  const T = PX_CFG.aim, b = MV.ball, sp = Math.max(10, A2.sp || 30), M = G0().mm, d = A2.to.s === 'm' ? dM_(M) : -dM_(M), run = MV.runs && MV.runs[A2.to.s + A2.to.i], thr = !!(A2.lead || A2.thrC);
  let vx = q.vx || 0, vy = q.vy || 0;
  if (thr) { const p = sideOf(A2.to.s)[A2.to.i], vm = (8 + PA(p, 'PAC') / 9) * T.runFrac; let dx = d, dy = 0; if (run && run.t0 <= MV.t) { dx = (d > 0 ? run.tu : 100 - run.tu) - q.x; dy = run.ty - q.y; } const L = Math.hypot(dx, dy) || 1; vx = dx / L * vm; vy = dy / L * vm; }
  else { vx *= .6; vy *= .6; }
  let px = q.x, py = q.y; for (let k = 0; k < T.iters; k++) { const t = Math.hypot(px - b.x, py - b.y) / sp; px = q.x + vx * t; py = q.y + vy * t; }
  if (thr) { const L = Math.hypot(vx, vy) || 1, ld = T.leadMin + rnd2() * (T.leadMax - T.leadMin); px += vx / L * ld; py += vy / L * ld; }
  { const p = sideOf(A2.to.s)[A2.to.i], vr = (8 + PA(p, 'PAC') / 9) * T.reach, dR = Math.hypot(px - q.x, py - q.y), tB = Math.hypot(px - b.x, py - b.y) / sp;   // 받는 선수가 공보다 늦게 닿는 지점이면 닿을 수 있는 곳으로
    if (dR > 0.5 && dR / vr > tB + T.slack) { const k = Math.max(0, (tB + T.slack) * vr / dR); px = q.x + (px - q.x) * k; py = q.y + (py - q.y) * k; } }
  A2.px = c01(px, 1.5, 98.5); A2.py = c01(py, 1, 63); }
function passWait(A2, tx, ty, dt) {                                                            // 공이 먼저 도착하면 받는 선수가 올 때까지 그 자리(최대 1.6초)
  if (A2.k !== 'pass' || A2.px == null) return false; const q = MV.pos[A2.to.s] && MV.pos[A2.to.s][A2.to.i]; if (!q || Math.hypot(q.x - tx, q.y - ty) <= PX_CFG.aim.waitR) return false;
  if (A2.re) return false; A2.re = 1; cntAdd('reaim'); const v = Math.hypot(q.vx || 0, q.vy || 0), lead = Math.min(1.2, v * 0.08); A2.px = c01(q.x + (v > 0.5 ? (q.vx / v) * lead : 0), 1.5, 98.5); A2.py = c01(q.y + (v > 0.5 ? (q.vy / v) * lead : 0), 1, 63); A2.sp *= PX_CFG.aim.slow; return true; }   // 멈추지 않고 받는 선수 쪽으로 감속하며 굴러감
function laneCheck(M, A2, tx, ty) {                                                         // 패스 길목 차단: 상대 수비수가 패스 라인 근처에 있으면 인터셉트 가능
  if (!A2.from || A2.to.s !== A2.from || A2.hi || A2.cross || MV.pg || MV.pen || MV.so || MV.sp || MV.lead || MV.momentOpen || MV.talk) return;
  const os = A2.from === 'm' ? 'o' : 'm', x0 = A2.x0, y0 = A2.y0, vx = tx - x0, vy = ty - y0, L2 = vx * vx + vy * vy; if (L2 < 36) return;
  let best = null;
  MV.pos[os].forEach((q, j) => { if (j === 0 || !q || MV.red[os + j]) return; const t = ((q.x - x0) * vx + (q.y - y0) * vy) / L2; if (t < 0.12 || t > 0.92) return; const dist = Math.hypot(x0 + vx * t - q.x, y0 + vy * t - q.y); if (dist > 2.6) return;
    const p = sideOf(os)[j], pr = (1 - dist / 2.6) * 0.26 * (0.5 + (PA(p, 'POS') + PA(p, 'AGI') + PA(p, 'TAK')) / 300) * clampN(44 / A2.sp, 0.7, 1.4) * (1 + (TK(os).press - 1) * 0.12);
    if (rnd2() < pr && (!best || dist < best.dist)) best = { j, dist }; });
  if (best && rnd2() < 0.05 && canStage()) { const q = MV.pos[os][best.j], dA = A2.from === 'm' ? dM_(M) : -dM_(M); if (q && uOf(q.x, dA) < 78) { MV.handReq = { s: os, i: best.j, t: MV.t }; MV.act = null; lbl('핸드볼!'); MV.ball.x = q.x; MV.ball.y = q.y; foulScene(M, { s: A2.from, p: sideOf(os)[best.j], at: { x: q.x, y: q.y } }); return; } }
  if (best) { const t0 = MV.st && MV.st[A2.from]; if (t0) t0.pm++; A2.to = { s: os, i: best.j }; A2.lane = 1; { const iq = MV.pos[os][best.j]; if (iq) { A2.px = iq.x; A2.py = iq.y; } } (MV.cnt || (MV.cnt = {})).lane = ((MV.cnt || {}).lane || 0) + 1; lbl('인터셉트!'); }
}
function shoot(M, out, sty) {
  const h = MV.holder, s = h.s, d = s === 'm' ? dM_(M) : -dM_(M), os = s === 'm' ? 'o' : 'm', cur = MV.pos[s][h.i], gx = d > 0 ? 99 : 1;
  let t = { x: gx, y: 32 }, to = null;
  if (out === 'goal') t = { x: gx, y: 32 + (rnd2() < 0.5 ? -1 : 1) * (2 + rnd2() * 3) };
  else if (out === 'wide') { const g0 = Math.hypot(100 - uOf(cur.x, d), cur.y - 32); t = { x: gx, y: 32 + (rnd2() < 0.5 ? -1 : 1) * (4 + rnd2() * clampN(g0 * 0.22, 1.5, 7)) }; }   // 빗나감: 가까울수록 골대 바로 옆(가까이서 코너 쪽으로 차는 일 없게)
  else if (out === 'post') t = { x: gx, y: 32 + (rnd2() < 0.5 ? -1 : 1) * 4.2 };
  else if (out === 'save') t = { x: MV.pos[os][0].x, y: MV.pos[os][0].y };
  else { let bi = -1, bd = 1e9; MV.pos[os].forEach((q, i) => { if (i === 0 || !q || MV.red[os + i]) return; const dd = Math.hypot(q.x - cur.x, q.y - cur.y); if (dd < bd) { bd = dd; bi = i; } }); if (bi < 0) { out = 'wide'; t = { x: gx, y: 32 + 5 }; } else to = { s: os, i: bi }; }
  let eh = 0.4 + rnd2() * 1.4;                                                   // 슛이 골문에 도착하는 높이(화면용)
  if (!sty && !MV.pg) { const u1 = uOf(cur.x, d), g1 = Math.hypot(100 - u1, cur.y - 32), hiB = MV.rcvHi > 0 && MV.t - MV.rcvHi < 0.5; const r = rnd2();
    sty = hiB ? (r < 0.6 ? 'header' : 'volley') : g1 > 22 ? (r < 0.4 ? 'knuckle' : r < 0.75 ? 'curve' : 'drive') : g1 < 9 ? (r < 0.5 ? 'tap' : 'first') : (r < 0.25 ? 'chip' : r < 0.5 ? 'curve' : r < 0.75 ? 'low' : null); }
  if (out === 'wide' && rnd2() < 0.45) { eh = 3.1 + rnd2() * 1.6; t.y = 32 + (rnd2() * 2 - 1) * 3; }               // 골대 위로 날아감
  else if (out === 'wide') eh = 0.3 + rnd2() * 1.4;
  if (out === 'post') { if (rnd2() < 0.45) { eh = 2.44; t.y = 32 + (rnd2() * 2 - 1) * 3; } else eh = 0.4 + rnd2() * 1.8; }   // 크로스바 / 좌우 기둥
  if (out === 'save') eh = 0.25 + rnd2() * 2.0; if (out === 'block') eh = 0.6;
  if (out === 'goal') eh = sty === 'chip' ? 1.9 : sty === 'low' || sty === 'tap' ? 0.25 : 0.3 + rnd2() * 1.9;
  if (MV.st) { const u0 = uOf(cur.x, d), gd0 = Math.hypot(100 - u0, cur.y - 32) * 1.05, xg0 = clampN(0.85 * Math.exp(-gd0 / 11) * (1 - 0.35 * Math.min(1, Math.abs(cur.y - 32) / 30)), 0.02, 0.8), S0 = MV.st[s]; S0.sh++; S0.xg += out === 'goal' ? Math.max(xg0, 0.08) : xg0; if (out === 'goal' || out === 'save') S0.sot++; }
  MV.act = { k: 'shot', tx: t.x, ty: t.y, sp: 56, out, s, to, eh, sty: sty || 'drive' }; MV.holder = null; lbl('슛!');
  const SY = SHOT_STY[sty]; if (SY) { MV.act.h0 = SY.h; MV.act.sp = SY.sp; if (SY.dev) MV.act.dev = SY.dev * (footOf(sideOf(s)[h.i]) === 'L' ? 1 : -1) * d; if (SY.cy != null && out === 'goal') MV.act.ty = 32 + (t.y > 32 ? 1 : -1) * SY.cy; lbl(SY.t); }
  if (MV.pg && MV.pg.ng) { chanceEnd(M, s, h.i, os); return; }
  if (out !== 'goal') { PX.ui.sfx(out === 'save' ? 'save' : 'shot'); const nm = esc(sideOf(s)[h.i].name); MV.log.unshift({ min: MV.min, ic: IC.target, cls: '', t: `${nm}의 슛 — ${({ save: '골키퍼 선방', wide: '골대를 벗어남', block: '수비가 막아냄', post: '골대를 때림' })[out]}` }); }
}
const SHOT_STY = { header: { h: 1.0, sp: 60, t: '헤딩슛!' }, volley: { h: 2.0, sp: 68, t: '발리슛!' }, chip: { h: 3.4, sp: 36, t: '칩슛!', cy: 1.6 }, curve: { h: 1.6, sp: 54, t: '감아차기!', dev: 2.8 }, drive: { h: 1.3, sp: 82, t: '중거리 슛!' }, low: { h: 0.5, sp: 58, t: '땅볼 슛!' }, tap: { h: 0.4, sp: 34, t: '밀어 넣기!' }, overhead: { h: 2.6, sp: 56, t: '바이시클 킥!' }, first: { h: 0.7, sp: 66, t: '논스톱 슛!' }, knuckle: { h: 1.0, sp: 92, t: '무회전 슛!', dev: 0.9 } };
// ===== 공격 전진·개인 행동 설정값(fm-detail-spec.md 출발값). 조정은 이 표의 숫자만 =====
const PX_CFG = {
  V: { side: [0, .01, .01, .02, .03, .04, .06, .09, .13, .16], half: [0, .01, .02, .03, .04, .06, .09, .15, .26, .38], mid: [0, .01, .02, .03, .05, .07, .11, .19, .36, .60] },   // 1장 구역 가치표(u 10칸 × 측면·하프스페이스·중앙)
  press: [[3, 1], [6, .6], [10, .25]],                                                     // 0-2 압박 정도: 가장 가까운 상대 거리 → pr
  tau: { base: .35, DEC: .12, VIS: .08, pr: .15, COM: .08, min: .08, max: .6, scale: .2 },   // scale: 사양 점수 폭(약 0.1)에 맞춘 온도 배율 — pitch-sim으로 조정            // 0-3 판단 온도(softmax)
  pass: { gainW: 2.4, riskBase: .25, lossW: .8, recvW: .12, recvR: 6, offside: .4, cutback: .15, midBackPen: .3, f3BackMaxDist: 14, openBackPr: 1, longBuild: .08, oneTwo: .3, backLongMax: 28 },   // 2-1·2-2
  cut: { react0: .35, POS: .10, DEC: .05, margin: .05, slope: .08, scale: .6, ballSp: 36 },  // 2-3 가로채기(시간 비교, 예측용)
  carry: { gainW: 2.4, step: 6, Lw: .05, Lcap: 15, prW: .5, DRI: .10, Lmin: 6, prMax: .25, cone: 25, tempo: .04, push: 6, inward: .15, dur: 1.2 },   // 2-4 운반
  aim: { iters: 3, runFrac: .9, leadMin: .6, leadMax: 1.2, meet: .12, wait: 1.6, waitR: 2.2, reach: .85, slack: .15, slow: .55 },   // 3-1 도착 지점
  run: { ST: [.30, .25], W: [.20, .20], AM: [.10, .15], FB: [.05, .10], CM: [.05, .10], every: .5, max: 2, angMin: 20, angMax: 35, len: 12, delay0: .4, delayOTB: .3, dur: 1.6, behindMax: 5, spaceMin: 10, faceMax: 60, seeDelay0: .6, seeVIS: .3, thr: .5, thrVIS: .10, thrPAS: .10, thrBase: .15, thrMax: .75, prMax: .25, transMul: 1.5, offBase: .07, offOTB: .05, offDEC: .02, offMin: .02, early: .2, earlyAhead: 2.5, offMargin: 1.0 },   // 오프사이드 실수: 일찍 출발(0.2초)하면 라인을 넘어가 있을 수 있음   // 3-3 미리 뛰는 침투
  thrOld: { base: .06, VIS: 150, PAS: 200, max: .35 },                                     // 침투가 없을 때 일반 스루패스(시야 좋은 선수)
  pm: { onetwo: [.30, .15], overlap: [.25, .15], underlap: [.22, .10], support: .15, home: .10, homeWOR: .15, durMin: 1.5, durMax: 3.0, defHalf: .5, free: .02, tau: .25 },   // 4장 패스 앤 무브
  scan: { base: .4, VIS: 2.0, DEC: .6, win: 2, dur: .25, reach: 30, mem: 2.2, every: .25, loseBase: .35, loseCOM: .2, loseScale: .3, backR: 4.5 },   // 5-2 스캔
  align: { base: .12, k: .10, max: .3, prHalf: .6, weakDeg: 45, weakTEC: .3, weakAdd: .08, weakDev: 1.35 },   // 5-3 차기 전 몸 정렬
  touch: { base: 1.2, TEC: .8, dur: .35 },                                                 // 5-4 첫 터치
  ask: { free: 6, dur: .6, cd: 3, point: .4 },                                             // 5-5 공 요구·가리키기
  jockey: { dist: 4, gap: 2.2, inside: .8 },                                               // 5-6 수비 1:1 지연
  turn: { decel: .5 }                                                                      // 5-7 90° 넘게 꺾을 때 감속
};
function nA(p, k) { return clampN((PA(p, k) - 50) / 30, -1, 1); }                            // 능력치 정규화(-1~1)
function prOf(dist) { for (const [dd, v] of PX_CFG.press) if (dist < dd) return v; return 0; }
function zoneV(u, y) { const C = PX_CFG.V, fu = c01(u, 0, 99.99) / 10 - .5, i0 = Math.max(0, Math.min(9, Math.floor(fu))), i1 = Math.min(9, i0 + 1), tu = clampN(fu - i0, 0, 1), dy = Math.abs(y - 32);
  const row = (k) => C[k][i0] + (C[k][i1] - C[k][i0]) * tu, cm = row('mid'), ch = row('half'), cs = row('side');
  return dy <= 3.5 ? cm : dy <= 13 ? cm + (ch - cm) * (dy - 3.5) / 9.5 : dy <= 25.5 ? ch + (cs - ch) * (dy - 13) / 12.5 : cs; }
function pCut(x0, y0, x1, y1, os) { const C = PX_CFG.cut, L = Math.hypot(x1 - x0, y1 - y0), k = Math.max(2, Math.min(8, Math.ceil(L / 5))); let keep = 1;   // 패스 길 가로채기 확률(받는 지점 마지막 칸은 받기 경합이라 제외)
  (MV.pos[os] || []).forEach((q, j) => { if (j === 0 || !q || MV.red[os + j]) return; const p = sideOf(os)[j], re = C.react0 - C.POS * nA(p, 'POS') - C.DEC * nA(p, 'DEC'), vs = 8 + PA(p, 'PAC') / 9; let mx = 0;
    for (let t = 1; t < k; t++) { const r = t / k, px = x0 + (x1 - x0) * r, py = y0 + (y1 - y0) * r, m = L * r / C.ballSp - (re + Math.hypot(px - q.x, py - q.y) / vs), P = 1 / (1 + Math.exp(-(m + C.margin) / C.slope)); if (P > mx) mx = P; }
    keep *= 1 - mx * C.scale; }); return 1 - keep; }
function softPick(opts, tau) { if (!opts.length) return null; const mx = Math.max(...opts.map(o => o.S)), w = opts.map(o => Math.exp((o.S - mx) / tau)); let r = rnd2() * w.reduce((a, b) => a + b, 0); for (let k = 0; k < opts.length; k++) { r -= w[k]; if (r <= 0) return opts[k]; } return opts[opts.length - 1]; }
function cntAdd(k, v) { if (!pstatOn()) return; const c = MV.cnt || (MV.cnt = {}); c[k] = (c[k] || 0) + (v == null ? 1 : v); }
// 3-3 미리 뛰는 침투: 0.5초마다 공격 팀에서 조건을 보고 출발(최대 2명). 화면 오프사이드는 만들지 않음(공이 그 선수에게 나가기 전엔 라인을 넘지 않음)
function runsUpdate(M) { const C = PX_CFG.run, h = MV.holder; if (MV.runsS !== MV.poss) { MV.runs = {}; MV.runsS = MV.poss; }                                 // 공격 팀이 바뀌면 침투 기록 초기화(패스가 날아가는 동안은 유지)
  if (!h || MV.pg || MV.sp || MV.pen || MV.so || MV.lead || MV.cele || MV.paused) return;
  if ((MV.runsT || -9) > MV.t - C.every) return; MV.runsT = MV.t; const R = MV.runs || (MV.runs = {});
  for (const k in R) if (R[k].until < MV.t) delete R[k];
  const s = h.s, os = s === 'm' ? 'o' : 'm', d = s === 'm' ? dM_(M) : -dM_(M), hp = MV.pos[s][h.i]; if (!hp) return;
  let nd = 99; (MV.pos[os] || []).forEach((q, j) => { if (j && q && !MV.red[os + j]) nd = Math.min(nd, Math.hypot(q.x - hp.x, q.y - hp.y)); });
  const T = TK(s), trans = (T.trans - 1) > 0 && MV.tOverS === s && MV.t - (MV.tOver || -99) < 5;
  if (prOf(nd) > C.prMax && !trans) return;
  const sp = Math.hypot(hp.vx || 0, hp.vy || 0); if (sp > 1 && Math.acos(clampN(((hp.vx || 0) * d) / sp, -1, 1)) * 180 / Math.PI > C.faceMax) return;   // 공 가진 선수가 앞을 봄
  let line = 55; (MV.pos[os] || []).forEach((q, j) => { if (j && q && !MV.red[os + j]) line = Math.max(line, uOf(q.x, d)); });
  if (100 - line < C.spaceMin) return; let active = Object.values(R).filter(r => r.until > MV.t).length;
  sideOf(s).forEach((p, i) => { if (active >= C.max || i === 0 || i === h.i || MV.red[s + i] || R[s + i]) return; const q = MV.pos[s][i]; if (!q) return; const sub = p.sub, tb = C[sub]; if (!tb) return;
    if (sub === 'FB' && ((T.ment - 1) < 1 || (q.y < 32) !== (MV.ball.y < 32))) return;            // 풀백은 공격적 멘탈리티 + 공 쪽만
    const cu = uOf(q.x, d), gap = line - cu; if (gap < 0 || gap > C.behindMax) return;
    const pr = (tb[0] + tb[1] * nA(p, 'OTB')) * (.8 + .2 * T.tempo) * (trans ? C.transMul : 1); if (rnd2() >= pr) return;
    const a = (C.angMin + rnd2() * (C.angMax - C.angMin)) * Math.PI / 180, inward = q.y < 32 ? 1 : -1, sg = sub === 'W' && Math.abs(q.y - 32) < 14 ? -inward : inward;
    const tu = c01(cu + C.len * Math.cos(a), 5, 97), ty = c01(q.y + sg * C.len * Math.sin(a), 4, 60), t0 = MV.t + Math.max(0, C.delay0 - C.delayOTB * nA(p, 'OTB'));
    const early = rnd2() < Math.max(C.offMin, C.offBase - C.offOTB * nA(p, 'OTB') - C.offDEC * nA(p, 'DEC'));
    R[s + i] = { t0: early ? t0 - C.early : t0, until: t0 + C.dur, tu, ty, early }; active++; cntAdd('runN'); (MV.point || (MV.point = {}))[s + i] = t0 + PX_CFG.ask.point; }); }
// 5-2 받기 전 스캔: 공 가진 동료 30 안에서 2초당 1~3회 고개를 돌려 주변 확인(시야·판단력). 스캔한 선수만 몸을 열고 받음
function scanUpdate(M) { const C = PX_CFG.scan, h = MV.holder; if (!h || MV.pg || MV.sp || MV.pen || MV.so) return; if ((MV.scanT0 || -9) > MV.t - C.every) return; const dtS = MV.t - (MV.scanT0 || MV.t); MV.scanT0 = MV.t;
  const s = h.s, hp = MV.pos[s][h.i]; if (!hp) return; const L = MV.scanL || (MV.scanL = {}), V = MV.scanV || (MV.scanV = {});
  sideOf(s).forEach((p, i) => { if (i === 0 || i === h.i || MV.red[s + i]) return; const q = MV.pos[s][i]; if (!q || Math.hypot(q.x - hp.x, q.y - hp.y) > C.reach) return; const key = s + i;
    const cnt = Math.round(C.base + C.VIS * (nA(p, 'VIS') + 1) / 2 + C.DEC * (nA(p, 'DEC') + 1) / 2), iv = C.win / Math.max(1, cnt), vis = PA(p, 'VIS');
    if (vis >= 62) cntAdd('scanTHi', dtS); else if (vis <= 42) cntAdd('scanTLo', dtS);
    if (MV.t - (L[key] || -9) >= iv) { L[key] = MV.t; V[key] = MV.t + C.dur; cntAdd('scanN'); if (vis >= 62) cntAdd('scanHi'); else if (vis <= 42) cntAdd('scanLo'); } }); }
function scanned(s, i) { return MV.t - ((MV.scanL || {})[s + i] || -99) <= PX_CFG.scan.mem; }
function decide(M) {
  const h = MV.holder; if (!h) return;
  const s = h.s, d = s === 'm' ? dM_(M) : -dM_(M), st = sideOf(s), arr = MV.pos[s], cur = arr[h.i], who = st[h.i], os = s === 'm' ? 'o' : 'm', oarr = MV.pos[os]; if (!cur) return;
  const u = uOf(cur.x, d), gd = Math.hypot(100 - u, cur.y - 32), pg = MV.pg && MV.pg.s === s ? MV.pg : null;
  let nd = 1e9, ni = -1; oarr.forEach((q, i) => { if (i === 0 || !q || MV.red[os + i]) return; const dd = Math.hypot(q.x - cur.x, q.y - cur.y); if (dd < nd) { nd = dd; ni = i; } });
  const line = (() => { let mx = 55; oarr.forEach((q, i) => { if (i && q && !MV.red[os + i]) mx = Math.max(mx, uOf(q.x, d)); }); return mx; })();
  const mates = []; arr.forEach((q, i) => { if (!q || i === h.i || MV.red[s + i]) return; const pu = uOf(q.x, d); let od = 1e9; oarr.forEach((o, j) => { if (j && o && !MV.red[os + j]) od = Math.min(od, Math.hypot(o.x - q.x, o.y - q.y)); });
    mates.push({ i, q, pu, dist: Math.hypot(q.x - cur.x, q.y - cur.y), open: clampN(od / 10, 0.3, 1.6), sub: st[i].sub, who: st[i] }); });
  const pickBy = (arr2, wf) => { const c = arr2.map(m => ({ m, w: wf(m) })).filter(o => o.w > 0); if (!c.length) return null; let r = rnd2() * c.reduce((a, o) => a + o.w, 0); for (const o of c) { r -= o.w; if (r <= 0) return o.m; } return c[0].m; };
  // 득점 연출: 골 패턴(PAT)에 따라 다양한 방식으로 마무리 — 크로스·스루패스·컷백·원투·세트피스·중거리·리바운드 등
  if (pg) {
    if (pg.pen) { MV.dec = 0.5; return; }
    let P = pg.pp || PAT.solo; const sci = pg.si, asi = pg.as;
    const fin = (st) => { MV.fin = 0; shoot(M, pg.ng || 'goal', st || P.fin); };
    const fwdPass = (wide) => { const t = pickBy(mates.filter(m => m.i && m.pu > u - 6), m => Math.exp(-m.dist / 22) * (m.pu > u ? 2 : 0.6) * m.open * (wide && Math.abs(m.q.y - 32) > 18 ? 2.2 : 1)); if (t) passTo(s, t.i, 44); else MV.dec = 0.4; };
    const zoneOK = (c, Z) => { if (!Z) return true; const uu = uOf(c.x, d); if (uu < Z[1] - 7) return false; if (Z[0] === 'w') return c.y < 17 || c.y > 47; if (Z[0] === 'w2') return uu > 88 && (c.y < 20 || c.y > 44); return true; };
    if (pg.t > 22 && h.i !== 0) { fin('drive'); return; }
    if (pg.t > (P.dead ? 12 : 7) && !pg.fb) { pg.fb = 1; pg.dd = 1; pg.pp = PAT.solo; P = pg.pp; }                   // 패턴이 안 풀리면 단독 돌파로 마무리
    if (h.i === 0) { const t = pickBy(mates.filter(m => m.i), m => Math.exp(-m.dist / 25) * (m.pu > 40 ? 1.5 : 0.7)); if (t) passTo(s, t.i, 46); else MV.dec = 0.5; return; }
    const okAs = P.as && asi > 0 && sci > 0 && asi !== sci;
    const lnk = (j, sp) => { const q = j > 0 && MV.pos[s][j]; if (q && uOf(q.x, d) < u - 22) { if (pg.lw == null) pg.lw = pg.t; if (pg.t - pg.lw < 5) { MV.dec = 0.2; return; } } passTo(s, j, sp); };   // 받을 선수가 한참 뒤면 다가올 때까지 잠깐 기다림
    if (P.dead && !pg.dd) {                                                                   // 세트피스 패턴: 구역까지 전개한 뒤 데드볼로 재개
      const wideNow = cur.y < 13 || cur.y > 51; let trig;
      if ((P.dead === 'cn' || P.dead === 'th') && asi > 0 && h.i !== asi) { lnk(asi, 46); return; }                 // 킥을 찰 어시스트 선수에게 먼저 연결
      if (P.dead === 'cn') trig = u > 82 && wideNow; else if (P.dead === 'th') trig = u > 66 && wideNow; else if (P.direct) trig = gd >= P.gdz[0] && gd <= P.gdz[1]; else trig = u > 60 && gd > 24;
      if (trig || (pg.t > 5 && P.dead === 'fk')) { pg.dd = 1; startPgDead(M, P, pg, h.i); return; }
      if (pg.t > 9) { pg.dd = 1; pg.pp = PAT.solo; MV.dec = 0.1; return; }                  // 코너/스로인 구역에 못 가면 다른 방식으로 마무리(공 순간이동 방지)
      if ((P.dead === 'cn' || P.dead === 'th') && asi > 0) { MV.dec = 0.2; return; }
      fwdPass(P.dead === 'cn' || P.dead === 'th'); return; }
    if (P.dead && pg.dd) {
      if (P.direct) { if (h.i === sci) fin(); else if (sci > 0) lnk(sci, 40); else fin(); return; }
      if (h.i === asi && !pg.deliv) { pg.deliv = 1; passTo(s, sci, P.dead === 'th' ? 40 : 52); MV.act.hi = true; lbl(P.dead === 'cn' ? '코너킥 크로스' : P.dead === 'th' ? '롱스로인' : '프리킥 크로스'); return; }
      if (h.i === sci && pg.deliv) { fin(); return; }
      if (sci > 0 && h.i !== sci) { lnk(sci, 46); return; } fin(); return; }
    if (P.special === 'onetwo' && okAs) {
      if (h.i === sci) { if (pg.ret === 2) { fin(); return; } if (u >= 60 || pg.t > 4) { pg.ret = 1; passTo(s, asi, 40); lbl('원투 패스'); return; } MV.dec = 0.2; return; }
      if (h.i === asi) { if (pg.ret === 1) { pg.ret = 2; pg.deliv = 1; passTo(s, sci, 46); MV.act.lead = d * 6; lbl('원투 리턴'); return; } passTo(s, sci, 44); return; }
      lnk(sci, 48); return; }
    if (P.special === 'rebound' && sci > 0) {
      if (h.i === sci) { if (pg.rb2) { fin(); return; } if (!pg.rb1 && gd < 21) { pg.rb1 = 1; shoot(M, 'save'); return; } MV.dec = 0.2; return; }
      if (u > 45 || pg.t > 2.5) lnk(sci, 52); else fwdPass(false); return; }
    if (okAs && P.A) {
      if (h.i === sci) { if (pg.deliv) { fin(); return; } passTo(s, asi, 46); return; }
      if (h.i === asi) { if (zoneOK(cur, P.A) || pg.t > 5) { pg.deliv = 1; const ps = P.pass; passTo(s, sci, ps.sp); if (ps.lead) MV.act.lead = d * ps.lead; if (ps.hi) MV.act.hi = true; MV.act.tag = ps.tag; lbl(ps.tag); return; } MV.dec = 0.2; return; }
      lnk(asi, 46); return; }
    if (sci > 0) {                                                                            // 득점자 단독 마무리형(중거리·드리블·감아차기·역습·쇄도)
      if (h.i === sci) { if (gd <= (P.win ? P.win[1] : 24)) { fin(); return; } MV.dec = 0.2; return; }
      if (u > 45 || pg.t > 2.5) { lnk(sci, 52); return; }
      fwdPass(false); return; }
    if (gd < 26 && h.i !== 0) { fin('low'); return; } if (gd >= 26) { MV.dec = 0.2; return; }
    fwdPass(false); return;
  }
  // 데드볼 재개(코너킥·프리킥·스로인): 킥 종류에 맞게 연결
  if (MV.rk) { const rk = MV.rk; MV.rk = null;
    if (rk.s === s && h.i === rk.tk && h.i !== 0) {
      const box = mates.filter(m => m.i && m.pu > 82 && Math.abs(m.q.y - 32) < 20), hd = (m) => 1 + (PA(m.who, 'HEA') - 50) / 60 + m.open;
      if (rk.kind === 'cn') { const nearP = rnd2() < 0.45, low = rnd2() < 0.3, top = cur.y < 32, pool = box.length ? box : mates.filter(m => m.i && m.pu > 70);
        const t = pickBy(pool, m => hd(m) * (((m.q.y < 32) === top) === nearP ? 2.6 : 0.5)); const ft = footOf(who), inS = (ft === 'L') === ((d > 0) === top);
        if (t) { passTo(s, t.i, low ? 58 : 50); if (low) MV.act.h0 = 1.0; else MV.act.hi = true; MV.act.dev = (inS ? -1 : 1) * 1.4 * (top ? 1 : -1); lbl((nearP ? '니어포스트' : '파포스트') + ' 겨냥 ' + (low ? '낮게 깔아 찬' : '높이 띄운') + ' ' + (inS ? '인스윙' : '아웃스윙') + ' 코너킥'); } else MV.dec = 0.4; return; }
      if (rk.kind === 'th') { const lt = PA(who, 'STR') >= 62 && u > 66 && gd < 46;
        if (lt) { const t = pickBy(box.length ? box : mates.filter(m => m.i && m.pu > 70), hd); if (t) { passTo(s, t.i, 38); MV.act.hi = true; lbl('롱스로인!'); (MV.cnt || (MV.cnt = {})).longth = ((MV.cnt || {}).longth || 0) + 1; return; } }
        const t = pickBy(mates.filter(m => m.i && m.dist < 17), m => m.open * (m.pu > u ? 1.4 : 1)); if (t) { passTo(s, t.i, 30); lbl('스로인'); } else MV.dec = 0.4; return; }
      if (rk.kind === 'fk' || rk.kind === 'ifk') {
        if (rk.kind === 'ifk') { const t = pickBy(mates.filter(m => m.i && m.dist < 14), m => m.open); if (t) { passTo(s, t.i, 36); lbl('간접 프리킥 — 터치 후 슛'); return; } }
        else if (gd <= 33 && u > 62 && Math.abs(cur.y - 32) < 26) { const fn = (PA(who, 'FIN') - 50) / 400, r = rnd2(), out = r < 0.32 ? 'block' : r < 0.5 - fn ? 'wide' : r < 0.82 ? 'save' : 'post'; shoot(M, out, gd > 26 ? 'drive' : 'curve'); lbl(gd > 26 ? '원거리 프리킥!' : '직접 프리킥!'); return; }
        else if (u > 44) { const t = pickBy(box.length ? box : mates.filter(m => m.i && m.pu > 60), hd); if (t) { passTo(s, t.i, 50); MV.act.hi = true; lbl('프리킥 크로스'); return; } } } } }
  // 골키퍼: 잡은 뒤 배급 (짧게 풀어 나가거나 길게 전방으로)
  if (h.i === 0 && MV.lastPassFrom === s && !MV.pg) { MV.lastPassFrom = null;
    if (rnd2() < 0.006 && canStage()) { lbl('백패스를 손으로 잡았다! 간접 프리킥'); deadBall(M, { type: 'ifk', s: os, sx: c01(cur.x + d * 4, 4, 96), sy: c01(cur.y, 24, 40) }); return; }
    const t = pickBy(mates.filter(m => m.i && (m.sub === 'CB' || m.sub === 'FB' || m.sub === 'DM')), m => Math.exp(-m.dist / 18) * m.open); if (t) { passTo(s, t.i, 36); lbl('골키퍼가 발로 받아 빌드업'); return; } }
  if (h.i === 0) { const long = rnd2() < 0.35 + (PA(who, 'KIC') - 50) / 250 + (TK(s).build - 1) * 0.18;
    const t = pickBy(mates.filter(m => m.i), m => long ? (m.sub === 'ST' || m.sub === 'W' || m.sub === 'AM' ? 1 + m.open : 0.2) : (m.sub === 'CB' || m.sub === 'FB' || m.sub === 'DM' ? Math.exp(-m.dist / 20) * m.open : 0.15));
    if (t) { passTo(s, t.i, long ? 55 : 38); if (long) { MV.act.hi = true; lbl('롱킥'); } } else MV.dec = 0.5; return; }
  const Bd = TK(s).build - 1, R = who.sub, pm = c01(0.5 + (M.mine.strength - M.opp.strength) / 160, 0.3, 0.7), press = nd < 6 ? 1 : nd < 12 ? 0.5 : 0.15, foe = ni >= 0 ? sideOf(os)[ni] : null;
  const lose = clampN(0.032 + press * 0.115 + (s === 'm' ? -(pm - 0.5) * 0.2 : (pm - 0.5) * 0.2) - (PA(who, 'DRI') - 50) / 700 + (PA(foe, 'TAK') - 50) / 500 + (PA(foe, 'AGG') - 50) / 900 + (TK(os).press - 1) * 0.035, 0.03, 0.42);
  const pass = (t, sp, lead, tag) => aimThen(t, () => pass0(t, sp, lead, tag));            // B3: 차기 전 몸 정렬 시간 뒤에 찬다
  const aimThen = (t, fn) => { const A = PX_CFG.align, fx = Math.hypot(cur.vx || 0, cur.vy || 0) > 1 ? Math.atan2(cur.vy, cur.vx) : (d > 0 ? 0 : Math.PI), tx2 = Math.atan2(t.q.y - cur.y, t.q.x - cur.x);
    let da = tx2 - fx; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; let at = Math.min(A.max, A.base + A.k * Math.abs(da) / Math.PI); if (prOf(nd) >= A.prHalf) at *= .5;
    const ft = footOf(who), weakSide = (ft === 'L' ? da < 0 : da > 0) && Math.abs(da) * 180 / Math.PI >= A.weakDeg; let weak = false; if (weakSide) { if (nA(who, 'TEC') >= A.weakTEC) at += A.weakAdd; else weak = true; }
    MV.aim = { s, i: h.i, x: t.q.x, y: t.q.y, at: MV.t + at, fn: () => { fn(); if (weak && MV.act) MV.act.weak = 1; } }; MV.dec = at + 0.05; cntAdd('aimN'); };
  const pass0 = (t, sp, lead, tag) => { const err = clampN((55 - PA(who, 'PAS')) / 220 + press * 0.08 + (t.dist > 30 ? 0.05 : 0) + (lead ? 0.04 : 0), 0, 0.3);   // 패스 정확도: 능력치/압박/거리
    if (rnd2() < err && ni >= 0) { let bi = -1, bd = 1e9; oarr.forEach((q, i) => { if (i && q && !MV.red[os + i]) { const dd = Math.hypot(q.x - t.q.x, q.y - t.q.y); if (dd < bd) { bd = dd; bi = i; } } }); if (bi >= 0) { passTo(os, bi, sp); return; } }
    if (!lead && !tag && Math.abs(t.q.y - 32) > 23 && rnd2() < 0.07 + err * 0.5 && canStage() && !MV.pg) { const ty = t.q.y < 32 ? 0.6 : 63.4; MV.act = { k: 'out', tx: t.q.x + d * 2, ty, sp: sp * 0.78, s: os, kind: 'th' }; MV.holder = null; return; }
    if (s === h.s && t.i && !MV.pg && !MV.sp && !MV.pen && !MV.so) { let ln = 0, cnt2 = 0; const us = []; oarr.forEach((q, j) => { if (q && !MV.red[os + j]) us.push(uOf(q.x, d)); }); us.sort((a, b2) => b2 - a); ln = Math.max(us[1] != null ? us[1] : 50, 50, uOf(MV.ball.x, d));   // 두 번째로 깊은 수비(골키퍼 포함)·공·하프라인 중 앞선 것
      const engOf = (M.evx || []).some(x => x.t === 'of' && x.defer && !x.shown && (x.ms ? 'm' : 'o') === s), offCool = MV.lastOff != null && MV.min - MV.lastOff < 6 && !engOf;   // 화면 자체 오프사이드는 6분에 한 번까지(연달아 깃발이 오르지 않게)
      if (uOf(t.q.x, d) > ln + PX_CFG.run.offMargin && canStage() && !offCool) { offScreen(M, s, t.i); return; }
      { const R = MV.offRun, rq = R && R.s === s && R.i !== h.i && MV.pos[s][R.i]; if (rq && !MV.red[s + R.i] && uOf(rq.x, d) > ln - 0.5 && canStage() && (M.evx || []).some(x => x.t === 'of' && x.defer && !x.shown && (x.ms ? 'm' : 'o') === s)) { offScreen(M, s, R.i); return; } } }   // 엔진 오프사이드: 일찍 뛰어 든 선수에게 패스 → 깃발
    passTo(s, t.i, sp); if (lead) MV.act.lead = d * lead; if (tag) { MV.act.tag = tag; lbl(tag); if (tag === '스루패스' && pstatOn()) { const c = MV.cnt || (MV.cnt = {}); c.thr = (c.thr || 0) + 1; MV.act.thrC = 1; } } if (tag === '크로스' || tag === '얼리 크로스' || tag === '롱패스' || tag === '걷어내기' || tag === '대지를 가르는 롱패스' || tag === '사이드 체인지' || tag === '헤딩 걷어내기') MV.act.hi = true;
    if (MV.act && MV.act.k === 'pass' && MV.act.px == null) { const q0 = MV.pos[MV.act.to.s][MV.act.to.i]; if (q0) { passAim(MV.act, q0); MV.rt = 0; } } };   // 찬 순간 도착 지점 확정 → 받는 선수 즉시 그 지점으로
  if (ni >= 0 && nd < 2.4 && rnd2() < 0.22 && !(MV.duelT && MV.t - MV.duelT < 2)) {        // 몸싸움: 바짝 붙었을 때 힘 대결
    MV.duelT = MV.t; MV.duel = { a: { s, i: h.i }, b: { s: os, i: ni }, t: MV.t };
    if (PA(foe, 'STR') + rnd2() * 30 > PA(who, 'STR') + PA(who, 'BAL') * 0.2 + rnd2() * 30) { lbl('몸싸움에서 이겼다'); passTo(os, ni, 30); return; }
    lbl('몸싸움으로 버텨낸다'); MV.dec = 0.35; return; }
  if (ni >= 0 && nd < 3.2 && rnd2() < Math.min(0.6, lose * 1.7)) { if (u > 28 && !(u > 82 && Math.abs(cur.y - 32) < 22) && rnd2() < 0.2 && canStage()) { (MV.cnt || (MV.cnt = {})).foul = ((MV.cnt || {}).foul || 0) + 1; MV.frz = MV.frz || {}; MV.frz[s + h.i] = MV.t + 1.2; MV.slideReq = { s: os, i: ni, t: MV.t }; foulScene(M, { s, p: sideOf(os)[ni] }); return; } if (u > 82 && Math.abs(cur.y - 32) < 22 && rnd2() < 0.18 && canStage() && !MV.skipping) fxShow(`<div class="gb">✅</div><div class="gs">정당한 태클 — 페널티 아님</div>`, 'save', 1100, false);
    MV.slideReq = { s: os, i: ni, t: MV.t }; passTo(os, ni, 30); lbl('태클!'); (MV.cnt || (MV.cnt = {})).tackle = ((MV.cnt || {}).tackle || 0) + 1; return; }                                          // 태클/인터셉트
  if (MV.finS !== s) { MV.finS = s; MV.fin = 0; } if (u < 60) MV.fin = 0;
  const wide = cur.y < 16 || cur.y > 48;
  const spaceAhead = (() => { let ok = true; oarr.forEach((q, j) => { if (!j || !q || MV.red[os + j]) return; const qu = uOf(q.x, d); if (qu > u + 1 && qu < u + 15 && Math.abs(q.y - cur.y) < 9) ok = false; }); return ok; })();   // 앞에 공간이 있는가
  const spaceAhead2 = (() => { let ok = true; oarr.forEach((q, j) => { if (!j || !q || MV.red[os + j]) return; const qu = uOf(q.x, d); if (qu > u + 1 && qu < u + 20 && Math.abs(q.y - cur.y) < 12) ok = false; }); return ok; })();   // P1 넓힌 '앞이 비었나'
  const laneF = (m) => { let md = 1e9; const vx = m.q.x - cur.x, vy = m.q.y - cur.y, L2 = vx * vx + vy * vy || 1; oarr.forEach((q, j) => { if (!j || !q || MV.red[os + j]) return; const t = ((q.x - cur.x) * vx + (q.y - cur.y) * vy) / L2; if (t < 0.1 || t > 0.95) return; md = Math.min(md, Math.hypot(cur.x + vx * t - q.x, cur.y + vy * t - q.y)); }); return md < 1.6 ? 0.05 : md < 3 ? 0.35 : 1; };   // 패스 길목에 수비가 있으면 피함
  const backF = (fw) => fw < -4 ? (spaceAhead ? 0.05 : u > 66 ? (press >= 1 ? 0.55 : 0.25) : press >= 1 ? 1.2 : 0.85) : 1;   // 공격 3분의 1 지역에선 막혀도 뒤로는 덜(옆·컷백 우선)   // 앞이 비면 백패스 거의 안 함, 막혔고 압박받으면 뒤로 돌려 볼 소유
  if (MV.reb && MV.t - MV.reb.t < 3 && h.i !== 0 && !MV.pg) {                                                   // 튕긴 공을 받은 직후
    const rb = MV.reb; MV.reb = Object.assign({}, rb, { t: -99 });
    if (s === rb.s && gd < 24) { const r = rnd2(), fn = (PA(who, 'FIN') - 50) / 300, tec = (PA(who, 'TEC') - 50) / 300;
      if (r < 0.13 - tec) { lbl('헛발질!'); let bi = -1, bd = 1e9; oarr.forEach((q, i) => { if (i && q && !MV.red[os + i]) { const dd = Math.hypot(q.x - cur.x, q.y - cur.y); if (dd < bd) { bd = dd; bi = i; } } }); if (bi >= 0) passTo(os, bi, 26); return; }
      if (r < 0.21 - tec && ni >= 0 && nd < 4) { lbl('엉켜 넘어졌다!'); MV.frz = MV.frz || {}; MV.frz[s + h.i] = MV.t + 1.3; MV.frz[os + ni] = MV.t + 1.1; passTo(os, 0, 22); return; }
      const r2 = rnd2(), out = r2 < 0.42 - fn ? 'save' : r2 < 0.66 - fn ? 'wide' : r2 < 0.9 ? 'block' : 'post'; lbl(gd < 9 ? '밀어 넣으려는데—' : '재차 슈팅!'); shoot(M, out); MV.fin = 0; return; }
    if (s !== rb.s && u < 24) { const t = pickBy(mates.filter(m => m.i && m.pu > 45), m => 1 + m.open); if (t) { pass(t, 56, 0, '걷어내기'); return; } }
  }
  const lane = h.i !== 0 && u > 60 ? shotLane(s, cur, u, d) : 9, clearC = gd < 15 && lane === 0;                // 완벽한 찬스: 가깝고 슛 길목이 비어 있음
  if ((R === 'CM' || R === 'DM' || R === 'AM') && nd < 3 && u < 75 && !(MV.escT && MV.t - MV.escT < 2.5) && rnd2() < 0.22 + (PA(who, 'DRI') + PA(who, 'AGI') - 100) / 250) { MV.escT = MV.t; lbl('탈압박!'); MV.dec = 0.35; return; }   // 미드필더: 압박을 벗겨냄
  if (R === 'W' && u > 55 && nd > 1.2 && nd < 6 && !(MV.toT && MV.t - MV.toT < 2.5) && rnd2() < 0.25 + (PA(who, 'DRI') - 50) / 120) { MV.toT = MV.t; lbl('드리블 돌파!'); MV.dec = 0.45; return; }   // 윙어: 1대1 돌파
  const roleShot = R === 'ST' ? 0.15 : R === 'W' || R === 'AM' ? 0.05 : R === 'CB' || R === 'FB' || R === 'DM' ? -0.25 : 0, range = 19 + (PA(who, 'FIN') - 50) / 6 + (R === 'ST' ? 4 : 0) - (R === 'CB' || R === 'DM' ? 7 : 0);
  if (u > 62 && gd < range) {                                                                                    // 슈팅 / 크로스 / 컷백 (포지션·결정력에 따라 슈팅 거리와 빈도가 다름)
    const shotP = clampN(0.26 + (PA(who, 'FIN') - 50) / 150 + roleShot + (gd < 18 ? 0.25 : 0) - press * 0.08 + MV.fin * 0.22 - (wide ? 0.22 : 0) + (clearC ? 0.6 : 0) - Math.min(lane, 3) * 0.1, 0.04, 0.97);
    if (rnd2() < shotP) { const r = rnd2(), fin = (PA(who, 'FIN') - 50) / 400, out = r < 0.38 - fin ? 'save' : r < 0.62 - fin ? 'wide' : r < 0.85 ? 'block' : 'post'; shoot(M, out); MV.fin = 0; return; }
    MV.fin++;
    if (!clearC && gd < 22 && h.i !== 0) {                                                                       // 슛 대신: 더 좋은 자리의 동료에게 컷백·내주기
      const better = mates.filter(m => m.i && m.pu > u - 8 && Math.hypot(100 - m.pu, m.q.y - 32) < gd - 3 && m.open > 0.8);
      const t = better.length && rnd2() < 0.7 ? pickBy(better, m => m.open * (1 + (PA(m.who, 'FIN') - 50) / 60)) : null; if (t) { pass(t, 42, 0, u > 84 ? '컷백' : null); return; } }
    if (wide && rnd2() < 0.55 + (PA(who, 'CRS') - 50) / 200) { const t = pickBy(mates.filter(m => m.pu > 78), m => 1 + (PA(m.who, 'HEA') - 50) / 80 + m.open); if (t) { { const r = rnd2(), tg = r < 0.3 ? '땅볼 크로스' : (u < 80 && r < 0.55) ? '얼리 크로스' : '크로스'; pass(t, (tg === '땅볼 크로스' ? 44 : 48) + (PA(who, 'CRS') - 50) / 8, 0, tg); } return; } }
  }
  if (u > 72 && h.i !== 0 && nd > 3 && gd > 9 && rnd2() < 0.45 + (PA(who, 'DRI') - 50) / 200) { MV.dec = 0.3 + rnd2() * 0.3; return; }   // 문전: 뒤로 돌리지 않고 골문 쪽으로 몰고 들어감
  if (u < 26 && MV.rcvHi > 0 && MV.t - MV.rcvHi < 0.6 && R !== 'GK') { MV.rcvHi = -9; const t = pickBy(mates.filter(m => m.i && m.pu > 40), m => 1 + m.open); if (t) { pass(t, 50, 0, '헤딩 걷어내기'); return; } }
  if (u < 30 && press > 0.5 && rnd2() < (u < 18 ? 0.7 : 0.35)) { const t = pickBy(mates.filter(m => m.i), m => m.sub === 'ST' || m.sub === 'W' || m.sub === 'AM' ? 1 + m.open : 0.15); if (t) { pass(t, 54 + (R === 'CB' ? (PA(who, 'STR') - 50) / 10 : 0), 0, '걷어내기'); return; } }   // 위험 지역 걷어내기
  { const RC = PX_CFG.run, TO = PX_CFG.thrOld, runners = mates.filter(m => m.i && MV.runs && MV.runs[s + m.i] && MV.runs[s + m.i].t0 <= MV.t && MV.t - MV.runs[s + m.i].t0 >= RC.seeDelay0 - RC.seeVIS * nA(who, 'VIS') && MV.runs[s + m.i].until > MV.t);   // 스루패스(3-3)
    const pool = runners.length ? runners : mates.filter(m => m.i && m.pu > u + 8 && m.pu <= line + 4 && (m.sub === 'ST' || m.sub === 'W' || m.sub === 'AM'));
    const pThr = runners.length ? clampN(RC.thrBase + RC.thr + RC.thrVIS * nA(who, 'VIS') + RC.thrPAS * nA(who, 'PAS'), 0, RC.thrMax) : (R !== 'GK' && R !== 'CB' ? clampN(TO.base + (PA(who, 'VIS') - 50) / TO.VIS + (PA(who, 'PAS') - 50) / TO.PAS, 0.02, TO.max) : 0);
    if (pool.length && prOf(nd) < 0.6 && rnd2() < pThr) {
      const t = pickBy(pool, m => m.open * laneF(m) * (1 + (PA(m.who, 'OTB') - 50) / 60)); if (t && laneF(t) > 0.3) { pass(t, 46 + PA(who, 'PAS') / 10, 6, '스루패스'); return; } } }
  if (R === 'ST' && (PA(who, 'STR') + PA(who, 'HEA')) / 2 > PA(who, 'PAC') + 4 && gd > 16 && (u < 66 || nd < 3.5) && rnd2() < 0.35) {   // 상대 진영 3분의1에선 압박받을 때만 내려줌(2-2)          // 타깃맨: 등지고 받아 내려주기
    const t = pickBy(mates.filter(m => m.i && m.pu < u && m.pu > u - 14 && m.dist < 16 && (m.sub === 'AM' || m.sub === 'CM' || m.sub === 'W')), m => m.open); if (t) { pass(t, 38); return; } }
  if (PA(who, 'VIS') > 58 && (R === 'CM' || R === 'DM' || R === 'CB') && rnd2() < 0.18) {                                // 사이드 체인지
    const t = pickBy(mates.filter(m => m.i && Math.abs(m.q.y - cur.y) > 26 && m.pu >= u - 4), m => m.open); if (t) { pass(t, 46, 0, t.dist > 40 && PA(who, 'PAS') > 60 ? '대지를 가르는 롱패스' : '사이드 체인지'); return; } }
  // (P5) 드리블 전진은 아래 선택지 점수제의 '운반'으로 옮김
  if (Bd > 0 && u < 56 && R !== 'ST' && rnd2() < 0.1 * Bd) { const t = pickBy(mates.filter(m => m.i && m.pu > u + 18 && (m.sub === 'ST' || m.sub === 'W')), m => m.open); if (t) { pass(t, 52, 0, '롱패스'); return; } }   // 직선 빌드업: 전방으로 길게
  const pr = prOf(nd), Pc = PX_CFG.pass, V0 = zoneV(u, cur.y), Tk = TK(s), sc = [];                                    // P1: 패스 점수 = 전진 가치 − 뺏길 위험 + 받는 여유
  for (const m of mates) { if (m.i === 0 && (u > 25 || rnd2() < 0.85)) continue; if (m.dist < 5) continue;
    const fw = m.pu - u, cutb = u >= 84 && m.pu > 83 && Math.abs(m.q.y - 32) < 20 && fw < -4, back = fw < -4 && !cutb; if (back && m.dist > Pc.backLongMax) continue;
    const gain = zoneV(m.pu, m.q.y) - V0, risk = pCut(cur.x, cur.y, m.q.x, m.q.y, os), loss = zoneV(100 - m.pu, m.q.y) * Pc.lossW, recv = Math.min(1, m.open * 10 / Pc.recvR);
    let S2 = Pc.gainW * gain - risk * (Pc.riskBase + loss) + Pc.recvW * recv + (m.pu > line + 1 ? -Pc.offside : 0) + (cutb ? Pc.cutback : 0) + (m.dist > 30 ? Pc.longBuild * (Tk.build - 1) : 0) + (MV.pmw && MV.pmw[s + m.i] > MV.t ? Pc.oneTwo : 0);
    const RC = PX_CFG.run, rn = MV.runs && MV.runs[s + m.i], seen = rn && rn.t0 <= MV.t && rn.until > MV.t && MV.t - rn.t0 >= RC.seeDelay0 - RC.seeVIS * nA(who, 'VIS') && prOf(nd) < 0.6;   // 3-3 침투 중인 동료: 스루패스 가산
    if (seen) S2 += RC.thr + RC.thrVIS * nA(who, 'VIS') + RC.thrPAS * nA(who, 'PAS');
    sc.push({ m, S: S2, back, fw, run: !!seen }); }
  const bestF = sc.filter(o => !o.back).reduce((a, o) => Math.max(a, o.S), -9), zone = u >= 66 ? 3 : u >= 33 ? 2 : 1;      // 2-2 백패스 규칙(구역별)
  const opts = sc.filter(o => { if (!o.back) return true; if ((spaceAhead || spaceAhead2) && pr < Pc.openBackPr) return false; if (zone === 3) return pr >= 0.6 && bestF < 0 && o.m.dist <= Pc.f3BackMaxDist; if (zone === 2) { if (!(pr >= 0.25 || bestF < 0.02)) return false; if (spaceAhead2) o.S -= Pc.midBackPen * (1 - 0.25 * (1 - Tk.build)); } return true; });
  { const Cc = PX_CFG.carry; let L = 99; oarr.forEach((q, j) => { if (!j || !q || MV.red[os + j]) return; const du = uOf(q.x, d) - u; if (du <= 0) return; if (Math.atan2(Math.abs(q.y - cur.y), du) * 180 / Math.PI <= Cc.cone) L = Math.min(L, Math.hypot(du, q.y - cur.y)); });   // P5 운반(2-4)
    if (L >= Cc.Lmin && pr <= Cc.prMax && u < 92) { const y2 = cur.y + (32 - cur.y) * Cc.inward; opts.push({ carry: true, S: Cc.gainW * (zoneV(u + Cc.step, y2) - V0) + Cc.Lw * Math.min(L, Cc.Lcap) - Cc.prW * pr + Cc.DRI * nA(who, 'DRI') - Cc.tempo * (1 - Tk.tempo) }); } }
  const Tc = PX_CFG.tau, tau = clampN(Tc.base - Tc.DEC * nA(who, 'DEC') - Tc.VIS * nA(who, 'VIS') + Tc.pr * pr - Tc.COM * nA(who, 'COM') * pr, Tc.min, Tc.max) * Tc.scale;
  { const A = PX_CFG.ask, top = sc.filter(o => o.m.open * 10 >= A.free).sort((a, c) => c.S - a.S).slice(0, 2); top.forEach(o => { const k = s + o.m.i, AK = MV.ask || (MV.ask = {}), CD = MV.askCd || (MV.askCd = {}); if ((CD[k] || -9) <= MV.t) { AK[k] = MV.t + A.dur; CD[k] = MV.t + A.cd; } }); }   // B5 공 요구
  const ch = softPick(opts, tau);
  if (ch && ch.carry) { MV.carry = { s, i: h.i, until: MV.t + PX_CFG.carry.dur }; cntAdd('carryN'); MV.dec = 0.5 + rnd2() * 0.4; return; }
  if (ch && ch.run) { pass(ch.m, 46 + PA(who, 'PAS') / 10, 6, '스루패스'); return; }
  const t = ch ? ch.m : null;
  if (t && t.pu < u - 4) { const c = MV.cnt || (MV.cnt = {}); c.back = (c.back || 0) + 1; if (t.dist > 20) c.backLong = (c.backLong || 0) + 1; if (spaceAhead) c.backOpen = (c.backOpen || 0) + 1; }   // 화면 통계(백패스·앞이 빈데 백패스)
  if (t) pass(t, 34 + PA(who, 'PAS') / 4); else MV.dec = 0.5;
}
// ---- 문전 상황(화면 연출): 튕긴 공은 공격수·동료·수비 중 가까운 쪽으로. 결과(골)는 엔진 이벤트에서만 정해짐 ----
function spillOK(A2) { return !MV.pg && canStage() && !(MV.reb && MV.t - MV.reb.t < 4 && MV.reb.n >= 2) && A2 && A2.s; }
function spill(M, A2, label, atkBias) {
  const as = A2.s, ds = as === 'm' ? 'o' : 'm', d = as === 'm' ? dM_(M) : -dM_(M), gx = d > 0 ? 99 : 1;
  const lx = c01(gx - d * (5 + rnd2() * 7), 3, 97), ly = c01((A2.ty || 32) + (rnd2() * 2 - 1) * 9, 12, 52);
  let best = null, bd = 1e9;
  for (const sd of [as, ds]) (MV.pos[sd] || []).forEach((q, i) => { if (!i || !q || MV.red[sd + i]) return; const dd = Math.hypot(q.x - lx, q.y - ly) * (sd === as ? 1 - (atkBias - 0.5) * 0.6 : 1 + (atkBias - 0.5) * 0.6) * (0.85 + rnd2() * 0.3); if (dd < bd) { bd = dd; best = { s: sd, i }; } });
  if (!best) { lbl(label); return; }
  const n = MV.reb && MV.t - MV.reb.t < 4 ? MV.reb.n + 1 : 1; MV.reb = { t: MV.t, s: as, n };
  MV.holder = null; MV.act = { k: 'pass', to: best, sp: 30, pas: 70, from: null, h0: 0.9 }; MV.poss = best.s; lbl(label); (MV.cnt || (MV.cnt = {})).spill = ((MV.cnt || {}).spill || 0) + 1;
}
function shotLane(s, cur, u, d) {                                           // 슛 길목에 있는 상대 수비 수(골키퍼 제외)
  const os = s === 'm' ? 'o' : 'm'; let n = 0;
  (MV.pos[os] || []).forEach((q, j) => { if (!j || !q || MV.red[os + j]) return; const qu = uOf(q.x, d); if (qu <= u) return; const t = (qu - u) / Math.max(1, 100 - u), ly = cur.y + (32 - cur.y) * t; if (Math.abs(q.y - ly) < 3.2) n++; });
  return n;
}
function stepBall() { if (MV) MV.dec = Math.min(MV.dec == null ? 0.2 : MV.dec, 0.2); }
function varSeq(steps) { let t = 0; steps.forEach(([html, cls, ms]) => { later(() => { if (MV && !MV.over && !MV.skipping) fxShow(html, cls, ms, true); }, t); t += ms; }); return t; }
const pick3 = a => a[Math.floor(rnd2() * a.length)];
const VAR_WHY = { off: '오프사이드', foul: '공격자 반칙', hand: '핸드볼' };
function varOverturn(M, e, ms, out, min) {                                                  // 이미 기록된 골을 VAR로 실제 번복: 점수·득점/도움 기록에서 제거
  const arr = ms ? M.evMine : M.evOpp, ix = arr.indexOf(e); if (ix >= 0) arr.splice(ix, 1);
  const team = ms ? M.mine : M.opp;
  out.push({ min, ic: '📺', cls: '', t: '<b>VAR 판독</b> — 골 취소' });
  out.push({ min, ic: '🚫', cls: 'c', t: `<b>골 취소</b> ${esc(e.sc.name)} <span class="dim">${esc(team.name)} · ${VAR_WHY[e.varOff]}</span>` });
}
function goalFx(M) {
  const pg = MV.pg; if (!pg) return;
  if (pg.off && !MV.skipping) {                                                      // 번복될 골: 일단 골 세리머니 없이 VAR 판독 → 취소
    if (pg.varDone) return;                                                          // 판독 연출 중 다시 불려도 골로 처리하지 않음
    pg.varDone = true; MV.paused = true; fxShow(`<div class="gb">⚽</div><div class="gs">골인?!</div>`, 'save', 900, true);
    later(() => { if (!MV || MV.pg !== pg) return; fxShow('<div class="gb">📺</div><div class="gs">VAR 판독 중…</div>', 'save', 1600, true);
      later(() => { if (!MV || MV.pg !== pg) return; const lg = []; varOverturn(M, pg.ev, pg.ms, lg, MV.min); MV.pg = null; lg.slice().reverse().forEach(o => MV.log.unshift(o));
        const os = pg.s === 'm' ? 'o' : 'm'; MV.act = null; MV.rs = null; MV.holder = { s: os, i: 0 }; MV.poss = os; MV.dec = 1.0; MV.cele = null; MV.regroup = 0.6;
        fxShow(`<div class="gb">🚫</div><div class="gs">골 취소 · ${VAR_WHY[pg.ev.varOff]}</div>`, 'card', 1800, true); PX.ui.render(); }, 1600); }, 900); return; }
  if (!pg.varDone) { pg.varDone = true; if (rnd2() < 0.22 && !MV.skipping) { MV.paused = true; fxShow('<div class="gb">📺</div><div class="gs">VAR 판독 중…</div>', 'save', 1500, true); pg.logs.unshift({ min: MV.min, ic: '📺', cls: '', t: '<b>VAR 판독</b> — 득점 인정' }); later(() => { if (MV && MV.pg === pg) goalFx(M); }, 1500); return; } }
  if (pg.off && MV.skipping) { const lg = pg.logs.slice(); varOverturn(M, pg.ev, pg.ms, lg, MV.min); MV.pg = null; lg.slice().reverse().forEach(o => MV.log.unshift(o)); return; }
  MV.pg = null;
  pg.logs.forEach(o => { if (MV.min > o.min) o.min = MV.min; }); pg.logs.slice().reverse().forEach(o => MV.log.unshift(o)); MV.goalRes = pg.ms ? 'o' : 'm';
  { const stt = sideOf(pg.s), outf = stt.map((_, i) => i).filter(i => i > 0 && MV.pos[pg.s][i]); const si = pg.si > 0 && MV.pos[pg.s][pg.si] ? pg.si : outf[outf.length - 1], c = MV.pos[pg.s][si], dd = pg.s === 'm' ? dM_(M) : -dM_(M);
    MV.cele = { s: pg.s, si, t: 0, cx: dd > 0 ? 91 : 9, cy: c && c.y < 32 ? 6 : 58 }; MV.regroup = 0; }
  PX.ui.sfx(pg.ms ? 'goal' : 'goalopp'); if (MV.big) setTimeout(() => PX.ui.sfx('crowd'), 250); fxShow(pg.html, pg.ms ? 'goal' : 'goal opp', 3100, true);
  if (MV.big && MV.big.k === 'derby') MV.log.unshift({ min: MV.min, ic: '🔥', cls: '', t: pg.ms ? pick3(['라이벌을 상대로 한 골! 홈 관중석이 폭발합니다!', '더비의 주인공이 나왔습니다! 서포터즈가 열광합니다!', '라이벌의 골문을 열었습니다! 관중석이 들썩입니다!']) : pick3(['라이벌에게 실점… 원정석만 환호합니다.', '더비에서 뼈아픈 실점입니다. 경기장이 조용해집니다.', '라이벌 서포터즈의 함성이 경기장을 뒤덮습니다.']) });
  if (!MV.skipping && !MV.fast && !MV.hlFast && MV.rb && MV.rb.length > 20) MV.rpWant = { f: MV.rb.slice(-42), ms: pg.ms, nm: pg.ev && pg.ev.sc ? pg.ev.sc.name : '' };
  PX.ui.render();
}
function rpStep(M, realDt) {                                                                  // 골 리플레이: 직전 약 7초를 슬로모션으로 다시 보여 줌(탭하면 건너뜀)
  const R = MV.rp; MV.paused = true; R.t += realDt * 0.75 * 10; const i = Math.floor(R.t), F = R.f;
  const lab = document.getElementById('rpl'); if (i >= F.length - 1 || R.skip || MV.over) { MV.rp = null; if (lab) lab.setAttribute('opacity', '0'); if (!MV.talk && !MV.momentOpen && !MV.mgrPanel && !MV.pg && !MV.lead && !MV.sp) MV.paused = false; MV.rb = []; return false; }
  const a = F[i], b2 = F[i + 1], k = R.t - i, L = (p, q) => p + (q - p) * k; if (lab) lab.setAttribute('opacity', (0.75 + 0.25 * Math.sin(R.t)).toFixed(2));
  const els = MV.els || (MV.els = { m: MV.mst.map((_, j) => document.getElementById('m' + j)), o: MV.ost.map((_, j) => document.getElementById('o' + j)) });
  for (const pre of ['m', 'o']) els[pre].forEach((el, j) => { const p = a[pre][j], q = b2[pre][j] || p; if (!el || !p) return; el.setAttribute('transform', `translate(${L(p[0], q[0]).toFixed(2)} ${L(p[1], q[1]).toFixed(2)})`); });
  const be = document.getElementById('ball'), sh = document.getElementById('bsh'), bx = L(a.b[0], b2.b[0]), by = L(a.b[1], b2.b[1]), bz = L(a.b[2], b2.b[2]);
  if (be) be.setAttribute('transform', `translate(${bx.toFixed(2)} ${(by - bz).toFixed(2)}) scale(${(1 + bz * 0.1).toFixed(2)})`); if (sh) sh.setAttribute('transform', `translate(${bx.toFixed(2)} ${(by + 0.9).toFixed(2)})`);
  const ln = document.getElementById('pline'); if (ln) ln.setAttribute('stroke-opacity', '0');
  return true;
}
function flushPg() { const pg = MV && MV.pg; if (!pg) return; MV.pg = null; const lg = pg.logs.slice(); if (pg.off) { try { varOverturn(G0().mm, pg.ev, pg.ms, lg, MV.min); } catch (e) {} } lg.slice().reverse().forEach(o => MV.log.unshift(o)); }
// ===== 경기 화면 결정성(단계 A-0): 판단 난수는 경기마다 시드 고정, 장면 타이머는 '경기 실제 시간'(배속 무시, 설정·나가기 창 열린 동안 멈춤) =====
function mb32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function rnd2() { return MV && MV.rng ? MV.rng() : Math.random(); }                       // 판단용 난수(그림용은 Math.random 그대로)
function nowR() { return MV ? (MV.clk || 0) * 1000 : performance.now(); }                // 경기 실제 시간(ms)
function later(fn, ms) { if (!MV) return 0; const q = MV.tq || (MV.tq = []); MV.tqId = (MV.tqId || 0) + 1; q.push({ id: MV.tqId, at: (MV.clk || 0) + (ms || 0) / 1000, fn }); return MV.tqId; }
function laterClear(id) { const q = MV && MV.tq; if (!q || !id) return; const i = q.findIndex(t => t.id === id); if (i >= 0) q.splice(i, 1); }
function laterRun(sec) { if (!MV) return; MV.clk = (MV.clk || 0) + sec; const q = MV.tq; if (!q) return; const mv0 = MV;
  for (let g = 0; g < 400; g++) { let bi = -1; for (let i = 0; i < q.length; i++) if (q[i].at <= MV.clk && (bi < 0 || q[i].at < q[bi].at || (q[i].at === q[bi].at && q[i].id < q[bi].id))) bi = i; if (bi < 0) break;
    const t = q.splice(bi, 1)[0]; try { t.fn(); } catch (e) { try { console.error(e); } catch (e2) {} } if (MV !== mv0) break; } }
function newMatchSeed(M) { return (Math.random() * 4294967296) >>> 0; }   // 경기 시작 때 무작위 시드(다시 불러오면 VAR·시간 초과 선택·승부차기가 달라질 수 있음). 검증 도구만 이 함수를 바꿔 고정
function mvPick(id) { if (!MV || !G0().mm || !MV.momentOpen) return; const M = G0().mm, mo = MV.momentOpen; const r = Core.resolveMoment(id); if (r.goal || r.assist) { MV.ballFree = false; } MV.log.unshift({ min: MV.min, ic: IC.target, cls: '', t: esc(r.text) }); MV.momentOpen = null; MV.paused = false; try { playOutcome(M, mo, r); } catch (e) { MV.holder = MV.holder || null; } stepBall(M); emitAt(M, mo ? mo.min : MV.min, true); PX.ui.move(); PX.ui.render(); }   // 선수 모드 골 장면 선택 처리(버튼·시간 초과 공통)
function frame(ts) {
  if (!MV) return; MV.raf = requestAnimationFrame(frame);
  if (MV.exitAsk || MV.setOpen) { MV.last = 0; MV.lastL = 0; return; }
  { const raw = MV.lastL ? Math.max(0, (ts - MV.lastL) / 1000) : 0; MV.lastL = ts; MV.rawE = raw; laterRun(Math.min(1, raw)); if (!MV) return; }   // 실제 경과 시간을 한 번만 구함: 장면 타이머(배속 무시, 상한 1초)                                                          // 나가기 확인 창이 떠 있는 동안은 경기 완전 정지
  const M = G0().mm; if (!M || !MV.pos) return;
  if (MV.pzUntil && MV.paused && !MV.intro && !MV.regWalk && !MV.over && !MV.talk && !MV.momentOpen && !MV.pen && !MV.so && !MV.lead && !MV.pg && !MV.sp && !MV.mgrPanel && !MV.wantPanel && MV.min > 0) {       // 창을 닫은 직후 12초 동안: 이유 없이 멈춘 경기를 자동으로 재개(안전장치)
    const nw = nowR(); if (nw > (MV.fxUntil || 0) + 1200) { MV.paused = false; MV.pzUntil = 0; } else if (nw > MV.pzUntil) MV.pzUntil = 0; }
  if (MV.wantPanel && !MV.over && !MV.pg && !MV.lead && !MV.sp && !MV.momentOpen && !MV.pen && !MV.so && !MV.cele && !MV.mgrPanel) { MV.wantPanel = false; mgrPanelOpen(); }
  if (MV.over) {                                                                          // 경기 종료: 선수·공 정지 + 가운데 종료 표시
    if (!MV.endShown) { MV.endShown = true; MV.lbl = null; { const lb0 = document.getElementById('blbl'); if (lb0) lb0.textContent = ''; } MV.act = null; MV.rs = null; MV.pg = null; MV.ln = null; MV.bz = 0; for (const pre of ['m', 'o']) (MV.pos[pre] || []).forEach(c => { if (c) c.vx = c.vy = 0; });
      const [eh, ea] = scoreAt(MV.etOn ? 120 : 90), pks = MV.so ? `<div class="endt" style="font-size:14px">승부차기 ${M.mineHome ? MV.so.sm : MV.so.so} : ${M.mineHome ? MV.so.so : MV.so.sm}</div>` : ''; fxShow(`<div class="endt">경기 종료</div><div class="ends">${eh} : ${ea}</div>${pks}`, 'end', 3600000, false); PX.ui.move(); }
    return; }
  let dt = MV.last ? Math.min(0.05, MV.rawE || 0) : 0.016; MV.last = ts; const realDt = dt; dt *= tsOf();   // 연출 시간(같은 시계, 상한 0.05초) → 경기 시간은 배속 적용
  if (MV.rp) { if (rpStep(M, realDt)) return; }
  if (MV.momentOpen && MV.settle > 0) MV.settle -= realDt; const hold = !!MV.momentOpen && !(MV.settle > 0), pdt = hold ? 0 : dt;
  if (MV.momentOpen && !MV.over) {                                                                  // 내 선택 장면: 선택하기 전에는 상대도 절대 진행하지 않는다 + 10초 제한(초과 시 무작위 선택)
    MV.paused = true; MV.sp = null;
    if (MV.moFor !== MV.momentOpen) { MV.moFor = MV.momentOpen; MV.moT = 10; }
    if (!(MV.settle > 0) && !MV.skipping) { MV.moT -= realDt; const te = document.getElementById('mvt'); if (te) { const v = String(Math.max(0, Math.ceil(MV.moT))); if (te.textContent !== v) te.textContent = v; } { const t2 = document.getElementById('mvt2'); if (t2) { const v = String(Math.max(0, Math.ceil(MV.moT))); if (t2.textContent !== v) t2.textContent = v; } }
      if (MV.moT <= 0) { MV.moT = 10; const os = Core.momentOptions(MV.momentOpen); const pk = os[Math.floor(rnd2() * os.length)]; if (pk) { PX.ui.toast('시간 초과 — 무작위 선택'); mvPick(pk.id); } } } } else MV.moFor = null;
  if (MV.cele) { MV.cele.t += realDt; if (MV.cele.t > 2.0) { MV.cele = null; MV.regroup = 1.0; MV.rt = 0; } }
  if (MV.rpWant && !MV.cele) { if (MV.over || MV.skipping || MV.fast || MV.hlFast || (typeof V3D !== 'undefined' && V3D.active && V3D.active())) MV.rpWant = null; else if (nowR() > (MV.fxUntil || 0) + 80 && !MV.momentOpen && !MV.lead && !MV.pg && !MV.talk && !MV.mgrPanel && !(MV.act && MV.act.k === 'out')) { MV.rp = { f: MV.rpWant.f, t: 0 }; MV.rpWant = null; } } else if (MV.regroup > 0) MV.regroup -= realDt;   // 3D 화면에선 2D 리플레이가 안 보여 멈춘 것처럼 보이므로 건너뜀
  if (!MV.over && MV.min > 0 && !hold) { if (MV.poss && MV.st[MV.poss]) MV.st[MV.poss].pt += dt; const mi0 = MV.myI == null ? (MV.myI = MV.mst.findIndex(p => p.me)) : MV.myI, mc = mi0 >= 0 && MV.pos.m[mi0]; if (mc) { const uu = uOf(mc.x, dM_(M)); MV.heat[Math.min(5, Math.floor(mc.y / 64 * 6)) * 10 + Math.min(9, Math.max(0, Math.floor(uu / 10)))] += dt; } }
  if (MV.pen && !MV.pen.shot && !MV.act && MV.pen.sx != null) { const bb = MV.ball, gx = MV.pen.sx - bb.x, gy = 32 - bb.y, gd = Math.hypot(gx, gy); if (gd > 0.05) { const st = Math.min(gd, Math.max(14, gd * 1.5) * realDt); bb.x += gx / gd * st; bb.y += gy / gd * st; } }   // PK 지점까지 공이 굴러감
  if (MV.sp && !MV.act) { const P0 = MV.sp, bb = MV.ball, gx = P0.sx - bb.x, gy = P0.sy - bb.y, gd = Math.hypot(gx, gy); if (gd > 0.05) { const v = Math.min(42, Math.max(16, gd / Math.max(0.25, (P0.dur || 1.9) * 0.6 - P0.t))), st = Math.min(gd, v * realDt); bb.x += gx / gd * st; bb.y += gy / gd * st; } }   // 세트피스 지점까지 공이 굴러감
  if (MV.sp) { MV.sp.t += realDt; if (!MV.sp.wh && MV.sp.kind !== 'th' && MV.sp.t > (MV.sp.dur || 1.9) - 0.6) { MV.sp.wh = 1; PX.ui.sfx('whistle'); lbl('휘슬'); retarget(M); } if (MV.sp && MV.sp.t > (MV.sp.dur || 1.9) && (Math.hypot(MV.ball.x - MV.sp.sx, MV.ball.y - MV.sp.sy) < 0.6 || MV.sp.t > (MV.sp.dur || 1.9) + 6)) endSp(M); }   // 공이 지점에 도착하면 시작(다른 공 움직임 때문에 늦어도 순간이동 없이)
  MV.t += dt; MV.rt -= dt; if (MV.kick > 0) MV.kick -= dt; if (MV.pg) MV.pg.t += dt; if (MV.rt <= 0) { retarget(M); MV.rt = 0.22; }
  const all = [];
  for (const pre of ['m', 'o']) sideOf(pre).forEach((p, i) => {
    const c = MV.pos[pre][i], g = MV.tgt[pre][i]; if (!c || !g) return;
    if (MV.red[pre + i] || (MV.frz && MV.frz[pre + i] > MV.t)) { c.vx = c.vy = 0; return; }
    const dx = g.x - c.x, dy = g.y - c.y, dist = Math.hypot(dx, dy) || 1e-6, tired = clampN((60 - PA(p, 'STA')) / 200 * (MV.min / 90), 0, 0.2);
    const carry = MV.holder && MV.holder.s === pre && MV.holder.i === i ? 0.86 + PA(p, 'DRI') / 700 + PA(p, 'AGI') / 1400 : 1, vmax = carry * (8 + PA(p, 'PAC') / 9) * (g.sprint || dist > 12 ? 1 : 0.72) * (MV.intro ? introSpd(pre, i) : 1) * (1 - tired) * (MV.kick > 0 ? 1.15 : 1) * (MV.lead || MV.regroup > 0 ? 2.3 : MV.cele || MV.sp ? 1.5 : 1), want = Math.min(vmax, dist * 3.2) * ((Math.hypot(c.vx, c.vy) > vmax * 0.5 && (c.vx * dx + c.vy * dy) < 0) ? PX_CFG.turn.decel : 1), acc = (30 + PA(p, 'AGI') / 2) * pdt;
    c.vx += clampN(dx / dist * want - c.vx, -acc, acc); c.vy += clampN(dy / dist * want - c.vy, -acc, acc);
    if (hold) { c.vx = c.vy = 0; if (!MV.over) { const ph = MV.t * 0.0 + (nowR() / 1000) * (1.1 + (i % 5) * 0.13) + i * 1.9 + (pre === 'o' ? 1.3 : 0); c.x += Math.cos(ph) * 0.55 * realDt; c.y += Math.sin(ph * 0.87) * 0.55 * realDt; } } c.x += c.vx * pdt; c.y += c.vy * pdt; all.push(c);   // 선택 대기 중에도 선수들이 제자리에서 살짝 움직여 멈춘 것처럼 보이지 않게
  });
  if (!MV.intro) for (let a = 0; a < all.length; a++) for (let b2 = a + 1; b2 < all.length; b2++) {
    const p = all[a], q = all[b2], dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy; if (d2 < 5.5 && d2 > 1e-4) { const d = Math.sqrt(d2), push = (2.35 - d) * 0.5; p.x -= dx / d * push; p.y -= dy / d * push; q.x += dx / d * push; q.y += dy / d * push; } }
  if (MV.lead) { const L = MV.lead; L.t += realDt; let ok = true, far = 0; for (const k in MV.force) { const c = MV.pos[k[0]][+k.slice(1)], F = MV.force[k]; if (c) { const dd = Math.hypot(c.x - F.x, c.y - F.y); if (dd > 1.8) ok = false; if (dd > far) far = dd; } } if ((ok && L.t > 1.1 && !MV.act) || (L.t > L.max && ((far < 5 && !MV.act) || L.t > L.max + 1.8))) { endLead(M); return; } }   // 멀리 남은 선수가 있으면 조금 더 달려가게(끝날 때 순간이동 줄임)
  // 안전장치: 공이 주인 없이(또는 퇴장 선수에게) 멈춰 있으면 가장 가까운 선수에게 공을 줌
  { const idle = !MV.paused && !MV.act && !MV.rs && !MV.goalRes && !MV.sp && !MV.pen && !MV.so && !MV.lead && !MV.momentOpen && !MV.cele && !MV.talk && !MV.pg && !MV.over && MV.min > 0;
    const hd = MV.holder, bad = hd && (MV.red[hd.s + hd.i] || !MV.pos[hd.s][hd.i]);
    if (idle && (!hd || bad)) { MV.stillT = (MV.stillT || 0) + realDt; } else MV.stillT = 0;
    if (MV.stillT > 1.2 || (bad && MV.stillT > 0.3)) { MV.stillT = 0; const pref = (hd && hd.s) || MV.poss || 'm'; let bs = null, bi = -1, bd = 1e9;
      for (const sd of [pref, pref === 'm' ? 'o' : 'm']) { MV.pos[sd].forEach((q, i) => { if (!q || i === 0 || MV.red[sd + i]) return; const dd = Math.hypot(q.x - MV.ball.x, q.y - MV.ball.y) + (sd === pref ? 0 : 6); if (dd < bd) { bd = dd; bi = i; bs = sd; } }); }
      if (bi >= 0) { MV.holder = { s: bs, i: bi }; MV.poss = bs; MV.dec = 0.5; MV.act = null; MV.cnt = MV.cnt || {}; MV.cnt.rescue = (MV.cnt.rescue || 0) + 1; retarget(M); } } }
  if (!hold && !MV.paused && !MV.over && MV.min > 0) { MV.sdT = (MV.sdT || 0) + realDt; if (MV.sdT >= 0.2) { MV.sdT = 0; try { stageDeferred(M); } catch (e) {} } }
  const b = MV.ball, act = MV.act;
  if (MV.pg && !MV.act && MV.holder && MV.holder.s !== MV.pg.s) {                                // 득점 연출 중에는 득점 팀이 공을 가져옴
    const s = MV.pg.s, arr = MV.pos[s]; let bi = -1, bd = 1e9; arr.forEach((q, i) => { if (!q || i === 0 || MV.red[s + i]) return; const dd = Math.hypot(q.x - b.x, q.y - b.y); if (dd < bd) { bd = dd; bi = i; } }); if (bi >= 0) passTo(s, bi, 52); }
  if (MV.act) {
    const A2 = MV.act; let tx, ty;
    if (A2.k === 'pass') { const q = MV.pos[A2.to.s][A2.to.i]; if (!q) { MV.act = null; return; } if (A2.px == null) { passAim(A2, q); MV.rt = 0; } tx = A2.px; ty = A2.py; }
    else if (A2.k === 'shot' && (A2.out === 'save' || A2.out === 'block')) { const tt = A2.out === 'save' ? { s: A2.s === 'm' ? 'o' : 'm', i: 0 } : A2.to, q = tt && MV.pos[tt.s][tt.i]; tx = q ? q.x : A2.tx; ty = q ? q.y : A2.ty; }
    else { tx = A2.tx; ty = A2.ty; }
    let dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy), step = A2.sp * dt;
    if (A2.d0 == null) { A2.d0 = Math.max(d, 1); A2.x0 = b.x; A2.y0 = b.y; A2.h = A2.h0 != null ? A2.h0 : A2.k === 'shot' ? 1.4 : A2.hi ? (A2.tag === '얼리 크로스' ? 3.0 : 3.8) : A2.tag === '땅볼 크로스' ? 0.05 : A2.d0 > 34 ? 2.4 : A2.d0 > 24 ? 0.45 : 0.05;
      if (A2.k === 'pass') { A2.dev = (rnd2() + rnd2() - 1) * clampN((62 - (A2.pas || 55)) / 14 + 0.7, 0.35, 3.4) * clampN(A2.d0 / 30, 0.3, 1.4) * (A2.weak ? PX_CFG.align.weakDev : 1); if (!MV.lead) { laneCheck(M, A2, tx, ty); if (MV.act !== A2) return; } } }
    if (A2.k === 'pass' && !A2.hi && !A2.cross) step *= 1.2 - 0.4 * clampN(1 - d / A2.d0, 0, 1);                       // 땅볼 패스: 처음엔 빠르고 굴러가며 감속(마찰)
    { const pr = clampN(1 - d / A2.d0, 0, 1); MV.bz = A2.h * Math.sin(Math.PI * pr) + (A2.eh || 0) * pr; } MV.ln = { x0: A2.x0, y0: A2.y0, x1: tx, y1: ty };
    if (d <= step + 0.9 && passWait(A2, tx, ty, dt)) { /* 받는 선수 기다림 */ }
    else if (d <= step + 0.9) { b.x = tx; b.y = ty; MV.act = null; if (A2.k === 'pass' && A2.from === A2.to.s && MV.runs && MV.runs[A2.to.s + A2.to.i]) cntAdd('runRecv');
      if (A2.k === 'pass' && !A2.lane && A2.to.i !== 0 && !MV.pg && !MV.pen && !MV.so && !MV.sp && !MV.lead && !MV.momentOpen && !MV.talk) {            // 퍼스트터치: 기술이 낮고 압박받으면 공을 흘림
        const rs = A2.to.s, ro = rs === 'm' ? 'o' : 'm', rq = MV.pos[rs][A2.to.i], rp = sideOf(rs)[A2.to.i]; let nj = -1, nd2 = 6; MV.pos[ro].forEach((q, j) => { if (j && q && !MV.red[ro + j] && rq) { const dd = Math.hypot(q.x - rq.x, q.y - rq.y); if (dd < nd2) { nd2 = dd; nj = j; } } });
        const Sc = PX_CFG.scan, blind = !scanned(rs, A2.to.i) && nj >= 0 && nd2 < Sc.backR; if (blind) cntAdd('blindRecv');
        if (nj >= 0 && rp && rnd2() < clampN((58 - PA(rp, 'TEC')) / 600, 0, 0.07) + (nd2 < 3.5 ? 0.015 : 0) + (blind ? clampN(Sc.loseBase - Sc.loseCOM * nA(rp, 'COM'), 0.05, 0.6) * Sc.loseScale : 0)) { MV.holder = { s: ro, i: nj }; MV.poss = ro; MV.tOver = MV.t; MV.tOverS = ro; MV.dec = 0.5; lbl('퍼스트터치 실수'); (MV.cnt || (MV.cnt = {})).touch = ((MV.cnt || {}).touch || 0) + 1; const t1 = MV.st && MV.st[rs]; if (t1) t1.pm++; retarget(M); return; } }
      if (A2.k === 'pass' && A2.thrC && A2.from === A2.to.s) { const c = MV.cnt || (MV.cnt = {}); c.thrOK = (c.thrOK || 0) + 1; }
      if (A2.k === 'pass' && A2.from === A2.to.s && A2.to.i !== 0) { const rq = MV.pos[A2.to.s][A2.to.i], rp2 = sideOf(A2.to.s)[A2.to.i], dd2 = A2.to.s === 'm' ? dM_(M) : -dM_(M); if (rq && rp2) { const T = PX_CFG.touch, op = scanned(A2.to.s, A2.to.i), len = T.base + T.TEC * (1 - nA(rp2, 'TEC')) / 2; MV.ft = { s: A2.to.s, i: A2.to.i, until: MV.t + T.dur, dx: op ? dd2 : 0, dy: op ? (32 - rq.y) * 0.02 : (rq.y < 32 ? -1 : 1), len: op ? len : 0.6 }; } }
      if (A2.k === 'pass') { MV.lastPassFrom = A2.from === A2.to.s ? A2.from : null; MV.rcvHi = (A2.hi || A2.cross || (A2.h || 0) > 2) ? MV.t : -9; if (MV.poss !== A2.to.s) { MV.tOver = MV.t; MV.tOverS = A2.to.s; } if (MV.holder === null && MV.poss !== A2.to.s) MV.fin = 0; MV.holder = A2.to; MV.poss = A2.to.s; MV.dec = A2.to.i === 0 ? 1.1 + rnd2() * 0.5 : (MV.pg && MV.pg.deliv && A2.to.i === MV.pg.si) ? 0.06 : 0.45 + rnd2() * 0.7; if (MV.lead) MV.dec = 99; retarget(M); }
      else if (A2.k === 'out') outDone(M, A2);
      else if (A2.k === 'shot') { const os = A2.s === 'm' ? 'o' : 'm';
        if (A2.out === 'goal') { if (MV.pg && MV.pg.so) { MV.pg = null; lbl('골!'); } else { MV.pen = null; goalFx(M); } }
        else if (A2.out === 'save') { const px = MV.pg;
          if (px && px.rb1 && !px.rb2 && px.pp && px.pp.special === 'rebound' && MV.pos[px.s][px.si]) { px.rb2 = px.deliv = 1; lbl('선방! 튕겨 나온 공!'); MV.act = { k: 'pass', to: { s: px.s, i: px.si }, sp: 52, pas: 70, from: px.s, h0: 1.2 }; }
          else if (!MV.pg && rnd2() < 0.2 && canStage()) { lbl('선방! 코너킥'); sendOut(M, A2.s, 'cn'); }
          else if (!MV.pg && (A2.eh || 0) > 1.9 && rnd2() < 0.55 && canStage()) { MV.gkAct = { s: os, k: 'tip', t: MV.t }; lbl('손끝으로 쳐냈다! 코너킥'); sendOut(M, A2.s, 'cn'); }
          else if (spillOK(A2) && rnd2() < 0.4) { const hi = (A2.eh || 0) > 1.4; MV.gkAct = { s: os, k: hi ? 'punch' : 'parry', t: MV.t }; spill(M, A2, hi ? '펀칭으로 쳐냈다!' : '선방! 튕겨 나온 공', 0.55); }
          else { MV.gkAct = { s: os, k: 'catch', t: MV.t }; lbl((A2.eh || 0) > 1.6 ? '높은 공을 잡아냈다' : '두 손으로 잡았다'); MV.holder = { s: os, i: 0 }; MV.poss = os; MV.dec = 1.2 + rnd2() * 0.5; retarget(M); } }
        else if (A2.out === 'block') { if (!MV.pg && rnd2() < 0.3 && canStage()) { lbl('수비 맞고 코너킥'); sendOut(M, A2.s, 'cn'); } else if (spillOK(A2) && rnd2() < 0.45) spill(M, A2, '맞고 굴절!', 0.5); else { lbl('막았다!'); MV.holder = A2.to; MV.poss = os; MV.dec = 0.4; retarget(M); } }
        else if (A2.out === 'post' && spillOK(A2) && rnd2() < 0.55) spill(M, A2, (A2.eh || 0) > 2.2 ? '크로스바 맞고 튕겼다!' : '골대 맞고 튕겼다!', 0.6);
        else if (A2.out === 'post') { lbl((A2.eh || 0) > 2.2 ? '크로스바!' : '골대!'); let bi = -1, bd = 1e9; MV.pos[os].forEach((q, i) => { if (i === 0 || !q || MV.red[os + i]) return; const dd = Math.hypot(q.x - b.x, q.y - b.y); if (dd < bd) { bd = dd; bi = i; } }); if (bi >= 0) passTo(os, bi, 40); }
        else { lbl((A2.eh || 0) > 2.6 ? '골대 위로 날아갔다' : '빗나감'); MV.rs = { t: 0.9, s: os, i: 0 }; MV.holder = null; MV.poss = os; } }            // 골킥 준비
    } else { b.x += dx / d * step; b.y += dy / d * step; }
  } else if (MV.rs) {
    MV.bz = 0; MV.ln = null;
    { const q0 = MV.pos[MV.rs.s][MV.rs.i]; if (q0) { const gx = q0.x - b.x, gy = q0.y - b.y, gd = Math.hypot(gx, gy); if (gd > 0.05) { const st = Math.min(gd, Math.max(14, gd / Math.max(0.15, MV.rs.t)) * dt); b.x += gx / gd * st; b.y += gy / gd * st; } } }   // 골킥 준비: 공이 골키퍼에게 굴러감
    MV.rs.t -= dt; if (MV.rs.t <= 0) { const q = MV.pos[MV.rs.s][MV.rs.i]; b.x = q.x; b.y = q.y; MV.holder = { s: MV.rs.s, i: MV.rs.i }; MV.poss = MV.rs.s; MV.dec = 1.0; MV.rs = null; retarget(M); }
  } else if (MV.holder && MV.pos[MV.holder.s][MV.holder.i]) {
    MV.bz = 0; MV.ln = null;
    const hp = MV.pos[MV.holder.s][MV.holder.i], dd = MV.holder.s === 'm' ? dM_(M) : -dM_(M), k = Math.min(1, dt * 16);
    { const gx = c01(hp.x + dd * 1.7, 1.5, 98.5) - b.x, gy = hp.y - b.y, gl = Math.hypot(gx, gy), mv = Math.min(gl * k, Math.max(0.9, 30 * dt)); if (gl > 1e-6) { b.x += gx / gl * mv; b.y += gy / gl * mv; } }   // 공이 선수에게 끌려가듯 붙지 않게 속도 상한
    if (MV.aim) { const A = MV.aim; if (!MV.holder || MV.holder.s !== A.s || MV.holder.i !== A.i || MV.act || MV.sp || MV.pen || MV.so || MV.over) MV.aim = null; else if (MV.t >= A.at && (!MV.paused || MV.pg)) { MV.aim = null; try { A.fn(); } catch (e) {} } }   // B3 차기 전 몸 정렬 → 그 뒤 패스
    if ((!MV.paused || MV.pg) && !MV.over && !MV.momentOpen && !MV.aim && !MV.intro) { MV.dec -= dt * (1 + 0.14 * (TK((MV.holder && MV.holder.s) || MV.poss).tempo - 1)); if (MV.dec <= 0) decide(M); }
  }
  if ((MV.goalRes || MV.regWalk || MV.htWait) && !MV.act && !MV.sp && !MV.pen && !MV.so && !MV.pg) { if (MV.goalRes && !MV.momentOpen) { MV.holder = null; MV.rs = null; } const gx = 50 - b.x, gy = 32 - b.y, gd = Math.hypot(gx, gy); if (gd > 0.05) { const st = Math.min(gd, Math.max(20, gd * 1.6) * realDt); b.x += gx / gd * st; b.y += gy / gd * st; } }   // 킥오프 대기: 공이 가운데로 돌아감
  if (MV.goalRes && !MV.paused && !MV.act && !MV.momentOpen && (() => { const ki = Math.min(6, sideOf(MV.goalRes).length - 1), kq = MV.pos[MV.goalRes][ki], qk = MV.fast || MV.skipping || MV.hlFast; if (!qk && (MV.cele || MV.regroup > 0)) return false; MV.koW = (MV.koW || 0) + realDt;   // 세레머니 끝난 뒤부터 잼
      const home = qk || ['m', 'o'].every(pre => { const d = pre === 'm' ? dM_(M) : -dM_(M); return MV.pos[pre].every((c, i) => !c || MV.red[pre + i] || (d > 0 ? c.x : 100 - c.x) <= 50.6); });   // 모두 자기 진영으로 돌아온 뒤 킥오프
      const ok = Math.hypot(b.x - 50, b.y - 32) < 1 && kq && Math.hypot(kq.x - 50, kq.y - 32) < 2.2 && home; if (!ok && MV.koW > (qk ? 3 : 8)) { cntAdd('koFb'); return true; } return ok; })()) {
    const s = MV.goalRes, st = sideOf(s); MV.goalRes = null; MV.koW = 0; MV.cele = null; MV.regroup = 0; b.x = 50; b.y = 32; MV.holder = { s, i: Math.min(6, st.length - 1) }; MV.poss = s; MV.dec = 0.45; MV.kick = 0.7; MV.fin = 0; retarget(M); }
  const els = MV.els || (MV.els = { m: MV.mst.map((_, i) => document.getElementById('m' + i)), o: MV.ost.map((_, i) => document.getElementById('o' + i)) });
  for (const pre of ['m', 'o']) els[pre].forEach((el, i) => { const c = MV.pos[pre][i]; if (!el || !c) return; const sp = Math.hypot(c.vx, c.vy), bob = Math.abs(Math.sin(MV.t * 11 + i * 1.3)) * Math.min(0.6, sp / 25);
    const jmp = MV.cele && pre === MV.cele.s && i > 0 && sp < 4 ? Math.abs(Math.sin(MV.t * 9 + i * 0.7)) * (i === MV.cele.si ? 2.4 : 1.5) : 0;
    el.setAttribute('transform', `translate(${c.x.toFixed(2)} ${(c.y - bob - jmp).toFixed(2)})${MV.frz && MV.frz[pre + i] > MV.t ? ' rotate(86)' : ''}`); if (MV.red[pre + i]) el.style.opacity = 0.12; });
  try { refStep(M, realDt); } catch (e) {}
  try { pstatFrame(M); } catch (e) {}
  if (MV.intro) { try { introTick(M, realDt); } catch (e) {} }
  if (MV.pg && !MV.holder && !MV.act && !MV.sp && !MV.pen && !MV.so && !MV.lead && !MV.goalRes && !MV.cele) { MV.pgIdle = (MV.pgIdle || 0) + realDt;   // 안전장치: 골 연출 중 공 주인이 1초 넘게 없으면 득점 팀 가장 가까운 선수에게
    if (MV.pgIdle > 1) { MV.pgIdle = 0; const s2 = MV.pg.s; let bi = -1, bd = 1e9; (MV.pos[s2] || []).forEach((q, j) => { if (j && q && !MV.red[s2 + j]) { const dd = Math.hypot(q.x - MV.ball.x, q.y - MV.ball.y); if (dd < bd) { bd = dd; bi = j; } } }); if (bi > 0) { MV.holder = { s: s2, i: bi }; MV.poss = s2; MV.dec = 0.3; (MV.cnt || (MV.cnt = {})).pgRescue = ((MV.cnt || {}).pgRescue || 0) + 1; } } } else MV.pgIdle = 0;
  if (!hold && !MV.rp) { MV.rbT = (MV.rbT || 0) + dt; if (MV.rbT >= 0.1) { MV.rbT = 0; const rb = MV.rb || (MV.rb = []); rb.push({ b: [MV.ball.x, MV.ball.y, MV.act ? (MV.bz || 0) : 0], m: MV.pos.m.map(c => c ? [c.x, c.y] : null), o: MV.pos.o.map(c => c ? [c.x, c.y] : null) }); if (rb.length > 90) rb.shift(); } }
  const bz = MV.act ? (MV.bz || 0) : 0, be = document.getElementById('ball'); let cvx = 0, cvy = 0;
  if (MV.act && (MV.act.k === 'pass' || MV.act.k === 'shot') && MV.act.dev && MV.ln) { const A3 = MV.act, ex = MV.ln.x1 - A3.x0, ey = MV.ln.y1 - A3.y0, el2 = Math.hypot(ex, ey) || 1, pr = clampN(1 - Math.hypot(MV.ln.x1 - b.x, MV.ln.y1 - b.y) / A3.d0, 0, 1), o2 = A3.dev * Math.sin(Math.PI * pr); cvx = -ey / el2 * o2; cvy = ex / el2 * o2; }   // 부정확한 패스는 휘어서 날아감
  if (be) be.setAttribute('transform', `translate(${(b.x + cvx).toFixed(2)} ${(b.y + cvy - bz).toFixed(2)}) scale(${(1 + bz * 0.1).toFixed(2)})`);
  const sh = document.getElementById('bsh'); if (sh) sh.setAttribute('transform', `translate(${(b.x + cvx).toFixed(2)} ${(b.y + cvy + 0.9).toFixed(2)})`);
  const ln = document.getElementById('pline'); if (ln) { if (MV.act && MV.ln && !MV.act.cross) { ln.setAttribute('x1', MV.ln.x0.toFixed(1)); ln.setAttribute('y1', MV.ln.y0.toFixed(1)); ln.setAttribute('x2', MV.ln.x1.toFixed(1)); ln.setAttribute('y2', MV.ln.y1.toFixed(1)); ln.setAttribute('stroke-opacity', '0.4'); } else ln.setAttribute('stroke-opacity', '0'); }
  const lb = document.getElementById('blbl'); if (lb) { if (MV.lbl && MV.lbl.l > 0) { if (lb.textContent !== MV.lbl.t) lb.textContent = MV.lbl.t; lb.setAttribute('transform', `translate(${c01(b.x, 8, 92).toFixed(1)} ${c01(b.y - 4, 5, 60).toFixed(1)})`); lb.setAttribute('opacity', Math.min(1, MV.lbl.l * 2).toFixed(2)); MV.lbl.l -= realDt; } else lb.setAttribute('opacity', '0'); }
}
// ---- 장면 연출: 선택 장면이 열리면 상황에 맞게 공·선수를 세팅하고, 선택 결과대로 이어 간다 ----
// t: att(내가 공격 중) / def(상대가 공격, 내가 수비) / gk(내가 골키퍼)  ·  me: 내 위치 [u, y]('w'=측면)  ·  opp: 공을 가진 상대 위치  ·  cross: 크로스를 올리는 위치
const SCN = {
  box: { t: 'att', me: [88, 32] }, through: { t: 'att', me: [72, 32] }, crossIn: { t: 'att', me: [90, 30], cross: [79, 'w'] }, link: { t: 'att', me: [66, 32] }, counter: { t: 'att', me: [60, 32], few: 1 },
  wing: { t: 'att', me: [78, 'w'] }, cutinM: { t: 'att', me: [76, 'w'] }, counterW: { t: 'att', me: [66, 'w'], few: 1 }, far: { t: 'att', me: [90, 36], cross: [80, 'w'] },
  setp: { t: 'att', me: [80, 32] }, zone14: { t: 'att', me: [72, 32] }, second: { t: 'att', me: [82, 38] },
  pressA: { t: 'att', me: [52, 32] }, longC: { t: 'att', me: [74, 32] }, thruM: { t: 'att', me: [60, 32] }, overlap: { t: 'att', me: [66, 'w'] }, cornerH: { t: 'att', me: [93, 30], cross: [100, 'c'] },
  buildD: { t: 'att', me: [38, 32] }, buildFB: { t: 'att', me: [38, 'w'] }, buildCB: { t: 'att', me: [24, 30] },
  tackleM: { t: 'def', opp: [52, 32] }, interceptD: { t: 'def', opp: [46, 32] }, secondD: { t: 'def', opp: [46, 36] }, duelD: { t: 'def', opp: [36, 'w'] }, duelCB: { t: 'def', opp: [27, 32] },
  aerialM: { t: 'def', opp: [10, 30], cross: [24, 'w'], oppSt: 1 },
  shotG: { t: 'gk', me: [4, 32], opp: [17, 32] }, oneone: { t: 'gk', me: [6, 32], opp: [12, 32] }, crossG: { t: 'gk', me: [4, 32], opp: [9, 30], cross: [20, 'w'], oppSt: 1 }, penG: { t: 'gk', me: [4, 32], opp: [11, 32] },
  distG: { t: 'att', me: [4, 32] },
  pressS: { t: 'att', me: [62, 32], few: 1 }, pressW: { t: 'att', me: [66, 'w'], few: 1 }, winBall: { t: 'att', me: [46, 32] },
  cutbackD: { t: 'def', opp: [16, 'w'] }, blockCB: { t: 'def', opp: [30, 32] },
};
function stageMoment(M, mo, soft) {
  const mi = MV.mst.findIndex(p => p.me); if (mi < 0) return; const me = MV.pos.m[mi]; if (!me) return;
  const sc = SCN[mo.kind] || SCN.box, d = dM_(M), ab = (u) => d > 0 ? u : 100 - u, curU = d > 0 ? me.x : 100 - me.x, side = rnd2() < 0.75 ? (me.y < 32 ? 12 : 52) : (me.y < 32 ? 52 : 12);   // 지금 서 있는 쪽 측면을 우선
  const KEEP = new Set(['buildD', 'buildFB', 'buildCB', 'distG', 'setp', 'cornerH']), mu0 = (sc.t === 'att' && !sc.cross && !KEEP.has(mo.kind)) ? Math.min(92, Math.max(sc.me[0], curU - 1)) : (sc.me ? sc.me[0] : 50);   // 탈취 후 뒤로 물러나지 않게: 이미 올라가 있으면 그 자리에서 시작
  const Y = (v) => v === 'w' ? side : v === 'c' ? (side < 32 ? 1.5 : 62.5) : v, C = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const put = (c, u, y) => { if (!c) return; c.x = C(ab(u), 2, 98); c.y = C(y, 2, 62); c.vx = c.vy = 0; };
  const mates = MV.mst.map((p, i) => ({ p, i })).filter(o => o.i !== mi && o.i !== 0 && !MV.red['m' + o.i]);
  const opps = MV.ost.map((p, i) => ({ p, i })).filter(o => o.i !== 0 && !MV.red['o' + o.i]);
  const takeNear = (list, x, y, used) => { let b = null, bd = 1e9; list.forEach(o => { if (used.has(o.i)) return; const c = MV.pos[list === mates ? 'm' : 'o'][o.i]; if (!c) return; const dd = Math.hypot(c.x - x, c.y - y); if (dd < bd) { bd = dd; b = o; } }); if (b) used.add(b.i); return b; };
  const um = new Set(), uo = new Set(); MV.act = null; MV.rs = null; MV.holder = null; MV.run = {}; MV.settle = sc.cross ? 1.0 : 0.05; MV.stage = sc.t;
  const setBall = (c) => { MV.ball.x = c.x; MV.ball.y = c.y; };
  if (sc.t === 'att') {
    put(me, mu0, Y(sc.me[1])); const mu = mu0, my = me.y, up = my < 32 ? 1 : -1;
    const o1 = takeNear(opps, me.x, me.y, uo); if (o1) put(MV.pos.o[o1.i], mu + 4, my + up * 5);
    if (!sc.few) { const o2 = takeNear(opps, me.x, me.y, uo); if (o2) put(MV.pos.o[o2.i], mu + 8, my - up * 6); }
    const m1 = takeNear(mates, me.x, me.y, um); if (m1) put(MV.pos.m[m1.i], mu + 2, 64 - my);
    const m2 = takeNear(mates, me.x, me.y, um); if (m2) put(MV.pos.m[m2.i], mu - 7, my + up * 12);
    if (sc.cross) { const cm = takeNear(mates, ab(sc.cross[0]), Y(sc.cross[1]), um); if (cm) { const cc = MV.pos.m[cm.i]; put(cc, sc.cross[0], Y(sc.cross[1])); setBall(cc); MV.holder = null; MV.act = { k: 'pass', to: { s: 'm', i: mi }, sp: 40, hi: true }; MV.poss = 'm'; } else { setBall(me); MV.holder = { s: 'm', i: mi }; } }
    else { setBall(me); MV.holder = { s: 'm', i: mi }; }
    MV.poss = 'm';
  } else {
    let oi = null;
    if (sc.t === 'gk') put(me, sc.me[0], Y(sc.me[1])); 
    const want = sc.opp; const pickAtk = () => { const pool = opps.filter(o => ['ST', 'W', 'AM'].includes(o.p.sub)); const src = pool.length ? pool : opps; return takeNear(src, ab(want[0]), Y(want[1]), uo); };
    const o1 = pickAtk(); if (!o1) return; oi = o1.i; const oc = MV.pos.o[oi];
    if (sc.cross) {                                                                    // 측면에서 올라오는 크로스 → 박스 안 상대 공격수
      put(oc, sc.cross[0], Y(sc.cross[1])); const st = takeNear(opps.filter(o => o.i !== oi), ab(want[0]), Y(want[1]), uo); setBall(oc);
      if (st) { put(MV.pos.o[st.i], want[0], Y(want[1])); MV.holder = null; MV.act = { k: 'pass', to: { s: 'o', i: st.i }, sp: 40, hi: true }; oi = st.i; } else { MV.holder = { s: 'o', i: oi }; }
      if (sc.t === 'def') put(me, want[0] - 4, Y(want[1]) + (Y(want[1]) < 32 ? 3 : -3));
    } else { put(oc, want[0], Y(want[1])); setBall(oc); MV.holder = { s: 'o', i: oi }; if (sc.t === 'def') put(me, want[0] - 5, oc.y + (oc.y < 32 ? 2.5 : -2.5)); }
    MV.poss = 'o'; MV.stageOpp = oi;
    const m1 = takeNear(mates, me.x, me.y, um); if (m1) put(MV.pos.m[m1.i], (sc.t === 'gk' ? 8 : want[0] - 7), 64 - me.y);
    const o2 = takeNear(opps, me.x, me.y, uo); if (o2) put(MV.pos.o[o2.i], want[0] + 8, 64 - Y(want[1]));
  }
  if (soft) return;
  MV.dec = 99; retarget(M); fxShow(`<div class="gs">⚡ 내 차례!</div>`, 'save', 900, false);
}
// ---- 장면 연결: 지금 흐름(공 소유)에 맞는 장면을 고르고, 선수들이 달려가며 자연스럽게 장면에 진입한다 ----
const FLOWK = new Set(['counter', 'counterW', 'winBall', 'pressS', 'pressW', 'pressA', 'thruM']);
function chooseKind(M) {
  const kinds = Core.posKinds(Core.me().sub), prevK = (M.moments[M.mi - 1] || {}).kind, poss = MV.poss;
  const w = kinds.map(k => { const t = (SCN[k] || {}).t || 'att'; let x;
    if (poss === 'm') x = t === 'att' ? 2.6 : 0.6; else x = t === 'att' ? (FLOWK.has(k) ? 1.8 : 0.55) : 2.6;
    if (k === 'setp' || k === 'cornerH') x *= 0.7; if (k === prevK) x *= 0.25; return x; });
  let r = rnd2() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < kinds.length; i++) { r -= w[i]; if (r <= 0) return kinds[i]; } return kinds[0];
}
function leadText(kind, prev) {
  const t = (SCN[kind] || {}).t || 'att';
  if (t === 'att') return prev === 'o' ? (FLOWK.has(kind) ? '압박·인터셉트로 공 탈취!' : '공을 되찾았습니다!') + ' 역습 기회' : kind === 'setp' ? '프리킥 기회를 얻었습니다' : kind === 'cornerH' ? '코너킥 — 공격에 가담합니다' : '공격을 전개합니다 · 기회가 열립니다';
  if (t === 'gk') return prev === 'm' ? '공을 빼앗겼습니다! 위기입니다' : '상대 공격이 골문을 위협합니다';
  return prev === 'm' ? '공을 빼앗겼습니다! 상대 역습' : '상대의 공격이 이어집니다';
}
function beginLead(M, mo) {
  const mi = MV.mst.findIndex(p => p.me);
  if (mi < 0 || !MV.pos.m[mi]) { MV.momentOpen = mo; stageMoment(M, mo); return; }
  const prev = MV.poss; mo.kind = chooseKind(M);
  const cp = (a) => a.map(c => c && { x: c.x, y: c.y }), old = { m: cp(MV.pos.m), o: cp(MV.pos.o), ball: { x: MV.ball.x, y: MV.ball.y } };
  stageMoment(M, mo, true);                                                              // 도착 상태를 한 번 계산해 두고
  const fin = { m: cp(MV.pos.m), o: cp(MV.pos.o), ball: { x: MV.ball.x, y: MV.ball.y }, holder: MV.holder, act: MV.act, poss: MV.poss, stage: MV.stage, stageOpp: MV.stageOpp, settle: MV.settle, rs: MV.rs, run: MV.run };
  const force = {};                                                                      // 원래 자리로 되돌린 뒤, 바뀐 선수만 목표로 달려가게 한다
  for (const pre of ['m', 'o']) MV.pos[pre].forEach((c, i) => { const o = old[pre][i], f = fin[pre][i]; if (!c || !o || !f) return; c.x = o.x; c.y = o.y; if (Math.hypot(f.x - o.x, f.y - o.y) > 0.8) force[pre + i] = { x: f.x, y: f.y }; });
  MV.ball.x = old.ball.x; MV.ball.y = old.ball.y;
  let h = fin.holder; if (!h) { const sd = fin.poss; let bi = -1, bd = 1e9; fin[sd].forEach((f, i) => { if (!f) return; const dd = Math.hypot(f.x - fin.ball.x, f.y - fin.ball.y); if (dd < bd) { bd = dd; bi = i; } }); h = bi >= 0 ? { s: sd, i: bi } : null; }
  MV.act = null; MV.rs = null; MV.holder = h; MV.poss = fin.poss; MV.stage = fin.stage; MV.force = force; MV.lead = { mo, fin, force, t: 0, max: 2.8 }; MV.dec = 99;
  { const hq = h && MV.pos[h.s][h.i]; if (hq && Math.hypot(hq.x - MV.ball.x, hq.y - MV.ball.y) > 3) { MV.holder = null; const fq = force[h.s + h.i] || hq; MV.act = { k: 'pass', to: { s: h.s, i: h.i }, sp: 44, pas: 99, from: h.s, h0: 0.3, px: fq.x, py: fq.y }; } }   // 공 가질 선수가 멀면 공이 그 선수에게 굴러감(순간이동 없음)
  const txt = leadText(mo.kind, prev); lbl(prev !== fin.poss ? (fin.poss === 'm' ? '공 탈취!' : '빼앗김!') : '전개'); fxShow(`<div class="gs">${txt}</div>`, 'save', 1500, false); PX.ui.move();
}
function endLead(M) {
  const L = MV.lead; if (!L) return; MV.lead = null; MV.force = null;
  for (const k in L.force) { const c = MV.pos[k[0]][+k.slice(1)], f = L.fin[k[0]][+k.slice(1)]; if (c && f) { c.x = f.x; c.y = f.y; c.vx = c.vy = 0; } }   // 도착 못 한 선수만 남은 거리를 맞춘다
  Object.assign(MV, { holder: L.fin.holder, act: L.fin.act, poss: L.fin.poss, stage: L.fin.stage, stageOpp: L.fin.stageOpp, settle: L.fin.settle, rs: L.fin.rs, run: L.fin.run });
  { const fb = L.fin.ball, bd = Math.hypot(MV.ball.x - fb.x, MV.ball.y - fb.y);
    if (bd > 1.5 && MV.holder) { MV.act = { k: 'pass', to: { s: MV.holder.s, i: MV.holder.i }, sp: 60, pas: 99, from: MV.holder.s, h0: 0.2 }; MV.holder = null; } else if (!(MV.act && bd > 1.5)) { MV.ball.x = fb.x; MV.ball.y = fb.y; } }   // 패스가 날아가는 중이면 공을 옮기지 않고 지금 자리에서 이어 감
  MV.paused = true; MV.momentOpen = L.mo; MV.dec = 99;
  retarget(M); fxShow(`<div class="gs">⚡ 내 차례!</div>`, 'save', 900, false); bringMeTop(); PX.ui.render();
}
function nearestOf(s, x, y, skipGK) { const arr = MV.pos[s]; let bi = -1, bd = 1e9; arr.forEach((c, i) => { if (!c || (skipGK && i === 0) || MV.red[s + i]) return; const dd = Math.hypot(c.x - x, c.y - y); if (dd < bd) { bd = dd; bi = i; } }); return bi; }
function playOutcome(M, mo, r) {                                                      // 내 선택 결과대로 장면을 이어 간다
  const mi = MV.mst.findIndex(p => p.me); const me = mi >= 0 && MV.pos.m[mi]; if (!me) return;
  const info = Core.optInfo(r.choice), sc = SCN[mo.kind] || SCN.box, d = dM_(M), ru = (a) => a[Math.floor(rnd2() * a.length)];
  MV.act = null; MV.rs = null; MV.settle = 0;
  const give = (s, i) => { const c = MV.pos[s][i]; MV.holder = { s, i }; MV.poss = s; if (Math.hypot(c.x - MV.ball.x, c.y - MV.ball.y) < 2.5) { MV.ball.x = c.x; MV.ball.y = c.y; } };   // 멀면 frame에서 공이 굴러감
  if (r.goal || r.assist) { give('m', mi); MV.dec = 0.35; return; }                    // 득점 연출(pg)이 이어받아 마무리
  if (sc.t !== 'att') {                                                                // 수비·골키퍼 장면
    const oi = MV.stageOpp != null ? MV.stageOpp : nearestOf('o', me.x, me.y, true);
    if (r.conc) { if (oi != null && oi >= 0) give('o', oi); MV.dec = 0.35; return; }  // 실점 → 상대 골 연출
    if (r.ok) { if (info.gk && oi >= 0) { give('o', oi); shoot(M, 'save'); } else { give('m', mi); MV.dec = 0.5; } return; }
    if (oi >= 0) { give('o', oi); shoot(M, ru(['wide', 'wide', 'post', 'save'])); }
    return;
  }
  if (info.t === 'shoot') { give('m', mi); shoot(M, ru(['save', 'save', 'block', 'wide', 'wide', 'post'])); return; }   // 슛은 막히거나 빗나감
  if (r.ok) {
    if (info.t === 'drib') { give('m', mi); MV.dec = 0.4; return; }
    let bi = -1, bu = -1; MV.pos.m.forEach((c, i) => { if (!c || i === mi || i === 0 || MV.red['m' + i]) return; const u = d > 0 ? c.x : 100 - c.x; if (u > bu) { bu = u; bi = i; } });
    give('m', mi); if (bi >= 0 && mo.kind !== 'distG') { passTo('m', bi, 55); } else { MV.dec = 0.4; } return;
  }
  const lo = nearestOf('o', me.x, me.y, true); if (lo >= 0) { give('o', lo); MV.dec = 0.5; lbl('빼앗김'); }   // 실패 → 공 빼앗김
}
function bringMeTop() { const e = document.querySelector('#pitch .dot.me'); if (e && e.parentNode) { e.parentNode.appendChild(e); const b = document.getElementById('ball'); if (b) e.parentNode.appendChild(b); } }
function fxShow(html, cls, ms, pause) {
  if (!PX.ui.banner(html, cls, ms)) return;                                               // 화면이 있으면 배너 표시(node에선 표시 없이 true)
  if (pause) { MV.paused = true; MV.fxUntil = nowR() + ms; }
  if (pause) { laterClear(MV.fxP); MV.fxP = later(() => { if (MV && !MV.intro && !MV.regWalk && !MV.momentOpen && !MV.pg && !MV.lead && !MV.talk && !MV.mgrPanel && !MV.pen && !MV.so) MV.paused = false; }, ms); }   // 일시정지 해제는 배너가 덮어써져도 반드시 실행
}
// ===== 데드볼(코너킥·프리킥·간접프리킥·스로인) + 파울 장면 =====
function canStage() { return !!MV && !(MV.sp || MV.pg || MV.momentOpen || MV.lead || MV.goalRes || MV.talk || MV.cele || MV.over || MV.skipping || MV.fast || MV.hlFast || MV.pen || MV.so); }
const DB_NM = { cn: '코너킥', fk: '프리킥', ifk: '간접 프리킥', th: '스로인' };
function takerFor(s, type, sx, sy, direct) {
  const st = sideOf(s); let tk = -1, bs = -1e9;
  st.forEach((p, i) => { const q = MV.pos[s][i]; if (i === 0 || MV.red[s + i] || !q || (MV.frz && MV.frz[s + i] > MV.t)) return; const dd = Math.hypot(q.x - sx, q.y - sy);
    let sc; if (type === 'th') sc = -dd + (p.sub === 'FB' || p.sub === 'W' ? 4 : 0); else if (direct) sc = PA(p, 'FIN') * 0.5 + PA(p, 'KIC') * 0.3 + PA(p, 'TEC') * 0.2 - dd * 0.35; else sc = PA(p, 'CRS') * 0.6 + PA(p, 'PAS') * 0.4 - dd * 0.45;
    if (sc > bs) { bs = sc; tk = i; } });
  return tk;
}
// 세트피스 연출: 공이 있던 자리에서(순간이동 없이) 재개 → 수비 벽·박스 안 배치 → 킥
function deadBall(M, o) {
  const s = o.s, d = s === 'm' ? dM_(M) : -dM_(M), gx = d > 0 ? 99 : 1, type = o.type, sx = o.sx, sy = o.sy, u = uOf(sx, d), gd = Math.hypot(100 - u, sy - 32), direct = type === 'fk' && gd < 34;
  let tk = o.tk; if (tk == null || tk <= 0 || MV.red[s + tk] || !MV.pos[s][tk]) tk = takerFor(s, type, sx, sy, direct && rnd2() < 0.8);
  if (tk < 0) { lbl(DB_NM[type]); return; }
  const wall = (type === 'fk' && gd < 30) ? (gd < 22 ? 5 : 4) : 0;
  MV.act = null; MV.rs = null; MV.holder = null; MV.dec = 99; MV.paused = true; MV.poss = s;   // 공은 frame에서 지점까지 굴러감(순간이동 없음)
  MV.sp = { s, tk, sx, sy, type: type === 'ifk' ? 'fk' : type, kind: type, gx, d, t: 0, wall, pgd: !!o.pgd, dur: type === 'th' ? 1.5 : wall ? 3.0 : 2.5, foot: footOf(sideOf(s)[tk]) };
  MV.nsp = (MV.nsp || 0) + 1; (MV.cnt || (MV.cnt = {}))[type] = ((MV.cnt || {})[type] || 0) + 1; PX.ui.sfx('whistle'); lbl(DB_NM[type]); retarget(M);
}
function applySp(M) {
  const P = MV.sp, os = P.s === 'm' ? 'o' : 'm', u0 = uOf(P.sx, P.d), box = P.kind === 'cn' || (P.kind !== 'th' && u0 > 58); let k = 0;
  const near = sideOf(P.s).map((p, i) => ({ i, dd: MV.pos[P.s][i] ? Math.hypot(MV.pos[P.s][i].x - P.sx, MV.pos[P.s][i].y - P.sy) : 1e9 })).filter(o => o.i > 0 && o.i !== P.tk && !MV.red[P.s + o.i]).sort((a, b) => a.dd - b.dd);
  sideOf(P.s).forEach((p, i) => { const tg = MV.tgt[P.s][i]; if (!tg || MV.red[P.s + i] || i === 0) return;
    if (i === P.tk) { MV.tgt[P.s][i] = (P.wh || P.kind === 'th') ? { x: P.sx, y: P.sy, sprint: true } : { x: c01(P.sx - P.d * 2.4, 0.5, 99.5), y: c01(P.sy + (P.foot === 'L' ? -1 : 1) * 0.9, 0.5, 63.5), sprint: true }; return; }
    if (P.kind === 'th') { const r = near.findIndex(o => o.i === i), inw = P.sy < 32 ? 1 : -1, off = [[-5, 7], [4, 5], [-1, 13]][r]; if (off) MV.tgt[P.s][i] = { x: c01(P.sx + P.d * off[0], 2.5, 97.5), y: c01(P.sy + inw * off[1], 3, 61), sprint: true }; return; }
    if (box && (p.sub !== 'CB' || i % 2)) { MV.tgt[P.s][i] = { x: P.gx - P.d * (5 + (k % 3) * 3.5), y: 22 + (k % 4) * 6.5, sprint: true }; k++; } });
  if (P.kind === 'th') return;
  let wl = [];
  if (P.wall) { const dx = P.gx - P.sx, dy = 32 - P.sy, L = Math.hypot(dx, dy) || 1, wx = P.sx + dx / L * 9.3, wy = P.sy + dy / L * 9.3, nx = -dy / L, ny = dx / L;
    wl = sideOf(os).map((p, i) => ({ i, dd: MV.pos[os][i] ? Math.hypot(MV.pos[os][i].x - wx, MV.pos[os][i].y - wy) : 1e9 })).filter(o => o.i > 0 && !MV.red[os + o.i]).sort((a, b) => a.dd - b.dd).slice(0, P.wall);
    wl.forEach((o, r) => { const t = (r - (wl.length - 1) / 2) * 1.9; MV.tgt[os][o.i] = { x: c01(wx + nx * t, 2.5, 97.5), y: c01(wy + ny * t, 3, 61), sprint: true }; }); }
  if (box) { let j = 0; sideOf(os).forEach((p, i) => { const tg = MV.tgt[os][i]; if (!tg || MV.red[os + i] || i === 0 || wl.some(o => o.i === i)) return; MV.tgt[os][i] = { x: P.gx - P.d * (3.5 + (j % 3) * 3), y: 20 + (j % 5) * 6, sprint: true }; j++; }); }
}
function endSp(M) { const P = MV.sp; MV.sp = null; if (!P) return; const b = MV.ball; b.x = P.sx; b.y = P.sy; MV.holder = { s: P.s, i: P.tk }; MV.poss = P.s; MV.dec = 0.4; MV.kick = 0.6; MV.rk = { kind: P.kind, s: P.s, tk: P.tk }; if (!MV.momentOpen && !MV.lead && !MV.pg && !MV.regWalk) MV.paused = false; retarget(M); }
// 공이 라인 밖으로 나가는 연출(볼 이동 → 스로인/코너킥 재개). 공 위치에서 이어지므로 순간이동이 없다.
function sendOut(M, s, kind) {
  const d = s === 'm' ? dM_(M) : -dM_(M), b = MV.ball; let tx, ty;
  if (kind === 'cn') { tx = d > 0 ? 98.5 : 1.5; ty = b.y < 32 ? 1.5 : 62.5; } else { tx = b.x; ty = b.y < 32 ? 0.6 : 63.4; }
  MV.act = { k: 'out', tx, ty, sp: 52, s, kind }; MV.holder = null; MV.rs = null; MV.dec = 99;
}
function outDone(M, A2) {
  const s = A2.s; MV.act = null;
  if (!canStage() && A2.cnEv) cnUndo(A2.cnEv);
  if (canStage()) { deadBall(M, { type: A2.kind, s, sx: c01(A2.tx, 1.5, 98.5), sy: A2.ty }); return; }
  const arr = MV.pos[s]; let bi = -1, bd = 1e9; arr.forEach((q, i) => { if (!q || i === 0 || MV.red[s + i]) return; const dd = Math.hypot(q.x - MV.ball.x, q.y - MV.ball.y); if (dd < bd) { bd = dd; bi = i; } });
  if (bi >= 0) { if (Math.hypot(arr[bi].x - MV.ball.x, arr[bi].y - MV.ball.y) > 3) { MV.act = { k: 'pass', to: { s, i: bi }, sp: 40, pas: 90, from: null, h0: 0.6 }; MV.poss = s; } else { MV.holder = { s, i: bi }; MV.poss = s; MV.dec = 0.5; } }   // 멀면 던져/굴려 줌
}
// 파울: 호루라기 → (경고/퇴장 카드) → 반칙 위치에서 프리킥. 박스 안 파울은 PK 이벤트로만 처리하므로 박스 앞으로 조정.
function foulScene(M, o) {
  if (!canStage()) { lbl('파울'); return; }
  const s = o.s, d = s === 'm' ? dM_(M) : -dM_(M), b = o.at || MV.ball; let u = uOf(b.x, d), sy = clampN(b.y, 3, 61), sx = b.x;   // at: 실제 파울이 난 곳
  if (u > 83 && Math.abs(sy - 32) < 22) { u = 80; sx = d > 0 ? u : 100 - u; }
  const type = (u >= 74 && Math.abs(sy - 32) < 20 && rnd2() < 0.2) ? 'ifk' : 'fk';
  if (!o.card && o.p) fxShow(`<div class="gb">📣</div><div class="gs">파울 · ${esc(o.p.name)}</div>`, 'save', 900, false);
  deadBall(M, { type, s, sx: clampN(sx, 2, 98), sy });
}
// 엔진 파울·카드의 실제 위치: 파울당한 팀이 공을 가졌으면 공 가진 선수 자리, 아니면 파울한 선수가 상대와 붙어 있는 자리. 없으면 null(미룸)
function foulSpot(M, x, loose) { const r = foulSpot0(M, x, loose); if (!r) return null; const s = x.ms ? 'o' : 'm', d = s === 'm' ? dM_(M) : -dM_(M); if (uOf(r.at.x, d) > 83 && Math.abs(r.at.y - 32) < 22) return null; return r; }   // 박스 안이면 미룸(엉뚱하게 박스 밖으로 옮기지 않게)
function foulSpot0(M, x, loose) { const s = x.ms ? 'o' : 'm', fs = x.ms ? 'm' : 'o', fi = sideOf(fs).indexOf(x.p), h = MV.holder;
  const near = (pre, q, R) => { let bi = -1, bd = R; (MV.pos[pre] || []).forEach((p2, j) => { if (j && p2 && !MV.red[pre + j]) { const dd = Math.hypot(p2.x - q.x, p2.y - q.y); if (dd < bd) { bd = dd; bi = j; } } }); return bi; };
  if (h && h.s === s && !MV.act) { const q = MV.pos[s][h.i]; if (q) { const vi = fi > 0 && MV.pos[fs][fi] && Math.hypot(MV.pos[fs][fi].x - q.x, MV.pos[fs][fi].y - q.y) < 7 ? fi : near(fs, q, 7); if (vi > 0 || loose) return { at: { x: q.x, y: q.y }, vi, vs: fs }; } }
  const fq = fi > 0 && MV.pos[fs][fi]; if (fq) { const j = near(s, fq, 5); if (j > 0) { const q = MV.pos[s][j], at = { x: (fq.x + q.x) / 2, y: (fq.y + q.y) / 2 }; if (Math.hypot(at.x - MV.ball.x, at.y - MV.ball.y) <= 8) return { at, vi: fi, vs: fs }; } }   // 공 근처에서 붙어 있을 때만(공이 순간이동하지 않게)
  return null; }
function engineFoul(M, x, card, loose) { if (!canStage()) return false; const sp = foulSpot(M, x, loose); if (!sp) return false; { const hh = MV.holder, c = MV.cnt || (MV.cnt = {}), k = hh && hh.s === (x.ms ? 'o' : 'm') ? 'flHolder' : 'flFouler'; c[k] = (c[k] || 0) + 1; c.flJump = (c.flJump || 0) + Math.hypot(MV.ball.x - sp.at.x, MV.ball.y - sp.at.y); }
  if (sp.vi > 0) MV.slideReq = { s: sp.vs, i: sp.vi, t: MV.t }; MV.act = null; MV.holder = null;
  foulScene(M, { s: x.ms ? 'o' : 'm', p: x.p, card, at: sp.at }); if (!MV.sp) cntAdd('flNoSp'); return true; }
function cnUndo(ce) { if (!ce || !MV) return; const k = MV.log.indexOf(ce.entry); if (k >= 0) MV.log.splice(k, 1); ce.x.shown = false; ce.x.defer = true; cntAdd('cnRetry'); }   // 코너킥 장면이 끊기면 기록 취소 → 다시 미룸
function cnStart(M, x, entry) { MV.log.unshift(entry); startSp(M, 'cn', x.ms); if (MV.act && MV.act.k === 'out') MV.act.cnEv = { x, entry }; }
function startSp(M, type, ms) {                                                         // 엔진 이벤트(코너킥·파울)용 진입점
  if (!canStage()) { lbl(type === 'cn' ? '코너킥' : '프리킥'); return; }
  const s = ms ? 'm' : 'o';
  if (type === 'cn') { sendOut(M, s, 'cn'); lbl('코너킥'); } else foulScene(M, { s });
}
// ===== 골 패턴: 어시스트·득점자 능력에 맞춰 다양한 방식으로 득점 =====
const PAT = {
  cross: { n: '크로스 → 헤딩골', as: 1, A: ['w', 80], S: [91, 31], pass: { tag: '크로스', hi: 1, sp: 50 }, fin: 'header' },
  crossV: { n: '크로스 → 발리슛', as: 1, A: ['w', 78], S: [86, 38], pass: { tag: '크로스', hi: 1, sp: 50 }, fin: 'volley' },
  overhead: { n: '크로스 → 바이시클킥', as: 1, A: ['w', 80], S: [89, 32], pass: { tag: '크로스', hi: 1, sp: 50 }, fin: 'overhead' },
  through: { n: '스루패스 → 1대1 마무리', as: 1, A: ['c', 66], S: [82, 32], pass: { tag: '스루패스', lead: 7, sp: 48 }, fin: 'low' },
  throughChip: { n: '스루패스 → 칩슛', as: 1, A: ['c', 66], S: [84, 32], pass: { tag: '스루패스', lead: 7, sp: 48 }, fin: 'chip' },
  cutback: { n: '컷백 → 논스톱 슛', as: 1, A: ['w2', 94], S: [86, 32], pass: { tag: '컷백', sp: 40 }, fin: 'first' },
  lob: { n: '로빙 패스 → 침투 발리', as: 1, A: ['c', 56], S: [84, 34], pass: { tag: '롱패스', hi: 1, lead: 5, sp: 54 }, fin: 'volley' },
  layoff: { n: '레이오프 → 중거리 슛', as: 1, A: ['c', 80], S: [68, 32], pass: { tag: '레이오프', sp: 36 }, fin: 'drive', win: [30, 30] },
  oneTwo: { n: '원투 패스 돌파', as: 1, special: 'onetwo', A: ['c', 76], S: [70, 36], fin: 'low' },
  corner: { n: '코너킥 → 헤딩골', as: 1, dead: 'cn', A: ['w', 86], S: [91, 31], fin: 'header' },
  fkCross: { n: '프리킥 크로스 → 헤딩골', as: 1, dead: 'fk', S: [90, 30], fin: 'header' },
  longThrow: { n: '롱스로인 → 헤딩골', as: 1, dead: 'th', A: ['w', 72], S: [91, 31], fin: 'header' },
  long: { n: '중거리 슛', S: [72, 32], fin: 'drive', win: [23, 31] },
  solo: { n: '단독 드리블 돌파', fin: 'low', win: [0, 20] },
  curve: { n: '컷인 감아차기', fin: 'curve', win: [14, 22] },
  counter: { n: '빠른 역습 마무리', fin: 'low', win: [0, 21] },
  fkDirect: { n: '직접 프리킥', dead: 'fk', direct: 1, gdz: [17, 26], fin: 'curve' },
  fkLong: { n: '원거리 프리킥', dead: 'fk', direct: 1, gdz: [27, 33], fin: 'drive' },
  rebound: { n: '리바운드 골', special: 'rebound', fin: 'first' },
  poacher: { n: '골문 앞 쇄도 — 밀어 넣기', fin: 'tap', win: [0, 9], S: [93, 32] },
  soloChip: { n: '1대1 칩슛', fin: 'chip', win: [0, 17] },
  edgeVolley: { n: '박스 앞 세컨볼 발리', fin: 'volley', win: [15, 22] },
  powerLow: { n: '낮고 강한 땅볼 슛', fin: 'drive', win: [18, 24] },
  pk: { n: '페널티킥', fin: 'low' }
};
function pgPlan(p, asP, hasAs) {
  const sub = p ? p.sub : 'ST', H = PA(p, 'HEA'), F = PA(p, 'FIN'), PC = PA(p, 'PAC'), DR = PA(p, 'DRI'), mid = sub === 'CM' || sub === 'DM' || sub === 'AM', cb = sub === 'CB' || sub === 'FB';
  const w = []; const add = (id, x) => { if (x > 0) w.push([id, x]); };
  if (hasAs) {
    add('cross', 3 + (sub === 'ST' ? 1.5 : 0) + (cb ? 1 : 0) + (H - 50) / 18); add('crossV', 1.2); add('overhead', 0.35); add('through', 2.4 + (PC - 50) / 25 + (sub === 'ST' || sub === 'W' ? 1 : 0)); add('throughChip', 0.8);
    add('cutback', 2.0 + (sub === 'W' ? 0 : 0.3)); add('lob', 0.9); add('layoff', mid ? 1.8 : 0.5); add('oneTwo', 1.5); add('corner', 2.2 + (cb ? 2.5 : 0) + (H - 50) / 25); add('fkCross', 1.2 + (cb ? 1 : 0)); add('longThrow', Math.max(0.2, (PA(asP, 'STR') - 42) / 18));
  } else {
    add('long', 1.4 + (mid ? 1.6 : 0) + (F - 50) / 30 - (cb ? 0.8 : 0)); add('solo', 1.2 + (DR - 50) / 30); add('curve', 1.5 + (sub === 'W' || sub === 'AM' ? 1.4 : 0)); add('counter', 1.5); add('fkDirect', 1.2 + (F - 50) / 40); add('fkLong', 0.5); add('rebound', 1.8); add('poacher', 1.4 + (sub === 'ST' ? 1 : 0)); add('soloChip', 1.1 + (PA(p, 'TEC') - 50) / 40); add('edgeVolley', 1.2 + (mid ? 0.8 : 0)); add('powerLow', 1.3 + (F - 50) / 40);
  }
  const cnt = MV.patCnt || (MV.patCnt = {}); w.forEach(o => { o[1] /= 1 + 1.6 * (cnt[o[0]] || 0); });                       // 한 경기에서 같은 패턴이 반복되지 않도록
  let r = rnd2() * w.reduce((a, o) => a + o[1], 0), pick = w[0][0]; for (const o of w) { r -= o[1]; if (r <= 0) { pick = o[0]; break; } } cnt[pick] = (cnt[pick] || 0) + 1; return pick;
}
function pgTargets(M) {
  const pg = MV.pg; if (!pg || !pg.pp || MV.pen || !MV.tgt || !MV.tgt[pg.s]) return; const P = pg.pp, s = pg.s, d = s === 'm' ? dM_(M) : -dM_(M), T = MV.tgt[s], h = MV.holder, X = (uu) => d > 0 ? uu : 100 - uu;
  const yw = (i) => { const c = MV.pos[s][i]; return c && c.y > 32 ? 57 : 7; };
  if (P.A && pg.as > 0 && T[pg.as] && !pg.deliv && !MV.sp && !(P.dead && pg.dd)) { const c = MV.pos[s][pg.as]; T[pg.as] = { x: X(P.A[1]), y: P.A[0] === 'w' ? yw(pg.as) : P.A[0] === 'w2' ? (yw(pg.as) < 32 ? 13 : 51) : clampN(c ? c.y : 32, 22, 42), sprint: true }; }
  const S = P.S; if (S && pg.si > 0 && T[pg.si] && !(h && h.s === s && h.i === pg.si) && P.special !== 'rebound') T[pg.si] = { x: X(S[0]), y: S[1] + (pg.sj || 0), sprint: true };
  const hq = h && h.s === s && h.i > 0 && MV.pos[s][h.i]; if (hq && !pg.rb1) { const hu = uOf(hq.x, d); [pg.deliv ? -1 : pg.as, pg.si].forEach(j => { if (j > 0 && j !== h.i && T[j] && uOf(T[j].x, d) < hu - 8) T[j] = { x: X(hu - 7), y: T[j].y, sprint: true }; });   // 공이 골라인 근처면 받을 선수가 다가오고
    if (pg.lw != null && hu > 88 && T[h.i]) T[h.i] = { x: X(86), y: hq.y + (32 - hq.y) * 0.5, sprint: false }; }   // 공 가진 선수도 박스 안쪽으로 파고들어 짧게 연결
}
function startPgDead(M, P, pg, hi) {
  const s = pg.s, d = s === 'm' ? dM_(M) : -dM_(M), c = MV.pos[s][hi]; if (!c) return; let type, sx, sy;
  if (P.dead === 'cn') { type = 'cn'; sx = d > 0 ? 98.5 : 1.5; sy = c.y < 32 ? 2 : 62; }
  else if (P.dead === 'th') { type = 'th'; sx = c.x; sy = c.y < 32 ? 0.6 : 63.4; }
  else { type = 'fk'; sx = c.x; sy = c.y; if (uOf(sx, d) > 83 && Math.abs(sy - 32) < 22) { pg.dd = 1; pg.pp = PAT.solo; return; } }   // 박스 안이면 프리킥 대신 단독 마무리
  if (type === 'fk') fxShow(`<div class="gb">📣</div><div class="gs">파울 · 프리킥 찬스</div>`, 'save', 900, false);
  const tk = P.direct ? pg.si : (pg.as > 0 ? pg.as : -1);
  deadBall(M, { type, s, sx, sy, tk, pgd: true });
  if (!MV.sp) { pg.dd = 1; pg.pp = PAT.solo; }                                     // 데드볼을 못 만들면 단독 마무리로 대체
}

// ---------- 페널티킥 장면 · 승부차기 · 연장전 ----------
function penSpot(M, s) { const d = s === 'm' ? dM_(M) : -dM_(M), gx = d > 0 ? 99 : 1; return { d, gx, sx: gx - d * 10.5, sy: 32 }; }
function penTargets(M) {
  const P = MV.pen; if (!P || !MV.tgt) return; const os = P.s === 'm' ? 'o' : 'm';
  for (const pre of ['m', 'o']) sideOf(pre).forEach((p, i) => {
    if (!MV.tgt[pre] || !MV.tgt[pre][i]) return;
    if (pre === P.s && i === P.ki) { MV.tgt[pre][i] = { x: P.sx - P.d * (P.run ? 0.3 : 3), y: P.sy, sprint: true }; return; }
    if (pre === os && i === 0) { MV.tgt[pre][i] = { x: P.gx - P.d * 0.8, y: 32 + (P.dive || 0), sprint: true }; return; }
    if (P.so) { MV.tgt[pre][i] = { x: 46 + (pre === 'm' ? 0 : 8) + (i % 3) * 1.6, y: 12 + i * 3.7, sprint: false }; return; }
    MV.tgt[pre][i] = { x: P.gx - P.d * (19 + (i % 3) * 1.8), y: 6 + ((i * 5.3 + (pre === 'm' ? 0 : 2.6)) % 52), sprint: true };
  });
}
function bestKicker(st, avoid) { let bi = -1, bf = -1; st.forEach((p, i) => { if (!p || p.sub === 'GK' || i === avoid) return; const f = PA(p, 'FIN') + rnd2() * 6; if (f > bf) { bf = f; bi = i; } }); return bi < 0 ? 1 : bi; }
// 한 번의 페널티킥: res = goal | save | wide | post
// 박스 안 반칙 → 페널티킥: 공격수가 박스로 침투 → 수비 반칙(쓰러짐) → 호루라기 → 페널티킥 (순간이동 없이 이어짐)
function pkBuild(M, s, ki, go) {
  const os = s === 'm' ? 'o' : 'm', d = s === 'm' ? dM_(M) : -dM_(M), st = sideOf(s);
  let fi = -1, fb = -1e9;                                                                  // 침투해 파울당하는 선수: 가장 앞선 공격수(키커 본인은 제외하고 고르면 자연스러움)
  st.forEach((p, i) => { const q = MV.pos[s][i]; if (i === 0 || !q || MV.red[s + i] || i === ki) return; const sc = uOf(q.x, d) + (p.sub === 'ST' || p.sub === 'W' || p.sub === 'AM' ? 20 : 0); if (sc > fb) { fb = sc; fi = i; } });
  if (fi < 0 || !MV.pos[s][fi] || !canStageLoose()) { go(); return; }
  const X = (uu) => d > 0 ? uu : 100 - uu, Q = MV.pos[s][fi];
  let di = -1, bd = 1e9; MV.pos[os].forEach((q, j) => { if (j === 0 || !q || MV.red[os + j]) return; const dd = Math.hypot(q.x - X(88), q.y - 30); if (dd < bd) { bd = dd; di = j; } });
  const gy = Q.y < 32 ? 24 : 40;
  MV.force = {}; MV.force[s + fi] = { x: X(88), y: gy }; if (di >= 0) MV.force[os + di] = { x: X(90), y: gy + (Q.y < 32 ? 1.6 : -1.6) };
  MV.act = { k: 'pass', to: { s, i: fi }, sp: 66, pas: 80, from: s, lead: d * 5 }; MV.holder = null; MV.rs = null; MV.dec = 99; MV.paused = true; MV.pkb = { s, fi };
  fxShow(`<div class="gb">⚠️</div><div class="gs">박스 안 침투!</div>`, 'save', 1100, false);
  const pkFoul = (n) => { if (!MV || MV.over) return; if (di >= 0 && n < 8) { const Q2 = MV.pos[s][fi], D2 = MV.pos[os][di]; if (Q2 && D2 && Math.hypot(Q2.x - D2.x, Q2.y - D2.y) > 2.4) { if (MV.force) MV.force[os + di] = { x: Q2.x - d * 1.3, y: Q2.y + 0.6 }; later(() => pkFoul(n + 1), 200); return; } }   // 수비수가 실제로 붙은 뒤 반칙(순간이동 없음)
    MV.act = null; MV.force = null; MV.pkb = null; PX.ui.sfx('whistle'); if (di >= 0) MV.slideReq = { s: os, i: di, t: MV.t }; (MV.frz || (MV.frz = {}))[s + fi] = MV.t + 3.2; MV.holder = null;
    fxShow(`<div class="gb">📣</div><div class="gs">반칙 — 페널티킥!</div>`, 'card', 1000, false);
    later(() => { if (MV && !MV.over) go(); }, 1000); }; later(() => pkFoul(0), 1500);
}
function canStageLoose() { return !!MV && !(MV.sp || MV.momentOpen || MV.lead || MV.goalRes || MV.talk || MV.cele || MV.over || MV.skipping || MV.fast || MV.hlFast || MV.pen || MV.so); }
function penScene(M, o) {
  const sp = penSpot(M, o.s), P = MV.pen = Object.assign({ run: false, dive: 0 }, o, sp), os = o.s === 'm' ? 'o' : 'm';
  MV.act = null; MV.rs = null; MV.sp = null; MV.holder = null; MV.dec = 99; MV.paused = true; if (o.so || Math.hypot(MV.ball.x - sp.sx, MV.ball.y - 32) < 1) { MV.ball.x = sp.sx; MV.ball.y = 32; } MV.poss = o.s; MV.bz = 0;
  retarget(M);
  const at = (ms, f) => later(() => { if (MV && MV.pen === P) f(); }, ms);
  const sgn = rnd2() < 0.5 ? -1 : 1, shotY = o.res === 'goal' ? 32 + sgn * (3.2 + rnd2() * 1.3) : o.res === 'save' ? 32 + sgn * (2.5 + rnd2() * 2) : o.res === 'post' ? 32 + sgn * 4.2 : 32 + sgn * (9 + rnd2() * 4);
  let t = 0; const lead = o.so ? 900 : (o.intro || []).reduce((a, x) => a + x[2], 0) + 1400;
  if (o.intro) { let u = 0; o.intro.forEach(([h, c, ms]) => { at(u, () => fxShow(h, c, ms, false)); u += ms; }); }
  at(lead - 1000, () => { if (!o.so) { PX.ui.sfx('whistle'); lbl('휘슬'); } });
  at(lead - 450, () => { P.run = true; retarget(M); });
  at(lead, () => {                                                                       // 슛: 골키퍼 다이빙 방향 결정
    P.dive = o.res === 'save' ? (shotY - 32) * 1.1 : (rnd2() < 0.6 ? -(shotY - 32) : (rnd2() < 0.5 ? -4 : 4)); retarget(M);
    P.shot = 1; MV.act = { k: 'shot', tx: sp.gx, ty: shotY, sp: 62, out: o.res === 'goal' ? 'goal' : o.res, s: o.s, to: null }; PX.ui.sfx(o.res === 'save' ? 'save' : 'shot'); lbl('페널티킥!'); });
  if (o.res !== 'goal' || o.so) at(lead + 1700, () => { MV.pen = null; if (o.done) o.done(); else if (!MV.pg && !MV.momentOpen && !MV.lead && !MV.talk) MV.paused = false; });
}
// 승부차기 계획: 승자(myWin)는 core가 결정, 킥 순서·성패는 규칙대로 생성
function soPlan(mst, ost, myWin) {
  const order = (st) => st.map((p, i) => ({ i, f: PA(p, 'FIN'), gk: p.sub === 'GK' })).sort((a, b) => (a.gk - b.gk) || (b.f - a.f)).map(o => o.i);
  const km = order(mst), ko = order(ost);
  for (let tries = 0; tries < 400; tries++) {
    const seq = [], first = rnd2() < 0.5 ? 'm' : 'o'; let sm = 0, so = 0, done = false, nm = 0, no = 0;
    for (let r = 0; r < 60 && !done; r++) for (const sd of (first === 'm' ? ['m', 'o'] : ['o', 'm'])) {
      const ki = (sd === 'm' ? km : ko)[r % 11], p = (sd === 'm' ? mst : ost)[ki], ok = rnd2() < 0.72 + (PA(p, 'FIN') - 60) / 400, kr = rnd2(), kind = ok ? 'goal' : kr < 0.6 ? 'save' : kr < 0.9 ? 'wide' : 'post';
      seq.push({ sd, ki, ok, kind }); if (sd === 'm') { nm++; if (ok) sm++; } else { no++; if (ok) so++; }
      if (r < 5) { const lm = 5 - nm, lo = 5 - no; if (sm > so + lo || so > sm + lm) { done = true; break; } }
      else if (nm === no && sm !== so) { done = true; break; } }
    if (done && (sm > so) === myWin) return { first, seq, sm, so };
  }
  const ki = km[0], kj = ko[0]; return { first: 'm', seq: [{ sd: 'm', ki, ok: myWin, kind: myWin ? 'goal' : 'save' }, { sd: 'o', ki: kj, ok: !myWin, kind: !myWin ? 'goal' : 'save' }], sm: myWin ? 1 : 0, so: myWin ? 0 : 1 };
}
function soText(k, M) { const p = (k.sd === 'm' ? MV.mst : MV.ost)[k.ki], tm = k.sd === 'm' ? M.mine.name : M.opp.name; return { nm: esc(p ? p.name : ''), tm: esc(tm), r: k.ok ? '성공' : k.kind === 'save' ? '선방' : k.kind === 'post' ? '골대 맞고 실축' : '빗나감' }; }
function startShootout(M) {
  const plan = soPlan(MV.mst, MV.ost, M.xt.mineWins); MV.so = { plan, i: 0, sm: 0, so: 0 }; M.xt.so = plan; MV.paused = true; MV.regroup = 0;
  MV.log.unshift({ min: 120, ic: '🥅', cls: '', t: `<b>승부차기</b> <span class="dim">${esc(plan.first === 'm' ? M.mine.name : M.opp.name)} 선축</span>` });
  fxShow('<div class="endt">승부차기</div><div class="ends">' + esc(plan.first === 'm' ? M.mine.name : M.opp.name) + ' 선축</div>', 'end', 1700, false); PX.ui.render();
  later(() => soNext(M), 1900);
}
function soNext(M) {
  const S0 = MV && MV.so; if (!S0 || MV.over) return;
  if (S0.i >= S0.plan.seq.length) return soEnd(M);
  const k = S0.plan.seq[S0.i], x = soText(k, M);
  if (k.ok) MV.pg = { s: k.sd, ms: k.sd === 'm', si: k.ki, html: '', logs: [], t: 0, so: true };
  fxShow(`<div class="gs">${x.nm}<br><span class="gsa">${x.tm}</span></div>`, 'card', 900, false);
  penScene(M, { s: k.sd, ki: k.ki, res: k.ok ? 'goal' : k.kind, so: true, done: () => {
    MV.pg = null; if (k.ok) { k.sd === 'm' ? S0.sm++ : S0.so++; }
    MV.log.unshift({ min: 120, ic: k.ok ? '✅' : '❌', cls: '', t: `<b>${x.nm}</b> <span class="dim">${x.tm} · ${x.r}</span> — 승부차기 ${S0.sm} : ${S0.so}` });
    fxShow(`<div class="gb">${k.ok ? '✅' : k.kind === 'save' ? '🧤' : '❌'}</div><div class="gs">${x.nm} · ${x.r}<br><span class="gsa">승부차기 ${S0.sm} : ${S0.so}</span></div>`, k.ok ? 'goal' : 'save', 1200, false);
    S0.i++; PX.ui.render(); later(() => soNext(M), 1300); } });
}
function soEnd(M) {
  const S0 = MV.so; MV.pen = null; MV.pg = null; MV.paused = false; clearInterval(MV.timer); MV.over = true; PX.ui.sfx('whistle');
  MV.log.unshift({ min: 120, ic: '🏆', cls: '', t: `<b>승부차기 ${S0.sm} : ${S0.so}</b> — ${esc(S0.sm > S0.so ? M.mine.name : M.opp.name)} 승리` }); finishLog(M); PX.ui.move(); PX.ui.render();
}
// 90분(또는 120분) 종료 처리. true = 경기 완전 종료
function fullTime(M, skip) {
  const end = MV.etOn ? 120 : 90; MV.min = end; const [h, a] = scoreAt(end);
  if (!MV.etOn && Core.wcKO(M) && (Core.koTied ? Core.koTied(M, h, a) : h === a)) {   // 토너먼트 무승부(2차전이면 합산) → 연장전 30분
    Core.wcExtra(M); MV.etOn = true; swapEnds(M, !skip); (M.evMine.concat(M.evOpp)).forEach(e => { if (e.min > 90 && MV.keys) MV.keys.push(e.min); });
    MV.log.unshift({ min: 90, ic: '⏱️', cls: '', t: `<b>90분 종료 ${h} : ${a} — 연장전 돌입</b>` });
    if (!skip) { MV.goalRes = 'o'; MV.regroup = 2; fxShow(`<div class="endt">연장전</div><div class="ends">${h} : ${a} · 30분</div>`, 'end', 2400, true); PX.ui.render(); }
    return false; }
  if (MV.etOn && (Core.koTied ? Core.koTied(M, h, a) : h === a) && !MV.so) {                                                    // 연장 120분에도 무승부 → 승부차기
    if (!skip) { startShootout(M); return false; }
    const plan = soPlan(MV.mst, MV.ost, M.xt.mineWins); M.xt.so = plan; MV.so = { plan, i: plan.seq.length, sm: plan.sm, so: plan.so };
    MV.log.unshift({ min: 120, ic: '🏆', cls: '', t: `<b>승부차기 ${plan.sm} : ${plan.so}</b> — ${esc(plan.sm > plan.so ? M.mine.name : M.opp.name)} 승리` }); }
  clearInterval(MV.timer); MV.over = true; PX.ui.sfx('whistle'); finishLog(M); return true;
}
function offScreen(M, s, i) {                                                               // 화면에서 생긴 오프사이드(이른 침투에 패스): 깃발·기록·상대 프리킥. 엔진 골·결과와는 무관
  const p = sideOf(s)[i], team = s === 'm' ? M.mine : M.opp; if (!p) return; MV.aim = null;
  MV.log.unshift({ min: MV.min, ic: '🚩', cls: '', t: `오프사이드 ${esc(p.name)} <span class="dim">${esc(team.name)}</span>` }); { const ex = (M.evx || []).find(x => x.t === 'of' && x.defer && !x.shown && (x.ms ? 'm' : 'o') === s); if (ex) { ex.shown = true; cntAdd('ofStage'); } else cntAdd('offS'); } MV.offRun = null;   // 미뤄 둔 엔진 오프사이드가 있으면 이 장면이 그것
  offsideFx(M, { ms: s === 'm', p }); }
function offsideFx(M, x) {                                                                // 오프사이드: 깃발·오프사이드 라인 표시 + 상대 공격권
  if (!MV || !MV.pos || MV.sp || MV.pg || MV.pen || MV.so || MV.momentOpen || MV.lead || MV.goalRes || MV.talk || MV.cele || MV.over || MV.skipping || MV.fast) { lbl('오프사이드'); return; }
  const s = x.ms ? 'm' : 'o', os = s === 'm' ? 'o' : 'm', st = sideOf(s), d = s === 'm' ? dM_(M) : -dM_(M), pi = st.indexOf(x.p), c = pi >= 0 && MV.pos[s][pi];
  const ds = sideOf(os).map((p, i) => ({ i, x: MV.pos[os][i] && uOf(MV.pos[os][i].x, d), p })).filter(o => o.i > 0 && o.x != null && !MV.red[os + o.i]).sort((a, b) => b.x - a.x);
  const lineU = ds.length > 1 ? ds[1].x : (ds[0] ? ds[0].x : 70), lx = d > 0 ? lineU : 100 - lineU, svg = document.getElementById('pitch');
  if (!c) { lbl('오프사이드'); return false; }   // 선수를 옮기지 않음(순간이동 없음): 실제로 앞에 있는 선수에게만 깃발
  MV.offFlag = { t: MV.t, y: c ? c.y : 32, x: c ? c.x : 50 };
  if (svg) { const ns = 'http://www.w3.org/2000/svg', g = document.createElementNS(ns, 'g'); g.innerHTML = `<line x1="${lx.toFixed(1)}" y1="1" x2="${lx.toFixed(1)}" y2="63" stroke="#ffd34d" stroke-width=".45" stroke-dasharray="1.2 1"/>${c ? `<text x="${c.x.toFixed(1)}" y="${(c.y - 3.2).toFixed(1)}" font-size="4.2" text-anchor="middle">🚩</text>` : ''}`; svg.appendChild(g); setTimeout(() => g.remove(), 2000); }
  MV.aim = null; MV.lastOff = MV.min; deadBall(M, { type: 'ifk', s: os, sx: clampN(c.x, 2, 98), sy: clampN(c.y, 3, 61) }); lbl('오프사이드'); fxShow(`<div class="gb">🚩</div><div class="gs">오프사이드 · ${esc(x.p.name)}</div>`, 'save', 1000, false); return true;   // 수비 팀 간접 프리킥: 공이 오프사이드 자리로 굴러감
}
// 엔진 오프사이드: 그 팀이 공을 갖고 있고 앞선 동료가 실제로 수비 라인 뒤에 있을 때만 연출(없으면 미룸). 깃발은 그 선수에게
// 미뤄 둔 엔진 사건(파울·오프사이드·코너킥)을 매 순간 확인해 맞는 상황이 오면 바로 연출 + 중계 기록
function stageDeferred(M) { if (!M.evx || MV.act || MV.aim || !canStage()) return;
  for (const x of M.evx) { if (!x.defer || x.shown) continue; const team = x.ms ? M.mine : M.opp, tn = ` <span class="dim">${esc(team.name)}</span>`;
    if (x.t === 'fl') { if (engineFoul(M, x, null, MV.min - x.min >= 4)) { x.shown = true; MV.log.unshift({ min: MV.min, ic: '📣', cls: '', t: `파울 ${esc(x.p.name)}${tn}` }); PX.ui.render(); return; } }
    else if (x.t === 'of') { const fp = offEngine(M, x, false); if (fp) { x.shown = true; cntAdd('ofStage'); MV.log.unshift({ min: MV.min, ic: '🚩', cls: '', t: `오프사이드 ${esc(fp.name)}${tn}` }); PX.ui.render(); return; } }
    else if (x.t === 'cn') { const du = x.ms ? dM_(M) : -dM_(M), ub = uOf(MV.ball.x, du), hs = MV.holder && MV.holder.s === (x.ms ? 'm' : 'o'); if (ub > 62 || (MV.min - x.min >= 3 && ub > 45 && hs)) { x.shown = true; cntAdd('cnStage'); cnStart(M, x, { min: MV.min, ic: '🚩', cls: '', t: `코너킥${tn}` }); PX.ui.render(); return; } } } }
function offEngine(M, x, late) { if (!canStage()) return null; const s = x.ms ? 'm' : 'o', os = x.ms ? 'o' : 'm', d = s === 'm' ? dM_(M) : -dM_(M), h = MV.holder; if (MV.poss !== s) return null;
  const us = []; MV.pos[os].forEach((q, j) => { if (q && !MV.red[os + j]) us.push(uOf(q.x, d)); }); us.sort((a, b) => b - a); const ln = Math.max(us[1] != null ? us[1] : 50, 50, uOf(MV.ball.x, d)), st = sideOf(s), hi = h && h.s === s ? h.i : -1;
  if (hi >= 0 && !MV.act && !MV.aim) { const ok = (j) => { const q = MV.pos[s][j]; return j > 0 && j !== hi && q && !MV.red[s + j] && uOf(q.x, d) > ln + (late ? -2 : 0.5) && (late || Math.hypot(q.x - MV.ball.x, q.y - MV.ball.y) < 36); }; let pi = st.indexOf(x.p);
    if (!ok(pi)) { pi = -1; let bu = -1e9; st.forEach((p, j) => { if (ok(j)) { const u = uOf(MV.pos[s][j].x, d); if (u > bu) { bu = u; pi = j; } } }); }
    if (pi >= 0) { MV.offRun = null; return offsideFx(M, { ms: x.ms, p: st[pi] }) ? st[pi] : null; } }
  if (!MV.offRun || MV.t - MV.offRun.t > 5) { let ri = -1, ru = -1e9; st.forEach((p, j) => { const q = MV.pos[s][j]; if (j > 0 && j !== hi && q && !MV.red[s + j] && p.sub !== 'CB' && p.sub !== 'GK') { const u = uOf(q.x, d); if (u > ln - 10 && u > ru && Math.hypot(q.x - MV.ball.x, q.y - MV.ball.y) < 42) { ru = u; ri = j; } } }); if (ri > 0) MV.offRun = { s, i: ri, t: MV.t, u: Math.min(96, ln + 4) }; }   // 앞선 공격수가 너무 일찍 뛰어 들어감 → 다음 패스 때 깃발(pass0)
  return null; }
function vizIdx(st, sd, p) {                                                                  // 득점자가 화면 선발에 없으면(교체 투입 등) 같은 포지션 계열 공격수가 대신 연출
  let i = st.indexOf(p); if (i > 0) return i; const grp = (s) => ['ST', 'W', 'AM'].includes(s) ? 0 : ['CM', 'DM'].includes(s) ? 1 : 2, g = grp((p && p.sub) || 'ST');
  const c = st.map((q, j) => j).filter(j => j > 0 && !MV.red[sd + j] && grp(st[j].sub) === g); return c.length ? c[Math.floor(rnd2() * c.length)] : i; }
// ===== 기회 장면: 엔진의 슈퍼세이브·결정적 기회·골대 강타를 실제 공격(전개 → 슛)으로 보여 주고, 슛하는 순간 중계 문구를 띄움. 득점으로는 이어지지 않음 =====
function chanceStart(M, x) {
  if (!MV || !MV.pos || !MV.pos.m.length || MV.pg || MV.sp || MV.pen || MV.so || MV.lead || MV.momentOpen || MV.goalRes || MV.regWalk || MV.htWait || MV.intro || MV.talk || MV.cele || MV.over || MV.skipping || MV.fast || MV.hlFast || MV.rp || MV.aim || (MV.act && MV.act.k === 'out')) return false;
  const k = x.t, atkMs = k === 'sv' ? !x.ms : !!x.ms, sd = atkMs ? 'm' : 'o', st = sideOf(sd);
  let si = k === 'sv' ? -1 : vizIdx(st, sd, x.p); if (!(si > 0) || MV.red[sd + si]) si = bestKicker(st); if (!(si > 0) || !MV.pos[sd][si]) return false;
  const out = k === 'pt' ? 'post' : k === 'sv' ? 'save' : (rnd2() < 0.6 ? 'save' : 'wide');
  let pid = 'solo'; try { pid = pgPlan(st[si], null, false); } catch (e) {} if (!PAT[pid] || PAT[pid].special || PAT[pid].dead || pid === 'pk') pid = 'solo';
  MV.pg = { s: sd, ms: atkMs, si, html: '', logs: [], t: 0, pen: false, ev: null, ng: out, ngK: k, ngX: x, as: -1, pat: pid, pp: PAT[pid], sj: (rnd2() * 2 - 1) * 4 };
  if (k === 'ch') { const nm0 = esc(st[si].name), tm0 = sd === 'm' ? M.mine : M.opp; MV.log.unshift({ min: MV.min, ic: IC.target, cls: 's', t: `<b>결정적 기회!</b> ${nm0} <span class="dim">${esc(tm0.name)}</span>` }); fxShow(`<div class="gb">🎯</div><div class="gs">결정적 기회 · ${nm0}</div>`, 'save', 900, false); }   // 결정적 기회 문구는 공격이 시작될 때, 결과 문구는 슛하는 순간
  MV.paused = true; MV.dec = Math.min(MV.dec, 0.3); { const c = MV.cnt || (MV.cnt = {}); c.chance = (c.chance || 0) + 1; } return true; }
function chanceEnd(M, s, i, os) { const pg = MV.pg; MV.pg = null; const team = s === 'm' ? M.mine : M.opp, oteam = s === 'm' ? M.opp : M.mine, nm = esc(sideOf(s)[i].name), gk = sideOf(os)[0], k = pg.ngK, act = MV.act;
  const sl = { save: '골키퍼 선방', wide: '골대를 벗어남', post: '골대를 때림' }[pg.ng] || '골대를 벗어남';
  if (k === 'pt') { MV.log.unshift({ min: MV.min, ic: IC.post, cls: 'p', t: `${nm}의 슛, 골대를 강타!` }); fxShow(`<div class="gb">🥅</div><div class="gs">골대 강타!</div>`, 'save', 1000, false); }
  else if (k === 'sv') { MV.log.unshift({ min: MV.min, ic: IC.target, cls: '', t: `${nm}의 슛 — ${sl}` }); MV.log.unshift({ min: MV.min, ic: IC.glove, cls: 's', t: `<b>슈퍼세이브!</b> ${esc(gk ? gk.name : '골키퍼')} <span class="dim">${esc(oteam.name)}</span>` }); fxShow(`<div class="gb">🧤</div><div class="gs">슈퍼세이브</div>`, 'save', 1000, false); }
  else { MV.log.unshift({ min: MV.min, ic: IC.target, cls: '', t: `${nm}의 슛 — ${sl}` }); fxShow(sl === '골키퍼 선방' ? `<div class="gb">🧤</div><div class="gs">선방!</div>` : `<div class="gb">❌</div><div class="gs">${sl}</div>`, 'save', 900, false); }
  PX.ui.sfx(pg.ng === 'save' ? 'save' : 'shot');
  if (!MV.talk && !MV.momentOpen && !MV.lead && !MV.sp && !MV.pen && !MV.so && !MV.regWalk && !MV.htWait && !MV.intro) MV.paused = false; PX.ui.render(); }
function emitAt(M, min, anim) {
  const out = []; const dM = dM_(M);
  for (const e of M.evMine.concat(M.evOpp)) if (e.min <= min && !e.shown) {             // 재계산(감독 교체 등)으로 이미 지난 분에 생긴 골도 놓치지 않고 표시
    if (anim && (MV.pg || MV.goalRes || MV.regWalk || MV.htWait || ((MV.sp || (MV.act && MV.act.k === 'out')) && min < (MV.etOn ? 118 : 88))) && MV.pos && MV.pos.m.length) continue;                 // 앞 골 연출 중이거나 킥오프 대기 중이면 다음 분에(킥오프 전 골 연출이 멈추던 문제)                            // 같은 분에 골이 둘이면 앞 골 연출이 끝난 뒤 다음 분에 이어서(덮어써서 사라지던 문제)
    e.shown = true; const ms = M.evMine.includes(e), team = ms ? M.mine : M.opp;
    if (!e.mine && !e.pen && min <= 90 && !MV.etOn && !MV.so && rnd2() < 0.06) e.varOff = pick3(['off', 'off', 'off', 'foul', 'foul', 'hand']);
    const lg = [{ min: e.min, ic: IC.ball, cls: 'g ' + (ms ? 'mine' : 'opp'), t: `<b>골! ${esc(e.sc.name)}</b>${e.pen ? ' <span class="tag">PK</span>' : ''} <span class="dim">${esc(team.name)}</span>` }];
    if (e.as) lg.push({ min: e.min, ic: IC.boot, cls: 'a ' + (ms ? 'mine' : 'opp'), t: `도움 ${esc(e.as.name)}` });
    if (anim && MV.pos && MV.pos.m.length) { const sd = ms ? 'm' : 'o', si = vizIdx(ms ? MV.mst : MV.ost, sd, e.sc), html = `<div class="gchar">${sprH(e.sc, MV.kc[ms ? 'm' : 'o'], 40)}</div><div class="gb">${IC.ball.replace('width="16" height="16"','width="44" height="44"')}</div><div class="gt">GOAL!</div><div class="gs">${e.pen ? 'PK · ' : ''}${esc(e.sc.name)}${e.as ? `<br><span class="gsa">${IC.boot} ${esc(e.as.name)}</span>` : ''}</div>`;
      MV.pg = { s: sd, ms, si, html, logs: lg, t: 0, pen: !!e.pen, ev: e, off: e.varOff, ms2: ms }; MV.paused = true; MV.dec = Math.min(MV.dec, 0.3);
      { const stg = ms ? MV.mst : MV.ost, asI = e.as ? stg.indexOf(e.as) : -1, ok = si > 0 && !e.pen, pid = e.pen ? 'pk' : ok ? pgPlan(e.sc, e.as, asI > 0 && asI !== si) : 'solo';
        MV.pg.as = ok ? asI : -1; MV.pg.pat = pid; MV.pg.pp = PAT[pid]; MV.pg.sj = (rnd2() * 2 - 1) * 4; lg[0].t += ` <span class="tag">${PAT[pid].n}</span>`; (MV.pats || (MV.pats = [])).push(pid); }
      if (e.pen && !MV.pen && !MV.so) { const ki = si >= 0 ? si : bestKicker(ms ? MV.mst : MV.ost), kn = esc((ms ? MV.mst : MV.ost)[ki].name);
        pkBuild(M, sd, ki, () => penScene(M, { s: sd, ki, res: 'goal', intro: [[`<div class="gb">🅿️</div><div class="gs">페널티킥! · ${kn}</div>`, 'card', 1100], [`<div class="gb">📺</div><div class="gs">VAR 확인 · 파울 인정</div>`, 'save', 1200]] })); } }
    else { lg.forEach(o => out.push(o)); if (e.varOff) { varOverturn(M, e, ms, out, min); } }
  }
  for (const x of M.evx || []) if ((x.min === min || (x.defer && x.min <= min)) && !x.shown) {
    x.shown = true; const team = x.ms ? M.mine : M.opp, nmx = esc(x.p.name);
    if (x.t === 'yc') { MV.refCard = { c: 'y', p: x.p, ms: x.ms, until: MV.t + 2.6 }; out.push({ min, ic: IC.yc, cls: 'c', t: `경고 ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) { fxShow(`${IC.yc.replace('width="12" height="16"','width="30" height="40"')}<div class="gs">${nmx}</div>`, 'card', 1000, false); (engineFoul(M, x, 'y', true) || lbl('경고')); } }
    else if (x.t === 'dg') { const why = ({ off: '오프사이드', foul: '공격자 반칙', hand: '핸드볼' })[x.why] || '오프사이드'; out.push({ min, ic: '🚫', cls: 'c', t: `<b>골 취소</b> ${nmx} <span class="dim">${esc(team.name)} · VAR 판독 · ${why}</span>` }); if (anim) varSeq([[`<div class="gb">⚽</div><div class="gs">골인?!</div>`, 'save', 900], [`<div class="gb">📺</div><div class="gs">VAR 판독 중…</div>`, 'save', 1500], [`<div class="gb">🚫</div><div class="gs">골 취소 · ${why}</div>`, 'card', 1700]]); }
    else if (x.t === 'pk') { const gkn = x.gk ? esc(x.gk.name) : '골키퍼'; out.push({ min, ic: '🅿️', cls: 'c', t: `<b>페널티킥 선언</b> <span class="dim">${esc(team.name)} · 박스 안 반칙(VAR 확인)</span>` }); const pkr = { min, ic: x.res === 'miss' ? '❌' : IC.glove, cls: 's', t: x.res === 'miss' ? `${nmx}의 페널티킥 — 골대 밖으로 벗어남` : `<b>페널티킥 선방!</b> ${gkn} <span class="dim">키커 ${nmx}</span>` }; if (!anim || MV.pen || MV.so || MV.pg || MV.sp) out.push(pkr); if (anim) { const sd = x.ms ? 'm' : 'o', stp = x.ms ? MV.mst : MV.ost, idx0 = stp.indexOf(x.p), res = x.res === 'miss' ? (rnd2() < 0.7 ? 'wide' : 'post') : 'save', fin = () => fxShow(res === 'save' ? `<div class="gb">🧤</div><div class="gs">선방!</div>` : `<div class="gb">❌</div><div class="gs">실축!</div>`, 'save', 1200, false);
        if (MV.pen || MV.so || MV.pg || MV.sp) varSeq([[`<div class="gb">🅿️</div><div class="gs">페널티킥! · ${nmx}</div>`, 'card', 1100], [`<div class="gb">📺</div><div class="gs">VAR 확인 · 파울 인정</div>`, 'save', 1300], [res === 'save' ? `<div class="gb">🧤</div><div class="gs">선방!</div>` : `<div class="gb">❌</div><div class="gs">실축!</div>`, 'save', 1300]]);
        else pkBuild(M, sd, idx0 >= 0 ? idx0 : -1, () => penScene(M, { s: sd, ki: idx0 >= 0 ? idx0 : bestKicker(stp), res, intro: [[`<div class="gb">🅿️</div><div class="gs">페널티킥! · ${nmx}</div>`, 'card', 1100], [`<div class="gb">📺</div><div class="gs">VAR 확인 · 파울 인정</div>`, 'save', 1200]], done: () => { fin(); pkr.min = MV.min; MV.log.unshift(pkr); PX.ui.render(); if (!MV.pg && !MV.momentOpen && !MV.lead && !MV.talk) MV.paused = false; } })); } }   // 결과 문구는 차는 순간 이후에
    else if (x.t === 'of') { const ofl = (p) => ({ min, ic: '🚩', cls: '', t: `오프사이드 ${esc(p.name)} <span class="dim">${esc(team.name)}</span>` });   // 맞는 상황(공 소유 + 라인 뒤 동료)에서만 연출, 최대 3분 미룸
      if (anim && !MV.over && !MV.skipping) { const fp = offEngine(M, x, min - x.min >= 8); if (fp) { MV.log.unshift(ofl(fp)); cntAdd('ofStage'); } else if (min - x.min < 8) { if (!x.defer) cntAdd('ofDefer'); x.shown = false; x.defer = true; } else cntAdd('ofLogOnly'); } else out.push(ofl(x.p)); }
    else if (x.t === 'rc') { MV.refCard = { c: 'r', p: x.p, ms: x.ms, until: MV.t + 2.8 }; out.push({ min, ic: IC.rc, cls: 'c r', t: x.second ? `<b>경고 누적 퇴장!</b> ${nmx} <span class="dim">${esc(team.name)} · 두 번째 경고</span>` : `<b>퇴장!</b> ${nmx} <span class="dim">${esc(team.name)}${x.var ? ' · VAR 확인' : ''}</span>` }); const idx = (x.ms ? MV.mst : MV.ost).indexOf(x.p); if (idx >= 0) MV.red[(x.ms ? 'm' : 'o') + idx] = true; if (anim) fxShow(`${IC.rc.replace('width="12" height="16"','width="30" height="40"')}<div class="gs">${nmx}</div>`, 'card red', 1300, false); (engineFoul(M, x, 'r', true) || lbl('퇴장')); }
    else if ((x.t === 'sv' || x.t === 'ch' || x.t === 'pt') && anim && (chanceStart(M, x) || (min - x.min < 2 && !MV.over && (x.shown = false, x.defer = true)))) { /* 공격 장면으로 연출 → 슛하는 순간 문구(다른 장면 중이면 최대 2분 미룸) */ }
    else if (x.t === 'sv') { out.push({ min, ic: IC.glove, cls: 's', t: `<b>슈퍼세이브!</b> ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) fxShow(`<div class="gb">🧤</div><div class="gs">슈퍼세이브</div>`, 'save', 1000, false); }
    else if (x.t === 'ch') { out.push({ min, ic: IC.target, cls: 's', t: `<b>결정적 기회!</b> ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) fxShow(`<div class="gb">🎯</div><div class="gs">결정적 기회 · ${nmx}</div>`, 'save', 900, false); }
    else if (x.t === 'cn') { const cl = { min, ic: '🚩', cls: '', t: `코너킥 <span class="dim">${esc(team.name)}</span>` }, late = min - x.min >= 6, du = x.ms ? dM_(M) : -dM_(M);   // 공이 그 팀 공격 진영 깊이 있을 때 연출, 최대 2분 미룸
      if (anim && !MV.over && !MV.skipping) { if (canStage() && !MV.act && (late || uOf(MV.ball.x, du) > 62)) { cnStart(M, x, cl); cntAdd('cnStage'); } else if (!late) { x.shown = false; x.defer = true; } else cntAdd('cnLogOnly'); } else out.push(cl); }
    else if (x.t === 'fl') { const fl = { min, ic: '📣', cls: '', t: `파울 ${nmx} <span class="dim">${esc(team.name)}</span>` };   // 파울: 맞는 상황(공 가진 선수·붙어 있는 선수)에서 장면과 함께, 없으면 최대 2분 미룸
      if (anim && !MV.over && !MV.skipping) { if (engineFoul(M, x, null, min - x.min >= 8)) MV.log.unshift(fl); else if (min - x.min < 8) { if (!x.defer) cntAdd('flDefer'); x.shown = false; x.defer = true; } else cntAdd('flLogOnly'); } else out.push(fl); }
    else if (x.t === 'ij') { out.push({ min, ic: '🩹', cls: 'c', t: `부상 치료 ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) { const idx = (x.ms ? MV.mst : MV.ost).indexOf(x.p); if (idx >= 0) { (MV.frz || (MV.frz = {}))[(x.ms ? 'm' : 'o') + idx] = MV.t + 4; { const pre0 = x.ms ? 'm' : 'o', op0 = x.ms ? 'o' : 'm', me0 = MV.pos[pre0][idx]; let nj = -1, nd0 = 7; (MV.pos[op0] || []).forEach((q, j) => { if (j && q && me0) { const dd = Math.hypot(q.x - me0.x, q.y - me0.y); if (dd < nd0) { nd0 = dd; nj = j; } } }); if (nj >= 0) { MV.slideReq = { s: op0, i: nj, t: MV.t }; lbl('충돌 — 쓰러졌다'); } else lbl('근육 부상으로 쓰러짐'); } } } }
    else if (x.t === 'pt') { out.push({ min, ic: IC.post, cls: 'p', t: `${nmx}의 슛, 골대를 강타!` }); if (anim) fxShow(`<div class="gb">🥅</div><div class="gs">골대 강타!</div>`, 'save', 900, false); }
  }
  for (const o of out.reverse()) MV.log.unshift(o);
}
const SPD = [1, 1.5, 2], BASE_MS = 1600;
function spdGet() { try { const v = +localStorage.getItem('bfm_spd'); if (SPD.includes(v)) return v; } catch (e) {} return 1; }
function spdMs() { return Math.round(BASE_MS / (S.spd || (S.spd = spdGet()))); }
// 경기 보기: 풀(전체) / 하이라이트(골·결정적 기회·슈퍼세이브·퇴장·내 장면 앞뒤만 정상 속도, 나머지는 빠르게 지나감)
function vmGet() { try { const v = localStorage.getItem('bfm_vm'); if (v === 'full' || v === 'hl' || v === 'mine') return v; } catch (e) {} return 'full'; }
function hlKeys(M) {
  const ks = new Set(); M.evMine.concat(M.evOpp).forEach(e => ks.add(e.min)); (M.evx || []).forEach(x => { if (['ch', 'sv', 'pt', 'rc', 'dg', 'pk'].includes(x.t)) ks.add(x.min); }); (M.moments || []).forEach(m => ks.add(m.min));
  return [...ks].sort((a, b) => a - b);
}
function mineKeys(M) { const ks = new Set(); M.evMine.concat(M.evOpp).forEach(e => ks.add(e.min)); (M.moments || []).forEach(m => ks.add(m.min)); return [...ks].sort((a, b) => a - b); }   // 내 장면만: 내 선택 장면 + 골
function keysFor(M) { return S.vm === 'mine' ? mineKeys(M) : hlKeys(M); }
function hlNear() { if (!MV || !MV.hl) return true; const M = G0().mm; if (M) MV.keys = keysFor(M); const pre = S.vm === 'mine' ? 2 : 3; return MV.keys.some(k => MV.min >= k - pre && MV.min <= k + 1); }
function hlSync() {
  if (!MV || MV.over || MV.skipping || MV.fast || !MV.timer) return;
  const near = hlNear(), sp = near ? spdMs() : 40; MV.hlFast = !!MV.hl && !near;
  if (sp !== MV.speed) { MV.speed = sp; clearInterval(MV.timer); MV.timer = setInterval(tick, sp); }
}
function lockOrient(mode) { try { const P = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.ScreenOrientation;
  if (P && P.lock) P.lock({ orientation: mode }).catch(() => {});
  else if (screen.orientation && screen.orientation.lock) screen.orientation.lock(mode).catch(() => {}); } catch (e) {} }
// 선발 출전이면 내 캐릭터를 선발 11명에 넣는다(같은 포지션에서 가장 약하고 이벤트와 무관한 선수 자리). 기록 집계는 그대로.
function placeMe(M) {
  if (M.role !== 'start') return; const m = Core.me(); if (!m || MV.mst.some(p => p.me)) return;
  const GRP = { GK: ['GK'], CB: ['CB', 'FB'], FB: ['FB', 'CB'], DM: ['DM', 'CM', 'AM'], CM: ['CM', 'DM', 'AM'], AM: ['AM', 'CM', 'W'], W: ['W', 'AM', 'ST'], ST: ['ST', 'W', 'AM'] }[m.sub] || [m.sub];
  const refd = new Set(); M.evMine.concat(M.evOpp).forEach(e => { refd.add(e.sc); refd.add(e.as); }); (M.evx || []).forEach(x => refd.add(x.p));
  let pick = null; for (const g of GRP) { const pool = MV.mst.map((p, i) => ({ p, i })).filter(o => o.p.sub === g && !o.p.me); if (!pool.length) continue;
    pool.sort((a, b) => (refd.has(a.p) - refd.has(b.p)) || (a.p.ovr - b.p.ovr)); pick = pool[0]; break; }
  if (pick) MV.mst[pick.i] = m; else MV.mst.push(m);
}
function startMatch() {
  if (S.matchOpen) return;
  try { if (!G0() || !G0().pendingMine) return; } catch (e) { return; }
  if (isM() && !S.mgrGo) { if (G0().pendingMine) { mgrPre(); render(); } return; } S.mgrGo = false;
  const M = Core.prepareMine(); if (!M) return;
  const PT = pickPitch(M);
  MV = { ...(() => { const sd = newMatchSeed(M); return { seed: sd, rng: mb32(sd) }; })(), clk: 0, tq: [], min: 0, timer: null, paused: false, log: [], over: false, momentOpen: null, speed: spdMs(), ball: { x: 50, y: 32 }, poss: 'm', holder: null, pos: { m: [], o: [] }, ballFree: false, red: {}, pitch: PT, kit: pickKits(M, PT), t: 0, rt: 0, kick: 0, act: null, dec: 1, els: null, raf: 0, last: 0, run: {}, tgt: { m: [], o: [] }, mst: sortSt(M.stMine), ost: sortSt(M.stOpp), fxT: null, st: { m: { pt: 0, sh: 0, sot: 0, xg: 0, pa: 0, pm: 0 }, o: { pt: 0, sh: 0, sot: 0, xg: 0, pa: 0, pm: 0 } }, heat: new Array(60).fill(0), my: { pa: 0, pm: 0 } };
  placeMe(M); S.vm = S.vm || vmGet(); MV.hl = S.vm === 'hl' || S.vm === 'mine'; MV.keys = keysFor(M); if (MV.hl && !hlNear() && M.role !== 'bench' && M.role !== 'inj' && M.role !== 'sus' && M.role !== 'away') { MV.speed = 40; MV.hlFast = true; }
  try { const m0 = Core.me(); MV.snap = { mor: m0.mor, trust: m0.trust, tac: JSON.stringify(M.mine.tactic) }; } catch (e) {}   // 도중에 나가면 이 값으로 되돌림
  MV.kc = { m: kitClub(M.mine, MV.kit.m), o: kitClub(M.opp, MV.kit.o) }; S.matchOpen = true; PX.ui.sfx('whistle'); if ((M.role==='bench' || M.role==='inj' || M.role==='sus' || M.role==='away') && (S.vm || 'full') !== 'full') { MV.speed = 60; MV.fast = true; }
  $('#match').innerHTML = `<div class="mh" id="mh"></div><div id="pitchbox">${pitchHTML(M)}</div><div class="mb" id="mb"></div><div class="mf" id="mf"></div>`;
  { const pb = $('#pitchbox'); if (pb) pb.addEventListener('click', () => { if (MV && MV.rp) MV.rp.skip = true; }); }
  lockOrient('landscape'); $('#match').classList.add('on'); S.emer2d = false; viewApply(); initPos(M); bringMeTop(); PX.ui.render(); PX.ui.move(); introStart(M);
  try { const rv = Core.rivalOf, der = rv && M.mine.kind === 'pro' && M.opp.kind === 'pro' && (rv(M.mine) === M.opp.id || rv(M.opp) === M.mine.id), fin = /결승/.test(M.title || '') && !/준결승/.test(M.title || '');
    MV.big = der ? { k: 'derby', t: '🔥 라이벌 더비' } : fin ? { k: 'final', t: '🏆 결승전' } : Core.wcKO && Core.wcKO(M) ? { k: 'ko', t: '⚔️ 토너먼트' } : null;
    if (M.rivalM) { const rv = G0().players[M.rivalM]; if (rv) MV.log.unshift({ min: 0, ic: '🆚', cls: '', t: `<b>동기 라이벌 ${esc(rv.name)}과(와) 맞대결!</b> <span class="dim">${esc(M.opp.name)} · 종합 ${rv.ovr}</span>` }); }
    if (M.order && Core.ORDERS[M.order]) MV.log.unshift({ min: 0, ic: '📋', cls: '', t: `<b>감독 지시: ${Core.ORDERS[M.order].n}</b> <span class="dim">“${Core.ORDERS[M.order].d}” · 지시에 맞는 선택(📋)은 성공률 +4%, 따르면 신뢰가 오릅니다</span>` });
    if (MV.big) { MV.log.unshift({ min: 0, ic: der ? '🔥' : '🏆', cls: '', t: der ? `<b>라이벌 더비</b> — 경기장이 꽉 찼습니다. 양 팀 서포터즈의 응원 열기가 대단합니다!` : `<b>${MV.big.t.slice(2)}</b> — 모든 것이 걸린 한 판입니다. 관중석이 들썩입니다!` }); if (!MV.fast) setTimeout(() => PX.ui.sfx('crowd'), 300); } } catch (e) { MV.big = null; }
  if (!MV.fast) fxShow(`<div class="ends" style="font-size:12px;opacity:.85">${esc(M.title)}</div><div class="endt" style="font-size:18px;display:flex;align-items:center;justify-content:center;gap:8px">${crest(M.h, 22)}<span>${esc(M.h.name)}</span><span style="opacity:.6">vs</span><span>${esc(M.a.name)}</span>${crest(M.a, 22)}</div><div class="ends" style="font-size:13px">${MV.big ? MV.big.t + ' · ' : ''}킥오프!</div>`, 'end', MV.big ? 2600 : 2000, true);
}
function scoreShown() {                                                                   // 화면 점수판: 골 장면이 실제로 끝난 골만(장면이 밀려도 점수가 먼저 바뀌지 않게)
  const M = G0().mm; if (!MV || MV.over) return scoreAt(MV && MV.etOn ? 120 : 90); const ok = e => e.shown && e.min <= MV.min && !(MV.pg && MV.pg.ev === e);
  const mine = M.evMine.filter(ok).length, opp = M.evOpp.filter(ok).length; return M.mineHome ? [mine, opp] : [opp, mine]; }
function scoreAt(min) {
  const M = G0().mm; const mine = M.evMine.filter(e => e.min <= min).length, opp = M.evOpp.filter(e => e.min <= min).length;
  return M.mineHome ? [mine, opp] : [opp, mine];
}
function finishLog(M) { const mv = Core.mvpOf(M); MV.log.unshift({ min: MV.etOn ? 120 : 90, ic: IC.crown, cls: 'mvp', t: mv ? `<b>MVP ${esc(mv.p.name)}</b>${mv.me ? ' <span class="tag">나!</span>' : ''} <span class="dim">${esc((mv.mine ? M.mine : M.opp).name)}</span>` : '경기 종료' }); }
function aiInGame(M) {                                                                            // AI 감독의 경기 중 판단: 뒤지면 공격적으로, 앞서면 수비적으로(전술 이해도가 높을수록 적극적·정확)
  for (const pre of ['m', 'o']) {
    if (pre === 'm' && Core.isMgr()) continue; const club = pre === 'm' ? M.mine : M.opp, tac = MV.tacR[pre], T = MV.tk[pre]; if (!T || rnd2() > clampN((tac - 30) / 70, 0.1, 0.9)) continue;
    const [eh, ea] = scoreAt(MV.min), diff = pre === 'm' ? (M.mineHome ? eh - ea : ea - eh) : (M.mineHome ? ea - eh : eh - ea);
    if (diff < 0) { T.ment = 2; T.press = Math.min(2, T.press + 1); T.line = Math.min(2, T.line + 1); T.tempo = 2; MV.log.unshift({ min: MV.min, ic: '🧠', cls: '', t: `<b>${esc(club.name)} 감독</b> <span class="dim">뒤지고 있어 공격적으로 전술을 바꿉니다</span>` }); }
    else if (diff > 0 && MV.min >= 75) { T.ment = 0; T.line = 0; T.trans = 2; T.tempo = 0; MV.log.unshift({ min: MV.min, ic: '🧠', cls: '', t: `<b>${esc(club.name)} 감독</b> <span class="dim">리드를 지키기 위해 수비를 두텁게 합니다</span>` }); }
  }
}
function tick() {
  const M = G0().mm; if (!M || !MV || MV.paused || MV.over || MV.momentOpen || MV.exitAsk || MV.setOpen) return;
  MV.min++;
  const m = Core.me();
  emitAt(M, MV.min, !MV.hlFast);
  segTick(M);
  if (M.role !== 'mgr' && [30, 60, 75].includes(MV.min)) { try { const ps = Core.mePush(MV.min); if (ps > 0) { MV.log.unshift({ min: MV.min, ic: '🔥', cls: '', t: '<b>내 활약에 팀이 살아납니다</b> <span class="dim">동료들의 움직임이 좋아졌습니다</span>' }); if (!MV.hlFast) lbl('기세 상승'); } else if (ps < 0) MV.log.unshift({ min: MV.min, ic: '😓', cls: '', t: '<b>부진이 팀 분위기에 영향을 줍니다</b> <span class="dim">상대가 기세를 올립니다</span>' }); } catch (e) {} }
  if (MV.min === 1) { const RN = ['김도윤', '이재혁', '박성우', '최민혁', '정하람', '윤시헌', '한태오', '마르코 벨리니', '아르네 홀트', '디에고 나바스', '켄지 아라타', '루카 페란티'], hh = ((M.h.id | 0) * 31 + (M.a.id | 0) * 17 + G0().day) >>> 0; MV.refName = RN[hh % RN.length]; MV.log.unshift({ min: 1, ic: '🧑‍⚖️', cls: '', t: `<b>주심 ${MV.refName}</b> <span class="dim">경력 ${6 + hh % 15}년</span>` }); }
  if (MV.min === 1) MV.log.unshift({ min: 1, ic: '🧠', cls: '', t: `<b>상대 감독</b> <span class="dim">전술 이해도 ${MV.tacR.o}${M.aiNote ? ' · ' + esc(M.aiNote) : ''}</span>` });
  if ((MV.min === 60 || MV.min === 75) && !MV.etOn && !MV.hlFast) aiInGame(M);
  if (M.role==='sub' && MV.min===M.from) MV.log.unshift({ min: MV.min, ic: IC.swap, cls: '', t: `교체 투입 — ${esc(m.name)}` })
  if (M.role==='sub' && MV.min===M.from && !MV.mst.some(p => p.me)) { let ix = MV.mst.findIndex(p => p.sub === m.sub && p.sub !== 'GK'); if (ix < 0) ix = MV.mst.findIndex(p => p.sub !== 'GK'); if (ix >= 0) { const outp = MV.mst[ix]; MV.mst[ix] = m; lbl('교체 투입'); const pb = $('#pitchbox'); if (pb) { pb.innerHTML = pitchHTML(M); MV.els = null; MV.refEl = null; bringMeTop(); } fxShow(`<div class="gchar">${sprH(m, MV.kc.m, 40)}</div><div class="gs">교체 투입 · ${esc(m.name)}</div><div class="dim">${esc(outp.name)} ↔ ${MV.min}분</div>`, 'save', 1800, false); } }
  const mo = M.moments[M.mi];
  if (mo && !mo.done && mo.min <= MV.min && !MV.pg && !MV.lead && !MV.momentOpen && !MV.sp && !MV.pen && !MV.so && !MV.htWait && !MV.regWalk && !MV.goalRes && !(MV.act && MV.act.k === 'out')) { if (mo.min < MV.min) mo.min = MV.min; MV.paused = true; beginLead(M, mo); }   // 늦게 열린 선택 장면은 기준 분을 지금으로(이미 화면에 나온 골이 바꿔치기되지 않게)     // 골 연출 중이면 끝난 뒤에 장면을 연다
  if (!MV.htDone && MV.min >= 45 && MV.min < 90 && !MV.pg && !MV.momentOpen && !MV.lead && !MV.pen && !MV.sp && !(MV.act && MV.act.k === 'out') && !MV.fast && !MV.skipping) {         // 전반 종료 → 잠깐 멈춤 → 후반 킥오프
    MV.htDone = true; MV.htWait = true; MV.flipH = true; swapEnds(M, true); const [hh, ha] = scoreShown(); MV.log.unshift({ min: 45, ic: '⏸️', cls: '', t: `<b>전반 종료</b> ${hh} : ${ha}` });
    MV.regroup = 2.2; fxShow(`<div class="endt">전반 종료</div><div class="ends">${hh} : ${ha}</div>`, 'end', 2200, true);
    if (M.role === 'mgr') { MV.talkDiff = M.mineHome ? hh - ha : ha - hh; MV.talk = Core.mgrTalkInfo(MV.talkDiff); }
    else if (M.role === 'start' || M.role === 'sub') MV.talk = Object.assign(Core.talkInfo(M.mineHome ? hh - ha : ha - hh), { }); 
    else later(startSecond, 2300); }
  if (!MV.flipH && MV.min >= 46 && (MV.fast || MV.skipping) && !MV.pg && !MV.momentOpen && !MV.lead && !MV.pen) { MV.flipH = true; swapEnds(M); MV.goalRes = 'o'; }      // 빠른 진행 중에도 후반엔 진영 교체
  if (MV.etOn && MV.min === 105 && !MV.pg) { swapEnds(M, true); MV.goalRes = 'm'; MV.regroup = 1.2; MV.log.unshift({ min: 105, ic: '⏸️', cls: '', t: '<b>연장 전반 종료</b> — 연장 후반 시작' }); lbl('연장 후반'); }
  if (MV.min >= (MV.etOn ? 120 : 90) && !MV.pg) fullTime(M, !!(MV.skipping || MV.fast));
  PX.ui.move(); PX.ui.render(); hlSync();
}
function skipMatch() {
  if (MV.lead) { const M0 = G0().mm; clearInterval(MV.timer); if (MV.talk) { if (G0().mm && G0().mm.role === 'mgr') Core.mgrTalkPick('calm', 0); else Core.talkPick('follow'); MV.talk = null; MV.paused = false; MV.goalRes = 'o'; }
  MV.skipping = true; MV.sp = null; MV.cele = null; MV.regroup = 0; flushPg(); MV.timer = setInterval(tick, 40); endLead(M0); return; }
  clearInterval(MV.timer); const M = G0().mm; if (!M) return; MV.skipping = true; flushPg(); MV.paused = false;
  for (;;) { while (MV.min < (MV.etOn ? 120 : 90)) { MV.min++; emitAt(M, MV.min, false); const mo = M.moments[M.mi];
    if (M.role==='sub' && MV.min===M.from) MV.log.unshift({ min: MV.min, ic: IC.swap, cls: '', t: `교체 투입 — ${esc(Core.me().name)}` });
    if (mo && !mo.done && mo.min===MV.min) { MV.paused = true; MV.momentOpen = mo; MV.timer = setInterval(tick, 40); stepBall(M); stageMoment(M, mo); PX.ui.move(); PX.ui.render(); return; } }
    if (fullTime(M, true)) break; }
  PX.ui.move(); PX.ui.render();
}

const lvl3 = (p) => p >= 0.62 ? ['높음', 'hi'] : p >= 0.4 ? ['보통', 'mid'] : ['낮음', 'lo'];
function startSecond() { if (!MV || MV.over || !G0().mm) return; if (MV.regWalk) { later(startSecond, 300); return; } MV.htWait = false; MV.talk = null; if (!MV.momentOpen && !MV.pg && !MV.pen && !MV.so && !MV.lead && !MV.sp) MV.paused = false; MV.regroup = 0; MV.goalRes = 'o'; MV.log.unshift({ min: 46, ic: '▶️', cls: '', t: '<b>후반 시작</b>' }); fxShow('<div class="endt" style="font-size:26px">후반 시작</div>', 'end', 1100, false); PX.ui.render(); }
function mtabs() { const T = (MV && MV.over ? [['ana', '분석']] : []).concat([['flow', '경기 흐름'], ['stat', '통계'], ['tac', '전술']]).concat(isM() ? [] : [['me', '내 평점']]); return `<div class="mtabs">${T.map(([k, n]) => `<button class="mtb ${(S.mtab || 'flow') === k ? 'on' : ''}" data-act="mtab" data-id="${k}">${n}</button>`).join('')}</div>`; }
function anaRec(M) {                                                                        // 이번 경기 기록(추세 계산용)
  const A = MV.st.m, B = MV.st.o, tot = (A.pt + B.pt) || 1, [fh, fa] = scoreAt(MV.etOn ? 120 : 90), gm = M.mineHome ? fh : fa, go = M.mineHome ? fa : fh;
  return { d: G0().day, gm, go, xa: Math.round(A.xg * 100) / 100, xb: Math.round(B.xg * 100) / 100, pa: Math.round(A.pt / tot * 100), sh: A.sh, sot: A.sot, so: B.sh, r: gm > go ? 'W' : gm < go ? 'L' : 'D', sk: !!MV.skipping };
}
function anaSave(M) { if (!M || !MV || !MV.st || MV.anaSaved) return; MV.anaSaved = true; const g = G0(), h = g.anaHist || (g.anaHist = []); h.push(anaRec(M)); if (h.length > 12) h.shift(); }
function trendHTML(M, cur) {                                                                  // 최근 5경기 추세(이번 경기 포함)
  const prev = (G0().anaHist || []).filter(x => !x.sk).slice(-4), L = prev.concat([{ gm: cur.gm, go: cur.go, xa: cur.xa, xb: cur.xb, pa: cur.pa, r: cur.res }]);
  if (L.length < 2) return '';
  const av = (k) => L.reduce((s, x) => s + (x[k] || 0), 0) / L.length, half = Math.floor(L.length / 2), early = L.slice(0, half), late = L.slice(half), avs = (l, k) => l.reduce((s, x) => s + (x[k] || 0), 0) / Math.max(1, l.length);
  const arrow = (a, b, good) => Math.abs(a - b) < 0.15 ? '<span class="dim">→</span>' : `<b style="color:${(a > b) === good ? '#C6F36B' : '#FF7A6B'}">${a > b ? '▲' : '▼'}</b>`;
  const form = L.map(x => `<span class="tag ${x.r === 'L' ? 'warn' : ''}">${x.r === 'W' ? '승' : x.r === 'L' ? '패' : '무'}</span>`).join('');
  const notes = [];
  const gLate = avs(late, 'gm'), gEarly = avs(early, 'gm'), cLate = avs(late, 'go'), cEarly = avs(early, 'go');
  if (cLate - cEarly >= 0.8) notes.push('최근 실점이 눈에 띄게 늘었습니다.');
  if (gLate - gEarly >= 0.8) notes.push('공격력이 살아나고 있습니다.');
  if (av('xa') - av('gm') >= 0.6) notes.push('기대득점보다 실제 득점이 적습니다 — 결정력이 아쉬운 흐름입니다.');
  if (av('go') - av('xb') >= 0.6) notes.push('상대 기대득점보다 실점이 많습니다 — 골키퍼·수비 집중력 점검이 필요합니다.');
  if (L.slice(-3).every(x => x.r === 'L') && L.length >= 3) notes.push('3연패 — 분위기 반전이 필요합니다.');
  if (L.slice(-3).every(x => x.r === 'W') && L.length >= 3) notes.push('3연승 — 지금 흐름을 이어 가세요.');
  return `<div class="sec">최근 ${L.length}경기 추세</div><div class="card"><div class="row g8 wrapx">${form}</div><div class="ali dim">평균 득점 ${av('gm').toFixed(1)} ${arrow(gLate, gEarly, true)} · 실점 ${av('go').toFixed(1)} ${arrow(cLate, cEarly, false)} · xG ${av('xa').toFixed(2)} : ${av('xb').toFixed(2)} · 점유율 ${Math.round(av('pa'))}%</div>${notes.map(n => `<div class="ali">📈 ${n}</div>`).join('')}</div>`;
}
function anaTips(M, o) {                                                                     // 상황별 조언(여러 문구 중 무작위) — 반복감을 줄임
  const { A, B, pa, gm, go, xa, xb, res, pct } = o, T = [], P = (a) => pick3(a), mgr = M.role === 'mgr';
  const late = MV.log.filter(l => /\bg opp\b/.test(l.cls || '') && l.min >= 75).length, early = MV.log.filter(l => /\bg opp\b/.test(l.cls || '') && l.min <= 15).length;
  const spC = MV.log.filter(l => /\bg opp\b/.test(l.cls || '') && /(코너킥|프리킥|스로인)/.test(l.t || '')).length, spF = MV.log.filter(l => /\bg mine\b/.test(l.cls || '') && /(코너킥|프리킥|스로인)/.test(l.t || '')).length;
  const red = MV.log.filter(l => /\bc r\b/.test(l.cls || '')).length, ht = (() => { const [h1, a1] = scoreAt(45); return M.mineHome ? h1 - a1 : a1 - h1; })(), ftd = gm - go;
  if (xb > xa + 0.5) T.push(P(mgr ? ['상대에게 슈팅 기회를 많이 내줬습니다 — 수비 라인을 낮추거나 압박 강도를 조절해 보세요.', '수비 뒷공간이 자주 열렸습니다 — 수비형 미드필더를 한 명 더 두는 포메이션을 고려해 보세요.', '상대 공격을 너무 쉽게 허용했습니다 — 성향을 균형이나 수비적으로 바꿔 보세요.'] : ['상대에게 기회를 많이 내준 경기입니다 — 수비 장면에서 지연 수비·커버링 선택이 도움이 됩니다.', '팀 수비가 흔들렸습니다 — 다음 경기에선 무리한 태클보다 위치 선정을 노려 보세요.']));
  if (A.sh >= 8 && A.sot <= A.sh * 0.3) T.push(P([`슈팅 ${A.sh}개 중 유효슈팅 ${A.sot}개 — 결정력 높은 공격수 기용이나 마무리 훈련이 필요합니다.`, `슈팅은 많았지만(${A.sh}개) 골문으로 간 건 ${A.sot}개뿐입니다 — 박스 안 슈팅 비율을 높여야 합니다.`, '먼 거리 슈팅이 많았습니다 — 컷백·스루패스로 더 좋은 위치를 만들어 보세요.']));
  if (pct(A) && pct(A) < 72) T.push(P([`패스 성공률 ${pct(A)}% — 빌드업을 짧은 패스 위주로 바꾸면 소유권을 더 지킬 수 있습니다.`, `패스가 자주 끊겼습니다(${pct(A)}%) — 템포를 조금 늦춰 보세요.`]));
  if (pa < 40 && res !== 'W') T.push(P([`점유율 ${pa}% — 중원 숫자를 늘리는 포메이션을 고려해 보세요.`, `공을 거의 갖지 못했습니다(${pa}%) — 압박을 높여 높은 위치에서 공을 되찾아 보세요.`]));
  if (pa >= 60 && xa < 1.0) T.push(P(['점유는 많았지만 위협적인 기회가 적었습니다 — 템포를 올리거나 측면 크로스를 늘려 보세요.', '공만 돌리다 끝난 경기입니다 — 공격 성향을 높이거나 침투형 공격수를 써 보세요.']));
  if (late >= 1 && ftd <= 0) T.push(P(['막판(75분 이후)에 실점했습니다 — 체력이 떨어진 선수를 일찍 교체하세요.', '경기 막판 집중력이 흔들렸습니다 — 리드 중엔 70분 이후 수비적으로 전환하는 것도 방법입니다.']));
  if (early >= 1) T.push(P(['경기 초반(15분 이내)에 실점했습니다 — 시작부터 압박 강도를 조절해 보세요.', '이른 실점으로 끌려간 경기입니다 — 킥오프 직후 집중력이 필요합니다.']));
  if (spC >= 1) T.push(P(['세트피스로 실점했습니다 — 키 큰 수비수·공중볼 강한 선수 기용을 고려하세요.', '코너킥·프리킥 수비가 약했습니다 — 헤딩 능력이 좋은 선수를 선발로 써 보세요.']));
  if (spF >= 1 && res !== 'L') T.push('세트피스가 효과를 봤습니다 — 크로스가 좋은 키커를 계속 기용하세요.');
  if (red >= 1) T.push(P(['퇴장이 경기 흐름을 바꿨습니다 — 경고를 받은 선수는 일찍 교체하는 게 안전합니다.', '카드 관리가 필요합니다 — 경고 누적 5회면 다음 경기에 뛸 수 없습니다.']));
  if (ht < 0 && ftd > 0) T.push(P(['역전승! 후반 조정이 통했습니다 — 같은 상황에서 다시 써 볼 만합니다.', '전반 열세를 뒤집었습니다 — 하프타임 이후 변화가 정답이었습니다.']));
  if (ht > 0 && ftd <= 0) T.push(P(['앞서다 놓친 경기입니다 — 리드 중 후반엔 성향을 수비적으로 바꿔 보세요.', '리드를 지키지 못했습니다 — 후반 체력 관리와 교체 타이밍을 점검하세요.']));
  if (go === 0) T.push(P(['무실점 경기! 수비 조직이 잘 작동했습니다.', '클린시트 — 지금 수비 라인을 유지하세요.']));
  if (!T.length) T.push(P(['전반적으로 계획대로 풀린 경기입니다. 지금 전술을 유지해도 좋습니다.', '큰 약점 없이 끝난 경기입니다 — 선수들 컨디션만 잘 관리하세요.', '균형 잡힌 경기였습니다 — 다음 상대에 맞춰 세부 지시만 다듬어 보세요.']));
  return T;
}
function anaView(M) {                                                                      // 경기 후 분석: 총평 · 승부처 · 평점 이유 · 개선 포인트
  const A = MV.st.m, B = MV.st.o, tot = (A.pt + B.pt) || 1, pa = Math.round(A.pt / tot * 100), [fh, fa] = scoreAt(MV.etOn ? 120 : 90), gm = M.mineHome ? fh : fa, go = M.mineHome ? fa : fh;
  const pct = (st) => st.pa ? Math.round((st.pa - st.pm) / st.pa * 100) : 0, xa = A.xg, xb = B.xg, res = gm > go ? 'W' : gm < go ? 'L' : 'D';
  let sum;
  if (res === 'W' && gm - go >= 3) sum = xa >= xb ? `${gm - go}골 차 완승입니다. 내용과 결과 모두 압도한 경기입니다.` : `${gm - go}골 차 완승이지만, 상대 기회(xG ${xb.toFixed(2)})도 적지 않았습니다. 결정력 차이가 승부를 갈랐습니다.`;
  else if (res === 'L' && go - gm >= 3) sum = xa >= xb ? '기회는 비슷했지만 실점이 몰려 크게 진 경기입니다. 수비 집중력을 점검하세요.' : `${go - gm}골 차 완패입니다. 전반적으로 밀린 경기라 전술 재정비가 필요합니다.`;
  else if (res === 'W') sum = xa >= xb + 0.4 ? (pa >= 55 ? '점유와 기회 창출 모두 앞서며 내용과 결과를 함께 챙긴 승리입니다.' : '공을 덜 갖고도 더 좋은 기회를 만든 효율적인 승리입니다.') : xa + 0.4 < xb ? '내용은 밀렸지만 결정적인 순간을 살려 이긴 경기입니다. 운도 따랐습니다.' : '팽팽한 흐름 속에서 한 끗 차이로 이긴 경기입니다.';
  else if (res === 'L') sum = xa >= xb + 0.4 ? '기회는 더 많이 만들었지만 마무리가 부족해 진 경기입니다.' : xa + 0.4 < xb ? '상대에게 기회를 너무 많이 내준 경기입니다. 수비 조직을 점검할 필요가 있습니다.' : '비슷한 내용이었지만 결정력에서 밀린 경기입니다.';
  else sum = Math.abs(xa - xb) < 0.4 ? '양 팀 모두 결정타가 없었던 균형 잡힌 경기입니다.' : xa > xb ? '이길 수 있었던 경기를 놓친 무승부입니다.' : '밀리는 흐름에서 승점 1점을 지켜낸 경기입니다.';
  const keys = MV.log.filter(l => /\b(g|mvp)\b/.test(l.cls || '') || /\bc r\b/.test(l.cls || '') || /페널티/.test(l.t || '')).filter(l => !/mvp/.test(l.cls || '')).slice().reverse().slice(0, 4);
  const keyH = keys.length ? keys.map(l => `<div class="ali"><span class="tag">${l.min}'</span> ${l.t}</div>`).join('') : '<div class="dim">큰 사건 없이 지나간 경기입니다.</div>';
  const tips = anaTips(M, { A, B, pa, gm, go, xa, xb, res, pct });
  let me = '';
  if (M.role === 'start' || M.role === 'sub') {
    const rs = (M.moments || []).filter(o => o.done && o.result).map(o => { const r = o.result, d = Core.OPT_N ? Core.OPT_N(r.choice) : r.choice, tag = r.goal ? '⚽ 골' : r.assist ? '🅰 도움' : r.stop ? '🛡 실점 차단' : r.conc ? '❌ 실점 허용' : r.ok ? '✅ 성공' : '❌ 실패', sg = r.goal ? '+1.3' : r.assist ? '+0.9' : r.stop ? '+0.7' : r.conc ? '-0.8' : r.ok ? '+0.2~0.3' : '-0.1~0.25';
      return `<div class="ali"><span class="tag">${o.min}'</span> ${esc(d)}${r.ord ? ' 📋' : ''} → <b>${tag}</b> <span class="dim">(${sg})</span></div>`; }).join('') + (M.order && Core.ORDERS[M.order] ? `<div class="ali dim">📋 감독 지시 “${Core.ORDERS[M.order].n}” — 따른 선택 ${M.ordOk || 0}번 · 다른 선택 ${M.ordNo || 0}번 (신뢰 ${((M.ordOk || 0) * 0.8 - (M.ordNo || 0) * 0.3) >= 0 ? '+' : ''}${((M.ordOk || 0) * 0.8 - (M.ordNo || 0) * 0.3).toFixed(1)})</div>` : '');
    const r = clampN(M.myRate, 3, 10);
    me = `<div class="sec">내 평점 ${r.toFixed(1)} — 이유</div><div class="card">${rs || '<div class="dim">선택 장면이 없었습니다.</div>'}<div class="ali dim">기본 6.3에서 시작 · 팀 ${res === 'W' ? '승리 +' : res === 'L' ? '패배 −' : '무승부 '}${res === 'D' ? '0' : (Math.min(3, Math.abs(gm - go)) * 0.17).toFixed(2)} · 최종 평점은 경기 종료 후 약간의 변동이 있습니다.</div></div>`;
  } else if (M.role === 'mgr') {
    const ch = MV.log.filter(l => /감독 지시|교체 —/.test(l.t || '')).length;
    me = `<div class="sec">감독 결정</div><div class="card"><div class="ali">경기 중 전술 변경·교체 ${ch}회${M.talk ? ` · 하프타임 지시 효과 ${M.talk > 0 ? '+' : ''}${Math.round(M.talk * 100)}%` : ''}</div><div class="ali dim">경기 중 전술은 15분 단위로 남은 시간 결과에 반영됩니다.</div></div>`;
  }
  return `<div class="sec">경기 분석</div><div class="card"><b>${sum}</b><div class="dim" style="margin-top:4px">점유율 ${pa}% · 슈팅 ${A.sh}:${B.sh} · 유효슈팅 ${A.sot}:${B.sot} · xG ${xa.toFixed(2)}:${xb.toFixed(2)}</div></div><div class="sec">승부를 가른 장면</div><div class="card">${keyH}</div>${me}${trendHTML(M, { gm, go, xa, xb, pa, res })}<div class="sec">다음 경기를 위한 포인트</div><div class="card">${tips.slice(0, 3).map(t => `<div class="ali">💡 ${t}</div>`).join('')}</div>`;
}
function statView(M) {
  const A = MV.st.m, B = MV.st.o, tot = (A.pt + B.pt) || 1, pa = Math.round(A.pt / tot * 100), pct = (st) => st.pa ? Math.round((st.pa - st.pm) / st.pa * 100) : 0;
  const row = (n, a, b, fa, fb) => { const t = (+a + +b) || 1; return `<div class="strow"><b>${fa || a}</b><div class="stm"><span>${n}</span><i><u style="width:${a / t * 100}%"></u><u class="o" style="width:${b / t * 100}%"></u></i></div><b>${fb || b}</b></div>`; };
  const [gm, go] = scoreAt(MV.min);
  return `<div class="sec">경기 통계</div><div class="stnm"><span>${esc(M.mine.name)}</span><span>${esc(M.opp.name)}</span></div>${row('점유율', pa, 100 - pa, pa + '%', (100 - pa) + '%')}${row('슈팅', A.sh, B.sh)}${row('유효슈팅', A.sot, B.sot)}${row('기대득점 xG', A.xg.toFixed(2), B.xg.toFixed(2), A.xg.toFixed(2), B.xg.toFixed(2))}${row('주요 패스', A.pa, B.pa)}${row('패스 성공률', pct(A), pct(B), pct(A) + '%', pct(B) + '%')}<div class="dim" style="margin-top:6px">득점 ${gm} : ${go} — 슈팅·패스·점유는 지금 화면의 플레이 기준입니다.</div>`;
}
const INSTR_L = { width: ['폭', ['좁게', '보통', '넓게']], build: ['빌드업', ['짧은 패스', '혼합', '롱볼']], line: ['수비 라인', ['낮게', '중간', '높게']], press: ['압박', ['낮음', '중간', '높음']], tempo: ['템포', ['느리게', '보통', '빠르게']], ment: ['성향', ['수비적', '균형', '공격적']], trans: ['전환', ['안정', '보통', '빠른 역습']] };
function tacView(M) {
  const card = (c, st) => { const t = c.tactic || {}; return `<div class="tacc"><b>${esc(c.name)}</b><span class="tf">${esc(t.formation || '4-4-2')}</span><div class="tacg">${Object.keys(INSTR_L).map(k => `<i><em>${INSTR_L[k][0]}</em>${INSTR_L[k][1][t[k] == null ? 1 : t[k]]}</i>`).join('')}</div></div>`; };
  const me = Core.me(), role = { GK: '골키퍼', CB: '센터백', FB: '풀백', DM: '수비형 미드필더', CM: '중앙 미드필더', AM: '공격형 미드필더', W: '윙어', ST: '스트라이커' }[me.sub] || me.sub;
  return `<div class="sec">팀 전술 (감독 결정)</div>${card(M.mine)}<div class="sec">상대 전술</div>${card(M.opp)}${isM() ? '' : `<div class="sec">내 역할</div><div class="dim">${esc(role)} · 선호 플레이는 장면 선택지에서 보너스를 받습니다.</div>`}`;
}
function matchMeView(M) {
  if (M.role !== 'start' && M.role !== 'sub') return `<div class="sec">내 평점</div><div class="dim">이번 경기는 출전하지 않습니다.</div>`;
  const r = clampN(M.myRate, 3, 10), mx = Math.max(1, ...MV.heat), cells = MV.heat.map((v, i) => `<rect x="${(i % 10) * 10}" y="${Math.floor(i / 10) * 10.67}" width="10" height="10.67" fill="#C6F36B" fill-opacity="${(Math.sqrt(v / mx) * 0.85).toFixed(2)}"/>`).join('');
  const my = MV.my, pc = my.pa ? Math.round((my.pa - my.pm) / my.pa * 100) : 0;
  return `<div class="sec">내 평점</div><div class="merate ${r >= 7.5 ? 'hi' : r < 6 ? 'lo' : ''}"><b>${r.toFixed(1)}</b><span>골 ${M.myGoals} · 도움 ${M.myAssists} · 슈팅 ${M.sh || 0}${my.pa ? ' · 패스 ' + pc + '% (' + my.pa + ')' : ''}</span></div><div class="sec">내 활동 위치 (히트맵, 오른쪽이 상대 골문)</div><svg class="heat" viewBox="0 0 100 64" preserveAspectRatio="none"><rect width="100" height="64" fill="#1d3a26"/>${cells}<g fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".4"><rect x=".5" y=".5" width="99" height="63"/><line x1="50" y1=".5" x2="50" y2="63.5"/><circle cx="50" cy="32" r="8"/><rect x=".5" y="14" width="14" height="36"/><rect x="85.5" y="14" width="14" height="36"/></g></svg>`;
}
function renderMatch() { renderMatch0(); try { mvOverlay(); } catch (e) {} try { vfullNeed(); } catch (e) {} }
function vfullNeed() {                                                                        // 전체화면에서 하프타임 지시·경기 종료처럼 메뉴에서 골라야 할 때는 서랍을 자동으로 연다
  const dr = document.getElementById('vdrawer'); if (!dr || !MV) return; const need = !!(MV.talk || MV.over || MV.mgrPanel);
  if (need && !dr.classList.contains('open')) { vfullMenu(); dr.dataset.auto = '1'; } else if (!need && dr.dataset.auto === '1' && dr.classList.contains('open')) { dr.dataset.auto = ''; vfullMenu(); } }
function mvOverlay() {                                                                        // 선수 모드 골 장면 선택: 경기 영상 위에 큰 버튼으로(가로 전체화면에서도 보임)
  const pw = document.querySelector('#pitchbox .pwrap'); if (!pw) return; let ov = document.getElementById('mvov');
  if (!(MV && MV.momentOpen && !MV.over && !MV.skipping)) { if (ov) ov.remove(); return; }
  if (!ov || ov.parentElement !== pw) { if (ov) ov.remove(); ov = document.createElement('div'); ov.id = 'mvov'; pw.appendChild(ov); }
  const mo = MV.momentOpen, key = MV.min + '|' + mo.kind + '|' + (mo.min || ''); if (ov.dataset.k === key) return; ov.dataset.k = key;
  const opts = Core.momentOptions(mo);
  ov.innerHTML = `<div class="mvq">${Core.momentText(mo.kind)} <b id="mvt2">${Math.max(0, Math.ceil(MV.moT == null ? 10 : MV.moT))}</b></div><div class="mvb">${opts.map(o => `<button class="opt ${o.fav ? 'fav' : ''}" data-act="mv" data-id="${o.id}"><b>${o.fav ? '★ ' : ''}${o.n}</b><span>성공 ${Math.round(o.shown * 100)}%</span></button>`).join('')}</div>`;
}
function renderMatch0() {
  const G = G0(), M = G.mm; if (!M || !MV || !$('#mh')) return; const [sh, sa] = scoreShown();
  let dec = '';
  if (MV.talk) dec = `<div class="card gl"><div class="row g8"><b style="font-size:13.5px;line-height:1.25">감독: “${esc(MV.talk.text)}”</b></div><div class="opts3">${MV.talk.opts.map(o => `<button class="opt" data-act="talk" data-id="${o.id}"><b>${o.t}</b></button>`).join('')}</div></div>`;
  else if (MV.momentOpen) { const mo = MV.momentOpen; const opts = Core.momentOptions(mo); dec = `<div class="card gl"><div class="row g8" style="align-items:flex-end"><span class="mebub">${sprH(Core.me(), MV.kc.m, 28, 'idle')}</span><b>${Core.momentText(mo.kind)}</b></div><div class="dim">${MV.min}분 · 어떻게 할까? <b id="mvt" style="color:#FFB27A">${Math.max(0, Math.ceil(MV.moT == null ? 10 : MV.moT))}</b>초 안에 고르세요</div><div class="${opts.length===3?'opts3':'optsn'}">${opts.map(o => { const lv = lvl3(o.shown); return `<button class="opt ${o.fav?'fav':''}" data-act="mv" data-id="${o.id}"><b>${o.fav?'★ ':''}${o.ord?'📋 ':''}${o.n}</b><span class="lv ${lv[1]}">${lv[0]}</span><span class="pbar sm"><i class="${lv[1]}" style="width:${Math.round(o.shown*100)}%"></i></span><span class="dim s11 pc ${lv[1]}">성공 ${Math.round(o.shown*100)}%</span></button>`; }).join('')}</div></div>`; }
  else if (MV.over) { const st = M.role==='start'?'선발':M.role==='sub'?'교체':M.role==='inj'?'부상 결장':M.role==='sus'?'출전 정지':M.role==='away'?'대표팀 차출':'벤치(결장)'; const mv = M.mvp || Core.mvpOf(M), [fh, fa] = scoreAt(MV.etOn ? 120 : 90), won = (M.mineHome ? fh - fa : fa - fh) || (MV.so ? (MV.so.sm > MV.so.so ? 1 : -1) : 0), res = won > 0 ? '승리' : won < 0 ? '패배' : '무승부';
    dec = `<div class="card mom"><div class="momt">경기 종료 · ${res}</div><div class="momsc">${fh} : ${fa}</div>${MV.so ? `<div class="dim">승부차기 ${M.mineHome ? MV.so.sm : MV.so.so} : ${M.mineHome ? MV.so.so : MV.so.sm}</div>` : MV.etOn ? '<div class="dim">연장전 종료</div>' : ''}${mv ? `<div class="momch">${sprH(mv.p, MV.kc[mv.mine ? 'm' : 'o'], 64, mv.me ? 'jump' : 'idle')}${mv.me ? '<i class="crown">' + IC.crown + '</i>' : ''}</div><div class="momn ${mv.me ? 'me' : ''}">${IC.crown} MVP ${esc(mv.p.name)}${mv.me ? ' (나!)' : ''}</div>` : ''}<div class="dim">${M.role==='mgr' ? '감독 모드' : '내 역할: ' + st}</div><div class="row g8 wrapx" style="justify-content:center">${M.myGoals ? `<span class="tag">${IC.ball} ${M.myGoals}골</span>` : ''}${M.myAssists ? `<span class="tag">${IC.boot} ${M.myAssists}도움</span>` : ''}</div><div class="row g8"><button class="btn sec grow" data-act="mtab" data-id="ana">📊 경기 분석</button><button class="btn grow" data-act="mend">결과 확인</button></div></div>`; }
  const roleTxt = M.role==='mgr' ? '감독석' : M.role==='start' ? '선발 출전' : M.role==='sub' ? (MV && MV.min >= M.from ? `${M.from}분 교체 투입` : `벤치 → ${M.from}분 투입 예정`) : M.role==='inj' ? '부상으로 결장' : M.role==='sus' ? '출전 정지 (징계)' : M.role==='away' ? '대표팀 차출로 결장' : '벤치 (출전 명단 제외)';
  $('#mh').innerHTML = `<div class="dim">${esc(M.title)} · ${Core.fmtDate(G.day)}</div><div class="sc"><div>${crest(M.h,18)} ${esc(M.h.name)}</div><b>${sh} : ${sa}</b><div>${esc(M.a.name)} ${crest(M.a,18)}</div></div><div class="dim">${MV.so ? '승부차기 ' + MV.so.sm + ' : ' + MV.so.so : (MV.etOn ? '연장 ' : '') + MV.min + "'"} · ${roleTxt}</div><div class="bar"><i style="width:${Math.min(100, MV.min / (MV.etOn ? 120 : 90) * 100)}%"></i></div>`;
  $('#mb').className = 'mb' + (MV.momentOpen || MV.talk ? ' hasdec' : MV.over ? ' isover' : ''); $('#mb').innerHTML = `${MV.momentOpen || MV.talk ? dec : mtabs() + ((S.mtab || 'flow') === 'flow' || !MV.over ? dec : '<button class="btn wide" data-act="mend" style="margin:4px 0">결과 확인</button>')}${MV.momentOpen || MV.talk || (S.mtab || 'flow') === 'flow' ? `<div class="sec">경기 흐름</div>${MV.log.map(x => `<div class="li ev ${x.cls||''}"><span class="mn">${x.min}'</span><span class="ico">${x.ic}</span><span class="et">${x.t}</span></div>`).join('') || '<div class="dim">킥오프!</div>'}` : S.mtab === 'ana' && MV.over ? anaView(M) : S.mtab === 'stat' ? statView(M) : S.mtab === 'tac' ? tacView(M) : matchMeView(M)}`;
  $('#mf').innerHTML = MV.over ? '' : `<div class="spd">${S.mfOpen ? [['full', '풀'], ['hl', '하이라이트'], ['mine', '내 장면만']].map(([k, n]) => `<button class="chip ${(S.vm || 'full') === k ? 'on' : ''}" data-act="mvm" data-id="${k}">${n}</button>`).join('') + ['hy', 'lp'].map(k => `<button class="chip ${viewNow() === k ? 'on' : ''}" data-act="mview" data-id="${k}">${VIEW_S[k]}</button>`).join('') + SPD.map(v => `<button class="chip ${(S.spd||1)===v?'on':''}" data-act="mspd" data-id="${v}">${v}배속</button>`).join('') + '<button class="chip on" data-act="mfold">닫기 ✕</button>' : `<button class="chip vset" data-act="mset">⚙ 설정 · ${VM_N[S.vm || 'full']} · ${S.spd || 1}배속</button>`}${MV.momentOpen || MV.mgrPanel ? '' : (M.role==='mgr' ? `<div class="seg qm">${['수비적', '균형', '공격적'].map((n, v) => `<button class="${((M.mine.tactic || {}).ment == null ? 1 : M.mine.tactic.ment) === v ? 'on' : ''}" data-act="mment" data-id="${v}">${n}</button>`).join('')}</div>` + '<button class="btn sec" data-act="mpopen">전술·교체</button>' : '<button class="btn sec" data-act="mpopen">전술·교체 보기</button>') + '<button class="btn sec" data-act="mskip">끝까지 자동 진행</button>'}<button class="btn sec" data-act="mexit">나가기</button></div>`;
  if (MV.mgrPanel) { $('#mb').className = 'mb'; $('#mb').innerHTML = M.role === 'mgr' ? mgrPanelHTML(M) : playerPanelHTML(M); $('#mf').innerHTML = '<div class="spd"><button class="btn wide" data-act="mpclose" style="flex:2">경기 재개 ▶</button><button class="btn sec" data-act="mexit" style="flex:1">나가기</button></div>'; }
}

// ---------- 월드컵 토너먼트: 연장전 · 승부차기 연출 ----------
function etBuild(sn, wl, res) {
  const mine = wl.a === sn.mineId ? 0 : 1, myWin = wl.w === sn.mineId;
  const et = wl.et ? (mine === 0 ? [wl.et[0], wl.et[1]] : [wl.et[1], wl.et[0]]) : [0, 0];
  const pick = (arr) => { const f = arr.filter(p => p.sub !== 'GK'); const a = f.length ? f : arr; return a[Math.floor(Math.random() * a.length)].n; };
  const ev = []; for (let i = 0; i < et[0]; i++) ev.push({ min: 91 + Math.floor(Math.random() * 29), s: 'm', n: pick(sn.mst) }); for (let i = 0; i < et[1]; i++) ev.push({ min: 91 + Math.floor(Math.random() * 29), s: 'o', n: pick(sn.ost) }); ev.sort((a, b) => a.min - b.min);
  let pk = null;
  if (wl.pen) {
    const order = (st) => { const f = st.filter(p => p.sub !== 'GK').sort((a, b) => b.fin - a.fin); const g = st.filter(p => p.sub === 'GK'); return f.concat(g); };
    const km = order(sn.mst), ko = order(sn.ost);
    for (let tries = 0; tries < 400; tries++) {
      const m = [], o = []; let sm = 0, so = 0, done = false, first = Math.random() < 0.5;
      for (let r = 0; r < 60 && !done; r++) {
        const turn = first ? ['m', 'o'] : ['o', 'm'];
        for (const sd of turn) {
          const k = (sd === 'm' ? km : ko)[r % 11], ok = Math.random() < 0.72 + (k.fin - 60) / 400;
          (sd === 'm' ? m : o).push({ n: k.n, ok }); if (ok) { sd === 'm' ? sm++ : so++; }
          if (r < 5) { const lm = 5 - m.length, lo = 5 - o.length; if (sm > so + lo || so > sm + lm) { done = true; break; } }
          else if (m.length === o.length && sm !== so) { done = true; break; }
        }
      }
      if (done && (sm > so) === myWin) { pk = { m, o, sm, so, first }; break; }
    }
    if (!pk) pk = { m: [{ n: km[0].n, ok: myWin }], o: [{ n: ko[0].n, ok: !myWin }], sm: myWin ? 1 : 0, so: myWin ? 0 : 1, first: true };
  }
  return { my: sn.my, op: sn.op, et: wl.et ? et : null, ev, pk, myWin };
}
function etShow(o) {
  let el = $('#pop'); if (!el) { el = document.createElement('div'); el.id = 'pop'; ($('#toast') ? $('#toast').parentNode : document.body).appendChild(el); }
  clearTimeout(pop.t);
  const steps = []; let gm = 0, go = 0;
  steps.push({ h: `<div class="dim" style="font-size:12px">90분 종료 · 무승부 → 연장전(30분)</div>` });
  if (o.ev.length) o.ev.forEach(e => { e.s === 'm' ? gm++ : go++; steps.push({ h: `<div>⚽ 연장 ${e.min}분 <b>${esc(e.n)}</b> <span class="dim">${esc(e.s === 'm' ? o.my : o.op)}</span></div>`, sc: `연장 ${gm} : ${go}` }); });
  else steps.push({ h: `<div class="dim">연장전 120분 — 득점 없이 끝났습니다</div>`, sc: '연장 0 : 0' });
  if (o.pk) {
    steps.push({ h: `<div style="margin-top:6px"><b>승부차기</b> <span class="dim">· ${esc(o.pk.first ? o.my : o.op)} 선축</span></div>`, sc: '승부차기 0 : 0' });
    let a = 0, b = 0; const seq = [], first = o.pk.first ? 'm' : 'o', second = first === 'm' ? 'o' : 'm', L = Math.max(o.pk.m.length, o.pk.o.length);
    for (let i = 0; i < L; i++) for (const sd of [first, second]) { const k = o.pk[sd][i]; if (k) seq.push({ sd, k }); }
    seq.forEach(({ sd, k }) => { if (k.ok) { sd === 'm' ? a++ : b++; } steps.push({ h: `<div>${k.ok ? '✅' : '❌'} <b>${esc(k.n)}</b> <span class="dim">${esc(sd === 'm' ? o.my : o.op)} · ${k.ok ? '성공' : '실축'}</span></div>`, sc: `승부차기 ${a} : ${b}` }); });
  }
  steps.push({ h: `<div style="margin-top:8px;font-size:15px"><b>${o.myWin ? '🎉 ' + esc(o.my) + ' 승리 — 다음 라운드 진출!' : '😢 ' + esc(o.op) + ' 승리 — ' + esc(o.my) + ' 탈락'}</b></div>`, end: true });
  el.innerHTML = `<div class="popbox"><div class="popic">⏱️</div><div class="popt">연장전${o.pk ? ' · 승부차기' : ''}</div><div id="etsc" style="font-size:20px;font-weight:800;margin:4px 0">${esc(o.my)} vs ${esc(o.op)}</div><div id="etlog" class="popm" style="max-height:38vh;overflow:auto;text-align:left;display:flex;flex-direction:column;gap:3px"></div><div class="popb"><button class="btn sec" id="etskip" style="flex:1">건너뛰기</button><button class="btn" id="etok" style="flex:1">확인</button></div></div>`;
  el.style.display = 'flex';
  const log = el.querySelector('#etlog'), sc = el.querySelector('#etsc'); let i = 0, tm = null;
  const close = () => { clearInterval(tm); el.style.display = 'none'; el.innerHTML = ''; };
  const add = () => { if (i >= steps.length) { clearInterval(tm); return; } const st = steps[i++]; log.insertAdjacentHTML('beforeend', st.h); if (st.sc) sc.textContent = st.sc; log.scrollTop = log.scrollHeight; };
  tm = setInterval(add, 800); add();
  el.querySelector('#etskip').onclick = (ev) => { ev.stopPropagation(); while (i < steps.length) add(); clearInterval(tm); };
  el.querySelector('#etok').onclick = (ev) => { ev.stopPropagation(); if (i < steps.length) { while (i < steps.length) add(); clearInterval(tm); return; } close(); };
}
function exitAskOpen() {                                                                            // 경기 중 나가기: 확인 창(경기 정지)
  if (!MV || MV.over || !G0().mm || MV.exitAsk || MV.ending) return;
  MV.exitAsk = true; const el = document.createElement('div'); el.id = 'exitq';
  el.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;z-index:80;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px';
  el.innerHTML = '<div class="card" style="max-width:340px;width:100%;text-align:center"><b style="font-size:16px">경기를 중단하고 나갈까요?</b><div class="dim" style="margin:8px 0 12px;line-height:1.45">지금까지의 경기 내용은 기록되지 않고,<br>이 경기는 처음부터 다시 진행해야 해요.</div><div class="row g8" style="justify-content:center"><button class="btn sec" data-act="mexitno">계속 보기</button><button class="btn" data-act="mexityes">나가기</button></div></div>';
  $('#match').appendChild(el);
}
// ---- 경기 설정(⚙): 누르면 경기가 멈추고 카메라·그림·배속·보기 방식을 바꾼 뒤 '경기 재개'로 이어 감 ----
const VM_N = { full: '풀', hl: '하이라이트', mine: '내 장면만' };
function msetHTML() {
  const cams = (typeof V3D !== 'undefined' && V3D.CAMS) || [], cm = (typeof V3D !== 'undefined' && V3D.camNow) ? V3D.camNow() : 'bc';
  const chips = (act, list, cur) => list.map(([k, n]) => `<button class="chip ${String(cur) === String(k) ? 'on' : ''}" data-act="${act}" data-id="${k}">${n}</button>`).join('');
  return `<div class="mset-card"><div class="mset-h"><b>경기 설정</b><span class="mset-p">⏸ 일시정지</span></div>
    <div class="mset-s">카메라</div><div class="mset-c">${chips('mcam', cams, cm)}</div>
    <div class="mset-s">그림</div><div class="mset-c">${chips('mview', [['hy', '하이브리드 3D'], ['lp', '로우폴리 3D']], viewNow())}</div>
    <div class="mset-s">공</div><div class="mset-c">${chips('mball', ((typeof V3D !== 'undefined' && V3D.BALLS) || []).map(b => [b[0], b[1]]), (typeof V3D !== 'undefined' && V3D.ballSkin) ? V3D.ballSkin() : 'neon')}</div>
    <div class="mset-s">속도</div><div class="mset-c">${chips('mspd', SPD.map(v => [v, v + '배속']), S.spd || 1)}</div>
    <div class="mset-s">보기</div><div class="mset-c">${chips('mvm', Object.entries(VM_N), S.vm || 'full')}</div>
    <button class="btn wide mset-go" data-act="msetx">▶ 경기 재개</button></div>`;
}
// 가로 전체화면: 경기 영상만 화면 가득(가능하면 실제 전체화면+가로 고정, 안 되면 화면을 90도 돌려서 표시)
function vfullFit() { const w = document.querySelector('#pitchbox .pwrap'); if (!w || !w.classList.contains('vfull')) return; w.classList.toggle('rot', innerHeight > innerWidth); }
function vfullToggle(off) {
  const w = document.querySelector('#pitchbox .pwrap'); if (!w) return; const on = off ? false : !w.classList.contains('vfull');
  w.classList.toggle('vfull', on); document.body.classList.toggle('vfull-on', on);
  try { if (on) { const de = document.documentElement; if (de.requestFullscreen && !document.fullscreenElement) de.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} setTimeout(vfullFit, 300); }).catch(() => {}); }
        else { try { screen.orientation.unlock(); } catch (e) {} if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } } catch (e) {}
  if (!w.classList.contains('vfull')) w.classList.remove('rot'); vfullDrawer(on); vfullFit(); }
function vfullDrawer(on) {                                                                    // 전체화면: 오른쪽 메뉴(경기 흐름·통계·버튼)를 경기 화면 위 서랍으로 — 버튼으로 펼치고 접음
  const w = document.querySelector('#pitchbox .pwrap'), mb = document.getElementById('mb'), mf = document.getElementById('mf'), mt = document.getElementById('match'); if (!w || !mb || !mf || !mt) return;
  let dr = document.getElementById('vdrawer'), tb = document.getElementById('vmtab');
  if (on) { if (!dr) { dr = document.createElement('div'); dr.id = 'vdrawer'; w.appendChild(dr); } if (!tb) { tb = document.createElement('button'); tb.id = 'vmtab'; tb.type = 'button'; tb.dataset.act = 'vmenu'; w.appendChild(tb); }
    dr.appendChild(mb); dr.appendChild(mf); dr.classList.remove('open'); tb.textContent = '◀ 메뉴'; }
  else { mt.appendChild(mb); mt.appendChild(mf); if (dr) dr.remove(); if (tb) tb.remove(); } }
function vfullMenu() { const dr = document.getElementById('vdrawer'), tb = document.getElementById('vmtab'); if (!dr) return; const o = dr.classList.toggle('open'); if (tb) { tb.textContent = o ? '▶ 닫기' : '◀ 메뉴'; tb.classList.toggle('open', o); } }
window.addEventListener('resize', () => { try { vfullFit(); } catch (e) {} });
function msetOpen() {
  if (!MV || MV.over || !G0().mm || MV.exitAsk || MV.setOpen) return;
  MV.setOpen = true; S.mfOpen = false; let el = document.getElementById('mset'); if (!el) { el = document.createElement('div'); el.id = 'mset'; $('#match').appendChild(el); }
  el.innerHTML = msetHTML();
}
function msetSync() { const el = document.getElementById('mset'); if (el && MV && MV.setOpen) el.innerHTML = msetHTML(); }
function msetClose() { const el = document.getElementById('mset'); if (el) el.remove(); if (MV) { MV.setOpen = false; MV.last = 0; } }
// ---- 경기 전 입장 연출(화면만): 터널에서 입장 → 중앙선 앞 한 줄 정렬 → 양 팀 이름 → 휘슬 → 킥오프. '건너뛰기'로 바로 정렬 ----
// ===== 입장 행사: 터널에서 입장 → 홈 11·심판 3·원정 11 한 줄 정렬 → 원정팀이 홈팀·심판 앞을 지나며 악수 → 포메이션 → 킥오프 =====
function introSlots(M) { const homeP = M.mineHome ? 'm' : 'o', awayP = homeP === 'm' ? 'o' : 'm', X0 = 19, SP = 2.5, Y = 44, L = { homeP, awayP, Y, pos: {}, wpH: X0 + 10 * SP, wpA: X0 + 14 * SP };
  sideOf(homeP).forEach((p, i) => { L.pos[homeP + i] = { x: X0 + i * SP, y: Y }; });
  L.ref = { a1: X0 + 11 * SP, m: X0 + 12 * SP, a2: X0 + 13 * SP };
  sideOf(awayP).forEach((p, i) => { L.pos[awayP + i] = { x: X0 + (14 + i) * SP, y: Y }; }); return L; }
function introStart(M) {
  const go = () => { if (!MV || MV.timer || MV.over) return; introClear(); MV.introRef = null; if (MV.ref) { delete MV.ref.a1y; delete MV.ref.a2y; } MV.force = null; MV.introWalk = false; resetPos(M, true); MV.ball.x = 50; MV.ball.y = 32; if (!MV.holder) MV.goalRes = M.mineHome ? 'm' : 'o'; MV.paused = false; PX.ui.sfx('whistle'); lbl('킥오프!'); MV.timer = setInterval(tick, MV.speed); PX.ui.render(); PX.ui.move(); };
  if (MV.fast || MV.hlFast || MV.skipping || !canStageLoose()) { go(); return; }
  const L = introSlots(M); MV.intro = { ph: 'walk', tm: [], go, L, wp: {} }; MV.paused = true; MV.introWalk = true; MV.force = {}; MV.holder = null; MV.act = null;   // 입장 중엔 공 없음·경기 정지
  [[L.homeP, 48.6], [L.awayP, 51.4]].forEach(([pre, fx]) => sideOf(pre).forEach((p, i) => { const c = MV.pos[pre][i]; if (c) { c.x = fx; c.y = 67 + (pre === L.awayP ? sideOf(pre).length - 1 - i : i) * 1.6; c.vx = c.vy = 0; } MV.force[pre + i] = Object.assign({}, L.pos[pre + i]); }));   // 터널에서 두 줄로
  if (!MV.ref) MV.ref = { x: 50, y: 40, a1: 50, a2: 50 }; Object.assign(MV.ref, { x: 50, y: 65.4, a1: 49.2, a1y: 65.2, a2: 50.8, a2y: 65.2 });            // 심판 3명이 앞장서서
  MV.introRef = { mx: L.ref.m, my: L.Y, a1x: L.ref.a1, a1y: L.Y, a2x: L.ref.a2, a2y: L.Y };
  MV.ball.x = 50; MV.ball.y = 32; lbl('선수 입장'); introSkipBtn(true);
  MV.intro.tm.push(later(() => introLine(M), 26000));                                     // 늦어도 14초에 정렬
}
function introLine(M) {
  const I = MV && MV.intro; if (!I || I.ph !== 'walk') return; I.ph = 'line'; MV.introWalk = false; for (const k in I.L.pos) if (MV.force && MV.force[k]) MV.force[k] = { x: I.L.pos[k].x, y: I.L.pos[k].y };
  for (const k in (MV.force || {})) { const c = MV.pos[k[0]][+k.slice(1)], F = MV.force[k]; if (c && Math.hypot(c.x - F.x, c.y - F.y) > 4) { c.x = F.x; c.y = F.y; c.vx = c.vy = 0; } }
  { let k = 0; const al = () => { if (!MV || MV.intro !== I || I.ph !== 'line' || ++k > 14) return; for (const q in (MV.force || {})) { const c = MV.pos[q[0]][+q.slice(1)], F = MV.force[q]; if (c) { c.x += (F.x - c.x) * .3; c.y += (F.y - c.y) * .3; c.vx = c.vy = 0; } } I.tm.push(later(al, 100)); }; I.tm.push(later(al, 100)); }   // 줄을 반듯하게
  const h = M.h, a = M.a; fxShow(`<div class="gs" style="font-size:20px;letter-spacing:1px">${esc(h.name)} <span style="color:#FFD23F">VS</span> ${esc(a.name)}</div><div class="gsa">${esc(M.title || '')}${MV.refName ? ' · 주심 ' + esc(MV.refName) : ''}</div>`, 'save', 2800, false);
  I.tm.push(later(() => introShake(M), 3400));
}
function introShake(M) { const I = MV && MV.intro; if (!I || I.ph !== 'line') return; I.ph = 'shake'; lbl('악수'); sideOf(I.L.awayP).forEach((p, i) => { I.wp[i] = 0; }); I.tm.push(later(() => introForm(M), 22000)); }
function introForm(M) { const I = MV && MV.intro; if (!I || (I.ph !== 'shake' && I.ph !== 'line')) return; I.ph = 'form'; lbl('포메이션으로');
  MV.introRef = { mx: 50 - dM_(M) * 6, my: 40, a1x: 50, a1y: 64.2, a2x: 50, a2y: -.2 };
  walkToKickoff(M, () => { if (MV && MV.intro === I) later(() => { if (MV && MV.intro === I) I.go(); }, 500); }, 10000); }
function introSpd(pre, i) { const I = MV.intro; if (!I) return 1; if (I.ph === 'walk') { const p = sideOf(pre)[i]; return .45 * 15 / (8 + PA(p, 'PAC') / 9); } if (I.ph === 'shake') return pre === I.L.awayP ? ((I.wp[i] || 0) < 2 ? .55 : .75) : 1; if (I.ph === 'form') return .7; return 1; }   // 입장 걸음 속도
function introTick(M, dt) { const I = MV.intro; if (!I) return;                                // 매 프레임: 심판 이동·입장 도착 확인·악수 행렬
  if (MV.introRef && MV.ref) { const R = MV.ref, T = MV.introRef, v = 5 * dt, mv = (a, b) => a + clampN(b - a, -v, v); R.x = mv(R.x, T.mx); R.y = mv(R.y, T.my); R.a1 = mv(R.a1, T.a1x); R.a1y = mv(R.a1y != null ? R.a1y : 64.2, T.a1y); R.a2 = mv(R.a2, T.a2x); R.a2y = mv(R.a2y != null ? R.a2y : -.2, T.a2y); }
  if (I.ph === 'walk') { let ok = true; const L = I.L;   // 한 줄로 걸어 나와 차례대로 라인에 올라선 뒤 라인을 따라 자기 자리로(지그재그·겹침 없음)
    for (const pre of [L.homeP, L.awayP]) { const wp = pre === L.homeP ? L.wpH : L.wpA, ord = sideOf(pre).map((p, i) => i).filter(i => MV.pos[pre][i] && L.pos[pre + i]).sort((a, b) => Math.abs(L.pos[pre + b].x - wp) - Math.abs(L.pos[pre + a].x - wp));
      ord.forEach((i, r) => { const c = MV.pos[pre][i], S2 = L.pos[pre + i], onL = c.y <= L.Y + 0.4; let F;
        if (onL) F = { x: S2.x, y: L.Y };
        else { const pv = r > 0 ? MV.pos[pre][ord[r - 1]] : null, pvGone = !pv || (pv.y <= L.Y + 0.4 && Math.abs(pv.x - wp) >= 2.4); F = pvGone ? { x: wp, y: L.Y } : { x: pv.y <= L.Y + 0.4 ? wp : pv.x, y: (pv.y <= L.Y + 0.4 ? L.Y : pv.y) + 1.6 }; }
        MV.force[pre + i] = F; if (Math.hypot(c.x - S2.x, c.y - S2.y) > .9) ok = false; }); }
    if (ok) introLine(M); }
  else if (I.ph === 'shake') { const A = I.L.awayP, yF = I.L.Y + 1.9, KT = I.kt || (I.kt = kickoffTargets(M)); let all = true;
    sideOf(A).forEach((p, i) => { const c = MV.pos[A][i]; if (!c) return; let st = I.wp[i] || 0; const slot = I.L.pos[A + i]; if (!slot) return;
      if (st === 0 && Math.hypot(c.x - slot.x, c.y - yF) < .6) st = 1; if (st === 1 && c.x <= 15.5) st = 2; I.wp[i] = st;
      const pq = i > 0 && (I.wp[i - 1] || 0) < 2 ? MV.pos[A][i - 1] : null;                              // 앞 사람과 2.5 간격 유지(한 줄로 따라감)
      MV.force[A + i] = st === 0 ? { x: slot.x, y: yF } : st === 1 ? { x: pq ? Math.max(14, pq.x + 2.5) : 14, y: yF } : KT[A + i]; if (st < 2) all = false; });
    if (all) introForm(M); } }
function introSkip() { const M = G0() && G0().mm, I = MV && MV.intro; if (!M || !I) return; I.tm.forEach(laterClear); I.tm = []; MV.introRef = null; if (MV.ref) { delete MV.ref.a1y; delete MV.ref.a2y; MV.ref.x = 50 - dM_(M) * 6; MV.ref.y = 40; } I.go(); }   // 건너뛰기: 어느 단계든 바로 킥오프
function introClear() { const I = MV && MV.intro; if (I) I.tm.forEach(laterClear); if (MV) MV.intro = null; introSkipBtn(false); }
function introSkipBtn(on) { let b = document.getElementById('introSkip'); if (!on) { if (b) b.remove(); return; } if (!b) { b = document.createElement('button'); b.id = 'introSkip'; b.className = 'btn sec'; b.dataset.act = 'mintro'; b.textContent = '입장 건너뛰기 ▸'; $('#match').appendChild(b); } }
function exitAskClose() { const el = document.getElementById('exitq'); if (el) el.remove(); if (MV) { MV.exitAsk = false; MV.last = 0; } }
function exitMatch() { try { vfullToggle(true); } catch (e) {}                                                                              // 경기 폐기: 결과·기록 없이 경기 전 상태로 복귀(경기일은 그대로 남아 다시 진행)
  const el = document.getElementById('exitq'); if (el) el.remove();
  if (!MV) return; const G = G0();
  try { clearInterval(MV.timer); if (MV.raf) cancelAnimationFrame(MV.raf); clearTimeout(PX.fxT); } catch (e) {}
  try { const sn = MV.snap, M = G.mm; if (sn) { const m0 = Core.me(); m0.mor = sn.mor; m0.trust = sn.trust; if (M && M.mine && sn.tac) M.mine.tactic = JSON.parse(sn.tac); } } catch (e) {}
  const was = MV; MV.over = true; MV = null; G.mm = null; G.wcLast = null; S.matchOpen = false; S.mgrGo = false; S.mtab = 'flow'; S.mpout = null;
  $('#match').classList.remove('on'); $('#match').innerHTML = ''; lockOrient('portrait');
  save(); try { if (isM()) mgrPre(); else playPre(); } catch (e) {} render(); toast('경기를 중단했어요 · 처음부터 다시 진행합니다', 3500);
}
function endMatchUI() {
  if (MV && MV.raf) cancelAnimationFrame(MV.raf);
  const ctx0 = G0().mm && G0().mm.ctx; G0().wcLast = null;
  const mm0 = G0().mm, snap = (MV && mm0 && !mm0.xt && MV.mst && MV.ost) ? { mineId: mm0.mineHome ? mm0.h.id : mm0.a.id, my: mm0.mine.name, op: mm0.opp.name, mst: MV.mst.map(p => ({ n: p.name, sub: p.sub, fin: PA(p, 'FIN') })), ost: MV.ost.map(p => ({ n: p.name, sub: p.sub, fin: PA(p, 'FIN') })) } : null;
  try { anaSave(G0().mm); } catch (e) {}
  const r = Core.finishMine(); $('#match').classList.remove('on'); lockOrient('portrait'); S.matchOpen = false; MV = null; save(); try { if (G0().mode === 'mgr' && !G0().wc && !G0().mgr.sacked) { const pr = Core.mgrPressGen(); if (pr && (pr.derby || Math.random() < 0.5)) { S.modalKind = 'press'; S.modal = pressModal(); } } } catch (e) {}
  const rt = r.rating ? ` · 평점 ${f1(r.rating)}` : ''; { const wl = G0().wcLast; if (wl && snap) { render(); etShow(etBuild(snap, wl, r.res)); return; } toast(wl ? `종료 ${r.res.gh}-${r.res.ga} · ${wl.pen ? '연장 ' + wl.et.join(':') + ' 후 승부차기 ' : '연장전 ' + wl.et.join(':') + ' · '}${Core.clubOf(wl.w).name} 승` : `종료 ${r.res.gh}-${r.res.ga}${rt}`); } render();
}
// ---------- 렌더 ----------
// ===================== 감독 모드 화면 =====================
const isM = () => { try { return !!(Core.G && Core.G.mode === 'mgr'); } catch (e) { return false; } };
const MNAV = [['home', '홈'], ['squad', '선수단'], ['mtac', '전술'], ['mkt', '이적'], ['mclub', '구단'], ['league', '순위']];
const POSL = ['ALL', 'GK', 'CB', 'FB', 'DM', 'CM', 'AM', 'W', 'ST'];
const roleNm = (id) => { const R = Core.Eng.ROLES[id]; return R ? R.name : (id || '-'); };
function ddakLogo(sz) {                                                                      // 딱알 솔루션 통일 로고: 빨간 둥근 사각형 + 흰 'ㄷ' 두 개
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 100 100" aria-label="딱알 솔루션" style="flex:none;display:block"><rect width="100" height="100" rx="24" fill="#E23B2A"/><path d="M47 31H25V69H47M79 31H57V69H79" fill="none" stroke="#FFF8EE" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function modeView() {
  return `<div class="top"><div>${pixLogo(92)}</div><div class="dim">블록 풋볼매니저</div></div><div class="body"><div class="dim">어떤 길로 시작할까요? 나라·리그(월드) 선택은 다음 단계입니다.</div>
  <div class="card lnk modec" data-act="mode" data-id="player"><div><div class="mi">⚽</div><b>선수 육성 모드</b><div class="dim">유스·신인에서 출발해 훈련과 경기 속 선택으로 한 명의 선수를 월드클래스로 키웁니다.</div></div></div>
  <div class="card lnk modec" data-act="mode" data-id="mgr"><div><div class="mi">📋</div><b>감독 모드</b><div class="dim">구단을 맡아 선발·포메이션·역할·팀 지시를 직접 정하고, 이적 시장과 이사회 신임을 관리하며 시즌 목표에 도전합니다. 경기는 직접 관전하거나 요약으로 빠르게 진행할 수 있습니다.</div></div></div>
  <div class="card lnk modec" data-act="mode" data-id="wc"><div><div class="mi">🌍</div><b>월드컵 모드</b><div class="dim">48개국 중 한 나라의 감독이 되어 조별리그부터 결승까지 한 대회를 치릅니다. 선발·전술·교체를 직접 정하고, 우승에 도전하세요. 월드 생성 없이 바로 시작합니다.</div></div></div>
  ${Object.keys(S.slots || {}).length ? `<div class="sec">저장된 게임 불러오기</div>${slotRows(false)}` : ''}<div class="ddak">${ddakLogo(22)}<span>딱알 솔루션</span></div></div>`;
}
function mcreateView() {
  const c = S.cr, G = G0(); if (!S.sel.includes(c.cc)) c.cc = S.sel[0];
  const offers = Core.mgrOffers(c.cc); if (!offers.some(o => o.id === c.mclub)) c.mclub = offers.length ? (offers[1] || offers[0]).id : null;
  const ch = (key, arr, map) => `<div class="chips w">${arr.map(v => `<button class="chip ${c[key] === v ? 'on' : ''}" data-act="cr" data-k="${key}" data-id="${v}">${map ? map[v] : v}</button>`).join('')}</div>`;
  const sw = (key, map) => `<div class="chips">${Object.keys(map).map(v => `<button class="sw ${c[key] === v ? 'on' : ''}" data-act="cr" data-k="${key}" data-id="${v}" style="background:#${map[v]}" aria-label="${v}"></button>`).join('')}</div>`;
  const natOpts = ['KOR'].concat(Core.NAT_CODES.filter(x => x !== 'KOR')).map(n => `<option value="${n}" ${c.nat === n ? 'selected' : ''}>${Core.NATK(n)}</option>`).join('');
  const cards = offers.map(o => { const cl = Core.clubOf(o.id); return `<div class="card mclub ${c.mclub === o.id ? 'on' : ''}" data-act="mclub" data-id="${o.id}"><div class="row g8">${crest(cl, 30)}<div class="grow"><b>${esc(o.name)}</b><div class="dim">${esc(o.tag)}</div></div><span class="tag">전력 ${o.strength}</span></div><div class="dim">목표: ${esc(o.goal)} · 예산 ${o.cash}억 원 · 현재 전력 ${o.rank}/${o.n}위</div></div>`; }).join('');
  return `<div class="top"><div class="ttl">감독 만들기</div><div class="dim">${Core.fmtDate(G.day)} 부임</div></div><div class="body"><div class="card row g8"><span class="spr" style="width:96px;height:204px;background-image:url(${sprite({ skin: c.skin, hair: c.hair, style: c.style }, ['#2B3A55', '#F3F3F3'])})"></span><div class="grow"><div class="dim">이름</div><input id="nm" value="${esc(c.name)}" maxlength="8"><div class="dim" style="margin-top:8px">감독으로 부임합니다. 선수단은 구단이 가진 선수들입니다.</div></div></div>
  <div class="sec">국적</div><select id="natsel">${natOpts}</select>
  <div class="sec">피부색</div>${sw('skin', SKIN_C)}<div class="sec">머리 모양</div>${ch('style', Object.keys(STYLE_N), STYLE_N)}<div class="sec">머리 색</div>${sw('hair', HAIR_C)}
  <div class="sec">리그 국가</div><div class="chips w">${S.sel.map(x => `<button class="chip ${c.cc === x ? 'on' : ''}" data-act="cr" data-k="cc" data-id="${x}">${Core.FLAG[x] || ''} ${CO[x].name}</button>`).join('')}</div>
  <div class="sec">부임 구단 <span class="dim">제안 3곳 중 선택</span></div>${cards || '<div class="dim">이 나라에는 1부 구단이 없습니다.</div>'}
  <button class="btn wide" data-act="mstart" ${c.mclub == null ? 'disabled' : ''}>이 구단 감독으로 시작하기</button></div>`;
}
function wcselView() {
  const c = S.cr, W = Core.WCN;
  const codes = Object.keys(W).sort((a, b) => W[b][2] - W[a][2]); if (!c.wcn) c.wcn = 'KOR';
  const ch = (key, arr, map) => `<div class="chips w">${arr.map(v => `<button class="chip ${c[key] === v ? 'on' : ''}" data-act="cr" data-k="${key}" data-id="${v}">${map ? map[v] : v}</button>`).join('')}</div>`;
  const sw = (key, map) => `<div class="chips">${Object.keys(map).map(v => `<button class="sw ${c[key] === v ? 'on' : ''}" data-act="cr" data-k="${key}" data-id="${v}" style="background:#${map[v]}" aria-label="${v}"></button>`).join('')}</div>`;
  const cards = codes.map((k, i) => `<div class="wcn ${c.wcn === k ? 'on' : ''}" data-act="wcpick" data-id="${k}"><div class="wcf">${(Core.FLAG[k] || W[k][1] || '')}</div><div class="wcnm">${esc(Core.NATK(k).replace(/^\S+\s/, ''))}</div><div class="wcs"><i style="width:${Math.round((W[k][2] - 58) / 28 * 100)}%"></i></div><div class="dim s11">${i < 8 ? '우승 후보' : i < 20 ? '강팀' : i < 34 ? '중위권' : '도전자'} · ${W[k][2]}</div></div>`).join('');
  return `<div class="top"><div class="ttl">월드컵 모드 <span class="dim">· 2026</span></div></div><div class="body"><div class="card row g8"><span class="spr" style="width:96px;height:204px;background-image:url(${sprite({ skin: c.skin, hair: c.hair, style: c.style }, ['#2B3A55', '#F3F3F3'])})"></span><div class="grow"><div class="dim">감독 이름</div><input id="nm" value="${esc(c.name)}" maxlength="8"><div class="dim" style="margin-top:8px">시작하면 먼저 26명 최종 명단을 직접 뽑습니다. 약한 나라일수록 목표가 낮고 이변의 재미가 큽니다.</div></div></div>
  <div class="sec">피부색</div>${sw('skin', SKIN_C)}<div class="sec">머리 모양</div>${ch('style', Object.keys(STYLE_N), STYLE_N)}<div class="sec">머리 색</div>${sw('hair', HAIR_C)}
  <div class="sec">조 편성 방식</div><div class="row g8"><button class="chip ${(c.wcdraw || 'real') === 'real' ? 'on' : ''}" data-act="cr" data-k="wcdraw" data-id="real" style="flex:1">실제 2026 월드컵 조</button><button class="chip ${c.wcdraw === 'rand' ? 'on' : ''}" data-act="cr" data-k="wcdraw" data-id="rand" style="flex:1">랜덤 조 추첨</button></div><div class="dim">${(c.wcdraw || 'real') === 'real' ? '2025년 12월 실제 추첨 결과(A~L조) 그대로 진행합니다.' : '48개국을 전력순 4개 포트로 나눠 무작위로 조를 추첨합니다.'}</div><div class="sec">맡을 나라 <span class="dim">${esc(Core.NATK(c.wcn))}</span></div><div class="wcgrid">${cards}</div>
  <div class="dim" style="text-align:center">시작을 누르면 <b>실제 조 / 랜덤 조</b>를 고릅니다</div><button class="btn wide" data-act="wcstart">이 나라 감독으로 월드컵 시작</button><button class="btn sec wide" data-act="modeback">← 모드 다시 고르기</button></div>`;
}
function wcSquadView() {
  const G = Core.G, club = Core.clubOf(Core.me().club), pick = S.wcPick || (S.wcPick = new Set()), f = S.wcf || 'ALL';
  const ORD = ['GK','CB','FB','DM','CM','AM','W','ST'];
  const all = club.pl.map(id => G.players[id]).filter(Boolean).sort((a, b) => ORD.indexOf(a.sub) - ORD.indexOf(b.sub) || b.ovr - a.ovr);
  const cnt = (...ss) => all.filter(p => pick.has(p.id) && ss.includes(p.sub)).length, n = pick.size;
  const info = Core.wcInfo(), gtxt = info && info.gi >= 0 ? String.fromCharCode(65 + info.gi) + '조 · ' + info.groups[info.gi].teams.filter(t => t !== club.id).map(t => Core.clubOf(t).name).join(', ') : '';
  const list = all.filter(p => f === 'ALL' || p.sub === f);
  const chips = `<div class="chips">${POSL.map(k => `<button class="chip ${f === k ? 'on' : ''}" data-act="wcsqf" data-id="${k}">${k === 'ALL' ? '전체' : k}</button>`).join('')}</div>`;
  const rows = list.map(p => `<div class="card sqr ${pick.has(p.id) ? 'on' : ''}" data-act="wcsq" data-id="${p.id}" style="${pick.has(p.id) ? 'border-color:#C6F36B' : 'opacity:.72'}"><span class="tag pos">${p.sub}</span><div class="grow"><b>${esc(p.name)}</b>${p.star ? ' <span class="tag">★스타</span>' : ''}<div class="dim s11">${p.age}세 · 능력 ${p.ovr}</div></div><b style="font-size:18px">${pick.has(p.id) ? '✅' : '⬜'}</b></div>`).join('');
  return `<div class="top"><div class="ttl">선수 선발 <span class="dim">· ${esc(club.name)}</span></div></div><div class="body"><div class="card"><div class="row"><b>${n} / 26명</b><span class="dim">후보 ${all.length}명</span></div><div class="dim">GK ${cnt('GK')} · DF ${cnt('CB', 'FB')} · MF ${cnt('DM', 'CM', 'AM')} · FW ${cnt('W', 'ST')} <span class="dim">(최소 3 / 8 / 5 / 5)</span></div>${gtxt ? `<div class="dim" style="margin-top:4px">내 조: ${esc(gtxt)}</div>` : ''}<div class="row g8" style="margin-top:8px"><button class="btn sec" data-act="wcsqauto" style="flex:1">추천 명단으로</button><button class="btn" data-act="wcsqok" style="flex:1">선발 확정</button></div></div>${chips}${rows}</div>`;
}
const WNAV = [['home', '홈'], ['squad', '선수단'], ['mtac', '전술'], ['wcg', '대진·순위'], ['news', '뉴스']];
const isW = () => { try { return !!(Core.G && Core.G.wc); } catch (e) { return false; } };
function wcRow(id, mine, adv, i) {
  const c = Core.clubOf(id), G = G0(), t = G.comps.find(x => x.id === 'WC').groups.find(g => g.teams.includes(id)).table[id];
  return `<tr class="${id === mine ? 'hl' : ''}"><td>${i + 1}</td><td>${clubLink(id)}</td><td>${t.p}</td><td>${t.w}-${t.d}-${t.l}</td><td>${t.gf - t.ga >= 0 ? '+' : ''}${t.gf - t.ga}</td><td><b>${t.pts}</b></td></tr>`;
}
function wcGroupTable(gi, info) {
  const g = info.groups[gi], names = 'ABCDEFGHIJKL';
  return `<div class="sec">${names[gi]}조</div><table class="tb wct"><tr><th>#</th><th>팀</th><th>경기</th><th>승무패</th><th>득실</th><th>승점</th></tr>${g.teams.map((id, i) => wcRow(id, info.mine, i < 2, i)).join('')}</table>`;
}
function wcTieRow(t, mine) {
  const a = Core.clubOf(t.a), b = Core.clubOf(t.b), done = t.w != null;
  const sc = done ? `<b>${t.sa}:${t.sb}</b>${t.pen ? ' <span class="tag">승부차기</span>' : t.et ? ' <span class="tag">연장</span>' : ''}` : '<span class="dim">vs</span>';
  return (t.third ? '<div class="dim" style="margin:6px 0 2px">3·4위전</div>' : '') + `<div class="tie ${t.a === mine || t.b === mine ? 'hl' : ''}"><div class="${done && t.w === t.a ? 'tw' : ''}">${crest(a, 18)} ${esc(a.name)}</div><div class="tsc">${sc}</div><div class="${done && t.w === t.b ? 'tw' : ''}" style="text-align:right">${esc(b.name)} ${crest(b, 18)}</div></div>`;
}
function wcView() {
  const info = Core.wcInfo(), G = G0(); if (!info) return '';
  const tabs = [['grp', '조별리그'], ['ko', '토너먼트']]; const tab = S.wct || (info.stage === 'G' ? 'grp' : 'ko');
  let body = '';
  if (tab === 'grp') {
    const mineFirst = [info.gi].concat(info.groups.map((_, i) => i).filter(i => i !== info.gi));
    body = mineFirst.map(i => wcGroupTable(i, info)).join('');
  } else {
    const rounds = info.hist.concat(info.stage === 'END' ? [] : [{ rl: info.rl, ties: info.ties }]);
    body = rounds.length ? rounds.slice().reverse().map(r => `<div class="sec">${esc(r.rl)}</div><div class="card">${r.ties.map(t => wcTieRow(t, info.mine)).join('')}</div>`).join('') : '<div class="dim">조별리그가 끝나면 32강 대진이 나옵니다.</div>';
  }
  return mgrTop() + `<div class="body"><div class="chips">${tabs.map(([k, n]) => `<button class="chip ${tab === k ? 'on' : ''}" data-act="wct" data-id="${k}">${n}</button>`).join('')}</div>${body}</div>`;
}
function wcHomeView() {
  const G = G0(), g = G.mgr, m = Core.me(), c = Core.clubOf(m.club), info = Core.wcInfo(), nf = nextFixture(m.club);
  const names = 'ABCDEFGHIJKL', over = info.stage === 'END';
  let status = info.stage === 'G' ? `조별리그 ${names[info.gi]}조` : over ? '대회 종료' : info.rl;
  const out = info.out;
  const hero = `<div class="chero" style="background:linear-gradient(135deg,${c.col},${c.col2})"><div class="cshade"></div><div class="crow">${crest(c, 56)}<div><div class="ctn">${esc(c.name)} 대표팀</div><div class="cdn">${esc(status)} · 전력 ${Math.round(c.strength)} (세계 ${g.rank}위권)</div></div></div><div class="cmeta"><span>목표 <b>${esc(g.wcGoal)}</b></span><span>전적 <b>${g.w}승 ${g.d}무 ${g.l}패</b></span></div></div>`;
  let banner = '';
  if (over) banner = `<div class="card ${info.champ === m.club ? 'gl' : ''}"><b>${info.champ === m.club ? '🏆 월드컵 우승!' : '대회 종료'}</b><div class="dim">우승: ${esc(Core.clubOf(info.champ).name)} · 내 성적: ${esc(out || '-')}</div><button class="btn wide" data-act="wcnew">새 게임 시작</button></div>`;
  else if (out) banner = `<div class="card warn"><b>${esc(out)}</b><div class="dim">우리 대표팀의 대회가 끝났습니다. 남은 경기를 진행해 결과를 지켜보세요.</div></div>`;
  let nx = '';
  if (G.pendingMine) nx = `<div class="card gl"><b>오늘은 경기일입니다</b><div class="dim">${esc(Core.clubOf(G.pendingMine.h).name)} vs ${esc(Core.clubOf(G.pendingMine.a).name)}</div><button class="btn wide" data-act="mpre">경기 준비 ⚽</button></div>`;
  else if (nf && !over && !out) { const h = Core.clubOf(nf.h), a = Core.clubOf(nf.a), d = nf.day - G.day, op = nf.h === m.club ? a : h; nx = `<div class="card"><div class="row"><span class="dim">다음 경기 · ${Core.fmtDate(nf.day)} ${d === 0 ? '· 오늘' : '· D-' + d}</span><span class="tag">${esc(nf.label)}</span></div><div class="vs"><div>${crest(h, 30)}<div>${esc(h.name)}</div></div><b>vs</b><div>${crest(a, 30)}<div>${esc(a.name)}</div></div></div><div class="dim">상대 전력 ${Math.round(op.strength)} · 우리 ${Math.round(c.strength)}</div></div>`; }
  const grp = info.stage === 'G' ? wcGroupTable(info.gi, info) : '';
  const L = Core.mgrLineup(), inj = L.injured.length ? `<div class="card warn"><b>부상자 ${L.injured.length}명</b><div class="dim">${L.injured.slice(0, 6).map(p => esc(p.name) + '(' + p.inj + '일)').join(' · ')}</div></div>` : '';
  const news = G.news.filter(n => n.me).slice(0, 5).map(n => `<div class="li"><span class="dim">${Core.fmtDate(n.d).slice(5, 10)}</span> ${esc(n.text)}</div>`).join('') || '<div class="dim">아직 소식이 없습니다.</div>';
  return mgrTop() + `<div class="body">${hero}${banner}${nx}${grp}${inj}<div class="sec">대표팀 소식</div><div class="card">${news}</div></div>`;
}
function mgrTop() {
  const G = G0(), m = Core.me(), c = Core.clubOf(m.club);
  return `<div class="top"><div><div class="dim">${Core.fmtDate(G.day)}</div><div class="ttl">${esc(G.mgr.name)} 감독 <span class="dim">${Core.NATK(m.nat)}</span></div></div><div class="row g8"><div class="pill" data-act="club" data-id="${m.club}">${crest(c, 18)}${esc(c.name)} ›</div><button class="gear" data-act="settings" aria-label="설정">⚙</button></div></div>`;
}
function mgrHomeView() {
  const G = G0(), g = G.mgr, m = Core.me(), c = Core.clubOf(m.club), st = Core.mgrStanding(), nf = nextFixture(m.club), L = Core.mgrLineup(), sq = Core.mgrSquad();
  const bd = Math.round(g.board), bc = bd >= 65 ? '#C6F36B' : bd >= 35 ? '#FFD46B' : '#FF7A6B', bt = bd < 25 ? '⚠ 경질 위험' : bd >= 75 ? '매우 신뢰' : bd >= 50 ? '안정' : '불안';
  const ontrack = st ? st.rank <= g.target : true;
  const board = `<div class="card"><div class="row"><b>이사회 신임</b><span class="tag ${bd < 35 ? 'warn' : ''}">${bt}</span></div><div class="mbar"><i style="width:${bd}%;background:${bc}"></i></div><div class="row"><span class="dim">시즌 목표</span><b>${g.target}위 이내</b></div><div class="row"><span class="dim">현재 순위</span>${st && !st.p ? '<b class="dim">개막 전</b>' : `<b style="color:${ontrack ? '#C6F36B' : '#FFB27A'}">`}${st && !st.p ? '' : st ? st.rank + '위 / ' + st.n + '팀 · ' + st.pts + '점 (' + st.p + '경기)</b>' : '-</b>'}</div></div>`;
  let nx = '';
  if (G.pendingMine) nx = `<div class="card gl"><b>오늘은 경기일입니다</b><div class="dim">${esc(Core.clubOf(G.pendingMine.h).name)} vs ${esc(Core.clubOf(G.pendingMine.a).name)}</div><button class="btn wide" data-act="mpre">경기 준비 ⚽</button></div>`;
  else if (nf) { const h = Core.clubOf(nf.h), a = Core.clubOf(nf.a), d = nf.day - G.day, op = nf.h === m.club ? a : h; nx = `<div class="card"><div class="row"><span class="dim">다음 경기 · ${Core.fmtDate(nf.day)} ${d === 0 ? '· 오늘' : '· D-' + d}</span><span class="tag">${(Core.rivalOf(c) === op.id) ? '🔥 라이벌전 · ' : ''}${esc(nf.label)}</span></div><div class="vs"><div>${crest(h, 30)}<div>${esc(h.name)}</div></div><b>vs</b><div>${crest(a, 30)}<div>${esc(a.name)}</div></div></div><div class="dim">상대 전력 ${Math.round(op.strength)} · 우리 ${Math.round(c.strength)}</div></div>`; }
  const inj = L.injured.length ? `<div class="card warn"><b>부상자 ${L.injured.length}명</b><div class="dim">${L.injured.slice(0, 6).map(p => esc(p.name) + '(' + p.inj + '일)').join(' · ')}</div></div>` : '';
  const news = G.news.filter(n => n.me).slice(0, 5).map(n => `<div class="li"><span class="dim">${Core.fmtDate(n.d).slice(5, 10)}</span> ${esc(n.text)}</div>`).join('') || '<div class="dim">아직 소식이 없습니다.</div>';
  const hist = g.seasons.length ? `<div class="sec">지난 시즌</div><div class="card">${g.seasons.slice(-5).reverse().map(s => `<div class="li">${esc(s.season)} · ${esc(s.club)} ${s.rank}위 <span class="tag ${s.ok ? '' : 'warn'}">${s.ok ? '목표 달성' : '미달'}</span></div>`).join('')}</div>` : '';
  return mgrTop() + `<div class="body">${board}${isW() ? '' : tourCard()}${nx}<div class="tiles">${tile('예산', g.cash + '억', '이적 자금')}${tile('전적', g.w + '-' + g.d + '-' + g.l, '승-무-패')}${tile('선수단', sq.length + '명', '16~30')}${tile('전력', Math.round(c.strength), '1부 평균 비교')}</div>${inj}
  <div class="sec">구단 소식 <span class="dim" data-act="tab" data-id="news" style="float:right">전체 ›</span></div><div class="card">${news}</div>${hist}</div>`;
}
function mgrSquadView() {
  const sq = Core.mgrSquad(), L = Core.mgrLineup(), xi = new Set(L.slots.map(e => e.p.id)), f = S.sqf || 'ALL';
  const list = sq.filter(p => f === 'ALL' || p.sub === f).sort((a, b) => b.ovr - a.ovr);
  const chips = `<div class="chips">${POSL.map(k => `<button class="chip ${f === k ? 'on' : ''}" data-act="sqf" data-id="${k}">${k === 'ALL' ? '전체' : k}</button>`).join('')}</div>`;
  const rows = list.map(p => `<div class="card sqr" data-act="pl" data-id="${p.id}"><span class="tag pos">${p.sub}</span><div class="grow"><b>${esc(p.name)}</b>${xi.has(p.id) ? ' <span class="tag">선발</span>' : ''}${p.inj > 0 ? ` <span class="tag warn">부상 ${p.inj}일</span>` : ''}${susTag(p)}<div class="dim">${p.age}세 · ${Core.NATK(p.nat)} · 계약 ${p.ct ? p.ct.until : '-'} · 가치 ${Core.mgrValue(p)}억</div></div><b class="ovr">${p.ovr}</b>${isW() ? '' : `<button class="btn sec sm" data-act="msell" data-id="${p.id}">${S.sellArm === p.id ? '확정?' : '매각'}</button>`}</div>`).join('');
  return mgrTop() + `<div class="body"><div class="row"><b>선수단 ${sq.length}명</b><span class="dim">${isW() ? '탭하면 능력치' : '탭하면 능력치 · 매각은 이적 시장 기간에만'}</span></div>${chips}${rows || '<div class="dim">선수가 없습니다.</div>'}</div>`;
}
function mgrTacView() {
  const L = Core.mgrLineup(), t = L.tactic, E = Core.Eng, G = G0();
  const forms = `<div class="chips w">${E.FORM_IDS.map(f => `<button class="chip ${t.formation === f ? 'on' : ''}" data-act="mform" data-id="${f}">${f}</button>`).join('')}</div>`;
  const ins = Object.keys(INSTR_L).map(k => `<div class="inrow"><span class="dim">${INSTR_L[k][0]}</span><div class="seg">${INSTR_L[k][1].map((n, v) => `<button class="${(t[k] == null ? 1 : t[k]) === v ? 'on' : ''}" data-act="minstr" data-k="${k}" data-id="${v}">${n}</button>`).join('')}</div></div>`).join('');
  const slots = L.slots.map((e, i) => { const rs = (E.SLOT_ROLES[e.slot] || []).map(id => `<option value="${id}" ${e.role === id ? 'selected' : ''}>${esc(roleNm(id))}</option>`).join('');
    return `<div class="card slotr ${S.msel === i ? 'on' : ''}"><span class="tag pos">${e.slot}</span><div class="grow" data-act="mslot" data-id="${i}"><b>${esc(e.p.name)}</b> <span class="dim">${e.p.sub} · ${e.p.ovr}${e.fam < 0.97 ? ' · <i style="color:#FFB27A;font-style:normal">낯선 포지션</i>' : ''}</span></div><select class="rsel" data-slot="${i}">${rs}</select></div>`; }).join('');
  let pick = '';
  if (S.msel != null && L.slots[S.msel]) { const sl = L.slots[S.msel], cand = L.bench.concat(L.slots.filter((e, i) => i !== S.msel).map(e => e.p)).sort((a, b) => ((b.sub === sl.slot) - (a.sub === sl.slot)) || (b.ovr - a.ovr));
    pick = `<div class="card gl"><b>${esc(sl.slot)} 자리에 넣을 선수</b><div class="dim">같은 포지션이 위에 나옵니다. 이미 선발인 선수를 고르면 서로 자리를 바꿉니다.</div>${cand.slice(0, 18).map(p => `<div class="sqr mini" data-act="mpick" data-id="${p.id}"><span class="tag pos">${p.sub}</span><div class="grow">${esc(p.name)}${L.slots.some(e => e.p.id === p.id) ? ' <span class="dim">(선발)</span>' : ''}</div><b>${p.ovr}</b></div>`).join('')}</div>`; }
  const bench = L.bench.slice(0, 10).map(p => `<div class="sqr mini" data-act="pl" data-id="${p.id}"><span class="tag pos">${p.sub}</span><div class="grow">${esc(p.name)}</div><b>${p.ovr}</b></div>`).join('');
  return mgrTop() + `<div class="body"><div class="sec">포메이션</div>${forms}<div class="sec">팀 지시</div><div class="card">${ins}</div><div class="row"><div class="sec" style="margin:0">선발 11명</div>${L.custom ? '<span class="tag">직접 선택한 선발</span>' : '<span class="tag warn">아직 직접 고르지 않음 · 추천 11명</span>'}</div><div class="dim">출전시킬 선수는 직접 고르세요: 선수 이름을 탭 → 아래 목록에서 넣을 선수를 탭하면 교체됩니다. 오른쪽에서 역할도 고를 수 있습니다.${L.custom ? '' : ' 바꾸지 않으면 컴퓨터가 고른 추천 11명이 출전합니다.'}</div>${L.custom ? '<button class="btn sec sm" data-act="mauto" style="margin-top:6px">추천 선발로 되돌리기</button>' : ''}${slots}${pick}<div class="sec">벤치 후보 <span class="dim">상위 ${Math.min(10, L.bench.length)}명</span></div><div class="card">${bench || '<div class="dim">후보가 없습니다.</div>'}</div></div>`;
}
function mgrMktView() {
  const g = G0().mgr, w = Core.mgrWin(), f = S.mkf || 'ALL';
  const list = Core.mgrMarket(f).slice(0, 40);
  const chips = `<div class="chips">${POSL.map(k => `<button class="chip ${f === k ? 'on' : ''}" data-act="mkf" data-id="${k}">${k === 'ALL' ? '전체' : k}</button>`).join('')}</div>`;
  const rows = list.map(o => `<div class="card sqr" data-act="pl" data-id="${o.p.id}"><span class="tag pos">${o.p.sub}</span><div class="grow"><b>${esc(o.p.name)}</b><div class="dim">${o.p.age}세 · ${esc(o.club)} · 계약 ${o.p.ct ? o.p.ct.until : '-'}</div></div><b class="ovr">${o.p.ovr}</b><button class="btn sm ${o.price > g.cash ? 'sec' : ''}" data-act="mbuy" data-id="${o.p.id}">${o.price}억</button></div>`).join('');
  return mgrTop() + `<div class="body"><div class="card"><div class="row"><b>이적 자금 ${g.cash}억 원</b><span class="tag ${w.open ? '' : 'warn'}">${w.open ? '시장 열림' : w.days + '일 뒤 개장'}</span></div><div class="dim">같은 리그 1부 구단 선수를 영입합니다. 선수단은 16~30명을 유지해야 합니다. 가치는 종합·나이로 정해집니다.</div></div>${chips}${rows || '<div class="dim">해당 포지션 선수가 없습니다.</div>'}</div>`;
}
function sackView() {
  const G = G0(), g = G.mgr, c = Core.clubOf(Core.me().club), jobs = Core.mgrJobs();
  return `<div class="top"><div class="ttl">경질</div></div><div class="body"><div class="card warn"><b>${esc(c.name)} 이사회가 ${esc(g.name)} 감독과 결별을 발표했습니다</b><div class="dim">성적 부진으로 이사회 신임을 잃었습니다. 다른 구단의 제안 중 하나를 골라 새로 시작하세요.</div></div>
  ${jobs.map(o => { const cl = Core.clubOf(o.id); return `<div class="card mclub" data-act="mjob" data-id="${o.id}"><div class="row g8">${crest(cl, 30)}<div class="grow"><b>${esc(o.name)}</b><div class="dim">${esc(o.tag)}</div></div><span class="tag">전력 ${o.strength}</span></div><div class="dim">목표: ${esc(o.goal)} · 예산 ${o.cash}억 원</div></div>`; }).join('') || '<div class="dim">제안이 없습니다.</div>'}</div>`;
}

// ----- 구단 탭: 팬·라이벌·재정·스태프·트로피장 -----
function trophySvg(col, sz) { return `<svg width="${sz||34}" height="${sz||34}" viewBox="0 0 12 12" shape-rendering="crispEdges"><g fill="${col}"><rect x="3" y="1" width="6" height="1"/><rect x="3" y="2" width="6" height="3"/><rect x="2" y="2" width="1" height="2"/><rect x="9" y="2" width="1" height="2"/><rect x="4" y="5" width="4" height="1"/><rect x="5" y="6" width="2" height="2"/><rect x="3" y="9" width="6" height="2"/></g><rect x="4" y="2" width="1" height="2" fill="#fff" opacity=".45"/></svg>`; }
function finSpark(log) {
  if (!log || log.length < 2) return '<div class="dim">월말 데이터가 쌓이면 예산 추이가 표시됩니다.</div>';
  const mx = Math.max(...log.map(x => x.cash)), mn = Math.min(...log.map(x => x.cash)), W = 300, H = 56, rg = Math.max(1, mx - mn);
  const pts = log.map((x, i) => `${(i / (log.length - 1) * W).toFixed(1)},${(H - 4 - (x.cash - mn) / rg * (H - 8)).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#C6F36B" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><div class="row dim"><span>${log[0].y}.${log[0].m}</span><span>${log[log.length - 1].y}.${log[log.length - 1].m}</span></div>`;
}
function mgrClubView() {
  const G = G0(), g = Core.mgrX(), m = Core.me(), c = Core.clubOf(m.club), rv = Core.rivalOf(c), rc = rv != null ? Core.clubOf(rv) : null, ft = Core.mgrFanText();
  const fb = (v, col) => `<div class="mbar"><i style="width:${Math.round(v)}%;background:${col}"></i></div>`;
  const fcol = g.fans >= 60 ? '#C6F36B' : g.fans >= 35 ? '#FFD46B' : '#FF7A6B', mcol = g.mood >= 60 ? '#C6F36B' : g.mood >= 35 ? '#FFD46B' : '#FF7A6B';
  const fans = `<div class="sec">팬 · 라커룸</div><div class="card"><div class="row"><b>팬 지지도</b><span class="dim">${Math.round(g.fans)} / 100</span></div>${fb(g.fans, fcol)}<div class="dim" style="margin:4px 0 8px">📣 ${esc(ft[0])} · ${esc(ft[1])}</div><div class="row"><b>선수단 분위기</b><span class="dim">${Math.round(g.mood)} / 100</span></div>${fb(g.mood, mcol)}<div class="dim">분위기가 좋으면 경기 컨디션이 올라갑니다 (기자회견 답변에 따라 변합니다)</div></div>`;
  const rivalCard = rc ? `<div class="card" data-act="club" data-id="${rc.id}"><div class="row"><b>🔥 영원한 라이벌</b><span class="dim">더비 ${g.derby.w}승 ${g.derby.d}무 ${g.derby.l}패</span></div><div class="row g8">${crest(rc, 28)}<div class="grow"><b>${esc(rc.name)}</b><div class="dim">전력 ${Math.round(rc.strength)} · 우리 ${Math.round(c.strength)}</div></div><span class="dim">›</span></div><div class="dim">라이벌전은 승패의 파장이 두 배! 이사회·팬 반응이 크게 달라집니다.</div></div>` : '';
  const wage = Core.mgrWage(), f = g.fin, inn = Math.max(0, f.tr);
  const row = (k, v) => `<div class="row"><span class="dim">${k}</span><b>${v >= 0 ? '+' : ''}${(Math.round(v * 10) / 10)}억</b></div>`;
  const fin = `<div class="sec">재정</div><div class="card"><div class="tiles">${tile('보유 예산', g.cash + '억', '이적·투자 자금')}${tile('주급 총액', won(wage).replace(' 원',''), '선수단 합계(참고)')}</div>${row('입장 수입', f.tk)}${row('선수 주급 지출', f.wg || 0)}${row('스폰서·상품', f.sp + f.mc)}${row('분배금·성적 보너스', f.pz)}${row('선수 판매', inn)}${row('선수 영입', Math.min(0, f.tr))}${row('스태프 투자', f.st)}<div style="margin-top:8px">${finSpark(f.log)}</div></div>`;
  Core.mgrSponsorGen();
  const spRows = Object.keys(Core.SP_SLOT).map(sl => { const c = g.spons[sl], nm = Core.SP_SLOT[sl][0];
    if (c) return `<div class="spc"><div class="row"><b>${nm}</b><span class="tag">${c.left}년 남음</span></div><div class="row"><span>💼 ${esc(c.brand)}</span><b>연 ${c.yearly}억</b></div><div class="dim">${c.rank}위 이내 달성 시 보너스 ${c.bonus}억</div></div>`;
    const offs = (g.spOff && g.spOff[sl]) || [];
    return `<div class="spc"><div class="row"><b>${nm}</b><span class="tag warn">공석</span></div>${offs.map((o, i) => `<div class="row g8" style="padding:4px 0"><div class="grow"><b>${esc(o.brand)}</b><div class="dim">연 ${o.yearly}억 · ${o.years}년 · ${o.rank}위 이내 +${o.bonus}억</div></div><button class="btn sm" data-act="msponsor" data-id="${sl}:${i}">계약</button></div>`).join('')}</div>`; }).join('');
  const spons = `<div class="sec">💼 스폰서 계약</div><div class="card">${spRows}<div class="dim">스폰서 수입은 매월 정산되고, 주급 지출은 매월 빠져나갑니다. 예산이 0 미만이면 이사회 신임이 떨어집니다.</div></div>`;
  const stf = `<div class="sec">스태프 투자</div><div class="card">${Object.keys(Core.STAFF).map(k => { const S0 = Core.STAFF[k], lv = g.staff[k] || 0, cost = Core.mgrStaffCost(lv); return `<div class="stf"><span class="ic">${S0.ic}</span><div class="grow"><b>${S0.n}</b> <span class="dots">${'●'.repeat(lv)}${'○'.repeat(5 - lv)}</span><div class="dim">${S0.d}</div></div>${lv >= 5 ? '<span class="tag">MAX</span>' : `<button class="btn sm ${g.cash >= cost ? '' : 'sec'}" data-act="mstaff" data-id="${k}">${cost}억</button>`}</div>`; }).join('')}</div>`;
  const tr = g.trophies || [];
  const shelf = tr.length ? `<div class="shelf">${tr.slice().reverse().map(t => `<div class="trp">${trophySvg('#FFD54A', 38)}<b>${esc(t.name)}</b><span class="dim">${esc(t.season)}</span></div>`).join('')}</div>` : `<div class="dim" style="padding:8px 0">아직 트로피가 없습니다. 첫 우승을 노려 보세요!</div>`;
  const hall = `<div class="sec">🏆 트로피장 <span class="dim">${tr.length}개</span></div><div class="card">${shelf}</div>`;
  const fac = `<div class="sec">🏗️ 시설 투자</div><div class="card">${Object.keys(Core.FAC).map(k => { const F = Core.FAC[k], lv = Core.facLv(k), cost = Core.facCost(lv); return `<div class="stf"><span class="ic">${F.ic}</span><div class="grow"><b>${F.n}</b> <span class="tag">Lv.${lv}/5</span><div class="dim">${esc(F.d)}</div></div>${lv >= 5 ? '<span class="tag">최고</span>' : `<button class="btn sm ${g.cash >= cost ? '' : 'sec'}" data-act="facup" data-id="${k}">${cost}억</button>`}</div>`; }).join('')}<div class="dim">시설은 한 번 지으면 계속 효과가 납니다. 남는 예산을 쓰기 좋은 곳입니다.</div></div>`;
  return mgrTop() + `<div class="body">${fans}${rivalCard}${hall}${fac}${spons}${fin}${stf}</div>`;
}
function pressModal() {
  const g = Core.mgrX(), pr = g.press; if (!pr) return '';
  if (pr.done) { const d = pr.done, chip = (l, v) => v ? `<span class="tag ${v < 0 ? 'warn' : ''}">${l} ${v > 0 ? '+' : ''}${Math.round(v * 10) / 10}</span>` : ''; return `<div class="ttl">🎙️ 기자회견</div><div class="card"><div>${esc(d.text)}</div><div class="row g8" style="margin-top:8px;flex-wrap:wrap">${chip('이사회', d.b)}${chip('팬', d.f)}${chip('분위기', d.mo)}</div></div><button class="btn wide" data-act="${pr.pre ? 'mpre' : 'close'}">${pr.pre ? '경기 준비로' : '확인'}</button>`; }
  return `<div class="ttl">🎙️ 기자회견</div><div class="card"><b>${esc(pr.q)}</b></div>${pr.opts.map(o => `<button class="btn sec wide" data-act="mpress" data-id="${o.id}">${esc(o.t)}</button>`).join('')}<button class="btn sec wide" data-act="close" style="opacity:.7">답변하지 않는다</button>`;
}
function mgrPre() {                                                         // 경기 전 모달
  const G = G0(), pm = G.pendingMine; if (!pm) return; if (pm.ctx.t === 'wc' && pm.ctx.g === undefined && !S.koWarn) { } const m = Core.me(), h = Core.clubOf(pm.h), a = Core.clubOf(pm.a), mine = Core.clubOf(m.club), L = Core.mgrLineup();
  const t = mine.tactic, op = pm.h === m.club ? a : h;
  const rows = L.slots.map(e => `<div class="sqr mini"><span class="tag pos">${e.slot}</span><div class="grow">${esc(e.p.name)} <span class="dim">${esc(roleNm(e.role))}</span></div><b>${e.p.ovr}</b></div>`).join('');
  S.modalKind = 'pre'; S.modal = `<div class="ttl">경기 준비</div><div class="dim">${esc(matchTitleUI(pm.ctx))}</div><div class="vs"><div>${crest(h, 34)}<div>${esc(h.name)}</div></div><b>vs</b><div>${crest(a, 34)}<div>${esc(a.name)}</div></div></div>${(!G.wc && (Core.rivalOf(mine) === op.id || Core.rivalOf(op) === mine.id)) ? '<div class="tag warn" style="align-self:center">🔥 라이벌전 — 승패의 파장이 두 배!</div>' : ''}<div class="dim" style="text-align:center">상대 전력 ${Math.round(op.strength)} · 우리 ${Math.round(mine.strength)} · ${esc(t.formation)}</div>
  ${L.injured.length ? `<div class="dim">부상: ${L.injured.slice(0, 5).map(p => esc(p.name)).join(', ')}</div>` : ''}<div class="sec">선발 라인업</div><div class="card">${rows}</div>
  <div class="row g8" style="flex-wrap:wrap"><button class="btn grow" data-act="mwatch">관전 모드 ⚽</button><button class="btn sec grow" data-act="msum">요약 모드 ⏩</button></div><button class="btn sec wide" data-act="mtacgo">전술 수정하러 가기</button>${(!G.wc && Core.mgrX().preDay !== G.day) ? '<button class="btn sec wide" data-act="mprepress">🎙️ 경기 전 기자회견</button>' : ''}`;
}
function playPre() {                                                        // 육성 모드 경기 준비 화면(감독 모드의 경기 준비와 같은 구성)
  const G = G0(), pm = G.pendingMine; if (!pm) return; const m = Core.me(), h = Core.clubOf(pm.h), a = Core.clubOf(pm.a), mine = Core.clubOf(m.club), op = pm.h === m.club ? a : h;
  S.modalKind = 'pre'; S.modal = `<div class="ttl">경기 준비</div><div class="dim">${esc(matchTitleUI(pm.ctx))}</div><div class="vs"><div>${crest(h, 34)}<div>${esc(h.name)}</div></div><b>vs</b><div>${crest(a, 34)}<div>${esc(a.name)}</div></div></div>${(Core.rivalOf(mine) === op.id || Core.rivalOf(op) === mine.id) ? '<div class="tag warn" style="align-self:center">🔥 라이벌전</div>' : ''}<div class="dim" style="text-align:center">상대 전력 ${Math.round(op.strength)} · 우리 ${Math.round(mine.strength)} · 내 포지션 ${esc(m.sub)} · OVR ${m.ovr}</div><div class="dim" style="text-align:center">출전 여부와 투입 시간은 경기 시작 때 정해집니다.</div><div class="row g8" style="flex-wrap:wrap"><button class="btn grow" data-act="pwatch">관전 모드 ⚽</button><button class="btn sec grow" data-act="psum">요약 모드 ⏩</button></div>`;
}
function playerPanelHTML(M) {                                               // 선수(육성) 모드의 전술·교체 창 — 보기 전용
  const t = M.mine.tactic || {}, sq = (M.mineHome ? M.sqH : M.sqA) || [], on = new Set(MV.mst.map(p => p.id));
  const bench = sq.filter(p => !on.has(p.id)).sort((x, y) => y.ovr - x.ovr);
  const row = p => `<div class="sqr mini ${p.me ? 'on' : ''}"><span class="tag pos">${p.sub}</span><div class="grow">${esc(p.name)}${p.me ? ' <span class="tag">나</span>' : ''}</div><b>${p.ovr}</b></div>`;
  return `<div class="card gl"><b>전술·교체</b><div class="dim">경기 일시정지 중 · 보기 전용 — 선수는 감독의 전술과 교체 지시를 따릅니다</div></div><div class="sec">팀 전술</div><div class="card"><div class="li">포메이션 <b>${esc(t.formation || '-')}</b></div></div><div class="sec">그라운드</div><div class="card">${MV.mst.map(row).join('')}</div><div class="sec">벤치</div><div class="card">${bench.map(row).join('') || '<div class="dim">벤치 선수가 없습니다.</div>'}</div>`;
}
function matchTitleUI(ctx) { try { return compLabel(ctx); } catch (e) { return '경기'; } }
// ----- 경기 중 감독 패널 -----
const SEG = [15, 30, 45, 60, 75];
function segNext(min) { return SEG.find(s => s > min) || null; }
function segTick(M) {                                                                         // 15분 구간: 감독 모드에서 남은 시간 결과를 현재 전술·상황으로 다시 계산
  if (!M || M.role !== 'mgr' || !SEG.includes(MV.min)) return; try { if (!Core.mgrSegment(MV.min)) return; } catch (e) { return; }
  if (M.segDirty) { M.segDirty = false; MV.log.unshift({ min: MV.min, ic: '⏱️', cls: '', t: `<b>${MV.min}분 구간</b> 새 전술·교체가 경기 결과에 반영되기 시작합니다` }); if (!MV.hlFast) lbl('전술 반영'); }
}
function mgrPanelHTML(M) {
  const t = M.mine.tactic, left = 5 - (M.mgrSubs || 0), nxt = segNext(MV.min);
  const ins = Object.keys(INSTR_L).map(k => `<div class="inrow"><span class="dim">${INSTR_L[k][0]}</span><div class="seg">${INSTR_L[k][1].map((n, v) => `<button class="${(t[k] == null ? 1 : t[k]) === v ? 'on' : ''}" data-act="mpinstr" data-k="${k}" data-id="${v}">${n}</button>`).join('')}</div></div>`).join('');
  const yc = new Set(), rc = new Set(); (M.evx || []).forEach(x => { if (x.shown && x.p) { if (x.t === 'yc') yc.add(x.p.id); if (x.t === 'rc') rc.add(x.p.id); } });
  const tir = p => MV.min >= 55 && PA(p, 'STA') < 58 ? ' <span class="dim">⚡피로</span>' : '', yel = p => yc.has(p.id) ? ' 🟨' : '';
  const st = MV.mst.filter(p => !rc.has(p.id)).map(p => `<div class="sqr mini ${S.mpout === p.id ? 'on' : ''}" data-act="mpout" data-id="${p.id}"><span class="tag pos">${p.sub}</span><div class="grow">${esc(p.name)}${yel(p)}${tir(p)}</div><b>${p.ovr}</b></div>`).join('');
  const bn = (M.benchMine || []).slice().sort((a, b) => b.ovr - a.ovr).map(p => `<div class="sqr mini" data-act="mpin" data-id="${p.id}"><span class="tag pos">${p.sub}</span><div class="grow">${esc(p.name)}</div><b>${p.ovr}</b></div>`).join('');
  return `<div class="card gl"><b>전술·교체</b><div class="dim">경기 일시정지 중 · 교체 ${left}회 남음 · 전술·교체는 15분 구간마다 결과에 반영됩니다${nxt ? ` (다음 반영 ${nxt}분)` : ' · 남은 구간이 없어 효과가 없습니다'}</div></div><div class="sec">팀 지시</div><div class="card">${ins}</div>
  <div class="sec">교체 <span class="dim">나갈 선수 → 들어올 선수 순서로 탭</span></div><div class="card"><div class="dim">그라운드</div>${st}</div><div class="card"><div class="dim">벤치</div>${bn || '<div class="dim">벤치 선수가 없습니다.</div>'}</div>`;
}
function mgrPanelOpen() {
  if (!MV || MV.over || !G0().mm || MV.mgrPanel) return;
  if (MV.pg || MV.lead || MV.sp || MV.momentOpen || MV.pen || MV.so || MV.cele) { MV.wantPanel = true; toast('장면이 끝나면 바로 열립니다'); return; }      // 연출 중이면 예약해 두었다가 끝나는 즉시 연다
  MV.wantPanel = false;
  MV.mgrPanel = true; MV.mgrPrev = MV.paused; MV.paused = true; MV.mgrDirty = false; S.mpout = null; PX.ui.render();
}
function mgrPanelClose() {
  if (!MV || !MV.mgrPanel) return; const M = G0().mm;
  if (MV.mgrDirty && M) { if (MV.fxy) MV.fxy.m = fpos(MV.mst, (M.mine.tactic && M.mine.tactic.formation) || '4-4-2'); MV.tk.m = tkOf(M.mine); M.segDirty = true; const nx = segNext(MV.min); MV.log.unshift({ min: MV.min, ic: '📋', cls: '', t: `<b>감독 지시</b> 전술을 조정했습니다${nx ? ` <span class="dim">· ${nx}분 구간부터 결과에 반영</span>` : ''}` }); }
  MV.mgrPanel = false; MV.mgrDirty = false;
  // 창을 열기 전에 멈춰 있던 이유가 '하프타임 휴식'이거나 장면 선택·연출(득점·세트피스 등)이면 그 흐름을 이어 가고, 배너 연출용 일시정지였다면 풀어 준다(예전엔 그대로 멈춰 버렸음)
  { const hold = !!MV.regWalk || !!MV.talk || !!MV.momentOpen || !!MV.pen || !!MV.so || !!MV.lead || !!MV.pg || !!MV.sp; MV.paused = hold; if (!hold) { laterClear(MV.fxP); } MV.pzUntil = nowR() + 12000; }
  PX.ui.render();
}
function mgrSubUI(outId, inId) {
  const M = G0().mm, r = Core.mgrSub(outId, inId, MV.min); if (r) M.segDirty = true; if (!r) { toast('교체할 수 없습니다 (5회 한도)'); return; }
  const i = MV.mst.findIndex(p => p.id === outId); if (i >= 0) MV.mst[i] = r.inn;
  MV.mgrDirty = true; MV.log.unshift({ min: MV.min, ic: IC.swap, cls: '', t: `교체 — ${esc(r.inn.name)} IN / ${esc(r.out.name)} OUT` });
  const pb = $('#pitchbox'); if (pb) { pb.innerHTML = pitchHTML(M); MV.els = null; MV.refEl = null; } S.mpout = null; PX.ui.render();
}

const NAV = [['home','홈'],['me','내 선수'],['ctr','이적'],['league','순위·대회'],['news','뉴스']];
function navBadge(id) { try { const m = Core.me(); if (id==='home') return m.meet ? '●' : ''; if (id==='ctr') return (m.offers.length || m.pending || m.renewal) ? '●' : ''; } catch (e) {} return ''; }
function seasonCardModal() {                                                                  // 시즌 결산 카드
  const s = G0().seasonCard, tile2 = (k, v, sub) => `<div class="tile"><div class="dim">${k}</div><div class="big">${v}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
  const head = `<div style="text-align:center"><div class="dim">${esc(s.lg)} · ${esc(s.season)} 시즌 결산</div><div class="ttl">${esc(s.club)} ${s.rank}위 <span class="dim">/ ${s.n}팀</span></div></div>`;
  let body;
  if (s.mgr) body = `<div class="tiles">${tile2('성적', `${s.w}-${s.d}-${s.l}`, '승-무-패')}${tile2('득실', `${s.gf}:${s.ga}`, '')}${tile2('승점', s.pts, '')}${tile2('목표', s.rank <= s.target ? '달성 ✅' : '미달 ❌', `${s.target}위 이내`)}</div><div class="card">${s.troph.length ? `<div class="li">🏆 ${s.troph.map(esc).join(', ')}</div>` : ''}${s.top ? `<div class="li">⚽ 팀 득점왕 ${esc(s.top[0])} ${s.top[1]}골</div>` : ''}<div class="li">이사회 신임 ${s.board} · 팬 지지도 ${s.fans}</div>${(s.aw || []).length ? `<div class="li">🎖️ ${s.aw.map(esc).join(' · ')}</div>` : ''}</div>`;
  else body = `<div class="tiles">${tile2('출전', s.a, `선발 ${s.s}`)}${tile2('골', s.g, '')}${tile2('도움', s.as, '')}${tile2('평점', s.rt || '-', '')}</div><div class="card"><div class="li">📈 종합 ${s.ovr0} → <b>${s.ovr}</b> (${s.ovr - s.ovr0 >= 0 ? '+' : ''}${s.ovr - s.ovr0}) · 인지도 ${s.fame}</div>${s.cupA ? `<div class="li">🏆 컵·대륙 대회 ${s.cupA}경기 ${s.cupG}골</div>` : ''}${s.ntA ? `<div class="li">🛡️ 대표팀 통산 ${s.ntA}경기</div>` : ''}${(s.aw || []).length ? `<div class="li">🎖️ ${s.aw.map(esc).join(' · ')}</div>` : '<div class="li dim">이번 시즌 개인 수상은 없습니다.</div>'}</div>`;
  return `<div class="cerbox" style="text-align:left">${head}${body}<div class="dim" style="text-align:center;margin:6px 0">화면을 캡처해 공유해 보세요 📸</div><button class="btn wide" data-act="close">다음 시즌으로</button></div>`;
}
function awardModal() {                                                                     // 시즌 시상식
  const G = G0(), A = G.awardPop, aw = A.aw, cl = (id) => { const c = Core.clubOf(id); return c ? esc(c.name) : ''; };
  const one = (ic, t, r, v) => r ? `<div class="li"><span class="tag">${ic} ${t}</span> <b>${esc(r[0])}</b> <span class="dim">${cl(r[1])} · ${v}</span></div>` : '';
  const POSN = { GK: 'GK', CB: 'CB', FB: 'FB', DM: 'DM', CM: 'CM', AM: 'AM', W: 'W', ST: 'ST' }, me = Core.me();
  const b11 = aw.b11.map(r => `<div class="li ${r[3] === me.id || (Core.isMgr && Core.isMgr() && r[1] === me.club) ? 'hl' : ''}"><span class="tag pos">${POSN[r[4]] || r[4]}</span> ${esc(r[0])} <span class="dim">${cl(r[1])} · 평점 ${r[2]}</span></div>`).join('');
  const win = A.wins && A.wins.length ? `<div class="card gl"><b>🎉 ${A.wins.map(esc).join(' · ')}</b></div>` : '';
  return `<div class="cerbox" style="text-align:left"><div style="text-align:center">${trophySvg('#FFD54A', 70)}<div class="ttl">${esc(A.lgName)} ${esc(aw.season)} 시상식</div></div>${win}<div class="card">${one('👑', 'MVP', aw.mvp, aw.mvp ? '평점 ' + aw.mvp[2] : '')}${one('⚽', '득점왕', aw.top, aw.top ? aw.top[2] + '골' : '')}${one('🅰', '도움왕', aw.ast, aw.ast ? aw.ast[2] + '도움' : '')}${one('🌱', '영플레이어', aw.young, aw.young ? '평점 ' + aw.young[2] : '')}</div><div class="sec">베스트11 (4-3-3)</div><div class="card">${b11 || '<div class="dim">기준 출전 수를 채운 선수가 부족합니다.</div>'}</div><button class="btn wide" data-act="close">확인</button></div>`;
}
function hallView() {                                                                       // 명예의 전당
  const L = Core.hallList().slice(0, 40), POS = Core.POS_KO || {};
  if (!L.length) return '<div class="card dim">아직 은퇴한 선수가 없습니다. 시즌이 지나면 은퇴한 선수들의 통산 기록이 이곳에 남습니다.</div>';
  return `<div class="dim" style="margin:4px 2px 8px">은퇴 선수 통산 기록 · 최고 능력치·출전·득점·수상으로 순위를 매깁니다</div>${L.map((h, i) => `<div class="card ${h.me ? 'gl' : ''}"><div class="row g8"><span class="tag">${i + 1}</span><div class="grow"><b>${esc(h.name)}</b>${h.me ? ' <span class="tag">나</span>' : ''} <span class="dim">${h.sub ? (POS[h.sub] || h.sub) : ''}${h.nat ? ' · ' + (Core.FLAG[h.nat] || '') : ''}${h.yr ? ' · ' + h.yr + '년 은퇴' : ''}</span><div class="dim">${h.a || 0}경기 ${h.g || 0}골 ${h.as || 0}도움${h.rt ? ' · 평균 평점 ' + h.rt : ''}${h.peak ? ' · 최고 ' + h.peak : ''}${h.aw ? ' · 수상 ' + h.aw + '회' : ''}</div><div class="dim s11">${(h.clubs || []).map(id => { const c = Core.clubOf(id); return c ? esc(c.name) : ''; }).filter(Boolean).join(' → ')}</div></div></div></div>`).join('')}`;
}
function retireView() {                                                                     // 은퇴 후 진로 선택
  const m = Core.me(), cr = Core.careerOf(m), offers = Core.retireOffers();
  return `<div class="top"><div class="ttl">현역 은퇴</div></div><div class="body"><div class="card gl"><b>${esc(m.name)} 선수, 그동안 수고 많으셨습니다</b><div class="dim">통산 ${cr.a}경기 ${cr.g}골 ${cr.as}도움${cr.rt ? ' · 평균 평점 ' + cr.rt : ''}${(m.awards || []).length ? ' · 수상 ' + m.awards.length + '회' : ''}</div><div class="dim">명예의 전당에 이름이 올랐습니다.</div>${m.legend ? `<div class="li">🏛️ <b>${esc(m.legend.clubName)}</b>, 등번호 <b>${m.legend.no}번 영구결번</b> — 구단 통산 ${m.legend.a}경기 ${m.legend.g}골</div><div class="li dim">🎉 은퇴 경기에 만원 관중이 모여 기립박수를 보냈습니다.</div>` : '<div class="li dim">🎉 마지막 경기 후 동료들이 헹가래를 쳐 주었습니다.</div>'}</div>
  <div class="sec">감독으로 이어하기</div><div class="dim" style="margin:0 2px 6px">같은 세계에서 감독으로 새 커리어를 시작합니다. 지금까지의 기록·리그·선수들은 그대로 이어집니다. 선수 시절 명성 ${Math.round(m.fame || 0)}${(m.fame || 0) < 35 ? ' — 명성이 낮아 강호 구단의 제안은 오지 않았습니다.' : (m.fame || 0) >= 60 ? ' — 스타 출신이라 강호 구단도 관심을 보입니다.' : ''}</div>
  ${offers.map(o => { const cl = Core.clubOf(o.id); return `<div class="card mclub" data-act="rtmgr" data-id="${o.id}"><div class="row g8">${crest(cl, 30)}<div class="grow"><b>${esc(o.name)}</b><div class="dim">${esc(o.tag)}</div></div><span class="tag">전력 ${o.strength}</span></div><div class="dim">목표: ${esc(o.goal)} · 예산 ${o.cash}억 원</div></div>`; }).join('') || '<div class="dim">제안이 없습니다.</div>'}
  <div class="sec">명예의 전당</div>${hallView()}</div>`;
}
function cerModal() {
  const G = G0(), cr = G.cer, c = Core.clubOf(cr.cid);
  const pl = c.pl.map(x => G.players[x]).filter(p => p && !p.mgr && !p.retired).sort((a, b) => b.ovr - a.ovr).slice(0, 5);
  const sp = pl.map(p => `<span class="spr" style="width:40px;height:85px;background-image:url(${sprite(lookOf(p), p.sub === 'GK' ? gkKitFor(c) : [c.col, c.col2])})"></span>`).join('');
  const cols = ['#C6F36B', '#FFD54A', '#FF7A6B', '#6BC8FF', '#FFFFFF'];
  const conf = Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:${cols[i % 5]};animation-delay:${((i * 13) % 20) / 10}s;animation-duration:${2.2 + (i % 5) * 0.35}s"></i>`).join('');
  const btns = cr.mgr ? `<button class="btn wide" data-act="cerpress">🎙️ 우승 기자회견</button><button class="btn sec wide" data-act="close">닫기</button>` : `<button class="btn wide" data-act="close">확인</button>`;
  return `<div class="cerbox"><div class="confetti">${conf}</div><div>${trophySvg('#FFD54A', 96)}</div><div class="dim">우승 세리머니</div><div class="ttl" style="margin-top:2px">${esc(cr.club)}</div><div class="cername">${esc(cr.name)}</div><div class="dim">${esc(cr.season)}</div><div class="cerrow">${sp}</div>${btns}</div>`;
}
function render() {
  const app = $('#app');
  try { const g = G0(); if (g && S.step === 'game') Core.normStats(Core.me()); } catch (e) {}
  try { if (S.welcome && S.step === 'game' && !S.busy && !S.matchOpen) { const w = S.welcome; S.welcome = null; setTimeout(() => popup('게임 시작!', w==='start' ? '선수 육성 모드가 시작되었습니다.\n아래 ‘진행’ 버튼으로 하루씩 보내며 훈련하고, 경기 일정에 맞춰 컨디션을 관리하세요.' : w==='mstart' ? '감독 모드가 시작되었습니다.\n구단 탭에서 스폰서·스태프를, 전술 탭에서 포메이션을 먼저 살펴보세요.' : '월드컵 모드가 시작되었습니다.\n조별리그를 통과해 결승 트로피를 노려보세요!', '🎉'), 250); } } catch (e) {}
  try { const g0 = G0(); if (g0 && g0.cer && !S.modal && !S.matchOpen && !S.busy && S.step === 'game') { S.modalKind = 'cer'; S.modal = cerModal(); PX.ui.sfx('trophy'); } } catch (e) {}
  try { const g0 = G0(); if (g0 && !g0.cer && !g0.awardPop && g0.seasonCard && !S.modal && !S.matchOpen && !S.busy && S.step === 'game') { S.modalKind = 'sc'; S.modal = seasonCardModal(); } } catch (e) { try { G0().seasonCard = null; } catch (e2) {} }
  try { const g0 = G0(); if (g0 && !g0.cer && g0.awardPop && !S.modal && !S.matchOpen && !S.busy && S.step === 'game') { S.modalKind = 'aw'; S.modal = awardModal(); PX.ui.sfx('trophy'); } } catch (e) { try { G0().awardPop = null; } catch (e2) {} }
  if (S.step==='setup' || S.step==='create' || S.step==='mode' || S.step==='mcreate' || S.step==='wcsel' || S.step==='wcsquad') {
    const o0 = document.querySelector('.scr'); const k0 = S.step + '|' + (S.step==='setup' ? (S.sel ? 'x' : '') : '') ; const t0 = (o0 && S._sk === k0) ? o0.scrollTop : 0;
    app.innerHTML = `<div class="scr">${S.step==='wcsquad' ? wcSquadView() : S.step==='mode' ? modeView() : S.step==='mcreate' ? mcreateView() : S.step==='wcsel' ? wcselView() : S.step==='setup' ? setupView() : creatorView()}</div>`;
    const n0 = document.querySelector('.scr'); if (n0 && t0) n0.scrollTop = t0; S._sk = k0; S.modal = null; S.modalKind = null; $('#modal').style.display = 'none'; return;
  }
  const oldSc = document.querySelector('.scr'); const keyNow = S.step + '|' + S.tab; const keepTop = (oldSc && S._sk === keyNow) ? oldSc.scrollTop : 0;
  const MG = isM();
  if (!MG && G0().meRetired) { app.innerHTML = `<div class="scr">${retireView()}</div>`; $('#modal').style.display = S.modal ? 'block' : 'none'; return; }
  if (MG && !isW() && G0().mgr.sacked && !G0().pendingMine) { app.innerHTML = `<div class="scr">${sackView()}</div>`; $('#modal').style.display = S.modal ? 'block' : 'none'; return; }
  let v; try { v = MG ? (S.tab==='home' ? (isW() ? wcHomeView() : mgrHomeView()) : S.tab==='wcg' ? wcView() : S.tab==='squad' ? mgrSquadView() : S.tab==='mtac' ? mgrTacView() : S.tab==='mkt' ? mgrMktView() : S.tab==='mclub' ? mgrClubView() : S.tab==='news' ? newsView() : leagueView()) : S.tab==='home' ? homeView() : S.tab==='news' ? newsView() : S.tab==='league' ? leagueView() : S.tab==='me' ? meView() : contractView(); }
  catch (err) { v = `<div class="card"><b>화면 오류</b><div class="dim">${esc(String(err && err.message || err))}</div><div class="dim">이 글자를 화면 캡처해서 알려주세요.</div><button class="btn sec" data-act="tab" data-id="home">홈으로</button></div>`; try { console.error(err); } catch (e2) {} }
  app.innerHTML = `<div class="scr">${v}</div>${actBar()}<nav>${(MG ? (isW() ? WNAV : MNAV) : NAV).map(([id,n])=>`<button class="nv ${S.tab===id?'on':''}" data-act="tab" data-id="${id}">${n}${(!MG && navBadge(id))?'<i class="bdg"></i>':''}</button>`).join('')}</nav>`;
  { const ns = document.querySelector('.scr'); if (ns && keepTop) ns.scrollTop = keepTop; S._sk = keyNow; }
  if (S.tab!=='home') S.trfx = null; else animBars();
  if (S.modalKind==='settings') S.modal = settingsModal();
  const oldSh = document.querySelector('#modal .sheet'); const shTop = (oldSh && $('#modal').style.display === 'block' && S._mk === (S.modalKind || 'm')) ? oldSh.scrollTop : 0;
  S._mk = S.modalKind || 'm';
  if (S.modal) { $('#modal').innerHTML = `<div class="sheet"><button class="x" data-act="close">닫기</button>${S.modal}</div>`; $('#modal').style.display = 'block'; const nsh = document.querySelector('#modal .sheet'); if (nsh && shTop) nsh.scrollTop = shTop; } else $('#modal').style.display = 'none';
}
function pop(o) {
  let el = $('#pop'); if (!el) { el = document.createElement('div'); el.id = 'pop'; ($('#toast') ? $('#toast').parentNode : document.body).appendChild(el); }
  clearTimeout(pop.t); const btns = o.btns && o.btns.length ? o.btns : [{ t: '확인' }];
  el.innerHTML = `<div class="popbox"><div class="popic">${o.icon || 'ℹ️'}</div><div class="popt">${esc(o.title || '')}</div><div class="popm">${esc(o.msg || '').replace(/\n/g, '<br>')}</div><div class="popb">${btns.map((b, i) => `<button class="btn ${b.cls || ''}" data-pi="${i}" style="flex:1">${esc(b.t)}</button>`).join('')}</div></div>`;
  el.style.display = 'flex';
  const close = () => { clearTimeout(pop.t); el.style.display = 'none'; el.innerHTML = ''; };
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', (ev) => { ev.stopPropagation(); const f = btns[+b.dataset.pi].fn; close(); if (f) f(); }));
  if (o.auto) pop.t = setTimeout(close, o.auto);
}
function popup(title, msg, icon, auto) { pop({ title, msg, icon, auto }); }
function ask(title, msg, okText, fn, icon) { pop({ title, msg, icon: icon || '❓', btns: [{ t: '취소', cls: 'sec' }, { t: okText || '확인', fn }] }); }
let toastT = 0;
function toast(t, ms) { const el = $('#toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => el.style.opacity = 0, ms || 2200); }
function actBar() {
  if (isM()) { const G = G0(); let ev = null; try { ev = Core.nextEvent(); } catch (e) {} const mt = ev && ev.match; const dd = (n) => n <= 0 ? '오늘' : n === 1 ? '내일' : n + '일 뒤'; const info = G.pendingMine ? '오늘은 경기일입니다' : mt ? `다음 경기 · ${dd(mt.days)} ${mt.home ? 'vs' : '@'} ${esc(mt.opp)}` : '예정된 경기가 없습니다'; const go = G.pendingMine ? '경기 준비 ⚽' : (mt && mt.days === 1 ? '경기 시작 ⚽' : '계속 ▶');
    const open = S.skipOpen ? `<div class="skiprow"><button class="chip" data-act="skip" data-id="7">일주일</button><button class="chip" data-act="skip" data-id="30">한 달</button><button class="chip" data-act="skip" data-id="200">다음 경기까지</button></div>` : '';
    return `<div class="act"><div class="actinfo">${info}</div>${open}<div class="actrow"><button class="btn big" data-act="go">${go}</button><button class="btn sec skp ${S.skipOpen?'on':''}" data-act="skipm" aria-label="건너뛰기 메뉴">⏩</button></div></div>`; }
  let ev = null; try { ev = Core.nextEvent(); } catch (e) {} const mt = ev && ev.match, mv = ev && ev.move, m = Core.me();
  const dd = (n) => n <= 0 ? '오늘' : n === 1 ? '내일' : n + '일 뒤';
  const md = (day) => { const t = Core.dateOf(day); return `${t.m}/${t.d}`; };
  const resume = !!G0().pendingMine;
  const info = resume ? '중단한 경기가 있습니다 · 처음부터 다시 진행' : m.meet ? '감독 면담 요청이 있습니다' : m.offers.length ? `이적 제안 ${m.offers.length}건 — 확인하세요` : mt ? `다음 경기 · ${dd(mt.days)} (${md(mt.day)}) ${mt.home ? 'vs' : '@'} ${esc(mt.opp)}` : mv ? `${esc(mv.club)} 합류 ${dd(mv.days)}` : '예정된 경기가 없습니다';
  const sub = mv && mt && mv.days < mt.days ? ` · ${esc(mv.club)} 합류 ${dd(mv.days)}` : '';
  const go = resume || (mt && mt.days === 1 && !m.meet && !m.offers.length) ? '경기 시작 ⚽' : '계속 ▶';
  const open = S.skipOpen ? `<div class="skiprow"><button class="chip" data-act="skip" data-id="7">일주일</button><button class="chip" data-act="skip" data-id="30">한 달</button><button class="chip" data-act="skip" data-id="200">다음 경기까지</button></div>` : '';
  return `<div class="act"><div class="actinfo">${info}${sub}</div>${open}<div class="actrow"><button class="btn big" data-act="go">${go}</button><button class="btn sec skp ${S.skipOpen?'on':''}" data-act="skipm" aria-label="건너뛰기 메뉴">⏩</button></div></div>`;
}
function advance(days) {
  let stopped = null;
  try { if (!isM() && G0().pendingMine && !G0().mm && !S.matchOpen) { startMatch(); return; } } catch (e) {}     // 경기 도중 나갔던 경기: 하루를 넘기지 않고 그 경기를 처음부터 다시 시작
  if (isM()) { let st = null; for (let i = 0; i < days; i++) { const pm = Core.step(); if (pm) { st = 'match'; break; } if (G0().mgr.sacked) break; } save(); render(); if (st === 'match') setTimeout(startMatch, 50); return; }
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
const LOAD_TIPS = ['선호 플레이를 잘 고르면 경기 중 선택지 성공률이 올라갑니다', '휴식 없이 훈련만 하면 피로가 쌓여 부상 확률이 올라갑니다', '경기 중 내 차례가 오면 ★ 표시된 선호 플레이를 노려 보세요', '성격(트레이트)에 따라 성장 속도와 감독 신뢰가 달라집니다', '나이가 어릴수록 훈련 효과가 큽니다. 잠재력을 확인하세요', '이적 제안은 출전 기회와 주급을 함께 비교해서 고르세요', '유스에서 프로까지, 한 시즌 한 시즌이 커리어가 됩니다'];
function loadView() {
  return `<div class="ldg"><div class="ldg-grass"></div><svg class="ldg-ball" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="1" width="10" height="14" fill="#fff"/><rect x="1" y="3" width="14" height="10" fill="#fff"/><rect x="6" y="6" width="4" height="4" fill="#111"/><rect x="2" y="4" width="2" height="2" fill="#111"/><rect x="12" y="4" width="2" height="2" fill="#111"/><rect x="2" y="10" width="2" height="2" fill="#111"/><rect x="12" y="10" width="2" height="2" fill="#111"/><rect x="7" y="1" width="2" height="2" fill="#111"/><rect x="7" y="13" width="2" height="2" fill="#111"/></svg><div class="ldg-logo">${pixLogo(150)}<div class="spl-sub" style="margin-top:8px">블록 풋볼매니저</div></div><div class="ldg-bar"><i id="lbar" style="width:2%"></i></div><div class="ldg-st" id="lst">월드를 준비하는 중…</div><div class="ldg-tip" id="ltip">💡 ${LOAD_TIPS[0]}</div></div>`;
}
function makeWorld() {
  S.busy = true; $('#app').innerHTML = loadView();
  const g = Core.newWorldGen(Date.now() % 1000000, S.sel.slice()); let ti = 0;
  const tipT = setInterval(() => { const e = $('#ltip'); if (!e) return; ti = (ti + 1) % LOAD_TIPS.length; e.textContent = '💡 ' + LOAD_TIPS[ti]; }, 2600);
  const fin = () => { clearInterval(tipT); S.step = S.mode === 'mgr' ? 'mcreate' : 'create'; S.cr.mclub = null; S.busy = false; if (S.sel.includes('KOR')) { S.cr.cc = 'KOR'; S.cr.nat = 'KOR'; } else { S.cr.cc = S.sel[0]; S.cr.nat = S.sel[0]; } S.cr.club = null; render(); };
  const stepW = () => { let r; try { r = g.next(); } catch (e) { clearInterval(tipT); S.busy = false; S.step = 'setup'; render(); toast('월드 생성에 실패했습니다. 다시 시도해 주세요'); return; }
    if (r.done) { const b = $('#lbar'); if (b) b.style.width = '100%'; setTimeout(fin, 180); return; }
    const [pct, label] = r.value, b = $('#lbar'), st = $('#lst'); if (b) b.style.width = Math.round(pct * 100) + '%'; if (st) st.textContent = label + ' · ' + Math.round(pct * 100) + '%';
    setTimeout(stepW, 8); };
  setTimeout(stepW, 60);
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]'); if (!t || S.busy) return; const a = t.dataset.act, id = t.dataset.id; if (SND.bgm && !SND.tm) bgmApply(); if (a !== 'snd') PX.ui.sfx('click');
  if ((a==='start' || a==='mstart' || a==='wcstart')) {
    if (a==='mstart' && S.cr.mclub == null) { popup('구단 선택', '먼저 맡을 구단을 골라 주세요.', '⚽'); return; }
    if (!S.okGo && a==='wcstart') { const nm0 = $('#nm'); const nm1 = (nm0 && nm0.value.trim()) || '양메시', go = (d) => () => { S.cr.wcdraw = d; S.okGo = true; t.click(); };
      pop({ title: '조 편성 선택', icon: '🏆', msg: `감독: ${nm1}\n어떤 조 편성으로 월드컵을 치를까요?\n\n실제 조 = 2026 월드컵 실제 추첨 결과(A~L조)\n랜덤 조 = 48개국을 무작위로 추첨`, btns: [{ t: '취소', cls: 'sec' }, { t: '랜덤 조', fn: go('rand') }, { t: '실제 조', fn: go('real') }] }); return; }
    if (!S.okGo) { const nm0 = $('#nm'); const nm1 = (nm0 && nm0.value.trim()) || '양메시'; const lbl = a==='start' ? '선수 육성' : a==='mstart' ? '감독' : '월드컵'; ask(lbl + ' 시작', `이름: ${nm1}${a==='wcstart' ? '\n조 편성: ' + ((S.cr.wcdraw || 'real') === 'real' ? '실제 2026 월드컵 조' : '랜덤 조 추첨') : ''}\n이 설정으로 새 게임을 시작할까요?`, '시작하기', () => { S.okGo = true; t.click(); }, '🎮'); return; }
    S.okGo = false; S.welcome = a;
  }
  if (a==='wcpick') { const nm = $('#nm'); if (nm) S.cr.name = nm.value; S.cr.wcn = id; render(); return; }
  if (a==='wcsqf') { S.wcf = id; render(); return; }
  if (a==='wcsq') { const pid = +id; if (S.wcPick.has(pid)) S.wcPick.delete(pid); else if (S.wcPick.size < 26) S.wcPick.add(pid); else popup('선발 인원', '26명이 다 찼습니다.\n다른 선수를 먼저 빼 주세요.', '⚠️', 2200); render(); return; }
  if (a==='wcsqauto') { S.wcPick = new Set(Core.wcAutoPick()); render(); return; }
  if (a==='wcsqok') { const ids = [...S.wcPick], msg = Core.wcSquadCheck(ids); if (msg) { popup('선발 불가', msg, '⚠️'); return; } ask('선발 확정', '이 26명으로 월드컵 명단을 확정할까요?\n확정하면 나머지 선수는 명단에서 빠집니다.', '확정', () => { Core.wcSquadSet(ids); S.wcPick = null; S.welcome = null; S.step = 'game'; S.tab = 'mtac'; S.msel = null; S.lc = null; S.ld = null; save(); render(); setTimeout(() => popup('선발 11명 정하기', '명단 확정 완료!\n이제 전술 탭에서 포메이션과 선발 11명을 직접 골라 주세요.', '📋'), 600); }, '📋'); return; }
  if (a==='wct') { S.wct = id; render(); return; }
  if (a==='wcnew') { ask('새 게임', '월드컵 기록을 닫고 처음 화면으로 돌아갈까요?\n(자동 저장이 삭제됩니다)', '새로 시작', () => { idbDel('save'); S.step = 'mode'; S.tab = 'home'; render(); }); return; }
  if (a==='wcstart') { const nm = $('#nm'); const name = (nm && nm.value.trim()) || '양메시'; S.busy = true; $('#app').innerHTML = loadView(); setTimeout(() => { try { Core.wcStart({ name, draw: S.cr.wcdraw || 'real', nat: S.cr.wcn || 'KOR', look: { skin: S.cr.skin, hair: S.cr.hair, style: S.cr.style } }); S.step = 'wcsquad'; S.tab = 'home'; S.wct = null; S.lc = null; S.ld = null; S.wcf = 'ALL'; S.wcPick = new Set(Core.wcAutoPick()); } catch (e) { toast('시작에 실패했습니다: ' + (e && e.message)); S.step = 'wcsel'; } S.busy = false; render(); }, 80); return; }
  if (a==='mode') { S.mode = id; S.step = id === 'wc' ? 'wcsel' : 'setup'; render(); return; }
  if (a==='modeback') { S.step = 'mode'; render(); return; }
  if (a==='mclub') { const nm = $('#nm'); if (nm) S.cr.name = nm.value; S.cr.mclub = +id; render(); return; }
  if (a==='mstart') { const nm = $('#nm'); const name = (nm && nm.value.trim()) || '양메시'; if (S.cr.mclub == null) return; Core.createMgr({ name, nat: S.cr.nat, club: S.cr.mclub, look: { skin: S.cr.skin, hair: S.cr.hair, style: S.cr.style } }); S.step = 'game'; S.tab = 'home'; S.lc = null; S.ld = null; save(); render(); return; }
  if (a==='sqf') { S.sqf = id; render(); return; }
  if (a==='mkf') { S.mkf = id; render(); return; }
  if (a==='msell') { if (S.sellArm !== +id) { S.sellArm = +id; render(); return; } S.sellArm = null; const r = Core.mgrSell(+id); toast(r.msg); save(); render(); return; }
  if (a==='mbuy') { const r = Core.mgrBuy(+id); toast(r.msg); if (r.ok) save(); render(); return; }
  if (a==='mform') { Core.mgrSetFormation(id); S.msel = null; save(); render(); return; }
  if (a==='minstr') { Core.mgrSetInstr(t.dataset.k, +id); save(); render(); return; }
  if (a==='mauto') { ask('추천 선발로 되돌리기', '직접 고른 선발 11명이 사라지고 컴퓨터 추천 명단으로 바뀝니다.', '되돌리기', () => { Core.mgrAutoXi(); S.msel = null; save(); render(); }, '↩️'); return; }
  if (a==='mslot') { S.msel = (S.msel === +id) ? null : +id; render(); return; }
  if (a==='mpick') { if (S.msel != null) Core.mgrSetXi(S.msel, +id); S.msel = null; save(); render(); return; }
  if (a==='mpre') { mgrPre(); render(); return; }
  if (a==='mtacgo') { S.modal = null; S.modalKind = null; S.tab = 'mtac'; render(); return; }
  if (a==='mwatch' || a==='msum') { S.modal = null; S.modalKind = null; S.mgrGo = true; render(); startMatch(); if (a==='msum' && MV && !MV.over) { S.mtab = 'flow'; skipMatch(); } return; }
  if (a==='mjob') { Core.mgrTakeJob(+id); S.tab = 'home'; save(); render(); return; }
  if (a==='mpopen') { mgrPanelOpen(); return; }
  if (a==='mpclose') { mgrPanelClose(); return; }
  if (a==='mfold' || a==='mset') { msetOpen(); return; }
  if (a==='msetx') { msetClose(); return; }
  if (a==='mintro') { introSkip(); return; }
  if (a==='mcam') { try { V3D.setCam(id); } catch (e) {} msetSync(); return; }
  if (a==='mfull') { vfullToggle(); return; }
  if (a==='vmenu') { vfullMenu(); return; }
  if (a==='mball') { try { V3D.setBall(id); } catch (e) {} msetSync(); return; }
  if (a==='mment') { const M = G0().mm; if (!M || !MV || MV.over) return; Core.mgrSetInstr('ment', +id); MV.tk.m = tkOf(M.mine); M.segDirty = true; const nx = segNext(MV.min); MV.log.unshift({ min: MV.min, ic: '📋', cls: '', t: `<b>감독 지시</b> ${['수비적', '균형', '공격적'][+id]}으로 전환${nx ? ` <span class="dim">· ${nx}분 구간부터 결과에 반영</span>` : ''}` }); toast(nx ? `${['수비적', '균형', '공격적'][+id]} 전환 — ${nx}분부터 결과에 반영` : '남은 구간이 없어 결과에는 반영되지 않습니다'); PX.ui.render(); return; }
  if (a==='mpinstr') { Core.mgrSetInstr(t.dataset.k, +id); if (MV) MV.mgrDirty = true; PX.ui.render(); return; }
  if (a==='mpout') { S.mpout = (S.mpout === +id) ? null : +id; PX.ui.render(); return; }
  if (a==='mpin') { if (S.mpout == null) { toast('먼저 나갈 선수를 탭하세요'); return; } mgrSubUI(S.mpout, +id); return; }
  if (a==='sel') { const i = S.sel.indexOf(id); if (i>=0) S.sel.splice(i,1); else if (S.sel.length<10) S.sel.push(id); else toast('최대 10개국입니다'); render(); return; }
  if (a==='world') { if (S.sel.length) makeWorld(); return; }
  if (a==='cr') { const nm = $('#nm'); if (nm) S.cr.name = nm.value; S.cr[t.dataset.k] = id; if (t.dataset.k==='pos') S.cr.prefs = []; if (t.dataset.k==='cc' || t.dataset.k==='stage') { S.cr.home = ''; S.cr.club = null; S.cr.mclub = null; } if (t.dataset.k==='cc' && !S.cr.natTouched) S.cr.nat = id; render(); return; }
  if (a==='start') { const nm = $('#nm'); const name = (nm && nm.value.trim()) || '양메시'; fixCreator(); Core.createMe({ name, h: S.cr.h, prefs: (S.cr.prefs||[]).filter(k => (Core.PREF_POS[S.cr.pos]||[]).includes(k)), trait: S.cr.trait, pos: S.cr.pos, club: S.cr.club, nat: S.cr.nat, age: S.cr.stage==='youth'?15:19, look: { skin:S.cr.skin, hair:S.cr.hair, style:S.cr.style } }); S.step = 'game'; S.lc = null; S.ld = null; save(); render(); return; }
  if (a==='tab') { S.tab = id; S.modal = null; S.modalKind = null; S._sk = null; }
  else if (a==='plan') { Core.me().plan = id; }
  else if (a==='autorest') { const m = Core.me(); m.autoRest = m.autoRest === false; m.autoResting = false; toast('피로 자동 관리 ' + (m.autoRest ? 'ON' : 'OFF')); save(); S.modal = settingsModal(); render(); return; }
  else if (a==='cust') { const m = Core.me(); let l = (m.cust||[]).slice(); const ix = l.indexOf(id); if (ix>=0) l.splice(ix,1); else { l.push(id); if (l.length>2) l.shift(); } m.cust = l; m.plan = 'custom'; }
  else if (a==='roletrain') { Core.setRoleTraining(); toast('역할에 맞는 부족한 능력치를 집중 훈련합니다'); }
  else if (a==='spa') { Core.sponsorAccept(+id); toast('스폰서 계약 완료'); }
  else if (a==='spd') Core.sponsorDecline(+id);
  else if (a==='inv') { Core.setInv(+id); }
  else if (a==='ada') { const r = Core.adAccept(+id); toast(r.msg); if (r.ok) PX.ui.sfx('coin'); }
  else if (a==='add') Core.adDecline(+id);
  else if (a==='shop') { const [k, i] = id.split(':'); const r = Core.shopBuy(k, i); toast(r.ok ? '구매·계약 완료' : r.msg); if (r.ok) PX.ui.sfx('coin'); }
  else if (a==='ofd') S.modal = offerModal(+id);
  else if (a==='nf') S.nf = id; else if (a==='lc') { S.lc = id; S.ld = null; S.sea = null; } else if (a==='ld') { S.ld = id; S.sea = null; } else if (a==='lsea') { S.seaUser = true; S.sea = +id < 0 ? null : +id; if (S.lt==='hist') S.lt = 'table'; } else if (a==='lt') S.lt = id; else if (a==='cv') S.cv = id;
  else if (a==='pl') S.modal = profileHTML(G0().players[id]);
  else if (a==='club') { S.modal = clubModal(+id); }
  else if (a==='cmt') { S.cmt = id; S.modal = clubModal(S.cmid); }
  else if (a==='evt') { const r = Core.evtPick(+id); if (r) { popup('선택 결과', r.txt, '📌'); save(); } render(); return; }
  else if (a==='facup') { const r = Core.facUp(id); toast(r.msg); if (r.ok) save(); render(); return; }
  else if (a==='offact') { const r = Core.offStart(id); toast(r.msg); if (r.ok) save(); render(); return; }
  else if (a==='tour') { if (Core.tourPick(id)) { toast('프리시즌 투어를 정했습니다'); save(); } render(); return; }
  else if (a==='retire') { ask('현역 은퇴', '정말 은퇴할까요?\n은퇴하면 선수로는 더 뛸 수 없고, 감독으로 이어서 할 수 있습니다.', '은퇴', () => { Core.meRetire(); save(); render(); }, '👋'); return; }
  else if (a==='rtmgr') { if (Core.meToMgr(+id)) { S.tab = 'home'; S.welcome = 'mstart'; save(); render(); } return; }
  else if (a==='close') { S.modal = null; S.modalKind = null; if (G0() && G0().cer) G0().cer = null; else if (G0() && G0().awardPop) G0().awardPop = null; else if (G0() && G0().seasonCard) G0().seasonCard = null; save(); }
  else if (a==='cerpress') { const g0 = G0(); Core.mgrCerPress(); g0.cer = null; S.modalKind = 'press'; S.modal = pressModal(); }
  else if (a==='mprepress') { const g0 = G0(); Core.mgrPreGen(); Core.mgrX().preDay = g0.day; S.modalKind = 'press'; S.modal = pressModal(); }
  else if (a==='msponsor') { const [sl, ix] = id.split(':'); const r = Core.mgrSponsorSign(sl, +ix); toast(r.msg); if (r.ok) PX.ui.sfx('coin'); save(); }
  else if (a==='rnopen') { const [k, i] = id.split(':'); S.rn = { k, i: +i, back: S.modal, bk: S.modalKind }; const cur = k === 'p' ? G0().players[+i].name : Core.clubOf(+i).name; S.modalKind = 'rename'; S.modal = `<div class="ttl">이름 변경</div><div class="dim">${k === 'p' ? '선수' : '구단'} 이름을 직접 바꿀 수 있습니다 (최대 ${k === 'p' ? 14 : 16}자).</div><input id="rnv" class="inp" maxlength="16" value="${esc(cur)}" style="width:100%;margin:10px 0"><div class="row g8"><button class="btn grow" data-act="rnsave">저장</button><button class="btn sec grow" data-act="rncancel">취소</button></div>`; }
  else if (a==='rnsave') { const v = $('#rnv') && $('#rnv').value, r = S.rn; if (r) { const ok = r.k === 'p' ? Core.renamePlayer(r.i, v) : Core.renameClub(r.i, v); if (ok) popup('이름 변경', '이름을 바꿨습니다.', '✏️', 1800); else popup('이름 변경', '이름을 입력해 주세요.', '✏️'); if (ok) { S.modal = r.k === 'p' ? profileHTML(G0().players[r.i]) : clubModal(r.i); S.modalKind = r.k === 'p' ? null : 'club'; S.rn = null; save(); } } }
  else if (a==='rncancel') { const r = S.rn; S.modal = r ? r.back : null; S.modalKind = r ? r.bk : null; S.rn = null; }
  else if (a==='mstaff') { const r = Core.mgrStaffUp(id); toast(r.msg); if (r.ok) PX.ui.sfx('coin'); save(); }
  else if (a==='snd') { sndSet(id, !SND[id]); render(); popup('소리 설정', (id==='sfx' ? '효과음 ' : '배경음악 ') + (SND[id] ? 'ON' : 'OFF') + ' 으로 바꿨습니다.', SND[id] ? '🔊' : '🔇', 1800); return; }
  else if (a==='mpress') { Core.mgrPressPick(id); S.modalKind = 'press'; S.modal = pressModal(); save(); }
  else if (a==='news') { const n = G0().news[+id]; if (n) S.modal = articleOf(n); }
  else if (a==='acc') { S.modal = null; const k = (Core.me().offers[+id]||{}).kind; const r = Core.acceptOffer(+id); save(); toast(k ? (r||'합의') : '계약이 완료되었습니다'); }
  else if (a==='ngk' || a==='ngp') { const r = Core.negotiate(+id, a==='ngk'?'ask':'promise'); toast(r); S.modal = Core.me().offers[+id] ? offerModal(+id) : null; }
  else if (a==='npd') { Core.cancelPending(); }
  else if (a==='rehome') { rollHome(); const nm = $('#nm'); if (nm) S.cr.name = nm.value; if (!S.cr.home) toast('고향을 먼저 골라 주세요'); }
  else if (a==='pref') { const l = S.cr.prefs || (S.cr.prefs = []); const ix = l.indexOf(id); if (ix>=0) l.splice(ix,1); else if (l.length < 3) l.push(id); const nm = $('#nm'); if (nm) S.cr.name = nm.value; }
  else if (a==='mt') { S.mt = id; }
  else if (a==='ct') { S.ct = id; }
  else if (a==='gogrow') { S.tab = 'me'; S.mt = 'grow'; }
  else if (a==='bkcopy') { gzEnc(Core.serialize()).then(c => { const ta = $('#bkbox'); if (ta) ta.value = c; return navigator.clipboard.writeText(c).then(() => popup('백업 코드', '백업 코드를 복사했습니다.\n메모 앱 등에 붙여넣어 보관하세요.', '📋'), () => popup('백업 코드', '아래 칸의 코드를 직접 길게 눌러 복사해 주세요.', '📋')); }).catch(() => popup('백업 실패', '백업 코드를 만들지 못했습니다.', '⚠️')); return; }
  else if (a==='bkrestore') { const v = (($('#bkbox') || {}).value || '').trim(); gzDec(v).then(str => { Core.load(str); S.step = 'game'; S.tab = 'home'; S.lc = null; S.ld = null; S.modal = null; save(); render(); popup('복원 완료', '백업에서 복원했습니다.', '✅'); }).catch(() => popup('복원 실패', '백업 코드가 올바르지 않습니다.', '⚠️')); return; }
  else if (a==='updchk') { updCheck(true); return; }
  else if (a==='settings') { S.modalKind = 'settings'; S.modal = settingsModal(); refreshSlots0().then(() => { if (S.modal) { S.modal = settingsModal(); render(); } }); }
  else if (a==='meet') { S.modal = meetModal(); }
  else if (a==='ma') { const r = Core.answerMeeting(+id); if (r) { S.modal = `<div class="ttl">면담 결과</div><div class="card gl"><div>“${esc(r.resp)}”</div><div class="dim">${r.fx}</div></div><button class="btn wide" data-act="close">확인</button>`; save(); } }
  else if (a==='ssave') { const exists = (S.slots || {})[id]; const n = SLOTS.indexOf(id) + 1; if (exists) ask('덮어쓰기', `저장 칸 ${n}의 기존 데이터를 덮어쓸까요?`, '덮어쓰기', () => slotSave(id), '💾'); else slotSave(id); return; }
  else if (a==='sload') { ask('불러오기', '현재 진행 상황이 선택한 저장 데이터로 바뀝니다.\n불러올까요?', '불러오기', () => slotLoad(id), '📂'); return; }
  else if (a==='sdel') { ask('저장 삭제', '이 저장 데이터를 삭제할까요?\n되돌릴 수 없습니다.', '삭제', () => slotDel(id).then(() => popup('삭제 완료', '저장 데이터를 삭제했습니다.', '🗑️', 1800)), '⚠️'); return; }
  else if (a==='dec') { S.modal = null; Core.declineOffer(+id); }
  else if (a==='ren') { Core.acceptRenewal(); save(); }
  else if (a==='reset') { ask('새 게임 시작', '현재 진행(자동 저장)이 삭제됩니다.\n저장 칸 1~3에 넣어 둔 데이터는 그대로 남습니다.\n계속할까요?', '지우고 새로 시작', () => { S.resetArm = false; S.modal = null; S.modalKind = null; idbDel('save'); S.step = 'mode'; S.tab = 'home'; refreshSlots0().then(render); }, '⚠️'); return; }
  else if (a==='go') { S.skipOpen = false; if (isM() && G0().pendingMine) { mgrPre(); render(); return; } advance(1); return; }
  else if (a==='skipm') { S.skipOpen = !S.skipOpen; render(); return; }
  else if (a==='skip') { S.skipOpen = false; if (isM() && G0().pendingMine) { mgrPre(); render(); return; } advance(+id); return; }
  else if (a==='day') { if (isM() && G0().pendingMine) return; advance(1); return; }
  else if (a==='week') { advance(7); return; }
  else if (a==='match') { advance(120); return; }
  else if (a==='mv') { mvPick(id); return; }
  else if (a==='fs') { try { localStorage.setItem('bfm_fs', String(+id)); } catch (e) {} fsApply(); render(); { const f = FS_OPT.find(x => String(x[0]) === String(id)); popup('글자·버튼 크기', `‘${f ? f[1] : id}’ 크기로 바꿨습니다.`, '🔠', 1800); } return; }
  else if (a==='talk') { if (!MV || !MV.talk) return; const r = (G0().mm && G0().mm.role === 'mgr') ? Core.mgrTalkPick(id, MV.talkDiff || 0) : Core.talkPick(id); MV.log.unshift({ min: 45, ic: '💬', cls: '', t: `<b>하프타임</b> ${esc(r.text)}` }); MV.talk = null; later(startSecond, 600); PX.ui.render(); return; }
  else if (a==='mtab') { S.mtab = id; PX.ui.render(); return; }
  else if (a==='mview') { S.mfOpen = false; viewSet(id); if (MV) { PX.ui.render(); msetSync(); } else render(); if (!MV) popup('경기 화면', `‘${VIEW_N[viewNow()]}’ 화면으로 바꿨습니다. 경기 결과에는 영향이 없습니다.`, '🏟', 1800); return; }
  else if (a==='mvm') { S.mfOpen = false; S.vm = id; try { localStorage.setItem('bfm_vm', id); } catch (e) {} if (MV) { MV.hl = id === 'hl' || id === 'mine'; if (!MV.hl) MV.hlFast = false; MV.speed = -1; hlSync(); PX.ui.render(); msetSync(); } return; }
  else if (a==='mspd') { S.mfOpen = false; S.spd = +id; try { localStorage.setItem('bfm_spd', String(S.spd)); } catch (e) {} if (MV) { MV.speed = spdMs(); if (MV.timer && !MV.skipping && !MV.over) { clearInterval(MV.timer); MV.timer = setInterval(tick, MV.speed); } hlSync(); PX.ui.render(); msetSync(); } return; }
  else if (a==='pwatch' || a==='psum') { S.modal = null; S.modalKind = null; render(); startMatch(); if (a==='psum' && MV && !MV.over) { S.mtab = 'flow'; skipMatch(); } return; }
  else if (a==='mexit') { exitAskOpen(); return; }
  else if (a==='mexitno') { exitAskClose(); return; }
  else if (a==='mexityes') { exitMatch(); return; }
  else if (a==='mskip') { if (!MV || !G0().mm || MV.over) return; skipMatch(); return; }
  else if (a==='mend') { if (!MV || !G0().mm || MV.ending) return; MV.ending = true; endMatchUI(); return; }
  render();
});
document.addEventListener('input', (e) => { if (e.target.id==='nm') S.cr.name = e.target.value; if (e.target.id==='hrange') { S.cr.h = +e.target.value; const lab = e.target.previousElementSibling; if (lab) lab.querySelector('.dim').textContent = S.cr.h + 'cm · 크면 헤딩·몸싸움↑ 작으면 스피드·민첩↑'; } });
document.addEventListener('change', (e) => {
  if (e.target.classList && e.target.classList.contains('rsel')) { Core.mgrSetRole(+e.target.dataset.slot, e.target.value); save(); render(); return; }
  if (e.target.id==='clubsel') { S.cr.club = +e.target.value; }
  if (e.target.id==='homesel') { S.cr.home = e.target.value; rollHome(); const nm = $('#nm'); if (nm) S.cr.name = nm.value; render(); }
  if (e.target.id==='natsel') { S.cr.nat = e.target.value; S.cr.natTouched = true; const nm0 = $('#nm'); if (nm0) S.cr.name = nm0.value; const cc = natToCc(S.cr.nat); if (cc && cc !== S.cr.cc) { S.cr.cc = cc; S.cr.home = ''; S.cr.club = null; S.cr.mclub = null; } render(); }
});
// ---------- 저장 슬롯 (자동 저장 + 수동 3칸) ----------
const SLOTS = ['slot1','slot2','slot3'];
function slotMeta() { try { const m = Core.me(), c = Core.clubOf(m.club); if (isM()) return { name: G0().mgr.name + ' 감독', club: c.name, age: '-', ovr: '-', mgr: true, date: Core.fmtDate(G0().day), at: Date.now() }; return { name: m.name, club: c.name, age: m.age, ovr: m.ovr, date: Core.fmtDate(G0().day), at: Date.now() }; } catch (e) { return null; } }
async function refreshSlots() { await refreshSlots0(); render(); }
async function slotSave(k) { const meta = slotMeta(); if (!meta) return; await idbSet(k, { meta, d: Core.serialize() }); popup('저장 완료', `${k === 'save' ? '자동 저장' : '저장 칸 ' + (SLOTS.indexOf(k) + 1)}에 저장했습니다.\n${meta.name} · ${meta.club} · ${meta.date}`, '💾'); await refreshSlots(); }
async function slotLoad(k) { try { const o = await idbGet(k); const d = typeof o === 'string' ? o : (o && o.d); if (!d) return; Core.load(d); S.step = 'game'; S.tab = 'home'; S.lc = null; S.ld = null; S.modal = null; save(); render(); popup('불러오기 완료', '저장 데이터를 불러왔습니다.', '📂', 2000); if (G0().pendingMine) setTimeout(startMatch, 50); } catch (e) { popup('불러오기 실패', '저장 데이터를 읽지 못했습니다.', '⚠️'); } }
async function slotDel(k) { await idbDel(k); await refreshSlots(); }
async function refreshSlots0() { const out = {}; for (const k of ['save'].concat(SLOTS)) { try { const v = await idbGet(k); if (v) out[k] = (typeof v === 'string') ? { meta: null, d: v } : v; } catch (e) {} } S.slots = out; }
function slotRows(inGame) {
  const sl = S.slots || {}; const rows = [];
  const row = (k, label) => { const o = sl[k]; const meta = o && o.meta; const info = o ? (meta ? `${esc(meta.name)} · ${meta.mgr ? '' : meta.age + '세 · 종합 ' + meta.ovr + ' · '}${esc(meta.club)} · ${meta.date}` : '자동 저장 데이터') : '<span class="dim">비어 있음</span>';
    return `<div class="card"><div class="row"><b>${label}</b><span class="dim">${meta&&meta.at?new Date(meta.at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''}</span></div><div class="dim">${info}</div><div class="row g8" style="flex-wrap:wrap">${inGame && k!=='save' ? `<button class="btn" data-act="ssave" data-id="${k}">${o?'덮어쓰기':'여기에 저장'}</button>` : ''}${o ? `<button class="btn sec" data-act="sload" data-id="${k}">불러오기</button>` : ''}${o && k!=='save' ? `<button class="btn sec" data-act="sdel" data-id="${k}">삭제</button>` : ''}</div></div>`; };
  rows.push(row('save', '자동 저장'));
  SLOTS.forEach((k,i) => rows.push(row(k, '저장 칸 ' + (i+1))));
  return rows.join('');
}
const PIXR = '<rect x="0" y="0" width="1" height="1"/><rect x="1" y="0" width="1" height="1"/><rect x="2" y="0" width="1" height="1"/><rect x="3" y="0" width="1" height="1"/><rect x="0" y="1" width="1" height="1"/><rect x="4" y="1" width="1" height="1"/><rect x="0" y="2" width="1" height="1"/><rect x="4" y="2" width="1" height="1"/><rect x="0" y="3" width="1" height="1"/><rect x="1" y="3" width="1" height="1"/><rect x="2" y="3" width="1" height="1"/><rect x="3" y="3" width="1" height="1"/><rect x="0" y="4" width="1" height="1"/><rect x="4" y="4" width="1" height="1"/><rect x="0" y="5" width="1" height="1"/><rect x="4" y="5" width="1" height="1"/><rect x="0" y="6" width="1" height="1"/><rect x="1" y="6" width="1" height="1"/><rect x="2" y="6" width="1" height="1"/><rect x="3" y="6" width="1" height="1"/><rect x="6" y="0" width="1" height="1"/><rect x="7" y="0" width="1" height="1"/><rect x="8" y="0" width="1" height="1"/><rect x="9" y="0" width="1" height="1"/><rect x="10" y="0" width="1" height="1"/><rect x="6" y="1" width="1" height="1"/><rect x="6" y="2" width="1" height="1"/><rect x="6" y="3" width="1" height="1"/><rect x="7" y="3" width="1" height="1"/><rect x="8" y="3" width="1" height="1"/><rect x="9" y="3" width="1" height="1"/><rect x="6" y="4" width="1" height="1"/><rect x="6" y="5" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/><rect x="12" y="0" width="1" height="1"/><rect x="16" y="0" width="1" height="1"/><rect x="12" y="1" width="1" height="1"/><rect x="13" y="1" width="1" height="1"/><rect x="15" y="1" width="1" height="1"/><rect x="16" y="1" width="1" height="1"/><rect x="12" y="2" width="1" height="1"/><rect x="14" y="2" width="1" height="1"/><rect x="16" y="2" width="1" height="1"/><rect x="12" y="3" width="1" height="1"/><rect x="16" y="3" width="1" height="1"/><rect x="12" y="4" width="1" height="1"/><rect x="16" y="4" width="1" height="1"/><rect x="12" y="5" width="1" height="1"/><rect x="16" y="5" width="1" height="1"/><rect x="12" y="6" width="1" height="1"/><rect x="16" y="6" width="1" height="1"/>';
function pixLogo(w) { return `<svg class="pixlogo" width="${w}" height="${Math.round(w*7.6/17.8)}" viewBox="-0.2 -0.2 17.8 7.6" shape-rendering="crispEdges" aria-label="BFM"><g fill="#0B110E" transform="translate(.4 .4)">${PIXR}</g><g fill="#0B110E" stroke="#0B110E" stroke-width=".3">${PIXR}</g><g fill="#FFD23F">${PIXR}</g></svg>`; }
const SPL_TEAM = [   // 로딩 화면 선수 5명: 이름 없음·실제 로고/유니폼 디자인 아님, 국가 색과 등번호만 비슷하게 — [외모, 유니폼 색(상의·하의), 등번호], 첫 번째가 가운데
  [{ skin: 'tan', hair: 'black', style: 'short' }, ['#C8102E', '#111418'], 7],      // 한국 색
  [{ skin: 'fair', hair: 'blond', style: 'bun' }, ['#F2F2F2', '#0B2A5B'], 9],      // 노르웨이 원정 색(흰색)
  [{ skin: 'deep', hair: 'black', style: 'buzz' }, ['#14285A', '#F2F2F2'], 10],     // 프랑스 색
  [{ skin: 'olive', hair: 'black', style: 'curly' }, ['#7FD3C8', '#F2F2F2'], 19],   // 스페인 원정 색(민트)
  [{ skin: 'brown', hair: 'black', style: 'short' }, ['#F7D117', '#1F4FA8'], 7]];   // 브라질 색
function splashSprites() { return SPL_TEAM.map(([lk, kit], i) => `<span class="spr spl-c" style="animation-delay:${i * 0.12}s;width:44px;height:94px;background-image:url(${sprite(lk, kit)})"></span>`).join(''); }
function splashView() {
  return `<div class="ldg spl"><div class="ldg-grass"></div><div class="spl-top">${pixLogo(250)}</div><div class="spl-sub">블록 풋볼매니저</div><div class="spl-sub2">선수 육성 · 감독 · 월드컵</div><div class="spl-3d" id="spl3d"></div><div class="ldg-bar"><i class="spl-bar"></i></div><div class="ldg-st">불러오는 중…</div></div>`;
}
function noGlView() {                                                            // WebGL(3D)이 안 되는 폰: 시작하지 않고 안내
  return `<div class="ldg spl"><div class="spl-top">${pixLogo(220)}</div><div class="spl-sub">이 폰에서는 실행할 수 없습니다</div><div class="dim" style="max-width:320px;text-align:center;line-height:1.7;margin-top:8px">블록 풋볼매니저는 3D 그래픽(WebGL)이 필요합니다.<br>안드로이드 7.0 이상, 2017년 이후 출시된 폰에서 이용해 주세요.<br><br>이미 하던 게임이 있다면 설정의 백업 코드로<br>다른 폰에서 이어서 할 수 있습니다.</div></div>`;
}
async function boot() {
  if (!V3D.glOK()) { $('#app').innerHTML = noGlView(); return; }
  $('#app').innerHTML = splashView(); const t0 = Date.now();
  let sp = null; try { sp = V3D.splash($('#spl3d'), SPL_TEAM); } catch (e) {}                    // 3D 로딩 화면(블록 선수들이 공을 주고받음)
  { const box = $('#spl3d'); if (box && !box.querySelector('canvas')) { box.classList.add('fb'); box.innerHTML = splashSprites(); } }
  refreshSlots0();
  const ok = await loadSave();
  { const w = 5000 - (Date.now() - t0); if (w > 0) await new Promise(r => setTimeout(r, w)); }
  try { if (sp) sp.stop(); } catch (e) {}
  if (ok) { S.step = 'game'; render(); if (G0().pendingMine) setTimeout(startMatch, 50); }
  else { S.step = 'mode'; render(); }
}
setTimeout(boot, 0);                                                               // 3D 모듈(match3d.js)이 다 읽힌 뒤 시작

window.addEventListener('error', (e) => { try { const st = String((e.error && e.error.stack) || '').split('\n').slice(0, 3).map(x => x.trim().replace(/^at\s+/, '').slice(0, 70)).join(' ← '); try { (S.errLog = S.errLog || []).push(new Date().toISOString().slice(11, 19) + ' ' + (e.message || '') + ' ' + st); if (S.errLog.length > 20) S.errLog.shift(); } catch (e3) {} toast('오류: ' + (e.message || '알 수 없음') + (e.lineno ? ' (' + e.lineno + ')' : '') + (st ? '\n' + st : ''), 7000); } catch (e2) {} });
window.addEventListener('unhandledrejection', (e) => { try { toast('오류: ' + String(e.reason && e.reason.message || e.reason)); } catch (e2) {} });

// ---- 업데이트 알림: 저장소의 version.json 을 보고 새 빌드가 있으면 알려준다(인터넷이 없으면 조용히 무시) ----
const APP_VER = '1.2.0', APP_BUILD = 2;
const UPD_URL = 'https://raw.githubusercontent.com/goalstark/bfm-download/main/version.json';   // 배포용 공개 저장소(코드 저장소는 비공개 예정)
const UPD_PAGE = 'https://github.com/goalstark/bfm-download/releases/tag/latest';
const UPD = { last: 0, info: null, busy: false, pend: null };
async function updFetch() {
  const c = typeof AbortController === 'function' ? new AbortController() : null, to = setTimeout(() => { try { c && c.abort(); } catch (e) {} }, 7000);
  try { const r = await fetch(UPD_URL + '?t=' + Date.now(), c ? { cache: 'no-store', signal: c.signal } : { cache: 'no-store' }); if (!r.ok) throw new Error('http'); const j = await r.json(); if (!(+j.build > 0)) throw new Error('bad'); return j; }
  finally { clearTimeout(to); }
}
function updNewer() { return !!(UPD.info && +UPD.info.build > APP_BUILD); }
function updOpen(j) { const u = (j && /^https:\/\/github\.com\//.test(j.url || '')) ? j.url : UPD_PAGE; try { window.open(u, '_blank'); } catch (e) { try { location.href = u; } catch (e2) {} } }
function updAsk(j, manual) {
  const b = document.getElementById('pop');
  UPD.pend = j; if (!manual && (S.matchOpen || (b && b.style.display === 'flex'))) return;                  // 경기·다른 안내 중이면 1분마다 다시 시도해서 끝난 뒤에 알림
  const notes = Array.isArray(j.notes) ? j.notes.slice(0, 6).map(x => '· ' + x).join('\n') : (j.notes ? String(j.notes) : '');
  pop({ title: '새 버전이 나왔어요', icon: '🆕', msg: `v${j.ver || ''} (현재 v${APP_VER})${notes ? '\n\n' + notes : ''}\n\n받으러 가면 설치 파일(APK)을 받을 수 있어요. 기존 앱 위에 설치가 안 되면 앱을 지우고 설치해야 하니, 먼저 설정 → 백업 코드를 복사해 두세요.`,
    btns: [{ t: '나중에', cls: 'sec', fn: () => { UPD.pend = null; try { localStorage.setItem('bfm_updsn', JSON.stringify({ b: +j.build, t: Date.now() })); } catch (e) {} } }, { t: '받으러 가기', fn: () => { UPD.pend = null; updOpen(j); } }] });
}
async function updCheck(manual) {
  if (UPD.busy) return; UPD.busy = true;
  try {
    const j = await updFetch(); UPD.last = Date.now(); UPD.info = j;
    if (+j.build > APP_BUILD) {
      let sn = null; try { sn = JSON.parse(localStorage.getItem('bfm_updsn') || 'null'); } catch (e) {}
      if (manual || !sn || +sn.b !== +j.build || Date.now() - sn.t > 24 * 3600e3) updAsk(j, manual);
    } else if (manual) popup('최신 버전입니다', `현재 v${APP_VER} 이(가) 가장 최신이에요.`, '✅', 2500);
  } catch (e) { if (manual) popup('확인하지 못했어요', '인터넷 연결을 확인하고 다시 시도해 주세요.', '📡'); }
  finally { UPD.busy = false; try { if (S.modalKind === 'settings' && S.modal) { S.modal = settingsModal(); render(); } } catch (e) {} }
}
setTimeout(() => updCheck(false), 4000);
setInterval(() => { if (UPD.pend) updAsk(UPD.pend, false); else if (Date.now() - UPD.last > 6 * 3600e3) updCheck(false); }, 60e3);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - UPD.last > 6 * 3600e3) updCheck(false); });
// ---- 화면 꺼짐 방지 (경기·플레이 중 폰 화면 자동 꺼짐 방지) ----
(function keepAwake() {
  let lock = null;
  async function get() {
    try { if (document.visibilityState !== 'visible' || !navigator.wakeLock || lock) return; lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch (e) { lock = null; }
  }
  document.addEventListener('visibilitychange', get);
  document.addEventListener('pointerdown', get, { passive: true });
  window.addEventListener('focus', get);
  get();
  setInterval(get, 20000);
})();
