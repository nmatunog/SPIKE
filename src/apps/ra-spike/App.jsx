import { Suspense, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PageLoader } from '../../components/ui/PageLoader.jsx';
import { ChunkLoadErrorBoundary } from '../../components/ChunkLoadErrorBoundary.jsx';
import { clearChunkReloadFlag } from '../../lib/chunkLoadRecovery.js';
import { RaSpikeApp } from './RaSpikeApp.jsx';

export default function App() {
  useEffect(() => {
    clearChunkReloadFlag();
  }, []);

  return (
    <ChunkLoadErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader label="Loading RA-SPIKE…" />}>
          <RaSpikeApp />
        </Suspense>
      </BrowserRouter>
    </ChunkLoadErrorBoundary>
  );
}
