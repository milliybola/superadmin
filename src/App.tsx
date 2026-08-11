import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { YMaps } from '@pbe/react-yandex-maps';
import Layout from './core/components/Layout';
import ProtectedRoute from './core/components/ProtectedRoute';
import LoginPage from './features/auth/pages/LoginPage';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import LocationsPage from './features/locations/pages/LocationsPage';
import PartnersPage from './features/partners/pages/PartnersPage';
import PartnerDetailPage from './features/partners/pages/PartnerDetailPage';
import NeighborhoodsPage from './features/neighborhoods/pages/NeighborhoodsPage';
import { YANDEX_MAPS_API_KEY } from './core/config/constants';

const App: React.FC = () => {
  return (
    <YMaps query={{ lang: 'uz_UZ' as 'ru_RU', ...(YANDEX_MAPS_API_KEY ? { apikey: YANDEX_MAPS_API_KEY } : {}) }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="partners" element={<PartnersPage />} />
            <Route path="partners/:uuid" element={<PartnerDetailPage />} />
            <Route path="neighborhoods" element={<NeighborhoodsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </YMaps>
  );
};

export default App;
