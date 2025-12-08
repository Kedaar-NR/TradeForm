import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { projectGroupsApi, projectsApi } from "../services/api";
import { ProjectGroupWithProjects } from "../types";
import SystemArchitectureMap from "../components/SystemArchitectureMap";
import ProjectFileTray from "../components/ProjectDetails/ProjectFileTray";
import { formatDisplayDate } from "../utils/dateFormatters";
import { markProjectGroupAccess } from "../utils/recentActivity";

const ProjectGroupDetail: React.FC = () => {
  const navigate = useNavigate();
  const { projectGroupId } = useParams<{ projectGroupId: string }>();
  const [projectGroup, setProjectGroup] = useState<ProjectGroupWithProjects | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  useEffect(() => {
    loadProjectGroup();
  }, [projectGroupId]);

  const loadProjectGroup = async () => {
    if (!projectGroupId) return;
    try {
      setIsLoading(true);
      const response = await projectGroupsApi.getById(projectGroupId);
      // Transform the response to match our interface
      const transformedGroup: ProjectGroupWithProjects = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        icon: response.data.icon,
        color: response.data.color,
        createdAt: (response.data as any).created_at,
        updatedAt: (response.data as any).updated_at,
        createdBy: (response.data as any).created_by,
        projects: ((response.data as any).projects || []).map((p: any) => ({
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
        })),
      };
      setProjectGroup(transformedGroup);
      markProjectGroupAccess(projectGroupId);
    } catch (error) {
      console.error("Failed to load project group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTradeStudy = () => {
    // Navigate to ProjectSetup page with projectGroupId in state
    navigate("/new-project", { state: { projectGroupId } });
  };

  const handleDeleteTradeStudy = async (projectId: string, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete the trade study "${projectName}"?`)) {
      return;
    }

    try {
      setDeletingProjectId(projectId);
      await projectsApi.delete(projectId);
      await loadProjectGroup();
    } catch (error: any) {
      console.error("Failed to delete trade study:", error);
      alert(`Failed to delete trade study: ${error.response?.data?.detail || error.message}`);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
      in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
      completed: { label: "Completed", color: "bg-green-100 text-green-700" },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!projectGroup) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Project not found</h3>
          <button onClick={() => navigate("/dashboard")} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Project Group Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{projectGroup.name}</h1>
          </div>
          {projectGroup.description && (
            <p className="text-gray-600 mb-2 ml-7">{projectGroup.description}</p>
          )}
          <p className="text-sm text-gray-500 ml-7">
            Last updated {formatDisplayDate(projectGroup.updatedAt)}
          </p>
        </div>
        <button
          onClick={handleCreateTradeStudy}
          className="btn-primary"
        >
          New Trade Study
        </button>
      </div>

      {/* System Architecture Map */}
      <ProjectFileTray
        projectId={projectGroup.id}
        storageKeyOverride={`tradeform_project_group_files_${projectGroup.id}`}
        title="Project Context"
        subtitle="Store program-level context, specs, and shared docs for this entire project group."
      />

      {projectGroup.projects.length > 0 && (
        <SystemArchitectureMap
          projectGroupId={projectGroup.id}
          projectGroupName={projectGroup.name}
          projects={projectGroup.projects}
        />
      )}

      {/* Trade Studies List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Trade Studies
          {projectGroup.projects.length > 0 && (
            <span className="ml-2 text-gray-500 text-base font-normal">
              ({projectGroup.projects.length})
            </span>
          )}
        </h2>

        {projectGroup.projects.length === 0 ? (
          <div className="card p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trade studies yet</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
              Get started by creating your first trade study for this project
            </p>
            <button onClick={handleCreateTradeStudy} className="btn-primary">
              Create First Trade Study
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projectGroup.projects.map((project) => (
              <div
                key={project.id}
                className="card p-5 cursor-pointer group hover:border-gray-400"
                onClick={() => navigate(`/project/${project.id}`, { state: { projectGroupId } })}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {project.name}
                      </h3>
                      {getStatusBadge(project.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Component: <span className="font-medium">{project.componentType}</span>
                    </p>
                    {project.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {project.description}
                      </p>
                    )}
                    <span className="text-xs text-gray-500">
                      Updated {formatDisplayDate(project.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTradeStudy(project.id, project.name);
                      }}
                      disabled={deletingProjectId === project.id}
                      className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete trade study"
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
                        navigate(`/project/${project.id}`, { state: { projectGroupId } });
                      }}
                      className="text-gray-400 group-hover:text-black transition-colors"
                      title="Open trade study"
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
    </div>
  );
};

export default ProjectGroupDetail;
