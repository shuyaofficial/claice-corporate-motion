(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'claice-experiment-motion';
  const fileMode = location.protocol === 'file:';
  const carried = fileMode && new URL(location.href).searchParams.get('motion');
  let stopped = false;
  try { stopped = localStorage.getItem(key) === 'off'; } catch {}
  if (carried === 'off' || carried === 'on') stopped = carried === 'off';
  root.classList.add('js');

  function sync() {
    const off = stopped || reduce.matches;
    root.dataset.motion = off ? 'off' : 'on';
    const button = document.querySelector('.motion-control');
    if (button) {
      button.hidden = false;
      button.disabled = reduce.matches;
      button.textContent = reduce.matches ? '端末設定で停止中' : off ? '動きを再開' : '動きを止める';
    }
    if (fileMode) {
      for (const link of document.querySelectorAll('a[href]')) {
        if (link.getAttribute('href').startsWith('#') || link.protocol !== 'file:' || !link.pathname.endsWith('.html')) continue;
        const url = new URL(link.href);
        url.searchParams.set('motion', stopped ? 'off' : 'on');
        link.href = url.href;
      }
    }
    document.dispatchEvent(new Event('motionchange'));
  }
  sync();
  document.addEventListener('DOMContentLoaded', () => {
    sync();
    document.querySelector('.motion-control')?.addEventListener('click', () => {
      stopped = !stopped;
      try { localStorage.setItem(key, stopped ? 'off' : 'on'); } catch {}
      if (fileMode) {
        const url = new URL(location.href);
        url.searchParams.set('motion', stopped ? 'off' : 'on');
        try { history.replaceState(null, '', url); } catch {}
      }
      sync();
    });
  });
  reduce.addEventListener('change', sync);
})();
