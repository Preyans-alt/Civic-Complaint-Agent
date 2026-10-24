export interface SampleImageItem {
  id: string;
  title: string;
  category: 'pothole' | 'garbage' | 'streetlight' | 'waterlogging';
  suggestedArea: string;
  landmark: string;
  description: string;
  base64Data: string;
  mimeType: string;
}

// Crisp, high-detail SVG graphics converted to base64 Data URIs
const potholeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <radialGradient id="asphalt" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </radialGradient>
    <radialGradient id="crater" cx="45%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="70%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#334155"/>
    </radialGradient>
  </defs>
  <!-- Road surface -->
  <rect width="600" height="400" fill="url(#asphalt)"/>
  <!-- Road road markings -->
  <line x1="0" y1="200" x2="160" y2="200" stroke="#facc15" stroke-width="8" stroke-dasharray="25 20"/>
  <line x1="440" y1="200" x2="600" y2="200" stroke="#facc15" stroke-width="8" stroke-dasharray="25 20"/>
  <!-- Broken asphalt and deep pothole crater -->
  <path d="M 180,170 Q 230,130 320,140 Q 420,150 440,210 Q 450,280 380,310 Q 280,330 200,280 Q 150,240 180,170 Z" fill="url(#crater)" stroke="#090d16" stroke-width="5"/>
  <!-- Inner crater depth & broken edges -->
  <path d="M 220,185 Q 280,160 360,170 Q 400,210 370,260 Q 300,290 230,250 Z" fill="#020617"/>
  <!-- Exposed aggregate / gravel texture -->
  <circle cx="250" cy="210" r="8" fill="#94a3b8"/>
  <circle cx="280" cy="240" r="12" fill="#cbd5e1"/>
  <circle cx="320" cy="205" r="10" fill="#64748b"/>
  <circle cx="340" cy="245" r="7" fill="#94a3b8"/>
  <circle cx="290" cy="180" r="6" fill="#cbd5e1"/>
  <circle cx="370" cy="220" r="9" fill="#475569"/>
  <!-- Asphalt cracks -->
  <path d="M 180,170 L 130,130 M 440,210 L 510,190 M 380,310 L 410,360 M 200,280 L 140,320 M 320,140 L 330,90" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
  <!-- Text watermark indicator for AI analysis context -->
  <rect x="20" y="20" width="220" height="34" rx="6" fill="#000000" fill-opacity="0.6"/>
  <text x="32" y="42" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">CIVIC ISSUE: DEEP POTHOLE</text>
</svg>
`;

const garbageSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
    <linearGradient id="bin" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#15803d"/>
      <stop offset="50%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#166534"/>
    </linearGradient>
  </defs>
  <!-- Background wall and sidewalk -->
  <rect width="600" height="240" fill="#e2e8f0"/>
  <rect y="240" width="600" height="160" fill="url(#ground)"/>
  <line x1="0" y1="240" x2="600" y2="240" stroke="#64748b" stroke-width="4"/>
  <!-- Green Municipal Waste Bin overflowing -->
  <path d="M 220,140 L 380,140 L 360,330 L 240,330 Z" fill="url(#bin)" stroke="#14532d" stroke-width="3"/>
  <rect x="210" y="130" width="180" height="15" rx="4" fill="#14532d"/>
  <text x="300" y="240" text-anchor="middle" fill="#f0fdf4" font-family="sans-serif" font-weight="bold" font-size="16">AMC SWM BIN</text>
  <!-- Overflowing waste bags and refuse -->
  <ellipse cx="280" cy="120" rx="35" ry="25" fill="#3b82f6"/>
  <ellipse cx="320" cy="115" rx="30" ry="22" fill="#ef4444"/>
  <ellipse cx="300" cy="95" rx="28" ry="20" fill="#eab308"/>
  <ellipse cx="350" cy="130" rx="25" ry="18" fill="#1e293b"/>
  <!-- Scattered trash on sidewalk ground -->
  <ellipse cx="180" cy="310" rx="30" ry="18" fill="#ef4444"/>
  <ellipse cx="210" cy="340" rx="25" ry="15" fill="#3b82f6"/>
  <ellipse cx="390" cy="320" rx="35" ry="20" fill="#eab308"/>
  <ellipse cx="430" cy="335" rx="28" ry="16" fill="#10b981"/>
  <rect x="150" y="325" width="20" height="12" fill="#ffffff" stroke="#94a3b8"/>
  <circle cx="380" cy="350" r="10" fill="#f97316"/>
  <circle cx="160" cy="345" r="8" fill="#64748b"/>
  <!-- Badge -->
  <rect x="20" y="20" width="240" height="34" rx="6" fill="#000000" fill-opacity="0.6"/>
  <text x="32" y="42" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">CIVIC ISSUE: GARBAGE DUMP</text>
</svg>
`;

const streetlightSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <!-- Night / dusk dark sky -->
  <rect width="600" height="400" fill="#090d16"/>
  <!-- Road at night -->
  <polygon points="0,400 600,400 450,260 150,260" fill="#1e293b"/>
  <!-- Streetlight pole -->
  <rect x="285" y="60" width="14" height="260" fill="#64748b"/>
  <path d="M 292,60 Q 292,20 240,25 L 210,35" stroke="#64748b" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- Streetlight fixture head (unlit / broken, with dangling spark wire) -->
  <path d="M 190,32 L 230,40 L 220,55 L 180,48 Z" fill="#334155" stroke="#94a3b8" stroke-width="2"/>
  <ellipse cx="205" cy="50" rx="15" ry="5" fill="#475569"/>
  <!-- Spark / broken wire dangling -->
  <path d="M 205,52 Q 200,75 210,95 L 205,105" stroke="#ef4444" stroke-width="3" fill="none" stroke-dasharray="4 2"/>
  <circle cx="205" cy="106" r="4" fill="#fbbf24"/>
  <!-- Warning badge -->
  <rect x="20" y="20" width="260" height="34" rx="6" fill="#000000" fill-opacity="0.6"/>
  <text x="32" y="42" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">CIVIC ISSUE: BROKEN STREETLIGHT</text>
</svg>
`;

const waterloggingSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="floodWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.7"/>
      <stop offset="50%" stop-color="#1d4ed8" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <!-- Overcast sky & buildings -->
  <rect width="600" height="180" fill="#64748b"/>
  <rect x="40" y="70" width="80" height="110" fill="#475569"/>
  <rect x="140" y="50" width="100" height="130" fill="#334155"/>
  <rect x="420" y="60" width="120" height="120" fill="#475569"/>
  <!-- Roadway submerged by rainwater -->
  <rect y="180" width="600" height="220" fill="#334155"/>
  <!-- Submerged water pool -->
  <rect y="210" width="600" height="190" fill="url(#floodWater)"/>
  <!-- Water ripples -->
  <ellipse cx="250" cy="270" rx="90" ry="12" fill="none" stroke="#93c5fd" stroke-width="2"/>
  <ellipse cx="400" cy="320" rx="120" ry="14" fill="none" stroke="#93c5fd" stroke-width="2"/>
  <ellipse cx="160" cy="340" rx="70" ry="9" fill="none" stroke="#60a5fa" stroke-width="2"/>
  <!-- Choked drain grate partially visible underwater -->
  <rect x="460" y="270" width="80" height="50" fill="#0f172a" stroke="#64748b" stroke-width="3"/>
  <line x1="475" y1="270" x2="475" y2="320" stroke="#94a3b8" stroke-width="4"/>
  <line x1="495" y1="270" x2="495" y2="320" stroke="#94a3b8" stroke-width="4"/>
  <line x1="515" y1="270" x2="515" y2="320" stroke="#94a3b8" stroke-width="4"/>
  <!-- Debris choking grate -->
  <ellipse cx="490" cy="285" rx="20" ry="10" fill="#78350f"/>
  <ellipse cx="510" cy="295" rx="15" ry="8" fill="#15803d"/>
  <!-- Badge -->
  <rect x="20" y="20" width="280" height="34" rx="6" fill="#000000" fill-opacity="0.6"/>
  <text x="32" y="42" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold">CIVIC ISSUE: WATERLOGGED ROAD</text>
</svg>
`;

function svgToBase64(svg: string): string {
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(svg.trim())));
  }
  return Buffer.from(svg.trim()).toString('base64');
}

export const SAMPLE_CIVIC_IMAGES: SampleImageItem[] = [
  {
    id: 'sample-pothole',
    title: 'Severe Asphalt Pothole',
    category: 'pothole',
    suggestedArea: 'Navrangpura',
    landmark: 'Near Municipal Market, CG Road',
    description: 'Deep road surface crater and broken asphalt causing vehicle skid hazard.',
    base64Data: svgToBase64(potholeSvg),
    mimeType: 'image/svg+xml'
  },
  {
    id: 'sample-garbage',
    title: 'Overflowing Municipal Bin',
    category: 'garbage',
    suggestedArea: 'Kankaria',
    landmark: 'Near Gate No. 3, Lakefront walkway',
    description: 'Solid waste accumulation and spilled refuse blocking pedestrian footpath.',
    base64Data: svgToBase64(garbageSvg),
    mimeType: 'image/svg+xml'
  },
  {
    id: 'sample-streetlight',
    title: 'Unlit Broken Streetlight',
    category: 'streetlight',
    suggestedArea: 'Satellite',
    landmark: 'Shivranjani Cross Roads, near BRTS',
    description: 'Streetlight luminaire damaged with exposed wiring causing dark street section.',
    base64Data: svgToBase64(streetlightSvg),
    mimeType: 'image/svg+xml'
  },
  {
    id: 'sample-waterlogging',
    title: 'Choked Drain & Waterlogging',
    category: 'waterlogging',
    suggestedArea: 'CG Road',
    landmark: 'Opposite Stadium Circle underpass',
    description: 'Stormwater drain choked with silt causing 8-inch water stagnation on main road.',
    base64Data: svgToBase64(waterloggingSvg),
    mimeType: 'image/svg+xml'
  }
];
