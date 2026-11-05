"""Prepare the "Знакомство с буквами" artwork.

Sources:
  raw/letters/bear.png              – AI-generated bear mascot on white
  raw/letters/fluent-<key>.png      – Fluent 3D Emoji (MIT) word pictures

Outputs go to src/assets/letters/: bear.webp and word-<key>.webp
"""

from pathlib import Path

import numpy as np
from PIL import Image

from prepare_assets import remove_background


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'raw' / 'letters'
OUT = ROOT / 'src' / 'assets' / 'letters'

WORDS = ['watermelon', 'butterfly', 'wolf', 'pear', 'house', 'acorn', 'zebra', 'cat', 'strawberry',
         'fox', 'lemon', 'mouse', 'ball', 'rhino', 'cucumber', 'parrot', 'fish', 'elephant',
         'tiger', 'tulip', 'duck', 'turtle', 'apple']


def save(image, name, quality=86):
    path = OUT / name
    image.save(path, 'WEBP', quality=quality, method=6)
    print(f'{name:<22} {image.size}  {path.stat().st_size // 1024} KB')


def bear():
    image = remove_background(Image.open(SOURCE / 'bear.png'))
    alpha = np.asarray(image)[..., 3]
    y, x = np.where(alpha > 12)
    image = image.crop((max(x.min() - 6, 0), max(y.min() - 6, 0), min(x.max() + 7, image.width), min(y.max() + 7, image.height)))
    if image.height > 920:
        image = image.resize((round(image.width * 920 / image.height), 920), Image.Resampling.LANCZOS)
    save(image, 'bear.webp')
    print(f'   bear ratio (H/W) = {image.height / image.width:.4f}')


def words():
    for name in WORDS:
        path = SOURCE / f'fluent-{name}.png'
        image = Image.open(path).convert('RGBA')
        alpha = np.asarray(image)[..., 3]
        y, x = np.where(alpha > 8)
        image = image.crop((max(x.min() - 4, 0), max(y.min() - 4, 0), min(x.max() + 5, image.width), min(y.max() + 5, image.height)))
        image.thumbnail((240, 240), Image.Resampling.LANCZOS)
        save(image, f'word-{name}.webp')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    bear()
    words()


if __name__ == '__main__':
    main()
