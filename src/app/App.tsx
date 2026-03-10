import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingRoute } from '../routes/LandingRoute';
import { HomeRoute } from '../routes/HomeRoute';
import { ViewerRoute } from '../routes/ViewerRoute';

export function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/open" element={<HomeRoute />} />
        <Route path="/viewer" element={<ViewerRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
