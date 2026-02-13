'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, monitorsAPI } from '@/lib/api';
import MonitorForm from '@/components/MonitorForm';
import MonitorDetails from '@/components/MonitorDetails';
import Modal from '@/components/Modal';
import { Plus, Activity, RefreshCw, Trash2, Globe, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MonitoringPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadMonitors = async () => {
    setLoading(true);
    try {
      const data = await monitorsAPI.getAll();
      setMonitors(data || []);
    } catch (error) {
      console.error('Failed to load monitors:', error);
      setMonitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitors();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMonitors, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (data: Partial<Monitor>) => {
    setSubmitting(true);
    try {
      await monitorsAPI.create(data);
      await loadMonitors();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create monitor:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this monitor?')) {
      try {
        await monitorsAPI.delete(id);
        await loadMonitors();
      } catch (error) {
        console.error('Failed to delete monitor:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">Uptime Monitoring</h2>
          <p className="text-sm text-slate-400">Real-time availability tracking for services and infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadMonitors}
            className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400"
          >
            <Plus size={18} />
            Add Monitor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {monitors.map((monitor) => (
          <div 
            key={monitor.id} 
            onClick={() => setSelectedMonitor(monitor)}
            className="relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-slate-700 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border",
                  monitor.status === 'up' ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" :
                  monitor.status === 'down' ? "border-rose-500/20 bg-rose-500/10 text-rose-400" :
                  "border-slate-700 bg-slate-800 text-slate-400"
                )}>
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">{monitor.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="uppercase">{monitor.type}</span>
                    <span>•</span>
                    <span>{monitor.interval}s</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, monitor.id)}
                className="text-slate-600 hover:text-rose-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Globe size={16} className="text-slate-500" />
                <span className="truncate">{monitor.target}</span>
              </div>
              
              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Latency</span>
                  <span className={cn(
                    "font-mono text-lg font-bold",
                    monitor.latency < 200 ? "text-emerald-400" : 
                    monitor.latency < 500 ? "text-amber-400" : "text-rose-400"
                  )}>
                    {monitor.latency}ms
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Uptime</span>
                  <span className="font-mono text-lg font-bold text-slate-100">
                    {monitor.uptime}%
                  </span>
                </div>
              </div>
            </div>

            <div className={cn(
              "absolute bottom-0 left-0 h-1 w-full",
              monitor.status === 'up' ? "bg-emerald-500" :
              monitor.status === 'down' ? "bg-rose-500" : "bg-slate-700"
            )} />
          </div>
        ))}
        
        {monitors.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-12 text-center">
            <Activity size={48} className="mb-4 text-slate-700" />
            <h3 className="text-lg font-bold text-slate-300">No Monitors Configured</h3>
            <p className="text-slate-500">Add a new monitor to start tracking uptime.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Monitor"
      >
        <MonitorForm onSubmit={handleCreate} isLoading={submitting} />
      </Modal>

      <Modal
        isOpen={!!selectedMonitor}
        onClose={() => setSelectedMonitor(null)}
        title={selectedMonitor?.name || "Monitor Details"}
        className="max-w-4xl"
      >
        {selectedMonitor && <MonitorDetails monitor={selectedMonitor} />}
      </Modal>
    </div>
  );
}
