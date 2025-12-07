import React from "react";
import { Feature } from "../data/features";
import { useInView } from "../hooks/useInView";

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  // Individual card visibility for scroll animations
  const [cardRef, isCardVisible] = useInView<HTMLDivElement>({
    rootMargin: "0px 0px -100px 0px",
    threshold: 0.2,
  });
  const hasVideo = feature.videoSrc;

  // Select top 3 bullets for compact view
  const displayBullets = feature.bullets.slice(0, 3);

  // Show card when it enters viewport (independent of parent section visibility)
  const shouldShow = isCardVisible;

  return (
    <article
      ref={cardRef}
      className={`
        relative overflow-hidden rounded-2xl border border-gray-200 shadow-lg
        min-h-[450px] sm:min-h-[480px] flex flex-col
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:shadow-xl
        ${!shouldShow ? "opacity-0 translate-y-12 scale-95" : "opacity-100 translate-y-0 scale-100"}
      `}
      style={{
        transitionDelay: shouldShow ? `${index * 0.1}s` : "0s",
        willChange: shouldShow ? "transform, opacity" : "auto",
      }}
    >
      {/* Video Background or Gradient Background */}
      {hasVideo ? (
        <div className="absolute inset-0 w-full h-full z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.7)" }}
          >
            <source src={feature.videoSrc} type="video/mp4" />
          </video>
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
        </div>
      ) : (
        <div
          className="absolute inset-0 w-full h-full z-0"
          style={{
            background: `linear-gradient(135deg, 
              ${getGradientColors(index)[0]} 0%, 
              ${getGradientColors(index)[1]} 100%)`,
          }}
        ></div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-7 lg:p-8 flex flex-col h-full">
        {/* Icon */}
        <div
          className="text-5xl sm:text-6xl mb-3 sm:mb-4"
          style={{
            filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))",
          }}
          role="img"
          aria-label={feature.title}
        >
          {feature.icon}
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 tracking-tight">
          {feature.title}
        </h3>

        {/* Tagline */}
        {feature.tagline && (
          <p className="text-sm sm:text-base text-white/90 mb-3 sm:mb-4 leading-relaxed">
            {feature.tagline}
          </p>
        )}

        {/* Divider */}
        <div className="h-0.5 w-12 sm:w-16 bg-white/40 rounded-full mb-3 sm:mb-4"></div>

        {/* Key Bullets */}
        <div className="space-y-2 sm:space-y-2.5 flex-grow">
          {displayBullets.map((bullet, bulletIndex) => (
            <div
              key={bulletIndex}
              className="flex items-start gap-2 sm:gap-2.5"
            >
              <span className="flex-shrink-0 mt-0.5 sm:mt-1 text-white/80 text-xs sm:text-sm">✓</span>
              <span className="text-xs sm:text-sm text-white/95 leading-relaxed">
                {bullet}
              </span>
            </div>
          ))}
        </div>

        {/* Stats (if available) */}
        {feature.stats && feature.stats.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/20">
            {feature.stats.map((stat, statIndex) => (
              <div key={statIndex} className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-0.5">
                  {stat.value}
                </div>
                <div className="text-[10px] sm:text-xs text-white/70 leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

// Helper function to get gradient colors based on index
function getGradientColors(index: number): [string, string] {
  const gradients: [string, string][] = [
    ["#667eea", "#764ba2"], // Purple gradient
    ["#f093fb", "#f5576c"], // Pink gradient
    ["#4facfe", "#00f2fe"], // Blue gradient
    ["#43e97b", "#38f9d7"], // Green gradient
    ["#fa709a", "#fee140"], // Orange-pink gradient
    ["#30cfd0", "#330867"], // Teal-purple gradient
  ];
  return gradients[index % gradients.length];
}

export default FeatureCard;
