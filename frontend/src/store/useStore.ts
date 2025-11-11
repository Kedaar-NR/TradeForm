import { create } from 'zustand';
import { Project, Criterion, Component, Score, ProjectWithDetails } from '../types';

interface AppState {
  // Current project
  currentProject: ProjectWithDetails | null;
  setCurrentProject: (project: ProjectWithDetails | null) => void;

  // Projects list
  projects: Project[];
  setProjects: (projects: Project[]) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  error: string | null;
  setError: (error: string | null) => void;

  // Actions
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  currentProject: null,
  projects: [],
  isLoading: false,
  error: null,

  // Setters
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Actions
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  updateProject: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
    })),

  deleteProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
    })),
}));
