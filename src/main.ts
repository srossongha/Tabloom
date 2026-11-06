/**
 * Main application entrypoint mounting the Vue 3.5 root component.
 * Registers global style definitions and binds to the DOM container.
 */
import { createApp } from 'vue'
import './style.css'
import App from './4-presentation/App.vue'

createApp(App).mount('#app')
