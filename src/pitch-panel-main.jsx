import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { PitchPanelGuestPage } from './pages/pitchPanel/PitchPanelGuestPage.jsx';
import { installChunkLoadRecovery } from './lib/chunkLoadRecovery.js';

installChunkLoadRecovery();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PitchPanelGuestPage />
  </StrictMode>,
);
