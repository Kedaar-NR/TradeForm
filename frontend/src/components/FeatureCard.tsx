import React from "react";
import { Feature } from "../data/features";
import { useInView } from "../hooks/useInView";

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  const [ref, isVisible] = useInView<HTMLDivElement>({
    rootMargin: "0px 0px -15% 0px",
    threshold: 0.1,
  });

  // Determine layout based on feature preference or alternate
  const layout = feature.layout || (index % 2 === 0 ? "hero" : "split");

  // Render based on layout type
  if (layout === "hero") {
    return <HeroLayout feature={feature} index={index} isVisible={isVisible} ref={ref} />;
  } else if (layout === "split") {
    return <SplitLayout feature={feature} index={index} isVisible={isVisible} ref={ref} />;
  } else if (layout === "grid") {
    return <GridLayout feature={feature} index={index} isVisible={isVisible} ref={ref} />;
  } else {
    return <StackedLayout feature={feature} index={index} isVisible={isVisible} ref={ref} />;
  }
};

// Hero Layout - Large centered design
const HeroLayout = React.forwardRef<HTMLDivElement, { feature: Feature; index: number; isVisible: boolean }>(
  ({ feature, index, isVisible }, ref) => {
    return (
      <article
        ref={ref}
        className={`
          relative min-h-screen flex items-center justify-center py-20 px-6 bg-gray-50
          ${!isVisible ? "opacity-0" : ""}
        `}
      >
        <div className="max-w-6xl mx-auto w-full">
          {/* Icon */}
          <div
            className={`text-7xl sm:text-8xl mb-8 text-center ${
              isVisible ? "tf-anim-bounce-in" : ""
            }`}
            style={{ 
              animationDelay: `${index * 0.1}s`,
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
            }}
            role="img"
            aria-label={feature.title}
          >
            {feature.icon}
          </div>

          {/* Title */}
          <h3
            className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 text-center tracking-tight ${
              isVisible ? "tf-anim-tracking-in-expand" : ""
            }`}
            style={{ animationDelay: `${index * 0.1 + 0.1}s` }}
          >
            {feature.title}
          </h3>

          {/* Tagline */}
          {feature.tagline && (
            <p
              className={`text-xl sm:text-2xl text-gray-600 mb-6 text-center max-w-3xl mx-auto ${
                isVisible ? "tf-anim-text-focus-in" : ""
              }`}
              style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
            >
              {feature.tagline}
            </p>
          )}

          {/* Description */}
          <p
            className={`text-lg text-gray-700 mb-12 text-center max-w-4xl mx-auto leading-relaxed ${
              isVisible ? "tf-anim-fade-in-up-stagger" : ""
            }`}
            style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
          >
            {feature.description}
          </p>

          {/* Stats Row */}
          {feature.stats && feature.stats.length > 0 && (
            <div className="grid grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
              {feature.stats.map((stat, statIndex) => (
                <div
                  key={statIndex}
                  className={`text-center p-6 bg-white rounded-xl border border-gray-200 shadow-md tf-hover-lift ${
                    isVisible ? "tf-anim-fade-in-up-stagger" : ""
                  }`}
                  style={{ 
                    animationDelay: `${index * 0.1 + 0.4 + statIndex * 0.1}s`,
                  }}
                >
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Highlights Grid */}
          {feature.highlights && feature.highlights.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {feature.highlights.map((highlight, hIndex) => (
                <div
                  key={hIndex}
                  className={`p-6 bg-white rounded-xl border border-gray-200 shadow-md tf-hover-lift ${
                    isVisible ? "tf-anim-slide-in-scale" : ""
                  }`}
                  style={{ 
                    animationDelay: `${index * 0.1 + 0.5 + hIndex * 0.1}s`,
                  }}
                >
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    {highlight.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Bullets */}
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              {feature.bullets.map((bullet, bulletIndex) => (
                <div
                  key={bulletIndex}
                  className={`flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm ${
                    isVisible ? "tf-anim-fade-in-up-stagger" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1 + 0.6 + bulletIndex * 0.05}s` }}
                >
                  <span className="flex-shrink-0 mt-1 text-lg text-gray-700">✓</span>
                  <span className="text-sm text-gray-700">{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  }
);

// Split Layout - Content with video cutout
const SplitLayout = React.forwardRef<HTMLDivElement, { feature: Feature; index: number; isVisible: boolean }>(
  ({ feature, index, isVisible }, ref) => {
    const hasVideo = feature.videoSrc;
    const videoOnLeft = feature.videoPosition === "left";

    return (
      <article
        ref={ref}
        className={`
          relative min-h-screen flex items-center justify-center py-20 px-6 bg-white
          ${!isVisible ? "opacity-0" : ""}
        `}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className={`grid lg:grid-cols-2 gap-12 items-center ${videoOnLeft ? 'lg:grid-flow-dense' : ''}`}>
            {/* Content Column */}
            <div className={`space-y-6 ${videoOnLeft ? 'lg:col-start-2' : ''}`}>
              {/* Icon */}
              <div
                className={`text-6xl ${isVisible ? "tf-anim-rotate-in" : ""}`}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
                }}
                role="img"
                aria-label={feature.title}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <h3
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight ${
                  isVisible ? "tf-anim-slide-in-left" : ""
                }`}
                style={{ animationDelay: `${index * 0.1 + 0.1}s` }}
              >
                {feature.title}
              </h3>

              {/* Decorative line */}
              <div className="h-1 w-24 rounded-full bg-gray-900"></div>

              {/* Tagline */}
              {feature.tagline && (
                <p
                  className={`text-lg sm:text-xl text-gray-600 ${
                    isVisible ? "tf-anim-fade-in-up-stagger" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                >
                  {feature.tagline}
                </p>
              )}

              {/* Description */}
              <p
                className={`text-base text-gray-700 leading-relaxed ${
                  isVisible ? "tf-anim-fade-in-up-stagger" : ""
                }`}
                style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
              >
                {feature.description}
              </p>

              {/* Stats if available */}
              {feature.stats && feature.stats.length > 0 && (
                <div className="grid grid-cols-3 gap-4 pt-4">
                  {feature.stats.map((stat, statIndex) => (
                    <div
                      key={statIndex}
                      className={`text-center p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm ${
                        isVisible ? "tf-anim-bounce-in" : ""
                      }`}
                      style={{ 
                        animationDelay: `${index * 0.1 + 0.4 + statIndex * 0.1}s`,
                      }}
                    >
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Highlights */}
              {feature.highlights && feature.highlights.length > 0 && !hasVideo && (
                <div className="space-y-4 pt-4">
                  {feature.highlights.map((highlight, hIndex) => (
                    <div
                      key={hIndex}
                      className={`p-5 bg-gray-50 rounded-xl border border-gray-200 shadow-sm tf-hover-lift ${
                        isVisible ? "tf-anim-slide-in-right" : ""
                      }`}
                      style={{ 
                        animationDelay: `${index * 0.1 + 0.3 + hIndex * 0.1}s`,
                      }}
                    >
                      <h4 className="text-base font-semibold text-gray-900 mb-2">
                        {highlight.title}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {highlight.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bullets */}
              <div className="space-y-3 pt-4">
                {feature.bullets.slice(0, 6).map((bullet, bulletIndex) => (
                  <div
                    key={bulletIndex}
                    className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 ${
                      isVisible ? "tf-anim-fade-in-up-stagger" : ""
                    }`}
                    style={{ animationDelay: `${index * 0.1 + 0.5 + bulletIndex * 0.05}s` }}
                  >
                    <span className="flex-shrink-0 mt-1 text-sm text-gray-700">✓</span>
                    <span className="text-sm text-gray-700">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Video/Visual Column */}
            <div className={`${videoOnLeft ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
              {hasVideo ? (
                <div 
                  className={`relative rounded-2xl overflow-hidden shadow-2xl ${
                    isVisible ? "tf-anim-blur-reveal" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1 + 0.4}s` }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ maxHeight: '600px' }}
                  >
                    <source src={feature.videoSrc} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </div>
              ) : (
                feature.highlights && feature.highlights.length > 0 && (
                  <div className="space-y-4">
                    {feature.highlights.map((highlight, hIndex) => (
                      <div
                        key={hIndex}
                        className={`p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-md tf-hover-lift ${
                          isVisible ? "tf-anim-slide-in-right" : ""
                        }`}
                        style={{ 
                          animationDelay: `${index * 0.1 + 0.3 + hIndex * 0.1}s`,
                        }}
                      >
                        <h4 className="text-base font-semibold text-gray-900 mb-2">
                          {highlight.title}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {highlight.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }
);

// Grid Layout - Feature cards in grid
const GridLayout = React.forwardRef<HTMLDivElement, { feature: Feature; index: number; isVisible: boolean }>(
  ({ feature, index, isVisible }, ref) => {
    return (
      <article
        ref={ref}
        className={`
          relative min-h-screen flex items-center justify-center py-20 px-6 bg-gray-50
          ${!isVisible ? "opacity-0" : ""}
        `}
      >
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div
              className={`text-6xl mb-6 ${isVisible ? "tf-anim-bounce-in" : ""}`}
              style={{ 
                animationDelay: `${index * 0.1}s`,
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
              }}
              role="img"
              aria-label={feature.title}
            >
              {feature.icon}
            </div>

            <h3
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight ${
                isVisible ? "tf-anim-tracking-in-expand" : ""
              }`}
              style={{ animationDelay: `${index * 0.1 + 0.1}s` }}
            >
              {feature.title}
            </h3>

            <div className="h-1 w-24 rounded-full mx-auto mb-4 bg-gray-900"></div>

            {feature.tagline && (
              <p
                className={`text-lg sm:text-xl text-gray-600 mb-4 ${
                  isVisible ? "tf-anim-text-focus-in" : ""
                }`}
                style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
              >
                {feature.tagline}
              </p>
            )}

            <p
              className={`text-base text-gray-700 max-w-3xl mx-auto leading-relaxed ${
                isVisible ? "tf-anim-fade-in-up-stagger" : ""
              }`}
              style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
            >
              {feature.description}
            </p>
          </div>

          {/* Highlights Grid */}
          {feature.highlights && feature.highlights.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {feature.highlights.map((highlight, hIndex) => (
                <div
                  key={hIndex}
                  className={`p-6 bg-white rounded-xl border border-gray-200 shadow-md tf-hover-lift ${
                    isVisible ? "tf-anim-slide-in-scale" : ""
                  }`}
                  style={{ 
                    animationDelay: `${index * 0.1 + 0.4 + hIndex * 0.1}s`,
                  }}
                >
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    {highlight.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Bullets Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {feature.bullets.map((bullet, bulletIndex) => (
              <div
                key={bulletIndex}
                className={`flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm tf-hover-lift ${
                  isVisible ? "tf-anim-fade-in-up-stagger" : ""
                }`}
                style={{ animationDelay: `${index * 0.1 + 0.5 + bulletIndex * 0.05}s` }}
              >
                <span className="flex-shrink-0 mt-1 text-sm text-gray-700">✓</span>
                <span className="text-sm text-gray-700">{bullet}</span>
              </div>
            ))}
          </div>

          {/* Stats Row */}
          {feature.stats && feature.stats.length > 0 && (
            <div className="grid grid-cols-3 gap-6 mt-10 max-w-3xl mx-auto">
              {feature.stats.map((stat, statIndex) => (
                <div
                  key={statIndex}
                  className={`text-center p-6 bg-white rounded-xl border border-gray-200 shadow-md ${
                    isVisible ? "tf-anim-bounce-in" : ""
                  }`}
                  style={{ 
                    animationDelay: `${index * 0.1 + 0.7 + statIndex * 0.1}s`,
                  }}
                >
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>
    );
  }
);

// Stacked Layout - Full-width content with video option
const StackedLayout = React.forwardRef<HTMLDivElement, { feature: Feature; index: number; isVisible: boolean }>(
  ({ feature, index, isVisible }, ref) => {
    const hasVideo = feature.videoSrc;
    const videoOnLeft = feature.videoPosition === "left";

    return (
      <article
        ref={ref}
        className={`
          relative min-h-screen flex items-center justify-center py-20 px-6 bg-white
          ${!isVisible ? "opacity-0" : ""}
        `}
      >
        <div className="max-w-7xl mx-auto w-full">
          {hasVideo ? (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content Side */}
              <div className={`space-y-8 ${videoOnLeft ? 'lg:order-2' : ''}`}>
                {/* Header */}
                <div className="flex items-center gap-6">
                  <div
                    className={`text-5xl ${isVisible ? "tf-anim-bounce-in" : ""}`}
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
                    }}
                    role="img"
                    aria-label={feature.title}
                  >
                    {feature.icon}
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight ${
                        isVisible ? "tf-anim-slide-in-left" : ""
                      }`}
                      style={{ animationDelay: `${index * 0.1 + 0.1}s` }}
                    >
                      {feature.title}
                    </h3>
                    {feature.tagline && (
                      <p
                        className={`text-lg text-gray-600 ${
                          isVisible ? "tf-anim-fade-in-up-stagger" : ""
                        }`}
                        style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                      >
                        {feature.tagline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-1 w-32 rounded-full bg-gray-900"></div>

                {/* Description */}
                <p
                  className={`text-base text-gray-700 leading-relaxed ${
                    isVisible ? "tf-anim-fade-in-up-stagger" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
                >
                  {feature.description}
                </p>

                {/* Highlights */}
                {feature.highlights && feature.highlights.length > 0 && (
                  <div className="space-y-4">
                    {feature.highlights.map((highlight, hIndex) => (
                      <div
                        key={hIndex}
                        className={`p-5 bg-gray-50 rounded-xl border border-gray-200 shadow-sm tf-hover-lift ${
                          isVisible ? "tf-anim-slide-in-scale" : ""
                        }`}
                        style={{ 
                          animationDelay: `${index * 0.1 + 0.4 + hIndex * 0.1}s`,
                        }}
                      >
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {highlight.title}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {highlight.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bullets */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {feature.bullets.slice(0, 6).map((bullet, bulletIndex) => (
                    <div
                      key={bulletIndex}
                      className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 ${
                        isVisible ? "tf-anim-fade-in-up-stagger" : ""
                      }`}
                      style={{ animationDelay: `${index * 0.1 + 0.5 + bulletIndex * 0.05}s` }}
                    >
                      <span className="flex-shrink-0 mt-1 text-sm text-gray-700">✓</span>
                      <span className="text-sm text-gray-700">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Side */}
              <div className={videoOnLeft ? 'lg:order-1' : ''}>
                <div 
                  className={`relative rounded-2xl overflow-hidden shadow-2xl ${
                    isVisible ? "tf-anim-blur-reveal" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1 + 0.4}s` }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ maxHeight: '600px' }}
                  >
                    <source src={feature.videoSrc} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-10">
              {/* Header */}
              <div className="flex items-center gap-6">
                <div
                  className={`text-5xl ${isVisible ? "tf-anim-bounce-in" : ""}`}
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
                  }}
                  role="img"
                  aria-label={feature.title}
                >
                  {feature.icon}
                </div>

                <div className="flex-1">
                  <h3
                    className={`text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight ${
                      isVisible ? "tf-anim-slide-in-left" : ""
                    }`}
                    style={{ animationDelay: `${index * 0.1 + 0.1}s` }}
                  >
                    {feature.title}
                  </h3>
                  {feature.tagline && (
                    <p
                      className={`text-lg text-gray-600 ${
                        isVisible ? "tf-anim-fade-in-up-stagger" : ""
                      }`}
                      style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                    >
                      {feature.tagline}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-1 w-32 rounded-full bg-gray-900"></div>

              {/* Description */}
              <p
                className={`text-base text-gray-700 leading-relaxed ${
                  isVisible ? "tf-anim-fade-in-up-stagger" : ""
                }`}
                style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
              >
                {feature.description}
              </p>

              {/* Highlights */}
              {feature.highlights && feature.highlights.length > 0 && (
                <div className="space-y-4">
                  {feature.highlights.map((highlight, hIndex) => (
                    <div
                      key={hIndex}
                      className={`p-5 bg-gray-50 rounded-xl border border-gray-200 shadow-sm tf-hover-lift ${
                        isVisible ? "tf-anim-slide-in-scale" : ""
                      }`}
                      style={{ 
                        animationDelay: `${index * 0.1 + 0.4 + hIndex * 0.1}s`,
                      }}
                    >
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {highlight.title}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {highlight.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bullets */}
              <div className="grid sm:grid-cols-2 gap-3">
                {feature.bullets.map((bullet, bulletIndex) => (
                  <div
                    key={bulletIndex}
                    className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 ${
                      isVisible ? "tf-anim-fade-in-up-stagger" : ""
                    }`}
                    style={{ animationDelay: `${index * 0.1 + 0.5 + bulletIndex * 0.05}s` }}
                  >
                    <span className="flex-shrink-0 mt-1 text-sm text-gray-700">✓</span>
                    <span className="text-sm text-gray-700">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    );
  }
);

export default FeatureCard;
