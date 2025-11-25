/**
 * Context menu for moving trade studies between projects.
 */

import React from "react";
import type { ProjectGroup } from "../../types";

interface MoveTarget {
    id: string | null;
    name: string;
}

interface MoveStudyContextMenuProps {
    contextMenu: { projectId: string; x: number; y: number } | null;
    projectGroups: ProjectGroup[];
    isMoving: boolean;
    onMove: (projectId: string, targetGroupId: string | null) => void;
}

export const MoveStudyContextMenu: React.FC<MoveStudyContextMenuProps> = ({
    contextMenu,
    projectGroups,
    isMoving,
    onMove,
}) => {
    if (!contextMenu) return null;

    const moveTargets: MoveTarget[] = [
        { id: null, name: "Dashboard (Ungrouped)" },
        ...projectGroups.map((pg) => ({ id: pg.id, name: pg.name })),
    ];

    return (
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
                            onMove(contextMenu.projectId, target.id);
                        }}
                        disabled={isMoving}
                    >
                        {target.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MoveStudyContextMenu;

