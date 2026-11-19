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
  // 背景のループ動画（装飾）: 動きを減らす設定でなく、data-media に合う端末だけ読み込んで流す。
  // autoplay 属性は付けない。ここを通らなければ再生されず、静止画のまま（スマホ・JS 無し・読み込み失敗）。
  // 「動きを止める」は端末に覚えさせ、ほかのページの動画と 3D にも効かせる（window.claiceMotion）。
  {
    const KEY = 'claice-motion';
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = false;
    try { paused = localStorage.getItem(KEY) === 'off'; } catch { /* 保存できない環境では毎回動かす */ }
    const live = [...document.querySelectorAll('video.loop-video')]
      .filter((v) => !reduce.matches && (!v.dataset.media || matchMedia(v.dataset.media).matches));
    const toggles = [...document.querySelectorAll('.loop-toggle')];
    const seen = new Set();
    const run = (v) => {
      if (!paused && seen.has(v) && !document.hidden && !v.dataset.stop) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else v.pause();
    };
    const label = () => toggles.forEach((b) => { b.setAttribute('aria-pressed', String(paused)); b.textContent = paused ? '動かす' : '動きを止める'; });
    const set = (p, keep = true) => {
      paused = p;
      if (keep) try { localStorage.setItem(KEY, p ? 'off' : 'on'); } catch { /* 保存できなくても今のページでは効く */ }
      label();
      live.forEach(run);
      window.dispatchEvent(new CustomEvent('claice:motion', { detail: { paused: p } }));
    };
    window.claiceMotion = { get paused() { return paused; }, set };
    if (live.length) {
      live.forEach((v) => {
        [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(([k, type]) => {
          if (!v.dataset[k]) return;
          const s = document.createElement('source');
          s.src = v.dataset[k]; s.type = type; v.append(s);
        });
        v.addEventListener('playing', () => v.classList.add('is-on'), { once: true });
        v.hidden = false;
        v.load();
      });
      toggles.forEach((b) => { b.hidden = false; b.addEventListener('click', () => set(!paused)); });
      label();
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => { if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); run(en.target); });
        });
        live.forEach((v) => io.observe(v));
      } else { live.forEach((v) => { seen.add(v); run(v); }); }
      document.addEventListener('visibilitychange', () => live.forEach(run));
      reduce.addEventListener?.('change', (e) => { if (e.matches) set(true, false); });
    }
  }

})();
