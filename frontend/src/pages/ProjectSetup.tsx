import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { projectsApi } from "../services/api";
import { useStore } from "../store/useStore";
import { Project } from "../types";

// Common component types with suggested criteria
const componentTypesSuggestions: Record<string, string[]> = {
  "GPS Antenna": [
    "Frequency Range",
    "Gain",
    "VSWR",
    "Size",
    "Cost",
    "Operating Temperature",
  ],
  Microprocessor: [
    "Clock Speed",
    "Power Consumption",
    "Core Count",
    "Price",
    "Temperature Range",
    "Memory",
  ],
  Sensor: ["Accuracy", "Range", "Resolution", "Response Time", "Power", "Cost"],
  Battery: [
    "Capacity",
    "Voltage",
    "Weight",
    "Cost",
    "Cycle Life",
    "Temperature Range",
  ],
  Camera: [
    "Resolution",
    "Frame Rate",
    "Sensor Size",
    "Low Light Performance",
    "Price",
    "Weight",
  ],
};

const ProjectSetup: React.FC = () => {
  const navigate = useNavigate();
  const { addProject } = useStore();

  const [formData, setFormData] = useState({
    name: "",
    componentType: "",
    description: "",
  });

  const [suggestedCriteria, setSuggestedCriteria] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComponentTypeChange = (value: string) => {
    setFormData({ ...formData, componentType: value });

    // Find matching suggestions
    const matchingKey = Object.keys(componentTypesSuggestions).find((key) =>
      key.toLowerCase().includes(value.toLowerCase())
    );

    if (matchingKey) {
      setSuggestedCriteria(componentTypesSuggestions[matchingKey]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleAIOptimize = async () => {
    if (!formData.name) {
      alert("Please enter a project name first");
      return;
    }

    try {
      setIsOptimizing(true);

      // Call backend to use AI to suggest description and component type
      const response = await api.post("/api/ai/optimize-project", {
        name: formData.name,
        component_type: formData.componentType || null,
        description: formData.description || null,
      });

      const data = response.data || {};

      setFormData({
        name: formData.name,
        componentType: data.component_type || formData.componentType,
        description: data.description || formData.description,
      });

      alert("AI optimization complete! Review the suggested details.");
    } catch (error: any) {
      console.error("AI optimization error:", error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "AI optimization failed. Please fill in details manually.";
      alert(`AI optimization failed: ${message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.componentType.trim()) {
      alert("Please complete the required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await projectsApi.create({
        name: formData.name.trim(),
        componentType: formData.componentType.trim(),
        description: formData.description.trim() || undefined,
        status: "draft",
      });

      const data = response.data as any;
      const newProject: Project = {
        id: data.id,
        name: data.name,
        componentType: data.component_type,
        description: data.description ?? undefined,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
      };

      addProject(newProject);

      // Navigate to criteria definition
      navigate(`/project/${newProject.id}/criteria`);
    } catch (error: any) {
      console.error("Failed to create project:", error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to create project. Please try again.";
      alert(`Failed to create project: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = !!(formData.name.trim() && formData.componentType.trim());

  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Trade Study
        </h1>
        <p className="text-gray-600">
          Define what component you're evaluating and we'll help you analyze
          options
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-1000 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
              1
            </div>
            <span className="ml-2 text-sm font-medium text-gray-900">
              Setup
            </span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center font-semibold text-sm">
              2
            </div>
            <span className="ml-2 text-sm font-medium text-gray-500">
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

      {/* Form Card */}
      <div className="card p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Project Details
          </h2>
          <p className="text-sm text-gray-600">
            Basic information about your trade study
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label className="label">Project Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., UAV GPS Antenna Selection"
              className="input-field"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Give your trade study a descriptive name
            </p>
          </div>

          {/* Component Type */}
          <div>
            <label className="label">Component Type *</label>
            <input
              type="text"
              value={formData.componentType}
              onChange={(e) => handleComponentTypeChange(e.target.value)}
              placeholder="e.g., GPS Antenna, Microprocessor, Sensor"
              className="input-field"
              required
              list="component-suggestions"
            />
            <datalist id="component-suggestions">
              {Object.keys(componentTypesSuggestions).map((type) => (
                <option key={type} value={type} />
              ))}
            </datalist>
            <p className="text-sm text-gray-500 mt-1">
              What type of component are you evaluating?
            </p>
          </div>

          {/* AI Suggested Criteria */}
          {showSuggestions && suggestedCriteria.length > 0 && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-5 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="text-black shrink-0">
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
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    Suggested Criteria for {formData.componentType}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {suggestedCriteria.map((criterion) => (
                      <span
                        key={criterion}
                        className="bg-white px-3 py-1 rounded-md text-xs font-medium text-gray-700 border border-gray-300"
                      >
                        {criterion}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    You'll be able to customize these in the next step
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add any additional context about this trade study..."
              className="input-field resize-none"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`btn-primary ${
                !isFormValid || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isSubmitting
                ? "Creating Trade Study..."
                : "Continue to Criteria Definition →"}
            </button>
          </div>

          {/* AI Optimize Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleAIOptimize}
              disabled={!formData.name || isOptimizing}
              className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isOptimizing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  AI Optimizing...
                </>
              ) : (
                <>
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  AI Optimize Project Details
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              AI will suggest component type and description based on your
              project name
            </p>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-6 card p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">
          What is a Trade Study?
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          A systematic process engineers use to select the best component from
          many options by scoring each against multiple weighted criteria.
          TradeForm automates this using AI.
        </p>
      </div>
    </div>
  );
};

export default ProjectSetup;
