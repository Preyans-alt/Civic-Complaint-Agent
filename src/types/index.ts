export type CivicIssueType = 'pothole' | 'garbage' | 'streetlight' | 'waterlogging' | 'other' | 'unclear';

export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintStatus = 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected';

export interface Ward {
  id: string;
  name: string;
  zone: string;
  areas: string[];
}

export interface StatusHistoryItem {
  status: ComplaintStatus;
  timestamp: string;
  note: string;
}

export interface Complaint {
  trackingId: string;
  ward: string;
  wardName: string;
  zone: string;
  issue: CivicIssueType;
  department: string;
  area: string;
  landmark?: string;
  description: string;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  filedAt: string;
  confidence?: number;
  evidence?: string[];
  citizenName?: string;
  citizenContact?: string;
  imageUrl?: string;
  statusHistory: StatusHistoryItem[];
  coordinates?: {
    lat: number;
    lng: number;
    inAhmedabad?: boolean;
    warning?: string;
  };
}

export interface AnalysisResult {
  issue_type: CivicIssueType;
  description: string;
  severity: ComplaintSeverity;
  confidence: number;
  evidence: string[];
  is_civic_issue: boolean;
  needs_manual_review: boolean;
  suggestedDepartment: string;
  disclaimer: string;
}

export interface ResolveLocationResponse {
  success: boolean;
  normalizedArea: string;
  landmark?: string;
  coordinates?: {
    lat: number;
    lng: number;
    inAhmedabad?: boolean;
    warning?: string;
  };
  ward?: string;
  wardName?: string;
  zone?: string;
  matchMethod: string;
  ambiguous?: boolean;
  candidates?: Array<{
    wardId: string;
    wardName: string;
    zone: string;
    matchedArea: string;
    confidence: number;
  }>;
  suggestions?: string[];
  error?: string;
  note?: string;
}

export interface DuplicateCandidate {
  trackingId: string;
  issue: string;
  area: string;
  ward: string;
  department: string;
  severity: string;
  status: string;
  filedAt: string;
  matchReason: string;
}

export interface DuplicateCheckResponse {
  hasDuplicates: boolean;
  count: number;
  candidates: DuplicateCandidate[];
}

export interface ToolEvent {
  tool: string;
  args: Record<string, any>;
  output: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  toolEvents?: ToolEvent[];
}

export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'warning';

export interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  status: ExecutionStepStatus;
  detail?: string;
}
