import React, { useState } from 'react';
import {
  Search,
  Eye,
  Building,
  MapPin,
  Calendar,
  AlertOctagon,
  CheckCircle,
  Clock,
  Edit2
} from 'lucide-react';
import { Complaint, ComplaintStatus, Ward } from '../types';

interface AllComplaintsProps {
  complaints: Complaint[];
  wards: Ward[];
  onViewComplaint: (complaint: Complaint) => void;
  onUpdateStatus?: (trackingId: string, status: ComplaintStatus, note: string) => void;
}

export const AllComplaints: React.FC<AllComplaintsProps> = ({
  complaints,
  wards,
  onViewComplaint,
  onUpdateStatus
}) => {
  const [search, setSearch] = useState('');
  const [filterIssue, setFilterIssue] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWard, setFilterWard] = useState('all');

  // Admin status update modal state
  const [selectedForStatusUpdate, setSelectedForStatusUpdate] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [statusNote, setStatusNote] = useState('');

  const filtered = complaints.filter((c) => {
    if (filterIssue !== 'all' && c.issue.toLowerCase() !== filterIssue.toLowerCase()) return false;
    if (filterStatus !== 'all' && c.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (filterWard !== 'all' && c.ward.toUpperCase() !== filterWard.toUpperCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTid = c.trackingId.toLowerCase().includes(q);
      const matchArea = c.area.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      const matchDept = c.department.toLowerCase().includes(q);
      if (!matchTid && !matchArea && !matchDesc && !matchDept) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Assigned': return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'In Progress': return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Resolved': return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Rejected': return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical': return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 font-bold';
      case 'high': return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 font-semibold';
      case 'medium': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800';
      case 'low': return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForStatusUpdate || !onUpdateStatus) return;
    onUpdateStatus(
      selectedForStatusUpdate.trackingId,
      newStatus,
      statusNote.trim() || `Status updated to ${newStatus} via demo admin portal.`
    );
    setSelectedForStatusUpdate(null);
    setStatusNote('');
  };

  return (
    <div className="space-y-4">
      {/* Title & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ahmedabad Grievances Directory</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filtered.length} of {complaints.length} registered records. Click any row for details.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, area, issue..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">Category</label>
            <select
              value={filterIssue}
              onChange={(e) => setFilterIssue(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Issues</option>
              <option value="pothole">Pothole</option>
              <option value="garbage">Garbage</option>
              <option value="streetlight">Streetlight</option>
              <option value="waterlogging">Waterlogging</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">Ward</label>
            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.id} - {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hidden md:block transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.map((item) => (
                <tr
                  key={item.trackingId}
                  onClick={() => onViewComplaint(item)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {item.trackingId}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {item.issue}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.area}</span>
                    <span className="block text-[10px] text-slate-400">{item.ward}</span>
                  </td>
                  <td className="py-3 px-4">
                    {item.department}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold border ${getSeverityBadge(item.severity)}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewComplaint(item);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      View &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="space-y-2.5 md:hidden">
        {filtered.map((item) => (
          <div
            key={item.trackingId}
            onClick={() => onViewComplaint(item)}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{item.trackingId}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                {item.status}
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">{item.issue}</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
              <span>{item.area} ({item.ward})</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Details &rarr;</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          No matching records found.
        </div>
      )}
    </div>
  );
};
