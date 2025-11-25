/**
 * Hook for managing trade study report generation and downloads.
 * Handles report loading, generation, and export to PDF/Word formats.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { aiApi, reportsApi } from "../services/api";
import { getApiUrl, getAuthHeaders } from "../utils/apiHelpers";
import { downloadBlob } from "../utils/fileDownloadHelpers";
import { extractErrorMessage } from "../utils/errorHelpers";
import type { Component } from "../types";

interface ReportRecord {
    report: string;
    generatedAt?: string | null;
}

interface UseTradeStudyReportOptions {
    projectId: string | undefined;
    components: Component[];
}

/**
 * Creates a signature string from components for staleness detection
 */
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

export function useTradeStudyReport({ projectId, components }: UseTradeStudyReportOptions) {
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [reportRecord, setReportRecord] = useState<ReportRecord | null>(null);
    const [lastReportSignature, setLastReportSignature] = useState<string | null>(null);
    const [isReportStale, setIsReportStale] = useState(false);
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);

    const componentsSignature = useMemo(
        () => createComponentsSignature(components),
        [components]
    );

    // Load existing report
    const loadTradeStudyReport = useCallback(async () => {
        if (!projectId) return;
        try {
            const response = await reportsApi.getCurrent(projectId);
            setReportRecord({
                report: response.data.report,
                generatedAt: response.data.generated_at,
            });
        } catch (error: unknown) {
            const err = error as { response?: { status?: number } };
            if (err?.response?.status === 404) {
                setReportRecord(null);
            } else {
                console.error("Failed to load trade study report:", error);
            }
        }
    }, [projectId]);

    // Track report staleness
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

    // Load report on mount
    useEffect(() => {
        loadTradeStudyReport();
    }, [loadTradeStudyReport]);

    // Broadcast report status for cross-component communication
    const broadcastReportStatus = useCallback(
        (status: "idle" | "generating" | "ready" | "failed") => {
            if (!projectId || typeof window === "undefined") return;
            window.dispatchEvent(
                new CustomEvent("tradeform-report-status", {
                    detail: { projectId, status },
                })
            );
        },
        [projectId]
    );

    // Generate new report
    const handleGenerateTradeStudyReport = useCallback(async () => {
        if (!projectId) return;

        const confirmed = window.confirm(
            "This will generate a trade study report using AI. This may take a few minutes. Continue?"
        );

        if (!confirmed) return;

        setIsGeneratingReport(true);
        broadcastReportStatus("generating");
        try {
            const response = await aiApi.generateTradeStudyReport(projectId);
            const data = response.data;
            setReportRecord({
                report: data.report,
                generatedAt: data.generated_at,
            });
            setLastReportSignature(componentsSignature);
            setIsReportStale(false);
            setIsGeneratingReport(false);
            setShowReportDialog(true);
            broadcastReportStatus("ready");
            alert("Trade study report generated successfully!");
        } catch (error) {
            console.error("Failed to generate trade study report:", error);
            alert(`Failed to generate report: ${extractErrorMessage(error)}`);
            broadcastReportStatus("failed");
        } finally {
            setIsGeneratingReport(false);
        }
    }, [projectId, componentsSignature, broadcastReportStatus]);

    // Fetch PDF blob
    const fetchPdfBlob = useCallback(async (): Promise<Blob> => {
        if (!projectId) throw new Error("No project ID");
        const response = await reportsApi.downloadPdf(projectId);
        return new Blob([response.data], { type: "application/pdf" });
    }, [projectId]);

    // Download PDF
    const handleDownloadReport = useCallback(async () => {
        if (!projectId) return;
        setIsDownloadingReport(true);
        try {
            const blob = await fetchPdfBlob();
            downloadBlob(blob, `trade_study_report_${projectId}.pdf`);
        } catch (error) {
            console.error("Failed to download trade study report:", error);
            alert(`Download failed: ${extractErrorMessage(error)}`);
        } finally {
            setIsDownloadingReport(false);
        }
    }, [projectId, fetchPdfBlob]);

    // Download Word
    const handleDownloadReportWord = useCallback(async () => {
        if (!projectId) return;
        setIsDownloadingReport(true);
        try {
            const response = await fetch(
                getApiUrl(`/api/projects/${projectId}/report/docx`),
                { headers: getAuthHeaders() }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Failed to download report");
            }

            const blob = await response.blob();
            downloadBlob(blob, `trade_study_report_${projectId}.docx`);
        } catch (error) {
            console.error("Failed to download report Word:", error);
            alert(`Download failed: ${extractErrorMessage(error)}`);
        } finally {
            setIsDownloadingReport(false);
        }
    }, [projectId]);

    // View report
    const handleViewReport = useCallback(async () => {
        await loadTradeStudyReport();
        setShowReportDialog(true);
    }, [loadTradeStudyReport]);

    return {
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
        hasReport: Boolean(reportRecord?.report),
    };
}

