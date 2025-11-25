/**
 * Results page for displaying trade study analysis results.
 * Shows component rankings, scores, and visualizations.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { resultsApi, criteriaApi } from "../services/api";
import { getApiUrl, getAuthHeaders } from "../utils/apiHelpers";
import { formatDateForFilename } from "../utils/dateFormatters";
import { downloadBlob, MIME_TYPES } from "../utils/fileDownloadHelpers";
import { transformCriteria } from "../utils/apiTransformers";
import {
  BackButton,
  ProgressStepper,
  TRADE_STUDY_STEPS,
} from "../components/ui";
import {
  ResultsTable,
  ResultsHeatmap,
  ResultsCharts,
  ComponentDetailModal,
} from "../components/Results";
import type { Criterion } from "../types";
import type { ComponentScore } from "../utils/sensitivityAnalysis";
import type { ApiCriterion } from "../types/api";
import { getScoreColorClass } from "../utils/scoreHelpers";

type ViewMode = "table" | "heatmap" | "charts";
type ChartType = "bar" | "spider" | "tornado";

const Results: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [components, setComponents] = useState<ComponentScore[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentScore | null>(null);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [hoveredComponent, setHoveredComponent] =
    useState<ComponentScore | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const loadResults = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const [resultsRes, criteriaRes] = await Promise.all([
        resultsApi.getByProject(projectId),
        criteriaApi.getByProject(projectId),
      ]);

      const resultsData = resultsRes.data;
      const criteriaData = transformCriteria(
        criteriaRes.data as unknown as ApiCriterion[],
        projectId
      );

      // Transform results to match our interface
      const transformedComponents: ComponentScore[] = resultsData.results.map(
        (result: {
          component: { id: string; manufacturer: string; part_number: string };
          scores: Array<{
            criterion_id: string;
            score: number;
            rationale: string;
          }>;
          total_score: number;
          rank: number;
        }) => {
          const critMap: Record<
            string,
            { score: number; rationale: string; weight: number }
          > = {};

          criteriaData.forEach((criterion) => {
            const score = result.scores.find(
              (s) => s.criterion_id === criterion.id
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

  const handleExportCSV = useCallback(() => {
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

    const dateSlug = formatDateForFilename(new Date());
    downloadBlob(
      new Blob([csvLines], { type: MIME_TYPES.CSV }),
      `trade-study-results-${dateSlug}.csv`
    );
  }, [components]);

  const handleExportFullExcel = useCallback(() => {
    if (!components.length) return;

    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
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
      const summarySheet = XLSX.utils.aoa_to_sheet([
        summaryHeaders,
        ...summaryData,
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Detailed Scores sheet
      const detailedHeaders = [
        "Rank",
        "Manufacturer",
        "Part Number",
        "Criterion",
        "Score",
        "Weight",
        "Rationale",
      ];
      const detailedData: (string | number)[][] = [];
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

      // Criteria sheet
      const criteriaHeaders = ["Criterion", "Weight"];
      const criteriaData = criteria.map((c) => [c.name, c.weight]);
      const criteriaSheet = XLSX.utils.aoa_to_sheet([
        criteriaHeaders,
        ...criteriaData,
      ]);
      XLSX.utils.book_append_sheet(workbook, criteriaSheet, "Criteria");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const dateSlug = formatDateForFilename(new Date());
      downloadBlob(
        new Blob([excelBuffer], { type: MIME_TYPES.XLSX }),
        `TradeStudy_Full_${dateSlug}.xlsx`
      );
    } catch (error) {
      console.error("Failed to export Excel:", error);
      alert(
        `Failed to export: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [components, criteria]);

  const handleExportWord = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await fetch(
        getApiUrl(`/api/projects/${projectId}/report/docx`),
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to export Word");
      }

      const blob = await response.blob();
      const dateSlug = formatDateForFilename(new Date());
      downloadBlob(blob, `trade_study_report_${projectId}_${dateSlug}.docx`);
    } catch (error) {
      console.error("Failed to export Word:", error);
      alert(
        `Failed to export Word: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [projectId]);

  const winner = useMemo(
    () => (components.length > 0 ? components[0] : null),
    [components]
  );

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

  return (
    <div className="max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <BackButton to={`/project/${projectId}`} label="Back to Project" />
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Trade Study Results
            </h1>
            <p className="text-gray-600">
              AI-scored components ranked by weighted criteria
            </p>
          </div>
          <div className="flex flex-col gap-2 items-center">
            {/* View mode buttons - centered */}
            <div className="flex gap-2">
              {(["table", "heatmap", "charts"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={
                    viewMode === mode ? "btn-primary" : "btn-secondary"
                  }
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            {/* Export buttons - white background */}
            <div className="flex gap-2">
              <button
                onClick={handleExportFullExcel}
                className="btn-secondary flex items-center gap-2"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Report (Excel)
              </button>
              <button
                onClick={handleExportWord}
                className="btn-secondary flex items-center gap-2"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Report (Word)
              </button>
              <button
                onClick={handleExportCSV}
                className="btn-secondary flex items-center gap-2"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Card */}
      {winner && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-gray-900 mb-1">
                RECOMMENDED
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {winner.manufacturer} {winner.partNumber}
              </h3>
              <p className="text-sm text-gray-600">
                Weighted Score:{" "}
                <span className="font-semibold text-gray-900">
                  {winner.totalScore.toFixed(2)}/10
                </span>
              </p>
            </div>
            <button
              onClick={() => setSelectedComponent(winner)}
              className="btn-secondary whitespace-nowrap"
            >
              View Details
            </button>
          </div>

          {/* Score Number Line */}
          <div className="mt-6 pt-5 border-t border-gray-300">
            <div className="text-xs font-medium text-gray-600 mb-3">
              COMPONENT SCORES
            </div>
            {(() => {
              // Calculate dynamic range based on component scores
              const scores = components.map((c) => c.totalScore);
              const minScore = Math.floor(Math.min(...scores));
              const maxScore = Math.ceil(Math.max(...scores));
              // Add padding and ensure valid range
              const rangeMin = Math.max(1, minScore - 1);
              const rangeMax = Math.min(10, maxScore + 1);
              const range = rangeMax - rangeMin;
              // Generate scale labels
              const scaleLabels = [];
              for (let i = rangeMin; i <= rangeMax; i++) {
                scaleLabels.push(i);
              }

              // Generate detailed scale labels at 0.25 increments
              const detailedLabels: number[] = [];
              for (let i = rangeMin; i <= rangeMax; i += 0.25) {
                detailedLabels.push(Number(i.toFixed(2)));
              }

              return (
                <div className="relative mx-4">
                  {/* Number line track */}
                  <div className="relative h-12 bg-gray-200 rounded-full">
                    {/* Component markers */}
                    {components.map((comp, idx) => {
                      const position =
                        ((comp.totalScore - rangeMin) / range) * 100;
                      const colors = [
                        "bg-gray-900",
                        "bg-blue-600",
                        "bg-emerald-600",
                        "bg-amber-500",
                        "bg-purple-600",
                        "bg-pink-500",
                        "bg-cyan-500",
                        "bg-orange-500",
                      ];
                      const color = colors[idx % colors.length];

                      return (
                        <div
                          key={comp.id}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10"
                          style={{
                            left: `${Math.max(2, Math.min(98, position))}%`,
                          }}
                          onMouseEnter={() => setHoveredComponent(comp)}
                          onMouseLeave={() => setHoveredComponent(null)}
                          onClick={() => setSelectedComponent(comp)}
                        >
                          <div
                            className={`w-7 h-7 rounded-full ${color} border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold hover:scale-125 transition-transform`}
                          >
                            {idx + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticks and labels below */}
                  <div className="relative h-8 mt-1">
                    {detailedLabels.map((n) => {
                      const position = ((n - rangeMin) / range) * 100;
                      const isWholeNumber = Number.isInteger(n);
                      const isHalf = n % 1 === 0.5;

                      return (
                        <div
                          key={n}
                          className="absolute -translate-x-1/2 flex flex-col items-center"
                          style={{ left: `${position}%` }}
                        >
                          {/* Tick mark */}
                          <div
                            className={`bg-gray-400 ${
                              isWholeNumber
                                ? "w-0.5 h-4"
                                : isHalf
                                ? "w-px h-3"
                                : "w-px h-2"
                            }`}
                          />
                          {/* Label - only show for whole numbers and halves */}
                          {(isWholeNumber || isHalf) && (
                            <span
                              className={`mt-0.5 text-gray-600 ${
                                isWholeNumber
                                  ? "text-sm font-bold"
                                  : "text-[10px] text-gray-400"
                              }`}
                            >
                              {isWholeNumber ? n : n.toFixed(1)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tooltip */}
                  {hoveredComponent && (
                    <div
                      ref={tooltipRef}
                      className="absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-20 min-w-[280px]"
                    >
                      <div className="font-semibold text-gray-900 mb-1">
                        {hoveredComponent.manufacturer}{" "}
                        {hoveredComponent.partNumber}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Total Score:{" "}
                        <span className="font-semibold text-gray-900">
                          {hoveredComponent.totalScore.toFixed(2)}/10
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {Object.entries(hoveredComponent.criteria).map(
                          ([name, data]) => (
                            <div
                              key={name}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-600 truncate mr-2">
                                {name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${getScoreColorClass(
                                  data.score
                                )}`}
                              >
                                {data.score}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500 text-center">
                        Click to view full details
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* View Content */}
      {viewMode === "charts" && (
        <ResultsCharts
          components={components}
          criteria={criteria}
          selectedComponent={selectedComponent}
          chartType={chartType}
          onChartTypeChange={setChartType}
        />
      )}

      {viewMode === "table" && (
        <ResultsTable
          components={components}
          criteria={criteria}
          onSelectComponent={setSelectedComponent}
        />
      )}

      {viewMode === "heatmap" && <ResultsHeatmap components={components} />}

      {/* Detail Modal */}
      <ComponentDetailModal
        component={selectedComponent}
        onClose={() => setSelectedComponent(null)}
      />

      {/* Progress Stepper */}
      <div className="mt-12">
        <div className="mb-6">
          <ProgressStepper steps={TRADE_STUDY_STEPS.results} />
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
