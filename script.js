/**
 * Shweta weds Swapnil — invitation behaviour.
 *
 *   countdown · scroll choreography (GSAP ScrollTrigger) · falling petals
 *   photo gallery + lightbox (Swiper, fed by photos/photos.json) · background music
 *
 * GSAP and Swiper are vendored in vendor/ and loaded before this file. Every
 * feature here is optional: if a library is missing the page still renders and
 * reads correctly, just with less choreography. Nothing throws.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const hasSwiper = typeof window.Swiper !== 'undefined';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const pad = (value, size = 2) => String(Math.max(0, value)).padStart(size, '0');
  const $ = id => document.getElementById(id);

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------------
     Countdown
     --------------------------------------------------------------- */
  function initCountdown() {
    // Counts down to when the evening starts for guests (Baraati, 6 PM), not to
    // the 11 PM ceremony — change this to T23:00 if you'd rather it target that.
    const weddingTime = new Date('2026-12-23T18:00:00+05:30').getTime();
    const els = Object.fromEntries(
      ['days', 'hours', 'minutes', 'seconds'].map(id => [id, $(id)])
    );
    if (!els.days) return;

    const tick = () => {
      let diff = Math.max(0, weddingTime - Date.now());
      const days = Math.floor(diff / 86400000); diff -= days * 86400000;
      const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
      const minutes = Math.floor(diff / 60000); diff -= minutes * 60000;
      els.days.textContent = pad(days, 3);
      els.hours.textContent = pad(hours);
      els.minutes.textContent = pad(minutes);
      els.seconds.textContent = pad(Math.floor(diff / 1000));
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------
     Falling petals

     Previously this built up to 72 nodes and rewrote a custom property on
     every one of them on every scroll frame. Now each petal keeps its CSS
     keyframe animation and scroll moves ONE element — the container — so the
     parallax costs a single style write per frame instead of 72.
     --------------------------------------------------------------- */
  function initPetals() {
    const field = $('petalField');
    if (!field || reduceMotion) return null;

    const count = window.innerWidth < 640 ? 20 : 34;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i += 1) {
      const petal = document.createElement('span');
      petal.className = `petal${i % 5 === 0 ? ' large' : ''}${i % 7 === 0 ? ' soft' : ''}`;
      petal.style.left = `${Math.random() * 100}vw`;
      petal.style.setProperty('--size', `${9 + Math.random() * 24}px`);
      petal.style.setProperty('--dur', `${9 + Math.random() * 13}s`);
      petal.style.setProperty('--delay', `${-1 * Math.random() * 18}s`);
      petal.style.setProperty('--drift', `${Math.round(Math.random() * 180 - 90)}px`);
      petal.style.setProperty('--rot', `${Math.random() * 360}deg`);
      petal.style.setProperty('--opacity', `${0.3 + Math.random() * 0.48}`);
      petal.style.setProperty('--depth', `${Math.round(Math.random() * 220 - 110)}px`);
      petal.style.setProperty('--drift-base', `${Math.round(Math.random() * 70 - 35)}px`);
      frag.appendChild(petal);
    }
    field.appendChild(frag);
    return field;
  }

  /* ---------------------------------------------------------------
     Scroll choreography

     The gate-opening easing is the original hand-tuned maths, unchanged —
     it just runs inside a ScrollTrigger now so it's frame-synced with the
     rest of the animation instead of racing its own rAF loop.
     --------------------------------------------------------------- */
  /**
   * Fade a group of elements in as they scroll into view.
   *
   * Call this once per group, and only once the elements are actually laid out.
   * ScrollTrigger measures positions when a trigger is created, so registering
   * an element while its section is still `hidden` produces a trigger that never
   * fires — which is how the gallery could end up in the DOM but stuck at
   * opacity 0. The gallery therefore calls this itself after it un-hides.
   */
  function revealOnScroll(elements) {
    if (!elements.length) return;

    if (hasGSAP) {
      ScrollTrigger.batch(elements, {
        start: 'top 88%',
        once: true,
        onEnter: batch => batch.forEach((el, i) => {
          gsap.delayedCall(reduceMotion ? 0 : i * 0.09, () => el.classList.add('in-view'));
        }),
      });
      return;
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
        });
      }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
      elements.forEach(el => io.observe(el));
      return;
    }

    elements.forEach(el => el.classList.add('in-view'));
  }

  function initScrollEffects(petalField) {
    const gateScene = document.querySelector('.gate-scene');
    const layers = [...document.querySelectorAll('.parallax-layer')].filter(el => !el.closest('#gallery'));
    // The gallery is still hidden at this point and reveals itself later.
    const revealables = [...document.querySelectorAll('.reveal, .reveal-stagger')]
      .filter(el => !el.closest('#gallery'));

    // Without GSAP: reveal on scroll, open the gate, skip parallax.
    // The page reads perfectly, it just doesn't dance.
    if (!hasGSAP) {
      root.style.setProperty('--gate-open', '1');
      revealOnScroll(revealables);
      return;
    }

    if (gateScene) {
      ScrollTrigger.create({
        trigger: gateScene,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: self => {
          const p = clamp(self.progress, 0, 1);
          // easeInOutQuad — same curve the original used.
          const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          root.style.setProperty('--gate-open', eased.toFixed(4));
        },
      });
    }

    // matchMedia so GSAP tears all of this down (and reverts inline styles)
    // when the visitor turns on Reduce Motion.
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      layers.forEach(layer => {
        const speed = Number(layer.dataset.speed || 0);
        if (!speed) return;
        gsap.fromTo(layer,
          { y: () => -speed * 130 },
          {
            y: () => speed * 130,
            ease: 'none',
            scrollTrigger: { trigger: layer, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
          }
        );
      });

      if (petalField) {
        gsap.to(petalField, {
          y: 90,
          ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: true },
        });
      }
    });

    // Reveals run regardless of motion preference — the CSS transition is what
    // gets neutralised by the reduced-motion block, so content always appears.
    revealOnScroll(revealables);

    // Fonts land after first paint and change element heights, so remeasure.
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------------------------------------------------------------
     Photo gallery
     --------------------------------------------------------------- */

  const escapeHTML = str => String(str ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));

  /** A photo is usable if the build script gave it something to render. */
  const usable = p => p && !p.missing && typeof p.src === 'string' && p.src.trim() !== '';

  /**
   * One card shape for the whole rail, chosen from the photos themselves.
   *
   * A uniform shape is what stops the row looking ragged, but hardcoding a
   * portrait box would crop a set of landscape photos to about half their width
   * and cut people out of group shots. So take the median orientation and clamp
   * it: a landscape set gets landscape cards, a portrait set gets portrait ones,
   * and a mixed set crops only the minority.
   */
  function cardRatio(photos) {
    const ratios = photos
      .map(p => (Number(p.width) > 0 && Number(p.height) > 0 ? p.width / p.height : null))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    if (!ratios.length) return 0.8;                       // 4:5, a sensible default
    const median = ratios[Math.floor(ratios.length / 2)];
    return clamp(median, 0.72, 1.5);                      // never narrower than 18:25 or wider than 3:2
  }

  function cardMarkup(photo, index) {
    const caption = escapeHTML(photo.caption).trim();
    const event = escapeHTML(photo.event).trim();
    // Fall back to the caption for alt text; an empty alt on a meaningful image
    // is worse than a slightly redundant one.
    const alt = escapeHTML(photo.alt).trim() || caption || 'Wedding celebration photo';

    // Every card shares one media box, sized by cardRatio() from the whole set.
    // object-fit: cover keeps them tidy whatever each individual photo's shape is.
    return `
      <div class="swiper-slide">
        <figure class="photo-card">
          <div class="photo-card-media" style="--lqip: url('${photo.lqip || ''}');">
            <img src="${escapeHTML(photo.src)}"
                 ${photo.srcset ? `srcset="${escapeHTML(photo.srcset)}"` : ''}
                 sizes="(min-width: 960px) 324px, (min-width: 720px) 300px, 78vw"
                 width="${photo.width || 800}" height="${photo.height || 1000}"
                 alt="${alt}" loading="lazy" decoding="async" />
            <button class="photo-card-zoom" type="button" data-index="${index}"
                    aria-label="View photo${caption ? `: ${caption}` : ''} full screen"></button>
          </div>
          ${caption || event ? `
          <figcaption class="photo-card-body">
            ${event ? `<p class="photo-card-event">${event}</p>` : ''}
            ${caption ? `<p class="photo-card-caption">${caption}</p>` : ''}
          </figcaption>` : ''}
        </figure>
      </div>`;
  }

  function lightboxMarkup(photo) {
    const caption = escapeHTML(photo.caption).trim();
    const event = escapeHTML(photo.event).trim();
    const alt = escapeHTML(photo.alt).trim() || caption || 'Wedding celebration photo';
    return `
      <div class="swiper-slide">
        <img src="${escapeHTML(photo.full || photo.src)}" alt="${alt}" loading="lazy" decoding="async" />
        ${caption || event ? `
        <div class="lightbox-caption">
          ${event ? `<p class="photo-card-event">${event}</p>` : ''}
          ${caption ? `<p class="photo-card-caption">${caption}</p>` : ''}
        </div>` : ''}
      </div>`;
  }

  /** Blur up from the inlined placeholder once the real image has decoded. */
  function fadeInWhenLoaded(scope) {
    scope.querySelectorAll('.photo-card-media img').forEach(img => {
      if (img.complete && img.naturalWidth) { img.classList.add('is-loaded'); return; }
      img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
      // A broken image should not sit as a permanent blurred placeholder.
      img.addEventListener('error', () => img.classList.add('is-loaded'), { once: true });
    });
  }

  function initLightbox(photos) {
    const dialog = $('lightbox');
    const slides = $('lightboxSlides');
    if (!dialog || !slides || typeof dialog.showModal !== 'function') return null;

    let swiper = null;
    let built = false;

    const build = () => {
      if (built) return;
      slides.innerHTML = photos.map(lightboxMarkup).join('');
      built = true;
    };

    const open = index => {
      build();
      dialog.showModal();
      document.body.classList.add('lightbox-open');

      if (hasSwiper && !swiper) {
        swiper = new Swiper('#lightboxSwiper', {
          slidesPerView: 1,
          spaceBetween: 0,
          keyboard: { enabled: true },
          navigation: { prevEl: '#lightboxPrev', nextEl: '#lightboxNext' },
          a11y: { enabled: true, prevSlideMessage: 'Previous photo', nextSlideMessage: 'Next photo' },
        });
      }
      // slideTo needs the dialog to be laid out, which only happens after showModal.
      if (swiper) { swiper.update(); swiper.slideTo(index, 0); }
      else slides.children[index]?.scrollIntoView({ block: 'nearest' });
    };

    const close = () => { if (dialog.open) dialog.close(); };

    $('lightboxClose')?.addEventListener('click', close);
    // Clicking the backdrop (i.e. the dialog itself, outside the image) closes.
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    dialog.addEventListener('close', () => document.body.classList.remove('lightbox-open'));

    return { open };
  }

  async function initGallery() {
    const section = $('gallery');
    const slidesEl = $('gallerySlides');
    if (!section || !slidesEl) return;

    let data;
    try {
      const response = await fetch('photos/photos.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    } catch (error) {
      // No gallery is a perfectly fine state — the invitation is the point.
      console.info('[gallery] no photos loaded:', error.message);
      section.remove();
      return;
    }

    const photos = (Array.isArray(data?.photos) ? data.photos : []).filter(usable);
    if (!photos.length) {
      section.remove();
      return;
    }

    const headingEl = section.querySelector('[data-gallery-heading]');
    if (headingEl && typeof data.heading === 'string' && data.heading.trim()) {
      headingEl.textContent = data.heading.trim();
    }

    section.style.setProperty('--card-ratio', String(cardRatio(photos)));
    slidesEl.innerHTML = photos.map(cardMarkup).join('');
    section.hidden = false;
    fadeInWhenLoaded(slidesEl);

    const lightbox = initLightbox(photos);
    if (lightbox) {
      slidesEl.addEventListener('click', event => {
        const btn = event.target.closest('.photo-card-zoom');
        if (btn) lightbox.open(Number(btn.dataset.index) || 0);
      });
    } else {
      // No <dialog> support: the zoom buttons would do nothing, so remove them.
      slidesEl.querySelectorAll('.photo-card-zoom').forEach(b => b.remove());
    }

    const hint = $('galleryHint');
    const hideHint = () => hint?.classList.add('is-hidden');

    if (hasSwiper) {
      const swiper = new Swiper('#gallerySwiper', {
        slidesPerView: 'auto',
        spaceBetween: 16,
        grabCursor: true,
        freeMode: { enabled: true, sticky: false, momentumBounce: false },
        scrollbar: { el: '#galleryScrollbar', draggable: true, hide: false },
        mousewheel: { forceToAxis: true, sensitivity: 0.6 },
        keyboard: { enabled: true, onlyInViewport: true },
        a11y: { enabled: true, containerMessage: 'Photo gallery. Use arrow keys to browse.' },
        // Only decorative — never let a broken observer stop the carousel working.
        resizeObserver: true,
        watchOverflow: true,
      });
      swiper.once('sliderFirstMove', hideHint);
      swiper.on('scrollbarDragStart', hideHint);
    } else {
      // CSS scroll-snap fallback. Same cards, native scrolling.
      const rail = $('gallerySwiper');
      rail?.classList.add('is-fallback');
      rail?.addEventListener('scroll', hideHint, { once: true, passive: true });
    }

    // Now that the section is laid out, register its reveals and its parallax.
    // initScrollEffects deliberately skipped everything inside #gallery, because
    // back then this section was still hidden and would have measured as zero.
    if (hasGSAP) {
      ScrollTrigger.refresh();   // the gallery just added a lot of page height

      const bloom = section.querySelector('.parallax-layer[data-speed]');
      const speed = bloom ? Number(bloom.dataset.speed || 0) : 0;
      if (bloom && speed && !reduceMotion) {
        gsap.fromTo(bloom,
          { y: -speed * 130 },
          {
            y: speed * 130,
            ease: 'none',
            scrollTrigger: { trigger: bloom, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
          }
        );
      }
    }
    revealOnScroll([...section.querySelectorAll('.reveal, .reveal-stagger')]);
  }

  /* ---------------------------------------------------------------
     Background music

     Browsers block audible autoplay until the visitor interacts, so we retry
     on the first few interaction events and expose a toggle either way.
     --------------------------------------------------------------- */
  function initMusic() {
    const music = $('bgMusic');
    const pill = $('musicPill');
    if (!music) return;

    let userPaused = false;
    let attemptedUnlock = false;

    const sync = () => {
      if (!pill) return;
      pill.classList.toggle('paused', music.paused);
      const label = pill.querySelector('b');
      if (label) label.textContent = music.paused ? 'Music' : 'Music on';
      pill.setAttribute('aria-pressed', String(!music.paused));
    };

    async function start(force = false) {
      if (userPaused) return;
      try {
        music.volume = 0.34;
        music.muted = false;
        await music.play();
        attemptedUnlock = true;
      } catch {
        // Fall back to starting muted, then unmuting — some browsers allow this.
        if (force && !attemptedUnlock) {
          try {
            music.muted = true;
            await music.play();
            setTimeout(() => { music.muted = false; music.volume = 0.34; sync(); }, 350);
          } catch { /* autoplay genuinely blocked; the pill still works */ }
        }
      } finally {
        sync();
      }
    }

    start(true);
    window.addEventListener('load', () => start(true), { once: true });
    ['pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown'].forEach(type => {
      window.addEventListener(type, () => start(false), { passive: true, once: true });
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(false); });

    pill?.addEventListener('click', async () => {
      if (music.paused) { userPaused = false; await start(false); }
      else { userPaused = true; music.pause(); sync(); }
    });
    sync();
  }

  /* ---------------------------------------------------------------
     Go
     --------------------------------------------------------------- */
  initCountdown();
  initScrollEffects(initPetals());
  initMusic();
  initGallery();
})();
