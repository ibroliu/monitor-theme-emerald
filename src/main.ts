import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { getApiAssetUrl } from '@/utils/api'
import { setupIconify } from '@/utils/iconify'
import { message } from '@/utils/message'
import App from './App.vue'
import router from './router'

import './styles/main.css'

const favicon = document.createElement('link')
favicon.rel = 'icon'
favicon.href = getApiAssetUrl('favicon.svg')
document.head.appendChild(favicon)

window.$message = message

setupIconify().catch((err) => {
  console.warn('[main] iconify init failed', err)
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
