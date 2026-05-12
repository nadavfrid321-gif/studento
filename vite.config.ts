import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: 'auto',
      manifest: {
        name: 'Studento — משפטים וכלכלה',
        short_name: 'Studento',
        description: 'ניהול משימות אקדמיות לסטודנטים לתואר משולב משפטים וכלכלה.',
        theme_color: '#0d1c32',
        background_color: '#f7f9fc',
        display: 'standalone',
        orientation: 'portrait',
        dir: 'rtl',
        lang: 'he',
        start_url: '/',
        // PNG icons are recommended for full cross-platform install support (esp. iOS).
        // Generate them at https://realfavicongenerator.net and drop into /public/icons/.
        // The SVG below works as a fallback on Chrome/Edge/Firefox.
        icons: [
          { src: '/favicon.svg', sizes: '64x64 192x192 512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      devOptions: { enabled: false, type: 'module' },
    }),
  ],
  server: { port: 5173, host: true },
});
