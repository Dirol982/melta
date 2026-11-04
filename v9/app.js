// Melta · вариант 9: интерактив и переходы между блоками.
// Прокрутка обычная (без «плавного» перехвата). При «уменьшить движение» или без GSAP всё показывается сразу.
(() => {
  const data = window.MELTA_CATALOG || { cats: {}, items: [] };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const { gsap, ScrollTrigger } = window;
  const hasGsap = !!(gsap && ScrollTrigger) && !reduce;
  if (!hasGsap) document.documentElement.classList.remove('js');

  const TONES = { kosmetika: '#FCE8D6', volosy: '#F5EFE6', detskaya: '#E2EFFA', 'bytovaya-himiya': '#ECE6FB', zhivotnye: '#FBEBDD',
    mylo: '#E6F4EF', 'mylo-ruchnoe': '#E4F2EA', aromaty: '#FBEBD7', lubrikanty: '#FBE4EC' };
  const DIRECTION = { 'bytovaya-himiya': 'Бытовая химия', zhivotnye: 'Косметика для животных', 'mylo-ruchnoe': 'Мыло ручной работы' };
  const bySlug = Object.fromEntries(data.items.map((i) => [i.slug, i]));
  const label = (i) => `${i.brand} — ${i.title}${i.volume ? `, ${i.volume}` : ''}`;

  const card = (i) => `
    <button class="hit" type="button" data-slug="${i.slug}" style="--tone:${TONES[i.cat] || '#F3EEE6'}" aria-label="Быстрый просмотр: ${esc(label(i))}">
      <span class="hit__stage"><img src="${i.img}" alt="" loading="lazy"><span class="hit__plus" aria-hidden="true"><svg class="i"><use href="#i-plus"/></svg></span></span>
      <span class="hit__brand">${esc(i.brand)}</span>
      <span class="hit__title">${esc(i.title)}</span>
      ${i.volume ? `<span class="hit__vol">${esc(i.volume)}</span>` : ''}
    </button>`;

  /* ---------- хиты ---------- */
  const HITS = ['melta-keratin-shampoo-1000ml', 'biolut-oxygen-1kg', 'zayushka-shower-gel', 'melta-pets-shampoo-dogs', 'biolut-dish-gel-raspberry-mint-5l',
    'melta-sun-cream-spf50', 'melta-bath-foam-raspberry-500', 'sliki-h2o-sweet-strawberry-250ml', 'melta-handmade-soap-lavender',
    'melta-laundry-gel-universal-6l', 'melta-hand-cream-100', 'melta-air-freshener-red-amber-7ml'];
  const track = $('.hscroll__track');
  if (track) track.innerHTML = HITS.map((s) => bySlug[s]).filter(Boolean).map(card).join('');

  /* ---------- счётчики в категориях ---------- */
  $$('[data-cat-count]').forEach((el) => {
    const cats = el.dataset.catCount.split(',');
    el.textContent = data.items.filter((i) => cats.includes(i.cat)).length;
  });

  /* ---------- каталог ---------- */
  const grid = $('.grid');
  const chipsBox = $('.chips');
  const search = $('.search input');
  const more = $('.catalog__more');
  const PAGE = 8;
  let filter = 'all', query = '', shown = PAGE;
  const count = (c) => data.items.filter((i) => c === 'all' || i.cat === c).length;
  chipsBox.innerHTML = [['all', 'Все'], ...Object.entries(data.cats)]
    .map(([k, v]) => `<button class="chip-btn" type="button" data-filter="${k}" aria-pressed="${k === 'all'}">${esc(v)} <small>${count(k)}</small></button>`).join('');

  function renderGrid() {
    const q = query.trim().toLowerCase();
    const list = data.items.filter((i) => (filter === 'all' || i.cat === filter) && (!q || `${i.brand} ${i.title} ${i.volume}`.toLowerCase().includes(q)));
    grid.innerHTML = list.slice(0, shown).map(card).join('') || '<p class="catalog__empty">Ничего не нашлось — попробуйте другое слово.</p>';
    more.hidden = list.length <= shown;
    const n = list.length, m10 = n % 10, m100 = n % 100;
    $('.catalog__count').textContent = `${n} ${m10 === 1 && m100 !== 11 ? 'товар' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'товара' : 'товаров'}`;
    if (hasGsap) gsap.from(grid.children, { y: 24, opacity: 0, duration: .5, stagger: .04, ease: 'power3.out' });
  }
  // переход между состояниями сетки — View Transitions API, где он есть
  const swap = (fn) => (document.startViewTransition && !reduce ? document.startViewTransition(fn) : fn());
  function setFilter(c) {
    filter = c; shown = PAGE;
    $$('.chip-btn', chipsBox).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === c)));
    swap(renderGrid);
  }
  chipsBox.addEventListener('click', (e) => { const b = e.target.closest('.chip-btn'); if (b) setFilter(b.dataset.filter); });
  let t;
  search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { query = search.value; shown = PAGE; renderGrid(); }, 160); });
  more.addEventListener('click', () => { shown += PAGE; renderGrid(); });
  renderGrid();

  /* ---------- строки категорий: фильтр + превью за курсором ---------- */
  const preview = $('.cursor-preview');
  const pImg = preview && $('img', preview);
  $$('.ccard').forEach((c) => c.addEventListener('click', () => setFilter(c.dataset.filter)));
  $$('.cat-row').forEach((row) => {
    row.addEventListener('click', () => setFilter(row.dataset.filter));
    if (!fine || !preview) return;
    row.addEventListener('mouseenter', () => {
      pImg.src = row.dataset.img;
      preview.style.setProperty('--tint', row.dataset.tint || '#F3EEE6');
      preview.classList.toggle('is-cut', !!row.dataset.tint);
      preview.classList.add('is-on');
    });
    row.addEventListener('mouseleave', () => preview.classList.remove('is-on'));
  });

  /* ---------- быстрый просмотр ---------- */
  const qv = $('.qv');
  function openQuick(slug) {
    const i = bySlug[slug];
    if (!i) return;
    $('.qv__media', qv).style.setProperty('--tone', TONES[i.cat] || '#F3EEE6');
    const img = $('.qv__media img', qv); img.src = i.img; img.alt = label(i);
    $('.qv__cat', qv).textContent = data.cats[i.cat];
    $('.qv__brand', qv).textContent = i.brand;
    $('.qv__title', qv).textContent = i.title;
    $('.qv__vol', qv).innerHTML = i.volume ? `<span>${esc(i.volume)}</span>` : '';
    $('.qv__more', qv).href = `../v7/product.html?p=${encodeURIComponent(i.slug)}`;
    const btn = $('[data-popup="price"]', qv);
    btn.dataset.product = label(i);
    btn.dataset.direction = DIRECTION[i.cat] || 'Косметика';
    showDialog(qv);
  }
  document.addEventListener('click', (e) => {
    const h = e.target.closest('.hit');
    if (h) openQuick(h.dataset.slug);
  });

  /* ---------- диалоги ---------- */
  function showDialog(d) {
    $$('dialog[open]').forEach((o) => o !== d && o.close());
    d.showModal();
    document.documentElement.classList.add('has-dialog');
  }
  $$('dialog').forEach((d) => {
    d.addEventListener('close', () => { if (!$('dialog[open]')) document.documentElement.classList.remove('has-dialog'); });
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    $('.qv__close', d).addEventListener('click', () => d.close());
  });

  /* ---------- форма заявки ---------- */
  const req = $('.req');
  const form = $('.req__form');
  const msg = $('.req__msg');
  let product = '';
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-popup="price"]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.direction) form.goal.value = a.dataset.direction;
    product = a.dataset.product || '';
    const p = $('.req__product'); p.hidden = !product; p.textContent = product ? `Товар: ${product}` : '';
    msg.textContent = ''; msg.className = 'req__msg full';
    closeMenu();
    showDialog(req);
    form.name.focus();
  });
  // сайт статический: открываем почтовую программу с готовым письмом в отдел продаж
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const name = (f.get('name') || '').trim(), phone = (f.get('phone') || '').trim();
    const fail = (t) => { msg.textContent = t; msg.className = 'req__msg full is-error'; };
    if (!name || !phone) return fail('Укажите имя и телефон.');
    if (!f.get('agree')) return fail('Нужно согласие на обработку персональных данных.');
    const body = [`Имя: ${name}`, `Телефон: ${phone}`, `E-mail: ${f.get('email') || '—'}`, `Направление: ${f.get('goal')}`,
      product && `Товар: ${product}`, f.get('comment') && `Комментарий: ${f.get('comment')}`].filter(Boolean).join('\n');
    location.href = `mailto:sales@agnex.by?subject=${encodeURIComponent('Запрос прайса с сайта melta.by')}&body=${encodeURIComponent(body)}`;
    msg.textContent = 'Открываем почтовую программу с готовым письмом…'; msg.className = 'req__msg full is-ok';
  });

  /* ---------- меню на телефоне ---------- */
  const burger = $('.hdr__burger');
  const menu = $('#menu');
  function closeMenu() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false');
    setTimeout(() => { menu.hidden = true; }, 500);
  }
  burger.addEventListener('click', () => {
    if (menu.classList.contains('is-open')) return closeMenu();
    menu.hidden = false;
    requestAnimationFrame(() => { menu.classList.add('is-open'); burger.setAttribute('aria-expanded', 'true'); });
  });
  $$('a', menu).forEach((a) => a.addEventListener('click', closeMenu));

  /* ---------- шапка прячется при прокрутке вниз ---------- */
  const hdr = $('.hdr');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 40);
    hdr.classList.toggle('is-hidden', y > 300 && y > lastY && !menu.classList.contains('is-open'));
    lastY = y;
  }, { passive: true });

  if (!hasGsap) return;

  /* ===================== анимации ===================== */
  gsap.registerPlugin(ScrollTrigger);

  // заголовки: слова выезжают из-под маски
  function splitWords(el) {
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/( )/).forEach((w) => {
          if (w === ' ' || !w) { frag.append(w); return; }
          const o = document.createElement('span'); o.className = 'w';
          const s = document.createElement('span'); s.textContent = w;
          o.append(s); frag.append(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitWords(n);
    });
  }
  const st = document.createElement('style');
  st.textContent = '.w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em;margin-bottom:-.08em}.w>span{display:inline-block}';
  document.head.append(st);
  $$('.split').forEach((h) => {
    splitWords(h);
    gsap.from($$('.w > span', h), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: .06,
      scrollTrigger: { trigger: h, start: 'top 85%' } });
  });

  // первый экран: строки заголовка, текст, раскрытие фото во всю ширину
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro.fromTo('.hero__title .line > span', { yPercent: 105, y: 0 }, { yPercent: 0, y: 0, duration: 1.3, stagger: .12 })
    .fromTo('.reveal-up', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, stagger: .1 }, '-=1')
    .from('.hero__img', { scale: 1.15, opacity: 0, duration: 1.6, ease: 'power2.out' }, 0);

  // баннер: фото медленно приближается и уходит вверх при прокрутке, текст — быстрее (параллакс)
  gsap.to('.hero__img', { scale: 1.08, yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -18, opacity: .2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  if (fine) {
    const banner = $('.hero__banner');
    banner.addEventListener('mousemove', (e) => {
      const r = banner.getBoundingClientRect();
      gsap.to('.hero__img', { x: ((e.clientX - r.left) / r.width - .5) * -18, y: ((e.clientY - r.top) / r.height - .5) * -12, duration: 1.2, ease: 'power3.out' });
    });
  }

  // фон страницы плавно меняет оттенок от блока к блоку
  $$('[data-bg]').forEach((sec) => ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) document.body.style.backgroundColor = sec.dataset.bg; },
  }));

  // бегущая строка ускоряется от скорости прокрутки
  const tickerTrack = $('.ticker__track');
  tickerTrack.style.animation = 'none';
  const tick = gsap.to(tickerTrack, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
  ScrollTrigger.create({ onUpdate: (self) => {
    const v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
    gsap.to(tick, { timeScale: (self.direction < 0 ? -1 : 1) * (1 + v), duration: .3, overwrite: true });
    gsap.to(tick, { timeScale: self.direction < 0 ? -1 : 1, duration: 1.2, delay: .3 });
  } });

  // направления: карточки ложатся стопкой, предыдущая уменьшается
  gsap.matchMedia().add('(min-width: 901px)', () => {
    const cards = $$('.scard');
    cards.forEach((c, i) => {
      c.style.setProperty('--i', i);
      if (i === cards.length - 1) return;
      gsap.to(c, { scale: .9 + i * .012, ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: `top ${96 + (i + 1) * 14}px`, scrub: true } });
    });
    cards.forEach((c) => gsap.from($$('.scard__media img', c), { yPercent: 12, scale: .94, ease: 'none',
      scrollTrigger: { trigger: c, start: 'top bottom', end: 'top 30%', scrub: true } }));
  });

  // хиты: секция закрепляется, лента едет по горизонтали
  gsap.matchMedia().add('(min-width: 901px)', () => {
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.hscroll', start: 'top top', end: () => `+=${dist()}`, pin: '.hscroll', scrub: .6, invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set('.hscroll__progress span', { scaleX: self.progress }) } });
  });

  // карточки категорий: поднимаются по очереди, сцена слегка «дышит» при прокрутке
  gsap.from('.ccard', { y: 60, opacity: 0, duration: .9, stagger: .07, ease: 'power3.out', clearProps: 'transform,opacity',
    scrollTrigger: { trigger: '.ccards', start: 'top 85%', once: true } });
  $$('.ccard__img').forEach((im) => gsap.fromTo(im, { yPercent: 4 }, { yPercent: -4, ease: 'none',
    scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // о бренде: штамп и шаги
  gsap.from('.about__media img', { clipPath: 'inset(18% 18% 18% 18% round 50%)', scale: 1.08, duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: '.about', start: 'top 70%' } });
  gsap.from('.steps li', { x: -30, opacity: 0, stagger: .12, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.steps', start: 'top 85%' } });

  // бенто: плитки поднимаются по очереди, числа считаются
  gsap.from('.tile', { y: 50, opacity: 0, duration: .8, stagger: .07, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.bento', start: 'top 85%', once: true } });
  $$('[data-count]').forEach((el) => {
    const to = +el.dataset.count, from = to > 1000 ? to - 13 : 0, o = { v: from };
    el.textContent = from;
    gsap.to(o, { v: to, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => { el.textContent = Math.round(o.v); } });
  });

  // заявка: фиолетовый блок раскрывается кругом
  gsap.fromTo('.cta__circle', { clipPath: 'circle(12% at 50% 60%)' }, { clipPath: 'circle(80% at 50% 50%)', ease: 'none',
    scrollTrigger: { trigger: '.cta', start: 'top 95%', end: 'top 25%', scrub: true } });
  gsap.from('.cta__in > *', { y: 40, opacity: 0, stagger: .1, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 45%' } });

  // подвал: огромное слово проявляется
  gsap.from('.ftr__word', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* ---------- курсор, превью, «магнитные» кнопки ---------- */
  if (fine) {
    const cur = $('.cursor');
    const cx = gsap.quickTo(cur, 'x', { duration: .25, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .25, ease: 'power3' });
    const px = preview && gsap.quickTo(preview, 'x', { duration: .6, ease: 'power3' }), py = preview && gsap.quickTo(preview, 'y', { duration: .6, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      cur.classList.add('is-ready'); cx(e.clientX); cy(e.clientY);
      if (px) { px(e.clientX + 24); py(e.clientY); }
    }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      cur.classList.toggle('is-view', !!e.target.closest('.hit'));
      cur.classList.toggle('is-link', !e.target.closest('.hit') && !!e.target.closest('a, button, input, select, textarea, label'));
    });
    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3.out' });
      });
      b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, .4)' }));
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
