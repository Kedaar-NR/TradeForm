import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectsApi, criteriaApi } from "../services/api";

interface Template {
  id: string;
  name: string;
  description: string;
  componentType: string;
  criteria: Array<{
    name: string;
    description: string;
    weight: number;
    unit: string;
    higherIsBetter: boolean;
  }>;
  icon: string;
}

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState<string | null>(null);

  const templates: Template[] = [
    {
      id: "rf-amplifier",
      name: "RF Amplifier Selection",
      description:
        "Evaluate RF amplifiers based on gain, noise figure, power consumption, and cost",
      componentType: "RF Amplifier",
      criteria: [
        {
          name: "Gain",
          description: "Amplifier gain in dB",
          weight: 9,
          unit: "dB",
          higherIsBetter: true,
        },
        {
          name: "Noise Figure",
          description: "Noise figure in dB",
          weight: 8,
          unit: "dB",
          higherIsBetter: false,
        },
        {
          name: "Power Consumption",
          description: "DC power consumption",
          weight: 7,
          unit: "mW",
          higherIsBetter: false,
        },
        {
          name: "Cost",
          description: "Unit cost",
          weight: 6,
          unit: "USD",
          higherIsBetter: false,
        },
        {
          name: "Frequency Range",
          description: "Operating frequency range",
          weight: 8,
          unit: "GHz",
          higherIsBetter: true,
        },
      ],
      icon: "📡",
    },
    {
      id: "power-supply",
      name: "Power Supply Selection",
      description:
        "Compare power supplies by efficiency, output power, size, and cost",
      componentType: "Power Supply",
      criteria: [
        {
          name: "Efficiency",
          description: "Power conversion efficiency",
          weight: 9,
          unit: "%",
          higherIsBetter: true,
        },
        {
          name: "Output Power",
          description: "Maximum output power",
          weight: 8,
          unit: "W",
          higherIsBetter: true,
        },
        {
          name: "Size",
          description: "Physical dimensions",
          weight: 7,
          unit: "mm³",
          higherIsBetter: false,
        },
        {
          name: "Cost",
          description: "Unit cost",
          weight: 7,
          unit: "USD",
          higherIsBetter: false,
        },
        {
          name: "Temperature Range",
          description: "Operating temperature range",
          weight: 6,
          unit: "°C",
          higherIsBetter: true,
        },
      ],
      icon: "⚡",
    },
    {
      id: "sensor",
      name: "Sensor Selection",
      description:
        "Evaluate sensors by sensitivity, accuracy, range, and power consumption",
      componentType: "Sensor",
      criteria: [
        {
          name: "Sensitivity",
          description: "Sensor sensitivity",
          weight: 9,
          unit: "mV/unit",
          higherIsBetter: true,
        },
        {
          name: "Accuracy",
          description: "Measurement accuracy",
          weight: 8,
          unit: "%",
          higherIsBetter: true,
        },
        {
          name: "Range",
          description: "Measurement range",
          weight: 7,
          unit: "units",
          higherIsBetter: true,
        },
        {
          name: "Power Consumption",
          description: "Power draw",
          weight: 6,
          unit: "mW",
          higherIsBetter: false,
        },
        {
          name: "Cost",
          description: "Unit cost",
          weight: 7,
          unit: "USD",
          higherIsBetter: false,
        },
      ],
      icon: "📊",
    },
    {
      id: "oscillator",
      name: "Oscillator Selection",
      description:
        "Compare oscillators by frequency stability, phase noise, and power",
      componentType: "Oscillator",
      criteria: [
        {
          name: "Frequency Stability",
          description: "Frequency stability over temperature",
          weight: 9,
          unit: "ppm",
          higherIsBetter: false,
        },
        {
          name: "Phase Noise",
          description: "Phase noise at offset",
          weight: 8,
          unit: "dBc/Hz",
          higherIsBetter: false,
        },
        {
          name: "Output Power",
          description: "Output power level",
          weight: 7,
          unit: "dBm",
          higherIsBetter: true,
        },
        {
          name: "Power Consumption",
          description: "DC power consumption",
          weight: 6,
          unit: "mW",
          higherIsBetter: false,
        },
        {
          name: "Cost",
          description: "Unit cost",
          weight: 7,
          unit: "USD",
          higherIsBetter: false,
        },
      ],
      icon: "🔄",
    },
  ];

  const handleUseTemplate = async (template: Template) => {
    if (!template) return;

    try {
      setIsCreating(template.id);

      // Create project from template
      const projectResponse = await projectsApi.create({
        name: template.name,
        componentType: template.componentType,
        description: template.description,
        status: "draft",
      });

      if (!projectResponse?.data?.id) {
        throw new Error("Failed to create project: No project ID returned");
      }

      const projectId = projectResponse.data.id;

      // Add criteria from template
      await Promise.all(
        template.criteria.map((criterion) =>
          criteriaApi.create(projectId, {
            name: criterion.name,
            description: criterion.description,
            weight: criterion.weight,
            unit: criterion.unit,
            higherIsBetter: criterion.higherIsBetter,
          })
        )
      );

      // Small delay to ensure criteria are saved
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate to criteria page to review/edit
      navigate(`/project/${projectId}/criteria`);
    } catch (error: any) {
      console.error("Failed to create project from template:", error);
      const errorMessage =
        error?.response?.data?.detail ||
        error?.message ||
        "Unknown error occurred";
      alert(`Failed to create project: ${errorMessage}`);
    } finally {
      setIsCreating(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Study Templates
        </h1>
        <p className="text-gray-600">
          Start your trade study from a pre-configured template with common
          criteria already set up
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{template.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.componentType}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-4">{template.description}</p>

            {/* Criteria Preview */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Pre-configured Criteria:
              </h4>
              <div className="space-y-2">
                {template.criteria.map((criterion, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded"
                  >
                    <span className="text-gray-700">{criterion.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        Weight: {criterion.weight}
                      </span>
                      {criterion.unit && (
                        <span className="text-gray-400">•</span>
                      )}
                      {criterion.unit && (
                        <span className="text-gray-500">{criterion.unit}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleUseTemplate(template)}
              disabled={isCreating === template.id}
              className="w-full btn-primary"
            >
              {isCreating === template.id ? "Creating..." : "Use This Template"}
            </button>
          </div>
        ))}
      </div>

      {/* Custom Template Info */}
      <div className="card p-6 bg-gray-100 border-gray-300">
        <h3 className="font-semibold text-gray-900 mb-2">
          Don't see a template for your use case?
        </h3>
        <p className="text-sm text-gray-700 mb-4">
          Start from scratch by creating a new trade study. You can define your
          own criteria and component types.
        </p>
        <button
          onClick={() => navigate("/new-project")}
          className="btn-secondary"
        >
          Create Custom Study
        </button>
      </div>
    </div>
  );
};

export default Templates;
