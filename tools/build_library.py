"""Библиотека товаров Melta.

Оригиналы копируются байт в байт (assets/library/originals), рядом создаются
облегчённые WebP для сайта (assets/library/web): обрезка по прозрачному контуру
и уменьшение с сохранением пропорций. Сам товар не меняется.

Запуск: python3 tools/build_library.py <папка с загруженными файлами>
"""
import hashlib, json, shutil, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / 'assets' / 'library'
WEB_HEIGHT = 1000

def md5(p):
    return hashlib.md5(p.read_bytes()).hexdigest()

def main(upload_dir):
    manifest = json.loads((ROOT / 'tools' / 'library.json').read_text(encoding='utf-8'))
    rows = []
    for p in manifest['products']:
        src = Path(upload_dir) / p['file']
        ext = src.suffix.lower()
        orig = LIB / 'originals' / p['cat'] / f"{p['slug']}{ext}"
        orig.parent.mkdir(parents=True, exist_ok=True)
        if not orig.exists():
            shutil.copy2(src, orig)
        assert md5(orig) == md5(src), f'оригинал {orig} отличается от загрузки'

        im = Image.open(orig).convert('RGBA')
        alpha = im.getchannel('A').point(lambda v: 255 if v > 8 else 0)
        im = im.crop(alpha.getbbox())
        if im.height > WEB_HEIGHT:
            im = im.resize((round(im.width * WEB_HEIGHT / im.height), WEB_HEIGHT), Image.LANCZOS)
        web = LIB / 'web' / p['cat'] / f"{p['slug']}.webp"
        web.parent.mkdir(parents=True, exist_ok=True)
        im.save(web, 'WEBP', quality=86, method=6, alpha_quality=92)

        w, h = Image.open(orig).size
        rows.append({**p, 'category': manifest['categories'][p['cat']],
                     'original': str(orig.relative_to(ROOT)), 'web': str(web.relative_to(ROOT)),
                     'original_size': f'{w}×{h}', 'web_kb': round(web.stat().st_size / 1024)})

    (LIB / 'catalog.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')
    lines = ['# Библиотека товаров Melta', '',
             'Оригиналы — без изменений (байт в байт как загружены). Web — обрезка по контуру и уменьшение до 1000 px по высоте, пропорции сохранены.', '']
    for cat, title in manifest['categories'].items():
        items = [r for r in rows if r['cat'] == cat]
        lines.append(f'## {title}')
        lines.append('')
        if not items:
            lines += ['_Пока нет файлов._', '']
            continue
        lines += ['| Товар | Объём | Оригинал | Для сайта |', '|---|---|---|---|']
        for r in items:
            lines.append(f"| {r['name']} | {r['volume'] or '—'} | `{r['original']}` ({r['original_size']}) | `{r['web']}` ({r['web_kb']} КБ) |")
        lines.append('')
    (LIB / 'README.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'Товаров: {len(rows)}')

if __name__ == '__main__':
    main(sys.argv[1])
