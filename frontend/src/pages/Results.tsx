import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resultsApi, criteriaApi } from "../services/api";
import * as XLSX from "xlsx";
import { formatDateForFilename } from "../utils/dateHelpers";
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

interface ComponentScore {
  id: string;
  manufacturer: string;
  partNumber: string;
  criteria: Record<
    string,
    { score: number; rationale: string; weight: number }
  >;
  totalScore: number;
  rank: number;
}

const Results: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [components, setComponents] = useState<ComponentScore[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "heatmap" | "charts">(
    "table"
  );
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentScore | null>(null);
  const [chartType, setChartType] = useState<"bar" | "spider" | "tornado">(
    "bar"
  );

  const loadResults = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const [resultsRes, criteriaRes] = await Promise.all([
        resultsApi.getByProject(projectId),
        criteriaApi.getByProject(projectId),
      ]);

      const resultsData = resultsRes.data;
      const criteriaData = criteriaRes.data;

      // Transform results to match our interface
      const transformedComponents: ComponentScore[] = resultsData.results.map(
        (result: any) => {
          const critMap: Record<
            string,
            { score: number; rationale: string; weight: number }
          > = {};

          criteriaData.forEach((criterion: any) => {
            const score = result.scores.find(
              (s: any) => s.criterion_id === criterion.id
            );
            critMap[criterion.name] = {
              score: score?.score || 0,
              rationale: score?.rationale || "No score available",
              weight: criterion.weight,
            };
          });

          return {
            id: result.component.id,
            manufacturer: result.component.manufacturer,
            partNumber: result.component.part_number,
            criteria: critMap,
            totalScore: result.total_score,
            rank: result.rank,
          };
        }
      );

      setComponents(transformedComponents);
      setCriteria(criteriaData);
    } catch (error) {
      console.error("Failed to load results:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadResults();
    }
  }, [projectId, loadResults]);

  const handleExportCSV = () => {
    if (!components.length) return;

    const headers = [
      "Rank",
      "Manufacturer",
      "Part Number",
      ...Object.keys(components[0].criteria),
      "Total Score",
    ];
    const rows = components.map((comp) => [
      comp.rank,
      comp.manufacturer,
      comp.partNumber,
      ...Object.values(comp.criteria).map((c) => c.score),
      comp.totalScore.toFixed(2),
    ]);

    const csvLines = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const strValue = value != null ? String(value) : "";
            if (/[",\n]/.test(strValue)) {
              return `"${strValue.replace(/"/g, '""')}"`;
            }
            return strValue;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvLines], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateSlug = formatDateForFilename(new Date());
    a.download = `trade-study-results-${dateSlug}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportFullExcel = () => {
    if (!components.length) return;

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Prepare data for Summary sheet
      const summaryHeaders = [
        "Rank",
        "Manufacturer",
        "Part Number",
        ...Object.keys(components[0].criteria),
        "Total Score",
      ];
      const summaryData = components.map((comp) => [
        comp.rank,
        comp.manufacturer,
        comp.partNumber,
        ...Object.values(comp.criteria).map((c) => c.score),
        comp.totalScore.toFixed(2),
      ]);

      // Create Summary worksheet
      const summarySheet = XLSX.utils.aoa_to_sheet([
        summaryHeaders,
        ...summaryData,
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Create Detailed Scores sheet with rationales
      const detailedHeaders = [
        "Rank",
        "Manufacturer",
        "Part Number",
        "Criterion",
        "Score",
        "Weight",
        "Rationale",
      ];
      const detailedData: any[] = [];
      components.forEach((comp) => {
        Object.entries(comp.criteria).forEach(([criterionName, data]) => {
          detailedData.push([
            comp.rank,
            comp.manufacturer,
            comp.partNumber,
            criterionName,
            data.score,
            data.weight,
            data.rationale,
          ]);
        });
      });

      const detailedSheet = XLSX.utils.aoa_to_sheet([
        detailedHeaders,
        ...detailedData,
      ]);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, "Detailed Scores");

      // Create Criteria sheet
      const criteriaHeaders = ["Criterion", "Weight"];
      const criteriaData = criteria.map((c) => [c.name, c.weight]);
      const criteriaSheet = XLSX.utils.aoa_to_sheet([
        criteriaHeaders,
        ...criteriaData,
      ]);
      XLSX.utils.book_append_sheet(workbook, criteriaSheet, "Criteria");

      // Generate Excel file and download
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateSlug = formatDateForFilename(new Date());
      a.download = `TradeStudy_Full_${dateSlug}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to export Excel:", error);
      alert(`Failed to export: ${error.message}`);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "#10b981"; // gray-1000
    if (score >= 6) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 8) return "bg-gray-200 text-gray-900";
    if (score >= 6) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  // Prepare data for charts
  const barChartData = components.map((comp) => ({
    name: `${comp.manufacturer} ${comp.partNumber}`,
    ...Object.fromEntries(
      Object.entries(comp.criteria).map(([key, val]) => [key, val.score])
    ),
    total: comp.totalScore,
  }));

  const spiderChartComponent =
    selectedComponent ?? (components.length > 0 ? components[0] : null);

  const spiderChartData = spiderChartComponent
    ? [
        {
          criterion: "",
          value: 0,
          fullMark: 10,
        },
        ...Object.entries(spiderChartComponent.criteria).map(
          ([name, data]) => ({
            criterion: name,
            value: data.score,
            fullMark: 10,
          })
        ),
      ]
    : [];

  // Sensitivity analysis - how changing weights affects rankings
  const calculateSensitivity = (
    criterionName: string,
    weightChange: number
  ) => {
    if (!components.length || !criteria.length) return [];

    const criterion = criteria.find((c) => c.name === criterionName);
    if (!criterion) return [];

    const newWeight = Math.max(
      1,
      Math.min(10, criterion.weight + weightChange)
    );

    // Calculate total weight and build weight map in single pass
    const weightMap = new Map<string, number>();
    let totalWeight = 0;
    for (const c of criteria) {
      const weight = c.name === criterionName ? newWeight : c.weight;
      weightMap.set(c.name, weight);
      totalWeight += weight;
    }

    return components
      .map((comp) => {
        let weightedSum = 0;
        for (const c of criteria) {
          const score = comp.criteria[c.name]?.score || 0;
          weightedSum += score * (weightMap.get(c.name) || 0);
        }
        return {
          component: comp.manufacturer + " " + comp.partNumber,
          score: weightedSum / totalWeight,
        };
      })
      .sort((a, b) => b.score - a.score);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading results...</div>
      </div>
    );
  }

  if (!components.length) {
    return (
      <div className="max-w-6xl animate-fade-in">
        <div className="card p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No results available
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Add components and scores to see results
          </p>
          <button
            onClick={() => navigate(`/project/${projectId}`)}
            className="btn-primary"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  // Components are already sorted by backend with ranks
  const sortedComponents = components;

  return (
    <div className="max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="text-gray-700 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm font-medium"
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
          Back to Project
        </button>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Trade Study Results
            </h1>
            <p className="text-gray-600">
              AI-scored components ranked by weighted criteria
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "table", label: "Table" },
              { id: "heatmap", label: "Heatmap" },
              { id: "charts", label: "Charts" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as typeof viewMode)}
                className={viewMode === id ? "btn-primary" : "btn-secondary"}
              >
                {label}
              </button>
            ))}
            <button
              onClick={handleExportFullExcel}
              className="btn-primary flex items-center gap-2"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export Full Report (Excel)
            </button>
            <button onClick={handleExportCSV} className="btn-secondary">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Winner Card */}
      {sortedComponents.length > 0 && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-gray-900 mb-1">
                RECOMMENDED
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {sortedComponents[0].manufacturer}{" "}
                {sortedComponents[0].partNumber}
              </h3>
              <p className="text-sm text-gray-600">
                Weighted Score:{" "}
                <span className="font-semibold text-gray-900">
                  {sortedComponents[0].totalScore.toFixed(2)}/10
                </span>
              </p>
            </div>
            <button
              onClick={() => setSelectedComponent(sortedComponents[0])}
              className="btn-secondary whitespace-nowrap"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Charts View */}
      {viewMode === "charts" && (
        <div className="space-y-6">
          {/* Chart Type Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setChartType("bar")}
              className={chartType === "bar" ? "btn-primary" : "btn-secondary"}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType("spider")}
              className={
                chartType === "spider" ? "btn-primary" : "btn-secondary"
              }
            >
              Spider Chart
            </button>
            <button
              onClick={() => setChartType("tornado")}
              className={
                chartType === "tornado" ? "btn-primary" : "btn-secondary"
              }
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
                  {criteria.map((criterion, idx) => (
                    <Bar
                      key={criterion.id}
                      dataKey={criterion.name}
                      fill={getScoreColor(8)}
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
                  {spiderChartComponent.manufacturer}{" "}
                  {spiderChartComponent.partNumber} - Performance Profile
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
                  const sensitivityPlus = calculateSensitivity(
                    criterion.name,
                    2
                  );
                  const sensitivityMinus = calculateSensitivity(
                    criterion.name,
                    -2
                  );
                  return (
                    <div
                      key={criterion.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
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
                                {idx + 1}. {item.component} (
                                {item.score.toFixed(2)})
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
                                {idx + 1}. {item.component} (
                                {item.score.toFixed(2)})
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
      )}

      {/* Results Table */}
      {viewMode === "table" && (
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
                {sortedComponents.map((component) => (
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
                      const score =
                        component.criteria[criterion.name]?.score || 0;
                      return (
                        <td
                          key={criterion.id}
                          className="px-5 py-4 text-center"
                        >
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
                          setSelectedComponent(component);
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
      )}

      {/* Heatmap View */}
      {viewMode === "heatmap" && (
        <div className="space-y-4">
          {sortedComponents.map((component) => (
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
                          backgroundColor: getScoreColor(data.score),
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
      )}

      {/* Detail Modal */}
      {selectedComponent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedComponent(null)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 animate-slide-up shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedComponent.manufacturer} {selectedComponent.partNumber}
            </h2>
            <div className="space-y-5">
              {Object.entries(selectedComponent.criteria).map(
                ([criterion, data]) => (
                  <div
                    key={criterion}
                    className="border-b border-gray-200 pb-5 last:border-b-0"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {criterion}
                      </h3>
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
                )
              )}
            </div>
            <button
              onClick={() => setSelectedComponent(null)}
              className="mt-6 w-full btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mt-12">
        <div className="mb-6 flex items-center justify-center gap-2 text-sm">
          {[
            { label: "Criteria Definition" },
            { label: "Component Discovery" },
            { label: "Results" },
          ].map((step, index) => (
            <React.Fragment key={step.label}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold">
                  ✓
                </div>
                <span className="font-medium text-gray-700">{step.label}</span>
              </div>
              {index < 2 && (
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
        <div className="flex flex-col items-center">
          <button
            onClick={() => navigate(`/project/${projectId}/discovery`)}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
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
            Back to Components
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
