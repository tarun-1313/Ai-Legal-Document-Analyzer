import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CinematicOverview from '../components/CinematicOverview';
import { 
  Shield, CheckCircle2, ArrowRight, MessageSquare, 
  Activity, AlertTriangle, ShieldAlert, Volume2, 
  Play, FileUp, Languages, BrainCircuit,
  Search, Check, X
} from 'lucide-react';
import { 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis
} from 'recharts';

// --- Sub-components for better organization ---

const FloatingCard = ({ children, className, delay = 0 }) => (
  <motion.div
    initial={{ y: 0 }}
    animate={{ y: [-10, 10, -10] }}
    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ title, subtitle, badge }) => (
  <div className="text-center space-y-4 mb-16">
    {badge && (
      <motion.span 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em]"
      >
        {badge}
      </motion.span>
    )}
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="text-4xl md:text-5xl font-bold text-white tracking-tight"
    >
      {title}
    </motion.h2>
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-gray-400 max-w-2xl mx-auto text-lg"
    >
      {subtitle}
    </motion.p>
  </div>
);

export default function Landing() {
  const [activeLang, setActiveLang] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setSubscribed(false);
    }, 3000);
  };
  const languages = [
    { name: 'English', text: 'Security Deposit', sub: 'Standard Clause' },
    { name: 'Hindi', text: 'सिक्योरिटी डिपॉजिट', sub: 'सुरक्षा जमा' },
    { name: 'Marathi', text: 'ठेव रक्कम', sub: 'सुरक्षा ठेव' },
    { name: 'Tamil', text: 'பாதுகாப்பு வைப்பு', sub: 'வைப்புத் தொகை' },
    { name: 'Punjabi', text: 'ਸੁਰੱਖਿਆ ਜਮ੍ਹਾ', sub: 'ਸੁਰੱਖਿਆ ਡਿਪਾਜ਼ਿਟ' },
    { name: 'Gujarati', text: 'સિક્યોરિટી ડિપોઝિટ', sub: 'સલામતી અનામત' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLang((prev) => (prev + 1) % languages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#05060a] text-white selection:bg-primary/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 px-6 z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-bold uppercase tracking-widest"
            >
              <BrainCircuit size={14} className="animate-pulse" />
              Next-Gen Legal AI Intelligence
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]"
            >
              Understand Legal Docs <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-blue-400 to-primary-hover drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                In Your Own Language
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              AI-powered legal intelligence that simplifies contracts, detects risks, and protects you from hidden penalties and unfair terms.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link
                to="/dashboard"
                className="group relative flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <FileUp size={18} />
                Upload Document
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => setShowVideo(true)}
                className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold transition-all flex items-center gap-2"
              >
                <Play size={16} className="fill-current" />
                Try Demo
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center lg:justify-start gap-8 pt-8 border-t border-white/5"
            >
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-white">15+</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Languages</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-white">95%</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Accuracy</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Analyzed</div>
              </div>
            </motion.div>
          </div>

          <div className="relative hidden lg:block">
            {/* Animated Dashboard Preview */}
            <div className="relative z-10 bg-[#0a0c12] border border-white/10 rounded-[2.5rem] p-4 shadow-2xl backdrop-blur-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="rounded-3xl bg-[#05060a] border border-white/5 p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">AI Legal Analyzer v2.0</div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse delay-75" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col items-center justify-center gap-2">
                       <Activity className="text-primary w-6 h-6 animate-pulse" />
                       <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Scanning Risks...</span>
                    </div>
                    <div className="h-24 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2">
                       <Shield className="text-green-400 w-6 h-6" />
                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Safety Score: 82</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <FloatingCard className="absolute -top-10 -right-10 z-20 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl" delay={0}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="text-red-500 w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Hidden Penalty Detected</div>
              </div>
            </FloatingCard>

            <FloatingCard className="absolute -bottom-10 -left-10 z-20 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl" delay={2}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Languages className="text-blue-400 w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Translation: Hindi (Active)</div>
              </div>
            </FloatingCard>
          </div>
        </div>
      </section>

      {/* Cinematic Overview (Problem & Solution) */}
      <CinematicOverview />

      {/* 2. AI Upload Demo Section (Interactive workflow) */}
      <section className="py-32 px-6 relative z-10 border-t border-white/5 overflow-hidden">
        <SectionHeader 
          badge="How it works"
          title="From Legalese to Intelligence"
          subtitle="Our multi-stage AI pipeline transforms complex legal documents into clear, actionable safety reports."
        />

        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.5,
                  delayChildren: 0.3
                }
              }
            }}
            className="relative grid grid-cols-1 md:grid-cols-5 gap-4 items-center"
          >
            {/* Progress Line */}
            <motion.div 
              variants={{
                hidden: { width: 0 },
                show: { width: '100%', transition: { duration: 2.5, ease: "easeInOut" } }
              }}
              className="absolute top-1/2 left-0 h-0.5 bg-primary/30 hidden md:block -translate-y-1/2 z-0" 
            />
            
            <WorkflowStep icon={FileUp} label="Upload PDF" step="01" />
            <WorkflowStep icon={Search} label="AI Detection" step="02" />
            <WorkflowStep icon={BrainCircuit} label="Risk Analysis" step="03" />
            <WorkflowStep icon={Languages} label="Translation" step="04" />
            <WorkflowStep icon={ShieldAlert} label="Safety Report" step="05" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="mt-20 p-1 bg-linear-to-br from-primary/30 via-white/5 to-primary/30 rounded-[3rem] shadow-2xl"
          >
            <div className="bg-[#0a0c12] rounded-[2.9rem] p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                   <h3 className="text-2xl font-bold text-white">AI Real-time Scanning</h3>
                   <p className="text-gray-400 leading-relaxed">
                     Our LegalBERT model scans every word to identify clause types, detect non-standard terms, and highlight potential traps before you sign.
                   </p>
                   <ul className="space-y-4">
                      <li className="flex items-center gap-3 text-sm text-gray-300">
                        <CheckCircle2 size={18} className="text-primary" />
                        Automated Clause Classification
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-300">
                        <CheckCircle2 size={18} className="text-primary" />
                        Semantic Risk Vector Mapping
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-300">
                        <CheckCircle2 size={18} className="text-primary" />
                        Industry Benchmark Comparison
                      </li>
                   </ul>
                </div>
                <div className="relative aspect-video bg-[#05060a] border border-white/10 rounded-3xl overflow-hidden p-6">
                   <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                   <div className="relative space-y-4">
                      <div className="h-3 bg-white/5 rounded-full w-full" />
                      <div className="h-3 bg-white/5 rounded-full w-11/12" />
                      <div className="h-3 bg-primary/20 rounded-full w-full border border-primary/30 relative overflow-hidden">
                         <motion.div 
                           animate={{ x: ['-100%', '100%'] }}
                           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                           className="absolute inset-0 bg-linear-to-r from-transparent via-primary/50 to-transparent" 
                         />
                      </div>
                      <div className="h-3 bg-white/5 rounded-full w-10/12" />
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mt-4">
                         <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle size={14} className="text-red-500" />
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Unfair Termination Detected</span>
                         </div>
                         <p className="text-[10px] text-red-400/80 leading-relaxed">Clause 14.2 allows landlord to terminate with 24h notice. Industry standard is 30 days.</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. Multilingual Demo Section */}
      <section className="py-32 px-6 bg-white/2 relative z-10 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <SectionHeader 
              badge="Accessibility First"
              title="Regional Legal Support"
              subtitle="We bridge the gap for non-English speakers by providing high-fidelity legal translations in 15+ regional languages."
            />
            
            <div className="space-y-4">
              {languages.map((lang, idx) => (
                <motion.div 
                  key={idx}
                  initial={false}
                  animate={{ 
                    opacity: activeLang === idx ? 1 : 0.4,
                    scale: activeLang === idx ? 1.02 : 1,
                    x: activeLang === idx ? 10 : 0
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeLang === idx ? 'bg-primary/10 border-primary/30 shadow-lg' : 'bg-white/5 border-white/5'
                  }`}
                  onClick={() => setActiveLang(idx)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        activeLang === idx ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'
                      }`}>
                        {lang.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{lang.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{lang.sub}</div>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className={`text-lg font-bold ${activeLang === idx ? 'text-primary' : 'text-gray-400'}`}>
                         {lang.text}
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square bg-linear-to-br from-primary/10 to-transparent rounded-[4rem] border border-white/5 p-8 flex flex-col items-center justify-center text-center space-y-8 overflow-hidden relative">
              <motion.div 
                key={activeLang}
                initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
                className="space-y-4"
              >
                <div className="text-6xl md:text-8xl font-black text-white tracking-tighter opacity-10 absolute inset-0 flex items-center justify-center pointer-events-none">
                  {languages[activeLang].name}
                </div>
                <div className="relative z-10 space-y-2">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4">Real-time Conversion</div>
                  <h4 className="text-4xl md:text-6xl font-bold text-white">{languages[activeLang].text}</h4>
                  <p className="text-gray-400 text-lg">Legal translation with 98% context preservation.</p>
                </div>
              </motion.div>
              
              <div className="grid grid-cols-2 gap-4 w-full pt-12">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Status</div>
                    <div className="text-green-400 text-sm font-bold flex items-center justify-center gap-2">
                      <Check size={14} /> Contextual
                    </div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Latency</div>
                    <div className="text-blue-400 text-sm font-bold">&lt; 200ms</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI Risk Intelligence Section */}
      <section className="py-32 px-6 relative z-10">
        <SectionHeader 
          badge="Fraud Prevention"
          title="AI Risk Intelligence"
          subtitle="Don't miss the fine print. Our AI identifies one-sided clauses and hidden financial traps automatically."
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
           <RiskCard 
             level="Critical" 
             title="Hidden Penalties" 
             desc="AI detected a 15% interest clause for 1-day payment delays hidden in section 4.2."
             impact="High Financial Loss"
           />
           <RiskCard 
             level="High" 
             title="Ownership Traps" 
             desc="Intellectual property transfer clause detected without clear compensation terms."
             impact="Loss of Rights"
             color="orange"
           />
           <RiskCard 
             level="Medium" 
             title="Privacy Risks" 
             desc="Data sharing clause allows third-party access to sensitive personal information."
             impact="Privacy Breach"
             color="yellow"
           />
        </div>

        {/* Analytics Preview with Recharts */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-7xl mx-auto mt-20 p-8 bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden group/graph"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-8">
               <div className="space-y-2">
                 <h3 className="text-2xl font-bold text-white">Risk Analytics Dashboard</h3>
                 <p className="text-sm text-gray-500">Visual intelligence for complex agreements.</p>
               </div>
               
               <div className="space-y-6">
                 <StatRow label="Financial Safety" score={85} color="#3b82f6" />
                 <StatRow label="Legal Compliance" score={72} color="#8b5cf6" />
                 <StatRow label="Ownership Rights" score={94} color="#10b981" />
                 <StatRow label="Overall Trust" score={82} color="#f59e0b" />
               </div>

               <div className="pt-8 border-t border-white/5">
                 <Link to="/analytics" className="text-primary text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all">
                   View Full Analytics <ArrowRight size={16} />
                 </Link>
               </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-8 h-[400px] group-hover/graph:scale-[1.05] transition-transform duration-700 ease-in-out"
            >
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                   <defs>
                     <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                   <XAxis dataKey="name" stroke="#ffffff20" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis hide />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#0a0c12', border: '1px solid #ffffff10', borderRadius: '12px' }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                 </AreaChart>
               </ResponsiveContainer>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 8. Before vs After AI Section */}
      <section className="py-32 px-6 bg-white/2 border-y border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto space-y-16">
          <SectionHeader 
            badge="The Comparison"
            title="The AI Advantage"
            subtitle="See how AI Legal Analyzer transforms the way you interact with legal documents."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-[2.5rem] overflow-hidden border border-white/10">
             <div className="p-8 md:p-12 bg-white/5 space-y-8">
                <div className="flex items-center gap-3 text-gray-500">
                   <X size={20} />
                   <h4 className="font-bold uppercase tracking-widest text-xs">Without AI Analyzer</h4>
                </div>
                <ul className="space-y-6">
                   <ComparisonItem text="Complex 'Legalese' language you can't understand" />
                   <ComparisonItem text="Hidden penalties that cause financial loss" />
                   <ComparisonItem text="English-only documents that exclude regional speakers" />
                   <ComparisonItem text="Hours spent reading 20+ pages of fine print" />
                </ul>
             </div>
             <div className="p-8 md:p-12 bg-primary/10 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Shield size={120} className="text-primary" />
                </div>
                <div className="flex items-center gap-3 text-primary relative z-10">
                   <Check size={20} />
                   <h4 className="font-bold uppercase tracking-widest text-xs">With AI Legal Analyzer</h4>
                </div>
                <ul className="space-y-6 relative z-10">
                   <ComparisonItem text="Instant simplification into plain human language" active />
                   <ComparisonItem text="Automated risk detection for all hidden traps" active />
                   <ComparisonItem text="Regional language support for Hindi, Marathi, etc." active />
                   <ComparisonItem text="Complete safety report in under 30 seconds" active />
                </ul>
             </div>
          </div>
        </div>
      </section>

      {/* 10. Voice & Chat Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
           <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                 <Volume2 size={100} className="text-primary" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-3xl font-bold text-white">Listen to Clauses</h3>
                 <p className="text-gray-400">Can't read the screen? Use our Voice AI to listen to legal summaries in your regional language.</p>
              </div>
              <div className="p-6 bg-[#05060a] border border-white/5 rounded-2xl space-y-6">
                 <div className="flex items-center gap-4">
                    <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20">
                       <Play size={20} fill="currentColor" />
                    </button>
                    <div className="flex-1 h-8 flex items-center gap-1">
                       {[...Array(12)].map((_, i) => (
                         <motion.div 
                           key={i}
                           animate={{ height: [10, Math.random() * 20 + 10, 10] }}
                           transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                           className="flex-1 bg-primary/30 rounded-full" 
                         />
                       ))}
                    </div>
                 </div>
                 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center italic">
                    Reading: Security Deposit Refund Policy (Hindi)
                 </div>
              </div>
           </div>

           <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                 <MessageSquare size={100} className="text-blue-400" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-3xl font-bold text-white">Legal AI Chatbot</h3>
                 <p className="text-gray-400">Have a specific question about a clause? Ask our AI assistant for instant clarification.</p>
              </div>
              <div className="bg-[#05060a] border border-white/5 rounded-2xl overflow-hidden h-[180px] flex flex-col">
                 <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Assistant Online</span>
                 </div>
                 <div className="flex-1 p-4 space-y-4 overflow-hidden">
                    <div className="flex justify-end">
                       <div className="bg-primary/20 text-white text-[10px] p-2 rounded-xl rounded-tr-none max-w-[80%]">
                          What happens if I leave the job before 6 months?
                       </div>
                    </div>
                    <div className="flex justify-start">
                       <div className="bg-white/5 text-gray-300 text-[10px] p-2 rounded-xl rounded-tl-none max-w-[80%] border border-white/5">
                          Clause 8.3 states you must pay a recovery fee of ₹50,000 if you resign within the first 180 days.
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 16. Final CTA Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="p-12 md:p-20 rounded-[4rem] bg-linear-to-br from-primary/20 via-primary/5 to-transparent border border-white/10 text-center space-y-8 relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full" />
            
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight relative z-10">
              Ready to sign with <br /> <span className="text-primary">Confidence?</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto relative z-10">
              Join thousands of users who protect their interests using AI-powered legal intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 relative z-10">
              <Link
                to="/dashboard"
                className="px-12 py-5 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold transition-all shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95"
              >
                Start Free Analysis
              </Link>
              <Link
                to="/auth"
                className="px-12 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 17. Footer */}
      <footer className="py-20 px-6 border-t border-white/5 relative z-10 bg-[#05060a]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3">
               <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                  <Shield className="text-primary w-6 h-6" />
               </div>
               <span className="text-xl font-bold text-white tracking-tight">LegalAI</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Making legal accessibility a reality through AI. We empower users to understand, analyze, and sign documents with confidence.
            </p>
            <div className="flex items-center gap-4">
               <SocialIcon icon="X" href="https://x.com/Tarun191313" />
               <SocialIcon icon="LinkedIn" href="https://www.linkedin.com/in/tarun-chaudhari191313" />
               <SocialIcon icon="GitHub" href="https://github.com/tarun-1313" />
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-500">
               <li><Link to="/dashboard" className="hover:text-white transition-colors">AI Analysis</Link></li>
               <li><Link to="/chat" className="hover:text-white transition-colors">Legal Chat</Link></li>
               <li><Link to="/dashboard" className="hover:text-white transition-colors">Risk Dashboard</Link></li>
               <li><Link to="/dashboard" className="hover:text-white transition-colors">Regional Support</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
               <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
               <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
               <li><Link to="/disclaimer" className="hover:text-white transition-colors">AI Disclaimer</Link></li>
               <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Newsletter</h4>
            <p className="text-sm text-gray-500">Get the latest updates at {subscribed ? 'tarunchaudhari1313@gmail.com' : 'our newsletter'}.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
               <input 
                 type="email" 
                 placeholder="tarunchaudhari1313@gmail.com" 
                 required
                 className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary/50"
                 value={newsletterEmail}
                 onChange={(e) => setNewsletterEmail(e.target.value)}
               />
               <button type="submit" className={`p-2 rounded-xl transition-all ${subscribed ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                  {subscribed ? <Check size={16} /> : <ArrowRight size={16} />}
               </button>
            </form>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
           <span>&copy; 2026 AI Legal Analyzer Platform</span>
           <div className="flex items-center gap-6">
              <span>Made with ❤️ for Legal Accessibility</span>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500" />
                 System Status: Optimal
              </div>
           </div>
        </div>
      </footer>

      <VideoModal isOpen={showVideo} onClose={() => setShowVideo(false)} />
    </div>
  );
}

const VideoModal = ({ isOpen, onClose }) => {
  const [currentTime, setCurrentTime] = useState(0);

  const captions = [
  { start: 0, end: 5, text: "Welcome to AI Legal Document Analyzer" },

  { start: 5, end: 12, text: "Secure Login & User Authentication System" },

  { start: 12, end: 20, text: "Access Your Smart AI Legal Dashboard" },

  { start: 20, end: 32, text: "Upload Agreements, Contracts & Legal Documents" },

  { start: 32, end: 42, text: "AI Extracts Text and Detects Important Clauses" },

  { start: 42, end: 52, text: "Advanced LegalBERT Model Analyzing Risks" },

  { start: 52, end: 62, text: "Real-Time Risk Detection & Legal Insights" },

  { start: 62, end: 72, text: "AI Identifies Financial, Ownership & Liability Risks" },

  { start: 72, end: 82, text: "Interactive Analytics Dashboard with Risk Scores" },

  { start: 82, end: 92, text: "View Clause Classification & Legal Safety Analysis" },

  { start: 92, end: 102, text: "Translate Legal Content Into Multiple Regional Languages" },

  { start: 102, end: 112, text: "Simple Explanations for Complex Legal Clauses" },

  { start: 112, end: 122, text: "AI Recommendations to Prevent Legal & Financial Loss" },

  { start: 122, end: 134, text: "Smart Legal Intelligence for Safer Decision Making" },

  { start: 134, end: 145, text: "Understand Agreements Before You Sign with Confidence!" }
];

  const currentCaption = captions.find(c => currentTime >= c.start && currentTime < c.end)?.text;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-10"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-5xl aspect-video bg-[#0a0c12] border border-white/10 rounded-4xl overflow-hidden shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-20 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            <div className="absolute inset-0 flex items-center justify-center">
              {/* Professional Local Video Player with Caption Tracking */}
              <video 
                width="100%" 
                height="100%" 
                controls 
                autoPlay 
                onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                className="opacity-90 object-cover"
              >
                <source src="/Video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Dynamic Captions Overlay */}
            <AnimatePresence mode="wait">
              {currentCaption && (
                <motion.div
                  key={currentCaption}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 px-6 py-2 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-full text-white text-sm font-bold shadow-2xl whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {currentCaption}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 right-0 p-8 bg-linear-to-t from-black/80 to-transparent pointer-events-none">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-primary/20 rounded-xl border border-primary/30">
                    <Shield className="text-primary w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-white">Product Walkthrough</h3>
                    <p className="text-sm text-gray-400">See how AI simplifies complex legal documents in seconds.</p>
                 </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Helper Components ---

function WorkflowStep({ icon: Icon, label, step }) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8 } }
      }}
      className="relative z-10 flex flex-col items-center space-y-4"
    >
      <motion.div 
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="w-14 h-14 rounded-2xl border bg-primary/10 border-primary/50 text-primary shadow-lg shadow-primary/20 flex items-center justify-center transition-all"
      >
        <Icon size={24} />
      </motion.div>
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Step {step}</div>
        <div className="text-xs font-bold mt-1 text-white">{label}</div>
      </div>
    </motion.div>
  );
}

function RiskCard({ level, title, desc, impact, color = 'red' }) {
  const colors = {
    red: 'text-red-500 bg-red-500/10 border-red-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  };
  
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6 group hover:border-white/20 transition-all"
    >
      <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit border ${colors[color]}`}>
        {level} Risk
      </div>
      <h4 className="text-xl font-bold text-white">{title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
      <div className="pt-6 border-t border-white/5">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Impact Assessment</div>
        <div className="text-xs text-white font-bold">{impact}</div>
      </div>
    </motion.div>
  );
}

function StatRow({ label, score, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-gray-500 uppercase tracking-widest">{label}</span>
        <span style={{ color }}>{score}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ComparisonItem({ text, active }) {
  return (
    <li className="flex items-start gap-4">
      <div className={`mt-1 p-1 rounded-full ${active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-600'}`}>
        {active ? <Check size={12} /> : <X size={12} />}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-gray-200' : 'text-gray-500'}`}>{text}</span>
    </li>
  );
}

function SocialIcon({ icon, href }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
    >
       <span className="text-[10px] font-bold">{icon}</span>
    </a>
  );
}

const chartData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 450 },
  { name: 'May', value: 700 },
  { name: 'Jun', value: 550 },
  { name: 'Jul', value: 800 },
];
