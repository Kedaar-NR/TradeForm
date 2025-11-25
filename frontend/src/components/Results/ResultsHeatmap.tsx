/**
 * Heatmap view component for Results page.
 * Displays component scores as visual progress bars with rationales.
 */

import React from "react";
import type { ComponentScore } from "../../utils/sensitivityAnalysis";
import { getScoreHexColor } from "../../utils/scoreHelpers";

interface ResultsHeatmapProps {
    components: ComponentScore[];
}

export const ResultsHeatmap: React.FC<ResultsHeatmapProps> = ({ components }) => {
    return (
        <div className="space-y-4">
            {components.map((component) => (
                <div key={component.id} className="card p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-5 gap-3">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-500">
                                    #{component.rank}
                                </span>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {component.manufacturer} {component.partNumber}
                                </h3>
                            </div>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                            {component.totalScore.toFixed(2)}/10
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {Object.entries(component.criteria).map(([criterion, data]) => (
                            <div key={criterion} className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="font-semibold text-gray-700">
                                        {criterion}
                                    </span>
                                    <span className="font-medium text-gray-600">
                                        {data.score}/10
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{
                                            width: `${data.score * 10}%`,
                                            backgroundColor: getScoreHexColor(data.score),
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-600">{data.rationale}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ResultsHeatmap;

