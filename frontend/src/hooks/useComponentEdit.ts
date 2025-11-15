/**
 * Hook for component editing with auto-save.
 * 
 * Handles component editing state and auto-save functionality.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Component } from "../types";
import { componentsApi } from "../services/api";

const AUTO_SAVE_DELAY = 1500; // milliseconds

export const useComponentEdit = () => {
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [editForm, setEditForm] = useState({
    manufacturer: "",
    partNumber: "",
    description: "",
    datasheetUrl: "",
    availability: "in_stock" as Component["availability"],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Start editing a component
   */
  const startEditing = useCallback((component: Component) => {
    setEditingComponent(component);
    setEditForm({
      manufacturer: component.manufacturer,
      partNumber: component.partNumber,
      description: component.description || "",
      datasheetUrl: component.datasheetUrl || "",
      availability: component.availability,
    });
    setIsDirty(false);
  }, []);

  /**
   * Cancel editing
   */
  const cancelEditing = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    setEditingComponent(null);
    setEditForm({
      manufacturer: "",
      partNumber: "",
      description: "",
      datasheetUrl: "",
      availability: "in_stock",
    });
    setIsDirty(false);
  }, []);

  /**
   * Save component changes
   */
  const saveChanges = useCallback(
    async (componentId: string): Promise<boolean> => {
      try {
        setIsSaving(true);
        await componentsApi.update(componentId, {
          manufacturer: editForm.manufacturer,
          partNumber: editForm.partNumber,
          description: editForm.description || undefined,
          datasheetUrl: editForm.datasheetUrl || undefined,
          availability: editForm.availability,
        });
        setIsDirty(false);
        return true;
      } catch (error: any) {
        console.error("Failed to save component:", error);
        alert(
          `Failed to save: ${
            error.response?.data?.detail || error.message
          }`
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [editForm]
  );

  /**
   * Update form field and trigger auto-save
   */
  const updateField = useCallback(
    (field: keyof typeof editForm, value: string) => {
      setEditForm((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      if (editingComponent) {
        saveTimeoutRef.current = setTimeout(() => {
          saveChanges(editingComponent.id);
        }, AUTO_SAVE_DELAY);
      }
    },
    [editingComponent, saveChanges]
  );

  /**
   * Manually trigger save (for explicit save button)
   */
  const manualSave = useCallback(async (): Promise<boolean> => {
    if (!editingComponent || !isDirty) {
      return true;
    }

    // Clear auto-save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    return await saveChanges(editingComponent.id);
  }, [editingComponent, isDirty, saveChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    editingComponent,
    editForm,
    isSaving,
    isDirty,
    startEditing,
    cancelEditing,
    updateField,
    manualSave,
  };
};

