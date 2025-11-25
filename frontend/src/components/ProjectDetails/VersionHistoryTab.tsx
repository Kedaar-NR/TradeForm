/**
 * Version History tab component for Project Details page.
 * Displays a timeline of project changes with before/after values.
 */

import React from "react";
import type { ProjectChange } from "../../types";
import { formatDisplayTimestamp } from "../../utils/dateFormatters";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface VersionHistoryTabProps {
    changes: ProjectChange[];
    isLoading: boolean;
    onRefresh: () => void;
}

/**
 * Format change type from snake_case to Title Case
 */
const formatChangeType = (value: string) =>
    value
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

/**
 * Parse JSON or return string value
 */
const parseStructuredValue = (value?: string | null) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

/**
 * Format value for display
 */
const formatStructuredValue = (value: unknown) => {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "string") {
        return value;
    }
    return JSON.stringify(value, null, 2);
};

export const VersionHistoryTab: React.FC<VersionHistoryTabProps> = ({
    changes,
    isLoading,
    onRefresh,
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
                    <p className="text-sm text-gray-600">Recent changes to this project</p>
                </div>
                <button onClick={onRefresh} className="btn-secondary text-sm">
                    Refresh History
                </button>
            </div>

            {isLoading ? (
                <div className="card p-8 text-center">
                    <LoadingSpinner size="lg" centered />
                    <p className="mt-4 text-sm text-gray-600">Loading history...</p>
                </div>
            ) : changes.length === 0 ? (
                <div className="card p-8 text-center">
                    <p className="text-sm text-gray-600">
                        No change history recorded yet. Start editing components or criteria to see updates here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {changes.map((change) => {
                        const oldValue = parseStructuredValue(change.oldValue);
                        const newValue = parseStructuredValue(change.newValue);
                        return (
                            <div
                                key={change.id}
                                className="card p-5 border border-gray-200 rounded-xl"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-gray-500">
                                            {formatDisplayTimestamp(change.createdAt)}
                                        </p>
                                        <p className="text-base font-semibold text-gray-900">
                                            {change.changeDescription}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {change.userName || "System"}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                                        {formatChangeType(change.changeType)}
                                    </span>
                                </div>
                                {change.entityType && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Entity: {formatChangeType(change.entityType)}
                                    </p>
                                )}
                                {(oldValue || newValue) && (
                                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                                        {oldValue && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                                    Before
                                                </p>
                                                <pre className="bg-gray-50 border border-gray-200 rounded-lg text-xs p-3 overflow-x-auto">
                                                    {formatStructuredValue(oldValue)}
                                                </pre>
                                            </div>
                                        )}
                                        {newValue && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                                    After
                                                </p>
                                                <pre className="bg-gray-50 border border-gray-200 rounded-lg text-xs p-3 overflow-x-auto">
                                                    {formatStructuredValue(newValue)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VersionHistoryTab;

