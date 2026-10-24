import React, { useState } from 'react';
import {
  UploadCloud,
  X,
  MapPin,
  Sparkles,
  ArrowRight,
  Camera,
  AlertCircle,
  CheckCircle2,
  Layers,
  Building
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
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [areaInput, setAreaInput] = useState<string>('Navrangpura');
  const [landmarkInput, setLandmarkInput] = useState<string>('Near Municipal Market, CG Road');
  const [isDragOver, setIsDragOver] = useState(false);

  // Async & Modal state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<any>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Popular Ahmedabad areas for 1-tap selection
  const popularAreas = [
    'Navrangpura',
    'Kankaria',
    'Satellite',
    'CG Road',
    'Bodakdev',
    'Vastrapur',
    'Paldi',
    'Maninagar'
  ];

  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErrorMessage('Please select a JPEG, PNG, or WebP photograph.');
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

  const handleAnalyzeAndOpenModal = async () => {
    if (!imageBase64) {
      setErrorMessage('Please upload a photo or pick a sample issue card.');
      return;
    }
    if (!areaInput.trim()) {
      setErrorMessage('Please provide the area or neighborhood in Ahmedabad.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);

    try {
      const locRes = await resolveLocation(areaInput, landmarkInput);
      setResolvedLocation(locRes);

      const analysisResp = await analyzeImage(imageBase64, imageMime, areaInput);
      setAnalysisResult(analysisResp.analysis);

      const targetWard = locRes.ward || 'W12';
      const dupRes = await checkDuplicate(analysisResp.analysis.issue_type, targetWard, areaInput);
      setDuplicateCandidates(dupRes.candidates || []);

      setIsModalOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Image analysis failed. Please try again.');
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
      setErrorMessage(err.message || 'Failed to file complaint.');
      return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Report Civic Issue
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload a photo & location. Gemini AI will classify the hazard and route to AMC.
          </p>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          Step 1: Upload &bull; Step 2: AI Verify &bull; Step 3: Track ID
        </span>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Symmetrical 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* Left Column: Photograph Upload & Sample Gallery */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Photo Evidence
              </label>
              <span className="text-[11px] text-slate-400">JPEG, PNG, WebP</span>
            </div>

            {!imagePreviewUrl ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
                }}
                onClick={() => document.getElementById('symmetrical-photo-input')?.click()}
                className={`h-52 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <input
                  id="symmetrical-photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-xs">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Click to upload or take a photo
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Pothole, garbage pile, damaged streetlight, or waterlogged road
                </p>
              </div>
            ) : (
              <div className="relative h-52 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center">
                <img src={imagePreviewUrl} alt="Civic Issue Preview" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-rose-600 transition-colors shadow-sm"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-mono">
                  Attached Photo Evidence
                </span>
              </div>
            )}
          </div>

          {/* Symmetrical Sample Grid */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-2 uppercase tracking-wider">
              Quick test sample images:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_CIVIC_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/70 dark:bg-slate-800/50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded">
                      {sample.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{sample.suggestedArea}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {sample.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Location & Immediate AI Action */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Location & Details
              </label>
              <span className="text-[11px] text-slate-400">Ahmedabad Wards</span>
            </div>

            {/* Area Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Area / Locality <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder="Enter area (e.g. Navrangpura, Kankaria)..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Symmetrical Popular Area Chips Grid (4x2) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Popular Ahmedabad Areas:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {popularAreas.map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setAreaInput(ar)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-medium text-center truncate border transition-all cursor-pointer ${
                      areaInput.toLowerCase() === ar.toLowerCase()
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            {/* Landmark Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Landmark / Specific Spot (Optional)
              </label>
              <input
                type="text"
                value={landmarkInput}
                onChange={(e) => setLandmarkInput(e.target.value)}
                placeholder="e.g. Opp Stadium Circle, Near Market, Beside Metro Pillar..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Symmetrical Action Button */}
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
                  <span>Gemini AI is analyzing photo & ward...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-teal-300" />
                  <span>Analyze & File Complaint</span>
                  <ArrowRight className="w-4 h-4 text-teal-300" />
                </>
              )}
            </button>
          </div>
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
