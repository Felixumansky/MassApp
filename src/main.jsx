import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { StoreProvider } from './store.jsx';
import { CloudProvider } from './cloud.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <CloudProvider>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </CloudProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>
);
