'use client';

import React, { useEffect, useState } from 'react';
import { Server, serversAPI } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ServerForm from '@/components/ServerForm';
import LogViewer from '@/components/LogViewer';
import LXCManager from '@/components/LXCManager';
import ShellTerminal from '@/components/ShellTerminal';
import { Plus, Server as ServerIcon, Globe, Shield, RefreshCw, Terminal, Box, Command } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [loggingServer, setLoggingServer] = useState<Server | null>(null);
  const [managingLXC, setManagingLXC] = useState<Server | null>(null);
  const [shellServer, setShellServer] = useState<Server | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadServers = async () => {
    setLoading(true);
    try {
      const data = await serversAPI.getAll();
      setServers(data || []);
    } catch (error) {
      console.error('Failed to load servers:', error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServers();
  }, []);

  const handleCreate = async (data: Partial<Server>) => {
    setSubmitting(true);
    try {
      await serversAPI.create(data);
      await loadServers();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create server:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: Partial<Server>) => {
    if (!editingServer) return;
    setSubmitting(true);
    try {
      await serversAPI.update(editingServer.id, data);
      await loadServers();
      setEditingServer(null);
    } catch (error) {
      console.error('Failed to update server:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (server: Server) => {
    if (confirm(`Are you sure you want to delete ${server.name}?`)) {
      try {
        await serversAPI.delete(server.id);
        await loadServers();
      } catch (error) {
        console.error('Failed to delete server:', error);
      }
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Server Name',
      sortable: true,
      render: (s: Server) => (
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border",
            s.status === 'active' ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" :
            s.status === 'error' ? "border-rose-500/20 bg-rose-500/10 text-rose-400" :
            "border-slate-700 bg-slate-800 text-slate-400"
          )}>
            <ServerIcon size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-100">{s.name}</p>
            <p className="text-xs text-slate-500">{s.type.toUpperCase()}</p>
          </div>
        </div>
      )
    },
    {
      key: 'ip_address',
      header: 'Network Address',
      render: (s: Server) => (
        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <Globe size={14} className="text-slate-500" />
          {s.ip_address}:{s.port}
          {s.type === 'proxmox' && (
            <div className="flex items-center gap-1 ml-2">
              <button 
                onClick={() => setLoggingServer(s)}
                className="p-1 text-cyan-500 hover:bg-cyan-500/10 rounded transition-colors"
                title="View Live Logs"
              >
                <Terminal size={14} />
              </button>
              <button 
                onClick={() => setManagingLXC(s)}
                className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                title="Manage LXC Containers"
              >
                <Box size={14} />
              </button>
              <button 
                onClick={() => setShellServer(s)}
                className="p-1 text-amber-500 hover:bg-amber-500/10 rounded transition-colors"
                title="Node Shell Access"
              >
                <Command size={14} />
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (s: Server) => (
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            s.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
            s.status === 'error' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
            "bg-slate-500"
          )} />
          <span className={cn(
            "text-xs font-bold uppercase tracking-widest",
            s.status === 'active' ? "text-emerald-400" :
            s.status === 'error' ? "text-rose-400" :
            "text-slate-500"
          )}>
            {s.status}
          </span>
        </div>
      )
    },
    {
      key: 'last_sync',
      header: 'Last Sync',
      render: (s: Server) => (
        <span className="text-xs text-slate-500">
          {s.last_sync ? formatDate(s.last_sync) : 'Never'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">Infrastructure Nodes</h2>
          <p className="text-sm text-slate-400">Manage and monitor your physical and virtual servers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadServers}
            className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400"
          >
            <Plus size={18} />
            Add Server
          </button>
        </div>
      </div>

      <DataTable
        data={servers}
        columns={columns}
        onEdit={(s) => setEditingServer(s)}
        onDelete={handleDelete}
        searchPlaceholder="Filter servers by name, IP, or type..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Server"
      >
        <ServerForm onSubmit={handleCreate} isLoading={submitting} />
      </Modal>

      <Modal
        isOpen={!!editingServer}
        onClose={() => setEditingServer(null)}
        title="Edit Server Node"
      >
        <ServerForm 
          initialData={editingServer || undefined} 
          onSubmit={handleUpdate} 
          isLoading={submitting} 
        />
      </Modal>

      <Modal
        isOpen={!!loggingServer}
        onClose={() => setLoggingServer(null)}
        title={loggingServer ? `Node Analysis // ${loggingServer.name}` : "Log Viewer"}
        className="max-w-4xl"
      >
        {loggingServer && <LogViewer server={loggingServer} />}
      </Modal>

      <Modal
        isOpen={!!managingLXC}
        onClose={() => setManagingLXC(null)}
        title={managingLXC ? `Container Infrastructure // ${managingLXC.name}` : "LXC Management"}
        className="max-w-3xl"
      >
        {managingLXC && <LXCManager server={managingLXC} />}
      </Modal>

      <Modal
        isOpen={!!shellServer}
        onClose={() => setShellServer(null)}
        title={shellServer ? `Secure Shell Bridge // ${shellServer.name}` : "Remote Shell"}
        className="max-w-5xl"
      >
        {shellServer && <ShellTerminal server={shellServer} />}
      </Modal>
    </div>
  );
}
