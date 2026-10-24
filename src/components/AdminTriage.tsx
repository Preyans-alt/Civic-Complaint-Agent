import React, { useState } from 'react';
import {
  ShieldAlert,
  Key,
  CheckCircle,
  Building,
  RefreshCw,
  AlertTriangle,
  History
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import { updateComplaintStatus } from '../services/api';

interface AdminTriageProps {
  complaints: Complaint[];
  onRefresh: () => void;
}

export const AdminTriage: React.FC<AdminTriageProps> = ({ complaints, onRefresh }) => {
  const [adminToken, setAdminToken] = useState('civicflow-demo-admin-secret');
  const [selectedId, setSelectedId] = useState(complaints[0]?.trackingId || '');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [remediationNote, setRemediationNote] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedComplaint = complaints.find(c => c.trackingId === selectedId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await updateComplaintStatus(
        selectedId,
        newStatus,
        remediationNote.trim() || `Remediation status updated to ${newStatus}.`,
        adminToken
      );
      setFeedback({
        type: 'success',
        message: `Successfully transitioned ${selectedId} to ${newStatus}. Audit history preserved.`
      });
      setRemediationNote('');
      onRefresh();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update complaint status.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-5 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>AMC Officer Console</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Complaint Lifecycle Triage
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simulate municipal officer status transitions (Submitted &rarr; Assigned &rarr; In Progress &rarr; Resolved).
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Select Tracking ID
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full p-2.5 font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                {complaints.map((c) => (
                  <option key={c.trackingId} value={c.trackingId}>
                    {c.trackingId} — {c.issue.toUpperCase()} ({c.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <option value="Submitted">Submitted</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Field Update Note
            </label>
            <textarea
              rows={2}
              value={remediationNote}
              onChange={(e) => setRemediationNote(e.target.value)}
              placeholder="e.g. Dispatched asphalt maintenance team; pothole filled."
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">Demo token: civicflow-demo-admin-secret</span>
            <button
              type="submit"
              disabled={isSubmitting || !selectedId}
              className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Status</span>
            </button>
          </div>
        </form>

        {/* History trail */}
        {selectedComplaint && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Audit Trail for {selectedComplaint.trackingId}
            </span>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              {selectedComplaint.statusHistory.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between py-1 border-b border-slate-200 dark:border-slate-700 last:border-0">
                  <div>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.status}</span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">{item.note}</p>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
