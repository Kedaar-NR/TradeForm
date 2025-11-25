/**
 * Hook for loading and managing project data.
 *
 * Handles loading project details, components, and criteria.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Project, Component, Criterion } from "../types";
import { projectsApi, componentsApi, criteriaApi } from "../services/api";
import { transformProject, transformComponents, transformCriteria } from "../utils/apiTransformers";
import type { ApiProject, ApiComponent, ApiCriterion } from "../types/api";

export const useProjectData = (projectId: string | undefined) => {
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [components, setComponents] = useState<Component[]>([]);
    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Load project data
     */
    const loadProject = useCallback(async () => {
        if (!projectId) {
            setIsLoading(false);
            return;
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) {
            setIsLoading(false);
            setTimeout(() => navigate("/dashboard"), 100);
            return;
        }

        try {
            setIsLoading(true);
            const [projectRes, componentsRes, criteriaRes] = await Promise.all([
                projectsApi.getById(projectId),
                componentsApi.getByProject(projectId),
                criteriaApi.getByProject(projectId),
            ]);

            // Response data comes from backend in snake_case format
            setProject(transformProject(projectRes.data as unknown as ApiProject));
            setComponents(transformComponents(componentsRes.data as unknown as ApiComponent[], projectId));
            setCriteria(transformCriteria(criteriaRes.data as unknown as ApiCriterion[], projectId));
        } catch (error) {
            console.error("Failed to load project data:", error);
            setProject(null);
            setComponents([]);
            setCriteria([]);
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
        setProject,
        loadProject,
    };
};
