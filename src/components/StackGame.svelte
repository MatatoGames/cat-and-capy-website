<script lang="ts">
  import { onMount } from "svelte";
  import { StackGame } from "../lib/stack-game";

  const BEST_KEY = "cac-stack-best";

  let canvas: HTMLCanvasElement;
  let wrap: HTMLDivElement;
  let game: StackGame | undefined;

  let state = $state<"loading" | "ready" | "playing" | "over">("loading");
  let score = $state(0);
  let lives = $state(3);
  let best = $state(0);
  let newBest = $state(false);
  let shareLabel = $state("Share score");

  function readBest(): number {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  function saveBest(value: number): void {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch {
      /* storage unavailable */
    }
  }

  function play(): void {
    if (!game) return;
    newBest = false;
    shareLabel = "Share score";
    state = "playing";
    game.start();
    canvas.focus({ preventScroll: true });
  }

  async function share(): Promise<void> {
    const text = `I stacked ${score} cats on Capy in Cat & Capy! 🐱🦫`;
    const url = "https://catandcapy.com/#game";
    try {
      if (navigator.share) {
        await navigator.share({ title: "Stack the cats", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        shareLabel = "Copied!";
      }
    } catch {
      /* share sheet dismissed */
    }
  }

  function onKey(e: KeyboardEvent, down: boolean): void {
    if (!game?.isRunning) return;
    const left = e.key === "ArrowLeft" || e.key.toLowerCase() === "a";
    const right = e.key === "ArrowRight" || e.key.toLowerCase() === "d";
    if (!left && !right) return;
    e.preventDefault();
    game.setKeyDirection(down ? (left ? -1 : 1) : 0);
  }

  onMount(() => {
    best = readBest();
    game = new StackGame(canvas, {
      onScore: (s) => (score = s),
      onLives: (l) => (lives = l),
      onGameOver: (s) => {
        if (s > best) {
          best = s;
          newBest = true;
          saveBest(s);
        }
        state = "over";
      },
    });
    game.load().then(() => (state = "ready"));

    const ro = new ResizeObserver(() => game?.resize());
    ro.observe(wrap);

    // Pause when scrolled away or the tab is hidden, to save battery on phones
    let visible = true;
    const sync = () => game?.setPaused(!visible || document.hidden);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      sync();
    }, { threshold: 0.25 });
    io.observe(wrap);
    document.addEventListener("visibilitychange", sync);

    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      game?.destroy();
    };
  });
</script>

<div class="game" bind:this={wrap} class:playing={state === "playing"}>
  <canvas
    bind:this={canvas}
    tabindex="-1"
    aria-label="Stack the cats game. Move Capy left and right to catch falling cats."
    onpointermove={(e) => game?.pointTo(e.clientX)}
    onpointerdown={(e) => game?.pointTo(e.clientX)}
  ></canvas>

  <div class="hud" aria-live="polite">
    <span class="pill">🐱 {score}</span>
    <span class="pill lives" aria-label="{lives} lives left">
      {#each [0, 1, 2] as i (i)}
        <span class:gone={i >= lives}>❤️</span>
      {/each}
    </span>
    <span class="pill">🏆 {best}</span>
  </div>

  {#if state !== "playing"}
    <div class="overlay">
      {#if state === "over"}
        <p class="big">{newBest ? "New record!" : "Tower toppled!"}</p>
        <p>You stacked <strong>{score}</strong> {score === 1 ? "cat" : "cats"} on Capy.</p>
        <div class="row">
          <button class="btn btn--sun" type="button" onclick={play}>Play again</button>
          <button class="btn btn--ghost" type="button" onclick={share}>{shareLabel}</button>
        </div>
      {:else}
        <p class="big">Stack the cats!</p>
        <p>Move Capy to catch falling cats. Dodge the birds 🐦, grab fish 🐟 for an extra life.</p>
        <button class="btn btn--sun" type="button" onclick={play} disabled={state === "loading"}>
          {state === "loading" ? "Loading cats…" : "Start"}
        </button>
        <p class="hint">Mouse, finger or ← → keys</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .game {
    position: relative;
    width: 100%;
    max-width: 760px;
    margin: 32px auto 0;
    aspect-ratio: 4 / 5;
    max-height: 78vh;
    border-radius: 24px;
    overflow: hidden;
    border: 3px solid var(--navy);
    box-shadow: 0 8px 0 var(--navy);
    background:
      radial-gradient(circle at 80% 12%, #fff6c9 0 40px, transparent 41px),
      linear-gradient(#8fd3ff, #d9f1ff 70%);
    user-select: none;
    -webkit-user-select: none;
  }
  @media (min-width: 700px) {
    .game { aspect-ratio: 4 / 3; }
  }
  .playing canvas { touch-action: none; cursor: none; }
  canvas { display: block; width: 100%; height: 100%; outline: none; }

  .hud {
    position: absolute; top: 12px; left: 12px; right: 12px;
    display: flex; justify-content: space-between; gap: 8px; pointer-events: none;
  }
  .pill {
    background: rgba(255, 255, 255, .85); border: 2px solid var(--navy); border-radius: 999px;
    padding: 4px 12px; font: 400 1.1rem var(--display); color: var(--navy);
  }
  .lives span { transition: opacity .2s, filter .2s; }
  .lives .gone { opacity: .35; filter: grayscale(1); }

  .overlay {
    position: absolute; inset: 0; display: grid; place-content: center; justify-items: center;
    gap: 6px; padding: 24px; text-align: center;
    background: rgba(30, 27, 58, .55); color: #fff;
    backdrop-filter: blur(2px);
  }
  .overlay p { margin: 0 0 6px; max-width: 26em; font-weight: 700; }
  .big { font: 400 clamp(2rem, 7vw, 3rem)/1 var(--display); color: var(--sun); text-shadow: 0 3px 0 var(--berry); }
  .hint { font-size: .85rem; opacity: .8; margin-top: 8px !important; }
  .row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
  .overlay .btn { margin-top: 8px; font-size: 1.2rem; }
  .btn--ghost { background: #fff; color: var(--navy); }
  button:disabled { opacity: .7; cursor: progress; }
</style>
