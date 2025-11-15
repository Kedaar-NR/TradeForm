import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import type { ReactNode } from "react";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import ProjectSetup from "./pages/ProjectSetup";
import CriteriaDefinition from "./pages/CriteriaDefinition";
import ComponentDiscovery from "./pages/ComponentDiscovery";
import ProjectDetails from "./pages/ProjectDetails";
import Results from "./pages/Results";
import Documentation from "./pages/Documentation";
import Help from "./pages/Help";
import Templates from "./pages/Templates";
import DatasheetLab from "./pages/DatasheetLab";

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const hasWindow = typeof window !== "undefined";
  const token = hasWindow ? localStorage.getItem("authToken") : null;
  const isAuthenticated =
    hasWindow && localStorage.getItem("isAuthenticated") === "true" && !!token;

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
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
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
          path="/project/:projectId/discovery"
          element={
            <ProtectedRoute>
              <Layout>
                <ComponentDiscovery />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/details"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectDetails />
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
        <Route
          path="/documentation"
          element={
            <ProtectedRoute>
              <Layout>
                <Documentation />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <Layout>
                <Help />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <Layout>
                <Templates />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/datasheet-lab"
          element={
            <ProtectedRoute>
              <Layout>
                <DatasheetLab />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
