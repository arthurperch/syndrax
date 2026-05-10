// Navbar scroll effect
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// Hamburger / mobile menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
    }
  });
}

// Fade-up on scroll
const fadeEls = document.querySelectorAll('.fade-up');
if (fadeEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  fadeEls.forEach(el => observer.observe(el));
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
