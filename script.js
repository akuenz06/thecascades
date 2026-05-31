/* ============================================================
   WILDS — Wilderness Photography
   Main JavaScript
   ============================================================ */

'use strict';

// ─── CURSOR ──────────────────────────────────────────────────
const cursor     = document.querySelector('.cursor');
const cursorRing = document.querySelector('.cursor-ring');

if (cursor && cursorRing) {
  let mx = -100, my = -100;
  let rx = -100, ry = -100;
  let raf;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  const lerp = (a, b, t) => a + (b - a) * t;

  (function tick() {
    rx = lerp(rx, mx, 0.12);
    ry = lerp(ry, my, 0.12);
    cursor.style.left     = mx + 'px';
    cursor.style.top      = my + 'px';
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top  = ry + 'px';
    raf = requestAnimationFrame(tick);
  })();

  document.querySelectorAll('a, button, .gallery-item, .featured-item, .trip-card, .hero-dot, .carousel-btn').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ─── NAV ─────────────────────────────────────────────────────
const nav     = document.querySelector('.nav');
const burger  = document.querySelector('.nav-hamburger');
const mobileNav = document.querySelector('.nav-mobile');

// transparent on top, solid when scrolled
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    nav?.classList.remove('transparent');
  } else {
    nav?.classList.add('transparent');
  }
}, { passive: true });

// mark transparent initially if page starts at top and has a hero
if (document.querySelector('.hero') && window.scrollY < 60) {
  nav?.classList.add('transparent');
}

// hamburger
burger?.addEventListener('click', () => {
  burger.classList.toggle('open');
  mobileNav?.classList.toggle('open');
});

// active nav link
const currentFile = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === currentFile || (currentFile === '' && href === 'index.html')) {
    a.classList.add('active');
  }
});

// ─── PAGE TRANSITION ─────────────────────────────────────────
const pt = document.querySelector('.page-transition');

function doTransition(url) {
  if (!pt) { location.href = url; return; }
  pt.classList.add('entering');
  setTimeout(() => { location.href = url; }, 460);
}

// intercept nav links (same-origin .html)
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
  e.preventDefault();
  doTransition(href);
});

// on load, play leave animation
window.addEventListener('load', () => {
  if (pt) {
    pt.classList.add('leaving');
    setTimeout(() => pt.classList.remove('leaving'), 1000);
  }
});

// ─── HERO CAROUSEL ───────────────────────────────────────────
function initHeroCarousel() {
  const slides   = document.querySelectorAll('.hero-slide');
  const dots     = document.querySelectorAll('.hero-dot');
  const progress = document.querySelector('.hero-progress');
  const countEl  = document.querySelector('.hero-index .current');
  if (!slides.length) return;

  let current = 0;
  let timer;
  const INTERVAL = 5200;

  function goTo(idx) {
    slides[current].classList.remove('active');
    slides[current].classList.add('prev');
    dots[current]?.classList.remove('active');

    setTimeout(() => slides[idx]?.classList.remove('prev'), 1600);

    current = idx;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
    if (countEl) countEl.textContent = String(current + 1).padStart(2, '0');

    // restart progress bar
    if (progress) {
      progress.classList.remove('animate');
      // force reflow
      void progress.offsetWidth;
      progress.classList.add('animate');
    }
  }

  function next() {
    goTo((current + 1) % slides.length);
    clearInterval(timer);
    timer = setInterval(() => goTo((current + 1) % slides.length), INTERVAL);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      clearInterval(timer);
      timer = setInterval(() => goTo((current + 1) % slides.length), INTERVAL);
    });
  });

  // init
  slides[0].classList.add('active');
  dots[0]?.classList.add('active');
  if (progress) {
    void progress.offsetWidth;
    progress.classList.add('animate');
  }

  timer = setInterval(next, INTERVAL);

  // pause on hover
  const heroEl = document.querySelector('.hero');
  heroEl?.addEventListener('mouseenter', () => clearInterval(timer));
  heroEl?.addEventListener('mouseleave', () => {
    timer = setInterval(next, INTERVAL);
  });

  // keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') {
      goTo((current - 1 + slides.length) % slides.length);
      clearInterval(timer);
      timer = setInterval(() => goTo((current + 1) % slides.length), INTERVAL);
    }
  });

  // touch
  let touchStart = 0;
  heroEl?.addEventListener('touchstart', e => { touchStart = e.touches[0].clientX; }, { passive: true });
  heroEl?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(dx) > 40) dx < 0 ? next() : goTo((current - 1 + slides.length) % slides.length);
  });
}

// ─── FEATURED CAROUSEL ───────────────────────────────────────
function initFeaturedCarousel() {
  const track   = document.querySelector('.featured-track');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  if (!track) return;

  let pos = 0;

  function getVisible() {
    const item = track.querySelector('.featured-item');
    if (!item) return 1;
    const gap = 16;
    const w   = item.offsetWidth + gap;
    return Math.round(track.parentElement.offsetWidth / w);
  }

  function getMax() {
    const items   = track.querySelectorAll('.featured-item');
    const visible = getVisible();
    return Math.max(0, items.length - visible);
  }

  function update() {
    const item = track.querySelector('.featured-item');
    if (!item) return;
    const itemW = item.offsetWidth + 16;
    track.style.transform = `translateX(${-pos * itemW}px)`;
  }

  prevBtn?.addEventListener('click', () => {
    pos = Math.max(0, pos - 1);
    update();
  });

  nextBtn?.addEventListener('click', () => {
    pos = Math.min(getMax(), pos + 1);
    update();
  });

  // touch
  let tStart = 0;
  track.addEventListener('touchstart', e => { tStart = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tStart;
    if (Math.abs(dx) > 40) {
      pos = dx < 0
        ? Math.min(getMax(), pos + 1)
        : Math.max(0, pos - 1);
      update();
    }
  });

  window.addEventListener('resize', update);
}

// ─── GALLERY LIGHTBOX ────────────────────────────────────────
function initLightbox() {
  const lb    = document.querySelector('.lightbox');
  const lbImg = lb?.querySelector('.lightbox-inner img');
  const lbCap = lb?.querySelector('.lightbox-caption');
  const lbCls = lb?.querySelector('.lightbox-close');
  const lbPrv = lb?.querySelector('.lightbox-prev');
  const lbNxt = lb?.querySelector('.lightbox-next');
  if (!lb) return;

  let items = [];
  let idx   = 0;

  function open(i) {
    idx = i;
    const item = items[idx];
    if (!item) return;
    const src = item.getAttribute('data-src') || item.querySelector('img')?.src;
    const cap = item.getAttribute('data-caption') || '';
    if (lbImg) lbImg.src = src;
    if (lbCap) lbCap.textContent = cap;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  function prev() { open((idx - 1 + items.length) % items.length); }
  function next() { open((idx + 1) % items.length); }

  // gather gallery items
  function setupGallery(selector) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    items = Array.from(els);
    items.forEach((el, i) => {
      el.addEventListener('click', () => open(i));
    });
  }

  setupGallery('.gallery-item');

  lbCls?.addEventListener('click', close);
  lbPrv?.addEventListener('click', prev);
  lbNxt?.addEventListener('click', next);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });
}

// ─── SCROLL REVEAL ───────────────────────────────────────────
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─── GALLERY DATA LOADER (for placeholder fallback) ──────────
async function loadGalleryData() {
  try {
    const res  = await fetch('gallery-data.json');
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

// ─── PARALLAX ON HERO ────────────────────────────────────────
function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const slides   = hero.querySelectorAll('.hero-slide.active img');
    slides.forEach(img => {
      img.style.transform = `scale(1) translateY(${scrolled * 0.25}px)`;
    });
  }, { passive: true });
}

// ─── MAGNETIC BUTTONS ─────────────────────────────────────────
function initMagnetic() {
  document.querySelectorAll('.carousel-btn, .lightbox-close, .lightbox-nav-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect   = btn.getBoundingClientRect();
      const cx     = rect.left + rect.width / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) * 0.3;
      const dy     = (e.clientY - cy) * 0.3;
      btn.style.transform = `translate(${dx}px,${dy}px) translateY(-50%)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ─── IMAGE LOAD FADE ──────────────────────────────────────────
function initImgFade() {
  document.querySelectorAll('img').forEach(img => {
    img.style.opacity = img.complete && img.naturalWidth ? '1' : '0';
    img.style.transition = 'opacity 0.6s';
    img.addEventListener('load', () => { img.style.opacity = '1'; });
  });
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHeroCarousel();
  initFeaturedCarousel();
  initLightbox();
  initReveal();
  initParallax();
  initMagnetic();
  initImgFade();
});
