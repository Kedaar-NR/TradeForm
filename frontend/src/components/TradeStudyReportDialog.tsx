/**
 * Dialog component for displaying the generated trade study report.
 */

import React from "react";

interface TradeStudyReportDialogProps {
    isOpen: boolean;
    report: string | null;
    onClose: () => void;
}

export const TradeStudyReportDialog: React.FC<TradeStudyReportDialogProps> = ({
    isOpen,
    report,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
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
                                            const parts = [];
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
    );
};
