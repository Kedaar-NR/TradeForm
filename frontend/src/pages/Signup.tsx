import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../components/Logo";
import api from "../services/api";

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
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
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
