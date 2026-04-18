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
      // "prompt" evita que o SW force reload automático ao detectar nova versão.
      // O app só atualiza quando o usuário abre de novo ou confirma — sem reload
      // surpresa em segundo plano (crítico para iOS/Android PWA).
      registerType: "prompt",
      includeAssets: [
        "icons/100.png",
        "icons/152.png",
        "icons/192.png",
        "icons/512.png",
        "sw-custom.js"
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest,webp}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Não ativa o SW imediatamente — espera o app fechar e reabrir
        skipWaiting: false,
        clientsClaim: false,
        importScripts: ["sw-custom.js"],
        runtimeCaching: [
          {
            // App shell (navegação SPA) — sempre serve do cache primeiro,
            // depois atualiza em background. Evita tela em branco ao reabrir.
            urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
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
          },
          {
            // Supabase REST — Network-first com fallback rápido
            urlPattern: /^https:\/\/.*\.supabase\.co\/(rest|auth|storage)\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }
            }
          }
        ],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/]
      },
      manifest: {
        name: "Kaza",
        short_name: "Kaza",
        description:
          "Tudo o que sua casa precisa, antes de acabar. Geladeira, receitas, lista de compras e mais.",
        theme_color: "#165A52",
        background_color: "#DAF1DE",
        display: "standalone",
        orientation: "portrait",
        start_url: "/app/home",
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
