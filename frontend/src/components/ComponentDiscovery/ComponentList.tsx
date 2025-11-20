/**
 * Component list display with action buttons.
 */

import { Component, DatasheetStatus } from "../../types";
import {
  getAvailabilityBadge,
  getDatasheetStatusBadge,
} from "../../utils/datasheetHelpers";

interface ComponentListProps {
  components: Component[];
  datasheetStatuses: Record<string, DatasheetStatus>;
  onRemove: (componentId: string) => Promise<boolean>;
  onOpenAssistant: (component: Component) => void;
}

export const ComponentList = ({
  components,
  datasheetStatuses,
  onRemove,
  onOpenAssistant,
}: ComponentListProps) => {
  const renderDatasheetStatus = (component: Component) => {
    const badgeProps = getDatasheetStatusBadge(
      datasheetStatuses[component.id],
      Boolean(component.datasheetFilePath || component.datasheetUrl)
    );

    return (
      <span className={`${badgeProps.className} flex items-center gap-1`}>
        {badgeProps.showIcon && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d={badgeProps.iconPath}
              clipRule="evenodd"
            />
          </svg>
        )}
        {badgeProps.showSpinner && (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
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
        )}
        {badgeProps.label}
      </span>
    );
  };

  if (components.length === 0) {
    return (
      <div className="card p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No components added yet
        </h3>
        <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
          Add components manually or wait for AI discovery to find relevant
          options.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {components.map((component) => (
        <div
          key={component.id}
          className="card p-5 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onOpenAssistant(component)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900">
                  {component.manufacturer}
                </h3>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-700 font-mono">
                  {component.partNumber}
                </span>
                {(() => {
                  const availabilityBadge = getAvailabilityBadge(
                    component.availability
                  );
                  return (
                    <span className={availabilityBadge.className}>
                      {availabilityBadge.label}
                    </span>
                  );
                })()}
              </div>
              {component.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {component.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-medium text-gray-600">
                  Datasheet:
                </span>
                {renderDatasheetStatus(component)}
              </div>
            </div>
            <div
              className="flex flex-col items-center gap-2 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {component.datasheetUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={component.datasheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-black hover:text-gray-900 flex items-center gap-1 font-medium"
                    title={component.datasheetUrl}
                  >
                    View URL
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                  <button
                    onClick={() => onRemove(component.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove component"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
