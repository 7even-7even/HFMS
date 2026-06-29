import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../features/store';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to respective dashboard if unauthorized for this specific path
    switch (user.role) {
      case UserRole.Admin:
        return <Navigate to="/admin" replace />;
      case UserRole.Doctor:
      case UserRole.Dietician:
        return <Navigate to="/doctor" replace />;
      case UserRole.Patient:
        return <Navigate to="/patient" replace />;
      case UserRole.Pantry:
        return <Navigate to="/pantry" replace />;
      case UserRole.Delivery:
        return <Navigate to="/delivery" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedRoute;
