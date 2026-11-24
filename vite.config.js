import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

function enforceApiUrlPlugin(command, mode) {
  return {
    name: 'enforce-production-api-url',
    configResolved() {
      if (command !== 'build') return
      const env = loadEnv(mode, process.cwd(), '')
      const apiUrl = (process.env.VITE_API_URL ?? env.VITE_API_URL ?? '').trim()
      const useMock = (process.env.VITE_USE_MOCK ?? env.VITE_USE_MOCK ?? '').trim() === 'true'
      if (!apiUrl && !useMock) {
        throw new Error(
          '[STEW BUILD ERROR] VITE_API_URL is missing. Vite bakes VITE_API_URL into the static bundle at BUILD time; ' +
          'pass VITE_API_URL=https://<api-host>/api when running `npm run build` (without it the built app fails with 503).'
        )
      }
    },
  }
}

function stagingSeoPlugin(command, mode) {
  let isStaging = false
  return {
    name: 'stew-staging-seo',
    configResolved() {
      const env = loadEnv(mode, process.cwd(), '')
      const appEnv = (process.env.VITE_APP_ENV ?? env.VITE_APP_ENV ?? '').trim().toLowerCase()
      isStaging = appEnv === 'staging'
    },
    transformIndexHtml(html) {
      if (!isStaging) return html
      return html.replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n    </head>')
    },
    generateBundle() {
      if (command === 'build' && isStaging) {
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: 'User-agent: *\nDisallow: /\n',
        })
      }
    },
  }
}

export default defineConfig(({ command, mode }) => ({
  build: {
    sourcemap: false,
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  plugins: [
    enforceApiUrlPlugin(command, mode),
    stagingSeoPlugin(command, mode),
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,ico,woff2}'] },
      manifest: {
        id: '/',
        name: 'STEW – KNUST Campus Food',
        short_name: 'STEW',
        description: 'Order from verified KNUST student chefs.',
        theme_color: '#06B6D4',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/app/login',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
}))
