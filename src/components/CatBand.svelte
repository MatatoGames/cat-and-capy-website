<script lang="ts">
  import { stickerImage } from "../lib/cats";
  import { pop } from "../lib/sound";

  // Five cats, five notes of a major pentatonic scale
  const band = [
    { id: "BeanTheChonk", note: 1 },
    { id: "Lucy", note: 9 / 8 },
    { id: "TysonCat", note: 5 / 4 },
    { id: "WalterEugene", note: 3 / 2 },
    { id: "LilGoob", note: 5 / 3 },
  ];

  let hits = $state<number[]>(band.map(() => 0));
  let notes = $state<{ key: number; x: number }[]>([]);
  let nextKey = 0;

  function play(i: number): void {
    pop(band[i]!.note);
    hits[i] = (hits[i] ?? 0) + 1;
    const key = nextKey++;
    notes = [...notes, { key, x: i }];
    setTimeout(() => (notes = notes.filter((n) => n.key !== key)), 900);
  }
</script>

<div class="band" role="group" aria-label="Tap the cats to play notes">
  {#each band as cat, i (cat.id)}
    <button type="button" class="cat" style="--i:{i}" onpointerdown={() => play(i)} onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(i); } }} aria-label="Play note {i + 1}">
      {#key hits[i]}
        <img src={stickerImage(cat.id)} alt="" draggable="false" class:hit={(hits[i] ?? 0) > 0} />
      {/key}
    </button>
  {/each}
  {#each notes as n (n.key)}
    <span class="note" style="--x:{n.x}" aria-hidden="true">{n.key % 2 ? "♪" : "♫"}</span>
  {/each}
</div>
<p class="hint">Tap the cats to play!</p>

<style>
  .band {
    position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px; max-width: 520px; margin: 0 auto; align-items: end;
  }
  .cat {
    padding: 0; border: 0; background: none; cursor: pointer; touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    /* bob on a 100 bpm beat, each cat a step behind the last */
    animation: beat .6s ease-in-out infinite alternate;
    animation-delay: calc(var(--i) * -0.12s);
  }
  .cat img { width: 100%; height: auto; display: block; transform-origin: 50% 100%; }
  .cat img.hit { animation: hit .35s cubic-bezier(.3, 1.8, .5, 1); }
  @keyframes beat { to { transform: translateY(-10px); } }
  @keyframes hit {
    0% { transform: scale(1.25, .75); }
    100% { transform: scale(1); }
  }
  @media (prefers-reduced-motion: reduce) { .cat { animation: none; } }

  .note {
    position: absolute; bottom: 70%; left: calc((var(--x) + .5) * 20%);
    font-size: 2rem; color: var(--sun); text-shadow: 0 2px 0 var(--berry); pointer-events: none;
    translate: -50% 0; animation: float .9s ease-out forwards;
  }
  @keyframes float { to { transform: translateY(-70px) rotate(15deg); opacity: 0; } }

  .hint { margin: 10px 0 0; text-align: center; font-weight: 800; font-size: .9rem; color: rgba(255, 255, 255, .7); }
</style>
