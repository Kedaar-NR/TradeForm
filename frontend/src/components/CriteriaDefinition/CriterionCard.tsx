/**
 * Criterion card component for displaying and editing a single criterion.
 */

import { CriterionForm } from "../../hooks/useCriteriaManagement";

interface CriterionCardProps {
    criterion: CriterionForm;
    index: number;
    onUpdate: (index: number, field: keyof CriterionForm, value: any) => void;
    onRemove: () => void;
}

export const CriterionCard = ({
    criterion,
    index,
    onUpdate,
    onRemove,
}: CriterionCardProps) => {
    return (
        <div className="card p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                    Criterion #{index + 1}
                </h4>
                <button
                    onClick={onRemove}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove criterion"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                    </label>
                    <input
                        type="text"
                        value={criterion.name}
                        onChange={(e) =>
                            onUpdate(index, "name", e.target.value)
                        }
                        placeholder="e.g., Cost, Gain, Size"
                        className="input-field"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weight *
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={criterion.weight}
                            onChange={(e) =>
                                onUpdate(
                                    index,
                                    "weight",
                                    parseFloat(e.target.value) || 0
                                )
                            }
                            min="0"
                            step="1"
                            className="input-field pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            %
                        </span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                    </label>
                    <input
                        type="text"
                        value={criterion.unit || ""}
                        onChange={(e) =>
                            onUpdate(index, "unit", e.target.value)
                        }
                        placeholder="e.g., $, dB, mm"
                        className="input-field"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Direction
                    </label>
                    <select
                        value={criterion.higherIsBetter ? "higher" : "lower"}
                        onChange={(e) =>
                            onUpdate(
                                index,
                                "higherIsBetter",
                                e.target.value === "higher"
                            )
                        }
                        className="input-field"
                    >
                        <option value="higher">Higher is better</option>
                        <option value="lower">Lower is better</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        value={criterion.description || ""}
                        onChange={(e) =>
                            onUpdate(index, "description", e.target.value)
                        }
                        placeholder="What does this criterion evaluate?"
                        rows={2}
                        className="input-field"
                    />
                </div>
            </div>
        </div>
    );
};
