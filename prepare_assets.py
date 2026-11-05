"""Restore optimized game assets from the original artwork in raw/."""

from pathlib import Path
import shutil

import numpy as np
from PIL import Image
from scipy import ndimage


ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'raw'
OUT = ROOT / 'src' / 'assets'


def remove_background(image):
    rgb = np.asarray(image.convert('RGB')).astype(np.float32)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    background = np.median(border, axis=0)
    distance = np.sqrt(((rgb - background) ** 2).sum(axis=2))
    labels, _ = ndimage.label(distance < 48)
    edge_labels = np.unique(np.concatenate([
        labels[0], labels[-1], labels[:, 0], labels[:, -1],
    ]))
    mask = np.isin(labels, edge_labels[edge_labels != 0])
    alpha = np.ones(distance.shape, dtype=np.float32)
    alpha[mask] = np.clip((distance[mask] - 18) / 30, 0, 1)
    smoothed = ndimage.uniform_filter(alpha, size=3)
    alpha = np.where(mask | (smoothed < 0.999), np.minimum(alpha, smoothed + 0.15), alpha)
    alpha = np.clip(alpha, 0, 1)

    # Remove the white fringe while preserving bright details inside the subject.
    safe_alpha = np.maximum(alpha, 1e-3)[..., None]
    foreground = (rgb - (1 - safe_alpha) * background) / safe_alpha
    foreground = np.where(alpha[..., None] > 0.02, foreground, rgb)
    rgba = np.dstack([np.clip(foreground, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(rgba)


def crop_alpha(image, padding=6):
    y, x = np.where(np.asarray(image)[..., 3] > 12)
    return image.crop((
        max(0, x.min() - padding), max(0, y.min() - padding),
        min(image.width, x.max() + padding + 1), min(image.height, y.max() + padding + 1),
    ))


def save(image, filename, width=None, height=None, quality=82):
    scale = min(1, width / image.width if width else 1, height / image.height if height else 1)
    if scale < 1:
        image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    image.save(OUT / filename, 'WEBP', quality=quality, method=6)
    print(filename)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    save(Image.open(RAW / 'bg.jpg').convert('RGB'), 'bg.webp', width=1600, quality=74)
    for name, width, height in [('squirrel', None, 980), ('stump', 760, None)]:
        image = crop_alpha(remove_background(Image.open(RAW / f'{name}.png')))
        save(image, f'{name}.webp', width, height)

    for name in ['boy', 'girl']:
        image = Image.open(RAW / f'{name}.png').convert('RGB')
        size = int(image.width * 0.8)
        x = (image.width - size) // 2
        y = int(image.height * 0.05)
        image = image.crop((x, y, x + size, y + size))
        image = image.resize((256, 256), Image.Resampling.LANCZOS)
        save(image, f'avatar-{name}.webp')

    sheets = {
        'sheet1': ['apple', 'pear', 'strawberry', 'carrot', 'acorn', 'mushroom'],
        'sheet2': ['duck', 'fish', 'ladybug', 'tulip', 'ball', 'butterfly'],
    }
    for sheet, names in sheets.items():
        rgba = np.asarray(remove_background(Image.open(RAW / f'{sheet}.png')))
        mask = rgba[..., 3] > 40
        labels, count = ndimage.label(ndimage.binary_dilation(mask, iterations=18))
        components = []
        for label in range(1, count + 1):
            component = (labels == label) & mask
            if component.sum() < 3000:
                continue
            y, x = np.where(component)
            components.append((y.mean(), x.mean(), x.min(), y.min(), x.max(), y.max(), label))
        assert len(components) == len(names), f'Unexpected objects in {sheet}'
        components.sort(key=lambda c: (0 if c[0] < rgba.shape[0] / 2 else 1, c[1]))
        for name, (_, _, x0, y0, x1, y1, label) in zip(names, components):
            piece = rgba.copy()
            piece[..., 3] = np.where(labels == label, piece[..., 3], 0)
            image = Image.fromarray(piece).crop((max(0, x0 - 6), max(0, y0 - 6), x1 + 7, y1 + 7))
            save(image, f'obj-{name}.webp', width=256, height=256, quality=84)

    fonts = OUT / 'fonts'
    fonts.mkdir(exist_ok=True)
    for subset in ['cyrillic', 'latin']:
        source = ROOT / 'node_modules' / '@fontsource-variable' / 'nunito' / 'files' / f'nunito-{subset}-wght-normal.woff2'
        shutil.copyfile(source, fonts / f'nunito-{subset}.woff2')


if __name__ == '__main__':
    main()