"""Композиции из товаров библиотеки для блоков сайта: только масштаб и расстановка, товары не меняются."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
O = ROOT / 'assets' / 'library' / 'originals'
OUT = ROOT / 'assets' / 'library' / 'sets'
OUT.mkdir(parents=True, exist_ok=True)

def load(rel, h):
    im = Image.open(O / rel).convert('RGBA')
    im = im.crop(im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)

def compose(name, items, W, H):
    """items: (путь, высота, центр x, низ y) — от дальнего к ближнему."""
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for rel, h, cx, bottom in items:
        im = load(rel, h)
        c.alpha_composite(im, (round(cx - im.width / 2), bottom - im.height))
    c = c.crop(c.getbbox())
    c.save(OUT / f'{name}.webp', 'WEBP', quality=84, method=6, alpha_quality=90)
    print(name, c.size, round((OUT / f'{name}.webp').stat().st_size / 1024), 'КБ')

def row(name, items, overlap=0.04, base=1000):
    """Ряд товаров на общей линии; соседние заходят друг на друга только пустыми краями."""
    ims = [load(rel, h) for rel, h in items]
    W = sum(i.width for i in ims) + 40
    c = Image.new('RGBA', (W, base), (0, 0, 0, 0))
    x = 20
    for im in ims:
        c.alpha_composite(im, (x, base - im.height))
        x += round(im.width * (1 - overlap))
    c = c.crop(c.getbbox())
    c.save(OUT / f'{name}.webp', 'WEBP', quality=84, method=6, alpha_quality=90)
    print(name, c.size, round((OUT / f'{name}.webp').stat().st_size / 1024), 'КБ')

row('cosmetics', [('kosmetika/melta-sun-cream-spf50.webp', 380), ('volosy/melta-keratin-shampoo-1000ml.png', 720),
                  ('volosy/melta-keratin-hair-balm-1000ml.png', 720), ('volosy/melta-keratin-hair-mask-400ml.webp', 340),
                  ('kosmetika/melta-aloe-panthenol-gel.webp', 560)])
row('chemistry', [('bytovaya-himiya/melta-laundry-gel-universal-6l.webp', 720), ('bytovaya-himiya/biolut-dish-gel-raspberry-mint-5l.webp', 600),
                  ('bytovaya-himiya/biolut-antizhir-500ml.png', 470), ('bytovaya-himiya/melta-oxygen-1kg.webp', 440)], overlap=0.06)
row('pets', [('zhivotnye/melta-pets-shampoo-dogs.webp', 700), ('zhivotnye/melta-pets-shampoo-dogs-fleas.webp', 700),
             ('zhivotnye/melta-pets-paw-foam-brush.webp', 560), ('zhivotnye/melta-pets-paw-nose-wax-120ml.webp', 230)], overlap=0.06)
row('lube', [('lubrikanty/sliki-h2o-neutral-250ml.webp', 640), ('lubrikanty/sliki-h2o-sweet-strawberry-250ml.webp', 640), ('lubrikanty/melta-vaseline-perfumed-100.webp', 400)], overlap=0.0)

# мыло ручной работы: сетка 2×2 без перекрытий + массажное мыло с люфой
bars = [load(r, 300) for r in ['mylo/melta-handmade-soap-lavender.webp', 'mylo/melta-handmade-soap-juniper.webp',
                               'mylo/melta-handmade-soap-ginger-orange.webp', 'mylo/melta-handmade-soap-mint-tea-tree.webp']]
lufa = load('mylo/melta-soap-lavender-lufa.webp', 420)
bw = max(b.width for b in bars); gap = 24
c = Image.new('RGBA', (bw * 2 + gap * 3 + lufa.width, 300 * 2 + gap), (0, 0, 0, 0))
for i, b in enumerate(bars):
    c.alpha_composite(b, ((i % 2) * (bw + gap), (i // 2) * (300 + gap)))
c.alpha_composite(lufa, (bw * 2 + gap * 3, c.height - lufa.height))
c = c.crop(c.getbbox()); c.save(OUT / 'handmade.webp', 'WEBP', quality=84, method=6, alpha_quality=90)
print('handmade', c.size)
