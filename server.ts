import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable JSON body parser with 10MB limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Admin-Token');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Paths and Database
const DATA_FILE = path.resolve(process.env.DATA_FILE || path.join(__dirname, 'backend', 'data', 'amc.json'));

// In-memory mutex for file writing
let isWriting = false;
const writeQueue: Array<() => void> = [];

const acquireLock = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!isWriting) {
      isWriting = true;
      resolve();
    } else {
      writeQueue.push(resolve);
    }
  });
};

const releaseLock = () => {
  if (writeQueue.length > 0) {
    const next = writeQueue.shift();
    if (next) next();
  } else {
    isWriting = false;
  }
};

// Database structure interfaces
interface Ward {
  id: string;
  name: string;
  zone: string;
  areas: string[];
}

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  note: string;
}

interface Complaint {
  trackingId: string;
  ward: string;
  wardName: string;
  zone: string;
  issue: string;
  department: string;
  area: string;
  landmark?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'Submitted' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected';
  filedAt: string;
  evidence?: string[];
  confidence?: number;
  citizenName?: string;
  citizenContact?: string;
  imageUrl?: string;
  statusHistory: StatusHistoryItem[];
  coordinates?: {
    lat: number;
    lng: number;
    inAhmedabad?: boolean;
  };
}

interface AmcDatabase {
  wards: Ward[];
  departments: Record<string, string>;
  complaints: Complaint[];
}

// Ensure database file exists
function readDb(): AmcDatabase {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const parentDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      const initial: AmcDatabase = {
        wards: [
          { id: 'W12', name: 'Navrangpura', zone: 'West', areas: ['Navrangpura', 'Stadium', 'CG Road', 'Mithakhali', 'Commerce Six Roads'] },
          { id: 'W27', name: 'Maninagar', zone: 'South', areas: ['Maninagar', 'Kankaria', 'Jawahar Chowk', 'Rambaug', 'Balvatika'] },
          { id: 'W15', name: 'Bodakdev', zone: 'North West', areas: ['Bodakdev', 'Sindhu Bhavan', 'Judges Bungalow', 'Pakwan Cross Road'] },
          { id: 'W04', name: 'Satellite', zone: 'West', areas: ['Satellite', 'Shivranjani', 'Prahlad Nagar', 'Jodhpur Cross Road'] },
          { id: 'W09', name: 'Vastrapur', zone: 'West', areas: ['Vastrapur', 'IIM Road', 'Vastrapur Lake', 'Himmatlal Park'] },
          { id: 'W18', name: 'Paldi', zone: 'West', areas: ['Paldi', 'Anandnagar', 'Fatehpura', 'Bhattha', 'Ellis Bridge'] },
          { id: 'W22', name: 'Jamalpur', zone: 'Central', areas: ['Jamalpur', 'Geeta Mandir', 'Khadia', 'Astodia', 'Raipur'] },
          { id: 'W31', name: 'Sabarmati', zone: 'West', areas: ['Sabarmati', 'Dharamnagar', 'RTO', 'Motera', 'Chandkheda'] }
        ],
        departments: {
          pothole: 'Roads & Buildings',
          garbage: 'Solid Waste Management',
          streetlight: 'Light Department',
          waterlogging: 'Storm Water Drainage'
        },
        complaints: []
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content) as AmcDatabase;
  } catch (err) {
    console.error('Error reading AMC JSON database, falling back to default structure:', err);
    return {
      wards: [],
      departments: {
        pothole: 'Roads & Buildings',
        garbage: 'Solid Waste Management',
        streetlight: 'Light Department',
        waterlogging: 'Storm Water Drainage'
      },
      complaints: []
    };
  }
}

async function writeDb(data: AmcDatabase): Promise<void> {
  await acquireLock();
  try {
    const tempFile = `${DATA_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } finally {
    releaseLock();
  }
}

// Format ISO string in Asia/Kolkata (+05:30)
function getNowKolkataISO(): string {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (3600000 * 5.5));
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = istTime.getFullYear();
  const month = pad(istTime.getMonth() + 1);
  const day = pad(istTime.getDate());
  const hours = pad(istTime.getHours());
  const minutes = pad(istTime.getMinutes());
  const seconds = pad(istTime.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`;
}

// Generate sequential tracking ID AMC-YYYY-NNNNNN
function generateTrackingId(existing: Complaint[]): string {
  const currentYear = new Date().getFullYear();
  let maxSeq = 126;
  const regex = new RegExp(`^AMC-${currentYear}-(\\d+)$`);

  for (const c of existing) {
    const match = regex.exec(c.trackingId);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxSeq) {
        maxSeq = val;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `AMC-${currentYear}-${nextSeq.toString().padStart(6, '0')}`;
}

// Area normalization & Ward Lookup
function normalizeText(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

interface WardMatchResult {
  matched: boolean;
  wardId?: string;
  wardName?: string;
  zone?: string;
  matchedArea?: string;
  confidence?: number;
  matchMethod?: string;
  ambiguous?: boolean;
  candidates?: Array<{ wardId: string; wardName: string; zone: string; matchedArea: string; confidence: number }>;
  suggestions?: string[];
  error?: string;
  note?: string;
}

function matchWard(areaInput: string, wards: Ward[]): WardMatchResult {
  const normInput = normalizeText(areaInput);
  if (!normInput) {
    return { matched: false, error: 'Area name is required.' };
  }

  // Exact ward name or area match
  for (const ward of wards) {
    if (normalizeText(ward.name) === normInput) {
      return {
        matched: true,
        wardId: ward.id,
        wardName: ward.name,
        zone: ward.zone,
        matchedArea: ward.name,
        confidence: 1.0,
        matchMethod: 'exact_ward_name'
      };
    }
    for (const a of ward.areas) {
      if (normalizeText(a) === normInput) {
        return {
          matched: true,
          wardId: ward.id,
          wardName: ward.name,
          zone: ward.zone,
          matchedArea: a,
          confidence: 1.0,
          matchMethod: 'exact_area_match'
        };
      }
    }
  }

  // Substring match
  const candidates: Array<{ wardId: string; wardName: string; zone: string; matchedArea: string; confidence: number }> = [];
  for (const ward of wards) {
    for (const a of ward.areas) {
      const normA = normalizeText(a);
      if (normA.includes(normInput) || normInput.includes(normA)) {
        candidates.push({
          wardId: ward.id,
          wardName: ward.name,
          zone: ward.zone,
          matchedArea: a,
          confidence: 0.85
        });
      }
    }
  }

  if (candidates.length === 1) {
    return {
      matched: true,
      ...candidates[0],
      matchMethod: 'partial_match'
    };
  } else if (candidates.length > 1) {
    return {
      matched: false,
      ambiguous: true,
      error: `Multiple municipal wards matched '${areaInput}'. Please select an exact area.`,
      candidates
    };
  }

  // Suggest all known areas
  const allSuggestions: string[] = [];
  wards.forEach(w => w.areas.forEach(a => {
    if (!allSuggestions.includes(a)) allSuggestions.push(a);
  }));

  return {
    matched: false,
    error: `Area '${areaInput}' is not recognized in Ahmedabad demo ward mapping.`,
    suggestions: allSuggestions.slice(0, 8)
  };
}

// Department mapping
const DEPARTMENT_MAPPING: Record<string, string> = {
  pothole: 'Roads & Buildings',
  garbage: 'Solid Waste Management',
  streetlight: 'Light Department',
  waterlogging: 'Storm Water Drainage'
};

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// =================== REST API ENDPOINTS =================== //

// GET /api/health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'CivicFlow AI Backend Engine',
    city: 'Ahmedabad, Gujarat, India',
    model: GEMINI_MODEL,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: getNowKolkataISO(),
    environment: 'Demo & Hackathon Prototype',
    disclaimer: 'Demonstration software. Not affiliated with official Ahmedabad Municipal Corporation.'
  });
});

// GET /api/wards
app.get('/api/wards', (req: Request, res: Response) => {
  const db = readDb();
  res.json({ wards: db.wards });
});

// GET /api/departments
app.get('/api/departments', (req: Request, res: Response) => {
  const db = readDb();
  res.json({ departments: db.departments });
});

// POST /api/resolve-location
app.post('/api/resolve-location', (req: Request, res: Response) => {
  const { area, landmark, lat, lng } = req.body;
  const db = readDb();

  if (!area || typeof area !== 'string' || !area.trim()) {
    return res.status(400).json({ success: false, error: 'Area name is required.' });
  }

  const cleanArea = area.trim();
  const cleanLandmark = landmark ? String(landmark).trim() : '';

  let matchResult = matchWard(cleanArea, db.wards);

  if (!matchResult.matched && cleanLandmark) {
    const landmarkMatch = matchWard(cleanLandmark, db.wards);
    if (landmarkMatch.matched) {
      matchResult = {
        ...landmarkMatch,
        note: `Resolved via landmark reference '${cleanLandmark}'.`
      };
    }
  }

  let coordinatesInfo = null;
  if (typeof lat === 'number' && typeof lng === 'number') {
    const inAhmedabad = (lat >= 22.8 && lat <= 23.3 && lng >= 72.3 && lng <= 72.8);
    coordinatesInfo = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      inAhmedabad,
      warning: inAhmedabad ? undefined : 'Coordinates appear outside Ahmedabad Municipal limits.'
    };
  }

  res.json({
    success: matchResult.matched,
    normalizedArea: cleanArea,
    landmark: cleanLandmark,
    coordinates: coordinatesInfo,
    ward: matchResult.wardId,
    wardName: matchResult.wardName,
    zone: matchResult.zone,
    matchMethod: matchResult.matchMethod || 'unmatched',
    ambiguous: matchResult.ambiguous || false,
    candidates: matchResult.candidates || [],
    suggestions: matchResult.suggestions || [],
    error: matchResult.error
  });
});

// POST /api/analyze - Real Gemini Vision Multimodal Analysis
app.post('/api/analyze', async (req: Request, res: Response) => {
  const { imageBase64, mimeType, areaContext } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data (base64) is required.' });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const cleanMime = (mimeType || 'image/jpeg').toLowerCase();
  if (!allowedTypes.includes(cleanMime)) {
    return res.status(400).json({ error: `Unsupported image type '${cleanMime}'. Must be JPEG, PNG, or WebP.` });
  }

  // Check approximate size (base64 length * 0.75)
  const estimatedBytes = (imageBase64.length * 3) / 4;
  if (estimatedBytes > 8 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image file size exceeds the 8 MB limit.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please add your key to continue with AI vision analysis.',
      needsManualReview: true
    });
  }

  try {
    const promptText = `You are the Civic Issue Classifier for Ahmedabad Municipal Corporation (AMC).
Analyze this civic grievance image carefully.

You MUST classify the civic issue into EXACTLY ONE of the following issue_type values:
- "pothole" (potholes, fractured asphalt, damaged road surface, broken paver blocks, sinkholes)
- "garbage" (overflowing waste bins, illegal dumping, litter accumulation, rotting municipal refuse)
- "streetlight" (broken streetlamp, unlit street fixtures, hanging electrical wires, dark roadway lighting)
- "waterlogging" (flooded streets, standing monsoon water, choked stormwater drain / catchpit, blocked gutter)
- "other" (other municipal maintenance problems not fitting above)
- "unclear" (blurry image, unrelated photo, indoor shot, cannot identify a civic issue)

Provide structured assessment:
1. issue_type: one of the 6 allowed values above.
2. description: a clear, plain-language description of what is visible in the photo (max 2 sentences).
3. severity: "low", "medium", "high", or "critical" based on safety and public hazard risk.
4. confidence: estimate between 0.50 and 0.99.
5. evidence: array of 2 to 4 specific visual cues seen in the image.
6. is_civic_issue: boolean, true if this is an actionable public infrastructure/sanitation issue in a city.
7. needs_manual_review: boolean, true if ambiguous, blurry, or classified as "other" or "unclear".

Citizen context provided: "${areaContext || 'Ahmedabad street'}".
Respond strictly in JSON matching the specified schema.`;

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: cleanMime,
              data: cleanBase64
            }
          },
          {
            text: promptText
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            issue_type: {
              type: Type.STRING,
              description: 'Classified civic issue category'
            },
            description: {
              type: Type.STRING,
              description: 'Concise description of the visible condition'
            },
            severity: {
              type: Type.STRING,
              description: 'Estimated hazard severity: low, medium, high, or critical'
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Estimated confidence score between 0.0 and 1.0'
            },
            evidence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Observable physical evidence in the photograph'
            },
            is_civic_issue: {
              type: Type.BOOLEAN,
              description: 'Whether this photograph depicts a civic infrastructure issue'
            },
            needs_manual_review: {
              type: Type.BOOLEAN,
              description: 'Flag if the classification requires human verification'
            }
          },
          required: ['issue_type', 'description', 'severity', 'confidence', 'evidence', 'is_civic_issue', 'needs_manual_review']
        }
      }
    });

    const rawJson = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(rawJson);

    // Validate and sanitize parsed response
    let issueType = String(parsed.issue_type || 'unclear').toLowerCase();
    if (!['pothole', 'garbage', 'streetlight', 'waterlogging', 'other', 'unclear'].includes(issueType)) {
      issueType = 'unclear';
    }

    let severity = String(parsed.severity || 'medium').toLowerCase();
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      severity = 'medium';
    }

    const suggestedDepartment = DEPARTMENT_MAPPING[issueType] || (issueType === 'other' || issueType === 'unclear' ? 'Citizen Grievance Redressal Cell' : 'Roads & Buildings');

    return res.json({
      success: true,
      analysis: {
        issue_type: issueType,
        description: parsed.description || 'Observed public infrastructure condition.',
        severity: severity,
        confidence: typeof parsed.confidence === 'number' ? Math.min(0.99, Math.max(0.5, parsed.confidence)) : 0.88,
        evidence: Array.isArray(parsed.evidence) && parsed.evidence.length > 0 ? parsed.evidence : ['Visual infrastructure assessment'],
        is_civic_issue: Boolean(parsed.is_civic_issue),
        needs_manual_review: Boolean(parsed.needs_manual_review) || issueType === 'other' || issueType === 'unclear',
        suggestedDepartment: suggestedDepartment,
        disclaimer: 'AI classification and severity are automated estimates for municipal routing, not official engineering inspections.'
      }
    });
  } catch (err: any) {
    console.error('Gemini vision analysis failed:', err);
    return res.status(500).json({
      error: `Gemini image analysis failed: ${err.message || 'Service communication error'}. You may still file manually.`,
      needsManualReview: true
    });
  }
});

// POST /api/check-duplicate
app.post('/api/check-duplicate', (req: Request, res: Response) => {
  const { issue, ward, area, hours_window = 24 } = req.body;
  const db = readDb();

  const normIssue = (issue || '').toLowerCase().trim();
  const normWard = (ward || '').toUpperCase().trim();
  const normArea = normalizeText(area);

  const now = new Date();
  const candidates: Array<{
    trackingId: string;
    issue: string;
    area: string;
    ward: string;
    department: string;
    severity: string;
    status: string;
    filedAt: string;
    matchReason: string;
  }> = [];

  for (const c of db.complaints) {
    if (c.issue.toLowerCase() !== normIssue) continue;

    const wardMatch = (c.ward.toUpperCase() === normWard);
    const areaMatch = normalizeText(c.area).includes(normArea) || normArea.includes(normalizeText(c.area));

    if (wardMatch || areaMatch) {
      let hoursDiff = 0;
      try {
        const filedTime = new Date(c.filedAt);
        hoursDiff = (now.getTime() - filedTime.getTime()) / (1000 * 3600);
      } catch {
        hoursDiff = 0;
      }

      if (hoursDiff <= hours_window) {
        candidates.push({
          trackingId: c.trackingId,
          issue: c.issue,
          area: c.area,
          ward: c.ward,
          department: c.department,
          severity: c.severity,
          status: c.status,
          filedAt: c.filedAt,
          matchReason: `Matching '${c.issue}' in Ward ${c.ward} (${c.area}) submitted ${Math.round(hoursDiff)} hrs ago.`
        });
      }
    }
  }

  res.json({
    hasDuplicates: candidates.length > 0,
    count: candidates.length,
    candidates
  });
});

// POST /api/complaints - Create verified complaint
app.post('/api/complaints', async (req: Request, res: Response) => {
  const {
    userConfirmed,
    issue,
    description,
    ward,
    area,
    landmark,
    severity,
    confidence,
    evidence,
    coordinates,
    citizenName,
    citizenContact,
    imageUrl
  } = req.body;

  // Rule 4: User confirmation required
  if (!userConfirmed) {
    return res.status(400).json({ error: 'Citizen confirmation is required before filing a formal complaint.' });
  }

  // Rule 1: Validate required fields
  const cleanIssue = (issue || '').trim().toLowerCase();
  if (!cleanIssue) {
    return res.status(400).json({ error: 'Issue category is required.' });
  }

  const cleanDescription = (description || '').trim();
  if (!cleanDescription) {
    return res.status(400).json({ error: 'Complaint description is required.' });
  }

  const cleanWard = (ward || '').trim().toUpperCase();
  if (!cleanWard) {
    return res.status(400).json({ error: 'Ward ID is required.' });
  }

  const cleanArea = (area || '').trim();
  if (!cleanArea) {
    return res.status(400).json({ error: 'Area name is required.' });
  }

  const db = readDb();

  // Rule 2: Verify ward exists
  const wardInfo = db.wards.find(w => w.id.toUpperCase() === cleanWard);
  if (!wardInfo) {
    return res.status(400).json({ error: `Ward ID '${cleanWard}' is invalid or not found in AMC ward registry.` });
  }

  // Rule 3: Verify department mapping
  const department = DEPARTMENT_MAPPING[cleanIssue];
  if (!department) {
    return res.status(400).json({ error: `Issue type '${cleanIssue}' cannot be routed automatically. Must be one of: pothole, garbage, streetlight, waterlogging.` });
  }

  const cleanSeverity = ['low', 'medium', 'high', 'critical'].includes((severity || '').toLowerCase())
    ? (severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical')
    : 'medium';

  // Rule 5: Generate unique sequential tracking ID
  const trackingId = generateTrackingId(db.complaints);
  const nowIso = getNowKolkataISO();

  // Rule 8 & 9: Initial status 'Submitted' and initial history
  const newComplaint: Complaint = {
    trackingId,
    ward: wardInfo.id,
    wardName: wardInfo.name,
    zone: wardInfo.zone,
    issue: cleanIssue,
    department,
    area: cleanArea,
    landmark: landmark ? String(landmark).trim() : '',
    description: cleanDescription,
    severity: cleanSeverity,
    status: 'Submitted',
    filedAt: nowIso,
    confidence: typeof confidence === 'number' ? confidence : 0.90,
    evidence: Array.isArray(evidence) ? evidence : [],
    coordinates: coordinates && typeof coordinates.lat === 'number' ? coordinates : undefined,
    citizenName: citizenName ? String(citizenName).trim() : 'Citizen (Demo)',
    citizenContact: citizenContact ? String(citizenContact).trim() : '',
    imageUrl: imageUrl || undefined,
    statusHistory: [
      {
        status: 'Submitted',
        timestamp: nowIso,
        note: 'Complaint registered in demo AMC portal with multimodal verification.'
      }
    ]
  };

  // Rule 6: Store atomically
  db.complaints.unshift(newComplaint);
  try {
    await writeDb(db);
  } catch (err: any) {
    console.error('Failed to write complaint to database:', err);
    return res.status(500).json({ error: `Database persistence failed: ${err.message}` });
  }

  // Rule 10: Return saved record
  res.status(201).json({
    success: true,
    message: 'Complaint successfully registered in demo AMC database.',
    complaint: newComplaint
  });
});

// GET /api/complaints
app.get('/api/complaints', (req: Request, res: Response) => {
  const { issue, status, severity, ward, search } = req.query;
  const db = readDb();

  let filtered = db.complaints;

  if (issue) {
    filtered = filtered.filter(c => c.issue.toLowerCase() === String(issue).toLowerCase());
  }
  if (status) {
    filtered = filtered.filter(c => c.status.toLowerCase() === String(status).toLowerCase());
  }
  if (severity) {
    filtered = filtered.filter(c => c.severity.toLowerCase() === String(severity).toLowerCase());
  }
  if (ward) {
    filtered = filtered.filter(c => c.ward.toUpperCase() === String(ward).toUpperCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(c =>
      c.trackingId.toLowerCase().includes(q) ||
      c.area.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.landmark && c.landmark.toLowerCase().includes(q))
    );
  }

  res.json({
    total: filtered.length,
    complaints: filtered
  });
});

// GET /api/complaints/:tracking_id
app.get('/api/complaints/:tracking_id', (req: Request, res: Response) => {
  const tid = req.params.tracking_id.trim().toUpperCase();
  const db = readDb();
  const found = db.complaints.find(c => c.trackingId.toUpperCase() === tid);

  if (!found) {
    return res.status(404).json({
      found: false,
      trackingId: tid,
      message: `No complaint found matching tracking ID '${tid}' in demo AMC database.`
    });
  }

  res.json({
    found: true,
    complaint: found
  });
});

// GET /api/complaints/:tracking_id/status
app.get('/api/complaints/:tracking_id/status', (req: Request, res: Response) => {
  const tid = req.params.tracking_id.trim().toUpperCase();
  const db = readDb();
  const found = db.complaints.find(c => c.trackingId.toUpperCase() === tid);

  if (!found) {
    return res.status(404).json({
      found: false,
      trackingId: tid,
      message: `No complaint found matching tracking ID '${tid}' in demo AMC database.`
    });
  }

  res.json({
    found: true,
    trackingId: found.trackingId,
    status: found.status,
    issue: found.issue,
    department: found.department,
    ward: found.ward,
    wardName: found.wardName,
    zone: found.zone,
    area: found.area,
    filedAt: found.filedAt,
    severity: found.severity,
    description: found.description,
    statusHistory: found.statusHistory
  });
});

// POST /api/admin/complaints/:tracking_id/status
app.post('/api/admin/complaints/:tracking_id/status', async (req: Request, res: Response) => {
  const tid = req.params.tracking_id.trim().toUpperCase();
  const { status, note } = req.body;
  const adminToken = req.headers['x-admin-token'] || req.body.adminToken;

  const EXPECTED_TOKEN = process.env.DEMO_ADMIN_TOKEN || 'civicflow-demo-admin-secret';
  if (adminToken !== EXPECTED_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized: Invalid demo admin authorization token.' });
  }

  const allowedStatuses = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status '${status}'. Must be one of: ${allowedStatuses.join(', ')}` });
  }

  const db = readDb();
  const complaint = db.complaints.find(c => c.trackingId.toUpperCase() === tid);
  if (!complaint) {
    return res.status(404).json({ error: `Complaint '${tid}' not found in database.` });
  }

  const nowIso = getNowKolkataISO();
  const previousStatus = complaint.status;
  complaint.status = status;
  if (!complaint.statusHistory) complaint.statusHistory = [];

  complaint.statusHistory.push({
    status,
    timestamp: nowIso,
    note: `${note ? note.trim() : `Status updated from ${previousStatus} to ${status}.`} (AMC Admin Action)`
  });

  try {
    await writeDb(db);
    res.json({
      success: true,
      message: `Complaint ${tid} status updated to ${status}.`,
      complaint
    });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to update status in database: ${err.message}` });
  }
});

// POST /api/complaints/:tracking_id/social-draft
app.post('/api/complaints/:tracking_id/social-draft', (req: Request, res: Response) => {
  const tid = req.params.tracking_id.trim().toUpperCase();
  const db = readDb();
  const complaint = db.complaints.find(c => c.trackingId.toUpperCase() === tid);

  if (!complaint) {
    return res.status(404).json({ error: `Complaint '${tid}' not found.` });
  }

  const issueTitles: Record<string, string> = {
    pothole: 'Road Hazard / Pothole Issue',
    garbage: 'Solid Waste / Garbage Accumulation',
    streetlight: 'Streetlight Outage / Malfunction',
    waterlogging: 'Stormwater Drain / Waterlogging'
  };

  const title = issueTitles[complaint.issue] || complaint.issue.toUpperCase();
  const draftText = `📢 Civic Grievance Logged with @AmdavadAMC Demo System

📍 Location: ${complaint.area}, Ward ${complaint.ward} (${complaint.wardName}, ${complaint.zone} Zone)
⚠️ Issue: ${title}
🏢 Department: ${complaint.department}
🔖 Tracking ID: #${complaint.trackingId}
📊 Status: ${complaint.status} (Filed: ${new Date(complaint.filedAt).toLocaleDateString()})
📝 Description: "${complaint.description}"

Track progress live on the CivicFlow AI citizen portal. #Ahmedabad #AhmedabadCivic #AmdavadAMC #CitizenVoice #SmartCity`;

  res.json({
    success: true,
    trackingId: complaint.trackingId,
    draftText,
    suggestedTags: ['#Ahmedabad', '#CivicFlowAI', '#AmdavadAMC', '#AhmedabadCivic', '#SmartCityAhmedabad', '#CitizenVoice'],
    disclaimer: 'Draft created for citizen awareness and manual publishing. CivicFlow AI does not auto-post to external networks.'
  });
});

// POST /api/agent/chat - Natural Language Agent with Gemini Function Calling
app.post('/api/agent/chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    // Graceful fallback when API key is not yet set
    const db = readDb();
    const tidMatch = message.match(/AMC-\d{4}-\d{6}/i);
    if (tidMatch) {
      const targetTid = tidMatch[0].toUpperCase();
      const rec = db.complaints.find(c => c.trackingId.toUpperCase() === targetTid);
      if (rec) {
        return res.json({
          reply: `Tracking ID **${rec.trackingId}** is currently **${rec.status}** with the **${rec.department}** in ${rec.area} (Ward ${rec.ward}, ${rec.zone} Zone).`,
          toolEvents: [
            { tool: 'get_complaint_status', args: { tracking_id: targetTid }, output: rec }
          ]
        });
      } else {
        return res.json({
          reply: `I searched the database, but no complaint was found with tracking ID "${targetTid}".`,
          toolEvents: [
            { tool: 'get_complaint_status', args: { tracking_id: targetTid }, output: { found: false } }
          ]
        });
      }
    }

    return res.json({
      reply: "Hello! I am the CivicFlow AI Assistant for Ahmedabad. You can ask me to check a complaint status (e.g., 'What is the status of AMC-2026-000123?'), locate your AMC ward, or find the responsible municipal department.",
      toolEvents: []
    });
  }

  try {
    const db = readDb();

    // Define function declarations for Gemini tool calling
    const getComplaintStatusDeclaration: FunctionDeclaration = {
      name: 'get_complaint_status',
      description: 'Fetch the real-time status and complete history of a complaint from the database using its tracking ID (e.g. AMC-2026-000123).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          tracking_id: {
            type: Type.STRING,
            description: 'The AMC tracking ID, formatted like AMC-2026-000123'
          }
        },
        required: ['tracking_id']
      }
    };

    const lookupWardDeclaration: FunctionDeclaration = {
      name: 'lookup_ward',
      description: 'Find the authoritative AMC ward, zone, and ward ID for an Ahmedabad area or locality name.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          area: {
            type: Type.STRING,
            description: 'Name of the area or landmark in Ahmedabad, e.g. Navrangpura, Kankaria, Bodakdev'
          }
        },
        required: ['area']
      }
    };

    const lookupDepartmentDeclaration: FunctionDeclaration = {
      name: 'lookup_department',
      description: 'Identify which Ahmedabad Municipal Corporation department handles a specific civic issue type.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          issue: {
            type: Type.STRING,
            description: 'The civic issue category: pothole, garbage, streetlight, or waterlogging'
          }
        },
        required: ['issue']
      }
    };

    const listComplaintsDeclaration: FunctionDeclaration = {
      name: 'list_complaints',
      description: 'List or search complaints from the database by issue, status, severity, or ward.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          issue: { type: Type.STRING, description: 'Optional issue filter (pothole, garbage, streetlight, waterlogging)' },
          status: { type: Type.STRING, description: 'Optional status filter (Submitted, Assigned, In Progress, Resolved)' },
          ward: { type: Type.STRING, description: 'Optional ward ID filter (e.g. W12, W27)' }
        }
      }
    };

    // System instruction strictly prohibiting invented data
    const systemPrompt = `You are CivicFlow AI, an intelligent civic assistant for Ahmedabad Municipal Corporation (AMC) demo.
CRITICAL INTEGRITY RULES:
1. NEVER invent, guess, or hallucinate a complaint status, ward ID, department, or date.
2. ALWAYS use the provided tools (get_complaint_status, lookup_ward, lookup_department, list_complaints) to retrieve facts from the actual database.
3. If a tracking ID does not exist in the database, explicitly state that no record was found in the demo system.
4. When reporting a status, clearly state: tracking ID, current status, responsible department, area, and ward.
5. Always maintain a polite, helpful civic tone. Remind the user this is a demonstration environment when appropriate.`;

    const toolEvents: Array<{ tool: string; args: any; output: any }> = [];

    // Step 1: Initial call to Gemini with tools
    const response1 = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        tools: [{
          functionDeclarations: [
            getComplaintStatusDeclaration,
            lookupWardDeclaration,
            lookupDepartmentDeclaration,
            listComplaintsDeclaration
          ]
        }]
      }
    });

    // Check if Gemini invoked any function call
    const functionCalls = response1.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      let toolResult: any = null;

      if (call.name === 'get_complaint_status') {
        const tid = String(call.args?.tracking_id || '').toUpperCase().trim();
        const found = db.complaints.find(c => c.trackingId.toUpperCase() === tid);
        toolResult = found
          ? { found: true, ...found }
          : { found: false, trackingId: tid, message: `No complaint found with ID ${tid}.` };
        toolEvents.push({ tool: call.name, args: call.args, output: toolResult });
      } else if (call.name === 'lookup_ward') {
        const area = String(call.args?.area || '');
        toolResult = matchWard(area, db.wards);
        toolEvents.push({ tool: call.name, args: call.args, output: toolResult });
      } else if (call.name === 'lookup_department') {
        const issue = String(call.args?.issue || '').toLowerCase();
        const dept = DEPARTMENT_MAPPING[issue] || 'Citizen Grievance Redressal Cell';
        toolResult = { issue, department: dept };
        toolEvents.push({ tool: call.name, args: call.args, output: toolResult });
      } else if (call.name === 'list_complaints') {
        const { issue, status, ward } = call.args || {};
        let list = db.complaints;
        if (issue) list = list.filter(c => c.issue.toLowerCase() === String(issue).toLowerCase());
        if (status) list = list.filter(c => c.status.toLowerCase() === String(status).toLowerCase());
        if (ward) list = list.filter(c => c.ward.toUpperCase() === String(ward).toUpperCase());
        toolResult = { count: list.length, sample: list.slice(0, 5) };
        toolEvents.push({ tool: call.name, args: call.args, output: toolResult });
      }

      // Step 2: Pass tool result back to Gemini for grounded answer (preserving thoughtSignature from candidate content)
      let replyText = '';
      try {
        const modelContent = response1.candidates?.[0]?.content;
        const response2 = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            { role: 'user', parts: [{ text: message }] },
            modelContent!,
            {
              role: 'user',
              parts: [{
                functionResponse: {
                  name: call.name,
                  response: toolResult
                }
              }]
            }
          ],
          config: {
            systemInstruction: systemPrompt
          }
        });
        replyText = response2.text || '';
      } catch (genErr: any) {
        console.warn('Fallback to direct toolResult summary:', genErr);
        if (call.name === 'get_complaint_status') {
          if (toolResult?.found) {
            replyText = `Complaint **${toolResult.trackingId}** is currently **${toolResult.status}** with the **${toolResult.department}** in ${toolResult.area} (Ward ${toolResult.ward}, ${toolResult.zone} Zone).\n\n• **Issue:** ${toolResult.issue} (${toolResult.severity || 'medium'} severity)\n• **Description:** ${toolResult.description}\n• **Filed Date:** ${new Date(toolResult.filedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n• **Latest Status Note:** ${toolResult.statusHistory?.[toolResult.statusHistory.length - 1]?.note || 'Record verified'}`;
          } else {
            replyText = `No complaint was found in the Ahmedabad demo database matching tracking ID "${call.args?.tracking_id}".`;
          }
        } else if (call.name === 'lookup_ward') {
          replyText = toolResult?.matched
            ? `Area **${toolResult.matchedArea}** is mapped to **Ward ${toolResult.wardId} (${toolResult.wardName})**, ${toolResult.zone} Zone of Ahmedabad.`
            : `Area could not be matched. Known areas: ${toolResult?.suggestions?.slice(0, 6).join(', ')}.`;
        } else if (call.name === 'lookup_department') {
          replyText = `Civic issue **${toolResult.issue}** is handled by AMC **${toolResult.department}**.`;
        } else {
          replyText = `Database query completed: found ${toolResult?.count || 0} matching records.`;
        }
      }

      return res.json({
        reply: replyText,
        toolEvents
      });
    }

    // Direct text answer without tool call
    return res.json({
      reply: response1.text || 'How can I assist you with Ahmedabad civic complaints today?',
      toolEvents
    });
  } catch (err: any) {
    console.error('Agent chat error:', err);
    return res.status(500).json({
      error: `Agent processing failed: ${err.message || 'Service error'}`
    });
  }
});

// GET /api/openapi.json
app.get('/api/openapi.json', (req: Request, res: Response) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'CivicFlow AI — Ahmedabad Civic Complaint API',
      version: '1.0.0',
      description: 'REST API for reporting civic issues, Gemini multimodal verification, ward lookup, and tracking.'
    },
    paths: {
      '/api/health': { get: { summary: 'Health check and service status' } },
      '/api/wards': { get: { summary: 'Authoritative list of Ahmedabad municipal wards' } },
      '/api/departments': { get: { summary: 'Civic issue to department mappings' } },
      '/api/analyze': { post: { summary: 'Analyze photo using Gemini vision' } },
      '/api/resolve-location': { post: { summary: 'Resolve area and coordinates to AMC ward' } },
      '/api/check-duplicate': { post: { summary: 'Detect recent duplicate submissions in area' } },
      '/api/complaints': {
        get: { summary: 'List and filter complaints' },
        post: { summary: 'Create a confirmed complaint in database' }
      },
      '/api/complaints/{tracking_id}': { get: { summary: 'Fetch complaint details' } },
      '/api/complaints/{tracking_id}/status': { get: { summary: 'Fetch live status and history' } },
      '/api/admin/complaints/{tracking_id}/status': { post: { summary: 'Admin update complaint status' } },
      '/api/complaints/{tracking_id}/social-draft': { post: { summary: 'Draft civic awareness post' } },
      '/api/agent/chat': { post: { summary: 'Natural language agent with Gemini function calling' } }
    }
  });
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CivicFlow AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
