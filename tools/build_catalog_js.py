"""Данные витрины каталога для варианта 7 из assets/library/catalog.json."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
rows = json.loads((ROOT / 'assets/library/catalog.json').read_text(encoding='utf-8'))
SKIP = {'melta-premium-autoparfume-box'}          # дубль набора автопарфюма
ORDER = ['kosmetika', 'volosy', 'detskaya', 'bytovaya-himiya', 'zhivotnye', 'mylo', 'aromaty', 'lubrikanty']
TITLES = {'biolut-antizhir-500ml': 'Антижир для плит, духовок, грилей и мультиварок',
          'sliki-oil-massage-250ml': 'Массажное масло для тела, парфюмированное'}
BRANDS = {'Melta handmade soap glycerinate': 'Melta handmade', 'Biolut Антижир': 'Biolut'}
items = []
for r in rows:
    if r['slug'] in SKIP:
        continue
    brand, _, rest = r['name'].partition(', ')
    title = re.split(r'[:—]', rest)[0].strip()
    title = re.sub(r',?\s*(с коробкой|с дозатором|\(.*?\))$', '', title).strip(' ,')
    for tail in [' (этикетка PL/RU)', ', концентрированная формула', ', не требует смывания', ', 100+ применений', ', ручная работа', ' «№1 средство для всего»', ', с витамином E']:
        title = title.replace(tail, '')
    title = title[:1].upper() + title[1:]
    title = TITLES.get(r['slug'], title)
    brand = BRANDS.get(brand, brand)
    items.append({'slug': r['slug'], 'cat': r['cat'], 'brand': brand, 'title': title,
                  'volume': r['volume'], 'img': '../' + r['web']})
items.sort(key=lambda i: (ORDER.index(i['cat']), i['brand'], i['title']))
cats = json.loads((ROOT / 'tools/library.json').read_text(encoding='utf-8'))['categories']
cats = {k: cats[k] for k in ORDER}
out = '// Создаётся tools/build_catalog_js.py — не править вручную\nwindow.MELTA_CATALOG = ' + json.dumps({'cats': cats, 'items': items}, ensure_ascii=False, indent=1) + ';\n'
(ROOT / 'v7/catalog-data.js').write_text(out, encoding='utf-8')
print(len(items), 'товаров')
for i in items[:60]: print(f"{i['cat']:16} {i['brand'][:22]:22} | {i['title'][:70]} | {i['volume']}")
