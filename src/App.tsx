import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { DoctorSearchPage } from './pages/DoctorSearchPage';
import { DoctorProfilePage } from './pages/DoctorProfilePage';
import { ClinicsPage } from './pages/ClinicsPage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PrescriptionViewPage } from './pages/PrescriptionViewPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';

// Protected Route Helpers
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { user, isLoading: loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If doctor attempts to view patient dashboard or vice-versa, gracefully route to their dedicated portal
    if (user.role === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Discovery Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/find-doctors" element={<DoctorSearchPage />} />
                <Route path="/doctors/:id" element={<DoctorProfilePage />} />
                <Route path="/clinics" element={<ClinicsPage />} />

                {/* Auth */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Portals */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['patient']}>
                      <PatientDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                      <DoctorDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Shared Outpatient Prescriptions */}
                <Route
                  path="/prescriptions/:id"
                  element={
                    <ProtectedRoute>
                      <PrescriptionViewPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
