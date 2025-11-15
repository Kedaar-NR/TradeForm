/**
 * Hook for component management operations.
 * 
 * Handles loading, creating, updating, and deleting components,
 * along with datasheet status tracking.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Component, DatasheetStatus } from "../types";
import { componentsApi, datasheetsApi } from "../services/api";

export const useComponentManagement = (projectId: string | undefined) => {
  const navigate = useNavigate();
  const [components, setComponents] = useState<Component[]>([]);
  const [datasheetStatuses, setDatasheetStatuses] = useState<Record<string, DatasheetStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Load datasheet statuses for components
   */
  const loadDatasheetStatuses = useCallback(
    async (componentsToCheck: Component[]) => {
      if (componentsToCheck.length === 0) {
        setDatasheetStatuses({});
        return;
      }

      const statuses: Record<string, DatasheetStatus> = {};

      await Promise.all(
        componentsToCheck.map(async (component) => {
          try {
            const response = await datasheetsApi.getStatus(component.id);
            statuses[component.id] = {
              hasDatasheet: response.data.has_datasheet,
              parsed: response.data.parsed,
              numPages: response.data.num_pages,
              parsedAt: response.data.parsed_at,
              parseStatus: response.data.parse_status,
              parseError: response.data.parse_error,
            };
          } catch (error) {
            statuses[component.id] = {
              hasDatasheet: false,
              parsed: false,
            };
          }
        })
      );

      setDatasheetStatuses(statuses);
    },
    []
  );

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
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      setIsLoading(false);
      setComponents([]);
      setTimeout(() => navigate("/dashboard"), 100);
      return;
    }

    try {
      setIsLoading(true);
      const response = await componentsApi.getByProject(projectId);
      
      const transformedComponents = response.data.map((comp: any) => ({
        id: comp.id,
        projectId: comp.project_id || projectId,
        manufacturer: comp.manufacturer,
        partNumber: comp.part_number,
        description: comp.description,
        datasheetUrl: comp.datasheet_url,
        datasheetFilePath: comp.datasheet_file_path,
        availability: comp.availability,
        source: comp.source,
      }));
      
      setComponents(transformedComponents);
      loadDatasheetStatuses(transformedComponents);
    } catch (error: any) {
      console.error("Failed to load components:", error);
      setComponents([]);
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

      const apiData = response.data as any;
      const newComponent: Component = {
        id: apiData.id,
        projectId: projectId,
        manufacturer: apiData.manufacturer,
        partNumber: apiData.part_number,
        description: apiData.description,
        datasheetUrl: apiData.datasheet_url,
        datasheetFilePath: apiData.datasheet_file_path,
        availability: apiData.availability,
        source: apiData.source,
      };

      setComponents([...components, newComponent]);
      return newComponent;
    } catch (error: any) {
      console.error("Failed to add component:", error);
      
      let errorMessage = "Unknown error";
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (typeof data.detail === "object" && data.detail !== null) {
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail
              .map((e: any) => (typeof e === "string" ? e : e.msg || JSON.stringify(e)))
              .join(", ");
          } else if (data.detail.message) {
            errorMessage = data.detail.message;
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`Failed to add component: ${errorMessage}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Remove a component
   */
  const removeComponent = async (componentId: string): Promise<boolean> => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this component?"
    );
    if (!confirmed) {
      return false;
    }

    try {
      await componentsApi.delete(componentId);
      setComponents(components.filter((c) => c.id !== componentId));
      return true;
    } catch (error: any) {
      console.error("Failed to remove component:", error);
      const errorMessage =
        error.response?.data?.detail || error.message || "Unknown error";
      alert(`Failed to remove component: ${errorMessage}`);
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

