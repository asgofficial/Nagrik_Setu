export interface User {
  id: string;
  name: string;
  role: 'citizen' | 'authority';
  avatarUrl?: string;
  phoneNumber?: string;
}

export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export type State = 'West Bengal' | 'Delhi' | 'Maharashtra' | 'Karnataka' | 'Other';
export type EmploymentStatus = 'employed' | 'unemployed' | 'self-employed' | 'student' | 'retired' | 'farmer';

export interface CitizenProfile {
  age: number;
  gender: Gender;
  state: string;
  district: string;
  urbanRural: 'urban' | 'rural';
  incomeRange: '0-1.5L' | '1.5L-3L' | '3L-5L' | '5L-8L' | '8L+'; // Annual income
  occupation: string;
  isStudent: boolean;
  isFarmer: boolean;
  isSeniorCitizen: boolean;
  hasDisability: boolean;
  isWidowOrSingleParent: boolean;
  housingCondition: 'homeless' | 'kutcha' | 'pucca';
  documentsAvailable: string[]; // List of document ids the user has
  existingBenefits: string[]; // List of scheme ids the user already receives
}

export interface Scheme {
  id: string;
  name: string;
  department: string;
  governmentLevel: 'Central' | 'State' | 'Local';
  category: 'Pension' | 'Agriculture' | 'Education' | 'Housing' | 'Healthcare' | 'Livelihood' | 'Finance' | 'Social Welfare';
  description: string;
  eligibilityRules: {
    maxIncome?: number;
    minAge?: number;
    maxAge?: number;
    genders?: Gender[];
    requiredFarmer?: boolean;
    requiredStudent?: boolean;
    requiredDisability?: boolean;
    requiredWidowOrSingleParent?: boolean;
    urbanRural?: 'urban' | 'rural' | 'both';
  };
  benefit: string; // e.g. "₹3,000/month", "₹50,000 one-time"
  estimatedAnnualValue: number; // e.g. 36000
  requiredDocuments: string[]; // IDs of documents
  applicationProcess: string[]; // Step by step guidelines
  deadline?: string;
  officialUrl: string;
  tags: string[];
}

export interface EligibilityMatch {
  schemeId: string;
  confidence: number; // Percentage (0-100)
  matchReason: string[];
  missingDocuments: string[];
  applicationReadiness: number; // Percentage (0-100)
  priority: 'high' | 'medium' | 'low';
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  howToObtain: string;
}

export interface Application {
  id: string;
  schemeId: string;
  citizenId: string;
  status: 'discovered' | 'saved' | 'preparing' | 'applied' | 'awaiting-update' | 'approved' | 'not-approved';
  updatedAt: string;
  submittedAt?: string;
  notes?: string;
}

export type GrievanceCategory =
  | 'Road'
  | 'Water'
  | 'Electricity'
  | 'Waste'
  | 'Sanitation'
  | 'Public Safety'
  | 'Transport'
  | 'Corruption'
  | 'Harassment'
  | 'Other';

export type GrievanceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type GrievanceStatus =
  | 'REPORTED'
  | 'AI_CLASSIFIED'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'WORK_STARTED'
  | 'AUTHORITY_RESOLVED'
  | 'CITIZEN_VERIFIED'
  | 'RESOLUTION_DISPUTED'
  | 'CLOSED';

export interface StatusUpdate {
  status: GrievanceStatus;
  note: string;
  updatedAt: string;
  updatedBy: string; // "Citizen", "AI System", or Authority name
  evidenceUrl?: string; // Optional proof of work image
}

export interface Grievance {
  id: string; // e.g., CT-KOL-2026-1042
  title: string;
  description: string;
  category: GrievanceCategory;
  severity: GrievanceSeverity;
  latitude: number;
  longitude: number;
  landmark?: string;
  createdAt: string;
  status: GrievanceStatus;
  isAnonymous: boolean;
  authorityId?: string; // Responsible department/authority
  clusterId?: string; // If clustered
  reporterId: string;
  evidence: string[]; // URLs of images
  timeline: StatusUpdate[];
  citizenConfirmations: number; // "I'm affected too" count
  slaDeadline: string; // ISO date string
  isEscalated: boolean;
  escalatedTo?: string; // Authority name
}

export interface CivicCluster {
  id: string;
  title: string;
  category: GrievanceCategory;
  latitude: number;
  longitude: number;
  radiusMeters: number; // affected radius
  createdAt: string;
  lastReportedAt: string;
  severity: GrievanceSeverity;
  status: GrievanceStatus;
  authorityId: string;
  reportsCount: number;
  citizenConfirmations: number; // Total confirmations across complaints or direct
  description: string;
}

export interface Department {
  id: string;
  name: string;
  responsibleOfficer: string;
  slaHours: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
}

export interface Ward {
  id: string; // e.g., "Ward 12"
  name: string;
  borough: string;
  healthScore: number;
  status: 'Healthy' | 'Moderate' | 'Needs Attention' | 'Critical';
  contributingFactors: {
    openComplaints: number;
    wasteComplaints: number;
    waterComplaints: number;
    roadComplaints: number;
    electricityComplaints: number;
    otherComplaints: number;
    associatedClusters: number;
    avgResolutionDays: number;
    citizenVerificationRate: number; // e.g., 67%
  };
}

export interface UserGpsLocation {
  latitude: number;
  longitude: number;
  displayName: string;
  locality: string;
  district: string;
  state: string;
  postcode?: string;
  timestamp: string;
  status: 'locating' | 'success' | 'error' | 'denied';
  errorMessage?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'scheme' | 'grievance' | 'cluster' | 'system';
  referenceId: string; // ID of scheme/grievance
  isRead: boolean;
  createdAt: string;
}
