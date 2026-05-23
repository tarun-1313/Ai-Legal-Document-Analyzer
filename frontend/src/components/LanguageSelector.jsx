import { useState, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import axios from '../api/axios';

const SUPPORTED_LANGUAGES = {
  "en": "English",
  "hi": "Hindi",
  "mr": "Marathi",
  "pa": "Punjabi",
  "gu": "Gujarati",
  "ta": "Tamil",
  "te": "Telugu",
  "kn": "Kannada",
  "ml": "Malayalam",
  "bn": "Bengali",
  "ur": "Urdu",
  "or": "Odia",
  "as": "Assamese",
  "sa": "Sanskrit",
  "es": "Spanish",
  "fr": "French",
  "de": "German",
  "ar": "Arabic"
};

export default function LanguageSelector({ currentLang, onLanguageChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all"
      >
        <Globe size={18} className="text-primary" />
        <span>{SUPPORTED_LANGUAGES[currentLang] || 'English'}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => {
                    onLanguageChange(code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    currentLang === code 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{name}</span>
                  {currentLang === code && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
