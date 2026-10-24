import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Search,
  RotateCcw,
  Building,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Complaint } from '../types';
import { SocialDraftModal } from './SocialDraftModal';

interface ComplaintReceiptProps {
  complaint: Complaint;
  onTrackThis: (trackingId: string) => void;
  onReset: () => void;
}

export const ComplaintReceipt: React.FC<ComplaintReceiptProps> = ({
  complaint,
  onTrackThis,
  onReset
}) => {
  const [copied, setCopied] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(complaint.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(complaint.filedAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Banner */}
      <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-md p-6 sm:p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Registered in Demo AMC Database
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">Grievance Registered Successfully</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Your complaint has been assigned a unique municipal tracking identifier and routed to the responsible department.
          </p>
        </div>

        {/* Prominent Tracking ID Box */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="text-left">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Official Tracking ID</span>
            <span className="text-2xl font-mono font-bold text-teal-400 tracking-wider">
              {complaint.trackingId}
            </span>
          </div>

          <button
            onClick={handleCopyId}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-teal-300" />}
            <span>{copied ? "Copied ID!" : "Copy Tracking ID"}</span>
          </button>
        </div>
      </div>

      {/* Structured Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Complaint Record Summary
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium">Issue Category</span>
            <p className="font-bold text-slate-900 capitalize text-sm">{complaint.issue}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium">Responsible Department</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>{complaint.department}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium">Municipal Ward & Zone</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>{complaint.ward} - {complaint.wardName} ({complaint.zone} Zone)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-medium">Filed Timestamp (IST)</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Area / Landmark</span>
          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {complaint.area} {complaint.landmark ? `(Landmark: ${complaint.landmark})` : ''}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-400 block mb-1">Description</span>
          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {complaint.description}
          </p>
        </div>

        {/* Status Timeline */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-900 block mb-3">Status History</span>
          <div className="border-l-2 border-indigo-200 ml-3 space-y-4 pl-4 py-1">
            {complaint.statusHistory.map((item, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900">{item.status}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Report Another Issue</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSocialModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Draft Social Post</span>
            </button>

            <button
              onClick={() => onTrackThis(complaint.trackingId)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-teal-400" />
              <span>Track Complaint</span>
            </button>
          </div>
        </div>
      </div>

      {showSocialModal && (
        <SocialDraftModal
          complaint={complaint}
          onClose={() => setShowSocialModal(false)}
        />
      )}
    </div>
  );
};
