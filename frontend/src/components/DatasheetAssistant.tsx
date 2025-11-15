import React, { useState, useEffect } from 'react';
import { datasheetsApi } from '../services/api';
import type { 
  DatasheetStatus, 
  DatasheetQueryAnswer, 
  DatasheetSuggestionsResponse,
  Criterion 
} from '../types';

interface DatasheetAssistantProps {
  componentId: string;
  criteria: Criterion[];
  onClose?: () => void;
}

const DatasheetAssistant: React.FC<DatasheetAssistantProps> = ({ 
  componentId, 
  criteria,
  onClose 
}) => {
  const [status, setStatus] = useState<DatasheetStatus | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [selectedCriterion, setSelectedCriterion] = useState<string>('');
  const [answer, setAnswer] = useState<DatasheetQueryAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load datasheet status on mount
  useEffect(() => {
    loadStatus();
  }, [componentId]);

  // Load suggestions when status is ready
  useEffect(() => {
    if (status?.parsed) {
      loadSuggestions();
    }
  }, [status]);

  const loadStatus = async () => {
    try {
      const response = await datasheetsApi.getStatus(componentId);
      setStatus(response.data);
    } catch (err: any) {
      console.error('Failed to load datasheet status:', err);
      setError(err.response?.data?.detail || 'Failed to load status');
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await datasheetsApi.getSuggestions(componentId);
      setSuggestions((response.data as DatasheetSuggestionsResponse).suggestions || []);
    } catch (err: any) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    setUploadingFile(true);
    setError(null);

    try {
      await datasheetsApi.uploadDatasheet(componentId, file);
      await loadStatus();
      event.target.value = ''; // Reset file input
    } catch (err: any) {
      console.error('Failed to upload datasheet:', err);
      setError(err.response?.data?.detail || 'Failed to upload datasheet');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const response = await datasheetsApi.query(
        componentId, 
        question,
        selectedCriterion || undefined
      );
      setAnswer(response.data as DatasheetQueryAnswer);
    } catch (err: any) {
      console.error('Failed to query datasheet:', err);
      setError(err.response?.data?.detail || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    setAnswer(null);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-2/5 lg:w-1/3 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Datasheet Assistant</h2>
            <p className="text-indigo-100 text-sm mt-1">
              Ask questions about this component's datasheet
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Upload Section */}
        {!status?.hasDatasheet && (
          <div className="bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Upload Datasheet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload a PDF datasheet to enable AI-powered Q&A
            </p>
            <label className="mt-4 inline-block">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="hidden"
              />
              <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50">
                {uploadingFile ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Select PDF File
                  </>
                )}
              </span>
            </label>
          </div>
        )}

        {/* Status Display */}
        {status?.hasDatasheet && (
          <div className={`rounded-lg p-4 ${
            status.parsed 
              ? 'bg-green-50 border border-green-200' 
              : status.parseStatus === 'failed'
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {status.parsed ? (
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">
                  {status.parsed 
                    ? `Datasheet Parsed (${status.numPages} pages)` 
                    : status.parseStatus === 'failed'
                    ? 'Parsing Failed'
                    : 'Parsing In Progress'}
                </h3>
                {status.parseError && (
                  <p className="mt-1 text-sm text-red-600">{status.parseError}</p>
                )}
                {status.parsed && (
                  <label className="mt-2 inline-block">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                    <span className="text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer underline">
                      {uploadingFile ? 'Uploading...' : 'Replace datasheet'}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {status?.parsed && suggestions.length > 0 && !answer && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Suggested Questions</h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="inline-flex items-center px-3 py-1.5 border border-indigo-300 text-sm rounded-full text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q&A Interface */}
        {status?.parsed && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ask a Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What is the nominal gain at 8.2 GHz?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            {criteria.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Criterion (Optional)
                </label>
                <select
                  value={selectedCriterion}
                  onChange={(e) => setSelectedCriterion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All criteria</option>
                  {criteria.map((criterion) => (
                    <option key={criterion.id} value={criterion.id}>
                      {criterion.name} {criterion.unit ? `(${criterion.unit})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleAskQuestion}
              disabled={!question.trim() || loading}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Ask Question
                </>
              )}
            </button>
          </div>
        )}

        {/* Answer Display */}
        {answer && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Answer</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{answer.answer}</p>
              {answer.confidence !== undefined && answer.confidence !== null && (
                <div className="mt-3 flex items-center">
                  <span className="text-xs text-gray-500 mr-2">Confidence:</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                    <div 
                      className={`h-full ${
                        answer.confidence > 0.7 
                          ? 'bg-green-500' 
                          : answer.confidence > 0.4 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${answer.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 ml-2">
                    {Math.round(answer.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>

            {answer.citations && answer.citations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Citations</h4>
                <div className="space-y-2">
                  {answer.citations.map((citation, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-3 text-sm">
                      <div className="flex items-start">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 mr-2">
                          Page {citation.pageNumber}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1 text-xs italic">"{citation.snippet}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setAnswer(null);
                setQuestion('');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Ask another question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasheetAssistant;

