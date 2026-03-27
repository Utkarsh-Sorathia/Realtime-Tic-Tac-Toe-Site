import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { GameProvider } from './context/GameContext.tsx'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GameProvider>
          <App />
        </GameProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
