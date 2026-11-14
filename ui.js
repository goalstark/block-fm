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
function compLabel(ctx) { if (ctx.t==='lg') return lgName(ctx.id); if (ctx.t==='nt') return '국가대표 경기'; const c = Core.compById(ctx.id); return c ? c.name + (ctx.g!==undefined ? ' 조별리그' : ctx.third ? ' 3·4위전' : c.rl ? ' '+c.rl : '') : '대회'; }
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
  const head = p.me ? mySprite(56) : `<span class="spr" style="width:56px;height:119px;background-image:url(${sprite(lookOf(p),c?(p.sub==='GK'?gkKitFor(c):[c.col,c.col2]):null)})"></span>`;
  const nt = p.nst && p.nst.a>0 ? `<span class="tag">대표 ${p.nst.a}경기 ${p.nst.g}골</span>` : '';
  return `<div class="prof">${head}<div><div class="ttl">${esc(p.name)} <button class="btn sm sec" data-act="rnopen" data-id="p:${p.id}" aria-label="이름 변경">✏</button></div><div class="dim">${Core.POS_KO[p.sub]} · ${p.age}세 · ${Core.NATK(p.nat)} · ${c?esc(c.name):'무소속'}</div><div class="row g8" style="flex-wrap:wrap"><span class="tag">종합 ${p.ovr}</span>${p.me?`<span class="tag">잠재 ${p.pot}</span>`:''}<span class="tag">계약 ${p.ct.until}</span>${nt}</div>${p.inj>0?`<div class="dim" style="color:#FFB27A">부상 ${p.inj}일</div>`:''}</div></div><div class="sec">시즌별 기록</div>${histTable(p)}${xferList(p)}<div class="sec">능력치</div>${attrBars(p)}`;
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
  return `<div class="ttl">설정</div><div class="sec">저장·불러오기</div><div class="dim">자동 저장은 매 진행마다 이뤄집니다. 칸에 따로 저장해 두면 되돌릴 수 있어요.</div>${slotRows(true)}<div class="sec">백업 코드</div><div class="dim">앱을 지우고 다시 설치할 때를 대비해 코드를 복사해 두세요(메모 앱 등에 붙여넣기). 새로 설치한 뒤 아래 칸에 붙여넣고 복원하면 이어서 할 수 있습니다.</div><textarea id="bkbox" rows="3" style="width:100%;background:#101814;color:#EAF1EC;border:1px solid #2A3A30;border-radius:10px;padding:8px;font-size:11px" placeholder="백업 코드"></textarea><div class="row g8"><button class="btn sec" data-act="bkcopy" style="flex:1">백업 코드 복사</button><button class="btn sec" data-act="bkrestore" style="flex:1">코드로 복원</button></div><div class="sec">글자·버튼 크기</div><div class="row g8">${FS_OPT.map(([v,n])=>`<button class="btn ${fsGet()===v?'':'sec'}" data-act="fs" data-id="${v}" style="flex:1">${n}</button>`).join('')}</div><div class="dim">경기 화면 필드는 그대로, 메뉴·목록·버튼 크기만 바뀝니다.</div><div class="sec">소리</div><div class="row g8"><button class="btn ${SND.sfx?'':'sec'}" data-act="snd" data-id="sfx" style="flex:1">효과음 ${SND.sfx?'ON':'OFF'}</button><button class="btn ${SND.bgm?'':'sec'}" data-act="snd" data-id="bgm" style="flex:1">배경음악 ${SND.bgm?'ON':'OFF'}</button></div><div class="dim">경기 중에는 배경음악이 잠시 멈추고 경기 소리만 나옵니다.</div><div class="sec">게임</div><button class="btn sec wide" data-act="reset">새 게임 시작</button>`;
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
  return `<rect width="100" height="64" fill="${pt.base}"/>` + o; }
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
function pitchHTML(M) {
  const dots = (st, col0, pre) => st.map((p,i) => { const col = p.sub === 'GK' ? MV.kit.gk[pre] : col0; const lk = lookOf(p), sk = '#' + SKIN_C[lk.skin], hr = '#' + HAIR_C[lk.hair], ol = pre==='o' ? '#fff' : '#000';
    const fig = `<rect x="-1.4" y="-1.4" width="2.8" height="2.9" fill="${col}" stroke="${ol}" stroke-width="0.28"/><rect x="-1.1" y="-4" width="2.2" height="2.3" fill="${sk}" stroke="${ol}" stroke-width="0.22"/><rect x="-1.1" y="-4" width="2.2" height="0.8" fill="${hr}"/><rect x="-1.2" y="1.5" width="1" height="1.5" fill="#232A26"/><rect x="0.2" y="1.5" width="1" height="1.5" fill="#232A26"/>`;
    return p.me ? `<g class="dot me" id="${pre}${i}" transform="translate(50 32)"><circle class="mering" cy="0" r="4.2" fill="none" stroke="#FFE45C" stroke-width="0.6"/><g transform="scale(1.1)">${fig}</g><path d="M0 -6.6 L-1.5 -8.6 L1.5 -8.6 Z" fill="#FFE45C"/><text y="-9.4" text-anchor="middle" font-size="3.4" font-weight="800" fill="#FFE45C" stroke="#000" stroke-width="0.5" paint-order="stroke">나</text></g>` : `<g class="dot" id="${pre}${i}" transform="translate(50 32)"><g transform="scale(.76)">${fig}</g></g>`; }).join('');
  return `<div class="pwrap"><svg id="pitch" viewBox="0 0 100 64" preserveAspectRatio="xMidYMid meet">${pitchBg(MV.pitch)}<g fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".4"><rect x="1" y="1" width="98" height="62"/><path d="M50 1V63"/><circle cx="50" cy="32" r="8"/><rect x="1" y="17" width="14" height="30"/><rect x="85" y="17" width="14" height="30"/><rect x="1" y="25" width="5" height="14"/><rect x="94" y="25" width="5" height="14"/></g><line id="pline" x1="0" y1="0" x2="0" y2="0" stroke="#fff" stroke-opacity="0" stroke-width=".4" stroke-dasharray="1.2 1"/><ellipse id="bsh" rx=".85" ry=".4" fill="#000" fill-opacity=".28" transform="translate(50 32)"/>${dots(MV.ost, MV.kit.o[0], 'o')}${dots(MV.mst, MV.kit.m[0], 'm')}<g id="ball" transform="translate(50 32)"><circle r=".85" fill="#fff" stroke="#000" stroke-width=".28"/></g><text id="blbl" text-anchor="middle" font-size="3" font-weight="800" fill="#fff" stroke="#000" stroke-width=".55" paint-order="stroke" opacity="0" transform="translate(50 28)"></text></svg><div id="fx"></div></div>`;
}
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// ---- 연속 이동 엔진: 포메이션 기준점 + 공 영향 + 역할 + 스티어링(속도/가속), 매 프레임 갱신 ----
const ROLE_U = { GK: [2, 14], CB: [10, 60], FB: [10, 82], DM: [18, 70], CM: [20, 84], AM: [28, 90], W: [25, 96], ST: [38, 97] };
const SUBX = { ST: 9, W: 5, AM: 4, CM: 0, DM: -5, FB: -2, CB: -6, GK: 0 };
const FTS = { ST: [89, 7], W: [85, 0], AM: [77, 11], CM: [63, 0], FB: [70, 0], DM: [54, 0], CB: [44, 10] };   // 공격 3분의 1 지역에서의 팀 구조(자기 편 기준 좌표)
const PA = (p, k) => (p && p.a && p.a[k]) || 50;
const uOf = (x, d) => d > 0 ? x : 100 - x;
const dM_ = (M) => M.mineHome ? 1 : -1;
const tsOf = () => (MV && (MV.fast || MV.hlFast)) ? 4 : (S.spd || 1);
function initPos(M) {
  const dM = dM_(M); MV.pos = { m: [], o: [] }; MV.tgt = { m: [], o: [] }; MV.run = {};
  { const fm = (M.mine && M.mine.tactic && M.mine.tactic.formation) || '4-4-2', fo = (M.opp && M.opp.tactic && M.opp.tactic.formation) || '4-4-2'; MV.fxy = { m: fpos(MV.mst, fm), o: fpos(MV.ost, fo) }; }
  const f = (st, pre, d) => st.forEach((p, i) => { const b = fxy(pre, i); MV.pos[pre][i] = { x: d > 0 ? b[0] : 100 - b[0], y: b[1] * 0.64, vx: 0, vy: 0 }; });
  f(MV.mst, 'm', dM); f(MV.ost, 'o', -dM);
  const k = Math.min(6, MV.mst.length - 1); MV.holder = null; MV.act = { k: 'pass', to: { s: 'm', i: k }, sp: 40 }; MV.poss = 'm'; MV.dec = 0.6;
}
function runOf(key, p, d, atk, sub) {
  let r = MV.run[key]; if (r && r.until > MV.t) return r;
  const amp = sub === 'CB' ? 3 : sub === 'FB' ? 5 : sub === 'DM' ? 5 : sub === 'CM' ? 7 : 9, fw = atk ? (PA(p, 'OTB') - 40) / 60 : -0.25;
  return MV.run[key] = { dx: d * amp * (Math.random() * 1.2 - 0.4 + fw * 0.8) * 0.7, dy: (Math.random() * 2 - 1) * amp * (0.5 + PA(p, 'WOR') / 140), until: MV.t + 1.6 + Math.random() * 2.6 };
}
function retarget(M) {
  if (MV.pen) { penTargets(M); return; }
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
  if (MV.cele || MV.regroup > 0) applyCele(M); else if (MV.sp) applySp(M);
  if (MV.force) for (const k in MV.force) { const F = MV.force[k], tg = MV.tgt[k[0]]; if (tg && tg[+k.slice(1)]) tg[+k.slice(1)] = { x: F.x, y: F.y, sprint: true }; }   // 장면 진입: 목표 위치로 전력 질주
}
function applyCele(M) {                                   // 골 세레머니·재정렬: 순간이동 없이 달려서 이동
  const C = MV.cele, D = { m: dM_(M), o: -dM_(M) };
  for (const pre of ['m', 'o']) sideOf(pre).forEach((p, i) => {
    if (!MV.tgt[pre][i]) return;
    const f = fxy(pre, i), fx = D[pre] > 0 ? f[0] : 100 - f[0], fy = f[1] * 0.64;
    if (!C) { MV.tgt[pre][i] = { x: fx, y: fy, sprint: true }; return; }
    if (pre === C.s && i === C.si) MV.tgt[pre][i] = { x: C.cx, y: C.cy, sprint: true };
    else if (pre === C.s && i > 0) { const sc = MV.pos[pre][C.si] || { x: C.cx, y: C.cy }, a = i * 0.85, r = 2.6 + (i % 3) * 0.9; MV.tgt[pre][i] = { x: c01(sc.x + Math.cos(a) * r, 2.5, 97.5), y: c01(sc.y + Math.sin(a) * r, 3, 61), sprint: true }; }
    else MV.tgt[pre][i] = { x: fx, y: fy, sprint: false };
  });
}
function movePitch() { const M = G0().mm; if (!M || !MV || !MV.pos) return; retarget(M); if (!MV.raf) MV.raf = requestAnimationFrame(frame); }
function lbl(t) { if (MV) MV.lbl = { t, l: 1 }; }
function resetPos(M) { const dM = dM_(M); const f = (st, pre, d) => st.forEach((p, i) => { const b = fxy(pre, i), c = MV.pos[pre][i]; if (c) { c.x = d > 0 ? b[0] : 100 - b[0]; c.y = b[1] * 0.64; c.vx = c.vy = 0; } }); f(MV.mst, 'm', dM); f(MV.ost, 'o', -dM); MV.run = {}; }
function sideOf(s) { return s === 'm' ? MV.mst : MV.ost; }
function passTo(s, i, sp) { const h0 = MV.holder; if (h0 && MV.st && !MV.pg) { const t0 = MV.st[h0.s]; t0.pa++; if (h0.s !== s) t0.pm++; if (h0.s === 'm' && MV.mst[h0.i] && MV.mst[h0.i].me) { MV.my.pa++; if (s !== 'm') MV.my.pm++; } }
  MV.act = { k: 'pass', to: { s, i }, sp: sp * 0.78 }; MV.holder = null; }
function shoot(M, out) {
  const h = MV.holder, s = h.s, d = s === 'm' ? dM_(M) : -dM_(M), os = s === 'm' ? 'o' : 'm', cur = MV.pos[s][h.i], gx = d > 0 ? 99 : 1;
  let t = { x: gx, y: 32 }, to = null;
  if (out === 'goal') t = { x: gx, y: 32 + (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3) };
  else if (out === 'wide') t = { x: gx, y: 32 + (Math.random() < 0.5 ? -1 : 1) * (9 + Math.random() * 5) };
  else if (out === 'post') t = { x: gx, y: 32 + (Math.random() < 0.5 ? -1 : 1) * 4.2 };
  else if (out === 'save') t = { x: MV.pos[os][0].x, y: MV.pos[os][0].y };
  else { let bi = -1, bd = 1e9; MV.pos[os].forEach((q, i) => { if (i === 0 || !q || MV.red[os + i]) return; const dd = Math.hypot(q.x - cur.x, q.y - cur.y); if (dd < bd) { bd = dd; bi = i; } }); if (bi < 0) { out = 'wide'; t = { x: gx, y: 32 + 10 }; } else to = { s: os, i: bi }; }
  if (MV.st) { const u0 = uOf(cur.x, d), gd0 = Math.hypot(100 - u0, cur.y - 32) * 1.05, xg0 = clampN(0.85 * Math.exp(-gd0 / 11) * (1 - 0.35 * Math.min(1, Math.abs(cur.y - 32) / 30)), 0.02, 0.8), S0 = MV.st[s]; S0.sh++; S0.xg += out === 'goal' ? Math.max(xg0, 0.08) : xg0; if (out === 'goal' || out === 'save') S0.sot++; }
  MV.act = { k: 'shot', tx: t.x, ty: t.y, sp: 56, out, s, to }; MV.holder = null; lbl('슛!');
  if (out !== 'goal') { sfx(out === 'save' ? 'save' : 'shot'); const nm = esc(sideOf(s)[h.i].name); MV.log.unshift({ min: MV.min, ic: IC.target, cls: '', t: `${nm}의 슛 — ${({ save: '골키퍼 선방', wide: '골대를 벗어남', block: '수비가 막아냄', post: '골대를 때림' })[out]}` }); }
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
    if (pg.t > 12 && h.i !== 0) { if (gd < 30) { shoot(M, 'goal'); return; } cur.x += d * 7; cur.y += (32 - cur.y) * 0.3; MV.dec = 0.3; return; }   // 안전장치: 득점 연출이 너무 길어지면 몰고 들어가 마무리
    if (h.i === 0) { const t = pickBy(mates.filter(m => m.i), m => Math.exp(-m.dist / 25) * (m.pu > 40 ? 1.5 : 0.7)); if (t) passTo(s, t.i, 46); else MV.dec = 0.5; return; }
    const si = pg.si;
    if (si === h.i || (si < 0 && gd < 30)) { if (gd < 26) { shoot(M, 'goal'); return; } cur.x += d * 4.5; cur.y += (32 - cur.y) * 0.2; MV.dec = 0.42; return; }   // 사정권(약 26m) 밖이면 공을 몰고 전진
    const sc = si >= 0 ? mates.find(m => m.i === si) : null; if (sc && (u > 45 || pg.t > 2.5)) { passTo(s, si, 52); return; }
    const t = pickBy(mates.filter(m => m.i && m.pu > u - 6), m => Math.exp(-m.dist / 22) * (m.pu > u ? 2 : 0.6) * m.open); if (t) passTo(s, t.i, 44); else MV.dec = 0.4; return;
  }
  // 골키퍼: 잡은 뒤 배급 (짧게 풀어 나가거나 길게 전방으로)
  if (h.i === 0) { const long = Math.random() < 0.35 + (PA(who, 'KIC') - 50) / 250;
    const t = pickBy(mates.filter(m => m.i), m => long ? (m.sub === 'ST' || m.sub === 'W' || m.sub === 'AM' ? 1 + m.open : 0.2) : (m.sub === 'CB' || m.sub === 'FB' || m.sub === 'DM' ? Math.exp(-m.dist / 20) * m.open : 0.15));
    if (t) { passTo(s, t.i, long ? 55 : 38); if (long) { MV.act.hi = true; lbl('롱킥'); } } else MV.dec = 0.5; return; }
  const R = who.sub, pm = c01(0.5 + (M.mine.strength - M.opp.strength) / 160, 0.3, 0.7), press = nd < 6 ? 1 : nd < 12 ? 0.5 : 0.15, foe = ni >= 0 ? sideOf(os)[ni] : null;
  const lose = clampN(0.05 + press * 0.14 + (s === 'm' ? -(pm - 0.5) * 0.2 : (pm - 0.5) * 0.2) - (PA(who, 'DRI') - 50) / 700 + (PA(foe, 'TAK') - 50) / 500 + (PA(foe, 'AGG') - 50) / 900, 0.03, 0.42);
  const pass = (t, sp, lead, tag) => { const err = clampN((55 - PA(who, 'PAS')) / 220 + press * 0.08 + (t.dist > 30 ? 0.05 : 0) + (lead ? 0.04 : 0), 0, 0.3);   // 패스 정확도: 능력치/압박/거리
    if (Math.random() < err && ni >= 0) { let bi = -1, bd = 1e9; oarr.forEach((q, i) => { if (i && q && !MV.red[os + i]) { const dd = Math.hypot(q.x - t.q.x, q.y - t.q.y); if (dd < bd) { bd = dd; bi = i; } } }); if (bi >= 0) { passTo(os, bi, sp); return; } }
    passTo(s, t.i, sp); if (lead) MV.act.lead = d * lead; if (tag) { MV.act.tag = tag; lbl(tag); } if (tag === '크로스' || tag === '롱패스' || tag === '걷어내기') MV.act.hi = true; };
  if (ni >= 0 && Math.random() < lose) { passTo(os, ni, 55); lbl('태클!'); return; }                                          // 태클/인터셉트
  if (MV.finS !== s) { MV.finS = s; MV.fin = 0; } if (u < 60) MV.fin = 0;
  const wide = cur.y < 16 || cur.y > 48;
  const roleShot = R === 'ST' ? 0.15 : R === 'W' || R === 'AM' ? 0.05 : R === 'CB' || R === 'FB' || R === 'DM' ? -0.25 : 0, range = 19 + (PA(who, 'FIN') - 50) / 6 + (R === 'ST' ? 4 : 0) - (R === 'CB' || R === 'DM' ? 7 : 0);
  if (u > 62 && gd < range) {                                                                                    // 슈팅 / 크로스 / 컷백 (포지션·결정력에 따라 슈팅 거리와 빈도가 다름)
    const shotP = clampN(0.26 + (PA(who, 'FIN') - 50) / 150 + roleShot + (gd < 18 ? 0.25 : 0) - press * 0.08 + MV.fin * 0.22 - (wide ? 0.22 : 0), 0.04, 0.95);
    if (Math.random() < shotP) { const r = Math.random(), fin = (PA(who, 'FIN') - 50) / 400, out = r < 0.38 - fin ? 'save' : r < 0.62 - fin ? 'wide' : r < 0.85 ? 'block' : 'post'; shoot(M, out); MV.fin = 0; return; }
    MV.fin++;
    if (wide && Math.random() < 0.55 + (PA(who, 'CRS') - 50) / 200) { const t = pickBy(mates.filter(m => m.pu > 78), m => 1 + (PA(m.who, 'HEA') - 50) / 80 + m.open); if (t) { pass(t, 48 + (PA(who, 'CRS') - 50) / 8, 0, '크로스'); return; } }
  }
  if (u < 30 && press > 0.5 && Math.random() < 0.35) { const t = pickBy(mates.filter(m => m.i), m => m.sub === 'ST' || m.sub === 'W' || m.sub === 'AM' ? 1 + m.open : 0.15); if (t) { pass(t, 54 + (R === 'CB' ? (PA(who, 'STR') - 50) / 10 : 0), 0, '걷어내기'); return; } }   // 위험 지역 걷어내기
  if ((R === 'CM' || R === 'AM' || R === 'DM') && PA(who, 'VIS') > 55 && Math.random() < (PA(who, 'VIS') - 40) / 140) {   // 시야 좋은 미드필더: 수비 뒷공간 스루패스
    const t = pickBy(mates.filter(m => m.i && m.pu > u + 8 && m.pu <= line + 4 && (m.sub === 'ST' || m.sub === 'W' || m.sub === 'AM')), m => m.open * (1 + (PA(m.who, 'OTB') - 50) / 60)); if (t) { pass(t, 46 + PA(who, 'PAS') / 10, 6, '스루패스'); return; } }
  if (R === 'ST' && (PA(who, 'STR') + PA(who, 'HEA')) / 2 > PA(who, 'PAC') + 4 && gd > 16 && Math.random() < 0.35) {          // 타깃맨: 등지고 받아 내려주기
    const t = pickBy(mates.filter(m => m.i && m.pu < u && (m.sub === 'AM' || m.sub === 'CM' || m.sub === 'W')), m => m.open); if (t) { pass(t, 38); return; } }
  if (PA(who, 'VIS') > 58 && (R === 'CM' || R === 'DM' || R === 'CB') && Math.random() < 0.18) {                                // 사이드 체인지
    const t = pickBy(mates.filter(m => m.i && Math.abs(m.q.y - cur.y) > 26 && m.pu >= u - 4), m => m.open); if (t) { pass(t, 46, 0, '사이드 체인지'); MV.act.hi = true; return; } }
  if (nd > 8 && u < 72 && Math.random() < 0.12 + (PA(who, 'DRI') - 50) / 300 + (R === 'W' ? 0.15 : R === 'AM' ? 0.08 : R === 'CB' || R === 'DM' ? -0.1 : 0)) { MV.dec = 0.5 + Math.random() * 0.5; return; }   // 드리블 전진
  const t = pickBy(mates, m => { if (m.i === 0 && (u > 25 || Math.random() < 0.85)) return 0; const fw = m.pu - u; return Math.exp(-m.dist / 22) * (fw > 4 ? 1.5 : fw < -8 ? 0.45 : 1) * (m.dist < 5 ? 0.1 : 1) * m.open * (m.pu > line + 1 ? 0.15 : 1) * (1 + (PA(who, 'VIS') - 50) / 150) * (fw > 4 && (m.sub === 'ST' || m.sub === 'W') ? 1 + (PA(m.who, 'OTB') - 50) / 100 : 1) * (R === 'CB' || R === 'FB' ? (m.sub === 'DM' || m.sub === 'CM' || m.sub === 'FB' || m.sub === 'CB' ? 1.3 : 0.8) : 1); });
  if (t) pass(t, 34 + PA(who, 'PAS') / 4); else MV.dec = 0.5;
}
function stepBall() { if (MV) MV.dec = Math.min(MV.dec == null ? 0.2 : MV.dec, 0.2); }
function varSeq(steps) { let t = 0; steps.forEach(([html, cls, ms]) => { setTimeout(() => { if (MV && !MV.over && !MV.skipping) fxShow(html, cls, ms, true); }, t); t += ms; }); return t; }
function goalFx(M) {
  const pg = MV.pg; if (!pg) return;
  if (!pg.varDone) { pg.varDone = true; if (Math.random() < 0.22 && !MV.skipping) { MV.paused = true; fxShow('<div class="gb">📺</div><div class="gs">VAR 판독 중…</div>', 'save', 1500, true); pg.logs.unshift({ min: MV.min, ic: '📺', cls: '', t: '<b>VAR 판독</b> — 득점 인정' }); setTimeout(() => { if (MV && MV.pg === pg) goalFx(M); }, 1500); return; } }
  MV.pg = null;
  pg.logs.slice().reverse().forEach(o => MV.log.unshift(o)); MV.goalRes = pg.ms ? 'o' : 'm';
  { const stt = sideOf(pg.s), outf = stt.map((_, i) => i).filter(i => i > 0 && MV.pos[pg.s][i]); const si = pg.si > 0 && MV.pos[pg.s][pg.si] ? pg.si : outf[outf.length - 1], c = MV.pos[pg.s][si], dd = pg.s === 'm' ? dM_(M) : -dM_(M);
    MV.cele = { s: pg.s, si, t: 0, cx: dd > 0 ? 91 : 9, cy: c && c.y < 32 ? 6 : 58 }; MV.regroup = 0; }
  sfx(pg.ms ? 'goal' : 'goalopp'); fxShow(pg.html, pg.ms ? 'goal' : 'goal opp', 3100, true); renderMatch();
}
function flushPg() { const pg = MV && MV.pg; if (!pg) return; MV.pg = null; pg.logs.slice().reverse().forEach(o => MV.log.unshift(o)); }
function frame(ts) {
  if (!MV) return; MV.raf = requestAnimationFrame(frame);
  const M = G0().mm; if (!M || !MV.pos) return;
  if (MV.over) {                                                                          // 경기 종료: 선수·공 정지 + 가운데 종료 표시
    if (!MV.endShown) { MV.endShown = true; MV.lbl = null; { const lb0 = document.getElementById('blbl'); if (lb0) lb0.textContent = ''; } MV.act = null; MV.rs = null; MV.pg = null; MV.ln = null; MV.bz = 0; for (const pre of ['m', 'o']) (MV.pos[pre] || []).forEach(c => { if (c) c.vx = c.vy = 0; });
      const [eh, ea] = scoreAt(MV.etOn ? 120 : 90), pks = MV.so ? `<div class="endt" style="font-size:14px">승부차기 ${M.mineHome ? MV.so.sm : MV.so.so} : ${M.mineHome ? MV.so.so : MV.so.sm}</div>` : ''; fxShow(`<div class="endt">경기 종료</div><div class="ends">${eh} : ${ea}</div>${pks}`, 'end', 3600000, false); movePitch(); }
    return; }
  let dt = MV.last ? Math.min(0.05, (ts - MV.last) / 1000) : 0.016; MV.last = ts; const realDt = dt; dt *= tsOf();
  if (MV.momentOpen && MV.settle > 0) MV.settle -= realDt; const hold = !!MV.momentOpen && !(MV.settle > 0), pdt = hold ? 0 : dt;
  if (MV.cele) { MV.cele.t += realDt; if (MV.cele.t > 2.0) { MV.cele = null; MV.regroup = 1.0; MV.rt = 0; } } else if (MV.regroup > 0) MV.regroup -= realDt;
  if (!MV.over && MV.min > 0 && !hold) { if (MV.poss && MV.st[MV.poss]) MV.st[MV.poss].pt += dt; const mi0 = MV.myI == null ? (MV.myI = MV.mst.findIndex(p => p.me)) : MV.myI, mc = mi0 >= 0 && MV.pos.m[mi0]; if (mc) { const uu = uOf(mc.x, dM_(M)); MV.heat[Math.min(5, Math.floor(mc.y / 64 * 6)) * 10 + Math.min(9, Math.max(0, Math.floor(uu / 10)))] += dt; } }
  if (MV.sp) { MV.sp.t += realDt; if (MV.sp.t > 1.9) endSp(M); }
  MV.t += dt; MV.rt -= dt; if (MV.kick > 0) MV.kick -= dt; if (MV.pg) MV.pg.t += dt; if (MV.rt <= 0) { retarget(M); MV.rt = 0.22; }
  const all = [];
  for (const pre of ['m', 'o']) sideOf(pre).forEach((p, i) => {
    const c = MV.pos[pre][i], g = MV.tgt[pre][i]; if (!c || !g) return;
    if (MV.red[pre + i] || (MV.frz && MV.frz[pre + i] > MV.t)) { c.vx = c.vy = 0; return; }
    const dx = g.x - c.x, dy = g.y - c.y, dist = Math.hypot(dx, dy) || 1e-6, tired = clampN((60 - PA(p, 'STA')) / 200 * (MV.min / 90), 0, 0.2);
    const vmax = (8 + PA(p, 'PAC') / 9) * (g.sprint || dist > 12 ? 1 : 0.72) * (1 - tired) * (MV.kick > 0 ? 1.15 : 1) * (MV.lead || MV.regroup > 0 ? 2.3 : MV.cele || MV.sp ? 1.5 : 1), want = Math.min(vmax, dist * 3.2), acc = (30 + PA(p, 'AGI') / 2) * pdt;
    c.vx += clampN(dx / dist * want - c.vx, -acc, acc); c.vy += clampN(dy / dist * want - c.vy, -acc, acc);
    if (hold) { c.vx = c.vy = 0; } c.x += c.vx * pdt; c.y += c.vy * pdt; all.push(c);
  });
  for (let a = 0; a < all.length; a++) for (let b2 = a + 1; b2 < all.length; b2++) {
    const p = all[a], q = all[b2], dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy; if (d2 < 5.5 && d2 > 1e-4) { const d = Math.sqrt(d2), push = (2.35 - d) * 0.5; p.x -= dx / d * push; p.y -= dy / d * push; q.x += dx / d * push; q.y += dy / d * push; } }
  if (MV.lead) { const L = MV.lead; L.t += realDt; let ok = true; for (const k in MV.force) { const c = MV.pos[k[0]][+k.slice(1)], F = MV.force[k]; if (c && Math.hypot(c.x - F.x, c.y - F.y) > 1.8) { ok = false; break; } } if ((ok && L.t > 1.1) || L.t > L.max) { endLead(M); return; } }
  const b = MV.ball, act = MV.act;
  if (MV.pg && !MV.act && MV.holder && MV.holder.s !== MV.pg.s) {                                // 득점 연출 중에는 득점 팀이 공을 가져옴
    const s = MV.pg.s, arr = MV.pos[s]; let bi = -1, bd = 1e9; arr.forEach((q, i) => { if (!q || i === 0 || MV.red[s + i]) return; const dd = Math.hypot(q.x - b.x, q.y - b.y); if (dd < bd) { bd = dd; bi = i; } }); if (bi >= 0) passTo(s, bi, 52); }
  if (MV.act) {
    const A2 = MV.act; let tx, ty;
    if (A2.k === 'pass') { const q = MV.pos[A2.to.s][A2.to.i]; if (!q) { MV.act = null; return; } tx = c01(q.x + (A2.lead || 0), 1.5, 98.5); ty = q.y; }
    else if (A2.k === 'shot' && (A2.out === 'save' || A2.out === 'block')) { const tt = A2.out === 'save' ? { s: A2.s === 'm' ? 'o' : 'm', i: 0 } : A2.to, q = tt && MV.pos[tt.s][tt.i]; tx = q ? q.x : A2.tx; ty = q ? q.y : A2.ty; }
    else { tx = A2.tx; ty = A2.ty; }
    const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy), step = A2.sp * dt;
    if (A2.d0 == null) { A2.d0 = Math.max(d, 1); A2.x0 = b.x; A2.y0 = b.y; A2.h = A2.k === 'shot' ? 1.4 : A2.hi ? 3.4 : A2.d0 > 34 ? 2.2 : 0.5; }
    MV.bz = A2.h * Math.sin(Math.PI * clampN(1 - d / A2.d0, 0, 1)); MV.ln = { x0: A2.x0, y0: A2.y0, x1: tx, y1: ty };
    if (d <= step + 0.9) { b.x = tx; b.y = ty; MV.act = null;
      if (A2.k === 'pass') { if (MV.holder === null && MV.poss !== A2.to.s) MV.fin = 0; MV.holder = A2.to; MV.poss = A2.to.s; MV.dec = A2.to.i === 0 ? 1.1 + Math.random() * 0.5 : 0.45 + Math.random() * 0.7; retarget(M); }
      else if (A2.k === 'shot') { const os = A2.s === 'm' ? 'o' : 'm';
        if (A2.out === 'goal') { if (MV.pg && MV.pg.so) { MV.pg = null; lbl('골!'); } else { MV.pen = null; goalFx(M); } }
        else if (A2.out === 'save') { lbl('선방!'); MV.holder = { s: os, i: 0 }; MV.poss = os; MV.dec = 1.2 + Math.random() * 0.5; retarget(M); }
        else if (A2.out === 'block') { lbl('막았다!'); MV.holder = A2.to; MV.poss = os; MV.dec = 0.4; retarget(M); }
        else if (A2.out === 'post') { lbl('골대!'); let bi = -1, bd = 1e9; MV.pos[os].forEach((q, i) => { if (i === 0 || !q || MV.red[os + i]) return; const dd = Math.hypot(q.x - b.x, q.y - b.y); if (dd < bd) { bd = dd; bi = i; } }); if (bi >= 0) passTo(os, bi, 40); }
        else { lbl('빗나감'); MV.rs = { t: 0.9, s: os, i: 0 }; MV.holder = null; MV.poss = os; } }            // 골킥 준비
    } else { b.x += dx / d * step; b.y += dy / d * step; }
  } else if (MV.rs) {
    MV.bz = 0; MV.ln = null;
    MV.rs.t -= dt; if (MV.rs.t <= 0) { const q = MV.pos[MV.rs.s][MV.rs.i]; b.x = q.x; b.y = q.y; MV.holder = { s: MV.rs.s, i: MV.rs.i }; MV.poss = MV.rs.s; MV.dec = 1.0; MV.rs = null; retarget(M); }
  } else if (MV.holder && MV.pos[MV.holder.s][MV.holder.i]) {
    MV.bz = 0; MV.ln = null;
    const hp = MV.pos[MV.holder.s][MV.holder.i], dd = MV.holder.s === 'm' ? dM_(M) : -dM_(M), k = Math.min(1, dt * 16);
    b.x += (c01(hp.x + dd * 1.7, 1.5, 98.5) - b.x) * k; b.y += (hp.y - b.y) * k;
    if ((!MV.paused || MV.pg) && !MV.over) { MV.dec -= dt; if (MV.dec <= 0) decide(M); }
  }
  if (MV.goalRes && !MV.paused && !MV.act) {
    const s = MV.goalRes, st = sideOf(s); MV.goalRes = null; MV.cele = null; MV.regroup = 0; b.x = 50; b.y = 32; MV.holder = { s, i: Math.min(6, st.length - 1) }; MV.poss = s; MV.dec = 0.45; MV.kick = 0.7; MV.fin = 0; retarget(M); }
  const els = MV.els || (MV.els = { m: MV.mst.map((_, i) => document.getElementById('m' + i)), o: MV.ost.map((_, i) => document.getElementById('o' + i)) });
  for (const pre of ['m', 'o']) els[pre].forEach((el, i) => { const c = MV.pos[pre][i]; if (!el || !c) return; const sp = Math.hypot(c.vx, c.vy), bob = Math.abs(Math.sin(MV.t * 11 + i * 1.3)) * Math.min(0.6, sp / 25);
    const jmp = MV.cele && pre === MV.cele.s && i > 0 && sp < 4 ? Math.abs(Math.sin(MV.t * 9 + i * 0.7)) * (i === MV.cele.si ? 2.4 : 1.5) : 0;
    el.setAttribute('transform', `translate(${c.x.toFixed(2)} ${(c.y - bob - jmp).toFixed(2)})${MV.frz && MV.frz[pre + i] > MV.t ? ' rotate(86)' : ''}`); if (MV.red[pre + i]) el.style.opacity = 0.12; });
  const bz = MV.act ? (MV.bz || 0) : 0, be = document.getElementById('ball'); if (be) be.setAttribute('transform', `translate(${b.x.toFixed(2)} ${(b.y - bz).toFixed(2)}) scale(${(1 + bz * 0.1).toFixed(2)})`);
  const sh = document.getElementById('bsh'); if (sh) sh.setAttribute('transform', `translate(${b.x.toFixed(2)} ${(b.y + 0.9).toFixed(2)})`);
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
  const sc = SCN[mo.kind] || SCN.box, d = dM_(M), ab = (u) => d > 0 ? u : 100 - u, curU = d > 0 ? me.x : 100 - me.x, side = Math.random() < 0.75 ? (me.y < 32 ? 12 : 52) : (me.y < 32 ? 52 : 12);   // 지금 서 있는 쪽 측면을 우선
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
  let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < kinds.length; i++) { r -= w[i]; if (r <= 0) return kinds[i]; } return kinds[0];
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
  const txt = leadText(mo.kind, prev); lbl(prev !== fin.poss ? (fin.poss === 'm' ? '공 탈취!' : '빼앗김!') : '전개'); fxShow(`<div class="gs">${txt}</div>`, 'save', 1500, false); movePitch();
}
function endLead(M) {
  const L = MV.lead; if (!L) return; MV.lead = null; MV.force = null;
  for (const k in L.force) { const c = MV.pos[k[0]][+k.slice(1)], f = L.fin[k[0]][+k.slice(1)]; if (c && f) { c.x = f.x; c.y = f.y; c.vx = c.vy = 0; } }   // 도착 못 한 선수만 남은 거리를 맞춘다
  Object.assign(MV, { holder: L.fin.holder, act: L.fin.act, poss: L.fin.poss, stage: L.fin.stage, stageOpp: L.fin.stageOpp, settle: L.fin.settle, rs: L.fin.rs, run: L.fin.run });
  MV.ball.x = L.fin.ball.x; MV.ball.y = L.fin.ball.y; MV.paused = true; MV.momentOpen = L.mo; MV.dec = 99;
  retarget(M); fxShow(`<div class="gs">⚡ 내 차례!</div>`, 'save', 900, false); bringMeTop(); renderMatch();
}
function nearestOf(s, x, y, skipGK) { const arr = MV.pos[s]; let bi = -1, bd = 1e9; arr.forEach((c, i) => { if (!c || (skipGK && i === 0) || MV.red[s + i]) return; const dd = Math.hypot(c.x - x, c.y - y); if (dd < bd) { bd = dd; bi = i; } }); return bi; }
function playOutcome(M, mo, r) {                                                      // 내 선택 결과대로 장면을 이어 간다
  const mi = MV.mst.findIndex(p => p.me); const me = mi >= 0 && MV.pos.m[mi]; if (!me) return;
  const info = Core.optInfo(r.choice), sc = SCN[mo.kind] || SCN.box, d = dM_(M), ru = (a) => a[Math.floor(Math.random() * a.length)];
  MV.act = null; MV.rs = null; MV.settle = 0;
  const give = (s, i) => { const c = MV.pos[s][i]; MV.holder = { s, i }; MV.poss = s; MV.ball.x = c.x; MV.ball.y = c.y; };
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
  const el = $('#fx'); if (!el) return; el.innerHTML = `<div class="fxb ${cls}">${html}</div>`;
  if (pause) { MV.paused = true; }
  if (pause) { clearTimeout(MV.fxP); MV.fxP = setTimeout(() => { if (MV && !MV.momentOpen && !MV.pg && !MV.lead && !MV.talk && !MV.mgrPanel && !MV.pen && !MV.so) MV.paused = false; }, ms); }   // 일시정지 해제는 배너가 덮어써져도 반드시 실행
  clearTimeout(MV.fxT); MV.fxT = setTimeout(() => { const e = $('#fx'); if (e) e.innerHTML = ''; }, ms);
}
function startSp(M, type, ms) {                                                  // 세트피스 연출: 코너킥·프리킥 위치로 이동 → 박스 안 배치 → 킥
  const nm = type === 'cn' ? '코너킥' : '프리킥';
  if (!MV || MV.sp || MV.pg || MV.momentOpen || MV.lead || MV.goalRes || MV.talk || MV.cele || MV.over || MV.skipping || MV.fast) { lbl(nm); return; }
  const s = ms ? 'm' : 'o', st = sideOf(s), d = s === 'm' ? dM_(M) : -dM_(M), gx = d > 0 ? 99 : 1; let sx, sy;
  if (type === 'cn') { sx = d > 0 ? 98.5 : 1.5; sy = Math.random() < 0.5 ? 2 : 62; } else { const u = 48 + Math.random() * 30; sx = d > 0 ? u : 100 - u; sy = 12 + Math.random() * 40; }
  let tk = -1, bd = 1e9; st.forEach((p, i) => { const q = MV.pos[s][i]; if (i === 0 || MV.red[s + i] || !q || (MV.frz && MV.frz[s + i] > MV.t)) return; const dd = Math.hypot(q.x - sx, q.y - sy); if (dd < bd) { bd = dd; tk = i; } });
  if (tk < 0) { lbl(nm); return; }
  MV.act = null; MV.holder = null; MV.dec = 99; MV.paused = true; MV.ball.x = sx; MV.ball.y = sy; MV.sp = { s, tk, sx, sy, type, gx, d, t: 0 }; MV.nsp = (MV.nsp || 0) + 1; lbl(nm); retarget(M);
}
function applySp(M) {
  const P = MV.sp, os = P.s === 'm' ? 'o' : 'm', box = uOf(P.sx, P.d) > 62; let k = 0;
  sideOf(P.s).forEach((p, i) => { const tg = MV.tgt[P.s][i]; if (!tg || MV.red[P.s + i] || i === 0) return;
    if (i === P.tk) { MV.tgt[P.s][i] = { x: P.sx, y: P.sy, sprint: true }; return; }
    if (box && (p.sub !== 'CB' || i % 2)) { MV.tgt[P.s][i] = { x: P.gx - P.d * (5 + (k % 3) * 3.5), y: 22 + (k % 4) * 6.5, sprint: true }; k++; } });
  if (box) { let j = 0; sideOf(os).forEach((p, i) => { const tg = MV.tgt[os][i]; if (!tg || MV.red[os + i] || i === 0) return; MV.tgt[os][i] = { x: P.gx - P.d * (3.5 + (j % 3) * 3), y: 20 + (j % 5) * 6, sprint: true }; j++; }); }
}
function endSp(M) { const P = MV.sp; MV.sp = null; if (!P) return; const b = MV.ball; b.x = P.sx; b.y = P.sy; MV.holder = { s: P.s, i: P.tk }; MV.poss = P.s; MV.dec = 0.4; MV.kick = 0.6; MV.paused = false; retarget(M); }

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
function bestKicker(st, avoid) { let bi = -1, bf = -1; st.forEach((p, i) => { if (!p || p.sub === 'GK' || i === avoid) return; const f = PA(p, 'FIN') + Math.random() * 6; if (f > bf) { bf = f; bi = i; } }); return bi < 0 ? 1 : bi; }
// 한 번의 페널티킥: res = goal | save | wide | post
function penScene(M, o) {
  const sp = penSpot(M, o.s), P = MV.pen = Object.assign({ run: false, dive: 0 }, o, sp), os = o.s === 'm' ? 'o' : 'm';
  MV.act = null; MV.rs = null; MV.sp = null; MV.holder = null; MV.dec = 99; MV.paused = true; MV.ball.x = sp.sx; MV.ball.y = 32; MV.poss = o.s; MV.bz = 0;
  retarget(M);
  const at = (ms, f) => setTimeout(() => { if (MV && MV.pen === P) f(); }, ms);
  const sgn = Math.random() < 0.5 ? -1 : 1, shotY = o.res === 'goal' ? 32 + sgn * (3.2 + Math.random() * 1.3) : o.res === 'save' ? 32 + sgn * (2.5 + Math.random() * 2) : o.res === 'post' ? 32 + sgn * 4.2 : 32 + sgn * (9 + Math.random() * 4);
  let t = 0; const lead = o.so ? 900 : (o.intro || []).reduce((a, x) => a + x[2], 0) + 1400;
  if (o.intro) { let u = 0; o.intro.forEach(([h, c, ms]) => { at(u, () => fxShow(h, c, ms, false)); u += ms; }); }
  at(lead - 450, () => { P.run = true; retarget(M); });
  at(lead, () => {                                                                       // 슛: 골키퍼 다이빙 방향 결정
    P.dive = o.res === 'save' ? (shotY - 32) * 1.1 : (Math.random() < 0.6 ? -(shotY - 32) : (Math.random() < 0.5 ? -4 : 4)); retarget(M);
    MV.act = { k: 'shot', tx: sp.gx, ty: shotY, sp: 62, out: o.res === 'goal' ? 'goal' : o.res, s: o.s, to: null }; sfx(o.res === 'save' ? 'save' : 'shot'); lbl('페널티킥!'); });
  if (o.res !== 'goal' || o.so) at(lead + 1700, () => { MV.pen = null; if (o.done) o.done(); else if (!MV.pg && !MV.momentOpen && !MV.lead && !MV.talk) MV.paused = false; });
}
// 승부차기 계획: 승자(myWin)는 core가 결정, 킥 순서·성패는 규칙대로 생성
function soPlan(mst, ost, myWin) {
  const order = (st) => st.map((p, i) => ({ i, f: PA(p, 'FIN'), gk: p.sub === 'GK' })).sort((a, b) => (a.gk - b.gk) || (b.f - a.f)).map(o => o.i);
  const km = order(mst), ko = order(ost);
  for (let tries = 0; tries < 400; tries++) {
    const seq = [], first = Math.random() < 0.5 ? 'm' : 'o'; let sm = 0, so = 0, done = false, nm = 0, no = 0;
    for (let r = 0; r < 60 && !done; r++) for (const sd of (first === 'm' ? ['m', 'o'] : ['o', 'm'])) {
      const ki = (sd === 'm' ? km : ko)[r % 11], p = (sd === 'm' ? mst : ost)[ki], ok = Math.random() < 0.72 + (PA(p, 'FIN') - 60) / 400, kr = Math.random(), kind = ok ? 'goal' : kr < 0.6 ? 'save' : kr < 0.9 ? 'wide' : 'post';
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
  fxShow('<div class="endt">승부차기</div><div class="ends">' + esc(plan.first === 'm' ? M.mine.name : M.opp.name) + ' 선축</div>', 'end', 1700, false); renderMatch();
  setTimeout(() => soNext(M), 1900);
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
    S0.i++; renderMatch(); setTimeout(() => soNext(M), 1300); } });
}
function soEnd(M) {
  const S0 = MV.so; MV.pen = null; MV.pg = null; MV.paused = false; clearInterval(MV.timer); MV.over = true; sfx('whistle');
  MV.log.unshift({ min: 120, ic: '🏆', cls: '', t: `<b>승부차기 ${S0.sm} : ${S0.so}</b> — ${esc(S0.sm > S0.so ? M.mine.name : M.opp.name)} 승리` }); finishLog(M); movePitch(); renderMatch();
}
// 90분(또는 120분) 종료 처리. true = 경기 완전 종료
function fullTime(M, skip) {
  const end = MV.etOn ? 120 : 90; MV.min = end; const [h, a] = scoreAt(end);
  if (!MV.etOn && h === a && Core.wcKO(M)) {                                             // 월드컵 토너먼트 무승부 → 연장전 30분
    Core.wcExtra(M); MV.etOn = true; (M.evMine.concat(M.evOpp)).forEach(e => { if (e.min > 90 && MV.keys) MV.keys.push(e.min); });
    MV.log.unshift({ min: 90, ic: '⏱️', cls: '', t: `<b>90분 종료 ${h} : ${a} — 연장전 돌입</b>` });
    if (!skip) { MV.goalRes = 'o'; MV.regroup = 2; fxShow(`<div class="endt">연장전</div><div class="ends">${h} : ${a} · 30분</div>`, 'end', 2400, true); renderMatch(); }
    return false; }
  if (MV.etOn && h === a && !MV.so) {                                                    // 연장 120분에도 무승부 → 승부차기
    if (!skip) { startShootout(M); return false; }
    const plan = soPlan(MV.mst, MV.ost, M.xt.mineWins); M.xt.so = plan; MV.so = { plan, i: plan.seq.length, sm: plan.sm, so: plan.so };
    MV.log.unshift({ min: 120, ic: '🏆', cls: '', t: `<b>승부차기 ${plan.sm} : ${plan.so}</b> — ${esc(plan.sm > plan.so ? M.mine.name : M.opp.name)} 승리` }); }
  clearInterval(MV.timer); MV.over = true; sfx('whistle'); finishLog(M); return true;
}
function offsideFx(M, x) {                                                                // 오프사이드: 깃발·오프사이드 라인 표시 + 상대 공격권
  if (!MV || !MV.pos || MV.sp || MV.pg || MV.pen || MV.so || MV.momentOpen || MV.lead || MV.goalRes || MV.talk || MV.cele || MV.over || MV.skipping || MV.fast) { lbl('오프사이드'); return; }
  const s = x.ms ? 'm' : 'o', os = s === 'm' ? 'o' : 'm', st = sideOf(s), d = s === 'm' ? dM_(M) : -dM_(M), pi = st.indexOf(x.p), c = pi >= 0 && MV.pos[s][pi];
  const ds = sideOf(os).map((p, i) => ({ i, x: MV.pos[os][i] && uOf(MV.pos[os][i].x, d), p })).filter(o => o.i > 0 && o.x != null && !MV.red[os + o.i]).sort((a, b) => b.x - a.x);
  const lineU = ds.length > 1 ? ds[1].x : (ds[0] ? ds[0].x : 70), lx = d > 0 ? lineU : 100 - lineU, svg = document.getElementById('pitch');
  if (svg) { const ns = 'http://www.w3.org/2000/svg', g = document.createElementNS(ns, 'g'); g.innerHTML = `<line x1="${lx.toFixed(1)}" y1="1" x2="${lx.toFixed(1)}" y2="63" stroke="#ffd34d" stroke-width=".45" stroke-dasharray="1.2 1"/>${c ? `<text x="${c.x.toFixed(1)}" y="${(c.y - 3.2).toFixed(1)}" font-size="4.2" text-anchor="middle">🚩</text>` : ''}`; svg.appendChild(g); setTimeout(() => g.remove(), 2000); }
  const nd = ds.length ? ds[0].i : 0; MV.act = null; MV.rs = null; MV.holder = { s: os, i: nd }; MV.poss = os; MV.dec = 1.0; lbl('오프사이드'); fxShow(`<div class="gb">🚩</div><div class="gs">오프사이드 · ${esc(x.p.name)}</div>`, 'save', 1000, false);
}
function emitAt(M, min, anim) {
  const out = []; const dM = M.mineHome ? 1 : -1;
  for (const e of M.evMine.concat(M.evOpp)) if (e.min === min && !e.shown) {
    e.shown = true; const ms = M.evMine.includes(e), team = ms ? M.mine : M.opp;
    const lg = [{ min, ic: IC.ball, cls: 'g ' + (ms ? 'mine' : 'opp'), t: `<b>골! ${esc(e.sc.name)}</b>${e.pen ? ' <span class="tag">PK</span>' : ''} <span class="dim">${esc(team.name)}</span>` }];
    if (e.as) lg.push({ min, ic: IC.boot, cls: 'a ' + (ms ? 'mine' : 'opp'), t: `도움 ${esc(e.as.name)}` });
    if (anim && MV.pos && MV.pos.m.length) { const sd = ms ? 'm' : 'o', si = (ms ? MV.mst : MV.ost).indexOf(e.sc), html = `<div class="gchar">${sprH(e.sc, MV.kc[ms ? 'm' : 'o'], 40)}</div><div class="gb">${IC.ball.replace('width="16" height="16"','width="44" height="44"')}</div><div class="gt">GOAL!</div><div class="gs">${e.pen ? 'PK · ' : ''}${esc(e.sc.name)}${e.as ? `<br><span class="gsa">${IC.boot} ${esc(e.as.name)}</span>` : ''}</div>`;
      MV.pg = { s: sd, ms, si, html, logs: lg, t: 0, pen: !!e.pen }; MV.paused = true; MV.dec = Math.min(MV.dec, 0.3);
      if (e.pen && !MV.pen && !MV.so) { const ki = si >= 0 ? si : bestKicker(ms ? MV.mst : MV.ost), kn = esc((ms ? MV.mst : MV.ost)[ki].name);
        penScene(M, { s: sd, ki, res: 'goal', intro: [[`<div class="gb">🅿️</div><div class="gs">페널티킥! · ${kn}</div>`, 'card', 1100], [`<div class="gb">📺</div><div class="gs">VAR 확인 · 파울 인정</div>`, 'save', 1200]] }); } }
    else lg.forEach(o => out.push(o));
  }
  for (const x of M.evx || []) if (x.min === min && !x.shown) {
    x.shown = true; const team = x.ms ? M.mine : M.opp, nmx = esc(x.p.name);
    if (x.t === 'yc') { out.push({ min, ic: IC.yc, cls: 'c', t: `경고 ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) fxShow(`${IC.yc.replace('width="12" height="16"','width="30" height="40"')}<div class="gs">${nmx}</div>`, 'card', 1000, false); }
    else if (x.t === 'dg') { const why = ({ off: '오프사이드', foul: '공격자 반칙', hand: '핸드볼' })[x.why] || '오프사이드'; out.push({ min, ic: '🚫', cls: 'c', t: `<b>골 취소</b> ${nmx} <span class="dim">${esc(team.name)} · VAR 판독 · ${why}</span>` }); if (anim) varSeq([[`<div class="gb">⚽</div><div class="gs">골인?!</div>`, 'save', 900], [`<div class="gb">📺</div><div class="gs">VAR 판독 중…</div>`, 'save', 1500], [`<div class="gb">🚫</div><div class="gs">골 취소 · ${why}</div>`, 'card', 1700]]); }
    else if (x.t === 'pk') { const gkn = x.gk ? esc(x.gk.name) : '골키퍼'; out.push({ min, ic: '🅿️', cls: 'c', t: `<b>페널티킥 선언</b> <span class="dim">${esc(team.name)} · 박스 안 반칙(VAR 확인)</span>` }); out.push({ min, ic: x.res === 'miss' ? '❌' : IC.glove, cls: 's', t: x.res === 'miss' ? `${nmx}의 페널티킥 — 골대 밖으로 벗어남` : `<b>페널티킥 선방!</b> ${gkn} <span class="dim">키커 ${nmx}</span>` }); if (anim) { const sd = x.ms ? 'm' : 'o', stp = x.ms ? MV.mst : MV.ost, idx0 = stp.indexOf(x.p), res = x.res === 'miss' ? (Math.random() < 0.7 ? 'wide' : 'post') : 'save', fin = () => fxShow(res === 'save' ? `<div class="gb">🧤</div><div class="gs">선방!</div>` : `<div class="gb">❌</div><div class="gs">실축!</div>`, 'save', 1200, false);
        if (MV.pen || MV.so || MV.pg || MV.sp) varSeq([[`<div class="gb">🅿️</div><div class="gs">페널티킥! · ${nmx}</div>`, 'card', 1100], [`<div class="gb">📺</div><div class="gs">VAR 확인 · 파울 인정</div>`, 'save', 1300], [res === 'save' ? `<div class="gb">🧤</div><div class="gs">선방!</div>` : `<div class="gb">❌</div><div class="gs">실축!</div>`, 'save', 1300]]);
        else penScene(M, { s: sd, ki: idx0 >= 0 ? idx0 : bestKicker(stp), res, intro: [[`<div class="gb">🅿️</div><div class="gs">페널티킥! · ${nmx}</div>`, 'card', 1100], [`<div class="gb">📺</div><div class="gs">VAR 확인 · 파울 인정</div>`, 'save', 1200]], done: () => { fin(); if (!MV.pg && !MV.momentOpen && !MV.lead && !MV.talk) MV.paused = false; } }); } }
    else if (x.t === 'of') { out.push({ min, ic: '🚩', cls: '', t: `오프사이드 ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) offsideFx(M, x); }
    else if (x.t === 'rc') { out.push({ min, ic: IC.rc, cls: 'c r', t: x.second ? `<b>경고 누적 퇴장!</b> ${nmx} <span class="dim">${esc(team.name)} · 두 번째 경고</span>` : `<b>퇴장!</b> ${nmx} <span class="dim">${esc(team.name)}${x.var ? ' · VAR 확인' : ''}</span>` }); const idx = (x.ms ? MV.mst : MV.ost).indexOf(x.p); if (idx >= 0) MV.red[(x.ms ? 'm' : 'o') + idx] = true; if (anim) fxShow(`${IC.rc.replace('width="12" height="16"','width="30" height="40"')}<div class="gs">${nmx}</div>`, 'card red', 1300, false); }
    else if (x.t === 'sv') { out.push({ min, ic: IC.glove, cls: 's', t: `<b>슈퍼세이브!</b> ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) fxShow(`<div class="gb">🧤</div><div class="gs">슈퍼세이브</div>`, 'save', 1000, false); }
    else if (x.t === 'ch') { out.push({ min, ic: IC.target, cls: 's', t: `<b>결정적 기회!</b> ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) fxShow(`<div class="gb">🎯</div><div class="gs">결정적 기회 · ${nmx}</div>`, 'save', 900, false); }
    else if (x.t === 'cn') { out.push({ min, ic: '🚩', cls: '', t: `코너킥 <span class="dim">${esc(team.name)}</span>` }); if (anim) startSp(M, 'cn', x.ms); }
    else if (x.t === 'fl') { out.push({ min, ic: '📣', cls: '', t: `파울 ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) startSp(M, 'fl', !x.ms); }
    else if (x.t === 'ij') { out.push({ min, ic: '🩹', cls: 'c', t: `부상 치료 ${nmx} <span class="dim">${esc(team.name)}</span>` }); if (anim) { const idx = (x.ms ? MV.mst : MV.ost).indexOf(x.p); if (idx >= 0) { (MV.frz || (MV.frz = {}))[(x.ms ? 'm' : 'o') + idx] = MV.t + 4; lbl('부상 치료'); } } }
    else if (x.t === 'pt') { out.push({ min, ic: IC.post, cls: 'p', t: `${nmx}의 슛, 골대를 강타!` }); if (anim) fxShow(`<div class="gb">🥅</div><div class="gs">골대 강타!</div>`, 'save', 900, false); }
  }
  for (const o of out.reverse()) MV.log.unshift(o);
}
const SPD = [1, 1.5, 2], BASE_MS = 450;
function spdGet() { try { const v = +localStorage.getItem('bfm_spd'); if (SPD.includes(v)) return v; } catch (e) {} return 1; }
function spdMs() { return Math.round(BASE_MS / (S.spd || (S.spd = spdGet()))); }
// 경기 보기: 풀(전체) / 하이라이트(골·결정적 기회·슈퍼세이브·퇴장·내 장면 앞뒤만 정상 속도, 나머지는 빠르게 지나감)
function vmGet() { try { const v = localStorage.getItem('bfm_vm'); if (v === 'full' || v === 'hl') return v; } catch (e) {} return 'full'; }
function hlKeys(M) {
  const ks = new Set(); M.evMine.concat(M.evOpp).forEach(e => ks.add(e.min)); (M.evx || []).forEach(x => { if (['ch', 'sv', 'pt', 'rc', 'dg', 'pk'].includes(x.t)) ks.add(x.min); }); (M.moments || []).forEach(m => ks.add(m.min));
  return [...ks].sort((a, b) => a - b);
}
function hlNear() { if (!MV || !MV.hl) return true; return MV.keys.some(k => MV.min >= k - 3 && MV.min <= k + 1); }
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
  if (isM() && !S.mgrGo) { if (G0().pendingMine) { mgrPre(); render(); } return; } S.mgrGo = false;
  const M = Core.prepareMine(); if (!M) return;
  const PT = pickPitch(M);
  MV = { min: 0, timer: null, paused: false, log: [], over: false, momentOpen: null, speed: spdMs(), ball: { x: 50, y: 32 }, poss: 'm', holder: null, pos: { m: [], o: [] }, ballFree: false, red: {}, pitch: PT, kit: pickKits(M, PT), t: 0, rt: 0, kick: 0, act: null, dec: 1, els: null, raf: 0, last: 0, run: {}, tgt: { m: [], o: [] }, mst: sortSt(M.stMine), ost: sortSt(M.stOpp), fxT: null, st: { m: { pt: 0, sh: 0, sot: 0, xg: 0, pa: 0, pm: 0 }, o: { pt: 0, sh: 0, sot: 0, xg: 0, pa: 0, pm: 0 } }, heat: new Array(60).fill(0), my: { pa: 0, pm: 0 } };
  placeMe(M); MV.hl = (S.vm || (S.vm = vmGet())) === 'hl'; MV.keys = hlKeys(M); if (MV.hl && !hlNear() && M.role !== 'bench' && M.role !== 'inj') { MV.speed = 40; MV.hlFast = true; }
  MV.kc = { m: kitClub(M.mine, MV.kit.m), o: kitClub(M.opp, MV.kit.o) }; S.matchOpen = true; sfx('whistle'); if (M.role==='bench' || M.role==='inj') { MV.speed = 60; MV.fast = true; }
  $('#match').innerHTML = `<div class="mh" id="mh"></div><div id="pitchbox">${pitchHTML(M)}</div><div class="mb" id="mb"></div><div class="mf" id="mf"></div>`;
  lockOrient('landscape'); $('#match').classList.add('on'); initPos(M); bringMeTop(); renderMatch(); movePitch(); MV.timer = setInterval(tick, MV.speed);
  if (!MV.fast) fxShow(`<div class="ends" style="font-size:12px;opacity:.85">${esc(M.title)}</div><div class="endt" style="font-size:18px;display:flex;align-items:center;justify-content:center;gap:8px">${crest(M.h, 22)}<span>${esc(M.h.name)}</span><span style="opacity:.6">vs</span><span>${esc(M.a.name)}</span>${crest(M.a, 22)}</div><div class="ends" style="font-size:13px">킥오프!</div>`, 'end', 2000, true);
}
function scoreAt(min) {
  const M = G0().mm; const mine = M.evMine.filter(e => e.min <= min).length, opp = M.evOpp.filter(e => e.min <= min).length;
  return M.mineHome ? [mine, opp] : [opp, mine];
}
function finishLog(M) { const mv = Core.mvpOf(M); MV.log.unshift({ min: MV.etOn ? 120 : 90, ic: IC.crown, cls: 'mvp', t: mv ? `<b>MVP ${esc(mv.p.name)}</b>${mv.me ? ' <span class="tag">나!</span>' : ''} <span class="dim">${esc((mv.mine ? M.mine : M.opp).name)}</span>` : '경기 종료' }); }
function tick() {
  const M = G0().mm; if (!M || !MV || MV.paused || MV.over) return;
  MV.min++;
  const m = Core.me();
  emitAt(M, MV.min, !MV.hlFast);
  if (M.role==='sub' && MV.min===M.from) MV.log.unshift({ min: MV.min, ic: IC.swap, cls: '', t: `교체 투입 — ${esc(m.name)}` })
  if (M.role==='sub' && MV.min===M.from && !MV.mst.some(p => p.me)) { let ix = MV.mst.findIndex(p => p.sub === m.sub && p.sub !== 'GK'); if (ix < 0) ix = MV.mst.findIndex(p => p.sub !== 'GK'); if (ix >= 0) { const outp = MV.mst[ix]; MV.mst[ix] = m; lbl('교체 투입'); const pb = $('#pitchbox'); if (pb) { pb.innerHTML = pitchHTML(M); MV.els = null; bringMeTop(); } fxShow(`<div class="gchar">${sprH(m, MV.kc.m, 40)}</div><div class="gs">교체 투입 · ${esc(m.name)}</div><div class="dim">${esc(outp.name)} ↔ ${MV.min}분</div>`, 'save', 1800, false); } }
  const mo = M.moments[M.mi];
  if (mo && !mo.done && mo.min <= MV.min && !MV.pg && !MV.lead && !MV.momentOpen) { MV.paused = true; beginLead(M, mo); }     // 골 연출 중이면 끝난 뒤에 장면을 연다
  if (!MV.htDone && MV.min >= 45 && MV.min < 90 && !MV.pg && !MV.momentOpen && !MV.fast && !MV.skipping) {         // 전반 종료 → 잠깐 멈춤 → 후반 킥오프
    MV.htDone = true; const [hh, ha] = scoreAt(45); MV.log.unshift({ min: 45, ic: '⏸️', cls: '', t: `<b>전반 종료</b> ${hh} : ${ha}` });
    MV.regroup = 2.2; fxShow(`<div class="endt">전반 종료</div><div class="ends">${hh} : ${ha}</div>`, 'end', 2200, true);
    if (M.role === 'mgr') { MV.talkDiff = M.mineHome ? hh - ha : ha - hh; MV.talk = Core.mgrTalkInfo(MV.talkDiff); }
    else if (M.role === 'start' || M.role === 'sub') MV.talk = Object.assign(Core.talkInfo(M.mineHome ? hh - ha : ha - hh), { }); 
    else setTimeout(startSecond, 2300); }
  if (MV.etOn && MV.min === 105 && !MV.pg) { MV.log.unshift({ min: 105, ic: '⏸️', cls: '', t: '<b>연장 전반 종료</b> — 연장 후반 시작' }); lbl('연장 후반'); }
  if (MV.min >= (MV.etOn ? 120 : 90) && !MV.pg) fullTime(M, !!(MV.skipping || MV.fast));
  movePitch(); renderMatch(); hlSync();
}
function skipMatch() {
  if (MV.lead) { const M0 = G0().mm; clearInterval(MV.timer); if (MV.talk) { if (G0().mm && G0().mm.role === 'mgr') Core.mgrTalkPick('calm', 0); else Core.talkPick('follow'); MV.talk = null; MV.paused = false; MV.goalRes = 'o'; }
  MV.skipping = true; MV.sp = null; MV.cele = null; MV.regroup = 0; flushPg(); MV.timer = setInterval(tick, 40); endLead(M0); return; }
  clearInterval(MV.timer); const M = G0().mm; if (!M) return; MV.skipping = true; flushPg(); MV.paused = false;
  for (;;) { while (MV.min < (MV.etOn ? 120 : 90)) { MV.min++; emitAt(M, MV.min, false); const mo = M.moments[M.mi];
    if (M.role==='sub' && MV.min===M.from) MV.log.unshift({ min: MV.min, ic: IC.swap, cls: '', t: `교체 투입 — ${esc(Core.me().name)}` });
    if (mo && !mo.done && mo.min===MV.min) { MV.paused = true; MV.momentOpen = mo; MV.timer = setInterval(tick, 40); stepBall(M); stageMoment(M, mo); movePitch(); renderMatch(); return; } }
    if (fullTime(M, true)) break; }
  movePitch(); renderMatch();
}

const lvl3 = (p) => p >= 0.62 ? ['높음', 'hi'] : p >= 0.4 ? ['보통', 'mid'] : ['낮음', 'lo'];
function startSecond() { if (!MV || MV.over || !G0().mm) return; MV.talk = null; MV.paused = false; MV.regroup = 0; MV.goalRes = 'o'; MV.log.unshift({ min: 46, ic: '▶️', cls: '', t: '<b>후반 시작</b>' }); fxShow('<div class="endt" style="font-size:26px">후반 시작</div>', 'end', 1100, false); renderMatch(); }
function mtabs() { const T = [['flow', '경기 흐름'], ['stat', '통계'], ['tac', '전술']].concat(isM() ? [] : [['me', '내 평점']]); return `<div class="mtabs">${T.map(([k, n]) => `<button class="mtb ${(S.mtab || 'flow') === k ? 'on' : ''}" data-act="mtab" data-id="${k}">${n}</button>`).join('')}</div>`; }
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
function renderMatch() {
  const G = G0(), M = G.mm; if (!M || !MV || !$('#mh')) return; const [sh, sa] = scoreAt(MV.pg ? MV.min - 1 : MV.min);
  let dec = '';
  if (MV.talk) dec = `<div class="card gl"><div class="row g8"><b style="font-size:13.5px;line-height:1.25">감독: “${esc(MV.talk.text)}”</b></div><div class="opts3">${MV.talk.opts.map(o => `<button class="opt" data-act="talk" data-id="${o.id}"><b>${o.t}</b></button>`).join('')}</div></div>`;
  else if (MV.momentOpen) { const mo = MV.momentOpen; const opts = Core.momentOptions(mo); dec = `<div class="card gl"><div class="row g8" style="align-items:flex-end"><span class="mebub">${sprH(Core.me(), MV.kc.m, 28, 'idle')}</span><b>${Core.momentText(mo.kind)}</b></div><div class="dim">${MV.min}분 · 어떻게 할까?</div><div class="${opts.length===3?'opts3':'optsn'}">${opts.map(o => { const lv = lvl3(o.shown); return `<button class="opt ${o.fav?'fav':''}" data-act="mv" data-id="${o.id}"><b>${o.fav?'★ ':''}${o.n}</b><span class="lv ${lv[1]}">${lv[0]}</span><span class="pbar sm"><i class="${lv[1]}" style="width:${Math.round(o.shown*100)}%"></i></span><span class="dim s11 pc ${lv[1]}">성공 ${Math.round(o.shown*100)}%</span></button>`; }).join('')}</div></div>`; }
  else if (MV.over) { const st = M.role==='start'?'선발':M.role==='sub'?'교체':M.role==='inj'?'부상 결장':'벤치(결장)'; const mv = M.mvp || Core.mvpOf(M), [fh, fa] = scoreAt(MV.etOn ? 120 : 90), won = (M.mineHome ? fh - fa : fa - fh) || (MV.so ? (MV.so.sm > MV.so.so ? 1 : -1) : 0), res = won > 0 ? '승리' : won < 0 ? '패배' : '무승부';
    dec = `<div class="card mom"><div class="momt">경기 종료 · ${res}</div><div class="momsc">${fh} : ${fa}</div>${MV.so ? `<div class="dim">승부차기 ${M.mineHome ? MV.so.sm : MV.so.so} : ${M.mineHome ? MV.so.so : MV.so.sm}</div>` : MV.etOn ? '<div class="dim">연장전 종료</div>' : ''}${mv ? `<div class="momch">${sprH(mv.p, MV.kc[mv.mine ? 'm' : 'o'], 64, mv.me ? 'jump' : 'idle')}${mv.me ? '<i class="crown">' + IC.crown + '</i>' : ''}</div><div class="momn ${mv.me ? 'me' : ''}">${IC.crown} MVP ${esc(mv.p.name)}${mv.me ? ' (나!)' : ''}</div>` : ''}<div class="dim">${M.role==='mgr' ? '감독 모드' : '내 역할: ' + st}</div><div class="row g8 wrapx" style="justify-content:center">${M.myGoals ? `<span class="tag">${IC.ball} ${M.myGoals}골</span>` : ''}${M.myAssists ? `<span class="tag">${IC.boot} ${M.myAssists}도움</span>` : ''}</div><button class="btn wide" data-act="mend">결과 확인</button></div>`; }
  const roleTxt = M.role==='mgr' ? '감독석' : M.role==='start' ? '선발 출전' : M.role==='sub' ? (MV && MV.min >= M.from ? `${M.from}분 교체 투입` : `벤치 → ${M.from}분 투입 예정`) : M.role==='inj' ? '부상으로 결장' : '벤치 (출전 명단 제외)';
  $('#mh').innerHTML = `<div class="dim">${esc(M.title)} · ${Core.fmtDate(G.day)}</div><div class="sc"><div>${crest(M.h,18)} ${esc(M.h.name)}</div><b>${sh} : ${sa}</b><div>${esc(M.a.name)} ${crest(M.a,18)}</div></div><div class="dim">${MV.so ? '승부차기 ' + MV.so.sm + ' : ' + MV.so.so : (MV.etOn ? '연장 ' : '') + MV.min + "'"} · ${roleTxt}</div><div class="bar"><i style="width:${Math.min(100, MV.min / (MV.etOn ? 120 : 90) * 100)}%"></i></div>`;
  $('#mb').className = 'mb' + (MV.momentOpen || MV.talk ? ' hasdec' : MV.over ? ' isover' : ''); $('#mb').innerHTML = `${MV.momentOpen || MV.talk ? dec : mtabs() + ((S.mtab || 'flow') === 'flow' || !MV.over ? dec : '<button class="btn wide" data-act="mend" style="margin:4px 0">결과 확인</button>')}${MV.momentOpen || MV.talk || (S.mtab || 'flow') === 'flow' ? `<div class="sec">경기 흐름</div>${MV.log.map(x => `<div class="li ev ${x.cls||''}"><span class="mn">${x.min}'</span><span class="ico">${x.ic}</span><span class="et">${x.t}</span></div>`).join('') || '<div class="dim">킥오프!</div>'}` : S.mtab === 'stat' ? statView(M) : S.mtab === 'tac' ? tacView(M) : matchMeView(M)}`;
  $('#mf').innerHTML = MV.over ? '' : `<div class="spd">${[['full', '풀'], ['hl', '하이라이트']].map(([k, n]) => `<button class="chip ${(S.vm || 'full') === k ? 'on' : ''}" data-act="mvm" data-id="${k}">${n}</button>`).join('')}${SPD.map(v => `<button class="chip ${(S.spd||1)===v?'on':''}" data-act="mspd" data-id="${v}">${v}배속</button>`).join('')}${MV.momentOpen || MV.mgrPanel ? '' : (M.role==='mgr' ? '<button class="btn sec" data-act="mpopen">전술·교체</button>' : '') + '<button class="btn sec" data-act="mskip">끝까지 자동 진행</button>'}</div>`;
  if (MV.mgrPanel) { $('#mb').className = 'mb'; $('#mb').innerHTML = mgrPanelHTML(M); $('#mf').innerHTML = '<button class="btn wide" data-act="mpclose">경기 재개 ▶</button>'; }
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
function endMatchUI() {
  if (MV && MV.raf) cancelAnimationFrame(MV.raf);
  const ctx0 = G0().mm && G0().mm.ctx; G0().wcLast = null;
  const mm0 = G0().mm, snap = (MV && mm0 && !mm0.xt && MV.mst && MV.ost) ? { mineId: mm0.mineHome ? mm0.h.id : mm0.a.id, my: mm0.mine.name, op: mm0.opp.name, mst: MV.mst.map(p => ({ n: p.name, sub: p.sub, fin: PA(p, 'FIN') })), ost: MV.ost.map(p => ({ n: p.name, sub: p.sub, fin: PA(p, 'FIN') })) } : null;
  const r = Core.finishMine(); $('#match').classList.remove('on'); lockOrient('portrait'); S.matchOpen = false; MV = null; save(); try { if (G0().mode === 'mgr' && !G0().wc && !G0().mgr.sacked) { const pr = Core.mgrPressGen(); if (pr && (pr.derby || Math.random() < 0.5)) { S.modalKind = 'press'; S.modal = pressModal(); } } } catch (e) {}
  const rt = r.rating ? ` · 평점 ${f1(r.rating)}` : ''; { const wl = G0().wcLast; if (wl && snap) { render(); etShow(etBuild(snap, wl, r.res)); return; } toast(wl ? `종료 ${r.res.gh}-${r.res.ga} · ${wl.pen ? '연장 ' + wl.et.join(':') + ' 후 승부차기 ' : '연장전 ' + wl.et.join(':') + ' · '}${Core.clubOf(wl.w).name} 승` : `종료 ${r.res.gh}-${r.res.ga}${rt}`); } render();
}
// ---------- 렌더 ----------
// ===================== 감독 모드 화면 =====================
const isM = () => { try { return !!(Core.G && Core.G.mode === 'mgr'); } catch (e) { return false; } };
const MNAV = [['home', '홈'], ['squad', '선수단'], ['mtac', '전술'], ['mkt', '이적'], ['mclub', '구단'], ['league', '순위']];
const POSL = ['ALL', 'GK', 'CB', 'FB', 'DM', 'CM', 'AM', 'W', 'ST'];
const roleNm = (id) => { const R = Core.Eng.ROLES[id]; return R ? R.name : (id || '-'); };
function modeView() {
  return `<div class="top"><div>${pixLogo(92)}</div><div class="dim">블록 풋볼매니저</div></div><div class="body"><div class="dim">어떤 길로 시작할까요? 나라·리그(월드) 선택은 다음 단계입니다.</div>
  <div class="card lnk modec" data-act="mode" data-id="player"><div><div class="mi">⚽</div><b>선수 육성 모드</b><div class="dim">유스·신인에서 출발해 훈련과 경기 속 선택으로 한 명의 선수를 월드클래스로 키웁니다.</div></div></div>
  <div class="card lnk modec" data-act="mode" data-id="mgr"><div><div class="mi">📋</div><b>감독 모드</b><div class="dim">구단을 맡아 선발·포메이션·역할·팀 지시를 직접 정하고, 이적 시장과 이사회 신임을 관리하며 시즌 목표에 도전합니다. 경기는 직접 관전하거나 요약으로 빠르게 진행할 수 있습니다.</div></div></div>
  <div class="card lnk modec" data-act="mode" data-id="wc"><div><div class="mi">🌍</div><b>월드컵 모드</b><div class="dim">48개국 중 한 나라의 감독이 되어 조별리그부터 결승까지 한 대회를 치릅니다. 선발·전술·교체를 직접 정하고, 우승에 도전하세요. 월드 생성 없이 바로 시작합니다.</div></div></div>
  ${Object.keys(S.slots || {}).length ? `<div class="sec">저장된 게임 불러오기</div>${slotRows(false)}` : ''}</div>`;
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
  const board = `<div class="card"><div class="row"><b>이사회 신임</b><span class="tag ${bd < 35 ? 'warn' : ''}">${bt}</span></div><div class="mbar"><i style="width:${bd}%;background:${bc}"></i></div><div class="row"><span class="dim">시즌 목표</span><b>${g.target}위 이내</b></div><div class="row"><span class="dim">현재 순위</span><b style="color:${ontrack ? '#C6F36B' : '#FFB27A'}">${st ? st.rank + '위 / ' + st.n + '팀 · ' + st.pts + '점 (' + st.p + '경기)' : '-'}</b></div></div>`;
  let nx = '';
  if (G.pendingMine) nx = `<div class="card gl"><b>오늘은 경기일입니다</b><div class="dim">${esc(Core.clubOf(G.pendingMine.h).name)} vs ${esc(Core.clubOf(G.pendingMine.a).name)}</div><button class="btn wide" data-act="mpre">경기 준비 ⚽</button></div>`;
  else if (nf) { const h = Core.clubOf(nf.h), a = Core.clubOf(nf.a), d = nf.day - G.day, op = nf.h === m.club ? a : h; nx = `<div class="card"><div class="row"><span class="dim">다음 경기 · ${Core.fmtDate(nf.day)} ${d === 0 ? '· 오늘' : '· D-' + d}</span><span class="tag">${(Core.rivalOf(c) === op.id) ? '🔥 라이벌전 · ' : ''}${esc(nf.label)}</span></div><div class="vs"><div>${crest(h, 30)}<div>${esc(h.name)}</div></div><b>vs</b><div>${crest(a, 30)}<div>${esc(a.name)}</div></div></div><div class="dim">상대 전력 ${Math.round(op.strength)} · 우리 ${Math.round(c.strength)}</div></div>`; }
  const inj = L.injured.length ? `<div class="card warn"><b>부상자 ${L.injured.length}명</b><div class="dim">${L.injured.slice(0, 6).map(p => esc(p.name) + '(' + p.inj + '일)').join(' · ')}</div></div>` : '';
  const news = G.news.filter(n => n.me).slice(0, 5).map(n => `<div class="li"><span class="dim">${Core.fmtDate(n.d).slice(5, 10)}</span> ${esc(n.text)}</div>`).join('') || '<div class="dim">아직 소식이 없습니다.</div>';
  const hist = g.seasons.length ? `<div class="sec">지난 시즌</div><div class="card">${g.seasons.slice(-5).reverse().map(s => `<div class="li">${esc(s.season)} · ${esc(s.club)} ${s.rank}위 <span class="tag ${s.ok ? '' : 'warn'}">${s.ok ? '목표 달성' : '미달'}</span></div>`).join('')}</div>` : '';
  return mgrTop() + `<div class="body">${board}${nx}<div class="tiles">${tile('예산', g.cash + '억', '이적 자금')}${tile('전적', g.w + '-' + g.d + '-' + g.l, '승-무-패')}${tile('선수단', sq.length + '명', '16~30')}${tile('전력', Math.round(c.strength), '1부 평균 비교')}</div>${inj}
  <div class="sec">구단 소식 <span class="dim" data-act="tab" data-id="news" style="float:right">전체 ›</span></div><div class="card">${news}</div>${hist}</div>`;
}
function mgrSquadView() {
  const sq = Core.mgrSquad(), L = Core.mgrLineup(), xi = new Set(L.slots.map(e => e.p.id)), f = S.sqf || 'ALL';
  const list = sq.filter(p => f === 'ALL' || p.sub === f).sort((a, b) => b.ovr - a.ovr);
  const chips = `<div class="chips">${POSL.map(k => `<button class="chip ${f === k ? 'on' : ''}" data-act="sqf" data-id="${k}">${k === 'ALL' ? '전체' : k}</button>`).join('')}</div>`;
  const rows = list.map(p => `<div class="card sqr" data-act="pl" data-id="${p.id}"><span class="tag pos">${p.sub}</span><div class="grow"><b>${esc(p.name)}</b>${xi.has(p.id) ? ' <span class="tag">선발</span>' : ''}${p.inj > 0 ? ` <span class="tag warn">부상 ${p.inj}일</span>` : ''}<div class="dim">${p.age}세 · ${Core.NATK(p.nat)} · 계약 ${p.ct ? p.ct.until : '-'} · 가치 ${Core.mgrValue(p)}억</div></div><b class="ovr">${p.ovr}</b>${isW() ? '' : `<button class="btn sec sm" data-act="msell" data-id="${p.id}">${S.sellArm === p.id ? '확정?' : '매각'}</button>`}</div>`).join('');
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
  return mgrTop() + `<div class="body">${fans}${rivalCard}${hall}${spons}${fin}${stf}</div>`;
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
function matchTitleUI(ctx) { try { return compLabel(ctx); } catch (e) { return '경기'; } }
// ----- 경기 중 감독 패널 -----
function mgrPanelHTML(M) {
  const t = M.mine.tactic, left = 5 - (M.mgrSubs || 0), chg = Math.max(0, 3 - (M.mgrChanges || 0));
  const ins = Object.keys(INSTR_L).map(k => `<div class="inrow"><span class="dim">${INSTR_L[k][0]}</span><div class="seg">${INSTR_L[k][1].map((n, v) => `<button class="${(t[k] == null ? 1 : t[k]) === v ? 'on' : ''}" data-act="mpinstr" data-k="${k}" data-id="${v}">${n}</button>`).join('')}</div></div>`).join('');
  const st = MV.mst.map(p => `<div class="sqr mini ${S.mpout === p.id ? 'on' : ''}" data-act="mpout" data-id="${p.id}"><span class="tag pos">${p.sub}</span><div class="grow">${esc(p.name)}</div><b>${p.ovr}</b></div>`).join('');
  const bn = (M.benchMine || []).slice().sort((a, b) => b.ovr - a.ovr).map(p => `<div class="sqr mini" data-act="mpin" data-id="${p.id}"><span class="tag pos">${p.sub}</span><div class="grow">${esc(p.name)}</div><b>${p.ovr}</b></div>`).join('');
  return `<div class="card gl"><b>전술·교체</b><div class="dim">경기 일시정지 중 · 교체 ${left}회 남음 · 전술 반영 ${chg}회 남음${MV.min >= 88 ? ' · 종료 직전이라 효과가 거의 없습니다' : ''}</div></div><div class="sec">팀 지시</div><div class="card">${ins}</div>
  <div class="sec">교체 <span class="dim">나갈 선수 → 들어올 선수 순서로 탭</span></div><div class="card"><div class="dim">그라운드</div>${st}</div><div class="card"><div class="dim">벤치</div>${bn || '<div class="dim">벤치 선수가 없습니다.</div>'}</div>`;
}
function mgrPanelOpen() {
  if (!MV || MV.over || !G0().mm || MV.pg || MV.lead || MV.sp || MV.momentOpen || MV.mgrPanel) { if (MV && !MV.over) toast('잠시 후에 열 수 있습니다'); return; }
  MV.mgrPanel = true; MV.mgrPrev = MV.paused; MV.paused = true; MV.mgrDirty = false; S.mpout = null; renderMatch();
}
function mgrPanelClose() {
  if (!MV || !MV.mgrPanel) return; const M = G0().mm;
  if (MV.mgrDirty && M) { if ((M.mgrChanges || 0) < 3) { Core.mgrReplan(MV.min); if (MV.fxy) MV.fxy.m = fpos(MV.mst, (M.mine.tactic && M.mine.tactic.formation) || '4-4-2'); M.mgrChanges = (M.mgrChanges || 0) + 1; MV.log.unshift({ min: MV.min, ic: '📋', cls: '', t: '<b>감독 지시</b> 전술을 조정했습니다' }); } else MV.log.unshift({ min: MV.min, ic: '📋', cls: '', t: '전술 변경 한도를 넘어 효과가 반영되지 않습니다' }); }
  MV.mgrPanel = false; MV.mgrDirty = false; MV.paused = (MV.mgrPrev === true) || !!MV.talk; renderMatch();
}
function mgrSubUI(outId, inId) {
  const M = G0().mm, r = Core.mgrSub(outId, inId, MV.min); if (!r) { toast('교체할 수 없습니다 (5회 한도)'); return; }
  const i = MV.mst.findIndex(p => p.id === outId); if (i >= 0) MV.mst[i] = r.inn;
  MV.mgrDirty = true; MV.log.unshift({ min: MV.min, ic: IC.swap, cls: '', t: `교체 — ${esc(r.inn.name)} IN / ${esc(r.out.name)} OUT` });
  const pb = $('#pitchbox'); if (pb) { pb.innerHTML = pitchHTML(M); MV.els = null; } S.mpout = null; renderMatch();
}

const NAV = [['home','홈'],['me','내 선수'],['ctr','이적'],['league','순위·대회'],['news','뉴스']];
function navBadge(id) { try { const m = Core.me(); if (id==='home') return m.meet ? '●' : ''; if (id==='ctr') return (m.offers.length || m.pending || m.renewal) ? '●' : ''; } catch (e) {} return ''; }
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
  try { if (S.welcome && S.step === 'game' && !S.busy && !S.matchOpen) { const w = S.welcome; S.welcome = null; setTimeout(() => popup('게임 시작!', w==='start' ? '선수 육성 모드가 시작되었습니다.\n아래 ‘진행’ 버튼으로 하루씩 보내며 훈련하고, 경기 일정에 맞춰 컨디션을 관리하세요.' : w==='mstart' ? '감독 모드가 시작되었습니다.\n구단 탭에서 스폰서·스태프를, 전술 탭에서 포메이션을 먼저 살펴보세요.' : '월드컵 모드가 시작되었습니다.\n조별리그를 통과해 결승 트로피를 노려보세요!', '🎉'), 250); } } catch (e) {}
  try { const g0 = G0(); if (g0 && g0.cer && !S.modal && !S.matchOpen && !S.busy && S.step === 'game') { S.modalKind = 'cer'; S.modal = cerModal(); sfx('trophy'); } } catch (e) {}
  if (S.step==='setup' || S.step==='create' || S.step==='mode' || S.step==='mcreate' || S.step==='wcsel' || S.step==='wcsquad') {
    const o0 = document.querySelector('.scr'); const k0 = S.step + '|' + (S.step==='setup' ? (S.sel ? 'x' : '') : '') ; const t0 = (o0 && S._sk === k0) ? o0.scrollTop : 0;
    app.innerHTML = `<div class="scr">${S.step==='wcsquad' ? wcSquadView() : S.step==='mode' ? modeView() : S.step==='mcreate' ? mcreateView() : S.step==='wcsel' ? wcselView() : S.step==='setup' ? setupView() : creatorView()}</div>`;
    const n0 = document.querySelector('.scr'); if (n0 && t0) n0.scrollTop = t0; S._sk = k0; S.modal = null; S.modalKind = null; $('#modal').style.display = 'none'; return;
  }
  const oldSc = document.querySelector('.scr'); const keyNow = S.step + '|' + S.tab; const keepTop = (oldSc && S._sk === keyNow) ? oldSc.scrollTop : 0;
  const MG = isM();
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
function toast(t) { const el = $('#toast'); el.textContent = t; el.style.opacity = 1; setTimeout(() => el.style.opacity = 0, 2200); }
function actBar() {
  if (isM()) { const G = G0(); let ev = null; try { ev = Core.nextEvent(); } catch (e) {} const mt = ev && ev.match; const dd = (n) => n <= 0 ? '오늘' : n === 1 ? '내일' : n + '일 뒤'; const info = G.pendingMine ? '오늘은 경기일입니다' : mt ? `다음 경기 · ${dd(mt.days)} ${mt.home ? 'vs' : '@'} ${esc(mt.opp)}` : '예정된 경기가 없습니다'; const go = G.pendingMine ? '경기 준비 ⚽' : (mt && mt.days === 1 ? '경기 시작 ⚽' : '계속 ▶');
    const open = S.skipOpen ? `<div class="skiprow"><button class="chip" data-act="skip" data-id="7">일주일</button><button class="chip" data-act="skip" data-id="30">한 달</button><button class="chip" data-act="skip" data-id="200">다음 경기까지</button></div>` : '';
    return `<div class="act"><div class="actinfo">${info}</div>${open}<div class="actrow"><button class="btn big" data-act="go">${go}</button><button class="btn sec skp ${S.skipOpen?'on':''}" data-act="skipm" aria-label="건너뛰기 메뉴">⏩</button></div></div>`; }
  let ev = null; try { ev = Core.nextEvent(); } catch (e) {} const mt = ev && ev.match, mv = ev && ev.move, m = Core.me();
  const dd = (n) => n <= 0 ? '오늘' : n === 1 ? '내일' : n + '일 뒤';
  const md = (day) => { const t = Core.dateOf(day); return `${t.m}/${t.d}`; };
  const info = m.meet ? '감독 면담 요청이 있습니다' : m.offers.length ? `이적 제안 ${m.offers.length}건 — 확인하세요` : mt ? `다음 경기 · ${dd(mt.days)} (${md(mt.day)}) ${mt.home ? 'vs' : '@'} ${esc(mt.opp)}` : mv ? `${esc(mv.club)} 합류 ${dd(mv.days)}` : '예정된 경기가 없습니다';
  const sub = mv && mt && mv.days < mt.days ? ` · ${esc(mv.club)} 합류 ${dd(mv.days)}` : '';
  const go = mt && mt.days === 1 && !m.meet && !m.offers.length ? '경기 시작 ⚽' : '계속 ▶';
  const open = S.skipOpen ? `<div class="skiprow"><button class="chip" data-act="skip" data-id="7">일주일</button><button class="chip" data-act="skip" data-id="30">한 달</button><button class="chip" data-act="skip" data-id="200">다음 경기까지</button></div>` : '';
  return `<div class="act"><div class="actinfo">${info}${sub}</div>${open}<div class="actrow"><button class="btn big" data-act="go">${go}</button><button class="btn sec skp ${S.skipOpen?'on':''}" data-act="skipm" aria-label="건너뛰기 메뉴">⏩</button></div></div>`;
}
function advance(days) {
  let stopped = null;
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
  const t = e.target.closest('[data-act]'); if (!t || S.busy) return; const a = t.dataset.act, id = t.dataset.id; if (SND.bgm && !SND.tm) bgmApply(); if (a !== 'snd') sfx('click');
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
  if (a==='mpinstr') { Core.mgrSetInstr(t.dataset.k, +id); if (MV) MV.mgrDirty = true; renderMatch(); return; }
  if (a==='mpout') { S.mpout = (S.mpout === +id) ? null : +id; renderMatch(); return; }
  if (a==='mpin') { if (S.mpout == null) { toast('먼저 나갈 선수를 탭하세요'); return; } mgrSubUI(S.mpout, +id); return; }
  if (a==='sel') { const i = S.sel.indexOf(id); if (i>=0) S.sel.splice(i,1); else if (S.sel.length<10) S.sel.push(id); else toast('최대 10개국입니다'); render(); return; }
  if (a==='world') { if (S.sel.length) makeWorld(); return; }
  if (a==='cr') { const nm = $('#nm'); if (nm) S.cr.name = nm.value; S.cr[t.dataset.k] = id; if (t.dataset.k==='pos') S.cr.prefs = []; if (t.dataset.k==='cc' || t.dataset.k==='stage') { S.cr.home = ''; S.cr.club = null; S.cr.mclub = null; } if (t.dataset.k==='cc' && !S.cr.natTouched) S.cr.nat = id; render(); return; }
  if (a==='start') { const nm = $('#nm'); const name = (nm && nm.value.trim()) || '양메시'; fixCreator(); Core.createMe({ name, h: S.cr.h, prefs: (S.cr.prefs||[]).filter(k => (Core.PREF_POS[S.cr.pos]||[]).includes(k)), trait: S.cr.trait, pos: S.cr.pos, club: S.cr.club, nat: S.cr.nat, age: S.cr.stage==='youth'?15:19, look: { skin:S.cr.skin, hair:S.cr.hair, style:S.cr.style } }); S.step = 'game'; S.lc = null; S.ld = null; save(); render(); return; }
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
  else if (a==='club') { S.modal = clubModal(+id); }
  else if (a==='cmt') { S.cmt = id; S.modal = clubModal(S.cmid); }
  else if (a==='close') { S.modal = null; S.modalKind = null; if (G0() && G0().cer) G0().cer = null; save(); }
  else if (a==='cerpress') { const g0 = G0(); Core.mgrCerPress(); g0.cer = null; S.modalKind = 'press'; S.modal = pressModal(); }
  else if (a==='mprepress') { const g0 = G0(); Core.mgrPreGen(); Core.mgrX().preDay = g0.day; S.modalKind = 'press'; S.modal = pressModal(); }
  else if (a==='msponsor') { const [sl, ix] = id.split(':'); const r = Core.mgrSponsorSign(sl, +ix); toast(r.msg); if (r.ok) sfx('coin'); save(); }
  else if (a==='rnopen') { const [k, i] = id.split(':'); S.rn = { k, i: +i, back: S.modal, bk: S.modalKind }; const cur = k === 'p' ? G0().players[+i].name : Core.clubOf(+i).name; S.modalKind = 'rename'; S.modal = `<div class="ttl">이름 변경</div><div class="dim">${k === 'p' ? '선수' : '구단'} 이름을 직접 바꿀 수 있습니다 (최대 ${k === 'p' ? 14 : 16}자).</div><input id="rnv" class="inp" maxlength="16" value="${esc(cur)}" style="width:100%;margin:10px 0"><div class="row g8"><button class="btn grow" data-act="rnsave">저장</button><button class="btn sec grow" data-act="rncancel">취소</button></div>`; }
  else if (a==='rnsave') { const v = $('#rnv') && $('#rnv').value, r = S.rn; if (r) { const ok = r.k === 'p' ? Core.renamePlayer(r.i, v) : Core.renameClub(r.i, v); if (ok) popup('이름 변경', '이름을 바꿨습니다.', '✏️', 1800); else popup('이름 변경', '이름을 입력해 주세요.', '✏️'); if (ok) { S.modal = r.k === 'p' ? profileHTML(G0().players[r.i]) : clubModal(r.i); S.modalKind = r.k === 'p' ? null : 'club'; S.rn = null; save(); } } }
  else if (a==='rncancel') { const r = S.rn; S.modal = r ? r.back : null; S.modalKind = r ? r.bk : null; S.rn = null; }
  else if (a==='mstaff') { const r = Core.mgrStaffUp(id); toast(r.msg); if (r.ok) sfx('coin'); save(); }
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
  else if (a==='mv') { if (!MV || !G0().mm || !MV.momentOpen) return; const M = G0().mm, mo = MV.momentOpen; const r = Core.resolveMoment(id); if (r.goal || r.assist) { MV.ballFree = false; } MV.log.unshift({ min: MV.min, ic: IC.target, cls: '', t: esc(r.text) }); MV.momentOpen = null; MV.paused = false; try { playOutcome(M, mo, r); } catch (e) { MV.holder = MV.holder || null; } stepBall(M); emitAt(M, mo ? mo.min : MV.min, true); movePitch(); renderMatch(); return; }
  else if (a==='fs') { try { localStorage.setItem('bfm_fs', String(+id)); } catch (e) {} fsApply(); render(); { const f = FS_OPT.find(x => String(x[0]) === String(id)); popup('글자·버튼 크기', `‘${f ? f[1] : id}’ 크기로 바꿨습니다.`, '🔠', 1800); } return; }
  else if (a==='talk') { if (!MV || !MV.talk) return; const r = (G0().mm && G0().mm.role === 'mgr') ? Core.mgrTalkPick(id, MV.talkDiff || 0) : Core.talkPick(id); MV.log.unshift({ min: 45, ic: '💬', cls: '', t: `<b>하프타임</b> ${esc(r.text)}` }); MV.talk = null; setTimeout(startSecond, 600); renderMatch(); return; }
  else if (a==='mtab') { S.mtab = id; renderMatch(); return; }
  else if (a==='mvm') { S.vm = id; try { localStorage.setItem('bfm_vm', id); } catch (e) {} if (MV) { MV.hl = id === 'hl'; if (!MV.hl) MV.hlFast = false; MV.speed = -1; hlSync(); renderMatch(); } return; }
  else if (a==='mspd') { S.spd = +id; try { localStorage.setItem('bfm_spd', String(S.spd)); } catch (e) {} if (MV) { MV.speed = spdMs(); if (MV.timer && !MV.skipping && !MV.over) { clearInterval(MV.timer); MV.timer = setInterval(tick, MV.speed); } hlSync(); renderMatch(); } return; }
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
function pixLogo(w) { return `<svg class="pixlogo" width="${w}" height="${Math.round(w*7.6/17.8)}" viewBox="-0.2 -0.2 17.8 7.6" shape-rendering="crispEdges" aria-label="BFM"><g fill="#0B110E" transform="translate(.4 .4)">${PIXR}</g><g fill="#0B110E" stroke="#0B110E" stroke-width=".3">${PIXR}</g><g fill="#C6F36B">${PIXR}</g></svg>`; }
function splashView() {
  const L = [[{ skin: 'tan', hair: 'black', style: 'short' }, ['#CD2E3A', '#FFFFFF']], [{ skin: 'fair', hair: 'blond', style: 'sidepart' }, ['#1F3A93', '#FFFFFF']], [{ skin: 'brown', hair: 'dark', style: 'curly' }, ['#F7D117', '#009739']], [{ skin: 'olive', hair: 'brown', style: 'long' }, ['#75AADB', '#FFFFFF']], [{ skin: 'deep', hair: 'black', style: 'buzz' }, ['#0B8F4D', '#F7D117']]];
  const team = L.map(([lk, kit], i) => `<span class="spr spl-c" style="animation-delay:${i * 0.12}s;width:44px;height:94px;background-image:url(${sprite(lk, kit)})"></span>`).join('');
  return `<div class="ldg spl"><div class="ldg-grass"></div><div class="spl-top">${pixLogo(250)}</div><div class="spl-sub">블록 풋볼매니저</div><div class="spl-sub2">선수 육성 · 감독 · 월드컵</div><div class="spl-team">${team}</div><div class="ldg-bar"><i class="spl-bar"></i></div><div class="ldg-st">불러오는 중…</div></div>`;
}
async function boot() {
  $('#app').innerHTML = splashView(); const t0 = Date.now();
  refreshSlots0();
  const ok = await loadSave();
  { const w = 1900 - (Date.now() - t0); if (w > 0) await new Promise(r => setTimeout(r, w)); }
  if (ok) { S.step = 'game'; render(); if (G0().pendingMine) setTimeout(startMatch, 50); }
  else { S.step = 'mode'; render(); }
}
boot();

window.addEventListener('error', (e) => { try { toast('오류: ' + (e.message || '알 수 없음') + (e.lineno ? ' (' + e.lineno + ')' : '')); } catch (e2) {} });
window.addEventListener('unhandledrejection', (e) => { try { toast('오류: ' + String(e.reason && e.reason.message || e.reason)); } catch (e2) {} });

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
