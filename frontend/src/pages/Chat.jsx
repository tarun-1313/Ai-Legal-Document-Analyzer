import { useEffect, useState } from 'react';
import ChatBox from '../components/ChatBox';
import axios from '../api/axios';
import LanguageSelector from '../components/LanguageSelector';
import { MessageSquare, FileText, AlertCircle, Zap } from 'lucide-react';

export default function ChatPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('en');
  const [easyMode, setEasyMode] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axios.get('/documents/');
        const analyzedDocs = Array.isArray(res.data)
          ? res.data.filter(d => d?.status === 'analyzed' || d?.status === 'completed')
          : [];
        setDocuments(analyzedDocs);
        if (analyzedDocs.length > 0) setSelectedDocId(analyzedDocs[0].id);
      } catch (e) {
        setError('Failed to load documents');
      }
    };
    fetchDocs();
  }, []);

  const sendMessage = async (query) => {
    if (!selectedDocId) {
      setError('Please select a document first');
      return 'Please select a document first';
    }
    setLoading(true);
    setError('');
    try {
      const resp = await axios.post('/chat/ask', {
        document_id: selectedDocId,
        message: query,
        target_lang: language,
        easy_mode: easyMode
      });
      return resp.data.response;
    } catch (e) {
      setError(e.response?.data?.detail || 'Chat failed');
      return 'Error: could not get response';
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="text-primary w-8 h-8" />
            Multilingual Assistant
          </h1>
          <p className="text-gray-400 mt-1">Regional AI support for legal accessibility</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Easy Mode Toggle */}
          <button
            onClick={() => setEasyMode(!easyMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
              easyMode 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Zap size={14} className={easyMode ? 'fill-amber-400' : ''} />
            <span>{easyMode ? 'Easy Mode' : 'Normal Mode'}</span>
          </button>

          {/* Language Selector */}
          <LanguageSelector currentLang={language} onLanguageChange={setLanguage} />
          
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 shadow-inner">
            <FileText className="text-primary w-5 h-5" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Select Context</span>
              <select 
                value={selectedDocId} 
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer appearance-none pr-8"
                style={{ background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E") no-repeat right center', backgroundSize: '1rem' }}
              >
                {documents.length === 0 ? (
                  <option value="" className="bg-dark">No analyzed docs</option>
                ) : (
                  documents.map(doc => (
                    <option key={doc.id} value={doc.id} className="bg-dark">{doc.title || doc.filename}</option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white/5 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden min-h-[600px] flex flex-col">
        <ChatBox onSend={sendMessage} loading={loading} language={language} />
      </div>
    </div>
  );
}
