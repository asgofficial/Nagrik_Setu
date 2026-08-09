'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { CitizenProfile, Gender } from '../../../types';
import { DOCUMENTS } from '../../../services/schemeService';
import VoiceInput from '../../../components/VoiceInput';
import { Shield, Sparkles, ArrowRight, ArrowLeft, Check, Info, FileText, AlertTriangle } from 'lucide-react';

export default function BenefitsCheck() {
  const router = useRouter();
  const { citizenProfile, updateCitizenProfile, setTourStep, isTourActive } = useApp();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CitizenProfile>({ ...citizenProfile });

  const steps = [
    { num: 1, label: 'Personal' },
    { num: 2, label: 'Household' },
    { num: 3, label: 'Economic' },
    { num: 4, label: 'Occupation' },
    { num: 5, label: 'Categories' },
    { num: 6, label: 'Documents' },
  ];

  // Voice transcript autofill handler
  const handleVoiceTranscript = (text: string) => {
    // Simulated transcript matching: "I am a 42-year-old farmer living in rural West Bengal... income under 1.5 lakhs"
    const parsedData = { ...formData };
    
    if (text.includes('42') || text.includes('forty-two')) {
      parsedData.age = 42;
    }
    if (text.includes('farmer')) {
      parsedData.isFarmer = true;
      parsedData.occupation = 'Farmer';
    }
    if (text.includes('rural')) {
      parsedData.urbanRural = 'rural';
    }
    if (text.includes('West Bengal') || text.includes('west bengal')) {
      parsedData.state = 'West Bengal';
    }
    if (text.includes('under') && (text.includes('1.5') || text.includes('one point five'))) {
      parsedData.incomeRange = '0-1.5L';
    }
    
    // Auto check documents referenced
    if (text.includes('aadhaar')) {
      if (!parsedData.documentsAvailable.includes('aadhaar')) parsedData.documentsAvailable.push('aadhaar');
    }
    if (text.includes('bank')) {
      if (!parsedData.documentsAvailable.includes('bank')) parsedData.documentsAvailable.push('bank');
    }
    
    setFormData(parsedData);
    
    // Voice prompt narration
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance("Voice details recognized. Profile loaded successfully.");
      window.speechSynthesis.speak(u);
    }
  };

  // Autofill Demo Profile
  const autofillDemoProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    const demoProfile: CitizenProfile = {
      age: 42,
      gender: 'male',
      state: 'West Bengal',
      district: 'Kolkata',
      urbanRural: 'rural',
      incomeRange: '0-1.5L',
      occupation: 'Farmer',
      isStudent: false,
      isFarmer: true,
      isSeniorCitizen: false,
      hasDisability: false,
      isWidowOrSingleParent: false,
      housingCondition: 'kutcha',
      documentsAvailable: ['aadhaar', 'bank', 'ration'],
      existingBenefits: []
    };
    setFormData(demoProfile);
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance("Demo profile preloaded.");
      window.speechSynthesis.speak(u);
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Save profile in context and redirect to results
      updateCitizenProfile(formData);
      
      // If we are in the judge tour, auto move to step 2!
      if (isTourActive) {
        setTourStep(2);
      }
      
      router.push('/benefits/results');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const toggleDocument = (docId: string) => {
    setFormData(prev => {
      const docs = prev.documentsAvailable.includes(docId)
        ? prev.documentsAvailable.filter(d => d !== docId)
        : [...prev.documentsAvailable, docId];
      return { ...prev, documentsAvailable: docs };
    });
  };

  const handleFieldChange = (key: keyof CitizenProfile, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      
      // Auto-compute senior citizen based on age
      if (key === 'age') {
        updated.isSeniorCitizen = Number(value) >= 60;
      }
      
      return updated;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 text-stone-800 dark:text-stone-100 flex-1 w-full">
      
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Welfare Scheme Access Check</h1>
        <p className="text-xs text-stone-500 mt-2 uppercase tracking-widest font-bold">Benefit Gap Detector AI Wizard</p>
      </div>

      {/* Progress Track */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px] px-2 py-3 border-b border-stone-200 dark:border-stone-800">
          {steps.map(step => (
            <div key={step.num} className="flex items-center gap-2">
              <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === step.num
                  ? 'bg-primary text-white scale-110 shadow-xs'
                  : currentStep > step.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
              }`}>
                {currentStep > step.num ? <Check className="h-3.5 w-3.5" /> : step.num}
              </span>
              <span className={`text-xs font-semibold ${
                currentStep === step.num ? 'text-primary' : 'text-stone-400'
              }`}>
                {step.label}
              </span>
              {step.num < 6 && <div className="h-0.5 w-6 bg-stone-200 dark:bg-stone-800" />}
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Warning Banner */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 text-xs text-stone-600 dark:text-stone-400 flex items-start gap-3">
        <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-stone-900 dark:text-white mb-0.5">Privacy By Design Enforced</p>
          <p className="font-bold text-stone-850 dark:text-stone-300">We don't need your Aadhaar number to discover potential benefits.</p>
          <p className="mt-0.5">Nagrik Setu uses only the minimum information required to estimate eligibility. Document readiness requires only checking whether you have a document "Available" or "Missing" without entering any serial numbers.</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl p-6 sm:p-8 shadow-xs min-h-[300px]">
        
        {/* Step 1: Personal Profile */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex justify-between items-start gap-4 border-b pb-4 mb-4">
              <div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-white">Personal Profile</h3>
                <p className="text-xs text-stone-500">Provide basic demographic metrics</p>
              </div>
              
              <button
                onClick={autofillDemoProfile}
                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900 text-primary border border-blue-200 dark:border-blue-800 text-[11px] font-bold px-3 py-2 rounded-lg transition"
              >
                Autofill Demo Profile
              </button>
            </div>

            <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-800 mb-4">
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                demoText="Namaste, I am a 42-year-old farmer living in rural West Bengal. I hold Aadhaar and a bank passbook. My annual family income is under one point five lakhs."
                placeholder="Click here to speak your profile details..."
              />
              <span className="text-[10px] font-medium text-stone-400">Verbal onboarding assist (English/Hindi support)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400">Age</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleFieldChange('age', Number(e.target.value))}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleFieldChange('gender', e.target.value as Gender)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Household & Region */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-stone-900 dark:text-white border-b pb-3">Household & Location</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
                >
                  <option value="West Bengal">West Bengal</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Other">Other State</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400">District / Ward</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleFieldChange('district', e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
                  placeholder="e.g. Kolkata"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400">Location Sector</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleFieldChange('urbanRural', 'urban')}
                    className={`py-2 px-4 rounded-xl border text-sm font-semibold transition ${
                      formData.urbanRural === 'urban'
                        ? 'border-primary bg-blue-50 dark:bg-blue-950/20 text-primary'
                        : 'border-stone-200 dark:border-stone-850 hover:bg-stone-50'
                    }`}
                  >
                    Urban Area
                  </button>
                  <button
                    onClick={() => handleFieldChange('urbanRural', 'rural')}
                    className={`py-2 px-4 rounded-xl border text-sm font-semibold transition ${
                      formData.urbanRural === 'rural'
                        ? 'border-primary bg-blue-50 dark:bg-blue-950/20 text-primary'
                        : 'border-stone-200 dark:border-stone-850 hover:bg-stone-50'
                    }`}
                  >
                    Rural Area
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400">Housing Condition</label>
                <select
                  value={formData.housingCondition}
                  onChange={(e) => handleFieldChange('housingCondition', e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
                >
                  <option value="pucca">Pucca House (Concrete / Permanent)</option>
                  <option value="kutcha">Kutcha House (Mud / Dilapidated)</option>
                  <option value="homeless">No Permanent Shelter / Homeless</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Economic Profile */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-stone-900 dark:text-white border-b pb-3">Economic Profile</h3>
            
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase text-stone-400 block">Annual Household Income Range (Estimated)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { value: '0-1.5L', label: 'Below ₹1.5 Lakhs/year' },
                  { value: '1.5L-3L', label: '₹1.5 Lakhs - ₹3 Lakhs/year' },
                  { value: '3L-5L', label: '₹3 Lakhs - ₹5 Lakhs/year' },
                  { value: '5L-8L', label: '₹5 Lakhs - ₹8 Lakhs/year' },
                  { value: '8L+', label: 'Above ₹8 Lakhs/year' }
                ].map(income => (
                  <button
                    key={income.value}
                    onClick={() => handleFieldChange('incomeRange', income.value)}
                    className={`py-3 px-4 rounded-xl border text-xs text-left font-semibold transition flex flex-col justify-between ${
                      formData.incomeRange === income.value
                        ? 'border-primary bg-blue-50 dark:bg-blue-950/20 text-primary ring-1 ring-blue-500'
                        : 'border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900'
                    }`}
                  >
                    <span>{income.label}</span>
                    <span className="text-[10px] text-stone-400 mt-2">Annual Cap</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Occupation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-stone-900 dark:text-white border-b pb-3">Occupation Status</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-stone-400">Primary Sector</label>
                <select
                  value={formData.occupation}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleFieldChange('occupation', val);
                    handleFieldChange('isFarmer', val.toLowerCase() === 'farmer');
                    handleFieldChange('isStudent', val.toLowerCase() === 'student');
                  }}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:outline-hidden"
                >
                  <option value="Unemployed">Unemployed / Unorganized Worker</option>
                  <option value="Farmer">Farmer (Landowner / Tenant)</option>
                  <option value="Student">Student (School / Higher Education)</option>
                  <option value="Self-Employed">Self-Employed / Shopkeeper</option>
                  <option value="Salaried Employee">Salaried / Private Worker</option>
                  <option value="Retired">Retired Senior Citizen</option>
                </select>
              </div>

              <div className="space-y-4 pt-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isFarmer"
                    checked={formData.isFarmer}
                    onChange={(e) => handleFieldChange('isFarmer', e.target.checked)}
                    className="h-4 w-4 text-primary rounded"
                  />
                  <label htmlFor="isFarmer" className="text-sm font-semibold select-none">I am actively farming / landholder</label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isStudent"
                    checked={formData.isStudent}
                    onChange={(e) => handleFieldChange('isStudent', e.target.checked)}
                    className="h-4 w-4 text-primary rounded"
                  />
                  <label htmlFor="isStudent" className="text-sm font-semibold select-none">I am currently enrolled in school/college</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Special Categories */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-stone-900 dark:text-white border-b pb-3">Special Categories</h3>
            <p className="text-xs text-stone-500">Certain welfare schemes target specific vulnerabilities. Check all that apply:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900 flex items-start gap-3 transition">
                <input
                  type="checkbox"
                  id="hasDisability"
                  checked={formData.hasDisability}
                  onChange={(e) => handleFieldChange('hasDisability', e.target.checked)}
                  className="h-4.5 w-4.5 text-primary rounded mt-0.5"
                />
                <div>
                  <label htmlFor="hasDisability" className="text-sm font-bold block select-none">Person with Disability (PwD)</label>
                  <span className="text-[10px] text-stone-400">Eligible for UDID and dedicated pensions</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900 flex items-start gap-3 transition">
                <input
                  type="checkbox"
                  id="isSeniorCitizen"
                  checked={formData.isSeniorCitizen}
                  onChange={(e) => handleFieldChange('isSeniorCitizen', e.target.checked)}
                  className="h-4.5 w-4.5 text-primary rounded mt-0.5"
                />
                <div>
                  <label htmlFor="isSeniorCitizen" className="text-sm font-bold block select-none">Senior Citizen (Age 60+)</label>
                  <span className="text-[10px] text-stone-400">Eligible for national old age pensions</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900 flex items-start gap-3 transition">
                <input
                  type="checkbox"
                  id="isWidowOrSingleParent"
                  checked={formData.isWidowOrSingleParent}
                  onChange={(e) => handleFieldChange('isWidowOrSingleParent', e.target.checked)}
                  className="h-4.5 w-4.5 text-primary rounded mt-0.5"
                />
                <div>
                  <label htmlFor="isWidowOrSingleParent" className="text-sm font-bold block select-none">Widow or Single Parent</label>
                  <span className="text-[10px] text-stone-400">Eligied for targeted women empowerment welfare</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Documents Checklist */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b pb-3 mb-2">
              <h3 className="font-bold text-lg text-stone-900 dark:text-white">Documents Checklist</h3>
              <p className="text-xs text-stone-500">Select the documents you CURRENTLY HAVE physical or digital copies of. This calculates your application readiness.</p>
            </div>

            {/* Document Warning Badge */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Checking the box means you have access to the document. Do not upload or type any document serial keys.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {DOCUMENTS.map(doc => {
                const isSelected = formData.documentsAvailable.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleDocument(doc.id)}
                    className={`p-3 rounded-xl border text-left text-xs transition flex justify-between items-center ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div>
                      <p>{doc.name}</p>
                      <p className="text-[10px] text-stone-400 font-normal mt-0.5">{doc.description.slice(0, 50)}...</p>
                    </div>
                    <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300'
                    }`}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex justify-between items-center pt-8 border-t border-stone-150 dark:border-stone-850 mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-bold text-xs transition ${
              currentStep === 1
                ? 'border-stone-200 text-stone-300 dark:border-stone-800 dark:text-stone-700 cursor-not-allowed'
                : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300 cursor-pointer'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 bg-primary hover:bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <span>{currentStep === 6 ? 'Analyze Eligibility' : 'Continue'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
