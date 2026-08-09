import { Grievance, CivicCluster, Department, GrievanceCategory, GrievanceSeverity, GrievanceStatus, StatusUpdate } from '../types';

export const DEPARTMENTS: Department[] = [
  {
    id: 'dept-electrical',
    name: 'Municipal Electrical Department',
    responsibleOfficer: 'Mr. A. K. Banerjee (Executive Engineer)',
    slaHours: { LOW: 72, MEDIUM: 48, HIGH: 24, CRITICAL: 12 }
  },
  {
    id: 'dept-solid-waste',
    name: 'Solid Waste Management Department',
    responsibleOfficer: 'Mrs. S. Roy (Chief Sanitary Inspector)',
    slaHours: { LOW: 48, MEDIUM: 36, HIGH: 24, CRITICAL: 12 }
  },
  {
    id: 'dept-water-supply',
    name: 'Water Supply and Sewerage Board',
    responsibleOfficer: 'Mr. S. Dasgupta (Superintending Engineer)',
    slaHours: { LOW: 72, MEDIUM: 48, HIGH: 24, CRITICAL: 8 }
  },
  {
    id: 'dept-roads',
    name: 'Roads & Public Works Department (PWD)',
    responsibleOfficer: 'Mr. R. Sen (Superintendent Engineer)',
    slaHours: { LOW: 120, MEDIUM: 72, HIGH: 48, CRITICAL: 24 }
  },
  {
    id: 'dept-public-safety',
    name: 'Municipal Security & Police Coordination cell',
    responsibleOfficer: 'Inspector T. Mukherjee',
    slaHours: { LOW: 24, MEDIUM: 12, HIGH: 6, CRITICAL: 2 }
  },
  {
    id: 'dept-admin',
    name: 'Municipal Administrative Oversight & Vigilance Cell',
    responsibleOfficer: 'Ms. P. Ghosal (Deputy Commissioner)',
    slaHours: { LOW: 72, MEDIUM: 48, HIGH: 36, CRITICAL: 24 }
  }
];

// Helper to get department by category
export function getDepartmentByCategory(category: GrievanceCategory): Department {
  switch (category) {
    case 'Electricity':
      return DEPARTMENTS[0];
    case 'Waste':
    case 'Sanitation':
      return DEPARTMENTS[1];
    case 'Water':
      return DEPARTMENTS[2];
    case 'Road':
    case 'Transport':
      return DEPARTMENTS[3];
    case 'Public Safety':
    case 'Harassment':
      return DEPARTMENTS[4];
    case 'Corruption':
      return DEPARTMENTS[5];
    default:
      return DEPARTMENTS[5];
  }
}

// Generate seeded data
let grievances: Grievance[] = [];
let clusters: CivicCluster[] = [];

// Seed Kolkata coordinates
const KOLKATA_CENTER = { lat: 22.5726, lng: 88.3639 };

// Helper to get random coordinate within radius in degrees
// ~111km per degree. 0.001 deg is ~110 meters
function getRandomOffset(radiusMeters: number) {
  const r = radiusMeters / 111000;
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  return { latOffset: x, lngOffset: y };
}

// Seed the 15 Streetlight Failure Cluster in Ward 12 (College Road / College Square)
// Center: lat: 22.5745, lng: 88.3642
const streetlightClusterId = 'cluster-streetlight-ward12';
const streetlightCenter = { lat: 22.5745, lng: 88.3642 };
const streetlightDepartment = getDepartmentByCategory('Electricity');

for (let i = 0; i < 15; i++) {
  const { latOffset, lngOffset } = getRandomOffset(180); // within 180 meters
  const lat = streetlightCenter.lat + latOffset;
  const lng = streetlightCenter.lng + lngOffset;
  const daysAgo = Math.floor(Math.random() * 10) + 8; // 8-18 days old
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - i * 30 * 60 * 1000).toISOString();
  
  // Custom timelines for a few to make them look authentic
  let status: GrievanceStatus = 'ASSIGNED';
  let timeline: StatusUpdate[] = [
    { status: 'REPORTED', note: 'Broken streetlight has made the alley pitch dark and unsafe for female commuters.', updatedAt: createdAt, updatedBy: i === 0 ? 'Amit Das' : `Citizen #${i + 1}` }
  ];

  if (i < 5) {
    status = 'WORK_STARTED';
    timeline.push({ status: 'AI_CLASSIFIED', note: 'AI classified as Electrical Infrastructure. Confidence 98%. Route: Municipal Electrical Department.', updatedAt: new Date(new Date(createdAt).getTime() + 1000 * 60).toISOString(), updatedBy: 'AI Engine' });
    timeline.push({ status: 'VERIFIED', note: 'Ground engineer verified the report.', updatedAt: new Date(new Date(createdAt).getTime() + 2 * 60 * 60 * 1000).toISOString(), updatedBy: streetlightDepartment.responsibleOfficer });
    timeline.push({ status: 'ASSIGNED', note: 'Ticket dispatched to Ward 12 Electrical Repair Team.', updatedAt: new Date(new Date(createdAt).getTime() + 4 * 60 * 60 * 1000).toISOString(), updatedBy: streetlightDepartment.responsibleOfficer });
    timeline.push({ status: 'WORK_STARTED', note: 'Maintenance van dispatched. Cable checking in progress.', updatedAt: new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'Electrical Repair Team Alpha' });
  } else if (i < 10) {
    status = 'ASSIGNED';
    timeline.push({ status: 'AI_CLASSIFIED', note: 'AI classified as Electrical Infrastructure. Route: Municipal Electrical Department.', updatedAt: new Date(new Date(createdAt).getTime() + 1000 * 60).toISOString(), updatedBy: 'AI Engine' });
    timeline.push({ status: 'ASSIGNED', note: 'Assigned to Ward 12 Electrical team.', updatedAt: new Date(new Date(createdAt).getTime() + 6 * 60 * 60 * 1000).toISOString(), updatedBy: streetlightDepartment.responsibleOfficer });
  }

  // Make one complaint "Awaiting Citizen Verification" to drive the main demo flow!
  // This is complaint #0, which we will use as the primary detail demo
  if (i === 0) {
    status = 'AUTHORITY_RESOLVED';
    timeline = [
      { status: 'REPORTED', note: 'The streetlights on College Road have not been working for several days and the road becomes unsafe at night.', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'Amit Das' },
      { status: 'AI_CLASSIFIED', note: 'AI classified as Electrical Infrastructure (Electricity). Route: Municipal Electrical Department. Priority: HIGH. Cluster check: Potential match with 14 other reports.', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 1000).toISOString(), updatedBy: 'AI Engine' },
      { status: 'VERIFIED', note: 'Complaint verified. Local resident reports confirm complete blackout along College Road.', updatedAt: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: streetlightDepartment.responsibleOfficer },
      { status: 'ASSIGNED', note: 'Assigned to Municipal Electrical Repair Team 3.', updatedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: streetlightDepartment.responsibleOfficer },
      { status: 'WORK_STARTED', note: 'Work started. Replacing blown fuse box and burned out LED heads.', updatedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'Repair Team 3' },
      { status: 'AUTHORITY_RESOLVED', note: 'All 8 lamps along College Road repaired and tested. Photo uploaded.', updatedAt: new Date(Date.now() - 0.2 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'Repair Team 3', evidenceUrl: 'https://images.unsplash.com/photo-1509024640748-024a72d0c518?w=800&q=80' } // Street light on
    ];
  }

  const slaHours = streetlightDepartment.slaHours.HIGH;
  const slaDeadline = new Date(new Date(createdAt).getTime() + slaHours * 60 * 60 * 1000).toISOString();

  grievances.push({
    id: i === 0 ? 'CT-KOL-2026-1042' : `CT-KOL-2026-104${i + 2}`,
    title: i === 0 ? 'Streetlight not working near College Road' : `Out of service streetlight #${i + 1}`,
    description: i === 0 
      ? 'The streetlights on College Road have not been working for several days and the road becomes unsafe at night.' 
      : `Streetlight not working at coordinate offset. The entire section is pitch dark after 6 PM.`,
    category: 'Electricity',
    severity: 'HIGH',
    latitude: lat,
    longitude: lng,
    landmark: 'Near College Square Gate 2',
    createdAt,
    status,
    isAnonymous: Math.random() > 0.7,
    authorityId: streetlightDepartment.id,
    clusterId: streetlightClusterId,
    reporterId: i === 0 ? 'user-amit' : `user-citizen-${i}`,
    evidence: i === 0 ? ['https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=800&q=80'] : [], // Dark street
    timeline,
    citizenConfirmations: Math.floor(Math.random() * 5) + 1,
    slaDeadline,
    isEscalated: new Date(slaDeadline) < new Date() && status !== 'AUTHORITY_RESOLVED' && (status as string) !== 'CITIZEN_VERIFIED' && (status as string) !== 'CLOSED',
    escalatedTo: new Date(slaDeadline) < new Date() && status !== 'AUTHORITY_RESOLVED' && (status as string) !== 'CITIZEN_VERIFIED' && (status as string) !== 'CLOSED' ? 'Zone 4 Supervisor' : undefined
  });
}

// Add the Streetlight cluster to the cluster array
clusters.push({
  id: streetlightClusterId,
  title: 'Streetlight Failure Cluster',
  category: 'Electricity',
  latitude: streetlightCenter.lat,
  longitude: streetlightCenter.lng,
  radiusMeters: 220,
  createdAt: grievances.filter(g => g.clusterId === streetlightClusterId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0].createdAt,
  lastReportedAt: grievances.filter(g => g.clusterId === streetlightClusterId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt,
  severity: 'HIGH',
  status: 'ASSIGNED', // overall cluster status
  authorityId: streetlightDepartment.id,
  reportsCount: 15,
  citizenConfirmations: 43,
  description: '15 reports of streetlight failure clustered within 220m affected radius in Ward 12. Multiple reports indicate a common line fuse issue near College Square.'
});


// Seed 8 Garbage Accumulation complaints in Ward 10 (MG Road area)
// Center: lat: 22.5802, lng: 88.3715
const garbageClusterId = 'cluster-garbage-ward10';
const garbageCenter = { lat: 22.5802, lng: 88.3715 };
const garbageDepartment = getDepartmentByCategory('Waste');

for (let i = 0; i < 8; i++) {
  const { latOffset, lngOffset } = getRandomOffset(90);
  const lat = garbageCenter.lat + latOffset;
  const lng = garbageCenter.lng + lngOffset;
  const daysAgo = Math.floor(Math.random() * 4) + 1; // 1-5 days old
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  
  const status: GrievanceStatus = i < 3 ? 'VERIFIED' : 'REPORTED';
  const timeline: StatusUpdate[] = [
    { status: 'REPORTED', note: 'Huge heap of domestic waste dumped on the roadside. Stray dogs spreading it everywhere. Severe stench.', updatedAt: createdAt, updatedBy: `Citizen #G${i + 1}` }
  ];

  if (i < 3) {
    timeline.push({ status: 'AI_CLASSIFIED', note: 'AI classified as Waste & Sanitation. Route: Solid Waste Management Department.', updatedAt: new Date(new Date(createdAt).getTime() + 1000 * 45).toISOString(), updatedBy: 'AI Engine' });
    timeline.push({ status: 'VERIFIED', note: 'Sanitation Inspector confirmed overflowing container.', updatedAt: new Date(new Date(createdAt).getTime() + 5 * 60 * 60 * 1000).toISOString(), updatedBy: garbageDepartment.responsibleOfficer });
  }

  const slaDeadline = new Date(new Date(createdAt).getTime() + garbageDepartment.slaHours.MEDIUM * 60 * 60 * 1000).toISOString();

  grievances.push({
    id: `CT-KOL-2026-20${i + 10}`,
    title: `Overflowing garbage container near Ward 10 block market`,
    description: `Overflowing garbage container has not been cleared for 4 days. Stench is unbearable, affecting surrounding shops.`,
    category: 'Waste',
    severity: 'MEDIUM',
    latitude: lat,
    longitude: lng,
    landmark: 'Opposite MG Road Metro Gate 1',
    createdAt,
    status,
    isAnonymous: false,
    authorityId: garbageDepartment.id,
    clusterId: garbageClusterId,
    reporterId: `user-citizen-g${i}`,
    evidence: i === 0 ? ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800&q=80'] : [], // Garbage image
    timeline,
    citizenConfirmations: Math.floor(Math.random() * 3) + 1,
    slaDeadline,
    isEscalated: false
  });
}

clusters.push({
  id: garbageClusterId,
  title: 'Garbage Accumulation Cluster',
  category: 'Waste',
  latitude: garbageCenter.lat,
  longitude: garbageCenter.lng,
  radiusMeters: 120,
  createdAt: grievances.filter(g => g.clusterId === garbageClusterId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0].createdAt,
  lastReportedAt: grievances.filter(g => g.clusterId === garbageClusterId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt,
  severity: 'MEDIUM',
  status: 'VERIFIED',
  authorityId: garbageDepartment.id,
  reportsCount: 8,
  citizenConfirmations: 19,
  description: '8 reports of overflowing domestic garbage containers within 120m affected radius. Located near MG Road Block Market.'
});


// Seed 7 Water Pipeline Leakages in Ward 8 (Bowbazar Area)
// Center: lat: 22.5651, lng: 88.3582
const waterClusterId = 'cluster-water-ward8';
const waterCenter = { lat: 22.5651, lng: 88.3582 };
const waterDepartment = getDepartmentByCategory('Water');

for (let i = 0; i < 7; i++) {
  const { latOffset, lngOffset } = getRandomOffset(150);
  const lat = waterCenter.lat + latOffset;
  const lng = waterCenter.lng + lngOffset;
  const daysAgo = Math.floor(Math.random() * 6) + 4; // 4-10 days old
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  
  // Make one breach SLA to demonstrate automatic escalation!
  const status: GrievanceStatus = i === 0 ? 'ASSIGNED' : 'REPORTED';
  const timeline: StatusUpdate[] = [
    { status: 'REPORTED', note: 'Main drinking water pipeline is leaking. Drinking water is flooding the street and being wasted.', updatedAt: createdAt, updatedBy: `Citizen #W${i + 1}` }
  ];

  if (i === 0) {
    timeline.push({ status: 'AI_CLASSIFIED', note: 'AI classified as Water Supply. Priority: HIGH. Route: Water Supply and Sewerage Board.', updatedAt: new Date(new Date(createdAt).getTime() + 1000 * 30).toISOString(), updatedBy: 'AI Engine' });
    timeline.push({ status: 'VERIFIED', note: 'Verified by Ward 8 water inspector. Valve leakage identified.', updatedAt: new Date(new Date(createdAt).getTime() + 8 * 60 * 60 * 1000).toISOString(), updatedBy: waterDepartment.responsibleOfficer });
    timeline.push({ status: 'ASSIGNED', note: 'Assigned to Central Repair Unit.', updatedAt: new Date(new Date(createdAt).getTime() + 12 * 60 * 60 * 1000).toISOString(), updatedBy: waterDepartment.responsibleOfficer });
    // Simulate SLA Breach Escalation
    timeline.push({ status: 'ASSIGNED', note: 'RESPONSE SLA BREACH EXCEEDED (24 hours limit). Escalating ticket to Zone 2 Assistant Engineer.', updatedAt: new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'AI System' });
  }

  const slaDeadline = new Date(new Date(createdAt).getTime() + waterDepartment.slaHours.HIGH * 60 * 60 * 1000).toISOString();
  const isEscalated = i === 0;

  grievances.push({
    id: `CT-KOL-2026-30${i + 10}`,
    title: i === 0 ? 'Severe water pipeline leakage on Bowbazar Main Crossing' : `Water pipeline leakage offset #${i+1}`,
    description: 'Drinking water pipe has ruptured, shooting a 2-foot fountain of water. Road is completely flooded, creating traffic jams.',
    category: 'Water',
    severity: 'HIGH',
    latitude: lat,
    longitude: lng,
    landmark: 'Near Bowbazar Crossing',
    createdAt,
    status,
    isAnonymous: false,
    authorityId: waterDepartment.id,
    clusterId: waterClusterId,
    reporterId: `user-citizen-w${i}`,
    evidence: i === 0 ? ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80'] : [],
    timeline,
    citizenConfirmations: i === 0 ? 89 : Math.floor(Math.random() * 5) + 2,
    slaDeadline,
    isEscalated,
    escalatedTo: isEscalated ? 'Zone 2 Assistant Engineer' : undefined
  });
}

clusters.push({
  id: waterClusterId,
  title: 'Water Pipeline Leakage Cluster',
  category: 'Water',
  latitude: waterCenter.lat,
  longitude: waterCenter.lng,
  radiusMeters: 180,
  createdAt: grievances.filter(g => g.clusterId === waterClusterId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0].createdAt,
  lastReportedAt: grievances.filter(g => g.clusterId === waterClusterId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt,
  severity: 'HIGH',
  status: 'ASSIGNED',
  authorityId: waterDepartment.id,
  reportsCount: 7,
  citizenConfirmations: 120, // highly confirmed
  description: '7 reports of leaking municipal drinking water main pipelines. Massive water waste and local flooding centered near Bowbazar main crossing.'
});


// Seed 3 Isolated grievances
// 1. Pothole (Road) - Ward 12
const roadDepartment = getDepartmentByCategory('Road');
grievances.push({
  id: 'CT-KOL-2026-5001',
  title: 'Dangerous pothole on Sector 2 crossing road',
  description: 'A deep pothole of about 3 feet wide is right in the center of the turning road. Crucial safety risk for two-wheelers at night.',
  category: 'Road',
  severity: 'HIGH',
  latitude: 22.5710,
  longitude: 88.3660,
  landmark: 'Near PC Chandra Jewellers lane',
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'ASSIGNED',
  isAnonymous: false,
  authorityId: roadDepartment.id,
  reporterId: 'user-amit',
  evidence: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800&q=80'],
  timeline: [
    { status: 'REPORTED', note: 'Deep pothole reported at the Sector 2 main turn. Already caused two bike falls.', updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'Amit Das' },
    { status: 'AI_CLASSIFIED', note: 'AI classified as Road Infrastructure. Priority: HIGH. Route: Roads & PWD Department.', updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 1000).toISOString(), updatedBy: 'AI Engine' },
    { status: 'ASSIGNED', note: 'Dispatched to PWD Road Filling Unit 5.', updatedAt: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: roadDepartment.responsibleOfficer }
  ],
  citizenConfirmations: 14,
  slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  isEscalated: false
});

// 2. Bribery / Corruption (Sensitive)
const adminDepartment = getDepartmentByCategory('Corruption');
grievances.push({
  id: 'CT-KOL-2026-6002',
  title: 'Demand for bribe for trade license renewal',
  description: 'Clerk at Ward 12 Municipal office demanding ₹5,000 cash bribe to clear standard trade license renewal file, despite all paperwork being complete.',
  category: 'Corruption',
  severity: 'CRITICAL',
  latitude: 22.5740,
  longitude: 88.3648,
  landmark: 'Ward 12 Municipal Office Room 4',
  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'VERIFIED',
  isAnonymous: true, // anonymous reporting!
  authorityId: adminDepartment.id,
  reporterId: 'user-amit',
  evidence: [],
  timeline: [
    { status: 'REPORTED', note: 'Sensitive complaint filed anonymously regarding bribery demand in trade license renewal department.', updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'Anonymous Citizen' },
    { status: 'AI_CLASSIFIED', note: 'AI classified as Administrative Malpractice / Corruption. Priority: CRITICAL. Privacy filters applied: precise location coordinates masked. Routed directly to Oversight & Vigilance Cell.', updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 40 * 1000).toISOString(), updatedBy: 'AI Engine' },
    { status: 'VERIFIED', note: 'Vigilance officer reviewed. Standard file audit initiated for Trade License queue.', updatedAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: adminDepartment.responsibleOfficer }
  ],
  citizenConfirmations: 0, // no public confirms for sensitive corruption reports
  slaDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000).toISOString(),
  isEscalated: false
});

// 3. Sanitation / Open Sewage - Ward 10
grievances.push({
  id: 'CT-KOL-2026-7003',
  title: 'Broken open manhole lid on sidewalk',
  description: 'Concrete sewer lid has crumbled, leaving a dangerous 4-foot open drop on a busy pedestrian sidewalk. Pedestrians could fall in, especially in rainy dark conditions.',
  category: 'Sanitation',
  severity: 'HIGH',
  latitude: 22.5821,
  longitude: 88.3730,
  landmark: 'Outside HDFC Bank ATM',
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'CITIZEN_VERIFIED', // already solved and closed!
  isAnonymous: false,
  authorityId: garbageDepartment.id, // Waste/Sanitation shares this
  reporterId: 'user-citizen-g3',
  evidence: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80'],
  timeline: [
    { status: 'REPORTED', note: 'Open sewer manhole reported on busy shopping pathway.', updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'Citizen G3' },
    { status: 'AI_CLASSIFIED', note: 'AI classified as Sanitation Infrastructure. Routed to Solid Waste & Drainage.', updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 1000).toISOString(), updatedBy: 'AI Engine' },
    { status: 'ASSIGNED', note: 'Assigned to Ward 10 Sewage repair crew.', updatedAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: garbageDepartment.responsibleOfficer },
    { status: 'WORK_STARTED', note: 'Barricades placed. Replacement concrete cover cast.', updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'Sewage Crew B' },
    { status: 'AUTHORITY_RESOLVED', note: 'New reinforced concrete manhole lid successfully installed and secured.', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'Sewage Crew B', evidenceUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80' },
    { status: 'CITIZEN_VERIFIED', note: 'Confirmed resolved. Walkway is now safe to walk on again. Thank you for the quick work!', updatedAt: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'Citizen G3' },
    { status: 'CLOSED', note: 'Case marked closed upon successful verification by reporter.', updatedAt: new Date(Date.now() - 2.7 * 24 * 60 * 60 * 1000).toISOString(), updatedBy: 'AI System' }
  ],
  citizenConfirmations: 23,
  slaDeadline: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  isEscalated: false
});


// Core Functions
export function getGrievances(): Grievance[] {
  return grievances;
}

export function getGrievanceById(id: string): Grievance | undefined {
  return grievances.find(g => g.id === id);
}

export function getClusters(): CivicCluster[] {
  return clusters;
}

export function getClusterById(id: string): CivicCluster | undefined {
  return clusters.find(c => c.id === id);
}

// Calculate distance between two coordinates in meters (Haversine formula)
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export function createGrievance(data: {
  title: string;
  description: string;
  category: GrievanceCategory;
  latitude: number;
  longitude: number;
  landmark?: string;
  isAnonymous: boolean;
  reporterId: string;
  evidence: string[];
}): Grievance {
  const id = `CT-KOL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const createdAt = new Date().toISOString();
  
  const dept = getDepartmentByCategory(data.category);
  const slaDeadline = new Date(Date.now() + dept.slaHours.MEDIUM * 60 * 60 * 1000).toISOString();

  // AI Classification Preview
  const tempGrievance: Grievance = {
    id,
    title: data.title,
    description: data.description,
    category: data.category,
    severity: 'MEDIUM', // default
    latitude: data.latitude,
    longitude: data.longitude,
    landmark: data.landmark,
    createdAt,
    status: 'REPORTED',
    isAnonymous: data.isAnonymous,
    authorityId: dept.id,
    reporterId: data.reporterId,
    evidence: data.evidence,
    timeline: [],
    citizenConfirmations: 0,
    slaDeadline,
    isEscalated: false
  };

  // Perform Duplicate / Clustering Logic (220m radius check for same category)
  let foundCluster: CivicCluster | undefined = undefined;
  
  for (const cluster of clusters) {
    if (cluster.category === data.category) {
      const dist = getDistanceMeters(data.latitude, data.longitude, cluster.latitude, cluster.longitude);
      if (dist <= cluster.radiusMeters) {
        foundCluster = cluster;
        break;
      }
    }
  }

  // If no cluster is found, check if we can form a cluster with existing unclustered complaints of same category
  if (!foundCluster) {
    const nearbyUnclustered = grievances.filter(
      g => g.category === data.category && !g.clusterId && g.status !== 'CLOSED' && g.status !== 'CITIZEN_VERIFIED' &&
      getDistanceMeters(data.latitude, data.longitude, g.latitude, g.longitude) <= 220
    );

    // If there are at least 2 existing complaints nearby, we merge them into a new cluster!
    if (nearbyUnclustered.length >= 2) {
      const newClusterId = `cluster-${data.category.toLowerCase()}-${Math.floor(100 + Math.random() * 900)}`;
      
      // Calculate center of cluster based on average coordinates
      const allCoords = [tempGrievance, ...nearbyUnclustered];
      const avgLat = allCoords.reduce((sum, g) => sum + g.latitude, 0) / allCoords.length;
      const avgLng = allCoords.reduce((sum, g) => sum + g.longitude, 0) / allCoords.length;

      const newCluster: CivicCluster = {
        id: newClusterId,
        title: `Clustered ${data.category} Issues`,
        category: data.category,
        latitude: avgLat,
        longitude: avgLng,
        radiusMeters: 220,
        createdAt: new Date().toISOString(),
        lastReportedAt: new Date().toISOString(),
        severity: 'MEDIUM',
        status: 'ASSIGNED',
        authorityId: dept.id,
        reportsCount: allCoords.length,
        citizenConfirmations: allCoords.length * 3, // mock confirmations
        description: `Multiple reports of ${data.category} issues detected within a 220m radius. Handled as a unified infrastructure ticket.`
      };

      clusters.push(newCluster);
      foundCluster = newCluster;

      // Update all grouped complaints to bind to the new cluster
      allCoords.forEach(g => {
        const item = grievances.find(x => x.id === g.id);
        if (item) {
          item.clusterId = newClusterId;
        }
      });
      tempGrievance.clusterId = newClusterId;
    }
  } else {
    // Join existing cluster
    tempGrievance.clusterId = foundCluster.id;
    foundCluster.reportsCount += 1;
    foundCluster.citizenConfirmations += 1;
    foundCluster.lastReportedAt = createdAt;
  }

  // Build the final timeline
  tempGrievance.timeline = [
    { status: 'REPORTED', note: data.description, updatedAt: createdAt, updatedBy: data.isAnonymous ? 'Anonymous Citizen' : 'Amit Das' },
    { status: 'AI_CLASSIFIED', note: `AI classified as ${data.category}. Severity: MEDIUM. Route: ${dept.name}.${tempGrievance.clusterId ? ' Joined nearby active cluster.' : ''}`, updatedAt: new Date(Date.now() + 1000).toISOString(), updatedBy: 'AI Engine' }
  ];

  tempGrievance.status = 'AI_CLASSIFIED';
  
  // Save grievance in memory list
  grievances.push(tempGrievance);
  return tempGrievance;
}

export function addConfirmation(grievanceId: string): Grievance | undefined {
  const grievance = grievances.find(g => g.id === grievanceId);
  if (grievance) {
    grievance.citizenConfirmations += 1;
    grievance.timeline.push({
      status: grievance.status,
      note: 'Another citizen confirmed this issue by clicking "I\'m Affected Too".',
      updatedAt: new Date().toISOString(),
      updatedBy: 'Citizen Supporter'
    });

    // Also update cluster confirmations if attached
    if (grievance.clusterId) {
      const cluster = clusters.find(c => c.id === grievance.clusterId);
      if (cluster) {
        cluster.citizenConfirmations += 1;
      }
    }
  }
  return grievance;
}

export function updateGrievanceStatus(
  id: string,
  status: GrievanceStatus,
  note: string,
  updatedBy: string,
  evidenceUrl?: string
): Grievance | undefined {
  const grievance = grievances.find(g => g.id === id);
  if (grievance) {
    grievance.status = status;
    grievance.timeline.push({
      status,
      note,
      updatedAt: new Date().toISOString(),
      updatedBy,
      evidenceUrl
    });

    // If authority marked it resolved, make sure we reflect it
    if (status === 'AUTHORITY_RESOLVED' && grievance.clusterId) {
      // Check if all complaints in the cluster are resolved. If so, update the cluster
      const siblings = grievances.filter(g => g.clusterId === grievance.clusterId);
      const allResolved = siblings.every(s => s.status === 'AUTHORITY_RESOLVED' || s.status === 'CITIZEN_VERIFIED' || s.status === 'CLOSED');
      if (allResolved) {
        const cluster = clusters.find(c => c.id === grievance.clusterId);
        if (cluster) {
          cluster.status = 'AUTHORITY_RESOLVED';
        }
      }
    }
  }
  return grievance;
}

export function verifyResolution(
  id: string,
  isSatisfied: boolean,
  note: string,
  updatedBy: string
): Grievance | undefined {
  const grievance = grievances.find(g => g.id === id);
  if (grievance) {
    if (isSatisfied) {
      grievance.status = 'CITIZEN_VERIFIED';
      grievance.timeline.push({
        status: 'CITIZEN_VERIFIED',
        note: `Citizen verified resolution: ${note}`,
        updatedAt: new Date().toISOString(),
        updatedBy
      });
      grievance.timeline.push({
        status: 'CLOSED',
        note: 'Grievance ticket closed successfully.',
        updatedAt: new Date(Date.now() + 1000).toISOString(),
        updatedBy: 'AI System'
      });

      if (grievance.clusterId) {
        const siblings = grievances.filter(g => g.clusterId === grievance.clusterId);
        const allClosed = siblings.every(s => s.status === 'CITIZEN_VERIFIED' || s.status === 'CLOSED');
        if (allClosed) {
          const cluster = clusters.find(c => c.id === grievance.clusterId);
          if (cluster) {
            cluster.status = 'CLOSED';
          }
        }
      }
    } else {
      // CITIZEN DISPUTES RESOLUTION -> Reopen & Escalate!
      grievance.status = 'RESOLUTION_DISPUTED';
      grievance.isEscalated = true;
      const escalatedTo = 'Municipal Deputy Commissioner (Vigilance)';
      grievance.escalatedTo = escalatedTo;
      
      grievance.timeline.push({
        status: 'RESOLUTION_DISPUTED',
        note: `Citizen DISPUTED the resolution! Reopening case. Reporter comment: "${note}"`,
        updatedAt: new Date().toISOString(),
        updatedBy
      });

      grievance.timeline.push({
        status: 'ASSIGNED',
        note: `AUTOMATIC ESCALATION: Ticket disputed by citizen. Re-routed to higher admin authority: ${escalatedTo}`,
        updatedAt: new Date(Date.now() + 1000).toISOString(),
        updatedBy: 'AI System'
      });

      if (grievance.clusterId) {
        const cluster = clusters.find(c => c.id === grievance.clusterId);
        if (cluster) {
          cluster.status = 'RESOLUTION_DISPUTED';
          cluster.severity = 'CRITICAL'; // Raise severity on cluster!
        }
      }
    }
  }
  return grievance;
}
