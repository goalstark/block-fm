// ---- 3D 경기 화면 (기본 화면) — 두 가지 그림 방식 ----
// 하이브리드 3D(기본): 캐릭터는 로우폴리 블록, 재질·조명·경기장은 PBR(반사 환경광, 실시간 그림자, 천·피부·광택 재질)
// 로우폴리 3D: 같은 블록 캐릭터에 단색 재질·단순 조명(그림자·반사 없음) → 보급형 폰용, 하이브리드가 느리면 자동으로 이쪽으로 내려옴
// 원칙: 화면 상태 MV(선수 위치·공·심판)를 "읽어서 그리기만" 한다.
//       Core·게임 난수(G.rs)·경기 결과·세이브는 절대 건드리지 않는다. (여기 쓰는 Math.random은 관중·재질 무늬 같은 그림용)
//       WebGL이 없는 폰은 설치 단계(안드로이드 7.0 이상)와 첫 화면 안내에서 걸러진다. 경기 중 3D가 멈추면 그 경기만 비상용 2D로 이어 간다.
const V3D = (() => {
  let R = null, raf = 0;
  const L = 52.5, W = 34, GW = 3.66, GH = 2.44, BR = 0.22;                 // 실제 경기장 크기(105×68m). 게임 좌표 100×64 → 이 크기로 변환 (선수는 상대적으로 작아짐)
  const K = L / 35;                                                        // 시안(70×45)에서 커진 비율 — 경기장 주변 구조물 배치에 사용
  const wx = (g) => (g - 50) * (L / 49), wz = (g) => (g - 32) * (W / 31), WS = L / 49, WZ = W / 31;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ADS = [{ t: '블록 풋볼 매니저', c: '#FFD23F', w: 600 }, { t: '딱알 솔루션', c: '#9fdcff', w: 460 }, { t: '딱펫', c: '#ff8fb1', w: 300 }, { t: 'BLOCK FOOTBALL MANAGER', c: '#ffffff', w: 688 }];   // 경기장 LED 광고판 문구(나중에 광고 자리로 사용)
  const col = (h) => new THREE.Color(h).convertSRGBToLinear();
  const lum = (h) => { const n = parseInt(String(h).slice(1, 7), 16); return ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; };

  function loadLib() {
    if (window.THREE) return true;
    const src = document.getElementById('three-src'); if (!src) return false;
    try { const s = document.createElement('script'); s.textContent = src.textContent; document.head.appendChild(s); } catch (e) { return false; }
    return !!window.THREE;
  }
  function glOK() { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  function gfx() { return (typeof viewNow === 'function' ? viewNow() : 'hy') === 'lp' ? 'lp' : 'hy'; }
  function emergency(msg) {                                                // 경기 중 3D가 멈춘 경우: 이 경기만 비상용 2D로(설정은 그대로)
    stop(); S.emer2d = true;
    try { viewApply(); if (MV) renderMatch(); } catch (e) {}
    try { toast(msg); } catch (e) {}
  }
  function sync() {
    const pw = document.querySelector('#pitchbox .pwrap');
    if (!MV || !pw || S.emer2d) { stop(); return; }
    if (R && R.style !== gfx()) stop();
    if (R) { if (R.wrap !== pw || !R.cv.isConnected) attach(pw); return; }
    start(pw);
  }
  function newCtx(rd, style) {
    return { rd, cv: rd.domElement, style, lp: style === 'lp', pr: Math.min(window.devicePixelRatio || 1, style === 'lp' ? 1 : 1.5), sig: '', pl: { m: [], o: [] }, last: 0, ft: [], ftT: 0, lowQ: false, w: 0, h: 0, tex: new Map(), mats: new Map(), t: 0 };
  }
  function makeRenderer(style, alpha) {
    let rd = null; try { rd = new THREE.WebGLRenderer({ antialias: style !== 'lp', alpha: !!alpha, powerPreference: 'high-performance' }); if (alpha) rd.setClearColor(0x000000, 0); } catch (e) { rd = null; }
    if (!rd || !rd.getContext()) return null;
    rd.outputEncoding = THREE.sRGBEncoding; rd.toneMapping = THREE.ACESFilmicToneMapping; rd.toneMappingExposure = style === 'lp' ? 1.0 : 1.08;
    rd.shadowMap.enabled = style !== 'lp'; rd.shadowMap.type = THREE.PCFSoftShadowMap; return rd;
  }
  function start(pw) {
    if (!loadLib()) { emergency('3D 파일을 불러오지 못했습니다'); return; }
    const style = gfx(), rd = makeRenderer(style);
    if (!rd) { emergency('이 폰은 3D를 지원하지 않습니다'); return; }
    R = newCtx(rd, style); R.cv.className = 'v3c';
    R.cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (R && R.rd === rd && !R.dead) emergency('3D 화면이 멈춰 이번 경기는 간단한 화면으로 보여줍니다'); });
    try { build(); } catch (e) { try { console.error(e); } catch (x) {} emergency('3D 화면을 만들지 못했습니다'); return; }
    attach(pw);
    raf = requestAnimationFrame(loop);
  }
  function attach(pw) { R.wrap = pw; pw.insertBefore(R.cv, pw.firstChild); pw.classList.add('v3d'); R.sig = ''; R.w = 0; R.hudK = ''; R.hudT = 0; hudMake(pw); }
  function disposeCtx(r) {
    try { r.cv.remove(); } catch (e) {}
    try { r.sc.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => m.dispose()); }); } catch (e) {}
    try { r.tex.forEach(t => t.dispose()); if (r.env) r.env.dispose(); } catch (e) {}
    try { r.rd.dispose(); r.rd.forceContextLoss(); } catch (e) {}
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf); raf = 0;
    document.querySelectorAll('.pwrap.v3d').forEach(e => e.classList.remove('v3d')); document.querySelectorAll('.v3hud').forEach(e => e.remove());
    if (!R) return; const r = R; R = null; r.dead = true; disposeCtx(r);
  }

  // ---------- 텍스처(캔버스로 직접 그림, 외부 파일 없음) ----------
  function cached(k, fn) { if (!R.tex.has(k)) R.tex.set(k, fn()); return R.tex.get(k); }
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function toTex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(R.lp ? 2 : 8, R.rd.capabilities.getMaxAnisotropy()); return t; }
  function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  const NUMFONT = 'sans-serif';
  function jerseyTex(kit, num, side, name) {
    return cached(`j|${kit.id}|${num}|${side}|${name}`, () => {
      const c = mkCanvas(256, 256), x = c.getContext('2d');
      x.fillStyle = kit.main; x.fillRect(0, 0, 256, 256);
      if (kit.pattern === 'gk') { x.save(); x.fillStyle = kit.second; x.globalAlpha = .22; for (let i = -96; i < 352; i += 64) { x.beginPath(); x.moveTo(i, 256); x.lineTo(i + 32, 196); x.lineTo(i + 64, 256); x.fill(); } x.restore(); }
      x.fillStyle = kit.trim;
      if (side === 'front') { x.beginPath(); x.moveTo(84, 0); x.lineTo(128, 48); x.lineTo(172, 0); x.lineTo(152, 0); x.lineTo(128, 26); x.lineTo(104, 0); x.closePath(); x.fill(); } else x.fillRect(80, 0, 96, 14);
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
      if (side === 'front') {
        if (num !== '') { x.font = `800 118px ${NUMFONT}`; x.lineWidth = 7; x.strokeStyle = kit.trim; x.strokeText(num, 128, 150); x.fillStyle = kit.numCol; x.fillText(num, 128, 150); }   // 앞면: 가운데 큰 번호
      } else if (num !== '') {
        x.font = '700 24px sans-serif'; x.fillStyle = kit.numCol; x.fillText(name, 128, 48);
        x.font = `700 154px ${NUMFONT}`; x.lineWidth = 6; x.strokeStyle = kit.trim; x.strokeText(num, 128, 160); x.fillStyle = kit.numCol; x.fillText(num, 128, 160);
      }
      if (!R.lp) { const id = x.getImageData(0, 0, 256, 256), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(id, 0, 0);
        const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(0,0,0,.14)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
      return toTex(c);
    });
  }
  function heightToNormal(w, h, fn, strength) {
    const c = mkCanvas(w, h), x = c.getContext('2d'), id = x.createImageData(w, h), d = id.data, H = new Float32Array(w * h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) H[j * w + i] = fn(i, j);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const l = H[j * w + (i - 1 + w) % w], r = H[j * w + (i + 1) % w], u = H[((j - 1 + h) % h) * w + i], dn = H[((j + 1) % h) * w + i];
      let nx = (l - r) * strength, ny = (dn - u) * strength, nz = 1; const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len; nz /= len;
      const k = (j * w + i) * 4; d[k] = (nx * .5 + .5) * 255; d[k + 1] = (ny * .5 + .5) * 255; d[k + 2] = (nz * .5 + .5) * 255; d[k + 3] = 255;
    }
    x.putImageData(id, 0, 0); return toTex(c, false);
  }
  function fabricNormal() { return cached('fabN', () => heightToNormal(256, 256, (i, j) => { const a = Math.sin(i * Math.PI * 2 / 6), b = Math.sin(j * Math.PI * 2 / 6); return (Math.abs(a) * .6 + Math.abs(b) * .4) + ((Math.floor(i / 3) + Math.floor(j / 3)) % 2) * .3 + Math.random() * .15; }, 1.4)); }
  function hairNormal() { return cached('hairN', () => { const cs = new Float32Array(128); for (let i = 0; i < 128; i++) cs[i] = Math.random(); return heightToNormal(128, 128, (i, j) => { const a = cs[i], b = cs[(i + 1) % 128]; return Math.sin(i * .9 + a * 3) * .5 + a * .6 + b * .3 + Math.sin(j * .05 + i * .3) * .15; }, 2.2); }); }
  function skyTex(kind) {
    return cached('sky' + kind, () => { const c = mkCanvas(4, 512), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512);
      if (kind === 'pbr') { g.addColorStop(0, '#02040a'); g.addColorStop(.4, '#07101f'); g.addColorStop(.5, '#1b2b46'); g.addColorStop(.56, '#0b1322'); g.addColorStop(1, '#05070b'); }
      else if (kind === 'lp') { g.addColorStop(0, '#0b1530'); g.addColorStop(.45, '#1d3463'); g.addColorStop(.55, '#25365a'); g.addColorStop(1, '#0a0e16'); }
      else { g.addColorStop(0, '#0d1218'); g.addColorStop(.5, '#233040'); g.addColorStop(.62, '#121820'); g.addColorStop(1, '#07090c'); }
      x.fillStyle = g; x.fillRect(0, 0, 4, 512); return toTex(c); });
  }
  function grassTex(pt) {                                                         // 잔디: 하이브리드는 결·얼룩·골문 앞 마모까지, 로우폴리는 줄무늬만
    return cached('grass' + pt.base + R.style, () => {
      const PW = 2 * L + 8, PH = 2 * W + 8, cw = 2048, s = cw / PW, ch = Math.round(PH * s), c = mkCanvas(cw, ch), x = c.getContext('2d');
      const X = v => (v + PW / 2) * s, Z = v => (v + PH / 2) * s;
      const dark = (h, k) => { const n = parseInt(h.slice(1), 16); const f = (v) => Math.round(v * k); return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`; };
      const dirt = pt.pat === 'n', ka = dirt ? .72 : Math.min(.82, .3 / Math.max(.2, lum(pt.base))) * (R.lp ? 1.12 : 1);
      x.fillStyle = dark(pt.base, ka); x.fillRect(0, 0, cw, ch);
      const n = 18, sw = (2 * L + 8) / n;
      if (!dirt) for (let i = 0; i < n; i++) { x.fillStyle = dark(i % 2 ? pt.a : pt.b, ka); x.fillRect(X(-L - 4 + i * sw), 0, sw * s + 1, ch); }
      if (!R.lp) {
        const m = mkCanvas(80, 54), mx = m.getContext('2d');
        for (let i = 0; i < 80 * 54; i++) { mx.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '190,220,120'},${Math.random() * .25})`; mx.fillRect(i % 80, Math.floor(i / 80), 1, 1); }
        x.imageSmoothingEnabled = true; x.globalAlpha = .5; x.drawImage(m, 0, 0, cw, ch); x.globalAlpha = 1;
        for (const sx of [-1, 1]) { const g = x.createRadialGradient(X(sx * (L - 6)), Z(0), 0, X(sx * (L - 6)), Z(0), 7 * s); g.addColorStop(0, 'rgba(120,96,60,.45)'); g.addColorStop(1, 'rgba(120,96,60,0)'); x.fillStyle = g; x.fillRect(X(sx * (L - 6)) - 7 * s, Z(0) - 7 * s, 14 * s, 14 * s); }
        const id = x.getImageData(0, 0, cw, ch), d = id.data; for (let i = 0; i < d.length; i += 4) { const k = (Math.random() - .5) * 26; d[i] += k * .6; d[i + 1] += k; d[i + 2] += k * .4; } x.putImageData(id, 0, 0);
      }
      x.strokeStyle = 'rgba(240,244,236,.9)'; x.lineWidth = .14 * s;
      const line = (a, b, c2, d2) => { x.beginPath(); x.moveTo(X(a), Z(b)); x.lineTo(X(c2), Z(d2)); x.stroke(); };
      x.strokeRect(X(-L), Z(-W), 2 * L * s, 2 * W * s); line(0, -W, 0, W);
      x.beginPath(); x.arc(X(0), Z(0), 8 * WS * s, 0, Math.PI * 2); x.stroke();
      const dot = (a, b) => { x.beginPath(); x.arc(X(a), Z(b), .25 * s, 0, Math.PI * 2); x.fillStyle = x.strokeStyle; x.fill(); };
      dot(0, 0);
      for (const sx of [-1, 1]) {                                                    // 박스 크기는 2D 경기장(게임 좌표)과 같은 비율
        const bx = sx * L, bd = 14 * WS, bw = 30 * WZ, sd = 5 * WS, sww = 14 * WZ, ps = 10 * WS;
        x.strokeRect(Math.min(X(bx), X(bx - sx * bd)), Z(-bw / 2), bd * s, bw * s);
        x.strokeRect(Math.min(X(bx), X(bx - sx * sd)), Z(-sww / 2), sd * s, sww * s);
        dot(bx - sx * ps, 0);
        x.beginPath(); x.arc(X(bx - sx * ps), Z(0), 6 * WS * s, sx > 0 ? Math.PI * 0.62 : -Math.PI * 0.38, sx > 0 ? Math.PI * 1.38 : Math.PI * 0.38); x.stroke();
        for (const sz of [-1, 1]) { x.beginPath(); x.arc(X(bx), Z(sz * W), 1 * s, 0, Math.PI * 2); x.stroke(); }
      }
      return toTex(c);
    });
  }
  function netTex() { return cached('net', () => { const c = mkCanvas(64, 64), x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineWidth = 3; x.strokeRect(0, 0, 64, 64); const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 4); return t; }); }
  function boardTex() {                                                            // LED 광고판(모두 가상의 이름) — 글씨가 칸을 꽉 채우게 크게
    return cached('board', () => { const W2 = ADS.reduce((a, b) => a + b.w, 0), c = mkCanvas(W2, 128), x = c.getContext('2d'); let px = 0;
      ADS.forEach(a => { x.fillStyle = '#05080e'; x.fillRect(px, 0, a.w, 128); x.fillStyle = a.c; x.textAlign = 'center'; x.textBaseline = 'middle';
        let fs = 92; x.font = `900 ${fs}px ${NUMFONT}`; const mw = x.measureText(a.t).width, lim = a.w - 44; if (mw > lim) { fs = Math.floor(fs * lim / mw); x.font = `900 ${fs}px ${NUMFONT}`; }
        if (!R.lp) { x.shadowColor = a.c; x.shadowBlur = 14; } x.fillText(a.t, px + a.w / 2, 66); x.shadowBlur = 0;
        x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(px + a.w - 3, 0, 3, 128); px += a.w; });
      const t = toTex(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t; });
  }
  function glowTex() { return cached('glow', () => { const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,250,235,.55)'); g.addColorStop(1, 'rgba(255,250,235,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return toTex(c); }); }

  // ---------- 재질: 하이브리드는 PBR(천·피부·광택), 로우폴리는 단색·평면 음영 ----------
  function mat(kind, color, o = {}) {
    const key = kind + '|' + color + '|' + (o.key || ''); if (R.mats.has(key)) return R.mats.get(key); let m;
    if (R.lp) {
      m = new THREE.MeshStandardMaterial({ color: col(color), roughness: kind === 'metal' ? .5 : .9, metalness: kind === 'metal' ? .3 : 0, flatShading: true, map: o.map || null });
    } else switch (kind) {
      case 'fabric': m = new THREE.MeshStandardMaterial({ color: col(color), roughness: .8, metalness: 0, map: o.map || null, normalMap: fabricNormal(), normalScale: new THREE.Vector2(.5, .5) }); break;
      case 'skin': m = new THREE.MeshPhysicalMaterial({ color: col(color), roughness: .5, clearcoat: .2, clearcoatRoughness: .6 }); break;
      case 'hair': m = new THREE.MeshStandardMaterial({ color: col(color), roughness: .45, normalMap: hairNormal(), normalScale: new THREE.Vector2(.9, .9) }); break;
      case 'boot': m = new THREE.MeshPhysicalMaterial({ color: col(color), roughness: .28, metalness: .1, clearcoat: 1, clearcoatRoughness: .1 }); break;
      case 'eye': m = new THREE.MeshStandardMaterial({ color: col(color), roughness: .05 }); break;
      case 'metal': m = new THREE.MeshStandardMaterial({ color: col(color), roughness: o.r ?? .35, metalness: .9 }); break;
      default: m = new THREE.MeshStandardMaterial({ color: col(color), roughness: o.r ?? .7, metalness: o.m ?? 0, map: o.map || null });
    }
    R.mats.set(key, m); return m;
  }
  function makeEnv() {                                                             // 하이브리드: 야간 경기장 반사광(PMREM) — 조명탑 네 개가 비치는 환경
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex('pbr'), side: THREE.BackSide })));
    const panel = (c, w, h, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c, c, c * .92), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) panel(16, 10, 5, x * 30, 22, z * 24);
    const gnd = new THREE.Mesh(new THREE.CircleGeometry(48, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(.03, .07, .03) })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -3; s.add(gnd);
    const gen = new THREE.PMREMGenerator(R.rd), rt = gen.fromScene(s, .02); gen.dispose();
    s.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    return rt;
  }
  function lights(sc, span) {
    if (R.lp) {
      sc.add(new THREE.HemisphereLight(col('#cfe0ff'), col('#2a3a22'), .85));
      const sun = new THREE.DirectionalLight(col('#fff4e0'), 1.3); sun.position.set(26, 62, 30); sc.add(sun); return;
    }
    R.env = makeEnv(); sc.environment = R.env.texture;
    sc.add(new THREE.HemisphereLight(col('#9db7ff'), col('#16241a'), .3));
    const sun = new THREE.DirectionalLight(col('#f3f6ff'), 2.3); sun.position.set(26 * span, 62 * span, 30 * span);
    const fill = new THREE.DirectionalLight(col('#dfe8ff'), .75); fill.position.set(-34, 40, -26); sc.add(fill);
    sun.castShadow = true; const sh = sun.shadow.camera; sh.left = -L - 6; sh.right = L + 6; sh.top = W + 8; sh.bottom = -W - 8; sh.near = 10; sh.far = 260 * span;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; sun.shadow.radius = 3; sc.add(sun); sc.add(sun.target); R.sun = sun;
  }

  // ---------- 경기장 ----------
  function build() {
    const sc = new THREE.Scene(); R.sc = sc; const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const cam = new THREE.PerspectiveCamera(34, 1.56, .5, 1400); R.cam = cam; R.camPos = new THREE.Vector3(0, 40, 60); R.camLook = new THREE.Vector3(); R.fov = 34;
    sc.add(new THREE.Mesh(new THREE.SphereGeometry(620, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex(R.lp ? 'lp' : 'pbr'), side: THREE.BackSide, fog: false, depthWrite: false })));
    sc.fog = new THREE.Fog(col(R.lp ? '#1a2846' : '#121d31'), 160, 520);
    lights(sc, K);
    const pt = MV.pitch || { base: '#2E8B4A', a: '#319550', b: '#2A8445', pat: 'v' };
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(2 * L + 8, 2 * W + 8), new THREE.MeshStandardMaterial({ map: grassTex(pt), roughness: .93, metalness: 0 })); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = !R.lp; sc.add(pitch);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat('flat', R.lp ? '#22302a' : '#1b1e23', { r: .95 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.03; ground.receiveShadow = !R.lp; sc.add(ground);
    // 골대 + 그물
    for (const s of [1, -1]) {
      const g = new THREE.Group(); g.position.x = s * L; sc.add(g);
      const pm = R.lp ? mat('flat', '#f4f6f8') : new THREE.MeshPhysicalMaterial({ color: col('#f4f6f8'), roughness: .25, clearcoat: 1 }), pr = .08;
      for (const z of [-GW, GW]) { const p = new THREE.Mesh(box(pr * 2, GH, pr * 2), pm); p.position.set(0, GH / 2, z); p.castShadow = !R.lp; g.add(p); }
      const bar = new THREE.Mesh(box(pr * 2, pr * 2, GW * 2 + pr * 2), pm); bar.position.set(0, GH, 0); bar.castShadow = !R.lp; g.add(bar);
      const nm = new THREE.MeshStandardMaterial({ map: netTex(), alphaTest: .4, side: THREE.DoubleSide, color: col('#e8ecf0'), roughness: .8 }), D = 1.8;
      const back = new THREE.Mesh(new THREE.PlaneGeometry(GW * 2, GH), nm); back.rotation.y = Math.PI / 2; back.position.set(s * D, GH / 2, 0); g.add(back);
      const top = new THREE.Mesh(new THREE.PlaneGeometry(D, GW * 2), nm); top.rotation.x = -Math.PI / 2; top.position.set(s * D / 2, GH, 0); g.add(top);
      for (const z of [-GW, GW]) { const sd = new THREE.Mesh(new THREE.PlaneGeometry(D, GH), nm); sd.position.set(s * D / 2, GH / 2, z); g.add(sd); }
    }
    // LED 광고판
    const bt = boardTex(); R.boards = [];
    for (const [x, z, len, ry] of [[0, W + 3.2, 2 * L + 4, Math.PI], [0, -(W + 3.2), 2 * L + 4, 0], [L + 3.2, 0, 2 * W + 2, -Math.PI / 2], [-(L + 3.2), 0, 2 * W + 2, Math.PI / 2]]) {
      const t = bt.clone(); t.needsUpdate = true; t.repeat.set(len / 30, 1); R.tex.set('board' + x + z, t); R.boards.push(t);
      const m = R.lp ? new THREE.MeshBasicMaterial({ map: t, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: t, emissive: col('#ffffff'), emissiveMap: t, emissiveIntensity: 1.15, roughness: .4 });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.6), m); pl.position.set(x, .85, z); pl.rotation.y = ry; sc.add(pl);
      const bk = new THREE.Mesh(box(len, 1.72, .25), mat('flat', '#0c0f14')); bk.position.set(x, .86, z); bk.rotation.y = ry; bk.translateZ(-.14); sc.add(bk);
    }
    // 관중석(계단식) + 지붕·기둥·조명띠 + 관중(인스턴스, 홈/원정 색)
    const crowd = [], KT = MV.kit || { m: ['#C8202F', '#fff'], o: ['#2B5BD7', '#fff'] }, home = G0() && G0().mm && G0().mm.mineHome ? KT.m : KT.o, away = home === KT.m ? KT.o : KT.m;
    const TIERS = R.lp ? 6 : 8, TD = 1.8, TH = .9, step = R.lp ? 1.5 : 1.1;
    for (const sd of [{ ax: 'z', s: 1, len: 2 * L + 16 }, { ax: 'z', s: -1, len: 2 * L + 16 }, { ax: 'x', s: 1, len: 2 * W + 14 }, { ax: 'x', s: -1, len: 2 * W + 14 }]) {
      const base = (sd.ax === 'z' ? W : L) + 6;
      for (let i = 0; i < TIERS; i++) {
        const h = (i + 1) * TH, off = base + i * TD + TD / 2;
        const m = new THREE.Mesh(sd.ax === 'z' ? box(sd.len, h, TD) : box(TD, h, sd.len), mat('flat', i % 2 ? '#222a35' : '#2a3340', { r: .6 }));
        if (sd.ax === 'z') m.position.set(0, h / 2, sd.s * off); else m.position.set(sd.s * off, h / 2, 0); m.receiveShadow = !R.lp; sc.add(m);
        const n = Math.floor(sd.len / step);
        for (let k = 0; k < n; k++) { if (Math.random() < .13) continue; const t = -sd.len / 2 + (k + .5) * step + (Math.random() - .5) * .2, r = Math.random(), team = r < .5 ? 0 : r < .82 ? 1 : 2;
          crowd.push({ x: sd.ax === 'z' ? t : sd.s * off, z: sd.ax === 'z' ? sd.s * off : t, y: h, team, ph: Math.random() * 6.28, sc: .9 + Math.random() * .2 }); }
      }
      const topH = TIERS * TH + 2.4, wo = base + TIERS * TD + .3;
      const wall = new THREE.Mesh(sd.ax === 'z' ? box(sd.len, topH, .6) : box(.6, topH, sd.len), mat('flat', '#151a21'));
      if (sd.ax === 'z') wall.position.set(0, topH / 2, sd.s * wo); else wall.position.set(sd.s * wo, topH / 2, 0); sc.add(wall);
      if (sd.ax === 'z') {
        const roof = new THREE.Mesh(box(sd.len + 4, .5, 17), mat('metal', '#2a3038', { r: .45 })); roof.position.set(0, topH + 3.4, sd.s * (wo - 7.5)); roof.rotation.x = sd.s * -.08; sc.add(roof);
        for (let k = -4; k <= 4; k++) { const p = new THREE.Mesh(box(.5, topH + 3.4, .5), mat('metal', '#3a414b')); p.position.set(k * 14, (topH + 3.4) / 2, sd.s * wo); sc.add(p); }
        if (!R.lp) { const strip = new THREE.Mesh(box(sd.len, .12, .3), new THREE.MeshStandardMaterial({ color: col('#000000'), emissive: col('#cfe6ff'), emissiveIntensity: 2 })); strip.position.set(0, topH + 3.05, sd.s * (wo - 15.8)); sc.add(strip); }
      }
    }
    const N = crowd.length, cm = new THREE.MeshStandardMaterial({ roughness: .75, flatShading: true }), hm = new THREE.MeshStandardMaterial({ roughness: .6, flatShading: true });
    const bodies = new THREE.InstancedMesh(box(.62, .78, .46), cm, N), heads = new THREE.InstancedMesh(box(.38, .38, .38), hm, N);
    const pal = [[home[0], home[1] || '#ffffff', home[0]], [away[0], away[1] || '#ffffff', away[0]], ['#6b7380', '#d6c7a1', '#40454d', '#9a5b3c']], SK = ['#f1c9a5', '#e0ac85', '#c68b62', '#8d5a3b', '#f6d7bd', '#a8714d'];
    const dummy = new THREE.Object3D();
    crowd.forEach((c, i) => { const p = pal[c.team]; bodies.setColorAt(i, col(p[Math.floor(Math.random() * p.length)])); heads.setColorAt(i, col(SK[Math.floor(Math.random() * SK.length)]));
      dummy.position.set(c.x, c.y + .39, c.z); dummy.scale.setScalar(c.sc); dummy.updateMatrix(); bodies.setMatrixAt(i, dummy.matrix); dummy.position.y = c.y + .39 + .6 * c.sc; dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix); });
    sc.add(bodies, heads); R.crowd = { crowd, bodies, heads, dummy };
    // 조명탑
    const gm = new THREE.SpriteMaterial({ map: glowTex(), color: col('#fff1d8'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const px = x * (L + 22), pz = z * (W + 24), hgt = 42;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.6, 1, hgt, 8), mat('metal', '#4a525e')); pole.position.set(px, hgt / 2, pz); sc.add(pole);
      const head = new THREE.Group(); head.position.set(px, hgt + 1.5, pz); head.lookAt(0, 0, 0); sc.add(head);
      head.add(new THREE.Mesh(box(9, 4.6, .6), mat('metal', '#2b3038')));
      const lm = R.lp ? new THREE.MeshBasicMaterial({ color: col('#fff6e2'), toneMapped: false }) : new THREE.MeshStandardMaterial({ color: col('#000000'), emissive: col('#fff6e2'), emissiveIntensity: 3.2 });
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), lm); lamp.position.set(-3.15 + i * 2.1, -1.05 + j * 2.1, .31); head.add(lamp); }
      if (!R.lp) { const glow = new THREE.Sprite(gm); glow.scale.set(34, 34, 1); glow.position.set(0, 0, 1.5); head.add(glow); }
    }
    R.ball = buildBall(); sc.add(R.ball); R.bPrev = null;
    R.ballSh = new THREE.Mesh(new THREE.CircleGeometry(BR * 1.3, 18), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .4, depthWrite: false })); R.ballSh.rotation.x = -Math.PI / 2; sc.add(R.ballSh);
    // 내 선수 표시
    R.ring = new THREE.Mesh(new THREE.RingGeometry(.8, .98, 32), new THREE.MeshBasicMaterial({ color: col('#FFD23F'), transparent: true, opacity: .95, depthWrite: false, toneMapped: false })); R.ring.rotation.x = -Math.PI / 2; R.ring.visible = false; sc.add(R.ring);
    R.arrow = new THREE.Mesh(new THREE.ConeGeometry(.3, .5, 4), new THREE.MeshBasicMaterial({ color: col('#FFD23F'), toneMapped: false })); R.arrow.rotation.x = Math.PI; R.arrow.visible = false; sc.add(R.arrow);
    // 심판
    let rc = '#1A1A1A'; try { rc = refCol(); } catch (e) {}
    const rk = { id: 'ref' + rc, main: rc, second: '#111111', trim: '#111111', shorts: '#111111', socks: '#111111', numCol: '#ffffff', pattern: 'plain' }, rl = { skin: '#e0ac85', hair: '#2b2420', hairStyle: 'buzz', boot: '#111317' };
    R.ref = [0, 1, 2].map(() => { const r = buildRig(rk, '', rl); sc.add(r.root); r.st = { ph: 0, yaw: 0 }; return r; });
    R.ref.forEach((r, i) => { if (i) { const f = new THREE.Mesh(box(.04, .45, .55), mat('flat', '#ff5a2e')); f.position.set(0, -.7, .3); r.armR.add(f); } });
    R.card = new THREE.Mesh(box(.32, .45, .04), new THREE.MeshBasicMaterial({ color: col('#F2D21B'), toneMapped: false })); R.card.visible = false; sc.add(R.card);
  }
  const BALLS = [['classic', '클래식', '#ffffff', '#1b1d22'], ['neon', '형광', '#E8FF3A', '#14161a'], ['orange', '오렌지', '#FF8A1F', '#ffffff'], ['red', '레드', '#ffffff', '#E0262F'], ['blue', '블루', '#ffffff', '#1F5FD6'], ['gold', '골드', '#F5C542', '#7A5A10']];
  function ballSkin() { try { const v = localStorage.getItem('bfm_ball'); if (BALLS.some(b => b[0] === v)) return v; } catch (e) {} return 'neon'; }
  function setBall(v) { if (!BALLS.some(b => b[0] === v)) return; try { localStorage.setItem('bfm_ball', v); } catch (e) {} if (R && R.ball) { const sc = R.ball.parent, nb = buildBall(); nb.position.copy(R.ball.position); if (sc) { sc.remove(R.ball); sc.add(nb); } R.ball.geometry.dispose(); R.ball = nb; } }
  function buildBall() {                                                           // 공: 로우폴리 정이십면체(하이브리드는 광택 코팅) — 스킨 색 적용
    const g = new THREE.IcosahedronGeometry(BR, R.lp ? 1 : 2), p = g.attributes.position, cols = [], v = new THREE.Vector3(), dirs = [], g0 = new THREE.IcosahedronGeometry(1, 0), p0 = g0.attributes.position;
    for (let i = 0; i < p0.count; i++) { const d = new THREE.Vector3().fromBufferAttribute(p0, i).normalize(); if (!dirs.some(o => o.distanceTo(d) < 1e-3)) dirs.push(d); } g0.dispose();
    const bs = BALLS.find(b => b[0] === ballSkin()) || BALLS[0], blk = col(bs[3]), wh = col(bs[2]); R.ballId = bs[0];
    for (let f = 0; f < p.count; f += 3) { let dk = false; for (let k = 0; k < 3; k++) { v.fromBufferAttribute(p, f + k).normalize(); if (dirs.some(d => d.distanceTo(v) < (R.lp ? .3 : 1e-3))) dk = true; } const c = dk ? blk : wh; for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const m = new THREE.Mesh(g, R.lp ? new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .75 }) : new THREE.MeshPhysicalMaterial({ vertexColors: true, flatShading: true, roughness: .32, clearcoat: .9, clearcoatRoughness: .15 }));
    m.castShadow = !R.lp; return m;
  }
  // ---------- 블록 캐릭터(각진 상자 + 하이브리드는 천·피부·광택 축구화 재질) ----------
  function buildRig(kit, num, look) {
    const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const sh = !R.lp, mesh = (geo, m, x, y, z, par) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = sh; par.add(o); return o; };
    const mMain = mat('fabric', kit.main), mShorts = mat('fabric', kit.shorts), mSock = mat('fabric', kit.socks), mSkin = mat('skin', look.skin), mHair = mat('hair', look.hair), mBoot = mat('boot', look.boot), mEye = mat('eye', '#15171c');
    const tf = jerseyTex(kit, num, 'front', look.back || ''), tb = jerseyTex(kit, num, 'back', look.back || '');
    const mF = mat('fabric', '#ffffff', { map: tf, key: tf.uuid }), mB = mat('fabric', '#ffffff', { map: tb, key: tb.uuid }), legs = [];
    for (const sx of [1, -1]) { const g = new THREE.Group(); g.position.set(.16 * sx, .9, 0); body.add(g); mesh(B(.24, .3, .26), mSkin, 0, -.15, 0, g); mesh(B(.26, .42, .28), mSock, 0, -.5, 0, g); mesh(B(.28, .16, .42), mBoot, 0, -.8, .05, g); legs.push(g); }
    const upper = new THREE.Group(); upper.position.y = .9; body.add(upper);
    mesh(B(.62, .32, .36), mShorts, 0, .06, 0, upper);
    const torso = new THREE.Mesh(B(.66, .62, .38), [mMain, mMain, mMain, mMain, mF, mB]); torso.position.y = .5; torso.castShadow = sh; torso.receiveShadow = sh; upper.add(torso);
    mesh(B(.22, .1, .22), mSkin, 0, .84, 0, upper);
    const head = new THREE.Group(); head.position.y = .88; upper.add(head);
    mesh(B(.56, .52, .5), mSkin, 0, .27, 0, head);
    for (const sx of [1, -1]) mesh(B(.07, .11, .03), mEye, .12 * sx, .28, .255, head);
    const hs = look.hairStyle;
    if (hs === 'crop' || hs === 'bun') { mesh(B(.6, .15, .54), mHair, 0, .56, -.01, head); mesh(B(.6, .3, .12), mHair, 0, .4, -.22, head); }
    if (hs === 'bun') mesh(B(.22, .2, .22), mHair, 0, .7, -.14, head);
    if (hs === 'mohawk') mesh(B(.16, .26, .5), mHair, 0, .6, -.02, head);
    if (hs === 'bowl') { mesh(B(.62, .2, .56), mHair, 0, .55, -.01, head); mesh(B(.62, .1, .1), mHair, 0, .46, .23, head); mesh(B(.08, .26, .5), mHair, .29, .4, -.02, head); mesh(B(.08, .26, .5), mHair, -.29, .4, -.02, head); }
    if (hs === 'buzz') mesh(B(.58, .07, .52), mHair, 0, .54, 0, head);
    const arms = [];
    for (const sx of [1, -1]) { const g = new THREE.Group(); g.position.set(.43 * sx, .76, 0); upper.add(g);
      mesh(B(.2, .24, .22), mMain, 0, -.1, 0, g); mesh(B(.16, .38, .17), kit.pattern === 'gk' ? mMain : mSkin, 0, -.38, 0, g); mesh(B(.18, .15, .19), kit.pattern === 'gk' ? mat('fabric', '#f4f4f4') : mSkin, 0, -.63, 0, g); arms.push(g); }
    if (R.lp) { const s = new THREE.Mesh(new THREE.CircleGeometry(.42, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3, depthWrite: false })); s.rotation.x = -Math.PI / 2; s.position.y = .02; root.add(s); }
    return { root, body, upper, head, legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1] };
  }
  function animateRig(r, a, t) {                                       // 동작: 달리기(앞·뒷걸음·옆걸음) / 받기 터치 / 패스·롱킥·슛·걷어내기 / 헤딩 / 키퍼 준비·캐치·다이빙 / 태클 / 스로인
    const amp = Math.min((a.speed || 0) / 6.5, 1), dirS = a.back ? -1 : 1, s = Math.sin(a.phase || 0) * dirS, side = a.side || 0;
    r.legL.rotation.x = s * .95 * amp * (1 - side * .6); r.legR.rotation.x = -s * .95 * amp * (1 - side * .6); r.armL.rotation.x = -s * .8 * amp; r.armR.rotation.x = s * .8 * amp;
    r.legL.rotation.z = side * .25 * Math.max(0, s); r.legR.rotation.z = -side * .25 * Math.max(0, -s);
    r.armL.rotation.z = .07 + (1 - amp) * .03; r.armR.rotation.z = -.07 - (1 - amp) * .03;
    r.upper.rotation.x = (a.back ? -.08 : .16) * amp + (1 - amp) * Math.sin(t * 2.1 + (a.seed || 0)) * .015; r.upper.rotation.z = 0; r.upper.rotation.y = 0; r.head.rotation.y = (1 - amp) * Math.sin(t * .7 + (a.seed || 0)) * .25; r.head.rotation.x = 0;
    r.body.position.y = Math.abs(Math.cos(a.phase || 0)) * .09 * amp; r.body.rotation.z = 0; r.body.rotation.x = 0;
    if (a.ready) { r.body.position.y = -.1; r.upper.rotation.x = .3; r.armL.rotation.z = .55; r.armR.rotation.z = -.55; r.armL.rotation.x = r.armR.rotation.x = -.35; r.legL.rotation.z = .12; r.legR.rotation.z = -.12; }
    if (a.touch > 0) { const k = Math.sin(clamp(a.touch / .28, 0, 1) * Math.PI); r.legR.rotation.x = -.55 * k; r.upper.rotation.x = .18; }
    if (a.kick > 0) {                                                      // 디딤발을 딛고 차는 발을 뒤로 뺐다가 휘두름. 슛·롱킥·걷어내기는 더 크게, 몸을 뒤로 젖힘
      const big = a.kind === 'shot' || a.kind === 'long' || a.kind === 'clear', D = big ? .45 : .35, p = 1 - a.kick / D, back = big ? 1.5 : 1.1, fwd = big ? 2.9 : 2.4;
      r.legR.rotation.x = p < .38 ? back * p / .38 : back - fwd * (p - .38) / .62; r.legL.rotation.x = -.12;
      r.armL.rotation.x = -.5; r.armL.rotation.z = big ? .95 : .6; r.armR.rotation.z = big ? -.8 : -.5; r.upper.rotation.x = big ? -.22 : -.05; r.upper.rotation.z = big ? .12 : 0; }
    if (a.head > 0) { const k = Math.sin(clamp((.55 - a.head) / .55, 0, 1) * Math.PI); r.body.position.y = .55 * k; r.legL.rotation.x = .5 * k; r.legR.rotation.x = .3 * k; r.armL.rotation.z = .9 * k; r.armR.rotation.z = -.9 * k; r.head.rotation.x = (a.head < .3 ? .55 : -.35) * k; r.upper.rotation.x = (a.head < .3 ? .35 : -.25) * k; }
    if (a.catch > 0) { const k = Math.sin(clamp((.6 - a.catch) / .6, 0, 1) * Math.PI); r.armL.rotation.x = r.armR.rotation.x = -1.6 * k; r.armL.rotation.z = .2; r.armR.rotation.z = -.2; r.body.position.y = .15 * k; r.upper.rotation.x = .2 * k; }
    if (a.slide > 0) { const k = Math.sin(clamp((.6 - a.slide) / .6, 0, 1) * Math.PI); r.body.rotation.x = -1.15 * k; r.body.position.y = .3 * k; r.legR.rotation.x = -1.2 * k; r.legL.rotation.x = .2 * k; r.armL.rotation.z = .9 * k; r.armR.rotation.z = -.9 * k; }
    if (a.kick > 0 && a.kind === 'volley') { r.legR.rotation.x = Math.min(r.legR.rotation.x, 0) - .6; r.body.rotation.z = -.35; r.upper.rotation.z = -.25; }
    if (a.kick > 0 && a.kind === 'chip') { const p = 1 - a.kick / .35; r.legR.rotation.x = p < .5 ? .5 * p / .5 : .5 - 1.6 * (p - .5) / .5; r.upper.rotation.x = -.2; }
    if (a.kick > 0 && a.kind === 'curve') { r.upper.rotation.y = .35; r.legR.rotation.z = -.25; }
    if (a.kick > 0 && a.foot === 'L') { const t1 = r.legR.rotation.x; r.legR.rotation.x = r.legL.rotation.x; r.legL.rotation.x = t1; r.legL.rotation.z = -r.legR.rotation.z; r.legR.rotation.z = 0; r.upper.rotation.y = -r.upper.rotation.y; }   // 왼발잡이는 왼발로
    if (a.duel > 0) { const k = Math.sin(clamp(a.duel / .7, 0, 1) * Math.PI); r.upper.rotation.z = (a.duelS || 1) * .32 * k; r.armL.rotation.z = .45 * k; r.armR.rotation.z = -.45 * k; }
    if (a.hand > 0) { r.armR.rotation.x = -2.4; r.armR.rotation.z = -.2; }
    if (a.punch > 0) { const k = Math.sin(clamp((.5 - a.punch) / .5, 0, 1) * Math.PI); r.armL.rotation.x = r.armR.rotation.x = -2.0 * k; r.body.position.y = .45 * k; r.upper.rotation.x = -.15 * k; }
    if (a.tip > 0) { const k = Math.sin(clamp((.6 - a.tip) / .6, 0, 1) * Math.PI); r.armR.rotation.x = -2.9 * k; r.armR.rotation.z = -.3; r.body.position.y = .8 * k; r.body.rotation.z = -.5 * k; }
    if (a.catchHi > 0) { const k = Math.sin(clamp((.6 - a.catchHi) / .6, 0, 1) * Math.PI); r.armL.rotation.x = r.armR.rotation.x = -2.7 * k; r.body.position.y = .5 * k; }
    if (a.throw) { r.armL.rotation.x = r.armR.rotation.x = -2.9 + (a.throwT || 0) * 1.6; r.armL.rotation.z = .15; r.armR.rotation.z = -.15; r.upper.rotation.x = -.15 + (a.throwT || 0) * .5; }
    if (a.celeb) { r.armL.rotation.x = r.armR.rotation.x = -2.75 + Math.sin(t * 10) * .15; r.armL.rotation.z = .4; r.armR.rotation.z = -.4; r.body.position.y = Math.abs(Math.sin(t * 7 + (a.seed || 0))) * .55; r.head.rotation.y = 0; r.upper.rotation.x = -.12; }
    if (a.dive > 0) { const k = Math.sin(clamp((.7 - a.dive) / .7, 0, 1) * Math.PI); r.body.rotation.z = (a.diveSide || 1) * 1.25 * k; r.body.position.y = (.2 + (a.diveH == null ? 1.4 : a.diveH) * .32) * k; r.armL.rotation.z = .4 + 2.4 * k; r.armR.rotation.z = -.4 - 2.4 * k; r.armL.rotation.x = r.armR.rotation.x = 0; }
    if (a.down) { r.body.rotation.x = -1.45; r.body.position.y = .25; }
  }
  const HAIR_MAP = { short: 'crop', sidepart: 'crop', curly: 'bowl', long: 'bowl', buzz: 'buzz', mohawk: 'mohawk', bun: 'bun' }, BOOTS = ['#111317', '#f4f4f4', '#ff5a36', '#2f7bff', '#ffd23f'];
  function lookFor(p) {
    let lk = { skin: 'tan', hair: 'dark', style: 'short' }; try { lk = lookOf(p) || lk; } catch (e) {}
    return { skin: '#' + ((typeof SKIN_C !== 'undefined' && SKIN_C[lk.skin]) || 'E0A67A'), hair: '#' + ((typeof HAIR_C !== 'undefined' && HAIR_C[lk.hair]) || '3A2A22'), hairStyle: HAIR_MAP[lk.style] || 'crop', boot: BOOTS[(p.id | 0) % BOOTS.length], back: String(p.name || '').split(' ').pop().slice(0, 6) };
  }
  function kitObj(id, main, sec, gk) {
    const dark = lum(main) > .6;
    return { id, main, second: sec, trim: dark ? '#1c1c22' : (lum(sec) > .45 ? sec : '#f2f2f2'), shorts: gk ? '#1c1c22' : sec, socks: main, numCol: dark ? '#1c1c22' : '#ffffff', pattern: gk ? 'gk' : 'plain' };
  }
  function kitOf(pre, gk) { const KT = MV.kit, main = gk ? KT.gk[pre] : KT[pre][0], sec = gk ? '#1c1c22' : (KT[pre][1] || '#ffffff'); return kitObj(pre + main + sec + (gk ? 'g' : ''), main, sec, gk); }
  function rebuildPlayers() {
    for (const pre of ['m', 'o']) { R.pl[pre].forEach(f => f && R.sc.remove(f.root)); R.pl[pre] = []; }
    for (const pre of ['m', 'o']) (pre === 'm' ? MV.mst : MV.ost).forEach((p, i) => {
      const r = buildRig(kitOf(pre, p.sub === 'GK'), String(i === 0 ? 1 : i + 1), lookFor(p)); r.me = !!p.me;
      r.st = { ph: Math.random() * 6, yaw: pre === 'm' ? Math.PI / 2 : -Math.PI / 2, seed: Math.random() * 6, kick: 0, dive: 0, foot: (typeof footOf === 'function' ? footOf(p) : 'R') }; R.sc.add(r.root); R.pl[pre][i] = r;
    });
  }

  // ---------- 매 프레임: MV를 읽어서 위치·동작만 옮김 ----------
  const angLerp = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
  function place(r, gx, gy, vx, vy, dt, bx, by, extra, wantYaw) {      // wantYaw: 상황에 맞게 정한 몸 방향(없으면 이동 방향, 멈춰 있으면 공 쪽)
    const st = r.st, x = wx(gx), z = wz(gy), sp = Math.hypot(vx * WS, vy * WZ);
    r.root.position.set(x, 0, z);
    const toBall = Math.atan2(wx(bx) - x, wz(by) - z), moveYaw = Math.atan2(vx * WS, vy * WZ);
    const yaw = wantYaw != null ? wantYaw : (sp < .6 ? toBall : moveYaw);
    { let dl = yaw - st.yaw; while (dl > Math.PI) dl -= Math.PI * 2; while (dl < -Math.PI) dl += Math.PI * 2;                                       // B7 회전 속도: 빠를수록 천천히, 민첩할수록 빨리
      const om = 7 * (.75 + .25 * ((extra && extra.agi) || 0)) * (1 - .5 * Math.min(1, sp / 14)) * (extra && extra.quick ? 1.6 : 1), stp = Math.min(Math.abs(dl) * Math.min(1, dt * 10), om * dt);
      st.yaw += Math.sign(dl) * stp; } r.root.rotation.y = st.yaw;
    let dot = 1, side = 0; if (sp > .6) { let d = moveYaw - st.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; dot = Math.cos(d); side = Math.abs(Math.sin(d)); }
    const back = dot < -.3, sideStep = !back && side > .65;
    st.ph += dt * (2 + sp * (back ? 1.3 : 1.7));
    for (const k of ['kick', 'dive', 'touch', 'head', 'catch', 'slide', 'duel', 'hand', 'punch', 'tip', 'catchHi']) st[k] = Math.max(0, (st[k] || 0) - dt);
    animateRig(r, Object.assign({ speed: sp, phase: st.ph, seed: st.seed, kick: st.kick, kind: st.kind, dive: st.dive, diveSide: st.diveSide, foot: st.foot, touch: st.touch, head: st.head, catch: st.catch, slide: st.slide, duel: st.duel, duelS: st.duelS, hand: st.hand, punch: st.punch, tip: st.tip, catchHi: st.catchHi, diveH: st.diveH, back, side: sideStep ? .8 : 0 }, extra || {}), R.t);
    if (!(extra && (extra.celeb || extra.down)) && !(st.dive > 0) && !(st.slide > 0) && !(extra && extra.ready)) {
      let rel = toBall - st.yaw; while (rel > Math.PI) rel -= Math.PI * 2; while (rel < -Math.PI) rel += Math.PI * 2;
      const key = extra && extra.key, H = 1.22, U = .44; let hy = 0, uy = 0;
      if (key && MV.scanV && MV.scanV[key] > MV.t) hy = (rel > 0 ? -1 : 1) * 1.05;                                   // B2 스캔: 공 반대쪽으로 고개
      else if (Math.abs(rel) > 1.92 && sp > 2) { st.chk = (st.chk == null ? 0 : st.chk) - dt; if (st.chk <= -.35) st.chk = 1.2 + Math.random() * .8; if (st.chk < 0) { hy = Math.sign(rel) * H; uy = Math.sign(rel) * U; } }   // 공을 등지고 뛸 땐 1.2~2초마다 어깨 너머
      else { hy = clamp(rel, -H, H); if (Math.abs(rel) > H) uy = clamp(rel - Math.sign(rel) * H, -U, U); }       // B1 기본: 고개로 공을 봄, 넘치면 상체를 비틀어
      st.hy = (st.hy || 0) + clamp(hy - (st.hy || 0), -7 * dt, 7 * dt); st.uy = (st.uy || 0) + clamp(uy - (st.uy || 0), -4 * dt, 4 * dt);
      r.head.rotation.y = st.hy; r.upper.rotation.y += st.uy;
      if (key && MV.ask && MV.ask[key] > MV.t) { r.armR.rotation.x = -2.7; r.armR.rotation.z = -.25; }               // B5 공 요구(팔 들기)
      if (key && MV.point && MV.point[key] > MV.t && sp > 1) { r.armL.rotation.x = -1.5; r.armL.rotation.z = .1; }    // B5 침투 방향 가리키기
      if (extra && extra.shake) { r.armR.rotation.x = -1.25; r.armR.rotation.z = -.12; }
      if (extra && extra.jockey) { r.body.position.y -= .07; r.upper.rotation.x += .25; r.legL.rotation.z = .16; r.legR.rotation.z = -.16; }   // B6 낮은 자세
    }
  }
  const angTo = (x1, z1, x2, z2) => Math.atan2(x2 - x1, z2 - z1);
  const angMix = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
  function atkDir(pre) { const M = G0() && G0().mm; let d = 1; try { d = dM_(M); } catch (e) {} return pre === 'm' ? d : -d; }   // 그 팀의 공격 방향(+1: 오른쪽)
  function playerOf(pre, i) { return (pre === 'm' ? MV.mst : MV.ost)[i] || {}; }
  const PAv = (p, k) => (p && p.a && p.a[k]) || 50;
  function recvMode(pre, i, c) {                                           // 받는 자세: 등지고(수비가 붙음) / 몸을 열고(앞이 빔) / 윙어는 터치라인을 등지거나(컷인) 바라보고(돌파·크로스)
    const os = pre === 'm' ? 'o' : 'm', d = atkDir(pre), p = playerOf(pre, i), u = (x) => d > 0 ? x : 100 - x;
    let tight = false; (MV.pos[os] || []).forEach((q, j) => { if (!j || !q || (MV.red && MV.red[os + j])) return; if (Math.hypot(q.x - c.x, q.y - c.y) < 4.5 && u(q.x) > u(c.x) - .5) tight = true; });
    if (p.sub === 'W' && (c.y < 14 || c.y > 50)) return ((PAv(p, 'FIN') + PAv(p, 'DRI')) / 2 - PAv(p, 'CRS') > 4) ? 'win' : 'wout';
    if (tight && (p.sub === 'ST' || p.sub === 'AM' || p.sub === 'W' || p.sub === 'CM')) return 'back';
    return 'open';
  }
  function update(dt) {
    R.t += dt;
    const sig = MV.mst.map(p => p.id).join(',') + '|' + MV.ost.map(p => p.id).join(',');
    if (sig !== R.sig) { R.sig = sig; rebuildPlayers(); }
    const b = MV.ball || { x: 50, y: 32 }; let bx = b.x, by = b.y, bz = MV.act ? (MV.bz || 0) : 0;
    const rp = MV.rp && MV.rp.f, rpI = rp ? Math.floor(MV.rp.t) : 0, rpA = rp && rp[rpI], rpB = rp && (rp[rpI + 1] || rpA), rk = rp ? MV.rp.t - rpI : 0, Lp = (p, q) => p + (q - p) * rk;
    if (rpA) { bx = Lp(rpA.b[0], rpB.b[0]); by = Lp(rpA.b[1], rpB.b[1]); bz = Lp(rpA.b[2], rpB.b[2]); }
    // 킥·헤딩·걷어내기·키퍼 동작: 새 패스/슛이 시작되는 순간을 감지(읽기만)
    const act = MV.act;
    if (act && act !== R.lastAct) {
      const kh = R.lastHolder, r = kh && R.pl[kh.s] && R.pl[kh.s][kh.i];
      if (r && (act.k === 'pass' || act.k === 'shot')) {
        const p = playerOf(kh.s, kh.i), c = MV.pos[kh.s] && MV.pos[kh.s][kh.i], d = atkDir(kh.s), u = c ? (d > 0 ? c.x : 100 - c.x) : 50;
        const high = (R.ballZ || 0) > 1.1 || act.h0 > 1;                   // 공이 떠 있을 때 처리 → 헤딩
        if (high && kh.i !== 0) { r.st.head = .55; }
        else { r.st.kick = act.k === 'shot' ? .45 : .35; r.st.kind = act.k === 'shot' ? 'shot' : (u < 30 && act.to && act.to.s !== kh.s) || (u < 34 && ['CB', 'FB', 'DM', 'GK'].includes(p.sub) && (act.d0 || 0) > 30) ? 'clear' : (act.cross || act.hi || (act.d0 || 0) > 32) ? 'long' : 'pass';
          if (act.k === 'shot' && act.sty) { const k2 = { volley: 'volley', chip: 'chip', curve: 'curve', knuckle: 'shot', drive: 'shot', low: 'shot', tap: 'pass', first: 'shot', overhead: 'volley' }[act.sty]; if (k2) r.st.kind = k2; if (act.sty === 'header') { r.st.kick = 0; r.st.head = .55; } } }
      }
      if (act.k === 'shot' && (act.out === 'post' || (act.out === 'wide' && Math.abs((act.ty || 32) - 32) < 9 && (act.eh || 0) < 2.6)) && Math.random() < .6) { const ds = act.s === 'm' ? 'o' : 'm', gk = R.pl[ds] && R.pl[ds][0]; if (gk) { gk.st.dive = .7; gk.st.diveH = act.eh || 1; gk.st.diveSide = ((act.ty || 32) > 32 ? 1 : -1) * (atkDir(act.s) > 0 ? 1 : -1); } }
      if (act.k === 'shot' && (act.out === 'save' || act.out === 'goal')) { const ds = act.s === 'm' ? 'o' : 'm', gk = R.pl[ds] && R.pl[ds][0];
        if (gk) { const ty = act.ty || 32, eh = act.eh == null ? 1 : act.eh, near = Math.abs(ty - 32) < 2.6 && act.out === 'save';
          if (near) { if (eh > 1.6) gk.st.catchHi = .6; else gk.st.catch = .6; } else { gk.st.dive = .7; gk.st.diveH = eh; gk.st.diveSide = (ty > 32 ? 1 : -1) * (atkDir(act.s) > 0 ? 1 : -1); } } }
      if (act.k === 'pass' && act.to) { const c = MV.pos[act.to.s] && MV.pos[act.to.s][act.to.i]; if (c) R.rmode = { s: act.to.s, i: act.to.i, m: recvMode(act.to.s, act.to.i, c) }; }
    }
    if (!act && R.lastAct && R.lastAct.k === 'pass' && MV.holder) { const r = R.pl[MV.holder.s] && R.pl[MV.holder.s][MV.holder.i]; if (r) { r.st.touch = .28; r.st.keep = R.rmode && R.rmode.s === MV.holder.s && R.rmode.i === MV.holder.i ? R.rmode.m : 'open'; r.st.keepT = .7; } }
    { const sr = MV.slideReq; if (sr && sr !== R.lastSR) { R.lastSR = sr; const r = R.pl[sr.s] && R.pl[sr.s][sr.i]; if (r) r.st.slide = .6; } }
    { const du = MV.duel; if (du && du !== R.lastDu) { R.lastDu = du; for (const [p, sg] of [[du.a, 1], [du.b, -1]]) { const r = R.pl[p.s] && R.pl[p.s][p.i]; if (r) { r.st.duel = .7; r.st.duelS = sg; } } } }
    { const hq = MV.handReq; if (hq && hq !== R.lastHq) { R.lastHq = hq; const r = R.pl[hq.s] && R.pl[hq.s][hq.i]; if (r) r.st.hand = .9; } }
    { const ga = MV.gkAct; if (ga && ga !== R.lastGa) { R.lastGa = ga; const r = R.pl[ga.s] && R.pl[ga.s][0]; if (r) { if (ga.k === 'tip') r.st.tip = .6; else if (ga.k === 'punch') r.st.punch = .5; } } }
    R.lastLbl = MV.lbl; R.lastAct = act; if (MV.holder) R.lastHolder = MV.holder;
    const recv = act && act.k === 'pass' && act.to ? act.to : null;
    let meR = null; const cele = MV.cele, hold = !act && !rpA && MV.holder ? MV.holder : null, sp0 = MV.sp, thr = sp0 && sp0.type === 'th' ? sp0 : null;
    const ballW = { x: wx(bx), z: wz(by) };
    for (const pre of ['m', 'o']) R.pl[pre].forEach((r, i) => {
      if (!r) return; let c = MV.pos[pre] && MV.pos[pre][i];
      if (rpA) { const p = rpA[pre][i], q = (rpB[pre] && rpB[pre][i]) || p; if (p) c = { x: Lp(p[0], q[0]), y: Lp(p[1], q[1]), vx: (q[0] - p[0]) * 7.5, vy: (q[1] - p[1]) * 7.5 }; }
      if (!c) { r.root.visible = false; return; }
      const red = MV.red && MV.red[pre + i]; r.root.visible = !red; if (red) return;
      const down = !!(MV.frz && MV.frz[pre + i] > MV.t), celeb = !!(cele && pre === cele.s && i > 0 && Math.hypot(c.vx || 0, c.vy || 0) < 4);
      const x = wx(c.x), z = wz(c.y), d = atkDir(pre), goalYaw = d > 0 ? Math.PI / 2 : -Math.PI / 2, toBall = angTo(x, z, ballW.x, ballW.z), sp = Math.hypot((c.vx || 0) * WS, (c.vy || 0) * WZ), moveYaw = Math.atan2((c.vx || 0) * WS, (c.vy || 0) * WZ);
      const isRecv = recv && recv.s === pre && recv.i === i, isHold = hold && hold.s === pre && hold.i === i, gk = i === 0;
      let want = null; const extra = { down, celeb };
      r.st.keepT = Math.max(0, (r.st.keepT || 0) - dt);
      if (isRecv) {                                                        // 받기 직전: 받는 자세대로 몸 방향
        const m = R.rmode && R.rmode.s === pre && R.rmode.i === i ? R.rmode.m : 'open', inYaw = angTo(x, z, x, 0);
        want = m === 'back' ? toBall : m === 'win' ? angMix(toBall, inYaw, .45) : m === 'wout' ? angMix(toBall, goalYaw, .55) : angMix(toBall, goalYaw, .45); extra.quick = 1;
      } else if (isHold) {                                                 // 공을 가진 선수: 받은 직후엔 받은 자세 유지(등지고 버티기·컷인·라인 따라 돌파), 움직이면 진행 방향
        const k = r.st.keep, inYaw = angTo(x, z, x, 0);
        if (r.st.keepT > 0 && k === 'back') want = goalYaw + Math.PI;
        else if (r.st.keepT > 0 && k === 'win') want = angMix(inYaw, goalYaw, .35);
        else if (r.st.keepT > 0 && k === 'wout') want = goalYaw;
        else want = sp > 1.2 ? moveYaw : goalYaw;
      } else if (gk) { want = toBall; const own = d > 0 ? bx < 34 : bx > 66; extra.ready = own && !r.st.dive && !r.st.catch; }
      else if (sp > .6) {                                                  // 공 없는 선수: 수비 중 천천히 물러설 땐 공을 보며 뒷걸음, 옆으로 맞출 땐 옆걸음
        const defending = MV.poss && MV.poss !== pre; let dd = moveYaw - toBall; while (dd > Math.PI) dd -= Math.PI * 2; while (dd < -Math.PI) dd += Math.PI * 2;
        want = (defending && sp < 6 && Math.abs(dd) > 1.2) || (sp < 3.5 && Math.abs(dd) > .9) ? toBall : moveYaw;
      } else want = toBall;
      if (MV.intro && (MV.intro.ph === 'line' || MV.intro.ph === 'shake') && sp < 1) want = 0;                // 줄 서서 입장한 쪽을 봄
      if (MV.intro && MV.intro.ph === 'shake') { const op = pre === 'm' ? 'o' : 'm'; let bj = null, bd = 1.7; (MV.pos[op] || []).forEach((q, j) => { if (!q) return; const dd = Math.hypot(q.x - c.x, q.y - c.y); if (dd < bd) { bd = dd; bj = q; } });   // 악수: 지나가는 상대를 보고 손을 내밂
        if (bj) { want = angTo(x, z, wx(bj.x), wz(bj.y)); extra.shake = 1; } }
      extra.key = pre + i; try { extra.agi = typeof nA === 'function' ? nA(playerOf(pre, i), 'AGI') : 0; } catch (e) { extra.agi = 0; }
      { const A = MV.aim; if (isHold && A && A.s === pre && A.i === i) { want = angTo(x, z, wx(A.x), wz(A.y)); extra.quick = 1; } }                // B3 차기 전: 차는 방향으로 몸 정렬
      if (!isHold && MV.jk && MV.jk[pre + i] > MV.t) { const sg = (wz(by) - z) * (atkDir(pre) > 0 ? 1 : -1) > 0 ? 1 : -1; want = toBall + sg * Math.PI / 4; extra.jockey = 1; }   // B6 옆으로 선 지연 자세(터치라인 쪽을 열어 줌)
      if (thr && thr.s === pre && thr.tk === i) { extra.throw = true; extra.throwT = clamp((thr.t || 0) / (thr.dur || 1.5), 0, 1); want = toBall; }
      place(r, c.x, c.y, c.vx || 0, c.vy || 0, dt, bx, by, extra, want); if (r.me) meR = r;
    });
    // 공: 가진 선수 몸 정면 발 앞 / 패스가 거의 도착하면 받는 선수 발 앞으로 / 스로인은 머리 위
    let bp;
    const hr = hold && R.pl[hold.s] && R.pl[hold.s][hold.i];
    const tr = thr && R.pl[thr.s] && R.pl[thr.s][thr.tk];
    if (tr && tr.root.visible && (thr.t || 0) < (thr.dur || 1.5) * .8) { const p = tr.root.position; bp = new THREE.Vector3(p.x, 2.55, p.z); }
    else if (hr && hr.root.visible) { const y = hr.st.yaw, p = hr.root.position; bp = new THREE.Vector3(p.x + Math.sin(y) * .5, BR, p.z + Math.cos(y) * .5);
      const ft = MV.ft; if (ft && ft.s === hold.s && ft.i === hold.i && ft.until > MV.t) { const k = (ft.until - MV.t) / PX_CFG.touch.dur, vx2 = ft.dx * WS, vz2 = ft.dy * WZ, L2 = Math.hypot(vx2, vz2) || 1; bp.x += vx2 / L2 * ft.len * WS * k; bp.z += vz2 / L2 * ft.len * WZ * k; } }
    else {
      bp = new THREE.Vector3(wx(bx), BR + bz * .85, wz(by));
      const rr = recv && R.pl[recv.s] && R.pl[recv.s][recv.i];
      if (rr && act && act.d0) { const p = rr.root.position, fx = p.x + Math.sin(rr.st.yaw) * .5, fz = p.z + Math.cos(rr.st.yaw) * .5, dist = Math.hypot(bp.x - fx, bp.z - fz); if (dist < 3) { const k = 1 - dist / 3; bp.x += (fx - bp.x) * k; bp.z += (fz - bp.z) * k; } }
    }
    R.ballZ = bp.y - BR;
    if (R.bPrev) { const dx = bp.x - R.bPrev.x, dz = bp.z - R.bPrev.z, d = Math.hypot(dx, dz); if (d > 1e-4 && d < 5) R.ball.rotateOnWorldAxis(new THREE.Vector3(dz, 0, -dx).normalize(), d / BR); }
    R.bPrev = bp.clone(); R.ball.position.copy(bp);
    { const hgt = Math.max(0, bp.y - BR), s = 1.5 * (1 + Math.min(hgt, 8) * .09); R.ball.scale.setScalar(s); if (R.ballSh) { R.ballSh.position.set(bp.x, .03, bp.z); const k = 1 / (1 + hgt * .35); R.ballSh.scale.setScalar(1.2 * (.5 + .5 * k)); R.ballSh.material.opacity = .45 * k + .08; } }
    R.ring.visible = false; R.arrow.visible = !!(meR && meR.root.visible);
    if (meR) { const p = meR.root.position, s = 1 + Math.sin(R.t * 5) * .08; R.ring.position.set(p.x, .03, p.z); R.ring.scale.set(s, s, s); R.arrow.position.set(p.x, 2.75 + Math.sin(R.t * 4) * .12, p.z); R.arrow.rotation.y += dt * 2; }
    const rf = MV.ref || { x: 44, y: 40, a1: 50, a2: 50 };
    { const ph = MV.intro && MV.intro.ph, fc = ph === 'line' || ph === 'shake' ? 0 : null, P = R.refPv || (R.refPv = {}), sp3 = [[0, rf.x, rf.y], [1, rf.a1, rf.a1y != null ? rf.a1y : 64.2], [2, rf.a2, rf.a2y != null ? rf.a2y : -.2]];   // 심판 3명(입장 땐 줄에 섬)
      sp3.forEach(([k, gx, gy]) => { const pv = P[k] || { x: gx, y: gy }, vx = dt > 0 ? (gx - pv.x) / dt : 0, vy = dt > 0 ? (gy - pv.y) / dt : 0; P[k] = { x: gx, y: gy }; place(R.ref[k], gx, gy, Math.abs(vx) < 30 ? vx : 0, Math.abs(vy) < 30 ? vy : 0, dt, bx, by, null, fc != null && Math.hypot(vx, vy) < 1 ? fc : null); }); }
    { const of = MV.offFlag; if (of && MV.t - of.t < 1.8) { const ar = of.y > 32 ? R.ref[1] : R.ref[2]; if (ar) { ar.armR.rotation.x = -2.9; ar.armR.rotation.z = -.15; } } }
    const rc = MV.refCard, on = !!(rc && rc.until > MV.t); R.card.visible = on;
    if (on) { const p = R.ref[0].root.position; R.card.position.set(p.x + .45, 2.45, p.z); R.card.material.color.copy(col(rc.c === 'r' ? '#E0262F' : '#F2D21B')); R.ref[0].armR.rotation.x = -2.9; }
    // 관중: 평소 살짝 들썩, 골이면 그 팀 관중이 점프
    const C = R.crowd, mh = G0() && G0().mm && G0().mm.mineHome, celT = cele ? ((cele.s === 'm') === !!mh ? 0 : 1) : -1;
    if (C && C.bodies.visible && (!R.lp || celT >= 0 || R.crowdJ)) { const d = C.dummy, cr = C.crowd;
      for (let i = 0; i < cr.length; i++) { const c = cr[i]; let j = R.lp ? 0 : Math.max(0, Math.sin(R.t * 1.3 + c.ph)) * .03; if (celT >= 0 && c.team === celT) j = Math.abs(Math.sin(R.t * 9 + c.ph)) * .5;
        d.position.set(c.x, c.y + .39 + j, c.z); d.scale.setScalar(c.sc); d.updateMatrix(); C.bodies.setMatrixAt(i, d.matrix); d.position.y += .6 * c.sc; d.updateMatrix(); C.heads.setMatrixAt(i, d.matrix); }
      C.bodies.instanceMatrix.needsUpdate = true; C.heads.instanceMatrix.needsUpdate = true; R.crowdJ = celT >= 0; }
    R.boards.forEach(t => { t.offset.x = (t.offset.x + dt * .035) % 1; });
    camUpdate(bx, by, dt); hudUpdate(dt);
  }
  // ---------- 카메라 5종: 원거리 / 근거리 / 중계 / 홈 골대 뒤 / 원정 골대 뒤 (+ 골 장면 클로즈업) ----------
  const CAMS = [['far', '원거리'], ['near', '근거리'], ['bc', '중계'], ['gh', '홈 골대 뒤'], ['ga', '원정 골대 뒤']];
  function camMode() { try { const v = localStorage.getItem('bfm_cam3d'); if (CAMS.some(c => c[0] === v)) return v; } catch (e) {} return 'bc'; }
  function homeDir() { const M = G0() && G0().mm; let d = 1; try { d = dM_(M); } catch (e) {} return (M && M.mineHome ? d : -d); }   // 홈팀 공격 방향(+1: 오른쪽)
  function camUpdate(gbx, gby, dt) {
    const m = R.cm || (R.cm = camMode()), asp = R.cam.aspect, b = { x: wx(gbx), z: wz(gby) }, pos = new THREE.Vector3(), look = new THREE.Vector3(); let fov = 34, rate = 3;
    const cele = MV.cele, cr = cele && R.pl[cele.s] && R.pl[cele.s][cele.si], narrow = asp < 1.4;
    const IN = MV.intro && (MV.intro.ph === 'walk' || MV.intro.ph === 'line' || MV.intro.ph === 'shake');
    if (IN) {                                                                                  // 입장: 선수들을 따라가며 비추고, 일렬로 서면 정면에서 전체를 담음
      let cx = 0, cz = 0, nn = 0; for (const pre of ['m', 'o']) (R.pl[pre] || []).forEach(r => { if (r && r.root.visible) { cx += r.root.position.x; cz += r.root.position.z; nn++; } }); if (nn) { cx /= nn; cz /= nn; }
      const ln = MV.intro.ph === 'line' || MV.intro.ph === 'shake', dz = ln ? (narrow ? 44 : 34) : (narrow ? 24 : 18); pos.set(cx * .4, ln ? 7 : 6, cz + dz); look.set(cx * .4, ln ? 2.6 : 1.1, cz); fov = ln ? 58 : 40; rate = 1.6; }
    else if (cele && cr && m !== 'far') { const s = cr.root.position, d = s.x > 0 ? 1 : -1; pos.set(s.x - d * 8, 2.8, s.z * .85 + (s.z > 0 ? -4.5 : 4.5)); look.set(s.x, 1.3, s.z); fov = 34; rate = 2.2; }
    else if (m === 'far') { const zf = narrow ? 1.35 : 1; pos.set(b.x * .12, 88 * zf, 72 * zf + b.z * .05); look.set(b.x * .12, 0, 2); fov = 38; rate = 2; }
    else if (m === 'near') { const zf = narrow ? 1.2 : 1; pos.set(clamp(b.x * .96, -L, L), 11 * zf, b.z + 19 * zf); look.set(clamp(b.x, -L, L), .5, b.z - 1); fov = 40; rate = 3.2; }
    else if (m === 'gh' || m === 'ga') {
      const hd = homeDir(), gx = (m === 'gh' ? -hd : hd) * L, out = Math.sign(gx) || 1;       // 홈(원정) 팀이 지키는 골대 뒤에서 경기장을 바라봄
      pos.set(gx + out * 5.6, 3.9, clamp(b.z * .25, -6, 6)); look.set(gx - out * 34, 1.2, b.z * .45); fov = narrow ? 64 : 56; rate = 2.4; }
    else { const zf = narrow ? 1.25 : 1; pos.set(clamp(b.x * .8, -L * .78, L * .78), 30 * zf, (40 + b.z * .1) * zf); look.set(clamp(b.x * .9, -L * .9, L * .9), 0, b.z * .3); fov = 34; }
    const k = R.camInit ? 1 - Math.exp(-rate * dt) : 1; R.camInit = true;
    R.camPos.lerp(pos, k); R.camLook.lerp(look, k); R.fov += (fov - R.fov) * k;
    R.cam.position.copy(R.camPos); R.cam.lookAt(R.camLook); if (Math.abs(R.cam.fov - R.fov) > .01) { R.cam.fov = R.fov; R.cam.updateProjectionMatrix(); }
  }
  // ---------- 경기장 위 HUD: 점수판 · 중계 자막 · 카메라 버튼 (좁은 화면은 한 개 버튼으로 돌려 가며 선택) ----------
  function hudMake(pw) {
    let h = pw.querySelector('.v3hud'); if (h) return h;
    h = document.createElement('div'); h.className = 'v3hud';
    h.innerHTML = `<div class="v3sb"><i class="hc"></i><b class="hn"></b><span class="sc0"></span><b class="an"></b><i class="ac"></i><span class="mn"></span></div><div class="v3cap"><span class="cm"></span><span class="ct"></span></div><button type="button" class="v3gear" data-act="mset" aria-label="경기 설정">⚙</button><button type="button" class="v3full" data-act="mfull" aria-label="가로 전체화면">⛶</button>`;
    pw.appendChild(h); return h;
  }
  function hudUpdate(dt) {
    R.hudT = (R.hudT || 0) - dt; if (R.hudT > 0) return; R.hudT = 0.25;
    const h = R.wrap && hudMake(R.wrap), M = G0() && G0().mm; if (!h || !M) return;
    let sh = 0, sa = 0; try { [sh, sa] = scoreAt(MV.pg ? MV.min - 1 : MV.min); } catch (e) {}
    const short = (n) => { const s = String(n || '').replace(/\s*(FC|SC|CF|AFC|유나이티드)$/i, '').trim(); return s.length > 5 ? s.slice(0, 5) : s; };
    const lg = MV.log && MV.log[0], key = [sh, sa, MV.min, R.cm, lg ? lg.min + lg.t : ''].join('|'); if (key === R.hudK) return; R.hudK = key;
    h.querySelector('.hc').style.background = M.h.col || '#C8202F'; h.querySelector('.ac').style.background = M.a.col || '#2B5BD7';
    h.querySelector('.hn').textContent = short(M.h.name); h.querySelector('.an').textContent = short(M.a.name);
    h.querySelector('.sc0').textContent = `${sh} : ${sa}`; h.querySelector('.mn').textContent = (MV.etOn ? '연장 ' : '') + MV.min + "'";
    const cap = h.querySelector('.v3cap'); cap.style.display = lg ? '' : 'none'; if (lg) { h.querySelector('.cm').textContent = lg.min + "'"; h.querySelector('.ct').innerHTML = lg.t; }
  }
  function resize() {
    const w = R.wrap.clientWidth, h = R.wrap.clientHeight; if (!w || !h || (w === R.w && h === R.h)) return;
    R.w = w; R.h = h; R.rd.setPixelRatio(R.pr); R.rd.setSize(w, h, false); R.cam.aspect = w / h; R.cam.updateProjectionMatrix();
  }
  function perf(dt) {                                                            // 느린 폰: 하이브리드 → 로우폴리 자동 전환(저장), 로우폴리도 느리면 해상도·관중을 줄임
    if (document.hidden) { R.ft.length = 0; return; }
    R.ftT += dt; if (R.ftT < 2.5) return; R.ft.push(dt);
    if (R.ft.length < 90) return;
    const avg = R.ft.reduce((a, c) => a + c, 0) / R.ft.length; R.ft.length = 0;
    if (avg <= 0.05) return;
    if (!R.lp) { try { localStorage.setItem('bfm_gfx', 'lp'); } catch (e) {} S.gfx = 'lp'; stop(); try { toast('폰 성능에 맞춰 로우폴리 3D로 바꿨습니다'); } catch (e) {} sync(); return; }
    if (!R.lowQ) { R.lowQ = true; R.pr = Math.max(0.6, Math.min(1, R.pr) * 0.7); R.w = 0; if (R.crowd) { R.crowd.bodies.visible = R.crowd.heads.visible = false; } try { toast('3D 화질을 낮췄습니다'); } catch (e) {} }
  }
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (!R) return;
    if (!MV) { stop(); return; }
    if (!R.cv.isConnected) { const pw = document.querySelector('#pitchbox .pwrap'); if (pw) attach(pw); else return; }
    const dt = R.last ? Math.min(0.1, (ts - R.last) / 1000) : 0.016; R.last = ts;
    perf(dt); if (!R) return;
    try { resize(); update(dt); R.rd.render(R.sc, R.cam); } catch (e) { try { console.error(e); } catch (x) {} emergency('3D 화면 오류로 이번 경기는 간단한 화면으로 보여줍니다'); }
  }

  // ---------- 3D 로딩 화면: 블록 캐릭터 다섯 명이 공을 주고받는 장면 ----------
  function splash(el, team) {
    if (R || !el) return { stop() {} };
    if (!loadLib()) return { stop() {} };
    const style = gfx(), rd = makeRenderer(style, true); if (!rd) return { stop() {} };
    const ctx = newCtx(rd, style); ctx.cv.className = 'spl3d'; el.appendChild(ctx.cv);
    const prev = R; R = ctx; let alive = true, sraf = 0;
    try {
      const sc = new THREE.Scene(); ctx.sc = sc; sc.background = null;
      const cam = new THREE.PerspectiveCamera(30, 1, .1, 200); ctx.cam = cam;
      if (ctx.lp) { sc.add(new THREE.HemisphereLight(col('#cfe0ff'), col('#2a3a22'), .9)); const s = new THREE.DirectionalLight(col('#fff4e0'), 1.3); s.position.set(4, 8, 6); sc.add(s); }
      else { ctx.env = makeEnv(); sc.environment = ctx.env.texture; const key = new THREE.DirectionalLight(col('#fff4e8'), 2.2); key.position.set(-4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6; sc.add(key); const rim = new THREE.DirectionalLight(col('#9fdcff'), 1.4); rim.position.set(4, 4, -5); sc.add(rim); sc.add(new THREE.HemisphereLight(col('#cfe0ff'), col('#20262e'), .25)); }
      const turf = new THREE.Mesh(new THREE.CircleGeometry(4.6, ctx.lp ? 6 : 6), new THREE.MeshStandardMaterial({ map: grassTex({ base: '#2E8B4A', a: '#319550', b: '#2A8445', pat: 'v' }), roughness: .95 })); turf.rotation.x = -Math.PI / 2; turf.rotation.z = Math.PI / 6; turf.receiveShadow = !ctx.lp; sc.add(turf);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4.7, .05, 6, 6), new THREE.MeshBasicMaterial({ color: col('#ffd23f'), toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.rotation.z = Math.PI / 6; ring.position.y = .02; sc.add(ring);
      const rigs = team.map(([look, kit], i) => { const k = kitObj('spl' + i, kit[0], kit[1] || '#ffffff', false); const lk = { skin: '#' + ((typeof SKIN_C !== 'undefined' && SKIN_C[look.skin]) || 'E0A67A'), hair: '#' + ((typeof HAIR_C !== 'undefined' && HAIR_C[look.hair]) || '3A2A22'), hairStyle: HAIR_MAP[look.style] || 'crop', boot: BOOTS[i % BOOTS.length], back: '' };
        const r = buildRig(k, String(team[i][2] || i + 1), lk); if (i === 0) r.root.position.set(0, 0, .3); else { const a = (i - 1) / (team.length - 1) * Math.PI * 2 + Math.PI / 4; r.root.position.set(Math.cos(a) * 2.9, 0, Math.sin(a) * 2.9); } r.root.rotation.y = Math.atan2(-r.root.position.x, -r.root.position.z); r.st = { ph: i, kick: 0 }; sc.add(r.root); return r; });
      const ball = buildBall(); sc.add(ball);
      let from = 0, to = 1, t = 0, last = 0;
      const frame = (ts) => { if (!alive) return; sraf = requestAnimationFrame(frame); const dt = last ? Math.min(.05, (ts - last) / 1000) : .016; last = ts;
        const w = el.clientWidth, h = el.clientHeight; if (w && h && (w !== ctx.w || h !== ctx.h)) { ctx.w = w; ctx.h = h; rd.setPixelRatio(ctx.pr); rd.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
        t += dt / .9; if (t >= 1) { t = 0; from = to; to = from === 0 ? 1 + Math.floor(Math.random() * (team.length - 1)) : 0; rigs[from].st.kick = .35; }
        const A = rigs[from].root.position, B2 = rigs[to].root.position; ball.position.set(A.x + (B2.x - A.x) * t, .22 + Math.sin(t * Math.PI) * 1.6, A.z + (B2.z - A.z) * t); ball.rotation.x += dt * 8;
        rigs.forEach((r, i) => { r.st.kick = Math.max(0, r.st.kick - dt); const tgt = Math.atan2(ball.position.x - r.root.position.x, ball.position.z - r.root.position.z); r.root.rotation.y = angLerp(r.root.rotation.y, tgt, Math.min(1, dt * 6)); animateRig(r, { speed: 0, phase: 0, seed: i, kick: r.st.kick, celeb: i === to && t > .85 ? 0 : 0 }, ts / 1000); r.body.position.y = Math.abs(Math.sin(ts / 260 + i)) * .06; });
        const a = ts / 4200, cd = cam.aspect < 1.3 ? 13.5 : 11; cam.position.set(Math.cos(a) * cd, 5.6, Math.sin(a) * cd); cam.lookAt(0, 1, 0);
        R = ctx; rd.render(sc, cam); R = prev; };
      sraf = requestAnimationFrame(frame);
    } catch (e) { alive = false; R = prev; disposeCtx(ctx); return { stop() {} }; }
    R = prev;
    return { stop() { alive = false; if (sraf) cancelAnimationFrame(sraf); disposeCtx(ctx); } };
  }
  // ---------- 선수 초상(프로필·MVP·명단 등): 블록 캐릭터를 3/4 각도로 찍은 이미지, 한 번 찍으면 저장해 두고 재사용 ----------
  let PR = null; const pcache = new Map();
  function portraitCtx() {
    const style = gfx(); if (PR && PR.style === style) return PR;
    if (PR) { const r = PR; PR = null; disposeCtx(r); pcache.clear(); }
    if (!loadLib()) return null; const rd = makeRenderer(style, true); if (!rd) return null;
    rd.shadowMap.enabled = false; const ctx = newCtx(rd, style); ctx.pr = 1; rd.setPixelRatio(1); rd.setSize(192, 408, false);
    const prev = R; R = ctx;
    try {
      const sc = new THREE.Scene(); ctx.sc = sc;
      if (ctx.lp) { sc.add(new THREE.HemisphereLight(col('#dfe8ff'), col('#3a3a3a'), 1.0)); const k = new THREE.DirectionalLight(col('#fff4e0'), 1.3); k.position.set(2, 4, 5); sc.add(k); }
      else { ctx.env = makeEnv(); sc.environment = ctx.env.texture; const k = new THREE.DirectionalLight(col('#fff4e8'), 2.0); k.position.set(-2, 4, 5); sc.add(k); const rim = new THREE.DirectionalLight(col('#9fdcff'), 1.2); rim.position.set(3, 3, -4); sc.add(rim); sc.add(new THREE.HemisphereLight(col('#cfe0ff'), col('#20262e'), .3)); }
      const cam = new THREE.OrthographicCamera(-.64, .64, 2.74, -.06, .1, 20); cam.position.set(1.15, 1.45, 3.4); cam.lookAt(0, 1.34, 0);
      const h = 2.8, w = h * 192 / 408; cam.left = -w / 2; cam.right = w / 2; cam.top = h / 2; cam.bottom = -h / 2; cam.updateProjectionMatrix(); ctx.cam = cam;
    } catch (e) { R = prev; disposeCtx(ctx); return null; }
    R = prev; PR = ctx; return PR;
  }
  function portrait(look, kit, k) {                                               // k: 확대 배율(기본 1, 아이콘 등 고화질용)
    k = Math.max(1, Math.min(6, k || 1)); const key = JSON.stringify([look, kit, gfx(), k]); if (pcache.has(key)) return pcache.get(key);
    const ctx = portraitCtx(); if (!ctx) return null;
    const prev = R; R = ctx; let url = null, rig = null;
    try {
      const lk = { skin: '#' + ((typeof SKIN_C !== 'undefined' && SKIN_C[look && look.skin]) || 'E0A67A'), hair: '#' + ((typeof HAIR_C !== 'undefined' && HAIR_C[look && look.hair]) || '3A2A22'), hairStyle: HAIR_MAP[look && look.style] || 'crop', boot: '#111317', back: '' };
      const main = (kit && kit[0]) || '#1E8F4E', sec = (kit && kit[1]) || '#F3F3F3', gk = false;
      rig = buildRig(kitObj('pt' + main + sec, main, sec, gk), '', lk); rig.root.position.set(0, -.02, 0); rig.root.rotation.y = 0;
      rig.armL.rotation.z = .1; rig.armR.rotation.z = -.1; ctx.sc.add(rig.root);
      if (k > 1) ctx.rd.setSize(192 * k, 408 * k, false);
      ctx.rd.render(ctx.sc, ctx.cam); url = ctx.rd.domElement.toDataURL('image/png');
    } catch (e) { url = null; }
    if (k > 1) { try { ctx.rd.setSize(192, 408, false); } catch (e) {} }
    if (rig) { ctx.sc.remove(rig.root); rig.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    R = prev; if (url) pcache.set(key, url); return url;
  }
  function setCam(v) { if (!CAMS.some(c => c[0] === v)) return; try { localStorage.setItem('bfm_cam3d', v); } catch (e) {} if (R) { R.cm = v; R.hudK = ''; } }
  function camNow() { return (R && R.cm) || camMode(); }
  return { sync, stop, active: () => !!R, glOK, splash, CAMS, setCam, camNow, portrait, BALLS, ballSkin, setBall };
})();
