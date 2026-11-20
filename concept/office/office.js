const passage = document.querySelector('#passage');
const frame = passage.querySelector('.frame');
const far = frame.querySelector('.far');
const near = frame.querySelector('.near');
const pause = frame.querySelector('.pause');
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const place = frame.querySelector('.place');
const route = frame.querySelector('.route');
let moving = false;
let scheduled = false;
function paint() {
  scheduled = false;
  if (!moving) return;
  const bounds = passage.getBoundingClientRect();
  const stickyTop = parseFloat(getComputedStyle(frame).top) || 0;
  const progress = Math.max(0,Math.min(1,(stickyTop-bounds.top)/(bounds.height-frame.offsetHeight)));
  const reveal = progress*progress*(3-2*progress);
  const edge = 1-reveal;
  far.style.clipPath = 'inset('+44*edge+'% '+30*edge+'% '+56*edge+'% '+70*edge+'%)';
  near.style.transformOrigin = '70% 44%';
  near.style.transform = 'scale('+(1+reveal*.24)+')';
  place.textContent = progress>.55?'執務室':'ラウンジ';
  route.textContent = progress>.55?'／ ネットワークの設計・構築・運用':'／ 執務室へ';
}
function schedule(){
  if (moving && !scheduled){scheduled=true;requestAnimationFrame(paint)}
}
function setMotion(on){
  moving=on;
  document.body.classList.toggle('live',on);
  document.body.classList.toggle('still',!on);
  pause.hidden=false;
  pause.textContent=on?'動きを止める':'動きを再開';
  pause.setAttribute('aria-pressed',String(!on));
  if(!on){near.removeAttribute('style');far.removeAttribute('style');place.textContent='ラウンジと執務室'}
  paint();
}
pause.addEventListener('click',()=>{
  setMotion(!moving);
  passage.scrollIntoView({block:'start'});
});
preference.addEventListener('change',()=>setMotion(!preference.matches));
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',schedule);
setMotion(!preference.matches);

const photos=[...document.querySelectorAll('.photo')];
const viewer=document.querySelector('dialog');
const enlarged=viewer.querySelector('.large');
let current=0;
function showPhoto(index){
  current=(index+photos.length)%photos.length;
  const photo=photos[current];
  enlarged.src=photo.href;
  enlarged.alt=photo.querySelector('img').alt;
  viewer.querySelector('strong').textContent=enlarged.alt;
  viewer.querySelector('.count').textContent=(current+1)+' / '+photos.length;
}
photos.forEach((photo,index)=>photo.addEventListener('click',event=>{
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||!viewer.showModal)return;
  event.preventDefault();
  showPhoto(index);
  viewer.showModal();
}));
viewer.querySelector('.prev').addEventListener('click',()=>showPhoto(current-1));
viewer.querySelector('.next').addEventListener('click',()=>showPhoto(current+1));
viewer.querySelector('.close').addEventListener('click',()=>viewer.close());
viewer.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft')showPhoto(current-1);
  if(event.key==='ArrowRight')showPhoto(current+1);
});
