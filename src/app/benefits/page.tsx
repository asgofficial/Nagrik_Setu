'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  X,
  ShieldCheck,
  GraduationCap,
  HeartPulse,
  Wheat,
  Home as HomeIcon,
  Briefcase,
  Users,
  Info,
  Sparkles,
  CalendarClock,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SchemeStatus = 'Active' | 'Recently Launched' | 'Announced — Rollout Pending';
type SchemeCategory =
  | 'Women & Family'
  | 'Education'
  | 'Health'
  | 'Agriculture'
  | 'Housing'
  | 'Youth & Employment';

interface Scheme {
  id: string;
  name: string;
  category: SchemeCategory;
  status: SchemeStatus;
  tagline: string;
  benefitAmount: string;
  targetGroup: string;
  eligibility: string[];
  documentsRequired: string[];
  howToApply: string[];
  officialPortal: string;
  department: string;
  lastVerified: string;
  sourceNote?: string;
}

const CATEGORY_ICONS: Record<SchemeCategory, React.ElementType> = {
  'Women & Family': Users,
  Education: GraduationCap,
  Health: HeartPulse,
  Agriculture: Wheat,
  Housing: HomeIcon,
  'Youth & Employment': Briefcase,
};

const SCHEMES: Scheme[] = [
  {
    id: 'annapurna-bhandar',
    name: 'Annapurna Bhandar Prakalpa',
    category: 'Women & Family',
    status: 'Active',
    tagline: 'Monthly direct cash assistance for women, replacing Lakshmir Bhandar.',
    benefitAmount: '₹3,000 / month',
    targetGroup: 'Resident women of West Bengal from economically weaker households.',
    eligibility: [
      'Must be a permanent resident of West Bengal.',
      'Adult woman with a valid Aadhaar-linked bank account in her own name.',
      'Existing Lakshmir Bhandar beneficiaries are being auto-migrated; new applicants must register within the notified window.',
      'Final income/category slabs (SC/ST/OBC/General) are being notified in phases — confirm your slab on the portal.',
    ],
    documentsRequired: [
      'Aadhaar Card',
      'Bank passbook (Aadhaar-linked)',
      'Residence proof',
      'Passport-size photograph',
      'Registered mobile number',
    ],
    howToApply: [
      'Visit the Social Registry West Bengal portal and complete OTP authentication with your mobile number.',
      'Fill in family and bank details and upload the required documents.',
      'Alternatively, apply offline at your local BDO/SDO office, municipality office, or a Duare Sarkar camp.',
      'Your application will be field-verified before the first DBT payment.',
    ],
    officialPortal: 'https://socialregistry.wb.gov.in',
    department: 'Dept. of Women & Child Development and Social Welfare, Govt. of West Bengal',
    lastVerified: '9 Aug 2026',
    sourceNote:
      'This scheme is actively rolling out — payment amounts, category-wise slabs, and the exact enrolment cutoff date have been revised more than once since June 2026. Always check the portal before relying on the details here.',
  },
  {
    id: 'ayushman-bharat-swasthya-sathi',
    name: 'Ayushman Bharat (integrated with Swasthya Sathi)',
    category: 'Health',
    status: 'Active',
    tagline: 'Cashless hospitalisation cover for the whole family, usable nationwide.',
    benefitAmount: '₹5,00,000 / family / year',
    targetGroup: 'WB families covered under SECC/PM-JAY criteria or holding a Swasthya Sathi card.',
    eligibility: [
      'Family should have a valid Swasthya Sathi card or fall under PM-JAY (SECC) eligibility criteria.',
      'Coverage applies to secondary and tertiary hospitalisation at empanelled hospitals.',
      'No cap on family size or age for enrolled beneficiaries.',
    ],
    documentsRequired: [
      'Aadhaar Card of all family members',
      'Existing Swasthya Sathi card or ration card',
      'Family ID / SECC reference (if available)',
    ],
    howToApply: [
      'Check your existing Swasthya Sathi enrolment status online.',
      'If not enrolled, register at a Duare Sarkar camp or your nearest Swasthya Sathi enrolment centre.',
      'Present your Swasthya Sathi/Ayushman card at any empanelled hospital for cashless treatment.',
    ],
    officialPortal: 'https://swasthyasathi.gov.in',
    department: 'Dept. of Health & Family Welfare, Govt. of West Bengal / National Health Authority',
    lastVerified: '9 Aug 2026',
  },
  {
    id: 'kanyashree-prakalpa',
    name: 'Kanyashree Prakalpa',
    category: 'Education',
    status: 'Active',
    tagline: 'Scholarship support to keep girls in school and delay early marriage.',
    benefitAmount: '₹1,000/year (K1) + one-time ₹25,000 (K2, on turning 18)',
    targetGroup: 'Unmarried girls aged 13–18 from low-income families, enrolled in school or vocational training.',
    eligibility: [
      'Girl must be unmarried and aged between 13 and 18 years.',
      'Currently enrolled in a school, college, or approved vocational/ITI course.',
      'Annual family income below ₹1,20,000 (relaxed for SC/ST or disabled applicants).',
      'K2 one-time grant is paid on turning 18 if still unmarried and continuing education or training.',
    ],
    documentsRequired: [
      'Birth certificate',
      'Aadhaar Card',
      "School/institution ID and admission proof",
      'Income certificate',
      "Bank account in the applicant's name",
    ],
    howToApply: [
      'Apply through your school or educational institution, which submits the K1/K2 form on your behalf.',
      'Track application and disbursal status online using your Kanyashree ID.',
    ],
    officialPortal: 'https://wbkanyashree.gov.in',
    department: 'Dept. of Women & Child Development and Social Welfare, Govt. of West Bengal',
    lastVerified: '9 Aug 2026',
  },
  {
    id: 'rupashree-prakalpa',
    name: 'Rupashree Prakalpa',
    category: 'Women & Family',
    status: 'Active',
    tagline: 'One-time financial assistance for the marriage of a daughter.',
    benefitAmount: '₹25,000 (one-time)',
    targetGroup: 'Economically weaker families marrying off a daughter aged 18 or above.',
    eligibility: [
      'Bride must be at least 18 years old and this must be her first marriage.',
      'Annual family income below ₹1,50,000.',
      'Applicant family should be a permanent resident of West Bengal.',
    ],
    documentsRequired: [
      'Age proof of the bride',
      'Income certificate',
      'Marriage invitation card or registration proof',
      'Aadhaar Card',
      'Bank account details',
    ],
    howToApply: [
      'Apply online through the scheme portal at least a few weeks before the marriage date.',
      'Alternatively, submit the offline form at your local BDO/SDO or municipal office.',
      "Funds are transferred directly to the applicant's bank account after verification.",
    ],
    officialPortal: 'https://wbrupashree.gov.in',
    department: 'Dept. of Women & Child Development and Social Welfare, Govt. of West Bengal',
    lastVerified: '9 Aug 2026',
  },
  {
    id: 'krishak-bandhu',
    name: 'Krishak Bandhu',
    category: 'Agriculture',
    status: 'Active',
    tagline: 'Income support and death-benefit cover for farming families.',
    benefitAmount: 'Up to ₹10,000/acre/year (min. ₹4,000 for landless farmers) + ₹2,00,000 death benefit',
    targetGroup: 'Registered land-owning or tenant farmers in West Bengal.',
    eligibility: [
      "Land records (RoR) registered in the applicant's name, or valid tenant-farmer documentation.",
      'Income support paid in two instalments (Kharif and Rabi seasons).',
      'Death benefit applies to registered farmers aged 18–60 for natural or accidental death.',
    ],
    documentsRequired: [
      'Land record / Record of Rights (RoR)',
      'Aadhaar Card',
      'Bank account linked to Aadhaar',
    ],
    howToApply: [
      'Register your land parcel on the Krishak Bandhu portal or at your local Krishi Bhavan.',
      'Verification is done against land records before enrolment.',
      'Payments are credited automatically each season once verified.',
    ],
    officialPortal: 'https://krishakbandhu.net',
    department: 'Dept. of Agriculture, Govt. of West Bengal',
    lastVerified: '9 Aug 2026',
  },
  {
    id: 'bangla-awas-yojana',
    name: 'Bangla Awas Yojana (PMAY-Gramin, WB)',
    category: 'Housing',
    status: 'Recently Launched',
    tagline: 'Construction assistance for a pucca house for rural houseless/kutcha-house families.',
    benefitAmount: '₹1,20,000 – ₹1,30,000 construction assistance',
    targetGroup: 'Rural households without a pucca house, identified via SECC 2011 / Awaas+ survey.',
    eligibility: [
      'Household must not already own a pucca house.',
      'Must be listed in the SECC 2011 database or the Awaas+ survey list.',
      'Priority given to SC/ST, minority, disabled, and BPL households.',
    ],
    documentsRequired: [
      'Aadhaar Card',
      'Homestead/land ownership proof',
      'Bank account linked to Aadhaar',
      'SECC/Awaas+ ID (if available)',
    ],
    howToApply: [
      'Check your name in the Awaas+ beneficiary list via your Gram Panchayat.',
      'If not listed, request a fresh survey addition through the Gram Panchayat office.',
      'Funds are released in instalments tied to construction stages, verified by field officers.',
    ],
    officialPortal: 'https://pmayg.nic.in',
    department: 'Dept. of Panchayats & Rural Development, Govt. of West Bengal / MoRD',
    lastVerified: '9 Aug 2026',
    sourceNote: 'The new state government has stated this scheme is being fast-tracked; disbursal timelines may vary district to district.',
  },
  {
    id: 'youth-unemployment-allowance',
    name: 'Youth Unemployment Allowance',
    category: 'Youth & Employment',
    status: 'Announced — Rollout Pending',
    tagline: 'Monthly support for job-seeking youth while the final scheme name and portal are confirmed.',
    benefitAmount: '₹3,000 / month (announced, not yet finalised)',
    targetGroup: 'Unemployed youth aged approximately 18–40, actively seeking employment.',
    eligibility: [
      'This scheme has been announced under more than one name in official communications (including "Yuva Shakti Bharosa Card" and "Bhorsa Karmasathi Scheme").',
      'Final eligibility age band, income criteria, and enrolment process have not yet been formally notified as of this writing.',
      'Do not pay any agent or third party claiming to process early registration for this scheme.',
    ],
    documentsRequired: [
      'Likely to require Aadhaar Card, education/employment status proof, and a bank account — not yet officially confirmed.',
    ],
    howToApply: [
      'No confirmed application channel is live yet.',
      'Enrolment is expected to open through the Social Registry West Bengal portal, based on the pattern used for other recent schemes.',
      'Check the official portal periodically for the formal notification before applying anywhere.',
    ],
    officialPortal: 'https://socialregistry.wb.gov.in',
    department: 'Govt. of West Bengal (department to be notified)',
    lastVerified: '9 Aug 2026',
    sourceNote:
      'Included here for visibility only. Details are unconfirmed and conflicting across official announcements — treat this card as "watch this space," not as something to act on yet.',
  },
];

const CATEGORIES: ('All' | SchemeCategory)[] = [
  'All',
  'Women & Family',
  'Education',
  'Health',
  'Agriculture',
  'Housing',
  'Youth & Employment',
];

const STATUS_STYLES: Record<SchemeStatus, string> = {
  Active:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
  'Recently Launched':
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
  'Announced — Rollout Pending':
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
};

export default function BenefitsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | SchemeCategory>('All');
  const [selected, setSelected] = useState<Scheme | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SCHEMES.filter((s) => {
      const matchesCategory = category === 'All' || s.category === category;
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.targetGroup.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-stone-950 civic-ambient-bg">
      {/* HERO */}
      <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-100/40 dark:bg-amber-950/10 blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-100 dark:border-orange-900 text-xs font-bold text-orange-600 dark:text-orange-300 shadow-xs mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>WEST BENGAL • WELFARE SCHEME DISCOVERY</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white leading-tight">
              Government benefits you may be eligible for in West Bengal
            </h1>
            <p className="mt-4 text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
              Browse active and recently announced state and central welfare schemes available to
              West Bengal residents. Every scheme links directly to its official government portal
              for registration — Nagrik Setu never collects your application data.
            </p>
          </motion.div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-stone-400 shrink-0">
              <CalendarClock className="h-4 w-4 text-primary" />
              <span>Data verified: 9 Aug 2026</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-stone-200 dark:bg-stone-800" />
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              West Bengal&apos;s welfare scheme landscape is being actively restructured under the
              new state government. Amounts, names, and eligibility below reflect the latest
              publicly confirmed information — always verify final terms on the official portal
              before applying.
            </p>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-y border-stone-200 dark:border-stone-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search schemes, e.g. women, farmer, housing..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                  category === c
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-primary/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-24 text-stone-400 text-sm">
              No schemes match your search. Try a different keyword or category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((s, i) => {
                const Icon = CATEGORY_ICONS[s.category];
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="interactive-card card-sweep bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-5 flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-primary flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border whitespace-nowrap ${STATUS_STYLES[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-stone-900 dark:text-white leading-snug">
                        {s.name}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                        {s.tagline}
                      </p>
                    </div>

                    <span className="text-lg font-extrabold text-primary">{s.benefitAmount}</span>

                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      <span className="font-bold text-stone-700 dark:text-stone-300">
                        Who qualifies:{' '}
                      </span>
                      {s.targetGroup}
                    </p>

                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setSelected(s)}
                        className="flex-1 text-xs font-bold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 rounded-xl py-2.5 hover:bg-stone-50 dark:hover:bg-stone-850 transition cursor-pointer"
                      >
                        Eligibility &amp; T&amp;Cs
                      </button>
                      <a
                        href={s.officialPortal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-orange-600 rounded-xl py-2.5 transition"
                      >
                        Apply
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-stone-900 w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[88vh] overflow-y-auto border border-stone-200 dark:border-stone-850 shadow-2xl"
            >
              <div className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-850 px-6 py-4 flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border mb-2 ${STATUS_STYLES[selected.status]}`}
                  >
                    {selected.status}
                  </span>
                  <h3 className="text-lg font-extrabold text-stone-900 dark:text-white">
                    {selected.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {selected.department}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-850 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div className="flex flex-wrap gap-4">
                  <div className="bg-stone-50 dark:bg-stone-850 rounded-xl px-4 py-3 flex-1 min-w-[140px]">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                      Benefit
                    </p>
                    <p className="text-sm font-extrabold text-primary mt-0.5">
                      {selected.benefitAmount}
                    </p>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-850 rounded-xl px-4 py-3 flex-1 min-w-[140px]">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                      Last verified
                    </p>
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                      {selected.lastVerified}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Eligibility Criteria
                  </h4>
                  <ul className="space-y-1.5">
                    {selected.eligibility.map((e, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed flex gap-2"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Documents Required
                  </h4>
                  <ul className="space-y-1.5">
                    {selected.documentsRequired.map((d, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed flex gap-2"
                      >
                        <span className="text-primary mt-0.5">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="h-4 w-4 text-purple-500" />
                    How to Apply
                  </h4>
                  <ul className="space-y-1.5">
                    {selected.howToApply.map((h, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed flex gap-2"
                      >
                        <span className="text-primary mt-0.5">{idx + 1}.</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selected.sourceNote && (
                  <div className="flex gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl px-4 py-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      {selected.sourceNote}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 bg-stone-50 dark:bg-stone-850 rounded-xl px-4 py-3">
                  <Info className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    Nagrik Setu only links you to the official government portal for registration.
                    We never collect application data, payments, or personal documents on your
                    behalf.
                  </p>
                </div>

                <a
                  href={selected.officialPortal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition w-full"
                >
                  <span>Continue to Official Government Portal</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
