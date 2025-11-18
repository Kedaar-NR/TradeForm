/**
 * Project Details page.
 * 
 * Displays comprehensive project information including components,
 * criteria, and navigation to other project features.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resultsApi, reportsApi, changesApi } from "../services/api";
import { useProjectData } from "../hooks/useProjectData";
import { ComponentsSection } from "../components/ProjectDetails/ComponentsSection";
import { CriteriaSection } from "../components/ProjectDetails/CriteriaSection";
import { formatEnumValue } from "../utils/datasheetHelpers";
import type { ProjectChange } from "../types";

type TabType = "overview" | "versions" | "collaboration";

const ProjectDetails: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [changes, setChanges] = useState<ProjectChange[]>([]);
  const [isLoadingChanges, setIsLoadingChanges] = useState(false);

  // Use custom hook for data management
  const { project, components, criteria, isLoading } = useProjectData(projectId);
  const formatChangeType = (value: string) =>
    value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const parseStructuredValue = (value?: string | null) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const formatStructuredValue = (value: any) => {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value, null, 2);
  };

  const loadChanges = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoadingChanges(true);
      const response = await changesApi.getByProject(projectId);
      const mapped: ProjectChange[] = response.data.map((change: any) => ({
        id: change.id,
        projectId: change.project_id,
        userId: change.user_id,
        userName: change.user_name,
        changeType: change.change_type,
        changeDescription: change.change_description,
        entityType: change.entity_type || undefined,
        entityId: change.entity_id || undefined,
        oldValue: change.old_value || undefined,
        newValue: change.new_value || undefined,
        createdAt: change.created_at,
      }));
      setChanges(mapped);
    } catch (error) {
      console.error("Failed to load project changes:", error);
    } finally {
      setIsLoadingChanges(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadChanges();
  }, [loadChanges]);

  /**
   * Handle export to Excel
   */
  const handleExportExcel = async () => {
    if (!projectId) return;
    try {
      const response = await resultsApi.exportFullExcel(projectId);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trade_study_${project?.name || projectId}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to export Excel:", error);
      alert(
        `Failed to export Excel: ${
          error.response?.data?.detail || error.message
        }`
      );
    }
  };

  const handleDownloadReportPdf = async () => {
    if (!projectId) return;

    setIsDownloadingReport(true);
    try {
      const response = await reportsApi.downloadPdf(projectId);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName =
        project?.name?.toLowerCase().replace(/\s+/g, "_") || projectId;
      a.href = url;
      a.download = `trade_study_report_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to download report PDF:", error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to download report";
      alert(`Download failed: ${message}`);
    } finally {
      setIsDownloadingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Project Not Found
          </h2>
          <button onClick={() => navigate("/dashboard")} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
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
            Back to Dashboard
          </button>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {project.name}
              </h1>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-gray-600">
                  {project.componentType}
                </span>
                <span className="text-gray-400">•</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : project.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {formatEnumValue(project.status, true)}
                </span>
              </div>
              {project.description && (
                <p className="text-gray-600 max-w-3xl">{project.description}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/project/${projectId}/discovery`)}
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
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              Manage Components
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/criteria`)}
              className="btn-secondary flex items-center gap-2"
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Edit Criteria
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/results`)}
              className="btn-secondary flex items-center gap-2"
              disabled={components.length === 0 || criteria.length === 0}
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              View Results
            </button>
            <button
              onClick={handleExportExcel}
              className="btn-secondary flex items-center gap-2"
              disabled={components.length === 0}
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
              Export Excel
            </button>
            <button
              onClick={handleDownloadReportPdf}
              className="btn-secondary flex items-center gap-2"
              disabled={!project.tradeStudyReport || isDownloadingReport}
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
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                />
              </svg>
              {isDownloadingReport ? "Preparing PDF..." : "Download Report PDF"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-300 mb-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "overview"
                  ? "border-black text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("versions")}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "versions"
                  ? "border-black text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Version History
            </button>
            <button
              onClick={() => setActiveTab("collaboration")}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "collaboration"
                  ? "border-black text-gray-900"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Collaboration
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <ComponentsSection
              components={components}
              onNavigateToDiscovery={() =>
                navigate(`/project/${projectId}/discovery`)
              }
            />
            <CriteriaSection
              criteria={criteria}
              onNavigateToCriteria={() =>
                navigate(`/project/${projectId}/criteria`)
              }
            />
          </div>
        )}

        {activeTab === "versions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Version History
                </h3>
                <p className="text-sm text-gray-600">
                  Recent changes to this project
                </p>
              </div>
              <button onClick={loadChanges} className="btn-secondary text-sm">
                Refresh History
              </button>
            </div>
            {isLoadingChanges ? (
              <div className="card p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-sm text-gray-600">
                  Loading history...
                </p>
              </div>
            ) : changes.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-sm text-gray-600">
                  No change history recorded yet. Start editing components or
                  criteria to see updates here.
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
                            {new Date(change.createdAt).toLocaleString()}
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
        )}

        {activeTab === "collaboration" && (
          <div className="card p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Collaboration
            </h3>
            <p className="text-sm text-gray-600">
              Collaboration features coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
