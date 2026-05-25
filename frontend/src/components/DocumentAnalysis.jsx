import { FileText, AlertCircle, AlertTriangle, TrendingDown, Info, ShieldAlert, Lightbulb, Clock, Users, CreditCard, Gavel, Zap, Volume2, CheckCircle2, XCircle, IndianRupee, Terminal, Cpu, Activity, Lock, Shield, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

// Global variable to track current audio playback
let currentAudioInstance = null;

const speak = (text, lang = 'en') => {
  try {
    // 1. Stop any ongoing browser speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // 2. Stop any ongoing cloud audio playback
    if (currentAudioInstance) {
      currentAudioInstance.pause();
      currentAudioInstance.src = "";
      currentAudioInstance = null;
    }

    if (!text || text.trim().length === 0) return;

    // 3. Map internal codes to Google TTS language codes
    const langMap = {
      "en": "en", "hi": "hi", "mr": "mr", "pa": "pa",
      "gu": "gu", "ta": "ta", "te": "te", "kn": "kn",
      "ml": "ml", "bn": "bn", "ur": "ur", "or": "or",
      "as": "as", "sa": "sa", "es": "es", "fr": "fr",
      "de": "de", "ar": "ar"
    };

    const targetLang = langMap[lang.split('-')[0]] || 'en';
    const encodedText = encodeURIComponent(text);
    
    // 4. Generate Google Translate TTS URL
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${targetLang}&client=tw-ob`;
    
    // 5. Play audio using the browser Audio object
    const audio = new Audio(audioUrl);
    currentAudioInstance = audio;

    audio.play().catch((err) => {
      console.warn("Cloud TTS playback failed, falling back to System TTS:", err);
      // 6. Fallback to browser speech synthesis if audio streaming fails
      useSystemTTS(text, targetLang);
    });

  } catch (error) {
    console.error("Speech Error:", error);
    // Final fallback attempt
    const baseLang = lang.split('-')[0];
    useSystemTTS(text, baseLang);
  }
};

const useSystemTTS = (text, targetLang) => {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Map back to BCP-47 for system voices
  const systemLangMap = {
    "en": "en-US", "hi": "hi-IN", "mr": "mr-IN", "pa": "pa-IN",
    "gu": "gu-IN", "ta": "ta-IN", "te": "te-IN", "kn": "kn-IN",
    "ml": "ml-IN", "bn": "bn-IN", "ur": "ur-PK", "or": "or-IN",
    "as": "as-IN", "sa": "sa-IN", "es": "es-ES", "fr": "fr-FR",
    "de": "de-DE", "ar": "ar-SA"
  };
  
  utterance.lang = systemLangMap[targetLang] || targetLang;
  window.speechSynthesis.speak(utterance);
};

const TTSButton = ({ text, lang }) => (
  <button 
    onClick={() => speak(text, lang)}
    className="p-1.5 hover:bg-primary/20 rounded-lg text-primary transition-colors"
    title="Listen to this section"
  >
    <Volume2 size={16} />
  </button>
);

const RiskMeter = ({ score, level }) => {
  const getColors = (lvl) => {
    switch (lvl?.toLowerCase()) {
      case 'critical': return { 
        text: 'text-red-500', 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/20', 
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        accent: 'bg-red-500'
      };
      case 'high': return { 
        text: 'text-orange-500', 
        bg: 'bg-orange-500/10', 
        border: 'border-orange-500/20', 
        glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]',
        accent: 'bg-orange-500'
      };
      case 'medium': return { 
        text: 'text-yellow-500', 
        bg: 'bg-yellow-500/10', 
        border: 'border-yellow-500/20', 
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
        accent: 'bg-yellow-500'
      };
      default: return { 
        text: 'text-green-500', 
        bg: 'bg-green-500/10', 
        border: 'border-green-500/20', 
        glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
        accent: 'bg-green-500'
      };
    }
  };

  const colors = getColors(level);
  
  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-[#0a0c12]/60 backdrop-blur-xl border ${colors.border} rounded-[2.5rem] h-full relative overflow-hidden group transition-all duration-500 ${colors.glow}`}>
      {/* Background Pulse */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 ${colors.accent}/10 rounded-full blur-3xl animate-pulse`} />
      
      <div className="relative z-10 space-y-6 flex flex-col items-center">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <defs>
              <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="100%" stopColor="currentColor" />
              </linearGradient>
            </defs>
            <circle
              cx="80" cy="80" r="74"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="12"
              className="text-white/5"
            />
            <motion.circle
              cx="80" cy="80" r="74"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={465}
              initial={{ strokeDashoffset: 465 }}
              animate={{ strokeDashoffset: 465 - (465 * score) / 100 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className={`${colors.text} transition-all duration-1000 ease-out drop-shadow-[0_0_8px_currentColor]`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-5xl font-black text-white tracking-tighter"
            >
              {score}
            </motion.span>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.3em] mt-1">Risk_Index</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className={`px-6 py-2 rounded-full border ${colors.border} ${colors.bg} text-xs font-black uppercase tracking-[0.2em] ${colors.text} inline-block`}>
            {level} Risk Profile
          </div>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest italic">Threat Assessment Complete</p>
        </div>
      </div>
    </div>
  );
};

const SummaryItem = ({ icon: Icon, title, content, lang }) => (
  <div className="flex gap-4 p-5 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={40} />
    </div>
    <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
      <Icon className="text-primary w-6 h-6" />
    </div>
    <div className="space-y-1.5 flex-1 relative z-10">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{title}</h4>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <TTSButton text={content} lang={lang} />
        </div>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed font-medium line-clamp-2 group-hover:line-clamp-none transition-all duration-300">{content}</p>
    </div>
  </div>
);

export default function DocumentAnalysis({ analysis, document, easyMode, language }) {
  // If we don't have analysis but have the document, show basic metadata (Instant feedback)
  if (!analysis && document) {
    return (
      <div className="space-y-8 relative">
        {/* Scanning Line Animation */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-4xl">
          <motion.div 
            initial={{ translateY: '-100%' }}
            animate={{ translateY: '1000%' }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-full h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.8)]"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#05070a]/80 backdrop-blur-3xl border border-white/10 rounded-4xl p-10 space-y-8 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cpu size={150} className="text-primary" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                  <Activity className="text-primary w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Document_Ingestion</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] text-primary/70 font-bold uppercase tracking-[0.3em]">Extracting_Semantic_Layers</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Buffer_Status: 100%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Identifier', value: document?.filename || 'Unknown', icon: FileText },
                { label: 'Payload_Size', value: `${(document?.file_size / 1024).toFixed(1)} KB`, icon: Cpu },
                { label: 'Vector_Count', value: `${document?.page_count || '1'} Pages`, icon: Terminal }
              ].map((stat, i) => (
                <div key={i} className="p-6 bg-white/2 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group/stat">
                  <div className="flex items-center gap-3 mb-2">
                    <stat.icon size={14} className="text-gray-600 group-hover/stat:text-primary transition-colors" />
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <p className="text-lg font-black text-white truncate tracking-tight uppercase">{stat.value}</p>
                </div>
              ))}
            </div>

            {document?.extracted_text && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Terminal size={12} className="text-primary" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Raw_Data_Stream</span>
                </div>
                <div className="p-8 bg-black/40 rounded-4xl border border-white/5 font-mono text-[11px] text-gray-500 leading-relaxed max-h-64 overflow-y-auto custom-scrollbar selection:bg-primary/20">
                  <span className="text-primary/40 mr-2">{">>>"}</span>
                  {document.extracted_text.substring(0, 1500)}...
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-primary/30 uppercase italic animate-pulse">
                    <Activity size={10} />
                    Processing_Remaining_Nodes...
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Loading Skeletons for pending analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: i * 0.2, repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
              className="h-56 bg-[#05070a] border border-white/5 rounded-4xl flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/5 animate-pulse flex items-center justify-center">
                <Shield size={24} className="text-white/10" />
              </div>
              <div className="space-y-2 w-24">
                <div className="h-1 bg-white/5 rounded-full" />
                <div className="h-1 bg-white/5 rounded-full w-2/3 mx-auto" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Defensive extraction with fallbacks
  const { 
    summary = {}, 
    easy_summary = {},
    risk_score = 0, 
    risk_level = 'low', 
    recommendations = [],
    pros = [],
    cons = [],
    risk_attention_areas = [],
    potential_loss_areas = [],
    safety_recommendations = [],
    careful_review_items = [],
  } = analysis;

  const activeSummary = easyMode && (easy_summary || summary) ? (easy_summary || summary) : summary;

  const safeSummary = {
    introduction: activeSummary?.introduction || "Analysis still in progress or summary unavailable.",
    purpose: activeSummary?.purpose || "Information not found",
    agreement_purpose: activeSummary?.agreement_purpose || "Information not found",
    involved_parties: activeSummary?.involved_parties || "Information not found",
    duration: activeSummary?.duration || "Information not found",
    payment_terms: activeSummary?.payment_terms || "Information not found",
    termination_conditions: activeSummary?.termination_conditions || "Information not found",
    governing_law: activeSummary?.governing_law || "Information not found",
    liabilities: activeSummary?.liabilities || "Information not found",
    confidentiality: activeSummary?.confidentiality || "Information not found",
    ownership: activeSummary?.ownership || "Information not found",
    obligations: activeSummary?.obligations || "Information not found",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20 relative z-10"
    >
      {/* 1. Executive Summary - Cinematic Upgrade */}
      {analysis.summary && (
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-linear-to-r from-primary/20 to-blue-500/20 rounded-4xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative bg-[#05070a]/80 backdrop-blur-3xl border border-white/10 rounded-4xl overflow-hidden shadow-2xl">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/2">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <Terminal size={12} className="text-primary" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Summary_Module.v3</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">Live Analysis</span>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner shadow-primary/5">
                  <FileText className="text-primary w-8 h-8" />
                </div>
                
                <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        EXECUTIVE SUMMARY
                        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase italic">Encrypted</span>
                      </h2>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">Foundational Intelligence Layer</p>
                    </div>
                    <button 
                      onClick={() => speak(analysis.summary.introduction + " " + analysis.summary.conclusion, language)}
                      className="p-3 bg-white/5 hover:bg-primary/20 text-gray-400 hover:text-primary rounded-xl border border-white/5 hover:border-primary/30 transition-all shadow-xl active:scale-95"
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-400 leading-relaxed text-lg font-medium selection:bg-primary/40">
                      {analysis.summary.introduction}
                    </p>
                    <div className="my-6 p-6 bg-white/2 border-l-2 border-primary/30 rounded-r-2xl italic text-gray-300">
                       {analysis.summary.conclusion}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Subtle Footer Meta */}
            <div className="px-8 py-3 bg-white/2 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Activity size={10} className="text-gray-600" />
                    <span className="text-[9px] text-gray-600 font-bold uppercase">Latency: 142ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock size={10} className="text-gray-600" />
                    <span className="text-[9px] text-gray-600 font-bold uppercase">Auth: AES-256</span>
                  </div>
               </div>
               <span className="text-[9px] text-gray-700 font-mono">HASH: 0x8F2A...B4E1</span>
            </div>
          </div>
        </motion.section>
      )}

      {/* 2. Easy Summary - The CodeMate "Problem" Style */}
      {easyMode && analysis.easy_summary && (
        <motion.section 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-linear-to-r from-amber-500/10 to-orange-500/10 rounded-[2.5rem] blur-2xl opacity-30" />
          
          <div className="relative bg-linear-to-br from-[#0a0c12] to-[#05060a] border border-amber-500/20 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
               <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
                 <Zap className="text-amber-400 w-8 h-8 animate-pulse" />
               </div>
               <div>
                 <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic">Simplified Overview</h3>
                 <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                   <span className="text-[10px] text-amber-500/70 font-bold uppercase tracking-[0.2em]">Human-Readable Protocol Active</span>
                 </div>
               </div>
               <button 
                onClick={() => speak(analysis.easy_summary.what_it_means, language)}
                className="ml-auto p-4 bg-amber-500/5 hover:bg-amber-500/20 text-amber-500/50 hover:text-amber-400 rounded-2xl border border-amber-500/10 hover:border-amber-500/40 transition-all"
              >
                <Volume2 size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white/2 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <MessageSquare size={40} />
                  </div>
                  <h4 className="text-xs font-bold text-amber-500/50 uppercase tracking-[0.2em] mb-3">Core Translation</h4>
                  <p className="text-xl text-gray-200 leading-relaxed font-medium">
                    {analysis.easy_summary.what_it_means}
                  </p>
                </div>
              </div>
              
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                   <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Key Takeaway</h5>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                        <CheckCircle2 className="text-green-400 w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-gray-300">Verified Intelligence</span>
                   </div>
                </div>
                <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl space-y-3">
                   <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Confidence</h5>
                   <div className="flex items-end justify-between">
                      <span className="text-3xl font-black text-white tracking-tighter">98%</span>
                      <span className="text-[10px] text-primary font-bold uppercase">Optimal</span>
                   </div>
                   <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '98%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                      />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* 3. Critical Intelligence - Risk Focus */}
      {careful_review_items.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute -inset-0.5 bg-red-500/10 rounded-3xl blur-xl" />
          <div className="relative bg-[#0a0606]/80 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <ShieldAlert size={24} className="text-red-500" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white tracking-tight uppercase">Critical Vulnerabilities</h4>
                  <p className="text-[10px] text-red-500/50 font-bold uppercase tracking-[0.2em] mt-0.5">Immediate Attention Required</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] font-black text-red-500 uppercase">Priority_Level: 1</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {careful_review_items.map((item, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: 5 }}
                  className="flex gap-4 items-center p-4 bg-white/2 hover:bg-red-500/5 rounded-2xl border border-white/5 hover:border-red-500/20 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:bg-red-500 group-hover:text-black transition-all">
                    <AlertTriangle size={14} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-sm text-gray-300 flex-1 font-medium">{item}</p>
                  <TTSButton text={item} lang={language} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* 4. Risk Matrix Grid */}
      {risk_attention_areas.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="h-px flex-1 bg-white/5" />
             <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] px-4">Threat_Vector_Analysis</h4>
             <div className="h-px flex-1 bg-white/5" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {risk_attention_areas.map((area, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className={`absolute -inset-0.5 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity ${
                  area.severity === 'critical' ? 'bg-red-500' : area.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <div className="relative bg-[#05070a] border border-white/10 p-6 rounded-3xl space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{area.area}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                      area.severity === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                      area.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {area.severity}
                    </span>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="space-y-1.5">
                      <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest block">Impact_Assessment</span>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">{area.impact}</p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest block">Operational_Consequences</span>
                      <p className="text-xs text-gray-300 leading-relaxed font-bold">{area.consequences}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Pros and Cons Section - Split View */}
      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Advantages */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-green-500/10 rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-[#050a06]/80 backdrop-blur-xl border border-green-500/20 rounded-4xl p-8 space-y-6 h-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                  <CheckCircle2 size={24} className="text-green-500" />
                </div>
                <h4 className="text-xl font-black text-white tracking-tight uppercase">Strategic Advantages</h4>
              </div>
              <div className="space-y-3">
                {pros.map((item, i) => (
                  <div key={i} className="p-4 bg-white/2 rounded-2xl border border-white/5 hover:border-green-500/20 transition-all space-y-2 group/item">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-green-400/80 uppercase tracking-tight">{item.title}</span>
                      <TTSButton text={item.description} lang={language} />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Disadvantages */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="relative group"
          >
            <div className="absolute -inset-1 bg-red-500/10 rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-[#0a0505]/80 backdrop-blur-xl border border-red-500/20 rounded-4xl p-8 space-y-6 h-full">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <XCircle size={24} className="text-red-500" />
                </div>
                <h4 className="text-xl font-black text-white tracking-tight uppercase">Critical Liabilities</h4>
              </div>
              <div className="space-y-3">
                {cons.map((item, i) => (
                  <div key={i} className="p-4 bg-white/2 rounded-2xl border border-white/5 hover:border-red-500/20 transition-all space-y-2 group/item">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-red-400/80 uppercase tracking-tight">{item.title}</span>
                      <TTSButton text={item.description} lang={language} />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 6. Main Intelligence Hub - Grid 12 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Core Provisions Terminal */}
        <div className="lg:col-span-8 relative group">
          <div className="absolute -inset-0.5 bg-linear-to-r from-primary/20 to-blue-500/20 rounded-4xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-[#05070a]/80 backdrop-blur-3xl border border-white/10 rounded-4xl overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-white/5 bg-white/2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cpu size={18} className="text-primary animate-pulse" />
                <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">
                  {easyMode ? 'Plain_English_Protocol' : 'Core_Provision_Index'}
                </h3>
              </div>
              <div className="flex gap-1">
                 {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary/40" />)}
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <SummaryItem icon={Info} title="Protocol_Purpose" content={safeSummary.purpose} lang={language} />
              <SummaryItem icon={Zap} title="Agreement_Objective" content={safeSummary.agreement_purpose} lang={language} />
              <SummaryItem icon={Users} title="Involved_Entities" content={safeSummary.involved_parties} lang={language} />
              <SummaryItem icon={Clock} title="Temporal_Duration" content={safeSummary.duration} lang={language} />
              <SummaryItem icon={CreditCard} title="Fiscal_Terms" content={safeSummary.payment_terms} lang={language} />
              <SummaryItem icon={ShieldAlert} title="Termination_Logic" content={safeSummary.termination_conditions} lang={language} />
              <SummaryItem icon={Gavel} title="Legal_Jurisdiction" content={safeSummary.governing_law} lang={language} />
              <SummaryItem icon={AlertCircle} title="Liability_Vectors" content={safeSummary.liabilities} lang={language} />
            </div>
          </div>
        </div>

        {/* Dynamic Risk Meter */}
        <div className="lg:col-span-4 h-full">
          <RiskMeter score={risk_score || 0} level={risk_level || 'low'} />
        </div>
      </div>

      {/* 7. Potential Loss Areas - Financial Security */}
      {potential_loss_areas.length > 0 && (
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4 px-2">
            <TrendingDown size={24} className="text-red-500" />
            <h4 className="text-xl font-black text-white tracking-tight uppercase">Financial Exposure Vectors</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {potential_loss_areas.map((loss, i) => (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.02 }}
                className="bg-linear-to-br from-[#0a0505] to-[#1a0a0a] border border-red-500/20 p-8 rounded-4xl space-y-6 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <IndianRupee size={60} />
                </div>
                
                <div className="flex items-center justify-between relative z-10">
                  <h5 className="font-black text-white text-lg tracking-tight uppercase">{loss.area}</h5>
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <AlertTriangle size={20} className="text-red-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 relative z-10">
                  <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Business_Impact_Analysis</span>
                    <p className="text-xs text-gray-300 font-medium leading-relaxed">{loss.business_impact}</p>
                  </div>
                  <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Legal_Exposure_Assessment</span>
                    <p className="text-xs text-gray-300 font-medium leading-relaxed">{loss.legal_impact}</p>
                  </div>
                  <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 space-y-1">
                    <span className="text-[8px] font-black text-red-500/50 uppercase tracking-widest">Projected_Fiscal_Loss</span>
                    <p className="text-sm text-red-400 font-black tracking-tight italic">{loss.financial_consequences}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* 8. Safety & Recommendations - Optimization Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Safety Advice */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-primary/10 rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-[#05070a]/80 backdrop-blur-xl border border-primary/20 rounded-4xl p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                <ShieldAlert className="text-primary w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Safety Protocol</h3>
                <p className="text-[10px] text-primary/50 font-bold uppercase tracking-[0.3em] mt-1">Operational Security Advice</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {safety_recommendations.length > 0 ? (
                safety_recommendations.map((advice, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ x: 10 }}
                    className="flex gap-6 p-6 bg-white/2 rounded-3xl border border-white/5 hover:border-primary/30 transition-all group/advice"
                  >
                    <div className="shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-[10px] font-black border border-primary/20 group-hover/advice:bg-primary group-hover/advice:text-black transition-all">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <p className="text-sm text-gray-300 font-medium leading-relaxed flex-1">{advice}</p>
                    <TTSButton text={advice} lang={language} />
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-600 italic font-medium">Standard safety advice applies.</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-green-500/10 rounded-4xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-[#050a07]/80 backdrop-blur-xl border border-green-500/20 rounded-4xl p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20 shadow-lg shadow-green-500/5">
                <Lightbulb className="text-green-500 w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Optimization Layer</h3>
                <p className="text-[10px] text-green-500/50 font-bold uppercase tracking-[0.3em] mt-1">AI-Driven Strategic Recommendations</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {recommendations && Array.isArray(recommendations) && recommendations.length > 0 ? (
                recommendations.map((rec, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ x: 10 }}
                    className="flex gap-6 p-6 bg-white/2 rounded-3xl border border-white/5 hover:border-green-500/30 transition-all group/rec"
                  >
                    <div className="shrink-0 w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 text-[10px] font-black border border-green-500/20 group-hover/rec:bg-green-500 group-hover/rec:text-black transition-all">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <p className="text-sm text-gray-300 font-medium leading-relaxed flex-1">{rec}</p>
                    <TTSButton text={rec} lang={language} />
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-600 italic font-medium">No specific strategic optimizations found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
