/**
 * Component Discovery page.
 *
 * Allows users to discover, add, and manage components for a trade study project.
 * Includes AI-powered discovery, manual addition, and datasheet management.
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Component } from "../types";
import {
  projectsApi,
  aiApi,
  scoresApi,
  reportsApi,
  componentsApi,
} from "../services/api";
import ComponentDetailDrawer from "../components/ComponentDetailDrawer";
import { ComponentForm } from "../components/ComponentDiscovery/ComponentForm";
import { ComponentList } from "../components/ComponentDiscovery/ComponentList";
import { DiscoveryActions } from "../components/ComponentDiscovery/DiscoveryActions";
import { TradeStudyReportDialog } from "../components/TradeStudyReportDialog";
import { useComponentManagement } from "../hooks/useComponentManagement";
import { useDatasheetUpload } from "../hooks/useDatasheetUpload";

const createComponentsSignature = (list: Component[]) =>
  list
    .map((component) =>
      [
        component.id,
        component.manufacturer,
        component.partNumber,
        component.availability,
        component.datasheetUrl || "",
        component.description || "",
      ].join("|")
    )
    .sort()
    .join("||");

const ComponentDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // Local UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );
  const [scoresRefreshKey, setScoresRefreshKey] = useState(0);
  const [hasScores, setHasScores] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportRecord, setReportRecord] = useState<{
    report: string;
    generatedAt?: string | null;
  } | null>(null);
  const [lastReportSignature, setLastReportSignature] = useState<string | null>(
    null
  );
  const [isReportStale, setIsReportStale] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  // Use custom hooks for business logic
  const {
    components,
    datasheetStatuses,
    isLoading,
    isSaving,
    loadComponents,
    addComponent,
    removeComponent,
  } = useComponentManagement(projectId);

  const componentsSignature = useMemo(
    () => createComponentsSignature(components),
    [components]
  );

  const { isUploading: isDatasheetUploading, uploadMultipleDatasheets } =
    useDatasheetUpload();
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const isUploadingComponents = isDatasheetUploading || isImportingExcel;
  const autoUploadAttemptedRef = useRef<Set<string>>(new Set());
  const canContinueToResults = components.length > 0 && hasScores;

  const handleExportComponentsExcel = async () => {
    if (!projectId) return;
    try {
      const response = await componentsApi.exportExcel(projectId);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `components_${projectId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to export components:", error);
      alert(
        `Failed to export components: ${
          error?.response?.data?.detail || error?.message || "Unknown error"
        }`
      );
    }
  };

  const loadTradeStudyReport = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await reportsApi.getCurrent(projectId);
      setReportRecord({
        report: response.data.report,
        generatedAt: response.data.generated_at,
      });
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setReportRecord(null);
      } else {
        console.error("Failed to load trade study report:", error);
      }
    }
  }, [projectId]);

  // Check if components have scores
  const checkForScores = useCallback(async () => {
    if (!projectId || components.length === 0) {
      setHasScores(false);
      return;
    }

    try {
      const response = await scoresApi.getByProject(projectId);
      const scores = response.data;
      // Check if there are any scores for any of our components
      const componentIds = new Set(components.map((c) => c.id));
      const hasAnyScores = scores.some((score: any) =>
        componentIds.has(score.component_id)
      );
      setHasScores(hasAnyScores);
    } catch (error) {
      console.error("Failed to check for scores:", error);
      setHasScores(false);
    }
  }, [projectId, components]);

  // Check for scores when components change or when scoring completes
  useEffect(() => {
    checkForScores();
  }, [checkForScores, scoresRefreshKey]);

  useEffect(() => {
    loadTradeStudyReport();
  }, [loadTradeStudyReport]);

  useEffect(() => {
    if (!reportRecord) {
      if (lastReportSignature !== null) {
        setLastReportSignature(null);
      }
      if (isReportStale) {
        setIsReportStale(false);
      }
      return;
    }

    if (lastReportSignature === null) {
      setLastReportSignature(componentsSignature);
      if (isReportStale) {
        setIsReportStale(false);
      }
      return;
    }

    const stale = componentsSignature !== lastReportSignature;
    if (stale !== isReportStale) {
      setIsReportStale(stale);
    }
  }, [reportRecord, componentsSignature, lastReportSignature, isReportStale]);

  // Auto-update project status to in_progress when components are modified
  const saveProjectStatus = useCallback(
    async (status: "draft" | "in_progress" | "completed" = "in_progress") => {
      if (!projectId) return;
      try {
        await projectsApi.update(projectId, { status });
      } catch (error: any) {
        console.error("Failed to update project status:", error);
      }
    },
    [projectId]
  );

  /**
   * Handle AI component discovery
   */
  const handleDiscover = async () => {
    if (!projectId) return;

    setIsDiscovering(true);
    try {
      const response = await aiApi.discoverComponents(projectId);
      const data = response.data;

      if (data.discovered_count > 0) {
        alert(
          `Successfully discovered ${data.discovered_count} components. Attempting to download datasheets...`
        );

        // Reload to get the new components
        await loadComponents();

        // Get components with PDF URLs
        const newComponents = data.components || [];

        // Log datasheet URLs for debugging
        console.log(
          "Components with datasheet URLs:",
          newComponents.map((c: any) => ({
            name: c.name,
            url: c.datasheetUrl || c.datasheet_url || "NONE",
          }))
        );

        const normalizedComponents = (newComponents || []).map((comp: any) => ({
          id: comp.id,
          datasheetUrl:
            comp.datasheetUrl ||
            comp.datasheet_url ||
            comp.datasheetURL ||
            comp.datasheet,
        }));

        const hasDatasheetUrls = normalizedComponents.some((comp) =>
          Boolean(comp.datasheetUrl)
        );

        if (hasDatasheetUrls) {
          uploadMultipleDatasheets(normalizedComponents)
            .then(({ successCount, totalAttempted, skippedCount }) => {
              if (totalAttempted > 0 || skippedCount > 0) {
                const message = `Datasheet upload results:\n- Successfully uploaded: ${successCount}\n- Failed: ${
                  totalAttempted - successCount
                }\n- Skipped (not PDFs): ${skippedCount}\n- Total attempted: ${totalAttempted}\n\nCheck browser console for details.`;
                alert(message);
              }
              loadComponents();
            })
            .catch((err) => {
              console.error("Automatic datasheet uploads failed:", err);
            });
        } else {
          console.warn("No datasheets found or URLs were not valid");
          alert(
            `Discovered ${data.discovered_count} components, but no datasheet URLs were found. You can manually upload datasheets from the component detail view.`
          );
        }
      } else {
        alert(
          "No new components discovered. Try refining your project description or criteria."
        );
      }

      await saveProjectStatus("in_progress");
    } catch (error: any) {
      console.error("AI discovery failed:", error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "AI discovery failed";
      alert(`Discovery failed: ${message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  /**
   * Handle AI scoring for all components
   */
  const handleScoreAll = async () => {
    if (!projectId) return;

    const confirmed = window.confirm(
      `This will use AI to score all ${components.length} components against your criteria. This may take a few minutes. Continue?`
    );

    if (!confirmed) return;

    setIsScoring(true);
    try {
      const response = await aiApi.scoreComponents(projectId);
      const data = response.data;
      alert(
        `Scoring complete: ${data.total_scores} scores generated (${data.scores_created} new, ${data.scores_updated} updated)`
      );
      await saveProjectStatus("in_progress");

      // Trigger refresh of scores in any open drawer
      setScoresRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error("Failed to score components:", error);
      const message =
        error?.response?.data?.detail || error?.message || "Scoring failed";
      alert(`Scoring failed: ${message}`);
    } finally {
      setIsScoring(false);
    }
  };

  /**
   * Handle generating a trade study report
   */
  const handleGenerateTradeStudyReport = async () => {
    if (!projectId) return;

    const confirmed = window.confirm(
      `This will generate a trade study report using AI. This may take a few minutes. Continue?`
    );

    if (!confirmed) return;

    setIsGeneratingReport(true);
    try {
      const response = await aiApi.generateTradeStudyReport(projectId);
      const data = response.data;
      setGeneratedReport(data.report);
      setReportRecord({
        report: data.report,
        generatedAt: data.generated_at,
      });
      setLastReportSignature(componentsSignature);
      setIsReportStale(false);
      setShowReportDialog(true);
    } catch (error: any) {
      console.error("Failed to generate trade study report:", error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Report generation failed";
      alert(`Failed to generate report: ${message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = useCallback(async () => {
    if (!projectId) return;
    setIsDownloadingReport(true);
    try {
      const response = await reportsApi.downloadPdf(projectId);
      const blob = new Blob([response.data], {
        type: "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trade_study_report_${projectId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to download trade study report:", error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to download report";
      alert(`Download failed: ${message}`);
    } finally {
      setIsDownloadingReport(false);
    }
  }, [projectId]);

  /**
   * Handle Excel import
   */
  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setIsImportingExcel(true);
    try {
      const response = await componentsApi.uploadExcel(projectId, file);
      const result = response.data;
      alert(`Successfully imported ${result.count} components`);
      await loadComponents();
      await saveProjectStatus("in_progress");
    } catch (error: any) {
      console.error("Failed to import Excel:", error);
      alert(
        `Failed to import: ${
          error?.response?.data?.detail || error?.message || "Unknown error"
        }`
      );
    } finally {
      setIsImportingExcel(false);
      event.target.value = "";
    }
  };

  useEffect(() => {
    if (!components.length || isDatasheetUploading) {
      return;
    }

    const pendingComponents = components.filter((component) => {
      if (!component.datasheetUrl) return false;
      if (autoUploadAttemptedRef.current.has(component.id)) return false;

      const status = datasheetStatuses[component.id];
      const alreadyHasDatasheet = Boolean(
        component.datasheetFilePath || status?.hasDatasheet || status?.parsed
      );

      return !alreadyHasDatasheet;
    });

    if (!pendingComponents.length) {
      return;
    }

    pendingComponents.forEach((component) =>
      autoUploadAttemptedRef.current.add(component.id)
    );

    uploadMultipleDatasheets(
      pendingComponents.map((component) => ({
        id: component.id,
        datasheetUrl: component.datasheetUrl,
      }))
    )
      .then(({ successCount }) => {
        if (successCount > 0) {
          loadComponents();
        }
      })
      .catch((error) => {
        console.error("Auto-upload datasheets failed:", error);
        pendingComponents.forEach((component) =>
          autoUploadAttemptedRef.current.delete(component.id)
        );
      });
  }, [
    components,
    datasheetStatuses,
    uploadMultipleDatasheets,
    isDatasheetUploading,
    loadComponents,
  ]);

  /**
   * Handle adding a component
   */
  const handleAdd = async (componentData: {
    manufacturer: string;
    partNumber: string;
    description?: string;
    datasheetUrl?: string;
    availability: Component["availability"];
  }): Promise<Component | null> => {
    const result = await addComponent(componentData);
    if (result) {
      await saveProjectStatus("in_progress");
    }
    return result;
  };

  /**
   * Handle removing a component
   */
  const handleRemove = async (componentId: string): Promise<boolean> => {
    const result = await removeComponent(componentId);
    if (result) {
      await saveProjectStatus("in_progress");
    }
    return result;
  };

  /**
   * Open datasheet assistant for a component
   */
  const handleOpenAssistant = (component: Component) => {
    setSelectedComponent(component);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading components...</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Component Discovery
          </h1>
          <p className="text-gray-600">
            Add and manage components for your trade study. Use AI to discover
            relevant options or add them manually.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {components.length} component
              {components.length !== 1 ? "s" : ""} added
            </span>
          </div>
        </div>

        {/* Discovery Actions */}
        <DiscoveryActions
          projectId={projectId || ""}
          componentCount={components.length}
          isDiscovering={isDiscovering}
          isScoring={isScoring}
          isUploading={isUploadingComponents}
          hasScores={hasScores}
          isGeneratingReport={isGeneratingReport}
          hasReport={Boolean(reportRecord?.report)}
          isReportStale={isReportStale}
          isDownloadingReport={isDownloadingReport}
          onDiscover={handleDiscover}
          onScoreAll={handleScoreAll}
          onImportExcel={handleImportExcel}
          onExportExcel={handleExportComponentsExcel}
          onGenerateTradeStudyReport={handleGenerateTradeStudyReport}
          onDownloadReport={handleDownloadReport}
          onAddComponent={() => setShowAddForm(true)}
        />

        {/* Add Component Form */}
        {showAddForm && (
          <ComponentForm
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
            isSaving={isSaving}
          />
        )}

        {/* Component List */}
        <ComponentList
          components={components}
          datasheetStatuses={datasheetStatuses}
          onRemove={handleRemove}
          onOpenAssistant={handleOpenAssistant}
        />

        {/* Datasheet Assistant Drawer */}
        {selectedComponent && (
          <ComponentDetailDrawer
            key={`${selectedComponent.id}-${scoresRefreshKey}`}
            component={selectedComponent}
            isOpen={selectedComponent !== null}
            onClose={() => setSelectedComponent(null)}
            projectId={projectId}
          />
        )}

        {/* Trade Study Report Dialog */}
        <TradeStudyReportDialog
          isOpen={showReportDialog}
          report={generatedReport}
          onClose={() => setShowReportDialog(false)}
          onDownloadPdf={
            reportRecord?.report ? handleDownloadReport : undefined
          }
          canDownloadPdf={Boolean(reportRecord?.report)}
          isDownloadingPdf={isDownloadingReport}
        />

        <div className="mt-12">
          <div className="mb-6 flex items-center justify-center gap-2 text-sm">
            {[
              { label: "Criteria Definition", status: "complete" },
              { label: "Component Discovery", status: "complete" },
              { label: "Results", status: "upcoming" },
            ].map((step, index) => (
              <React.Fragment key={step.label}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      step.status === "complete"
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-white"
                    }`}
                  >
                    {step.status === "complete" ? "✓" : index + 1}
                  </div>
                  <span
                    className={`font-medium ${
                      step.status === "complete"
                        ? "text-gray-700"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
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
          <div className="flex flex-col items-center gap-3">
            <span
              className="inline-flex"
              title={
                canContinueToResults
                  ? "Continue to results page"
                  : "You need to score all components"
              }
            >
              <button
                onClick={() => navigate(`/project/${projectId}/results`)}
                disabled={!canContinueToResults}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all flex items-center gap-2 ${
                  canContinueToResults
                    ? "bg-gray-900 hover:bg-black shadow-md hover:shadow-lg"
                    : "bg-gray-400 cursor-not-allowed opacity-60"
                }`}
              >
                Continue to Results Page
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
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </span>
            <button
              onClick={() => navigate(`/project/${projectId}/criteria`)}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
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
              Back to Criteria
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentDiscovery;
