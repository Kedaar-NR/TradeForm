/**
 * Component Discovery page.
 *
 * Allows users to discover, add, and manage components for a trade study project.
 * Includes AI-powered discovery, manual addition, and datasheet management.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Component } from "../types";
import { projectsApi, aiApi, scoresApi, componentsApi } from "../services/api";
import ComponentDetailDrawer from "../components/ComponentDetailDrawer";
import { ComponentForm } from "../components/ComponentDiscovery/ComponentForm";
import { ComponentList } from "../components/ComponentDiscovery/ComponentList";
import { DiscoveryActions } from "../components/ComponentDiscovery/DiscoveryActions";
import { TradeStudyReportDialog } from "../components/TradeStudyReportDialog";
import { useComponentManagement } from "../hooks/useComponentManagement";
import { useDatasheetUpload } from "../hooks/useDatasheetUpload";
import { useTradeStudyReport } from "../hooks/useTradeStudyReport";
import {
  PageLoader,
  BackButton,
  ProgressStepper,
  TRADE_STUDY_STEPS,
} from "../components/ui";
import { downloadBlob, MIME_TYPES } from "../utils/fileDownloadHelpers";
import { extractErrorMessage } from "../utils/errorHelpers";
import { markStudyAccess } from "../utils/recentActivity";

const ComponentDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  useEffect(() => {
    markStudyAccess(projectId);
  }, [projectId]);

  // Local UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );
  const [scoresRefreshKey, setScoresRefreshKey] = useState(0);
  const [hasScores, setHasScores] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

  // Use custom hooks
  const {
    components,
    datasheetStatuses,
    isLoading,
    isSaving,
    loadComponents,
    addComponent,
    removeComponent,
  } = useComponentManagement(projectId);

  const { isUploading: isDatasheetUploading, uploadMultipleDatasheets } =
    useDatasheetUpload();

  const {
    isGeneratingReport,
    showReportDialog,
    setShowReportDialog,
    reportRecord,
    isReportStale,
    isDownloadingReport,
    handleGenerateTradeStudyReport,
    handleDownloadReport,
    handleDownloadReportWord,
    handleViewReport,
    fetchPdfBlob,
    hasReport,
  } = useTradeStudyReport({ projectId, components });

  const autoUploadAttemptedRef = useRef<Set<string>>(new Set());
  const canContinueToResults = components.length > 0 && hasScores;

  // Check if components have scores
  const checkForScores = useCallback(async () => {
    if (!projectId || components.length === 0) {
      setHasScores(false);
      return;
    }

    try {
      const response = await scoresApi.getByProject(projectId);
      const scores = response.data as unknown as Array<{
        component_id: string;
      }>;
      const componentIds = new Set(components.map((c) => c.id));
      const hasAnyScores = scores.some((score) =>
        componentIds.has(score.component_id)
      );
      setHasScores(hasAnyScores);
    } catch (error) {
      console.error("Failed to check for scores:", error);
      setHasScores(false);
    }
  }, [projectId, components]);

  useEffect(() => {
    checkForScores();
  }, [checkForScores, scoresRefreshKey]);

  // Auto-update project status
  const saveProjectStatus = useCallback(
    async (status: "draft" | "in_progress" | "completed" = "in_progress") => {
      if (!projectId) return;
      try {
        await projectsApi.update(projectId, { status });
      } catch (error) {
        console.error("Failed to update project status:", error);
      }
    },
    [projectId]
  );

  // Handle AI component discovery
  const handleDiscover = async (
    locationPreference?: string,
    numberOfComponents?: number
  ) => {
    if (!projectId) return;

    setIsDiscovering(true);
    let discoveryRequestCompleted = false;
    try {
      const response = await aiApi.discoverComponents(
        projectId,
        locationPreference,
        numberOfComponents
      );
      const data = response.data;
      discoveryRequestCompleted = true;
      setIsDiscovering(false);

      if (data.discovered_count > 0) {
        // Reload components - this adds to existing, doesn't replace
        await loadComponents();

        const newComponents = data.components || [];
        const normalizedComponents = newComponents.map(
          (comp: { id: string; datasheet_url?: string }) => ({
            id: comp.id,
            datasheetUrl: comp.datasheet_url,
          })
        );

        const hasDatasheetUrls = normalizedComponents.some((comp) =>
          Boolean(comp.datasheetUrl)
        );

        let datasheetStatus = "";
        if (hasDatasheetUrls) {
          try {
            const { successCount, skippedCount, failedDetails } =
              await uploadMultipleDatasheets(normalizedComponents);
            await loadComponents();

            const failedCount = failedDetails?.length || 0;
            datasheetStatus = `\n• Datasheets uploaded: ${successCount}\n• Failed: ${failedCount}\n• Skipped (not PDFs): ${skippedCount}`;
          } catch (err) {
            console.error("Automatic datasheet uploads failed:", err);
            datasheetStatus = "\n• Datasheets: Auto-upload failed, upload manually from component details";
          }
        }

        // Show single notification at the end
        alert(
          `✓ Successfully discovered ${data.discovered_count} components!${datasheetStatus}`
        );
      } else {
        alert(
          "No new components discovered. Try refining your project description or criteria."
        );
      }

      await saveProjectStatus("in_progress");
    } catch (error) {
      console.error("AI discovery failed:", error);
      alert(`Discovery failed: ${extractErrorMessage(error)}`);
    } finally {
      if (!discoveryRequestCompleted) {
        setIsDiscovering(false);
      }
    }
  };

  // Handle AI scoring
  const handleScoreAll = async () => {
    if (!projectId) return;

    const confirmed = window.confirm(
      `This will use AI to score all ${
        components.length
      } components against your criteria.\n\nThis should take about ${Math.ceil(
        components.length * 3
      )} seconds. Continue?`
    );

    if (!confirmed) return;

    setIsScoring(true);

    try {
      const response = await aiApi.scoreComponents(projectId);
      const data = response.data;

      // Update status
      await saveProjectStatus("in_progress");

      // Force refresh scores check
      setScoresRefreshKey((prev) => prev + 1);
      setHasScores(true);

      // Show success message
      alert(
        `✓ Scoring complete!\n\n${data.total_scores} total scores\n${data.scores_created} new scores\n${data.scores_updated} updated scores\n\nYou can now generate a trade study report.`
      );
    } catch (error: unknown) {
      console.error("Failed to score components:", error);
      // Check for scores anyway - partial scoring may have succeeded
      await checkForScores();
      alert(
        `Scoring failed: ${extractErrorMessage(
          error
        )}\n\nYour components are still saved. You can try scoring again.`
      );
    } finally {
      // Always reset loading state
      setIsScoring(false);
    }
  };

  // Handle Excel export
  const handleExportComponentsExcel = async () => {
    if (!projectId) return;
    try {
      const response = await componentsApi.exportExcel(projectId);
      downloadBlob(
        new Blob([response.data], { type: MIME_TYPES.XLSX }),
        `components_${projectId}.xlsx`
      );
    } catch (error) {
      console.error("Failed to export components:", error);
      alert(`Failed to export components: ${extractErrorMessage(error)}`);
    }
  };

  // Handle Excel import
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
    } catch (error) {
      console.error("Failed to import Excel:", error);
      alert(`Failed to import: ${extractErrorMessage(error)}`);
    } finally {
      setIsImportingExcel(false);
      event.target.value = "";
    }
  };

  // Auto-upload datasheets effect
  useEffect(() => {
    if (!components.length || isDatasheetUploading) return;

    const pendingComponents = components.filter((component) => {
      if (!component.datasheetUrl) return false;
      if (autoUploadAttemptedRef.current.has(component.id)) return false;
      const status = datasheetStatuses[component.id];
      const alreadyHasDatasheet = Boolean(
        component.datasheetFilePath || status?.hasDatasheet || status?.parsed
      );
      return !alreadyHasDatasheet;
    });

    if (!pendingComponents.length) return;

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

  // Handle adding a component
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

  // Handle removing a component
  const handleRemove = async (componentId: string): Promise<boolean> => {
    const result = await removeComponent(componentId);
    if (result) {
      await saveProjectStatus("in_progress");
    }
    return result;
  };

  if (isLoading) {
    return <PageLoader text="Loading components..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <BackButton to={`/project/${projectId}`} label="Back to Project" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Component Discovery
          </h1>
          <p className="text-gray-600">
            Add and manage components for your trade study. Use AI to discover
            relevant options or add them manually.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {components.length} component{components.length !== 1 ? "s" : ""}{" "}
              added
            </span>
          </div>
        </div>

        {/* Discovery Actions */}
        <DiscoveryActions
          projectId={projectId || ""}
          componentCount={components.length}
          isDiscovering={isDiscovering}
          isScoring={isScoring}
          isImportingExcel={isImportingExcel}
          isDatasheetUploading={isDatasheetUploading}
          hasScores={hasScores}
          isGeneratingReport={isGeneratingReport}
          hasReport={hasReport}
          isReportStale={isReportStale}
          isDownloadingReport={isDownloadingReport}
          onDiscover={handleDiscover}
          onScoreAll={handleScoreAll}
          onImportExcel={handleImportExcel}
          onExportExcel={handleExportComponentsExcel}
          onGenerateTradeStudyReport={handleGenerateTradeStudyReport}
          onViewReport={handleViewReport}
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
          onOpenAssistant={(component) => setSelectedComponent(component)}
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
          report={reportRecord?.report || null}
          onClose={() => setShowReportDialog(false)}
          onDownloadPdf={
            reportRecord?.report ? handleDownloadReport : undefined
          }
          canDownloadPdf={Boolean(reportRecord?.report)}
          isDownloadingPdf={isDownloadingReport}
          onDownloadWord={
            reportRecord?.report ? handleDownloadReportWord : undefined
          }
          isDownloadingWord={isDownloadingReport}
          onGetPdfBlob={reportRecord?.report ? fetchPdfBlob : undefined}
        />

        {/* Progress Footer */}
        <div className="mt-12">
          <div className="mb-6">
            <ProgressStepper steps={TRADE_STUDY_STEPS.discoveryComplete} />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="relative inline-flex group">
              <button
                onClick={() => navigate(`/project/${projectId}/results`)}
                disabled={!canContinueToResults}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all flex items-center gap-2 whitespace-nowrap ${
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
              {!canContinueToResults && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Discover components and score them before continuing
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/project/${projectId}/criteria`)}
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
              Back to Criteria
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentDiscovery;
