import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  Clock,
  Building,
  MapPin,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  BotMessageSquare,
  Share2
} from 'lucide-react';
import { Complaint, StatusHistoryItem } from '../types';
import { fetchComplaintByTrackingId, askAgent } from '../services/api';

interface TrackComplaintProps {
  initialTrackingId?: string;
  recentComplaints: Complaint[];
  onOpenShareModal: (complaint: Complaint) => void;
}

export const TrackComplaint: React.FC<TrackComplaintProps> = ({
  initialTrackingId = '',
  recentComplaints,
  onOpenShareModal
}) => {
  const [trackingInput, setTrackingInput] = useState(initialTrackingId);
  const [isLoading, setIsLoading] = useState(false);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Natural Language query state
  const [nlQuery, setNlQuery] = useState('');
  const [isNlLoading, setIsNlLoading] = useState(false);
  const [nlResponse, setNlResponse] = useState<string | null>(null);

  useEffect(() => {
    if (initialTrackingId) {
      setTrackingInput(initialTrackingId);
      performSearch(initialTrackingId);
    }
  }, [initialTrackingId]);

  const performSearch = async (idToSearch: string) => {
    const clean = idToSearch.trim();
    if (!clean) return;

    setIsLoading(true);
    setErrorMessage(null);
    setComplaint(null);
    setNlResponse(null);

    try {
      const result = await fetchComplaintByTrackingId(clean);
      setComplaint(result);
    } catch (err: any) {
      setErrorMessage(err.message || `No complaint found with ID '${clean}'.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(trackingInput);
  };

  const handleCopyId = () => {
    if (!complaint) return;
    navigator.clipboard.writeText(complaint.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAgent = async () => {
    if (!nlQuery.trim()) return;
    setIsNlLoading(true);
    try {
      const res = await askAgent(nlQuery);
      setNlResponse(res.reply);
      const match = nlQuery.match(/AMC-\d{4}-\d{6}/i);
      if (match) {
        performSearch(match[0].toUpperCase());
      }
    } catch (err: any) {
      setNlResponse(`Agent error: ${err.message}`);
    } finally {
      setIsNlLoading(false);
    }
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
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Search Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-4 transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Track AMC Complaint
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Check the live resolution status and field officer updates.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="Enter Tracking ID (e.g. AMC-2026-000123)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono text-xs sm:text-sm uppercase text-slate-900 dark:text-white placeholder:normal-case focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !trackingInput.trim()}
            className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Track</span>
          </button>
        </form>

        {/* Quick select chips */}
        <div>
          <span className="text-[11px] text-slate-400 font-medium block mb-1">Recent demo records:</span>
          <div className="flex flex-wrap gap-1.5">
            {recentComplaints.slice(0, 4).map((c) => (
              <button
                key={c.trackingId}
                type="button"
                onClick={() => {
                  setTrackingInput(c.trackingId);
                  performSearch(c.trackingId);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {c.trackingId} ({c.issue})
              </button>
            ))}
          </div>
        </div>

        {/* Natural Language Prompt */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="Or ask in plain English: 'What is status of AMC-2026-000124?'"
              onKeyDown={(e) => e.key === 'Enter' && handleAskAgent()}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAskAgent}
              disabled={isNlLoading || !nlQuery.trim()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 rounded-xl disabled:opacity-50 shrink-0"
            >
              {isNlLoading ? 'Checking...' : 'Ask AI'}
            </button>
          </div>

          {nlResponse && (
            <div className="mt-2.5 p-3 bg-indigo-50/60 dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
              <span className="font-bold text-indigo-900 dark:text-indigo-400 block mb-1">AI Assistant:</span>
              <p className="whitespace-pre-wrap">{nlResponse}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error / Not Found */}
      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 text-center text-xs text-rose-900 dark:text-rose-200 space-y-1.5">
          <AlertCircle className="w-7 h-7 text-rose-600 dark:text-rose-400 mx-auto" />
          <h4 className="font-bold text-sm">Complaint Not Found</h4>
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Complaint Result Card */}
      {complaint && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-5 animate-in fade-in transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Tracking Reference</span>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-white">{complaint.trackingId}</span>
                <button
                  onClick={handleCopyId}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Copy ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
              <button
                onClick={() => onOpenShareModal(complaint)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Category</span>
              <span className="font-bold text-slate-900 dark:text-white capitalize">{complaint.issue}</span>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Department</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">{complaint.department}</span>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Ward</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">{complaint.area} ({complaint.ward})</span>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] block">Filed</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {new Date(complaint.filedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description:</span>
            <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {complaint.description}
            </p>
          </div>

          {/* History Timeline */}
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2.5">Status History</span>
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
      )}
    </div>
  );
};
