/**
 * Hook for loading and managing project data.
 * 
 * Handles loading project, components, criteria, and related data.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Project, Component, Criterion } from "../types";
import { projectsApi } from "../services/api";

export const useProjectData = (projectId: string | undefined) => {
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load project details including components and criteria
   */
  const loadProject = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      setIsLoading(false);
      setTimeout(() => navigate("/dashboard"), 100);
      return;
    }

    try {
      setIsLoading(true);
      const response = await projectsApi.getById(projectId);
      const apiData = response.data as any;

      // Transform project data
      const projectData: Project = {
        id: apiData.id,
        name: apiData.name,
        componentType: apiData.component_type,
        description: apiData.description,
        status: apiData.status,
        createdAt: apiData.created_at,
        updatedAt: apiData.updated_at,
        tradeStudyReport: apiData.trade_study_report,
        reportGeneratedAt: apiData.report_generated_at,
      };

      setProject(projectData);

      // Transform components
      const componentsData: Component[] = (apiData.components || []).map(
        (comp: any) => ({
          id: comp.id,
          projectId: comp.project_id || projectId,
          manufacturer: comp.manufacturer,
          partNumber: comp.part_number,
          description: comp.description,
          datasheetUrl: comp.datasheet_url,
          datasheetFilePath: comp.datasheet_file_path,
          availability: comp.availability,
          source: comp.source,
        })
      );

      setComponents(componentsData);

      // Transform criteria
      const criteriaData: Criterion[] = (apiData.criteria || []).map(
        (crit: any) => ({
          id: crit.id,
          projectId: crit.project_id || projectId,
          name: crit.name,
          description: crit.description,
          weight: crit.weight,
          unit: crit.unit,
          higherIsBetter: crit.higher_is_better,
          minimumRequirement: crit.minimum_requirement,
          maximumRequirement: crit.maximum_requirement,
        })
      );

      setCriteria(criteriaData);
    } catch (error: any) {
      console.error("Failed to load project:", error);

      if (error.response?.status === 404) {
        alert("Project not found");
        navigate("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId, navigate]);

  // Load project on mount
  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, loadProject]);

  return {
    project,
    components,
    criteria,
    isLoading,
    loadProject,
    setProject,
    setComponents,
    setCriteria,
  };
};
