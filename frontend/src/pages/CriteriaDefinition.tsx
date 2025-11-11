import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Criterion } from '../types';

interface CriterionForm extends Omit<Criterion, 'id' | 'projectId'> {
  id?: string;
}

const CriteriaDefinition: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [criteria, setCriteria] = useState<CriterionForm[]>([
    {
      name: 'Cost',
      description: 'Total component cost',
      weight: 10,
      unit: 'USD',
      higherIsBetter: false,
    },
  ]);

  const addCriterion = () => {
    setCriteria([
      ...criteria,
      {
        name: '',
        description: '',
        weight: 5,
        unit: '',
        higherIsBetter: true,
      },
    ]);
  };

  const updateCriterion = (index: number, updates: Partial<CriterionForm>) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    setCriteria(newCriteria);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const getTotalWeight = () => {
    return criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
  };

  const handleContinue = () => {
    // Save criteria and navigate to component discovery
    navigate(`/project/${projectId}/discovery`);
  };

  const isFormValid = criteria.every((c) => c.name.trim() && c.weight > 0);

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
            <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-sm">
              ✓
            </div>
            <span className="ml-2 text-sm font-medium text-gray-500">Setup</span>
          </div>
          <div className="w-16 h-0.5 bg-emerald-500"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-semibold text-sm">
              2
            </div>
            <span className="ml-2 text-sm font-medium text-gray-900">Criteria</span>
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

      {/* Main Card */}
      <div className="card p-8">
        {/* Weight Summary */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 mb-6">
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
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${Math.min((getTotalWeight() / 50) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Criteria List */}
        <div className="space-y-4 mb-6">
          {criteria.map((criterion, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-5 hover:border-emerald-200 transition-all bg-white"
            >
              <div className="grid grid-cols-12 gap-4">
                {/* Criterion Name */}
                <div className="col-span-12 md:col-span-3">
                  <label className="label">Criterion Name *</label>
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) =>
                      updateCriterion(index, { name: e.target.value })
                    }
                    placeholder="e.g., Gain"
                    className="input-field"
                    required
                  />
                </div>

                {/* Description */}
                <div className="col-span-12 md:col-span-3">
                  <label className="label">Description</label>
                  <input
                    type="text"
                    value={criterion.description}
                    onChange={(e) =>
                      updateCriterion(index, { description: e.target.value })
                    }
                    placeholder="e.g., Antenna gain"
                    className="input-field"
                  />
                </div>

                {/* Weight */}
                <div className="col-span-6 md:col-span-2">
                  <label className="label">Weight *</label>
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
                    className="input-field"
                    required
                  />
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
                <div className="col-span-8 md:col-span-2 flex items-end">
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
                    <span className="ml-2 text-sm text-gray-700">
                      Higher is better
                    </span>
                  </label>
                </div>

                {/* Remove Button */}
                <div className="col-span-4 flex items-end justify-end">
                  {criteria.length > 1 && (
                    <button
                      onClick={() => removeCriterion(index)}
                      className="text-red-600 hover:text-red-700 font-semibold text-sm"
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
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 transition-all font-medium text-sm"
        >
          + Add Another Criterion
        </button>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!isFormValid}
            className={`btn-primary ${
              !isFormValid && 'opacity-50 cursor-not-allowed'
            }`}
          >
            Continue to Component Discovery →
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 card p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2 text-sm">How Criteria Work</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Each criterion represents an evaluation parameter</li>
          <li>Weights determine relative importance (1-10 scale)</li>
          <li>Check "Higher is better" for criteria where bigger values are preferred</li>
        </ul>
      </div>
    </div>
  );
};

export default CriteriaDefinition;
