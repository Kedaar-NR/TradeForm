/**
 * Dialog component for displaying the generated trade study report.
 * Includes in-platform PDF viewer functionality and markdown rendering.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
    onGetPdfBlob?: () => Promise<Blob>;
    projectName?: string;
}

// Helper: Get score color based on value (for color-coding scores in tables/text)
const getScoreColor = (score: number): string => {
    if (score >= 8) return "text-green-600 font-semibold";
    if (score >= 6) return "text-yellow-600 font-semibold";
    if (score >= 4) return "text-orange-500 font-semibold";
    return "text-red-600 font-semibold";
};

const getScoreBgColor = (score: number): string => {
    if (score >= 8) return "bg-green-50";
    if (score >= 6) return "bg-yellow-50";
    if (score >= 4) return "bg-orange-50";
    return "bg-red-50";
};

// Helper: Parse and color-code scores in text (e.g., "8/10" or "7.5/10")
const parseScoreText = (text: string): React.ReactNode[] => {
    // Use matchAll to avoid stateful regex issues with global flag
    const scoreRegex = /(\d+(?:\.\d+)?)\s*\/\s*10/g;
    const matches = Array.from(text.matchAll(scoreRegex));

    if (matches.length === 0) {
        return [text];
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const match of matches) {
        const matchIndex = match.index!;
        if (matchIndex > lastIndex) {
            parts.push(text.substring(lastIndex, matchIndex));
        }
        const score = parseFloat(match[1]);
        parts.push(
            <span key={`score-${matchIndex}`} className={getScoreColor(score)}>
                {match[0]}
            </span>
        );
        lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts;
};

// Helper: Parse bold text (**text**) and scores
const parseInlineFormatting = (text: string): React.ReactNode[] => {
    // Use matchAll to avoid stateful regex issues with global flag
    const boldRegex = /\*\*(.+?)\*\*/g;
    const matches = Array.from(text.matchAll(boldRegex));

    if (matches.length === 0) {
        return parseScoreText(text);
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const match of matches) {
        const matchIndex = match.index!;
        if (matchIndex > lastIndex) {
            const beforeText = text.substring(lastIndex, matchIndex);
            parts.push(...parseScoreText(beforeText));
        }
        parts.push(
            <strong key={`bold-${matchIndex}`} className="font-semibold text-gray-900">
                {parseScoreText(match[1])}
            </strong>
        );
        lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(...parseScoreText(text.substring(lastIndex)));
    }

    return parts;
};

// Helper: Check if a line is a table row (must have at least 2 pipes for valid cell structure)
const isTableRow = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return false;
    // Count pipes - need at least 2 for a valid table row (e.g., "| cell |")
    const pipeCount = (trimmed.match(/\|/g) || []).length;
    return pipeCount >= 2;
};

// Helper: Check if a line is a table separator (|---|---|)
const isTableSeparator = (line: string): boolean => {
    const trimmed = line.trim();
    return /^\|[\s\-:|]+\|$/.test(trimmed);
};

// Helper: Parse a table row into cells (handles escaped pipes \|)
const parseTableRow = (line: string): string[] => {
    const content = line.trim().slice(1, -1); // Remove leading and trailing |
    
    // Split on unescaped pipes only (not preceded by backslash)
    // We use a placeholder approach since JS doesn't support lookbehind in all browsers
    const placeholder = "\x00ESCAPED_PIPE\x00";
    const withPlaceholders = content.replace(/\\\|/g, placeholder);
    const cells = withPlaceholders.split("|");
    
    // Restore escaped pipes and trim each cell
    return cells.map((cell) => 
        cell.replace(new RegExp(placeholder, "g"), "|").trim()
    );
};

// Helper: Render a markdown table
const renderTable = (tableLines: string[], startIndex: number): React.ReactNode => {
    const rows = tableLines.filter((line) => !isTableSeparator(line));
    if (rows.length === 0) return null;

    const headerCells = parseTableRow(rows[0]);
    const bodyRows = rows.slice(1).map((row) => parseTableRow(row));

    return (
        <div key={`table-${startIndex}`} className="my-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-gray-800 text-white">
                    <tr>
                        {headerCells.map((cell, i) => (
                            <th
                                key={`th-${startIndex}-${i}`}
                                className="px-4 py-3 text-left text-sm font-semibold border-b border-gray-300"
                            >
                                {parseInlineFormatting(cell)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {bodyRows.map((row, rowIdx) => {
                        // Check if row contains high scores or recommendation for highlighting
                        const hasHighScore = row.some((cell) => {
                            const scoreMatch = cell.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
                            return scoreMatch && parseFloat(scoreMatch[1]) >= 8;
                        });
                        // Check for "recommended" text OR if first cell is exactly "1" (rank 1)
                        const isRecommended =
                            row.some((cell) => cell.toLowerCase().includes("recommended")) ||
                            (rowIdx === 0 && row.length > 0 && row[0].trim() === "1");

                        return (
                            <tr
                                key={`row-${startIndex}-${rowIdx}`}
                                className={`${
                                    isRecommended || hasHighScore
                                        ? "bg-green-50 font-medium"
                                        : rowIdx % 2 === 0
                                          ? "bg-white"
                                          : "bg-gray-50"
                                } hover:bg-blue-50 transition-colors`}
                            >
                                {row.map((cell, cellIdx) => {
                                    // Color-code score cells
                                    const scoreMatch = cell.match(/^(\d+(?:\.\d+)?)\s*\/\s*10$/);
                                    const totalMatch = cell.match(/^(\d+(?:\.\d+)?)$/);
                                    let cellClass = "px-4 py-3 text-sm border-b border-gray-200";

                                    if (scoreMatch) {
                                        const score = parseFloat(scoreMatch[1]);
                                        cellClass += ` ${getScoreBgColor(score)}`;
                                    } else if (totalMatch && cellIdx === row.length - 1) {
                                        // Last column might be a total score
                                        const score = parseFloat(totalMatch[1]);
                                        if (score <= 10) {
                                            cellClass += ` ${getScoreBgColor(score)} font-semibold`;
                                        }
                                    }

                                    return (
                                        <td key={`cell-${startIndex}-${rowIdx}-${cellIdx}`} className={cellClass}>
                                            {parseInlineFormatting(cell)}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Helper: Check if a line is a bullet point
const isBulletPoint = (line: string): boolean => {
    const trimmed = line.trim();
    return /^[-*]\s+/.test(trimmed);
};

// Helper: Check if a line is a numbered list item
const isNumberedListItem = (line: string): boolean => {
    const trimmed = line.trim();
    return /^\d+\.\s+/.test(trimmed);
};

// Main markdown parser that groups and renders content
const parseMarkdown = (report: string): React.ReactNode[] => {
    const lines = report.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (trimmed === "") {
            elements.push(<div key={`space-${i}`} className="h-2" />);
            i++;
            continue;
        }

        // Handle tables - collect consecutive table lines
        if (isTableRow(trimmed)) {
            const tableLines: string[] = [];
            const tableStart = i;
            while (i < lines.length && (isTableRow(lines[i].trim()) || isTableSeparator(lines[i].trim()))) {
                tableLines.push(lines[i]);
                i++;
            }
            elements.push(renderTable(tableLines, tableStart));
            continue;
        }

        // Handle headings
        if (trimmed.startsWith("#")) {
            const level = trimmed.match(/^#+/)?.[0].length || 1;
            const text = trimmed.replace(/^#+\s*/, "").trim();

            if (level === 1) {
                elements.push(
                    <h1
                        key={`h1-${i}`}
                        className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0 border-b-2 border-gray-200 pb-2"
                    >
                        {parseInlineFormatting(text)}
                    </h1>
                );
            } else if (level === 2) {
                elements.push(
                    <h2 key={`h2-${i}`} className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                        {parseInlineFormatting(text)}
                    </h2>
                );
            } else if (level === 3) {
                elements.push(
                    <h3 key={`h3-${i}`} className="text-xl font-semibold text-gray-800 mt-6 mb-3">
                        {parseInlineFormatting(text)}
                    </h3>
                );
            } else {
                elements.push(
                    <h4 key={`h4-${i}`} className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                        {parseInlineFormatting(text)}
                    </h4>
                );
            }
            i++;
            continue;
        }

        // Handle bullet lists - collect consecutive bullet items
        if (isBulletPoint(trimmed)) {
            const listItems: string[] = [];
            const listStart = i;
            while (i < lines.length && isBulletPoint(lines[i].trim())) {
                const itemText = lines[i].trim().replace(/^[-*]\s+/, "");
                listItems.push(itemText);
                i++;
            }
            elements.push(
                <ul key={`ul-${listStart}`} className="my-4 ml-6 space-y-2">
                    {listItems.map((item, idx) => (
                        <li key={`ul-${listStart}-li-${idx}`} className="text-gray-700 leading-7 flex items-start">
                            <span className="text-blue-500 mr-2 mt-1">•</span>
                            <span>{parseInlineFormatting(item)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Handle numbered lists - collect consecutive numbered items
        if (isNumberedListItem(trimmed)) {
            const listItems: string[] = [];
            const listStart = i;
            while (i < lines.length && isNumberedListItem(lines[i].trim())) {
                const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
                listItems.push(itemText);
                i++;
            }
            elements.push(
                <ol key={`ol-${listStart}`} className="my-4 ml-6 space-y-2 list-decimal list-inside">
                    {listItems.map((item, idx) => (
                        <li key={`ol-${listStart}-li-${idx}`} className="text-gray-700 leading-7">
                            {parseInlineFormatting(item)}
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // Handle horizontal rules
        if (/^[-*_]{3,}$/.test(trimmed)) {
            elements.push(<hr key={`hr-${i}`} className="my-6 border-gray-300" />);
            i++;
            continue;
        }

        // Regular paragraph - collect consecutive non-special lines
        const paragraphLines: string[] = [];
        const paragraphStart = i;

        // Helper to check if a line is a special element (not plain paragraph text)
        const isSpecialLine = (lineContent: string): boolean => {
            const t = lineContent.trim();
            if (t === "") return true; // Empty line ends paragraph
            if (t.startsWith("#")) return true; // Heading
            if (isTableRow(t) || isTableSeparator(t)) return true; // Table
            if (isBulletPoint(t)) return true; // Bullet list
            if (isNumberedListItem(t)) return true; // Numbered list
            if (/^[-*_]{3,}$/.test(t)) return true; // Horizontal rule
            return false;
        };

        // Collect consecutive non-special lines into a paragraph
        while (i < lines.length && !isSpecialLine(lines[i])) {
            paragraphLines.push(lines[i].trim());
            i++;
        }

        if (paragraphLines.length > 0) {
            // Join lines with spaces to form a continuous paragraph
            const paragraphText = paragraphLines.join(" ");
            elements.push(
                <p key={`p-${paragraphStart}`} className="mb-4 text-gray-700 leading-7">
                    {parseInlineFormatting(paragraphText)}
                </p>
            );
        }
    }

    return elements;
};

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
