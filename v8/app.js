// Melta, вариант 8: плавная прокрутка (Lenis) + анимации (GSAP, ScrollTrigger).
// Без библиотек или при «уменьшить движение» страница остаётся статичной и полностью рабочей.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  // ---------- мобильное меню ----------
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });

  // ---------- кнопки «Запросить прайс» выбирают направление в форме ----------
  document.querySelectorAll('[data-direction]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const radio = document.querySelector(`input[name="direction"][value="${btn.dataset.direction}"]`);
      if (radio) radio.checked = true;
    });
  });

  // ---------- форма: открывает почту с готовым письмом ----------
  const form = document.getElementById('lead-form');
  const msg = form.querySelector('.form__msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const name = (d.get('name') || '').trim();
    const phone = (d.get('phone') || '').trim();
    if (!name || !phone) { msg.textContent = 'Укажите имя и телефон.'; msg.className = 'form__msg is-error'; return; }
    if (!d.get('agree')) { msg.textContent = 'Нужно согласие на обработку персональных данных.'; msg.className = 'form__msg is-error'; return; }
    const body = [
      `Направление: ${d.get('direction')}`,
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `E-mail: ${d.get('email') || '—'}`,
      `Задача: ${d.get('message') || '—'}`,
    ].join('\n');
    window.location.href = 'mailto:sales@agnex.by?subject=' + encodeURIComponent(`Заявка с сайта: ${d.get('direction')}`) + '&body=' + encodeURIComponent(body);
    msg.textContent = 'Открываем почтовую программу с готовым письмом…';
    msg.className = 'form__msg is-ok';
  });

  if (reduce || !hasGsap) return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // ---------- плавная прокрутка ----------
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        lenis.scrollTo(target, { duration: 1.4 });
      });
    });
  }

  // ---------- разбивка заголовков на буквы ----------
  function split(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/( )/).forEach((part) => {
            if (part === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            if (!part) return;
            const word = document.createElement('span');
            word.className = 'word';
            [...part].forEach((ch) => {
              const mask = document.createElement('span');
              mask.className = 'char-mask';
              const c = document.createElement('span');
              c.className = 'char';
              c.textContent = ch;
              mask.appendChild(c);
              word.appendChild(mask);
            });
            frag.appendChild(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    el.querySelectorAll('.word').forEach((w) => w.setAttribute('aria-hidden', 'true'));
    return el.querySelectorAll('.char');
  }

  document.querySelectorAll('[data-split]').forEach((el) => {
    const chars = split(el);
    const isHero = el.classList.contains('hero__title');
    gsap.from(chars, {
      yPercent: 115,
      rotate: 6,
      duration: isHero ? 1.1 : 0.9,
      ease: 'power4.out',
      stagger: isHero ? 0.018 : 0.012,
      delay: isHero ? 0.2 : 0,
      scrollTrigger: isHero ? null : { trigger: el, start: 'top 85%' },
    });
  });

  // ---------- появление блоков: коротко и мягко ----------
  gsap.set('[data-reveal]', { y: 18, autoAlpha: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 92%',
    onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out', stagger: 0.05, overwrite: true }),
  });

  // ---------- первый экран ----------
  gsap.from('[data-hero-in], .hero__bottom', { y: 40, autoAlpha: 0, duration: 1.2, ease: 'power3.out', stagger: 0.1, delay: 0.9 });
  gsap.from('.orb', { scale: 0.4, autoAlpha: 0, duration: 2, ease: 'power3.out', stagger: 0.15 });
  gsap.from('.fl', { y: 120, autoAlpha: 0, rotate: 0, duration: 1.6, ease: 'power3.out', stagger: 0.12, delay: 0.4 });
  document.querySelectorAll('.fl').forEach((el) => {
    gsap.to(el, { yPercent: parseFloat(el.dataset.speed) * 160, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(el, { y: '+=14', duration: 2.4 + Math.random(), ease: 'sine.inOut', yoyo: true, repeat: -1 });
  });
  // панель наезжает — первый экран уходит в глубину
  gsap.to('.hero__inner, .hero__float', { scale: 0.92, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '.panel', start: 'top bottom', end: 'top top', scrub: true } });

  if (finePointer) {
    const orbs = gsap.utils.toArray('.orb').map((o, i) => ({
      x: gsap.quickTo(o, 'x', { duration: 1.6 + i * 0.4, ease: 'power3' }),
      y: gsap.quickTo(o, 'y', { duration: 1.6 + i * 0.4, ease: 'power3' }),
      k: (i + 1) * 0.04,
    }));
    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX - window.innerWidth / 2;
      const dy = e.clientY - window.innerHeight / 2;
      orbs.forEach((o) => { o.x(dx * o.k * 3); o.y(dy * o.k * 3); });
    });
  }

  // ---------- бегущая строка, зависит от скорости прокрутки ----------
  const track = document.querySelector('.marquee__track');
  if (track) {
    track.innerHTML += track.innerHTML;
    const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    let dir = 1;
    if (lenis) {
      lenis.on('scroll', ({ velocity, direction }) => {
        if (direction) dir = direction;
        gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(velocity) / 4, 6)), duration: 0.3, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.3, overwrite: false });
      });
    }
  }

  // ---------- десктоп: горизонтальная прокрутка этапов ----------
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    // этапы контрактного производства — горизонтальная прокрутка с закреплением
    const steps = document.querySelector('.steps__track');
    const distance = () => steps.scrollWidth - document.querySelector('.steps').clientWidth;
    gsap.to(steps, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: { trigger: '.contract__pin', start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 1, invalidateOnRefresh: true },
    });
  });

  // ---------- параллакс картинок в блоках ----------
  document.querySelectorAll('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---------- счётчики ----------
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = parseInt(el.dataset.count, 10);
    const obj = { v: end > 100 ? end - 60 : 0 };
    gsap.to(obj, {
      v: end, duration: 1.8, ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(obj.v); },
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  // ---------- магнитные кнопки и свой курсор ----------
  if (finePointer) {
    document.querySelectorAll('[data-magnet]').forEach((el) => {
      const qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.35);
        qy((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('mouseleave', () => { qx(0); qy(0); });
    });

    document.documentElement.classList.add('has-cursor');
    const cursor = document.querySelector('.cursor');
    const dot = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.1 });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.querySelectorAll('a, button, label, .dir').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
