// ---- 3D 경기 화면 (설정에서 켜는 선택 기능, 기본값 꺼짐) — 채택 시안 "하이브리드" ----
// 하이브리드 = 캐릭터는 로우폴리 블록(각진 상자), 재질·조명·경기장은 PBR(반사 환경광, 실시간 그림자, 천·피부·광택 재질).
// 원칙: 화면 상태 MV(선수 위치·공·심판)를 "읽어서 그리기만" 한다.
//       Core·게임 난수(G.rs)·경기 결과·세이브는 절대 건드리지 않는다. (여기 쓰는 Math.random은 관중·재질 무늬 같은 그림용)
//       WebGL이 없거나, 3D 파일을 못 읽거나, 폰이 느리면 자동으로 2D로 돌아간다.
// three.js(r128)는 처음 3D를 켤 때만 읽는다(기본 2D에서는 시작 속도에 영향 없음).
const V3D = (() => {
  let R = null, raf = 0;
  const L = 35, W = 22.5, GW = 3.5, GH = 2.6, BR = 0.3;                  // 3D 경기장 크기(시안과 동일). 게임 좌표 100×64 → 이 크기로 변환
  const wx = (g) => (g - 50) * (L / 49), wz = (g) => (g - 32) * (W / 31), WS = L / 49;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const col = (h) => new THREE.Color(h).convertSRGBToLinear();

  function loadLib() {
    if (window.THREE) return true;
    const src = document.getElementById('three-src'); if (!src) return false;
    try { const s = document.createElement('script'); s.textContent = src.textContent; document.head.appendChild(s); } catch (e) { return false; }
    return !!window.THREE;
  }
  function fallback(msg) {
    stop(); S.v3d = false; try { localStorage.setItem('bfm_view3d', '0'); } catch (e) {}
    try { viewApply(); if (MV) renderMatch(); } catch (e) {}
    try { toast(msg); } catch (e) {}
  }
  function sync() {
    const pw = document.querySelector('#pitchbox .pwrap');
    if (!S.v3d || !MV || !pw) { stop(); return; }
    if (R) { if (R.wrap !== pw || !R.cv.isConnected) attach(pw); return; }
    start(pw);
  }
  function start(pw) {
    if (!loadLib()) { fallback('3D 파일을 불러오지 못해 2D로 보여줍니다'); return; }
    let rd = null; try { rd = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); } catch (e) { rd = null; }
    if (!rd || !rd.getContext()) { fallback('이 폰은 3D를 지원하지 않아 2D로 보여줍니다'); return; }
    rd.outputEncoding = THREE.sRGBEncoding; rd.toneMapping = THREE.ACESFilmicToneMapping; rd.toneMappingExposure = 1.08;
    rd.shadowMap.enabled = true; rd.shadowMap.type = THREE.PCFSoftShadowMap;
    R = { rd, cv: rd.domElement, pr: Math.min(window.devicePixelRatio || 1, 1.5), sig: '', pl: { m: [], o: [] }, last: 0, ft: [], ftT: 0, lowQ: false, w: 0, h: 0, tex: new Map(), mats: new Map(), t: 0 };
    R.cv.className = 'v3c';
    R.cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (R && R.rd === rd && !R.dead) fallback('3D 화면이 멈춰 2D로 바꿨습니다'); });
    try { build(); } catch (e) { try { console.error(e); } catch (x) {} fallback('3D 화면을 만들지 못해 2D로 보여줍니다'); return; }
    attach(pw);
    raf = requestAnimationFrame(loop);
  }
  function attach(pw) { R.wrap = pw; pw.insertBefore(R.cv, pw.firstChild); pw.classList.add('v3d'); R.sig = ''; R.w = 0; R.hudK = ''; R.hudT = 0; hudMake(pw); }
  function stop() {
    if (raf) cancelAnimationFrame(raf); raf = 0;
    document.querySelectorAll('.pwrap.v3d').forEach(e => e.classList.remove('v3d')); document.querySelectorAll('.v3hud').forEach(e => e.remove());
    if (!R) return; const r = R; R = null; r.dead = true;
    try { r.cv.remove(); } catch (e) {}
    try { r.sc.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => m.dispose()); }); } catch (e) {}
    try { r.tex.forEach(t => t.dispose()); if (r.env) r.env.dispose(); } catch (e) {}
    try { r.rd.dispose(); r.rd.forceContextLoss(); } catch (e) {}
  }

  // ---------- 텍스처(캔버스로 직접 그림, 외부 파일 없음) ----------
  function cached(k, fn) { if (!R.tex.has(k)) R.tex.set(k, fn()); return R.tex.get(k); }
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function toTex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, R.rd.capabilities.getMaxAnisotropy()); return t; }
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
        if (num !== '') { rr(x, 46, 66, 46, 54, 12); x.fillStyle = kit.second; x.fill(); x.lineWidth = 4; x.strokeStyle = kit.trim; x.stroke(); x.font = `700 50px ${NUMFONT}`; x.lineWidth = 4; x.strokeStyle = kit.trim; x.strokeText(num, 190, 94); x.fillStyle = kit.numCol; x.fillText(num, 190, 94); }
      } else if (num !== '') {
        x.font = '700 24px sans-serif'; x.fillStyle = kit.numCol; x.fillText(name, 128, 48);
        x.font = `700 154px ${NUMFONT}`; x.lineWidth = 6; x.strokeStyle = kit.trim; x.strokeText(num, 128, 160); x.fillStyle = kit.numCol; x.fillText(num, 128, 160);
      }
      const id = x.getImageData(0, 0, 256, 256), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(id, 0, 0);
      const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(0,0,0,.14)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
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
      else { g.addColorStop(0, '#0d1218'); g.addColorStop(.5, '#233040'); g.addColorStop(.62, '#121820'); g.addColorStop(1, '#07090c'); }
      x.fillStyle = g; x.fillRect(0, 0, 4, 512); return toTex(c); });
  }
  function grassTex(pt) {                                                         // 시안의 PBR 잔디(잔디 결·얼룩·골문 앞 마모) + 구장별 잔디 색
    return cached('grass' + pt.base, () => {
      const PW = 78, PH = 53, cw = 2048, s = cw / PW, ch = Math.round(PH * s), c = mkCanvas(cw, ch), x = c.getContext('2d');
      const X = v => (v + PW / 2) * s, Z = v => (v + PH / 2) * s;
      const dark = (h, k) => { const n = parseInt(h.slice(1), 16); const f = (v) => Math.round(v * k); return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`; };
      const dirt = pt.pat === 'n', ka = dirt ? .72 : Math.min(.82, .3 / Math.max(.2, lum(pt.base)));
      x.fillStyle = dark(pt.base, ka); x.fillRect(0, 0, cw, ch);
      const n = 14, sw = (2 * L + 8) / n;
      if (!dirt) for (let i = 0; i < n; i++) { x.fillStyle = dark(i % 2 ? pt.a : pt.b, ka); x.fillRect(X(-L - 4 + i * sw), 0, sw * s + 1, ch); }
      const m = mkCanvas(80, 54), mx = m.getContext('2d');
      for (let i = 0; i < 80 * 54; i++) { mx.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '190,220,120'},${Math.random() * .25})`; mx.fillRect(i % 80, Math.floor(i / 80), 1, 1); }
      x.imageSmoothingEnabled = true; x.globalAlpha = .5; x.drawImage(m, 0, 0, cw, ch); x.globalAlpha = 1;
      for (const sx of [-1, 1]) { const g = x.createRadialGradient(X(sx * (L - 4)), Z(0), 0, X(sx * (L - 4)), Z(0), 5 * s); g.addColorStop(0, 'rgba(120,96,60,.45)'); g.addColorStop(1, 'rgba(120,96,60,0)'); x.fillStyle = g; x.fillRect(X(sx * (L - 4)) - 5 * s, Z(0) - 5 * s, 10 * s, 10 * s); }
      const id = x.getImageData(0, 0, cw, ch), d = id.data; for (let i = 0; i < d.length; i += 4) { const k = (Math.random() - .5) * 26; d[i] += k * .6; d[i + 1] += k; d[i + 2] += k * .4; } x.putImageData(id, 0, 0);
      x.strokeStyle = 'rgba(240,244,236,.88)'; x.lineWidth = .13 * s;
      const line = (a, b, c2, d2) => { x.beginPath(); x.moveTo(X(a), Z(b)); x.lineTo(X(c2), Z(d2)); x.stroke(); };
      x.strokeRect(X(-L), Z(-W), 2 * L * s, 2 * W * s); line(0, -W, 0, W);
      x.beginPath(); x.arc(X(0), Z(0), 8 * WS * s, 0, Math.PI * 2); x.stroke();
      const dot = (a, b) => { x.beginPath(); x.arc(X(a), Z(b), .22 * s, 0, Math.PI * 2); x.fillStyle = x.strokeStyle; x.fill(); };
      dot(0, 0);
      for (const sx of [-1, 1]) {                                                    // 박스 크기는 2D 경기장(게임 좌표)과 같은 비율
        const bx = sx * L, bd = 14 * WS, bw = 30 * (W / 31), sd = 5 * WS, sww = 14 * (W / 31), ps = 10 * WS;
        x.strokeRect(Math.min(X(bx), X(bx - sx * bd)), Z(-bw / 2), bd * s, bw * s);
        x.strokeRect(Math.min(X(bx), X(bx - sx * sd)), Z(-sww / 2), sd * s, sww * s);
        dot(bx - sx * ps, 0);
        x.beginPath(); x.arc(X(bx - sx * ps), Z(0), 6 * WS * s, sx > 0 ? Math.PI * 0.62 : -Math.PI * 0.38, sx > 0 ? Math.PI * 1.38 : Math.PI * 0.38); x.stroke();
        for (const sz of [-1, 1]) { x.beginPath(); x.arc(X(bx), Z(sz * W), .8 * s, 0, Math.PI * 2); x.stroke(); }
      }
      return toTex(c);
    });
  }
  function netTex() { return cached('net', () => { const c = mkCanvas(64, 64), x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineWidth = 3; x.strokeRect(0, 0, 64, 64); const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 4); return t; }); }
  function boardTex() {                                                            // LED 광고판(모두 가상의 이름)
    return cached('board', () => { const c = mkCanvas(1024, 64), x = c.getContext('2d');
      const items = [['#05080e', '#9fdcff', 'BLOCK FOOTBALL MANAGER'], ['#05080e', '#ffffff', '큐브 에너지'], ['#05080e', '#ff7a59', 'BRICK AIR'], ['#05080e', '#c6ff6a', 'PIXEL BANK']], wseg = [400, 208, 208, 208]; let px = 0;
      items.forEach((it, i) => { x.fillStyle = it[0]; x.fillRect(px, 0, wseg[i], 64); x.fillStyle = it[1]; x.font = `700 ${i ? 30 : 32}px ${NUMFONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = it[1]; x.shadowBlur = 10; x.fillText(it[2], px + wseg[i] / 2, 33); x.shadowBlur = 0; px += wseg[i]; });
      const t = toTex(c); t.wrapS = THREE.RepeatWrapping; return t; });
  }
  function glowTex() { return cached('glow', () => { const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,250,235,.55)'); g.addColorStop(1, 'rgba(255,250,235,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return toTex(c); }); }

  // ---------- 재질(하이브리드: 블록 모양 + PBR 재질) ----------
  function mat(kind, color, o = {}) {
    const key = kind + '|' + color + '|' + (o.key || ''); if (R.mats.has(key)) return R.mats.get(key); let m;
    switch (kind) {
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
  function makeEnv() {                                                             // 야간 경기장 반사광(PMREM) — 조명탑 네 개가 비치는 환경
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex('pbr'), side: THREE.BackSide })));
    const panel = (c, w, h, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c, c, c * .92), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) panel(16, 10, 5, x * 30, 22, z * 24);
    const gnd = new THREE.Mesh(new THREE.CircleGeometry(48, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(.03, .07, .03) })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -3; s.add(gnd);
    const gen = new THREE.PMREMGenerator(R.rd), rt = gen.fromScene(s, .02); gen.dispose();
    s.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    return rt;
  }

  // ---------- 경기장 ----------
  function build() {
    const sc = new THREE.Scene(); R.sc = sc; const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
    const cam = new THREE.PerspectiveCamera(34, 1.56, .5, 900); R.cam = cam; R.camPos = new THREE.Vector3(0, 30, 50); R.camLook = new THREE.Vector3(); R.fov = 34;
    sc.add(new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex('pbr'), side: THREE.BackSide, fog: false, depthWrite: false })));
    sc.fog = new THREE.Fog(col('#121d31'), 120, 360);
    R.env = makeEnv(); sc.environment = R.env.texture;
    sc.add(new THREE.HemisphereLight(col('#9db7ff'), col('#16241a'), .3));
    const sun = new THREE.DirectionalLight(col('#f3f6ff'), 2.3); sun.position.set(26, 62, 30);
    const fill = new THREE.DirectionalLight(col('#dfe8ff'), .75); fill.position.set(-34, 40, -26); sc.add(fill);
    sun.castShadow = true; const sh = sun.shadow.camera; sh.left = -52; sh.right = 52; sh.top = 40; sh.bottom = -40; sh.near = 10; sh.far = 170;
    sun.shadow.mapSize.set(1536, 1536); sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; sun.shadow.radius = 3; sc.add(sun); sc.add(sun.target); R.sun = sun;
    const pt = MV.pitch || { base: '#2E8B4A', a: '#319550', b: '#2A8445', pat: 'v' };
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(78, 53), new THREE.MeshStandardMaterial({ map: grassTex(pt), roughness: .93, metalness: 0 })); pitch.rotation.x = -Math.PI / 2; pitch.receiveShadow = true; sc.add(pitch);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), mat('flat', '#1b1e23', { r: .95 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.03; ground.receiveShadow = true; sc.add(ground);
    // 골대: 광택 도장 + 그물
    for (const s of [1, -1]) {
      const g = new THREE.Group(); g.position.x = s * L; sc.add(g);
      const pm = new THREE.MeshPhysicalMaterial({ color: col('#f4f6f8'), roughness: .25, clearcoat: 1 }), pr = .1;
      for (const z of [-GW, GW]) { const p = new THREE.Mesh(box(pr * 2, GH, pr * 2), pm); p.position.set(0, GH / 2, z); p.castShadow = true; g.add(p); }
      const bar = new THREE.Mesh(box(pr * 2, pr * 2, GW * 2 + pr * 2), pm); bar.position.set(0, GH, 0); bar.castShadow = true; g.add(bar);
      const nm = new THREE.MeshStandardMaterial({ map: netTex(), alphaTest: .4, side: THREE.DoubleSide, color: col('#e8ecf0'), roughness: .8 }), D = 1.8;
      const back = new THREE.Mesh(new THREE.PlaneGeometry(GW * 2, GH), nm); back.rotation.y = Math.PI / 2; back.position.set(s * D, GH / 2, 0); g.add(back);
      const top = new THREE.Mesh(new THREE.PlaneGeometry(D, GW * 2), nm); top.rotation.x = -Math.PI / 2; top.position.set(s * D / 2, GH, 0); g.add(top);
      for (const z of [-GW, GW]) { const sd = new THREE.Mesh(new THREE.PlaneGeometry(D, GH), nm); sd.position.set(s * D / 2, GH / 2, z); g.add(sd); }
    }
    // LED 광고판(발광)
    const bt = boardTex(); R.boards = [];
    for (const [x, z, len, ry] of [[0, W + 2.6, 74, Math.PI], [0, -(W + 2.6), 74, 0], [L + 2.6, 0, 49, -Math.PI / 2], [-(L + 2.6), 0, 49, Math.PI / 2]]) {
      const t = bt.clone(); t.needsUpdate = true; t.repeat.set(len / 16, 1); R.tex.set('board' + x + z, t); R.boards.push(t);
      const m = new THREE.MeshStandardMaterial({ map: t, emissive: col('#ffffff'), emissiveMap: t, emissiveIntensity: 1.15, roughness: .4 });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(len, 1), m); pl.position.set(x, .55, z); pl.rotation.y = ry; sc.add(pl);
      const bk = new THREE.Mesh(box(len, 1.1, .25), mat('flat', '#0c0f14')); bk.position.set(x, .55, z); bk.rotation.y = ry; bk.translateZ(-.14); sc.add(bk);
    }
    // 관중석(7단) + 지붕·기둥·조명띠 + 관중(인스턴스, 홈/원정 색)
    const crowd = [], K = MV.kit || { m: ['#C8202F', '#fff'], o: ['#2B5BD7', '#fff'] }, home = MV && G0() && G0().mm && G0().mm.mineHome ? K.m : K.o, away = home === K.m ? K.o : K.m;
    const TIERS = 7, TD = 1.7, TH = .85;
    for (const sd of [{ ax: 'z', s: 1, len: 84 }, { ax: 'z', s: -1, len: 84 }, { ax: 'x', s: 1, len: 58 }, { ax: 'x', s: -1, len: 58 }]) {
      const base = (sd.ax === 'z' ? W : L) + 4.6;
      for (let i = 0; i < TIERS; i++) {
        const h = (i + 1) * TH, off = base + i * TD + TD / 2;
        const m = new THREE.Mesh(sd.ax === 'z' ? box(sd.len, h, TD) : box(TD, h, sd.len), mat('flat', i % 2 ? '#222a35' : '#2a3340', { r: .6 }));
        if (sd.ax === 'z') m.position.set(0, h / 2, sd.s * off); else m.position.set(sd.s * off, h / 2, 0); m.receiveShadow = true; sc.add(m);
        const n = Math.floor(sd.len / 1.05);
        for (let k = 0; k < n; k++) { if (Math.random() < .13) continue; const t = -sd.len / 2 + (k + .5) * 1.05 + (Math.random() - .5) * .2, r = Math.random(), team = r < .5 ? 0 : r < .82 ? 1 : 2;
          crowd.push({ x: sd.ax === 'z' ? t : sd.s * off, z: sd.ax === 'z' ? sd.s * off : t, y: h, team, ph: Math.random() * 6.28, sc: .9 + Math.random() * .2 }); }
      }
      const topH = TIERS * TH + 2.4, wo = base + TIERS * TD + .3;
      const wall = new THREE.Mesh(sd.ax === 'z' ? box(sd.len, topH, .6) : box(.6, topH, sd.len), mat('flat', '#151a21'));
      if (sd.ax === 'z') wall.position.set(0, topH / 2, sd.s * wo); else wall.position.set(sd.s * wo, topH / 2, 0); sc.add(wall);
      if (sd.ax === 'z') {
        const roof = new THREE.Mesh(box(sd.len + 4, .5, 15), mat('metal', '#2a3038', { r: .45 })); roof.position.set(0, topH + 3.2, sd.s * (wo - 6.5)); roof.rotation.x = sd.s * -.08; sc.add(roof);
        for (let k = -3; k <= 3; k++) { const p = new THREE.Mesh(box(.5, topH + 3.2, .5), mat('metal', '#3a414b')); p.position.set(k * 13, (topH + 3.2) / 2, sd.s * wo); sc.add(p); }
        const strip = new THREE.Mesh(box(sd.len, .12, .3), new THREE.MeshStandardMaterial({ color: col('#000000'), emissive: col('#cfe6ff'), emissiveIntensity: 2 })); strip.position.set(0, topH + 2.85, sd.s * (wo - 13.8)); sc.add(strip);
      }
    }
    const N = crowd.length, cm = new THREE.MeshStandardMaterial({ roughness: .75, flatShading: true }), hm = new THREE.MeshStandardMaterial({ roughness: .6, flatShading: true });
    const bodies = new THREE.InstancedMesh(box(.62, .78, .46), cm, N), heads = new THREE.InstancedMesh(box(.38, .38, .38), hm, N);
    const pal = [[home[0], home[1] || '#ffffff', home[0]], [away[0], away[1] || '#ffffff', away[0]], ['#6b7380', '#d6c7a1', '#40454d', '#9a5b3c']], SK = ['#f1c9a5', '#e0ac85', '#c68b62', '#8d5a3b', '#f6d7bd', '#a8714d'];
    const dummy = new THREE.Object3D();
    crowd.forEach((c, i) => { const p = pal[c.team]; bodies.setColorAt(i, col(p[Math.floor(Math.random() * p.length)])); heads.setColorAt(i, col(SK[Math.floor(Math.random() * SK.length)]));
      dummy.position.set(c.x, c.y + .39, c.z); dummy.scale.setScalar(c.sc); dummy.updateMatrix(); bodies.setMatrixAt(i, dummy.matrix); dummy.position.y = c.y + .39 + .6 * c.sc; dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix); });
    sc.add(bodies, heads); R.crowd = { crowd, bodies, heads, dummy };
    // 조명탑 + 빛 번짐
    const gm = new THREE.SpriteMaterial({ map: glowTex(), color: col('#fff1d8'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const px = x * (L + 17), pz = z * (W + 19), hgt = 34;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.55, .9, hgt, 8), mat('metal', '#4a525e')); pole.position.set(px, hgt / 2, pz); sc.add(pole);
      const head = new THREE.Group(); head.position.set(px, hgt + 1.5, pz); head.lookAt(0, 0, 0); sc.add(head);
      head.add(new THREE.Mesh(box(8, 4.2, .6), mat('metal', '#2b3038')));
      const lm = new THREE.MeshStandardMaterial({ color: col('#000000'), emissive: col('#fff6e2'), emissiveIntensity: 3.2 });
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), lm); lamp.position.set(-2.85 + i * 1.9, -.95 + j * 1.9, .31); head.add(lamp); }
      const glow = new THREE.Sprite(gm); glow.scale.set(30, 30, 1); glow.position.set(0, 0, 1.5); head.add(glow);
    }
    // 공: 로우폴리(정이십면체) + 광택 코팅
    { const g = new THREE.IcosahedronGeometry(BR, 2), p = g.attributes.position, cols = [], v = new THREE.Vector3(), dirs = [], g0 = new THREE.IcosahedronGeometry(1, 0), p0 = g0.attributes.position;
      for (let i = 0; i < p0.count; i++) { const d = new THREE.Vector3().fromBufferAttribute(p0, i).normalize(); if (!dirs.some(o => o.distanceTo(d) < 1e-3)) dirs.push(d); } g0.dispose();
      const blk = col('#1b1d22'), wh = col('#ffffff');
      for (let f = 0; f < p.count; f += 3) { let dk = false; for (let k = 0; k < 3; k++) { v.fromBufferAttribute(p, f + k).normalize(); if (dirs.some(d => d.distanceTo(v) < 1e-3)) dk = true; } const c = dk ? blk : wh; for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      R.ball = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ vertexColors: true, flatShading: true, roughness: .32, clearcoat: .9, clearcoatRoughness: .15 })); R.ball.castShadow = true; sc.add(R.ball); R.bPrev = null; }
    // 내 선수 표시
    R.ring = new THREE.Mesh(new THREE.RingGeometry(.95, 1.15, 32), new THREE.MeshBasicMaterial({ color: col('#FFD23F'), transparent: true, opacity: .95, depthWrite: false, toneMapped: false })); R.ring.rotation.x = -Math.PI / 2; R.ring.visible = false; sc.add(R.ring);
    R.arrow = new THREE.Mesh(new THREE.ConeGeometry(.32, .55, 4), new THREE.MeshBasicMaterial({ color: col('#FFD23F'), toneMapped: false })); R.arrow.rotation.x = Math.PI; R.arrow.visible = false; sc.add(R.arrow);
    // 심판
    let rc = '#1A1A1A'; try { rc = refCol(); } catch (e) {}
    const rk = { id: 'ref' + rc, main: rc, second: '#111111', trim: '#111111', shorts: '#111111', socks: '#111111', numCol: '#ffffff', pattern: 'plain' }, rl = { skin: '#e0ac85', hair: '#2b2420', hairStyle: 'buzz', boot: '#111317' };
    R.ref = [0, 1, 2].map(() => { const r = buildRig(rk, '', rl); sc.add(r.root); r.st = { ph: 0, yaw: 0 }; return r; });
    R.ref.forEach((r, i) => { if (i) { const f = new THREE.Mesh(box(.04, .45, .55), mat('flat', '#ff5a2e')); f.position.set(0, -.7, .3); r.armR.add(f); } });
    R.card = new THREE.Mesh(box(.32, .45, .04), new THREE.MeshBasicMaterial({ color: col('#F2D21B'), toneMapped: false })); R.card.visible = false; sc.add(R.card);
  }
  // ---------- 블록 캐릭터(시안 그대로: 각진 상자 + 천·피부·광택 축구화 재질) ----------
  function buildRig(kit, num, look) {
    const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const mesh = (geo, m, x, y, z, par) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; par.add(o); return o; };
    const mMain = mat('fabric', kit.main), mShorts = mat('fabric', kit.shorts), mSock = mat('fabric', kit.socks), mSkin = mat('skin', look.skin), mHair = mat('hair', look.hair), mBoot = mat('boot', look.boot), mEye = mat('eye', '#15171c');
    const tf = jerseyTex(kit, num, 'front', look.back || ''), tb = jerseyTex(kit, num, 'back', look.back || '');
    const mF = mat('fabric', '#ffffff', { map: tf, key: tf.uuid }), mB = mat('fabric', '#ffffff', { map: tb, key: tb.uuid }), legs = [];
    for (const sx of [1, -1]) { const g = new THREE.Group(); g.position.set(.16 * sx, .9, 0); body.add(g); mesh(B(.24, .3, .26), mSkin, 0, -.15, 0, g); mesh(B(.26, .42, .28), mSock, 0, -.5, 0, g); mesh(B(.28, .16, .42), mBoot, 0, -.8, .05, g); legs.push(g); }
    const upper = new THREE.Group(); upper.position.y = .9; body.add(upper);
    mesh(B(.62, .32, .36), mShorts, 0, .06, 0, upper);
    const torso = new THREE.Mesh(B(.66, .62, .38), [mMain, mMain, mMain, mMain, mF, mB]); torso.position.y = .5; torso.castShadow = true; torso.receiveShadow = true; upper.add(torso);
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
    return { root, body, upper, head, legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1] };
  }
  function animateRig(r, a, t) {
    const amp = Math.min((a.speed || 0) / 6.5, 1), s = Math.sin(a.phase || 0);
    r.legL.rotation.x = s * .95 * amp; r.legR.rotation.x = -s * .95 * amp; r.armL.rotation.x = -s * .8 * amp; r.armR.rotation.x = s * .8 * amp;
    r.armL.rotation.z = .07 + (1 - amp) * .03; r.armR.rotation.z = -.07 - (1 - amp) * .03;
    r.upper.rotation.x = .16 * amp + (1 - amp) * Math.sin(t * 2.1 + (a.seed || 0)) * .015; r.head.rotation.y = (1 - amp) * Math.sin(t * .7 + (a.seed || 0)) * .25;
    r.body.position.y = Math.abs(Math.cos(a.phase || 0)) * .09 * amp; r.body.rotation.z = 0; r.body.rotation.x = 0;
    if (a.kick > 0) { const p = 1 - a.kick / .35; r.legR.rotation.x = p < .35 ? 1.1 * p / .35 : 1.1 - 2.6 * (p - .35) / .65; r.legL.rotation.x = -.1; r.armL.rotation.x = -.5; r.armL.rotation.z = .6; r.armR.rotation.z = -.5; r.upper.rotation.x = -.05; }
    if (a.celeb) { r.armL.rotation.x = r.armR.rotation.x = -2.75 + Math.sin(t * 10) * .15; r.armL.rotation.z = .4; r.armR.rotation.z = -.4; r.body.position.y = Math.abs(Math.sin(t * 7 + (a.seed || 0))) * .55; r.head.rotation.y = 0; r.upper.rotation.x = -.12; }
    if (a.dive > 0) { const k = Math.sin(clamp((.7 - a.dive) / .7, 0, 1) * Math.PI); r.body.rotation.z = (a.diveSide || 1) * 1.25 * k; r.body.position.y = .7 * k; r.armL.rotation.z = .4 + 2.4 * k; r.armR.rotation.z = -.4 - 2.4 * k; r.armL.rotation.x = r.armR.rotation.x = 0; }
    if (a.down) { r.body.rotation.x = -1.45; r.body.position.y = .25; }
  }
  const HAIR_MAP = { short: 'crop', sidepart: 'crop', curly: 'bowl', long: 'bowl', buzz: 'buzz', mohawk: 'mohawk', bun: 'bun' }, BOOTS = ['#111317', '#f4f4f4', '#ff5a36', '#2f7bff', '#ffd23f'];
  const lum = (h) => { const n = parseInt(String(h).slice(1, 7), 16); return ((n >> 16 & 255) * .299 + (n >> 8 & 255) * .587 + (n & 255) * .114) / 255; };
  function kitOf(pre, gk) {
    const K = MV.kit, main = gk ? K.gk[pre] : K[pre][0], sec = gk ? '#1c1c22' : (K[pre][1] || '#ffffff'), dark = lum(main) > .6;
    return { id: pre + main + sec + (gk ? 'g' : ''), main, second: sec, trim: dark ? '#1c1c22' : (lum(sec) > .45 ? sec : '#f2f2f2'), shorts: gk ? '#1c1c22' : sec, socks: main, numCol: dark ? '#1c1c22' : '#ffffff', pattern: gk ? 'gk' : 'plain' };
  }
  function rebuildPlayers() {
    for (const pre of ['m', 'o']) { R.pl[pre].forEach(f => f && R.sc.remove(f.root)); R.pl[pre] = []; }
    for (const pre of ['m', 'o']) (pre === 'm' ? MV.mst : MV.ost).forEach((p, i) => {
      let lk = { skin: 'tan', hair: 'dark', style: 'short' }; try { lk = lookOf(p) || lk; } catch (e) {}
      const look = { skin: '#' + ((typeof SKIN_C !== 'undefined' && SKIN_C[lk.skin]) || 'E0A67A'), hair: '#' + ((typeof HAIR_C !== 'undefined' && HAIR_C[lk.hair]) || '3A2A22'), hairStyle: HAIR_MAP[lk.style] || 'crop', boot: BOOTS[(p.id | 0) % BOOTS.length], back: String(p.name || '').split(' ').pop().slice(0, 6) };
      const r = buildRig(kitOf(pre, p.sub === 'GK'), String(i === 0 ? 1 : i + 1), look); r.me = !!p.me; if (r.me) r.root.scale.setScalar(1.12);
      r.st = { ph: Math.random() * 6, yaw: pre === 'm' ? Math.PI / 2 : -Math.PI / 2, seed: Math.random() * 6, kick: 0, dive: 0 }; R.sc.add(r.root); R.pl[pre][i] = r;
    });
  }

  // ---------- 매 프레임: MV를 읽어서 위치·동작만 옮김 ----------
  const angLerp = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
  function place(r, gx, gy, vx, vy, dt, bx, by, extra) {
    const st = r.st, x = wx(gx), z = wz(gy), sp = Math.hypot(vx, vy) * WS;
    r.root.position.set(x, 0, z);
    const yaw = sp > .5 ? Math.atan2(vx, vy * (W / 31) / WS) : Math.atan2(wx(bx) - x, wz(by) - z);
    st.yaw = angLerp(st.yaw, yaw, Math.min(1, dt * 8)); r.root.rotation.y = st.yaw;
    st.ph += dt * (2 + sp * 1.7); st.kick = Math.max(0, st.kick - dt); st.dive = Math.max(0, st.dive - dt);
    animateRig(r, Object.assign({ speed: sp, phase: st.ph, seed: st.seed, kick: st.kick, dive: st.dive, diveSide: st.diveSide }, extra || {}), R.t);
  }
  function update(dt) {
    R.t += dt;
    const sig = MV.mst.map(p => p.id).join(',') + '|' + MV.ost.map(p => p.id).join(',');
    if (sig !== R.sig) { R.sig = sig; rebuildPlayers(); }
    const b = MV.ball || { x: 50, y: 32 }; let bx = b.x, by = b.y, bz = MV.act ? (MV.bz || 0) : 0;
    const rp = MV.rp && MV.rp.f, rpI = rp ? Math.floor(MV.rp.t) : 0, rpA = rp && rp[rpI], rpB = rp && (rp[rpI + 1] || rpA), rk = rp ? MV.rp.t - rpI : 0, Lp = (p, q) => p + (q - p) * rk;
    if (rpA) { bx = Lp(rpA.b[0], rpB.b[0]); by = Lp(rpA.b[1], rpB.b[1]); bz = Lp(rpA.b[2], rpB.b[2]); }
    // 킥·다이빙 동작: 새 패스/슛이 시작되는 순간을 감지(읽기만)
    const act = MV.act;
    if (act && act !== R.lastAct && R.lastHolder && (act.k === 'pass' || act.k === 'shot')) { const r = R.pl[R.lastHolder.s] && R.pl[R.lastHolder.s][R.lastHolder.i]; if (r) r.st.kick = .35;
      if (act.k === 'shot' && (act.out === 'save' || act.out === 'goal')) { const ds = act.s === 'm' ? 'o' : 'm', gk = R.pl[ds] && R.pl[ds][0]; if (gk) { gk.st.dive = .7; gk.st.diveSide = (act.ty > 32 ? 1 : -1) * (act.s === 'm' ? 1 : -1); } } }
    R.lastAct = act; if (MV.holder) R.lastHolder = MV.holder;
    let meR = null; const cele = MV.cele;
    for (const pre of ['m', 'o']) R.pl[pre].forEach((r, i) => {
      if (!r) return; let c = MV.pos[pre] && MV.pos[pre][i];
      if (rpA) { const p = rpA[pre][i], q = (rpB[pre] && rpB[pre][i]) || p; if (p) c = { x: Lp(p[0], q[0]), y: Lp(p[1], q[1]), vx: (q[0] - p[0]) * 7.5, vy: (q[1] - p[1]) * 7.5 }; }
      if (!c) { r.root.visible = false; return; }
      const red = MV.red && MV.red[pre + i]; r.root.visible = !red; if (red) return;
      const down = !!(MV.frz && MV.frz[pre + i] > MV.t), celeb = !!(cele && pre === cele.s && i > 0 && Math.hypot(c.vx || 0, c.vy || 0) < 4);
      place(r, c.x, c.y, c.vx || 0, c.vy || 0, dt, bx, by, { down, celeb }); if (r.me) meR = r;
    });
    // 공: 위치 + 굴러가는 회전
    const bp = new THREE.Vector3(wx(bx), BR + bz * .85, wz(by));
    if (R.bPrev) { const dx = bp.x - R.bPrev.x, dz = bp.z - R.bPrev.z, d = Math.hypot(dx, dz); if (d > 1e-4 && d < 5) R.ball.rotateOnWorldAxis(new THREE.Vector3(dz, 0, -dx).normalize(), d / BR); }
    R.bPrev = bp.clone(); R.ball.position.copy(bp);
    R.ring.visible = R.arrow.visible = !!(meR && meR.root.visible);
    if (meR) { const p = meR.root.position, s = 1 + Math.sin(R.t * 5) * .08; R.ring.position.set(p.x, .03, p.z); R.ring.scale.set(s, s, s); R.arrow.position.set(p.x, 2.75 + Math.sin(R.t * 4) * .12, p.z); R.arrow.rotation.y += dt * 2; }
    const rf = MV.ref || { x: 44, y: 40, a1: 50, a2: 50 };
    place(R.ref[0], rf.x, rf.y, 0, 0, dt, bx, by); place(R.ref[1], rf.a1, 64.2, 0, 0, dt, bx, by); place(R.ref[2], rf.a2, -.2, 0, 0, dt, bx, by);
    const rc = MV.refCard, on = !!(rc && rc.until > MV.t); R.card.visible = on;
    if (on) { const p = R.ref[0].root.position; R.card.position.set(p.x + .45, 2.45, p.z); R.card.material.color.copy(col(rc.c === 'r' ? '#E0262F' : '#F2D21B')); R.ref[0].armR.rotation.x = -2.9; }
    // 관중: 평소 살짝 들썩, 골이면 그 팀 관중이 점프
    const C = R.crowd, mh = G0() && G0().mm && G0().mm.mineHome, celT = cele ? ((cele.s === 'm') === !!mh ? 0 : 1) : -1;
    if (C && C.bodies.visible) { const d = C.dummy, cr = C.crowd;
      for (let i = 0; i < cr.length; i++) { const c = cr[i]; let j = Math.max(0, Math.sin(R.t * 1.3 + c.ph)) * .03; if (celT >= 0 && c.team === celT) j = Math.abs(Math.sin(R.t * 9 + c.ph)) * .5;
        d.position.set(c.x, c.y + .39 + j, c.z); d.scale.setScalar(c.sc); d.updateMatrix(); C.bodies.setMatrixAt(i, d.matrix); d.position.y += .6 * c.sc; d.updateMatrix(); C.heads.setMatrixAt(i, d.matrix); }
      C.bodies.instanceMatrix.needsUpdate = true; C.heads.instanceMatrix.needsUpdate = true; }
    R.boards.forEach(t => { t.offset.x = (t.offset.x + dt * .02) % 1; });
    camUpdate(bx, by, dt); hudUpdate(dt);
  }
  // ---------- 카메라 3종(시안): 중계 / 전술 / 시네마 + 골 장면 클로즈업 ----------
  const CAMS = [['bc', '중계'], ['tac', '전술'], ['cin', '시네마']];
  function camMode() { try { const v = localStorage.getItem('bfm_cam3d'); if (CAMS.some(c => c[0] === v)) return v; } catch (e) {} return 'bc'; }
  function camUpdate(gbx, gby, dt) {
    const m = R.cm || (R.cm = camMode()), asp = R.cam.aspect, b = { x: wx(gbx), z: wz(gby) }, pos = new THREE.Vector3(), look = new THREE.Vector3(); let fov = 34, rate = 3;
    const cele = MV.cele, cr = cele && R.pl[cele.s] && R.pl[cele.s][cele.si];
    if (cele && cr && m !== 'tac') { const s = cr.root.position, d = s.x > 0 ? 1 : -1; pos.set(s.x - d * 7.5, 2.6, s.z * .85 + (s.z > 0 ? -4 : 4)); look.set(s.x, 1.4, s.z); fov = 32; rate = 2.2; }
    else if (m === 'tac') { pos.set(b.x * .08, 82 / Math.min(1, asp / 1.5), 16); look.set(b.x * .08, 0, 1.5); fov = 40; }
    else if (m === 'cin') { const h = MV.holder, hr = h && R.pl[h.s] && R.pl[h.s][h.i]; let yaw = hr ? hr.st.yaw : 0, cx = b.x, cz = b.z; if (hr) { cx = hr.root.position.x; cz = hr.root.position.z; }
      const fx = Math.sin(yaw), fz = Math.cos(yaw); pos.set(cx - fx * 8.5 + fz * 2.4, 3.4, cz - fz * 8.5 - fx * 2.4); look.set(cx + fx * 5, 1, cz + fz * 5); fov = 44; rate = 2.2; }
    else { const zoom = asp < 1.5 ? 1.25 : 1; pos.set(clamp(b.x * .72, -24, 24), 32 * zoom, (35.5 + b.z * .1) * zoom); look.set(clamp(b.x * .86, -30, 30), 0, b.z * .3); fov = 34; }
    const k = R.camInit ? 1 - Math.exp(-rate * dt) : 1; R.camInit = true;
    R.camPos.lerp(pos, k); R.camLook.lerp(look, k); R.fov += (fov - R.fov) * k;
    R.cam.position.copy(R.camPos); R.cam.lookAt(R.camLook); if (Math.abs(R.cam.fov - R.fov) > .01) { R.cam.fov = R.fov; R.cam.updateProjectionMatrix(); }
  }
  // ---------- 경기장 위 HUD(시안): 점수판 · 중계 자막 · 카메라 버튼 — 화면 표시만 ----------
  function hudMake(pw) {
    let h = pw.querySelector('.v3hud'); if (h) return h;
    h = document.createElement('div'); h.className = 'v3hud';
    h.innerHTML = `<div class="v3sb"><i class="hc"></i><b class="hn"></b><span class="sc0"></span><b class="an"></b><i class="ac"></i><span class="mn"></span></div><div class="v3cap"><span class="cm"></span><span class="ct"></span></div><div class="v3cams">${CAMS.map(c => `<button type="button" data-cam="${c[0]}">${c[1]}</button>`).join('')}</div>`;
    h.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); if (!R) return; R.cm = b.dataset.cam; try { localStorage.setItem('bfm_cam3d', R.cm); } catch (x) {} R.hudK = ''; }));
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
    h.querySelectorAll('[data-cam]').forEach(b => b.classList.toggle('on', b.dataset.cam === R.cm));
  }
  function resize() {
    const w = R.wrap.clientWidth, h = R.wrap.clientHeight; if (!w || !h || (w === R.w && h === R.h)) return;
    R.w = w; R.h = h; R.rd.setPixelRatio(R.pr); R.rd.setSize(w, h, false); R.cam.aspect = w / h; R.cam.updateProjectionMatrix();
  }
  function perf(dt) {                                                            // 느린 폰: 1단계 그림자·관중 끄고 해상도 낮춤 → 그래도 느리면 2D로 자동 전환
    if (document.hidden) { R.ft.length = 0; return; }
    R.ftT += dt; if (R.ftT < 2.5) return; R.ft.push(dt);
    if (R.ft.length < 90) return;
    const avg = R.ft.reduce((a, c) => a + c, 0) / R.ft.length; R.ft.length = 0;
    if (avg <= 0.05) return;
    if (!R.lowQ) { R.lowQ = true; R.pr = Math.max(0.6, Math.min(1, R.pr) * 0.7); R.w = 0; R.rd.shadowMap.enabled = false; R.sc.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.needsUpdate = true; }); }); if (R.crowd) { R.crowd.bodies.visible = R.crowd.heads.visible = false; } try { toast('3D 화질을 낮췄습니다'); } catch (e) {} return; }
    fallback('폰 성능이 부족해 2D로 바꿨습니다');
  }
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (!R) return;
    if (!MV) { stop(); return; }
    if (!R.cv.isConnected) { const pw = document.querySelector('#pitchbox .pwrap'); if (pw) attach(pw); else return; }
    const dt = R.last ? Math.min(0.1, (ts - R.last) / 1000) : 0.016; R.last = ts;
    perf(dt); if (!R) return;
    try { resize(); update(dt); R.rd.render(R.sc, R.cam); } catch (e) { try { console.error(e); } catch (x) {} fallback('3D 화면 오류로 2D로 바꿨습니다'); }
  }
  return { sync, stop, active: () => !!R };
})();
