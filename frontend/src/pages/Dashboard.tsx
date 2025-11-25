/**
 * Dashboard page.
 *
 * Main landing page showing project groups and ungrouped trade studies.
 * Supports drag-and-drop organization of studies into projects.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import type { ProjectGroup } from "../types";
import { projectGroupsApi, projectsApi } from "../services/api";
import { transformProjectGroups } from "../utils/apiTransformers";
import { extractErrorMessage } from "../utils/errorHelpers";
import {
  ProjectCard,
  StudyCard,
  CreateProjectModal,
  MoveStudyContextMenu,
} from "../components/Dashboard";
import type { ApiProjectGroup } from "../types/api";

// Known template study names for filtering
const TEMPLATE_STUDY_NAMES = new Set(
  [
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
    "Motor Selection",
    "Camera Module",
    "Battery Pack",
    "Propeller Selection",
    "Flight Controller",
    "ESC Selection",
    "GPS Module",
    "Gimbal System",
    "FPV System",
    "Turbine Engine Selection",
    "Flight Control Computer",
    "Composite Wing Spar",
    "Avionics Display",
    "Structural Component",
  ].map((n) => n.toLowerCase())
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    projectGroups,
    setProjectGroups,
    searchTerm,
    projects,
    setProjects,
    updateProject,
  } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("#6B7280");
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [movingProjectId, setMovingProjectId] = useState<string | null>(null);
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(
    null
  );
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    projectId: string;
    x: number;
    y: number;
  } | null>(null);

  const loadProjectGroups = useCallback(async () => {
    try {
      const response = await projectGroupsApi.getAll();
      setProjectGroups(
        transformProjectGroups(response.data as unknown as ApiProjectGroup[])
      );
    } catch (error) {
      console.error("Failed to load project groups:", error);
    }
  }, [setProjectGroups]);

  const loadProjects = useCallback(async () => {
    try {
      const response = await projectsApi.getAll();
      // Backend response is snake_case, need to transform
      const rawData = response.data as unknown as Array<{
        id: string;
        name: string;
        component_type: string;
        description?: string;
        project_group_id?: string;
        status: "draft" | "in_progress" | "completed";
        created_at: string;
        updated_at: string;
        created_by?: string;
        trade_study_report?: string | null;
        report_generated_at?: string | null;
      }>;
      const transformedProjects = rawData.map((p) => ({
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
        createdViaTemplateGroup:
          typeof window !== "undefined"
            ? localStorage.getItem(`template_project_${p.id}`) === "grouped"
            : false,
      }));

      // Auto-mark legacy ungrouped template studies
      transformedProjects.forEach(
        (proj: {
          projectGroupId?: string;
          name: string;
          id: string;
          createdViaTemplateGroup?: boolean;
        }) => {
          if (
            !proj.projectGroupId &&
            TEMPLATE_STUDY_NAMES.has(proj.name.toLowerCase())
          ) {
            if (typeof window !== "undefined") {
              localStorage.setItem(`template_project_${proj.id}`, "grouped");
            }
            proj.createdViaTemplateGroup = true;
          }
        }
      );

      // Sort by most recent
      transformedProjects.sort(
        (a: { updatedAt: string }, b: { updatedAt: string }) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
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

  // Filter project groups by search
  const filteredProjects = projectGroups.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter ungrouped studies
  const filteredStudies = projects
    .filter((p) => {
      const isUngrouped = !p.projectGroupId;
      const markedGrouped =
        typeof window !== "undefined"
          ? localStorage.getItem(`template_project_${p.id}`) === "grouped"
          : false;
      const markedDirect =
        typeof window !== "undefined"
          ? localStorage.getItem(`direct_study_${p.id}`) === "true"
          : false;
      return (
        isUngrouped &&
        !markedGrouped &&
        (markedDirect || !p.createdViaTemplateGroup)
      );
    })
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description &&
          p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter((p) => !p.createdViaTemplateGroup);

  const handleMoveStudy = async (
    projectId: string,
    targetGroupId: string | null
  ) => {
    if (movingProjectId) return;
    try {
      setMovingProjectId(projectId);
      await projectsApi.update(projectId, {
        projectGroupId: targetGroupId ?? undefined,
      });
      updateProject(projectId, { projectGroupId: targetGroupId ?? undefined });
      await loadProjects();
      setContextMenu(null);
    } catch (error) {
      console.error("Failed to move trade study:", error);
      alert(`Failed to move trade study: ${extractErrorMessage(error)}`);
    } finally {
      setMovingProjectId(null);
      setDraggingProjectId(null);
      setDragOverTarget(null);
    }
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

      const newGroup: ProjectGroup = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        icon: response.data.icon,
        color: response.data.color,
        createdAt:
          (response.data as { created_at?: string }).created_at ||
          new Date().toISOString(),
        updatedAt:
          (response.data as { updated_at?: string }).updated_at ||
          new Date().toISOString(),
        createdBy: (response.data as { created_by?: string }).created_by,
      };

      await loadProjectGroups();
      navigate(`/project-group/${newGroup.id}`);
      setShowCreateModal(false);
      setProjectName("");
      setProjectDescription("");
      setSelectedColor("#6B7280");
    } catch (error) {
      console.error("Failed to create project:", error);
      alert(`Failed to create project: ${extractErrorMessage(error)}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (
    projectId: string,
    projectName: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${projectName}"? All trade studies inside will become ungrouped.`
      )
    ) {
      return;
    }

    try {
      setDeletingProjectId(projectId);
      await projectGroupsApi.delete(projectId);
      await loadProjectGroups();
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert(`Failed to delete project: ${extractErrorMessage(error)}`);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleDeleteStudy = async (studyId: string, studyName: string) => {
    if (!window.confirm(`Delete "${studyName}"? This cannot be undone.`))
      return;
    try {
      setDeletingProjectId(studyId);
      await projectsApi.delete(studyId);
      await loadProjects();
    } catch (error) {
      console.error("Failed to delete study:", error);
      alert(`Failed to delete study: ${extractErrorMessage(error)}`);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setProjectName("");
    setProjectDescription("");
    setSelectedColor("#6B7280");
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Get started by creating your first project"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isDeleting={deletingProjectId === project.id}
                isDragOver={dragOverTarget === project.id}
                onNavigate={(id) => navigate(`/project-group/${id}`)}
                onDelete={handleDeleteProject}
                onDragOver={(e, id) => {
                  if (!draggingProjectId) return;
                  e.preventDefault();
                  setDragOverTarget(id);
                }}
                onDragLeave={() => setDragOverTarget(null)}
                onDrop={(e, id) => {
                  if (!draggingProjectId) return;
                  e.preventDefault();
                  handleMoveStudy(draggingProjectId, id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Studies (Ungrouped) */}
      {filteredStudies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Studies
              <span className="ml-2 text-gray-500 text-base font-normal">
                ({filteredStudies.length})
              </span>
            </h2>
            <p className="text-sm text-gray-500">
              Drag onto a project to organize
            </p>
          </div>

          <div
            className={`${
              dragOverTarget === "ungrouped"
                ? "border-2 border-dashed border-black rounded-lg p-3"
                : ""
            }`}
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
                <StudyCard
                  key={study.id}
                  study={study}
                  isDeleting={deletingProjectId === study.id}
                  isMoving={movingProjectId === study.id}
                  onNavigate={(id) => navigate(`/project/${id}`)}
                  onDelete={handleDeleteStudy}
                  onMoveClick={(e, id) => {
                    e.stopPropagation();
                    setContextMenu({
                      projectId: id,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  onContextMenu={(e, id) => {
                    e.preventDefault();
                    setContextMenu({
                      projectId: id,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  onDragStart={(id) => setDraggingProjectId(id)}
                  onDragEnd={() => {
                    setDraggingProjectId(null);
                    setDragOverTarget(null);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      <MoveStudyContextMenu
        contextMenu={contextMenu}
        projectGroups={projectGroups}
        isMoving={movingProjectId !== null}
        onMove={handleMoveStudy}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        projectName={projectName}
        projectDescription={projectDescription}
        selectedColor={selectedColor}
        isCreating={isCreating}
        onNameChange={setProjectName}
        onDescriptionChange={setProjectDescription}
        onColorChange={setSelectedColor}
        onSubmit={handleCreateProject}
        onClose={closeModal}
      />
    </div>
  );
};

export default Dashboard;
