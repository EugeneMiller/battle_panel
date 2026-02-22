import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/battle_panel/",
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon-192.svg", "icons/icon-512.svg"],
      manifest: {
        name: "D&D Combat Tracker",
        short_name: "CombatTracker",
        description: "Offline-friendly D&D 5e combat tracker",
        theme_color: "#18212f",
        background_color: "#0e141e",
        display: "standalone",
        start_url: "/battle_panel/",
        icons: [
          {
            src: "/battle_panel/icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "/battle_panel/icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        navigateFallback: "/battle_panel/index.html"
      }
    })
  ]
});
