/**
 * Criteria section for project details page.
 */

import React from "react";
import { Criterion } from "../../types";

interface CriteriaSectionProps {
  criteria: Criterion[];
  onNavigateToCriteria: () => void;
}

export const CriteriaSection: React.FC<CriteriaSectionProps> = ({
  criteria,
  onNavigateToCriteria,
}) => {
  if (criteria.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No criteria defined yet
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Define evaluation criteria to score components
        </p>
        <button onClick={onNavigateToCriteria} className="btn-primary">
          Define Criteria
        </button>
      </div>
    );
  }

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Evaluation Criteria ({criteria.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total weight: {totalWeight.toFixed(1)}
            </p>
          </div>
          <button
            onClick={onNavigateToCriteria}
            className="btn-secondary text-sm"
          >
            Edit Criteria
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weight
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Direction
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {criteria.map((criterion) => (
              <tr key={criterion.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {criterion.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {criterion.weight}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {criterion.unit || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      criterion.higherIsBetter
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {criterion.higherIsBetter ? "Higher is better" : "Lower is better"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

