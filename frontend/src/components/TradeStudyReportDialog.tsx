/**
 * Dialog component for displaying the generated trade study report.
 * Includes in-platform PDF viewer functionality.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { PDFViewerModal } from "./PDFViewerModal";

interface TradeStudyReportDialogProps {
    isOpen: boolean;
    report: string | null;
    onClose: () => void;
    onDownloadPdf?: () => void;
    canDownloadPdf?: boolean;
    isDownloadingPdf?: boolean;
    onDownloadWord?: () => void;
    isDownloadingWord?: boolean;
    onGetPdfBlob?: () => Promise<Blob>; // New prop to fetch PDF blob for viewing
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
        
        // Cleanup on unmount
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
                            {report ? (
                                <div className="prose max-w-none">
                                    <div className="bg-white rounded-lg p-8 shadow-sm">
                                        {report
                                            .split("\n")
                                            .map((line, index, lines) => {
                                                const trimmed = line.trim();

                                                // Skip empty lines (they'll be handled by paragraph spacing)
                                                if (trimmed === "") {
                                                    return (
                                                        <br
                                                            key={`empty-${index}`}
                                                            className="mb-2"
                                                        />
                                                    );
                                                }

                                                // Detect markdown-style headings
                                                if (trimmed.startsWith("#")) {
                                                    const level =
                                                        trimmed.match(/^#+/)?.[0]
                                                            .length || 1;
                                                    const text = trimmed
                                                        .replace(/^#+\s*/, "")
                                                        .trim();
                                                    if (level === 1) {
                                                        return (
                                                            <h1
                                                                key={index}
                                                                className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0 border-b-2 border-gray-200 pb-2"
                                                            >
                                                                {text}
                                                            </h1>
                                                        );
                                                    } else if (level === 2) {
                                                        return (
                                                            <h2
                                                                key={index}
                                                                className="text-2xl font-semibold text-gray-900 mt-6 mb-3"
                                                            >
                                                                {text}
                                                            </h2>
                                                        );
                                                    } else if (level === 3) {
                                                        return (
                                                            <h3
                                                                key={index}
                                                                className="text-xl font-semibold text-gray-800 mt-4 mb-2"
                                                            >
                                                                {text}
                                                            </h3>
                                                        );
                                                    }
                                                }

                                                // Detect bold text (markdown **text**)
                                                const boldRegex = /\*\*(.+?)\*\*/g;
                                                const parts: React.ReactNode[] = [];
                                                let lastIndex = 0;
                                                let match;

                                                while (
                                                    (match =
                                                        boldRegex.exec(trimmed)) !==
                                                    null
                                                ) {
                                                    if (match.index > lastIndex) {
                                                        parts.push(
                                                            trimmed.substring(
                                                                lastIndex,
                                                                match.index
                                                            )
                                                        );
                                                    }
                                                    parts.push(
                                                        <strong
                                                            key={`bold-${match.index}`}
                                                            className="font-semibold text-gray-900"
                                                        >
                                                            {match[1]}
                                                        </strong>
                                                    );
                                                    lastIndex =
                                                        match.index +
                                                        match[0].length;
                                                }

                                                if (lastIndex < trimmed.length) {
                                                    parts.push(
                                                        trimmed.substring(lastIndex)
                                                    );
                                                }

                                                // Check if this looks like a heading (short line, no punctuation, previous line was empty)
                                                const isLikelyHeading =
                                                    trimmed.length < 80 &&
                                                    !trimmed.endsWith(".") &&
                                                    !trimmed.endsWith(",") &&
                                                    index > 0 &&
                                                    lines[index - 1].trim() === "";

                                                if (
                                                    isLikelyHeading &&
                                                    parts.length === 1 &&
                                                    typeof parts[0] === "string"
                                                ) {
                                                    return (
                                                        <h2
                                                            key={index}
                                                            className="text-xl font-semibold text-gray-900 mt-6 mb-3"
                                                        >
                                                            {trimmed}
                                                        </h2>
                                                    );
                                                }

                                                // Regular paragraph
                                                return (
                                                    <p
                                                        key={index}
                                                        className="mb-4 text-gray-700 leading-7"
                                                    >
                                                        {parts.length > 0
                                                            ? parts
                                                            : trimmed}
                                                    </p>
                                                );
                                            })}
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
                                    disabled={
                                        !report ||
                                        !canDownloadPdf ||
                                        isLoadingPdfView ||
                                        isDownloadingPdf ||
                                        isDownloadingWord
                                    }
                                    className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoadingPdfView ? (
                                        <>
                                            <svg
                                                className="animate-spin h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
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
                                    disabled={
                                        !report ||
                                        !canDownloadPdf ||
                                        isDownloadingWord ||
                                        isDownloadingPdf
                                    }
                                    className="btn-secondary px-6 py-2 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isDownloadingWord ? (
                                        <>
                                            <svg
                                                className="animate-spin h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
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
                                    disabled={
                                        !report ||
                                        !canDownloadPdf ||
                                        isDownloadingPdf ||
                                        isDownloadingWord
                                    }
                                    className="btn-secondary px-6 py-2 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isDownloadingPdf ? (
                                        <>
                                            <svg
                                                className="animate-spin h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
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
