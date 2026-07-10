import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import App from './App.jsx';
import { AuthProvider } from '../../AuthContext.jsx';
import { initCapacitorShell } from '../../lib/capacitorBootstrap.js';
import { installChunkLoadRecovery } from '../../lib/chunkLoadRecovery.js';

void initCapacitorShell();
installChunkLoadRecovery();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
