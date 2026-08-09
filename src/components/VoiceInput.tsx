import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  lang?: 'en-IN' | 'hi-IN' | 'bn-IN';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  demoText?: string;
}

export default function VoiceInput({
  onTranscript,
  lang,
  className = "",
  size = "md",
  placeholder = "Click mic to speak..."
}: VoiceInputProps) {
  const { language } = useApp();
  
  // Default to global app language mapping if explicit lang prop not provided
  const targetLang = lang || (language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-IN');
  const [status, setStatus] = useState<'idle' | 'listening' | 'error' | 'unsupported'>('idle');
  const [interimText, setInterimText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setStatus('unsupported');
      } else {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = targetLang;

        recognition.onstart = () => {
          setStatus('listening');
          setInterimText('');
          setErrorMsg('');
        };

        recognition.onresult = (event: any) => {
          let currentInterimText = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              currentInterimText += event.results[i][0].transcript;
            }
          }

          setInterimText(currentInterimText);

          if (finalTranscript) {
            onTranscript(finalTranscript);
            playChime(800);
          }
        };

        recognition.onerror = (event: any) => {
          setStatus('error');
          if (event.error === 'no-speech') {
            setErrorMsg('No speech detected.');
          } else if (event.error === 'audio-capture') {
            setErrorMsg('No microphone found.');
          } else if (event.error === 'not-allowed') {
            setErrorMsg('Microphone access denied.');
          } else {
            setErrorMsg('Error recording voice.');
          }
        };

        recognition.onend = () => {
          setStatus('idle');
          setInterimText('');
        };

        recognitionRef.current = recognition;
      }
    }
  }, [targetLang, onTranscript]);

  const playChime = (frequency: number) => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    }
  };

  const toggleVoice = (e: React.MouseEvent) => {
    e.preventDefault();
    if (status === 'unsupported') return;

    if (status === 'listening') {
      recognitionRef.current?.stop();
      setStatus('idle');
    } else {
      playChime(600);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 h-8 w-8',
    md: 'p-2.5 h-11 w-11',
    lg: 'p-3.5 h-14 w-14'
  };

  if (status === 'unsupported') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          disabled
          className={`rounded-full shrink-0 flex items-center justify-center border bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed ${sizeClasses[size]}`}
          title="Voice input not supported in this browser"
        >
          <MicOff className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleVoice}
        className={`rounded-full shrink-0 flex items-center justify-center transition border ${
          status === 'listening'
            ? 'bg-red-500 border-red-600 text-white animate-pulse shadow-red-200 shadow-lg scale-110'
            : status === 'error'
            ? 'bg-stone-100 border-red-300 text-red-500 hover:bg-red-50'
            : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:scale-105 active:scale-95'
        } ${sizeClasses[size]}`}
        title={status === 'listening' ? 'Stop listening' : placeholder}
        aria-label="Activate voice input"
      >
        {status === 'listening' ? (
          <Mic className="h-5 w-5 animate-bounce" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>

      {status !== 'idle' && (
        <span className="text-xs font-semibold transition-all max-w-[200px] truncate">
          {status === 'listening' && (
            <span className="text-red-500 flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <span className="h-3 w-0.75 bg-red-500 animate-[bounce_0.6s_infinite_100ms]" />
                <span className="h-4 w-0.75 bg-red-500 animate-[bounce_0.6s_infinite_200ms]" />
                <span className="h-3.5 w-0.75 bg-red-500 animate-[bounce_0.6s_infinite_300ms]" />
              </span>
              {interimText || 'Listening...'}
            </span>
          )}
          {status === 'error' && (
            <span className="text-red-500">
              {errorMsg}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
