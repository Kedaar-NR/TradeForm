/**
 * Component discovery actions including AI discovery and bulk operations.
 */

import React, { useRef } from "react";

interface DiscoveryActionsProps {
    projectId: string;
    componentCount: number;
    isDiscovering: boolean;
    isScoring: boolean;
    isUploading: boolean;
    onDiscover: () => Promise<void>;
    onScoreAll: () => Promise<void>;
    onImportExcel: (
        event: React.ChangeEvent<HTMLInputElement>
    ) => Promise<void>;
}

export const DiscoveryActions: React.FC<DiscoveryActionsProps> = ({
    projectId,
    componentCount,
    isDiscovering,
    isScoring,
    isUploading,
    onDiscover,
    onScoreAll,
    onImportExcel,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                            disabled={isDiscovering || !projectId}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isDiscovering ? (
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
                                    Discovering...
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
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                    Discover Components
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Import/Export and Score Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={onImportExcel}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
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
                    {isUploading ? "Uploading..." : "Import from Excel"}
                </button>
                <button
                    onClick={onScoreAll}
                    disabled={componentCount === 0 || isScoring}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
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
                            Score All Components
                        </>
                    )}
                </button>
                <button
                    onClick={onScoreAll}
                    disabled={componentCount === 0 || isScoring}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                    <>Generate Trade Study Report</>
                </button>
            </div>
        </>
    );
};
