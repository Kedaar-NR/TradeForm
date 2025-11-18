/**
 * Components section for project details page.
 */

import { Component } from "../../types";
import { getAvailabilityBadge, formatEnumValue } from "../../utils/datasheetHelpers";

interface ComponentsSectionProps {
  components: Component[];
  onNavigateToDiscovery: () => void;
}

export const ComponentsSection: React.FC<ComponentsSectionProps> = ({
  components,
  onNavigateToDiscovery,
}) => {
  const getSourceLabel = (source: Component["source"]) => {
    return source === "ai_discovered"
      ? "AI Discovered"
      : formatEnumValue(source);
  };

  if (components.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No components yet
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Add components to start your trade study evaluation
        </p>
        <button onClick={onNavigateToDiscovery} className="btn-primary">
          Add Components
        </button>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Components ({components.length})
          </h3>
          <button
            onClick={onNavigateToDiscovery}
            className="btn-secondary text-sm"
          >
            Manage Components
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manufacturer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Part Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Availability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {components.map((component) => (
              <tr key={component.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {component.manufacturer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {component.partNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {(() => {
                    const badge = getAvailabilityBadge(component.availability);
                    return (
                      <span className={badge.className}>
                        {formatEnumValue(component.availability, true)}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {getSourceLabel(component.source)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
