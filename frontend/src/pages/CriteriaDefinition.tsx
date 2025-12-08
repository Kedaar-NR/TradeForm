/**
 * Criteria Definition page.
 *
 * Allows users to define and manage evaluation criteria for a trade study.
 * Includes auto-save functionality and common criteria suggestions.
 */

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { CriterionCard } from "../components/CriteriaDefinition/CriterionCard";
import { WeightSummary } from "../components/CriteriaDefinition/WeightSummary";
import {
  useCriteriaManagement,
  type CriterionForm,
} from "../hooks/useCriteriaManagement";
import {
  PageLoader,
  BackButton,
  ProgressStepper,
  TRADE_STUDY_STEPS,
} from "../components/ui";
import { downloadBlob, MIME_TYPES } from "../utils/fileDownloadHelpers";
import { formatDateForFilename } from "../utils/dateFormatters";
import {
  isWeightBalanced,
  calculateTotalWeight,
} from "../utils/criteriaHelpers";
import { markStudyAccess } from "../utils/recentActivity";

interface ParsedCriterionRow {
  Name: string;
  Description?: string;
  Weight: number | string;
  Unit?: string;
  HigherIsBetter?: boolean | string;
  MinimumRequirement?: number | string;
  MaximumRequirement?: number | string;
}

const COMMON_CRITERIA: CriterionForm[] = [
  {
    name: "Cost",
    description: "Total cost including materials and manufacturing",
    weight: 5,
    unit: "USD",
    higherIsBetter: false,
  },
  {
    name: "Performance",
    description: "Key performance metrics and capabilities",
    weight: 5,
    unit: "",
    higherIsBetter: true,
  },
  {
    name: "Reliability",
    description: "Expected reliability and failure rates",
    weight: 5,
    unit: "MTBF hours",
    higherIsBetter: true,
  },
  {
    name: "Weight",
    description: "Total mass of the component",
    weight: 5,
    unit: "kg",
    higherIsBetter: false,
  },
  {
    name: "Size",
    description: "Physical dimensions and form factor",
    weight: 5,
    unit: "mm",
    higherIsBetter: false,
  },
  {
    name: "Power Consumption",
    description: "Electrical power requirements",
    weight: 5,
    unit: "W",
    higherIsBetter: false,
  },
  {
    name: "Lead Time",
    description: "Time from order to delivery",
    weight: 5,
    unit: "weeks",
    higherIsBetter: false,
  },
  {
    name: "TRL",
    description: "Technology Readiness Level",
    weight: 5,
    unit: "1-9",
    higherIsBetter: true,
  },
];

const CriteriaDefinition: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  useEffect(() => {
    markStudyAccess(projectId);
  }, [projectId]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

  // New criterion form state
  const [newCriterion, setNewCriterion] = useState<CriterionForm>({
    name: "",
    description: "",
    weight: 5,
    unit: "",
    higherIsBetter: true,
  });

  const {
    criteria,
    isLoading,
    isSaving,
    isDirty,
    updateCriteria,
    addCriterion,
    removeCriterionById,
    saveCriteria,
  } = useCriteriaManagement(projectId);

  // Calculate total weight and check if balanced (uses shared tolerance from criteriaHelpers)
  const totalWeight = useMemo(() => calculateTotalWeight(criteria), [criteria]);
  const isBalanced = useMemo(() => isWeightBalanced(criteria), [criteria]);

  // Check if there are no criteria
  const hasCriteria = criteria.length > 0;
  const hasValidNames = criteria.every((c) => c.name.trim());
  const canContinue = hasCriteria && hasValidNames && isBalanced;

  // Update a single criterion field
  const handleUpdateCriterion = useCallback(
    (
      index: number,
      field: keyof CriterionForm,
      value: string | number | boolean
    ) => {
      const updated = criteria.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      );
      updateCriteria(updated);
    },
    [criteria, updateCriteria]
  );

  // Add a new criterion
  const handleAddCriterion = useCallback(
    (criterion: CriterionForm) => {
      addCriterion(criterion);
      setShowAddForm(false);
      setNewCriterion({
        name: "",
        description: "",
        weight: 5,
        unit: "",
        higherIsBetter: true,
      });
    },
    [addCriterion]
  );

  // Delete all criteria - collect IDs first to avoid stale closure issues during async deletions
  const handleDeleteAllCriteria = useCallback(async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete all criteria? This cannot be undone."
      )
    )
      return;

    // Capture the current criteria IDs before any deletions
    const idsToDelete = criteria
      .map((c) => c.id)
      .filter((id): id is string => !!id);

    // Delete each criterion by ID - uses functional state update to avoid stale closure
    for (const id of idsToDelete) {
      await removeCriterionById(id);
    }
  }, [criteria, removeCriterionById]);

  // Import from Excel
  const handleImportExcel = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImportingExcel(true);
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ParsedCriterionRow>(sheet);

        const importedCriteria: CriterionForm[] = rows.map((row) => ({
          name: row.Name || "",
          description: row.Description || "",
          weight:
            typeof row.Weight === "number"
              ? row.Weight
              : parseInt(String(row.Weight), 10) || 5,
          unit: row.Unit || "",
          higherIsBetter:
            row.HigherIsBetter === true || row.HigherIsBetter === "true",
          minimumRequirement: row.MinimumRequirement
            ? typeof row.MinimumRequirement === "number"
              ? row.MinimumRequirement
              : parseFloat(String(row.MinimumRequirement))
            : undefined,
          maximumRequirement: row.MaximumRequirement
            ? typeof row.MaximumRequirement === "number"
              ? row.MaximumRequirement
              : parseFloat(String(row.MaximumRequirement))
            : undefined,
        }));

        // Replace or append
        const shouldReplace =
          criteria.length > 0 &&
          window.confirm(
            "Replace existing criteria? Click OK to replace, Cancel to append."
          );

        if (shouldReplace) {
          updateCriteria(importedCriteria);
        } else {
          updateCriteria([...criteria, ...importedCriteria]);
        }

        alert(`Successfully imported ${importedCriteria.length} criteria`);
      } catch (error) {
        console.error("Failed to import Excel:", error);
        alert(
          `Failed to import: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setIsImportingExcel(false);
        event.target.value = "";
      }
    },
    [criteria, updateCriteria]
  );

  // Export to Excel
  const handleExportExcel = useCallback(() => {
    if (criteria.length === 0) {
      alert("No criteria to export");
      return;
    }

    const exportData = criteria.map((c) => ({
      Name: c.name,
      Description: c.description || "",
      Weight: c.weight,
      Unit: c.unit || "",
      HigherIsBetter: c.higherIsBetter,
      MinimumRequirement: c.minimumRequirement || "",
      MaximumRequirement: c.maximumRequirement || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Criteria");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const dateSlug = formatDateForFilename(new Date());
    downloadBlob(
      new Blob([excelBuffer], { type: MIME_TYPES.XLSX }),
      `criteria_${dateSlug}.xlsx`
    );
  }, [criteria]);

  // Auto-balance weights (equal distribution)
  const handleBalanceWeights = useCallback(() => {
    if (criteria.length === 0) return;
    const balancedWeight = Math.round(100 / criteria.length);
    const updated = criteria.map((c) => ({ ...c, weight: balancedWeight }));
    updateCriteria(updated);
  }, [criteria, updateCriteria]);

  // Save before navigating
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirty && criteria.length > 0) {
        saveCriteria(criteria);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, criteria, saveCriteria]);

  if (isLoading) {
    return <PageLoader text="Loading criteria..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <BackButton to={`/project/${projectId}`} label="Back to Project" />
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Criteria Definition
              </h1>
              <p className="text-gray-600">
                Define the evaluation criteria for your trade study. These
                criteria will be used to score and compare components.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isSaving && (
                <span className="text-sm text-gray-500">Saving...</span>
              )}
              {isDirty && !isSaving && (
                <span className="text-sm text-yellow-600">Unsaved changes</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              + Add Criterion
            </button>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="btn-secondary"
            >
              {showSuggestions ? "Hide" : "Show"} Suggestions
            </button>
            <label className="btn-secondary cursor-pointer">
              {isImportingExcel ? "Importing..." : "Import"}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
                disabled={isImportingExcel}
              />
            </label>
            <button
              onClick={handleExportExcel}
              className="btn-secondary"
              disabled={criteria.length === 0}
            >
              Export
            </button>
            {criteria.length > 0 && (
              <button
                onClick={handleDeleteAllCriteria}
                className="btn-secondary text-red-600 hover:text-red-700"
              >
                Delete All
              </button>
            )}
            {criteria.length > 0 && (
              <button onClick={handleBalanceWeights} className="btn-secondary">
                Auto-Balance
              </button>
            )}
          </div>
        </div>

        {/* Common Criteria Suggestions */}
        {showSuggestions && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Common Criteria
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Click to add common criteria to your trade study
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_CRITERIA.filter(
                (common) =>
                  !criteria.some(
                    (c) => c.name.toLowerCase() === common.name.toLowerCase()
                  )
              ).map((suggestion) => (
                <button
                  key={suggestion.name}
                  onClick={() => handleAddCriterion(suggestion)}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  + {suggestion.name}
                </button>
              ))}
              {COMMON_CRITERIA.filter(
                (common) =>
                  !criteria.some(
                    (c) => c.name.toLowerCase() === common.name.toLowerCase()
                  )
              ).length === 0 && (
                <span className="text-sm text-gray-500">
                  All common criteria have been added
                </span>
              )}
            </div>
          </div>
        )}

        {/* Weight Summary */}
        {criteria.length > 0 && (
          <div className="mb-6">
            <WeightSummary criteria={criteria} />
          </div>
        )}

        {/* Add Criterion Form */}
        {showAddForm && (
          <div className="card p-5 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Criterion
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newCriterion.name}
                  onChange={(e) =>
                    setNewCriterion({ ...newCriterion, name: e.target.value })
                  }
                  placeholder="e.g., Cost, Gain, Size"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newCriterion.weight}
                    onChange={(e) =>
                      setNewCriterion({
                        ...newCriterion,
                        weight: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    step="1"
                    className="input-field pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={newCriterion.unit || ""}
                  onChange={(e) =>
                    setNewCriterion({ ...newCriterion, unit: e.target.value })
                  }
                  placeholder="e.g., $, dB, mm"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Direction
                </label>
                <select
                  value={newCriterion.higherIsBetter ? "higher" : "lower"}
                  onChange={(e) =>
                    setNewCriterion({
                      ...newCriterion,
                      higherIsBetter: e.target.value === "higher",
                    })
                  }
                  className="input-field"
                >
                  <option value="higher">Higher is better</option>
                  <option value="lower">Lower is better</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCriterion.description || ""}
                  onChange={(e) =>
                    setNewCriterion({
                      ...newCriterion,
                      description: e.target.value,
                    })
                  }
                  placeholder="What does this criterion evaluate?"
                  rows={2}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddCriterion(newCriterion)}
                className="btn-primary"
                disabled={!newCriterion.name.trim()}
              >
                Add Criterion
              </button>
            </div>
          </div>
        )}

        {/* Criteria List */}
        {!hasCriteria ? (
          <div className="card p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No criteria defined
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
              Start by adding criteria that will be used to evaluate and compare
              components.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Your First Criterion
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {criteria.map((criterion, index) => (
              <CriterionCard
                key={criterion.id || `new-${index}`}
                criterion={criterion}
                index={index}
                onUpdate={handleUpdateCriterion}
                onRemove={() => {
                  if (criterion.id) {
                    removeCriterionById(criterion.id);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Progress Footer */}
        <div className="mt-12">
          <div className="mb-6">
            <ProgressStepper steps={TRADE_STUDY_STEPS.criteriaComplete} />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="relative inline-flex group">
              <button
                onClick={() => navigate(`/project/${projectId}/discovery`)}
                disabled={!canContinue}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all flex items-center gap-2 whitespace-nowrap ${
                  canContinue
                    ? "bg-gray-900 hover:bg-black shadow-md hover:shadow-lg"
                    : "bg-gray-400 cursor-not-allowed opacity-60"
                }`}
              >
                Continue to Component Discovery
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
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
              {!canContinue && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  {!hasCriteria
                    ? "Add at least one criterion before continuing"
                    : !hasValidNames
                    ? "All criteria must have a name"
                    : `Weights must sum to ~100% (currently ${totalWeight}%)`}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(`/project/${projectId}`)}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriteriaDefinition;
