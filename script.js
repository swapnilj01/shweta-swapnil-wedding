(() => {
  const root = document.documentElement;
  const weddingTime = new Date('2026-12-23T20:00:00+05:30').getTime();
  const timerIds = ['days', 'hours', 'minutes', 'seconds'];
  const timerEls = Object.fromEntries(timerIds.map(id => [id, document.getElementById(id)]));

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const pad = (value, size = 2) => String(Math.max(0, value)).padStart(size, '0');

  function updateCountdown() {
    let diff = Math.max(0, weddingTime - Date.now());
    const days = Math.floor(diff / 86400000); diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    const minutes = Math.floor(diff / 60000); diff -= minutes * 60000;
    const seconds = Math.floor(diff / 1000);
    if (timerEls.days) timerEls.days.textContent = pad(days, 3);
    if (timerEls.hours) timerEls.hours.textContent = pad(hours);
    if (timerEls.minutes) timerEls.minutes.textContent = pad(minutes);
    if (timerEls.seconds) timerEls.seconds.textContent = pad(seconds);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  const revealables = document.querySelectorAll('.reveal, .reveal-stagger');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
  revealables.forEach(el => observer.observe(el));

  const layers = [...document.querySelectorAll('.parallax-layer')];
  const petals = [];
  const petalField = document.getElementById('petalField');
  const petalCount = Math.min(72, Math.max(44, Math.round(window.innerWidth / 7)));
  for (let i = 0; i < petalCount; i += 1) {
    const petal = document.createElement('span');
    petal.className = `petal ${i % 5 === 0 ? 'large' : ''} ${i % 7 === 0 ? 'soft' : ''}`;
    const size = 9 + Math.random() * 24;
    const depth = Math.round(Math.random() * 220 - 110);
    const driftBase = Math.round(Math.random() * 70 - 35);
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.setProperty('--size', `${size}px`);
    petal.style.setProperty('--dur', `${9 + Math.random() * 13}s`);
    petal.style.setProperty('--delay', `${-1 * Math.random() * 18}s`);
    petal.style.setProperty('--drift', `${Math.round(Math.random() * 180 - 90)}px`);
    petal.style.setProperty('--rot', `${Math.random() * 360}deg`);
    petal.style.setProperty('--opacity', `${0.30 + Math.random() * 0.48}`);
    petal.style.setProperty('--depth', `${depth}px`);
    petal.style.setProperty('--drift-base', `${driftBase}px`);
    petal.dataset.scrollSpeed = String(0.04 + Math.random() * 0.18);
    petalField?.appendChild(petal);
    petals.push(petal);
  }

  let ticking = false;
  function updateScrollEffects() {
    const y = window.scrollY || window.pageYOffset || 0;
    const vh = window.innerHeight || 800;
    const gateScene = document.querySelector('.gate-scene');
    if (gateScene) {
      const rect = gateScene.getBoundingClientRect();
      const total = Math.max(1, gateScene.offsetHeight - vh);
      const progress = clamp((-rect.top) / total, 0, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      root.style.setProperty('--gate-open', eased.toFixed(4));
    }

    layers.forEach(layer => {
      const speed = Number(layer.dataset.speed || 0);
      const rect = layer.getBoundingClientRect();
      const centerDelta = rect.top + rect.height / 2 - vh / 2;
      const move = centerDelta * speed + y * speed * 0.08;
      layer.style.setProperty('--parallax-y', `${move.toFixed(2)}px`);
    });

    petals.forEach((petal, index) => {
      const speed = Number(petal.dataset.scrollSpeed || 0.08);
      const sway = Math.sin((y / 120) + index) * 12;
      petal.style.setProperty('--petal-scroll', `${(y * speed + sway).toFixed(1)}px`);
    });
    ticking = false;
  }
  function requestScrollEffects() {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollEffects);
      ticking = true;
    }
  }
  window.addEventListener('scroll', requestScrollEffects, { passive: true });
  window.addEventListener('resize', requestScrollEffects);
  requestScrollEffects();

  const music = document.getElementById('bgMusic');
  const pill = document.getElementById('musicPill');
  let userPaused = false;
  let attemptedUnlock = false;

  function syncMusicPill() {
    if (!music || !pill) return;
    pill.classList.toggle('paused', music.paused);
    const label = pill.querySelector('b');
    if (label) label.textContent = music.paused ? 'Music' : 'Music on';
  }

  async function startMusic(force = false) {
    if (!music || userPaused) return;
    try {
      music.volume = 0.34;
      music.muted = false;
      await music.play();
      attemptedUnlock = true;
    } catch (error) {
      if (force && !attemptedUnlock) {
        try {
          music.muted = true;
          await music.play();
          setTimeout(() => {
            music.muted = false;
            music.volume = 0.34;
            syncMusicPill();
          }, 350);
        } catch (_) {}
      }
    } finally {
      syncMusicPill();
    }
  }

  startMusic(true);
  document.addEventListener('DOMContentLoaded', () => startMusic(true), { once: true });
  window.addEventListener('load', () => startMusic(true), { once: true });
  ['pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown'].forEach(type => {
    window.addEventListener(type, () => startMusic(false), { passive: true, once: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) startMusic(false);
  });

  pill?.addEventListener('click', async () => {
    if (!music) return;
    if (music.paused) {
      userPaused = false;
      await startMusic(false);
    } else {
      userPaused = true;
      music.pause();
      syncMusicPill();
    }
  });
  syncMusicPill();
})();
