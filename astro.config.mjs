// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://catandcapy.com",
  integrations: [svelte(), sitemap()],
  build: { inlineStylesheets: "auto" },
});
