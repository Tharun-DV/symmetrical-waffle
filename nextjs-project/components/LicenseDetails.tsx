'use client';

import React, { useState, useEffect } from 'react';
import { License, licensesAPI, LicenseComplianceRequirement, RenewalHistory } from '@/lib/api';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { 
  FileBadge, Users, Shield, RefreshCw, Plus, Calendar, DollarSign, 
  AlertTriangle, CheckCircle, Clock, X
} from 'lucide-react';

interface LicenseDetailsProps {
  license: License;
  onClose: () => void;
  onUpdate: () => void;
}

export default function LicenseDetails({ license, onClose, onUpdate }: LicenseDetailsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'compliance' | 'renewals'>('details');
  const [complianceRequirements, setComplianceRequirements] = useState<LicenseComplianceRequirement[]>([]);
  const [renewalHistory, setRenewalHistory] = useState<RenewalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddComplianceOpen, setIsAddComplianceOpen] = useState(false);
  const [isAddRenewalOpen, setIsAddRenewalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [license.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [complianceData, renewalData] = await Promise.all([
        licensesAPI.getComplianceRequirements(license.id),
        licensesAPI.getRenewalHistory(license.id)
      ]);
      setComplianceRequirements(complianceData || []);
      setRenewalHistory(renewalData || []);
    } catch (error) {
      console.error('Failed to load license details:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: FileBadge },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'renewals', label: 'Renewal History', icon: RefreshCw },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileBadge size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{license.product}</h2>
              <p className="text-sm text-slate-400">{license.vendor}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-b-2 border-cyan-500 text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-cyan-500" size={24} />
            </div>
          ) : (
            <>
              {activeTab === 'details' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">License Information</h3>
                    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">License Key</span>
                        <code className="font-mono text-sm text-slate-200">{license.license_key}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type</span>
                        <span className="text-slate-200 capitalize">{license.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Metric</span>
                        <span className="text-slate-200 capitalize">{license.license_metric || 'per_seat'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status</span>
                        <span className={cn(
                          "rounded px-2 py-0.5 text-xs font-bold uppercase",
                          license.status === 'active' ? "bg-emerald-500/10 text-emerald-500" :
                          license.status === 'expired' ? "bg-rose-500/10 text-rose-500" :
                          "bg-amber-500/10 text-amber-500"
                        )}>
                          {license.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Usage & Cost</h3>
                    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Seats</span>
                        <span className="text-slate-200">{license.seats_used} / {license.seats}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Utilization</span>
                        <span className="text-slate-200">
                          {license.seats > 0 ? Math.round((license.seats_used / license.seats) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Annual Cost</span>
                        <span className="font-mono font-bold text-slate-200">
                          {formatCurrency(license.cost, license.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Auto Renewal</span>
                        <span className="text-slate-200">{license.auto_renewal ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Dates</h3>
                    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Purchase Date</span>
                        <span className="text-slate-200">{formatDate(license.purchase_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expiration</span>
                        <span className={cn(
                          "text-slate-200",
                          license.status === 'expired' ? "text-rose-400" :
                          license.status === 'expiring_soon' ? "text-amber-400" : ""
                        )}>
                          {license.expiration_date ? formatDate(license.expiration_date) : 'Perpetual'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Renewal Date</span>
                        <span className="text-slate-200">
                          {license.renewal_date ? formatDate(license.renewal_date) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Support</h3>
                    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Support Contact</span>
                        <span className="text-slate-200">{license.support_contact || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">PO Number</span>
                        <span className="text-slate-200">{license.purchase_order_num || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'compliance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100">Compliance Requirements</h3>
                    <button
                      onClick={() => setIsAddComplianceOpen(true)}
                      className="flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400"
                    >
                      <Plus size={16} />
                      Add Requirement
                    </button>
                  </div>

                  {complianceRequirements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <Shield size={48} className="mb-4 opacity-50" />
                      <p>No compliance requirements defined.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {complianceRequirements.map((req) => (
                        <div key={req.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                          <div className="flex items-center gap-3">
                            {req.status === 'compliant' ? (
                              <CheckCircle className="text-emerald-500" size={20} />
                            ) : req.status === 'non_compliant' ? (
                              <AlertTriangle className="text-rose-500" size={20} />
                            ) : (
                              <Clock className="text-amber-500" size={20} />
                            )}
                            <div>
                              <p className="font-medium text-slate-100">{req.requirement}</p>
                              {req.description && <p className="text-sm text-slate-500">{req.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {req.due_date && (
                              <span className="text-sm text-slate-400">Due: {formatDate(req.due_date)}</span>
                            )}
                            <span className={cn(
                              "rounded px-2 py-1 text-xs font-bold uppercase",
                              req.status === 'compliant' ? "bg-emerald-500/10 text-emerald-500" :
                              req.status === 'non_compliant' ? "bg-rose-500/10 text-rose-500" :
                              "bg-amber-500/10 text-amber-500"
                            )}>
                              {req.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'renewals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100">Renewal History</h3>
                    <button
                      onClick={() => setIsAddRenewalOpen(true)}
                      className="flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400"
                    >
                      <Plus size={16} />
                      Record Renewal
                    </button>
                  </div>

                  {renewalHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <RefreshCw size={48} className="mb-4 opacity-50" />
                      <p>No renewal history recorded.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {renewalHistory.map((renewal) => (
                        <div key={renewal.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                              <Calendar size={20} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-100">Renewed on {formatDate(renewal.renewal_date)}</p>
                              {renewal.renewed_by && <p className="text-sm text-slate-500">By: {renewal.renewed_by}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-slate-200">
                              {formatCurrency(renewal.cost, renewal.currency)}
                            </p>
                            {renewal.new_expiration && (
                              <p className="text-sm text-slate-500">Expires: {formatDate(renewal.new_expiration)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
