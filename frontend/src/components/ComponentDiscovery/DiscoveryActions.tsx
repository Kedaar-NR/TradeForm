/**
 * Component discovery actions including AI discovery and bulk operations.
 */

import React, { useRef } from "react";

interface DiscoveryActionsProps {
    projectId: string;
    componentCount: number;
    isDiscovering: boolean;
    isScoring: boolean;
    isImportingExcel: boolean;
    isDatasheetUploading: boolean;
    hasScores: boolean;
    isGeneratingReport: boolean;
    hasReport: boolean;
    isReportStale: boolean;
    isDownloadingReport: boolean;
    onDiscover: () => Promise<void>;
    onScoreAll: () => Promise<void>;
    onImportExcel: (
        event: React.ChangeEvent<HTMLInputElement>
    ) => Promise<void>;
    onExportExcel: () => Promise<void>;
    onGenerateTradeStudyReport: () => Promise<void>;
    onDownloadReport: () => Promise<void>;
    onAddComponent: () => void;
}

export const DiscoveryActions: React.FC<DiscoveryActionsProps> = ({
    projectId,
    componentCount,
    isDiscovering,
    isScoring,
    isImportingExcel,
    isDatasheetUploading,
    hasScores,
    isGeneratingReport,
    hasReport,
    isReportStale,
    isDownloadingReport,
    onDiscover,
    onScoreAll,
    onImportExcel,
    onExportExcel,
    onGenerateTradeStudyReport,
    onDownloadReport,
    onAddComponent,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canDownloadReport = hasReport && !isReportStale;
    const reportButtonDisabled = canDownloadReport
        ? isDownloadingReport
        : componentCount === 0 ||
          isScoring ||
          !hasScores ||
          isGeneratingReport;
    const componentActionsDisabled =
        isScoring || isGeneratingReport || isImportingExcel || isDatasheetUploading;
    const discoveryDisabled =
        isDiscovering ||
        !projectId ||
        isScoring ||
        isGeneratingReport ||
        isImportingExcel ||
        isDatasheetUploading;

    return (
        <>
            {/* AI Discovery Section */}
            <div className="card p-6 mb-8 bg-gradient-to-r from-gray-100 to-teal-50 border-gray-300">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            AI Component Discovery
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Automatically discover relevant components using AI.
                            The system will analyze your project requirements
                            and find matching components from manufacturer
                            databases and distributor catalogs.
                        </p>
                        <button
                            onClick={onDiscover}
                            disabled={discoveryDisabled}
                            className="btn-primary disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isDiscovering ? "Discovering..." : "Discover Components"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Import/Export and Score Actions */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={onImportExcel}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={componentActionsDisabled}
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
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    {isImportingExcel ? "Uploading..." : "Import from Excel"}
                </button>
                <button
                    onClick={onExportExcel}
                    disabled={componentActionsDisabled}
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
                            d="M7 10l5 5 5-5m-5 5V4m8 9v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5"
                        />
                    </svg>
                    Export Components
                </button>
                <button
                    onClick={onScoreAll}
                    disabled={
                        componentCount === 0 || isScoring || isGeneratingReport
                    }
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                >
                    {isScoring ? (
                        <>
                            <svg
                                className="animate-spin h-5 w-5"
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
                            Scoring...
                        </>
                    ) : (
                        <>
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
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                />
                            </svg>
                            Score Components
                        </>
                    )}
                </button>
                <div className="relative group">
                    <button
                        onClick={
                            canDownloadReport
                                ? onDownloadReport
                                : onGenerateTradeStudyReport
                        }
                        disabled={reportButtonDisabled}
                        className={`${
                            canDownloadReport
                                ? "btn-secondary"
                                : "btn-primary"
                        } flex items-center gap-2 disabled:opacity-50`}
                    >
                        {!canDownloadReport && isGeneratingReport ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5"
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
                                Generating Report...
                            </>
                        ) : canDownloadReport && isDownloadingReport ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5"
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
                        ) : canDownloadReport ? (
                            <>
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
                                Download Report
                            </>
                        ) : (
                            <>
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
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                Generate Study Report
                            </>
                        )}
                    </button>
                    {!canDownloadReport && !hasScores && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-80 text-center">
                            To generate a trade study report, you need to score
                            components first
                            <div className="absolute top-full transform -translate-x-1/2 -mt-1">
                                <div className="border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={onAddComponent}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap"
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
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                    </svg>
                    Add Component
                </button>
                </div>
            </div>
        </>
    );
};
