// トップのジオラマ。静止画（同じカメラで Blender が描いたもの）を既定で表示し、
// WebGL が使えて動きを減らす設定でない環境だけ、焼き付け済みの GLB に置き換える。
// スクロールで .tour-step[data-view] が画面の中央に来ると、その区画へカメラが寄る（静止版では区画ごとの静止画に切り替える）。
// 配置は 3d/layout.json が正。ここでは DATA（ビルド時に埋め込む）だけを読む。
const DATA = {"floor":{"x":[0,10],"y":[0,7],"thick":0.35},"camera":{"dir":[1,-1.05,1.15],"target":[4.942,3.561,0.588],"ortho":13.52,"aspect":[4,3]},"palette":{"cable":"#0064b5"},"zones":[{"id":"about","anchor":[8.1,1.5,1.35],"box":[6.4,9.85,0.25,2.9,1.3]},{"id":"business","anchor":[8.0,5.1,2.05],"box":[6.4,9.85,3.4,6.85,1.7]},{"id":"education","anchor":[1.8,5.5,1.6],"box":[0.15,3.5,4.1,6.85,1.5]},{"id":"recruit","anchor":[0.9,1.4,1.75],"box":[0.15,3.0,0.25,4.2,1.5]},{"id":"photo","anchor":[5.0,5.9,1.6],"box":[3.8,6.2,4.9,6.85,1.5]}],"paths":{"about":[[5.5,2.75],[5.95,2.75],[6.032,2.7445],[6.1031,2.7281],[6.1633,2.7008],[6.2125,2.6625],[6.2508,2.6133],[6.2781,2.5531],[6.2945,2.482],[6.3,2.4],[6.3,1.4],[6.3031,1.3531],[6.3125,1.3125],[6.3281,1.2781],[6.35,1.25],[6.3781,1.2281],[6.4125,1.2125],[6.4531,1.2031],[6.5,1.2],[6.7,1.2]],"business":[[5.5,3.2],[5.85,3.2],[5.932,3.2055],[6.0031,3.2219],[6.0633,3.2492],[6.1125,3.2875],[6.1508,3.3367],[6.1781,3.3969],[6.1945,3.468],[6.2,3.55],[6.2,3.95],[6.2023,3.9852],[6.2094,4.0156],[6.2211,4.0414],[6.2375,4.0625],[6.2586,4.0789],[6.2844,4.0906],[6.3148,4.0977],[6.35,4.1],[6.5,4.1]],"education":[[4.3,3.2],[4.0,3.2],[3.9297,3.2047],[3.8688,3.2188],[3.8172,3.2422],[3.775,3.275],[3.7422,3.3172],[3.7188,3.3688],[3.7047,3.4297],[3.7,3.5],[3.7,4.375],[3.6965,4.4277],[3.6859,4.4734],[3.6684,4.5121],[3.6438,4.5437],[3.6121,4.5684],[3.5734,4.5859],[3.5277,4.5965],[3.475,4.6],[3.25,4.6]],"photo":[[4.9,3.45],[4.9,4.75]],"recruit":[[4.3,2.7],[3.95,2.7],[3.868,2.6945],[3.7969,2.6781],[3.7367,2.6508],[3.6875,2.6125],[3.6492,2.5633],[3.6219,2.5031],[3.6055,2.432],[3.6,2.35],[3.6,0.95],[3.5945,0.868],[3.5781,0.7969],[3.5508,0.7367],[3.5125,0.6875],[3.4633,0.6492],[3.4031,0.6219],[3.332,0.6055],[3.25,0.6],[2.6,0.6]]},"cableTop":0.085,"actors":{"teacher":{"type":"walk","facing":2.6704,"pos":[2.95,6.35],"path":[[2.85,6.33],[0.95,6.33]],"rest":[0,-1],"speed":0.42,"pause":2.6},"eng1":{"type":"walk","facing":0,"pos":[8.2,3.2],"path":[[8.2,3.2],[9.25,3.2]],"rest":[0,1],"speed":0.38,"pause":2.2},"off5":{"type":"talk","facing":-1.2,"pos":[6.75,2.55]},"off6":{"type":"talk","facing":1.9,"pos":[7.15,2.6]},"off1":{"type":"sit","facing":0,"pos":[7.3,0.45]},"off3":{"type":"sit","facing":3.1416,"pos":[7.9,2.15]},"stu01":{"type":"sit","facing":0,"pos":[1.55,5.17]}}};
// 読み込み先は文字列のまま書く（公開先がパスを書き換えるため、組み立てない）。
// 形（GLB）と焼き付けた画像（webp）は分ける。公開先では GLB を base64 でページに埋め込む（data:/blob: が読めないため）
const GEO = '3d/diorama_geo.glb';
const TEX = '3d/diorama_bake.webp';

const fig = document.getElementById('net');
const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');

// ---- スクロールの位置 → 見せる区画（3D が無くても動く） ----
let viewHook = null;
let currentView = 'overview';
// 区画ごとの静止画は data-src に置いてあるので、使うときに読む
const loadViewImg = (id) => {
  const img = fig?.querySelector(`.topo-view[data-for="${id}"]`);
  if (img && img.dataset.src && !img.getAttribute('src')) img.src = img.dataset.src;
};
const loadAllViewImgs = () => fig?.querySelectorAll('.topo-view[data-for]').forEach((i) => loadViewImg(i.dataset.for));
// 最初にスクロールしたら残りも先読みする（切り替えの瞬間に待たせないため。見ない人には読ませない）
if (fig) addEventListener('scroll', loadAllViewImgs, { once: true, passive: true });
const steps = [...document.querySelectorAll('.tour-step[data-view]')];
if (fig) fig.dataset.view = currentView;
// 画面の「帯」（PC は中央、スマホは舞台の下に見えるカードの位置）にかかっているカードを、スクロールのたびに探す。
// IntersectionObserver の rootMargin は、別ドメインの iframe の中（Artifact の公開ページなど）では効かないので使わない
function pickStep() {
  const band = innerHeight * (matchMedia('(max-width: 899px)').matches ? 0.645 : 0.475);
  let hit = null;
  for (const s of steps) {
    const r = s.getBoundingClientRect();
    if (r.top <= band && r.bottom > band) { hit = s; break; }
  }
  if (!hit) return;
  steps.forEach((s) => s.classList.toggle('is-current', s === hit));
  const v = hit.dataset.view;
  if (v === currentView) return;
  currentView = v;
  fig.dataset.view = v;
  loadViewImg(v);
  viewHook?.(v);
}
if (fig && steps.length) {
  let ticking = false;
  const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; pickStep(); }); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  pickStep();
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

// 起動のしかた（表示速度のため）:
// - PC（マウス操作）: ページの表示が終わって手が空いてから始める
// - スマホ・タブレット: 静止版のまま出し、「3Dで動かす」を押したときだけ始める（three.js の起動が遅い端末で重いため）
const boot = () => start().catch((err) => { console.warn('3D表示を静止版に切り替えました', err); fig.classList.remove('is-3d'); });
if (fig && DATA && !reduceMq.matches && hasWebGL()) {
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const later = () => ('requestIdleCallback' in window ? requestIdleCallback(boot, { timeout: 4000 }) : setTimeout(boot, 1500));
    if (document.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
  } else {
    const btn = fig.querySelector('.net-toggle');
    if (btn) {
      btn.textContent = '3Dで動かす'; btn.hidden = false;
      btn.addEventListener('click', () => { btn.hidden = true; boot(); }, { once: true });
    }
  }
}

// Blender（Z上）→ three（Y上）
const toThree = (THREE, [x, y, z]) => new THREE.Vector3(x, z, -y);

async function start() {
  const THREE = await import('./vendor/three@0.185.1/three.module.min.js');
  const { GLTFLoader } = await import('./vendor/three@0.185.1/addons/loaders/GLTFLoader.js');
  const inline = document.getElementById('diorama-geo');
  const loader = new GLTFLoader();
  const gltfP = inline
    ? loader.parseAsync(Uint8Array.from(atob(inline.textContent.trim()), (c) => c.charCodeAt(0)).buffer, '')
    : loader.loadAsync(GEO);
  const [gltf, tex] = await Promise.all([gltfP, new THREE.TextureLoader().loadAsync(TEX)]);
  tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();

  // 回転の中心を部屋の中央に置く
  const F = DATA.floor;
  const center = new THREE.Vector3((F.x[0] + F.x[1]) / 2, 0, -(F.y[0] + F.y[1]) / 2);
  const pivot = new THREE.Group(); pivot.position.copy(center); scene.add(pivot);
  const room = gltf.scene; room.position.copy(center).multiplyScalar(-1); pivot.add(room);

  // 光は焼き付け済みなので、材質は画像をそのまま出すだけにする
  const cables = {};
  room.traverse((o) => {
    if (!o.isMesh) return;
    o.material = new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff });
    const m = /^cable_(\w+)/.exec(o.name);
    if (m) cables[m[1]] = o;
  });

  // カメラ（Blender の正投影カメラと同じ向き）。見る範囲は区画ごとに計算する
  const cam = DATA.camera;
  const dir = toThree(THREE, cam.dir).normalize();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.copy(toThree(THREE, cam.target)).addScaledVector(dir, 30);
  camera.lookAt(toThree(THREE, cam.target));
  camera.updateMatrixWorld();
  const R = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const U = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);

  // 見せる範囲の点（Blender 座標）。全体は床と壁の角、区画は箱の8つの角
  const H_WALL = 1.66;
  const POINTS = { overview: [] };
  for (const x of [F.x[0], F.x[1]]) for (const y of [F.y[0], F.y[1]]) for (const z of [-0.35, 0]) POINTS.overview.push([x, y, z]);
  POINTS.overview.push([F.x[0], F.y[1], H_WALL], [F.x[1], F.y[1], H_WALL], [F.x[0], F.y[0], H_WALL]);
  for (const z of DATA.zones) {
    const [x0, x1, y0, y1, h] = z.box;
    POINTS[z.id] = [];
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const zz of [0, h]) POINTS[z.id].push([x, y, zz]);
  }
  // 画面の大きさに合わせて、その区画が収まる中心と幅を求める。
  // 幅が広い画面では左にカードがあるので、中身を右に寄せる
  function fitView(id, W, H) {
    const pts = (POINTS[id] || POINTS.overview).map((p) => toThree(THREE, p));
    let r0 = Infinity, r1 = -Infinity, u0 = Infinity, u1 = -Infinity;
    for (const p of pts) { const r = p.dot(R), u = p.dot(U); r0 = Math.min(r0, r); r1 = Math.max(r1, r); u0 = Math.min(u0, u); u1 = Math.max(u1, u); }
    const wide = W >= 900;
    const availW = wide ? 0.56 : 0.9, availH = id === 'overview' ? 0.88 : 0.8;
    const ew = r1 - r0, eh = u1 - u0;
    const hw = Math.max(ew / availW, (eh / availH) * (W / H)) / 2;
    const shift = wide ? 0.2 * 2 * hw : 0;   // 中身の中心を画面の右寄り（左から 70% 付近）に置く
    const t = R.clone().multiplyScalar((r0 + r1) / 2 - shift).add(U.clone().multiplyScalar((u0 + u1) / 2));
    return { t, hw };
  }

  // 区画: ラベルの位置、押せる範囲、強調の床枠（room の子なので、座標は Blender のまま変換するだけ）
  const zones = {};
  const pickables = [];
  const ringMat = new THREE.MeshBasicMaterial({ color: DATA.palette.cable, transparent: true, opacity: 0, depthWrite: false });
  for (const z of DATA.zones) {
    const [x0, x1, y0, y1, h] = z.box;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, y1 - y0), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(toThree(THREE, [(x0 + x1) / 2, (y0 + y1) / 2, h / 2]));
    hit.userData.key = z.id; room.add(hit); pickables.push(hit);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 0.1, y1 - y0 + 0.1), ringMat.clone());
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(toThree(THREE, [(x0 + x1) / 2, (y0 + y1) / 2, 0.03]));
    room.add(ring);
    const a = new THREE.Object3D(); a.position.copy(toThree(THREE, z.anchor)); room.add(a);
    zones[z.id] = { anchor: a, ring, cable: cables[z.id], glow: 0 };
  }

  // ケーブルの上を流れる光の粒（コア → 各区画）
  const pktGeo = new THREE.SphereGeometry(0.055, 12, 8);
  const pktMat = new THREE.MeshBasicMaterial({ color: 0xdcecff });
  const packets = [];
  for (const [key, pts] of Object.entries(DATA.paths)) {
    const lift = DATA.cableTop + 0.03;
    const v = pts.map(([x, y]) => toThree(THREE, [x, y, lift]));
    const lens = [0]; for (let i = 1; i < v.length; i++) lens.push(lens[i - 1] + v[i].distanceTo(v[i - 1]));
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Mesh(pktGeo, pktMat); room.add(m);
      packets.push({ key, m, v, lens, total: lens[lens.length - 1], t: k / 3 });
    }
  }
  function placePacket(p) {
    const d = p.t * p.total; let i = 1;
    while (i < p.lens.length - 1 && p.lens[i] < d) i++;
    const seg = p.lens[i] - p.lens[i - 1] || 1;
    p.m.position.lerpVectors(p.v[i - 1], p.v[i], (d - p.lens[i - 1]) / seg);
  }

  // 動く人（layout.json の actors）。部品は actor_<id>_<torso|head|legL|legR> で、回転の中心は腰・首・股関節に置いてある
  const actorParts = {};
  room.traverse((o) => { const m = /^actor_(.+)_(torso|head|legL|legR)$/.exec(o.name); if (m) (actorParts[m[1]] ||= {})[m[2]] = o; });
  const shadowTex = (() => {  // 歩く人の足元の影（床には焼いていないので、ここで付ける）
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(28,38,54,.32)'); gr.addColorStop(1, 'rgba(28,38,54,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();
  const yawOf = (bx, by) => Math.atan2(bx, -by);  // Blender の向き (x, y) → three の Y 軸まわりの角度
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const actors = [];
  for (const [id, conf] of Object.entries(DATA.actors || {})) {
    const parts = actorParts[id];
    if (!parts?.torso || !parts?.head) continue;
    const g = new THREE.Group(); g.position.copy(toThree(THREE, [conf.pos[0], conf.pos[1], 0])); room.add(g);
    for (const o of Object.values(parts)) g.attach(o);
    const yaw0 = yawOf(Math.sin(conf.facing), Math.cos(conf.facing));
    const a = {
      id, conf, g, parts, yaw0, yaw: 0, phase: Math.random() * 10,
      side: new THREE.Vector3(Math.cos(yaw0), 0, -Math.sin(yaw0)),  // 体の横の向き（脚を振る軸・うなずく軸）
      base: { torso: parts.torso.position.y, head: parts.head.position.y },
    };
    if (conf.type === 'walk') {
      a.pts = conf.path.map(([x, y]) => toThree(THREE, [x, y, 0]));
      a.i = 0; a.state = 'pause'; a.timer = 0.8;
      g.position.copy(a.pts[0]);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03; g.add(sh);
    }
    actors.push(a);
  }
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0), tmpD = new THREE.Vector3();
  function updateActors(dt) {
    for (const a of actors) {
      const { parts, conf } = a;
      a.phase += dt;
      let swing = 0, bob = 0, nod = 0, look = 0, yawT = a.yaw;
      if (conf.type === 'walk') {
        if (a.state === 'pause') {  // 端で止まり、受講者やラックの方を向いて少し見回す
          a.timer -= dt;
          yawT = yawOf(conf.rest[0], conf.rest[1]) - a.yaw0;
          look = Math.sin(a.phase * 1.3) * 0.3;
          if (a.timer <= 0) { a.state = 'walk'; a.i = 1 - a.i; }
        } else {
          tmpD.copy(a.pts[a.i]).sub(a.g.position);
          const dist = tmpD.length(), stepLen = conf.speed * dt;
          yawT = Math.atan2(tmpD.x, tmpD.z) - a.yaw0;
          if (dist <= stepLen) { a.g.position.copy(a.pts[a.i]); a.state = 'pause'; a.timer = conf.pause; }
          else a.g.position.addScaledVector(tmpD.normalize(), stepLen);
          swing = Math.sin(a.phase * 9) * 0.5; bob = Math.abs(Math.sin(a.phase * 9)) * 0.014;
        }
      } else if (conf.type === 'talk') {  // 立ち話: 話している間はうなずき、体を少し揺らす
        const speaking = Math.sin(a.phase * 0.6) > 0 ? 1 : 0.35;
        nod = Math.sin(a.phase * 2.6) * 0.12 * speaking;
        yawT = Math.sin(a.phase * 0.7) * 0.08;
      } else {  // 座ってパソコン: 画面を見ながら顔を左右に動かし、打鍵で小さく揺れる
        look = Math.sin(a.phase * 0.45) * 0.35;
        bob = Math.sin(a.phase * 15) > 0.4 ? 0.005 : 0;
        nod = 0.08;
      }
      a.yaw += wrap(yawT - a.yaw) * Math.min(1, dt * 6);
      a.g.rotation.y = a.yaw;
      if (parts.legL) parts.legL.quaternion.setFromAxisAngle(a.side, swing);
      if (parts.legR) parts.legR.quaternion.setFromAxisAngle(a.side, -swing);
      parts.torso.position.y = a.base.torso + bob;
      parts.head.position.y = a.base.head + bob;
      parts.head.quaternion.copy(qa.setFromAxisAngle(UP, look)).multiply(qb.setFromAxisAngle(a.side, nod));
    }
  }

  // ラベル（HTML の <a>）を投影位置に合わせる。区画に寄っている間は、その区画のラベルだけ出す
  const labels = [...fig.querySelectorAll('.net-nav a')].map((el) => ({ el, key: el.dataset.node, w: 0, h: 0, x: 0, y: 0 }));
  const measure = () => labels.forEach((l) => { l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; });
  const tv = new THREE.Vector3();
  let W = 0, H = 0;
  function placeLabels() {
    const focus = view !== 'overview' ? view : null;
    for (const l of labels) {
      zones[l.key].anchor.getWorldPosition(tv).project(camera);
      l.x = (tv.x + 1) / 2 * W - l.w / 2;
      l.y = (1 - tv.y) / 2 * H - l.h - 4;
      l.off = !!focus && l.key !== focus;
      l.el.classList.toggle('is-off', l.off);
    }
    const on = labels.filter((l) => !l.off);
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++) {
        const A = on[i], B = on[j];
        const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x) + 6;
        const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y) + 6;
        if (ox > 0 && oy > 0) { const [t, b] = A.y <= B.y ? [A, B] : [B, A]; t.y -= oy / 2; b.y += oy / 2; }
      }
    }
    for (const l of labels) {
      l.x = Math.max(8, Math.min(W - l.w - 8, l.x));
      l.y = Math.max(8, Math.min(H - l.h - 8, l.y));
      l.el.style.setProperty('--px', `${l.x.toFixed(1)}px`);
      l.el.style.setProperty('--py', `${l.y.toFixed(1)}px`);
    }
  }

  // 見る区画の切り替え（スクロールから）。カメラは目標へなめらかに寄る
  let view = currentView;
  const cur = { t: new THREE.Vector3(), hw: 1 }, goal = { t: new THREE.Vector3(), hw: 1 };
  function setGoal(id, jump = false) {
    view = id;
    const f = fitView(id, W, H);
    goal.t.copy(f.t); goal.hw = f.hw;
    if (jump || reduceMq.matches) { cur.t.copy(goal.t); cur.hw = goal.hw; }
    kick();
  }
  function applyCamera() {
    camera.position.copy(cur.t).addScaledVector(dir, 30);
    const hh = cur.hw * H / W;
    Object.assign(camera, { left: -cur.hw, right: cur.hw, top: hh, bottom: -hh });
    camera.updateProjectionMatrix();
  }
  viewHook = (id) => setGoal(id);

  function resize() {
    W = fig.clientWidth; H = fig.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    measure(); setGoal(view, true); dirty = true; kick();
  }

  // 強調（ラベルのホバー・フォーカス、または区画へのポインタ）。寄っている区画は常に強調する
  let active = null;
  function setActive(key) {
    if (active === key) return;
    active = key;
    labels.forEach((l) => l.el.classList.toggle('is-active', l.key === key));
    kick();
  }
  labels.forEach((l) => {
    l.el.addEventListener('pointerenter', () => setActive(l.key));
    l.el.addEventListener('pointerleave', () => setActive(null));
    l.el.addEventListener('focus', () => setActive(l.key));
    l.el.addEventListener('blur', () => setActive(null));
  });
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    return ray.intersectObjects(pickables, false)[0]?.object.userData.key || null;
  }
  // ドラッグで少し回せる（左右 ±26°、上下はわずか）。スマホでは縦の指の動きはページのスクロールに回す
  const cv = renderer.domElement;
  cv.style.touchAction = 'pan-y'; cv.style.cursor = 'grab';
  const hint = fig.querySelector('.net-hint');
  let userYaw = 0, userPitch = 0, drag = null, dragged = false;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  cv.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, yaw: userYaw, pitch: userPitch, id: e.pointerId };
    dragged = false;
  });
  addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!dragged && Math.hypot(dx, dy) > 6) { dragged = true; cv.setPointerCapture?.(e.pointerId); cv.style.cursor = 'grabbing'; if (hint) hint.hidden = true; }
    if (dragged) { userYaw = clamp(drag.yaw + dx * 0.004, -0.45, 0.45); userPitch = clamp(drag.pitch + dy * 0.002, -0.06, 0.1); kick(); }
  });
  const endDrag = () => { drag = null; cv.style.cursor = 'grab'; };
  addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
  cv.addEventListener('pointermove', (e) => {
    if (dragged && drag) return;
    const k = pick(e);
    cv.style.cursor = k ? 'pointer' : 'grab';
    setActive(k);
  });
  cv.addEventListener('pointerleave', () => { if (!drag) setActive(null); });
  cv.addEventListener('click', (e) => {
    if (dragged) { dragged = false; return; }  // 回した直後の指離しで、ページを移らない
    const k = pick(e);
    if (k) fig.querySelector(`.net-nav a[data-node="${k}"]`)?.click();
  });

  // 一時停止ボタン
  const toggle = fig.querySelector('.net-toggle');
  let paused = false;
  const setPaused = (p) => {
    paused = p;
    toggle.setAttribute('aria-pressed', String(p));
    toggle.textContent = p ? '動かす' : '動きを止める';
    // 背景の動画（朝の光）も一緒に止める。ほかのページでも止まったままにする（site.js）
    if (window.claiceMotion && window.claiceMotion.paused !== p) window.claiceMotion.set(p);
    kick();
  };
  toggle.textContent = '動きを止める';
  toggle.addEventListener('click', () => setPaused(!paused));
  reduceMq.addEventListener?.('change', (e) => { if (e.matches) setPaused(true); });

  // 描画ループ: 画面内・タブ表示中・動きがあるときだけ回す
  let inView = true, raf = 0, last = 0, phase = 0, dirty = true;
  const SPEED = (Math.PI * 2) / 40;
  const yaw = { cur: 0 }, pitch = { cur: 0 };
  const hi = new THREE.Color(1.55, 1.45, 1.25), base = new THREE.Color(1, 1, 1), dim = new THREE.Color(0.86, 0.86, 0.86);
  function frame(now) {
    raf = 0;
    if (!inView || document.hidden) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
    last = now;
    const focus = view !== 'overview' ? view : null;
    const hot = active || focus;
    let moving = false;
    if (!paused) {
      phase += dt * SPEED;
      for (const p of packets) {
        const on = !hot || p.key === hot;
        p.m.visible = on;
        if (on) { p.t = (p.t + dt * (p.key === hot ? 0.42 : 0.16) * (6 / p.total)) % 1; placePacket(p); }
      }
      updateActors(dt);
      moving = true;
    }
    // カメラを目標へ寄せる（約0.6秒で9割）
    const k = 1 - Math.pow(0.02, dt / 1.0);
    cur.t.lerp(goal.t, k); cur.hw += (goal.hw - cur.hw) * k;
    let settling = cur.t.distanceToSquared(goal.t) > 1e-6 || Math.abs(goal.hw - cur.hw) > 1e-4;
    applyCamera();
    // 揺れとポインタの傾き（小さく。区画に寄っている間はさらに小さく）
    const sway = focus ? 0.03 : 0.1;
    const yawT = Math.sin(phase) * sway + userYaw;
    const pitchT = userPitch;
    yaw.cur += (yawT - yaw.cur) * 0.08; pitch.cur += (pitchT - pitch.cur) * 0.08;
    pivot.rotation.set(pitch.cur, yaw.cur, 0);
    if (Math.abs(yawT - yaw.cur) > 0.0005 || Math.abs(pitchT - pitch.cur) > 0.0005) settling = true;
    for (const [key, z] of Object.entries(zones)) {
      const target = hot === key ? 1 : 0;
      z.glow += (target - z.glow) * 0.2;
      if (Math.abs(target - z.glow) > 0.003) settling = true;
      z.ring.material.opacity = z.glow * 0.14;
      if (z.cable) z.cable.material.color.copy(hot && hot !== key ? dim : base).lerp(hi, z.glow);
    }
    if (moving || settling || dirty) {
      renderer.render(scene, camera);
      placeLabels();
      dirty = false;
      raf = requestAnimationFrame(frame);
    }
  }
  function kick() { if (!raf && inView && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }

  packets.forEach(placePacket);
  fig.prepend(renderer.domElement);
  resize();
  new ResizeObserver(resize).observe(fig);
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) kick(); }).observe(fig);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf); raf = 0; inView = false;
    fig.classList.remove('is-3d');
    toggle.hidden = true;
    if (hint) hint.hidden = true;
  });

  applyCamera();
  renderer.render(scene, camera);
  placeLabels();
  fig.classList.add('is-3d');
  // スマホで「3Dで動かす」を押したら、代わりに流していたジオラマの動画は止めて隠す（CSS）
  const loop = fig.querySelector('.net-loop');
  if (loop) { loop.dataset.stop = '1'; loop.pause(); }
  if (window.claiceMotion?.paused) setPaused(true);
  toggle.hidden = false;
  if (hint) hint.hidden = false;
  kick();
}
