import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

const Features: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate("/features")}
                className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors px-2 py-1 font-medium"
              >
                Features
              </button>
              <button
                onClick={() => window.open("https://calendly.com", "_blank")}
                className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 font-medium px-3 sm:px-5 py-2 rounded-lg border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 sm:gap-2"
              >
                <span className="hidden sm:inline">Schedule Demo</span>
                <span className="sm:hidden">Demo</span>
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </button>
              <button
                onClick={() => navigate("/login")}
                className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 font-medium px-3 sm:px-5 py-2 rounded-lg border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Features Section */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 -mt-2">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight flex items-center justify-center gap-3">
              <span role="img" aria-label="USA">
                🇺🇸
              </span>
              TradeForm Features
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="gear">
                  ⚙️
                </span>
                Automated Scoring
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-4 sm:ml-12">
                <li>Score and rank components against weighted criteria</li>
                <li>
                  Adjust weights in real-time, see instant ranking updates
                </li>
                <li>
                  Multi-dimensional evaluation across performance, cost,
                  reliability
                </li>
                <li>Objective, data-backed decision support</li>
              </ul>
            </div>

            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="lightning">
                  ⚡
                </span>
                Fast Results
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-4 sm:ml-12">
                <li>Complete trade studies in minutes instead of weeks</li>
                <li>Parallel AI-assisted component discovery</li>
                <li>Automated technical specification gathering</li>
                <li>Simultaneous scoring across all alternatives</li>
              </ul>
            </div>

            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="chart">
                  📊
                </span>
                Reports & Exports
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-4 sm:ml-12">
                <li>Presentation-ready reports with professional charts</li>
                <li>Sensitivity analysis and trade-off visualizations</li>
                <li>CSV/Excel export for further processing</li>
                <li>Tornado diagrams, spider charts, comparison matrices</li>
              </ul>
            </div>

            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="abacus">
                  🧮
                </span>
                Custom Criteria
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-4 sm:ml-12">
                <li>Define bespoke criteria tailored to your decisions</li>
                <li>Templates for common trade study types</li>
                <li>Custom scoring rubrics and thresholds</li>
                <li>Support for quantitative and qualitative assessments</li>
              </ul>
            </div>

            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="clock">
                  🕒
                </span>
                Version History
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-4 sm:ml-12">
                <li>Track every design iteration and decision point</li>
                <li>Compare alternatives side-by-side with visual diffs</li>
                <li>Roll back to previous versions or explore branches</li>
                <li>Essential for design reviews and compliance audits</li>
              </ul>
            </div>

            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="people">
                  👥
                </span>
                Team Collaboration
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-4 sm:ml-12">
                <li>Share studies with team members and stakeholders</li>
                <li>Comment inline on specific criteria or components</li>
                <li>Capture decision rationale and approval trails</li>
                <li>Track who changed what and when</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Left Column - Brand Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Logo />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                TradeForm simplified your trade study workflow and accelerates
                data-driven decisions.
              </p>
            </div>

            {/* Middle Column - Company Links */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Company</h3>
              <div className="space-y-2">
                <button className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left">
                  About
                </button>
                <button className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left">
                  Careers
                </button>
                <button className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left">
                  Contact
                </button>
              </div>
            </div>

            {/* Right Column - Legal Links */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900">Legal</h3>
              <div className="space-y-2">
                <button className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left">
                  Privacy Policy
                </button>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  LinkedIn
                </a>
                <button className="block text-sm text-gray-600 hover:text-gray-900 transition-colors text-left">
                  United States
                </button>
              </div>
            </div>
          </div>

          {/* Separator Line */}
          <div className="border-t border-gray-200 mb-6"></div>

          {/* Copyright */}
          <p className="text-xs text-gray-500 text-center">
            © 2025 TradeForm. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Features;
