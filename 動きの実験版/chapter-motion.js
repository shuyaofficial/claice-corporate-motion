(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => document.documentElement.dataset.motion === 'off' || reduced.matches;
  const chart = document.querySelector('#network');
  const signal = chart?.querySelector('.signal-image');
  const poster = signal?.getAttribute('src');
  const phases = [...(chart?.querySelectorAll('.service-phases li') || [])];
  const rail = document.querySelector('.education-rail');
  const links = [...(rail?.querySelectorAll('a') || [])];
  const chapters = links.map(link => document.getElementById(link.hash.slice(1)));
  const fraction = rail?.querySelector('.rail-fraction');
  const label = rail?.querySelector('.rail-label');
  let active = -1;
  let frame = 0;

  function update() {
    frame = 0;
    if (chart) {
      const view = chart.getBoundingClientRect();
      const progress = (window.innerHeight * .82 - view.top) / Math.min(window.innerHeight * .62, view.height);
      phases.forEach((phase, index) => {
        phase.style.setProperty('--phase', still() ? '1' : String(Math.min(1, Math.max(0, progress * phases.length - index))));
      });
    }
    if (!rail) return;
    const boundary = Math.max(rail.getBoundingClientRect().bottom + 16, window.innerHeight * .35);
    let current = 0;
    chapters.forEach((chapter, index) => {
      if (chapter && chapter.getBoundingClientRect().top <= boundary) current = index;
    });
    const section = chapters[current].getBoundingClientRect();
    const read = Math.max(0, Math.min(1, (boundary - section.top) / Math.max(1, section.height)));
    rail.style.setProperty('--chapter-read', still() ? '0' : String(read));
    if (current === active) return;
    active = current;
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    fraction.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(links.length).padStart(2, '0');
    label.textContent = links[current].getAttribute('aria-label');
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function syncMotion() {
    if (signal) signal.src = still() ? poster : signal.dataset.gif;
    update();
  }

  document.addEventListener('motionchange', syncMotion);
  reduced.addEventListener('change', syncMotion);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  syncMotion();
})();
