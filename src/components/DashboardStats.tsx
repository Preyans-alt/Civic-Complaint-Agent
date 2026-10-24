import React from 'react';
import {
  FileText,
  Clock4,
  CheckCircle,
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
      {/* Total */}
      <div
        onClick={() => onFilterClick && onFilterClick('status', 'all')}
        className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Reports</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{total}</span>
          <span className="text-[10px] text-slate-400">AMC Demo</span>
        </div>
      </div>

      {/* Active */}
      <div
        onClick={() => onFilterClick && onFilterClick('status', 'Submitted')}
        className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock4 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{openComplaints}</span>
          <span className="text-[10px] text-amber-600/80 font-medium">In Action</span>
        </div>
      </div>

      {/* Resolved */}
      <div
        onClick={() => onFilterClick && onFilterClick('status', 'Resolved')}
        className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolved</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{resolved}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Fixed</span>
        </div>
      </div>

      {/* High Severity */}
      <div
        onClick={() => onFilterClick && onFilterClick('severity', 'high')}
        className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-rose-400 dark:hover:border-rose-500 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">{highSeverity}</span>
          <span className="text-[10px] text-rose-600 font-medium">Urgent</span>
        </div>
      </div>
    </div>
  );
};
