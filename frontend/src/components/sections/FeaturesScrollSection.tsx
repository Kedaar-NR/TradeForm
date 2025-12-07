import React, { useState, useEffect } from "react";
import { FEATURES } from "../../data/features";
import FeatureCard from "../FeatureCard";
import { useInView } from "../../hooks/useInView";

const FeaturesScrollSection: React.FC = () => {
  const [sectionRef, sectionVisible] = useInView<HTMLDivElement>({
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.1,
  });

  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // Track active feature as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const featureElements = FEATURES.map((f) =>
        document.getElementById(`feature-${f.id}`)
      );

      // Find which feature is most visible in the viewport
      const viewportMiddle = window.innerHeight / 2 + window.scrollY;

      let closestIndex = 0;
      let closestDistance = Infinity;

      featureElements.forEach((el, idx) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          const elementMiddle = rect.top + window.scrollY + rect.height / 2;
          const distance = Math.abs(viewportMiddle - elementMiddle);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = idx;
          }
        }
      });

      setActiveFeatureIndex(closestIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="features-section"
      ref={sectionRef}
      className={`
        relative bg-white
        ${!sectionVisible ? "opacity-0" : ""}
        ${sectionVisible ? "tf-anim-fade-in-bottom" : ""}
      `}
    >
      {/* Intro Section */}
      <div className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className={`
              text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6
              ${sectionVisible ? "tf-anim-tracking-in-expand" : "opacity-0"}
            `}
            style={{ animationDelay: "0.2s" }}
          >
            Why teams use TradeForm
          </h2>

          <div
            className={`h-1 w-32 bg-gray-900 rounded-full mx-auto mb-8 ${
              sectionVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{ animationDelay: "0.3s", transition: 'opacity 0.6s ease' }}
          ></div>

          {/* Value Props */}
          <div
            className={`
              space-y-6 text-lg text-gray-700 max-w-3xl mx-auto
              ${sectionVisible ? "tf-anim-text-focus-in" : "opacity-0"}
            `}
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <span className="text-gray-700 text-2xl flex-shrink-0">✓</span>
              <p className="text-left">
                <span className="font-semibold text-gray-900">
                  Cut manual component search by 80%
                </span>{" "}
                with AI-powered discovery
              </p>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <span className="text-gray-700 text-2xl flex-shrink-0">✓</span>
              <p className="text-left">
                <span className="font-semibold text-gray-900">
                  Standardize trade studies
                </span>{" "}
                across teams and projects
              </p>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <span className="text-gray-700 text-2xl flex-shrink-0">✓</span>
              <p className="text-left">
                <span className="font-semibold text-gray-900">
                  Generate audit-ready reports
                </span>{" "}
                in minutes, not weeks
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div
            className={`pt-10 ${
              sectionVisible ? "tf-anim-fade-in-up-stagger" : "opacity-0"
            }`}
            style={{ animationDelay: "0.6s" }}
          >
            <button
              onClick={() =>
                window.open(
                  "https://calendly.com/team-trade-form/30min",
                  "_blank"
                )
              }
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-all shadow-lg hover:shadow-xl group"
            >
              Schedule a demo
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
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

      {/* Progress Indicator - Fixed on side */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-30">
        <div className="flex flex-col gap-3">
          {FEATURES.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => {
                const element = document.getElementById(`feature-${feature.id}`);
                element?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
              className="group flex items-center gap-3 transition-all"
              aria-label={`Jump to ${feature.title}`}
            >
              <span
                className={`
                  text-xs font-medium transition-all duration-300 opacity-0 group-hover:opacity-100
                  ${activeFeatureIndex === index ? "opacity-100" : ""}
                `}
              >
                {feature.title}
              </span>
              <div
                className={`
                  w-2 h-2 rounded-full transition-all duration-300 border-2
                  ${
                    activeFeatureIndex === index
                      ? "w-3 h-3 border-gray-900 bg-gray-900"
                      : "border-gray-300 group-hover:border-gray-400"
                  }
                `}
              ></div>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Cards - Full width centered */}
      <div className="relative">
        {FEATURES.map((feature, index) => (
          <div key={feature.id} id={`feature-${feature.id}`} className="relative">
            {/* Optional: Space for background video/image */}
            <div className="absolute inset-0 -z-10 opacity-0">
              {/* Video or image background can be added here per feature */}
              {/* <video className="w-full h-full object-cover" ... /> */}
            </div>
            <FeatureCard feature={feature} index={index} />
          </div>
        ))}
      </div>

      {/* Bottom decorative element */}
      <div className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white"></div>
        <div className="relative max-w-4xl mx-auto text-center px-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Ready to transform your trade studies?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join teams making faster, data-driven decisions
          </p>
          <button
            onClick={() =>
              window.open("https://calendly.com/team-trade-form/30min", "_blank")
            }
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesScrollSection;
