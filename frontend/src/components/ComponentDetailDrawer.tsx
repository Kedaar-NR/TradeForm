import { useState } from 'react';
import { Component } from '../types';
import DatasheetTab from './DatasheetTab';
import { formatEnumValue } from '../utils/datasheetHelpers';

interface ComponentDetailDrawerProps {
  component: Component;
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

type TabType = 'datasheet' | 'details' | 'scores';

const ComponentDetailDrawer: React.FC<ComponentDetailDrawerProps> = ({
  component,
  isOpen,
  onClose,
  projectId,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('datasheet');

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-3/5 xl:w-1/2 bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {component.manufacturer}
            </h2>
            <p className="text-sm text-gray-600 font-mono">
              {component.partNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('datasheet')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'datasheet'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Datasheet
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'scores'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scores
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'datasheet' && (
            <DatasheetTab component={component} projectId={projectId} />
          )}
          {activeTab === 'details' && (
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer
                  </label>
                  <p className="text-base text-gray-900">{component.manufacturer}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Part Number
                  </label>
                  <p className="text-base text-gray-900 font-mono">{component.partNumber}</p>
                </div>
                {component.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <p className="text-base text-gray-900">{component.description}</p>
                  </div>
                )}
                {component.datasheetUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Datasheet URL
                    </label>
                    <a
                      href={component.datasheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-black hover:text-gray-700 underline break-all"
                    >
                      {component.datasheetUrl}
                    </a>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Availability
                  </label>
                  <p className="text-base text-gray-900 capitalize">
                    {formatEnumValue(component.availability)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <p className="text-base text-gray-900 capitalize">
                    {formatEnumValue(component.source)}
                  </p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'scores' && (
            <div className="p-6">
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Scores Coming Soon
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Component scoring will be available here once criteria are defined and scored.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ComponentDetailDrawer;

