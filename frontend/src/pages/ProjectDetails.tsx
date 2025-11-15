import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Project, Component, Criterion } from "../types";
import {
  projectsApi,
  componentsApi,
  criteriaApi,
  versionsApi,
  commentsApi,
  changesApi,
  sharesApi,
  resultsApi,
} from "../services/api";

const ProjectDetails: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Component>>({});
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "versions" | "collaboration"
  >("overview");
  const [versions, setVersions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newVersionDesc, setNewVersionDesc] = useState("");
  const [projectFiles, setProjectFiles] = useState<
    Array<{ name: string; size: number; type: string }>
  >([]);

  const loadProjectData = React.useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const [projectRes, componentsRes, criteriaRes] = await Promise.all([
        projectsApi.getById(projectId),
        componentsApi.getByProject(projectId),
        criteriaApi.getByProject(projectId),
      ]);

      // Transform API responses
      const projectData = projectRes.data as any;
      setProject({
        id: projectData.id,
        name: projectData.name,
        componentType: projectData.component_type,
        description: projectData.description,
        status: projectData.status,
        createdAt: projectData.created_at,
        updatedAt: projectData.updated_at,
      });

      const transformedComponents = componentsRes.data.map((comp: any) => ({
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

      const transformedCriteria = criteriaRes.data.map((crit: any) => ({
        id: crit.id,
        projectId: crit.project_id || projectId,
        name: crit.name,
        description: crit.description,
        weight: crit.weight,
        unit: crit.unit,
        higherIsBetter: crit.higher_is_better,
        minimumRequirement: crit.minimum_requirement,
        maximumRequirement: crit.maximum_requirement,
      }));
      setCriteria(transformedCriteria);
    } catch (error: any) {
      console.error("Failed to load project data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const loadCollaborationData = React.useCallback(async () => {
    if (!projectId) return;
    try {
      const [versionsRes, commentsRes, changesRes, sharesRes] =
        await Promise.all([
          versionsApi.getByProject(projectId).catch(() => ({ data: [] })),
          commentsApi.getByProject(projectId).catch(() => ({ data: [] })),
          changesApi.getByProject(projectId).catch(() => ({ data: [] })),
          sharesApi.getByProject(projectId).catch(() => ({ data: [] })),
        ]);
      setVersions(versionsRes.data || []);
      setComments(commentsRes.data || []);
      setChanges(changesRes.data || []);
      setShares(sharesRes.data || []);
    } catch (error) {
      console.error("Failed to load collaboration data:", error);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId && activeTab !== "overview") {
      loadCollaborationData();
    }
  }, [projectId, activeTab, loadCollaborationData]);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId, loadProjectData]);

  const handleEditComponent = (component: Component) => {
    setEditingComponent(component.id);
    setEditForm({
      manufacturer: component.manufacturer,
      partNumber: component.partNumber,
      description: component.description,
      datasheetUrl: component.datasheetUrl,
      availability: component.availability,
    });
  };

  const saveProjectStatus = React.useCallback(
    async (status: "draft" | "in_progress" | "completed" = "in_progress") => {
      if (!projectId || !project) return;
      try {
        // Only update if status is different
        if (project.status !== status) {
          await projectsApi.update(projectId, { status });
          setProject({ ...project, status });
        }
      } catch (error: any) {
        console.error("Failed to update project status:", error);
      }
    },
    [projectId, project]
  );

  const saveComponentEdit = React.useCallback(
    async (componentId: string, formData: Partial<Component>) => {
      if (!componentId || !formData) return;
      try {
        setIsSaving(true);
        await componentsApi.update(componentId, formData);
        // Auto-save project status to in_progress when changes are made
        await saveProjectStatus("in_progress");
        // Reload to get fresh data
        await loadProjectData();
      } catch (error: any) {
        console.error("Failed to update component:", error);
        alert(
          `Failed to save: ${error.response?.data?.detail || error.message}`
        );
      } finally {
        setIsSaving(false);
      }
    },
    [loadProjectData, saveProjectStatus]
  );

  const handleSaveEdit = async () => {
    if (!editingComponent || !projectId) return;
    // Clear any pending auto-save
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    await saveComponentEdit(editingComponent, editForm);
    setEditingComponent(null);
  };

  // Auto-save on edit form changes (debounced)
  useEffect(() => {
    if (!editingComponent || !editForm.manufacturer || !editForm.partNumber)
      return;

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save (1.5 seconds after last change)
    const timeout = setTimeout(() => {
      saveComponentEdit(editingComponent, editForm);
    }, 1500);

    setSaveTimeout(timeout);

    // Cleanup on unmount or when editingComponent changes
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [editForm, editingComponent, saveComponentEdit, saveTimeout]);

  // Save on navigation away and page exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save project status before leaving
      if (projectId && project && project.status !== "completed") {
        saveProjectStatus("in_progress").catch(console.error);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Save any pending edits when component unmounts
      if (editingComponent && editForm.manufacturer && editForm.partNumber) {
        // Use a synchronous-like approach for cleanup
        saveComponentEdit(editingComponent, editForm).catch(console.error);
      }
      // Save project status on unmount
      if (projectId && project && project.status !== "completed") {
        saveProjectStatus("in_progress").catch(console.error);
      }
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [
    editingComponent,
    editForm,
    saveComponentEdit,
    saveTimeout,
    projectId,
    project,
    saveProjectStatus,
  ]);

  const handleDeleteComponent = async (componentId: string) => {
    if (!window.confirm("Are you sure you want to delete this component?"))
      return;
    try {
      await componentsApi.delete(componentId);
      setComponents(components.filter((c) => c.id !== componentId));
      // Auto-save project status to in_progress
      await saveProjectStatus("in_progress");
    } catch (error) {
      console.error("Failed to delete component:", error);
      alert("Failed to delete component");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
    }));

    setProjectFiles((prev) => [...prev, ...newFiles]);

    // Reset input
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setProjectFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMarkAsDone = async () => {
    if (!projectId || !project) return;
    if (
      !window.confirm(
        "Mark this study as completed? You can still edit it later."
      )
    )
      return;

    try {
      setIsSaving(true);
      await projectsApi.update(projectId, { status: "completed" });
      // Reload project data to get updated status
      await loadProjectData();
      alert("Study marked as completed!");
    } catch (error: any) {
      console.error("Failed to update project status:", error);
      alert(
        `Failed to mark as done: ${
          error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = async () => {
    if (!projectId) return;
    try {
      const response = await resultsApi.exportFullExcel(projectId);
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trade_study_${project?.name || projectId}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to export Excel:", error);
      alert(
        `Failed to export Excel: ${
          error.response?.data?.detail || error.message
        }`
      );
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Project not found
        </h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="btn-primary mt-4"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {project.name}
            </h1>
            <p className="text-gray-600">{project.componentType}</p>
            <div className="mt-3 mb-2">
              <button
                onClick={() =>
                  document.getElementById("project-file-upload")?.click()
                }
                className="btn-secondary text-sm"
              >
                Upload Project Files
              </button>
              <input
                id="project-file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e)}
              />
            </div>
            {project.description && (
              <p className="text-gray-500 mt-2">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/project/${projectId}/criteria`)}
              className="btn-secondary"
            >
              Edit Criteria
            </button>
            <button
              onClick={() => navigate(`/project/${projectId}/discovery`)}
              className="btn-primary"
            >
              Manage Components
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {components.length}
          </div>
          <div className="text-sm text-gray-600">Components</div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {criteria.length}
          </div>
          <div className="text-sm text-gray-600">Criteria</div>
        </div>
        <div className="card p-6">
          <div className="text-2xl font-bold text-black mb-1">
            {project.status === "completed"
              ? "✓"
              : project.status === "in_progress"
              ? "→"
              : "○"}
          </div>
          <div className="text-sm text-gray-600 capitalize">
            {project.status.replace("_", " ")}
          </div>
        </div>
      </div>

      {/* Components Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Components</h2>
          <button
            onClick={() => navigate(`/project/${projectId}/discovery`)}
            className="btn-secondary text-sm"
          >
            + Add Component
          </button>
        </div>

        {components.length === 0 ? (
          <div className="card p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No components yet
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Add components to start your trade study
            </p>
            <button
              onClick={() => navigate(`/project/${projectId}/discovery`)}
              className="btn-primary"
            >
              Add Components
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {components.map((component) => (
              <div key={component.id} className="card p-5">
                {editingComponent === component.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          value={editForm.manufacturer || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              manufacturer: e.target.value,
                            })
                          }
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Part Number
                        </label>
                        <input
                          type="text"
                          value={editForm.partNumber || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              partNumber: e.target.value,
                            })
                          }
                          className="input-field"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editForm.description || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          className="input-field"
                          rows={2}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={handleSaveEdit}
                        className="btn-primary"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          if (saveTimeout) {
                            clearTimeout(saveTimeout);
                            setSaveTimeout(null);
                          }
                          setEditingComponent(null);
                        }}
                        className="btn-secondary"
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      {isSaving && (
                        <span className="text-sm text-gray-500">
                          Auto-saving...
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
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
                      {component.datasheetUrl && (
                        <a
                          href={component.datasheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-black hover:text-gray-900 inline-flex items-center gap-1"
                        >
                          View Datasheet →
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditComponent(component)}
                        className="text-gray-400 hover:text-black transition-colors"
                        title="Edit component"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteComponent(component.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete component"
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Criteria Section */}
      {criteria.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Evaluation Criteria
            </h2>
            <button
              onClick={() => navigate(`/project/${projectId}/criteria`)}
              className="btn-secondary text-sm"
            >
              Edit Criteria
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criteria.map((criterion) => (
              <div key={criterion.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {criterion.name}
                    </h3>
                    {criterion.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {criterion.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Weight: {criterion.weight}</span>
                      {criterion.unit && <span>Unit: {criterion.unit}</span>}
                      <span>
                        {criterion.higherIsBetter
                          ? "↑ Higher is better"
                          : "↓ Lower is better"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-gray-1000 text-black"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("versions")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "versions"
                ? "border-gray-1000 text-black"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Version History
          </button>
          <button
            onClick={() => setActiveTab("collaboration")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === "collaboration"
                ? "border-gray-1000 text-black"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Team Collaboration
          </button>
        </nav>
      </div>

      {/* Version History Tab */}
      {activeTab === "versions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Version History
            </h2>
            <button
              onClick={async () => {
                if (!projectId) return;
                try {
                  await versionsApi.create(projectId, newVersionDesc);
                  setNewVersionDesc("");
                  await loadCollaborationData();
                  alert("Version created successfully!");
                } catch (error: any) {
                  alert(
                    `Failed to create version: ${
                      error.response?.data?.detail || error.message
                    }`
                  );
                }
              }}
              className="btn-primary"
            >
              Create Version
            </button>
          </div>
          <div className="card p-4 mb-4">
            <input
              type="text"
              value={newVersionDesc}
              onChange={(e) => setNewVersionDesc(e.target.value)}
              placeholder="Version description (optional)"
              className="input-field"
            />
          </div>
          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-gray-500">
                  No versions yet. Create your first version to track changes.
                </p>
              </div>
            ) : (
              versions.map((version: any) => (
                <div key={version.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          Version {version.version_number}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(version.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {version.description && (
                        <p className="text-sm text-gray-600">
                          {version.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (version.snapshot_data) {
                          const snapshot = JSON.parse(version.snapshot_data);
                          alert(
                            `Snapshot: ${JSON.stringify(snapshot, null, 2)}`
                          );
                        }
                      }}
                      className="btn-secondary text-sm"
                    >
                      View Snapshot
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Team Collaboration Tab */}
      {activeTab === "collaboration" && (
        <div className="space-y-6">
          {/* Comments Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Comments
            </h2>
            <div className="card p-4 mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="input-field w-full mb-3"
                rows={3}
              />
              <button
                onClick={async () => {
                  if (!projectId || !newComment.trim()) return;
                  try {
                    await commentsApi.create(projectId, newComment);
                    setNewComment("");
                    await loadCollaborationData();
                  } catch (error: any) {
                    alert(
                      `Failed to add comment: ${
                        error.response?.data?.detail || error.message
                      }`
                    );
                  }
                }}
                className="btn-primary"
                disabled={!newComment.trim()}
              >
                Add Comment
              </button>
            </div>
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-gray-500">
                    No comments yet. Start the conversation!
                  </p>
                </div>
              ) : (
                comments.map((comment: any) => (
                  <div key={comment.id} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Change History Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Change History
            </h2>
            <div className="space-y-2">
              {changes.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-gray-500">No changes tracked yet.</p>
                </div>
              ) : (
                changes.map((change: any) => (
                  <div key={change.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {change.change_description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(change.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {change.change_type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shared With Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Shared With
            </h2>
            <div className="space-y-2">
              {shares.length === 0 ? (
                <div className="card p-12 text-center">
                  <p className="text-gray-500">
                    This project is not shared with anyone yet.
                  </p>
                </div>
              ) : (
                shares.map((share: any) => (
                  <div key={share.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        User ID: {share.shared_with_user_id}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-200 text-gray-900 rounded">
                        {share.permission}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Files Sidebar */}
      {projectFiles.length > 0 && (
        <div className="fixed top-20 right-4 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-40 max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">
              Project Files
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {projectFiles.length} file{projectFiles.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-2">
              {projectFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 truncate">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0"
                    title="Remove file"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {activeTab === "overview" && (
        <div className="flex gap-3 pt-6 border-t border-gray-200 items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/project/${projectId}/results`)}
              className="btn-primary"
              disabled={components.length === 0}
            >
              View Results →
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn-secondary"
            >
              Back to Dashboard
            </button>
            <button
              onClick={handleExportExcel}
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              Export to Excel
            </button>
          </div>
          {project.status !== "completed" && (
            <button
              onClick={handleMarkAsDone}
              className="btn-primary bg-black hover:bg-gray-900"
              disabled={isSaving || components.length === 0}
            >
              {isSaving ? "Saving..." : "✓ Mark as Done"}
            </button>
          )}
          {project.status === "completed" && (
            <div className="flex items-center gap-2 text-black">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Study Completed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
