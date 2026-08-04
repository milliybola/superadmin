import React from 'react';
import { Navigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../config/constants';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const rawAdminData = localStorage.getItem(STORAGE_KEYS.ADMIN_DATA);

  if (!token || !rawAdminData) {
    return <Navigate to="/login" replace />;
  }

  // Defense in depth: even if a token is present, only an admin-role account
  // stored by the login flow may render the panel.
  try {
    const adminData = JSON.parse(rawAdminData);
    if (adminData?.role !== 'admin') {
      return <Navigate to="/login" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
