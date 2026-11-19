// 通常スクロールの距離を、そのまま紙の切り替え位置に使う。
(() => {
  const runway = document.getElementById('scene');
  if (!runway) return;
  const cover = runway.querySelector('.edition-cover');
  const sticky = runway.querySelector('.scene-sticky');
  const sheet = runway.querySelector('.scene-sheet');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let visible = true;
  runway.dataset.ready = '';

  function draw() {
    frame = 0;
    const moving = !media.matches && document.documentElement.dataset.motion !== 'off';
    if (!moving) {
      cover.inert = false;
      sheet.inert = false;
      return;
    }
    const header = parseFloat(getComputedStyle(runway).getPropertyValue('--header-h')) || 0;
    const pin = Math.min(header, window.innerHeight - sticky.offsetHeight);
    const distance = runway.offsetHeight - sticky.offsetHeight;
    const progress = Math.max(0, Math.min(1, (pin - runway.getBoundingClientRect().top) / Math.max(1, distance)));
    runway.style.setProperty('--pin-top', pin + 'px');
    runway.style.setProperty('--edge-left', (125 - progress * 125) + '%');
    runway.style.setProperty('--edge-right', (100 - progress * 125) + '%');
    runway.style.setProperty('--photo-scale', String(.85 + .15 * progress));
    runway.style.setProperty('--paper-turn', (-3 + 3 * progress) + 'deg');
    cover.inert = progress > .64;
    sheet.inert = progress < .36;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }).observe(runway);
  addEventListener('scroll', () => { if (visible) schedule(); }, {passive: true});
  new ResizeObserver(schedule).observe(cover);
  addEventListener('resize', schedule);
  document.addEventListener('motionchange', schedule);
  media.addEventListener('change', schedule);
  draw();
})();
