/**
 * Reusable loading spinner component.
 * Replaces inline SVG spinner implementations throughout the app.
 */

import React from "react";

interface LoadingSpinnerProps {
    /** Size of the spinner: "sm" (16px), "md" (24px), "lg" (32px), "xl" (48px) */
    size?: "sm" | "md" | "lg" | "xl";
    /** Additional CSS classes */
    className?: string;
    /** Text to display below the spinner */
    text?: string;
    /** Whether to center the spinner in its container */
    centered?: boolean;
}

const SIZE_CLASSES = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
} as const;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = "md",
    className = "",
    text,
    centered = false,
}) => {
    const spinner = (
        <svg
            className={`animate-spin ${SIZE_CLASSES[size]} ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );

    if (!text && !centered) {
        return spinner;
    }

    const content = (
        <>
            {spinner}
            {text && <p className="mt-4 text-gray-600">{text}</p>}
        </>
    );

    if (centered) {
        return (
            <div className="flex flex-col items-center justify-center">
                {content}
            </div>
        );
    }

    return <>{content}</>;
};

/**
 * Full-page loading state with centered spinner.
 */
export const PageLoader: React.FC<{ text?: string }> = ({
    text = "Loading...",
}) => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
    </div>
);

/**
 * Inline loading indicator for buttons.
 */
export const ButtonSpinner: React.FC<{ className?: string }> = ({
    className = "",
}) => <LoadingSpinner size="sm" className={className} />;

export default LoadingSpinner;

