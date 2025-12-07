import React from "react";
import { Feature } from "../data/features";
import { useInView } from "../hooks/useInView";

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  const [ref, isVisible] = useInView<HTMLDivElement>({
    rootMargin: "0px 0px -20% 0px",
    threshold: 0.15,
  });

  // Alternate between left and right animations
  const animationClass =
    index % 2 === 0 ? "tf-anim-slide-in-left" : "tf-anim-slide-in-right";

  return (
    <article
      ref={ref}
      className={`
        tf-feature-card
        p-10 bg-white border border-gray-200 rounded-xl
        ${!isVisible ? "tf-feature-card--hidden" : ""}
        ${isVisible ? animationClass : ""}
      `}
      style={{
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={`text-4xl mb-4 ${
            isVisible ? "tf-anim-tilt-in-top" : ""
          }`}
          style={{
            animationDelay: `${index * 0.1 + 0.2}s`,
          }}
          role="img"
          aria-label={feature.title}
        >
          {feature.icon}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {feature.title}
        </h3>

        {/* Bullets */}
        <ul className="text-sm text-gray-600 space-y-2 text-left list-disc list-inside ml-6">
          {feature.bullets.map((bullet, bulletIndex) => (
            <li key={bulletIndex}>{bullet}</li>
          ))}
        </ul>
      </div>
    </article>
  );
};

export default FeatureCard;
