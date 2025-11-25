/**
 * Create Project modal component for Dashboard.
 * Form for creating new project groups with name, description, and color.
 */

import React from "react";

interface CreateProjectModalProps {
    isOpen: boolean;
    projectName: string;
    projectDescription: string;
    selectedColor: string;
    isCreating: boolean;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
    onColorChange: (color: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}

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

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    isOpen,
    projectName,
    projectDescription,
    selectedColor,
    isCreating,
    onNameChange,
    onDescriptionChange,
    onColorChange,
    onSubmit,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Project</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => onNameChange(e.target.value)}
                            placeholder="e.g., Q4 Power Supply Studies"
                            className="input-field w-full"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={projectDescription}
                            onChange={(e) => onDescriptionChange(e.target.value)}
                            placeholder="Brief description of this project..."
                            className="input-field w-full h-20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Choose Color
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => onColorChange(color.value)}
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
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                        disabled={isCreating}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        className="btn-primary"
                        disabled={isCreating || !projectName.trim()}
                    >
                        {isCreating ? "Creating..." : "Create Project"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProjectModal;

