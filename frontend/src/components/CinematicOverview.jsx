import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';
import { AlertTriangle, ShieldAlert, FileWarning, HelpCircle, Zap, ShieldCheck, Search, Cpu, CheckCircle, Shield } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

const FloatingLegalCard = ({ children, className, delay = 0, duration = 6 }) => (
  <motion.div
    initial={{ y: 0, opacity: 0, scale: 0.9 }}
    animate={{ 
      y: [-15, 15, -15], 
      rotate: [-1, 1, -1],
      opacity: 1,
      scale: 1
    }}
    exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
    transition={{ 
      y: { duration, repeat: Infinity, ease: "easeInOut", delay },
      rotate: { duration: duration * 1.2, repeat: Infinity, ease: "easeInOut", delay },
      opacity: { duration: 0.5 },
      scale: { duration: 0.5 }
    }}
    className={`absolute z-20 p-4 bg-[#0a0c12]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${className}`}
  >
    <AnimatePresence mode="wait">
      {children}
    </AnimatePresence>
  </motion.div>
);

const FlipCard = ({ item }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative h-64 w-full perspective-1000 group"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        className="relative h-full w-full preserve-3d"
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <div className="h-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl space-y-6 flex flex-col justify-center items-center text-center transition-all group-hover:bg-white/10">
            <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform duration-500`}>
              <item.icon size={28} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">{item.title}</h3>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{item.desc}</div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden bg-primary/10 border border-primary/30 rounded-[2.5rem] backdrop-blur-xl p-8 flex flex-col justify-center items-center text-center"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="space-y-4">
            <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center ${item.color} mx-auto mb-4`}>
              <Zap size={24} />
            </div>
            <h4 className="text-xl font-bold text-white">How it works</h4>
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
              {item.fullDesc}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ComparisonCard = ({ type, title, content, status, color, icon: Icon }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative w-full md:w-[450px] p-6 bg-[#0a0c12]/80 backdrop-blur-2xl border ${color === 'red' ? 'border-red-500/30' : 'border-green-500/30'} rounded-3xl overflow-hidden group`}
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon size={80} />
    </div>
    
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${color === 'red' ? 'text-red-500' : 'text-green-500'}`}>
          {type}
        </span>
      </div>
      <span className="text-[10px] text-gray-600 font-mono tracking-widest">{status}</span>
    </div>

    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="text-gray-500 font-mono text-xs">01</div>
        <div className={`h-px flex-1 ${color === 'red' ? 'bg-red-500/10' : 'bg-green-500/10'}`} />
      </div>
      <div className={`p-4 rounded-xl ${color === 'red' ? 'bg-red-500/5' : 'bg-green-500/5'} font-mono text-sm leading-relaxed`}>
        {content}
      </div>
      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-2">
          <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${color === 'red' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            {title}
          </div>
        </div>
        {color === 'green' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[8px] font-bold uppercase tracking-widest border border-green-500/20">
            <CheckCircle size={8} />
            Verified
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

const DebuggingLabSection = ({ comparisonData }) => (
  <section className="relative min-h-screen bg-[#020305] overflow-hidden flex flex-col items-center justify-center px-6 py-24 border-t border-white/5">
    {/* Cinematic Grid Background */}
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[#020305]" />
      <div className="absolute inset-0 opacity-20" style={{ 
        backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
        backgroundSize: '60px 60px' 
      }} />
    </div>

    <motion.div 
      initial={{ opacity: 0, filter: 'blur(20px)' }}
      whileInView={{ opacity: 1, filter: 'blur(0px)' }}
      className="relative w-full h-full flex flex-col items-center justify-center gap-12"
    >
      {/* Header Tags */}
      <div className="absolute top-0 left-0 flex items-center gap-4 z-30">
        <span className="text-[10px] font-mono text-primary tracking-[0.3em] uppercase">04 / AI DEBUGGING LAB</span>
      </div>
      <div className="absolute top-0 right-0 flex items-center gap-2 z-30">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-mono text-green-500 tracking-[0.3em] uppercase font-bold">SYSTEM: STABLE</span>
      </div>

      <div className="text-center space-y-4 mb-8">
        <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">Technical Comparison</h2>
        <p className="text-gray-500 text-lg uppercase tracking-widest font-bold">See how AI rewrites the law</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-7xl">
        <ComparisonCard {...comparisonData.broken} />
        
        {/* Neural Portal (Central Orb) */}
        <div className="relative flex flex-col items-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.2)",
                "0 0 40px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(59, 130, 246, 0.2)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center relative z-10 backdrop-blur-xl"
          >
            <div className="text-[10px] font-black text-blue-400 tracking-[0.2em] uppercase">Ready</div>
            {/* Orbiting Particles */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-10px]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_10px_#3b82f6]" />
              <div className="w-1 h-1 rounded-full bg-purple-400 absolute bottom-0 left-1/2 -translate-x-1/2 shadow-[0_0_10px_#a855f7]" />
            </motion.div>
          </motion.div>

          {/* Connection Lines (Data Tracers) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
            <motion.path 
              d="M -200 50 Q -100 0 0 50" 
              fill="none" 
              stroke="url(#grad-left)" 
              strokeWidth="1" 
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -20] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.path 
              d="M 200 50 Q 100 100 0 50" 
              fill="none" 
              stroke="url(#grad-right)" 
              strokeWidth="1" 
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, 20] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </div>

        <ComparisonCard {...comparisonData.fixed} />
      </div>

      {/* AI Resolution Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl p-6 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] backdrop-blur-xl"
      >
        <div className="flex items-center gap-4 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-black">AI</div>
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">Resolution</span>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          Detected unfair termination period in Clause 14.2. Automatically adjusted to industry-standard 30-day notice period. Logic verified for jurisdictional compliance.
        </p>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-mono text-gray-500 uppercase tracking-widest">
            clause-safety-v3
          </div>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-mono text-gray-500 uppercase tracking-widest">
            legal-bert
          </div>
          <div className="ml-auto text-[8px] font-mono text-blue-400 uppercase tracking-widest">
            Confidence: 0.99
          </div>
        </div>
      </motion.div>
    </motion.div>
  </section>
);

const CinematicOverview = () => {
  const [mode, setMode] = useState('problem'); // 'problem' | 'transition' | 'solution'
  const [instantIntelIndex, setInstantIntelIndex] = useState(0);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.5, once: false });

  const instantIntelCards = [
    {
      title: "Instant Intelligence",
      text: "AI scans 50+ pages in seconds. Every clause categorized and explained instantly.",
      badge: "95% Efficiency Gain",
      color: "text-green-500",
      bg: "bg-green-500"
    },
    {
      title: "Semantic Analysis",
      text: "Our models understand context, not just keywords. We detect nuances that human eyes miss.",
      badge: "Context Aware",
      color: "text-blue-500",
      bg: "bg-blue-500"
    },
    {
      title: "Smart Extraction",
      text: "Automatically extract parties, dates, and obligations into a structured summary.",
      badge: "Zero Manual Entry",
      color: "text-purple-500",
      bg: "bg-purple-500"
    }
  ];

  useEffect(() => {
    let interval;
    if (mode === 'solution') {
      interval = setInterval(() => {
        setInstantIntelIndex((prev) => (prev + 1) % instantIntelCards.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    let timeout;
    if (isInView && mode === 'problem') {
      timeout = setTimeout(() => {
        setMode('transition');
        setTimeout(() => setMode('solution'), 1500);
      }, 3000); // 3 seconds as requested
    }
    return () => clearTimeout(timeout);
  }, [isInView, mode]);

  return (
    <section ref={containerRef} className="relative min-h-screen bg-[#020305] overflow-hidden flex flex-col items-center justify-center px-6 py-24">
      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}} />
      {/* Cinematic Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#020305]" />
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
          backgroundSize: '60px 60px' 
        }} />
        <div className="absolute inset-0 bg-radial-at-c from-primary/5 via-transparent to-transparent" />
      </div>

      <AnimatePresence mode="wait">
        {mode === 'problem' && (
          <motion.div 
            key="problem-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'brightness(2) blur(20px)' }}
            className="relative w-full h-full flex flex-col items-center justify-center"
          >
            {/* Header Tags */}
            <div className="absolute top-0 left-0 flex items-center gap-4 z-30">
              <span className="text-[10px] font-mono text-gray-500 tracking-[0.3em] uppercase">02 / THE OLD WAY</span>
            </div>
            <div className="absolute top-0 right-0 flex items-center gap-2 z-30">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-red-500/80 tracking-[0.3em] uppercase font-bold">SYSTEM: UNSTABLE</span>
            </div>

            {/* Floating Problem Cards */}
            <FloatingLegalCard className="top-[10%] left-[5%] w-72" delay={0}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Manual Review</span>
                </div>
                <p className="text-xs text-red-400 font-medium italic leading-relaxed">"Hours of reading small print. Lawyers charging $500/hr to find one clause."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <AlertTriangle size={10} className="text-red-500" />
                  <span className="text-[8px] text-red-500/70 font-bold uppercase">Expensive & Slow</span>
                </div>
              </div>
            </FloatingLegalCard>

            <FloatingLegalCard className="bottom-[15%] left-[10%] w-80" delay={1} duration={8}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Language Barrier</span>
                </div>
                <p className="text-xs text-yellow-400 font-medium italic leading-relaxed">"English legalese is a barrier for millions. One misunderstood word leads to years of debt."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <FileWarning size={10} className="text-yellow-500" />
                  <span className="text-[8px] text-yellow-500/70 font-bold uppercase">Complexity Risk</span>
                </div>
              </div>
            </FloatingLegalCard>

            <FloatingLegalCard className="top-[15%] right-[8%] w-72" delay={0.5} duration={7}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Hidden Traps</span>
                </div>
                <p className="text-xs text-purple-400 font-medium italic leading-relaxed">"Small text at the bottom. Automatic renewals and 24h termination clauses hidden in plain sight."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <ShieldAlert size={10} className="text-purple-500" />
                  <span className="text-[8px] text-purple-500/70 font-bold uppercase">Predatory Terms</span>
                </div>
              </div>
            </FloatingLegalCard>

            {/* Center Content */}
            <div className="relative z-10 text-center space-y-8 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="space-y-4"
              >
                <h2 className="text-6xl md:text-9xl font-bold tracking-tighter text-white leading-none">
                  Legal docs <br />
                  <span className="text-white/10 italic font-serif">shouldn't</span> <br />
                  feel like this.
                </h2>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="flex flex-wrap justify-center gap-12 pt-16"
              >
                {['Confused.', 'Overwhelmed.', 'Stuck.', 'Misled.'].map((text, i) => (
                  <motion.span 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.1 }}
                    className="text-xl md:text-2xl font-medium text-gray-600 tracking-tight"
                  >
                    {text}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}

        {mode === 'transition' && (
          <motion.div 
            key="transition-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-50 flex flex-col items-center justify-center gap-6"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent flex items-center justify-center"
            >
              <Cpu className="text-primary w-10 h-10 animate-pulse" />
            </motion.div>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-white tracking-[0.5em] uppercase"
            >
              AI Restoration...
            </motion.h3>
            <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5 }}
                className="h-full bg-primary"
              />
            </div>
          </motion.div>
        )}

        {mode === 'solution' && (
          <motion.div 
            key="solution-view"
            initial={{ opacity: 0, filter: 'blur(20px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            className="relative w-full h-full flex flex-col items-center justify-center"
          >
            {/* Header Tags */}
            <div className="absolute top-0 left-0 flex items-center gap-4 z-30">
              <span className="text-[10px] font-mono text-primary tracking-[0.3em] uppercase">03 / THE LEGAL.AI WAY</span>
            </div>
            <div className="absolute top-0 right-0 flex items-center gap-2 z-30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono text-green-500 tracking-[0.3em] uppercase font-bold">SYSTEM: STABLE</span>
            </div>

            {/* Floating Solution Cards */}
            <FloatingLegalCard className="top-[10%] left-[5%] w-80 border-green-500/30" delay={0}>
              <motion.div 
                key={instantIntelIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className={`w-2 h-2 rounded-full ${instantIntelCards[instantIntelIndex].bg}`} />
                  <span className={`text-[9px] font-bold ${instantIntelCards[instantIntelIndex].color} uppercase tracking-widest`}>
                    {instantIntelCards[instantIntelIndex].title}
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-medium italic leading-relaxed">
                  "{instantIntelCards[instantIntelIndex].text}"
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <CheckCircle size={10} className={instantIntelCards[instantIntelIndex].color} />
                  <span className={`text-[8px] ${instantIntelCards[instantIntelIndex].color}/70 font-bold uppercase`}>
                    {instantIntelCards[instantIntelIndex].badge}
                  </span>
                </div>
              </motion.div>
            </FloatingLegalCard>

            <FloatingLegalCard className="bottom-[10%] left-[10%] w-80 border-blue-500/30" delay={1} duration={8}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Regional Clarity</span>
                </div>
                <p className="text-xs text-gray-300 font-medium italic leading-relaxed">"Translate complex terms into 15+ regional languages with 98% context preservation."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Shield size={10} className="text-blue-500" />
                  <span className="text-[8px] text-blue-500/70 font-bold uppercase">Universal Access</span>
                </div>
              </div>
            </FloatingLegalCard>

            <FloatingLegalCard className="top-[15%] right-[8%] w-80 border-purple-500/30" delay={0.5} duration={7}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest">Risk Shield</span>
                </div>
                <p className="text-xs text-gray-300 font-medium italic leading-relaxed">"Proactive detection of 40+ risk types. We find the traps so you don't have to."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Search size={10} className="text-purple-500" />
                  <span className="text-[8px] text-purple-500/70 font-bold uppercase">Zero Hidden Traps</span>
                </div>
              </div>
            </FloatingLegalCard>

            {/* Center Content */}
            <div className="relative z-10 text-center space-y-8 max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.3em]">
                  <Zap size={12} className="fill-current" />
                  AI Intelligence Active
                </div>
                <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-white leading-tight">
                  The Intelligent <br />
                  Way to Sign.
                </h2>
                <p className="text-gray-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                  Our AI doesn't just read documents. It understands them, translates them, and protects you from every hidden risk.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 w-full">
                {[
                  { 
                    title: "Neural Analysis", 
                    icon: Cpu, 
                    desc: "Clause classification",
                    fullDesc: "Our proprietary Neural Engine uses transformer models to categorize clauses with 99% accuracy across 40+ standard legal labels.",
                    color: "text-blue-400",
                    bg: "bg-blue-400/10"
                  },
                  { 
                    title: "Risk Shield", 
                    icon: ShieldCheck, 
                    desc: "Automated protection",
                    fullDesc: "Proactively scans for predatory terms, non-standard penalties, and unfair termination clauses using industry benchmark data.",
                    color: "text-green-400",
                    bg: "bg-green-400/10"
                  },
                  { 
                    title: "Universal Clarity", 
                    icon: Search, 
                    desc: "Regional languages",
                    fullDesc: "High-fidelity translation into 15+ regional languages, preserving legal context and nuances for non-English speakers.",
                    color: "text-primary",
                    bg: "bg-primary/10"
                  }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    <FlipCard item={item} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Scan Line */}
      <motion.div 
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[1px] bg-primary/30 z-10 blur-[1px] pointer-events-none"
      />

      {/* Manual Switch Button (Optional for UX) */}
      <button 
        onClick={() => setMode(mode === 'solution' ? 'problem' : 'problem')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-white transition-colors z-50 flex items-center gap-2"
      >
        {mode === 'solution' ? 'Re-scan Problems' : 'Wait for Intelligence...'}
      </button>
    </section>
  );
};

export default function CinematicOverviewWrapper() {
  const comparisonData = {
    broken: {
      type: "Broken",
      title: "Termination Trap",
      content: "for (auto& clause : lease) {\n  if (landlord_request) terminate_now();\n}",
      status: "runtime: SIGSEGV at tenant_rights",
      color: "red",
      icon: AlertTriangle
    },
    fixed: {
      type: "Fixed",
      title: "Secure Agreement",
      content: "if (landlord_request) {\n  await wait_period(30_days);\n  ensure_deposit_return();\n}",
      status: "runtime: 30/30 days · bounds OK",
      color: "green",
      icon: ShieldCheck
    }
  };

  return (
    <div className="bg-[#020305]">
      <CinematicOverview />
      <DebuggingLabSection comparisonData={comparisonData} />
    </div>
  );
}