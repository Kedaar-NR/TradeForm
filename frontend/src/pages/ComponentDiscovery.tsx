/**
 * Component Discovery page.
 *
 * Allows users to discover, add, and manage components for a trade study project.
 * Includes AI-powered discovery, manual addition, and datasheet management.
 */

import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Component } from "../types";
import { projectsApi, aiApi } from "../services/api";
import ComponentDetailDrawer from "../components/ComponentDetailDrawer";
import { ComponentForm } from "../components/ComponentDiscovery/ComponentForm";
import { ComponentList } from "../components/ComponentDiscovery/ComponentList";
import { DiscoveryActions } from "../components/ComponentDiscovery/DiscoveryActions";
import { useComponentManagement } from "../hooks/useComponentManagement";
import { useDatasheetUpload } from "../hooks/useDatasheetUpload";

const ComponentDiscovery: React.FC = () => {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();

    // Local UI state
    const [showAddForm, setShowAddForm] = useState(false);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isScoring, setIsScoring] = useState(false);
    const [selectedComponent, setSelectedComponent] =
        useState<Component | null>(null);
    const [scoresRefreshKey, setScoresRefreshKey] = useState(0);

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

    const { isUploading, uploadMultipleDatasheets } = useDatasheetUpload();

    // Auto-update project status to in_progress when components are modified
    const saveProjectStatus = useCallback(
        async (
            status: "draft" | "in_progress" | "completed" = "in_progress"
        ) => {
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
                const { successCount, totalAttempted } =
                    await uploadMultipleDatasheets(newComponents);

                if (totalAttempted > 0) {
                    alert(
                        `Downloaded and parsed ${successCount} of ${totalAttempted} datasheets. Check component cards for status.`
                    );
                }

                await loadComponents();
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
                error?.response?.data?.detail ||
                error?.message ||
                "Scoring failed";
            alert(`Scoring failed: ${message}`);
        } finally {
            setIsScoring(false);
        }
    };

    /**
     * Handle Excel import
     */
    const handleImportExcel = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file || !projectId) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(
                `${
                    process.env.REACT_APP_API_URL || "http://localhost:8000"
                }/api/projects/${projectId}/components/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const result = await response.json();
            alert(`Successfully imported ${result.count} components`);
            await loadComponents();
            await saveProjectStatus("in_progress");
        } catch (error: any) {
            console.error("Failed to import Excel:", error);
            alert(`Failed to import: ${error.message}`);
        }

        // Reset input
        event.target.value = "";
    };

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
                        Add and manage components for your trade study. Use AI
                        to discover relevant options or add them manually.
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
                    isUploading={isUploading}
                    onDiscover={handleDiscover}
                    onScoreAll={handleScoreAll}
                    onImportExcel={handleImportExcel}
                />

                {/* Add Component Button */}
                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-secondary mb-6 flex items-center gap-2"
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
                        Add Component Manually
                    </button>
                )}

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
            </div>
        </div>
    );
};

export default ComponentDiscovery;
