import { createApp } from 'vue'
import App from './App.vue'
import 'identicons-esm/web-component'
import 'identicons-esm/shiny-web-component'
import 'virtual:uno.css'

// Tell Vue about the custom element to avoid warnings
const app = createApp(App)
app.mount('#app')
