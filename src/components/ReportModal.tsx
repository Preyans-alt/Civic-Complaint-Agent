import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Building,
  MapPin,
  Clock,
  Sparkles,
  Copy,
  Check,
  Share2,
  Edit2,
  Send,
  Loader2,
  ArrowRight
} from 'lucide-react';
import {
  AnalysisResult,
  CivicIssueType,
  Complaint,
  ComplaintSeverity,
  DuplicateCandidate,
  ExecutionStep,
  Ward
} from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult | null;
  area: string;
  landmark: string;
  wardId?: string;
  wardName?: string;
  zone?: string;
  imageUrl?: string;
  duplicates: DuplicateCandidate[];
  wards: Ward[];
  onConfirmAndFile: (finalData: {
    issue: CivicIssueType;
    description: string;
    severity: ComplaintSeverity;
    area: string;
    landmark: string;
    ward: string;
  }) => Promise<Complaint | null>;
  onTrackComplaint: (trackingId: string) => void;
  onOpenShareModal: (complaint: Complaint) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  analysis,
  area,
  landmark,
  wardId,
  wardName,
  zone,
  imageUrl,
  duplicates,
  wards,
  onConfirmAndFile,
  onTrackComplaint,
  onOpenShareModal
}) => {
  if (!isOpen || !analysis) return null;

  // Internal modal step: 'review' | 'submitting' | 'success'
  const [modalStep, setModalStep] = useState<'review' | 'submitting' | 'success'>('review');
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Editable fields
  const [issue, setIssue] = useState<CivicIssueType>(analysis.issue_type);
  const [description, setDescription] = useState(analysis.description);
  const [severity, setSeverity] = useState<ComplaintSeverity>(analysis.severity);
  const [editArea, setEditArea] = useState(area);
  const [editLandmark, setEditLandmark] = useState(landmark);
  const [selectedWard, setSelectedWard] = useState(wardId || 'W12');

  const getSeverityBadge = (sev: ComplaintSeverity) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'high':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'medium':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'low':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const getDepartmentName = (iss: string) => {
    switch (iss) {
      case 'pothole': return 'Roads & Buildings';
      case 'garbage': return 'Solid Waste Management';
      case 'streetlight': return 'Light Department';
      case 'waterlogging': return 'Storm Water Drainage';
      default: return 'Citizen Grievance Redressal Cell';
    }
  };

  const handleConfirm = async () => {
    setModalStep('submitting');
    try {
      const result = await onConfirmAndFile({
        issue,
        description,
        severity,
        area: editArea,
        landmark: editLandmark,
        ward: selectedWard
      });
      if (result) {
        setCreatedComplaint(result);
        setModalStep('success');
      } else {
        setModalStep('review');
      }
    } catch {
      setModalStep('review');
    }
  };

  const handleCopyId = () => {
    if (!createdComplaint) return;
    navigator.clipboard.writeText(createdComplaint.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto transition-colors">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {modalStep === 'success' ? 'Complaint Registered' : 'AI Analysis & Triage'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {modalStep === 'success' ? 'Official Demo Receipt' : 'Verified by Gemini Vision Model'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: Review & Triage */}
          {modalStep === 'review' && (
            <>
              {/* Photo & Primary Detection Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {imageUrl && (
                  <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    <img src={imageUrl} alt="Uploaded Civic Issue" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 space-y-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Identified Hazard
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getSeverityBadge(severity)}`}>
                      {severity} Severity
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                    {issue}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      ({Math.round(analysis.confidence * 100)}% confidence)
                    </span>
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {description}
                  </p>
                </div>
              </div>

              {/* Department & Ward Info */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Assigned Department</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300 mt-0.5 truncate">
                    <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">{getDepartmentName(issue)}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Municipal Ward</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-300 mt-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="truncate">{selectedWard} ({wardName || editArea})</span>
                  </div>
                </div>
              </div>

              {/* Evidence tags */}
              {analysis.evidence && analysis.evidence.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Observed Evidence:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.evidence.map((ev, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates Warning if found */}
              {duplicates.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Recent Similar Complaints:</span> {duplicates.length} issues reported nearby in the last 24h. You can still submit this report.
                  </div>
                </div>
              )}

              {/* Toggle Edit Form */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Hide Corrections" : "Correct Details (Category, Area, Severity)"}</span>
                </button>

                {isEditing && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Issue Category</label>
                        <select
                          value={issue}
                          onChange={(e) => setIssue(e.target.value as CivicIssueType)}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                        >
                          <option value="pothole">Pothole / Road</option>
                          <option value="garbage">Garbage Dump</option>
                          <option value="streetlight">Streetlight</option>
                          <option value="waterlogging">Waterlogging</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Severity</label>
                        <select
                          value={severity}
                          onChange={(e) => setSeverity(e.target.value as ComplaintSeverity)}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-xs">Description</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 2: Submitting state */}
          {modalStep === 'submitting' && (
            <div className="py-10 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Filing Complaint with AMC System...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Validating ward W12, routing to Roads & Buildings, and persisting record to local database.
              </p>
            </div>
          )}

          {/* STEP 3: Success Screen */}
          {modalStep === 'success' && createdComplaint && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Complaint Successfully Filed
                </span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Unique Tracking ID Generated
                </h4>
              </div>

              {/* Tracking ID Badge */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2 max-w-sm mx-auto">
                <div className="text-left">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Reference</span>
                  <span className="text-lg font-mono font-bold text-teal-400">{createdComplaint.trackingId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="text-left text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Department:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{createdComplaint.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Location:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{createdComplaint.area} ({createdComplaint.ward})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Status:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{createdComplaint.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-2">
          {modalStep === 'review' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Confirm & Submit Complaint</span>
                <ArrowRight className="w-4 h-4 text-teal-300" />
              </button>
            </>
          )}

          {modalStep === 'success' && createdComplaint && (
            <>
              <button
                type="button"
                onClick={() => onOpenShareModal(createdComplaint)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Update</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTrackComplaint(createdComplaint.trackingId);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Track Complaint</span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
