"""
Генерация озвучки для игры.

Все фразы из src/assets/voice/phrases.json озвучиваются нейросетевым голосом
(Microsoft Neural TTS через пакет edge-tts), обрезаются от тишины и склеиваются
в один MP3-«спрайт» голоса бельчонка. Рядом сохраняется JSON с картой
таймингов { id: [start, duration] }.

Запуск:  python3 scripts/gen_voice.py
Зависимости: pip install edge-tts imageio-ffmpeg numpy
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
    import imageio_ffmpeg
except ImportError:
    sys.exit('pip install edge-tts imageio-ffmpeg numpy')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHRASES = os.path.join(ROOT, 'src', 'assets', 'voice', 'phrases.json')
OUT_DIR = os.path.join(ROOT, 'src', 'assets', 'voice')
CACHE = os.path.join(ROOT, 'scripts', '.voice-cache')
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

SR = 22050          # частота дискретизации спрайта
GAP = 0.12          # пауза между фразами в спрайте, с
PAD_START = 0.03    # сколько тишины оставить перед фразой, с
PAD_END = 0.06      # и после неё
THRESH_DB = -42.0   # порог тишины
BITRATE = '32k'

# Параметры голоса бельчонка.
VOICE = dict(voice='ru-RU-SvetlanaNeural', pitch='+24Hz', rate='+6%')


async def tts(text, path, voice, rate, pitch, sem):
    # Сервис иногда отвечает пустым аудио — просто повторяем запрос.
    async with sem:
        tmp = path + '.part'
        for attempt in range(12):
            try:
                com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
                await com.save(tmp)
                if os.path.getsize(tmp) > 500:
                    os.replace(tmp, path)
                    await asyncio.sleep(0.25)
                    return
            except Exception as e:  # noqa: BLE001
                if attempt >= 3:
                    print('   retry', attempt + 1, repr(text), type(e).__name__)
            await asyncio.sleep(min(1.0 + attempt * 0.8, 6.0))
        raise RuntimeError('TTS failed: ' + text)


def decode(path):
    """mp3 -> float32 mono @ SR"""
    out = subprocess.run(
        [FFMPEG, '-v', 'error', '-i', path, '-f', 's16le', '-acodec', 'pcm_s16le', '-ac', '1', '-ar', str(SR), '-'],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(out, dtype=np.int16).astype(np.float32) / 32768.0


def trim(x):
    frame = int(SR * 0.01)
    n = len(x) // frame
    if n == 0:
        return x
    rms = np.sqrt((x[: n * frame].reshape(n, frame) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    loud = np.where(db > THRESH_DB)[0]
    if not len(loud):
        return x
    a = max(0, loud[0] * frame - int(PAD_START * SR))
    b = min(len(x), (loud[-1] + 1) * frame + int(PAD_END * SR))
    y = x[a:b].copy()
    fade = min(int(SR * 0.006), len(y) // 4)
    if fade > 0:
        y[:fade] *= np.linspace(0, 1, fade)
        y[-fade:] *= np.linspace(1, 0, fade)
    return y


def normalize(x, peak=0.89):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


def level_clip(y, target_db=-19.0, peak=0.95):
    """Выравнивание громкости клипа по RMS громких участков."""
    frame = int(SR * 0.02)
    n = len(y) // frame
    if n == 0:
        return y
    rms = np.sqrt((y[: n * frame].reshape(n, frame) ** 2).mean(axis=1) + 1e-12)
    loud = rms[rms > rms.max() * 0.2]
    cur = 20 * np.log10(loud.mean() + 1e-9)
    g = 10 ** ((target_db - cur) / 20)
    g = min(g, peak / (np.abs(y).max() + 1e-9))
    return y * g


async def build(name, cfg, phrases):
    print(f'== {name}: {cfg}')
    os.makedirs(CACHE, exist_ok=True)
    sem = asyncio.Semaphore(1)
    jobs = []
    files = {}
    for pid, text in phrases.items():
        key = hashlib.md5(json.dumps([cfg, text], ensure_ascii=False).encode()).hexdigest()[:16]
        path = os.path.join(CACHE, f'{key}.mp3')
        files[pid] = path
        if not os.path.exists(path):
            jobs.append(tts(text, path, cfg['voice'], cfg['rate'], cfg['pitch'], sem))
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

    wav_path = os.path.join(CACHE, f'{name}.wav')
    with wave.open(wav_path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((audio * 32767).astype(np.int16).tobytes())

    mp3_path = os.path.join(OUT_DIR, f'{name}.mp3')
    subprocess.run(
        [FFMPEG, '-v', 'error', '-y', '-i', wav_path, '-codec:a', 'libmp3lame', '-b:a', BITRATE, '-ar', str(SR), '-ac', '1',
         '-write_xing', '1', mp3_path],
        check=True,
    )
    with open(os.path.join(OUT_DIR, f'{name}.json'), 'w', encoding='utf-8') as f:
        json.dump(sprite, f, ensure_ascii=False, separators=(',', ':'))
    print(f'   -> {name}.mp3  {t:.1f}s  {os.path.getsize(mp3_path) // 1024} KB')


async def main():
    with open(PHRASES, encoding='utf-8') as f:
        phrases = json.load(f)
    print(f'{len(phrases)} phrases')
    await build('belochka', VOICE, phrases)


if __name__ == '__main__':
    asyncio.run(main())
