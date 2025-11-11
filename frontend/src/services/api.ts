import axios from 'axios';
import { Project, Component, Criterion, Score } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            console.error('Network error - is the backend running?', API_BASE_URL);
        }
        return Promise.reject(error);
    }
);

// Projects
export const projectsApi = {
    getAll: () => api.get<Project[]>('/api/projects'),
    getById: (id: string) => api.get<Project>(`/api/projects/${id}`),
    create: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) =>
        api.post<Project>('/api/projects', {
            name: project.name,
            component_type: project.componentType,
            description: project.description,
            status: project.status
        }),
    update: (id: string, updates: Partial<Project>) =>
        api.put<Project>(`/api/projects/${id}`, {
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.componentType !== undefined && { component_type: updates.componentType }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.status !== undefined && { status: updates.status })
        }),
    delete: (id: string) => api.delete(`/api/projects/${id}`),
};

// Criteria
export const criteriaApi = {
    getByProject: (projectId: string) =>
        api.get<Criterion[]>(`/api/projects/${projectId}/criteria`),
    create: (projectId: string, criterion: Omit<Criterion, 'id' | 'projectId'>) =>
        api.post<Criterion>(`/api/projects/${projectId}/criteria`, {
            name: criterion.name,
            description: criterion.description,
            weight: criterion.weight,
            unit: criterion.unit,
            higher_is_better: criterion.higherIsBetter,
            minimum_requirement: criterion.minimumRequirement,
            maximum_requirement: criterion.maximumRequirement
        }),
    update: (id: string, updates: Partial<Criterion>) =>
        api.put<Criterion>(`/api/criteria/${id}`, {
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.weight !== undefined && { weight: updates.weight }),
            ...(updates.unit !== undefined && { unit: updates.unit }),
            ...(updates.higherIsBetter !== undefined && { higher_is_better: updates.higherIsBetter }),
            ...(updates.minimumRequirement !== undefined && { minimum_requirement: updates.minimumRequirement }),
            ...(updates.maximumRequirement !== undefined && { maximum_requirement: updates.maximumRequirement })
        }),
    delete: (id: string) => api.delete(`/api/criteria/${id}`),
    uploadExcel: (projectId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/api/projects/${projectId}/criteria/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    exportExcel: (projectId: string) =>
        api.get(`/api/projects/${projectId}/criteria/export`, { responseType: 'blob' }),
};

// Components
export const componentsApi = {
    getByProject: (projectId: string) =>
        api.get<Component[]>(`/api/projects/${projectId}/components`),
    create: (projectId: string, component: Omit<Component, 'id' | 'projectId'>) =>
        api.post<Component>(`/api/projects/${projectId}/components`, {
            manufacturer: component.manufacturer,
            part_number: component.partNumber,
            description: component.description,
            datasheet_url: component.datasheetUrl,
            availability: component.availability,
        }),
    update: (id: string, component: Partial<Omit<Component, 'id' | 'projectId'>>) =>
        api.put<Component>(`/api/components/${id}`, {
            manufacturer: component.manufacturer,
            part_number: component.partNumber,
            description: component.description,
            datasheet_url: component.datasheetUrl,
            availability: component.availability,
        }),
    delete: (id: string) => api.delete(`/api/components/${id}`),
    discover: (projectId: string) =>
        api.post<{ status: string; discovered_count: number; components: Component[] }>(
            `/api/projects/${projectId}/discover`
        ),
    uploadExcel: (projectId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/api/projects/${projectId}/components/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    exportExcel: (projectId: string) =>
        api.get(`/api/projects/${projectId}/components/export`, { responseType: 'blob' }),
    scoreAll: (projectId: string) =>
        api.post<{ status: string; scores_created: number; scores_updated: number }>(
            `/api/projects/${projectId}/score`
        ),
};

// Scores
export const scoresApi = {
    getByProject: (projectId: string) =>
        api.get<Score[]>(`/api/projects/${projectId}/scores`),
    create: (score: Omit<Score, 'id'>) =>
        api.post<Score>('/api/scores', score),
    update: (id: string, updates: Partial<Score>) =>
        api.put<Score>(`/api/scores/${id}`, updates),
};

// Results
export const resultsApi = {
    getByProject: (projectId: string) =>
        api.get(`/api/projects/${projectId}/results`),
    exportFullExcel: (projectId: string) =>
        api.get(`/api/projects/${projectId}/export/full`, { responseType: 'blob' }),
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
    create: (projectId: string, sharedWithUserId: string, permission: string = 'view') =>
        api.post(`/api/projects/${projectId}/shares`, { shared_with_user_id: sharedWithUserId, permission }),
};

export const commentsApi = {
    getByProject: (projectId: string) =>
        api.get(`/api/projects/${projectId}/comments`),
    create: (projectId: string, content: string, componentId?: string, criterionId?: string) =>
        api.post(`/api/projects/${projectId}/comments`, { content, component_id: componentId, criterion_id: criterionId }),
};

export const changesApi = {
    getByProject: (projectId: string) =>
        api.get(`/api/projects/${projectId}/changes`),
};

export default api;

