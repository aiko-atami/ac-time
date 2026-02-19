import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { bootstrapApp } from './lib/bootstrap'
import './styles/index.css'

async function main() {
  await bootstrapApp()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void main()
