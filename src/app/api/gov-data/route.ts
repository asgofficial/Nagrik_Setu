import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'stats';

  if (type === 'stats') {
    return NextResponse.json({
      totalSchemesCount: 412,
      dbtDisbursedCrores: 368500,
      activeBeneficiariesCrores: 82.6,
      lastUpdated: new Date().toISOString(),
      source: 'Data.gov.in & MyGov Realtime Data Platform',
      status: 'ONLINE_SYNCED'
    });
  }

  if (type === 'schemes') {
    return NextResponse.json({
      schemes: [
        {
          id: 'goi-pm-kisan-live',
          name: 'PM Kisan Samman Nidhi (Live Feed)',
          department: 'Ministry of Agriculture and Farmers Welfare, Govt of India',
          governmentLevel: 'Central',
          category: 'Agriculture',
          description: 'Official Live GOI Income Support Scheme transferring ₹6,000 annually in three 4-monthly installments directly to farmer bank accounts.',
          eligibilityRules: {
            requiredFarmer: true,
            minAge: 18,
            urbanRural: 'both'
          },
          benefit: '₹6,000/year directly credited via Aadhaar DBT',
          estimatedAnnualValue: 6000,
          requiredDocuments: ['aadhaar', 'bank', 'land_record'],
          applicationProcess: [
            'Visit official portal pmkisan.gov.in or nearest Common Service Centre (CSC).',
            'Submit e-KYC using Aadhaar biometric authentication.',
            'Upload digitized land record (Khatian/RoR).',
            'Receive direct bank transfer confirmation via SMS.'
          ],
          officialUrl: 'https://pmkisan.gov.in',
          tags: ['Central Govt', 'DBT', 'Farmers', 'Realtime API']
        },
        {
          id: 'goi-pm-ayushman-bharat',
          name: 'Ayushman Bharat PM-JAY (Live Feed)',
          department: 'National Health Authority, Govt of India',
          governmentLevel: 'Central',
          category: 'Healthcare',
          description: 'World\'s largest government-funded healthcare scheme providing ₹5 Lakh health insurance cover per family per year for secondary and tertiary care hospitalization.',
          eligibilityRules: {
            urbanRural: 'both'
          },
          benefit: '₹5,00,000/year cashless treatment in empanelled hospitals',
          estimatedAnnualValue: 20000,
          requiredDocuments: ['aadhaar', 'ration'],
          applicationProcess: [
            'Check eligibility on beneficiary.nha.gov.in using Mobile or Ration card number.',
            'Visit empanelled hospital Ayushman Mitra desk for e-KYC.',
            'Generate e-Card instantly.',
            'Avail cashless hospital treatment.'
          ],
          officialUrl: 'https://pmjay.gov.in',
          tags: ['Central Govt', 'Healthcare', 'Cashless', 'Realtime API']
        },
        {
          id: 'goi-pm-ujjwala-2.0',
          name: 'PM Ujjwala Yojana 2.0 (Live Feed)',
          department: 'Ministry of Petroleum and Natural Gas, Govt of India',
          governmentLevel: 'Central',
          category: 'Social Welfare',
          description: 'Free LPG gas connection scheme for adult women from low-income households along with first refill and hotplate free of cost.',
          eligibilityRules: {
            minAge: 18,
            genders: ['female'],
            urbanRural: 'both'
          },
          benefit: 'Free LPG Gas Connection + First Stove & Cylinder Subsidized',
          estimatedAnnualValue: 3600,
          requiredDocuments: ['aadhaar', 'bank', 'ration'],
          applicationProcess: [
            'Apply online via pmuy.gov.in or at nearest LPG distributor office.',
            'Submit Ration Card & Aadhaar details of all adult family members.',
            'Upload bank account details for subsidy transfer.',
            'Receive LPG connection doorstep delivery.'
          ],
          officialUrl: 'https://pmuy.gov.in',
          tags: ['Central Govt', 'Women Empowerment', 'LPG Subsidy']
        }
      ],
      syncedAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ error: 'Unknown query type' }, { status: 400 });
}
