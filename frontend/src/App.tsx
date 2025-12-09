import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import ProjectSetup from "./pages/ProjectSetup";
import CriteriaDefinition from "./pages/CriteriaDefinition";
import ComponentDiscovery from "./pages/ComponentDiscovery";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectGroupDetail from "./pages/ProjectGroupDetail";
import Results from "./pages/Results";
import Documentation from "./pages/Documentation";
import Templates from "./pages/Templates";
import DatasheetLab from "./pages/DatasheetLab";
import Onboarding from "./pages/Onboarding";
import Suppliers from "./pages/Suppliers";
import Scheduler from "./pages/Scheduler";
import SharedSupplier from "./pages/SharedSupplier";

// Protected Route wrapper
// TODO: TEMPORARILY BYPASSED FOR DEVELOPMENT - Re-enable auth check when fixing auth
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  // const hasWindow = typeof window !== "undefined";
  // const token = hasWindow ? localStorage.getItem("authToken") : null;
  // const isAuthenticated =
  //   hasWindow && localStorage.getItem("isAuthenticated") === "true" && !!token;

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  // Temporarily allow all access for feature development
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/suppliers/shared/:shareToken"
          element={<SharedSupplier />}
        />

        {/* Onboarding routes - protected */}
        <Route
          path="/onboarding/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Onboarding />
              </Layout>
            </ProtectedRoute>
          }
        />

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
          path="/project-group/:projectGroupId"
          element={
            <ProtectedRoute>
              <Layout>
                <ProjectGroupDetail />
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
          path="/suppliers"
          element={
            <ProtectedRoute>
              <Layout>
                <Suppliers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scheduler"
          element={
            <ProtectedRoute>
              <Layout>
                <Scheduler />
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
