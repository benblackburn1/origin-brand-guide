import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

// Layout
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

// Public Pages
import Home from './pages/Home';
import Guidelines from './pages/Guidelines';
import Templates from './pages/Templates';
import Tools from './pages/Tools';
import ToolViewer from './pages/ToolViewer';
import Creator from './pages/Creator';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminAssets from './pages/admin/Assets';
import AdminTemplates from './pages/admin/Templates';
import AdminTools from './pages/admin/Tools';
import AdminColors from './pages/admin/Colors';
import AdminContent from './pages/admin/Content';
import AdminUsers from './pages/admin/Users';
import AdminBrandGuidelines from './pages/admin/BrandGuidelines';
import AdminLogoUpload from './pages/admin/LogoUpload';
import AdminSettings from './pages/admin/Settings';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <ChatProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/creator" element={<Creator />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/tools/:slug" element={<ToolViewer />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="assets" element={<AdminAssets />} />
          <Route path="templates" element={<AdminTemplates />} />
          <Route path="tools" element={<AdminTools />} />
          <Route path="colors" element={<AdminColors />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="brand-guidelines" element={<AdminBrandGuidelines />} />
          <Route path="logo-upload" element={<AdminLogoUpload />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ChatProvider>
    </Router>
  );
}

export default App;
