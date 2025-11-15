import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Component, DatasheetStatus } from "../types";
import { componentsApi, datasheetsApi, projectsApi } from "../services/api";
import ComponentDetailDrawer from "../components/ComponentDetailDrawer";
import { API_BASE_URL, getAuthHeaders } from "../utils/apiHelpers";

const ComponentDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null
  );
  const [datasheetStatuses, setDatasheetStatuses] = useState<
    Record<string, DatasheetStatus>
  >({});
  const [formData, setFormData] = useState({
    manufacturer: "",
    partNumber: "",
    description: "",
    datasheetUrl: "",
    availability: "in_stock" as Component["availability"],
  });

  const saveProjectStatus = useCallback(
    async (status: "draft" | "in_progress" | "completed" = "in_progress") => {
      if (!projectId) return;
      try {
        await projectsApi.update(projectId, { status });
      } catch (error: any) {
        console.error("Failed to update project status:", error);
      }
    },
    [projectId]
  );

  // Load datasheet statuses for components (defined before loadComponents to avoid reference errors)
  const loadDatasheetStatuses = React.useCallback(
    async (componentsToCheck: Component[]) => {
      if (componentsToCheck.length === 0) {
        setDatasheetStatuses({});
        return;
      }

      const statuses: Record<string, DatasheetStatus> = {};

      // Load statuses in parallel
      await Promise.all(
        componentsToCheck.map(async (component) => {
          try {
            const response = await datasheetsApi.getStatus(component.id);
            statuses[component.id] = {
              hasDatasheet: response.data.has_datasheet,
              parsed: response.data.parsed,
              numPages: response.data.num_pages,
              parsedAt: response.data.parsed_at,
              parseStatus: response.data.parse_status,
              parseError: response.data.parse_error,
            };
          } catch (error) {
            // If status check fails, assume no datasheet (backend may not be running)
            statuses[component.id] = {
              hasDatasheet: false,
              parsed: false,
            };
          }
        })
      );

      setDatasheetStatuses(statuses);
    },
    []
  );

  const loadComponents = React.useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      setComponents([]);
      return;
    }

    // Validate UUID format - if invalid, redirect silently
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      setIsLoading(false);
      setComponents([]);
      // Redirect to dashboard without alert for better UX
      setTimeout(() => navigate("/dashboard"), 100);
      return;
    }

    try {
      setIsLoading(true);
      const response = await componentsApi.getByProject(projectId);
      // Transform API response to match frontend types
      const transformedComponents = response.data.map((comp: any) => ({
        id: comp.id,
        projectId: comp.project_id || projectId,
        manufacturer: comp.manufacturer,
        partNumber: comp.part_number,
        description: comp.description,
        datasheetUrl: comp.datasheet_url,
        datasheetFilePath: comp.datasheet_file_path,
        availability: comp.availability,
        source: comp.source,
      }));
      setComponents(transformedComponents);

      // Load datasheet statuses for all components (silently fails if backend unavailable)
      loadDatasheetStatuses(transformedComponents);
    } catch (error: any) {
      console.error("Failed to load components:", error);
      // If it's a network error, show a helpful message
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("Failed to fetch")
      ) {
        console.warn(
          "Backend API not reachable. Make sure the backend is running on http://localhost:8000"
        );
      }
      // Continue with empty array if API fails (allows offline/demo mode)
      setComponents([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, navigate, loadDatasheetStatuses]);

  // Load components on mount
  useEffect(() => {
    if (projectId) {
      console.log(
        "ComponentDiscovery: Loading components for project:",
        projectId
      );
      loadComponents();
    } else {
      console.warn("ComponentDiscovery: No projectId provided");
      setIsLoading(false);
    }
  }, [projectId, loadComponents]);

  // Auto-save on page exit
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (projectId) {
        saveProjectStatus("in_progress").catch(console.error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Save on unmount
      if (projectId) {
        saveProjectStatus("in_progress").catch(console.error);
      }
    };
  }, [projectId, saveProjectStatus]);

  const uploadDatasheetFromUrl = async (componentId: string, url: string) => {
    try {
      console.log("Downloading PDF from URL:", url);

      const apiUrl = API_BASE_URL;
      let response: Response;

      // Try direct download first
      try {
        response = await fetch(url, {
          method: "GET",
          mode: "cors",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (fetchError: any) {
        // If CORS fails, use backend proxy
        console.log(
          "Direct fetch failed, using backend proxy:",
          fetchError.message
        );
        response = await fetch(
          `${apiUrl}/api/proxy-pdf?url=${encodeURIComponent(url)}`,
          {
            method: "GET",
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Proxy download failed: ${response.status} ${response.statusText}`
          );
        }
      }

      const blob = await response.blob();

      // Ensure filename ends with .pdf for backend validation
      let fileName = url.split("/").pop() || "datasheet.pdf";
      // Remove query parameters and fragments
      fileName = fileName.split("?")[0].split("#")[0];
      // Ensure .pdf extension
      if (!fileName.toLowerCase().endsWith(".pdf")) {
        fileName = fileName + ".pdf";
      }

      // Create a File object from the blob with explicit PDF type
      const file = new File([blob], fileName, { type: "application/pdf" });

      console.log("Uploading file:", fileName, "Size:", file.size, "bytes");

      // Upload using the same endpoint
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(
        `${apiUrl}/api/components/${componentId}/datasheet`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorData = await uploadResponse.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Upload failed with status ${uploadResponse.status}`;
        }
        throw new Error(errorMessage);
      }

      console.log("Successfully uploaded datasheet from URL");
      return true;
    } catch (err: any) {
      console.error("Upload from URL error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        url: url,
        componentId: componentId,
      });
      return false;
    }
  };

  const handleAddComponent = async () => {
    if (!formData.manufacturer.trim() || !formData.partNumber.trim()) {
      alert("Please fill in manufacturer and part number");
      return;
    }

    if (!projectId) {
      alert("Project ID is missing. Please navigate to a valid project.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await componentsApi.create(projectId, {
        manufacturer: formData.manufacturer,
        partNumber: formData.partNumber,
        description: formData.description || undefined,
        datasheetUrl: formData.datasheetUrl || undefined,
        availability: formData.availability,
        source: "manually_added",
      });

      // Transform API response (snake_case) to frontend format (camelCase)
      const apiData = response.data as any;
      const newComponent: Component = {
        id: apiData.id,
        projectId: projectId,
        manufacturer: apiData.manufacturer,
        partNumber: apiData.part_number,
        description: apiData.description,
        datasheetUrl: apiData.datasheet_url,
        datasheetFilePath: apiData.datasheet_file_path,
        availability: apiData.availability,
        source: apiData.source,
      };

      setComponents([...components, newComponent]);
      // Auto-save project status to in_progress
      await saveProjectStatus("in_progress");

      // Reset form immediately so button doesn't stay stuck
      setFormData({
        manufacturer: "",
        partNumber: "",
        description: "",
        datasheetUrl: "",
        availability: "in_stock" as Component["availability"],
      });
      setShowAddForm(false);
      setIsSaving(false); // Reset saving state immediately

      // Auto-upload datasheet if URL is a PDF (do this asynchronously, don't block)
      if (formData.datasheetUrl && formData.datasheetUrl.trim()) {
        const url = formData.datasheetUrl.trim();
        const isPdfUrl =
          url.toLowerCase().endsWith(".pdf") ||
          url.toLowerCase().includes(".pdf");

        if (isPdfUrl) {
          // Upload in background, don't block the UI
          uploadDatasheetFromUrl(newComponent.id, url)
            .then((uploadSuccess) => {
              if (uploadSuccess) {
                alert("Datasheet uploaded");
                // Reload components to get updated datasheet status
                loadComponents();
              } else {
                console.warn(
                  "Failed to auto-upload datasheet, but component was added"
                );
              }
            })
            .catch((err) => {
              console.error("Error uploading datasheet:", err);
            });
        }
      }
    } catch (error: any) {
      console.error("Failed to add component:", error);

      // Extract error message properly, handling objects
      let errorMessage = "Unknown error";
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (typeof data.detail === "object" && data.detail !== null) {
          // Handle object details (e.g., validation errors)
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail
              .map((e: any) =>
                typeof e === "string" ? e : e.msg || JSON.stringify(e)
              )
              .join(", ");
          } else if (data.detail.message) {
            errorMessage = data.detail.message;
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === "string") {
          errorMessage = data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      alert(
        `Failed to add component: ${errorMessage}. Please check if the backend is running.`
      );
      setIsSaving(false);
    }
  };

  const handleRemoveComponent = async (componentId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this component?"
    );
    if (!confirmed) {
      return;
    }

    try {
      await componentsApi.delete(componentId);
      setComponents(components.filter((c) => c.id !== componentId));
      // Auto-save project status to in_progress
      await saveProjectStatus("in_progress");
    } catch (error: any) {
      console.error("Failed to remove component:", error);
      const errorMessage =
        error.response?.data?.detail || error.message || "Unknown error";
      alert(`Failed to remove component: ${errorMessage}`);
    }
  };

  const handleDiscoverComponents = async () => {
    if (!projectId) return;

    try {
      setIsDiscovering(true);
      const response = await componentsApi.discover(projectId);

      // Reload all components to get the full list
      await loadComponents();
      // Auto-save project status to in_progress
      await saveProjectStatus("in_progress");

      // Auto-upload PDFs for discovered components with PDF URLs
      if (response.data.discovered_count > 0) {
        const discoveredComponents = response.data.components || [];
        let uploadedCount = 0;

        for (const comp of discoveredComponents) {
          const componentId = comp.id;
          // API returns snake_case, handle both formats
          const datasheetUrl = (comp as any).datasheet_url || comp.datasheetUrl;

          if (datasheetUrl && datasheetUrl.trim()) {
            const url = datasheetUrl.trim();
            const isPdfUrl =
              url.toLowerCase().endsWith(".pdf") ||
              url.toLowerCase().includes(".pdf");

            if (isPdfUrl) {
              const uploadSuccess = await uploadDatasheetFromUrl(
                componentId,
                url
              );
              if (uploadSuccess) {
                uploadedCount++;
              }
            }
          }
        }

        if (uploadedCount > 0) {
          await loadComponents(); // Reload to get updated datasheet statuses
          alert(
            `Successfully discovered ${response.data.discovered_count} component(s)! ${uploadedCount} datasheet(s) uploaded.`
          );
        } else {
          alert(
            `Successfully discovered ${response.data.discovered_count} component(s)!`
          );
        }
      } else {
        alert(
          "No new components were discovered. They may already exist in your list."
        );
      }
    } catch (error: any) {
      console.error("Failed to discover components:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to discover components. Please try again later."
      );
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleContinue = () => {
    if (components.length === 0) {
      alert("Please add at least one component before continuing");
      return;
    }
    // Navigate to results/scoring page
    navigate(`/project/${projectId}/results`);
  };

  const handleScoreAll = async () => {
    if (!projectId) return;

    const confirmed = window.confirm(
      "This will automatically score all components against all criteria using AI. This may take a few moments. Continue?"
    );
    if (!confirmed) return;

    try {
      setIsScoring(true);
      const response = await componentsApi.scoreAll(projectId);
      alert(
        `Scoring complete! Created ${response.data.scores_created} new scores, updated ${response.data.scores_updated} existing scores.`
      );
      // Navigate to results page to see scores
      navigate(`/project/${projectId}/results`);
    } catch (error: any) {
      console.error("Failed to score components:", error);
      alert(
        error.response?.data?.detail ||
          "Failed to score components. Please check that all components and criteria are properly configured."
      );
    } finally {
      setIsScoring(false);
    }
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    try {
      setIsUploading(true);
      await componentsApi.uploadExcel(projectId, file);
      // Reload components after import
      await loadComponents();
      alert("Components imported successfully!");
    } catch (error: any) {
      console.error("Failed to import components:", error);
      alert(
        `Failed to import components: ${
          error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getAvailabilityBadge = (availability: Component["availability"]) => {
    const styles = {
      in_stock: "bg-gray-200 text-green-600",
      limited: "bg-yellow-100 text-yellow-700",
      obsolete: "bg-red-100 text-red-700",
    };

    const labels = {
      in_stock: "In Stock",
      limited: "Limited",
      obsolete: "Obsolete",
    };

    return (
      <span
        className={`px-2.5 py-1 rounded-md text-xs font-medium ${styles[availability]}`}
      >
        {labels[availability]}
      </span>
    );
  };

  const getDatasheetStatusBadge = (componentId: string) => {
    const status = datasheetStatuses[componentId];

    if (!status || !status.hasDatasheet) {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
          Not uploaded
        </span>
      );
    }

    if (status.parseStatus === "success" && status.parsed) {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Parsed ({status.numPages || 0} pages)
        </span>
      );
    }

    if (status.parseStatus === "failed") {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
          Parsing failed
        </span>
      );
    }

    if (status.parseStatus === "pending") {
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Parsing...
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
        Unknown
      </span>
    );
  };

  if (!projectId) {
    return (
      <div className="animate-fade-in">
        <div className="card p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Invalid Project
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            No project ID provided. Please go back and try again.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Component Discovery
        </h1>
        <p className="text-gray-600">
          Add components to evaluate in your trade study. You can add them
          manually or use AI discovery.
        </p>
      </div>

      {/* AI Discovery Section */}
      <div className="card p-6 mb-8 bg-gradient-to-r from-gray-100 to-teal-50 border-gray-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Component Discovery
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Automatically discover relevant components using AI. The system
              will analyze your project requirements and find matching
              components from manufacturer databases and distributor catalogs.
            </p>
            <button
              onClick={handleDiscoverComponents}
              disabled={isDiscovering || !projectId}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDiscovering ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Discovering...
                </>
              ) : (
                <>
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Discover Components
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Import/Export and Score Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportExcel}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn-secondary flex items-center gap-2"
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
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {isUploading ? "Uploading..." : "Import from Excel"}
        </button>
        <button
          onClick={handleScoreAll}
          disabled={components.length === 0 || isScoring}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {isScoring ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Scoring...
            </>
          ) : (
            <>
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              Score All Components
            </>
          )}
        </button>
      </div>

      {/* Manual Add Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Components ({components.length})
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-secondary"
          >
            {showAddForm ? "Cancel" : "+ Add Component"}
          </button>
        </div>

        {/* Add Component Form */}
        {showAddForm && (
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Component
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer *
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  placeholder="e.g., Taoglas, Texas Instruments"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Part Number *
                </label>
                <input
                  type="text"
                  value={formData.partNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, partNumber: e.target.value })
                  }
                  placeholder="e.g., FXP611, LM358"
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Component description or notes"
                  rows={3}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datasheet URL
                </label>
                <input
                  type="url"
                  value={formData.datasheetUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, datasheetUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <select
                  value={formData.availability}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availability: e.target.value as Component["availability"],
                    })
                  }
                  className="input-field"
                >
                  <option value="in_stock">In Stock</option>
                  <option value="limited">Limited</option>
                  <option value="obsolete">Obsolete</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    manufacturer: "",
                    partNumber: "",
                    description: "",
                    datasheetUrl: "",
                    availability: "in_stock" as Component["availability"],
                  });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComponent}
                className="btn-primary"
                disabled={isSaving}
              >
                {isSaving ? "Adding..." : "Add Component"}
              </button>
            </div>
          </div>
        )}

        {/* Components List */}
        {isLoading ? (
          <div className="card p-12 text-center">
            <div className="text-gray-500">Loading components...</div>
          </div>
        ) : components.length === 0 ? (
          <div className="card p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No components added yet
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
              Add components manually or wait for AI discovery to find relevant
              options.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Your First Component
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {components.map((component) => (
              <div
                key={component.id}
                className="card p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedComponent(component)}
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
                      {getAvailabilityBadge(component.availability)}
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
                      {getDatasheetStatusBadge(component.id)}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-3 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setSelectedComponent(component)}
                      className="btn-secondary text-sm flex items-center gap-2"
                      title="Open Datasheet Assistant"
                    >
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
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      Open Assistant
                    </button>
                    {component.datasheetUrl && (
                      <a
                        href={component.datasheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-black hover:text-gray-900 flex items-center gap-1 font-medium"
                        title={component.datasheetUrl}
                        onClick={(e) => e.stopPropagation()}
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
                    )}
                    <button
                      onClick={() => handleRemoveComponent(component.id)}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={() => navigate(`/project/${projectId}/criteria`)}
          className="btn-secondary"
        >
          ← Back to Criteria
        </button>
        <button
          onClick={handleContinue}
          disabled={components.length === 0}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Scoring →
        </button>
      </div>

      {/* Component Detail Drawer */}
      {selectedComponent && (
        <ComponentDetailDrawer
          component={selectedComponent}
          isOpen={!!selectedComponent}
          onClose={() => setSelectedComponent(null)}
          projectId={projectId}
        />
      )}
    </div>
  );
};

export default ComponentDiscovery;
