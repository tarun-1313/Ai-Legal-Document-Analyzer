import { 
  FileText, 
  AlertCircle, 
  AlertTriangle,
  TrendingDown,
  Info, 
  ShieldAlert, 
  Lightbulb, 
  Clock, 
  Users, 
  CreditCard, 
  Gavel, 
  Zap,
  Volume2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  IndianRupee,
  Scale
} from 'lucide-react';

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
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  const colors = getColors(level);
  
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl h-full">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64" cy="64" r="58"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-white/5"
          />
          <circle
            cx="64" cy="64" r="58"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={364}
            strokeDashoffset={364 - (364 * score) / 100}
            className={`${level === 'critical' ? 'text-red-500' : level === 'high' ? 'text-orange-500' : 'text-primary'} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Score</span>
        </div>
      </div>
      <div className={`mt-4 px-4 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${colors}`}>
        {level} Risk
      </div>
    </div>
  );
};

const SummaryItem = ({ icon: Icon, title, content, lang }) => (
  <div className="flex gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
    <div className="shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
      <Icon className="text-primary w-5 h-5" />
    </div>
    <div className="space-y-1 flex-1">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h4>
        <TTSButton text={content} lang={lang} />
      </div>
      <p className="text-sm text-gray-200 leading-relaxed">{content}</p>
    </div>
  </div>
);

export default function DocumentAnalysis({ analysis, document, isProcessing, easyMode, language }) {
  // If we don't have analysis but have the document, show basic metadata (Instant feedback)
  if (!analysis && document) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Clock className="w-48 h-48 text-primary" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Info className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Document Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">File Name</span>
                <p className="text-sm font-semibold text-white truncate">{document?.filename || 'Unknown'}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">File Size</span>
                <p className="text-sm font-semibold text-white">
                  {document?.file_size ? (document.file_size / 1024).toFixed(1) : '0'} KB
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Page Count</span>
                <p className="text-sm font-semibold text-white">{document?.page_count || 'Counting...'}</p>
              </div>
            </div>

            {document?.extracted_text && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Extracted Text Preview</span>
                <div className="p-6 bg-black/20 rounded-2xl border border-white/5 font-mono text-xs text-gray-400 leading-relaxed max-h-48 overflow-y-auto">
                  {document.extracted_text.substring(0, 1000)}...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading Skeletons for pending analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white/5 border border-white/10 rounded-3xl animate-pulse flex items-center justify-center">
              <ShieldAlert className="text-white/10 w-8 h-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Defensive extraction with fallbacks
  const { 
    summary = {}, 
    easy_summary = {},
    key_points = [], 
    risk_analysis = [], 
    risk_score = 0, 
    risk_level = 'low', 
    recommendations = [],
    pros = [],
    cons = [],
    hidden_risks = [],
    financial_concerns = [],
    risk_scorecard = {
      financial_score: 0,
      legal_score: 0,
      compliance_score: 0,
      ownership_score: 0,
      overall_score: 0
    },
    risk_attention_areas = [],
    potential_loss_areas = [],
    safety_recommendations = [],
    careful_review_items = [],
    llm_provider = '',
    llm_model = '',
    llm_fallback_used = false
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
    <div className="space-y-8 animate-fade-in">
      {/* Risk Scorecard Section - New Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Overall Safety</span>
          <span className="text-2xl font-bold text-primary">{risk_scorecard.overall_score}%</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Financial</span>
          <span className="text-2xl font-bold text-blue-400">{risk_scorecard.financial_score}%</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Legal</span>
          <span className="text-2xl font-bold text-purple-400">{risk_scorecard.legal_score}%</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Compliance</span>
          <span className="text-2xl font-bold text-orange-400">{risk_scorecard.compliance_score}%</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ownership</span>
          <span className="text-2xl font-bold text-green-400">{risk_scorecard.ownership_score}%</span>
        </div>
      </div>

      {/* Introduction Section */}
      <div className={`bg-linear-to-br border rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-500 ${
        easyMode ? 'from-amber-500/10 border-amber-500/20' : 'from-primary/10 border-white/10'
      }`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <FileText className={`w-32 h-32 ${easyMode ? 'text-amber-500' : 'text-primary'}`} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${easyMode ? 'bg-amber-500/20' : 'bg-primary/20'}`}>
              <Zap className={`${easyMode ? 'text-amber-500' : 'text-primary'} w-6 h-6`} />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {easyMode ? 'Simplified Overview' : 'Document Introduction'}
            </h3>
            <TTSButton text={safeSummary.introduction} lang={language} />
          </div>
          <p className="text-lg text-gray-300 leading-relaxed max-w-4xl">
            {safeSummary.introduction}
          </p>
        </div>
      </div>

      {/* What Should You Carefully Review? - New Intelligence */}
      {careful_review_items.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 space-y-4">
          <h4 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <ShieldAlert size={20} />
            What Should You Carefully Review?
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {careful_review_items.map((item, i) => (
              <div key={i} className="flex gap-3 items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs text-gray-300 flex-1">{item}</p>
                <TTSButton text={item} lang={language} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Attention Areas Grid */}
      {risk_attention_areas.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle size={20} className="text-primary" />
            Risk Attention Areas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {risk_attention_areas.map((area, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-widest">{area.area}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    area.severity === 'critical' ? 'bg-red-500' : area.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500 text-black'
                  }`}>
                    {area.severity}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 leading-relaxed"><span className="text-gray-500 font-bold uppercase text-[9px] block">Impact:</span> {area.impact}</p>
                  <p className="text-xs text-gray-400 leading-relaxed"><span className="text-gray-500 font-bold uppercase text-[9px] block">Consequences:</span> {area.consequences}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pros and Cons Section */}
      {(pros.length > 0 || cons.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-500/5 border border-green-500/20 rounded-3xl p-6 space-y-4">
            <h4 className="text-lg font-bold text-green-400 flex items-center gap-2">
              <CheckCircle2 size={20} />
              Advantages (Pros)
            </h4>
            <div className="space-y-3">
              {pros.map((item, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{item.title}</span>
                    <TTSButton text={item.description} lang={language} />
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 space-y-4">
            <h4 className="text-lg font-bold text-red-400 flex items-center gap-2">
              <XCircle size={20} />
              Disadvantages (Cons)
            </h4>
            <div className="space-y-3">
              {cons.map((item, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{item.title}</span>
                    <TTSButton text={item.description} lang={language} />
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary and Risk Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Executive Summary Card */}
        <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <FileText className="text-primary w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {easyMode ? 'Plain English Summary' : 'Executive Summary'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <SummaryItem icon={Info} title="Purpose" content={safeSummary.purpose} lang={language} />
            <SummaryItem icon={Zap} title="Agreement Objective" content={safeSummary.agreement_purpose} lang={language} />
            <SummaryItem icon={Users} title="Involved Parties" content={safeSummary.involved_parties} lang={language} />
            <SummaryItem icon={Clock} title="Duration" content={safeSummary.duration} lang={language} />
            <SummaryItem icon={CreditCard} title="Payment Terms" content={safeSummary.payment_terms} lang={language} />
            <SummaryItem icon={ShieldAlert} title="Termination" content={safeSummary.termination_conditions} lang={language} />
            <SummaryItem icon={Gavel} title="Governing Law" content={safeSummary.governing_law} lang={language} />
            <SummaryItem icon={AlertCircle} title="Liabilities" content={safeSummary.liabilities} lang={language} />
            <SummaryItem icon={ShieldAlert} title="Confidentiality" content={safeSummary.confidentiality} lang={language} />
            <SummaryItem icon={Zap} title="Ownership" content={safeSummary.ownership} lang={language} />
            <SummaryItem icon={FileText} title="Obligations" content={safeSummary.obligations} lang={language} />
          </div>
        </div>

        {/* Risk Score Meter */}
        <div className="lg:col-span-4">
          <RiskMeter score={risk_score || 0} level={risk_level || 'low'} />
        </div>
      </div>

      {/* Potential Loss Areas Section */}
      {potential_loss_areas.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingDown size={20} className="text-red-500" />
            Potential Loss Areas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {potential_loss_areas.map((loss, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-sm">{loss.area}</h5>
                  <AlertTriangle size={16} className="text-red-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Business Impact</span>
                    <p className="text-[10px] text-gray-400">{loss.business_impact}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Legal Impact</span>
                    <p className="text-[10px] text-gray-400">{loss.legal_impact}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Financial Loss</span>
                    <p className="text-[10px] text-red-400/80">{loss.financial_consequences}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Recommendations & Key Points */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Safety Recommendations - New Intelligence */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <ShieldAlert className="text-primary w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">User Safety Advice</h3>
          </div>
          <div className="space-y-4">
            {safety_recommendations.length > 0 ? (
              safety_recommendations.map((advice, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 hover:bg-primary/10 transition-all group">
                  <div className="shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-300 group-hover:text-white transition-colors leading-relaxed flex-1">{advice}</p>
                  <TTSButton text={advice} lang={language} />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-sm italic">Standard safety advice applies.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Lightbulb className="text-green-500 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">AI Recommendations</h3>
          </div>
          <div className="space-y-4">
            {recommendations && Array.isArray(recommendations) && recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-green-500/5 rounded-2xl border border-green-500/10 hover:bg-green-500/10 transition-all group">
                  <div className="shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-300 group-hover:text-white transition-colors leading-relaxed flex-1">{rec || 'N/A'}</p>
                  <TTSButton text={rec} lang={language} />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Lightbulb className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No specific recommendations available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
