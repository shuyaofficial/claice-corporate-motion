const walk = document.querySelector('.walk');
const scenes = [...walk.querySelectorAll('.scene')];
const stops = [...walk.querySelectorAll('.stops button')];
const toggle = document.querySelector('#motion');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let moving, pending = false;
const clamp = n => Math.max(0, Math.min(1,n));
function draw(){
  pending = false;
  if(!moving) return;
  const rect = walk.getBoundingClientRect();
  const distance = rect.height - walk.querySelector('.stage').offsetHeight;
  const headerHeight = document.querySelector('header').offsetHeight;
  const step = clamp((headerHeight-rect.top) / Math.max(1,distance)) * 2;
  const active = Math.round(step);
  scenes.forEach((scene,i)=>{
    const fraction = clamp((step-i+0.8)/0.65);
    const eased = fraction*fraction*(3-2*fraction);
    const cut = i===0 ? 0 : (1-eased)*100;
    // The meeting room opens from the glass on the left of the entrance.
    // The workspace opens from the window line toward the ceiling and floor.
    scene.style.clipPath = i===1
      ? 'inset('+cut*0.31+'% '+cut*0.76+'% '+cut*0.69+'% '+cut*0.24+'%)'
      : 'inset('+cut*0.42+'% 0 '+cut*0.58+'% 0)';
    scene.querySelector('.view').style.transform = 'scale('+(1+clamp(step-i)*0.095)+')';
    scene.inert = i!==active;
    scene.style.pointerEvents = i===active?'auto':'none';
    stops[i].setAttribute('aria-current',String(i===active));
  });
}
function schedule(){if(!pending){pending=true;requestAnimationFrame(draw)}}
function mode(on){
  moving=on;
  document.body.classList.toggle('enhanced',on);
  document.body.classList.toggle('still',!on);
  toggle.textContent=on?'動きを止める':'動きを再開';
  toggle.setAttribute('aria-pressed',String(!on));
  if(!on) scenes.forEach(s=>{s.removeAttribute('style');s.querySelector('.view').removeAttribute('style');s.inert=false});
  draw();
}
toggle.addEventListener('click',()=>{
  const next=!moving;
  const selected=Math.max(0,stops.findIndex(b=>b.getAttribute('aria-current')==='true'));
  mode(next);
  if(!next) scenes[selected].scrollIntoView();
  else walk.scrollIntoView();
});
stops.forEach((b,i)=>b.addEventListener('click',()=>{
  const rect=walk.getBoundingClientRect();
  scrollTo(0,scrollY+rect.top-document.querySelector('header').offsetHeight+(rect.height-walk.querySelector('.stage').offsetHeight)*i/2);
}));
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
reduce.addEventListener('change',()=>mode(!reduce.matches));
mode(!reduce.matches);
