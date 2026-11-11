import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PageLoader } from './components/ui/PageLoader.jsx';
import { ChunkLoadErrorBoundary } from './components/ChunkLoadErrorBoundary.jsx';
import {
  clearChunkReloadFlag,
  lazyWithChunkRecovery,
} from './lib/chunkLoadRecovery.js';
import { ROUTES } from './routes/paths.js';

const SpikeMasterPortal = lazy(lazyWithChunkRecovery(() => import('./SpikeMasterPortal.jsx')));
const PitchPanelGuestPage = lazy(
  lazyWithChunkRecovery(() => import('./pages/pitchPanel/PitchPanelGuestPage.jsx')),
);
const VersaActivateHarness = import.meta.env.DEV
  ? lazy(lazyWithChunkRecovery(() => import('./pages/VersaActivateHarness.jsx')))
  : null;

function App() {
  useEffect(() => {
    clearChunkReloadFlag();
  }, []);

  return (
    <ChunkLoadErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader label="Loading SPIKE…" />}>
          <Routes>
            <Route path={ROUTES.pitchPanel} element={<PitchPanelGuestPage />} />
            {import.meta.env.DEV && VersaActivateHarness ? (
              <Route path={ROUTES.versaActivateHarness} element={<VersaActivateHarness />} />
            ) : null}
            <Route path="/*" element={<SpikeMasterPortal />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ChunkLoadErrorBoundary>
  );
}

export default App;
