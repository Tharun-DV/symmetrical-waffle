'use client';

import React, { useEffect, useState } from 'react';
import { License, licensesAPI } from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import LicenseForm from '@/components/LicenseForm';
import { Plus, FileBadge, Hash, Users, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/lib/utils';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const data = await licensesAPI.getAll();
      setLicenses(data || []);
    } catch (error) {
      console.error('Failed to load licenses:', error);
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, []);

  const handleCreate = async (data: Partial<License>) => {
    setSubmitting(true);
    try {
      await licensesAPI.create(data);
      await loadLicenses();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create license:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: Partial<License>) => {
    if (!editingLicense) return;
    setSubmitting(true);
    try {
      await licensesAPI.update(editingLicense.id, data);
      await loadLicenses();
      setEditingLicense(null);
    } catch (error) {
      console.error('Failed to update license:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (license: License) => {
    if (confirm(`Are you sure you want to delete ${license.name}?`)) {
      try {
        await licensesAPI.delete(license.id);
        await loadLicenses();
      } catch (error) {
        console.error('Failed to delete license:', error);
      }
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product / Vendor',
      sortable: true,
      render: (l: License) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileBadge size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-100">{l.product}</p>
            <p className="text-xs text-slate-500">{l.vendor}</p>
          </div>
        </div>
      )
    },
    {
      key: 'license_key',
      header: 'License Key',
      render: (l: License) => (
        <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-300">
          {l.license_key.substring(0, 10)}...
        </code>
      )
    },
    {
      key: 'seats',
      header: 'Utilization',
      render: (l: License) => {
        const percentage = (l.seats_used / l.seats) * 100;
        return (
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-slate-500">
              <span>{l.seats_used} / {l.seats}</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  percentage > 90 ? "bg-rose-500" : percentage > 70 ? "bg-amber-500" : "bg-cyan-500"
                )} 
                style={{ width: `${Math.min(100, percentage)}%` }} 
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'expiration_date',
      header: 'Expiration',
      sortable: true,
      render: (l: License) => (
        <div className="flex flex-col">
          <span className={cn(
            "text-xs font-medium",
            l.status === 'expired' ? "text-rose-400" : 
            l.status === 'expiring_soon' ? "text-amber-400" : "text-slate-300"
          )}>
            {l.expiration_date ? formatDate(l.expiration_date) : 'Perpetual'}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">{l.status.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      key: 'cost',
      header: 'Annual Cost',
      sortable: true,
      render: (l: License) => (
        <span className="font-mono text-xs font-bold text-slate-200">
          {formatCurrency(l.cost, l.currency)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">License Inventory</h2>
          <p className="text-sm text-slate-400">Track software entitlements and seat utilization.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadLicenses}
            className="rounded-xl border border-slate-800 p-2.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-all"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 hover:bg-cyan-400"
          >
            <Plus size={18} />
            Register License
          </button>
        </div>
      </div>

      <DataTable
        data={licenses}
        columns={columns}
        onEdit={(l) => setEditingLicense(l)}
        onDelete={handleDelete}
        searchPlaceholder="Filter by product, vendor, or key..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New License Registration"
      >
        <LicenseForm onSubmit={handleCreate} isLoading={submitting} />
      </Modal>

      <Modal
        isOpen={!!editingLicense}
        onClose={() => setEditingLicense(null)}
        title="Modify License Record"
      >
        <LicenseForm 
          initialData={editingLicense || undefined} 
          onSubmit={handleUpdate} 
          isLoading={submitting} 
        />
      </Modal>
    </div>
  );
}
