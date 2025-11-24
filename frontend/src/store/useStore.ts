import { create } from 'zustand';
import { Project, ProjectWithDetails, ProjectGroup } from '../types';

interface AppState {
  // Current project
  currentProject: ProjectWithDetails | null;
  setCurrentProject: (project: ProjectWithDetails | null) => void;

  // Projects list
  projects: Project[];
  setProjects: (projects: Project[]) => void;

  // Project groups
  projectGroups: ProjectGroup[];
  setProjectGroups: (projectGroups: ProjectGroup[]) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  error: string | null;
  setError: (error: string | null) => void;

  // Search state
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;

  // Project actions
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;

  // Project group actions
  addProjectGroup: (projectGroup: ProjectGroup) => void;
  updateProjectGroup: (projectGroupId: string, updates: Partial<ProjectGroup>) => void;
  deleteProjectGroup: (projectGroupId: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  currentProject: null,
  projects: [],
  projectGroups: [],
  isLoading: false,
  error: null,
  searchTerm: '',

  // Setters
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  setProjectGroups: (projectGroups) => set({ projectGroups }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),

  // Project actions
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

  // Project group actions
  addProjectGroup: (projectGroup) =>
    set((state) => ({ projectGroups: [...state.projectGroups, projectGroup] })),

  updateProjectGroup: (projectGroupId, updates) =>
    set((state) => ({
      projectGroups: state.projectGroups.map((pg) =>
        pg.id === projectGroupId ? { ...pg, ...updates } : pg
      ),
    })),

  deleteProjectGroup: (projectGroupId) =>
    set((state) => ({
      projectGroups: state.projectGroups.filter((pg) => pg.id !== projectGroupId),
    })),
}));
