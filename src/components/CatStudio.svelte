<script lang="ts">
  import { onMount } from "svelte";
  import { cats, hats, catImage, hatImage, type Cat } from "../lib/cats";
  import { meow, pop } from "../lib/sound";

  interface PlacedHat {
    uid: number;
    hatId: string;
    /** center, in % of the stage */
    x: number;
    y: number;
    /** width, in % of the stage */
    w: number;
    rot: number;
  }

  const OUTFITS_KEY = "cac-outfits";
  const DRAG_THRESHOLD = 6;

  let selectedId = $state(cats[1]!.id);
  let outfits = $state<Record<string, PlacedHat[]>>({});
  let activeUid = $state<number | null>(null);
  let bounce = $state(0);
  let saving = $state(false);
  let ghost = $state<{ hatId: string; x: number; y: number } | null>(null);

  let stage: HTMLDivElement;
  let catEl: HTMLImageElement;
  let nextUid = 1;

  const selected = $derived(cats.find((c) => c.id === selectedId) ?? cats[0]!);
  const placed = $derived(outfits[selectedId] ?? []);
  const active = $derived(placed.find((h) => h.uid === activeUid));

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(OUTFITS_KEY) ?? "{}") as Record<string, PlacedHat[]>;
      outfits = saved;
      nextUid = Math.max(0, ...Object.values(saved).flat().map((h) => h.uid)) + 1;
    } catch {
      /* nothing saved yet */
    }
  });

  function persist(): void {
    try {
      localStorage.setItem(OUTFITS_KEY, JSON.stringify(outfits));
    } catch {
      /* storage unavailable */
    }
  }

  function setPlaced(list: PlacedHat[]): void {
    outfits = { ...outfits, [selectedId]: list };
    persist();
  }

  function pick(cat: Cat): void {
    selectedId = cat.id;
    activeUid = null;
    bounce++;
    meow(cat.pitch, cat.voice);
  }

  function pet(): void {
    bounce++;
    meow(selected.pitch, selected.voice);
  }

  /** Where a hat sits by default: centered on the top of the cat. */
  function headSpot(): { x: number; y: number } {
    const s = stage.getBoundingClientRect();
    const c = catEl.getBoundingClientRect();
    return {
      x: ((c.left + c.width / 2 - s.left) / s.width) * 100,
      y: ((c.top - s.top) / s.height) * 100 + 6,
    };
  }

  function addHat(hatId: string, at?: { x: number; y: number }): void {
    const spot = at ?? headSpot();
    const hat: PlacedHat = { uid: nextUid++, hatId, x: spot.x, y: spot.y, w: 34, rot: 0 };
    setPlaced([...placed, hat]);
    activeUid = hat.uid;
    pop(1.2);
  }

  function update(uid: number, patch: Partial<PlacedHat>): void {
    setPlaced(placed.map((h) => (h.uid === uid ? { ...h, ...patch } : h)));
  }

  function removeActive(): void {
    if (activeUid === null) return;
    setPlaced(placed.filter((h) => h.uid !== activeUid));
    activeUid = null;
    pop(0.7);
  }

  function clearAll(): void {
    setPlaced([]);
    activeUid = null;
    pop(0.7);
  }

  function randomOutfit(): void {
    const spot = headSpot();
    const first = hats[Math.floor(Math.random() * hats.length)]!;
    const list: PlacedHat[] = [{ uid: nextUid++, hatId: first.id, x: spot.x, y: spot.y, w: 30 + Math.random() * 12, rot: (Math.random() - 0.5) * 30 }];
    if (Math.random() < 0.4) {
      list.push({ uid: nextUid++, hatId: "Mustache", x: spot.x + 4, y: spot.y + 22, w: 22, rot: 0 });
    }
    setPlaced(list);
    activeUid = null;
    bounce++;
    meow(selected.pitch, selected.voice);
  }

  function toStagePercent(clientX: number, clientY: number): { x: number; y: number; inside: boolean } {
    const r = stage.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 100;
    const y = ((clientY - r.top) / r.height) * 100;
    return { x, y, inside: x >= 0 && x <= 100 && y >= 0 && y <= 100 };
  }

  // Dragging a hat that's already on the cat
  function startMove(e: PointerEvent, hat: PlacedHat): void {
    e.preventDefault();
    activeUid = hat.uid;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const start = toStagePercent(e.clientX, e.clientY);
    const origin = { x: hat.x, y: hat.y };
    const move = (ev: PointerEvent) => {
      const p = toStagePercent(ev.clientX, ev.clientY);
      update(hat.uid, {
        x: Math.max(0, Math.min(100, origin.x + p.x - start.x)),
        y: Math.max(0, Math.min(100, origin.y + p.y - start.y)),
      });
    };
    const end = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  // Dragging from the hat rack onto the stage (a plain tap puts it on the head)
  function startRackDrag(e: PointerEvent, hatId: string): void {
    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      if (!dragging && Math.hypot(ev.clientX - startX, ev.clientY - startY) > DRAG_THRESHOLD) dragging = true;
      if (dragging) ghost = { hatId, x: ev.clientX, y: ev.clientY };
    };
    const end = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", cancel);
      ghost = null;
      if (!dragging) {
        addHat(hatId);
        return;
      }
      const p = toStagePercent(ev.clientX, ev.clientY);
      if (p.inside) addHat(hatId, p);
    };
    const cancel = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", cancel);
      ghost = null;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", cancel);
  }

  function onWheel(e: WheelEvent, hat: PlacedHat): void {
    e.preventDefault();
    update(hat.uid, { w: Math.max(8, Math.min(90, hat.w - Math.sign(e.deltaY) * 2)) });
  }

  function onStageKey(e: KeyboardEvent): void {
    if (!active) return;
    const step = e.shiftKey ? 5 : 1;
    const moves: Record<string, Partial<PlacedHat>> = {
      ArrowLeft: { x: active.x - step },
      ArrowRight: { x: active.x + step },
      ArrowUp: { y: active.y - step },
      ArrowDown: { y: active.y + step },
    };
    const patch = moves[e.key];
    if (patch) {
      e.preventDefault();
      update(active.uid, patch);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      removeActive();
    }
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function savePicture(): Promise<void> {
    saving = true;
    try {
      await document.fonts.ready;
      const size = 1080;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      const bg = ctx.createRadialGradient(size / 2, size * 0.45, 50, size / 2, size / 2, size * 0.75);
      bg.addColorStop(0, "#fff1a8");
      bg.addColorStop(1, "#ffd34e");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      const s = stage.getBoundingClientRect();
      const c = catEl.getBoundingClientRect();
      const k = size / s.width;
      const catImg = await loadImage(catImage(selectedId));
      ctx.drawImage(catImg, (c.left - s.left) * k, (c.top - s.top) * k, c.width * k, c.height * k);

      for (const h of placed) {
        const img = await loadImage(hatImage(h.hatId));
        const w = (h.w / 100) * size;
        const hgt = w * (img.height / img.width);
        ctx.save();
        ctx.translate((h.x / 100) * size, (h.y / 100) * size);
        ctx.rotate((h.rot * Math.PI) / 180);
        ctx.drawImage(img, -w / 2, -hgt / 2, w, hgt);
        ctx.restore();
      }

      ctx.fillStyle = "#1e1b3a";
      ctx.textAlign = "center";
      ctx.font = "64px 'Lilita One', sans-serif";
      ctx.fillText(selected.name, size / 2, 96);
      ctx.font = "36px 'Lilita One', sans-serif";
      ctx.fillStyle = "#a8283a";
      ctx.fillText("catandcapy.com", size / 2, size - 44);

      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
      if (!blob) return;
      const file = new File([blob], `${selectedId}-cat-and-capy.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${selected.name} in Cat & Capy` }).catch(() => {});
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } finally {
      saving = false;
    }
  }
</script>

<div class="studio">
  <div class="panel">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="stage"
      bind:this={stage}
      tabindex="0"
      role="application"
      aria-label="Dress-up stage. Select a hat, then use arrow keys to move it or Delete to remove it."
      onkeydown={onStageKey}
      onpointerdown={(e) => { if (e.target === stage) activeUid = null; }}
    >
      {#key selectedId + "-" + bounce}
        <button class="cat" type="button" onclick={pet} aria-label="Pet {selected.name}">
          <img bind:this={catEl} src={catImage(selectedId)} alt={selected.name} draggable="false" />
        </button>
      {/key}

      {#each placed as hat (hat.uid)}
        <img
          class="hat"
          class:active={hat.uid === activeUid}
          src={hatImage(hat.hatId)}
          alt={hats.find((h) => h.id === hat.hatId)?.name ?? "Hat"}
          draggable="false"
          style="left:{hat.x}%;top:{hat.y}%;width:{hat.w}%;--rot:{hat.rot}deg"
          onpointerdown={(e) => startMove(e, hat)}
          onwheel={(e) => onWheel(e, hat)}
        />
      {/each}

      {#if placed.length === 0}
        <p class="tip">Tap a hat below, or drag it onto {selected.name.split(" ")[0]}!</p>
      {/if}
    </div>

    <div class="tools" class:dim={!active}>
      <button type="button" onclick={() => active && update(active.uid, { w: Math.max(8, active.w - 4) })} disabled={!active} aria-label="Smaller">➖</button>
      <button type="button" onclick={() => active && update(active.uid, { w: Math.min(90, active.w + 4) })} disabled={!active} aria-label="Bigger">➕</button>
      <button type="button" onclick={() => active && update(active.uid, { rot: active.rot - 12 })} disabled={!active} aria-label="Rotate left">↺</button>
      <button type="button" onclick={() => active && update(active.uid, { rot: active.rot + 12 })} disabled={!active} aria-label="Rotate right">↻</button>
      <button type="button" onclick={removeActive} disabled={!active} aria-label="Remove hat">🗑️</button>
    </div>

    <div class="bio">
      <h3>{selected.name}</h3>
      <p>{selected.bio}</p>
      {#if selected.instagram}
        <a href="https://www.instagram.com/{selected.instagram}" target="_blank" rel="noopener">@{selected.instagram} on Instagram</a>
      {/if}
    </div>

    <div class="actions">
      <button class="btn btn--sun" type="button" onclick={randomOutfit}>🎲 Random outfit</button>
      <button class="btn btn--white" type="button" onclick={savePicture} disabled={saving}>📸 {saving ? "Saving…" : "Save picture"}</button>
      <button class="btn btn--white" type="button" onclick={clearAll} disabled={placed.length === 0}>Clear</button>
    </div>
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

    <h3 class="label">Hats</h3>
    <ul class="rack" role="list">
      {#each hats as hat (hat.id)}
        <li>
          <button type="button" title={hat.name} aria-label="Add {hat.name}" onpointerdown={(e) => startRackDrag(e, hat.id)} onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); addHat(hat.id); } }}>
            <img src={hatImage(hat.id)} alt="" loading="lazy" draggable="false" />
          </button>
        </li>
      {/each}
    </ul>
  </div>
</div>

{#if ghost}
  <img class="ghost" src={hatImage(ghost.hatId)} alt="" style="left:{ghost.x}px;top:{ghost.y}px" />
{/if}

<style>
  .studio {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
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
    touch-action: none; outline: none;
  }
  .stage:focus-visible { box-shadow: 0 0 0 3px var(--orange); }
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
  .hat {
    position: absolute; translate: -50% -50%; rotate: var(--rot);
    cursor: grab; touch-action: none; user-select: none;
    filter: drop-shadow(0 3px 2px rgba(0, 0, 0, .2));
    animation: drop .35s cubic-bezier(.3, 1.5, .5, 1);
  }
  .hat:active { cursor: grabbing; }
  .hat.active { outline: 2px dashed var(--navy); outline-offset: 4px; border-radius: 8px; }
  @keyframes drop { from { transform: translateY(-40px) scale(.7); opacity: 0; } }
  .tip {
    position: absolute; top: 10px; left: 0; right: 0; margin: 0; text-align: center;
    font-weight: 800; color: var(--navy); opacity: .7; font-size: .95rem; pointer-events: none;
  }

  .tools { display: flex; justify-content: center; gap: 8px; margin-top: 12px; transition: opacity .2s; }
  .tools.dim { opacity: .4; }
  .tools button {
    width: 44px; height: 44px; border-radius: 12px; border: 2px solid var(--navy);
    background: var(--cream); font-size: 1.15rem; cursor: pointer; color: var(--navy);
  }
  .tools button:not(:disabled):hover { background: var(--cream-2); }

  .bio { margin-top: 14px; min-height: 120px; }
  .bio h3 { color: var(--navy); margin-bottom: .3em; }
  .bio p { color: var(--ink-soft); margin-bottom: .4em; }
  .bio a { font-weight: 800; color: var(--berry); }

  .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
  .actions .btn { font-size: 1rem; padding: .55em 1.1em; }
  .btn--white { background: #fff; color: var(--navy); }
  .actions button:disabled { opacity: .5; cursor: default; }

  .label { font-size: 1.15rem; color: var(--navy); margin: 0 0 10px; }
  .label:not(:first-child) { margin-top: 24px; }

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

  .rack {
    list-style: none; padding: 4px 2px 10px; margin: 0;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px;
  }
  @media (max-width: 860px) {
    .rack { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; touch-action: pan-x; }
    .rack li { flex: 0 0 68px; scroll-snap-align: start; }
  }
  .rack button {
    width: 100%; aspect-ratio: 1; padding: 8px; border-radius: 14px; cursor: grab; overflow: hidden;
    border: 2px solid var(--navy); background: var(--cream);
    display: grid; place-items: center; touch-action: pan-x; transition: transform .15s, background .15s;
  }
  .rack button:hover { transform: scale(1.08) rotate(-4deg); background: #fff; }
  .rack img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }

  .ghost {
    position: fixed; width: 110px; translate: -50% -50%; pointer-events: none; z-index: 100;
    filter: drop-shadow(0 8px 6px rgba(0, 0, 0, .3)); rotate: -8deg;
  }
</style>
