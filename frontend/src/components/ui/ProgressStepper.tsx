/**
 * Reusable workflow progress stepper component.
 * Shows a horizontal step indicator for multi-step workflows.
 */

import React from "react";

export interface Step {
    label: string;
    status: "complete" | "current" | "upcoming";
}

interface ProgressStepperProps {
    steps: Step[];
    /** Additional CSS classes */
    className?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
    steps,
    className = "",
}) => {
    return (
        <div className={`flex items-center justify-center gap-2 text-sm ${className}`}>
            {steps.map((step, index) => (
                <React.Fragment key={step.label}>
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                                step.status === "complete" || step.status === "current"
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-300 text-white"
                            }`}
                        >
                            {step.status === "complete" ? "✓" : index + 1}
                        </div>
                        <span
                            className={`font-medium ${
                                step.status === "complete" || step.status === "current"
                                    ? "text-gray-700"
                                    : "text-gray-500"
                            }`}
                        >
                            {step.label}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <svg
                            className="w-5 h-5 text-gray-400"
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
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

/**
 * Predefined step configurations for common workflows
 */
export const TRADE_STUDY_STEPS = {
    criteria: [
        { label: "Criteria Definition", status: "current" as const },
        { label: "Component Discovery", status: "upcoming" as const },
        { label: "Results", status: "upcoming" as const },
    ],
    criteriaComplete: [
        { label: "Criteria Definition", status: "complete" as const },
        { label: "Component Discovery", status: "upcoming" as const },
        { label: "Results", status: "upcoming" as const },
    ],
    discovery: [
        { label: "Criteria Definition", status: "complete" as const },
        { label: "Component Discovery", status: "current" as const },
        { label: "Results", status: "upcoming" as const },
    ],
    discoveryComplete: [
        { label: "Criteria Definition", status: "complete" as const },
        { label: "Component Discovery", status: "complete" as const },
        { label: "Results", status: "upcoming" as const },
    ],
    results: [
        { label: "Criteria Definition", status: "complete" as const },
        { label: "Component Discovery", status: "complete" as const },
        { label: "Results", status: "complete" as const },
    ],
};

export default ProgressStepper;

