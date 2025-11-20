import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { Project } from "../types";
import { projectsApi, componentsApi } from "../services/api";

type DateInput = string | number | Date;

const formatDisplayDate = (value: DateInput): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setProjects } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [componentCounts, setComponentCounts] = useState<
    Record<string, number>
  >({});
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  );

  const loadProjects = React.useCallback(async () => {
    try {
      const response = await projectsApi.getAll();
      const transformedProjects = response.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        componentType: p.component_type,
        description: p.description,
        status: p.status,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));
      setProjects(transformedProjects);

      // Load component counts for each project
      const counts: Record<string, number> = {};
      await Promise.all(
        transformedProjects.map(async (project: Project) => {
          try {
            const compRes = await componentsApi.getByProject(project.id);
            counts[project.id] = compRes.data.length;
          } catch (error) {
            counts[project.id] = 0;
          }
        })
      );
      setComponentCounts(counts);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  }, [setProjects]);

  // Load projects from API
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Filter projects based on search and status
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.componentType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || project.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Project["status"]) => {
    const styles = {
      draft: "bg-gray-100 text-gray-700",
      in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-gray-200 text-gray-900",
    };

    const labels = {
      draft: "Draft",
      in_progress: "In Progress",
      completed: "Completed",
    };

    return (
      <span
        className={`px-2.5 py-1 rounded-md text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return formatDisplayDate(dateString);
  };

  const handleDeleteProject = async (
    projectId: string,
    projectName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${projectName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingProjectId(projectId);
      await projectsApi.delete(projectId);
      // Reload projects after deletion
      await loadProjects();
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      alert(
        `Failed to delete project: ${
          error.response?.data?.detail || error.message
        }`
      );
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
          Automate your engineering component evaluations with AI-powered
          analysis
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate("/new-project")}
          className="card p-6 hover:border-gray-400 group cursor-pointer text-left"
        >
          <h3 className="font-semibold text-gray-900 mb-1">New Trade Study</h3>
          <p className="text-sm text-gray-600">
            Start a new component evaluation
          </p>
        </button>

        <button
          onClick={() => navigate("/documentation")}
          className="card p-6 hover:border-gray-400 group cursor-pointer text-left"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Documentation</h3>
          <p className="text-sm text-gray-600">Learn how to use TradeForm</p>
        </button>

        <button
          onClick={() => navigate("/templates")}
          className="card p-6 hover:border-gray-400 group cursor-pointer text-left"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Templates</h3>
          <p className="text-sm text-gray-600">Browse study templates</p>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search studies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field flex-1 max-w-md"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field w-48"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Projects List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Studies
            {filteredProjects.length > 0 && (
              <span className="ml-2 text-gray-500 text-base font-normal">
                ({filteredProjects.length})
              </span>
            )}
          </h2>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="card p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No trade studies found
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first trade study"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                onClick={() => navigate("/new-project")}
                className="btn-primary"
              >
                Create Your First Study
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`card p-5 cursor-pointer group ${
                  project.status === "completed"
                    ? "border-gray-300 bg-gray-100/30"
                    : ""
                }`}
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      {project.status === "completed" && (
                        <svg
                          className="w-5 h-5 text-black flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {project.name}
                      </h3>
                      {getStatusBadge(project.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {project.componentType}
                    </p>
                    {project.description && (
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {componentCounts[project.id] || 0} component
                        {componentCounts[project.id] !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
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
                      title="Delete study"
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/project/${project.id}`);
                      }}
                      className="text-gray-400 group-hover:text-black transition-colors"
                      title="Open study"
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
                          d="M9 5l7 7-7 7"
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
    </div>
  );
};

export default Dashboard;
