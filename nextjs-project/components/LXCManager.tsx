'use client';

import React, { useEffect, useState } from 'react';
import { Server, LXC, serversAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Play, Square, Trash2, Plus, RefreshCw, Box, Cpu, HardDrive } from 'lucide-react';

interface LXCManagerProps {
  server: Server;
}

export default function LXCManager({ server }: LXCManagerProps) {
  const [lxcs, setLxcs] = useState<LXC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newContainer, setNewContainer] = useState({
    vmid: 100,
    ostemplate: 'local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst',
    storage: 'local-lvm',
    hostname: 'new-container',
    password: 'password123',
    memory: 512,
    cores: 1
  });

  const fetchLXCs = async () => {
    setLoading(true);
    try {
      const data = await serversAPI.getLXCs(server.id);
      setLxcs(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch LXCs:', err);
      setError(err.message || 'Failed to connect to node');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLXCs();
  }, [server.id]);

  const handleAction = async (vmid: number, action: 'start' | 'stop' | 'remove') => {
    try {
      await serversAPI.manageLXC(server.id, vmid, action);
      await fetchLXCs();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await serversAPI.createLXC(server.id, {
        vmid: newContainer.vmid,
        ostemplate: newContainer.ostemplate,
        storage: newContainer.storage,
        params: {
          hostname: newContainer.hostname,
          password: newContainer.password,
          memory: newContainer.memory.toString(),
          cores: newContainer.cores.toString(),
          net0: 'name=eth0,bridge=vmbr0,ip=dhcp'
        }
      });
      setIsCreating(false);
      await fetchLXCs();
    } catch (err: any) {
      alert(`Creation failed: ${err.message}`);
    }
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="text-cyan-400" size={20} />
          <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">LXC Container Management</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchLXCs}
            className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all"
          >
            <Plus size={14} /> NEW_CONTAINER
          </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">VMID</label>
              <input 
                type="number" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-cyan-500/50 outline-none"
                value={newContainer.vmid}
                onChange={e => setNewContainer({...newContainer, vmid: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Hostname</label>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-cyan-500/50 outline-none"
                value={newContainer.hostname}
                onChange={e => setNewContainer({...newContainer, hostname: e.target.value})}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Template Path</label>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-sm focus:border-cyan-500/50 outline-none"
                value={newContainer.ostemplate}
                onChange={e => setNewContainer({...newContainer, ostemplate: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsCreating(false)} className="text-xs text-slate-500 font-bold uppercase hover:text-slate-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold uppercase hover:bg-cyan-400 transition-all">Provision Container</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {lxcs.map(lxc => (
          <div key={lxc.vmid} className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 flex items-center justify-between group hover:border-slate-700 transition-all">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center border",
                lxc.status === 'running' ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-slate-700 bg-slate-800 text-slate-500"
              )}>
                <Box size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-500">[{lxc.vmid}]</span>
                  <h4 className="font-bold text-slate-100">{lxc.name}</h4>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Cpu size={10} /> {lxc.cpus} CORES
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <HardDrive size={10} /> {formatSize(lxc.maxmem)} RAM
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 mr-4">
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  lxc.status === 'running' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-600"
                )} />
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  lxc.status === 'running' ? "text-emerald-400" : "text-slate-500"
                )}>{lxc.status}</span>
              </div>

              {lxc.status === 'stopped' ? (
                <button 
                  onClick={() => handleAction(lxc.vmid, 'start')}
                  className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                  title="Start Container"
                >
                  <Play size={18} />
                </button>
              ) : (
                <button 
                  onClick={() => handleAction(lxc.vmid, 'stop')}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                  title="Stop Container"
                >
                  <Square size={18} />
                </button>
              )}
              
              <button 
                onClick={() => handleAction(lxc.vmid, 'remove')}
                className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                title="Remove Container"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {lxcs.length === 0 && !loading && (
          <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl">
            <Box className="mx-auto text-slate-800 mb-3" size={32} />
            <p className="text-slate-500 text-sm font-mono">NO_LXC_CONTAINERS_DETECTED</p>
          </div>
        )}
      </div>
    </div>
  );
}
