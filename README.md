# catandcapy.com

Website for Cat & Capy, built with [Astro](https://astro.build) and Svelte 5 islands.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # type-check + build to dist/
```

- `src/pages/index.astro`: the page
- `src/components/`: sections (`.astro`, static) and interactive islands (`.svelte`)
- `src/lib/cats.ts`: the cats shown on the site
- `src/lib/sound.ts`: Web Audio meows and pops (no audio files)
- `public/cats`: icons exported from the Unity project's `Assets/Textures/Cosmetics`

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
