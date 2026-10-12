import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { MotionConfig } from "framer-motion";
import { SocketProvider } from "./context/SocketContext";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Activity from "./pages/Activity";
import AlertDetail from "./pages/AlertDetail";
import PlatformAccounts from "./pages/PlatformAccounts";
import PlatformAlerts from "./pages/PlatformAlerts";
import Login from "./pages/Login";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/dashboard/:platform" element={<Dashboard />} />

    {/* Accounts Routes */}
    <Route path="/accounts/:platform" element={<PlatformAccounts />} />

    {/* Alerts Routes */}
    <Route path="/alerts/:platform" element={<PlatformAlerts />} />

    {/* Activity Routes */}
    <Route path="/alerts/:platform/:id" element={<AlertDetail />} />
    <Route path="/activity" element={<Activity />} />
    <Route path="/activity/:platform" element={<Activity />} />

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <MotionConfig reducedMotion="user">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <AppRoutes />
                </SocketProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster
          toastOptions={{
            duration: 4000,
            style: {
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #e6ebf3",
              borderRadius: "14px",
              fontSize: "13px",
              boxShadow: "0 12px 26px -10px rgba(15, 23, 42, 0.18)",
            },
            success: {
              iconTheme: { primary: "#059669", secondary: "#f0fdf4" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "#fef2f2" },
            },
          }}
        />
      </MotionConfig>
    </BrowserRouter>
  );
};

export default App;
