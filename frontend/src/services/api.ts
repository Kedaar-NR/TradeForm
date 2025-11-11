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
        api.post<Project>('/api/projects', project),
    update: (id: string, updates: Partial<Project>) =>
        api.put<Project>(`/api/projects/${id}`, updates),
    delete: (id: string) => api.delete(`/api/projects/${id}`),
};

// Criteria
export const criteriaApi = {
    getByProject: (projectId: string) =>
        api.get<Criterion[]>(`/api/projects/${projectId}/criteria`),
    create: (projectId: string, criterion: Omit<Criterion, 'id' | 'projectId'>) =>
        api.post<Criterion>(`/api/projects/${projectId}/criteria`, criterion),
    update: (id: string, updates: Partial<Criterion>) =>
        api.put<Criterion>(`/api/criteria/${id}`, updates),
    delete: (id: string) => api.delete(`/api/criteria/${id}`),
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
};

export default api;

