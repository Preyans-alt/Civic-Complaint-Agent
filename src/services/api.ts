import {
  Ward,
  Complaint,
  AnalysisResult,
  ResolveLocationResponse,
  DuplicateCheckResponse,
  ToolEvent
} from '../types';

const API_BASE = '/api';

export async function checkHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchWards(): Promise<Ward[]> {
  const res = await fetch(`${API_BASE}/wards`);
  if (!res.ok) throw new Error(`Failed to fetch wards: ${res.statusText}`);
  const data = await res.json();
  return data.wards || [];
}

export async function fetchDepartments(): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/departments`);
  if (!res.ok) throw new Error(`Failed to fetch departments: ${res.statusText}`);
  const data = await res.json();
  return data.departments || {};
}

export async function analyzeImage(imageBase64: string, mimeType: string, areaContext?: string): Promise<{ success: boolean; analysis: AnalysisResult; error?: string }> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, areaContext })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to analyze civic photograph.');
  }
  return data;
}

export async function resolveLocation(area: string, landmark?: string, lat?: number, lng?: number): Promise<ResolveLocationResponse> {
  const res = await fetch(`${API_BASE}/resolve-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ area, landmark, lat, lng })
  });
  const data = await res.json();
  return data;
}

export async function checkDuplicate(issue: string, ward: string, area: string, hours_window = 24): Promise<DuplicateCheckResponse> {
  const res = await fetch(`${API_BASE}/check-duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issue, ward, area, hours_window })
  });
  const data = await res.json();
  return data;
}

export interface CreateComplaintPayload {
  userConfirmed: boolean;
  issue: string;
  description: string;
  ward: string;
  area: string;
  landmark?: string;
  severity?: string;
  confidence?: number;
  evidence?: string[];
  coordinates?: { lat: number; lng: number };
  citizenName?: string;
  citizenContact?: string;
  imageUrl?: string;
}

export async function createComplaint(payload: CreateComplaintPayload): Promise<{ success: boolean; complaint: Complaint }> {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create complaint in database.');
  }
  return data;
}

export async function fetchComplaints(filters?: {
  issue?: string;
  status?: string;
  severity?: string;
  ward?: string;
  search?: string;
}): Promise<{ total: number; complaints: Complaint[] }> {
  const params = new URLSearchParams();
  if (filters?.issue && filters.issue !== 'all') params.append('issue', filters.issue);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.severity && filters.severity !== 'all') params.append('severity', filters.severity);
  if (filters?.ward && filters.ward !== 'all') params.append('ward', filters.ward);
  if (filters?.search) params.append('search', filters.search);

  const res = await fetch(`${API_BASE}/complaints?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch complaints: ${res.statusText}`);
  return res.json();
}

export async function fetchComplaintByTrackingId(trackingId: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(trackingId.trim())}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `No complaint found for ID '${trackingId}'.`);
  }
  return data.complaint;
}

export async function fetchComplaintStatus(trackingId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(trackingId.trim())}/status`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `No status found for ID '${trackingId}'.`);
  }
  return data;
}

export async function updateComplaintStatus(
  trackingId: string,
  status: string,
  note: string,
  adminToken = 'civicflow-demo-admin-secret'
): Promise<{ success: boolean; complaint: Complaint }> {
  const res = await fetch(`${API_BASE}/admin/complaints/${encodeURIComponent(trackingId.trim())}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken
    },
    body: JSON.stringify({ status, note })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update complaint status.');
  }
  return data;
}

export async function getSocialDraft(trackingId: string): Promise<{ success: boolean; trackingId: string; draftText: string; suggestedTags: string[]; disclaimer: string }> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(trackingId.trim())}/social-draft`, {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate social draft.');
  }
  return data;
}

export async function askAgent(message: string, history: any[] = []): Promise<{ reply: string; toolEvents?: ToolEvent[] }> {
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Agent communication failed.');
  }
  return data;
}
