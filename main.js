/**
 * Rolex Yacht-Master II — Premium Landing Page
 * Interactions, Scroll Animations, Gallery, Parallax
 */

'use strict';

/* ═══════════════════════════════════════════════
   UTILITY
═══════════════════════════════════════════════ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function mapRange(val, inMin, inMax, outMin, outMax) {
  return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
}


/* ═══════════════════════════════════════════════
   NAVIGATION — scroll-aware opacity
═══════════════════════════════════════════════ */
function initNav() {
  const nav = $('#nav');
  if (!nav) return;

  let ticking = false;
  const threshold = 80;

  function updateNav() {
    const scrollY = window.scrollY;
    if (scrollY > threshold) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });
}


/* ═══════════════════════════════════════════════
   MOBILE MENU
═══════════════════════════════════════════════ */
function initMobileMenu() {
  const toggle = $('#menu-toggle');
  const closeBtn = $('#menu-close');
  const menu = $('#mobile-menu');
  const mobileLinks = $$('.mobile-menu__link');

  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add('is-open');
    menu.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
    }
  });
}


/* ═══════════════════════════════════════════════
   SCROLL REVEAL — Intersection Observer
═══════════════════════════════════════════════ */
function initScrollReveal() {
  const revealUpEls = $$('.reveal-up');
  const revealMaskEls = $$('.reveal-mask');

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.05,
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealUpEls.forEach(el => revealObserver.observe(el));
  revealMaskEls.forEach(el => revealObserver.observe(el));
}


/* ═══════════════════════════════════════════════
   PARALLAX — showcase section
═══════════════════════════════════════════════ */
function initParallax() {
  const showcaseSection = $('.showcase');
  const showcaseImg = $('.showcase__parallax-wrap');

  if (!showcaseSection || !showcaseImg) return;

  let currentY = 0;
  let targetY = 0;
  let animating = false;

  function tick() {
    currentY = lerp(currentY, targetY, 0.08);
    const diff = Math.abs(currentY - targetY);

    showcaseImg.style.transform = `translateY(${currentY}px)`;

    if (diff > 0.01) {
      requestAnimationFrame(tick);
    } else {
      animating = false;
    }
  }

  window.addEventListener('scroll', () => {
    const rect = showcaseSection.getBoundingClientRect();
    const windowH = window.innerHeight;

    if (rect.bottom < 0 || rect.top > windowH) return;

    const progress = mapRange(rect.top, windowH, -rect.height, 0, 1);
    targetY = clamp(progress * 80 - 40, -60, 60);

    if (!animating) {
      animating = true;
      requestAnimationFrame(tick);
    }
  }, { passive: true });
}


/* ═══════════════════════════════════════════════
   PARALLAX — intro image
═══════════════════════════════════════════════ */
function initIntroParallax() {
  const introImg = $('.intro__image');
  if (!introImg) return;

  window.addEventListener('scroll', () => {
    const rect = introImg.closest('.intro__image-col').getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const progress = mapRange(rect.top, window.innerHeight, -rect.height, 0, 1);
    const shift = (progress - 0.5) * 40;

    introImg.style.transform = `scale(1.05) translateY(${shift}px)`;
  }, { passive: true });
}


/* ═══════════════════════════════════════════════
   GALLERY — drag & click navigation
═══════════════════════════════════════════════ */
function initGallery() {
  const track = $('#gallery-track');
  const wrap = $('#gallery-track-wrap');
  const prevBtn = $('#gallery-prev');
  const nextBtn = $('#gallery-next');
  const progressFill = $('#gallery-progress-fill');

  if (!track || !wrap) return;

  const slides = $$('.gallery__slide', track);
  const totalSlides = slides.length;
  let currentIndex = 0;
  let isDragging = false;
  let startX = 0;
  let dragDelta = 0;
  let baseOffset = 0;

  // Calculate visible slides based on viewport
  function getSlideWidth() {
    if (slides.length === 0) return 0;
    return slides[0].offsetWidth + 2; // gap = 2px
  }

  function getMaxIndex() {
    const visibleCount = Math.floor(wrap.offsetWidth / getSlideWidth());
    return Math.max(0, totalSlides - visibleCount);
  }

  function updateProgress() {
    const maxIdx = getMaxIndex();
    const pct = maxIdx > 0 ? (currentIndex / maxIdx) * 100 : 100;
    if (progressFill) {
      progressFill.style.width = `${Math.max(12, pct)}%`;
    }
  }

  function goTo(index) {
    const maxIdx = getMaxIndex();
    currentIndex = clamp(index, 0, maxIdx);
    const offset = currentIndex * getSlideWidth();
    track.style.transform = `translateX(-${offset}px)`;
    updateProgress();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

  // Drag support
  function onDragStart(e) {
    isDragging = true;
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const currentTransform = new DOMMatrix(getComputedStyle(track).transform);
    baseOffset = currentTransform.m41;
    track.style.transition = 'none';
    wrap.classList.add('dragging');
  }

  function onDragMove(e) {
    if (!isDragging) return;
    const x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    dragDelta = x - startX;
    const newOffset = baseOffset + dragDelta;
    track.style.transform = `translateX(${newOffset}px)`;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    wrap.classList.remove('dragging');
    track.style.transition = '';

    const slideW = getSlideWidth();
    if (Math.abs(dragDelta) > slideW * 0.2) {
      if (dragDelta < 0) {
        goTo(currentIndex + 1);
      } else {
        goTo(currentIndex - 1);
      }
    } else {
      goTo(currentIndex);
    }
    dragDelta = 0;
  }

  wrap.addEventListener('mousedown', onDragStart);
  wrap.addEventListener('touchstart', onDragStart, { passive: true });
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('touchmove', onDragMove, { passive: true });
  window.addEventListener('mouseup', onDragEnd);
  window.addEventListener('touchend', onDragEnd);

  // Keyboard navigation
  wrap.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
    if (e.key === 'ArrowRight') goTo(currentIndex + 1);
  });

  // Init
  updateProgress();
  window.addEventListener('resize', () => goTo(currentIndex), { passive: true });
}


/* ═══════════════════════════════════════════════
   HERO FRAME SEQUENCE — Apple-style scroll animation
   151 frames · 5 feature panels driven by scroll
═══════════════════════════════════════════════ */
function initHeroSequence() {
  const canvas = $('#hero-seq-canvas');
  const progress = $('#hero-seq-progress');
  const frameNum = $('#hero-seq-frame-num');
  const scrollHint = $('#hero-seq-scroll-hint');
  const section = $('#hero');
  const panels = $$('.hero-seq__panel');

  if (!canvas || !section) return;

  const ctx = canvas.getContext('2d');
  const TOTAL_FRAMES = 151;

  // ── Frame path helper ────────────────────────
  function framePath(n) {
    return `/images/herosection/ezgif-frame-${String(n).padStart(3, '0')}.png`;
  }

  // ── Canvas sizing ─────────────────────────────
  function resizeCanvas() {
    canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    if (images[currentFrame] && images[currentFrame].complete) {
      drawFrame(images[currentFrame]);
    }
  }

  // ── Draw a single frame cover-fit ─────────────
  function drawFrame(img) {
    if (!img || !img.complete || !img.naturalWidth) return;
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh);
  }

  // ── Pre-load ALL frames ────────────────────────
  const images = new Array(TOTAL_FRAMES + 1); // 1-indexed
  let loadedCount = 0;
  let currentFrame = 1;

  // Load priority: first frame immediately, rest in sequence
  function loadFrame(i) {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (i === 1) {
        // Draw as soon as frame 1 loads
        resizeCanvas();
      }
    };
    img.src = framePath(i);
    images[i] = img;
  }

  // Load frame 1 immediately
  loadFrame(1);
  // Then load the rest in order
  for (let i = 2; i <= TOTAL_FRAMES; i++) {
    loadFrame(i);
  }

  // ── Panel definitions (frame ranges) ──────────
  // Each entry: [startFrame, endFrame, panelIndex]
  const panelRanges = [
    [1, 30, 0],  // Intro
    [31, 60, 1],  // Cerachrom Bezel
    [61, 100, 2],  // Oyster Case
    [101, 135, 3],  // Calibre 4161
    [136, 151, 4],  // Grand Finale
  ];

  function getActivePanel(frame) {
    for (const [start, end, idx] of panelRanges) {
      if (frame >= start && frame <= end) return idx;
    }
    return 0;
  }

  let activePanel = -1;

  function updatePanels(frame) {
    const newActive = getActivePanel(frame);
    if (newActive === activePanel) return;
    activePanel = newActive;
    panels.forEach((panel, i) => {
      const isActive = i === activePanel;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  // ── Scroll handler ─────────────────────────────
  let ticking = false;
  let hintHidden = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateSequence);
      ticking = true;
    }
  }

  function updateSequence() {
    const rect = section.getBoundingClientRect();
    const sectionH = section.offsetHeight;
    const viewportH = window.innerHeight;

    // scrolled = how far into the section we've scrolled (0 → sectionH - viewportH)
    const scrolled = clamp(-rect.top, 0, sectionH - viewportH);
    const t = scrolled / (sectionH - viewportH); // 0..1

    // Map t → frame index (1..151)
    const frameIdx = clamp(Math.round(t * (TOTAL_FRAMES - 1)) + 1, 1, TOTAL_FRAMES);

    // Draw only if frame changed and image loaded
    if (frameIdx !== currentFrame) {
      currentFrame = frameIdx;
      if (images[frameIdx] && images[frameIdx].complete) {
        drawFrame(images[frameIdx]);
      }
    } else if (frameIdx === 1 && images[1] && images[1].complete) {
      // Ensure first frame always visible
      drawFrame(images[1]);
    }

    // Update panels
    updatePanels(frameIdx);

    // Update progress bar
    if (progress) progress.style.width = `${t * 100}%`;

    // Update frame counter
    if (frameNum) frameNum.textContent = String(frameIdx).padStart(3, '0');

    // Hide scroll hint after first significant scroll
    if (!hintHidden && scrolled > 40 && scrollHint) {
      scrollHint.classList.add('is-hidden');
      hintHidden = true;
    }

    ticking = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Activate panel 0 on load
  setTimeout(() => {
    if (panels[0]) {
      panels[0].classList.add('is-active');
      panels[0].setAttribute('aria-hidden', 'false');
    }
    activePanel = 0;
  }, 400);

  // Initial sizing
  resizeCanvas();
}


/* ═══════════════════════════════════════════════
   SMOOTH SCROLL — for anchor links
═══════════════════════════════════════════════ */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h'), 10) || 72;

      const top = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    });
  });
}


/* ═══════════════════════════════════════════════
   SPEC ITEMS — staggered reveal
═══════════════════════════════════════════════ */
function initSpecReveal() {
  const specItems = $$('.spec-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const items = $$('.spec-item');
        items.forEach((item, i) => {
          setTimeout(() => {
            item.classList.add('is-visible');
          }, i * 60);
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });

  if (specItems.length > 0) {
    observer.observe(specItems[0]);
  }
}


/* ═══════════════════════════════════════════════
   GOLD TEXTURE — subtle animation
═══════════════════════════════════════════════ */
function initGoldTexture() {
  const texture = $('.gold-section__texture');
  if (!texture) return;

  let angle = 0;
  let animId = null;
  let isVisible = false;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (isVisible && !animId) {
        animate();
      } else if (!isVisible && animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    });
  }, { threshold: 0.1 });

  observer.observe(texture);

  function animate() {
    angle += 0.003;
    const x = 35 + Math.sin(angle) * 5;
    const y = 35 + Math.cos(angle * 0.7) * 5;
    texture.style.background = `
      radial-gradient(circle at ${x}% ${y}%, #d4aa5a 0%, #b8963e 30%, #7a6228 60%, #2a1e08 100%)
    `;
    animId = requestAnimationFrame(animate);
  }
}


/* ═══════════════════════════════════════════════
   SCROLL PROGRESS — background tint on nav
═══════════════════════════════════════════════ */
function initScrollProgress() {
  const nav = $('#nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollY / docH;

    // Subtle gold accent on nav crown when scrolled deep
    if (progress > 0.7) {
      nav.style.setProperty('--nav-crown-opacity', '1');
    }
  }, { passive: true });
}


/* ═══════════════════════════════════════════════
   BUTTON HOVER — magnetic micro-interaction
═══════════════════════════════════════════════ */
function initButtonMagnet() {
  const buttons = $$('.btn--primary, .btn--gold');

  buttons.forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const strength = 0.15;

      btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}


/* ═══════════════════════════════════════════════
   DIAL ANNOTATIONS — fade in on scroll
═══════════════════════════════════════════════ */
function initDialAnnotations() {
  const annotations = $$('.dial-annotation');
  if (annotations.length === 0) return;

  // Initially hidden
  annotations.forEach(ann => {
    ann.style.opacity = '0';
    ann.style.transition = 'opacity 0.8s ease';
  });

  const section = $('.dial-section');
  if (!section) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        annotations.forEach((ann, i) => {
          setTimeout(() => {
            ann.style.opacity = '1';
          }, 800 + i * 300);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(section);
}


/* ═══════════════════════════════════════════════
   PERFORMANCE — prefetch on hover
═══════════════════════════════════════════════ */
function initPrefetch() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('mouseenter', () => {
      const href = link.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        const imgs = $$('img', target);
        imgs.forEach(img => {
          if (img.dataset.src && !img.src) {
            img.src = img.dataset.src;
          }
        });
      }
    }, { once: true });
  });
}


/* ═══════════════════════════════════════════════
   HERO LAYERS — subtle parallax depth
═══════════════════════════════════════════════ */
function initHeroLayerParallax() {
  const hero = $('.hero');
  const glimmer = $('.hero__bg-glimmer');
  const glint = $('.hero__bg-glint');
  const shadow = $('.hero__bg-shadow');

  if (!hero || !glimmer) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const heroH = hero.offsetHeight;

        if (scrollY > heroH) {
          ticking = false;
          return;
        }

        const progress = scrollY / heroH;

        if (glimmer) glimmer.style.transform = `translateY(${progress * 30}px)`;
        if (glint) glint.style.transform = `translateY(${progress * 20}px)`;
        if (shadow) shadow.style.transform = `translateY(${progress * 10}px)`;

        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}


/* ═══════════════════════════════════════════════
   HERO 3D WATCH MODEL (THREE.JS / WEBGL)
═══════════════════════════════════════════════ */
function initHero3DWatch() {
  const canvas = $('#hero-canvas');
  const mount = $('#hero-3d-mount');
  const btn360 = $('#btn-rotate-360');
  const btnChroma = $('#btn-chromalight');
  const btnReset = $('#btn-reset-view');
  const hint = $('#hero-3d-hint');

  if (!canvas || !mount || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 8.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  // Watch Main Container Group
  const watchGroup = new THREE.Group();
  scene.add(watchGroup);

  // Initial presentation angle
  const baseRotX = 0.08;
  const baseRotY = -0.22;
  watchGroup.rotation.x = baseRotX;
  watchGroup.rotation.y = baseRotY;

  // ─────────────────────────────────────────────
  // LUXURY PROCEDURAL TEXTURES
  // ─────────────────────────────────────────────

  // 1. Dial Texture (Yacht-Master II white lacquer with countdown scale)
  function createDialTexture() {
    const dCanvas = document.createElement('canvas');
    dCanvas.width = 1024;
    dCanvas.height = 1024;
    const ctx = dCanvas.getContext('2d');

    // White lacquer dial base
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle brushed inner dial glow
    const radial = ctx.createRadialGradient(512, 512, 50, 512, 512, 512);
    radial.addColorStop(0, '#ffffff');
    radial.addColorStop(0.85, '#f4f4f4');
    radial.addColorStop(1, '#e8e8e8');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(512, 512, 500, 0, Math.PI * 2);
    ctx.fill();

    // Horseshoe 10-Minute Countdown Arch
    ctx.save();
    ctx.translate(512, 512);
    ctx.beginPath();
    ctx.arc(0, 0, 340, Math.PI * 0.72, Math.PI * 2.28, false);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#0a3d82';
    ctx.stroke();

    // Red countdown inner graduation
    ctx.beginPath();
    ctx.arc(0, 0, 316, Math.PI * 0.72, Math.PI * 2.28, false);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d62828';
    ctx.stroke();

    // Countdown numerals (10 to 1)
    const countdownNums = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'];
    const totalSteps = countdownNums.length - 1;
    const startAngle = Math.PI * 0.73;
    const endAngle = Math.PI * 2.27;

    for (let i = 0; i <= totalSteps; i++) {
      const angle = startAngle + (i / totalSteps) * (endAngle - startAngle);
      const nx = Math.cos(angle) * 365;
      const ny = Math.sin(angle) * 365;

      ctx.save();
      ctx.translate(nx, ny);
      ctx.fillStyle = '#0a3d82';
      ctx.font = 'bold 36px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(countdownNums[i], 0, 0);

      // Red triangular index indicator
      ctx.beginPath();
      const tx = Math.cos(angle) * -22;
      const ty = Math.sin(angle) * -22;
      ctx.arc(tx, ty, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#d62828';
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // Subdial at 6 o'clock (Small Seconds)
    ctx.save();
    ctx.translate(512, 700);
    ctx.beginPath();
    ctx.arc(0, 0, 110, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#b8963e';
    ctx.stroke();

    // Subdial concentric rings
    for (let r = 25; r < 105; r += 20) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(184, 150, 62, 0.25)';
      ctx.stroke();
    }

    // Subdial markers (60, 15, 30, 45)
    ctx.fillStyle = '#111';
    ctx.font = '600 20px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('60', 0, -85);
    ctx.fillText('30', 0, 85);
    ctx.fillText('15', 85, 0);
    ctx.fillText('45', -85, 0);
    ctx.restore();

    // Dial Editorial Typography (ROLEX, OYSTER PERPETUAL, YACHT-MASTER II)
    ctx.save();
    ctx.fillStyle = '#111114';
    ctx.textAlign = 'center';

    // Rolex Crown coronet at 12
    ctx.fillStyle = '#b8963e';
    ctx.beginPath();
    ctx.moveTo(512, 230);
    ctx.lineTo(528, 260);
    ctx.lineTo(545, 240);
    ctx.lineTo(535, 275);
    ctx.lineTo(489, 275);
    ctx.lineTo(479, 240);
    ctx.lineTo(496, 260);
    ctx.closePath();
    ctx.fill();

    // Brand Texts
    ctx.fillStyle = '#111114';
    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.fillText('ROLEX', 512, 310);

    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillStyle = '#444';
    ctx.letterSpacing = '4px';
    ctx.fillText('OYSTER PERPETUAL', 512, 335);

    ctx.fillStyle = '#0a3d82';
    ctx.font = 'bold 22px "Inter", sans-serif';
    ctx.fillText('YACHT-MASTER II', 512, 365);

    ctx.fillStyle = '#666';
    ctx.font = '400 13px "Inter", sans-serif';
    ctx.fillText('SUPERLATIVE CHRONOMETER', 512, 400);
    ctx.fillText('OFFICIALLY CERTIFIED', 512, 420);

    // Swiss Made at 6 bottom
    ctx.font = '500 14px "Inter", sans-serif';
    ctx.fillText('SWISS    MADE', 512, 980);
    ctx.restore();

    const tex = new THREE.CanvasTexture(dCanvas);
    tex.anisotropy = 16;
    return tex;
  }

  // 2. Cerachrom Bezel Texture
  function createBezelTexture() {
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 1024;
    bCanvas.height = 1024;
    const ctx = bCanvas.getContext('2d');

    // Deep royal Cerachrom blue background
    ctx.fillStyle = '#093a7d';
    ctx.fillRect(0, 0, 1024, 1024);

    // Concentric ring bevels
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#d4aa5a';
    ctx.strokeRect(5, 5, 1014, 1014);

    // Numerals and "YACHT-MASTER II" embossed in 18 ct gold
    ctx.translate(512, 512);

    const bezelLabels = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
    for (let i = 0; i < bezelLabels.length; i++) {
      const ang = (i / 12) * Math.PI * 1.5 - Math.PI * 0.75;
      const bx = Math.cos(ang) * 410;
      const by = Math.sin(ang) * 410;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = '#f5d38c';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 54px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bezelLabels[i], 0, 0);
      ctx.restore();
    }

    // Bezel Title "YACHT-MASTER II" along bottom arc
    ctx.save();
    ctx.fillStyle = '#f5d38c';
    ctx.font = 'bold 44px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YACHT-MASTER II', 0, 420);
    ctx.restore();

    const tex = new THREE.CanvasTexture(bCanvas);
    tex.anisotropy = 16;
    return tex;
  }

  // ─────────────────────────────────────────────
  // MATERIALS
  // ─────────────────────────────────────────────
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xefca6e,
    metalness: 0.96,
    roughness: 0.18,
  });

  const goldPolished = new THREE.MeshStandardMaterial({
    color: 0xfbe28e,
    metalness: 0.98,
    roughness: 0.10,
  });

  const goldBrushed = new THREE.MeshStandardMaterial({
    color: 0xdbaf50,
    metalness: 0.92,
    roughness: 0.38,
  });

  const cerachromMaterial = new THREE.MeshStandardMaterial({
    color: 0x093a7d,
    metalness: 0.15,
    roughness: 0.10,
  });

  const dialMaterial = new THREE.MeshStandardMaterial({
    map: createDialTexture(),
    metalness: 0.05,
    roughness: 0.55,
  });

  const lumeMaterial = new THREE.MeshStandardMaterial({
    color: 0xebf8ff,
    emissive: 0x000000,
    emissiveIntensity: 0.0,
    roughness: 0.3,
  });

  const redAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xd62828,
    metalness: 0.2,
    roughness: 0.3,
  });

  const sapphireMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.25,
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.5,
  });

  // ─────────────────────────────────────────────
  // 3D MODEL GEOMETRY ASSEMBLY
  // ─────────────────────────────────────────────

  // 1. Middle Case (18 ct Yellow Gold 44 mm Oyster Case)
  const caseGeo = new THREE.CylinderGeometry(2.35, 2.38, 0.65, 64);
  const caseMesh = new THREE.Mesh(caseGeo, goldMaterial);
  caseMesh.rotation.x = Math.PI / 2;
  watchGroup.add(caseMesh);

  // 2. Beveled Case Flanks / Lugs
  const lugShape = new THREE.Shape();
  lugShape.moveTo(-1.6, 1.8);
  lugShape.lineTo(1.6, 1.8);
  lugShape.lineTo(1.3, 3.4);
  lugShape.lineTo(-1.3, 3.4);
  lugShape.closePath();

  const lugExtrudeSettings = { depth: 0.55, bevelEnabled: true, bevelSegments: 4, steps: 2, bevelSize: 0.08, bevelThickness: 0.08 };
  const topLugGeo = new THREE.ExtrudeGeometry(lugShape, lugExtrudeSettings);
  const topLugMesh = new THREE.Mesh(topLugGeo, goldPolished);
  topLugMesh.position.set(0, 0, -0.3);
  watchGroup.add(topLugMesh);

  const bottomLugMesh = topLugMesh.clone();
  bottomLugMesh.rotation.z = Math.PI;
  watchGroup.add(bottomLugMesh);

  // 3. Bezel Assembly (Coin-edge fluted base + Cerachrom Insert)
  const flutedBezelGeo = new THREE.CylinderGeometry(2.42, 2.44, 0.22, 96);
  const flutedMesh = new THREE.Mesh(flutedBezelGeo, goldPolished);
  flutedMesh.rotation.x = Math.PI / 2;
  flutedMesh.position.z = 0.35;
  watchGroup.add(flutedMesh);

  // Blue Cerachrom insert disc
  const cerachromGeo = new THREE.RingGeometry(1.82, 2.38, 64);
  const cerachromMesh = new THREE.Mesh(cerachromGeo, cerachromMaterial);
  cerachromMesh.position.z = 0.48;
  watchGroup.add(cerachromMesh);

  // Outer gold rim on Cerachrom insert
  const goldRimGeo = new THREE.RingGeometry(2.37, 2.42, 64);
  const goldRimMesh = new THREE.Mesh(goldRimGeo, goldPolished);
  goldRimMesh.position.z = 0.49;
  watchGroup.add(goldRimMesh);

  // 4. White Lacquer Dial Face
  const dialGeo = new THREE.CircleGeometry(1.80, 64);
  const dialMesh = new THREE.Mesh(dialGeo, dialMaterial);
  dialMesh.position.z = 0.45;
  watchGroup.add(dialMesh);

  // 5. Hour Appliqué Markers (18 ct gold border + Chromalight luminescent core)
  const markerGroup = new THREE.Group();
  watchGroup.add(markerGroup);

  for (let i = 0; i < 12; i++) {
    if (i === 0) continue; // 12 o'clock crown
    const angle = (i / 12) * Math.PI * 2;
    const r = 1.62;
    const mx = Math.cos(angle) * r;
    const my = Math.sin(angle) * r;

    // Outer gold frame
    const mFrameGeo = new THREE.BoxGeometry(0.12, 0.24, 0.04);
    const mFrame = new THREE.Mesh(mFrameGeo, goldPolished);
    mFrame.position.set(mx, my, 0.47);
    mFrame.rotation.z = angle + Math.PI / 2;

    // Luminous insert
    const mLumeGeo = new THREE.BoxGeometry(0.08, 0.18, 0.05);
    const mLume = new THREE.Mesh(mLumeGeo, lumeMaterial);
    mLume.position.set(mx, my, 0.475);
    mLume.rotation.z = angle + Math.PI / 2;

    markerGroup.add(mFrame);
    markerGroup.add(mLume);
  }

  // 6. Sapphire Crystal Glass
  const glassGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.1, 64);
  const glassMesh = new THREE.Mesh(glassGeo, sapphireMaterial);
  glassMesh.rotation.x = Math.PI / 2;
  glassMesh.position.z = 0.54;
  watchGroup.add(glassMesh);

  // 7. Screw-down Crown & Pushers (Right side)
  const crownGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.45, 32);
  const crownMesh = new THREE.Mesh(crownGeo, goldPolished);
  crownMesh.rotation.z = Math.PI / 2;
  crownMesh.position.set(2.55, 0, 0);
  watchGroup.add(crownMesh);

  // Crown Guards
  const guardGeo = new THREE.BoxGeometry(0.3, 0.8, 0.4);
  const guardMesh = new THREE.Mesh(guardGeo, goldMaterial);
  guardMesh.position.set(2.35, 0, 0);
  watchGroup.add(guardMesh);

  // Top Pusher (Start / Stop at 2 o'clock)
  const pusherGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.35, 24);
  const topPusher = new THREE.Mesh(pusherGeo, goldPolished);
  topPusher.rotation.z = Math.PI / 2 - 0.52;
  topPusher.position.set(2.38, 1.15, 0);
  watchGroup.add(topPusher);

  // Bottom Pusher (Sync / Reset at 4 o'clock)
  const btmPusher = topPusher.clone();
  btmPusher.rotation.z = Math.PI / 2 + 0.52;
  btmPusher.position.set(2.38, -1.15, 0);
  watchGroup.add(btmPusher);

  // 8. 18 ct Yellow Gold Oyster Bracelet Links (Top & Bottom curves)
  function createBraceletChain(isTop = true) {
    const chainGroup = new THREE.Group();
    const dir = isTop ? 1 : -1;
    const numLinks = 5;

    for (let k = 0; k < numLinks; k++) {
      const linkGroup = new THREE.Group();
      const zOffset = -k * 0.45;
      const yOffset = (3.3 + k * 0.95) * dir;
      const curveRotX = dir * (0.15 + k * 0.18);

      // Center Link (Mirror-polished 18 ct gold)
      const centerGeo = new THREE.BoxGeometry(1.25, 0.85, 0.38);
      const centerMesh = new THREE.Mesh(centerGeo, goldPolished);

      // Outer Links (Satin brushed 18 ct gold)
      const outerLeftGeo = new THREE.BoxGeometry(0.55, 0.82, 0.32);
      const outerLeft = new THREE.Mesh(outerLeftGeo, goldBrushed);
      outerLeft.position.x = -0.95;

      const outerRight = outerLeft.clone();
      outerRight.position.x = 0.95;

      linkGroup.add(centerMesh);
      linkGroup.add(outerLeft);
      linkGroup.add(outerRight);

      linkGroup.position.set(0, yOffset, zOffset);
      linkGroup.rotation.x = curveRotX;
      chainGroup.add(linkGroup);
    }
    return chainGroup;
  }

  watchGroup.add(createBraceletChain(true));
  watchGroup.add(createBraceletChain(false));

  // 9. Watch Hands
  // Hour hand (Mercedes with Chromalight)
  const hourGroup = new THREE.Group();
  const hourArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.03), goldPolished);
  hourArm.position.y = 0.45;
  const hourCircle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24), goldPolished);
  hourCircle.rotation.x = Math.PI / 2;
  hourCircle.position.y = 0.65;
  const hourLume = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 24), lumeMaterial);
  hourLume.rotation.x = Math.PI / 2;
  hourLume.position.y = 0.65;
  hourGroup.add(hourArm);
  hourGroup.add(hourCircle);
  hourGroup.add(hourLume);
  hourGroup.position.z = 0.49;
  watchGroup.add(hourGroup);

  // Minute hand (Baton with Chromalight strip)
  const minuteGroup = new THREE.Group();
  const minuteArm = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.45, 0.03), goldPolished);
  minuteArm.position.y = 0.72;
  const minuteLume = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.04), lumeMaterial);
  minuteLume.position.y = 0.72;
  minuteGroup.add(minuteArm);
  minuteGroup.add(minuteLume);
  minuteGroup.position.z = 0.51;
  watchGroup.add(minuteGroup);

  // Regatta Countdown Hand (Red triangular pointer)
  const countdownGroup = new THREE.Group();
  const cdArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.25, 0.03), cerachromMaterial);
  cdArm.position.y = 0.62;
  const cdArrow = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 3), redAccentMaterial);
  cdArrow.position.y = 1.35;
  countdownGroup.add(cdArm);
  countdownGroup.add(cdArrow);
  countdownGroup.position.z = 0.50;
  countdownGroup.rotation.z = -Math.PI * 0.45; // points to 10 min
  watchGroup.add(countdownGroup);

  // Chronograph Sweep Second Hand (Slender red arrow tip + counterweight)
  const secondGroup = new THREE.Group();
  const secArm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.65, 0.02), goldPolished);
  secArm.position.y = 0.65;
  const secTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 3), redAccentMaterial);
  secTip.position.y = 1.55;
  const secCounter = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), goldPolished);
  secCounter.position.y = -0.3;
  secondGroup.add(secArm);
  secondGroup.add(secTip);
  secondGroup.add(secCounter);
  secondGroup.position.z = 0.53;
  watchGroup.add(secondGroup);

  // Small seconds hand at 6 o'clock subdial
  const smallSecGroup = new THREE.Group();
  const smallSecArm = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.45, 0.02), goldPolished);
  smallSecArm.position.y = 0.20;
  smallSecGroup.add(smallSecArm);
  smallSecGroup.position.set(0, -0.66, 0.48);
  watchGroup.add(smallSecGroup);

  // Center Cap
  const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24), goldPolished);
  centerCap.rotation.x = Math.PI / 2;
  centerCap.position.z = 0.54;
  watchGroup.add(centerCap);

  // ─────────────────────────────────────────────
  // STUDIO LIGHTING
  // ─────────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x5599ff, 1.4);
  rimLight.position.set(-6, 3, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xffe6b0, 1.6, 20);
  fillLight.position.set(0, 0, 5);
  scene.add(fillLight);

  // ─────────────────────────────────────────────
  // INTERACTION LOGIC
  // ─────────────────────────────────────────────
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let mouseTiltX = 0;
  let mouseTiltY = 0;
  let targetRotX = baseRotX;
  let targetRotY = baseRotY;
  let is360Mode = false;
  let isChromaMode = false;
  let scrollProgress = 0;

  // Window resize handler
  function handleResize() {
    if (!mount) return;
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', handleResize, { passive: true });

  // Mouse & Touch Interaction
  mount.addEventListener('mousedown', e => {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
    if (hint) hint.classList.add('is-hidden');
  });

  window.addEventListener('mousemove', e => {
    if (isDragging) {
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      targetRotY += deltaX * 0.008;
      targetRotX += deltaY * 0.008;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    } else {
      // Subtle tilt parallax
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseTiltX = (e.clientY - cy) / cy * 0.15;
      mouseTiltY = (e.clientX - cx) / cx * 0.25;
    }
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Support
  mount.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
      if (hint) hint.classList.add('is-hidden');
    }
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      targetRotY += deltaX * 0.01;
      targetRotX += deltaY * 0.01;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });

  // 360° Orbit Mode Button
  if (btn360) {
    btn360.addEventListener('click', () => {
      is360Mode = !is360Mode;
      btn360.setAttribute('aria-pressed', is360Mode ? 'true' : 'false');
      if (hint) hint.classList.add('is-hidden');
    });
  }

  // Chromalight Night Mode Button
  if (btnChroma) {
    btnChroma.addEventListener('click', () => {
      isChromaMode = !isChromaMode;
      btnChroma.setAttribute('aria-pressed', isChromaMode ? 'true' : 'false');

      if (isChromaMode) {
        lumeMaterial.emissive.setHex(0x00e5ff);
        lumeMaterial.emissiveIntensity = 2.6;
        ambientLight.intensity = 0.2;
        keyLight.intensity = 0.6;
        fillLight.intensity = 0.4;
      } else {
        lumeMaterial.emissive.setHex(0x000000);
        lumeMaterial.emissiveIntensity = 0.0;
        ambientLight.intensity = 0.75;
        keyLight.intensity = 2.2;
        fillLight.intensity = 1.6;
      }
    });
  }

  // Reset View Button
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      targetRotX = baseRotX;
      targetRotY = baseRotY;
      is360Mode = false;
      if (btn360) btn360.setAttribute('aria-pressed', 'false');
    });
  }

  // Scroll Parallax Integration
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroH = mount.clientHeight || window.innerHeight;
    scrollProgress = clamp(scrollY / heroH, 0, 1.5);
  }, { passive: true });

  // ─────────────────────────────────────────────
  // RENDER ANIMATION LOOP
  // ─────────────────────────────────────────────
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // 1. Smooth Mechanical Watch Hand Sweeps
    // Sweep Seconds: 4Hz / 28,800 vph smooth mechanical sweep
    secondGroup.rotation.z = -(elapsed * (Math.PI * 2 / 60));
    // Small Seconds at 6 o'clock
    smallSecGroup.rotation.z = -(elapsed * (Math.PI * 2 / 60));
    // Minute Hand (10:10 presentation time)
    minuteGroup.rotation.z = -Math.PI * 0.35 + (elapsed * 0.0001);
    // Hour Hand (10:10 presentation time)
    hourGroup.rotation.z = -Math.PI * 0.85 + (elapsed * 0.00002);

    // 2. 360 Auto-orbit if toggled
    if (is360Mode) {
      targetRotY += delta * 0.6;
    }

    // 3. Interpolate rotation with lerp for silky response
    const currentBaseX = isDragging ? targetRotX : targetRotX + mouseTiltX;
    const currentBaseY = isDragging ? targetRotY : targetRotY + mouseTiltY;

    watchGroup.rotation.x = lerp(watchGroup.rotation.x, currentBaseX, 0.08);
    watchGroup.rotation.y = lerp(watchGroup.rotation.y, currentBaseY, 0.08);

    // 4. Scroll reaction: gently recede and rotate watch out as user scrolls
    if (scrollProgress > 0) {
      watchGroup.position.y = -scrollProgress * 1.8;
      watchGroup.position.z = -scrollProgress * 2.2;
      watchGroup.rotation.x = currentBaseX + scrollProgress * 0.4;
    } else {
      watchGroup.position.y = 0;
      watchGroup.position.z = 0;
    }

    renderer.render(scene, camera);
  }

  animate();
}


/* ═══════════════════════════════════════════════
   PARACHROM BALANCE WHEEL 4HZ SIMULATION
═══════════════════════════════════════════════ */
function initBalanceWheelSimulation() {
  const canvas = $('#balance-wheel-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  let animId = null;
  let isVisible = false;
  let startTime = performance.now();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (isVisible && !animId) {
        startTime = performance.now();
        draw();
      } else if (!isVisible && animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    });
  }, { threshold: 0.1 });

  observer.observe(canvas);

  function draw() {
    const elapsed = (performance.now() - startTime) / 1000;
    ctx.clearRect(0, 0, w, h);

    // Harmonic oscillation at 4 Hz (28,800 vibrations/hour)
    // Rolex balance amplitude is ~280° - 300° peak to peak
    const freq = 4.0; // 4 Hz
    const maxAngle = (280 * Math.PI) / 180;
    const angle = Math.sin(elapsed * freq * Math.PI * 2) * (maxAngle / 2);

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Traversing Balance Bridge Background (Fixed across plate)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-160, -25);
    ctx.bezierCurveTo(-90, -45, 90, -45, 160, -25);
    ctx.lineTo(165, 25);
    ctx.bezierCurveTo(90, 45, -90, 45, -165, 25);
    ctx.closePath();
    ctx.fillStyle = 'rgba(230, 230, 235, 0.12)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(212, 170, 90, 0.4)';
    ctx.stroke();

    // Bridge Perlage / Circular Graining
    for (let px = -130; px <= 130; px += 25) {
      ctx.beginPath();
      ctx.arc(px, 0, 14, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.stroke();
    }
    ctx.restore();

    // 2. Oscillating Balance Assembly (Wheel, Arms, Microstella Screws)
    ctx.save();
    ctx.rotate(angle);

    // Golden Balance Rim
    ctx.beginPath();
    ctx.arc(0, 0, 130, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#d4aa5a';
    ctx.stroke();

    // 4 Balance Wheel Cross Arms
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#c59d48';
    ctx.beginPath();
    ctx.moveTo(-130, 0);
    ctx.lineTo(130, 0);
    ctx.moveTo(0, -130);
    ctx.lineTo(0, 130);
    ctx.stroke();

    // 4 Microstella Regulating Screws (Rolex exclusive system)
    const screwDists = [128, 128, 128, 128];
    const screwAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    screwAngles.forEach((sa, i) => {
      const sx = Math.cos(sa) * screwDists[i];
      const sy = Math.sin(sa) * screwDists[i];
      ctx.save();
      ctx.translate(sx, sy);
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffe29a';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#614814';
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();

    // 3. Blue Parachrom Hairspring (Coiling and breathing)
    // Expansion/contraction breathing radius driven by oscillation angle
    const breath = 1 + Math.sin(elapsed * freq * Math.PI * 2) * 0.07;
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#00c3ff';
    ctx.shadowColor = '#00c3ff';
    ctx.shadowBlur = 8;

    const spiralTurns = 8;
    const maxR = 90 * breath;
    for (let t = 0; t < Math.PI * 2 * spiralTurns; t += 0.08) {
      const r = (t / (Math.PI * 2 * spiralTurns)) * maxR;
      const sx = Math.cos(t + angle * 0.4) * r;
      const sy = Math.sin(t + angle * 0.4) * r;
      if (t === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.restore();

    // 4. Center Ruby Pivot & Paraflex Shock Spring
    // Gold chaton
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#e8ba55';
    ctx.fill();

    // Synthetic Ruby Jewel (Corundum)
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    const rubyGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 11);
    rubyGrad.addColorStop(0, '#ff6688');
    rubyGrad.addColorStop(0.7, '#cc0033');
    rubyGrad.addColorStop(1, '#660011');
    ctx.fillStyle = rubyGrad;
    ctx.fill();

    // Paraflex shock spring clip
    ctx.beginPath();
    ctx.arc(0, 0, 8, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.restore();

    animId = requestAnimationFrame(draw);
  }
}


/* ═══════════════════════════════════════════════
   REGATTA COUNTDOWN SIMULATOR
═══════════════════════════════════════════════ */
function initRegattaSimulation() {
  const needle = $('#regatta-needle');
  const digits = $('#regatta-digits');
  const status = $('#regatta-status');
  const selectMin = $('#regatta-min-select');
  const btnStart = $('#btn-regatta-start');
  const btnSync = $('#btn-regatta-sync');
  const btnReset = $('#btn-regatta-reset');

  if (!needle || !digits || !btnStart) return;

  let totalSeconds = 600;
  let remainingSeconds = 600;
  let timerInterval = null;
  let isRunning = false;

  function updateDisplay() {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    digits.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Needle rotates across 300 degrees
    const pct = 1 - (remainingSeconds / totalSeconds);
    const rotDeg = -135 + pct * 270;
    needle.style.transform = `translate(-50%, -100%) rotate(${rotDeg}deg)`;
  }

  function setInitialTime(mins) {
    if (timerInterval) clearInterval(timerInterval);
    isRunning = false;
    totalSeconds = mins * 60;
    remainingSeconds = totalSeconds;
    btnStart.textContent = 'Start Countdown';
    status.textContent = 'STANDBY';
    status.style.color = 'var(--clr-gold-light)';
    updateDisplay();
  }

  if (selectMin) {
    selectMin.addEventListener('change', () => {
      setInitialTime(parseInt(selectMin.value, 10));
    });
  }

  btnStart.addEventListener('click', () => {
    if (!isRunning) {
      isRunning = true;
      btnStart.textContent = 'Pause Sequence';
      status.textContent = 'COUNTDOWN ACTIVE';
      status.style.color = '#00e5ff';

      timerInterval = setInterval(() => {
        if (remainingSeconds > 0) {
          remainingSeconds--;
          updateDisplay();
        } else {
          clearInterval(timerInterval);
          isRunning = false;
          btnStart.textContent = 'Sequence Finished';
          status.textContent = 'START GUN FIRED!';
          status.style.color = '#ff3344';
        }
      }, 100); // 10x accelerated preview for exhilarating interaction
    } else {
      isRunning = false;
      clearInterval(timerInterval);
      btnStart.textContent = 'Resume Countdown';
      status.textContent = 'PAUSED';
      status.style.color = 'var(--clr-gold-light)';
    }
  });

  // On-the-fly Flyback Synchronisation (Rolex Yacht-Master II hallmark feature)
  btnSync.addEventListener('click', () => {
    if (!isRunning) return;
    // Round to nearest minute as Yacht-Master II mechanical flyback does!
    const nearestMin = Math.round(remainingSeconds / 60);
    remainingSeconds = nearestMin * 60;
    status.textContent = 'FLYBACK SYNCED';
    status.style.color = '#ffe29a';
    updateDisplay();
  });

  btnReset.addEventListener('click', () => {
    setInitialTime(parseInt(selectMin ? selectMin.value : 10, 10));
  });

  setInitialTime(10);
}


/* ═══════════════════════════════════════════════
   ENQUIRE CONCIERGE MODAL (CONNECTED TO DJANGO BACKEND)
═══════════════════════════════════════════════ */
function initEnquireModal() {
  const dialog = $('#enquire-dialog');
  const form = $('#enquire-form');
  const closeBtn = $('#enquire-close');
  const backdrop = $('#enquire-backdrop');
  const successBox = $('#enquire-success');
  const successClose = $('#enquire-success-close');
  const confirmRef = $('#enquire-confirm-ref');
  const alertBox = $('#enquire-alert');
  const submitBtn = $('#btn-submit-enquire');
  const boutiqueSelect = $('#client-boutique');
  const purposeSelect = $('#client-type');

  if (!dialog) return;

  // Direct inbox for enquiry details (opens the visitor's mail app on submit)
  const ENQUIRY_INBOX = 'joyalsojen02@gmail.com';

  // Resolve API Base (direct port 8000 when frontend served from Node port 3000 or relative if unified)
  const API_BASE = (window.location.port === '3000') ? 'http://localhost:8000' : '';

  // Cache for locations map in case options need id mapping
  let locationDataLoaded = false;
  let purposeDataLoaded = false;

  // Dynamically load active Jeweller Locations from Django API
  function loadBoutiqueLocations() {
    fetch(`${API_BASE}/api/jeweller-locations/`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(locations => {
        if (Array.isArray(locations) && locations.length > 0 && boutiqueSelect) {
          boutiqueSelect.innerHTML = '<option value="" disabled selected>Select Authorised Retailer</option>' +
            locations.map(loc => `<option value="${loc.id}">${loc.city} — ${loc.name}</option>`).join('');
          locationDataLoaded = true;
        }
      })
      .catch(err => {
        console.warn('Rolex Concierge: Using fallback boutique list until backend is reachable', err);
      });
  }

  // Dynamically load active Consultation Purposes from Django API
  function loadConsultationPurposes() {
    fetch(`${API_BASE}/api/consultation-purposes/`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(purposes => {
        if (Array.isArray(purposes) && purposes.length > 0 && purposeSelect) {
          purposeSelect.innerHTML = purposes.map((p, idx) =>
            `<option value="${p.id}" ${idx === 0 ? 'selected' : ''}>${p.name}</option>`
          ).join('');
          purposeDataLoaded = true;
        }
      })
      .catch(err => {
        console.warn('Rolex Concierge: Using fallback purposes until backend is reachable', err);
      });
  }

  // Initial load
  loadBoutiqueLocations();
  loadConsultationPurposes();

  function openModal() {
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    document.body.style.overflow = 'hidden';
    if (form) form.hidden = false;
    if (successBox) successBox.hidden = true;
    clearErrors();

    // Reload dropdowns if not loaded yet
    if (!locationDataLoaded) loadBoutiqueLocations();
    if (!purposeDataLoaded) loadConsultationPurposes();
  }

  function closeModal() {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    document.body.style.overflow = '';
  }

  // Trigger buttons
  const triggers = [
    $('#nav-enquire-btn'),
    $('#mobile-enquire-btn'),
    $('#cta-enquire-btn'),
    $('#footer-enquire-btn'),
    $('#search-tag-enquire')
  ];

  triggers.forEach(btn => {
    if (btn) btn.addEventListener('click', openModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (successClose) successClose.addEventListener('click', closeModal);

  // Close on Escape
  dialog.addEventListener('cancel', () => {
    document.body.style.overflow = '';
  });

  function clearErrors() {
    if (alertBox) {
      alertBox.hidden = true;
      alertBox.textContent = '';
      alertBox.className = 'form-alert';
    }
    const errorGroups = form ? form.querySelectorAll('.form-group.has-error') : [];
    errorGroups.forEach(grp => grp.classList.remove('has-error'));
    const errorMsgs = form ? form.querySelectorAll('.field-error-msg') : [];
    errorMsgs.forEach(msg => msg.remove());
  }

  function setButtonLoading(isLoading) {
    if (!submitBtn) return;
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.dataset.origText = submitBtn.textContent;
      submitBtn.innerHTML = `
        <svg style="animation: spin 1s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
        </svg>
        Securing Appointment...
      `;
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.origText || 'Request Private Appointment';
    }
  }

  function selectedLabel(selectEl) {
    if (!selectEl || selectEl.selectedIndex < 0) return '';
    return selectEl.options[selectEl.selectedIndex]?.text?.trim() || '';
  }

  function openEnquiryEmail(details) {
    const subject = `Yacht-Master II Enquiry — ${details.name || 'New client'}`;
    const body = [
      'ROLEX CONCIERGE — PRIVATE BOUTIQUE CONSULTATION',
      '',
      'Watch: Yacht-Master II (Ref. 126688, 18 ct Yellow Gold)',
      '',
      `Full Name: ${details.name}`,
      `Email: ${details.email}`,
      `Phone / WhatsApp: ${details.phone}`,
      `Official Jeweller: ${details.boutique}`,
      `Consultation Purpose: ${details.purpose}`,
      `Preferred Date: ${details.date || 'Flexible / Not specified'}`,
      '',
      'Special Requests / Notes:',
      details.notes || 'None provided.'
    ].join('\n');

    const mailto = `mailto:${encodeURIComponent(ENQUIRY_INBOX)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const mailLink = document.createElement('a');
    mailLink.href = mailto;
    mailLink.style.display = 'none';
    document.body.appendChild(mailLink);
    mailLink.click();
    mailLink.remove();
  }

  // Handle submit via REST API, then open a direct email with the enquiry details
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      clearErrors();

      // Extract form fields
      const nameVal = $('#client-name')?.value?.trim() || '';
      const emailVal = $('#client-email')?.value?.trim() || '';
      const phoneVal = $('#client-phone')?.value?.trim() || '';
      const boutiqueVal = boutiqueSelect?.value || '';
      const purposeVal = purposeSelect?.value || '';
      const dateVal = $('#client-date')?.value || null;
      const notesVal = $('#client-notes')?.value?.trim() || '';
      const enquiryEmailDetails = {
        name: nameVal,
        email: emailVal,
        phone: phoneVal,
        boutique: selectedLabel(boutiqueSelect) || boutiqueVal,
        purpose: selectedLabel(purposeSelect) || purposeVal,
        date: dateVal,
        notes: notesVal
      };

      const payload = {
        full_name: nameVal,
        email: emailVal,
        phone_whatsapp: phoneVal,
        jeweller_location: boutiqueVal,
        consultation_purpose: purposeVal,
        preferred_date: dateVal,
        special_requests: notesVal
      };

      setButtonLoading(true);

      try {
        const response = await fetch("/api/submit-consultation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data || data.success === false) {
          setButtonLoading(false);
          const errors = data && data.errors ? data.errors : { general: [data?.message || 'Submission failed'] };

          if (alertBox) {
            alertBox.hidden = false;
            alertBox.className = 'form-alert form-alert--error';
            if (data && data.detail) {
              alertBox.textContent = data.detail;
            } else {
              alertBox.textContent = 'Please review and correct the marked consultation details below.';
            }
          }

          // Map field error messages
          const fieldMap = {
            'full_name': '#client-name',
            'email': '#client-email',
            'phone_whatsapp': '#client-phone',
            'jeweller_location': '#client-boutique',
            'consultation_purpose': '#client-type',
            'preferred_date': '#client-date',
            'special_requests': '#client-notes'
          };

          for (const [key, msgList] of Object.entries(errors)) {
            const selector = fieldMap[key];
            if (selector) {
              const inputEl = form.querySelector(selector);
              if (inputEl) {
                const group = inputEl.closest('.form-group');
                if (group) {
                  group.classList.add('has-error');
                  const errorMsg = document.createElement('span');
                  errorMsg.className = 'field-error-msg';
                  errorMsg.textContent = Array.isArray(msgList) ? msgList.join(' ') : String(msgList);
                  group.appendChild(errorMsg);
                }
              }
            }
          }
          return;
        }

        // Success state — also open a direct email to the concierge inbox
        setButtonLoading(false);
        const enquiryId = data.enquiry_id || Math.floor(1000 + Math.random() * 9000);
        if (confirmRef) {
          confirmRef.textContent = `RLX-126688-${String(enquiryId).padStart(4, '0')}`;
        }
        form.hidden = true;
        if (successBox) successBox.hidden = false;
        openEnquiryEmail(enquiryEmailDetails);
        form.reset();

      } catch (networkErr) {
        setButtonLoading(false);
        console.error('Rolex Concierge Submission Error:', networkErr);
        openEnquiryEmail(enquiryEmailDetails);
        if (alertBox) {
          alertBox.hidden = false;
          alertBox.className = 'form-alert form-alert--error';
          alertBox.textContent = 'Server unreachable. Your enquiry has been opened in your email app so it can be sent directly.';
        }
      }
    });
  }
}


/* ═══════════════════════════════════════════════
   SEARCH OVERLAY & QUICK DISCOVERY
═══════════════════════════════════════════════ */
function initSearchDialog() {
  const dialog = $('#search-dialog');
  const openBtn = $('#nav-search-btn');
  const closeBtn = $('#search-close');
  const backdrop = $('#search-backdrop');
  const searchInput = $('#search-input');
  const searchTags = $$('.search-tag');

  if (!dialog) return;

  function openSearch() {
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 100);
    }
  }

  function closeSearch() {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    if (searchInput) searchInput.value = '';
    searchTags.forEach(tag => tag.style.display = '');
  }

  if (openBtn) openBtn.addEventListener('click', openSearch);
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);
  if (backdrop) backdrop.addEventListener('click', closeSearch);

  // Keyboard shortcut: '/' opens search
  window.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openSearch();
    }
  });

  // Instant filter
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      searchTags.forEach(tag => {
        const text = tag.textContent.toLowerCase();
        if (!q || text.includes(q)) {
          tag.style.display = '';
        } else {
          tag.style.display = 'none';
        }
      });
    });
  }

  // Close search when tag clicked
  searchTags.forEach(tag => {
    tag.addEventListener('click', () => {
      closeSearch();
    });
  });
}


/* ═══════════════════════════════════════════════
   INIT — DOMContentLoaded
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMobileMenu();
  initScrollReveal();
  initSmoothScroll();
  initGallery();
  initParallax();
  initIntroParallax();
  initSpecReveal();
  initGoldTexture();
  initScrollProgress();
  initButtonMagnet();
  initDialAnnotations();
  initPrefetch();

  // ★ Scroll-driven hero frame sequence
  initHeroSequence();

  // Other interactive components
  initBalanceWheelSimulation();
  initRegattaSimulation();
  initEnquireModal();
  initSearchDialog();

  console.info(
    '%c[Rolex Yacht-Master II] Scroll-driven hero sequence active. 151 frames · 5 feature panels.',
    'color: #d4aa5a; font-weight: bold; font-size: 12px;'
  );
});

