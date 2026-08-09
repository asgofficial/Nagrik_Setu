'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { MessageSquare, X, Send, Sparkles, MessageCircle, HelpCircle, FileText, Settings, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  actions?: { label: string; actionKey: string }[];
}

export default function CivicAssistant() {
  const router = useRouter();
  const { language, setLanguage, grievances } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message
  useEffect(() => {
    let welcome = "Namaste! I am NagrikSaathi AI, your intelligent civic assistant. I can help you find government welfare benefits, report a civic issue, or track active complaints.";
    if (language === 'hi') {
      welcome = "नमस्ते! मैं सिविकसाथी एआई हूँ, आपका बुद्धिमान नागरिक सहायक। मैं आपको सरकारी कल्याणकारी योजनाएं खोजने, नागरिक समस्या दर्ज करने, या अपनी शिकायतों को ट्रैक करने में मदद कर सकता हूँ।";
    } else if (language === 'bn') {
      welcome = "নমস্কার! আমি সিভিকসাথী এআই, আপনার বুদ্ধিমান নাগরিক সহকারী। আমি আপনাকে সরকারি কল্যাণমূলক প্রকল্প খুঁজে পেতে, স্থানীয় সমস্যা রিপোর্ট করতে, অথবা অভিযোগ ট্র্যাক করতে সাহায্য করতে পারি।";
    }

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: welcome,
        timestamp: new Date(),
        actions: [
          { label: language === 'en' ? '🔍 Find Schemes' : language === 'hi' ? '🔍 योजनाएं खोजें' : '🔍 প্রকল্প খুঁজুন', actionKey: 'action_find_schemes' },
          { label: language === 'en' ? '🚨 Report a Problem' : language === 'hi' ? '🚨 समस्या दर्ज करें' : '🚨 সমস্যা রিপোর্ট করুন', actionKey: 'action_report_issue' },
          { label: language === 'en' ? '📋 Explain a Scheme' : language === 'hi' ? '📋 योजना समझाएं' : '📋 প্রকল্প বুঝুন', actionKey: 'action_explain_scheme' },
          { label: language === 'en' ? '📍 Track My Complaint' : language === 'hi' ? '📍 शिकायत ट्रैक करें' : '📍 অভিযোগ ট্র্যাক করুন', actionKey: 'action_track_complaint' }
        ]
      }
    ]);
  }, [language]);

  // Scroll to bottom on messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const rawVal = textToSend || inputVal;
    if (!rawVal.trim()) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: rawVal,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Formulate response after typing animation
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "";
      let actions: { label: string; actionKey: string }[] | undefined = undefined;

      const lowerText = rawVal.toLowerCase();

      if (lowerText.includes('scheme') || lowerText.includes('benefit') || lowerText.includes('योजना') || lowerText.includes('প্রকল্প')) {
        replyText = language === 'en' 
          ? "Nagrik Setu calculates your eligibility using the Benefit Gap Detector. Let's fill out a quick 6-step profile to see which of our 9 seeded schemes you match with!"
          : language === 'hi'
          ? "नागरिकसेतु आपके प्रोफाइल के आधार पर पात्रता की गणना करता है। आइए यह देखने के लिए एक त्वरित प्रश्नावली भरें कि आप किन 9 योजनाओं के पात्र हैं!"
          : "নাগরিকসেতু আপনার প্রোফাইলের ওপর ভিত্তি করে যোগ্যতার হিসাব করে। চলুন একটি কুইজ পূরণ করে দেখে নেওয়া যাক আপনি কোন কোন প্রকল্পের সুবিধা পেতে পারেন!";
        
        actions = [{ label: language === 'en' ? 'Start Questionnaire' : 'शुरू करें', actionKey: 'action_find_schemes' }];
      } 
      else if (lowerText.includes('report') || lowerText.includes('complain') || lowerText.includes('समस्या') || lowerText.includes('অভিযোগ')) {
        replyText = language === 'en'
          ? "You can file a civic issue (broken streetlight, garbage dumping, leakage) in under 60 seconds. Our AI will automatically classify the category, detect duplicates, and route it to the proper department."
          : language === 'hi'
          ? "आप 60 सेकंड के भीतर कोई भी नागरिक समस्या (जैसे टूटी स्ट्रीटलाइट, कचरा, पाइप लीकेज) दर्ज कर सकते हैं। हमारा एआई श्रेणी को वर्गीकृत करेगा और इसे सही विभाग को भेजेगा।"
          : "আপনি ৬০ সেকেন্ডের কম সময়ে যেকোনো স্থানীয় সমস্যা (যেমন ভাঙা স্ট্রিটলাইট, ময়লা ফেলা, জলের পাইপ লিক) নথিভুক্ত করতে পারেন। আমাদের এআই ক্যাটাগরি বিশ্লেষণ করে সঠিক দপ্তরে পাঠিয়ে দেবে।";
        
        actions = [{ label: language === 'en' ? 'File a Report' : 'दर्ज करें', actionKey: 'action_report_issue' }];
      } 
      else if (lowerText.includes('track') || lowerText.includes('status') || lowerText.includes('शिकायत ट्रैक') || lowerText.includes('অভিযোগ ট্র্যাক')) {
        if (grievances.length > 0) {
          const activeG = grievances[0]; // primary streetlight complaint
          replyText = language === 'en'
            ? `Your active complaint "${activeG.title}" (ID: ${activeG.id}) is currently: ${activeG.status.replace('_', ' ')}. The Municipal Electrical Department is resolving it.`
            : `आपकी सक्रिय शिकायत "${activeG.title}" (ID: ${activeG.id}) वर्तमान में: ${activeG.status.replace('_', ' ')} है।`;
          
          actions = [{ label: 'View Complaint Details', actionKey: `view_grievance_${activeG.id}` }];
        } else {
          replyText = "I couldn't find any active complaints filed from your profile. Try reporting a civic issue first!";
          actions = [{ label: 'Report Issue Now', actionKey: 'action_report_issue' }];
        }
      }
      else if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey') || lowerText.includes('नमस्ते') || lowerText.includes('হ্যালো')) {
        replyText = language === 'en'
          ? "Hello! How can I assist you with Nagriksetu welfare schemes or local complaints today?"
          : "नमस्ते! आज मैं आपके लिए योजनाओं या शिकायत निवारण में क्या सहायता कर सकता हूँ?";
      }
      else {
        replyText = language === 'en'
          ? "I understand. I am equipped to guide you on benefits and local grievances. Please select one of our primary options to continue:"
          : "मैं समझता हूँ। कृपया जारी रखने के लिए मुख्य विकल्पों में से एक चुनें:";

        actions = [
          { label: '🔍 Find Schemes', actionKey: 'action_find_schemes' },
          { label: '🚨 Report Issue', actionKey: 'action_report_issue' }
        ];
      }

      setMessages(prev => [...prev, {
        id: `msg-assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date(),
        actions
      }]);

    }, 1200);
  };

  const handleActionClick = (actionKey: string) => {
    if (actionKey === 'action_find_schemes') {
      setIsOpen(false);
      router.push('/benefits/check');
    } else if (actionKey === 'action_report_issue') {
      setIsOpen(false);
      router.push('/report');
    } else if (actionKey === 'action_track_complaint') {
      setIsOpen(false);
      router.push('/dashboard');
    } else if (actionKey === 'action_explain_scheme') {
      // Simulate chat reply detailing a scheme
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `msg-scheme-detail-${Date.now()}`,
          sender: 'assistant',
          text: "Here are some of our major seeded schemes. Select one to see a plain-language summary:",
          timestamp: new Date(),
          actions: [
            { label: 'Lakshmir Bhandar (Women Grant)', actionKey: 'explain_wb_lb' },
            { label: 'PM-KISAN (Farmers Support)', actionKey: 'explain_pm_k' },
            { label: 'Swasthya Sathi (Health Card)', actionKey: 'explain_wb_ss' }
          ]
        }]);
      }, 800);
    } else if (actionKey === 'explain_wb_lb') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `msg-lb-explain-${Date.now()}`,
          sender: 'assistant',
          text: "**Lakshmir Bhandar**: Financial grant for women heads of families aged 25-60 in West Bengal. Provides ₹1,000/month (General) or ₹1,200/month (SC/ST). Required documents: Aadhaar Card, Caste Certificate, Domicile Proof, and a Bank Account.",
          timestamp: new Date(),
          actions: [
            { label: 'Check My Eligibility', actionKey: 'action_find_schemes' },
            { label: 'Open Scheme Page', actionKey: 'view_scheme_wb-lakshmir-bhandar' }
          ]
        }]);
      }, 1000);
    } else if (actionKey === 'explain_pm_k') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `msg-pmk-explain-${Date.now()}`,
          sender: 'assistant',
          text: "**PM-KISAN**: Income support of ₹6,000/year for landholding small and marginal farmers across India, paid in 3 installments. Required documents: Aadhaar Card, Bank Passbook, and verified Land Records (Parcha/RoR).",
          timestamp: new Date(),
          actions: [
            { label: 'Check My Eligibility', actionKey: 'action_find_schemes' },
            { label: 'Open Scheme Page', actionKey: 'view_scheme_pm-kisan' }
          ]
        }]);
      }, 1000);
    } else if (actionKey === 'explain_wb_ss') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: `msg-ss-explain-${Date.now()}`,
          sender: 'assistant',
          text: "**Swasthya Sathi**: Family cashless health insurance cover up to ₹5,000/year for medical treatments, registered under the female family head's name in West Bengal. Required: Aadhaar Card and Ration Card.",
          timestamp: new Date(),
          actions: [
            { label: 'Open Scheme Page', actionKey: 'view_scheme_wb-swasthya-sathi' }
          ]
        }]);
      }, 1000);
    } else if (actionKey.startsWith('view_scheme_')) {
      const id = actionKey.replace('view_scheme_', '');
      setIsOpen(false);
      router.push(`/schemes/${id}`);
    } else if (actionKey.startsWith('view_grievance_')) {
      const id = actionKey.replace('view_grievance_', '');
      setIsOpen(false);
      router.push(`/grievances/${id}`);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 lg:bottom-4 lg:left-4 z-[9990]">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-2xl hover:shadow-xl transition transform hover:scale-105 active:scale-95 group"
          aria-label="Open CivicSaathi Assistant"
          id="btn-chatbot"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="hidden sm:inline text-xs font-bold pr-1.5 uppercase tracking-wider">NagrikSaathi AI</span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-88 sm:w-96 h-[500px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-800 dark:text-stone-100 transition-all duration-300">
          
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles className="h-4.5 w-4.5 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-wide">NagrikSaathi AI</h4>
                <span className="text-[10px] text-blue-100 font-semibold uppercase tracking-wider">Welfare & Grievance Assist</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 transition text-blue-100 hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50 dark:bg-stone-900/30">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                      : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-100 dark:border-stone-850 rounded-bl-none shadow-xs'
                  }`}
                >
                  {msg.text.split('\n').map((paragraph, index) => {
                    // Simple Markdown bold support
                    if (paragraph.startsWith('**') || paragraph.includes('**')) {
                      // replace **bold** with <strong>bold</strong>
                      const parts = paragraph.split('**');
                      return (
                        <p key={index} className="mb-1">
                          {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-bold">{p}</strong> : p)}
                        </p>
                      );
                    }
                    return <p key={index} className="mb-1">{paragraph}</p>;
                  })}
                </div>
                
                {/* Message Timestamp */}
                <span className="text-[9px] text-stone-400 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Message Interactive Quick Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {msg.actions.map((act, index) => (
                      <button
                        key={index}
                        onClick={() => handleActionClick(act.actionKey)}
                        className="bg-white hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xs hover:border-primary dark:hover:border-primary transition flex items-center gap-1 cursor-pointer"
                      >
                        {act.label}
                        <ArrowRight className="h-3 w-3 text-stone-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Loader */}
            {isTyping && (
              <div className="flex items-center gap-1 bg-white dark:bg-stone-850 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 max-w-[60px] mr-auto">
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* AppFooter Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={language === 'en' ? "Ask about schemes, documents..." : "योजनाओं या दस्तावेजों के बारे में पूछें..."}
              className="flex-1 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 text-xs rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-stone-950 dark:text-stone-50"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-400 shrink-0 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
