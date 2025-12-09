import React from "react";
import { useNavigate } from "react-router-dom";

const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Left side - Contact info */}
          <div className="space-y-4">
            <div>
              <a
                href="mailto:team@trade-form.com"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                team@trade-form.com
              </a>
            </div>
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()}, TradeForm
            </p>
          </div>

          {/* Right side - Navigation Links and Legal */}
          <div className="flex flex-col items-start md:items-end gap-4">
            {/* Navigation Links - Horizontal */}
            <div className="flex flex-row items-center gap-4 md:gap-6">
              <button
                onClick={() => navigate("/")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => navigate("/about")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                About
              </button>
              <button
                onClick={() => navigate("/careers")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Careers
              </button>
              <button
                onClick={() => navigate("/blog")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Blog
              </button>
            </div>

            {/* Legal Links - Bottom Right */}
            <div className="flex flex-row items-center gap-4 md:gap-6">
              <button
                onClick={() => navigate("/terms-of-service")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Terms of Service
              </button>
              <button
                onClick={() => navigate("/privacy-policy")}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
