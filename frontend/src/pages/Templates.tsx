import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectsApi, criteriaApi, projectGroupsApi, componentsApi } from "../services/api";
import { projectTemplates, studyTemplates } from "../data/templateData";
import type { ProjectTemplate, StudyTemplate } from "../data/templateTypes";
import { API_BASE_URL, getAuthToken } from "../utils/apiHelpers";

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "studies">("projects");

  const handleUseProjectTemplate = async (template: ProjectTemplate) => {
    if (!template) return;

    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const authToken = getAuthToken();

    if (!isAuthenticated || !authToken) {
      alert("Please log in first to create a project from a template.");
      navigate("/login");
      return;
    }

    try {
      setIsCreating(template.id);

      // Create project group from template
      const projectGroupResponse = await projectGroupsApi.create({
        name: template.name,
        description: template.description,
        icon: "folder",
        color: template.color,
      });

      const projectGroupId = projectGroupResponse.data.id;

      // Create all trade studies within the project group
      let createdCount = 0;
      for (const study of template.studies) {
        const projectResponse = await projectsApi.create({
          name: study.name,
          componentType: study.componentType,
          description: study.description,
          status: "draft",
          projectGroupId: projectGroupId,
        });

        const projectId = projectResponse.data.id;

        // Ensure it is linked to the project group even if backend defaults change
        if (projectGroupId) {
          await projectsApi.update(projectId, { projectGroupId });
        }

        // Mark as grouped so dashboard Recent Studies stays clean
        localStorage.setItem(`template_project_${projectId}`, "grouped");

        // Add criteria for this study
        await Promise.all(
          study.criteria.map((criterion) =>
            criteriaApi.create(projectId, {
              name: criterion.name,
              description: criterion.description,
              weight: criterion.weight,
              unit: criterion.unit,
              higherIsBetter: criterion.higherIsBetter,
            })
          )
        );

        // Add components for this study
        if (study.components && study.components.length > 0) {
          await Promise.all(
            study.components.map((component) =>
              componentsApi.create(projectId, {
                manufacturer: component.manufacturer,
                partNumber: component.partNumber,
                description: component.description,
                availability: component.availability || "in_stock",
                source: "manually_added",
              })
            )
          );
        }

        createdCount++;
      }

      // Show success message
      alert(`Success! Created ${createdCount} trade studies from the ${template.name} template.`);

      // Small delay to ensure all data is saved
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to the new project group with a full page reload to ensure fresh data
      window.location.href = `/project-group/${projectGroupId}`;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || "Unknown error occurred";
      alert(`Failed to create project: ${errorMessage}\n\nCheck the console for more details.`);
    } finally {
      setIsCreating(null);
    }
  };

  const handleUseStudyTemplate = async (template: StudyTemplate) => {
    if (!template) return;

    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const authToken = getAuthToken();

    if (!isAuthenticated || !authToken) {
      alert("Please log in first to create a project from a template.");
      navigate("/login");
      return;
    }

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
      if (typeof window !== "undefined") {
        localStorage.setItem(`direct_study_${projectId}`, "true");
      }

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

      // Navigate to criteria page to review/edit
      navigate(`/project/${projectId}/criteria`);
    } catch (error: any) {
      // Extract error message properly
      let errorMessage = "Unknown error occurred";
      if (
        error?.code === "ERR_NETWORK" ||
        error?.message === "Network Error" ||
        error?.message?.includes("Network Error")
      ) {
        // Check if backend is actually reachable
        try {
          const apiBaseUrl = API_BASE_URL;
          const healthCheck = await fetch(`${apiBaseUrl}/health`);
          if (healthCheck.ok) {
            errorMessage =
              "Network Error - Backend is running but request failed. This might be an authentication issue. Please try logging in again.";
          } else {
            errorMessage = `Network Error - Cannot reach backend at ${apiBaseUrl}. Please check if the backend is running.`;
          }
        } catch (healthErr) {
          errorMessage = `Network Error - Cannot reach backend. Please check if the backend is running on ${API_BASE_URL}`;
        }
      } else if (error?.response?.status === 401) {
        errorMessage = "Authentication required. Please log in first.";
        // Redirect to login
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (error?.response?.data) {
        const data = error.response.data;
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (typeof data.detail === "object" && data.detail !== null) {
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail
              .map((e: any) =>
                typeof e === "string" ? e : e.msg || JSON.stringify(e)
              )
              .join(", ");
          } else if (data.detail.message) {
            errorMessage = data.detail.message;
          } else {
            errorMessage = JSON.stringify(data.detail);
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert(`Failed to create project: ${errorMessage}`);
    } finally {
      setIsCreating(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates</h1>
        <p className="text-gray-600">
          Start quickly with pre-configured project or study templates
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("projects")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "projects"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Project Templates
          </button>
          <button
            onClick={() => setActiveTab("studies")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "studies"
                ? "border-black text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Study Templates
          </button>
        </div>
      </div>

      {/* Project Templates */}
      {activeTab === "projects" && (
        <>
          <p className="text-sm text-gray-600">
            Complete project templates with multiple trade studies. Perfect for complex systems with several components.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projectTemplates.map((template) => (
              <div key={template.id} className="card p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.studies.length} trade studies</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">{template.description}</p>

                {/* Studies Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Included Trade Studies:</h4>
                  <div className="space-y-2">
                    {template.studies.map((study, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                        <span className="text-gray-700 font-medium">{study.name}</span>
                        <span className="text-gray-500">{study.criteria.length} criteria</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleUseProjectTemplate(template)}
                  disabled={isCreating === template.id}
                  className="w-full btn-primary mt-auto"
                >
                  {isCreating === template.id ? "Creating..." : "Use This Template"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Study Templates */}
      {activeTab === "studies" && (
        <>
          <p className="text-sm text-gray-600">
            Individual trade study templates with pre-configured criteria. Great for standalone component evaluations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studyTemplates.map((template) => (
              <div key={template.id} className="card p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.componentType}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">{template.description}</p>

                {/* Criteria Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Pre-configured Criteria:</h4>
                  <div className="space-y-2">
                    {template.criteria.map((criterion, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">{criterion.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Weight: {criterion.weight}</span>
                          {criterion.unit && <span className="text-gray-400">•</span>}
                          {criterion.unit && <span className="text-gray-500">{criterion.unit}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleUseStudyTemplate(template)}
                  disabled={isCreating === template.id}
                  className="w-full btn-primary mt-auto"
                >
                  {isCreating === template.id ? "Creating..." : "Use This Template"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Custom Template Info */}
      <div className="card p-6 bg-gray-100 border-gray-300">
        <h3 className="font-semibold text-gray-900 mb-2">Don't see a template for your use case?</h3>
        <p className="text-sm text-gray-700 mb-4">
          Start from scratch by creating a new {activeTab === "projects" ? "project" : "trade study"}. You can define your own criteria and component types.
        </p>
        <button
          onClick={() => navigate(activeTab === "projects" ? "/dashboard" : "/new-project")}
          className="btn-secondary"
        >
          {activeTab === "projects" ? "Create Custom Project" : "Create Custom Study"}
        </button>
      </div>
    </div>
  );
};

export default Templates;
