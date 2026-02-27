
import { createBrowserRouter } from "react-router";
import { Navigate, useLocation } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { Marketplace } from "../components/marketplace/Marketplace";
import { CustomerDashboard } from "../components/dashboard/CustomerDashboard";
import { AdminDashboard } from "../components/dashboard/AdminDashboard";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SettingsPage } from "../pages/SettingsPage";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: JSX.Element;
  requiredRole?: "Customer" | "Staff" | "Admin";
}) {
  const { isAuthenticated, isInitialized, user } = useAuth();
  const location = useLocation();

  const basePath = location.pathname.startsWith("/automall%20proj")
    ? "/automall%20proj"
    : location.pathname.startsWith("/automall proj")
    ? "/automall proj"
    : "";

  // Wait for auth initialization so a stored session is restored
  // before deciding whether to redirect to login.
  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`${basePath}/`}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={`${basePath}/dashboard`} replace />;
  }

  return children;
}

function RoleBasedDashboard() {
  const { user } = useAuth();

  if (user?.role === "Admin" || user?.role === "Staff") {
    return <AdminDashboard />;
  }

  return <CustomerDashboard />;
}

const appChildren = [
  {
    index: true,
    Component: Marketplace,
  },
  {
    path: "login",
    Component: LoginPage,
  },
  {
    path: "register",
    Component: RegisterPage,
  },
  {
    path: "dashboard",
    element: (
      <ProtectedRoute>
        <RoleBasedDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "settings",
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "admin",
    element: (
      <ProtectedRoute requiredRole="Admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    Component: Marketplace,
  },
];

export const router = createBrowserRouter([
  // Apache path (URL-encoded space)
  {
    path: "/automall%20proj/*",
    Component: Layout,
    children: appChildren,
  },
  // Decoded path fallback (React Router may decode the URL)
  {
    path: "/automall proj/*",
    Component: Layout,
    children: appChildren,
  },
  // Dev server or root fallback
  {
    path: "/*",
    Component: Layout,
    children: appChildren,
  },
]);
