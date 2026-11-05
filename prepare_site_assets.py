"""Prepare homepage artwork: hero scene, floating 3D decorations and family photo.

Sources (raw/site):
  hero-scene.png  – generated scene: children and a toy giraffe looking at a tablet
  hero-deco.png   – generated sprite sheet with six 3D decorations on white
  family.jpg      – Pexels photo for the "About" section
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'raw' / 'site'
OUT = ROOT / 'src' / 'assets' / 'site'
CREAM = np.array([255, 250, 245], dtype=np.float32)
DECOR = ['puzzle', 'star', 'rocket', 'block-a', 'books', 'block-1']


def smoothstep(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def hero_scene():
    image = Image.open(SOURCE / 'hero-scene.png').convert('RGB')
    print('hero source', image.size)
    if image.width > 1800:
        image = image.resize((1800, round(image.height * 1800 / image.width)), Image.Resampling.LANCZOS)
    rgb = np.asarray(image).astype(np.float32)
    h, w, _ = rgb.shape
    x = np.arange(w, dtype=np.float32)[None, :] / w
    y = np.arange(h, dtype=np.float32)[:, None] / h
    # Left and top edges melt into the page cream so the scene has no visible border.
    keep = (smoothstep(x / 0.22) * smoothstep(y / 0.1))[..., None]
    out = rgb * keep + CREAM * (1 - keep)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT / 'hero-scene.webp', quality=84, method=6)
    print('  -> hero-scene.webp', (w, h), 'wall colour', rgb[int(h * 0.3), int(w * 0.25)].round())


def cut_out(image, t_low=10.0, t_high=30.0):
    rgb = np.asarray(image.convert('RGB')).astype(np.float32)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    background = np.median(border, axis=0)
    distance = np.sqrt(((rgb - background) ** 2).sum(axis=2))
    labels, _ = ndimage.label(distance < t_high)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    mask = np.isin(labels, edge[edge != 0])
    alpha = np.ones(distance.shape, dtype=np.float32)
    alpha[mask] = np.clip((distance[mask] - t_low) / (t_high - t_low), 0, 1)
    smooth = ndimage.uniform_filter(alpha, size=3)
    alpha = np.clip(np.where(mask | (smooth < 0.999), np.minimum(alpha, smooth + 0.15), alpha), 0, 1)
    safe = np.maximum(alpha, 1e-3)[..., None]
    foreground = np.where(alpha[..., None] > 0.02, (rgb - (1 - safe) * background) / safe, rgb)
    return np.dstack([np.clip(foreground, 0, 255), alpha * 255]).astype(np.uint8)


def decorations():
    rgba = cut_out(Image.open(SOURCE / 'hero-deco.png'))
    mask = rgba[..., 3] > 40
    labels, count = ndimage.label(ndimage.binary_dilation(mask, iterations=14))
    parts = []
    for label in range(1, count + 1):
        part = (labels == label) & mask
        if part.sum() < 2000:
            continue
        y, x = np.where(part)
        parts.append((y.mean(), x.mean(), x.min(), y.min(), x.max(), y.max(), label))
    assert len(parts) == len(DECOR), f'expected {len(DECOR)} decorations, found {len(parts)}'
    parts.sort(key=lambda p: (0 if p[0] < rgba.shape[0] / 2 else 1, p[1]))
    for name, (_, _, x0, y0, x1, y1, label) in zip(DECOR, parts):
        piece = rgba.copy()
        piece[..., 3] = np.where(labels == label, piece[..., 3], 0)
        image = Image.fromarray(piece).crop((max(0, x0 - 4), max(0, y0 - 4), x1 + 5, y1 + 5))
        image.thumbnail((380, 380), Image.Resampling.LANCZOS)
        image.save(OUT / f'deco-{name}.webp', quality=86, method=6)
        print(f'  -> deco-{name}.webp', image.size, f'aspect {image.width / image.height:.3f}')


def family():
    image = Image.open(SOURCE / 'family.jpg').convert('RGB')
    image = image.crop((0, 0, min(960, image.width), image.height))
    image.save(OUT / 'family.webp', quality=84, method=6)
    print('  -> family.webp', image.size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    hero_scene()
    decorations()
    family()


if __name__ == '__main__':
    main()
