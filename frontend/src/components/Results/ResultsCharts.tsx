/**
 * Charts view component for Results page.
 * Includes bar chart, spider chart, and sensitivity analysis views.
 */

import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts";
import type { Criterion } from "../../types";
import type { ComponentScore } from "../../utils/sensitivityAnalysis";
import {
    calculateSensitivity,
    prepareBarChartData,
    prepareSpiderChartData,
} from "../../utils/sensitivityAnalysis";
import { getScoreHexColor } from "../../utils/scoreHelpers";

type ChartType = "bar" | "spider" | "tornado";

interface ResultsChartsProps {
    components: ComponentScore[];
    criteria: Criterion[];
    selectedComponent: ComponentScore | null;
    chartType: ChartType;
    onChartTypeChange: (type: ChartType) => void;
}

export const ResultsCharts: React.FC<ResultsChartsProps> = ({
    components,
    criteria,
    selectedComponent,
    chartType,
    onChartTypeChange,
}) => {
    const barChartData = prepareBarChartData(components);
    const spiderChartComponent = selectedComponent ?? (components.length > 0 ? components[0] : null);
    const spiderChartData = prepareSpiderChartData(spiderChartComponent);

    return (
        <div className="space-y-6">
            {/* Chart Type Selector */}
            <div className="flex gap-2">
                <button
                    onClick={() => onChartTypeChange("bar")}
                    className={chartType === "bar" ? "btn-primary" : "btn-secondary"}
                >
                    Bar Chart
                </button>
                <button
                    onClick={() => onChartTypeChange("spider")}
                    className={chartType === "spider" ? "btn-primary" : "btn-secondary"}
                >
                    Spider Chart
                </button>
                <button
                    onClick={() => onChartTypeChange("tornado")}
                    className={chartType === "tornado" ? "btn-primary" : "btn-secondary"}
                >
                    Sensitivity Analysis
                </button>
            </div>

            {/* Bar Chart */}
            {chartType === "bar" && (
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Component Scores Comparison
                    </h3>
                    <ResponsiveContainer width="100%" height={800}>
                        <BarChart
                            data={barChartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 180 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={150}
                                interval={0}
                                tickMargin={10}
                            />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Legend
                                verticalAlign="bottom"
                                height={80}
                                wrapperStyle={{ bottom: 0, paddingTop: 10 }}
                            />
                            {criteria.map((criterion) => (
                                <Bar
                                    key={criterion.id}
                                    dataKey={criterion.name}
                                    fill={getScoreHexColor(8)}
                                    opacity={0.8}
                                />
                            ))}
                            <Bar dataKey="total" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Spider Chart */}
            {chartType === "spider" && spiderChartComponent && (
                <div className="card p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {spiderChartComponent.manufacturer} {spiderChartComponent.partNumber} - Performance Profile
                        </h3>
                        <p className="text-sm text-gray-600">
                            Tip: Select a component in the table to update this chart.
                        </p>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={spiderChartData}>
                            <PolarGrid />
                            {/* @ts-ignore - recharts compatibility issue with React 19 */}
                            <PolarAngleAxis dataKey="criterion" />
                            {/* @ts-ignore - recharts compatibility issue with React 19 */}
                            <PolarRadiusAxis angle={90} domain={[0, 10]} />
                            <Radar
                                name="Score"
                                dataKey="value"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.6}
                            />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Sensitivity Analysis (Tornado) */}
            {chartType === "tornado" && criteria.length > 0 && (
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Sensitivity Analysis
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        See how changing criterion weights affects component rankings
                    </p>
                    <div className="space-y-4">
                        {criteria.map((criterion) => {
                            const sensitivityPlus = calculateSensitivity(components, criteria, criterion.name, 2);
                            const sensitivityMinus = calculateSensitivity(components, criteria, criterion.name, -2);
                            return (
                                <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">
                                        {criterion.name} Weight Sensitivity
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-600 mb-2">
                                                Weight -2 (Lower Priority)
                                            </p>
                                            <div className="space-y-1">
                                                {sensitivityMinus.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className="text-xs">
                                                        {idx + 1}. {item.component} ({item.score.toFixed(2)})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 mb-2">
                                                Weight +2 (Higher Priority)
                                            </p>
                                            <div className="space-y-1">
                                                {sensitivityPlus.slice(0, 3).map((item, idx) => (
                                                    <div key={idx} className="text-xs">
                                                        {idx + 1}. {item.component} ({item.score.toFixed(2)})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsCharts;

