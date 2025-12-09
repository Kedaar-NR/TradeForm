import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Footer from "../components/Footer";

const Careers: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Careers • TradeForm";
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 min-h-[44px]">
            {/* Logo on left */}
            <Logo textColor="dark" size="md" />

            {/* Navigation Links in center */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8 absolute left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                Home
              </button>
              <button
                onClick={() => navigate("/about")}
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                About
              </button>
              <button
                onClick={() => navigate("/careers")}
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                Careers
              </button>
              <button
                onClick={() => navigate("/blog")}
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                Blog
              </button>
            </div>

            {/* Right side: Sign in text + Button */}
            <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0 ml-auto">
              <button
                onClick={() => {
                  const token = localStorage.getItem("token");
                  if (token) {
                    navigate("/dashboard");
                  } else {
                    navigate("/login");
                  }
                }}
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors font-medium"
              >
                Sign in
              </button>
              <button
                onClick={() =>
                  window.open(
                    "https://calendly.com/team-trade-form/30min",
                    "_blank"
                  )
                }
                className="text-sm text-black font-medium px-4 sm:px-5 py-2 rounded-md bg-white hover:bg-gray-100 transition-all whitespace-nowrap border border-gray-300"
              >
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="py-8 px-4 flex-1">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <h1
              className="text-gray-900 mb-3 text-center"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                fontWeight: 800,
                fontSize: "clamp(28px, 7vw, 58px)",
                lineHeight: "1.04",
              }}
            >
              We're hiring for every role
            </h1>
            <p className="text-base sm:text-lg text-gray-700 text-center max-w-2xl">
              Fill this form out, we'll ask identifying information, your best
              technical work, and what you want to work on.
            </p>
          </div>

          {/* Typeform */}
          <div className="mt-8 flex justify-center">
            <iframe
              id="typeform-full"
              width="100%"
              height="600"
              frameBorder="0"
              allow="camera; microphone; autoplay; encrypted-media;"
              src="https://form.typeform.com/to/d9Z2sM9U"
              className="rounded-lg shadow-lg"
              style={{ minHeight: "600px", maxWidth: "1200px" }}
            ></iframe>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Careers;
