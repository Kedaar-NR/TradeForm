/**
 * Component form for adding new components manually.
 */

import React, { useState } from "react";
import { Component } from "../../types";

interface ComponentFormProps {
  onAdd: (componentData: {
    manufacturer: string;
    partNumber: string;
    description?: string;
    datasheetUrl?: string;
    availability: Component["availability"];
  }) => Promise<Component | null>;
  onCancel: () => void;
  isSaving: boolean;
}

export const ComponentForm: React.FC<ComponentFormProps> = ({
  onAdd,
  onCancel,
  isSaving,
}) => {
  const [formData, setFormData] = useState({
    manufacturer: "",
    partNumber: "",
    description: "",
    datasheetUrl: "",
    availability: "in_stock" as Component["availability"],
  });

  const handleSubmit = async () => {
    if (!formData.manufacturer.trim() || !formData.partNumber.trim()) {
      alert("Please fill in manufacturer and part number");
      return;
    }

    const result = await onAdd(formData);
    
    if (result) {
      // Reset form on success
      setFormData({
        manufacturer: "",
        partNumber: "",
        description: "",
        datasheetUrl: "",
        availability: "in_stock" as Component["availability"],
      });
      onCancel();
    }
  };

  return (
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
          onClick={onCancel}
          className="btn-secondary"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="btn-primary"
          disabled={isSaving}
        >
          {isSaving ? "Adding..." : "Add Component"}
        </button>
      </div>
    </div>
  );
};

