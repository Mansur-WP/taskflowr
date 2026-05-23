import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept window.fetch to automatically include safe headers (X-Requested-With, Bearer auth fallback)
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem('session_token');
  const headers = new Headers(init?.headers || {});
  
  if (!headers.has('X-Requested-With')) {
    headers.set('X-Requested-With', 'XMLHttpRequest');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return originalFetch(input, {
    ...init,
    headers,
  });
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

