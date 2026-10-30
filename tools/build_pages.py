"""Страницы варианта 7 с общей шапкой и подвалом из v7/index.html: каталог и карточка товара.

Запуск: python3 tools/build_pages.py (после правок шапки или подвала на главной).
"""
import re
from pathlib import Path

V7 = Path(__file__).resolve().parent.parent / 'v7'
src = (V7 / 'index.html').read_text(encoding='utf-8')
head = src[:src.index('<header')]
header = src[src.index('<header'):src.index('</header>') + 9]
footer = src[src.index('<footer'):src.index('</footer>') + 9]
DATA_V = re.search(r'catalog-data\.js\?v=(\d+)', src).group(1)


def shell(title, description, main, scripts, current=None):
    h = head.replace('<title>Melta — забота в каждом дне</title>', f'<title>{title}</title>')
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{description}">', h)
    top = re.sub(r'href="#(?!top\b|main\b)', 'href="index.html#', header)
    top = top.replace('href="#top" aria-label="Melta — на главную"', 'href="index.html" aria-label="Melta — на главную"')
    if current:
        top = top.replace(f'<a href="{current}">', f'<a href="{current}" aria-current="page">')
    bottom = re.sub(r'href="#', 'href="index.html#', footer)
    tags = '\n'.join(f'<script src="{s}"></script>' for s in ['../script.js', f'catalog-data.js?v={DATA_V}'] + scripts)
    return f'{h}{top}\n{main}\n{bottom}\n\n{tags}\n</body>\n</html>\n'


PRODUCT = '''
<main id="main" class="pp">
  <div class="container">
    <nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a><span>/</span><a href="catalog.html">Каталог</a><span>/</span><a class="crumbs__cat" href="catalog.html">…</a></nav>
  </div>
  <div id="product" class="container"><p class="pp__loading">Загружаем товар…</p></div>
</main>
'''

SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>'
CATALOG = f'''
<main id="main" class="cp">
  <div class="container">
    <nav class="crumbs" aria-label="Навигация"><a href="index.html">Главная</a><span>/</span><span aria-current="page">Каталог</span></nav>
    <div class="cp__head">
      <div><span class="hand">собственное производство</span><h1>Каталог</h1></div>
      <p class="cp__total"></p>
    </div>
    <div class="cp__cats" role="group" aria-label="Категории"></div>

    <div class="cp__layout">
      <aside class="cp__filters" id="cp-filters" aria-label="Фильтры">
        <div class="cp__filters-head"><h2>Фильтры</h2><button type="button" class="cp__close" aria-label="Закрыть фильтры">×</button></div>
        <fieldset class="cp__group" data-facet="brand"><legend>Бренд</legend><div class="cp__options"></div></fieldset>
        <fieldset class="cp__group" data-facet="pack"><legend>Фасовка</legend><div class="cp__options"></div></fieldset>
        <button type="button" class="cp__reset">Сбросить фильтры</button>
        <button type="button" class="btn btn--orange cp__apply">Показать</button>
      </aside>

      <section class="cp__results" aria-label="Товары">
        <div class="cp__toolbar">
          <label class="shop__search"><span class="visually-hidden">Поиск по каталогу</span>{SEARCH_ICON}
            <input type="search" placeholder="Найти товар: Keratin, лаванда, 5 л…" autocomplete="off"></label>
          <label class="cp__sort"><span>Сортировка</span>
            <select>
              <option value="cat">По категориям</option>
              <option value="name">По названию</option>
              <option value="vol-asc">Объём: по возрастанию</option>
              <option value="vol-desc">Объём: по убыванию</option>
            </select></label>
          <button type="button" class="cp__open" aria-controls="cp-filters" aria-expanded="false">Фильтры <span class="cp__badge" hidden></span></button>
        </div>
        <div class="cp__active" aria-live="polite"></div>
        <div class="shop__grid cp__grid"></div>
        <div class="cp__empty" hidden><p>Ничего не нашлось. Попробуйте другое слово или сбросьте фильтры.</p><button type="button" class="btn btn--orange cp__reset">Сбросить фильтры</button></div>
        <div class="shop__actions"><button type="button" class="btn btn--orange cp__more" hidden>Показать ещё</button></div>
      </section>
    </div>
  </div>
  <div class="cp__overlay" hidden></div>
</main>
'''

(V7 / 'product.html').write_text(shell('Товар — Melta', 'Карточка товара Melta: описание, состав, применение и характеристики.',
                                       PRODUCT, ['product.js?v=2']), encoding='utf-8')
(V7 / 'catalog.html').write_text(shell('Каталог — Melta', 'Каталог Melta: косметика, бытовая химия Biolut, мыло, товары для детей и животных собственного производства.',
                                       CATALOG, ['catalog-page.js?v=2'], current='catalog.html'), encoding='utf-8')
print('готово: product.html, catalog.html')
