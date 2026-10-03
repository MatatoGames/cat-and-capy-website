<script lang="ts">
  import { onMount } from "svelte";
  import { cats, catImage, type Cat } from "../lib/cats";
  import { meow } from "../lib/sound";

  interface Floater {
    key: number;
    cat: Cat;
    left: number;
    size: number;
    duration: number;
    delay: number;
    sway: number;
    popped: boolean;
  }

  interface Props {
    count?: number;
  }
  let { count = 8 }: Props = $props();

  let floaters = $state<Floater[]>([]);
  let nextKey = 0;

  function make(initial: boolean): Floater {
    const cat = cats[Math.floor(Math.random() * cats.length)]!;
    const duration = 16 + Math.random() * 14;
    return {
      key: nextKey++,
      cat,
      left: Math.random() * 92,
      size: 48 + Math.random() * 40,
      duration,
      // Negative delays spread the first batch over the whole screen
      delay: initial ? -Math.random() * duration : 0,
      sway: (Math.random() - 0.5) * 80,
      popped: false,
    };
  }

  function replace(key: number): void {
    floaters = floaters.map((f) => (f.key === key ? make(false) : f));
  }

  function popCat(f: Floater): void {
    if (f.popped) return;
    meow(f.cat.pitch, f.cat.voice);
    floaters = floaters.map((x) => (x.key === f.key ? { ...x, popped: true } : x));
    setTimeout(() => replace(f.key), 450);
  }

  onMount(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    floaters = Array.from({ length: count }, () => make(true));
  });
</script>

<div class="sky" aria-hidden="true">
  {#each floaters as f (f.key)}
    <button
      type="button"
      tabindex="-1"
      class="floater"
      class:popped={f.popped}
      style="left:{f.left}%;width:{f.size}px;--dur:{f.duration}s;--delay:{f.delay}s;--sway:{f.sway}px"
      onclick={() => popCat(f)}
      onanimationend={(e) => { if (e.animationName.includes("rise")) replace(f.key); }}
    >
      <img src={catImage(f.cat.id)} alt="" draggable="false" />
    </button>
  {/each}
</div>

<style>
  /* Sized to the large viewport (address bar hidden) so the cats don't jump when the
     mobile address bar slides in and out; the extra bit just sits under the bar */
  .sky {
    position: fixed; top: 0; left: 0; right: 0;
    height: 100vh; height: 100lvh;
    overflow: hidden; z-index: 0; pointer-events: none;
  }
  .floater {
    position: absolute; bottom: -120px; padding: 0; border: 0; background: none;
    pointer-events: auto; cursor: pointer; opacity: .55;
    animation: rise var(--dur) linear var(--delay) forwards;
    -webkit-tap-highlight-color: transparent;
  }
  .floater img { width: 100%; height: auto; display: block; animation: bob 3s ease-in-out infinite alternate; }
  .floater:hover { opacity: .9; }
  .floater.popped { animation: rise var(--dur) linear var(--delay) forwards paused; }
  .floater.popped img { animation: poof .45s ease-out forwards; }

  @keyframes rise {
    from { transform: translate(0, 0) rotate(-6deg); }
    50% { transform: translate(var(--sway), -60lvh) rotate(6deg); }
    to { transform: translate(0, calc(-100lvh - 240px)) rotate(-6deg); }
  }
  @keyframes bob { to { translate: 0 -8px; } }
  @keyframes poof {
    40% { transform: scale(1.4); opacity: 1; }
    to { transform: scale(.2); opacity: 0; }
  }
</style>
