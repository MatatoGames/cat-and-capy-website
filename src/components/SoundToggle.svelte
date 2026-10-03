<script lang="ts">
  import { onMount } from "svelte";
  import { isMuted, onMutedChange, setMuted, pop } from "../lib/sound";

  let muted = $state(false);

  onMount(() => {
    muted = isMuted();
    return onMutedChange((m) => (muted = m));
  });

  function toggle(): void {
    setMuted(!muted);
    if (!muted) pop();
  }
</script>

<button type="button" onclick={toggle} aria-pressed={!muted} aria-label={muted ? "Turn sound on" : "Turn sound off"} title={muted ? "Sound off" : "Sound on"}>
  {muted ? "🔇" : "🔊"}
</button>

<style>
  button {
    width: 40px; height: 40px; border-radius: 50%; border: 0; cursor: pointer;
    background: rgba(255, 255, 255, .12); font-size: 1.1rem; transition: background .15s, transform .15s;
  }
  button:hover { background: rgba(255, 255, 255, .22); transform: rotate(-8deg); }
</style>
