import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectSetup from './pages/ProjectSetup';
import CriteriaDefinition from './pages/CriteriaDefinition';
import Results from './pages/Results';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes - require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-project"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectSetup />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/criteria"
          element={
            <ProtectedRoute>
              <Layout>
                <CriteriaDefinition />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <Layout>
                <Results />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/results"
          element={
            <ProtectedRoute>
              <Layout>
                <Results />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
