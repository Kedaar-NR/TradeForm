import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

// Common component types with suggested criteria
const componentTypesSuggestions: Record<string, string[]> = {
  'GPS Antenna': ['Frequency Range', 'Gain', 'VSWR', 'Size', 'Cost', 'Operating Temperature'],
  'Microprocessor': ['Clock Speed', 'Power Consumption', 'Core Count', 'Price', 'Temperature Range', 'Memory'],
  'Sensor': ['Accuracy', 'Range', 'Resolution', 'Response Time', 'Power', 'Cost'],
  'Battery': ['Capacity', 'Voltage', 'Weight', 'Cost', 'Cycle Life', 'Temperature Range'],
  'Camera': ['Resolution', 'Frame Rate', 'Sensor Size', 'Low Light Performance', 'Price', 'Weight'],
};

const ProjectSetup: React.FC = () => {
  const navigate = useNavigate();
  const { addProject } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    componentType: '',
    description: '',
  });

  const [suggestedCriteria, setSuggestedCriteria] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleComponentTypeChange = (value: string) => {
    setFormData({ ...formData, componentType: value });

    // Find matching suggestions
    const matchingKey = Object.keys(componentTypesSuggestions).find(
      (key) => key.toLowerCase().includes(value.toLowerCase())
    );

    if (matchingKey) {
      setSuggestedCriteria(componentTypesSuggestions[matchingKey]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create new project
    const newProject = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      componentType: formData.componentType,
      description: formData.description,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addProject(newProject);

    // Navigate to criteria definition
    navigate(`/project/${newProject.id}/criteria`);
  };

  const isFormValid = formData.name.trim() && formData.componentType.trim();

  return (
    <div className="max-w-3xl animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Trade Study
        </h1>
        <p className="text-gray-600">
          Define what component you're evaluating and we'll help you analyze options
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
              1
            </div>
            <span className="ml-2 text-sm font-medium text-gray-900">Setup</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center font-semibold text-sm">
              2
            </div>
            <span className="ml-2 text-sm font-medium text-gray-500">Criteria</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center font-semibold text-sm">
              3
            </div>
            <span className="ml-2 text-sm font-medium text-gray-500">Components</span>
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
            <label className="label">
              Project Name *
            </label>
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
            <label className="label">
              Component Type *
            </label>
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
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="text-emerald-600 shrink-0">
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
                        className="bg-white px-3 py-1 rounded-md text-xs font-medium text-gray-700 border border-emerald-200"
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
            <label className="label">
              Description (Optional)
            </label>
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
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`btn-primary ${
                !isFormValid && 'opacity-50 cursor-not-allowed'
              }`}
            >
              Continue to Criteria Definition →
            </button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="mt-6 card p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">What is a Trade Study?</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          A systematic process engineers use to select the best component from many options by scoring each against multiple weighted criteria. TradeForm automates this using AI.
        </p>
      </div>
    </div>
  );
};

export default ProjectSetup;
