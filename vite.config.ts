import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        disable: command === 'serve',
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'manifest.webmanifest'],
        manifest: {
          id: '/',
          name: 'SmartHub – All-in-One Tools',
          short_name: 'SmartHub',
          description: 'SmartHub – All-in-One Tools: Essential utility tools, Quran reader, smart alarm, prayer times, weather, calculators, and offline guides.',
          theme_color: '#0B63F6',
          background_color: '#0F172A',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
      'process.env.APP_URL': JSON.stringify(process.env.APP_URL || ''),
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) return 'vendor-lucide';
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('@google/genai')) return 'vendor-genai';
              if (id.includes('react')) return 'vendor-react';
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // Disable Vite 8 console forwarding over WebSocket to prevent client.send errors when WS is closed
      forwardConsole: false,
      // HMR is disabled in AI Studio environment where WebSockets are unsupported
      hmr: false,
      watch: null,
    },
  };
});
