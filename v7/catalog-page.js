// Страница каталога: категории, бренд, фасовка, поиск и сортировка; состояние хранится в адресе.
(() => {
  const data = window.MELTA_CATALOG;
  const root = document.querySelector('.cp');
  if (!data || !root) return;

  const $ = (s) => root.querySelector(s);
  const grid = $('.cp__grid');
  const search = $('.shop__search input');
  const sort = $('.cp__sort select');
  const more = $('.cp__more');
  const panel = $('.cp__filters');
  const overlay = $('.cp__overlay');
  const openBtn = $('.cp__open');
  const PAGE = 24;

  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // объём в мл или г — для сортировки и фасовки; «8 кубиков» и пустой объём не считаются
  const amount = (v) => {
    const m = /([\d]+(?:[.,]\d+)?)\s*(мл|л|кг|г)(?![а-яё])/i.exec(v || '');
    if (!m) return null;
    const n = parseFloat(m[1].replace(',', '.'));
    return m[2] === 'л' || m[2] === 'кг' ? n * 1000 : n;
  };
  const PACKS = [
    ['mini', 'До 250 мл / г', (a) => a <= 250],
    ['std', 'От 300 мл до 1 л / кг', (a) => a > 250 && a <= 1000],
    ['big', 'Большие объёмы: от 2 л', (a) => a > 1000],
  ];
  const items = data.items.map((i, n) => {
    const a = amount(i.volume);
    return { ...i, n, a, brandMain: i.brand.split(' ')[0], pack: a == null ? null : PACKS.find((p) => p[2](a))[0],
      text: `${i.brand} ${i.title} ${i.volume} ${data.cats[i.cat]}`.toLowerCase() };
  });
  const BRANDS = [...new Set(items.map((i) => i.brandMain))];

  // состояние из адреса
  const params = new URLSearchParams(location.search);
  const state = {
    cat: data.cats[params.get('cat')] ? params.get('cat') : 'all',
    brand: new Set((params.get('brand') || '').split(',').filter((b) => BRANDS.includes(b))),
    pack: new Set((params.get('pack') || '').split(',').filter((p) => PACKS.some((x) => x[0] === p))),
    q: params.get('q') || '',
    sort: params.get('sort') || 'cat',
    shown: PAGE,
  };
  search.value = state.q;
  sort.value = [...sort.options].some((o) => o.value === state.sort) ? state.sort : 'cat';

  // фильтр с пропуском одной грани — для честных счётчиков у вариантов
  const match = (i, skip) => (skip === 'cat' || state.cat === 'all' || i.cat === state.cat)
    && (skip === 'brand' || !state.brand.size || state.brand.has(i.brandMain))
    && (skip === 'pack' || !state.pack.size || state.pack.has(i.pack))
    && words(state.q).every((w) => w.some((v) => i.text.includes(v)));

  // грубая основа слова и английские названия ароматов: «лаванда» найдёт «Лавандовое» и Lavender
  const ALIASES = { лаванд: 'lavender', манго: 'mango', вишн: 'cherry', ванил: 'vanilla', алоэ: 'aloe', киви: 'kiwi', клубник: 'strawberry', апельсин: 'orange', жасмин: 'jasmine' };
  function words(q) {
    return q.trim().toLowerCase().split(/\s+/).filter(Boolean).map((w) => {
      const stem = /[а-яё]/.test(w) && w.length > 4 ? w.slice(0, -2) : w;
      const alias = Object.entries(ALIASES).find(([k]) => stem.startsWith(k) || k.startsWith(stem));
      return alias ? [stem, alias[1]] : [stem];
    });
  }

  const SORTS = {
    cat: (a, b) => a.n - b.n,
    name: (a, b) => `${a.title} ${a.brand}`.localeCompare(`${b.title} ${b.brand}`, 'ru'),
    'vol-asc': (a, b) => (a.a ?? Infinity) - (b.a ?? Infinity) || a.n - b.n,
    'vol-desc': (a, b) => (b.a ?? -1) - (a.a ?? -1) || a.n - b.n,
  };

  const plural = (n) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'товар';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'товара';
    return 'товаров';
  };

  const card = (i, n) => `
    <article class="pcard pcard--${i.cat}" style="animation-delay:${(n % PAGE) * 25}ms">
      <a class="pcard__stage" href="product.html?p=${i.slug}" tabindex="-1" aria-hidden="true"><img src="${i.img}" alt="" loading="lazy"></a>
      <div class="pcard__body">
        <span class="pcard__cat">${esc(data.cats[i.cat])}</span>
        <h3 class="pcard__title"><a href="product.html?p=${i.slug}"><span>${esc(i.brand)}</span> ${esc(i.title)}</a></h3>
        <div class="pcard__foot">${i.volume ? `<span class="pcard__vol">${esc(i.volume)}</span>` : '<span></span>'}<a class="pcard__btn" href="product.html?p=${i.slug}">Подробнее</a></div>
      </div>
    </article>`;

  // плитки категорий с фото первого товара
  const COVER = { kosmetika: 'melta-bath-foam-raspberry-500', volosy: 'melta-keratin-shampoo-1000ml', 'bytovaya-himiya': 'biolut-professional-gel-5l',
    zhivotnye: 'melta-pets-shampoo-dogs', mylo: 'melta-cream-soap-lavender-field', 'mylo-ruchnoe': 'melta-handmade-soap-lavender',
    aromaty: 'melta-air-freshener-red-amber-7ml', lubrikanty: 'sliki-h2o-sweet-strawberry-250ml' };
  const firstImg = (cat) => (items.find((i) => i.slug === COVER[cat]) || items.find((i) => i.cat === cat) || {}).img;
  function renderCats() {
    const list = [['all', 'Все товары'], ...Object.entries(data.cats)];
    $('.cp__cats').innerHTML = list.map(([k, v]) => {
      const c = items.filter((i) => (k === 'all' || i.cat === k) && match(i, 'cat')).length;
      const img = k === 'all' ? '' : `<img src="${firstImg(k)}" alt="" loading="lazy">`;
      return `<button type="button" class="cp__cat pcard--${k}" data-cat="${k}" aria-pressed="${state.cat === k}"${c ? '' : ' disabled'}>
        <span class="cp__cat-img pcard__stage">${img}</span><span class="cp__cat-name">${esc(v)}</span><span class="cp__cat-count">${c}</span></button>`;
    }).join('');
  }

  function renderFacet(facet, options) {
    root.querySelector(`[data-facet="${facet}"] .cp__options`).innerHTML = options.map(([value, label]) => {
      const c = items.filter((i) => match(i, facet) && (facet === 'brand' ? i.brandMain === value : i.pack === value)).length;
      const on = state[facet].has(value);
      return `<label class="cp__option${c || on ? '' : ' is-off'}"><input type="checkbox" value="${esc(value)}"${on ? ' checked' : ''}${c || on ? '' : ' disabled'}>
        <span>${esc(label)}</span><em>${c}</em></label>`;
    }).join('');
  }

  function renderActive() {
    const chips = [];
    if (state.cat !== 'all') chips.push(['cat', state.cat, data.cats[state.cat]]);
    state.brand.forEach((b) => chips.push(['brand', b, b]));
    state.pack.forEach((p) => chips.push(['pack', p, PACKS.find((x) => x[0] === p)[1]]));
    if (state.q.trim()) chips.push(['q', '', `«${state.q.trim()}»`]);
    $('.cp__active').innerHTML = chips.map(([f, v, l]) =>
      `<button type="button" class="cp__chip" data-f="${f}" data-v="${esc(v)}">${esc(l)} <span aria-hidden="true">×</span><span class="visually-hidden">— убрать</span></button>`).join('')
      + (chips.length > 1 ? '<button type="button" class="cp__chip cp__chip--reset cp__reset">Сбросить всё</button>' : '');
    const n = state.brand.size + state.pack.size;
    const badge = $('.cp__badge');
    badge.hidden = !n;
    badge.textContent = n;
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (state.cat !== 'all') p.set('cat', state.cat);
    if (state.brand.size) p.set('brand', [...state.brand].join(','));
    if (state.pack.size) p.set('pack', [...state.pack].join(','));
    if (state.q.trim()) p.set('q', state.q.trim());
    if (state.sort !== 'cat') p.set('sort', state.sort);
    history.replaceState(null, '', `${location.pathname}${p.toString() ? `?${p}` : ''}`);
  }

  function render() {
    const list = items.filter((i) => match(i)).sort(SORTS[state.sort]);
    grid.innerHTML = list.slice(0, state.shown).map(card).join('');
    more.hidden = list.length <= state.shown;
    $('.cp__empty').hidden = list.length > 0;
    $('.cp__total').textContent = `${list.length} ${plural(list.length)}`;
    $('.cp__apply').textContent = `Показать ${list.length} ${plural(list.length)}`;
    document.title = `${state.cat === 'all' ? 'Каталог' : data.cats[state.cat]} — Melta`;
    renderCats();
    renderFacet('brand', BRANDS.map((b) => [b, b]));
    renderFacet('pack', PACKS.map(([k, l]) => [k, l]));
    renderActive();
    syncUrl();
  }

  const update = () => { state.shown = PAGE; render(); };
  const reset = () => { state.cat = 'all'; state.brand.clear(); state.pack.clear(); state.q = ''; search.value = ''; update(); };

  $('.cp__cats').addEventListener('click', (e) => {
    const b = e.target.closest('.cp__cat');
    if (b) { state.cat = b.dataset.cat; update(); }
  });
  panel.addEventListener('change', (e) => {
    const facet = e.target.closest('[data-facet]')?.dataset.facet;
    if (!facet) return;
    state[facet][e.target.checked ? 'add' : 'delete'](e.target.value);
    update();
  });
  root.addEventListener('click', (e) => {
    if (e.target.closest('.cp__reset')) { reset(); return; }
    const chip = e.target.closest('.cp__chip');
    if (!chip) return;
    const { f, v } = chip.dataset;
    if (f === 'cat') state.cat = 'all';
    else if (f === 'q') { state.q = ''; search.value = ''; } else state[f].delete(v);
    update();
  });
  let t;
  search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = search.value; update(); }, 150); });
  sort.addEventListener('change', () => { state.sort = sort.value; render(); });
  more.addEventListener('click', () => { state.shown += PAGE; render(); });

  // фильтры на телефоне — выезжающая панель
  const toggle = (open) => {
    panel.classList.toggle('is-open', open);
    overlay.hidden = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) panel.querySelector('input, button')?.focus();
  };
  openBtn.addEventListener('click', () => toggle(true));
  overlay.addEventListener('click', () => toggle(false));
  $('.cp__close').addEventListener('click', () => toggle(false));
  $('.cp__apply').addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('is-open')) toggle(false); });

  render();
})();
