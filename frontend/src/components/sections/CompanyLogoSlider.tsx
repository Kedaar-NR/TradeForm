import React, { useEffect, useRef } from "react";

const CompanyLogoSlider: React.FC = () => {
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const scrollPositionRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!scrollTrackRef.current) return;

    // Check for prefers-reduced-motion accessibility preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    // Prevent multiple animation loops from starting
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // Constants for calculation
    const LOGO_WIDTH = 160; // px
    const LOGO_MARGIN = 80; // px
    const LOGO_TOTAL_WIDTH = LOGO_WIDTH + LOGO_MARGIN; // 240px
    const LOGO_COUNT = 11;
    const ONE_SET_WIDTH = LOGO_TOTAL_WIDTH * LOGO_COUNT; // 2,880px
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
      // This ensures all 12 logos pass through viewport before loop
      if (scrollPositionRef.current >= ONE_SET_WIDTH) {
        scrollPositionRef.current = scrollPositionRef.current % ONE_SET_WIDTH;
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

  return (
    <section className="relative bg-white py-16 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h3
            className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight"
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
                    className="h-14 w-full object-contain"
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
                    className="h-14 w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Optional subtitle */}
        <div className="text-center mt-8">
          <p
            className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
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

export default CompanyLogoSlider;
