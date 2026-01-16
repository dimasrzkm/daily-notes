import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Tailwind + PrimeUI
import './assets/main.css'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'system',
      cssLayer: false,
    },
  },
})

app.mount('#app')
