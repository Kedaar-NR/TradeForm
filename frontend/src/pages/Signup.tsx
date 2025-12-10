import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../components/Logo";
import api from "../services/api";
import { API_BASE_URL } from "../utils/apiHelpers";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromLanding = (location.state as any)?.email || "";

  const [formData, setFormData] = useState({
    name: "",
    email: emailFromLanding,
    password: "",
  });
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });

    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate email before submitting
    if (!validateEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post("/api/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // Check onboarding status and redirect appropriately
      const onboardingStatus =
        data.user.onboarding_status || data.user.onboardingStatus;
      if (
        onboardingStatus === "not_started" ||
        onboardingStatus === "in_progress"
      ) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Signup failed:", error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create account. Please try again.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo on left */}
            <Logo textColor="dark" />

            {/* Navigation links center */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8 absolute left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => navigate("/")}
                className="text-sm transition-colors font-medium text-gray-900 hover:text-black"
              >
                Home
              </button>
              <button
                onClick={() => navigate("/about")}
                className="text-sm transition-colors font-medium text-gray-900 hover:text-black"
              >
                About
              </button>
              <button
                onClick={() => navigate("/careers")}
                className="text-sm transition-colors font-medium text-gray-900 hover:text-black"
              >
                Careers
              </button>
              <button
                onClick={() => navigate("/blog")}
                className="text-sm transition-colors font-medium text-gray-900 hover:text-black"
              >
                Blog
              </button>
            </div>

            {/* Right side: Book a demo */}
            <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
              <button
                onClick={() =>
                  window.open(
                    "https://calendly.com/team-trade-form/30min",
                    "_blank"
                  )
                }
                className="text-sm text-gray-900 hover:text-black font-medium px-4 sm:px-5 py-2 rounded-md bg-white border border-gray-300 hover:bg-gray-100 transition-all whitespace-nowrap shadow-sm"
              >
                Book a demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create your account
            </h1>
            <p className="text-gray-600">Start running trade studies</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8">
            {/* Google Signup/Login */}
            <button
              type="button"
              onClick={() => {
                const target = (API_BASE_URL || "") + "/api/auth/google/login";
                window.location.href = target;
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Sign up with Google
              </span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Full name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  className={`input-field ${
                    emailError ? "border-red-500" : ""
                  }`}
                  placeholder="you@example.com"
                  required
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input-field"
                  placeholder="Create a strong password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-black rounded border-gray-300 focus:ring-gray-1000 mt-0.5"
                  required
                />
                <label className="ml-2 text-sm text-gray-600">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/terms-of-service")}
                    className="text-black hover:text-gray-900 underline"
                  >
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/privacy-policy")}
                    className="text-black hover:text-gray-900 underline"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>

              <button
                type="submit"
                className="w-full btn-primary disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            {formError && (
              <p className="mt-4 text-sm text-red-600 text-center">
                {formError}
              </p>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-black hover:text-gray-900 font-medium"
                >
                  Log in
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            By signing up, you agree to receive product updates and marketing
            communications from TradeForm
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
