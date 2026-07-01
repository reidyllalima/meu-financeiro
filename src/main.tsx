import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthGate } from './components/auth/AuthGate.tsx'

// Depois de um novo deploy, os arquivos das telas (lazy-loaded) mudam de nome.
// Se a aba já estava aberta de antes, o import de uma tela ainda não visitada
// vai falhar (404) — o Vite emite esse evento nesse caso. Em vez de ficar com
// a tela em branco, recarrega a página sozinha para pegar a versão atual.
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>,
)
