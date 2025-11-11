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

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/features")}
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors px-2 py-1 font-medium"
              >
                Features
              </button>
              <button
                onClick={() => window.open("https://calendly.com", "_blank")}
                className="text-sm text-gray-700 hover:text-gray-900 font-medium px-5 py-2 rounded-lg border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                Schedule Demo
                <svg
                  className="w-4 h-4"
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
                className="text-sm text-gray-700 hover:text-gray-900 font-medium px-5 py-2 rounded-lg border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
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
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-12">
                <li className="whitespace-nowrap">Score and rank components against weighted criteria</li>
                <li className="whitespace-nowrap">Adjust weights in real-time, see instant ranking updates</li>
                <li className="whitespace-nowrap">Multi-dimensional evaluation across performance, cost, reliability</li>
                <li className="whitespace-nowrap">Objective, data-backed decision support</li>
              </ul>
            </div>

            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="lightning">
                  ⚡
                </span>
                Fast Results
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-12">
                <li className="whitespace-nowrap">Complete trade studies in minutes instead of weeks</li>
                <li className="whitespace-nowrap">Parallel AI-assisted component discovery</li>
                <li className="whitespace-nowrap">Automated technical specification gathering</li>
                <li className="whitespace-nowrap">Simultaneous scoring across all alternatives</li>
              </ul>
            </div>

            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="chart">
                  📊
                </span>
                Reports & Exports
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-12">
                <li className="whitespace-nowrap">Presentation-ready reports with professional charts</li>
                <li className="whitespace-nowrap">Sensitivity analysis and trade-off visualizations</li>
                <li className="whitespace-nowrap">CSV/Excel export for further processing</li>
                <li className="whitespace-nowrap">Tornado diagrams, spider charts, comparison matrices</li>
              </ul>
            </div>

            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="abacus">
                  🧮
                </span>
                Custom Criteria
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-12">
                <li className="whitespace-nowrap">Define bespoke criteria tailored to your decisions</li>
                <li className="whitespace-nowrap">Templates for common trade study types</li>
                <li className="whitespace-nowrap">Custom scoring rubrics and thresholds</li>
                <li className="whitespace-nowrap">Support for quantitative and qualitative assessments</li>
              </ul>
            </div>

            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="clock">
                  🕒
                </span>
                Version History
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-12">
                <li className="whitespace-nowrap">Track every design iteration and decision point</li>
                <li className="whitespace-nowrap">Compare alternatives side-by-side with visual diffs</li>
                <li className="whitespace-nowrap">Roll back to previous versions or explore branches</li>
                <li className="whitespace-nowrap">Essential for design reviews and compliance audits</li>
              </ul>
            </div>

            <div className="p-10 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
                <span role="img" aria-label="people">
                  👥
                </span>
                Team Collaboration
              </h3>
              <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-12">
                <li className="whitespace-nowrap">Share studies with team members and stakeholders</li>
                <li className="whitespace-nowrap">Comment inline on specific criteria or components</li>
                <li className="whitespace-nowrap">Capture decision rationale and approval trails</li>
                <li className="whitespace-nowrap">Track who changed what and when</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
