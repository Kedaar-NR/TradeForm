/**
 * Hook for criteria management with auto-save.
 *
 * Handles CRUD operations for criteria and auto-save functionality.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Criterion } from "../types";
import { criteriaApi, projectsApi } from "../services/api";
import { transformCriteria } from "../utils/apiTransformers";
import type { ApiCriterion } from "../types/api";

const AUTO_SAVE_DELAY = 2000; // milliseconds

export type CriterionForm = Omit<Criterion, "id" | "projectId"> & {
    id?: string;
};

export const useCriteriaManagement = (projectId: string | undefined) => {
    const navigate = useNavigate();
    const [criteria, setCriteria] = useState<CriterionForm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Load criteria for the project
     */
    const loadCriteria = useCallback(async () => {
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
            const response = await criteriaApi.getByProject(projectId);

            // Response data comes from backend in snake_case format
            const responseData = response.data as unknown as ApiCriterion[];
            const transformedCriteria = transformCriteria(responseData, projectId);

            // Convert to CriterionForm format
            const criteriaForms: CriterionForm[] = transformedCriteria.map((crit) => ({
                id: crit.id,
                name: crit.name,
                description: crit.description,
                weight: crit.weight,
                unit: crit.unit,
                higherIsBetter: crit.higherIsBetter,
                minimumRequirement: crit.minimumRequirement,
                maximumRequirement: crit.maximumRequirement,
            }));

            setCriteria(criteriaForms);
        } catch (error) {
            console.error("Failed to load criteria:", error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, navigate]);

    /**
     * Save all criteria
     */
    const saveCriteria = useCallback(
        async (criteriaToSave: CriterionForm[]): Promise<boolean> => {
            if (!projectId || !criteriaToSave.length) return false;

            try {
                setIsSaving(true);

                // Filter out invalid criteria (those with empty names)
                const validCriteria = criteriaToSave.filter((c) => c.name && c.name.trim().length > 0);

                if (validCriteria.length === 0) {
                    setIsSaving(false);
                    setIsDirty(false);
                    return true;
                }

                // Get existing criteria IDs
                const existingResponse = await criteriaApi.getByProject(projectId);
                const existingCriteria = existingResponse.data as unknown as ApiCriterion[];
                const existingIds = new Set(existingCriteria.map((c) => c.id));

                // Save/update each criterion
                for (const criterion of validCriteria) {
                    const criterionData = {
                        name: criterion.name,
                        description: criterion.description || undefined,
                        weight: criterion.weight,
                        unit: criterion.unit || undefined,
                        higherIsBetter: criterion.higherIsBetter,
                        minimumRequirement: criterion.minimumRequirement || undefined,
                        maximumRequirement: criterion.maximumRequirement || undefined,
                    };

                    if (criterion.id && existingIds.has(criterion.id)) {
                        // Update existing
                        await criteriaApi.update(criterion.id, criterionData);
                    } else {
                        // Create new
                        await criteriaApi.create(projectId, criterionData);
                    }
                }

                // Auto-save project status
                await projectsApi.update(projectId, { status: "in_progress" });

                // Reload criteria to sync local state with backend
                await loadCriteria();

                setIsDirty(false);
                return true;
            } catch (error) {
                console.error("Failed to save criteria:", error);
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [projectId, loadCriteria]
    );

    /**
     * Trigger auto-save
     */
    const triggerAutoSave = useCallback(
        (updatedCriteria: CriterionForm[]) => {
            setIsDirty(true);

            // Clear existing timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Set new timeout
            saveTimeoutRef.current = setTimeout(() => {
                saveCriteria(updatedCriteria);
            }, AUTO_SAVE_DELAY);
        },
        [saveCriteria]
    );

    /**
     * Generate a unique temporary ID for client-side use
     */
    const generateTempId = () =>
        `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    /**
     * Update criteria and trigger auto-save
     * Ensures all criteria have IDs (assigns temp IDs to new criteria)
     */
    const updateCriteria = useCallback(
        (updatedCriteria: CriterionForm[]) => {
            // Ensure all criteria have IDs for reliable deletion
            const criteriaWithIds = updatedCriteria.map((c) =>
                c.id ? c : { ...c, id: generateTempId() }
            );
            setCriteria(criteriaWithIds);
            triggerAutoSave(criteriaWithIds);
        },
        [triggerAutoSave]
    );

    /**
     * Add a new criterion
     */
    const addCriterion = useCallback(
        (criterion: CriterionForm) => {
            const updated = [...criteria, criterion];
            updateCriteria(updated);
        },
        [criteria, updateCriteria]
    );

    /**
     * Remove a criterion by index
     * Captures the criterion ID first to avoid stale closure issues during async operations
     */
    const removeCriterion = useCallback(
        async (index: number) => {
            // Capture criterion data immediately from current state
            const criterion = criteria[index];
            if (!criterion) return;

            const criterionId = criterion.id;

            if (criterionId) {
                // Delete from backend
                try {
                    await criteriaApi.delete(criterionId);
                } catch (error) {
                    console.error("Failed to delete criterion:", error);
                    alert("Failed to delete criterion");
                    return;
                }

                // Remove from local state using functional update and ID-based filtering
                setCriteria((prev) => prev.filter((c) => c.id !== criterionId));
            } else {
                // For unsaved criteria (no ID), use functional update with index
                // Since unsaved criteria have no ID, we must use index but with latest state
                setCriteria((prev) => prev.filter((_, i) => i !== index));
            }
        },
        [criteria]
    );

    /**
     * Remove a criterion by ID - uses functional state update to avoid stale closure issues
     * Handles both real backend IDs and temporary client-side IDs
     */
    const removeCriterionById = useCallback(
        async (criterionId: string): Promise<boolean> => {
            // For temp IDs (client-side only), skip backend call
            if (!criterionId.startsWith("temp-")) {
                try {
                    await criteriaApi.delete(criterionId);
                } catch (error) {
                    console.error("Failed to delete criterion:", error);
                    alert("Failed to delete criterion");
                    return false;
                }
            }

            // Remove from local state using functional update to get latest state
            setCriteria((prev) => prev.filter((c) => c.id !== criterionId));
            return true;
        },
        []
    );

    // Load criteria on mount
    useEffect(() => {
        if (projectId) {
            loadCriteria();
        }
    }, [projectId, loadCriteria]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        criteria,
        isLoading,
        isSaving,
        isDirty,
        loadCriteria,
        updateCriteria,
        addCriterion,
        removeCriterion,
        removeCriterionById,
        saveCriteria,
    };
};
