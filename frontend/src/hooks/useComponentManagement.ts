/**
 * Hook for component management operations.
 *
 * Handles loading, creating, updating, and deleting components,
 * along with datasheet status tracking.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Component, DatasheetStatus } from "../types";
import { componentsApi, datasheetsApi } from "../services/api";
import { transformComponent, transformDatasheetStatus } from "../utils/apiTransformers";
import { extractErrorMessage } from "../utils/errorHelpers";
import type { ApiComponent, ApiDatasheetStatus } from "../types/api";

export const useComponentManagement = (projectId: string | undefined) => {
    const navigate = useNavigate();
    const [components, setComponents] = useState<Component[]>([]);
    const [datasheetStatuses, setDatasheetStatuses] = useState<Record<string, DatasheetStatus>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    /**
     * Load datasheet statuses for components
     */
    const loadDatasheetStatuses = useCallback(async (componentsToCheck: Component[]) => {
        if (componentsToCheck.length === 0) {
            setDatasheetStatuses({});
            return;
        }

        const statuses: Record<string, DatasheetStatus> = {};

        await Promise.all(
            componentsToCheck.map(async (component) => {
                try {
                    const response = await datasheetsApi.getStatus(component.id);
                    statuses[component.id] = transformDatasheetStatus(response.data as ApiDatasheetStatus);
                } catch {
                    statuses[component.id] = {
                        hasDatasheet: false,
                        parsed: false,
                    };
                }
            })
        );

        setDatasheetStatuses(statuses);
    }, []);

    /**
     * Load components for the project
     */
    const loadComponents = useCallback(async () => {
        if (!projectId) {
            setIsLoading(false);
            setComponents([]);
            return;
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) {
            setIsLoading(false);
            setComponents([]);
            setTimeout(() => navigate("/dashboard"), 100);
            return;
        }

        try {
            setIsLoading(true);
            const response = await componentsApi.getByProject(projectId);

            // Response data comes from backend in snake_case format
            const responseData = response.data as unknown as ApiComponent[];
            const transformedComponents = responseData.map((comp) =>
                transformComponent(comp, projectId)
            );

            setComponents(transformedComponents);
            loadDatasheetStatuses(transformedComponents);
        } catch (error) {
            console.error("Failed to load components:", error);
            // Don't clear existing components on error - preserve what we have
            // Only clear if this is initial load and we have nothing
            if (components.length === 0) {
                setComponents([]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [projectId, navigate, loadDatasheetStatuses]);

    /**
     * Add a new component
     */
    const addComponent = async (componentData: {
        manufacturer: string;
        partNumber: string;
        description?: string;
        datasheetUrl?: string;
        availability: Component["availability"];
    }): Promise<Component | null> => {
        if (!projectId) {
            alert("Project ID is missing.");
            return null;
        }

        try {
            setIsSaving(true);
            const response = await componentsApi.create(projectId, {
                manufacturer: componentData.manufacturer,
                partNumber: componentData.partNumber,
                description: componentData.description || undefined,
                datasheetUrl: componentData.datasheetUrl || undefined,
                availability: componentData.availability,
                source: "manually_added",
            });

            const newComponent = transformComponent(response.data as unknown as ApiComponent, projectId);
            setComponents([...components, newComponent]);
            return newComponent;
        } catch (error) {
            console.error("Failed to add component:", error);
            alert(`Failed to add component: ${extractErrorMessage(error)}`);
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Remove a component
     */
    const removeComponent = async (componentId: string): Promise<boolean> => {
        const confirmed = window.confirm("Are you sure you want to remove this component?");
        if (!confirmed) {
            return false;
        }

        try {
            await componentsApi.delete(componentId);
            setComponents(components.filter((c) => c.id !== componentId));
            return true;
        } catch (error) {
            console.error("Failed to remove component:", error);
            alert(`Failed to remove component: ${extractErrorMessage(error)}`);
            return false;
        }
    };

    // Load components on mount
    useEffect(() => {
        if (projectId) {
            loadComponents();
        }
    }, [projectId, loadComponents]);

    return {
        components,
        datasheetStatuses,
        isLoading,
        isSaving,
        loadComponents,
        addComponent,
        removeComponent,
    };
};
