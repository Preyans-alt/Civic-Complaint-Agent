import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Complaint } from '../types';

interface SocialDraftModalProps {
  complaint: Complaint;
  onClose: () => void;
}

export const SocialDraftModal: React.FC<SocialDraftModalProps> = ({ complaint, onClose }) => {
  const [copied, setCopied] = useState(false);

  const issueTitles: Record<string, string> = {
    pothole: 'Hazardous Pothole / Damaged Road',
    garbage: 'Waste Accumulation / Overflowing Bin',
    streetlight: 'Streetlight Outage / Malfunction',
    waterlogging: 'Severe Waterlogging / Blocked Drain'
  };

  const initialDraft = `📢 Civic Grievance Logged with @AmdavadAMC Demo System

📍 Location: ${complaint.area}, Ward ${complaint.ward} (${complaint.wardName}, ${complaint.zone} Zone)
⚠️ Issue: ${issueTitles[complaint.issue] || complaint.issue.toUpperCase()}
🏢 Department: ${complaint.department}
🔖 Tracking ID: #${complaint.trackingId}
📊 Status: ${complaint.status} (Filed: ${new Date(complaint.filedAt).toLocaleDateString()})
📝 Description: "${complaint.description}"

Track progress live on CivicFlow AI portal. #Ahmedabad #AhmedabadCivic #AmdavadAMC #SmartCityAhmedabad`;

  const [draftText, setDraftText] = useState(initialDraft);

  const handleCopy = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in transition-colors">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Draft Social Post</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Copy and post to Twitter (X) or WhatsApp to raise community awareness.
          </p>

          <textarea
            rows={7}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>

            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Post Text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
