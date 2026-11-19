import { Scene, OrthographicCamera, Vector3, MeshBasicMaterial, TextureLoader, WebGLRenderer, SRGBColorSpace } from '../../public/vendor/three@0.185.1/three.module.min.js';
import { GLTFLoader } from '../../public/vendor/three@0.185.1/addons/loaders/GLTFLoader.js';
import layout from '../../../3d/layout.json';

const section = document.querySelector('#diorama');
const stage = section.querySelector('.model-stage');
const poster = section.querySelector('.model-poster');
const controls = section.querySelector('.model-turn');
const help = section.querySelector('.model-help');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const enabled = () => !motion.matches && document.documentElement.dataset.motion !== 'off';
const world = ([x, y, z]) => new Vector3(x, z, -y);

async function start() {
  const [model, texture] = await Promise.all([
    new GLTFLoader().parseAsync(Uint8Array.from(atob(__MODEL_BASE64__), char => char.charCodeAt(0)).buffer, ''),
    new TextureLoader().loadAsync(__TEXTURE_URL__)
  ]);
  texture.flipY = false;
  texture.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({ map: texture });
  model.scene.traverse(object => { if (object.isMesh) object.material = material; });
  const scene = new Scene();
  scene.add(model.scene);
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'group');
  canvas.setAttribute('aria-label', '紙のジオラマの視点操作');
  canvas.setAttribute('aria-describedby', 'model-help');
  stage.append(canvas);

  const camera = new OrthographicCamera(-1, 1, 1, -1, .1, 100);
  const target = world(layout.camera.target);
  const base = world(layout.camera.dir).normalize();
  const startAzimuth = Math.atan2(base.x, base.z);
  const elevation = Math.asin(base.y);
  let turn = 0;
  let drag = null;
  let lost = false;
  let frame = 0;
  let previousWidth = 0, previousHeight = 0;

  function draw() {
    frame = 0;
    if (!enabled() || lost) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    if (!width || !height) return;
    if (width !== previousWidth || height !== previousHeight) {
      renderer.setSize(width, height, false);
      previousWidth = width;
      previousHeight = height;
    }
    const aspect = width / height;
    const halfHeight = Math.max(layout.camera.ortho / (2 * aspect), 4.85);
    camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
    camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    const azimuth = startAzimuth + turn;
    camera.position.set(Math.sin(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.cos(azimuth) * Math.cos(elevation)).multiplyScalar(30).add(target);
    camera.lookAt(target);
    renderer.render(scene, camera);
  }
  function requestDraw() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  function rotate(angle) {
    if (!enabled() || lost) return;
    turn = Math.max(-1.05, Math.min(1.05, angle));
    requestDraw();
  }
  stage.addEventListener('pointerdown', event => {
    if (!enabled() || lost || !event.isPrimary || event.button !== 0) return;
    drag = { x: event.clientX, turn, id: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (drag?.id === event.pointerId) rotate(drag.turn - (event.clientX - drag.x) / stage.clientWidth * 2.6);
  });
  canvas.addEventListener('lostpointercapture', () => { drag = null; });
  canvas.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    rotate(event.key === 'Home' ? 0 : turn + (event.key === 'ArrowRight' ? .22 : -.22));
  });
  controls.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    const step = Number(button.dataset.turn);
    rotate(step ? turn + step * .25 : 0);
  }));
  function sync() {
    const interactive = enabled() && !lost;
    drag = null;
    canvas.hidden = controls.hidden = !interactive;
    poster.hidden = interactive;
    help.textContent = interactive ? '左右にドラッグ、または矢印キーで回転' : 'ジオラマの静止画を表示しています';
    if (interactive) draw();
  }
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; sync(); });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; sync(); });
  motion.addEventListener('change', sync);
  document.addEventListener('motionchange', sync);
  new ResizeObserver(requestDraw).observe(stage);
  sync();
}
start().catch(error => {
  help.textContent = 'ジオラマの静止画を表示しています';
  console.warn('ジオラマの3D表示を利用できません', error);
});
