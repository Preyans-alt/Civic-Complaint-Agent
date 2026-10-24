import React, { useState } from 'react';
import {
  UploadCloud,
  X,
  MapPin,
  Sparkles,
  ArrowRight,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  CivicIssueType,
  ComplaintSeverity,
  AnalysisResult,
  Complaint,
  DuplicateCandidate,
  Ward
} from '../types';
import { SAMPLE_CIVIC_IMAGES, SampleImageItem } from '../data/sampleImages';
import {
  analyzeImage,
  resolveLocation,
  checkDuplicate,
  createComplaint
} from '../services/api';
import { ReportModal } from './ReportModal';

interface ReportIssueProps {
  wards: Ward[];
  onComplaintCreated: (complaint: Complaint) => void;
  onNavigateToTracking: (trackingId: string) => void;
  onOpenShareModal: (complaint: Complaint) => void;
}

export const ReportIssue: React.FC<ReportIssueProps> = ({
  wards,
  onComplaintCreated,
  onNavigateToTracking,
  onOpenShareModal
}) => {
  // Inputs
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [areaInput, setAreaInput] = useState<string>('Navrangpura');
  const [landmarkInput, setLandmarkInput] = useState<string>('Near Municipal Market');
  const [isDragOver, setIsDragOver] = useState(false);

  // Async & Modal state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<any>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Popular Ahmedabad areas for quick 1-tap selection by native citizens
  const popularAreas = [
    'Navrangpura',
    'Kankaria',
    'Satellite',
    'CG Road',
    'Bodakdev',
    'Vastrapur',
    'Maninagar',
    'Paldi'
  ];

  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMessage(`Please select a JPEG, PNG, or WebP photograph.`);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8 MB.');
      return;
    }

    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setImagePreviewUrl(dataUri);
      setImageBase64(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: SampleImageItem) => {
    setErrorMessage(null);
    setImageMime('image/jpeg');
    const dataUri = `data:image/svg+xml;base64,${sample.base64Data}`;
    setImagePreviewUrl(dataUri);
    setImageBase64(sample.base64Data);
    setAreaInput(sample.suggestedArea);
    setLandmarkInput(sample.landmark);
  };

  const handleRemovePhoto = () => {
    setImageBase64('');
    setImagePreviewUrl('');
  };

  // Analyze and Open Output Modal
  const handleAnalyzeAndOpenModal = async () => {
    if (!imageBase64) {
      setErrorMessage('Please select or upload a civic issue photo.');
      return;
    }
    if (!areaInput.trim()) {
      setErrorMessage('Please enter an area name (e.g. Navrangpura, Kankaria).');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);

    try {
      // 1. Resolve Location
      const locRes = await resolveLocation(areaInput, landmarkInput);
      setResolvedLocation(locRes);

      // 2. Gemini Multimodal Vision
      const analysisResp = await analyzeImage(imageBase64, imageMime, areaInput);
      setAnalysisResult(analysisResp.analysis);

      // 3. Duplicate check
      const targetWard = locRes.ward || 'W12';
      const dupRes = await checkDuplicate(analysisResp.analysis.issue_type, targetWard, areaInput);
      setDuplicateCandidates(dupRes.candidates || []);

      // Open Modal with results
      setIsModalOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis failed. Please check network.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinalConfirm = async (finalData: {
    issue: CivicIssueType;
    description: string;
    severity: ComplaintSeverity;
    area: string;
    landmark: string;
    ward: string;
  }): Promise<Complaint | null> => {
    try {
      const created = await createComplaint({
        userConfirmed: true,
        issue: finalData.issue,
        description: finalData.description,
        ward: finalData.ward,
        area: finalData.area,
        landmark: finalData.landmark,
        severity: finalData.severity,
        confidence: analysisResult?.confidence || 0.90,
        evidence: analysisResult?.evidence || [],
        imageUrl: imagePreviewUrl
      });
      onComplaintCreated(created.complaint);
      return created.complaint;
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit complaint.');
      return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Friendly Citizen Hero Banner */}
      <div className="text-center sm:text-left space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Report Civic Issue
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Upload a photo of damaged road, garbage, streetlight, or waterlogging. Gemini AI will categorize it and route to AMC.
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Reporting Card (Clean, Less Nested Divs) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-5 transition-colors">
        
        {/* Upload Box */}
        <div>
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
            1. Photo of Issue <span className="text-rose-500">*</span>
          </label>

          {!imagePreviewUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
              }}
              onClick={() => document.getElementById('native-photo-input')?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-800/40'
              }`}
            >
              <input
                id="native-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2.5">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                Click to take or upload photo, or drag here
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Potholes, garbage dumps, dark streetlights, drainage issues (Max 8 MB)
              </p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 aspect-video max-h-56 flex items-center justify-center">
              <img src={imagePreviewUrl} alt="Issue preview" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-950/80 text-white hover:bg-rose-600 transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Quick Demo Test Buttons */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
            Or test instantly with sample issue:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SAMPLE_CIVIC_IMAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/60 text-left transition-all group cursor-pointer"
              >
                <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1 py-0.5 rounded">
                  {sample.category}
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {sample.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{sample.suggestedArea}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            2. Location in Ahmedabad <span className="text-rose-500">*</span>
          </label>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              placeholder="Enter area (e.g. Navrangpura, Kankaria, Vastrapur)..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Area Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-medium">Popular:</span>
            {popularAreas.map((ar) => (
              <button
                key={ar}
                type="button"
                onClick={() => setAreaInput(ar)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                  areaInput.toLowerCase() === ar.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <input
              type="text"
              value={landmarkInput}
              onChange={(e) => setLandmarkInput(e.target.value)}
              placeholder="Nearby landmark (e.g. Near Municipal Market, Opp Lakefront gate)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleAnalyzeAndOpenModal}
            disabled={isAnalyzing || !imageBase64 || !areaInput.trim()}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gemini Multimodal AI is Analyzing Photo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-teal-300" />
                <span>Analyze & Submit Complaint</span>
                <ArrowRight className="w-4 h-4 text-teal-300" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Modal with AI review & receipt */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        analysis={analysisResult}
        area={areaInput}
        landmark={landmarkInput}
        wardId={resolvedLocation?.ward}
        wardName={resolvedLocation?.wardName}
        zone={resolvedLocation?.zone}
        imageUrl={imagePreviewUrl}
        duplicates={duplicateCandidates}
        wards={wards}
        onConfirmAndFile={handleFinalConfirm}
        onTrackComplaint={onNavigateToTracking}
        onOpenShareModal={onOpenShareModal}
      />
    </div>
  );
};
