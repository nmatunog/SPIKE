import { BrowserRouter, Route, Routes } from 'react-router-dom';
import SpikeMasterPortal from './SpikeMasterPortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<SpikeMasterPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
