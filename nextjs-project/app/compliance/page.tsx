'use client';

import React, { useEffect, useState } from 'react';
import { Compliance, complianceAPI } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ComplianceForm from '@/components/ComplianceForm';
import { Plus, ShieldCheck, ShieldAlert, AlertTriangle, Info, RefreshCw, Filter } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function CompliancePage() {
  const [compliance, setCompliance] = useState<Compliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Compliance | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<{ status?: string; severity?: string }>({});

  const loadCompliance = async () => {
    setLoading(true);
    try {
      const data = await complianceAPI.getAll(filters);
      setCompliance(data || []);
    } catch (error) {
      console.error('Failed to load compliance records:', error);
      setCompliance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompliance();
  }, [filters]);

  const handleCreate = async (data: Partial<Compliance>) => {
    setSubmitting(true);
    try {
      await complianceAPI.create(data);
      await loadCompliance();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create compliance record:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: Partial<Compliance>) => {
    if (!editingItem) return;
    setSubmitting(true);
    try {
      await complianceAPI.update(editingItem.id, data);
      await loadCompliance();
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to update compliance record:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Audit Item',
      sortable: true,
      render: (c: Compliance) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-slate-100">{c.title}</span>
          <span className="text-xs text-slate-500 line-clamp-1">{c.description}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (c: Compliance) => (
        <div className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
          c.status === 'compliant' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
          c.status === 'non_compliant' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
          c.status === 'warning' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
          "bg-slate-500/10 text-slate-400 border border-slate-500/20"
        )}>
          {c.status === 'compliant' ? <ShieldCheck size={12} /> :
           c.status === 'non_compliant' ? <ShieldAlert size={12} /> :
           c.status === 'warning' ? <AlertTriangle size={12} /> : <Info size={12} />}
          {c.status.replace('_', ' ')}
        </div>
      )
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (c: Compliance) => (
        <span className={cn(
          "text-xs font-bold uppercase tracking-tighter",
          c.severity === 'critical' ? "text-rose-500" :
          c.severity === 'high' ? "text-orange-500" :
          c.severity === 'medium' ? "text-amber-500" : "text-emerald-500"
        )}>
          {c.severity}
        </span>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (c: Compliance) => (
        <span className="text-xs text-slate-400">{c.category}</span>
      )
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (c: Compliance) => (
        <span className="text-xs text-slate-500">
          {c.due_date ? formatDate(c.due_date) : 'N/A'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">Compliance & Audits</h2>
          <p className="text-sm text-slate-400">Monitor regulatory requirements and security standards.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadCompliance}
            className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400"
          >
            <Plus size={18} />
            Log Audit Item
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['compliant', 'non_compliant', 'warning', 'under_review'].map(status => (
          <button
            key={status}
            onClick={() => setFilters(f => ({ ...f, status: f.status === status ? undefined : status }))}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
              filters.status === status 
                ? "bg-cyan-500 border-cyan-400 text-slate-950" 
                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
            )}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      <DataTable
        data={compliance}
        columns={columns}
        onEdit={(c) => setEditingItem(c)}
        searchPlaceholder="Filter audits by title, description, or category..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Compliance Log"
      >
        <ComplianceForm onSubmit={handleCreate} isLoading={submitting} />
      </Modal>

      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Update Audit Record"
      >
        <ComplianceForm 
          initialData={editingItem || undefined} 
          onSubmit={handleUpdate} 
          isLoading={submitting} 
        />
      </Modal>
    </div>
  );
}
