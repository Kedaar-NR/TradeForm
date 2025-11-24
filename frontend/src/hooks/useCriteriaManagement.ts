/**
 * Hook for criteria management with auto-save.
 *
 * Handles CRUD operations for criteria and auto-save functionality.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Criterion } from "../types";
import { criteriaApi, projectsApi } from "../services/api";

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
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(projectId)) {
            setIsLoading(false);
            setTimeout(() => navigate("/dashboard"), 100);
            return;
        }

        try {
            setIsLoading(true);
            const response = await criteriaApi.getByProject(projectId);

            const transformedCriteria: CriterionForm[] = response.data.map(
                (crit: any) => ({
                    id: crit.id,
                    name: crit.name,
                    description: crit.description,
                    weight: crit.weight,
                    unit: crit.unit,
                    higherIsBetter: crit.higher_is_better,
                    minimumRequirement: crit.minimum_requirement,
                    maximumRequirement: crit.maximum_requirement,
                })
            );

            setCriteria(transformedCriteria);
        } catch (error: any) {
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
                const validCriteria = criteriaToSave.filter(
                    (c) => c.name && c.name.trim().length > 0
                );

                if (validCriteria.length === 0) {
                    setIsSaving(false);
                    setIsDirty(false);
                    return true;
                }

                // Get existing criteria IDs
                const existingResponse = await criteriaApi.getByProject(
                    projectId
                );
                const existingCriteria = existingResponse.data;
                const existingIds = new Set(
                    existingCriteria.map((c: any) => c.id)
                );

                // Save/update each criterion
                for (const criterion of validCriteria) {
                    const criterionData = {
                        name: criterion.name,
                        description: criterion.description || undefined,
                        weight: criterion.weight,
                        unit: criterion.unit || undefined,
                        higherIsBetter: criterion.higherIsBetter,
                        minimumRequirement:
                            criterion.minimumRequirement || undefined,
                        maximumRequirement:
                            criterion.maximumRequirement || undefined,
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

                // Reload criteria to sync local state with backend (gets IDs for newly created criteria)
                await loadCriteria();

                setIsDirty(false);
                return true;
            } catch (error: any) {
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
     * Update criteria and trigger auto-save
     */
    const updateCriteria = useCallback(
        (updatedCriteria: CriterionForm[]) => {
            setCriteria(updatedCriteria);
            triggerAutoSave(updatedCriteria);
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
     * Remove a criterion
     */
    const removeCriterion = useCallback(
        async (index: number) => {
            const criterion = criteria[index];

            if (criterion.id) {
                // Delete from backend
                try {
                    await criteriaApi.delete(criterion.id);
                } catch (error: any) {
                    console.error("Failed to delete criterion:", error);
                    alert("Failed to delete criterion");
                    return;
                }
            }

            // Remove from local state
            const updated = criteria.filter((_, i) => i !== index);
            setCriteria(updated);
        },
        [criteria]
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
        saveCriteria,
    };
};
