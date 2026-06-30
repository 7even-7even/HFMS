import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import PatientsPage from './pages/PatientsPage';
import DietsPage from './pages/DietsPage';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import InventoryPage from './pages/InventoryPage';
import BillingPage from './pages/BillingPage';
import QueriesPage from './pages/QueriesPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import { ROLES } from './utils/format';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}><Route path="users" element={<UsersPage />} /></Route>
            <Route element={<ProtectedRoute roles={[ROLES.DOCTOR, ROLES.DIETICIAN]} />}><Route path="patients" element={<PatientsPage />} /></Route>
            <Route element={<ProtectedRoute roles={[ROLES.DOCTOR, ROLES.DIETICIAN]} />}><Route path="diets" element={<DietsPage />} /></Route>
            <Route element={<ProtectedRoute roles={[ROLES.KITCHEN_STAFF, ROLES.PATIENT]} />}><Route path="menu" element={<MenuPage />} /></Route>
            <Route element={<ProtectedRoute roles={[ROLES.KITCHEN_STAFF, ROLES.DELIVERY_STAFF, ROLES.PATIENT]} />}><Route path="orders" element={<OrdersPage />} /></Route>
            <Route element={<ProtectedRoute roles={[ROLES.KITCHEN_STAFF]} />}><Route path="inventory" element={<InventoryPage />} /></Route>
            <Route element={<ProtectedRoute roles={[ROLES.PATIENT]} />}><Route path="billing" element={<BillingPage />} /></Route>
            <Route element={<ProtectedRoute roles={[ROLES.DOCTOR, ROLES.DIETICIAN, ROLES.PATIENT]} />}><Route path="queries" element={<QueriesPage />} /></Route>
            <Route path="notifications" element={<NotificationsPage />} />
            <Route element={<ProtectedRoute roles={[ROLES.DOCTOR, ROLES.DIETICIAN, ROLES.PATIENT]} />}><Route path="profile" element={<ProfilePage />} /></Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
