const weddingTime = new Date('2026-12-23T20:00:00+05:30');
const pad = (value) => String(value).padStart(2, '0');

function updateCountdown() {
  const now = new Date();
  let diff = weddingTime.getTime() - now.getTime();

  if (diff <= 0) {
    diff = 0;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  document.getElementById('days').textContent = days;
  document.getElementById('hours').textContent = pad(hours);
  document.getElementById('minutes').textContent = pad(minutes);
  document.getElementById('seconds').textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

let ticking = false;
const parallaxEls = [...document.querySelectorAll('[data-speed]')];

function applyParallax() {
  const y = window.scrollY || window.pageYOffset;
  parallaxEls.forEach((element) => {
    const speed = Number(element.dataset.speed || 0);
    element.style.transform = `translate3d(0, ${y * speed}px, 0)`;
  });
  ticking = false;
}

function requestParallax() {
  if (!ticking) {
    window.requestAnimationFrame(applyParallax);
    ticking = true;
  }
}

window.addEventListener('scroll', requestParallax, { passive: true });
window.addEventListener('resize', requestParallax);
requestParallax();

const audioButton = document.getElementById('audioToggle');
const audioLabel = document.getElementById('audioLabel');
let audioContext = null;
let masterGain = null;
let musicTimer = null;
let isPlaying = false;

function createTone(frequency, start, duration, type = 'sine', gainValue = 0.04) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function startDrone() {
  const now = audioContext.currentTime;
  const base = audioContext.createOscillator();
  const fifth = audioContext.createOscillator();
  const droneGain = audioContext.createGain();
  base.type = 'sine';
  fifth.type = 'sine';
  base.frequency.setValueAtTime(146.83, now);
  fifth.frequency.setValueAtTime(220.0, now);
  droneGain.gain.setValueAtTime(0.0001, now);
  droneGain.gain.exponentialRampToValueAtTime(0.035, now + 1.2);
  base.connect(droneGain);
  fifth.connect(droneGain);
  droneGain.connect(masterGain);
  base.start(now);
  fifth.start(now);

  return () => {
    const stopAt = audioContext.currentTime + 0.5;
    droneGain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    base.stop(stopAt + 0.05);
    fifth.stop(stopAt + 0.05);
  };
}

let stopDrone = null;

function schedulePhrase() {
  if (!isPlaying || !audioContext) return;
  const now = audioContext.currentTime;
  const notes = [293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66, 246.94];
  notes.forEach((freq, index) => {
    createTone(freq, now + index * 0.42, 0.36, index % 2 ? 'triangle' : 'sine', 0.028);
  });
  createTone(587.33, now + 1.65, 1.2, 'sine', 0.018);
  createTone(659.25, now + 2.52, 0.9, 'triangle', 0.016);
}

async function toggleMusic() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.75;
    masterGain.connect(audioContext.destination);
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  if (!isPlaying) {
    isPlaying = true;
    audioButton.classList.add('is-playing');
    audioLabel.textContent = 'Pause instrumental';
    stopDrone = startDrone();
    schedulePhrase();
    musicTimer = setInterval(schedulePhrase, 3600);
  } else {
    isPlaying = false;
    audioButton.classList.remove('is-playing');
    audioLabel.textContent = 'Play instrumental';
    clearInterval(musicTimer);
    musicTimer = null;
    if (stopDrone) stopDrone();
    stopDrone = null;
  }
}

audioButton.addEventListener('click', toggleMusic);
