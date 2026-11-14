'use strict';
/*
 * 전술 엔진 v2 — 상세 능력치 · 역할 궁합 · 채널형 경기 모델
 *
 *  선수 20개 상세 능력치(GK 5개) → 12개 "능력"(조합값) → 역할(Role)이 능력별 기여도를 결정
 *  → 라인업(헝가리안 배정) → 팀 프로필(11개 채널 값) → 채널별 찬스 모델(측면/중앙/직선/역습/세트피스)
 *  기대값 모드(evalMatch): 난수 없이 즉시 계산 → 학습/탐색용
 *  시뮬 모드(simulate)  : 같은 모델을 분 단위로 샘플링 → 실제 경기용
 */

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ───────────── 능력치 ─────────────
const AT = ['FIN', 'PAS', 'CRS', 'DRI', 'TEC', 'HEA', 'TAK', 'MAR', 'VIS', 'OTB', 'POS', 'DEC', 'COM', 'WOR', 'AGG', 'PAC', 'STA', 'STR', 'AGI', 'JUM'];
const AT_KO = { FIN: '결정력', PAS: '패스', CRS: '크로스', DRI: '드리블', TEC: '테크닉', HEA: '헤딩', TAK: '태클', MAR: '대인수비', VIS: '시야', OTB: '오프더볼', POS: '위치선정', DEC: '판단력', COM: '침착성', WOR: '활동량', AGG: '적극성', PAC: '속력', STA: '지구력', STR: '근력', AGI: '민첩성', JUM: '점프력' };
const GK_AT = ['REF', 'HAN', 'KIC', 'AER', 'DEC'];

// 채널 키: 공격 5 · 수비 4 · 운영 2
const K = ['wing', 'cen', 'dir', 'cnt', 'fin', 'dW', 'dC', 'dA', 'rst', 'bld', 'prs'];
const KI = {}; K.forEach((k, i) => (KI[k] = i));
const KO = { wing: '측면 공격', cen: '중앙 창의', dir: '직선(타깃) 플레이', cnt: '역습', fin: '마무리', dW: '측면 수비', dC: '중앙 수비', dA: '공중볼', rst: '후방 커버', bld: '빌드업', prs: '압박' };

function abilitiesOf(p) {
  const a = p.a;
  if (p.sub === 'GK') {
    return { sav: 0.4 * a.REF + 0.3 * a.HAN + 0.15 * a.AER + 0.15 * a.DEC, wing: 0, cen: 0, dir: 0.6 * a.KIC + 0.4 * a.DEC, cnt: 0, fin: 0, dW: 0, dC: 0, dA: 0.6 * a.AER + 0.4 * a.HAN, rst: 0.5 * a.AER + 0.3 * a.DEC + 0.2 * a.REF, bld: 0.6 * a.KIC + 0.4 * a.DEC, prs: 0 };
  }
  return {
    sav: 0,
    wing: 0.30 * a.CRS + 0.28 * a.DRI + 0.22 * a.PAC + 0.12 * a.TEC + 0.08 * a.STA,
    cen: 0.32 * a.VIS + 0.24 * a.PAS + 0.18 * a.TEC + 0.14 * a.OTB + 0.12 * a.DRI,
    dir: 0.26 * a.STR + 0.24 * a.HEA + 0.14 * a.JUM + 0.14 * a.TEC + 0.12 * a.FIN + 0.10 * a.OTB,
    cnt: 0.42 * a.PAC + 0.20 * a.AGI + 0.16 * a.DRI + 0.12 * a.FIN + 0.10 * a.OTB,
    fin: 0.50 * a.FIN + 0.14 * a.COM + 0.14 * a.OTB + 0.10 * a.HEA + 0.07 * a.TEC + 0.05 * a.DEC,
    dW: 0.28 * a.TAK + 0.22 * a.PAC + 0.20 * a.POS + 0.12 * a.WOR + 0.10 * a.STA + 0.08 * a.MAR,
    dC: 0.30 * a.MAR + 0.24 * a.TAK + 0.20 * a.POS + 0.12 * a.DEC + 0.08 * a.STR + 0.06 * a.COM,
    dA: 0.40 * a.HEA + 0.30 * a.JUM + 0.30 * a.STR,
    rst: 0.36 * a.PAC + 0.26 * a.POS + 0.18 * a.DEC + 0.12 * a.MAR + 0.08 * a.AGI,
    bld: 0.34 * a.PAS + 0.20 * a.TEC + 0.16 * a.VIS + 0.14 * a.DEC + 0.16 * a.COM,
    prs: 0.30 * a.WOR + 0.24 * a.STA + 0.20 * a.AGG + 0.14 * a.PAC + 0.12 * a.TAK
  };
}

// ───────────── 역할 ─────────────
//                       wing cen  dir  cnt  fin  dW   dC   dA   rst  bld  prs
// 모든 필드 역할의 기여도 총합을 같게(2.6) 맞춤 → 선수 1명이 낼 수 있는 총량이 같고, 어디에 쓰느냐(공격/수비/운영)만 달라짐
const R = (name, slots, v) => { let sum = 0; for (const x of v) sum += x; const f = slots[0] === 'GK' ? 1 : 2.6 / sum; return { name, slots, inv: Float64Array.from(v, (x) => x * f) }; };
const ROLES = {
  gk_trad:  R('전통형 골키퍼', ['GK'], [0, 0, 0.1, 0, 0, 0, 0, 0, 0.3, 0.2, 0]),
  gk_sweep: R('스위퍼 키퍼', ['GK'], [0, 0, 0.3, 0, 0, 0, 0, 0, 0.8, 0.6, 0]),
  cb_stop:  R('스토퍼', ['CB'], [0, 0, 0, 0, 0, 0, 1.0, 0.9, 0.6, 0.15, 0.3]),
  cb_cover: R('커버 센터백', ['CB'], [0, 0, 0, 0, 0, 0, 1.0, 0.8, 1.0, 0.2, 0]),
  cb_bp:    R('볼 플레잉 센터백', ['CB'], [0, 0, 0.15, 0, 0, 0, 0.85, 0.7, 0.8, 0.8, 0]),
  fb_def:   R('수비형 풀백', ['FB'], [0.15, 0, 0, 0, 0, 1.0, 0.3, 0.3, 0.6, 0.2, 0.3]),
  fb_att:   R('윙백(공격형 풀백)', ['FB'], [0.7, 0.1, 0, 0.25, 0, 0.6, 0, 0, 0.3, 0.35, 0.35]),
  fb_inv:   R('인버티드 풀백', ['FB'], [0, 0.25, 0, 0, 0, 0.5, 0.5, 0, 0.5, 0.7, 0.2]),
  dm_anchor:R('앵커', ['DM'], [0, 0, 0, 0, 0, 0, 0.9, 0.3, 0.9, 0.35, 0.5]),
  dm_dlp:   R('딥라잉 플레이메이커', ['DM'], [0, 0.5, 0.2, 0, 0, 0, 0.35, 0.1, 0.35, 1.0, 0]),
  dm_bwm:   R('볼 위너', ['DM'], [0, 0, 0, 0, 0, 0.4, 0.6, 0, 0.5, 0.2, 1.0]),
  cm_b2b:   R('박스 투 박스', ['CM'], [0, 0.45, 0, 0.35, 0.2, 0.2, 0.35, 0, 0.2, 0.5, 0.8]),
  cm_pm:    R('플레이메이커', ['CM'], [0, 0.9, 0.15, 0, 0.1, 0, 0.15, 0, 0, 0.85, 0]),
  cm_dest:  R('디스트로이어', ['CM'], [0, 0, 0, 0, 0, 0.3, 0.55, 0, 0.4, 0.3, 0.8]),
  cm_mez:   R('메짜알라', ['CM'], [0.35, 0.55, 0, 0.3, 0.2, 0.2, 0, 0, 0, 0.45, 0.4]),
  am_tre:   R('트레콰르티스타', ['AM'], [0, 1.0, 0.1, 0, 0.4, 0, 0, 0, 0, 0.4, 0.2]),
  am_sh:    R('섀도 스트라이커', ['AM', 'ST'], [0, 0.5, 0, 0.5, 0.8, 0, 0, 0, 0, 0, 0.35]),
  am_hs:    R('하프스페이스 플레이메이커', ['AM'], [0.3, 0.7, 0, 0, 0.35, 0, 0, 0, 0, 0.3, 0.2]),
  w_wing:   R('전통 윙어', ['W'], [1.0, 0.0, 0, 0.5, 0.15, 0.25, 0, 0, 0, 0.15, 0.3]),
  w_if:     R('인사이드 포워드', ['W'], [0.55, 0.2, 0, 0.55, 0.75, 0.15, 0, 0, 0, 0, 0.3]),
  w_iw:     R('인버티드 윙어', ['W'], [0.4, 0.6, 0, 0.4, 0.35, 0.1, 0, 0, 0, 0.2, 0.3]),
  w_wm:     R('와이드 미드필더', ['W'], [0.6, 0.15, 0, 0, 0, 0.55, 0, 0, 0, 0.25, 0.5]),
  st_tgt:   R('타깃맨', ['ST'], [0, 0.1, 1.0, 0, 0.65, 0, 0, 0.35, 0, 0, 0.2]),
  st_poach: R('포처', ['ST'], [0, 0.05, 0, 0.55, 1.0, 0, 0, 0, 0, 0, 0.15]),
  st_comp:  R('컴플리트 포워드', ['ST'], [0, 0.4, 0.5, 0.45, 0.8, 0, 0, 0, 0, 0.25, 0.3]),
  st_f9:    R('폴스 나인', ['ST'], [0, 0.85, 0, 0.2, 0.45, 0, 0, 0, 0, 0.45, 0.3]),
  st_press: R('프레싱 포워드', ['ST'], [0, 0.15, 0.2, 0.5, 0.6, 0.1, 0, 0, 0, 0, 1.0])
};
const ROLE_IDS = Object.keys(ROLES);
const SLOT_ROLES = {};
for (const id of ROLE_IDS) for (const s of ROLES[id].slots) (SLOT_ROLES[s] = SLOT_ROLES[s] || []).push(id);

// 포지션 숙련도 (선수 주 포지션 → 슬롯)
const SUBS = ['GK', 'CB', 'FB', 'DM', 'CM', 'AM', 'W', 'ST'];
const FAM = {
  GK: { GK: 1, CB: 0.2, FB: 0.2, DM: 0.2, CM: 0.2, AM: 0.2, W: 0.2, ST: 0.2 },
  CB: { GK: 0.1, CB: 1, FB: 0.85, DM: 0.85, CM: 0.6, AM: 0.4, W: 0.35, ST: 0.3 },
  FB: { GK: 0.1, CB: 0.8, FB: 1, DM: 0.7, CM: 0.7, AM: 0.55, W: 0.85, ST: 0.4 },
  DM: { GK: 0.1, CB: 0.85, FB: 0.7, DM: 1, CM: 0.92, AM: 0.75, W: 0.55, ST: 0.4 },
  CM: { GK: 0.1, CB: 0.6, FB: 0.65, DM: 0.93, CM: 1, AM: 0.93, W: 0.8, ST: 0.55 },
  AM: { GK: 0.1, CB: 0.4, FB: 0.5, DM: 0.7, CM: 0.93, AM: 1, W: 0.92, ST: 0.85 },
  W:  { GK: 0.1, CB: 0.35, FB: 0.8, DM: 0.5, CM: 0.8, AM: 0.93, W: 1, ST: 0.85 },
  ST: { GK: 0.1, CB: 0.3, FB: 0.35, DM: 0.4, CM: 0.6, AM: 0.92, W: 0.9, ST: 1 }
};

// ───────────── 포메이션 ─────────────
const FORMATIONS = {
  '4-4-2':   ['GK', 'FB', 'CB', 'CB', 'FB', 'W', 'CM', 'CM', 'W', 'ST', 'ST'],
  '4-3-3':   ['GK', 'FB', 'CB', 'CB', 'FB', 'DM', 'CM', 'CM', 'W', 'ST', 'W'],
  '4-2-3-1': ['GK', 'FB', 'CB', 'CB', 'FB', 'DM', 'DM', 'W', 'AM', 'W', 'ST'],
  '4-1-4-1': ['GK', 'FB', 'CB', 'CB', 'FB', 'DM', 'W', 'CM', 'CM', 'W', 'ST'],
  '4-3-2-1': ['GK', 'FB', 'CB', 'CB', 'FB', 'CM', 'DM', 'CM', 'AM', 'AM', 'ST'],
  '4-4-1-1': ['GK', 'FB', 'CB', 'CB', 'FB', 'W', 'CM', 'CM', 'W', 'AM', 'ST'],
  '3-5-2':   ['GK', 'CB', 'CB', 'CB', 'FB', 'CM', 'DM', 'CM', 'FB', 'ST', 'ST'],
  '3-4-3':   ['GK', 'CB', 'CB', 'CB', 'FB', 'CM', 'CM', 'FB', 'W', 'ST', 'W'],
  '3-4-2-1': ['GK', 'CB', 'CB', 'CB', 'FB', 'CM', 'CM', 'FB', 'AM', 'AM', 'ST'],
  '5-3-2':   ['GK', 'FB', 'CB', 'CB', 'CB', 'FB', 'CM', 'DM', 'CM', 'ST', 'ST']
};
const FORM_IDS = Object.keys(FORMATIONS);

// ───────────── 전술 ─────────────
// 지시: width(0좁게~2넓게) build(0짧은 빌드업~2직선) line(0낮은~2높은 수비라인) press(0~2) tempo(0~2) ment(0수비~2공격) trans(0안정~2빠른 역습)
const INSTR = ['width', 'build', 'line', 'press', 'tempo', 'ment', 'trans'];
const INSTR_KO = { width: ['좁게', '보통', '넓게'], build: ['짧은 패스', '혼합', '롱볼/직선'], line: ['낮은 라인', '중간 라인', '높은 라인'], press: ['압박 낮음', '압박 중간', '압박 높음'], tempo: ['느린 템포', '보통', '빠른 템포'], ment: ['수비적', '균형', '공격적'], trans: ['안정 전환', '보통', '빠른 역습'] };
const defaultTactic = () => ({ formation: '4-4-2', width: 1, build: 1, line: 1, press: 1, tempo: 1, ment: 1, trans: 1 });
function needVec(t) {
  const W = t.width - 1, D = t.build - 1, L = t.line - 1, P = t.press - 1, X = t.trans - 1;
  const n = new Float64Array(11).fill(1);
  n[KI.wing] = 1 + 0.35 * W; n[KI.cen] = 1 - 0.2 * W - 0.15 * D; n[KI.dir] = 1 + 0.4 * D; n[KI.cnt] = 1 + 0.35 * X;
  n[KI.rst] = 1 + 0.25 * L; n[KI.bld] = 1 - 0.4 * D; n[KI.prs] = 1 + 0.4 * P;
  return n;
}
const NEUTRAL = new Float64Array(11).fill(1);

// ───────────── 상수 (검증 시뮬로 보정) ─────────────
const C = { EVENT_RATE: 0.27, K_Q: 14.0, GOAL_SENS: 3.2, B_WING: 0.033, B_CEN: 0.037, B_DIR: 0.030, B_CNT: 0.041, B_SP: 0.044, HOME_CTL: 1.07, HOME_ATK: 1.09, COUNTER: 0.022, SET_RATE: 0.045, TILT: 2.0 }
// 포메이션 기본 강도 보정: 자가대전 보정(balance.js)으로 '평균적으로 우월한 포메이션'이 없도록 맞춘 값. 스쿼드별 상성은 그대로 남김
const FORM_S = {'4-4-2':1.013,'4-3-3':0.988,'4-2-3-1':0.993,'4-1-4-1':0.988,'4-3-2-1':1.023,'4-4-1-1':1.004,'3-5-2':1.01,'3-4-3':0.969,'3-4-2-1':1.004,'5-3-2':1.01};;
const MENT_ATK = [0.93, 1.0, 1.07], MENT_DEF = [1.07, 1.0, 0.94], MENT_CTL = [0.97, 1.0, 1.02], TEMPO = [0.92, 1.0, 1.09], TRANS_M = [0.8, 1.0, 1.3];
const PHYS = { wing: 1, cnt: 1, prs: 1.6, dW: 1, rst: 1 };

// ───────────── 선수 생성 ─────────────
const TEMPL = {
  CB: { HEA: 7, JUM: 5, STR: 7, TAK: 6, MAR: 8, POS: 5, AGG: 3, DEC: 1, PAC: -3, AGI: -6, DRI: -16, FIN: -30, CRS: -26, VIS: -9, PAS: -6, TEC: -10, OTB: -30, WOR: 0, STA: 0, COM: 0 },
  FB: { PAC: 6, STA: 6, CRS: 3, TAK: 3, MAR: 2, WOR: 6, DRI: -4, PAS: -4, TEC: -5, AGI: 2, FIN: -22, HEA: -6, STR: -3, JUM: -4, VIS: -8, OTB: -12, DEC: -1, COM: -2, AGG: 0, POS: 0 },
  DM: { TAK: 6, MAR: 4, POS: 5, WOR: 5, STA: 3, PAS: 1, DEC: 3, AGG: 3, STR: 3, VIS: -2, TEC: -4, DRI: -8, FIN: -18, CRS: -12, HEA: 0, JUM: -1, PAC: -6, AGI: -5, OTB: -12, COM: 1 },
  CM: { PAS: 5, VIS: 3, TEC: 2, DEC: 3, WOR: 4, STA: 4, DRI: -1, FIN: -8, CRS: -5, HEA: -5, STR: -2, JUM: -4, PAC: -4, AGI: -2, OTB: -2, COM: 1, TAK: 0, MAR: -2, POS: 0, AGG: 0 },
  AM: { VIS: 7, PAS: 5, TEC: 6, DRI: 5, OTB: 4, FIN: 0, CRS: 0, COM: 2, DEC: 2, PAC: 0, AGI: 3, TAK: -20, MAR: -22, POS: -14, HEA: -10, STR: -10, JUM: -10, STA: -2, WOR: 0, AGG: -10 },
  W:  { PAC: 7, DRI: 7, CRS: 5, AGI: 5, TEC: 3, FIN: -2, OTB: 3, STA: 2, PAS: -2, VIS: -3, TAK: -22, MAR: -24, POS: -16, HEA: -14, STR: -10, JUM: -10, AGG: -10, DEC: -1, COM: 0, WOR: 0 },
  ST: { FIN: 8, OTB: 7, COM: 3, HEA: 2, STR: 3, JUM: 2, PAC: 2, DRI: -2, TEC: -2, PAS: -8, VIS: -8, CRS: -14, TAK: -24, MAR: -26, POS: -18, WOR: -2, STA: -2, AGG: -4, AGI: 0, DEC: 0 }
};
// 개성(플레이 스타일) 변형
const FLAVOR = {
  CB: [{ TAK: 4, AGG: 4, STR: 3, PAS: -4, VIS: -4 }, { PAS: 7, TEC: 6, VIS: 5, COM: 4, HEA: -4, STR: -3 }, { PAC: 6, POS: 5, DEC: 4, AGI: 3, STR: -3 }],
  FB: [{ TAK: 5, MAR: 4, POS: 3, CRS: -4, DRI: -3 }, { CRS: 6, DRI: 4, PAC: 3, TAK: -5, STA: 2 }, { PAS: 5, TEC: 4, VIS: 3, POS: 3, PAC: -3 }],
  DM: [{ POS: 5, MAR: 4, DEC: 3, PAS: -3 }, { PAS: 7, VIS: 6, TEC: 5, TAK: -4, STR: -3 }, { TAK: 4, AGG: 5, WOR: 4, STA: 4, PAS: -4 }],
  CM: [{ WOR: 6, STA: 6, TAK: 3, PAS: -2 }, { PAS: 6, VIS: 6, TEC: 4, WOR: -4, STA: -3 }, { DRI: 5, OTB: 4, FIN: 5, TAK: -4 }],
  AM: [{ VIS: 4, PAS: 4, FIN: -3 }, { FIN: 6, OTB: 5, VIS: -3 }, { DRI: 5, AGI: 4, PAC: 3, VIS: -3 }],
  W:  [{ CRS: 7, PAC: 3, FIN: -5 }, { FIN: 7, OTB: 5, CRS: -5 }, { VIS: 6, PAS: 6, TEC: 3, PAC: -4 }, { WOR: 7, STA: 5, TAK: 6, DRI: -3 }],
  ST: [{ STR: 8, HEA: 8, JUM: 6, PAC: -6, DRI: -4 }, { PAC: 5, OTB: 5, FIN: 3, STR: -6, HEA: -6 }, { VIS: 8, PAS: 8, TEC: 5, FIN: -5 }, { WOR: 8, STA: 6, AGG: 6, FIN: -3 }]
};
// 스쿼드 성향: 하위 포지션×능력치 가산 (한 팀이 특정 전술에 맞는 선수로 구성되도록)
const STYLE = {
  balanced: {},
  wide:    { W: { CRS: 6, PAC: 3 }, FB: { CRS: 5, PAC: 3, STA: 3 }, ST: { HEA: 6, STR: 5, JUM: 4 }, AM: { VIS: -2 }, CM: { PAS: -2 } },
  direct:  { ST: { STR: 9, HEA: 8, JUM: 6, FIN: 2 }, CB: { HEA: 5, STR: 4, JUM: 4 }, DM: { STR: 4, HEA: 3 }, W: { PAC: 3, CRS: -2 }, CM: { PAS: -4, VIS: -4 }, AM: { VIS: -4 } },
  tiki:    { CM: { PAS: 7, VIS: 7, TEC: 6, COM: 5 }, AM: { VIS: 5, PAS: 5, TEC: 5 }, DM: { PAS: 6, VIS: 5, TEC: 4 }, CB: { PAS: 5, TEC: 4, COM: 4, HEA: -3 }, ST: { OTB: 5, TEC: 4, STR: -4, HEA: -4 }, W: { TEC: 4, STR: -4 }, FB: { PAS: 4 } },
  counter: { W: { PAC: 7, AGI: 4, DRI: 3 }, ST: { PAC: 7, OTB: 4, STR: -2 }, CB: { PAC: 4, POS: 5, MAR: 3 }, DM: { TAK: 4, POS: 4, WOR: 3 }, CM: { PAS: -3, VIS: -3, WOR: 3 }, AM: { VIS: -3 } },
  press:   { CM: { WOR: 8, STA: 8, AGG: 6 }, W: { WOR: 8, STA: 7, AGG: 5, FIN: -2 }, ST: { WOR: 8, STA: 7, AGG: 6 }, FB: { WOR: 5, STA: 6, AGG: 4 }, DM: { WOR: 5, STA: 5, AGG: 5 }, CB: { PAC: 3, AGG: 3 } }
};
const STYLE_IDS = Object.keys(STYLE);

function makePlayer(r, id, sub, ovr, style, name) {
  const p = { id, name: name || ('선수' + id), sub, a: {}, cond: 92 + Math.floor(r() * 8), age: 20 + Math.floor(r() * 14) };
  if (sub === 'GK') {
    for (const k of GK_AT) p.a[k] = clamp(Math.round(ovr + gauss(r) * 4 + (k === 'REF' ? 2 : 0)), 25, 97);
  } else {
    const fl = FLAVOR[sub][Math.floor(r() * FLAVOR[sub].length)];
    const st = (STYLE[style] && STYLE[style][sub]) || {};
    for (const k of AT) p.a[k] = clamp(Math.round(ovr + (TEMPL[sub][k] || 0) + (fl[k] || 0) + (st[k] || 0) + gauss(r) * 3.5), 20, 97);
  }
  return finalize(p);
}
function finalize(p) { p.ab = abilitiesOf(p); p.ovr = Math.round(ovrOf(p)); return p; }
function ovrOf(p) { // 주 포지션에서 가장 잘 맞는 역할의 점수
  let best = 0;
  for (const id of SLOT_ROLES[p.sub] || []) best = Math.max(best, roleScore(p, ROLES[id], NEUTRAL));
  return best;
}
function roleScore(p, role, need) {
  if (role.slots[0] === 'GK') {
    if (p.sub !== 'GK') return 5;
    let s = 0, w = 0; for (let k = 0; k < 11; k++) { const x = role.inv[k] * need[k]; if (x) { s += x * p.ab[K[k]]; w += x; } }
    return 0.6 * p.ab.sav + 0.4 * (w ? s / w : 60);
  }
  if (p.sub === 'GK') return 5;
  let s = 0, w = 0;
  for (let k = 0; k < 11; k++) { const x = role.inv[k] * need[k]; if (x) { s += x * p.ab[K[k]]; w += x; } }
  return w ? s / w : 0;
}
function makeSquad(r, mean, style, idBase) {
  style = style || 'balanced';
  const plan = { GK: 2, CB: 4, FB: 4, DM: 2, CM: 3, AM: 2, W: 3, ST: 3 };
  const sq = []; let id = idBase || 0;
  for (const sub of SUBS) for (let i = 0; i < plan[sub]; i++) sq.push(makePlayer(r, id++, sub, mean + gauss(r) * 3 - i * 2.2, style));
  sq.id = Math.floor(r() * 1e9);
  return sq;
}

// ───────────── 라인업 (헝가리안 배정 + 역할 선택) ─────────────
function hungarian(cost, n, m) {
  const INF = 1e12, u = new Float64Array(n + 1), v = new Float64Array(m + 1), p = new Int32Array(m + 1), way = new Int32Array(m + 1);
  for (let i = 1; i <= n; i++) {
    p[0] = i; let j0 = 0; const minv = new Float64Array(m + 1).fill(INF), used = new Uint8Array(m + 1);
    do {
      used[j0] = 1; const i0 = p[j0]; let delta = INF, j1 = 0;
      for (let j = 1; j <= m; j++) if (!used[j]) {
        const cur = cost[i0][j] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= m; j++) { if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const ans = new Array(n + 1); for (let j = 1; j <= m; j++) if (p[j]) ans[p[j]] = j; return ans;
}
function slotScore(p, slot, need) {
  let best = 0; for (const id of SLOT_ROLES[slot]) best = Math.max(best, roleScore(p, ROLES[id], need));
  return best * (0.75 + 0.25 * FAM[p.sub][slot]);
}
function assignSlots(squad, formation) {
  squad._asg = squad._asg || {};
  if (squad._asg[formation]) return squad._asg[formation];
  const slots = FORMATIONS[formation], n = slots.length, m = squad.length;
  const cost = [null]; for (let i = 1; i <= n; i++) { const row = [0]; for (let j = 1; j <= m; j++) row.push(-slotScore(squad[j - 1], slots[i - 1], NEUTRAL)); cost.push(row); }
  const a = hungarian(cost, n, m);
  const res = slots.map((s, i) => ({ slot: s, player: squad[a[i + 1] - 1] }));
  squad._asg[formation] = res; return res;
}
let TYP = null;
function typicalAbilities() {
  TYP = {};
  for (const sub of SUBS) {
    if (sub === 'GK') { TYP.GK = abilitiesOf({ sub: 'GK', a: { REF: 65, HAN: 65, KIC: 65, AER: 65, DEC: 65 } }); continue; }
    const a = {}; for (const k of AT) a[k] = 65 + (TEMPL[sub][k] || 0);
    TYP[sub] = abilitiesOf({ sub, a });
  }
}
// 역할 선택: 절대 적합도 + (자기 포지션 평균 대비 특기가 얼마나 그 역할과 맞는가). 스트라이커가 전부 '포처'로 쏠리는 것을 막음
function pickRole(p, slot, need) {
  if (!TYP) typicalAbilities();
  let best = null, bs = -1e9; const typ = TYP[p.sub];
  for (const id of SLOT_ROLES[slot]) {
    const role = ROLES[id]; const abs = roleScore(p, role, need);
    let rel = 0, w = 0; for (let k = 0; k < 11; k++) { const x = role.inv[k] * need[k]; if (x) { rel += x * (p.ab[K[k]] - typ[K[k]]); w += x; } }
    const s = abs + (w ? 1.3 * rel / w : 0);
    if (s > bs) { bs = s; best = id; }
  }
  return best;
}
function buildLineup(squad, tactic, userRoles) {
  let asg = null;                                                              // 감독 지정 선발(tactic.xi): 포메이션 슬롯 순서의 선수 id
  if (tactic.xi && FORMATIONS[tactic.formation] && tactic.xi.length === FORMATIONS[tactic.formation].length) {
    const by = new Map(squad.map((p) => [p.id, p])), ps = tactic.xi.map((id) => by.get(id));
    if (ps.every(Boolean) && new Set(ps).size === ps.length) asg = FORMATIONS[tactic.formation].map((s, i) => ({ slot: s, player: ps[i] }));
  }
  if (!asg) asg = assignSlots(squad, tactic.formation);
  const need = needVec(tactic); userRoles = userRoles || tactic.roles;
  return asg.map((x, i) => {
    const role = (userRoles && userRoles[i]) || pickRole(x.player, x.slot, need);
    return { p: x.player, slot: x.slot, role, fam: 0.75 + 0.25 * FAM[x.player.sub][x.slot], stam: x.player.cond };
  });
}

// ───────────── 팀 프로필 ─────────────
let CREF = null;
function rawT(lineup) {
  const T = new Float64Array(11), Cp = new Float64Array(11); let gk = 60, staSum = 0, staN = 0;
  for (const e of lineup) {
    const role = ROLES[e.role], ab = e.p.ab, sf = 0.82 + 0.18 * e.stam / 100;
    if (e.slot === 'GK') gk = ab.sav * (0.9 + 0.1 * e.stam / 100); else { staSum += e.p.a.STA; staN++; }
    for (let k = 0; k < 11; k++) {
      const w = role.inv[k]; if (!w) continue;
      const kk = K[k]; T[k] += w * ab[kk] * e.fam * Math.pow(sf, PHYS[kk] || 0.35); Cp[k] += w;
    }
  }
  return { T, Cp, gk, sta: staN ? staSum / staN : 60 };
}
// 기준 용량: 평범한 4-4-2의 표준 역할 구성 (능력 65 선수라면 모든 채널이 65가 되도록)
function initCref() {
  const ids = ['gk_trad', 'fb_def', 'cb_cover', 'cb_stop', 'fb_att', 'w_wm', 'cm_b2b', 'cm_pm', 'w_wing', 'st_comp', 'st_poach'];
  CREF = new Float64Array(11);
  for (const id of ids) for (let k = 0; k < 11; k++) CREF[k] += ROLES[id].inv[k];
  for (let k = 0; k < 11; k++) CREF[k] = Math.max(0.3, CREF[k]);
}
function profile(lineup) {
  if (!CREF) initCref();
  const { T, Cp, gk, sta } = rawT(lineup), P = {};
  for (let k = 0; k < 11; k++) {
    if (K[k] === 'fin') { P.fin = Cp[k] ? T[k] / Cp[k] : 40; continue; }
    const ratio = clamp(T[k] / CREF[k] / 65, 0.6, 1.3);   // 용량×능력, 수확체감
    P[K[k]] = 65 * Math.pow(ratio, 0.85);
  }
  P.gk = gk; P.sta = sta; return P;
}
function teamStam(lineup) { let s = 0; for (const e of lineup) s += e.stam; return s / lineup.length; }

// ───────────── 경기 모델 ─────────────
const sig = (x) => 1 / (1 + Math.exp(-x));
function pressEff(Pp, Po, tp, to) {
  if (!tp.press) return 0;
  return 0.07 * tp.press * clamp(Math.pow(Pp.prs / Math.max(40, Po.bld), 1.6), 0.5, 1.8) * (1 - 0.3 * to.build);
}
function possShare(PA, PB, tA, tB, homeA) {
  const cA = PA.bld * MENT_CTL[tA.ment] * (homeA ? C.HOME_CTL : 1) * (1 - pressEff(PB, PA, tB, tA)) * (1 - 0.05 * tA.build);
  const cB = PB.bld * MENT_CTL[tB.ment] * (1 - pressEff(PA, PB, tA, tB)) * (1 - 0.05 * tB.build);
  return cA / (cA + cB);
}
// X가 공격, Y가 수비. out 배열에 {side, prob, p, ch} 추가
function sideEvents(PX, PY, tx, ty, pPoss, homeX, side, out) {
  const lam = C.EVENT_RATE * TEMPO[tx.tempo] * (0.5 + 0.5 * TEMPO[ty.tempo]);
  const opp = pPoss * lam;
  const wingS0 = 0.22 + 0.14 * tx.width, dirS0 = 0.06 + 0.10 * tx.build, cenS0 = Math.max(0.1, 1 - wingS0 - dirS0);
  const ma = MENT_ATK[tx.ment] * (homeX ? C.HOME_ATK : 1) * (FORM_S[tx.formation] || 1) * (1 + ((tx.coach == null ? 60 : tx.coach) - 60) / 1100) * (1 + ((tx.fam == null ? 80 : tx.fam) - 80) / 900), md = MENT_DEF[ty.ment] * (FORM_S[ty.formation] || 1) * (1 + ((ty.coach == null ? 60 : ty.coach) - 60) / 2000) * (1 + ((ty.fam == null ? 80 : ty.fam) - 80) / 1800);
  const finF = clamp(Math.pow(PX.fin / 68, 0.9), 0.6, 1.5), gkF = clamp(1 - (PY.gk - 72) * 0.012, 0.7, 1.3);
  const wy = ty.width - 1, ly = ty.line - 1;
  const dWy = PY.dW * (1 + 0.05 * wy) * (1 + 0.035 * ly) * md;
  const dCy = PY.dC * (1 - 0.05 * wy) * (1 + 0.035 * ly) * md;
  const restY = PY.rst * (1 - 0.09 * ly) * md;
  // 공격은 상대의 약한 곳으로 흐른다: 채널 비중을 (우리 공격력 / 상대 해당 수비력)에 비례해 기울임
  const aWing = PX.wing * ma, aCen = PX.cen * ma, aDir = (0.65 * PX.dir + 0.35 * PX.bld) * ma;
  const dDir = 0.5 * PY.dA * md + 0.5 * restY;
  const tilt = (a, d) => Math.pow(clamp(a / d, 0.6, 1.6), C.TILT);
  let sw = wingS0 * tilt(aWing, dWy), sc = cenS0 * tilt(aCen, dCy), sd = dirS0 * tilt(aDir, dDir);
  const sn = sw + sc + sd; sw /= sn; sc /= sn; sd /= sn;
  const wingS = sw, cenS = sc, dirS = sd;
  const q = (a, d) => sig(C.K_Q * Math.log(a / d));
  const pg = (base, qq) => clamp(base * Math.exp(C.GOAL_SENS * (qq - 0.5)) * finF * gkF, 0.01, 0.5);
  out.push({ side, prob: opp * wingS, p: pg(C.B_WING, q(PX.wing * ma, dWy)), ch: 'wing' });
  out.push({ side, prob: opp * cenS, p: pg(C.B_CEN, q(PX.cen * ma, dCy)), ch: 'cen' });
  out.push({ side, prob: opp * dirS, p: pg(C.B_DIR, q((0.65 * PX.dir + 0.35 * PX.bld) * ma, 0.5 * PY.dA * md + 0.5 * restY)), ch: 'dir' });
  // 세트피스
  out.push({ side, prob: C.SET_RATE * (0.6 + 0.8 * pPoss), p: pg(C.B_SP, q(PX.dA, PY.dA * md)), ch: 'sp' });
  // 상대 역습 (Y가 X의 공세 뒤 공간을 노림)
  const exposure = 0.5 * tx.ment + 0.45 * tx.press + 0.3 * tx.line;
  const protect = clamp(68 / PX.rst, 0.7, 1.3);
  const pc = C.COUNTER * (0.35 + exposure) * protect * TRANS_M[ty.trans] * pPoss;
  const rx = PX.rst * (1 - 0.09 * (tx.line - 1)) * MENT_DEF[tx.ment] * (FORM_S[tx.formation] || 1);
  const finY = clamp(Math.pow(PY.fin / 68, 0.9), 0.6, 1.5), gkX = clamp(1 - (PX.gk - 72) * 0.012, 0.7, 1.3);
  out.push({ side: 1 - side, prob: pc, p: clamp(C.B_CNT * Math.exp(C.GOAL_SENS * (q(PY.cnt * MENT_ATK[ty.ment], rx) - 0.5)) * finY * gkX, 0.01, 0.5), ch: 'cnt' });
}
function blockEvents(PA, PB, tA, tB, homeA) {
  const ps = possShare(PA, PB, tA, tB, homeA), ev = [];
  sideEvents(PA, PB, tA, tB, ps, homeA, 0, ev);
  sideEvents(PB, PA, tB, tA, 1 - ps, false, 1, ev);
  return ev;
}
function drainRate(t, P) {
  return (0.15 + 0.07 * t.press + 0.05 * t.tempo + 0.02 * t.trans + 0.02 * t.ment) * clamp(1.4 - P.sta / 140, 0.8, 1.2);
}

// 기대값 모드 (난수 없음): 체력 3구간
function evalMatch(A, B, homeA, detail) {
  const lA = A.lineup || buildLineup(A.squad, A.tactic, A.roles), lB = B.lineup || buildLineup(B.squad, B.tactic, B.roles);
  let xa = 0, xb = 0, last = null;
  const base = { A: lA.map((e) => e.stam), B: lB.map((e) => e.stam) };
  const P0A = profile(lA), P0B = profile(lB);
  const dA = drainRate(A.tactic, P0A), dB = drainRate(B.tactic, P0B);
  for (const mid of [15, 45, 75]) {
    lA.forEach((e, i) => (e.stam = Math.max(30, base.A[i] - dA * mid * (e.slot === 'GK' ? 0.3 : 1))));
    lB.forEach((e, i) => (e.stam = Math.max(30, base.B[i] - dB * mid * (e.slot === 'GK' ? 0.3 : 1))));
    const PA = profile(lA), PB = profile(lB);
    const ev = blockEvents(PA, PB, A.tactic, B.tactic, homeA);
    for (const e of ev) { const x = 30 * e.prob * e.p; if (e.side === 0) xa += x; else xb += x; }
    if (detail) { last = last || []; last.push(ev); }
  }
  lA.forEach((e, i) => (e.stam = base.A[i])); lB.forEach((e, i) => (e.stam = base.B[i]));
  return detail ? { xgA: xa, xgB: xb, ev: last } : { xgA: xa, xgB: xb };
}
const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];
function poissonPoints(la, lb) {
  let w = 0, d = 0;
  const pa = [], pb = [];
  for (let i = 0; i <= 9; i++) { pa.push(Math.exp(-la) * Math.pow(la, i) / FACT[i]); pb.push(Math.exp(-lb) * Math.pow(lb, i) / FACT[i]); }
  for (let i = 0; i <= 9; i++) for (let j = 0; j <= 9; j++) { const p = pa[i] * pb[j]; if (i > j) w += p; else if (i === j) d += p; }
  return { win: w, draw: d, loss: Math.max(0, 1 - w - d), pts: 3 * w + d };
}
function expectedPoints(A, B, homeA) { const r = evalMatch(A, B, homeA); const p = poissonPoints(r.xgA, r.xgB); p.xgA = r.xgA; p.xgB = r.xgB; return p; }

// ───────────── 시뮬 모드 ─────────────
function makeSide(squad, tactic, inMatch) {
  const lineup = buildLineup(squad, tactic);
  const used = new Set(lineup.map((e) => e.p.id));
  return { squad, tactic, inMatch: inMatch !== false, lineup, bench: squad.filter((p) => !used.has(p.id)), subs: 0, goals: 0, xg: 0, ment: tactic.ment };
}
function inMatchAdjust(S, minute, diff) {
  let m = S.tactic.ment;
  if (minute >= 60 && diff <= -1) m = Math.min(2, m + 1);
  if (minute >= 75 && diff <= -2) m = 2;
  if (minute >= 65 && diff >= 1) m = Math.max(0, m - 1);
  if (minute >= 80 && diff >= 2) m = 0;
  S.ment = m;
  if ([60, 70, 78].includes(minute) && S.subs < 5) {
    const need = needVec(S.tactic);
    for (let k = 0; k < 2 && S.subs < 5; k++) {
      let worst = null, ws = 1e9;
      for (const e of S.lineup) { if (e.slot === 'GK') continue; const sc = slotScore(e.p, e.slot, need) * (0.8 + 0.2 * e.stam / 100); if (sc < ws) { ws = sc; worst = e; } }
      let best = null, bs = ws + 1.5;
      for (const b of S.bench) {
        if (b.sub === 'GK') continue;
        let want = 0; if (diff < 0 && (b.sub === 'ST' || b.sub === 'W' || b.sub === 'AM')) want = 1.5; if (diff > 0 && (b.sub === 'CB' || b.sub === 'DM')) want = 1.5;
        const sc = slotScore(b, worst.slot, need) * (0.8 + 0.2 * b.cond / 100) + want;
        if (sc > bs) { bs = sc; best = b; }
      }
      if (!best) break;
      S.bench = S.bench.filter((x) => x !== best); S.bench.push(worst.p);
      worst.p = best; worst.fam = 0.75 + 0.25 * FAM[best.sub][worst.slot]; worst.stam = best.cond; worst.role = pickRole(best, worst.slot, need);
      S.subs++;
    }
  }
}
function simulate(r, A, B, opts) {
  opts = opts || {};
  const sA = makeSide(A.squad, A.tactic, A.inMatch), sB = makeSide(B.squad, B.tactic, B.inMatch);
  let ev = null, PA = null, PB = null;
  const dr = [0, 0];
  for (let m = 1; m <= 90; m++) {
    if (m % 5 === 1 || m === 90 || [60, 70, 78].includes(m)) {
      if ([60, 70, 78].includes(m)) {
        if (sA.inMatch) inMatchAdjust(sA, m, sA.goals - sB.goals);
        if (sB.inMatch) inMatchAdjust(sB, m, sB.goals - sA.goals);
      }
      PA = profile(sA.lineup); PB = profile(sB.lineup);
      const tA = Object.assign({}, sA.tactic, { ment: sA.ment }), tB = Object.assign({}, sB.tactic, { ment: sB.ment });
      ev = blockEvents(PA, PB, tA, tB, !!opts.homeA);
      dr[0] = drainRate(tA, PA); dr[1] = drainRate(tB, PB);
    }
    for (const e of sA.lineup) e.stam = Math.max(30, e.stam - dr[0] * (e.slot === 'GK' ? 0.3 : 1));
    for (const e of sB.lineup) e.stam = Math.max(30, e.stam - dr[1] * (e.slot === 'GK' ? 0.3 : 1));
    for (const e of ev) {
      const S = e.side === 0 ? sA : sB;
      S.xg += e.prob * e.p;
      if (r() < e.prob && r() < e.p) S.goals++;
    }
  }
  return { gA: sA.goals, gB: sB.goals, xgA: sA.xg, xgB: sB.xg, subsA: sA.subs, subsB: sB.subs };
}

// ───────────── 설명(감독용 UI) ─────────────
function describe(squad, tactic) {
  const lu = buildLineup(squad, tactic); const P = profile(lu);
  const parts = lu.map((e) => `${e.slot}:${e.p.name}(${ROLES[e.role].name})`);
  const top = K.filter((k) => !['fin'].includes(k)).map((k) => [k, P[k]]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${KO[k]} ${v.toFixed(0)}`);
  return { formation: tactic.formation, instr: INSTR.map((k) => INSTR_KO[k][tactic[k]]).join(' · '), lineup: parts, strengths: top };
}

const API = { FORM_S, mulberry32, gauss, clamp, AT, AT_KO, GK_AT, K, KO, ROLES, ROLE_IDS, SLOT_ROLES, FORMATIONS, FORM_IDS, INSTR, INSTR_KO, defaultTactic, needVec, NEUTRAL, C, STYLE_IDS, makePlayer, makeSquad, finalize, abilitiesOf, roleScore, slotScore, buildLineup, profile, blockEvents, evalMatch, expectedPoints, poissonPoints, simulate, describe, pickRole, FAM, SUBS };
if (typeof module !== 'undefined') module.exports = API;
if (typeof window !== 'undefined') window.TacticsEngine2 = API;
