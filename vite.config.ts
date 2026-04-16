import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/100.png",
        "icons/152.png",
        "icons/192.png",
        "icons/512.png",
        "sw-custom.js"
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest,webp}"],
        // Allow larger assets to be precached (default is 2 MiB)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        importScripts: ["sw-custom.js"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/]
      },
      manifest: {
        name: "Friggo",
        short_name: "Friggo",
        description:
          "Tudo o que sua casa precisa, antes de acabar. Geladeira, receitas, lista de compras e mais.",
        theme_color: "#165A52",
        background_color: "#DAF1DE",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["food", "lifestyle", "utilities"],
        icons: [
          {
            src: "icons/192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
}));
