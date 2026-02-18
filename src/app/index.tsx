import { Provider } from 'effector-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { appScope, bootstrapApp } from './bootstrap'
import './styles/index.css'

async function main() {
  await bootstrapApp(appScope)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider value={appScope}>
        <App />
      </Provider>
    </StrictMode>,
  )
}

void main()
