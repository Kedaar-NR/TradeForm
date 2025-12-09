import React, { useEffect, useRef, useState } from "react";

const CompanyLogoSlider: React.FC = () => {
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const scrollPositionRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  const companies = [
    { name: "Purdue", logo: "/logos/purdue logo.png" },
    { name: "M.E.T.", logo: "/logos/m.e.t. logo.png" },
    { name: "NASA", logo: "/logos/nasa logo.png" },
    { name: "Boeing", logo: "/logos/boeing logo.png" },
    { name: "Blue Origin", logo: "/logos/blue origin logo.png" },
    { name: "BAIR", logo: "/logos/BAIR logo.png" },
    { name: "Mercor", logo: "/logos/mercor logo.png" },
    { name: "McLaren F1", logo: "/logos/mclaren f1 logo.png" },
    { name: "Cisco", logo: "/logos/cisco logo.png" },
    { name: "Stanford Medicine", logo: "/logos/stanford medicine logo.png" },
    { name: "Qualcomm", logo: "/logos/qualcomm logo.png" },
  ];

  useEffect(() => {
    if (!scrollTrackRef.current) return;

    // Check for prefers-reduced-motion accessibility preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    // Prevent multiple animation loops from starting
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // Constants for calculation - use fixed count to prevent glitching
    const LOGO_WIDTH = 160; // px
    const LOGO_MARGIN = 80; // px
    const LOGO_TOTAL_WIDTH = LOGO_WIDTH + LOGO_MARGIN; // 240px
    const LOGO_COUNT = 11; // Fixed count to prevent recalculation issues
    const ONE_SET_WIDTH = LOGO_TOTAL_WIDTH * LOGO_COUNT;
    const SPEED_PER_SECOND = 72; // pixels per second (constant speed regardless of frame rate)

    // Timestamp-based animation using requestAnimationFrame
    const animate = (currentTime: number) => {
      if (!scrollTrackRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Initialize lastTime on first frame (skip this frame for calculation)
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // Calculate delta time in seconds
      let deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      // Clamp deltaTime to prevent huge jumps (e.g., tab switches, browser pauses)
      // Max 100ms delta = smooth recovery from pauses without visible jumps
      deltaTime = Math.min(deltaTime, 0.1);

      // Increment scroll position based on elapsed time (frame-rate independent)
      scrollPositionRef.current += SPEED_PER_SECOND * deltaTime;

      // Reset seamlessly when first complete set has scrolled
      // This ensures all logos pass through viewport before loop
      if (scrollPositionRef.current >= ONE_SET_WIDTH) {
        scrollPositionRef.current = scrollPositionRef.current - ONE_SET_WIDTH;
      }

      // Round to nearest pixel to prevent sub-pixel jitter
      const roundedPosition = Math.round(scrollPositionRef.current);

      // Apply transform with translate3d for GPU acceleration (smoother animation)
      scrollTrackRef.current.style.transform = `translate3d(-${roundedPosition}px, 0, 0)`;

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Listen for changes to motion preference while page is open
    const handleMotionPreferenceChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // User enabled reduced motion - stop animation
        isAnimatingRef.current = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = undefined;
        }
        // Reset to static position
        if (scrollTrackRef.current) {
          scrollTrackRef.current.style.transform = "translate3d(0, 0, 0)";
        }
      } else {
        // User disabled reduced motion - start animation if not already running
        if (!isAnimatingRef.current) {
          isAnimatingRef.current = true;
          lastTimeRef.current = 0;
          scrollPositionRef.current = 0;
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      }
    };

    // Add listener for motion preference changes BEFORE early return
    prefersReducedMotion.addEventListener(
      "change",
      handleMotionPreferenceChange
    );

    // If user currently prefers reduced motion, don't start animation
    if (prefersReducedMotion.matches) {
      // Keep logos static at initial position for accessibility
      if (scrollTrackRef.current) {
        scrollTrackRef.current.style.transform = "translate3d(0, 0, 0)";
      }
      // Early return but listener is already registered for future changes
      return () => {
        prefersReducedMotion.removeEventListener(
          "change",
          handleMotionPreferenceChange
        );
      };
    }

    // Start animation after a brief delay to ensure layout is ready
    const startTimeout = window.setTimeout(() => {
      lastTimeRef.current = 0; // Reset time reference
      animationFrameRef.current = requestAnimationFrame(animate);
    }, 100);

    // Cleanup
    return () => {
      isAnimatingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      clearTimeout(startTimeout);
      lastTimeRef.current = 0;
      prefersReducedMotion.removeEventListener(
        "change",
        handleMotionPreferenceChange
      );
    };
  }, []);

  return (
    <section className="relative bg-white py-6 px-6 overflow-hidden">
      {/* Manufacturing positioning text */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 text-center mb-8">
        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-normal text-gray-900 leading-tight mb-4"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
          }}
        >
          We build fast so you can manufacture{" "}
          <span className="text-gray-500">smarter.</span>
        </h2>
        <p
          className="text-base sm:text-lg text-gray-700 leading-relaxed"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
          }}
        >
          Keep production moving with automated evaluation, scoring, and
          reporting so teams can test and iterate without slowing the line.
        </p>
      </div>

      {/* Features Section - Interactive Two Column */}
      <div className="bg-white">
        <FeaturesInteractiveSection />
      </div>

      <div className="max-w-7xl mx-auto mt-16 sm:mt-20 lg:mt-24 bg-white pb-12">
        {/* Header */}
        <div className="text-center mb-6">
          <h3
            className="text-xl sm:text-2xl lg:text-3xl font-normal text-gray-900 tracking-tight"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
            }}
          >
            Built by engineers from
          </h3>
        </div>

        {/* Logo Slider */}
        <div className="relative">
          {/* Gradient overlays for smooth fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

          {/* Scrolling container */}
          <div className="overflow-hidden py-8">
            <div
              ref={scrollTrackRef}
              className="flex items-center"
              style={{
                willChange: "transform",
                backfaceVisibility: "hidden",
                perspective: "1000px",
                transform: "translateZ(0)",
              }}
            >
              {/* First set of logos */}
              {companies.map((company, index) => (
                <div
                  key={`${company.name}-1-${index}`}
                  className="flex-shrink-0 logo-hover-effect"
                  style={{
                    width: "160px",
                    marginRight: "80px",
                  }}
                >
                  <img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="h-12 w-full object-contain"
                  />
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {companies.map((company, index) => (
                <div
                  key={`${company.name}-2-${index}`}
                  className="flex-shrink-0 logo-hover-effect"
                  style={{
                    width: "160px",
                    marginRight: "80px",
                  }}
                >
                  <img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="h-12 w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Optional subtitle */}
        <div className="text-center mt-6">
          <p
            className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto"
            style={{
              fontFamily:
                'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
          >
            Trusted by engineers at leading aerospace, defense, and technology
            companies
          </p>
        </div>
      </div>
    </section>
  );
};

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
    <div className="max-w-5xl mx-auto mt-6 px-6 pb-10">
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.85fr,1fr] gap-1 lg:gap-4 items-center justify-center">
        {/* Left Column - Feature List */}
        <div className="flex flex-col gap-14 ml-0 lg:ml-12">
          {features.map((feature, index) => {
            const isActive = index === selectedIndex;
            return (
              <div
                key={index}
                onClick={() => setSelectedIndex(index)}
                className="cursor-pointer group transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-baseline gap-3">
                  <h3
                    className={`text-5xl sm:text-6xl lg:text-7xl font-normal transition-all duration-300 ${
                      isActive
                        ? "text-gray-900"
                        : "text-gray-300/70 group-hover:text-gray-400"
                    }`}
                    style={{
                      fontFamily:
                        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <span
                    className={`text-xs tracking-[0.08em] ${
                      isActive ? "text-gray-500" : "text-gray-300/70"
                    }`}
                    style={{
                      fontFamily:
                        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontWeight: 300,
                    }}
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
          <div className="relative rounded-[24px] overflow-hidden shadow-[0_18px_45px_rgba(17,24,39,0.12)] min-h-[580px] max-w-[640px] lg:max-w-[600px]">
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
              <h2
                className="text-4xl sm:text-5xl font-normal mb-6"
                style={{
                  fontFamily:
                    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 300,
                }}
              >
                {selectedFeature.title}
              </h2>
              <p
                className="text-base sm:text-lg mb-8 leading-relaxed text-white/95"
                style={{
                  fontFamily:
                    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 300,
                }}
              >
                {selectedFeature.description}
              </p>
              <div className="mt-auto pt-10">
                <button
                  onClick={() =>
                    window.open(
                      "https://calendly.com/team-trade-form/30min",
                      "_blank"
                    )
                  }
                  className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity self-start"
                  style={{
                    fontFamily:
                      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    fontWeight: 300,
                  }}
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
                  <span className="text-base font-normal">
                    Book a free call
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogoSlider;
