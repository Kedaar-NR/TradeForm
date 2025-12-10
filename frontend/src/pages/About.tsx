import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Footer from "../components/Footer";

const About: React.FC = () => {
  const navigate = useNavigate();
  const [navBackground, setNavBackground] = useState(false);

  useEffect(() => {
    document.title = "About • TradeForm";
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setNavBackground(scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav
        className={`z-50 fixed top-0 left-0 right-0 safe-area-top transition-all duration-300 ${
          navBackground
            ? "bg-white/95 backdrop-blur-sm shadow-sm"
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
                className={`text-sm transition-colors font-medium ${
                  navBackground
                    ? "text-black hover:text-gray-800"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigate("/about")}
                className={`text-sm transition-colors font-medium ${
                  navBackground
                    ? "text-black hover:text-gray-800"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                About
              </button>
              <button
                onClick={() => navigate("/careers")}
                className={`text-sm transition-colors font-medium ${
                  navBackground
                    ? "text-black hover:text-gray-800"
                    : "text-gray-700 hover:text-gray-900"
                }`}
              >
                Careers
              </button>
              <button
                onClick={() => navigate("/blog")}
                className={`text-sm transition-colors font-medium ${
                  navBackground
                    ? "text-black hover:text-gray-800"
                    : "text-gray-700 hover:text-gray-900"
                }`}
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
                  navBackground
                    ? "text-black hover:text-gray-800"
                    : "text-gray-700 hover:text-gray-900"
                }`}
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

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 bg-white flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Made in California */}
          <div className="text-center mb-6 sm:mb-8">
            <span className="inline-block px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
              Made in California
            </span>
          </div>
          {/* Title */}
          <div className="text-center mb-12 sm:mb-16">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 sm:mb-12"
              style={{
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
              }}
            >
              Why We're Building TradeForm
            </h1>
          </div>

          {/* Image and Text Side by Side */}
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 max-w-6xl mx-auto mb-16 sm:mb-20">
            {/* Image */}
            <div className="w-full lg:w-1/2 flex-shrink-0">
              <img
                src="/media/loadscreen.jpg"
                alt="TradeForm Mission"
                className="w-full h-auto rounded-lg shadow-lg border border-gray-200"
              />
            </div>

            {/* Text Content */}
            <div className="w-full lg:w-1/2 space-y-6">
              <p
                className="text-base sm:text-lg text-gray-700 leading-relaxed"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                }}
              >
                At TradeForm, we are more than a software tool - we carry
                forward a proud legacy of engineering excellence and innovation.
                Our team of engineers and builders have worked on cutting-edge
                projects across aerospace, defense, and manufacturing,
                witnessing firsthand the challenges of component evaluation and
                trade study analysis.
              </p>
              <p
                className="text-base sm:text-lg text-gray-700 leading-relaxed"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", "Helvetica", "Arial", sans-serif',
                }}
              >
                Through our expertise in AI, software development, and
                manufacturing systems, we honor this legacy by building tools
                that help engineers make faster, data-driven decisions. We're
                contributing to the modern arsenal of innovation, helping teams
                who design and build keep manufacturing strong and efficient.
              </p>
            </div>
          </div>

          {/* Collage Images - Horizontal Layout with White Borders */}
          <div className="mt-4 sm:mt-6 lg:mt-8">
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 lg:gap-4 max-w-5xl mx-auto px-4">
              <div
                className="relative bg-white p-2 sm:p-2.5 shadow-lg"
                style={{ transform: "rotate(-2deg)", zIndex: 4 }}
              >
                <img
                  src="/media/collage.jpg"
                  alt="TradeForm Team"
                  className="w-24 sm:w-36 md:w-48 lg:w-56 h-auto object-cover"
                />
              </div>
              <div
                className="relative bg-white p-2 sm:p-2.5 shadow-lg"
                style={{
                  transform: "rotate(1deg)",
                  zIndex: 3,
                  marginLeft: "-12px",
                }}
              >
                <img
                  src="/media/collage2.jpg"
                  alt="Engineering Excellence"
                  className="w-24 sm:w-36 md:w-48 lg:w-56 h-auto object-cover"
                />
              </div>
              <div
                className="relative bg-white p-2 sm:p-2.5 shadow-lg"
                style={{
                  transform: "rotate(-1deg)",
                  zIndex: 2,
                  marginLeft: "-12px",
                }}
              >
                <img
                  src="/media/collage3.jpg"
                  alt="Innovation"
                  className="w-24 sm:w-36 md:w-48 lg:w-56 h-auto object-cover"
                />
              </div>
              <div
                className="relative bg-white p-2 sm:p-2.5 shadow-lg"
                style={{
                  transform: "rotate(2deg)",
                  zIndex: 1,
                  marginLeft: "-12px",
                }}
              >
                <img
                  src="/media/collage4.jpg"
                  alt="Manufacturing"
                  className="w-24 sm:w-36 md:w-48 lg:w-56 h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default About;
