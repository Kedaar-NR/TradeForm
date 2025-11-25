/**
 * Results page for displaying trade study analysis results.
 * Shows component rankings, scores, and visualizations.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
          <div className="flex flex-wrap lg:flex-nowrap gap-2 justify-center lg:justify-start">
            {(["table", "heatmap", "charts"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={viewMode === mode ? "btn-primary" : "btn-secondary"}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
            <button
              onClick={handleExportFullExcel}
              className="btn-primary flex items-center gap-2"
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
              className="btn-primary flex items-center gap-2"
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
            <button onClick={handleExportCSV} className="btn-primary">
              Export CSV
            </button>
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
