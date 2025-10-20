import React from 'react'
import ReactDOM from 'react-dom/client'
import SimpleApp from './SimpleApp.tsx'
import './index.css'

// Minimal setup for debugging

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>,
)