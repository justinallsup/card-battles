'use client';
import { useState } from 'react';
import { Flag } from 'lucide-react';
import { getToken } from '../../lib/api';
import { showToast } from './Toast';
import { Modal } from './Modal';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

const REASONS = [
  'Inappropriate content',
  'Spam',
  'Fake card',
  'Harassment',
  'Other',
];

interface ReportModalProps {
  targetType: 'battle' | 'comment' | 'user';
  targetId: string;
  targetLabel?: string;
  onClose: () => void;
}

export function ReportModal({ targetType, targetId, targetLabel, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    const token = getToken();
    if (!token) {
      showToast('Please log in to report content', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: description ? `${reason}: ${description}` : reason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        showToast('Report submitted. Our team will review it.', 'success');
        setTimeout(onClose, 1500);
      } else {
        showToast(data.error || 'Failed to submit report', 'error');
      }
    } catch {
      showToast('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const title = `Report ${targetType === 'battle' ? 'Battle' : targetType === 'comment' ? 'Comment' : 'User'}${targetLabel ? ` — ${targetLabel}` : ''}`;

  return (
    <Modal isOpen={true} onClose={onClose} title={title} size="sm">
      {success ? (
        <div className="py-4 text-center">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-white font-bold">Report Submitted</p>
          <p className="text-xs text-[#64748b] mt-1">Our team will review it shortly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Reason selector */}
          <div>
            <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-2">Reason</p>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  aria-pressed={reason === r}
                  className="w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all"
                  style={reason === r
                    ? { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444', fontWeight: 600 }
                    : { background: '#0a0a0f', borderColor: '#1e1e2e', color: '#94a3b8' }
                  }
                >
                  {reason === r ? '● ' : '○ '}{r}
                </button>
              ))}
            </div>
          </div>

          {/* Optional description */}
          <div>
            <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-widest mb-2">
              Additional details <span className="text-[#374151] font-normal normal-case">(optional)</span>
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              maxLength={400}
              rows={3}
              aria-label="Additional details for report"
              className="w-full px-3 py-2.5 rounded-xl border border-[#1e1e2e] bg-[#0a0a0f] text-white text-sm resize-none outline-none focus:border-[#6c47ff]/50 placeholder:text-[#374151]"
            />
            <p className="text-[10px] text-[#374151] text-right mt-1">{description.length}/400</p>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            aria-label="Submit report"
            className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={reason
              ? { background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', boxShadow: '0 0 16px rgba(239,68,68,0.3)' }
              : { background: '#1e1e2e', color: '#374151' }
            }
          >
            {submitting ? 'Submitting...' : '🚩 Submit Report'}
          </button>

          <p className="text-[10px] text-[#374151] text-center">
            False reports may result in account restrictions.
          </p>
        </div>
      )}
    </Modal>
  );
}

// Convenience: Report button that opens the modal
interface ReportButtonProps {
  targetType: 'battle' | 'comment' | 'user';
  targetId: string;
  targetLabel?: string;
  className?: string;
  compact?: boolean;
}

export function ReportButton({ targetType, targetId, targetLabel, className, compact }: ReportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={className ?? 'flex items-center gap-1 text-[#374151] hover:text-[#ef4444] transition-colors text-xs'}
        aria-label={`Report this ${targetType}`}
        title="Report"
      >
        <Flag size={compact ? 11 : 13} aria-hidden="true" />
        {!compact && <span>Report</span>}
      </button>
      {open && (
        <ReportModal
          targetType={targetType}
          targetId={targetId}
          targetLabel={targetLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
