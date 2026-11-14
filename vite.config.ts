import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  return {
    plugins: [
      {
        name: 'dev-sandbox-ws-guard',
        apply: 'serve',
        transformIndexHtml(html) {
          const devGuardScript = `<script>
      (function() {
        var NativeWebSocket = window.WebSocket;
        if (NativeWebSocket) {
          window.WebSocket = function(url, protocols) {
            var urlStr = String(url || '');
            var isViteHmr = protocols === 'vite-hmr' ||
              (Array.isArray(protocols) && protocols.indexOf('vite-hmr') !== -1) ||
              urlStr.indexOf('vite') !== -1 ||
              urlStr.indexOf('@vite') !== -1;
            if (isViteHmr) {
              var dummy = new EventTarget();
              dummy.CONNECTING = 0;
              dummy.OPEN = 1;
              dummy.CLOSING = 2;
              dummy.CLOSED = 3;
              dummy.readyState = 1;
              dummy.url = urlStr;
              dummy.protocol = 'vite-hmr';
              dummy.bufferedAmount = 0;
              dummy.extensions = '';
              dummy.binaryType = 'blob';
              dummy.send = function() {};
              dummy.close = function() {};
              dummy.addEventListener = EventTarget.prototype.addEventListener.bind(dummy);
              dummy.removeEventListener = EventTarget.prototype.removeEventListener.bind(dummy);
              dummy.dispatchEvent = EventTarget.prototype.dispatchEvent.bind(dummy);
              setTimeout(function() {
                try {
                  var openEvt = new Event('open');
                  if (typeof dummy.onopen === 'function') dummy.onopen(openEvt);
                  dummy.dispatchEvent(openEvt);
                } catch(e) {}
              }, 10);
              return dummy;
            }
            return new NativeWebSocket(url, protocols);
          };
          window.WebSocket.prototype = NativeWebSocket.prototype;
          window.WebSocket.CONNECTING = 0;
          window.WebSocket.OPEN = 1;
          window.WebSocket.CLOSING = 2;
          window.WebSocket.CLOSED = 3;
        }
      })();
    </script>`;
          return html.replace('<head>', `<head>\n    ${devGuardScript}`);
        },
      },
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
