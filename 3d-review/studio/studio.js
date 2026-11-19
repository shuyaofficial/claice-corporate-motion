const scenes = {
  aisle: { title:'通路の奥へ', real:'配線の接続部分へ', photo:'web/about-rack-600.webp', caption:'機器の配線', description:'手前のラックと奥の扉の間を、ゆっくり進みます。', realDescription:'既存の機器写真では、青いケーブルの先にあるポートへ寄ります。', gesture:'奥へ進む', end:'奥へ', route:'business', link:'事業内容', shift:[0,0,.42] },
  bench: { title:'教える人の指先へ', real:'研修の様子を近くから', photo:'img/top_menu_ph7.jpg', caption:'研修の様子', description:'手前の肩越しに、先輩が示す機器の前面へ寄ります。', realDescription:'実際の研修写真で、手前の受講者と奥の講師の距離を見比べます。', gesture:'手元に寄る', end:'近くへ', route:'education', link:'教育システム', shift:[.045,-.02,.38] },
  table: { title:'扉越しに見る設計相談', real:'打ち合わせの席へ', photo:'photo/img/office/ph10.jpg', caption:'社内での打ち合わせ', description:'手前の扉から少し視点をずらし、円卓を囲む人と図面を見ます。', realDescription:'社内の打ち合わせを、テーブルの手前から少し横へ視点を移して見ます。', gesture:'視点をずらす', end:'席の方へ', route:'about', link:'クレイスについて', shift:[.11,-.015,.32] },
  lounge: { title:'窓の光が届く面談席', real:'ミーティングルームの奥へ', photo:'photo/img/office/ph09.jpg', caption:'ミーティングルーム', description:'手前の葉から椅子の方へ視点を移し、床に差す光を見ます。', realDescription:'既存のミーティングルームの写真で、家具の重なりと部屋の広さを見ます。', gesture:'視点をずらす', end:'席の方へ', route:'recruit', link:'採用情報', shift:[.095,0,.31] }
};
const el = id => document.getElementById(id);
const media = matchMedia('(prefers-reduced-motion: reduce)');
const site = '../../動きの実験版/';
const plate = document.querySelector('.plate');
const poster = el('poster');
const slider = el('position');
const sceneKey = location.hash.slice(1);
let key = Object.hasOwn(scenes, sceneKey) ? sceneKey : 'aisle';
let source = 'concept', still = false, sequence = 0;
try { still = localStorage.getItem('claice-experiment-motion') === 'off'; } catch {}
let three, renderer, camera, world, mesh, drag;
const image = async url => { const im = new Image(); im.src = url; await im.decode(); return im; };

function render() {
  if (!mesh || still || media.matches) return;
  const progress = Number(slider.value) / 100;
  const [x,y,z] = scenes[key].shift;
  camera.position.set(x*progress,y*progress,-z*progress);
  renderer.render(world,camera);
}

function resetSurface() {
  if (mesh) {
    world.remove(mesh); mesh.geometry.dispose(); mesh.material.map.dispose(); mesh.material.dispose(); mesh = null;
  }
  drag = null; slider.value = 0;
  el('surface').hidden = true; el('control').hidden = true;
}

function buildMesh(im, depths) {
  // Project each vertex back along its original camera ray; at zero travel the photograph aligns exactly.
  const aspect = im.naturalWidth/im.naturalHeight, tangent = Math.tan(Math.PI/8);
  const cols = 160, rows = Math.round(cols/aspect);
  const buffer = document.createElement('canvas');
  buffer.width=cols+1; buffer.height=rows+1;
  const ctx=buffer.getContext('2d');
  ctx.drawImage(depths,0,0,buffer.width,buffer.height);
  const pixels=ctx.getImageData(0,0,buffer.width,buffer.height).data;
  const geometry=new three.PlaneGeometry(2,2,cols,rows);
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const distance=3.6/(1+1.1*pixels[i*4]/255);
    positions.setXYZ(i,positions.getX(i)*tangent*aspect*distance,positions.getY(i)*tangent*distance,-distance);
  }
  const texture=new three.Texture(im);
  texture.colorSpace=three.SRGBColorSpace; texture.needsUpdate=true;
  const material=new three.MeshBasicMaterial({map:texture,side:three.DoubleSide});
  mesh=new three.Mesh(geometry,material); world.add(mesh);
  camera.aspect=aspect; camera.updateProjectionMatrix();
}
function resize(){
  if (!renderer || !mesh) return;
  renderer.setSize(plate.clientWidth,plate.clientHeight,false); render();
}
async function show(){
  const ticket=++sequence, item=scenes[key], actual=source==='actual';
  const photo=actual ? site+item.photo : '../photos/'+key+'.webp';
  resetSurface();
  poster.src=photo; poster.alt=actual ? item.caption : item.title+'（架空の職場）';
  el('credit').textContent=actual ? 'クレイスの実写真 ｜ '+item.caption : '実写風の生成画像 ｜ 架空の職場';
  el('title').textContent=actual ? item.real : item.title;
  el('desc').textContent=actual ? item.realDescription : item.description;
  el('move').textContent=actual ? '写真の視点を動かす' : item.gesture;
  el('end').textContent=actual ? '少し近くへ' : item.end;
  el('next').textContent=item.link+'を見る ↗'; el('next').href=site+item.route+'/index.html';
  for(const b of document.querySelectorAll('[data-scene]')) b.setAttribute('aria-pressed',String(key===b.dataset.scene));
  for(const b of document.querySelectorAll('[data-source]')) b.setAttribute('aria-pressed',String(source===b.dataset.source));
  const mode=el('mode'); mode.hidden=media.matches || !three; mode.textContent=still ? '奥行きを試す' : '静止画で見る';
  el('status').textContent=media.matches ? '端末の設定に合わせて静止画を表示しています。' : '';
  try {
    const photoImage=await image(photo);
    if(ticket!==sequence)return;
    plate.style.aspectRatio=photoImage.naturalWidth+' / '+photoImage.naturalHeight;
    if(media.matches || still || !three)return;
    const depth=await image('depth/'+key+'-'+source+'.png');
    if(ticket!==sequence)return;
    if(!renderer){
      renderer=new three.WebGLRenderer({antialias:true,alpha:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      el('surface').append(renderer.domElement);
      world=new three.Scene();camera=new three.PerspectiveCamera(45,1,.1,10);
      renderer.domElement.addEventListener('webglcontextlost',()=>{++sequence;resetSurface();mode.hidden=true;el('status').textContent='静止画を表示しています。';});
    }
    buildMesh(photoImage,depth); el('surface').hidden=false; el('control').hidden=false; resize();
  }catch{
    if(ticket!==sequence)return;
    resetSurface(); mode.hidden=true; el('status').textContent='この環境では静止画でご覧ください。';
  }
}
for(const b of document.querySelectorAll('[data-scene]')) b.onclick=()=>{key=b.dataset.scene;history.replaceState(null,'','#'+key);show();};
for(const b of document.querySelectorAll('[data-source]')) b.onclick=()=>{source=b.dataset.source;show();};
el('mode').onclick=()=>{
  still=!still;
  try {localStorage.setItem('claice-experiment-motion',still?'off':'on');} catch {}
  show();
};
slider.oninput=render;
const surface=el('surface');
surface.onpointerdown=e=>{if(!mesh || e.button!==0 || !e.isPrimary)return;surface.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,value:Number(slider.value)};};
surface.onpointermove=e=>{if(drag?.id!==e.pointerId)return;slider.value=String(drag.value+(e.clientX-drag.x)*160/plate.clientWidth);render();};
surface.onlostpointercapture=()=>{drag=null;};
new ResizeObserver(resize).observe(plate);media.addEventListener('change',show);
try {three=await import('../../動きの実験版/vendor/three@0.185.1/three.module.min.js');}catch{}
show();
