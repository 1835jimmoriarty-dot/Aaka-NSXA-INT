import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { api } from '../api/client';
import { FolderKanban, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProjectsPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { projects, activeProject, selectProject, refreshProjects, createProject, loading } = useProject();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await createProject(name.trim(), description.trim());
      setName('');
      setDescription('');
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to permanently delete this project and all associated scan intelligence?')) {
      await api.deleteProject(id);
      await refreshProjects();
    }
  };

  if (loading) return <LoadingSpinner text="Loading projects workspace..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#282245]">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F3FF] tracking-tight">Project Management</h1>
          <p className="text-xs text-[#A8A3B8] mt-0.5">Organize target scopes, reconnaissance missions, and scan histories</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Assessment Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => {
          const isActive = activeProject?.id === p.id;
          return (
            <div
              key={p.id}
              className={`cyber-panel p-6 flex flex-col justify-between relative transition-all ${
                isActive ? 'border-[#7C3AED] ring-1 ring-[#9B5CFF] shadow-glow-purple' : 'hover:border-[#7C3AED]/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[#18142A] border border-[#282245] text-[#9B5CFF]">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#F5F3FF] leading-snug">{p.name}</h3>
                      <span className="text-[10px] text-[#A8A3B8] font-mono">ID: #{p.id}</span>
                    </div>
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/50 text-purple-300 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#A8A3B8] mt-3 line-clamp-2">
                  {p.description || 'No description provided for this assessment scope.'}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#282245] text-center">
                  <div className="p-2 rounded-lg bg-[#18142A]">
                    <div className="text-sm font-bold text-[#F5F3FF] font-mono">{p.host_count}</div>
                    <div className="text-[10px] text-[#A8A3B8]">Hosts</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18142A]">
                    <div className="text-sm font-bold text-blue-400 font-mono">{p.port_count}</div>
                    <div className="text-[10px] text-[#A8A3B8]">Ports</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#18142A]">
                    <div className="text-sm font-bold text-red-400 font-mono">{p.vuln_count}</div>
                    <div className="text-[10px] text-[#A8A3B8]">Findings</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#282245] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-[#A8A3B8]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(p.updated_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <button
                      onClick={() => selectProject(p)}
                      className="px-3 py-1 rounded-lg bg-[#18142A] hover:bg-[#7C3AED] text-[#F5F3FF] text-xs font-semibold border border-[#282245] transition-colors"
                    >
                      Select Scope
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg hover:bg-red-950/60 text-[#A8A3B8] hover:text-red-400 border border-transparent hover:border-red-800/40 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121022] border border-[#7C3AED]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-[#F5F3FF] mb-1">Create Assessment Project</h3>
            <p className="text-xs text-[#A8A3B8] mb-4">Define a new network scope and workspace for scans and reports.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A8A3B8] mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Perimeter Infrastructure Audit"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#080611] border border-[#282245] text-xs text-[#F5F3FF] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A8A3B8] mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Scope boundaries or engagement goals..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#080611] border border-[#282245] text-xs text-[#F5F3FF] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#18142A] hover:bg-[#282245] text-[#A8A3B8] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#9B5CFF] text-white text-xs font-semibold shadow-glow-purple transition-all"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
