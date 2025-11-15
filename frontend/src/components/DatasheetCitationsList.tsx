import React, { useState } from 'react';
import type { DatasheetCitation } from '../types';

interface DatasheetCitationsListProps {
  citations: DatasheetCitation[];
}

const DatasheetCitationsList: React.FC<DatasheetCitationsListProps> = ({ citations }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopySnippet = async (snippet: string, index: number) => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (citations.length === 0) {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-yellow-700 font-medium">No Citations Provided</p>
            <p className="text-xs text-yellow-600 mt-1">
              The answer may be incomplete or not grounded in the datasheet. Try rephrasing your question or asking for specific parameters.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
        <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Citations from Datasheet
        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {citations.length}
        </span>
      </h4>

      <div className="space-y-3">
        {citations.map((citation, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors bg-gray-50"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-600 text-white">
                  Page {citation.pageNumber}
                </span>
              </div>

              <button
                onClick={() => handleCopySnippet(citation.snippet, index)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                title="Copy snippet"
              >
                {copiedIndex === index ? (
                  <>
                    <svg className="h-4 w-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200 rounded"></div>
              <p className="pl-4 text-sm text-gray-700 font-mono leading-relaxed whitespace-pre-wrap break-words">
                "{citation.snippet.length > 300 ? `${citation.snippet.substring(0, 300)}...` : citation.snippet}"
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center text-xs text-gray-500">
        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        All information is extracted directly from the uploaded datasheet
      </div>
    </div>
  );
};

export default DatasheetCitationsList;

