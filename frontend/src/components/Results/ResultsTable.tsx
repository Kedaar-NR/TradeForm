/**
 * Table view component for Results page.
 * Displays component scores in a sortable table format.
 */

import React from "react";
import type { Criterion } from "../../types";
import type { ComponentScore } from "../../utils/sensitivityAnalysis";
import { getScoreColorClass } from "../../utils/scoreHelpers";

interface ResultsTableProps {
    components: ComponentScore[];
    criteria: Criterion[];
    onSelectComponent: (component: ComponentScore) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
    components,
    criteria,
    onSelectComponent,
}) => {
    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-5 py-3 text-left font-semibold text-gray-700 text-sm">
                                Rank
                            </th>
                            <th className="px-5 py-3 text-left font-semibold text-gray-700 text-sm">
                                Component
                            </th>
                            {criteria.map((criterion) => (
                                <th
                                    key={criterion.id}
                                    className="px-5 py-3 text-center font-semibold text-gray-700 text-sm"
                                >
                                    {criterion.name} (W:{criterion.weight})
                                </th>
                            ))}
                            <th className="px-5 py-3 text-center font-semibold text-gray-700 text-sm">
                                Total Score
                            </th>
                            <th className="px-5 py-3 text-center font-semibold text-gray-700 text-sm"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {components.map((component) => (
                            <tr
                                key={component.id}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-5 py-4">
                                    <span className="font-semibold text-sm text-gray-500">
                                        #{component.rank}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="font-semibold text-gray-900 text-sm">
                                        {component.manufacturer}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {component.partNumber}
                                    </div>
                                </td>
                                {criteria.map((criterion) => {
                                    const score = component.criteria[criterion.name]?.score || 0;
                                    return (
                                        <td key={criterion.id} className="px-5 py-4 text-center">
                                            <span
                                                className={`px-2 py-1 rounded-md text-xs font-medium ${getScoreColorClass(
                                                    score
                                                )}`}
                                            >
                                                {score}
                                            </span>
                                        </td>
                                    );
                                })}
                                <td className="px-5 py-4 text-center">
                                    <span className="font-bold text-gray-900">
                                        {component.totalScore.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectComponent(component);
                                        }}
                                        className="text-sm text-black hover:text-gray-900 font-medium"
                                    >
                                        Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResultsTable;

