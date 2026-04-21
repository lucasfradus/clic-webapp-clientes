import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { setUnauthorizedHandler } from './api/client';
import { useAuth } from './store/auth';
import { toast } from './store/toast';
import { BrandProvider } from './brand/context';

// Handler global de 401
setUnauthorizedHandler(() => {
  useAuth.getState().logout();
  toast.error('Tu sesión expiró. Iniciá sesión de nuevo.');
});

// Bootstrap inicial: si hay token, traer perfil
useAuth.getState().bootstrap();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrandProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </BrandProvider>
  </React.StrictMode>
);
