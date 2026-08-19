import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // registerType: 'prompt' — لا يُفعّل Service Worker الجديد تلقائيًا ولا يعمل reload مفاجئ،
      // بدل كده بنتحكم في التحديث يدويًا عبر virtual:pwa-register/react (انظر components/pwa/PwaUpdateManager.jsx)
      // عشان منقطعش على المستخدم وهو بيكتب تقرير يومي.
      registerType: 'prompt',
      injectRegister: false,
      // manifest: false — المشروع عنده Web App Manifest احترافي جاهز بالفعل في public/manifest.webmanifest
      // ومربوط يدويًا في index.html، فبنسيب الـ plugin يتعامل فقط مع الـ Service Worker
      // وميعملش Manifest تاني موازي له.
      manifest: false,
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      // في بيئة التطوير الـ Service Worker متوقف تمامًا عشان ميتعارضش مع Vite HMR
      devOptions: { enabled: false },
      workbox: {
        // Precache: فقط ملفات الـ App Shell الثابتة (JS/CSS/HTML/الصور/الخطوط) الناتجة من الـ build.
        globPatterns: ['**/*.{js,css,html,ico,svg,png,woff,woff2}'],
        // أي مسار فيه /api لازم يروح للشبكة مباشرة دايمًا — ممنوع أي Cache لبيانات الـ Backend
        // (تقارير، عملاء، قلابات، كسارات، عمال، Authentication...) عشان منعرضش بيانات قديمة
        // كأنها حديثة، ومنسببش أي مشكلة في الـ Authentication بسبب الـ caching.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // هنا @ بتمثل src
    },
  },
})