import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'

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
      darkModeSelector: '.my-app-dark',
      cssLayer: false,
    },
  },
})
app.use(ConfirmationService)
app.use(ToastService)

app.component('Toast', Toast)

app.mount('#app')
