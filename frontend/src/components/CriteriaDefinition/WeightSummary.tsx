/**
 * Weight summary component showing total weight status.
 */

import { getWeightStatus } from "../../utils/criteriaHelpers";
import { CriterionForm } from "../../hooks/useCriteriaManagement";

interface WeightSummaryProps {
    criteria: CriterionForm[];
}

export const WeightSummary = ({ criteria }: WeightSummaryProps) => {
    const status = getWeightStatus(criteria);

    return (
        <div className="card p-4 bg-white border-gray-200 text-gray-900">
            <div className="flex items-center gap-3">
                {status.isBalanced ? (
                    <svg
                        className="w-6 h-6 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                ) : (
                    <svg
                        className="w-6 h-6 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                )}
                <div>
                    <p className="text-sm font-medium text-gray-900">
                        {status.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                        Total weight should equal 100% for accurate scoring
                    </p>
                </div>
            </div>
        </div>
    );
};
