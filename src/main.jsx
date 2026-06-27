import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { StoreProvider } from './store.jsx';
import { CloudProvider } from './cloud.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AppLoader } from './components/ui.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <CloudProvider>
            <Suspense fallback={<AppLoader />}>
              <App />
            </Suspense>
          </CloudProvider>
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
