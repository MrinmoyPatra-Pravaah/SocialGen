import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center space-y-4">
          {/* Subtle minimal loading spinner */}
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800"></div>
          <p className="text-sm font-medium text-zinc-500">Loading your space...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
