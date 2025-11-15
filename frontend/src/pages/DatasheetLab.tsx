import React, { useState } from 'react';
import DatasheetUploadCard from '../components/DatasheetUploadCard';
import DatasheetStatusCard from '../components/DatasheetStatusCard';
import TradeStudyCriteriaPreviewCard, { MOCK_CRITERIA } from '../components/TradeStudyCriteriaPreviewCard';
import DatasheetAssistantPanel from '../components/DatasheetAssistantPanel';

// Test component ID for the lab environment
const TEST_COMPONENT_ID = 'test-datasheet-lab-component';

const DatasheetLab: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [datasheetParsed, setDatasheetParsed] = useState(false);

  const handleUploadSuccess = () => {
    // Trigger status refresh
    setRefreshTrigger(prev => prev + 1);
    // Mark as parsed (status card will verify)
    setTimeout(() => setDatasheetParsed(true), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <svg className="h-8 w-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <div>
              <h1 className="text-2xl font-bold">Datasheet AI Test Bench</h1>
              <p className="text-indigo-100 text-sm mt-1">
                Upload, parse, and query datasheets with AI-powered analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Testing Environment</span> - This is a standalone test bench for datasheet features. It does not affect production data or project workflows.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 30-35% */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Card */}
            <DatasheetUploadCard
              onUploadSuccess={handleUploadSuccess}
              testComponentId={TEST_COMPONENT_ID}
            />

            {/* Status Card */}
            <DatasheetStatusCard
              testComponentId={TEST_COMPONENT_ID}
              refreshTrigger={refreshTrigger}
            />

            {/* Mock Criteria Card */}
            <TradeStudyCriteriaPreviewCard />
          </div>

          {/* Right Column - 65-70% */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <DatasheetAssistantPanel
                testComponentId={TEST_COMPONENT_ID}
                mockCriteria={MOCK_CRITERIA}
                datasheetParsed={datasheetParsed}
              />
            </div>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to Test
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Start</h4>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Upload a PDF datasheet (e.g., LM5145, TL07xx)</li>
                <li>Wait for parsing to complete</li>
                <li>Click a suggested question or type your own</li>
                <li>Review the AI answer and citations</li>
                <li>Verify no hallucinations occur</li>
              </ol>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Sample Questions</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>What is the input voltage range?</li>
                <li>What is the thermal shutdown temperature?</li>
                <li>What is the typical gain at nominal conditions?</li>
                <li>What is the output voltage accuracy?</li>
                <li>What are the power consumption specifications?</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs text-yellow-700">
                  <span className="font-medium">Anti-Hallucination Test:</span> Try asking about values that don't exist in the datasheet. The AI should respond with "Not found in datasheet" rather than inventing values.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600 font-medium mb-1">Test Component ID</p>
              <p className="text-xs text-gray-500 font-mono break-all">{TEST_COMPONENT_ID}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600 font-medium mb-1">Max File Size</p>
              <p className="text-xs text-gray-500">50 MB (PDF only)</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-600 font-medium mb-1">Mock Criteria</p>
              <p className="text-xs text-gray-500">{MOCK_CRITERIA.length} test criteria loaded</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-600">
              <span className="font-medium">API Endpoints Used:</span>
            </p>
            <ul className="mt-2 text-xs text-gray-500 space-y-1 font-mono">
              <li>• POST /api/components/{`{id}`}/datasheet</li>
              <li>• GET /api/components/{`{id}`}/datasheet/status</li>
              <li>• POST /api/components/{`{id}`}/datasheet/query</li>
              <li>• GET /api/components/{`{id}`}/datasheet/suggestions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasheetLab;

