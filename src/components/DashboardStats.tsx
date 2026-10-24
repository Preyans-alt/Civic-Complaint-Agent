import React from 'react';
import {
  FileText,
  Clock4,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { Complaint } from '../types';

interface DashboardStatsProps {
  complaints: Complaint[];
  onFilterClick?: (filterType: string, value: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ complaints, onFilterClick }) => {
  const total = complaints.length;
  const openComplaints = complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const highSeverity = complaints.filter(c => c.severity === 'high' || c.severity === 'critical').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Total Registered */}
      <div
        onClick={() => onFilterClick && onFilterClick('status', 'all')}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer group flex items-center justify-between"
      >
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Complaints
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
            {total}
          </span>
          <span className="text-[10px] text-slate-400">AMC Demo Sandbox</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      {/* 2. In Progress / Active */}
      <div
        onClick={() => onFilterClick && onFilterClick('status', 'Submitted')}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer group flex items-center justify-between"
      >
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Active Issues
          </span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
            {openComplaints}
          </span>
          <span className="text-[10px] text-amber-600/80 font-medium">Under remediation</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Clock4 className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Resolved */}
      <div
        onClick={() => onFilterClick && onFilterClick('status', 'Resolved')}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 transition-all cursor-pointer group flex items-center justify-between"
      >
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Resolved
          </span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {resolved}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Closed records</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* 4. High / Critical */}
      <div
        onClick={() => onFilterClick && onFilterClick('severity', 'high')}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-rose-400 dark:hover:border-rose-500 transition-all cursor-pointer group flex items-center justify-between"
      >
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Critical Severity
          </span>
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
            {highSeverity}
          </span>
          <span className="text-[10px] text-rose-600 font-medium">Priority dispatch</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <AlertOctagon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
