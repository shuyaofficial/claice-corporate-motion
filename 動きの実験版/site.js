(() => {
  const menu = document.querySelector('.site-index');
  if (menu) {
    const summary = menu.querySelector('summary');
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        summary.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (menu.open && (!menu.contains(event.target) || event.target.closest('a'))) menu.open = false;
    });
    menu.addEventListener('focusout', (event) => {
      if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false;
    });
  }

  const entry = document.querySelector('.sp-entry');
  if (!entry || !('IntersectionObserver' in window)) return;
  const guards = document.querySelectorAll('[data-entry-guard], .footer-destinations');
  const visible = new Set();
  const observer = new IntersectionObserver((records) => {
    for (const record of records) {
      if (record.isIntersecting) visible.add(record.target);
      else visible.delete(record.target);
    }
    entry.hidden = visible.size > 0;
  });
  guards.forEach((guard) => observer.observe(guard));
})();

(() => {
  const video = document.querySelector('video.loop-video');
  if (!video) return;
  const viewport = matchMedia(video.dataset.media || 'all');
  let visible = false;
  function update() {
    const playing = visible && viewport.matches && !document.hidden && document.documentElement.dataset.motion === 'on';
    if (!playing) { video.pause(); return; }
    if (!video.querySelector('source')) {
      for (const format of ['webm','mp4']) {
        const source = document.createElement('source');
        source.src = video.dataset[format];
        source.type = 'video/' + format;
        video.append(source);
      }
      video.hidden = false;
      video.load();
    }
    video.play().catch(() => {});
  }
  video.addEventListener('playing', () => video.classList.add('is-on'));
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(video.parentElement);
  document.addEventListener('motionchange', update);
  document.addEventListener('visibilitychange', update);
  viewport.addEventListener('change', update);
})();
