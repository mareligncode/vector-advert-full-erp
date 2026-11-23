import React, { useState, useEffect } from 'react';
import {
  X,
  Paperclip,
  UploadCloud,
  FileText,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Clock
} from 'lucide-react';
import { evidenceService } from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';

export default function EvidenceDrawer({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle = 'Record'
}) {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileTitle, setFileTitle] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isManagement = user?.roles?.some((r) =>
    ['superadmin', 'ceo', 'cao', 'coo', 'hrmanager', 'hrofficer', 'departmenthead', 'manager'].includes(r)
  );

  const fetchEvidence = async () => {
    if (!entityType || !entityId) return;
    try {
      setLoading(true);
      setError('');
      const res = await evidenceService.getByEntity(entityType, entityId);
      if (res.success) {
        setEvidence(res.data);
      }
    } catch (err) {
      // 404 means no evidence created yet
      if (err.response?.status !== 404) {
        console.error('Failed to load evidence:', err);
      }
      setEvidence(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvidence();
    }
  }, [isOpen, entityType, entityId]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    try {
      setUploading(true);
      setError('');
      await evidenceService.addAttachment(entityType, entityId, selectedFiles, {
        title: fileTitle || selectedFiles[0].name,
        description: fileDescription
      });
      setSuccess('Attachment uploaded successfully!');
      setSelectedFiles([]);
      setFileTitle('');
      setFileDescription('');
      fetchEvidence();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const handleReviewAttachment = async (attachmentId, status, rejectionReason = '') => {
    try {
      await evidenceService.reviewAttachment(entityType, entityId, attachmentId, status, rejectionReason);
      fetchEvidence();
    } catch (err) {
      setError(err.response?.data?.message || 'Review action failed');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await evidenceService.deleteAttachment(entityType, entityId, attachmentId);
      fetchEvidence();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete attachment');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      setAddingNote(true);
      await evidenceService.addNote(entityType, entityId, newNote.trim());
      setNewNote('');
      fetchEvidence();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post note');
    } finally {
      setAddingNote(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-white dark:bg-[#0e1626] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00ced1]/15 text-[#00ced1] flex items-center justify-center">
              <Paperclip className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Universal Evidence & Attachments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {entityType} &bull; {entityTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleFileUpload} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#152238]/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-[#00ced1]" />
              <span>Upload New Document or Evidence</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Document Title (e.g. Medical Cert)"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#00ced1]"
              />
              <input
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#00ced1]/15 file:text-[#00ced1] hover:file:bg-[#00ced1]/25 cursor-pointer"
              />
            </div>
            <textarea
              placeholder="Description or context notes..."
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#00ced1]"
            />
            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-950 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: '#00ced1' }}
            >
              {uploading ? 'Uploading...' : 'Submit Attachment'}
            </button>
          </form>

          {/* Attachments List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Attached Files ({evidence?.attachments?.length || 0})
            </h4>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading evidence...</div>
            ) : !evidence || evidence.attachments?.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No attachments uploaded yet.
              </div>
            ) : (
              evidence.attachments.map((att) => (
                <div
                  key={att._id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#152238] border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {att.title || att.fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {att.fileName} &bull; {(att.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        att.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : att.status === 'rejected'
                          ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                          : 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                      }`}
                    >
                      {att.status}
                    </span>
                  </div>

                  {att.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#0e1626] p-2 rounded-xl">
                      {att.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <a
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#00ced1] hover:underline flex items-center gap-1"
                    >
                      <span>View / Download</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center gap-1.5">
                      {isManagement && att.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReviewAttachment(att._id, 'verified')}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Verify"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const reason = window.prompt('Reason for rejection:');
                              if (reason) handleReviewAttachment(att._id, 'rejected', reason);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Notes / Audit Log */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#00ced1]" />
              <span>Audit Commentary & Verification Notes</span>
            </h4>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a remark or verification note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#152238] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#00ced1]"
              />
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 shrink-0"
                style={{ backgroundColor: '#00ced1' }}
              >
                Post
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {evidence?.notes?.map((n) => (
                <div key={n._id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#152238] text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{n.author?.email || 'System'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
