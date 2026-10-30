// Карточка товара: product.html?p=<slug>. Данные — window.MELTA_CATALOG (catalog-data.js).
// Пока идёт наполнение, пустые поля показываются плашкой «нужно заполнить» (DRAFT).
(() => {
  const DRAFT = true;
  const data = window.MELTA_CATALOG;
  const root = document.getElementById('product');
  if (!data || !root) return;

  const slug = new URLSearchParams(location.search).get('p');
  const item = data.items.find((i) => i.slug === slug);
  if (!item) {
    root.innerHTML = '<div class="pp__missing"><h1>Товар не найден</h1><p>Возможно, ссылка устарела.</p><a class="btn btn--orange" href="index.html#shop">Весь каталог</a></div>';
    return;
  }

  const d = Object.assign({ label: [], benefits: [], usage: [], specs: {} }, item.d);
  const s = d.specs || {};
  const catName = data.cats[item.cat];
  const DIRECTION = {
    kosmetika: 'Косметика', volosy: 'Косметика', detskaya: 'Косметика', aromaty: 'Косметика', lubrikanty: 'Косметика', mylo: 'Косметика',
    'bytovaya-himiya': 'Бытовая химия', zhivotnye: 'Косметика для животных', 'mylo-ruchnoe': 'Мыло ручной работы',
  };
  const priceHref = `index.html?goal=${encodeURIComponent(DIRECTION[item.cat])}#price`;

  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const todo = (what) => (DRAFT ? `<p class="todo"><b>Нужно заполнить:</b> ${what}</p>` : '');
  const tick = '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12.5 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const arrow = '<svg class="arrow" aria-hidden="true"><use href="#arrow"/></svg>';

  // объёмы одной позиции и похожие товары
  const variants = data.items.filter((i) => i.brand === item.brand && i.title === item.title);
  const related = data.items
    .filter((i) => i.cat === item.cat && !(i.brand === item.brand && i.title === item.title))
    .sort((a, b) => (b.brand === item.brand) - (a.brand === item.brand))
    .slice(0, 4);

  document.title = `${item.brand} — ${item.title}${item.volume ? `, ${item.volume}` : ''} | Melta`;
  const crumb = document.querySelector('.crumbs__cat');
  if (crumb) { crumb.textContent = catName; crumb.href = `catalog.html?cat=${item.cat}`; }

  const specRows = [
    ['Бренд', item.brand],
    ['Категория', catName],
    ['Объём', item.volume],
    ['Вес нетто', s.weight],
    ['Срок годности', s.shelf],
    ['Условия хранения', s.storage],
    ['Штрихкод', s.barcode],
    ['Кратность в коробке', s.box],
    ['Документ', s.doc],
    ['Производство', 'Беларусь, Минск'],
  ];
  const missingSpecs = specRows.filter(([, v]) => !v).map(([k]) => k.toLowerCase());

  const card = (i) => `
    <article class="pcard pcard--${i.cat}">
      <a class="pcard__stage" href="product.html?p=${i.slug}"><img src="${i.img}" alt="${esc(i.brand)} — ${esc(i.title)}" loading="lazy"></a>
      <div class="pcard__body">
        <span class="pcard__cat">${esc(data.cats[i.cat])}</span>
        <h3 class="pcard__title"><a href="product.html?p=${i.slug}"><span>${esc(i.brand)}</span> ${esc(i.title)}</a></h3>
        <div class="pcard__foot">${i.volume ? `<span class="pcard__vol">${esc(i.volume)}</span>` : '<span></span>'}<a class="pcard__btn" href="product.html?p=${i.slug}">Подробнее</a></div>
      </div>
    </article>`;

  root.innerHTML = `
    <section class="pp__hero">
      <div class="pp__stage pcard--${item.cat}"><div class="pcard__stage"><img src="${item.img}" alt="${esc(item.brand)} — ${esc(item.title)}"></div></div>
      <div class="pp__info">
        <span class="hand">${esc(catName.toLowerCase())}</span>
        <p class="pp__brand">${esc(item.brand)}</p>
        <h1 class="pp__title">${esc(item.title)}</h1>
        ${variants.length > 1 ? `<div class="pp__variants" aria-label="Объём">${variants.map((v) =>
          `<a class="pp__variant" href="product.html?p=${v.slug}"${v.slug === item.slug ? ' aria-current="true"' : ''}>${esc(v.volume || 'без объёма')}</a>`).join('')}</div>`
          : item.volume ? `<div class="pp__variants"><span class="pp__variant" aria-current="true">${esc(item.volume)}</span></div>` : ''}
        ${d.label.length ? `<ul class="pp__claims">${d.label.map((c) => `<li>${tick}${esc(c)}</li>`).join('')}</ul>` : todo('надписи-преимущества с этикетки')}
        ${d.lead ? `<p class="pp__lead">${esc(d.lead)}</p>` : todo('короткое описание — 2–3 предложения о продукте')}
        <div class="pp__actions">
          <a class="btn btn--orange" href="${priceHref}">Запросить прайс ${arrow}</a>
          <a class="btn btn--ghost" href="${esc(d.wb || 'https://www.wildberries.by/seller/450099')}" target="_blank" rel="noopener">${d.wb ? 'Купить на Wildberries' : 'Магазин на Wildberries'} ${arrow}</a>
        </div>
        <ul class="pp__facts">
          <li><span>Объём</span><b>${esc(item.volume || '—')}</b></li>
          <li><span>Срок годности</span><b>${esc(s.shelf || '—')}</b></li>
          <li><span>Производство</span><b>Беларусь</b></li>
        </ul>
      </div>
    </section>

    <nav class="pp__tabs" aria-label="Разделы карточки">
      <a href="#pp-benefits">Преимущества</a><a href="#pp-composition">Состав</a><a href="#pp-usage">Применение</a><a href="#pp-specs">Характеристики</a>
    </nav>

    <section class="pp__block" id="pp-benefits">
      <h2>Почему выбирают</h2>
      ${d.benefits.length ? `<div class="pp__benefits">${d.benefits.map((b, n) => `
        <div class="pp__benefit"><span class="pp__num">${String(n + 1).padStart(2, '0')}</span><h3>${esc(b.title || b)}</h3>${b.text ? `<p>${esc(b.text)}</p>` : ''}</div>`).join('')}</div>`
        : todo('3–4 преимущества: заголовок и одно предложение пояснения (только подтверждённые)')}
      ${d.audience ? `<p class="pp__audience"><b>Кому подходит:</b> ${esc(d.audience)}</p>` : todo('кому подходит (тип кожи, волос, возраст, вид животного, тип поверхностей)')}
    </section>

    <section class="pp__block" id="pp-composition">
      <h2>Состав</h2>
      ${d.oils ? `<p class="pp__oils"><b>Эфирные масла:</b> ${esc(d.oils)}</p>` : ''}
      ${d.composition ? `<p class="pp__inci">${esc(d.composition)}</p>` : todo('полный состав (INCI) с этикетки и 2–3 ключевых компонента с пояснением, зачем они')}
    </section>

    <section class="pp__block" id="pp-usage">
      <h2>Как применять</h2>
      ${d.usage.length ? `<ol class="pp__steps">${d.usage.map((u) => `<li>${esc(u)}</li>`).join('')}</ol>` : todo('способ применения по шагам и меры предосторожности')}
    </section>

    <section class="pp__block" id="pp-specs">
      <h2>Характеристики</h2>
      <dl class="pp__specs">${specRows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v ? esc(v) : (DRAFT ? '<span class="todo-inline">заполнить</span>' : '—')}</dd></div>`).join('')}</dl>
      ${missingSpecs.length && DRAFT ? `<p class="pp__note">Не хватает: ${missingSpecs.join(', ')}.</p>` : ''}
    </section>

    <section class="pp__b2b">
      <div><span class="hand">для бизнеса</span><h2>Опт и производство под вашей маркой</h2>
      <p>Поставляем магазинам и оптовым компаниям в Беларуси, России и Казахстане. Этот продукт можно выпустить под вашим брендом.</p></div>
      <div class="pp__b2b-actions"><a class="btn btn--white" href="${priceHref}">Получить прайс ${arrow}</a><a class="btn btn--line" href="https://agnex.by" target="_blank" rel="noopener">Контрактное производство</a></div>
    </section>

    ${related.length ? `<section class="pp__related"><div class="head"><div><span class="hand">из той же категории</span><h2>Похожие товары</h2></div></div>
      <div class="shop__grid">${related.map(card).join('')}</div></section>` : ''}
  `;

  // разметка для поисковиков: только подтверждённые данные
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: `${item.brand} ${item.title}`,
    image: new URL(item.img, location.href).href, brand: { '@type': 'Brand', name: item.brand }, category: catName };
  if (d.lead) ld.description = d.lead;
  if (s.barcode) ld.gtin13 = s.barcode;
  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.textContent = JSON.stringify(ld);
  document.head.appendChild(tag);
})();
