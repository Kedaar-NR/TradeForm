/**
 * Project Details page.
 *
 * Displays comprehensive project information including components,
 * criteria, and navigation to other project features.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { changesApi, aiApi } from "../services/api";
import { useProjectData } from "../hooks/useProjectData";
import { ComponentsSection } from "../components/ProjectDetails/ComponentsSection";
import { CriteriaSection } from "../components/ProjectDetails/CriteriaSection";
import CollaboratorsSection from "../components/ProjectDetails/CollaboratorsSection";
import ProjectFileTray from "../components/ProjectDetails/ProjectFileTray";
import { VersionHistoryTab } from "../components/ProjectDetails/VersionHistoryTab";
import { TradeStudyReportDialog } from "../components/TradeStudyReportDialog";
import { PageLoader, BackButton, ButtonSpinner } from "../components/ui";
import { formatEnumValue } from "../utils/datasheetHelpers";
import { getApiUrl, getAuthHeaders } from "../utils/apiHelpers";
import { formatDateForFilename } from "../utils/dateFormatters";
import { downloadBlob, fetchAndDownloadBlob } from "../utils/fileDownloadHelpers";
import { extractErrorMessage } from "../utils/errorHelpers";
import { transformProjectChanges } from "../utils/apiTransformers";
import type { ProjectChange } from "../types";
import type { ApiProjectChange } from "../types/api";
import { markStudyAccess } from "../utils/recentActivity";

type TabType = "overview" | "versions" | "collaboration";

const ProjectDetails: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { projectGroupId: fromProjectGroupId } = (location.state as { projectGroupId?: string } | null) || {};
    const { projectId } = useParams<{ projectId: string }>();
    const [activeTab, setActiveTab] = useState<TabType>("overview");
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [changes, setChanges] = useState<ProjectChange[]>([]);
    const [isLoadingChanges, setIsLoadingChanges] = useState(false);

    const { project, components, criteria, isLoading, setProject, loadProject } = useProjectData(projectId);
    useEffect(() => {
        markStudyAccess(projectId);
    }, [projectId]);

    const loadChanges = useCallback(async () => {
        if (!projectId) return;
        try {
            setIsLoadingChanges(true);
            const response = await changesApi.getByProject(projectId);
            setChanges(transformProjectChanges(response.data as ApiProjectChange[]));
        } catch (error) {
            console.error("Failed to load project changes:", error);
        } finally {
            setIsLoadingChanges(false);
        }
    }, [projectId]);

    // Listen for report status broadcasts
    useEffect(() => {
        if (!projectId || typeof window === "undefined") return;

        const handler = (event: Event) => {
            const customEvent = event as CustomEvent<{ projectId: string; status: string }>;
            if (customEvent.detail.projectId !== projectId) return;

            if (customEvent.detail.status === "generating") {
                setIsDownloadingReport(true);
                setProject((prev) =>
                    prev ? { ...prev, tradeStudyReport: prev.tradeStudyReport || "" } : prev
                );
            } else if (customEvent.detail.status === "ready") {
                setIsDownloadingReport(false);
                loadProject();
            } else if (customEvent.detail.status === "failed") {
                setIsDownloadingReport(false);
            }
        };

        window.addEventListener("tradeform-report-status", handler);
        return () => window.removeEventListener("tradeform-report-status", handler);
    }, [projectId, loadProject, setProject]);

    useEffect(() => {
        loadChanges();
    }, [loadChanges]);

    const handleExportExcel = async () => {
        if (!projectId) return;
        try {
            const dateSlug = formatDateForFilename(new Date());
            await fetchAndDownloadBlob(
                getApiUrl(`/api/projects/${projectId}/export/full`),
                `trade_study_${project?.name || projectId}_${dateSlug}.xlsx`,
                getAuthHeaders()
            );
        } catch (error) {
            console.error("Failed to export Excel:", error);
            alert(`Failed to export Excel: ${extractErrorMessage(error)}`);
        }
    };

    const handleGenerateReport = async () => {
        if (!projectId) return;
        setIsGeneratingReport(true);
        try {
            const response = await aiApi.generateTradeStudyReport(projectId);
            if (response.data.status === "success") {
                await loadProject();
                alert("Report generated successfully!");
            } else {
                throw new Error("Report generation failed");
            }
        } catch (error) {
            console.error("Failed to generate report:", error);
            alert(`Report generation failed: ${extractErrorMessage(error)}`);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const fetchPdfBlob = useCallback(async (): Promise<Blob> => {
        if (!projectId) throw new Error("No project ID");
        const response = await fetch(getApiUrl(`/api/projects/${projectId}/report/pdf`), {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Failed to fetch PDF");
        }
        return response.blob();
    }, [projectId]);

    const handleDownloadReportPdf = async () => {
        if (!projectId) return;
        setIsDownloadingReport(true);
        try {
            const blob = await fetchPdfBlob();
            const safeName = project?.name?.toLowerCase().replace(/\s+/g, "_") || projectId;
            downloadBlob(blob, `trade_study_report_${safeName}.pdf`);
        } catch (error) {
            console.error("Failed to download report PDF:", error);
            alert(`Download failed: ${extractErrorMessage(error)}`);
        } finally {
            setIsDownloadingReport(false);
        }
    };

    const handleDownloadReportWord = async () => {
        if (!projectId) return;
        setIsDownloadingReport(true);
        try {
            const response = await fetch(getApiUrl(`/api/projects/${projectId}/report/docx`), {
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to download report");
            }
            const blob = await response.blob();
            const safeName = project?.name?.toLowerCase().replace(/\s+/g, "_") || projectId;
            downloadBlob(blob, `trade_study_report_${safeName}.docx`);
        } catch (error) {
            console.error("Failed to download report Word:", error);
            alert(`Download failed: ${extractErrorMessage(error)}`);
        } finally {
            setIsDownloadingReport(false);
        }
    };

    const backDestination = fromProjectGroupId ? `/project-group/${fromProjectGroupId}` : "/dashboard";
    const backLabel = fromProjectGroupId ? "Back to Project" : "Back to Dashboard";

    if (isLoading) {
        return <PageLoader text="Loading project..." />;
    }

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
                    <button onClick={() => navigate(backDestination)} className="btn-primary">
                        {backLabel}
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
                    <BackButton to={backDestination} label={backLabel} />

                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">{project.name}</h1>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-sm text-gray-600">{project.componentType}</span>
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

                    <ProjectFileTray projectId={projectId} />

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate(`/project/${projectId}/discovery`)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            Manage Components
                        </button>
                        <button
                            onClick={() => navigate(`/project/${projectId}/criteria`)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Edit Criteria
                        </button>
                        <button
                            onClick={() => navigate(`/project/${projectId}/results`)}
                            className="btn-secondary flex items-center gap-2"
                            disabled={components.length === 0 || criteria.length === 0}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            View Results
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="btn-secondary flex items-center gap-2"
                            disabled={components.length === 0}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Excel
                        </button>
                        <button
                            onClick={project.tradeStudyReport ? () => setShowReportDialog(true) : handleGenerateReport}
                            className="btn-secondary flex items-center gap-2"
                            disabled={isGeneratingReport || isDownloadingReport || components.length === 0 || criteria.length === 0}
                        >
                            {isGeneratingReport ? (
                                <>
                                    <ButtonSpinner />
                                    Generating Report...
                                </>
                            ) : isDownloadingReport ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                    </svg>
                                    Preparing PDF...
                                </>
                            ) : project.tradeStudyReport ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Report
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Generate Report
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-300 mb-6">
                    <nav className="flex gap-8">
                        {(["overview", "versions", "collaboration"] as TabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                                    activeTab === tab
                                        ? "border-black text-gray-900"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                {tab === "versions" ? "Version History" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && (
                    <div className="space-y-8">
                        <ComponentsSection
                            components={components}
                            onNavigateToDiscovery={() => navigate(`/project/${projectId}/discovery`)}
                        />
                        <CriteriaSection
                            criteria={criteria}
                            onNavigateToCriteria={() => navigate(`/project/${projectId}/criteria`)}
                        />
                    </div>
                )}

                {activeTab === "versions" && (
                    <VersionHistoryTab
                        changes={changes}
                        isLoading={isLoadingChanges}
                        onRefresh={loadChanges}
                    />
                )}

                {activeTab === "collaboration" && <CollaboratorsSection projectId={projectId} />}
            </div>

            {/* Trade Study Report Dialog */}
            <TradeStudyReportDialog
                isOpen={showReportDialog}
                report={project.tradeStudyReport || null}
                onClose={() => setShowReportDialog(false)}
                onDownloadPdf={handleDownloadReportPdf}
                canDownloadPdf={Boolean(project.tradeStudyReport)}
                isDownloadingPdf={isDownloadingReport}
                onDownloadWord={handleDownloadReportWord}
                isDownloadingWord={isDownloadingReport}
                onGetPdfBlob={fetchPdfBlob}
                projectName={project?.name || "Trade Study Report"}
            />
        </div>
    );
};

export default ProjectDetails;
