/**
 * Modal component for displaying detailed component scores.
 */

import React from "react";
import type { ComponentScore } from "../../utils/sensitivityAnalysis";
import { getScoreColorClass } from "../../utils/scoreHelpers";

interface ComponentDetailModalProps {
    component: ComponentScore | null;
    onClose: () => void;
}

export const ComponentDetailModal: React.FC<ComponentDetailModalProps> = ({
    component,
    onClose,
}) => {
    if (!component) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 animate-slide-up shadow-xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {component.manufacturer} {component.partNumber}
                </h2>
                <div className="space-y-5">
                    {Object.entries(component.criteria).map(([criterion, data]) => (
                        <div
                            key={criterion}
                            className="border-b border-gray-200 pb-5 last:border-b-0"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-gray-900">{criterion}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                        Weight: {data.weight}
                                    </span>
                                    <span
                                        className={`px-3 py-1 rounded-md text-xs font-medium ${getScoreColorClass(
                                            data.score
                                        )}`}
                                    >
                                        {data.score}/10
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">{data.rationale}</p>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="mt-6 w-full btn-primary">
                    Close
                </button>
            </div>
        </div>
    );
};

export default ComponentDetailModal;

