/**
 * Project Group card component for Dashboard.
 * Displays a project group with drag-and-drop support for moving studies.
 */

import React from "react";
import type { ProjectGroup } from "../../types";
import { formatDisplayDate } from "../../utils/dateFormatters";

interface ProjectCardProps {
    project: ProjectGroup;
    isDeleting: boolean;
    isDragOver: boolean;
    onNavigate: (projectId: string) => void;
    onDelete: (projectId: string, projectName: string) => void;
    onDragOver: (e: React.DragEvent, projectId: string) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
    project,
    isDeleting,
    isDragOver,
    onNavigate,
    onDelete,
    onDragOver,
    onDragLeave,
    onDrop,
}) => {
    return (
        <div
            className={`card p-5 cursor-pointer group hover:border-gray-400 bg-white ${
                isDragOver ? "border-black border-dashed" : ""
            }`}
            onClick={() => onNavigate(project.id)}
            onDragOver={(e) => onDragOver(e, project.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, project.id)}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: project.color }}
                    />
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
                            Updated {formatDisplayDate(project.updatedAt)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(project.id, project.name);
                        }}
                        disabled={isDeleting}
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
                            onNavigate(project.id);
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
    );
};

export default ProjectCard;

