'use client';

import React, { useState, useEffect } from 'react';
import { License, Server, serversAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { FileBadge, Tag, Hash, Calendar, DollarSign, Users } from 'lucide-react';

interface LicenseFormProps {
  initialData?: Partial<License>;
  onSubmit: (data: Partial<License>) => Promise<void>;
  isLoading?: boolean;
}

export default function LicenseForm({ initialData, onSubmit, isLoading }: LicenseFormProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [formData, setFormData] = useState<Partial<License>>(initialData || {
    type: 'subscription',
    status: 'active',
    seats: 1,
    seats_used: 0,
    currency: 'USD',
  });

  useEffect(() => {
    serversAPI.getAll()
      .then(data => setServers(data || []))
      .catch(error => {
        console.error('Failed to load servers:', error);
        setServers([]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format dates to RFC3339 for Go backend
    const dataToSubmit = { ...formData };
    if (dataToSubmit.purchase_date && !dataToSubmit.purchase_date.includes('T')) {
      dataToSubmit.purchase_date = new Date(dataToSubmit.purchase_date).toISOString();
    }
    if (dataToSubmit.expiration_date && !dataToSubmit.expiration_date.includes('T')) {
      dataToSubmit.expiration_date = new Date(dataToSubmit.expiration_date).toISOString();
    }
    if (dataToSubmit.renewal_date && !dataToSubmit.renewal_date.includes('T')) {
      dataToSubmit.renewal_date = new Date(dataToSubmit.renewal_date).toISOString();
    }

    // Ensure server_id is a number
    if (dataToSubmit.server_id) {
      dataToSubmit.server_id = Number(dataToSubmit.server_id);
    }

    await onSubmit(dataToSubmit);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const inputClasses = "w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-200 outline-none ring-cyan-500/20 transition-all focus:border-cyan-500/50 focus:ring-4";
  const labelClasses = "mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={labelClasses}>License Name</label>
          <div className="relative">
            <FileBadge className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="name"
              required
              className={cn(inputClasses, "pl-10")}
              placeholder="Enterprise Suite 2026"
              value={formData.name || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Product</label>
          <div className="relative">
            <Tag className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="product"
              required
              className={cn(inputClasses, "pl-10")}
              placeholder="vSphere Enterprise"
              value={formData.product || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Assigned Server</label>
          <select
            name="server_id"
            required
            className={inputClasses}
            value={formData.server_id || ''}
            onChange={handleChange}
          >
            <option value="">Select a server</option>
            {(servers || []).map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.ip_address})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>License Type</label>
          <select
            name="type"
            className={inputClasses}
            value={formData.type}
            onChange={handleChange}
          >
            <option value="perpetual">Perpetual</option>
            <option value="subscription">Subscription</option>
            <option value="trial">Trial</option>
            <option value="open_source">Open Source</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>License Key</label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="license_key"
              required
              className={cn(inputClasses, "pl-10 font-mono text-sm")}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              value={formData.license_key || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClasses}>Seats</label>
            <div className="relative">
              <Users className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                name="seats"
                type="number"
                required
                className={cn(inputClasses, "pl-10")}
                value={formData.seats || 0}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelClasses}>Seats Used</label>
            <input
              name="seats_used"
              type="number"
              className={inputClasses}
              value={formData.seats_used || 0}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Cost ({formData.currency})</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="cost"
              type="number"
              step="0.01"
              required
              className={cn(inputClasses, "pl-10")}
              value={formData.cost || 0}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClasses}>Expiration Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              name="expiration_date"
              type="date"
              className={cn(inputClasses, "pl-10")}
              value={formData.expiration_date?.split('T')[0] || ''}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClasses}>Notes</label>
        <textarea
          name="notes"
          rows={3}
          className={cn(inputClasses, "resize-none")}
          placeholder="Acquired via Q3 budget..."
          value={formData.notes || ''}
          onChange={handleChange}
        />
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
          {isLoading ? 'Processing...' : initialData ? 'Update License' : 'Register License'}
        </button>
      </div>
    </form>
  );
}
