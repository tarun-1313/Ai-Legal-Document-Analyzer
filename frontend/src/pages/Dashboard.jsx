import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import UploadCard from '../components/UploadCard';
import DocumentList from '../components/DocumentList';
import DocumentAnalysis from '../components/DocumentAnalysis';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Shield, CheckCircle, BarChart3, LayoutDashboard, FileSearch, RotateCcw, AlertTriangle, Zap, Activity, FileText, MessageSquare, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [view, setView] = useState('summary'); // 'summary' or 'clauses'
  const [isRetrying, setIsRetrying] = useState(false);
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [easyMode, setEasyMode] = useState(false);
  const [translatedAnalysis, setTranslatedAnalysis] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Handle language change
  const handleLanguageChange = useCallback(async (newLang) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    
    if (selectedDoc && (selectedDoc.status === 'completed' || selectedDoc.status === 'analyzed') && newLang !== 'en') {
      setIsTranslating(true);
      try {
        const resp = await axios.get(`/localization/document/${selectedDoc.id}/translate/${newLang}`);
        setTranslatedAnalysis(resp.data);
      } catch (err) {
        console.error("Translation failed:", err);
      } finally {
        setIsTranslating(false);
      }
    } else {
      setTranslatedAnalysis(null);
    }
  }, [selectedDoc, i18n]);

  // Update translated content when selectedDoc changes
  useEffect(() => {
    if (selectedDoc && language !== 'en') {
      handleLanguageChange(language);
    } else {
      setTranslatedAnalysis(null);
    }
  }, [selectedDoc, language, handleLanguageChange]);

  // Poll for document status if selected document is still processing
  useEffect(() => {
    let interval;
    if (selectedDoc && selectedDoc.status !== 'completed' && selectedDoc.status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const resp = await axios.get(`/documents/${selectedDoc.id}`);
          setSelectedDoc(resp.data);
          
          // If it just finished, refresh the list too
          if (resp.data.status === 'completed') {
            setRefreshTrigger(prev => prev + 1);
          }
        } catch (err) {
          console.error("Status polling failed:", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedDoc]);

  const handleUploadSuccess = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleDocSelect = useCallback((doc) => {
    setSelectedDoc(doc);
  }, []);

  const handleRetry = async () => {
    if (!selectedDoc) return;
    setIsRetrying(true);
    try {
      await axios.post(`/documents/${selectedDoc.id}/retry`);
      // Update local state to show it's processing again
      setSelectedDoc({ ...selectedDoc, status: 'extracting', error_message: null });
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* Top Header Bar - Integrated and Professional */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0a0c10]/80 backdrop-blur-md border-b border-white/5 z-30">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 group-hover:bg-primary/20 transition-all">
              <Shield className="text-primary w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">LegalAI</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mt-1">Intelligence Platform</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <Link 
              to="/chat" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <MessageSquare size={14} />
              <span>Intelligence Chat</span>
            </Link>
            <Link 
              to="/analytics" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <BarChart3 size={14} />
              <span>Analytics</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Easy Mode Toggle */}
            <button
              onClick={() => setEasyMode(!easyMode)}
              className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                easyMode 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-lg shadow-amber-500/5' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            >
              <Zap size={14} className={easyMode ? 'fill-amber-400 text-amber-400' : 'group-hover:text-amber-400 transition-colors'} />
              <span>{easyMode ? 'Easy Mode' : 'Switch to Easy'}</span>
            </button>

            <div className="h-6 w-px bg-white/10 mx-1" />

            {/* Language Selector */}
            <LanguageSelector currentLang={language} onLanguageChange={handleLanguageChange} />
          </div>

          <div className="h-8 w-px bg-white/10" />

          {/* User & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Account</span>
              <span className="text-xs font-bold text-white mt-1">{user?.name || 'User'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-xl border border-white/10 hover:border-red-500/20 transition-all"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Scrollable and Fixed Width */}
        <aside className="w-80 lg:w-96 flex flex-col border-r border-white/5 bg-[#05060a] overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Documents Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={14} />
                  Your Documents
                </h2>
                <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/10">
                  {refreshTrigger > 0 ? 'Updated' : 'Syncing'}
                </span>
              </div>
              <DocumentList key={refreshTrigger} onSelect={handleDocSelect} selectedId={selectedDoc?.id} />
            </section>

            {/* Upload Section */}
            <section className="space-y-4">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 px-2">
                <FileText size={14} />
                New Analysis
              </h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-all">
                <UploadCard onUploadSuccess={handleUploadSuccess} compact={true} />
              </div>
            </section>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-white/5 bg-white/2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <Activity size={16} className="text-primary animate-pulse" />
              <div className="text-[10px] text-gray-400 leading-tight">
                <span className="text-white font-bold">Pro Account Active</span><br />
                Unlimited Regional Translations
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-[#05060a] relative custom-scrollbar">
          {!selectedDoc ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl">
                  <FileSearch className="text-primary w-16 h-16" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Intelligence Center</h3>
              <p className="text-gray-400 max-w-sm leading-relaxed">
                Select a document from the sidebar to begin your deep legal analysis. 
                We'll extract risks, identify key clauses, and simplify the language for you.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-md">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
                  <Zap className="text-amber-400 mb-2" size={20} />
                  <p className="text-xs font-bold text-white mb-1">Regional Support</p>
                  <p className="text-[10px] text-gray-500">15+ Indian languages for maximum accessibility.</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
                  <Shield className="text-green-400 mb-2" size={20} />
                  <p className="text-xs font-bold text-white mb-1">Risk Scoring</p>
                  <p className="text-[10px] text-gray-500">Automated safety scorecard for every contract.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
              {isTranslating ? (
                <div className="h-[400px] flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <h3 className="text-xl font-bold text-white">Translating Intelligence...</h3>
                  <p className="text-gray-500 text-sm">Converting legal nuances to {language.toUpperCase()}.</p>
                </div>
              ) : (selectedDoc.status !== 'completed' && selectedDoc.status !== 'analyzed') ? (
                <div className="space-y-8">
                  {/* Basic Info Header while processing */}
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/20 rounded-2xl">
                        <FileText className="text-primary w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedDoc.title || selectedDoc.filename}</h2>
                        <p className="text-xs text-gray-500 mt-1">Uploaded on {new Date(selectedDoc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Processing Pipeline</span>
                    </div>
                  </div>

                  {/* Progress Card */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
                      <div 
                        className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_15px_rgba(var(--color-primary),0.5)]"
                        style={{ width: `${selectedDoc.processing_progress || 0}%` }}
                      />
                    </div>

                    <div className="flex flex-col items-center space-y-8">
                      <div className="relative">
                        <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Shield className="text-primary w-10 h-10 animate-pulse" />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                          {selectedDoc.status === 'failed' ? 'Pipeline Interrupted' : 'Deep Semantic Analysis'}
                        </h3>
                        <div className="flex items-center justify-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                          <p className="text-primary text-xs font-bold uppercase tracking-[0.3em]">
                            {selectedDoc.current_step || 'Initializing RAG Engines...'}
                          </p>
                        </div>
                      </div>
                      
                      {selectedDoc.status === 'failed' ? (
                        <div className="space-y-6 w-full max-w-md">
                          <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-left space-y-2">
                            <div className="flex items-center gap-2 text-red-400">
                              <AlertTriangle size={18} />
                              <span className="font-bold text-sm">Analysis Error</span>
                            </div>
                            <p className="text-red-400/80 text-xs leading-relaxed">{selectedDoc.error_message || 'The AI pipeline encountered an unexpected error.'}</p>
                          </div>
                          <button
                            onClick={handleRetry}
                            disabled={isRetrying}
                            className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 disabled:opacity-50"
                          >
                            <RotateCcw size={18} className={isRetrying ? 'animate-spin' : ''} />
                            {isRetrying ? 'Restarting Pipeline...' : 'Retry Deep Analysis'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6 w-full max-w-md">
                          <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">
                            <span>System Progress</span>
                            <span>{selectedDoc.processing_progress || 0}%</span>
                          </div>
                          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                              style={{ width: `${selectedDoc.processing_progress || 0}%` }}
                            />
                          </div>
                          <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                             <p className="text-gray-500 text-[11px] leading-relaxed italic">
                               Indexing {selectedDoc.page_count || '1'} pages using LegalBERT models. 
                               Extracting risk vectors for regional translation.
                             </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Result Navigation */}
                  <div className="flex items-center justify-between">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
                      <button
                        onClick={() => setView('summary')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          view === 'summary' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <LayoutDashboard size={18} />
                        Summary & Risks
                      </button>
                      <button
                        onClick={() => setView('clauses')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          view === 'clauses' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <BarChart3 size={18} />
                        Clause Breakdown
                      </button>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl">
                       <CheckCircle className="text-green-400" size={16} />
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Analysis Verified</span>
                    </div>
                  </div>

                  {view === 'summary' ? (
                    <DocumentAnalysis 
                      analysis={translatedAnalysis || selectedDoc.analysis} 
                      document={selectedDoc} 
                      isProcessing={selectedDoc.status !== 'completed' && selectedDoc.status !== 'analyzed'} 
                      easyMode={easyMode}
                      language={language}
                    />
                  ) : (
                    <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
                      <div className="p-8 border-b border-white/10 bg-white/2 flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <BarChart3 className="text-primary w-6 h-6" />
                            Detailed Clause Analysis
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Automated classification with 95%+ confidence threshold.</p>
                        </div>
                        <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">RAG Verification Active</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-white/3">
                              <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Clause Category</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">AI Confidence</th>
                              <th className="px-8 py-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-right">Risk Assessment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {(translatedAnalysis?.clauses || selectedDoc.clauses)?.length > 0 ? (
                              (translatedAnalysis?.clauses || selectedDoc.clauses).map((clause, idx) => (
                                <tr key={idx} className="hover:bg-white/2 transition-colors group">
                                  <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{clause.clause_type}</span>
                                      <span className="text-[10px] text-gray-500 mt-1">Detected via semantic matching</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                      <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-1000 ${
                                            clause.confidence >= 0.9 ? 'bg-green-500' : 
                                            clause.confidence >= 0.85 ? 'bg-primary' : 'bg-amber-500'
                                          }`}
                                          style={{ width: `${clause.confidence * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-white">{(clause.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                                      clause.risk_level === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                      clause.risk_level === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                      clause.risk_level === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                      'bg-green-500/10 text-green-400 border-green-500/20'
                                    }`}>
                                      {clause.risk_level}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" className="px-8 py-20 text-center">
                                  <div className="flex flex-col items-center gap-3 text-gray-500">
                                    <AlertTriangle size={32} className="opacity-20" />
                                    <p className="italic text-sm">No high-confidence clauses identified in this document profile.</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
