import React, { useState } from "react";

const FeaturesInteractiveSection: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const features = [
    {
      title: "Criteria",
      description:
        "Codify what matters with reusable rubrics and weights so every evaluation aligns to your standards and never drifts.",
      videoSrc: "/media/1.mp4",
    },
    {
      title: "Scoring",
      description:
        "Score and rank components against weighted criteria automatically, with live recalculations as specs or priorities change.",
      videoSrc: "/media/2.mp4",
    },
    {
      title: "Results",
      description:
        "Run full trade studies in minutes—not weeks—with parallel discovery, spec gathering, and scoring that never misses a dependency.",
      videoSrc: "/media/3.mp4",
    },
    {
      title: "Reports",
      description:
        "Spin up executive-ready decks and technical appendices automatically, complete with visuals, citations, and decision rationale.",
      videoSrc: "/media/4.mp4",
    },
  ];

  const selectedFeature = features[selectedIndex];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-3">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-gray-900 mb-4 max-w-4xl mx-auto leading-[1.05] font-sans">
            Build smarter, ship <span className="text-gray-500">faster.</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-800 max-w-3xl mx-auto leading-relaxed font-sans">
            Features engineered for manufacturing teams that automate, iterate,
            and hit deadlines.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,0.9fr] gap-1 lg:gap-2 items-start">
          {/* Left Column - Feature List */}
          <div className="flex flex-col gap-6">
            {features.map((feature, index) => {
              const isActive = index === selectedIndex;
              return (
                <div
                  key={index}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className="cursor-pointer group transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-baseline gap-3">
                    <h3
                      className={`text-5xl sm:text-6xl lg:text-7xl font-normal transition-all duration-300 ${
                        isActive
                          ? "text-gray-900"
                          : "text-gray-300/70 group-hover:text-gray-400"
                      } font-sans`}
                    >
                      {feature.title}
                    </h3>
                    <span
                      className={`text-xs tracking-[0.08em] ${
                        isActive ? "text-gray-500" : "text-gray-300/70"
                      } font-sans`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column - Feature Details with video background */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="relative rounded-[24px] overflow-hidden shadow-[0_18px_45px_rgba(17,24,39,0.12)] min-h-[520px] max-w-[520px] lg:max-w-[500px]">
              <video
                className="absolute inset-0 w-full h-full object-cover"
                src={selectedFeature.videoSrc}
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/35" />
              <div className="relative p-6 sm:p-7 lg:p-8 text-white flex flex-col h-full">
                <h2 className="text-4xl sm:text-5xl font-normal mb-6 font-sans">
                  {selectedFeature.title}
                </h2>
                <p className="text-base sm:text-lg mb-8 leading-relaxed text-white/95 font-sans">
                  {selectedFeature.description}
                </p>
                <button
                  onClick={() =>
                    window.open(
                      "https://calendly.com/team-trade-form/30min",
                      "_blank"
                    )
                  }
                  className="absolute bottom-0 left-6 sm:left-7 lg:left-8 flex items-center gap-2 text-white hover:opacity-90 transition-opacity pb-3 font-sans"
                >
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
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <span className="text-base font-normal">Book a free call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesInteractiveSection;
