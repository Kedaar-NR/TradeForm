import React from "react";
import { FEATURES } from "../../data/features";
import FeatureCard from "../FeatureCard";
import { useInView } from "../../hooks/useInView";

const FeaturesScrollSection: React.FC = () => {
  const [sectionRef, sectionVisible] = useInView<HTMLDivElement>({
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.1,
  });

  return (
    <section
      ref={sectionRef}
      className={`
        py-24 sm:py-32 bg-white
        ${!sectionVisible ? "opacity-0" : ""}
        ${sectionVisible ? "tf-anim-fade-in-bottom" : ""}
      `}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Desktop: Two-column layout */}
        <div className="grid md:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column - Sticky Content */}
          <div className="md:col-span-4 lg:col-span-5">
            <div className="md:sticky md:top-24 space-y-6">
              {/* Main Heading */}
              <h2
                className={`
                  text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight
                  ${sectionVisible ? "tf-anim-tracking-in-expand" : "opacity-0"}
                `}
                style={{ animationDelay: "0.2s" }}
              >
                Why teams use TradeForm
              </h2>

              {/* Value Props */}
              <div
                className={`
                  space-y-4 text-base sm:text-lg text-gray-600
                  ${sectionVisible ? "tf-anim-text-focus-in" : "opacity-0"}
                `}
                style={{ animationDelay: "0.4s" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-primary-600 mt-1 flex-shrink-0">✓</span>
                  <p>
                    <span className="font-semibold text-gray-900">
                      Cut manual component search by 80%
                    </span>{" "}
                    with AI-powered discovery
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary-600 mt-1 flex-shrink-0">✓</span>
                  <p>
                    <span className="font-semibold text-gray-900">
                      Standardize trade studies
                    </span>{" "}
                    across teams and projects
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-primary-600 mt-1 flex-shrink-0">✓</span>
                  <p>
                    <span className="font-semibold text-gray-900">
                      Generate audit-ready reports
                    </span>{" "}
                    in minutes, not weeks
                  </p>
                </div>
              </div>

              {/* Optional CTA */}
              <div className="pt-4">
                <button
                  onClick={() =>
                    window.open(
                      "https://calendly.com/team-trade-form/30min",
                      "_blank"
                    )
                  }
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors group"
                >
                  Schedule a demo
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Scrolling Feature Cards */}
          <div className="md:col-span-8 lg:col-span-7 space-y-6">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesScrollSection;
