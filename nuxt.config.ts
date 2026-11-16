// https://nuxt.com/docs/4.x/api/nuxt-config
const FIRST_PAINT_SCRIPT = `(function(){try{var c=document.cookie.split('; ').reduce(function(a,p){var i=p.indexOf('=');if(i>0)a[p.slice(0,i)]=p.slice(i+1);return a},{});var h=document.documentElement;var l=decodeURIComponent(c.i18n_redirected||'');if(l!=='ar'&&l!=='en'){var n=(navigator.language||'en').slice(0,2);l=n==='ar'?'ar':'en'}h.setAttribute('lang',l==='ar'?'ar':'en-US');h.setAttribute('dir',l==='ar'?'rtl':'ltr');var a={};try{a=JSON.parse(decodeURIComponent(c['app-appearance']||'{}'))||{}}catch(e){}var m={layout:['sidebar','topnav'],density:['comfortable','compact'],navbar:['solid','blur','floating'],'content-width':['full','boxed']};var k={layout:'layout',density:'density',navbar:'navbarStyle','content-width':'contentWidth'};for(var x in m){var v=a[k[x]];if(m[x].indexOf(v)>-1)h.setAttribute('data-'+x,v)}if(typeof a.radius==='number')h.style.setProperty('--ui-radius',a.radius+'rem')}catch(e){}})()`

export default defineNuxtConfig({

  extends: ['./mock-api'],
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
  ],

  ssr: false,

  devtools: { enabled: true },

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      // Sets <html lang dir data-*> synchronously from cookies so Arabic never flips after paint.
      script: [{ key: 'first-paint', tagPriority: 'critical', innerHTML: FIRST_PAINT_SCRIPT }],
    },
  },

  css: [
    '@fontsource/inter/400.css',
    '@fontsource/inter/500.css',
    '@fontsource/inter/600.css',
    '@fontsource/inter/700.css',
    '@fontsource/ibm-plex-sans-arabic/400.css',
    '@fontsource/ibm-plex-sans-arabic/500.css',
    '@fontsource/ibm-plex-sans-arabic/600.css',
    '@fontsource/ibm-plex-sans-arabic/700.css',
    '~/assets/css/main.css',
  ],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    storage: 'cookie',
  },

  ui: {
    experimental: { componentDetection: true },
  },

  runtimeConfig: {
    apiBase: 'http://localhost:8000/api',
    apiMock: false,
    apiTimeout: 15000,
    authTokenStore: 'cookie',
    mockRoutes: false,
    mockAccessTtl: 120,
    mockLatencyMs: '150-500',
    session: {
      maxAge: 60 * 60 * 24 * 30,
      cookie: { sameSite: 'lax', secure: true },
    },
    public: {
      appName: 'Nexus Admin',
      defaultLocale: 'en',
      demoMode: false,
      preferencesSync: false,
    },
  },

  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY',
      },
    },
    '/api/**': { headers: { 'cache-control': 'no-store' } },
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },

  experimental: {
    typedPages: true,
    defaults: {
      nuxtLink: { prefetchOn: { visibility: false, interaction: true } },
    },
  },

  compatibilityDate: '2026-11-01',

  nitro: {
    compressPublicAssets: { gzip: true, brotli: true },
  },

  eslint: {
    config: { stylistic: true },
  },

  // Fonts are self-hosted from @fontsource packages (see `css`), so @nuxt/fonts must not
  // resolve them from remote providers at build time.
  fonts: {
    providers: { google: false, googleicons: false, bunny: false, fontshare: false, fontsource: false, adobe: false, npm: false },
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', dir: 'ltr', file: 'en.json' },
      { code: 'ar', language: 'ar', name: 'العربية', dir: 'rtl', file: 'ar.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      fallbackLocale: 'en',
      redirectOn: 'root',
    },
  },

  icon: {
    provider: 'none',
    clientBundle: {
      scan: { globInclude: ['app/**/*.{vue,ts}', 'layers/**/*.{vue,ts}'] },
      icons: [],
      sizeLimitKb: 256,
    },
  },
})
