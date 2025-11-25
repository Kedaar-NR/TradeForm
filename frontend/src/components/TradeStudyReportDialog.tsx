/**
 * Dialog component for displaying the generated trade study report.
 * Includes in-platform PDF viewer functionality and markdown rendering.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { PDFViewerModal } from "./PDFViewerModal";
import { parseMarkdown } from "../utils/markdownParser";
import { ButtonSpinner } from "./ui/LoadingSpinner";

interface TradeStudyReportDialogProps {
    isOpen: boolean;
    report: string | null;
    onClose: () => void;
    onDownloadPdf?: () => void;
    canDownloadPdf?: boolean;
    isDownloadingPdf?: boolean;
    onDownloadWord?: () => void;
    isDownloadingWord?: boolean;
    onGetPdfBlob?: () => Promise<Blob>;
    projectName?: string;
}

export const TradeStudyReportDialog: React.FC<TradeStudyReportDialogProps> = ({
    isOpen,
    report,
    onClose,
    onDownloadPdf,
    canDownloadPdf = true,
    isDownloadingPdf = false,
    onDownloadWord,
    isDownloadingWord = false,
    onGetPdfBlob,
    projectName = "Trade Study Report",
}) => {
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoadingPdfView, setIsLoadingPdfView] = useState(false);

    // Track the URL in a ref for cleanup on unmount/dialog close
    const pdfUrlRef = useRef<string | null>(null);

    // Parse report into rendered elements (memoized for performance)
    const renderedReport = useMemo(() => {
        if (!report) return null;
        return parseMarkdown(report);
    }, [report]);

    // Keep ref in sync with state
    useEffect(() => {
        pdfUrlRef.current = pdfUrl;
    }, [pdfUrl]);

    // Cleanup object URL when dialog closes or component unmounts
    useEffect(() => {
        if (!isOpen && pdfUrlRef.current) {
            URL.revokeObjectURL(pdfUrlRef.current);
            pdfUrlRef.current = null;
            setPdfUrl(null);
            setShowPdfViewer(false);
        }

        return () => {
            if (pdfUrlRef.current) {
                URL.revokeObjectURL(pdfUrlRef.current);
                pdfUrlRef.current = null;
            }
        };
    }, [isOpen]);

    const handleViewPdf = useCallback(async () => {
        if (!onGetPdfBlob) return;

        setIsLoadingPdfView(true);
        try {
            const blob = await onGetPdfBlob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPdfViewer(true);
        } catch (error) {
            console.error("Failed to load PDF for viewing:", error);
            alert("Failed to load PDF preview. Please try downloading instead.");
        } finally {
            setIsLoadingPdfView(false);
        }
    }, [onGetPdfBlob]);

    const handleClosePdfViewer = useCallback(() => {
        setShowPdfViewer(false);
        if (pdfUrlRef.current) {
            URL.revokeObjectURL(pdfUrlRef.current);
            pdfUrlRef.current = null;
            setPdfUrl(null);
        }
    }, []);

    if (!isOpen) return null;

    const isAnyDownloading = isDownloadingPdf || isDownloadingWord || isLoadingPdfView;

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Dialog */}
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Trade Study Report
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            {renderedReport ? (
                                <div className="prose max-w-none">
                                    <div className="bg-white rounded-lg p-8 shadow-sm">
                                        {renderedReport}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    No report available
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                            {/* View PDF Button */}
                            {onGetPdfBlob && (
                                <button
                                    onClick={handleViewPdf}
                                    disabled={!report || !canDownloadPdf || isAnyDownloading}
                                    className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoadingPdfView ? (
                                        <>
                                            <ButtonSpinner />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
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
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                            View PDF
                                        </>
                                    )}
                                </button>
                            )}
                            {onDownloadWord && (
                                <button
                                    onClick={onDownloadWord}
                                    disabled={!report || !canDownloadPdf || isAnyDownloading}
                                    className="btn-secondary px-6 py-2 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isDownloadingWord ? (
                                        <>
                                            <ButtonSpinner />
                                            Preparing Word...
                                        </>
                                    ) : (
                                        <>
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
                                            Download Word
                                        </>
                                    )}
                                </button>
                            )}
                            {onDownloadPdf && (
                                <button
                                    onClick={onDownloadPdf}
                                    disabled={!report || !canDownloadPdf || isAnyDownloading}
                                    className="btn-secondary px-6 py-2 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isDownloadingPdf ? (
                                        <>
                                            <ButtonSpinner />
                                            Preparing PDF...
                                        </>
                                    ) : (
                                        <>
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
                                                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                                                />
                                            </svg>
                                            Download PDF
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="btn-secondary px-6 py-2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Viewer Modal */}
            <PDFViewerModal
                isOpen={showPdfViewer}
                pdfUrl={pdfUrl}
                onClose={handleClosePdfViewer}
                title={projectName}
            />
        </>
    );
};
