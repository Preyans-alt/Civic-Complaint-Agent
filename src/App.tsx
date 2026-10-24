import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { ReportIssue } from './components/ReportIssue';
import { TrackComplaint } from './components/TrackComplaint';
import { AllComplaints } from './components/AllComplaints';
import { AIAgentChat } from './components/AIAgentChat';
import { AdminTriage } from './components/AdminTriage';
import { ComplaintDetailsModal } from './components/ComplaintDetailsModal';
import { SocialDraftModal } from './components/SocialDraftModal';
import { Complaint, ComplaintStatus, Ward } from './types';
import {
  checkHealth,
  fetchWards,
  fetchComplaints,
  updateComplaintStatus
} from './services/api';
import { Building2, Sparkles, CheckCircle2 } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'report' | 'track' | 'complaints' | 'agent' | 'admin'>('report');
  const [wards, setWards] = useState<Ward[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [trackingTargetId, setTrackingTargetId] = useState<string>('');

  // Selected complaint for modal details
  const [selectedComplaintForModal, setSelectedComplaintForModal] = useState<Complaint | null>(null);
  const [socialModalComplaint, setSocialModalComplaint] = useState<Complaint | null>(null);

  // Dark/Light Theme state with localStorage persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('civicflow_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('civicflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('civicflow_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Load initial backend health, wards, and database records
  const loadInitialData = async () => {
    try {
      const [health, wardsData, complaintsData] = await Promise.all([
        checkHealth().catch(() => null),
        fetchWards().catch(() => []),
        fetchComplaints().catch(() => ({ total: 0, complaints: [] }))
      ]);

      setBackendHealth(health);
      setWards(wardsData);
      setComplaints(complaintsData.complaints || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleComplaintCreated = (newComplaint: Complaint) => {
    setComplaints((prev) => [newComplaint, ...prev]);
  };

  const handleNavigateToTracking = (trackingId: string) => {
    setTrackingTargetId(trackingId);
    setCurrentTab('track');
  };

  const handleViewComplaintModal = (complaint: Complaint) => {
    setSelectedComplaintForModal(complaint);
  };

  const handleStatusUpdate = async (trackingId: string, status: ComplaintStatus, note: string) => {
    try {
      const res = await updateComplaintStatus(trackingId, status, note);
      setComplaints((prev) =>
        prev.map((c) => (c.trackingId === trackingId ? res.complaint : c))
      );
      if (selectedComplaintForModal?.trackingId === trackingId) {
        setSelectedComplaintForModal(res.complaint);
      }
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Header (No red line, clean navigation and theme toggle) */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        backendHealth={backendHealth}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6 w-full">
        {/* Dynamic Metric Bar */}
        <DashboardStats
          complaints={complaints}
          onFilterClick={(type, val) => {
            setCurrentTab('complaints');
          }}
        />

        {/* Tab Views */}
        {currentTab === 'report' && (
          <ReportIssue
            wards={wards}
            onComplaintCreated={handleComplaintCreated}
            onNavigateToTracking={handleNavigateToTracking}
            onOpenShareModal={(c) => setSocialModalComplaint(c)}
          />
        )}

        {currentTab === 'track' && (
          <TrackComplaint
            initialTrackingId={trackingTargetId}
            recentComplaints={complaints}
            onOpenShareModal={(c) => setSocialModalComplaint(c)}
          />
        )}

        {currentTab === 'complaints' && (
          <AllComplaints
            complaints={complaints}
            wards={wards}
            onViewComplaint={handleViewComplaintModal}
            onUpdateStatus={handleStatusUpdate}
          />
        )}

        {currentTab === 'agent' && (
          <AIAgentChat onSelectComplaint={handleNavigateToTracking} />
        )}

        {currentTab === 'admin' && (
          <AdminTriage
            complaints={complaints}
            onRefresh={loadInitialData}
          />
        )}
      </main>

      {/* Complaint Details Modal */}
      {selectedComplaintForModal && (
        <ComplaintDetailsModal
          complaint={selectedComplaintForModal}
          onClose={() => setSelectedComplaintForModal(null)}
          onOpenShareModal={(c) => setSocialModalComplaint(c)}
        />
      )}

      {/* Social Draft Modal */}
      {socialModalComplaint && (
        <SocialDraftModal
          complaint={socialModalComplaint}
          onClose={() => setSocialModalComplaint(null)}
        />
      )}

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">CivicFlow AI</span>
            <span>— Ahmedabad Municipal Corporation Demo</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Model: {backendHealth?.model || 'Gemini 3.8 Flash'}</span>
            <span>•</span>
            <span>Local DB: amc.json</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
