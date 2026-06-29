import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateUser } from './features/authSlice';
import api from './services/api';
import { initSocket } from './services/socket';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import PantryDashboard from './pages/PantryDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types';

const App: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('hfms_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          dispatch(updateUser(res.data.user));
          initSocket();
        } catch (err) {
          console.error('Auto-login verification failed:', err);
        }
      }
    };
    fetchMe();
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.Admin]} />}>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        {/* DOCTOR / DIETICIAN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.Doctor, UserRole.Dietician]} />}>
          <Route path="/doctor/*" element={<DoctorDashboard />} />
        </Route>

        {/* PATIENT ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.Patient]} />}>
          <Route path="/patient/*" element={<PatientDashboard />} />
        </Route>

        {/* PANTRY ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.Pantry]} />}>
          <Route path="/pantry/*" element={<PantryDashboard />} />
        </Route>

        {/* DELIVERY ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.Delivery]} />}>
          <Route path="/delivery/*" element={<DeliveryDashboard />} />
        </Route>

        {/* FALLBACK REDIRECT */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
