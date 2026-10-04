<script lang="ts">
  import { KIT_FORM_ID, RHYTHM_TAG_ID, kitSubscribeUrl } from "../lib/newsletter";
  import { stickerImage } from "../lib/cats";
  import { pop } from "../lib/sound";

  interface Props {
    /** "full" for the main page section, "compact" for the links page */
    variant?: "full" | "compact";
  }
  let { variant = "full" }: Props = $props();

  let email = $state("");
  let rhythm = $state(false);
  let honeypot = $state("");
  let status = $state<"idle" | "sending" | "done" | "error">("idle");
  let errorText = $state("");

  const uid = Math.random().toString(36).slice(2, 8);
  const action = KIT_FORM_ID ? kitSubscribeUrl(KIT_FORM_ID) : "";
  const celebrate = ["BeanTheChonk", "Lucy", "TysonCat", "WalterEugene", "ChocoHanakuso"];

  async function submit(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    if (status === "sending") return;
    if (honeypot) {
      status = "done"; // quietly ignore bots
      return;
    }
    status = "sending";
    errorText = "";

    // Local preview without a Kit form: pretend it worked so the flow can be tested
    if (!KIT_FORM_ID) {
      await new Promise((r) => setTimeout(r, 600));
      status = "done";
      pop(1.3);
      return;
    }

    const body = new FormData();
    body.append("email_address", email.trim());
    if (rhythm && RHYTHM_TAG_ID) body.append("tags[]", RHYTHM_TAG_ID);

    try {
      const res = await fetch(action, { method: "POST", body, headers: { Accept: "application/json" } });
      const data = (await res.json().catch(() => ({}))) as { status?: string; errors?: { messages?: string[] } };
      if (res.ok && data.status !== "failed") {
        status = "done";
        pop(1.3);
      } else {
        status = "error";
        errorText = data.errors?.messages?.[0] ?? "That didn't work. Check the email address and try again.";
      }
    } catch {
      status = "error";
      errorText = "Couldn't reach the signup service. Check your connection and try again.";
    }
  }
</script>

<div class="signup {variant}">
  {#if status === "done"}
    <div class="done" role="status">
      <div class="cats" aria-hidden="true">
        {#each celebrate as id, i (id)}
          <img src={stickerImage(id)} alt="" style="--i:{i}" />
        {/each}
      </div>
      <p class="big">Almost there!</p>
      <p>Check your inbox and click the link to confirm. Then you're on the list. 🐾</p>
    </div>
  {:else}
    <form method="post" {action} onsubmit={submit}>
      <label class="visually-hidden" for="email-{uid}">Email address</label>
      <input
          id="email-{uid}"
          type="email"
          name="email_address"
          required
          autocomplete="email"
          inputmode="email"
          placeholder="you@example.com"
          bind:value={email}
          disabled={status === "sending"}
        />

      <label class="check">
        <input type="checkbox" name="tags[]" value={RHYTHM_TAG_ID} bind:checked={rhythm} disabled={status === "sending"} />
        <span>🎵 I'd like a chance to <strong>playtest the upcoming Cat &amp; Capy rhythm game</strong> on mobile. Testers are picked from this list!</span>
      </label>

      <button class="btn btn--sun submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Signing up…" : "Sign me up"}
      </button>

      <!-- Bots fill in fields people can't see -->
      <input class="visually-hidden" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" bind:value={honeypot} />

      {#if status === "error"}
        <p class="error" role="alert">{errorText}</p>
      {/if}

      <p class="fine">
        Occasional emails about Cat &amp; Capy: updates, new cats and new games. No spam, unsubscribe anytime.
        <a href="https://matatogames.com/catandcapy-privacy-policy.html" target="_blank" rel="noopener">Privacy policy</a>
      </p>
    </form>
  {/if}
</div>

<style>
  .signup {
    background: #fff; border: 3px solid var(--navy); border-radius: 24px;
    box-shadow: 0 6px 0 var(--navy); padding: clamp(18px, 4vw, 28px);
    text-align: left; color: var(--navy);
  }
  .full { max-width: 640px; margin: 28px auto 0; }

  input[type="email"] {
    display: block; width: 100%; font: 700 1.05rem var(--body); color: var(--navy);
    padding: 12px 16px; border-radius: 14px; border: 2.5px solid var(--navy); background: var(--cream);
  }
  input[type="email"]::placeholder { color: #8a83a0; }
  input[type="email"]:focus { outline: 3px solid var(--orange); outline-offset: 1px; background: #fff; }
  .submit { margin-top: 14px; cursor: pointer; font-size: 1.1rem; }
  .submit:disabled { opacity: .7; cursor: progress; }
  @media (max-width: 480px) { .submit { width: 100%; } }

  .check {
    display: flex; gap: 10px; align-items: flex-start; margin-top: 12px; cursor: pointer;
    font-weight: 700; font-size: .95rem; line-height: 1.4; color: var(--ink);
    background: var(--cream-2); border-radius: 14px; padding: 10px 12px;
  }
  .check input { flex: none; width: 20px; height: 20px; margin-top: 1px; accent-color: var(--berry); }

  .fine { margin: 12px 0 0; font-size: .8rem; color: var(--ink-soft); }
  .fine a { color: var(--berry); font-weight: 800; }
  .error { margin: 10px 0 0; color: var(--berry); font-weight: 800; }

  .done { text-align: center; padding: 6px 0; }
  .done .big { font: 400 1.8rem var(--display); color: var(--navy); margin: 8px 0 4px; }
  .done p { margin: 0; font-weight: 700; color: var(--ink-soft); }
  .cats { display: flex; justify-content: center; height: 72px; }
  .cats img {
    width: 64px; height: auto; margin: 0 -8px; align-self: flex-end;
    animation: hop .6s cubic-bezier(.3, 1.6, .5, 1) calc(var(--i) * 90ms) both;
  }
  @keyframes hop { from { transform: translateY(40px) scale(.4); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .cats img { animation: none; } }

  .visually-hidden {
    position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }
</style>
