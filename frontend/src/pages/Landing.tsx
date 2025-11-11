import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

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
    <div className="h-screen overflow-hidden relative">
      {/* Full Page Video Background */}
      <div className="fixed inset-0 w-full h-full z-0 bg-black">
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
      <nav className="z-50 sticky top-0 font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo textColor="white" />

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/features")}
                className="text-[14px] text-white font-medium hover:text-white/80 transition-colors px-2 py-1 font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif]"
              >
                Features
              </button>
              <button
                onClick={() => window.open("https://calendly.com", "_blank")}
                className="text-[14px] text-white font-medium px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] flex items-center gap-2"
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
                className="text-[14px] text-white font-medium px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif]"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 h-screen flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center w-full -mt-28">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            Trade Studies{" "}
            <span className="underline decoration-4 underline-offset-8 decoration-white/80">
              Simplified
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed">
            <span className="font-bold">Automate</span> component evaluation and
            scoring.
            <br />
            <span className="font-bold">Faster</span> data-driven decisions.
          </p>

          {/* CTA Buttons and Email Form */}
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Button */}
            <div className="flex justify-center -mt-6 mb-4">
              <button
                onClick={() => window.open("https://calendly.com", "_blank")}
                className="text-base text-white font-bold px-8 py-3 rounded-lg bg-white/15 hover:bg-white/25 transition-all backdrop-blur-sm whitespace-nowrap font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif] flex items-center gap-2"
              >
                Schedule Demo
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </button>
            </div>

            {/* Email Form */}
            <form onSubmit={handleJoinWaitlist} className="max-w-md mx-auto">
              <div className="flex gap-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-2 py-1.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2.5 rounded-lg border-0 focus:ring-0 outline-none text-gray-900 placeholder-gray-500 bg-transparent"
                  required
                />
                <button
                  type="submit"
                  className="bg-black hover:bg-black/90 text-white px-9 py-2.5 rounded-lg font-semibold transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  Join Waitlist
                </button>
              </div>
              {submissionMessage && (
                <p className="mt-3 text-sm text-white/80">
                  {submissionMessage}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
