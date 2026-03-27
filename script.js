/* =============================================
   CHESS KIDS ACADEMY — SCRIPT
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Navbar scroll effect ---- */
  const navbar = document.getElementById('navbar');
  const scrollTopBtn = document.getElementById('scrollTop');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
      scrollTopBtn.classList.add('show');
    } else {
      navbar.classList.remove('scrolled');
      scrollTopBtn.classList.remove('show');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---- Mobile Nav ---- */
  const burger = document.getElementById('burger');
  const mobileNav = document.getElementById('mobileNav');

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile nav when a link is clicked
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
      });
    });
  }

  /* ---- Scroll Reveal ---- */
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, entry.target.dataset.delay || 0);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(el => observer.observe(el));

  /* ---- Counter Animation ---- */
  function animateCounter(el, target, suffix = '') {
    let current = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current + suffix;
    }, 30);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        animateCounter(el, target, suffix);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

  /* ---- FAQ Accordion ---- */
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      // Open clicked if it was closed
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---- Enrollment Form ---- */
  const form = document.getElementById('enrollForm');
  const formWrap = document.getElementById('enrollFormWrap');
  const successMsg = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Validate
      let valid = true;
      form.querySelectorAll('[required]').forEach(input => {
        if (!input.value.trim()) {
          input.style.borderColor = '#EF4444';
          valid = false;
          input.addEventListener('input', () => { input.style.borderColor = ''; }, { once: true });
        }
      });

      if (!valid) return;

      // Simulate submission
      const btn = form.querySelector('.form-submit');
      btn.textContent = 'Submitting...';
      btn.disabled = true;

      setTimeout(() => {
        form.style.display = 'none';
        successMsg.style.display = 'block';
      }, 1200);
    });
  }

  /* ---- Active Nav Link on Scroll ---- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) {
        current = sec.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  });

  /* ---- Smooth nav link highlight ---- */
  const style = document.createElement('style');
  style.textContent = `.nav-links a.active { color: var(--purple); } .nav-links a.active::after { width: 100%; }`;
  document.head.appendChild(style);

  /* ---- Pricing Tab Switcher ---- */
  const pricingTabs = document.querySelectorAll('.pricing-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  pricingTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs
      pricingTabs.forEach(t => t.classList.remove('active'));
      // Add active to current tab
      tab.classList.add('active');

      // Hide all contents
      tabContents.forEach(content => content.classList.remove('active'));
      // Show Target content
      const targetId = tab.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

});
