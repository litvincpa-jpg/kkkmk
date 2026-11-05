# PlayKids

A Russian-language preschool learning website built with React, Vite, and Tailwind CSS. The original mathematics game is available at `#/games/math` and retains its squirrel narration and saved progress.

## Development

Run `npm install`, then `npm run dev`. Run `npx tsc --noEmit` for type checking and `npm run build` for production. The production application is bundled into `dist/index.html`, including photographs, game artwork, fonts, and recorded speech.

## Site Structure

- `src/App.tsx`: homepage/game navigation.
- `src/site/HomePage.tsx`: homepage, catalogue, age programme, articles, and FAQs.
- `src/site/content.ts`: game catalogue, age groups, programme descriptions, and full article content.
- `src/site/site.css`: responsive website styles.
- `src/site/ProfileDialog.tsx`: optional local child profile and mathematics progress.
- `src/game/MathApp.tsx`: original mathematics game, unchanged level system, and website return flow.
- `src/letters/LettersApp.tsx`: "Знакомство с буквами" game (bear mascot, three task types: first letter, letter-to-picture, missing letter), with its own save key and prerecorded bear voice (`src/assets/letters/`). All 23 word pictures come from the Fluent 3D Emoji set (MIT) so the whole game uses one consistent 3D icon style. To replace them with custom AI-generated art, generate two sprite sheets (8 + 6 icons, "cute glossy 3D cartoon icons, Pixar style, on a pure white background, separated in a grid") for the words in `src/letters/words.ts`, save them as `raw/letters/words-a.png` / `words-b.png`, and extend `scripts/prepare_letters_assets.py` with a sheet-cutting step (see the math game objects in `scripts/prepare_assets.py` as a reference). Word pools of levels 1–4 do not overlap, so a picture is not repeated while a child works through the game; levels 5–6 are deliberate review.
- `src/screens/LevelMap.tsx`: shared level map used by both games.

New games can be implemented separately, registered in the application navigation, and added to the catalogue. The letters and matching games are currently marked as coming soon; their buttons show information rather than pretending to launch a finished game.

## Local Data

Profiles are optional and stored in `playkids:child-profile:v1`. Mathematics saves keep the existing `vesyolaya-matematika:v1` key. Signing out of a profile does not erase game progress. This version has no server account, email/password authentication, or cross-device synchronization; the interface explains this explicitly.

## Assets

`scripts/prepare_assets.py` restores optimized mathematics artwork and fonts from the original source files. `scripts/prepare_site_assets.py` prepares the homepage artwork: it blends the generated hero scene (`raw/site/hero-scene.png`) into the page cream colour, cuts the six 3D decorations out of `raw/site/hero-deco.png`, and optimizes the family photo. These scripts require Pillow, NumPy, and SciPy. Image sources are documented in `CREDITS.md`.

The hero scene and its floating decorations live in one box (`.pk-hero-scene`), and the decorations are positioned in percentages of that box (`src/site/HeroDecor.tsx` plus the `.pk-deco--*` rules in `src/site/site.css`), so they stay in place around the children at every screen size.

`scripts/gen_voice.py` regenerates the single squirrel voice from `src/assets/voice/phrases.json` using the existing voice settings. It requires `edge-tts`, `imageio-ffmpeg`, and NumPy. Generation requires an internet connection; the built game plays the embedded recordings locally.