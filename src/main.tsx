import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ContactProvider } from '@/contexts/ContactContext'

createRoot(document.getElementById("root")!).render(
  <ContactProvider>
    <App />
  </ContactProvider>
);
