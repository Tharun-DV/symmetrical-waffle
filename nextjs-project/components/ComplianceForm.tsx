'use client';

import React, { useState, useEffect } from 'react';
import { Compliance, Server, License, serversAPI, licensesAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ShieldAlert, FileText, ClipboardList, Target, User, AlertCircle } from 'lucide-react';

interface ComplianceFormProps {
  initialData?: Partial<Compliance>;
  onSubmit: (data: Partial<Compliance>) => Promise<void>;
  isLoading?: boolean;
}

export default function ComplianceForm({ initialData, onSubmit, isLoading }: ComplianceFormProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [formData, setFormData] = useState<Partial<Compliance>>(initialData || {
    status: 'under_review',
    severity: 'medium',
    category: 'Security',
  });

  useEffect(() => {
    Promise.all([
      serversAPI.getAll(),
      licensesAPI.getAll()
    ]).then(([s, l]) => {
      setServers(s || []);
      setLicenses(l || []);
    }).catch(error => {
      console.error('Failed to load form data:', error);
      setServers([]);
      setLicenses([]);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Format dates to RFC3339 for Go backend
    const dataToSubmit = { ...formData };
    const dateFields: (keyof Compliance)[] = ['due_date', 'last_audit_date', 'next_audit_date', 'resolved_date'];
    
    dateFields.forEach(field => {
      if (dataToSubmit[field] && typeof dataToSubmit[field] === 'string' && !dataToSubmit[field]?.includes('T')) {
        // @ts-ignore - dynamic key access
        dataToSubmit[field] = new Date(dataToSubmit[field] as string).toISOString();
      }
    });

    // Ensure foreign keys are numbers
    if (dataToSubmit.server_id) dataToSubmit.server_id = Number(dataToSubmit.server_id);
    if (dataToSubmit.license_id) dataToSubmit.license_id = Number(dataToSubmit.license_id);

    await onSubmit(dataToSubmit);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const inputClasses = "w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-200 outline-none ring-cyan-500/20 transition-all focus:border-cyan-500/50 focus:ring-4";
  const labelClasses = "mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className={labelClasses}>Audit Title</label>
        <div className="relative">
          <ShieldAlert className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            name="title"
            required
            className={cn(inputClasses, "pl-10")}
            placeholder="SSL Certificate Compliance Check"
            value={formData.title || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={labelClasses}>Status</label>
          <select
            name="status"
            className={inputClasses}
            value={formData.status}
            onChange={handleChange}
          >
            <option value="compliant">Compliant</option>
            <option value="non_compliant">Non-Compliant</option>
            <option value="warning">Warning</option>
            <option value="under_review">Under Review</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Severity</label>
          <select
            name="severity"
            className={inputClasses}
            value={formData.severity}
            onChange={handleChange}
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Category</label>
          <div className="relative">
            <ClipboardList className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="category"
              required
              className={cn(inputClasses, "pl-10")}
              placeholder="Security / Licensing / Privacy"
              value={formData.category || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Framework</label>
          <div className="relative">
            <Target className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="framework"
              className={cn(inputClasses, "pl-10")}
              placeholder="ISO 27001 / SOC2"
              value={formData.framework || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Related Server</label>
          <select
            name="server_id"
            className={inputClasses}
            value={formData.server_id || ''}
            onChange={handleChange}
          >
            <option value="">None</option>
            {(servers || []).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Assigned To</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="assigned_to"
              className={cn(inputClasses, "pl-10")}
              placeholder="Compliance Officer"
              value={formData.assigned_to || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Description</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-slate-500" size={18} />
          <textarea
            name="description"
            rows={3}
            required
            className={cn(inputClasses, "pl-10 resize-none")}
            placeholder="Details of the compliance requirement..."
            value={formData.description || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Remediation Steps</label>
        <div className="relative">
          <AlertCircle className="absolute left-3 top-3 text-slate-500" size={18} />
          <textarea
            name="remediation"
            rows={2}
            className={cn(inputClasses, "pl-10 resize-none")}
            placeholder="Steps to resolve non-compliance..."
            value={formData.remediation || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-800 pt-6">
        <button
          type="button"
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-cyan-500 px-8 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : initialData ? 'Update Record' : 'Log Compliance Item'}
        </button>
      </div>
    </form>
  );
}
