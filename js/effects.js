import { dom, getNavLinks } from './dom.js';
import { setLenis } from './state.js';

function setupNavbarTracking() {
  if (!dom.navbar) return;

  const sections = ['inicio', 'productos', 'nosotros', 'contacto'];
  let scrollTicking = false;

  window.addEventListener('scroll', () => {
    if (scrollTicking) return;

    scrollTicking = true;

    requestAnimationFrame(() => {
      dom.navbar.classList.toggle('scrolled', window.scrollY > 50);

      let currentSection = 'inicio';
      sections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section && window.scrollY >= section.offsetTop - 120) {
          currentSection = sectionId;
        }
      });

      getNavLinks().forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentSection}`);
      });

      scrollTicking = false;
    });
  }, { passive: true });
}

function setupRevealObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.category-pill, .contact-card, .mosaic-cell, .about-checks li, .stat-pill, .section-head, .about-grid > div').forEach((element) => {
    observer.observe(element);
  });
}

function initDraggableDeco() {
  const elements = document.querySelectorAll('.deco-el');
  if (!elements.length) return;

  let activeElement = null;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;

  function startDrag(event, element) {
    activeElement = element;
    activeElement.classList.add('is-dragging');

    const rect = activeElement.getBoundingClientRect();
    const parentRect = activeElement.offsetParent.getBoundingClientRect();
    initialLeft = rect.left - parentRect.left;
    initialTop = rect.top - parentRect.top;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    startX = clientX;
    startY = clientY;

    activeElement.style.left = `${initialLeft}px`;
    activeElement.style.top = `${initialTop}px`;
    activeElement.style.right = 'auto';
    activeElement.style.bottom = 'auto';

    if (event.type === 'touchstart') {
      event.preventDefault();
    }
  }

  function drag(event) {
    if (!activeElement) return;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    activeElement.style.left = `${initialLeft + clientX - startX}px`;
    activeElement.style.top = `${initialTop + clientY - startY}px`;

    if (event.type === 'touchmove') {
      event.preventDefault();
    }
  }

  function endDrag() {
    if (!activeElement) return;

    activeElement.classList.remove('is-dragging');
    activeElement = null;
  }

  elements.forEach((element) => {
    element.addEventListener('mousedown', (event) => startDrag(event, element));
    element.addEventListener('touchstart', (event) => startDrag(event, element), { passive: false });
  });

  window.addEventListener('mousemove', drag);
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchmove', drag, { passive: false });
  window.addEventListener('touchend', endDrag);
}

function initLeaves() {
  if (!dom.leafContainer) return;

  const emojis = ['🍂', '🍁', '🍃', '🌿'];

  for (let index = 0; index < 15; index += 1) {
    const leaf = document.createElement('span');
    leaf.className = 'leaf';
    leaf.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    leaf.style.left = `${Math.random() * 100}%`;
    leaf.style.animationDelay = `${Math.random() * 12}s`;
    leaf.style.animationDuration = `${8 + Math.random() * 8}s`;
    leaf.style.fontSize = `${1 + Math.random() * 1.5}rem`;
    dom.leafContainer.appendChild(leaf);
  }
}

function initSmoothScroll() {
  if (typeof window.Lenis !== 'function') {
    setLenis(null);
    console.warn('[makena] Lenis no está disponible; seguimos sin smooth scroll.');
    return;
  }

  const lenis = new window.Lenis({
    duration: 1.2,
    easing: (value) => Math.min(1, 1.001 - Math.pow(2, -10 * value)),
    smoothWheel: true,
  });

  setLenis(lenis);

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

function setupBackTop() {
  if (!dom.backTop) return;

  window.addEventListener('scroll', () => {
    dom.backTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  dom.backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function setupHamburger() {
  if (!dom.hamburger || !dom.navLinks) return;

  dom.hamburger.addEventListener('click', () => {
    const open = dom.navLinks.classList.toggle('open');
    dom.hamburger.classList.toggle('open', open);
  });

  getNavLinks().forEach((link) => {
    link.addEventListener('click', () => {
      dom.navLinks.classList.remove('open');
      dom.hamburger.classList.remove('open');
    });
  });
}

function setupAnnounceBar() {
  if (!dom.announceBar || !dom.announceClose) return;

  dom.announceClose.addEventListener('click', () => {
    dom.announceBar.classList.add('hidden');
  });
}

function setupScrollProgress() {
  if (!dom.scrollProgress) return;

  window.addEventListener('scroll', () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = height > 0 ? (window.scrollY / height) * 100 : 0;
    dom.scrollProgress.style.width = `${Math.min(percentage, 100)}%`;
  }, { passive: true });
}

export function initializeEffects() {
  if (dom.currentYear) {
    dom.currentYear.textContent = new Date().getFullYear();
  }

  setupNavbarTracking();
  setupRevealObserver();
  setupBackTop();
  setupHamburger();
  setupAnnounceBar();
  setupScrollProgress();
  initSmoothScroll();
  initDraggableDeco();
  initLeaves();
}
