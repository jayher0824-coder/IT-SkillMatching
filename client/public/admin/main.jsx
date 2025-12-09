import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import AppWrapper from './app'

// Configure axios
window.axios = axios

// Hide loading indicator when React is ready
setTimeout(() => {
  const loadingIndicator = document.getElementById('loading-indicator')
  if (loadingIndicator) {
    loadingIndicator.style.opacity = '0'
    loadingIndicator.style.transition = 'opacity 0.3s'
    setTimeout(() => {
      loadingIndicator.style.display = 'none'
    }, 300)
  }
}, 200)

const root = ReactDOM.createRoot(document.getElementById('admin-root'))
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
)

