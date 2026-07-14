(() => {
  const weddingTime = new Date('2026-12-23T20:00:00+05:30').getTime();
  const ids = ['days', 'hours', 'minutes', 'seconds'];
  const els = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));

  function pad(value, size = 2) {
    return String(Math.max(0, value)).padStart(size, '0');
  }

  function updateCountdown() {
    const now = Date.now();
    let diff = Math.max(0, weddingTime - now);
    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    const minutes = Math.floor(diff / 60000); diff -= minutes * 60000;
    const seconds = Math.floor(diff / 1000);
    els.days.textContent = pad(days, 3);
    els.hours.textContent = pad(hours);
    els.minutes.textContent = pad(minutes);
    els.seconds.textContent = pad(seconds);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  const revealables = document.querySelectorAll('.reveal, .reveal-stagger');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.18 });
  revealables.forEach(el => observer.observe(el));
  setTimeout(() => document.querySelector('.hero-content')?.classList.add('in-view'), 180);

  const layers = [...document.querySelectorAll('.parallax-layer, .parallax-card')];
  let ticking = false;
  function updateParallax() {
    const y = window.scrollY || window.pageYOffset;
    const vh = window.innerHeight || 800;
    layers.forEach(layer => {
      const speed = Number(layer.dataset.speed || 0);
      const rect = layer.getBoundingClientRect();
      const centerDelta = rect.top + rect.height / 2 - vh / 2;
      const move = (centerDelta * speed) + (y * speed * 0.12);
      layer.style.setProperty('--parallax-y', `${move.toFixed(2)}px`);
    });
    ticking = false;
  }
  function requestParallax() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax);
  requestParallax();

  const petalField = document.getElementById('petalField');
  const petalCount = Math.min(34, Math.max(22, Math.round(window.innerWidth / 12)));
  for (let i = 0; i < petalCount; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    const size = 10 + Math.random() * 20;
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.setProperty('--size', `${size}px`);
    petal.style.setProperty('--dur', `${10 + Math.random() * 12}s`);
    petal.style.setProperty('--delay', `${-1 * Math.random() * 14}s`);
    petal.style.setProperty('--drift', `${(Math.random() * 160 - 80).toFixed(0)}px`);
    petal.style.setProperty('--rot', `${Math.random() * 360}deg`);
    petal.style.setProperty('--opacity', `${0.34 + Math.random() * 0.38}`);
    petalField.appendChild(petal);
  }

  const music = document.getElementById('bgMusic');
  const pill = document.getElementById('musicPill');
  let userPaused = false;

  function syncMusicPill() {
    if (!pill || !music) return;
    pill.classList.toggle('paused', music.paused);
    pill.classList.toggle('needs-tap', music.paused && !userPaused);
    pill.querySelector('b').textContent = music.paused ? 'Music' : 'Music on';
  }

  async function startMusic() {
    if (!music || userPaused) return;
    try {
      music.muted = false;
      music.volume = 0.32;
      await music.play();
    } catch (err) {
      // Some mobile browsers block audible autoplay. The scroll/touch listeners below retry as early as allowed.
    } finally {
      syncMusicPill();
    }
  }

  // Aggressive autoplay attempt for browsers that allow it, plus silent retries on natural page activity.
  document.addEventListener('DOMContentLoaded', startMusic, { once: true });
  window.addEventListener('load', startMusic, { once: true });
  ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(type => {
    window.addEventListener(type, startMusic, { passive: true, once: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) startMusic();
  });

  pill?.addEventListener('click', async () => {
    if (!music) return;
    if (music.paused) {
      userPaused = false;
      await startMusic();
    } else {
      userPaused = true;
      music.pause();
      syncMusicPill();
    }
  });
  syncMusicPill();
})();
