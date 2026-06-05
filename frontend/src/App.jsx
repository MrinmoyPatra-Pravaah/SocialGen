import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GlobalStateProvider } from './context/GlobalStateContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Auth Pages (Login and Register)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Main Application Pages
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import BlogGenerator from './pages/BlogGenerator';
import ContentRemixer from './pages/ContentRemixer';
import HashtagLab from './pages/HashtagLab';
import SocialInbox from './pages/SocialInbox';
import BrandVoice from './pages/BrandVoice';
import BlogHistory from './pages/BlogHistory';
import Settings from './pages/Settings';
import SocialAccounts from './pages/SocialAccounts';

// This is a helper component that wraps protected pages.
// It ensures that only logged in users can see them.
// If not logged in, they are redirected to login page.
const ProtectedPage = ({ children }) => {
  return (
    <ProtectedRoute>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  );
};

// Main App component that sets up the Router and all the page routes.
function App() {
  return (
    <Router>
      <AuthProvider>
        <GlobalStateProvider>
          <Routes>
            {/* Public pages that anyone can access */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard and main application pages (Protected) */}
            <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
            <Route path="/calendar" element={<ProtectedPage><Calendar /></ProtectedPage>} />
            <Route path="/generate" element={<ProtectedPage><BlogGenerator /></ProtectedPage>} />
            <Route path="/remix" element={<ProtectedPage><ContentRemixer /></ProtectedPage>} />
            <Route path="/hashtags" element={<ProtectedPage><HashtagLab /></ProtectedPage>} />
            <Route path="/inbox" element={<ProtectedPage><SocialInbox /></ProtectedPage>} />
            <Route path="/connections" element={<ProtectedPage><SocialAccounts /></ProtectedPage>} />
            <Route path="/brand-voice" element={<ProtectedPage><BrandVoice /></ProtectedPage>} />
            <Route path="/history" element={<ProtectedPage><BlogHistory /></ProtectedPage>} />
            <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />

            {/* If the user types any other URL, send them back to the main dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GlobalStateProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
