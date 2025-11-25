/**
 * Trade Study card component for Dashboard.
 * Displays ungrouped trade studies with drag support for organization.
 */

import React from "react";
import type { Project } from "../../types";
import { formatDisplayDate } from "../../utils/dateFormatters";

interface StudyCardProps {
    study: Project;
    isDeleting: boolean;
    isMoving: boolean;
    onNavigate: (studyId: string) => void;
    onDelete: (studyId: string, studyName: string) => void;
    onMoveClick: (e: React.MouseEvent, studyId: string) => void;
    onContextMenu: (e: React.MouseEvent, studyId: string) => void;
    onDragStart: (studyId: string) => void;
    onDragEnd: () => void;
}

export const StudyCard: React.FC<StudyCardProps> = ({
    study,
    isDeleting,
    isMoving,
    onNavigate,
    onDelete,
    onMoveClick,
    onContextMenu,
    onDragStart,
    onDragEnd,
}) => {
    return (
        <div
            draggable
            onDragStart={() => onDragStart(study.id)}
            onDragEnd={onDragEnd}
            onContextMenu={(e) => onContextMenu(e, study.id)}
            className="card p-5 cursor-pointer group hover:border-gray-400 bg-white"
            onClick={() => onNavigate(study.id)}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{study.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {study.status.replace("_", " ")}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                        Component: <span className="font-medium">{study.componentType}</span>
                    </p>
                    {study.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{study.description}</p>
                    )}
                    <span className="text-xs text-gray-500">
                        Updated {formatDisplayDate(study.updatedAt)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => onMoveClick(e, study.id)}
                        className="text-gray-400 hover:text-black transition-colors"
                        title="Move trade study"
                        disabled={isMoving}
                    >
                        Move
                    </button>
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            onDelete(study.id, study.name);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete trade study"
                        disabled={isDeleting}
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
    );
};

export default StudyCard;

