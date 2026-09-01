import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '../types';
import { api } from '../api/client';
import { wsClient } from '../api/ws';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  loading: boolean;
  selectProject: (project: Project) => void;
  refreshProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data);

      const savedId = localStorage.getItem('aaka_active_project_id');
      if (savedId && data.length > 0) {
        const found = data.find((p) => p.id === Number(savedId));
        if (found) {
          setActiveProject(found);
        } else {
          setActiveProject(data[0]);
        }
      } else if (data.length > 0) {
        setActiveProject(data[0]);
      } else {
        // If no projects exist, create default project
        const defaultProj = await api.createProject({
          name: 'Primary Security Assessment Scope',
          description: 'Default network reconnaissance and vulnerability intelligence workspace',
        });
        setProjects([defaultProj]);
        setActiveProject(defaultProj);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('aaka_active_project_id', String(activeProject.id));
      wsClient.connect(activeProject.id);
    }
  }, [activeProject]);

  const selectProject = (proj: Project) => {
    setActiveProject(proj);
  };

  const createProject = async (name: string, description?: string): Promise<Project> => {
    const newProj = await api.createProject({ name, description });
    await refreshProjects();
    setActiveProject(newProj);
    return newProj;
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        loading,
        selectProject,
        refreshProjects,
        createProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
  return ctx;
};
