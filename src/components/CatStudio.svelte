<script lang="ts">
  import { cats, catImage, type Cat } from "../lib/cats";
  import { meow } from "../lib/sound";

  let selectedId = $state(cats[1]!.id);
  let bounce = $state(0);

  const selected = $derived(cats.find((c) => c.id === selectedId) ?? cats[0]!);

  function pick(cat: Cat): void {
    selectedId = cat.id;
    bounce++;
    meow(cat.pitch, cat.voice);
  }

  function pet(): void {
    bounce++;
    meow(selected.pitch, selected.voice);
  }

  function surprise(): void {
    const others = cats.filter((c) => c.id !== selectedId);
    pick(others[Math.floor(Math.random() * others.length)]!);
  }
</script>

<div class="studio">
  <div class="panel">
    <div class="stage">
      {#key selectedId + "-" + bounce}
        <button class="cat" type="button" onclick={pet} aria-label="Pet {selected.name}">
          <img src={catImage(selectedId)} alt={selected.name} draggable="false" />
        </button>
      {/key}
      <p class="tip">Tap {selected.name.split(" ")[0]} to say hi!</p>
    </div>

    <div class="bio" aria-live="polite">
      <h3>{selected.name}</h3>
      <p>{selected.bio}</p>
      {#if selected.instagram}
        <a href="https://www.instagram.com/{selected.instagram}" target="_blank" rel="noopener">@{selected.instagram} on Instagram</a>
      {/if}
    </div>

    <button class="btn btn--sun" type="button" onclick={surprise}>🎲 Surprise me</button>
  </div>

  <div class="side">
    <h3 class="label">Pick a cat</h3>
    <ul class="roster" role="list">
      {#each cats as cat (cat.id)}
        <li>
          <button type="button" class:selected={cat.id === selectedId} aria-pressed={cat.id === selectedId} onclick={() => pick(cat)} title={cat.name}>
            <img src={catImage(cat.id)} alt="" loading="lazy" width="80" height="80" draggable="false" />
            <span>{cat.name.split(" ")[0]}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  .studio {
    display: grid;
    grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr);
    gap: clamp(20px, 4vw, 40px);
    margin-top: 32px;
    align-items: start;
  }
  @media (max-width: 860px) {
    .studio { grid-template-columns: minmax(0, 1fr); }
  }

  .panel {
    background: #fff; border: 3px solid var(--navy); border-radius: 26px;
    box-shadow: 0 6px 0 var(--navy); padding: 16px;
  }
  .stage {
    position: relative; aspect-ratio: 1; border-radius: 18px; overflow: hidden;
    background: radial-gradient(circle at 50% 45%, #fff1a8, var(--sun) 75%);
  }
  .cat {
    position: absolute; left: 50%; bottom: 6%; width: 72%; translate: -50% 0;
    padding: 0; border: 0; background: none; cursor: pointer;
    animation: boing .5s cubic-bezier(.3, 1.6, .5, 1);
    transform-origin: 50% 100%;
  }
  .cat img { width: 100%; height: auto; display: block; filter: drop-shadow(0 10px 8px rgba(30, 27, 58, .25)); }
  @keyframes boing {
    0% { transform: scale(.6, 1.3); }
    50% { transform: scale(1.12, .9); }
    100% { transform: scale(1, 1); }
  }
  @media (prefers-reduced-motion: reduce) { .cat { animation: none; } }
  .tip {
    position: absolute; top: 10px; left: 0; right: 0; margin: 0; text-align: center;
    font-weight: 800; color: var(--navy); opacity: .7; font-size: .95rem; pointer-events: none;
  }

  .bio { margin-top: 14px; min-height: 120px; }
  .bio h3 { color: var(--navy); margin-bottom: .3em; }
  .bio p { color: var(--ink-soft); margin-bottom: .4em; }
  .bio a { font-weight: 800; color: var(--berry); }
  .panel .btn { margin-top: 12px; font-size: 1rem; padding: .55em 1.1em; cursor: pointer; }

  .label { font-size: 1.15rem; color: var(--navy); margin: 0 0 10px; }

  .roster {
    list-style: none; padding: 0; margin: 0;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(82px, 1fr)); gap: 10px;
  }
  .roster button {
    width: 100%; padding: 8px 4px 6px; border-radius: 16px; cursor: pointer;
    border: 2.5px solid var(--navy); background: #fff; color: var(--navy);
    display: grid; justify-items: center; gap: 2px;
    box-shadow: 0 3px 0 var(--navy); transition: transform .15s, background .15s;
  }
  .roster button:hover { transform: translateY(-3px) rotate(-3deg); }
  .roster li:nth-child(even) button:hover { transform: translateY(-3px) rotate(3deg); }
  .roster button.selected { background: var(--sun); transform: translateY(-2px); }
  .roster img { width: 60px; height: 52px; object-fit: contain; pointer-events: none; }
  .roster span { font: 800 .75rem/1.1 var(--body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
</style>
