import { createApp } from 'vue'
import App from './App.vue'
import 'identicons-esm'
import 'virtual:uno.css'

// Tell Vue about the custom element to avoid warnings
const app = createApp(App)
app.mount('#app')
