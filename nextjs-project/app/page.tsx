'use client';

import React, { useEffect, useState } from 'react';
import { 
  Server, 
  ShieldCheck, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { complianceAPI, serversAPI, licensesAPI, ComplianceReport, Server as ServerType, License } from '@/lib/api';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';

export default function Dashboard() {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [servers, setServers] = useState<ServerType[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [reportData, serversData, licensesData] = await Promise.all([
          complianceAPI.getReport(),
          serversAPI.getAll(),
          licensesAPI.getAll()
        ]);
        setReport(reportData);
        setServers(serversData || []);
        setLicenses(licensesData || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setServers([]);
        setLicenses([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  const activeServers = (servers || []).filter(s => s.status === 'active').length;
  const totalCost = (licenses || []).reduce((acc, l) => acc + (l.cost || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-100">Executive Overview</h2>
        <p className="text-slate-400">System status and compliance health across all infrastructure.</p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Compliance Score"
          value={`${report?.compliance_percentage || 0}%`}
          icon={ShieldCheck}
          trend={{ value: 2.4, isUp: true }}
          color="emerald"
        />
        <StatCard
          title="Active Servers"
          value={activeServers}
          icon={Server}
          description={`Out of ${(servers || []).length} total nodes`}
          color="cyan"
        />
        <StatCard
          title="Annual License Spend"
          value={formatCurrency(totalCost)}
          icon={TrendingUp}
          trend={{ value: 12, isUp: false }}
          color="amber"
        />
        <StatCard
          title="Open Issues"
          value={report?.non_compliant_count || 0}
          icon={ShieldAlert}
          description="Action required"
          color="crimson"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Compliance Distribution */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-100">Compliance Health</h3>
            <button className="flex items-center gap-1 text-sm font-medium text-cyan-400 hover:underline">
              Full Report <ArrowUpRight size={16} />
            </button>
          </div>
          
          <div className="space-y-6">
            {Object.entries(report?.by_severity || {}).map(([severity, count]) => {
              const total = Object.values(report?.by_severity || {}).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={severity} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold uppercase tracking-widest text-slate-400">{severity}</span>
                    <span className="font-mono text-slate-200">{count} issues</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        severity === 'critical' ? "bg-rose-500" :
                        severity === 'high' ? "bg-orange-500" :
                        severity === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity / Quick Stats */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-100">System Vitality</h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">99.98%</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Uptime (24h)</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-100">Expiring Licenses</h3>
            <div className="space-y-4">
              {(licenses || []).slice(0, 3).map((license) => (
                <div key={license.id} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-200">{license.product}</p>
                    <p className="text-xs text-slate-500">{license.vendor}</p>
                  </div>
                  <div className={cn(
                    "rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-tighter",
                    license.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {license.status.replace('_', ' ')}
                  </div>
                </div>
              ))}
              {(licenses || []).length === 0 && <p className="text-sm text-slate-500">No licenses found.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
