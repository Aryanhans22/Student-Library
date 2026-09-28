import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import StudentLayout from './components/layout/StudentLayout';
import { DemoBanner } from './components/ui/DemoBanner';

// Lazy loading pages
const Landing = lazy(() => import('./pages/Landing'));
const StudentLogin = lazy(() => import('./pages/auth/StudentLogin'));
const StudentRegister = lazy(() => import('./pages/auth/StudentRegister'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const BookDemo = lazy(() => import('./pages/BookDemo'));

const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const StudentChat = lazy(() => import('./pages/student/StudentChat'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Students = lazy(() => import('./pages/admin/Students'));
const StudentDetail = lazy(() => import('./pages/admin/StudentDetail'));
const Seats = lazy(() => import('./pages/admin/Seats'));
const SeatAllocation = lazy(() => import('./pages/admin/SeatAllocation'));
const Subscriptions = lazy(() => import('./pages/admin/Subscriptions'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const Settings = lazy(() => import('./pages/admin/Settings'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DemoBanner />
        <Toaster position="top-right" />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/book-demo" element={<BookDemo />} />
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/register" element={<StudentRegister />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Student Routes */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route element={<StudentLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="chat" element={<StudentChat />} />
              </Route>
            </Route>

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="students/:id" element={<StudentDetail />} />
                <Route path="seats" element={<Seats />} />
                <Route path="seat-allocation" element={<SeatAllocation />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

