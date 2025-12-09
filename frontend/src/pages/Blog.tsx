import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Footer from "../components/Footer";

const Blog: React.FC = () => {
  const navigate = useNavigate();
  const [showFullArticle, setShowFullArticle] = useState(false);

  useEffect(() => {
    document.title = "Blog • TradeForm";
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
      <div className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {!showFullArticle ? (
            /* Blog Post Card - Preview */
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="w-full md:w-1/2 flex-shrink-0 rounded-l-lg overflow-hidden">
                  <img
                    src="/media/blog1.jpg"
                    alt="What is TradeForm"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                  <div>
                    {/* Header with logo, author, category, date */}
                    <div className="flex items-center gap-2 mb-4">
                      <Logo
                        textColor="dark"
                        size="sm"
                        showText={false}
                        clickable={false}
                      />
                      <span className="text-sm text-gray-600">
                        Kedaar Rentachintala • TradeForm •{" "}
                        {new Date().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Headline */}
                    <h1
                      className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      What is TradeForm?
                    </h1>

                    {/* Body Text - Preview */}
                    <p
                      className="text-base text-gray-600 leading-relaxed mb-6"
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      We're building the future of manufacturing. TradeForm is
                      revolutionizing how engineers and manufacturers evaluate
                      components, streamline trade studies, and make data-driven
                      decisions that keep the defense industrial base moving
                      forward.
                    </p>
                  </div>

                  {/* Read article link */}
                  <div>
                    <button
                      onClick={() => setShowFullArticle(!showFullArticle)}
                      className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center gap-1"
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      {showFullArticle ? "Show less" : "Read article →"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Full Article View */
            <div className="max-w-4xl mx-auto">
              {/* Back Button */}
              <button
                onClick={() => setShowFullArticle(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Logo
                    textColor="dark"
                    size="sm"
                    showText={false}
                    clickable={false}
                  />
                  <span className="text-sm text-gray-600">
                    Kedaar Rentachintala • TradeForm •{" "}
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h1
                  className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                  }}
                >
                  What is TradeForm?
                </h1>
              </div>

              {/* Image */}
              <div className="mb-8 rounded-lg overflow-hidden">
                <img
                  src="/media/blog1.jpg"
                  alt="What is TradeForm"
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Full Article Content */}
              <div className="prose prose-lg max-w-none">
                <div
                  className="text-base text-gray-700 leading-relaxed space-y-6"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                  }}
                >
                  <p>
                    TradeForm automates the full lifecycle of engineering trade
                    studies. Hardware companies in aerospace, automotive,
                    energy, robotics, defense, semiconductors, and advanced
                    manufacturing rely on trade studies to decide which
                    components, subsystems, or architectures move forward. Teams
                    run evaluations continually, often several times a month,
                    and each one consumes significant engineering time.
                  </p>
                  <p>
                    Engineers gather datasheets, internal reports, supplier
                    documents, and archived design notes. They extract
                    specifications by hand, compare alternatives line by line,
                    weigh performance targets against procurement constraints,
                    and assemble a final report for review. That workflow slows
                    down R&D and forces teams to spend time on manual tasks
                    instead of engineering work.
                  </p>
                  <p>
                    TradeForm acts as an AI assistant that manages the entire
                    process:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Reads internal documents, historical studies,
                      requirements, and design constraints
                    </li>
                    <li>
                      Extracts specifications, performance data, tolerances,
                      compliance notes, and supplier details from datasheets,
                      BOMs, CAD metadata, test reports, and vendor files
                    </li>
                    <li>
                      Performs criteria scoring once engineers define goals,
                      with transparent rationale and gap detection
                    </li>
                    <li>
                      Integrates sourcing data, including supplier options, lead
                      times, qualification information, and price expectations
                    </li>
                    <li>
                      Generates clean, consistent reports aligned with internal
                      engineering review standards
                    </li>
                  </ul>
                  <p>
                    Engineers stay in control, and the assistant handles the
                    repetitive work that slows down decision-making.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Blog;
