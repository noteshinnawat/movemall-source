// src/components/ReportStoreModal.tsx — Customer Report Counterfeit / Scam Store Modal

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ShieldCheck, X, Upload, CheckCircle2, ShieldAlert } from 'lucide-react';
import { fetchApi } from '../utils/api';
import './ReportStoreModal.css';

export interface ReportStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'PRODUCT' | 'STORE' | 'ORDER';
  targetId: string;
  targetName: string;
  storeName?: string;
  orderId?: string;
}

export function ReportStoreModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  storeName,
  orderId,
}: ReportStoreModalProps) {
  const { t } = useTranslation(['catalog', 'common']);
  const [violationType, setViolationType] = useState<string>('FAKE_PRODUCT');
  const [description, setDescription] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [requestRefund, setRequestRefund] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const reportData = {
      reporterType: 'BUYER',
      reportedType: targetType === 'STORE' ? 'STORE' : 'PRODUCT',
      reportedId: targetId,
      reportedName: targetName,
      storeName: storeName || targetName,
      orderId: orderId || null,
      type: violationType,
      description: description.trim(),
      evidenceUrl: evidenceUrl.trim() || null,
      requestRefund,
      createdAt: new Date().toISOString(),
    };

    try {
      await fetchApi('/api/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
    } catch {
      // Offline fallback
    }

    // Save to localStorage for instant local reflection
    try {
      const existing = JSON.parse(localStorage.getItem('mm_user_reports') || '[]');
      existing.unshift({
        id: `rep-usr-${Date.now()}`,
        ...reportData,
        status: 'PENDING',
      });
      localStorage.setItem('mm_user_reports', JSON.stringify(existing));
    } catch {}

    setIsSubmitting(false);
    setIsSuccess(true);
  }

  function handleCloseModal() {
    setIsSuccess(false);
    setDescription('');
    setEvidenceUrl('');
    onClose();
  }

  return (
    <div className="report-modal-backdrop" onClick={handleCloseModal}>
      <div className="report-modal-card" onClick={e => e.stopPropagation()}>
        <div className="report-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="report-modal-icon-badge">
              <ShieldAlert size={20} color="#dc2626" />
            </div>
            <div>
              <h2 className="report-modal-title">{t('catalog:reporting.title')}</h2>
              <p className="report-modal-subtitle">
                Movemall Anti-Counterfeit & Scam Protection
              </p>
            </div>
          </div>
          <button className="report-modal-close-btn" onClick={handleCloseModal} aria-label={t('common:actions.close')}>
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="report-modal-success-box">
            <CheckCircle2 size={48} color="#10b981" />
            <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>
              {t('catalog:reporting.successTitle')}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              {t('catalog:reporting.successDescription')}
            </p>
            <button className="report-modal-btn-primary" onClick={handleCloseModal}>
              {t('catalog:reporting.understood')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-modal-body">
            {/* Target Item Highlight */}
            <div className="report-target-box">
              <span className="report-target-label">
                {t(`catalog:reporting.targets.${targetType.toLowerCase()}`)}
              </span>
              <strong className="report-target-name">{targetName}</strong>
              {storeName && storeName !== targetName && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                  {orderId
                    ? t('catalog:reporting.storeAndOrder', { store: storeName, order: orderId })
                    : t('catalog:reporting.storeName', { store: storeName })}
                </div>
              )}
            </div>

            {/* Violation Category Picker */}
            <div className="report-form-group">
              <label className="report-form-label">
                {t('catalog:reporting.typeLabel')} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                className="report-form-select"
                value={violationType}
                onChange={e => setViolationType(e.target.value)}
                required
              >
                <option value="FAKE_PRODUCT">{t('catalog:reporting.types.fakeProduct')}</option>
                <option value="MISLEADING_SPECS">{t('catalog:reporting.types.misleadingSpecs')}</option>
                <option value="SCAM_OFFPLATFORM">{t('catalog:reporting.types.scamOffplatform')}</option>
                <option value="HARASSMENT">{t('catalog:reporting.types.harassment')}</option>
                <option value="NO_FDA_TISI">{t('catalog:reporting.types.noFdaTisi')}</option>
                <option value="REFUND_DENIED">{t('catalog:reporting.types.refundDenied')}</option>
              </select>
            </div>

            {/* Description Textarea */}
            <div className="report-form-group">
              <label className="report-form-label">
                {t('catalog:reporting.detailsLabel')} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                className="report-form-textarea"
                rows={3}
                placeholder={t('catalog:reporting.detailsPlaceholder')}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Evidence Image URL */}
            <div className="report-form-group">
              <label className="report-form-label">
                {t('catalog:reporting.evidenceLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="report-form-input"
                  placeholder={t('catalog:reporting.evidencePlaceholder')}
                  value={evidenceUrl}
                  onChange={e => setEvidenceUrl(e.target.value)}
                />
              </div>
              <span className="report-form-hint">
                {t('catalog:reporting.evidenceHint')}
              </span>
            </div>

            {/* Buyer Guarantee Protection Checkbox */}
            <div className="report-guarantee-box">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requestRefund}
                  onChange={e => setRequestRefund(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#2563eb' }}
                />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={16} color="#2563eb" /> {t('catalog:reporting.protectionTitle')}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginTop: 2 }}>
                    {t('catalog:reporting.protectionDescription')}
                  </span>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="report-modal-footer">
              <button
                type="submit"
                className="report-modal-btn-submit"
                disabled={isSubmitting || !description.trim()}
              >
                {isSubmitting ? t('catalog:reporting.submitting') : t('catalog:reporting.submit')}
              </button>
              <button
                type="button"
                className="report-modal-btn-cancel"
                onClick={handleCloseModal}
              >
                {t('common:actions.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
