import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/Toast';
import LoginPage from './pages/Login';
import CadastroPage from './pages/Cadastro';
import ClientDashboard from './pages/DashboardClient';
import AdminDashboard from './pages/DashboardAdmin';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Layout>
          <ToastContainer />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route 
              path="/dashboard/client" 
              element={
                <ProtectedRoute requireClient={true}>
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

