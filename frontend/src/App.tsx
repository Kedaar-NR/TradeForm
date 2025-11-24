import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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
import Templates from "./pages/Templates";
import DatasheetLab from "./pages/DatasheetLab";
import Onboarding from "./pages/Onboarding";
import { getLocalStorageOnboardingStatus } from "./utils/onboardingHelpers";

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

// Onboarding Guard - checks if user needs onboarding
const OnboardingGuard = ({ children }: { children: ReactNode }) => {
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = () => {
      try {
        const status = getLocalStorageOnboardingStatus();
        
        // Redirect to onboarding if status is not_started or in_progress
        if (status === 'not_started' || status === 'in_progress') {
          setNeedsOnboarding(true);
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
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

        {/* Onboarding routes - protected but bypass onboarding guard */}
        <Route
          path="/onboarding/*"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Protected routes - require authentication and onboarding */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <Dashboard />
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-project"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <ProjectSetup />
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/criteria"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <CriteriaDefinition />
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/discovery"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <ComponentDiscovery />
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/details"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <ProjectDetails />
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <ProjectDetails />
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/project/:projectId/results"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <Results />
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documentation"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <Documentation />
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <Templates />
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/datasheet-lab"
          element={
            <ProtectedRoute>
              <OnboardingGuard>
                <Layout>
                  <DatasheetLab />
                </Layout>
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
