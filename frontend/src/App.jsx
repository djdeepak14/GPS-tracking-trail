import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { initSocket, disconnectSocket } from './services/socket';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MapPage      from './pages/MapPage';
import HistoryPage  from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage  from './pages/ProfilePage';
import AppLayout    from './components/ui/AppLayout';

const Protected = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
};
const Public = ({ children }) => {
  const { token } = useAuthStore();
  return token ? <Navigate to="/map" replace /> : children;
};

export default function App() {
  const { token } = useAuthStore();
  useEffect(() => {
    if (token) initSocket(token);
    else disconnectSocket();
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Public><LoginPage/></Public>} />
        <Route path="/register" element={<Public><RegisterPage/></Public>} />
        <Route path="/" element={<Protected><AppLayout/></Protected>}>
          <Route index element={<Navigate to="/map" replace/>} />
          <Route path="map"       element={<MapPage/>} />
          <Route path="dashboard" element={<DashboardPage/>} />
          <Route path="history"   element={<HistoryPage/>} />
          <Route path="analytics" element={<AnalyticsPage/>} />
          <Route path="profile"   element={<ProfilePage/>} />
        </Route>
        <Route path="*" element={<Navigate to="/map" replace/>} />
      </Routes>
    </BrowserRouter>
  );
}
