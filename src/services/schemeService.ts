import { Scheme, CitizenProfile, EligibilityMatch, DocumentRequirement } from '../types';

export const DOCUMENTS: DocumentRequirement[] = [
  { id: 'aadhaar', name: 'Aadhaar Card', description: 'Unique identification number issued by UIDAI.', howToObtain: 'Visit nearest Aadhaar Enrolment Centre or apply online via UIDAI portal.' },
  { id: 'pan', name: 'PAN Card', description: 'Permanent Account Number issued by Income Tax Department.', howToObtain: 'Apply online on NSDL or UTITSL website.' },
  { id: 'voter', name: 'Voter ID', description: 'Electors Photo Identity Card (EPIC) issued by ECI.', howToObtain: 'Register online via NVSP portal or visit local Booth Level Officer.' },
  { id: 'ration', name: 'Ration Card', description: 'Official document issued by State Governments for purchasing subsidized food grains.', howToObtain: 'Apply via State Food & Supplies Department website or office.' },
  { id: 'income', name: 'Income Certificate', description: 'Document certifying the annual income of the household.', howToObtain: 'Apply online through State e-District portal or local Block Development Office (BDO).' },
  { id: 'caste', name: 'Caste Certificate (SC/ST/OBC)', description: 'Document certifying a citizen\'s social caste category.', howToObtain: 'Apply online through backward classes welfare portal or SD office.' },
  { id: 'disability', name: 'Disability Certificate (UDID)', description: 'Unique Disability ID issued for persons with disabilities.', howToObtain: 'Register on Swavlamban Card portal or visit a Government District Hospital.' },
  { id: 'bank', name: 'Bank Account Passbook', description: 'Active savings account document showing bank details and IFSC code.', howToObtain: 'Visit nearest bank branch (Jan Dhan accounts are free to open).' },
  { id: 'domicile', name: 'Domicile Certificate', description: 'Document certifying that a person is a resident of a particular state.', howToObtain: 'Apply online via State e-District portal.' },
  { id: 'student_id', name: 'Student ID Card', description: 'Valid identity card issued by a recognized school, college, or university.', howToObtain: 'Issued by the administration of your educational institution.' },
  { id: 'land_record', name: 'Land Records (Parcha/RoR)', description: 'Proof of land ownership or farming tenancy.', howToObtain: 'Retrieve from Banglarbhumi (WB) or respective State Land Records portal.' },
];

export const SCHEMES: Scheme[] = [
  {
    id: 'wb-lakshmir-bhandar',
    name: 'Lakshmir Bhandar Scheme',
    department: 'Department of Women & Child Development and Social Welfare',
    governmentLevel: 'State',
    category: 'Social Welfare',
    description: 'Financial assistance scheme providing direct cash transfers to women heads of families to support their livelihoods and boost financial independence.',
    eligibilityRules: {
      minAge: 25,
      maxAge: 60,
      genders: ['female'],
      urbanRural: 'both',
    },
    benefit: '₹1,000/month for General, ₹1,200/month for SC/ST families',
    estimatedAnnualValue: 12000,
    requiredDocuments: ['aadhaar', 'bank', 'caste', 'domicile'],
    applicationProcess: [
      'Collect application form from local "Duare Sarkar" (Government at your doorstep) camp or download from state portal.',
      'Fill in personal, bank account, and Swasthya Sathi/Aadhaar details.',
      'Attach copy of Aadhaar card, Bank passbook, Caste certificate, and Domicile proof.',
      'Submit the application at the Duare Sarkar desk or local BDO office.',
      'Await verification and SMS confirmation for monthly credits.'
    ],
    officialUrl: 'https://socialwelfare.wb.gov.in',
    tags: ['Women Empowerment', 'Direct Benefit Transfer', 'West Bengal']
  },
  {
    id: 'pm-kisan',
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    department: 'Ministry of Agriculture and Farmers Welfare',
    governmentLevel: 'Central',
    category: 'Agriculture',
    description: 'An initiative by the Government of India that provides up to ₹6,000 per year in three equal installments as minimum income support to all small and marginal landholding farmer families.',
    eligibilityRules: {
      requiredFarmer: true,
      minAge: 18,
      urbanRural: 'rural',
    },
    benefit: '₹6,000/year (paid in 3 installments of ₹2,000)',
    estimatedAnnualValue: 6000,
    requiredDocuments: ['aadhaar', 'bank', 'land_record'],
    applicationProcess: [
      'Self-register on the PM-KISAN Farmers Corner portal or visit a Common Service Center (CSC).',
      'Enter Aadhaar details, State, District, and block coordinates.',
      'Upload land ownership documents (Parcha/RoR) and bank details.',
      'Submit form for verification by the Block Agriculture Officer.',
      'Monitor status online; approved applications receive direct bank transfers.'
    ],
    officialUrl: 'https://pmkisan.gov.in',
    tags: ['Farmers', 'Income Support', 'Rural Dev']
  },
  {
    id: 'wb-swasthya-sathi',
    name: 'Swasthya Sathi Health Scheme',
    department: 'Department of Health & Family Welfare',
    governmentLevel: 'State',
    category: 'Healthcare',
    description: 'Basic health cover insurance scheme for secondary and tertiary care up to ₹5 Lakh per annum per family, issued primarily to the female head of the family.',
    eligibilityRules: {
      urbanRural: 'both',
    },
    benefit: 'Cashless healthcare coverage up to ₹5,00,000/year per family',
    estimatedAnnualValue: 15000, // Estimated value of insurance premium/benefits
    requiredDocuments: ['aadhaar', 'ration'],
    applicationProcess: [
      'Fill out "Form A" for new enrollment at your local Duare Sarkar camp or Municipality office.',
      'Ensure the eldest female member is listed as the primary head of family.',
      'Attach Aadhaar cards and Ration Cards of all family members.',
      'Submit form and visit the biometrics desk for photo and fingerprint registration.',
      'Collect your physical Swasthya Sathi smart card on the spot.'
    ],
    officialUrl: 'https://swasthyasathi.gov.in',
    tags: ['Health Insurance', 'Cashless', 'Family Support']
  },
  {
    id: 'pm-awas-yojana',
    name: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
    department: 'Ministry of Rural Development',
    governmentLevel: 'Central',
    category: 'Housing',
    description: 'Provides financial assistance for constructing a pucca house with basic amenities to all homeless householders and those living in dilapidated houses in rural areas.',
    eligibilityRules: {
      urbanRural: 'rural',
      maxIncome: 300000, // Estimated rules: 3L annual cap
    },
    benefit: 'Financial assistance of ₹1,20,000 in plains and ₹1,30,000 in hilly/difficult areas.',
    estimatedAnnualValue: 120000,
    requiredDocuments: ['aadhaar', 'bank', 'ration', 'income', 'voter'],
    applicationProcess: [
      'Beneficiaries are identified based on SECC 2011 housing deprivation parameters verified by Gram Sabhas.',
      'If eligible, fill out registration details through the AwaasSoft portal with the help of local Panchayat.',
      'Provide Aadhaar number, consent, bank account details, and upload photo of existing house.',
      'Gram Panchayat inspects the site and sanctions the first installment.',
      'Funds are released in three construction-linked stages directly to the bank account.'
    ],
    officialUrl: 'https://pmayg.nic.in',
    tags: ['Affordable Housing', 'Rural Infrastructure', 'Shelter']
  },
  {
    id: 'wb-sabooj-sathi',
    name: 'Sabooj Sathi Scheme',
    department: 'Backward Classes Welfare Department',
    governmentLevel: 'State',
    category: 'Education',
    description: 'Distribution of bicycles to students of Class IX to XII studying in government-run and government-aided schools and madrasahs, to reduce dropouts and promote mobility.',
    eligibilityRules: {
      requiredStudent: true,
      minAge: 13,
      maxAge: 19,
      urbanRural: 'both',
    },
    benefit: 'One free gear-less bicycle for high-school student commuting',
    estimatedAnnualValue: 4500, // Market value of bicycle
    requiredDocuments: ['student_id', 'aadhaar'],
    applicationProcess: [
      'No individual form submission is needed. Schools enroll eligible students automatically.',
      'Verify details on the Sabooj Sathi portal using school registration ID.',
      'Provide student Aadhaar card and parent Aadhaar to the school authorities.',
      'Collect bicycle from the school distribution camp on the scheduled day.'
    ],
    officialUrl: 'https://wbsaboojsathi.gov.in',
    tags: ['Bicycles', 'Students', 'Mobility']
  },
  {
    id: 'pm-atal-pension',
    name: 'Atal Pension Yojana (APY)',
    department: 'Pension Fund Regulatory and Development Authority (PFRDA)',
    governmentLevel: 'Central',
    category: 'Pension',
    description: 'A pension scheme focused on the unorganized sector workers, offering a guaranteed minimum pension of ₹1,000 to ₹5,000 per month after attaining 60 years of age, depending on contribution.',
    eligibilityRules: {
      minAge: 18,
      maxAge: 40,
    },
    benefit: 'Guaranteed minimum pension of ₹1,000 to ₹5,000/month after age 60',
    estimatedAnnualValue: 36000, // Average pension payout equivalent
    requiredDocuments: ['aadhaar', 'bank'],
    applicationProcess: [
      'Visit the bank branch or post office where you hold your savings account.',
      'Fill out the APY registration form with Aadhaar and mobile details.',
      'Select your desired pension slab (₹1000, ₹2000, ₹3000, ₹4000, or ₹5000) and contribution frequency.',
      'Opt for auto-debit of monthly/quarterly premium from your account.',
      'You will receive a PRAN card confirming enrollment.'
    ],
    officialUrl: 'https://www.npscra.nsdl.co.in',
    tags: ['Old Age Security', 'Pension', 'Savings']
  },
  {
    id: 'wb-rupashree',
    name: 'Rupashree Prakalpa',
    department: 'Department of Women & Child Development and Social Welfare',
    governmentLevel: 'State',
    category: 'Social Welfare',
    description: 'Provides a one-time financial grant of ₹25,000 to economically stressed families at the time of their adult daughters\' marriages to ease the debt burden.',
    eligibilityRules: {
      genders: ['female'],
      minAge: 18,
      maxIncome: 150000, // Family income < 1.5L
      urbanRural: 'both',
    },
    benefit: 'One-time cash grant of ₹25,000 transferred to girl\'s bank account',
    estimatedAnnualValue: 25000,
    requiredDocuments: ['aadhaar', 'bank', 'income', 'domicile', 'voter'],
    applicationProcess: [
      'Obtain application form free of cost from the BDO, SDO, or Municipal Commissioner office.',
      'Apply at least 30 to 60 days before the scheduled date of marriage.',
      'Attach certificates of income, residence, age proof of bride and groom, marriage invitation, and joint bank details.',
      'Authorized inquiry officer conducts a home visit to verify details.',
      'Sanctioned grant is credited to the bride\'s personal bank account before the wedding.'
    ],
    officialUrl: 'https://wbrupashree.gov.in',
    tags: ['Marriage Grant', 'Women Welfare', 'Financial Support']
  },
  {
    id: 'indira-gandhi-old-age-pension',
    name: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    department: 'Ministry of Rural Development',
    governmentLevel: 'Central',
    category: 'Pension',
    description: 'Under the National Social Assistance Programme (NSAP), financial assistance of ₹200/month (60-79 years) and ₹500/month (80+ years) is given to citizens belonging to BPL households.',
    eligibilityRules: {
      minAge: 60,
      maxIncome: 150000, // BPL eligibility cap
    },
    benefit: 'Monthly pension of ₹200 to ₹500 (often topped up by states up to ₹1,000/month)',
    estimatedAnnualValue: 12000, // Estimated with average state top up
    requiredDocuments: ['aadhaar', 'ration', 'income', 'voter', 'bank'],
    applicationProcess: [
      'Download application form from NSAP portal or collect from Gram Panchayat / Ward office.',
      'Provide Age proof, BPL Ration Card, and bank details.',
      'Submit the application to Block Development Officer (BDO) or Municipality.',
      'A baseline verification is conducted for BPL list mapping.',
      'Approved pensioners receive direct bank transfers monthly.'
    ],
    officialUrl: 'https://nsap.nic.in',
    tags: ['Senior Citizens', 'Social Security', 'Pension']
  },
  {
    id: 'national-means-cum-merit-scholarship',
    name: 'National Means-cum-Merit Scholarship (NMMSS)',
    department: 'Department of School Education & Literacy',
    governmentLevel: 'Central',
    category: 'Education',
    description: 'Award of scholarship to meritorious students of economically weaker sections to arrest their drop-out at class VIII and encourage them to continue studies at secondary stage.',
    eligibilityRules: {
      requiredStudent: true,
      minAge: 12,
      maxAge: 16,
      maxIncome: 350000, // < 3.5L household income
    },
    benefit: 'Scholarship amount of ₹12,000 per annum (Class IX to XII)',
    estimatedAnnualValue: 12000,
    requiredDocuments: ['student_id', 'aadhaar', 'income', 'bank', 'caste'],
    applicationProcess: [
      'Apply online on National Scholarship Portal (NSP) during enrollment season.',
      'Upload class VII marksheet, school certificate, and household income certificate.',
      'Appear for the state-level competitive examination (Mental Ability & Scholastic Test).',
      'Merit lists are prepared based on marks and state quotas.',
      'Selected students receive scholarship directly in bank accounts monthly (₹1,000/month).'
    ],
    officialUrl: 'https://scholarships.gov.in',
    tags: ['Scholarships', 'Education Aid', 'Students']
  }
];

export function getSchemes(): Scheme[] {
  return SCHEMES;
}

export function getSchemeById(id: string): Scheme | undefined {
  return SCHEMES.find(s => s.id === id);
}

export function getDocuments(): DocumentRequirement[] {
  return DOCUMENTS;
}

export function getDocumentById(id: string): DocumentRequirement | undefined {
  return DOCUMENTS.find(d => d.id === id);
}

export function calculateEligibility(profile: CitizenProfile): EligibilityMatch[] {
  const matches: EligibilityMatch[] = [];

  for (const scheme of SCHEMES) {
    let matchScore = 100;
    const reasons: string[] = [];
    const rules = scheme.eligibilityRules;

    // 1. Age Check
    if (rules.minAge !== undefined && profile.age < rules.minAge) {
      matchScore -= 30;
      reasons.push(`Minimum age required is ${rules.minAge} (You are ${profile.age})`);
    } else if (rules.minAge !== undefined) {
      reasons.push(`Age is above minimum threshold of ${rules.minAge} ✓`);
    }

    if (rules.maxAge !== undefined && profile.age > rules.maxAge) {
      matchScore -= 30;
      reasons.push(`Maximum age limit is ${rules.maxAge} (You are ${profile.age})`);
    } else if (rules.maxAge !== undefined) {
      reasons.push(`Age is within the maximum limit of ${rules.maxAge} ✓`);
    }

    // 2. Gender Check
    if (rules.genders !== undefined && !rules.genders.includes(profile.gender)) {
      matchScore -= 40;
      reasons.push(`Scheme is targeted for ${rules.genders.join('/')} (Your profile: ${profile.gender})`);
    } else if (rules.genders !== undefined) {
      reasons.push(`Gender requirement matched (${rules.genders.join('/')}) ✓`);
    }

    // 3. Location Check (State checks for WB schemes)
    if (scheme.id.startsWith('wb-')) {
      if (profile.state !== 'West Bengal') {
        matchScore -= 50;
        reasons.push(`State required is West Bengal (Your profile: ${profile.state})`);
      } else {
        reasons.push(`Residency in West Bengal matched ✓`);
      }
    }

    // Urban / Rural Check
    if (rules.urbanRural === 'rural' && profile.urbanRural !== 'rural') {
      matchScore -= 20;
      reasons.push(`Scheme is only for rural areas (Your profile: ${profile.urbanRural})`);
    } else if (rules.urbanRural === 'urban' && profile.urbanRural !== 'urban') {
      matchScore -= 20;
      reasons.push(`Scheme is only for urban areas (Your profile: ${profile.urbanRural})`);
    } else if (rules.urbanRural) {
      reasons.push(`Location sector requirement matched (${rules.urbanRural}) ✓`);
    }

    // 4. Economic Check (Income Check)
    if (rules.maxIncome !== undefined) {
      // Map incomeRange string to representative numeric value for checking
      const incomeMap = {
        '0-1.5L': 75000,
        '1.5L-3L': 225000,
        '3L-5L': 400000,
        '5L-8L': 650000,
        '8L+': 1000000
      };
      const userEstIncome = incomeMap[profile.incomeRange];
      if (userEstIncome > rules.maxIncome) {
        matchScore -= 35;
        reasons.push(`Income ceiling is ₹${rules.maxIncome.toLocaleString()} (Your range is ${profile.incomeRange})`);
      } else {
        reasons.push(`Income range (${profile.incomeRange}) is within eligibility ceiling ✓`);
      }
    }

    // 5. Farmer Check
    if (rules.requiredFarmer && !profile.isFarmer) {
      matchScore -= 40;
      reasons.push(`Occupation must be Farming (You are not registered as a farmer)`);
    } else if (rules.requiredFarmer) {
      reasons.push(`Farmer occupation requirement matched ✓`);
    }

    // 6. Student Check
    if (rules.requiredStudent && !profile.isStudent) {
      matchScore -= 40;
      reasons.push(`Must be a student (You are not registered as a student)`);
    } else if (rules.requiredStudent) {
      reasons.push(`Student status matched ✓`);
    }

    // 7. Disability Check
    if (rules.requiredDisability && !profile.hasDisability) {
      matchScore -= 40;
      reasons.push(`Required disability status (Not checked in your profile)`);
    } else if (rules.requiredDisability) {
      reasons.push(`Disability criteria matched ✓`);
    }

    // 8. Widow / Single Parent
    if (rules.requiredWidowOrSingleParent && !profile.isWidowOrSingleParent) {
      matchScore -= 30;
      reasons.push(`Widow or Single Parent status required`);
    } else if (rules.requiredWidowOrSingleParent) {
      reasons.push(`Widow/Single-Parent criteria matched ✓`);
    }

    // Adjust score limits
    const confidence = Math.max(0, matchScore);

    // Document calculation
    const missingDocs = scheme.requiredDocuments.filter(
      docId => !profile.documentsAvailable.includes(docId)
    );
    const availableDocsCount = scheme.requiredDocuments.length - missingDocs.length;
    const applicationReadiness = Math.round((availableDocsCount / scheme.requiredDocuments.length) * 100);

    // Determine priority matching
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (confidence >= 80) {
      if (scheme.estimatedAnnualValue >= 15000 || missingDocs.length <= 1) {
        priority = 'high';
      } else {
        priority = 'medium';
      }
    } else if (confidence >= 50) {
      priority = 'medium';
    }

    // Only return schemes that have at least some match chance (>30%)
    if (confidence > 30) {
      matches.push({
        schemeId: scheme.id,
        confidence,
        matchReason: reasons,
        missingDocuments: missingDocs,
        applicationReadiness,
        priority,
      });
    }
  }

  // Sort matches by priority (high to low) then confidence (high to low)
  return matches.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return b.confidence - a.confidence;
  });
}
