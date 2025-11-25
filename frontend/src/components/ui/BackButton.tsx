/**
 * Reusable back navigation button component.
 * Provides consistent styling for back navigation throughout the app.
 */

import React from "react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
    /** Navigation target - can be a path string or -1 for browser back */
    to?: string | -1;
    /** Button label text */
    label?: string;
    /** Click handler (overrides default navigation) */
    onClick?: () => void;
    /** Additional CSS classes */
    className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
    to,
    label = "Back",
    onClick,
    className = "",
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (to === -1) {
            navigate(-1);
        } else if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`text-gray-700 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm font-medium ${className}`}
        >
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
                    d="M15 19l-7-7 7-7"
                />
            </svg>
            {label}
        </button>
    );
};

export default BackButton;

