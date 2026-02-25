'use client';

import React, { useEffect, useState } from 'react';
import { licensesAPI, LicenseReport, UtilizationReport, VendorSpendReport, ExpiringLicenseReport } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, AlertTriangle, DollarSign, 
  BarChart3, PieChart, Activity, Users, RefreshCw, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LicenseReportsPage() {
  const [report, setReport] = useState<LicenseReport | null>(null);
  const [utilization, setUtilization] = useState<UtilizationReport[]>([]);
  const [vendorSpend, setVendorSpend] = useState<VendorSpendReport[]>([]);
  const [expiring, setExpiring] = useState<ExpiringLicenseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportData, utilData, spendData, expData] = await Promise.all([
        licensesAPI.getReport(),
        licensesAPI.getUtilization(),
        licensesAPI.getVendorSpend(selectedYear),
        licensesAPI.getExpiringReport(30)
      ]);
      setReport(reportData);
      setUtilization(utilData || []);
      setVendorSpend(spendData || []);
      setExpiring(expData || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const topUtilized = utilization.filter(l => l.status === 'active').slice(0, 5);
  const underUtilized = utilization.filter(l => l.utilization_percentage < 50 && l.status === 'active').slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-100">License Analytics</h2>
          <p className="text-sm text-slate-400">Usage metrics, cost analysis, and compliance overview.</p>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <BarChart3 size={20} />
            </div>
            <TrendingUp className="text-emerald-500" size={16} />
          </div>
          <p className="text-sm text-slate-400">Total Licenses</p>
          <p className="text-2xl font-bold text-slate-100">{report?.total_licenses || 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-500">{report?.active_licenses || 0} active</span>
          </div>
          <p className="text-sm text-slate-400">Active Licenses</p>
          <p className="text-2xl font-bold text-slate-100">{report?.active_licenses || 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-sm text-slate-400">Expiring Soon</p>
          <p className="text-2xl font-bold text-slate-100">{report?.expiring_licenses || 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <DollarSign size={20} />
            </div>
            <TrendingDown className="text-rose-500" size={16} />
          </div>
          <p className="text-sm text-slate-400">Annual Spend</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(report?.total_cost || 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top Utilized Licenses */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-100">Top Utilized Licenses</h3>
          <div className="space-y-4">
            {topUtilized.map((license) => (
              <div key={license.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">{license.product}</span>
                  <span className="text-sm font-mono text-slate-400">{Math.round(license.utilization_percentage)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, license.utilization_percentage)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      license.utilization_percentage > 90 ? "bg-rose-500" :
                      license.utilization_percentage > 70 ? "bg-amber-500" : "bg-cyan-500"
                    )}
                  />
                </div>
              </div>
            ))}
            {topUtilized.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">No active licenses</p>
            )}
          </div>
        </div>

        {/* Under-Utilized Licenses */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-100">Under-Utilized Licenses (&lt;50%)</h3>
          <div className="space-y-4">
            {underUtilized.map((license) => (
              <div key={license.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/30 p-3">
                <div>
                  <p className="font-medium text-slate-200">{license.product}</p>
                  <p className="text-xs text-slate-500">{license.seats_used} / {license.seats} seats used</p>
                </div>
                <span className="font-mono text-sm font-bold text-amber-500">
                  {Math.round(license.utilization_percentage)}%
                </span>
              </div>
            ))}
            {underUtilized.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">No under-utilized licenses</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Vendor Spend */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100">Vendor Spend ({selectedYear})</h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {vendorSpend.map((vendor, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{vendor.vendor}</p>
                    <p className="text-xs text-slate-500">{vendor.license_count} licenses</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-200">
                  {formatCurrency(vendor.total_cost)}
                </span>
              </div>
            ))}
            {vendorSpend.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">No vendor spend data</p>
            )}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100">Expiring Within 30 Days</h3>
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">{expiring.length} licenses</span>
            </div>
          </div>
          <div className="space-y-3">
            {expiring.slice(0, 5).map((license) => (
              <div key={license.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{license.product}</p>
                    <p className="text-xs text-slate-500">{license.vendor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-500">{license.days_until_expire} days</p>
                  <p className="text-xs text-slate-500">{formatCurrency(license.cost)}</p>
                </div>
              </div>
            ))}
            {expiring.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-4">No licenses expiring soon</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
