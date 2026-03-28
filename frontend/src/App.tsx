import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SchemesPage from './pages/SchemesPage';
import SchemeDetailPage from './pages/SchemeDetailPage';
import ApplicationsPage from './pages/ApplicationsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFarmers from './pages/admin/AdminFarmers';
import AdminCalls from './pages/admin/AdminCalls';
import AdminSchemes from './pages/admin/AdminSchemes';
import SetupPage from './pages/SetupPage';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/dashboard'} /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/setup" element={<SetupPage />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/schemes" element={
            <ProtectedRoute><SchemesPage /></ProtectedRoute>
          } />
          <Route path="/schemes/:id" element={
            <ProtectedRoute><SchemeDetailPage /></ProtectedRoute>
          } />
          <Route path="/applications" element={
            <ProtectedRoute><ApplicationsPage /></ProtectedRoute>
          } />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><Layout isAdmin /></ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="farmers" element={<AdminFarmers />} />
          <Route path="calls" element={<AdminCalls />} />
          <Route path="schemes" element={<AdminSchemes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
