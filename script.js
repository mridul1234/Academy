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

  // -------------------------------------------------------
  // 🔔 TELEGRAM NOTIFICATION CONFIG
  //    1. Talk to @BotFather on Telegram → /newbot → copy the token below
  //    2. Send any message to your bot, then open:
  //       https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
  //       Copy the "id" value from "chat" → paste as TELEGRAM_CHAT_ID
  // -------------------------------------------------------
  const TELEGRAM_BOT_TOKEN = '8593407632:AAG2GPLGw2nALnP_lNSdBp-lI34BBSck4XU';
  const TELEGRAM_CHAT_ID   = '8147525276';

  function sendTelegramNotification(parentName, childName, email, phone, childAge, source) {
    if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') return; // not configured yet

    const message =
      `🎓 *New Demo Booking — ChessGum!*\n\n` +
      `👨‍👩‍👦 *Parent:* ${parentName}\n` +
      `👦 *Child:* ${childName} (Age ${childAge})\n` +
      `📧 *Email:* ${email}\n` +
      `📱 *Phone:* ${phone}\n` +
      `📣 *Source:* ${source}`;

    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    }).catch(err => console.warn('Telegram notification failed:', err));
  }

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

      // Collect form data
      const parentName = document.getElementById('parentName').value.trim();
      const childName = document.getElementById('childName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const childAge = document.getElementById('childAge').value.trim();
      const sourceEl = document.getElementById('source');
      const source = sourceEl ? sourceEl.value : 'Not specified';

      // Show loading state
      const btn = form.querySelector('.form-submit');
      const originalBtnText = btn.textContent;
      btn.textContent = 'Sending details...';
      btn.disabled = true;

      // Track form submission attempt in GA
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          event_category: 'Form',
          event_label: 'Free Trial Booking',
          value: 1
        });
      }

      // Send data to FormSubmit
      const formData = new FormData(form);
      // Adding some metadata for FormSubmit
      formData.append('_subject', '🎓 New Demo Booking from ' + parentName);
      formData.append('_captcha', 'false');

      fetch('https://formsubmit.co/ajax/hello.chessgum@gmail.com', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        // 🔔 Fire Telegram notification (non-blocking)
        sendTelegramNotification(parentName, childName, email, phone, childAge, source);

        // Show success message
        form.style.display = 'none';
        successMsg.style.display = 'block';
      })
      .catch(error => {
        console.error('Error submitting form:', error);
        btn.textContent = 'Error! Try Again';
        btn.disabled = false;
        setTimeout(() => {
          btn.textContent = originalBtnText;
        }, 3000);
      });
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

        // Track tab switch in GA
        if (typeof gtag === 'function') {
          gtag('event', 'select_item', {
            event_category: 'Pricing',
            event_label: targetId + ' Plan'
          });
        }
      }
    });
  });

  /* ---- GA Tracking for Buttons ---- */
  document.querySelectorAll('.btn-enroll, .btn-demo, #navEnrollBtn, #heroEnrollBtn, #heroCoursesBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (typeof gtag === 'function') {
        let actionName = 'click_button';
        let labelName = e.target.textContent.trim() || 'Button Click';
        
        if (e.target.classList.contains('btn-enroll')) actionName = 'begin_checkout';
        else if (e.target.classList.contains('btn-demo') || e.target.id === 'navEnrollBtn' || e.target.id === 'heroEnrollBtn') actionName = 'request_demo';
        
        // Try to get plan name if it's a pricing card button
        const planCard = e.target.closest('.new-pricing-card');
        const planName = planCard ? planCard.querySelector('.card-header-icon').textContent.trim() : 'General';
        
        gtag('event', actionName, {
          event_category: 'Engagement',
          event_label: labelName,
          plan_type: planName
        });
      }
    });
  });

});
