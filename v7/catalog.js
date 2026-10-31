// Витрина каталога: фильтр по категориям, поиск, «Показать ещё».
// Данные — window.MELTA_CATALOG из catalog-data.js (создаётся tools/build_catalog_js.py).
(() => {
  const data = window.MELTA_CATALOG;
  const root = document.getElementById('shop');
  if (!data || !root) return;

  const grid = root.querySelector('.shop__grid');
  const chips = root.querySelector('.shop__chips');
  const search = root.querySelector('.shop__search input');
  const more = root.querySelector('.shop__more');
  const empty = root.querySelector('.shop__empty');
  const counter = root.querySelector('.shop__count');
  const PAGE = 12;

  // направление в форме заявки для каждой категории
  const DIRECTION = {
    kosmetika: 'Косметика', volosy: 'Косметика', detskaya: 'Косметика', aromaty: 'Косметика', lubrikanty: 'Косметика', mylo: 'Косметика',
    'bytovaya-himiya': 'Бытовая химия', zhivotnye: 'Косметика для животных', 'mylo-ruchnoe': 'Мыло ручной работы',
  };

  let filter = 'all';
  let query = '';
  let shown = PAGE;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // фильтры с количеством товаров
  const count = (cat) => data.items.filter((i) => cat === 'all' || i.cat === cat).length;
  chips.innerHTML = [['all', 'Все товары'], ...Object.entries(data.cats)]
    .map(([k, v]) => `<button type="button" class="shop__chip" data-filter="${k}" aria-pressed="${k === 'all'}">${esc(v)} <span>${count(k)}</span></button>`)
    .join('');

  function render() {
    const q = query.trim().toLowerCase();
    const list = data.items.filter((i) => (filter === 'all' || i.cat === filter)
      && (!q || `${i.brand} ${i.title} ${i.volume}`.toLowerCase().includes(q)));
    grid.innerHTML = list.slice(0, shown).map((i, n) => `
      <article class="pcard pcard--${i.cat}" style="animation-delay:${(n % PAGE) * 35}ms">
        <a class="pcard__stage" href="product.html?p=${i.slug}" tabindex="-1" aria-hidden="true"><img src="${i.img}" alt="" loading="lazy"></a>
        <div class="pcard__body">
          <span class="pcard__cat">${esc(data.cats[i.cat])}</span>
          <h3 class="pcard__title"><a href="product.html?p=${i.slug}"><span>${esc(i.brand)}</span> ${esc(i.title)}</a></h3>
          <div class="pcard__foot">
            ${i.volume ? `<span class="pcard__vol">${esc(i.volume)}</span>` : '<span></span>'}
            <a class="pcard__btn" href="#price" data-direction="${DIRECTION[i.cat]}" data-product="${esc(`${i.brand} — ${i.title}${i.volume ? `, ${i.volume}` : ''}`)}">Прайс</a>
          </div>
        </div>
      </article>`).join('');
    more.hidden = list.length <= shown;
    empty.hidden = list.length > 0;
    counter.textContent = `${list.length} ${plural(list.length)}`;
  }

  function plural(n) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'товар';
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'товара';
    return 'товаров';
  }

  function setFilter(cat) {
    filter = cat;
    shown = PAGE;
    chips.querySelectorAll('.shop__chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
    render();
  }

  chips.addEventListener('click', (e) => {
    const b = e.target.closest('.shop__chip');
    if (b) setFilter(b.dataset.filter);
  });
  search.addEventListener('input', () => { query = search.value; shown = PAGE; render(); });
  more.addEventListener('click', () => { shown += PAGE; render(); });

  // кнопка «Прайс» на карточке выбирает направление в форме
  grid.addEventListener('click', (e) => {
    const a = e.target.closest('[data-direction]');
    const select = document.querySelector('#price-form select[name="goal"]');
    if (a && select) select.value = a.dataset.direction;
  });

  // ссылки вида data-shop-filter="mylo" (карточки категорий, меню) открывают каталог с фильтром
  document.querySelectorAll('[data-shop-filter]').forEach((a) => {
    a.addEventListener('click', () => setFilter(a.dataset.shopFilter));
  });

  render();
})();
