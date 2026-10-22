import React, { lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { YMaps } from '@pbe/react-yandex-maps';
import Layout from './core/components/Layout';
import ProtectedRoute from './core/components/ProtectedRoute';
import LoginPage from './features/auth/pages/LoginPage';
import { Providers } from './app/providers';
import { YANDEX_MAPS_API_KEY } from './core/config/constants';

// Sahifalar kerak bo'lganda yuklanadi (Layout ichidagi Suspense ko'rsatadi)
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'));
const OrdersPage = lazy(() => import('./features/orders/pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./features/orders/pages/OrderDetailPage'));
const CouriersPage = lazy(() => import('./features/couriers/pages/CouriersPage'));
const CourierDetailPage = lazy(() => import('./features/couriers/pages/CourierDetailPage'));
const CouriersMapPage = lazy(() => import('./features/couriers/pages/CouriersMapPage'));
const UsersPage = lazy(() => import('./features/users/pages/UsersPage'));
const UserDetailPage = lazy(() => import('./features/users/pages/UserDetailPage'));
const LocationsPage = lazy(() => import('./features/locations/pages/LocationsPage'));
const PartnersPage = lazy(() => import('./features/partners/pages/PartnersPage'));
const PartnerDetailPage = lazy(() => import('./features/partners/pages/PartnerDetailPage'));
const NeighborhoodsPage = lazy(() => import('./features/neighborhoods/pages/NeighborhoodsPage'));
const CuisinesPage = lazy(() => import('./features/partners/pages/CuisinesPage'));
const TariffsPage = lazy(() => import('./features/partners/pages/TariffsPage'));
const CategoriesPage = lazy(() => import('./features/catalog/pages/CategoriesPage'));
const ProductsPage = lazy(() => import('./features/catalog/pages/ProductsPage'));
const BannersPage = lazy(() => import('./features/marketing/pages/BannersPage'));
const PromotionsPage = lazy(() => import('./features/marketing/pages/PromotionsPage'));
const BroadcastPage = lazy(() => import('./features/marketing/pages/BroadcastPage'));
const PaymentsPage = lazy(() => import('./features/finance/pages/PaymentsPage'));
const ReportsPage = lazy(() => import('./features/finance/pages/ReportsPage'));
const MerchantsPage = lazy(() => import('./features/finance/pages/MerchantsPage'));
const AdminsPage = lazy(() => import('./features/system/pages/AdminsPage'));
const AuditPage = lazy(() => import('./features/system/pages/AuditPage'));
const DispatchPage = lazy(() => import('./features/system/pages/DispatchPage'));

const App: React.FC = () => (
  <Providers>
    <YMaps query={{ lang: 'uz_UZ' as 'ru_RU', ...(YANDEX_MAPS_API_KEY ? { apikey: YANDEX_MAPS_API_KEY } : {}) }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:uuid" element={<OrderDetailPage />} />
            <Route path="couriers" element={<CouriersPage />} />
            <Route path="couriers/map" element={<CouriersMapPage />} />
            <Route path="couriers/:uuid" element={<CourierDetailPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:uuid" element={<UserDetailPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="partners" element={<PartnersPage />} />
            <Route path="partners/:uuid" element={<PartnerDetailPage />} />
            <Route path="neighborhoods" element={<NeighborhoodsPage />} />
            <Route path="cuisines" element={<CuisinesPage />} />
            <Route path="tariffs" element={<TariffsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="broadcast" element={<BroadcastPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="merchants" element={<MerchantsPage />} />
            <Route path="admins" element={<AdminsPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="dispatch" element={<DispatchPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </YMaps>
  </Providers>
);

export default App;
