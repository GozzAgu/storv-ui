// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      script: [
        {
          innerHTML: `
            (function() {
              try {
                // Apply theme immediately to prevent flash
                var theme = localStorage.getItem('theme');
                var isDark = false;
                
                if (theme === 'dark') {
                  isDark = true;
                } else if (theme === 'light') {
                  isDark = false;
                } else if (theme === 'system' || !theme) {
                  isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                }
                
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                
                // Prevent layout shifts by setting initial dimensions
                document.documentElement.style.minHeight = '100vh';
                document.body.style.minHeight = '100vh';
                document.body.style.width = '100%';
                document.body.style.overflowX = 'hidden';
              } catch (e) {}
            })();
          `,
          type: 'text/javascript'
        }
      ],
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@300;400;700&family=Fredoka+One&display=swap'
        }
      ]
    }
  }
})
