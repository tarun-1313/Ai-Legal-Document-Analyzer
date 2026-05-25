import { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, CheckCircle, Loader2, Cpu, Terminal, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadCard({ onUploadSuccess, compact = false }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const formatErrorDetail = (detail) => {
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map(d => d.msg).join(', ');
    if (typeof detail === 'object' && detail !== null) return JSON.stringify(detail);
    return null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
      setError('');
    } else {
      setError('Only PDF files are allowed');
    }
  };

  const handleUpload = async () => {
    if (!file) { setError('Select a PDF file first'); return; }
    setLoading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    try {
      const resp = await axios.post('/documents/upload/', form);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setTitle('');
        onUploadSuccess && onUploadSuccess(resp.data);
      }, 1500);
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
        navigate('/auth');
      }
      const detail = e.response?.data?.detail;
      setError(formatErrorDetail(detail) || e.message || 'Upload failed. Check if server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={compact ? {} : { opacity: 0, scale: 0.95 }}
      animate={compact ? {} : { opacity: 1, scale: 1 }}
      className={`w-full transition-all duration-300 relative group ${
        compact 
          ? 'p-0 bg-transparent border-none shadow-none' 
          : 'max-w-xl mx-auto p-10 bg-[#05070a]/80 backdrop-blur-2xl rounded-4xl border border-white/10 shadow-2xl overflow-hidden'
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {!compact && (
        <>
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Cpu size={120} className="text-primary" />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                <Upload className="text-primary w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Upload_Intelligence</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Terminal size={10} className="text-gray-500" />
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Secure_Ingestion_Channel</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-black text-green-500 uppercase">Status: Ready</span>
            </div>
          </div>
        </>
      )}

      <AnimatePresence mode="wait">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3"
          >
            <X size={18} className="shrink-0" />
            <span className="truncate">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-bold flex items-center gap-3"
          >
            <CheckCircle size={18} className="shrink-0" />
            Ingestion Successful. Initializing RAG pipeline...
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        id="fileInput"
        onChange={(e) => {
          const next = e.target.files?.[0] || null;
          if (next && next.type !== 'application/pdf') {
            setFile(null);
            setError('Only PDF files are allowed');
            return;
          }
          setFile(next);
          setError('');
        }}
      />
      
      <label 
        htmlFor="fileInput" 
        className={`cursor-pointer flex flex-col items-center justify-center transition-all border-2 border-dashed rounded-4xl relative overflow-hidden group/label ${
          compact ? 'h-36' : 'h-64'
        } ${
          file 
            ? 'border-primary/50 bg-primary/5 shadow-[inset_0_0_30px_rgba(59,130,246,0.1)]' 
            : 'border-white/5 bg-white/2 hover:border-primary/30 hover:bg-primary/2'
        }`}
      >
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div 
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center p-8 space-y-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <FileText className={`${compact ? 'w-10 h-10' : 'w-16 h-16'} text-primary relative z-10`} />
              </div>
              <div className="space-y-1">
                <span className="text-white font-black text-sm tracking-tight truncate max-w-[200px] block uppercase">{file.name}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-full">
                <span className="text-[8px] font-black text-primary uppercase">Ready_For_Analysis</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="no-file"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center p-8"
            >
              <div className={`p-5 bg-white/5 rounded-2xl border border-white/5 group-hover/label:border-primary/30 group-hover/label:bg-primary/5 transition-all mb-5`}>
                <Upload className={`${compact ? 'w-6 h-6' : 'w-10 h-10'} text-gray-500 group-hover/label:text-primary transition-colors`} />
              </div>
              <span className={`text-white font-black uppercase tracking-tight ${compact ? 'text-xs' : 'text-lg'}`}>
                {compact ? 'Ingest_Document' : 'Drop_Legal_Vector'}
              </span>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                {compact ? 'Click to browse' : 'Drag PDF here or click to scan'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Decorative corner lines */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/5 group-hover/label:border-primary/30 transition-colors" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/5 group-hover/label:border-primary/30 transition-colors" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/5 group-hover/label:border-primary/30 transition-colors" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/5 group-hover/label:border-primary/30 transition-colors" />
      </label>

      <div className={`mt-8 space-y-4 ${compact ? 'flex flex-col' : ''}`}>
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Document_Identifier</label>
            <Shield size={10} className="text-gray-600" />
          </div>
          <input
            type="text"
            placeholder="e.g. ALPHA_CONTRACT_2024"
            className={`w-full bg-white/5 text-white border border-white/5 rounded-[1.25rem] focus:outline-none focus:border-primary/40 focus:bg-primary/2 transition-all font-bold tracking-tight placeholder:text-gray-700 ${
              compact ? 'p-3 text-xs' : 'p-4 text-sm'
            }`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || success || !file}
          className={`w-full py-5 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-[1.25rem] shadow-2xl shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed group/btn overflow-hidden relative`}
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              <span>Initializing_RAG...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Ingested</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>Execute_Analysis</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

