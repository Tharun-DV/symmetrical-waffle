'use client';

import React, { useEffect, useState } from 'react';
import { infrastructureAPI, InfrastructureNode } from '@/lib/api';
import { HardDrive, Cpu, Monitor, Box, RefreshCw, Activity } from 'lucide-react';
import { cn, formatBytes, formatUptime } from '@/lib/utils';

export default function InfrastructurePage() {
  const [nodes, setNodes] = useState<InfrastructureNode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNodes = async () => {
    setLoading(true);
    try {
      const data = await infrastructureAPI.getNodes();
      setNodes(data || []);
    } catch (error) {
      console.error('Failed to load infrastructure nodes:', error);
      setNodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNodes();
    const interval = setInterval(loadNodes, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">Infrastructure Nodes</h2>
          <p className="text-sm text-slate-400">Real-time monitoring of Proxmox infrastructure.</p>
        </div>
        <button 
          onClick={loadNodes}
          className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all"
        >
          <RefreshCw size={20} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      {loading && nodes.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Activity className="animate-spin text-cyan-400" size={32} />
        </div>
      ) : nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-12 text-center">
          <HardDrive size={48} className="mb-4 text-slate-700" />
          <h3 className="text-lg font-bold text-slate-300">No Infrastructure Nodes Found</h3>
          <p className="text-slate-500">Add a Proxmox server to start monitoring infrastructure.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {nodes.map((node, index) => (
            <div 
              key={`${node.server_name}-${node.node_name}-${index}`}
              className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-slate-700"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl border transition-colors",
                    node.node_status === 'online' 
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                  )}>
                    <HardDrive size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">{node.node_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="uppercase">{node.server_name}</span>
                    </div>
                  </div>
                </div>
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                  node.node_status === 'online' 
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                )}>
                  {node.node_status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Cpu size={14} />
                      CPU Usage
                    </span>
                    <span className="font-mono text-slate-100">{node.cpu.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        node.cpu < 50 ? "bg-emerald-500" : node.cpu < 80 ? "bg-amber-500" : "bg-rose-500"
                      )}
                      style={{ width: `${Math.min(node.cpu, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Monitor size={14} />
                      Memory Usage
                    </span>
                    <span className="font-mono text-slate-100">{node.memory_percent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        node.memory_percent < 50 ? "bg-indigo-500" : node.memory_percent < 80 ? "bg-amber-500" : "bg-rose-500"
                      )}
                      style={{ width: `${Math.min(node.memory_percent, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 text-right">
                    {formatBytes(node.memory)} / {formatBytes(node.max_memory)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Box size={14} className="text-cyan-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">VMs</span>
                    </div>
                    <div className="font-mono text-lg font-bold text-slate-100">
                      {node.running_vms}<span className="text-slate-500 text-xs">/{node.vm_count}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Monitor size={14} className="text-indigo-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">LXCs</span>
                    </div>
                    <div className="font-mono text-lg font-bold text-slate-100">
                      {node.running_lxcs}<span className="text-slate-500 text-xs">/{node.lxc_count}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Activity size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Uptime</span>
                    </div>
                    <div className="font-mono text-sm font-medium text-slate-300">
                      {formatUptime(node.uptime)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2">
                  <span className="font-mono">{node.ip_address}</span>
                  <span className="text-slate-700">•</span>
                  <span className="uppercase">{node.server_type}</span>
                </div>
              </div>

              <div className={cn(
                "absolute bottom-0 left-0 h-1 w-full transition-colors",
                node.node_status === 'online' ? "bg-emerald-500" : "bg-rose-500"
              )} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}