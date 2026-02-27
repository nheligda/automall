/**
 * AUTOMALL - Complete Route Configuration
 * All routes for the full system
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { BuyerDashboard } from '@/components/buyer/BuyerDashboard';
import { VehicleMarketplace } from '@/components/buyer/VehicleMarketplace';

// Protected Route Component
function ProtectedRoute({ 
  element, 
  requiredRole 
}: { 
  element: React.ReactNode; 
  requiredRole?: string 
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return element;
}

// Loading Spinner
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}

// App Routes
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />

      {/* Buyer Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            element={
              <BuyerDashboard
                userId={user?.user_id || 0}
                userName={`${user?.first_name} ${user?.last_name}`}
                userPhone={user?.phone_number || ''}
              />
            }
          />
        }
      />

      <Route
        path="/marketplace"
        element={
          <ProtectedRoute
            element={
              <VehicleMarketplace
                userId={user?.user_id || 0}
                onVehicleSelect={(vehicle) => {
                  console.log('Vehicle selected:', vehicle);
                }}
              />
            }
          />
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
