import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import CompanyLogoSlider from "../components/sections/CompanyLogoSlider";
import Footer from "../components/Footer";

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
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    document.title = "TradeForm";
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const videos = useMemo(
    () => ["/media/vid.mp4", "/media/vid2.mp4", "/media/vid3.mp4"],
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
      v.preload = "auto";
    });

    const nextIndex = (currentVideoIndex + 1) % videos.length;

    // Set active current source if empty
    if (!active.src) active.src = videos[currentVideoIndex];
    // Preload next on hidden
    if (hidden.src !== videos[nextIndex]) hidden.src = videos[nextIndex];
    hidden.load();

    const onEnded = async () => {
      // Ensure next video is ready and playing before switching
      if (hidden.readyState < 3) {
        hidden.load();
        await new Promise((resolve) => {
          hidden.addEventListener("canplay", resolve, { once: true });
        });
      }

      // Start playing the next video
      await hidden.play().catch(() => {});

      // Smooth transition between videos
      active.style.transition = "opacity 0.3s ease-in-out";
      hidden.style.transition = "opacity 0.3s ease-in-out";
      active.style.opacity = "0";
      hidden.style.opacity = "1";

      // Swap roles and index after a brief delay to ensure smooth transition
      setTimeout(() => {
        setUseA((prev) => !prev);
        setCurrentVideoIndex(nextIndex);
      }, 100);
    };

    active.addEventListener("ended", onEnded);
    // Kick play on mount
    active.play().catch(() => {});
    return () => active.removeEventListener("ended", onEnded);
  }, [useA, currentVideoIndex, videos]);
  // No source swapping inside the element anymore — handled by refs & .src

  // No scroll handler needed - content stays visible, just scroll normally

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
    <div className="relative overflow-x-hidden bg-black">
      {/* Hero Section with Video Background */}
      <div className="relative min-h-screen">
        {/* Full Page Video Background - Absolute within hero section */}
        <div className="absolute inset-0 w-full h-full z-10">
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
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/60"></div>
        </div>

        {/* Navigation */}
        <nav
          className={`z-50 fixed top-0 left-0 right-0 safe-area-top transition-colors duration-300 ${
            navScrolled
              ? "bg-white/90 backdrop-blur-md shadow-sm"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16 min-h-[44px]">
              {/* Logo on left */}
              <Logo textColor="dark" size="md" />

              {/* Navigation Links in center */}
              <div className="hidden md:flex items-center gap-6 lg:gap-8 absolute left-1/2 transform -translate-x-1/2">
                <button
                  onClick={() => navigate("/")}
                  className="text-sm transition-colors font-medium text-gray-900 hover:text-black"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                  }}
                >
                  Home
                </button>
                <button
                  onClick={() => navigate("/about")}
                  className="text-sm transition-colors font-medium text-gray-900 hover:text-black"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                  }}
                >
                  About
                </button>
                <button
                  onClick={() => navigate("/careers")}
                  className="text-sm transition-colors font-medium text-gray-900 hover:text-black"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                  }}
                >
                  Careers
                </button>
                <button
                  onClick={() => navigate("/blog")}
                  className="text-sm transition-colors font-medium text-gray-900 hover:text-black"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                  }}
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
                  className={`text-sm transition-colors font-medium ${
                    navScrolled
                      ? "text-gray-900 hover:text-black"
                      : "text-white/90 hover:text-white"
                  }`}
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                  }}
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
                  className="text-sm text-black font-medium px-4 sm:px-5 py-2 rounded-md bg-white hover:bg-gray-100 transition-all whitespace-nowrap"
                  style={{
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                  }}
                >
                  Schedule Demo
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <section className="relative z-20 min-h-screen flex items-center justify-center">
          <div className="px-4 sm:px-6 lg:px-8 text-center w-full safe-area-inset">
            <h1
              className="text-white mb-4 sm:mb-6 leading-tight tracking-tight"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                fontWeight: 400,
                fontSize: "clamp(28px, 7vw, 58px)",
                lineHeight: "1.04",
              }}
            >
              Manufacturing Simplified
            </h1>
            <p
              className="text-sm sm:text-base md:text-lg lg:text-xl text-white/95 mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
              }}
            >
              <span className="font-bold">Automate</span> component evaluation
              and scoring.
              <br />
              <span className="font-bold">Streamline</span> manufacturing
              pipelines.
              <br />
              <span className="font-bold">Faster</span> data-driven decisions.
            </p>

            {/* Email Form - Typeform style */}
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleJoinWaitlist} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <div className="flex-1 w-full">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="email-input-white w-full bg-transparent border-0 border-b-2 border-white/70 text-white placeholder-white/60 focus:outline-none focus:border-white/90 focus:placeholder-white/80 pb-2 text-base sm:text-lg transition-colors text-center sm:text-left"
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                      }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="text-white/90 hover:text-white text-base sm:text-lg font-medium flex items-center gap-2 pb-2 border-b-2 border-transparent hover:border-white/50 transition-all whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                    }}
                    disabled={isSubmitting}
                  >
                    Join waitlist
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
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
                {submissionMessage && (
                  <p
                    className="mt-4 text-sm sm:text-base text-white/90 font-medium"
                    style={{
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                    }}
                  >
                    {submissionMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>
      </div>

      {/* Scrollable Content - appears after scrolling past video */}
      <div className="relative z-20 bg-white">
        <CompanyLogoSlider />
      </div>
      <Footer />
    </div>
  );
};

export default Landing;
