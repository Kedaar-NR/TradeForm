import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Criterion } from "../types";
import { criteriaApi } from "../services/api";

interface CriterionForm extends Omit<Criterion, "id" | "projectId"> {
  id?: string;
  isCustom?: boolean; // Track if using "Other" option
}

const COMMON_CRITERIA = [
  "Cost",
  "Gain",
  "Size",
  "Power Consumption",
  "Frequency Range",
  "Bandwidth",
  "Efficiency",
  "Temperature Range",
  "Reliability",
  "Availability",
  "Weight",
  "Voltage",
  "Current",
  "Impedance",
  "Noise",
  "Sensitivity",
  "Other",
];

const CriteriaDefinition: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [criteria, setCriteria] = useState<CriterionForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load existing criteria with retry logic
  useEffect(() => {
    const loadCriteria = async (retryCount = 0) => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await criteriaApi.getByProject(projectId);
        const transformedCriteria = response.data.map((crit: any) => ({
          name: crit.name,
          description: crit.description,
          weight: crit.weight,
          unit: crit.unit,
          higherIsBetter: crit.higher_is_better,
          minimumRequirement: crit.minimum_requirement,
          maximumRequirement: crit.maximum_requirement,
          id: crit.id,
          isCustom: false,
        }));
        if (transformedCriteria.length > 0) {
          setCriteria(transformedCriteria);
        } else {
          // If no criteria and we just came from a template, wait a bit and retry
          if (retryCount < 2) {
            setTimeout(() => {
              loadCriteria(retryCount + 1);
            }, 1000);
            return;
          }
          // Default criterion if none exist after retries
          setCriteria([
            {
              name: "Cost",
              description: "Total component cost",
              weight: 10,
              unit: "USD",
              higherIsBetter: false,
              isCustom: false,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to load criteria:", error);
        // Retry on error if we haven't retried too many times
        if (retryCount < 2) {
          setTimeout(() => {
            loadCriteria(retryCount + 1);
          }, 1000);
          return;
        }
        // Default criterion on error after retries
        setCriteria([
          {
            name: "Cost",
            description: "Total component cost",
            weight: 10,
            unit: "USD",
            higherIsBetter: false,
            isCustom: false,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    loadCriteria();
  }, [projectId]);

  const addCriterion = () => {
    setCriteria([
      ...criteria,
      {
        name: "",
        description: "",
        weight: 5,
        unit: "",
        higherIsBetter: true,
        isCustom: false,
      },
    ]);
  };

  const saveCriteria = useCallback(
    async (criteriaToSave: CriterionForm[]) => {
      if (!projectId || !criteriaToSave.length) return;

      try {
        setIsSaving(true);
        // Get existing criteria to update/delete
        const existingResponse = await criteriaApi.getByProject(projectId);
        const existingCriteria = existingResponse.data;
        const existingIds = new Set(existingCriteria.map((c: any) => c.id));

        // Save/update each criterion
        for (const criterion of criteriaToSave) {
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
      } catch (error: any) {
        console.error("Failed to save criteria:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [projectId]
  );

  const updateCriterion = (index: number, updates: Partial<CriterionForm>) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    setCriteria(newCriteria);

    // Auto-save after 1.5 seconds
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    const timeout = setTimeout(() => {
      saveCriteria(newCriteria);
    }, 1500);
    setSaveTimeout(timeout);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const getTotalWeight = () => {
    return criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  };

  const isFormValid = criteria.every((c) => c.name.trim() && c.weight > 0);

  const handleContinue = useCallback(async () => {
    if (!isFormValid || isSaving || !projectId) return;

    // Clear any pending auto-save
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }

    try {
      setIsSaving(true);
      // Save criteria before navigating
      await saveCriteria(criteria);
      // Small delay to ensure save completes
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Navigate to component discovery page
      const discoveryPath = `/project/${projectId}/discovery`;
      console.log("Navigating to:", discoveryPath);
      navigate(discoveryPath);
    } catch (error: any) {
      console.error("Failed to save criteria:", error);
      alert(
        `Failed to save criteria: ${
          error.response?.data?.detail || error.message
        }`
      );
      setIsSaving(false);
    }
  }, [
    criteria,
    navigate,
    projectId,
    saveCriteria,
    saveTimeout,
    isFormValid,
    isSaving,
  ]);

  // Allow Enter key to continue when valid
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && isFormValid && !isSaving) {
        e.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFormValid, isSaving, handleContinue]);

  // Save on navigation away
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      // Save any pending changes
      if (criteria.length > 0) {
        saveCriteria(criteria).catch(console.error);
      }
    };
  }, [criteria, saveCriteria, saveTimeout]);

  const handleExportExcel = async () => {
    if (!projectId) return;
    try {
      const response = await criteriaApi.exportExcel(projectId);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `criteria_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to export criteria:', error);
      alert(`Failed to export criteria: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    try {
      setIsUploading(true);
      await criteriaApi.uploadExcel(projectId, file);
      // Reload criteria after import
      const response = await criteriaApi.getByProject(projectId);
      const transformedCriteria = response.data.map((crit: any) => ({
        name: crit.name,
        description: crit.description,
        weight: crit.weight,
        unit: crit.unit,
        higherIsBetter: crit.higher_is_better,
        minimumRequirement: crit.minimum_requirement,
        maximumRequirement: crit.maximum_requirement,
        id: crit.id,
        isCustom: false,
      }));
      setCriteria(transformedCriteria);
      alert('Criteria imported successfully!');
    } catch (error: any) {
      console.error('Failed to import criteria:', error);
      alert(`Failed to import criteria: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading && criteria.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-gray-500 mb-2">Loading criteria...</div>
          <div className="text-xs text-gray-400">This may take a moment</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Define Evaluation Criteria
        </h1>
        <p className="text-gray-600">
          Specify what matters most when evaluating components
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-1000 text-white rounded-lg flex items-center justify-center text-sm">
              ✓
            </div>
            <span className="ml-2 text-sm font-medium text-gray-500">
              Setup
            </span>
          </div>
          <div className="w-16 h-0.5 bg-gray-1000"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-1000 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
              2
            </div>
            <span className="ml-2 text-sm font-medium text-gray-900">
              Criteria
            </span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center font-semibold text-sm">
              3
            </div>
            <span className="ml-2 text-sm font-medium text-gray-500">
              Components
            </span>
          </div>
        </div>
      </div>

      {/* Import/Export Actions */}
      <div className="flex gap-3 mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportExcel}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn-secondary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {isUploading ? 'Uploading...' : 'Import from Excel'}
        </button>
        <button
          onClick={handleExportExcel}
          disabled={criteria.length === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Export to Excel
        </button>
      </div>

      {/* Main Card */}
      <div className="card p-8">
        {/* Weight Summary */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-5 mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-3">
            <span className="font-semibold text-gray-900">
              Total Weight: {getTotalWeight()}
            </span>
            <span className="text-xs text-gray-600">
              Higher weights = more important
            </span>
          </div>
          <div className="bg-white rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gray-1000 transition-all duration-300"
              style={{
                width: `${Math.min((getTotalWeight() / 50) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Criteria List */}
        <div className="space-y-4 mb-6">
          {criteria.map((criterion, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-all bg-white"
            >
              <div className="grid grid-cols-12 gap-4">
                {/* Criterion Name */}
                <div className="col-span-12 md:col-span-4">
                  <label className="label">Criterion Name *</label>
                  <select
                    value={criterion.isCustom ? "Other" : criterion.name || ""}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      if (selectedValue === "Other") {
                        updateCriterion(index, {
                          name: "",
                          isCustom: true,
                        });
                      } else {
                        updateCriterion(index, {
                          name: selectedValue,
                          isCustom: false,
                        });
                      }
                    }}
                    className="input-field"
                    required
                  >
                    <option value="">Select a criterion...</option>
                    {COMMON_CRITERIA.map((criterionName) => (
                      <option key={criterionName} value={criterionName}>
                        {criterionName}
                      </option>
                    ))}
                  </select>
                  {criterion.isCustom && (
                    <input
                      type="text"
                      value={criterion.name}
                      onChange={(e) =>
                        updateCriterion(index, { name: e.target.value })
                      }
                      placeholder="Enter custom criterion name"
                      className="input-field mt-2"
                      autoFocus
                      required
                    />
                  )}
                </div>

                {/* Description - Full width on its own row on mobile */}
                <div className="col-span-12 md:col-span-8">
                  <label className="label">Description</label>
                  <input
                    type="text"
                    value={criterion.description}
                    onChange={(e) =>
                      updateCriterion(index, { description: e.target.value })
                    }
                    placeholder="e.g., Antenna gain in dBi, important for signal strength"
                    className="input-field"
                  />
                </div>

                {/* Weight with Slider */}
                <div className="col-span-6 md:col-span-2">
                  <label className="label">Weight *</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={criterion.weight}
                      onChange={(e) =>
                        updateCriterion(index, {
                          weight: parseInt(e.target.value) || 0,
                        })
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${
                          ((criterion.weight - 1) / 9) * 100
                        }%, #e5e7eb ${
                          ((criterion.weight - 1) / 9) * 100
                        }%, #e5e7eb 100%)`,
                      }}
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={criterion.weight}
                      onChange={(e) =>
                        updateCriterion(index, {
                          weight: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-16 input-field text-center"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Higher weight = more important
                  </p>
                </div>

                {/* Unit */}
                <div className="col-span-6 md:col-span-2">
                  <label className="label">Unit</label>
                  <input
                    type="text"
                    value={criterion.unit}
                    onChange={(e) =>
                      updateCriterion(index, { unit: e.target.value })
                    }
                    placeholder="dBi, MHz"
                    className="input-field"
                  />
                </div>

                {/* Higher is Better */}
                <div className="col-span-12 md:col-span-3 flex items-end">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criterion.higherIsBetter}
                      onChange={(e) =>
                        updateCriterion(index, {
                          higherIsBetter: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 whitespace-nowrap">
                      Higher is better
                    </span>
                  </label>
                </div>

                {/* Remove Button */}
                <div className="col-span-12 md:col-span-1 flex items-end justify-end">
                  {criteria.length > 1 && (
                    <button
                      onClick={() => removeCriterion(index)}
                      className="text-red-600 hover:text-red-700 font-semibold text-sm whitespace-nowrap"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Criterion Button */}
        <button
          onClick={addCriterion}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-600 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all font-medium text-sm"
        >
          + Add Another Criterion
        </button>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
          <button onClick={() => navigate("/")} className="btn-secondary">
            ← Back
          </button>
          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="text-sm text-gray-500">Auto-saving...</span>
            )}
            <button
              onClick={handleContinue}
              disabled={!isFormValid || isSaving}
              className={`btn-primary ${
                (!isFormValid || isSaving) && "opacity-50 cursor-not-allowed"
              }`}
            >
              {isSaving ? "Saving..." : "Continue to Component Discovery →"}
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 card p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">
          How Criteria Work
        </h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Each criterion represents an evaluation parameter</li>
          <li>Weights determine relative importance (1-10 scale)</li>
          <li>
            Check "Higher is better" for criteria where bigger values are
            preferred
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CriteriaDefinition;
