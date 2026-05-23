import { useEffect, useState, useCallback } from 'react';
import axios from '../api/axios';
import AnalyticsChart from '../components/AnalyticsChart';
import { useTranslation } from 'react-i18next';
import { 
  Filter, 
  ChevronDown, 
  Check, 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  Zap, 
  Activity, 
  ShieldAlert, 
  FileText,
  AlertCircle,
  HelpCircle,
  Gavel,
  CreditCard,
  UserCheck,
  Globe
} from 'lucide-react';

const ScoreCardItem = ({ title, score, icon: Icon, colorClass }) => (
  <div className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-3 relative overflow-hidden group hover:border-white/20 transition-all">
    <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
      <Icon size={64} />
    </div>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl bg-white/5 ${colorClass}`}>
        <Icon size={20} />
      </div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="flex items-end justify-between">
      <p className="text-3xl font-bold text-white tracking-tight">{score}%</p>
      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  </div>
);

const AttentionAreaItem = ({ area, severity, impact, why_it_matters, consequences, doc_title }) => (
  <div className={`p-6 rounded-3xl border transition-all hover:shadow-2xl ${
    severity === 'critical' ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' :
    severity === 'high' ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40' :
    'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40'
  }`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <AlertCircle size={18} className={
          severity === 'critical' ? 'text-red-500' : severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
        } />
        <span className="text-sm font-bold text-white">{area}</span>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
        severity === 'critical' ? 'bg-red-500 text-white' : 
        severity === 'high' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-black'
      }`}>
        {severity}
      </span>
    </div>
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Impact</p>
        <p className="text-xs text-gray-300 leading-relaxed">{impact}</p>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Why it matters</p>
        <p className="text-xs text-gray-400 leading-relaxed italic">{why_it_matters}</p>
      </div>
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[9px] text-gray-500 truncate max-w-[150px]">Doc: {doc_title}</span>
        <button className="text-[9px] font-bold text-primary hover:underline uppercase tracking-widest">Details</button>
      </div>
    </div>
  </div>
);

export default function Analytics() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch all analyzed documents for filtering
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axios.get('/documents/');
        const docs = Array.isArray(res.data) ? res.data : [];
        const filtered = docs.filter(d => d?.status !== 'failed');
        setDocuments(filtered);
      } catch (e) {
        console.error('Failed to fetch documents', e);
      }
    };
    fetchDocs();
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      let url = '/analytics/dashboard';
      if (selectedDocs.length > 0) {
        const params = new URLSearchParams();
        selectedDocs.forEach(id => params.append('doc_ids', id));
        url += `?${params.toString()}`;
      }
      const res = await axios.get(url);
      setStats(res.data);
    } catch (e) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [selectedDocs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const toggleDoc = (id) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const clearFilters = () => setSelectedDocs([]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-gray-400 font-medium animate-pulse">Building Intelligence Dashboard...</p>
    </div>
  );
  if (error) return <div className="text-red-400 text-center mt-8">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
      {/* Header with Language Selector */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl sticky top-4 z-30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-2xl">
            <Activity className="text-primary w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('analytics.title')}</h1>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <Shield size={12} className="text-green-500" />
              AI-Powered Legal Safety Advisor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => changeLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${i18n.language === 'en' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              EN
            </button>
            <button 
              onClick={() => changeLanguage('hi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${i18n.language === 'hi' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              HI
            </button>
          </div>

          {/* Document Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all min-w-[240px]"
            >
              <Filter size={16} className="text-primary" />
              <span className="flex-1 text-left truncate">
                {selectedDocs.length === 0 
                  ? 'All Documents' 
                  : `${selectedDocs.length} Selected`}
              </span>
              <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Context Selection</span>
                    <button onClick={clearFilters} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-widest">Reset</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {documents.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => toggleDoc(doc.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                          selectedDocs.includes(doc.id) ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col truncate pr-4">
                          <span className="text-sm font-medium truncate">{doc.title || doc.filename}</span>
                          <span className="text-[9px] opacity-50">{doc.status}</span>
                        </div>
                        {selectedDocs.includes(doc.id) && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Scorecard Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Zap size={20} className="text-primary" />
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">{t('analytics.scorecard')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <ScoreCardItem 
            title={t('analytics.safety_score')} 
            score={stats.scorecard.overall} 
            icon={Shield} 
            colorClass="text-primary" 
          />
          <ScoreCardItem 
            title={t('analytics.financial_risk')} 
            score={stats.scorecard.financial} 
            icon={CreditCard} 
            colorClass="text-blue-400" 
          />
          <ScoreCardItem 
            title={t('analytics.legal_risk')} 
            score={stats.scorecard.legal} 
            icon={Gavel} 
            colorClass="text-purple-400" 
          />
          <ScoreCardItem 
            title={t('analytics.compliance_risk')} 
            score={stats.scorecard.compliance} 
            icon={ShieldAlert} 
            colorClass="text-orange-400" 
          />
          <ScoreCardItem 
            title={t('analytics.ownership_risk')} 
            score={stats.scorecard.ownership} 
            icon={UserCheck} 
            colorClass="text-green-400" 
          />
        </div>
      </section>

      {/* Risk Attention & Heatmap Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="text-red-500" />
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">{t('analytics.attention_areas')}</h2>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Priority View</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.attention_areas && stats.attention_areas.length > 0 ? (
              stats.attention_areas.map((area, idx) => (
                <AttentionAreaItem key={idx} {...area} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
                <HelpCircle size={40} className="mx-auto text-gray-600 mb-4 opacity-20" />
                <p className="text-gray-500 italic">No critical attention areas identified yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-8">
          <div className="flex items-center gap-3">
            <TrendingDown size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Risk Distribution</h2>
          </div>
          <div className="h-[400px]">
             <AnalyticsChart data={stats.risk_distribution} title="" type="pie" />
          </div>
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">AI Observation</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              Based on {stats.total_documents} documents, {stats.risk_distribution['critical'] || 0} critical risks require immediate lawyer review.
            </p>
          </div>
        </div>
      </div>

      {/* Potential Loss Areas */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingDown size={20} className="text-red-500" />
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">{t('analytics.loss_areas')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.loss_areas && stats.loss_areas.length > 0 ? (
            stats.loss_areas.map((loss, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 hover:bg-white/10 transition-all group">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{loss.area}</h4>
                  <div className="p-1.5 bg-red-500/20 rounded-lg text-red-500">
                    <TrendingDown size={14} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="w-1 h-auto bg-blue-500/40 rounded-full" />
                    <p className="text-[11px] text-gray-400"><span className="text-blue-400 font-bold uppercase mr-1">Business:</span> {loss.business_impact}</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-1 h-auto bg-green-500/40 rounded-full" />
                    <p className="text-[11px] text-gray-400"><span className="text-green-400 font-bold uppercase mr-1">Financial:</span> {loss.financial_consequences}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/5 text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
                  Impact: HIGH LEGAL EXPOSURE
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-gray-600 bg-white/5 border border-dashed border-white/10 rounded-3xl italic">
              No major potential loss areas detected.
            </div>
          )}
        </div>
      </section>

      {/* Clause Insights & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <FileText size={20} className="text-primary" />
            Clause Type Distribution
          </h2>
          <div className="h-[350px]">
             <AnalyticsChart data={stats.clause_type_distribution} title="" type="bar" />
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Zap size={20} className="text-yellow-500" />
            AI Confidence Insights
          </h2>
          <div className="h-[350px]">
             <AnalyticsChart data={stats.confidence_distribution} title="" type="pie" />
          </div>
        </div>
      </div>

      {/* AI Prediction Insights Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gavel size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">AI Prediction Intelligence</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Real-time Predictions</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.top_clauses.map((clause, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4 hover:border-primary/40 transition-all group relative overflow-hidden">
               <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded-lg">{clause.clause_type}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] font-bold text-green-400">{(clause.confidence * 100).toFixed(0)}% CONFIDENCE</span>
                  </div>
               </div>
               <p className="text-sm text-gray-300 line-clamp-4 italic leading-relaxed group-hover:text-white transition-colors">
                  "{clause.text}"
               </p>
               <div className="pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Agreement Source</span>
                    <span className="text-[10px] text-gray-400 font-medium truncate max-w-[140px]">{clause.doc_title}</span>
                  </div>
                  <button className="p-2 bg-white/5 hover:bg-primary/20 rounded-xl text-primary transition-all">
                    <ChevronDown size={14} />
                  </button>
               </div>
               <div className="absolute bottom-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <FileText size={80} />
               </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
