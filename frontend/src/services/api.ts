import axios from "axios";
import {
    Project,
    ProjectGroup,
    ProjectGroupWithProjects,
    Component,
    Criterion,
    Score,
    OnboardingStatusData,
    UserDocument,
} from "../types";
import { API_BASE_URL, getAuthToken } from "../utils/apiHelpers";

// In development, use empty string to leverage Vite proxy
// In production, use the full API URL
const api = axios.create({
    baseURL: API_BASE_URL || "",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: 30000, // 30 second timeout
});

// Add request interceptor to log API calls in development
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (import.meta.env.DEV) {
            console.log(
                `API Request: ${config.method?.toUpperCase()} ${
                    config.baseURL
                }${config.url}`
            );
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
            const errorMsg = API_BASE_URL
                ? `Network error - cannot reach backend at ${API_BASE_URL}. Is it running?`
                : "Network error - VITE_API_URL is not set. Please configure your backend URL.";
            console.error(errorMsg);

            // Show user-friendly error in production
            if (import.meta.env.PROD && typeof window !== "undefined") {
                // You could dispatch a toast notification here if you have a notification system
                console.error(
                    "Backend connection failed. Please check your deployment configuration."
                );
            }
        } else if (error.response) {
            // Server responded with error status
            console.error(
                `API Error ${error.response.status}:`,
                error.response.data
            );
        } else if (error.request) {
            // Request made but no response
            console.error("No response from server:", error.request);
        }
        return Promise.reject(error);
    }
);

// Authentication
export const authApi = {
    login: (email: string, password: string) =>
        api.post("/api/auth/login", { email, password }),
    register: (email: string, password: string) =>
        api.post("/api/auth/register", { email, password }),
    finishSso: (code: string, state: string) =>
        api.post("/api/auth/workos/callback", { code, state }),
    getCurrentUser: () => api.get("/api/auth/me"),
};

// Project Groups
export const projectGroupsApi = {
    getAll: () => api.get<ProjectGroup[]>("/api/project-groups"),
    getById: (id: string) =>
        api.get<ProjectGroupWithProjects>(`/api/project-groups/${id}`),
    create: (
        projectGroup: Omit<
            ProjectGroup,
            "id" | "createdAt" | "updatedAt" | "createdBy"
        >
    ) =>
        api.post<ProjectGroup>("/api/project-groups", {
            name: projectGroup.name,
            description: projectGroup.description,
            icon: projectGroup.icon,
            color: projectGroup.color,
        }),
    update: (id: string, updates: Partial<ProjectGroup>) =>
        api.put<ProjectGroup>(`/api/project-groups/${id}`, {
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.description !== undefined && {
                description: updates.description,
            }),
            ...(updates.icon !== undefined && { icon: updates.icon }),
            ...(updates.color !== undefined && { color: updates.color }),
        }),
    delete: (id: string) => api.delete(`/api/project-groups/${id}`),
};

// Projects
export const projectsApi = {
    getAll: () => api.get<Project[]>("/api/projects"),
    getById: (id: string) => api.get<Project>(`/api/projects/${id}`),
    create: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) =>
        api.post<Project>("/api/projects", {
            name: project.name,
            component_type: project.componentType,
            description: project.description,
            status: project.status,
            project_group_id: project.projectGroupId,
        }),
    update: (id: string, updates: Partial<Project>) =>
        api.put<Project>(`/api/projects/${id}`, {
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.componentType !== undefined && {
                component_type: updates.componentType,
            }),
            ...(updates.description !== undefined && {
                description: updates.description,
            }),
            ...(updates.status !== undefined && { status: updates.status }),
            ...(updates.projectGroupId !== undefined && {
                project_group_id: updates.projectGroupId,
            }),
        }),
    delete: (id: string) => api.delete(`/api/projects/${id}`),
};

// Criteria
export const criteriaApi = {
    getByProject: (projectId: string) =>
        api.get<Criterion[]>(`/api/projects/${projectId}/criteria`),
    create: (
        projectId: string,
        criterion: Omit<Criterion, "id" | "projectId">
    ) =>
        api.post<Criterion>(`/api/projects/${projectId}/criteria`, {
            name: criterion.name,
            description: criterion.description,
            weight: criterion.weight,
            unit: criterion.unit,
            higher_is_better: criterion.higherIsBetter,
            minimum_requirement: criterion.minimumRequirement,
            maximum_requirement: criterion.maximumRequirement,
        }),
    update: (id: string, updates: Partial<Criterion>) =>
        api.put<Criterion>(`/api/criteria/${id}`, {
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.description !== undefined && {
                description: updates.description,
            }),
            ...(updates.weight !== undefined && { weight: updates.weight }),
            ...(updates.unit !== undefined && { unit: updates.unit }),
            ...(updates.higherIsBetter !== undefined && {
                higher_is_better: updates.higherIsBetter,
            }),
            ...(updates.minimumRequirement !== undefined && {
                minimum_requirement: updates.minimumRequirement,
            }),
            ...(updates.maximumRequirement !== undefined && {
                maximum_requirement: updates.maximumRequirement,
            }),
        }),
    delete: (id: string) => api.delete(`/api/criteria/${id}`),
    uploadExcel: (projectId: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post(
            `/api/projects/${projectId}/criteria/upload`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
    },
    exportExcel: (projectId: string) =>
        api.get(`/api/projects/${projectId}/criteria/export`, {
            responseType: "blob",
        }),
};

// Components
export const componentsApi = {
    getByProject: (projectId: string) =>
        api.get<Component[]>(`/api/projects/${projectId}/components`),
    create: (
        projectId: string,
        component: Omit<Component, "id" | "projectId">
    ) =>
        api.post<Component>(`/api/projects/${projectId}/components`, {
            manufacturer: component.manufacturer,
            part_number: component.partNumber,
            description: component.description,
            datasheet_url: component.datasheetUrl,
            availability: component.availability,
            source: component.source || "manually_added",
        }),
    update: (
        id: string,
        component: Partial<Omit<Component, "id" | "projectId">>
    ) =>
        api.put<Component>(`/api/components/${id}`, {
            manufacturer: component.manufacturer,
            part_number: component.partNumber,
            description: component.description,
            datasheet_url: component.datasheetUrl,
            availability: component.availability,
        }),
    delete: (id: string) => api.delete(`/api/components/${id}`),
    discover: (projectId: string) =>
        api.post<{
            status: string;
            discovered_count: number;
            components: Component[];
        }>(`/api/projects/${projectId}/discover`),
    uploadExcel: (projectId: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post(
            `/api/projects/${projectId}/components/upload`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
    },
    exportExcel: (projectId: string) =>
        api.get(`/api/projects/${projectId}/components/export`, {
            responseType: "blob",
        }),
    scoreAll: (projectId: string) =>
        api.post<{
            status: string;
            scores_created: number;
            scores_updated: number;
        }>(`/api/projects/${projectId}/score`),
};

// Scores
export const scoresApi = {
    getByProject: (projectId: string) =>
        api.get<Score[]>(`/api/projects/${projectId}/scores`),
    create: (score: Omit<Score, "id">) => api.post<Score>("/api/scores", score),
    update: (id: string, updates: Partial<Score>) =>
        api.put<Score>(`/api/scores/${id}`, updates),
};

// Results
export const resultsApi = {
    getByProject: (projectId: string) =>
        api.get(`/api/projects/${projectId}/results`),
    exportFullExcel: (projectId: string) =>
        api.get(`/api/projects/${projectId}/export/full`, {
            responseType: "blob",
        }),
};

// Version History
export const versionsApi = {
    getByProject: (projectId: string) =>
        api.get(`/api/projects/${projectId}/versions`),
    getById: (projectId: string, versionId: string) =>
        api.get(`/api/projects/${projectId}/versions/${versionId}`),
    create: (projectId: string, description?: string) =>
        api.post(`/api/projects/${projectId}/versions`, { description }),
};

// Team Collaboration
export const sharesApi = {
    getByProject: (projectId: string) =>
        api.get(`/api/projects/${projectId}/shares`),
    create: (
        projectId: string,
        sharedWithUserId: string,
        permission: string = "view"
    ) =>
        api.post(`/api/projects/${projectId}/shares`, {
            shared_with_user_id: sharedWithUserId,
            permission,
        }),
};

export const commentsApi = {
    getByProject: (projectId: string) =>
        api.get(`/api/projects/${projectId}/comments`),
    create: (
        projectId: string,
        content: string,
        componentId?: string,
        criterionId?: string
    ) =>
        api.post(`/api/projects/${projectId}/comments`, {
            content,
            component_id: componentId,
            criterion_id: criterionId,
        }),
};

export const changesApi = {
    getByProject: (projectId: string) =>
        api.get(`/api/projects/${projectId}/changes`),
};

// Datasheets
export const datasheetsApi = {
    uploadDatasheet: (componentId: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post(`/api/components/${componentId}/datasheet`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    getStatus: (componentId: string) =>
        api.get(`/api/components/${componentId}/datasheet/status`),
    query: (componentId: string, question: string, criterionId?: string) =>
        api.post(`/api/components/${componentId}/datasheet/query`, {
            question,
            criterion_id: criterionId,
        }),
    getSuggestions: (componentId: string) =>
        api.get(`/api/components/${componentId}/datasheet/suggestions`),
};

// AI-powered features
export const aiApi = {
    discoverComponents: (
        projectId: string,
        locationPreference?: string,
        numberOfComponents?: number
    ) =>
        api.post<{
            status: string;
            discovered_count: number;
            components: Component[];
        }>(
            `/api/projects/${projectId}/discover`,
            {
                ...(locationPreference
                    ? { location_preference: locationPreference }
                    : {}),
                ...(numberOfComponents
                    ? { number_of_components: numberOfComponents }
                    : {}),
            },
            { timeout: 180000 } // 3 minutes timeout for component discovery (AI calls can take time)
        ),
    scoreComponents: (projectId: string) =>
        api.post<{
            status: string;
            scores_created: number;
            scores_updated: number;
            total_scores: number;
        }>(
            `/api/projects/${projectId}/score`,
            {},
            { timeout: 300000 } // 5 minutes timeout for scoring (can take a while with many components/criteria)
        ),
    generateTradeStudyReport: (projectId: string) =>
        api.post<{
            status: string;
            report: string;
            generated_at?: string;
        }>(
            `/api/projects/${projectId}/generate-report`,
            {},
            { timeout: 300000 } // 5 minutes timeout for report generation (can take a while)
        ),
};

export const reportsApi = {
    getCurrent: (projectId: string) =>
        api.get<{
            report: string;
            generated_at?: string;
        }>(`/api/projects/${projectId}/report`),
    downloadPdf: (projectId: string) =>
        api.get(`/api/projects/${projectId}/report/pdf`, {
            responseType: "blob",
        }),
};

// Onboarding
export const onboardingApi = {
    getStatus: () => api.get<OnboardingStatusData>("/api/onboarding/status"),
    updateStatus: (status: string) =>
        api.post("/api/onboarding/status", { status }),
    uploadDocument: (docType: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("doc_type", docType);
        return api.post<UserDocument>("/api/onboarding/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    getDocuments: (docType?: string) =>
        api.get<UserDocument[]>("/api/onboarding/documents", {
            params: docType ? { doc_type: docType } : undefined,
        }),
    deleteDocument: (docId: string) =>
        api.delete(`/api/onboarding/documents/${docId}`),
};

// Suppliers
export interface SupplierStep {
    id: string;
    step_id: string;
    step_order: number;
    title: string;
    description?: string;
    completed: boolean;
    started_at?: string;
    completed_at?: string;
    material_name?: string;
    material_description?: string;
    material_mime_type?: string;
    material_original_filename?: string;
    material_size_bytes?: number;
    material_updated_at?: string;
    material_download_url?: string;
    material_share_url?: string;
    has_material?: boolean;
}

export interface Supplier {
    id: string;
    name: string;
    contact_name?: string;
    contact_email?: string;
    color: string;
    notes?: string;
    grade?: string;
    share_token?: string;
    created_at: string;
    updated_at: string;
    steps: SupplierStep[];
}

export interface SupplierCreate {
    name: string;
    contact_name?: string;
    contact_email?: string;
    color?: string;
    notes?: string;
}

export interface SupplierUpdate {
    name?: string;
    contact_name?: string;
    contact_email?: string;
    color?: string;
    notes?: string;
    grade?: string;
}

export interface StepToggle {
    step_id: string;
    completed: boolean;
    completed_at?: string;
    started_at?: string;
}

export interface ShareLinkResponse {
    share_token: string;
    share_url: string;
}

export const suppliersApi = {
    getAll: () => api.get<Supplier[]>("/api/suppliers"),
    getById: (id: string) => api.get<Supplier>(`/api/suppliers/${id}`),
    create: (supplier: SupplierCreate) =>
        api.post<Supplier>("/api/suppliers", supplier),
    update: (id: string, updates: SupplierUpdate) =>
        api.patch<Supplier>(`/api/suppliers/${id}`, updates),
    delete: (id: string) => api.delete(`/api/suppliers/${id}`),
    toggleStep: (supplierId: string, stepId: string, toggle: StepToggle) =>
        api.patch(`/api/suppliers/${supplierId}/steps/${stepId}`, toggle),
    generateShareLink: (supplierId: string) =>
        api.post<ShareLinkResponse>(`/api/suppliers/${supplierId}/share`),
    getSharedSupplier: (shareToken: string) =>
        api.get<Supplier>(`/api/suppliers/shared/${shareToken}`),
    uploadStepMaterial: (
        supplierId: string,
        stepId: string,
        file: File,
        options?: { name?: string; description?: string }
    ) => {
        const formData = new FormData();
        formData.append("file", file);
        if (options?.name) formData.append("name", options.name);
        if (options?.description !== undefined) {
            formData.append("description", options.description);
        }
        return api.post<SupplierStep>(
            `/api/suppliers/${supplierId}/steps/${stepId}/material`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
    },
    getStepMaterialUrl: (supplierId: string, stepId: string) =>
        `${API_BASE_URL || ""}/api/suppliers/${supplierId}/steps/${stepId}/material`,
    getSharedStepMaterialUrl: (shareToken: string, stepId: string) =>
        `${API_BASE_URL || ""}/api/suppliers/shared/${shareToken}/steps/${stepId}/material`,
};

export default api;
