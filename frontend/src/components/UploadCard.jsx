import { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UploadCard({ onUploadSuccess, compact = false }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ... (keep formatErrorDetail)

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
    <div
      className={`w-full transition-all duration-300 ${
        compact 
          ? 'p-0 bg-transparent border-none shadow-none' 
          : 'max-w-xl mx-auto p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl'
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {!compact && (
        <div className="flex items-center gap-2 mb-6">
          <Upload className="text-primary w-5 h-5" />
          <h2 className="text-xl font-bold text-white">Upload Document</h2>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2 animate-shake">
          <X size={16} />
          <span className="truncate">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle size={16} />
          Analysis started!
        </div>
      )}

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
        className={`cursor-pointer flex flex-col items-center justify-center transition-all border-2 border-dashed rounded-xl ${
          compact ? 'h-32' : 'h-48'
        } ${
          file ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
        }`}
      >
        {file ? (
          <div className="flex flex-col items-center text-center p-4">
            <FileText className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} text-primary mb-2`} />
            <span className="text-white font-medium text-xs truncate max-w-[150px]">{file.name}</span>
            <span className="text-gray-500 text-[10px] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center p-4">
            <div className={`p-2 bg-white/5 rounded-full ${compact ? 'mb-2' : 'mb-3'}`}>
              <Upload className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-gray-400`} />
            </div>
            <span className={`text-white font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
              {compact ? 'Click to upload' : 'Click to upload or drag & drop'}
            </span>
            {!compact && <span className="text-gray-500 text-[10px] mt-1">PDF only (max 50MB)</span>}
          </div>
        )}
      </label>

      <div className={`mt-4 space-y-3 ${compact ? 'flex flex-col' : ''}`}>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block px-1">Document Name / Title</label>
          <input
            type="text"
            placeholder="e.g. Sales Agreement"
            className={`w-full bg-white/5 text-white border border-white/10 rounded-xl focus:outline-none focus:border-primary/50 transition-colors ${
              compact ? 'p-2.5 text-xs' : 'p-3 text-sm'
            }`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || success || !file}
          className={`w-full py-3.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              <span>Analyzing...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Success!</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Start Analysis</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
