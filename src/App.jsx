import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PageLoader } from './components/ui/PageLoader.jsx';

const SpikeMasterPortal = lazy(() => import('./SpikeMasterPortal.jsx'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader label="Loading SPIKE…" />}>
        <Routes>
          <Route path="/*" element={<SpikeMasterPortal />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
