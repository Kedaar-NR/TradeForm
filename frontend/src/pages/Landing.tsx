import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import FeaturesScrollSection from "../components/sections/FeaturesScrollSection";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [useA, setUseA] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null
  );
  const heroContentRef = useRef<HTMLDivElement | null>(null);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const [heroOpacity, setHeroOpacity] = useState(1);

  const videos = useMemo(
    () => [
      "/videos/2249554-uhd_3840_2160_24fps.mp4",
      "/videos/2252797-uhd_3840_2160_30fps.mp4",
      "/videos/4990233-hd_1920_1080_30fps.mp4",
      "/videos/854274-hd_1280_720_30fps.mp4",
    ],
    []
  );

  // Preload next video for instant switching
  useEffect(() => {
    const active = useA ? videoARef.current : videoBRef.current;
    const hidden = useA ? videoBRef.current : videoARef.current;
    if (!active || !hidden) return;

    // Ensure attributes for autoplay policies
    [active, hidden].forEach((v) => {
      v.muted = true;
      v.playsInline = true as any;
    });

    const nextIndex = (currentVideoIndex + 1) % videos.length;

    // Set active current source if empty
    if (!active.src) active.src = videos[currentVideoIndex];
    // Preload next on hidden
    if (hidden.src !== videos[nextIndex]) hidden.src = videos[nextIndex];
    hidden.load();

    const onEnded = async () => {
      // Start playing hidden video first, then switch
      if (hidden.readyState < 3) {
        hidden.load();
        await new Promise((resolve) => {
          hidden.addEventListener("canplay", resolve, { once: true });
        });
      }

      // Start next video playing
      await hidden.play().catch(() => {});

      // Now instantly switch visibility
      active.style.opacity = "0";
      hidden.style.opacity = "1";

      // Swap roles and index
      setUseA((prev) => !prev);
      setCurrentVideoIndex(nextIndex);
    };

    active.addEventListener("ended", onEnded);
    // Kick play on mount
    active.play().catch(() => {});
    return () => active.removeEventListener("ended", onEnded);
  }, [useA, currentVideoIndex, videos]);
  // No source swapping inside the element anymore — handled by refs & .src

  // Handle scroll for video fade-out and hero parallax
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const fadeStart = 0;
      const fadeEnd = 800; // Fade out over 800px of scroll

      // Calculate opacity (1 to 0) based on scroll position
      const opacity = Math.max(
        0,
        Math.min(1, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart))
      );

      setVideoOpacity(opacity);
      setHeroOpacity(opacity);

      // Move hero content up slightly as user scrolls (only when still visible)
      if (heroContentRef.current && opacity > 0) {
        const maxScroll = window.innerHeight;
        const translateY = Math.min(scrollY * 0.3, maxScroll * 0.3);
        heroContentRef.current.style.transform = `translateY(-${translateY}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionMessage(null);

    const formEndpoint =
      "https://docs.google.com/forms/d/e/1FAIpQLSfXrsjpGirgzi4iahSiimOBzYJqk2cRTg5z2gINDcsGocDmlw/formResponse";

    const formData = new FormData();
    formData.append("entry.1716911821", email);

    try {
      await fetch(formEndpoint, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });
      setSubmissionMessage("You're on the waitlist. We'll be in touch soon!");
      setEmail("");
    } catch (error) {
      setSubmissionMessage(
        "Couldn't join the waitlist right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[200vh] relative overflow-x-hidden">
      {/* Full Page Video Background */}
      <div
        className="fixed inset-0 w-full h-full z-0 bg-black"
        style={{ opacity: videoOpacity }}
      >
        <video
          ref={videoARef}
          autoPlay
          muted
          playsInline
          loop={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: useA ? 1 : 0 }}
        />
        <video
          ref={videoBRef}
          autoPlay
          muted
          playsInline
          loop={false}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: useA ? 0 : 1 }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
      </div>

      {/* Navigation */}
      <nav className="z-50 sticky top-0 font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 min-h-[44px]">
            <Logo textColor="white" />

            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={() => navigate("/features")}
                className="text-xs sm:text-[13px] text-white font-medium hover:text-white/80 transition-colors px-2 sm:px-2.5 py-1 sm:py-1.5 whitespace-nowrap min-h-[32px] flex items-center font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif]"
              >
                Features
              </button>
              <button
                onClick={() =>
                  window.open(
                    "https://calendly.com/team-trade-form/30min",
                    "_blank"
                  )
                }
                className="text-xs sm:text-[13px] text-white font-medium px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm whitespace-nowrap min-h-[32px] flex items-center justify-center font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] gap-1 sm:gap-1.5"
              >
                <span className="hidden sm:inline">Schedule Demo</span>
                <span className="sm:hidden">Demo</span>
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
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
                className="hidden md:inline-flex text-xs sm:text-[13px] text-white font-medium px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm whitespace-nowrap min-h-[32px] items-center justify-center font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif]"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          willChange: "transform",
          position: "fixed",
          opacity: heroOpacity,
        }}
      >
        <div
          ref={heroContentRef}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full pointer-events-auto safe-area-inset"
        >
          <h1
            className="text-white mb-4 sm:mb-6 leading-tight tracking-tight px-2 sm:px-4"
            style={{
              fontFamily: "AllianceNo2, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(32px, 8vw, 68px)",
              lineHeight: "1.04",
              marginTop: "clamp(20px, 5vh, 40px)",
            }}
          >
            Trade Studies{" "}
            <span
              style={{
                borderBottom: "4px solid currentColor",
                paddingBottom: "4px",
              }}
            >
              Simplified
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-2 sm:px-4">
            <span className="font-bold">Automate</span> component evaluation and
            scoring.
            <br />
            <span className="font-bold">Faster</span> data-driven decisions.
          </p>

          {/* CTA Buttons and Email Form */}
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
            {/* Button */}
            <div className="flex justify-center -mt-4 sm:-mt-6 mb-3 sm:mb-4 px-2 sm:px-4">
              <button
                onClick={() =>
                  window.open(
                    "https://calendly.com/team-trade-form/30min",
                    "_blank"
                  )
                }
                className="text-sm sm:text-base text-white font-bold px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 transition-all backdrop-blur-sm whitespace-nowrap min-h-[44px] font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] flex items-center justify-center gap-2"
              >
                Schedule Demo
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
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
            </div>

            {/* Email Form */}
            <form
              onSubmit={handleJoinWaitlist}
              className="max-w-md mx-auto px-2 sm:px-4"
            >
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-2.5 sm:px-3 py-1.5 sm:py-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-3 sm:px-3 py-1.5 sm:py-2 rounded-md border-0 focus:ring-0 outline-none text-gray-900 placeholder-gray-500 bg-transparent text-sm min-h-[36px]"
                  required
                />
                <button
                  type="submit"
                  className="bg-black hover:bg-black/90 active:bg-black/80 text-white px-4 sm:px-5 md:px-7 py-1.5 sm:py-2 rounded-md font-semibold transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed text-sm min-h-[36px] flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  Join Waitlist
                </button>
              </div>
              {submissionMessage && (
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/80 text-center px-2">
                  {submissionMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Features Section - Scrollable Content */}
      <div className="relative z-20" style={{ marginTop: "100vh" }}>
        <FeaturesScrollSection />
      </div>
    </div>
  );
};

export default Landing;
