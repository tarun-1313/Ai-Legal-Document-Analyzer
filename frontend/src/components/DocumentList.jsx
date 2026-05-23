import { useEffect, useState, useCallback } from 'react';
import axios from '../api/axios';
import { FileText, Trash2, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
        // We use a functional update to avoid depending on 'documents' state
        setDocuments(prevDocs => {
          // If we are polling and have a selected ID, check if status changed
          if (isPolling && selectedId) {
            const current = res.data.find(d => d.id === selectedId);
            const localDoc = prevDocs.find(d => d.id === selectedId);
            if (current && localDoc && localDoc.status !== current.status) {
              // Status changed (e.g. processing -> analyzed), notify parent
              // We do this in a timeout to avoid updating parent during child's render
              setTimeout(() => onSelect(current), 0);
            }
          }
          return res.data;
        });
        setError(null);
      } else {
        console.error('Expected array of documents, got:', res.data);
        setDocuments([]);
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch docs', err);
      if (!isPolling) {
        setDocuments([]);
        setError('Failed to load documents');
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [selectedId, onSelect]);

  // Initial fetch
  useEffect(() => {
    fetchDocs();
  }, []); // Only on mount

  // Polling for updates
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
      toast.success('Document deleted successfully');
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete document');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'analyzed': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'failed':
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'uploaded': return <Clock className="w-5 h-5 text-gray-400" />;
      default: return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'analyzed': return 'text-green-400';
      case 'failed':
      case 'error': return 'text-red-400';
      default: return 'text-primary';
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Loading your documents...</p>
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => fetchDocs()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No documents yet. Upload one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => onSelect(doc)}
          className={`group flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
            selectedId === doc.id
              ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg transition-colors ${
                selectedId === doc.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
              }`}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold truncate max-w-[180px] md:max-w-xs transition-colors ${
                  selectedId === doc.id ? 'text-white' : 'text-gray-200'
                }`}>
                  {doc.title || doc.filename || 'Untitled Document'}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${getStatusColor(doc.status)}`}>
                    {doc.status || 'unknown'}
                  </span>
                  {doc.created_at && (
                    <>
                      <span className="text-[10px] text-gray-500">•</span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {getStatusIcon(doc.status)}
              <button
                onClick={(e) => deleteDoc(doc.id, e)}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Delete Document"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Progress Bar for processing docs */}
          {doc.status !== 'completed' && doc.status !== 'analyzed' && doc.status !== 'failed' && doc.status !== 'error' && (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                <span>{doc.current_step || 'Processing...'}</span>
                <span>{doc.processing_progress || 0}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${doc.processing_progress || 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
