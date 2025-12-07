import { useEffect, useRef, useState } from "react";

type UseInViewOptions = {
  rootMargin?: string;
  threshold?: number;
};

export function useInView<T extends HTMLElement>(
  options?: UseInViewOptions
): [React.RefCallback<T>, boolean] {
  const [isVisible, setIsVisible] = useState(false);
  const [element, setElement] = useState<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!element) return;

    // If reduced motion is preferred, immediately set as visible
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observerOptions = {
      rootMargin: options?.rootMargin ?? "0px 0px -20% 0px",
      threshold: options?.threshold ?? 0.15,
    };

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        // Stop observing once visible
        if (observerRef.current && element) {
          observerRef.current.unobserve(element);
        }
      }
    }, observerOptions);

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [element, options?.rootMargin, options?.threshold, prefersReducedMotion]);

  return [setElement, isVisible];
}
