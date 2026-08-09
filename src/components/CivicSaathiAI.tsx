'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { MessageSquare, X, Send, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';

interface ChatAction {
  label: string;
  actionKey: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  actions?: ChatAction[];
}

// Action keys that map directly to a route. Anything else the AI suggests
// (e.g. "tell me more about Lakshmir Bhandar") is just sent back into the
// conversation as if the user typed it — no per-scheme hardcoding needed.
const NAV_ACTIONS: Record<string, string> = {
  action_find_schemes: '/benefits/check',
  action_report_issue: '/report',
  action_track_complaint: '/dashboard',
};

function welcomeText(language: string) {
  if (language === 'hi') {
    return 'नमस्ते! मैं सिविकसाथी एआई हूँ, आपका बुद्धिमान नागरिक सहायक। मैं आपको सरकारी कल्याणकारी योजनाएं खोजने, नागरिक समस्या दर्ज करने, या अपनी शिकायतों को ट्रैक करने में मदद कर सकता हूँ।';
  }
  if (language === 'bn') {
    return 'নমস্কার! আমি সিভিকসাথী এআই, আপনার বুদ্ধিমান নাগরিক সহকারী। আমি আপনাকে সরকারি কল্যাণমূলক প্রকল্প খুঁজে পেতে, স্থানীয় সমস্যা রিপোর্ট করতে, অথবা অভিযোগ ট্র্যাক করতে সাহায্য করতে পারি।';
  }
  return 'Namaste! I am CivicSaathi AI, your intelligent civic assistant. I can help you find government welfare benefits, report a civic issue, or track active complaints.';
}

function errorText(language: string) {
  if (language === 'hi') return 'क्षमा करें, अभी जवाब देने में समस्या हो रही है। कृपया फिर से प्रयास करें।';
  if (language === 'bn') return 'দুঃখিত, এখন উত্তর দিতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।';
  return "Sorry, I'm having trouble responding right now. Please try again.";
}

export default function CivicSaathiAI() {
  const router = useRouter();
  const { language, grievances } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message (static greeting only — no simulated logic)
  useEffect(() => {
    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: welcomeText(language),
        timestamp: new Date(),
        actions: [
          { label: language === 'en' ? '🔍 Find Schemes' : language === 'hi' ? '🔍 योजनाएं खोजें' : '🔍 প্রকল্প খুঁজুন', actionKey: 'action_find_schemes' },
          { label: language === 'en' ? '🚨 Report a Problem' : language === 'hi' ? '🚨 समस्या दर्ज करें' : '🚨 সমস্যা রিপোর্ট করুন', actionKey: 'action_report_issue' },
          { label: language === 'en' ? '📋 Explain a Scheme' : language === 'hi' ? '📋 योजना समझाएं' : '📋 প্রকল্প বুঝুন', actionKey: 'action_explain_scheme' },
          { label: language === 'en' ? '📍 Track My Complaint' : language === 'hi' ? '📍 शिकायत ट्रैक करें' : '📍 অভিযোগ ট্র্যাক করুন', actionKey: 'action_track_complaint' },
        ],
      },
    ]);
  }, [language]);

  // Scroll to bottom on messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const rawVal = textToSend || inputVal;
    if (!rawVal.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: rawVal,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputVal('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/civic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ sender: m.sender, text: m.text })),
          language,
          grievances,
        }),
      });

      if (!res.ok) throw new Error(`Request failed with ${res.status}`);

      const data: { reply: string; actions?: ChatAction[] } = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-assistant-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date(),
          actions: data.actions,
        },
      ]);
    } catch (err) {
      console.error('CivicSaathi AI error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-error-${Date.now()}`,
          sender: 'assistant',
          text: errorText(language),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (actionKey: string, label: string) => {
    if (NAV_ACTIONS[actionKey]) {
      setIsOpen(false);
      router.push(NAV_ACTIONS[actionKey]);
      return;
    }
    if (actionKey.startsWith('view_scheme_')) {
      setIsOpen(false);
      router.push(`/schemes/${actionKey.replace('view_scheme_', '')}`);
      return;
    }
    if (actionKey.startsWith('view_grievance_')) {
      setIsOpen(false);
      router.push(`/grievances/${actionKey.replace('view_grievance_', '')}`);
      return;
    }
    // Anything the AI suggested that isn't a direct route — treat the click
    // like the user typed the label, so the AI responds conversationally.
    handleSend(label);
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
          <span className="hidden sm:inline text-xs font-bold pr-1.5 uppercase tracking-wider">CivicSaathi AI</span>
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
                <h4 className="font-extrabold text-sm tracking-wide">CivicSaathi AI</h4>
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
            {messages.map((msg) => (
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
                    if (paragraph.includes('**')) {
                      const parts = paragraph.split('**');
                      return (
                        <p key={index} className="mb-1">
                          {parts.map((p, i) => (i % 2 === 1 ? <strong key={i} className="font-bold">{p}</strong> : p))}
                        </p>
                      );
                    }
                    return <p key={index} className="mb-1">{paragraph}</p>;
                  })}
                </div>

                <span className="text-[9px] text-stone-400 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {msg.actions.map((act, index) => (
                      <button
                        key={index}
                        onClick={() => handleActionClick(act.actionKey, act.label)}
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

            {isTyping && (
              <div className="flex items-center gap-1 bg-white dark:bg-stone-850 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 max-w-[60px] mr-auto">
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Footer Input Area */}
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
              placeholder={language === 'en' ? 'Ask about schemes, documents...' : 'योजनाओं या दस्तावेजों के बारे में पूछें...'}
              className="flex-1 bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 text-xs rounded-xl px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-stone-950 dark:text-stone-50"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping}
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