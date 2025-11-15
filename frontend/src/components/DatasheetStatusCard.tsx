import React, { useEffect, useState } from 'react';
import type { DatasheetStatus } from '../types';
import { getApiUrl, getAuthHeaders } from '../utils/apiHelpers';

interface DatasheetStatusCardProps {
  testComponentId: string;
  refreshTrigger: number;
}

const DatasheetStatusCard: React.FC<DatasheetStatusCardProps> = ({ 
  testComponentId, 
  refreshTrigger 
}) => {
  const [status, setStatus] = useState<DatasheetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        getApiUrl(`/api/components/${testComponentId}/datasheet/status`),
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load status');
      }

      const data = await response.json();
      
      // Transform snake_case to camelCase
      setStatus({
        hasDatasheet: data.has_datasheet,
        parsed: data.parsed,
        numPages: data.num_pages,
        parsedAt: data.parsed_at,
        parseStatus: data.parse_status,
        parseError: data.parse_error,
      });
    } catch (err: any) {
      console.error('Status load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testComponentId, refreshTrigger]);

  const getStatusIcon = () => {
    if (!status?.hasDatasheet) {
      return (
        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }

    if (status.parseStatus === 'success') {
      return (
        <svg className="h-8 w-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }

    if (status.parseStatus === 'failed') {
      return (
        <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }

    return (
      <svg className="h-8 w-8 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );
  };

  const getStatusText = () => {
    if (!status?.hasDatasheet) {
      return 'No datasheet uploaded';
    }

    switch (status.parseStatus) {
      case 'success':
        return 'Parsed successfully';
      case 'failed':
        return 'Parsing failed';
      case 'pending':
        return 'Parsing in progress...';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    if (!status?.hasDatasheet) return 'text-gray-600';
    
    switch (status.parseStatus) {
      case 'success':
        return 'text-green-700';
      case 'failed':
        return 'text-red-700';
      case 'pending':
        return 'text-yellow-700';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600">
          <p className="text-sm font-medium">Error loading status</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Datasheet Status
      </h3>

      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>

          {status?.hasDatasheet && (
            <div className="mt-2 space-y-1">
              {status.numPages && (
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Pages:</span> {status.numPages}
                </p>
              )}

              {status.parsedAt && (
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Parsed:</span>{' '}
                  {new Date(status.parsedAt).toLocaleString()}
                </p>
              )}

              {status.parseError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs text-red-700">
                    <span className="font-medium">Error:</span> {status.parseError}
                  </p>
                </div>
              )}
            </div>
          )}

          {!status?.hasDatasheet && (
            <p className="mt-1 text-xs text-gray-500">
              Upload a PDF datasheet to begin testing
            </p>
          )}

          {status?.parseStatus === 'success' && (
            <button
              onClick={loadStatus}
              className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ↻ Refresh Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatasheetStatusCard;
