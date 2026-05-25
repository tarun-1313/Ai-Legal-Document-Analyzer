import { useEffect, useState, useCallback } from 'react';
import axios from '../api/axios';
import { FileText, Trash2, Clock, AlertTriangle, CheckCircle2, Loader2, Zap, Shield, Cpu, Terminal, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DocumentList Component
 * Displays a list of documents with status indicators and actions
 */
export default function DocumentList({ onSelect, selectedId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocs = useCallback(async (isPolling = false) => {
    try {
      const res = await axios.get('/documents/');
      if (Array.isArray(res.data)) {
        setDocuments(prevDocs => {
          if (isPolling && selectedId) {
            const current = res.data.find(d => d.id === selectedId);
            const localDoc = prevDocs.find(d => d.id === selectedId);
            if (current && localDoc && localDoc.status !== current.status) {
              setTimeout(() => onSelect(current), 0);
            }
          }
          return res.data;
        });
        setError(null);
      } else {
        setDocuments([]);
        setError('Invalid response format');
      }
    } catch (err) {
      if (!isPolling) {
        setDocuments([]);
        setError('Failed to load documents');
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [selectedId, onSelect]);

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => fetchDocs(true), 10000);
    return () => clearInterval(interval);
  }, [fetchDocs]);

  const deleteDoc = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await axios.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedId === id) onSelect(null);
      toast.success('Document purged from system');
    } catch (err) {
      toast.error('Failed to purge document');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'analyzed': return <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />;
      case 'failed':
      case 'error': return <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />;
      default: return <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-ping" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
      case 'analyzed': return 'Secure';
      case 'failed':
      case 'error': return 'Interrupted';
      default: return 'Processing';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'analyzed': return 'text-green-500';
      case 'failed':
      case 'error': return 'text-red-500';
      default: return 'text-primary';
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <Cpu className="absolute inset-0 m-auto text-primary/50 w-5 h-5" />
        </div>
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Synchronizing_Vault...</p>
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="text-center py-10 bg-red-500/5 rounded-2xl border border-red-500/10">
        <AlertTriangle className="w-10 h-10 text-red-500/50 mx-auto mb-4" />
        <p className="text-xs text-red-400 font-bold mb-4 px-6">{error}</p>
        <button
          onClick={() => fetchDocs()}
          className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
        >
          Re-Sync
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-white/2 rounded-3xl border border-dashed border-white/5 group">
        <div className="p-4 bg-white/5 rounded-2xl w-fit mx-auto mb-4 border border-white/5 group-hover:border-primary/20 transition-colors">
          <Shield className="w-8 h-8 text-gray-700 group-hover:text-primary/50 transition-colors" />
        </div>
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-8 leading-relaxed">
          Vault Empty. <br /> Initialize first Ingestion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1">
      <AnimatePresence>
        {documents.map((doc, idx) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSelect(doc)}
            className={`group relative flex flex-col p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
              selectedId === doc.id
                ? 'bg-primary/10 border-primary/40 shadow-2xl shadow-primary/5'
                : 'bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10'
            }`}
          >
            {/* Selection Glow */}
            {selectedId === doc.id && (
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            )}
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-4 min-w-0">
                <div className={`shrink-0 p-2.5 rounded-xl transition-all border ${
                  selectedId === doc.id 
                    ? 'bg-primary text-white border-primary/50' 
                    : 'bg-white/5 text-gray-500 border-white/5 group-hover:border-white/10 group-hover:text-gray-300'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-black truncate transition-colors uppercase tracking-tight ${
                      selectedId === doc.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`}>
                      {doc.title || doc.filename || 'UNNAMED_ENTITY'}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(doc.status)}
                      <span className={`text-[8px] font-black uppercase tracking-widest ${getStatusColor(doc.status)}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                    </div>
                    <span className="text-[8px] text-gray-700">•</span>
                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'NODATE'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => deleteDoc(doc.id, e)}
                  className="p-2 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Purge Document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Progress Bar for processing docs */}
            {doc.status !== 'completed' && doc.status !== 'analyzed' && doc.status !== 'failed' && doc.status !== 'error' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 pt-3 border-t border-white/5 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Activity size={10} className="text-primary animate-pulse" />
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest">
                      {doc.current_step || 'Analyzing...'}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-white">{doc.processing_progress || 0}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${doc.processing_progress || 0}%` }}
                    className="h-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

