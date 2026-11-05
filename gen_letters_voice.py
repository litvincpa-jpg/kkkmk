"""Generate the bear narration sprite for "Знакомство с буквами".

Run:  python3 scripts/gen_letters_voice.py
Same pipeline as gen_voice.py, but with a warm male voice for the bear.
"""
import asyncio
import hashlib
import json
import os
import subprocess
import sys
import wave

import numpy as np

try:
    import edge_tts
    import imageio_ffmpeg  # noqa: F401
except ImportError:
    sys.exit('pip install edge-tts imageio-ffmpeg numpy')

from gen_voice import SR, GAP, BITRATE, FFMPEG, CACHE, decode, level_clip, trim, tts


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHRASES = os.path.join(ROOT, 'src', 'assets', 'letters', 'phrases.json')
OUT_DIR = os.path.join(ROOT, 'src', 'assets', 'letters')

VOICE = dict(voice='ru-RU-DmitryNeural', pitch='+14Hz', rate='-4%')
NAME = 'bear'


async def main():
    with open(PHRASES, encoding='utf-8') as f:
        phrases = json.load(f)
    print(f'{len(phrases)} phrases, {VOICE}')
    os.makedirs(CACHE, exist_ok=True)
    sem = asyncio.Semaphore(1)
    jobs = []
    files = {}
    for pid, text in phrases.items():
        key = hashlib.md5(json.dumps([VOICE, text], ensure_ascii=False).encode()).hexdigest()[:16]
        path = os.path.join(CACHE, f'{key}.mp3')
        files[pid] = path
        if not os.path.exists(path):
            jobs.append(tts(text, path, VOICE['voice'], VOICE['rate'], VOICE['pitch'], sem))
    print(f'   synthesizing {len(jobs)} new clips ({len(phrases) - len(jobs)} cached)')
    await asyncio.gather(*jobs)

    chunks = []
    sprite = {}
    t = 0.0
    gap = np.zeros(int(SR * GAP), np.float32)
    for pid in phrases:
        y = level_clip(trim(decode(files[pid])))
        dur = len(y) / SR
        sprite[pid] = [round(t, 3), round(dur, 3)]
        chunks += [y, gap]
        t += dur + GAP
    audio = np.clip(np.concatenate(chunks), -0.98, 0.98)

    wav_path = os.path.join(CACHE, f'{NAME}.wav')
    with wave.open(wav_path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((audio * 32767).astype(np.int16).tobytes())

    mp3_path = os.path.join(OUT_DIR, f'{NAME}.mp3')
    subprocess.run(
        [FFMPEG, '-v', 'error', '-y', '-i', wav_path, '-codec:a', 'libmp3lame', '-b:a', BITRATE,
         '-ar', str(SR), '-ac', '1', '-write_xing', '1', mp3_path],
        check=True,
    )
    with open(os.path.join(OUT_DIR, f'{NAME}.json'), 'w', encoding='utf-8') as f:
        json.dump(sprite, f, ensure_ascii=False, separators=(',', ':'))
    print(f'   -> {NAME}.mp3  {t:.1f}s  {os.path.getsize(mp3_path) // 1024} KB')


if __name__ == '__main__':
    asyncio.run(main())
