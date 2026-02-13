'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, MonitorLog, monitorsAPI } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn, formatDate } from '@/lib/utils';
import { Activity, ArrowUp, ArrowDown, Clock } from 'lucide-react';

interface MonitorDetailsProps {
  monitor: Monitor;
}

export default function MonitorDetails({ monitor }: MonitorDetailsProps) {
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await monitorsAPI.getStats(monitor.id);
        // Reverse to show oldest to newest in graph
        setLogs((data || []).reverse());
      } catch (error) {
        console.error('Failed to load monitor stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [monitor.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Activity className="animate-spin text-slate-500" size={32} />
      </div>
    );
  }

  const chartData = logs.map(log => ({
    time: new Date(log.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    latency: log.latency,
    status: log.status
  }));

  const averageLatency = logs.length > 0 
    ? Math.round(logs.reduce((acc, log) => acc + log.latency, 0) / logs.length) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-900/50 p-4 border border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-500">Current Status</p>
          <div className="mt-1 flex items-center gap-2">
            {monitor.status === 'up' ? (
              <ArrowUp className="text-emerald-400" size={20} />
            ) : (
              <ArrowDown className="text-rose-400" size={20} />
            )}
            <span className={cn(
              "text-lg font-bold",
              monitor.status === 'up' ? "text-emerald-400" : "text-rose-400"
            )}>
              {monitor.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-slate-900/50 p-4 border border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-500">Avg Latency</p>
          <div className="mt-1 flex items-center gap-2">
            <Clock className="text-cyan-400" size={20} />
            <span className="text-lg font-bold text-slate-100">{averageLatency}ms</span>
          </div>
        </div>
        <div className="rounded-xl bg-slate-900/50 p-4 border border-slate-800">
          <p className="text-xs font-bold uppercase text-slate-500">Uptime</p>
          <div className="mt-1 flex items-center gap-2">
            <Activity className="text-indigo-400" size={20} />
            <span className="text-lg font-bold text-slate-100">{monitor.uptime}%</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <h3 className="mb-4 text-sm font-semibold text-slate-300">Latency History (Last 50 Checks)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              unit="ms"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem' }}
              itemStyle={{ color: '#e2e8f0' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Line 
              type="monotone" 
              dataKey="latency" 
              stroke="#06b6d4" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4, fill: '#22d3ee' }}
            />
            <ReferenceLine y={0} stroke="#334155" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Latency</th>
              <th className="px-4 py-3 font-medium">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/50">
            {[...logs].reverse().slice(0, 10).map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 text-slate-300">
                  {formatDate(log.checked_at)}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    log.status === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {log.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">{log.latency}ms</td>
                <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
