import React, { useState } from 'react';
import {
  X,
  Building,
  MapPin,
  Calendar,
  Copy,
  Check,
  Share2,
  Clock,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Complaint, StatusHistoryItem } from '../types';

interface ComplaintDetailsModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onOpenShareModal: (complaint: Complaint) => void;
}

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  complaint,
  onClose,
  onOpenShareModal
}) => {
  if (!complaint) return null;

  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(complaint.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Assigned': return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'In Progress': return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Resolved': return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Rejected': return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto transition-colors">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Complaint Details</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                {complaint.trackingId}
              </span>
              <button
                onClick={handleCopyId}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50"
                title="Copy ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(complaint.status)}`}>
              {complaint.status}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Main Info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-medium block mb-1">Issue Category</span>
              <span className="font-bold text-slate-900 dark:text-white capitalize text-sm">{complaint.issue}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-medium block mb-1">Responsible Department</span>
              <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white text-sm">
                <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{complaint.department}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-medium block mb-1">Ward & Area</span>
              <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="truncate">{complaint.area} ({complaint.ward})</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-medium block mb-1">Date Logged</span>
              <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{new Date(complaint.filedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description</span>
            <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {complaint.description}
            </p>
          </div>

          {/* Remediation Audit History */}
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">Remediation Status History</span>
            <div className="border-l-2 border-indigo-200 dark:border-indigo-800 ml-3 space-y-3 pl-3.5 py-1">
              {complaint.statusHistory?.map((item: StatusHistoryItem, idx: number) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-4 ring-white dark:ring-slate-900" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{item.status}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            onClick={() => onOpenShareModal(complaint)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Draft Social Post</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
