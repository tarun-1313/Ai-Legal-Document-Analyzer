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
    {children}
  </motion.div>
);

const CinematicOverview = () => {
  const [mode, setMode] = useState('problem'); // 'problem' | 'transition' | 'solution'
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.5, once: false });

  useEffect(() => {
    let timeout;
    if (isInView && mode === 'problem') {
      timeout = setTimeout(() => {
        setMode('transition');
        setTimeout(() => setMode('solution'), 1500);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [isInView, mode]);

  return (
    <section ref={containerRef} className="relative min-h-screen bg-[#020305] overflow-hidden flex flex-col items-center justify-center px-6 py-24">
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
              <span className="text-[10px] font-mono text-gray-500 tracking-[0.3em] uppercase">02 / THE PROBLEM</span>
            </div>
            <div className="absolute top-0 right-0 flex items-center gap-2 z-30">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-red-500/80 tracking-[0.3em] uppercase font-bold">SYSTEM: UNSTABLE</span>
            </div>

            {/* Floating Problem Cards */}
            <FloatingLegalCard className="top-[10%] left-[5%] w-64" delay={0}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Termination Clause</span>
                </div>
                <p className="text-xs text-red-400 font-medium italic">"Landlord may terminate for any reason with 24-hour notice..."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <AlertTriangle size={10} className="text-red-500" />
                  <span className="text-[8px] text-red-500/70 font-bold uppercase">Critical Risk</span>
                </div>
              </div>
            </FloatingLegalCard>

            <FloatingLegalCard className="bottom-[10%] left-[10%] w-72" delay={1.5} duration={8}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Liability Section</span>
                </div>
                <p className="text-xs text-yellow-400 font-medium italic">"Party B assumes all uncapped liability for indirect damages..."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <FileWarning size={10} className="text-yellow-500" />
                  <span className="text-[8px] text-yellow-500/70 font-bold uppercase">Hidden Penalty</span>
                </div>
              </div>
            </FloatingLegalCard>

            <FloatingLegalCard className="top-[15%] right-[8%] w-64" delay={0.8} duration={7}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Governing Law</span>
                </div>
                <p className="text-xs text-blue-400 font-medium italic">"This agreement is governed by the laws of the Cayman Islands..."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <HelpCircle size={10} className="text-blue-500" />
                  <span className="text-[8px] text-blue-500/70 font-bold uppercase">Vague Jurisdiction</span>
                </div>
              </div>
            </FloatingLegalCard>

            <FloatingLegalCard className="bottom-[20%] right-[15%] w-56" delay={2.2} duration={9}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Automatic Renewal</span>
                </div>
                <p className="text-xs text-purple-400 font-medium italic">"Contract renews for 5 years unless notified 6 months prior..."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <ShieldAlert size={10} className="text-purple-500" />
                  <span className="text-[8px] text-purple-500/70 font-bold uppercase">Trap Detected</span>
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
              System Restoration...
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
              <span className="text-[10px] font-mono text-primary tracking-[0.3em] uppercase">03 / THE SOLUTION</span>
            </div>
            <div className="absolute top-0 right-0 flex items-center gap-2 z-30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono text-green-500 tracking-[0.3em] uppercase font-bold">SYSTEM: STABLE</span>
            </div>

            {/* Floating Solution Cards */}
            <FloatingLegalCard className="top-[10%] left-[5%] w-72 border-green-500/30" delay={0}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Safe Termination</span>
                </div>
                <p className="text-xs text-gray-300 font-medium italic">"Termination notice period upgraded to industry standard (30 days)."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <CheckCircle size={10} className="text-green-500" />
                  <span className="text-[8px] text-green-500/70 font-bold uppercase">Risk Mitigated</span>
                </div>
              </div>
            </FloatingLegalCard>

            <FloatingLegalCard className="bottom-[10%] left-[10%] w-80 border-blue-500/30" delay={1.5} duration={8}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Liability Shield</span>
                </div>
                <p className="text-xs text-gray-300 font-medium italic">"Liability capped at 12 months' fees. Indirect damages excluded."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Shield size={10} className="text-blue-500" />
                  <span className="text-[8px] text-blue-500/70 font-bold uppercase">Balance Restored</span>
                </div>
              </div>
            </FloatingLegalCard>

            <FloatingLegalCard className="top-[15%] right-[8%] w-64 border-purple-500/30" delay={0.8} duration={7}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest">Jurisdiction Clear</span>
                </div>
                <p className="text-xs text-gray-300 font-medium italic">"Governing law: Local Jurisdiction. Disputes handled in local courts."</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Search size={10} className="text-purple-500" />
                  <span className="text-[8px] text-purple-500/70 font-bold uppercase">Transparency 100%</span>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                {[
                  { title: "Neural Analysis", icon: Cpu, desc: "Clause classification" },
                  { title: "Risk Shield", icon: ShieldCheck, desc: "Automated protection" },
                  { title: "Universal Clarity", icon: Search, desc: "Regional languages" }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl flex flex-col items-center gap-3 group hover:bg-white/10 transition-all"
                  >
                    <item.icon className="text-primary w-8 h-8 group-hover:scale-110 transition-transform" />
                    <div className="text-sm font-bold text-white uppercase tracking-widest">{item.title}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{item.desc}</div>
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

export default CinematicOverview;