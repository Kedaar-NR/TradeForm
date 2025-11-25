import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { ProjectGroup } from "../types";
import { projectGroupsApi, projectsApi } from "../services/api";
import { formatDisplayDate } from "../utils/dateFormatters";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projectGroups, setProjectGroups, searchTerm, projects, setProjects, updateProject } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6B7280");
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ projectId: string; x: number; y: number } | null>(null);

  const COLORS = [
    { name: "gray", value: "#6B7280" },
    { name: "blue", value: "#3B82F6" },
    { name: "green", value: "#10B981" },
    { name: "purple", value: "#8B5CF6" },
    { name: "pink", value: "#EC4899" },
    { name: "orange", value: "#F59E0B" },
    { name: "red", value: "#EF4444" },
    { name: "teal", value: "#14B8A6" },
  ];

  const loadProjectGroups = React.useCallback(async () => {
    try {
      const response = await projectGroupsApi.getAll();
      const transformedGroups = response.data.map((pg: any) => ({
        id: pg.id,
        name: pg.name,
        description: pg.description,
        icon: pg.icon,
        color: pg.color,
        createdAt: pg.created_at,
        updatedAt: pg.updated_at,
        createdBy: pg.created_by,
      }));
      setProjectGroups(transformedGroups);
    } catch (error) {
      console.error("Failed to load project groups:", error);
    }
  }, [setProjectGroups]);

  const loadProjects = React.useCallback(async () => {
    try {
      const projectTemplateStudyNames = new Set(
        [
          // Rocket
          "Booster Selection",
          "Payload Fairing",
          "Avionics Package",
          "Fuel Tank Selection",
          "Thrust Vector Control",
          "Ignition System",
          "Turbopump Selection",
          "Recovery System",
          "Nozzle Design",
          "Guidance Sensor Suite",
          "Separation System",
          // Satellite
          "Solar Panel Selection",
          "Communication Antenna",
          "Reaction Wheel",
          "Battery System",
          "Star Tracker",
          "Onboard Computer",
          "Propulsion System",
          "Thermal Control",
          "GPS Receiver",
          "Payload Instrument",
          // Drone
          "Motor Selection",
          "Camera Module",
          "Battery Pack",
          "Propeller Selection",
          "Flight Controller",
          "ESC Selection",
          "GPS Module",
          "Gimbal System",
          "FPV System",
          // Aircraft
          "Turbine Engine Selection",
          "Flight Control Computer",
          "Composite Wing Spar",
          "Avionics Display",
          "Structural Component",
        ].map((n) => n.toLowerCase())
      );

      const response = await projectsApi.getAll();
      const transformedProjects = response.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        componentType: p.component_type,
        description: p.description,
        projectGroupId: p.project_group_id,
        status: p.status,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        createdBy: p.created_by,
        tradeStudyReport: p.trade_study_report,
        reportGeneratedAt: p.report_generated_at,
        createdViaTemplateGroup: typeof window !== "undefined" ? localStorage.getItem(`template_project_${p.id}`) === "grouped" : false,
      }));

      // Auto-mark any legacy ungrouped project-template studies so they don't appear in Recent Studies
      transformedProjects.forEach((proj: any) => {
        if (!proj.projectGroupId) {
          const looksLikeTemplateStudy = projectTemplateStudyNames.has((proj.name || "").toLowerCase());
          if (looksLikeTemplateStudy) {
            if (typeof window !== "undefined") {
              localStorage.setItem(`template_project_${proj.id}`, "grouped");
            }
            proj.createdViaTemplateGroup = true;
          }
        }
      });

      // Sort most recent first
      transformedProjects.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setProjects(transformedProjects);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  }, [setProjects]);

  useEffect(() => {
    loadProjectGroups();
    loadProjects();
  }, [loadProjectGroups, loadProjects]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  // Filter project groups based on search
  const filteredProjects = projectGroups.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return formatDisplayDate(dateString);
  };

  // Ungrouped studies that the user created directly (standalone study templates)
  const filteredStudies = projects
    .filter((p) => {
      const isUngrouped = !p.projectGroupId;
      const markedGrouped = typeof window !== "undefined" ? localStorage.getItem(`template_project_${p.id}`) === "grouped" : false;
      const markedDirect = typeof window !== "undefined" ? localStorage.getItem(`direct_study_${p.id}`) === "true" : false;
      return isUngrouped && !markedGrouped && (markedDirect || !p.createdViaTemplateGroup);
    })
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    })
    // Hide studies that were created via project templates even if ungrouped
    .filter((p) => !p.createdViaTemplateGroup);

  const moveTargets = [
    { id: null, name: "Dashboard (Ungrouped)" },
    ...projectGroups.map((pg) => ({ id: pg.id, name: pg.name })),
  ];

  const handleMoveStudy = async (projectId: string, targetGroupId: string | null) => {
    if (movingProjectId) return;
    try {
      setMovingProjectId(projectId);
      await projectsApi.update(projectId, { projectGroupId: targetGroupId ?? undefined });
      updateProject(projectId, { projectGroupId: targetGroupId ?? undefined });
      await loadProjects();
      setContextMenu(null);
    } catch (error: any) {
      console.error("Failed to move trade study:", error);
      alert(`Failed to move trade study: ${error.response?.data?.detail || error.message}`);
    } finally {
      setMovingProjectId(null);
      setDraggingProjectId(null);
      setDragOverTarget(null);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, projectId: string) => {
    event.preventDefault();
    setContextMenu({ projectId, x: event.clientX, y: event.clientY });
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    try {
      setIsCreating(true);
      const response = await projectGroupsApi.create({
        name: projectName,
        description: projectDescription,
        icon: "folder",
        color: selectedColor,
      });

      // Transform API response to match our interface (snake_case to camelCase)
      const newGroup: ProjectGroup = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        icon: response.data.icon,
        color: response.data.color,
        createdAt: (response.data as any).created_at,
        updatedAt: (response.data as any).updated_at,
        createdBy: (response.data as any).created_by,
      };

      // Add to store and navigate to the project page
      await loadProjectGroups();
      navigate(`/project-group/${newGroup.id}`);

      // Reset form
      setShowCreateModal(false);
      setProjectName("");
      setProjectDescription("");
      setSelectedColor("#6B7280");
    } catch (error: any) {
      console.error("Failed to create project:", error);
      alert(`Failed to create project: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${projectName}"? All trade studies inside will become ungrouped.`)) {
      return;
    }

    try {
      setDeletingProjectId(projectId);
      await projectGroupsApi.delete(projectId);
      await loadProjectGroups();
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      alert(`Failed to delete project: ${error.response?.data?.detail || error.message}`);
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trade Studies</h1>
        <p className="text-gray-600">
          Automate your engineering component evaluations with AI-powered analysis
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="card p-6 hover:border-gray-400 group cursor-pointer text-left"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Create Project</h3>
          <p className="text-sm text-gray-600">Start organizing your trade studies</p>
        </button>

        <button
          onClick={() => navigate("/templates")}
          className="card p-6 hover:border-gray-400 group cursor-pointer text-left"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Templates</h3>
          <p className="text-sm text-gray-600">Browse project templates</p>
        </button>
      </div>

      {/* Projects List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Projects
            {filteredProjects.length > 0 && (
              <span className="ml-2 text-gray-500 text-base font-normal">
                ({filteredProjects.length})
              </span>
            )}
          </h2>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="card p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Get started by creating your first project"}
            </p>
            {!searchTerm && (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`card p-5 cursor-pointer group hover:border-gray-400 bg-white ${
                  dragOverTarget === project.id ? "border-black border-dashed" : ""
                }`}
                onClick={() => navigate(`/project-group/${project.id}`)}
                onDragOver={(e) => {
                  if (!draggingProjectId) return;
                  e.preventDefault();
                  setDragOverTarget(project.id);
                }}
                onDragLeave={() => setDragOverTarget(null)}
                onDrop={(e) => {
                  if (!draggingProjectId) return;
                  e.preventDefault();
                  handleMoveStudy(draggingProjectId, project.id);
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {project.description}
                        </p>
                      )}
                      <span className="text-xs text-gray-500">
                        Updated {formatDate(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id, project.name);
                      }}
                      disabled={deletingProjectId === project.id}
                      className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete project"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/project-group/${project.id}`);
                      }}
                      className="text-gray-400 group-hover:text-black transition-colors"
                      title="Open project"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Studies (Ungrouped, not from project templates) */}
      {filteredStudies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Studies
              <span className="ml-2 text-gray-500 text-base font-normal">({filteredStudies.length})</span>
            </h2>
            <p className="text-sm text-gray-500">Drag onto a project to organize</p>
          </div>

          <div
            className={`${dragOverTarget === "ungrouped" ? "border-2 border-dashed border-black rounded-lg p-3" : ""}`}
            onDragOver={(e) => {
              if (!draggingProjectId) return;
              e.preventDefault();
              setDragOverTarget("ungrouped");
            }}
            onDragLeave={() => setDragOverTarget(null)}
            onDrop={(e) => {
              if (!draggingProjectId) return;
              e.preventDefault();
              handleMoveStudy(draggingProjectId, null);
            }}
          >
            <div className="space-y-3">
              {filteredStudies.map((study) => (
                <div
                  key={study.id}
                  draggable
                  onDragStart={() => setDraggingProjectId(study.id)}
                  onDragEnd={() => {
                    setDraggingProjectId(null);
                    setDragOverTarget(null);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, study.id)}
                  className="card p-5 cursor-pointer group hover:border-gray-400 bg-white"
                  onClick={() => navigate(`/project/${study.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {study.name}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {study.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Component: <span className="font-medium">{study.componentType}</span>
                      </p>
                      {study.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {study.description}
                        </p>
                      )}
                      <span className="text-xs text-gray-500">
                        Updated {formatDate(study.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenu({ projectId: study.id, x: e.clientX, y: e.clientY });
                        }}
                        className="text-gray-400 hover:text-black transition-colors"
                        title="Move trade study"
                        disabled={movingProjectId === study.id}
                      >
                        Move
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`Delete "${study.name}"? This cannot be undone.`)) return;
                          try {
                            setDeletingProjectId(study.id);
                            await projectsApi.delete(study.id);
                            await loadProjects();
                          } catch (err: any) {
                            console.error("Failed to delete study:", err);
                            alert(`Failed to delete study: ${err?.response?.data?.detail || err?.message || "Unknown error"}`);
                          } finally {
                            setDeletingProjectId(null);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete trade study"
                        disabled={deletingProjectId === study.id}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        </div>
      )}

      {/* Context Menu for moving studies */}
      {contextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded-md border border-gray-200 z-50 w-64"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Move Trade Study
          </div>
          <div className="max-h-64 overflow-y-auto">
            {moveTargets.map((target) => (
              <button
                key={target.id || "ungrouped"}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveStudy(contextMenu.projectId, target.id as string | null);
                }}
                disabled={movingProjectId === contextMenu.projectId}
              >
                {target.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Q4 Power Supply Studies"
                  className="input-field w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of this project..."
                  className="input-field w-full h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.value)}
                      type="button"
                      className={`h-10 rounded-lg border-2 transition-all ${
                        selectedColor === color.value ? "border-black" : "border-gray-200"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setProjectName("");
                  setProjectDescription("");
                  setSelectedColor("#6B7280");
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                className="btn-primary"
                disabled={isCreating || !projectName.trim()}
              >
                {isCreating ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
