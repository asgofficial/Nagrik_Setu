import { Ward } from '../types';

export const WARDS: Ward[] = [
  {
    id: 'ward-8',
    name: 'Ward 8 (Bowbazar)',
    borough: 'Borough II',
    healthScore: 35,
    status: 'Critical',
    contributingFactors: {
      openComplaints: 18,
      wasteComplaints: 4,
      waterComplaints: 11,
      roadComplaints: 3,
      avgResolutionDays: 8.4,
      citizenVerificationRate: 52
    }
  },
  {
    id: 'ward-10',
    name: 'Ward 10 (MG Road / Machhua)',
    borough: 'Borough II',
    healthScore: 58,
    status: 'Moderate',
    contributingFactors: {
      openComplaints: 14,
      wasteComplaints: 12,
      waterComplaints: 3,
      roadComplaints: 2,
      avgResolutionDays: 5.6,
      citizenVerificationRate: 74
    }
  },
  {
    id: 'ward-12',
    name: 'Ward 12 (College Street / Square)',
    borough: 'Borough IV',
    healthScore: 42,
    status: 'Needs Attention',
    contributingFactors: {
      openComplaints: 23,
      wasteComplaints: 17,
      waterComplaints: 8,
      roadComplaints: 5,
      avgResolutionDays: 9.2,
      citizenVerificationRate: 67
    }
  },
  {
    id: 'ward-15',
    name: 'Ward 15 (Salt Lake Sector 1 / Ultadanga)',
    borough: 'Borough V',
    healthScore: 88,
    status: 'Healthy',
    contributingFactors: {
      openComplaints: 2,
      wasteComplaints: 1,
      waterComplaints: 0,
      roadComplaints: 1,
      avgResolutionDays: 1.8,
      citizenVerificationRate: 94
    }
  }
];

export function getWards(): Ward[] {
  return WARDS;
}

export function getWardById(id: string): Ward | undefined {
  return WARDS.find(w => w.id === id || w.name.includes(id));
}

export interface ScoreExplanation {
  factor: string;
  weight: string;
  impactValue: string;
  description: string;
}

export function getScoreExplanation(score: number): ScoreExplanation[] {
  return [
    {
      factor: 'Unresolved Grievance Volume',
      weight: '30%',
      impactValue: score < 50 ? 'High Negative' : 'Low Negative',
      description: 'Measures the total volume of open complaints. Wards with >15 active complaints receive significant penalties.'
    },
    {
      factor: 'Average Resolution Time',
      weight: '25%',
      impactValue: score < 60 ? 'Slow Response' : 'Fast Response',
      description: 'Average days an authority takes to resolve tickets. Goal is under 3.0 days; Wards over 7.0 days lose points.'
    },
    {
      factor: 'Citizen Verification Rate',
      weight: '25%',
      impactValue: score < 50 ? 'Poor Trust' : 'Strong Trust',
      description: 'Percentage of cases where the citizen confirmed "Yes, it is resolved" rather than disputing the resolution.'
    },
    {
      factor: 'Complaint Recurrence',
      weight: '20%',
      impactValue: score < 45 ? 'High Recurrence' : 'Low Recurrence',
      description: 'Tracks whether the same issue type crops up repeatedly in the exact same location, indicating systemic issues.'
    }
  ];
}
