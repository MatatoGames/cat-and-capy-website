<script lang="ts">
  import { onMount } from "svelte";
  import { purr, meow } from "../lib/sound";

  interface Props {
    src: string;
    srcset?: string;
    width: number;
    height: number;
  }
  let { src, srcset, width, height }: Props = $props();

  const PETS_KEY = "cac-pets";
  const MILESTONES: Record<number, string> = {
    1: "Purrr…",
    10: "Capy is very relaxed now",
    25: "Cat approves of you",
    50: "Certified best friend",
    100: "You have been adopted",
  };

  let pets = $state(0);
  let squish = $state(0);
  let hearts = $state<{ id: number; x: number; y: number; glyph: string }[]>([]);
  let nextId = 0;

  const message = $derived.by(() => {
    const keys = Object.keys(MILESTONES).map(Number).filter((k) => pets >= k);
    return keys.length ? MILESTONES[Math.max(...keys)] : "Pet us!";
  });

  onMount(() => {
    try {
      pets = Number(localStorage.getItem(PETS_KEY)) || 0;
    } catch {
      /* storage unavailable */
    }
  });

  function pet(e: MouseEvent): void {
    pets++;
    squish++;
    try {
      localStorage.setItem(PETS_KEY, String(pets));
    } catch {
      /* storage unavailable */
    }
    if (pets % 5 === 0) meow(1.2);
    else purr();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 3;
    const glyphs = ["❤️", "💛", "🧡", "✨"];
    const batch = Array.from({ length: 3 }, (_, i) => ({ id: nextId++, x: x + (i - 1) * 24, y, glyph: glyphs[(pets + i) % glyphs.length]! }));
    hearts = [...hearts, ...batch];
    setTimeout(() => (hearts = hearts.filter((h) => !batch.includes(h))), 1200);
  }
</script>

<div class="mascot">
  <button type="button" onclick={pet} aria-label="Pet Cat and Capy">
    {#key squish}
      <img {src} {srcset} sizes="(max-width: 820px) 220px, 320px" {width} {height} alt="Illustration of a smiling grey cat riding on a happy capybara" loading="lazy" class:squish={squish > 0} />
    {/key}
    {#each hearts as h (h.id)}
      <span class="heart" style="left:{h.x}px;top:{h.y}px">{h.glyph}</span>
    {/each}
  </button>
  <p class="count" aria-live="polite">{message}{#if pets > 0}<small> · {pets} {pets === 1 ? "pet" : "pets"}</small>{/if}</p>
</div>

<style>
  .mascot { position: relative; display: grid; justify-items: center; }
  .mascot::before {
    content: ""; position: absolute; inset: 10% 0 15%;
    background: radial-gradient(closest-side, var(--sun), transparent);
    opacity: .55; z-index: 0;
  }
  button { position: relative; z-index: 1; border: 0; background: none; padding: 0; cursor: pointer; }
  img { width: min(320px, 70vw); height: auto; animation: bob 4s ease-in-out infinite; transform-origin: 50% 100%; }
  img.squish { animation: squish .45s cubic-bezier(.3, 1.6, .5, 1), bob 4s ease-in-out .45s infinite; }
  @media (max-width: 820px) { img { width: min(220px, 60vw); } }
  @keyframes bob { 50% { transform: translateY(-10px) rotate(-1.5deg); } }
  @keyframes squish {
    0% { transform: scale(1.15, .82); }
    60% { transform: scale(.95, 1.06); }
    100% { transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce) { img, img.squish { animation: none; } }
  .heart {
    position: absolute; font-size: 1.6rem; pointer-events: none; translate: -50% -50%;
    animation: float 1.2s ease-out forwards;
  }
  @keyframes float {
    to { transform: translateY(-110px) scale(1.4); opacity: 0; }
  }
  .count {
    position: relative; z-index: 1; margin: 8px 0 0;
    font: 400 1.1rem var(--display); color: var(--navy);
    background: #fff; border: 2px solid var(--navy); border-radius: 999px; padding: 4px 14px;
  }
  .count small { font: 700 .8rem var(--body); color: var(--ink-soft); }
</style>
