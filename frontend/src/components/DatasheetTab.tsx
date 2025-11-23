import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [showAllCriteria, setShowAllCriteria] = useState(false);
  const [isAutoUploading, setIsAutoUploading] = useState(false);
  const [autoUploadError, setAutoUploadError] = useState<string | null>(null);
  const [shouldPollStatus, setShouldPollStatus] = useState(true);
  const lastAutoUploadKeyRef = useRef<string | null>(null);
  const isAutoUploadingRef = useRef(false);
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
        return;
      }

      try {
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
      }
    };

    loadCriteria();
  }, [projectId]);

  const fallbackFilename = useMemo(() => {
    if (!component.datasheetFilePath) {
      return undefined;
    }
    return component.datasheetFilePath.split(/[\\/]/).pop() || undefined;
  }, [component.datasheetFilePath]);

  const fallbackHasDatasheet = useMemo(
    () => Boolean(component.datasheetFilePath),
    [component.datasheetFilePath]
  );

  // Load datasheet status to check if it's parsed
  const loadDatasheetStatus = React.useCallback(async () => {
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

      if (parsedFromStatus || status?.parse_status === "failed") {
        setShouldPollStatus(false);
      } else if (status?.parse_status === "pending") {
        setShouldPollStatus(true);
      }
    } catch (error) {
      console.error("Failed to load datasheet status:", error);
      if (fallbackHasDatasheet) {
        setDatasheetParsed(true);
        setHasDatasheet(true);
        setUploadedFilename(fallbackFilename);
        setShouldPollStatus(false);
      } else {
        setDatasheetParsed(false);
        setHasDatasheet(false);
        setUploadedFilename(undefined);
      }
    }
  }, [component.id, fallbackFilename, fallbackHasDatasheet]);

  useEffect(() => {
    loadDatasheetStatus();
  }, [loadDatasheetStatus, refreshTrigger]);

  useEffect(() => {
    if (!shouldPollStatus) {
      return;
    }

    const interval = setInterval(() => {
      loadDatasheetStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [shouldPollStatus, loadDatasheetStatus]);

  const attemptAutoUpload = React.useCallback(
    async (force: boolean = false) => {
      if (!component.datasheetUrl) {
        console.log("No datasheet URL to auto-upload");
        return;
      }

      const currentKey = `${component.id}:${component.datasheetUrl}`;
      if (
        !force &&
        (hasDatasheet ||
          isAutoUploadingRef.current ||
          lastAutoUploadKeyRef.current === currentKey)
      ) {
        console.log("Auto-upload skipped:", {
          hasDatasheet,
          isAutoUploading: isAutoUploadingRef.current,
          alreadyAttempted: lastAutoUploadKeyRef.current === currentKey,
          force,
        });
        return;
      }

      console.log("Starting auto-upload from URL:", component.datasheetUrl);
      isAutoUploadingRef.current = true;
      setIsAutoUploading(true);
      setAutoUploadError(null);
      try {
        console.log("Calling uploadDatasheetFromUrl with:", {
          componentId: component.id,
          url: component.datasheetUrl,
        });
        await uploadDatasheetFromUrl(component.id, component.datasheetUrl);
        console.log("Auto-upload successful");
        lastAutoUploadKeyRef.current = currentKey;
        setHasDatasheet(true);
        setShouldPollStatus(true);
        setTimeout(() => setRefreshTrigger((prev) => prev + 1), 500);
      } catch (error: any) {
        console.error("Auto-upload failed with error:", error);
        const message =
          error?.message ||
          "Failed to auto-import datasheet from URL. The link may be invalid or the server couldn't download the PDF.";
        setAutoUploadError(message);
        console.error("Automatic datasheet upload failed:", {
          message,
          url: component.datasheetUrl,
          error,
        });
        // Don't mark as attempted on force retry, allow multiple retries
        if (!force) {
          lastAutoUploadKeyRef.current = currentKey;
        }
      } finally {
        isAutoUploadingRef.current = false;
        setIsAutoUploading(false);
      }
    },
    [
      component.id,
      component.datasheetUrl,
      hasDatasheet,
      uploadDatasheetFromUrl,
    ]
  );

  useEffect(() => {
    setShouldPollStatus(true);
    if (autoUploadKey) {
      attemptAutoUpload();
    }
  }, [attemptAutoUpload, autoUploadKey]);

  const handleManualAutoImport = () => attemptAutoUpload(true);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setShouldPollStatus(true);
    setDatasheetParsed(false);
    setHasDatasheet(true);
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
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Upload & Status (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-sm">
                <DatasheetUploadCard
                  onUploadSuccess={handleUploadSuccess}
                  testComponentId={component.id}
                  existingFilename={uploadedFilename}
                  autoImportUrl={component.datasheetUrl}
                  isAutoImporting={isAutoUploading}
                  onAutoImport={
                    component.datasheetUrl ? handleManualAutoImport : undefined
                  }
                  autoImportError={autoUploadError}
                  hasDatasheet={hasDatasheet}
                />
              </div>

              <div className="w-full max-w-sm">
                <DatasheetStatusCard
                  testComponentId={component.id}
                  refreshTrigger={refreshTrigger}
                />
              </div>

              {/* Criteria Preview */}
              {criteriaToUse.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-4 text-center w-full max-w-sm">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Project Criteria {criteria.length === 0 && "(Test Data)"}
                  </h4>
                  <div className="space-y-2">
                    {criteriaToRender.map((criterion) => (
                      <div
                        key={criterion.id}
                        className="text-xs border border-gray-200 rounded p-2 flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-900">
                          {criterion.name}
                        </span>
                        <span className="text-gray-500">{criterion.unit}</span>
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
