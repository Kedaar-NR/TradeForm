/**
 * Criteria Definition page.
 * 
 * Allows users to define and manage evaluation criteria for a trade study project.
 * Includes auto-save functionality and common criteria suggestions.
 */

import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCriteriaManagement, CriterionForm } from "../hooks/useCriteriaManagement";
import { CriterionCard } from "../components/CriteriaDefinition/CriterionCard";
import { WeightSummary } from "../components/CriteriaDefinition/WeightSummary";
import { COMMON_CRITERIA } from "../utils/criteriaHelpers";

const CriteriaDefinition: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Use custom hook for criteria management
  const {
    criteria,
    isLoading,
    isSaving,
    isDirty,
    updateCriteria,
    addCriterion,
    removeCriterion,
  } = useCriteriaManagement(projectId);

  /**
   * Update a criterion field
   */
  const handleUpdateCriterion = (
    index: number,
    field: keyof CriterionForm,
    value: any
  ) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    updateCriteria(updated);
  };

  /**
   * Add a new criterion
   */
  const handleAddCriterion = (name?: string) => {
    const newCriterion: CriterionForm = {
      name: name || "",
      description: "",
      weight: 10,
      unit: "",
      higherIsBetter: true,
      minimumRequirement: undefined,
      maximumRequirement: undefined,
    };
    addCriterion(newCriterion);
    setShowSuggestions(false);
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
        `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/projects/${projectId}/criteria/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      alert(`Successfully imported ${result.count} criteria`);
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to import Excel:", error);
      alert(`Failed to import: ${error.message}`);
    }

    // Reset input
    event.target.value = "";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading criteria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
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
            Define Evaluation Criteria
          </h1>
          <p className="text-gray-600">
            Set up the criteria that will be used to evaluate and score
            components in your trade study.
          </p>
        </div>

        {/* Save Status */}
        {isDirty && (
          <div className="card p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              {isSaving ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
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
                  Saving...
                </>
              ) : (
                <>
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Changes will be auto-saved
                </>
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => handleAddCriterion()}
            className="btn-primary flex items-center gap-2"
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
            Add Criterion
          </button>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
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
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            {showSuggestions ? "Hide" : "Show"} Suggestions
          </button>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
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
            Import from Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>
        </div>

        {/* Common Criteria Suggestions */}
        {showSuggestions && (
          <div className="card p-5 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Common Criteria
            </h3>
            <div className="flex flex-wrap gap-2">
              {COMMON_CRITERIA.map((name) => (
                <button
                  key={name}
                  onClick={() => handleAddCriterion(name)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Criteria List */}
        {criteria.length === 0 ? (
          <div className="card p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No criteria defined yet
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
              Add evaluation criteria to score and compare components in your
              trade study.
            </p>
            <button
              onClick={() => handleAddCriterion()}
              className="btn-primary"
            >
              Add First Criterion
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {criteria.map((criterion, index) => (
              <CriterionCard
                key={index}
                criterion={criterion}
                index={index}
                onUpdate={handleUpdateCriterion}
                onRemove={removeCriterion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CriteriaDefinition;
