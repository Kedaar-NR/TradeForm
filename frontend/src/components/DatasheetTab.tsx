import React, { useState, useEffect, useMemo } from "react";
import { Component, Criterion } from "../types";
import DatasheetUploadCard from "./DatasheetUploadCard";
import DatasheetStatusCard from "./DatasheetStatusCard";
import DatasheetAssistantPanel from "./DatasheetAssistantPanel";
import { criteriaApi } from "../services/api";
import { MOCK_CRITERIA } from "./TradeStudyCriteriaPreviewCard";
import { getApiUrl, getAuthHeaders } from "../utils/apiHelpers";
import { useDatasheetUpload } from "../hooks/useDatasheetUpload";

interface DatasheetTabProps {
  component: Component;
  projectId?: string;
}

const DatasheetTab: React.FC<DatasheetTabProps> = ({
  component,
  projectId,
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [datasheetParsed, setDatasheetParsed] = useState(false);
  const [hasDatasheet, setHasDatasheet] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string | undefined>();
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loadingCriteria, setLoadingCriteria] = useState(true);
  const [showAllCriteria, setShowAllCriteria] = useState(false);
  const [isAutoUploading, setIsAutoUploading] = useState(false);
  const [lastAutoUploadKey, setLastAutoUploadKey] = useState<string | null>(null);
  const [shouldPollStatus, setShouldPollStatus] = useState(true);
  const autoUploadKey = useMemo(() => {
    if (!component.datasheetUrl) return null;
    return `${component.id}:${component.datasheetUrl}`;
  }, [component.id, component.datasheetUrl]);
  const { uploadDatasheetFromUrl } = useDatasheetUpload();

  useEffect(() => {
    setHasDatasheet(Boolean(component.datasheetFilePath));
  }, [component.datasheetFilePath]);

  useEffect(() => {
    setShouldPollStatus(true);
  }, [component.id, refreshTrigger]);

  // Load criteria from the project
  useEffect(() => {
    const loadCriteria = async () => {
      if (!projectId) {
        setLoadingCriteria(false);
        return;
      }

      try {
        setLoadingCriteria(true);
        const response = await criteriaApi.getByProject(projectId);
        // Transform API response (snake_case) to frontend format (camelCase)
        const transformedCriteria = response.data.map((c: any) => ({
          id: c.id,
          projectId: c.project_id,
          name: c.name,
          description: c.description,
          weight: c.weight,
          unit: c.unit,
          higherIsBetter: c.higher_is_better,
          minimumRequirement: c.minimum_requirement,
          maximumRequirement: c.maximum_requirement,
        }));
        setCriteria(transformedCriteria);
      } catch (error) {
        console.error("Failed to load criteria:", error);
        // Fall back to empty criteria
        setCriteria([]);
      } finally {
        setLoadingCriteria(false);
      }
    };

    loadCriteria();
  }, [projectId]);

  // Reset auto-upload tracking when component or URL changes
  useEffect(() => {
    setLastAutoUploadKey(null);
  }, [component.id, component.datasheetUrl]);

  // Load datasheet status to check if it's parsed
  useEffect(() => {
    const fallbackFilename = component.datasheetFilePath
      ? component.datasheetFilePath.split(/[\\/]/).pop() || undefined
      : undefined;
    const fallbackHasDatasheet = Boolean(component.datasheetFilePath);

    const loadStatus = async () => {
      if (!shouldPollStatus) {
        setHasDatasheet(fallbackHasDatasheet);
        return;
      }
      try {
        const response = await fetch(
          getApiUrl(`/api/components/${component.id}/datasheet/status`),
          {
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

        if (response.status === 404) {
          setShouldPollStatus(false);
          setDatasheetParsed(false);
          setHasDatasheet(fallbackHasDatasheet);
          setUploadedFilename(fallbackFilename);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load datasheet status");
        }

        const status = await response.json();
        const parsedFromStatus =
          status?.parsed === true || status?.parse_status === "success";

        setDatasheetParsed(parsedFromStatus);
        setHasDatasheet(Boolean(status?.has_datasheet) || fallbackHasDatasheet);
        setUploadedFilename(status?.original_filename || fallbackFilename);
      } catch (error) {
        console.error("Failed to load datasheet status:", error);
        if (fallbackHasDatasheet) {
          setDatasheetParsed(true);
          setHasDatasheet(true);
          setUploadedFilename(fallbackFilename);
        } else {
          setDatasheetParsed(false);
          setHasDatasheet(false);
          setUploadedFilename(undefined);
        }
      }
    };

    loadStatus();
    // Refresh status periodically
    const interval = shouldPollStatus
      ? setInterval(loadStatus, 2000)
      : null;
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    component.id,
    component.datasheetFilePath,
    refreshTrigger,
    shouldPollStatus,
  ]);

  useEffect(() => {
    setShouldPollStatus(true);
    if (
      !component.datasheetUrl ||
      hasDatasheet ||
      isAutoUploading ||
      (autoUploadKey && lastAutoUploadKey === autoUploadKey)
    ) {
      return;
    }

    let isCancelled = false;

    const attemptUpload = async () => {
      setIsAutoUploading(true);
      try {
        let success = false;
        try {
          success = await uploadDatasheetFromUrl(
            component.id,
            component.datasheetUrl!
          );
        } catch (error) {
          console.error("Automatic datasheet upload failed:", error);
          success = false;
        }
        if (isCancelled) return;
        if (success) {
          if (autoUploadKey) {
            setLastAutoUploadKey(autoUploadKey);
          }
          setHasDatasheet(true);
          setTimeout(() => setRefreshTrigger((prev) => prev + 1), 500);
        } else {
          setShouldPollStatus(true);
        }
      } finally {
        if (!isCancelled) {
          setIsAutoUploading(false);
        }
      }
    };

    attemptUpload();

    return () => {
      isCancelled = true;
    };
  }, [
    component.id,
    component.datasheetUrl,
    hasDatasheet,
    isAutoUploading,
    uploadDatasheetFromUrl,
    autoUploadKey,
    lastAutoUploadKey,
  ]);

  const handleUploadSuccess = () => {
    // Trigger status refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  // Collapse criteria preview when switching components
  useEffect(() => {
    setShowAllCriteria(false);
  }, [component.id]);

  // Convert Criterion to MockCriterion format for compatibility with DatasheetAssistantPanel
  const mockCriteriaFromReal = criteria.map((c) => ({
    id: c.id,
    name: c.name,
    weight: c.weight,
    unit: c.unit || "",
    higherIsBetter: c.higherIsBetter,
  }));

  // Use mock criteria for testing if no real criteria available
  const criteriaToUse =
    criteria.length > 0 ? mockCriteriaFromReal : MOCK_CRITERIA;
  const criteriaPreviewLimit = 4;
  const hasCriteriaOverflow = criteriaToUse.length > criteriaPreviewLimit;
  const criteriaToRender = showAllCriteria
    ? criteriaToUse
    : criteriaToUse.slice(0, criteriaPreviewLimit);
  const collapsedExtraCount = hasCriteriaOverflow
    ? criteriaToUse.length - criteriaPreviewLimit
    : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Info Banner */}
        <div className="mb-6 bg-white border-l-4 border-black p-4 rounded-r-lg shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-gray-900"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">AI Datasheet Assistant:</span>{" "}
                Upload a datasheet to enable AI-powered question answering with
                citations and suggested ratings.
              </p>
              {criteria.length === 0 && !loadingCriteria && (
                <p className="text-xs text-gray-600 mt-1">
                  Note: Using mock test criteria. Define criteria in your
                  project for real suggested ratings.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Upload & Status (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            <DatasheetUploadCard
              onUploadSuccess={handleUploadSuccess}
              testComponentId={component.id}
              existingFilename={uploadedFilename}
            />

            <DatasheetStatusCard
              testComponentId={component.id}
              refreshTrigger={refreshTrigger}
            />

            {/* Criteria Preview */}
            {criteriaToUse.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Project Criteria {criteria.length === 0 && "(Test Data)"}
                </h4>
                <div className="space-y-2">
                  {criteriaToRender.map((criterion) => (
                    <div
                      key={criterion.id}
                      className="text-xs border border-gray-200 rounded p-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {criterion.name}
                        </span>
                        <span className="text-gray-500">{criterion.unit}</span>
                      </div>
                    </div>
                  ))}
                  {hasCriteriaOverflow && !showAllCriteria && (
                    <button
                      type="button"
                      onClick={() => setShowAllCriteria(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium w-full text-center pt-1"
                    >
                      +{collapsedExtraCount} more
                    </button>
                  )}
                  {hasCriteriaOverflow && showAllCriteria && (
                    <button
                      type="button"
                      onClick={() => setShowAllCriteria(false)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium w-full text-center pt-1"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Assistant (2/3 width) */}
          <div className="lg:col-span-2">
            <DatasheetAssistantPanel
              testComponentId={component.id}
              mockCriteria={criteriaToUse}
              datasheetParsed={datasheetParsed}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasheetTab;
