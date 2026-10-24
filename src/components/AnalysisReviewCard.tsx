import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Edit3,
  Send,
  XCircle,
  Building,
  MapPin,
  ShieldAlert,
  HelpCircle,
  Info,
  Copy,
  ExternalLink
} from 'lucide-react';
import {
  AnalysisResult,
  CivicIssueType,
  ComplaintSeverity,
  DuplicateCandidate,
  Ward
} from '../types';

interface AnalysisReviewCardProps {
  analysis: AnalysisResult;
  selectedArea: string;
  landmark: string;
  wardId?: string;
  wardName?: string;
  zone?: string;
  imageUrl?: string;
  duplicates: DuplicateCandidate[];
  wards: Ward[];
  onConfirm: (finalData: {
    issue: CivicIssueType;
    description: string;
    severity: ComplaintSeverity;
    area: string;
    landmark: string;
    ward: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const AnalysisReviewCard: React.FC<AnalysisReviewCardProps> = ({
  analysis,
  selectedArea,
  landmark,
  wardId,
  wardName,
  zone,
  imageUrl,
  duplicates,
  wards,
  onConfirm,
  onCancel,
  isSubmitting
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [issue, setIssue] = useState<CivicIssueType>(analysis.issue_type);
  const [description, setDescription] = useState(analysis.description);
  const [severity, setSeverity] = useState<ComplaintSeverity>(analysis.severity);
  const [area, setArea] = useState(selectedArea);
  const [editLandmark, setEditLandmark] = useState(landmark);
  const [selectedWardId, setSelectedWardId] = useState(wardId || 'W12');

  const getSeverityBadge = (sev: ComplaintSeverity) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getDepartmentForIssue = (iss: string) => {
    switch (iss) {
      case 'pothole': return 'Roads & Buildings';
      case 'garbage': return 'Solid Waste Management';
      case 'streetlight': return 'Light Department';
      case 'waterlogging': return 'Storm Water Drainage';
      default: return 'Citizen Grievance Redressal Cell';
    }
  };

  const handleConfirmSubmission = () => {
    onConfirm({
      issue,
      description,
      severity,
      area,
      landmark: editLandmark,
      ward: selectedWardId
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-teal-400 uppercase">
            Step 2: AI Vision Review & Triage
          </span>
          <h3 className="text-lg font-bold text-white">Review Verified Complaint Data</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/30">
            Confidence: {Math.round(analysis.confidence * 100)}%
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Estimation Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
          <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <strong>AI Estimation Notice:</strong> The detected category, hazard severity, and visible evidence are automated machine-learning estimates to assist municipal triage. Please verify or edit details below before finalizing.
          </div>
        </div>

        {/* Potential Duplicates Alert */}
        {duplicates.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-950">
            <div className="flex items-center gap-2 font-semibold text-sm mb-1 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Potential Duplicate Submissions Found in this Area ({duplicates.length})</span>
            </div>
            <p className="text-xs text-amber-800 mb-3">
              Similar complaints were recently registered in this ward. You may still file this complaint if it represents an unaddressed or distinct hazard.
            </p>
            <div className="space-y-2">
              {duplicates.slice(0, 2).map((dup) => (
                <div key={dup.trackingId} className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-amber-900">{dup.trackingId}</span>
                    <span className="text-slate-600 ml-2">({dup.area} - {dup.status})</span>
                    <p className="text-[11px] text-slate-500">{dup.matchReason}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-800">
                    {dup.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Section: Preview & Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Photo preview */}
          {imageUrl && (
            <div className="md:col-span-4 flex flex-col gap-2">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video md:aspect-square relative">
                <img src={imageUrl} alt="Civic Grievance Preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-900/80 text-[10px] font-mono text-white">
                  Validated Photo Evidence
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold block text-slate-700 mb-1">Visual Evidence Detected:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {analysis.evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Details & Editable fields */}
          <div className={imageUrl ? "md:col-span-8 space-y-4" : "md:col-span-12 space-y-4"}>
            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500 block">Classified Category</span>
                    <span className="text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
                      {issue}
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getSeverityBadge(severity)}`}>
                        {severity.toUpperCase()} SEVERITY
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Details</span>
                  </button>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block mb-1">Description</span>
                  <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <span className="text-[11px] font-medium text-slate-500 block mb-1">Assigned AMC Department</span>
                    <div className="flex items-center gap-2 font-semibold text-sm text-indigo-950">
                      <Building className="w-4 h-4 text-indigo-600" />
                      <span>{getDepartmentForIssue(issue)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <span className="text-[11px] font-medium text-slate-500 block mb-1">Resolved Municipal Ward</span>
                    <div className="flex items-center gap-2 font-semibold text-sm text-slate-900">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      <span>{wardId || selectedWardId} — {wardName || 'Ahmedabad'} ({zone || 'Central'} Zone)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Citizen Location:</span> {area}
                  {editLandmark && <span className="text-slate-500"> (Landmark: {editLandmark})</span>}
                </div>
              </div>
            ) : (
              /* Inline Edit Mode */
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-indigo-900 uppercase">Correct Complaint Details</span>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Done Editing
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Issue Category</label>
                    <select
                      value={issue}
                      onChange={(e) => setIssue(e.target.value as CivicIssueType)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="pothole">Pothole / Damaged Road</option>
                      <option value="garbage">Garbage / Waste Dump</option>
                      <option value="streetlight">Streetlight Outage</option>
                      <option value="waterlogging">Waterlogging / Drain Clog</option>
                      <option value="other">Other Civic Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Hazard Severity</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as ComplaintSeverity)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Area</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Municipal Ward</label>
                    <select
                      value={selectedWardId}
                      onChange={(e) => setSelectedWardId(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {wards.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.id} - {w.name} ({w.zone} Zone)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel & Discard
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirmSubmission}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-900 hover:bg-indigo-800 active:scale-98 shadow-md transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-teal-400" />
              <span>{isSubmitting ? "Registering in AMC Database..." : "Confirm & File Complaint"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
