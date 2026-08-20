// src/components/ReportStoreModal.tsx — Customer Report Counterfeit / Scam Store Modal

import React, { useState } from 'react';
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
              <h2 className="report-modal-title">รายงานร้านค้า & สินค้าละเมิดกฎ</h2>
              <p className="report-modal-subtitle">
                Movemall Anti-Counterfeit & Scam Protection
              </p>
            </div>
          </div>
          <button className="report-modal-close-btn" onClick={handleCloseModal}>
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="report-modal-success-box">
            <CheckCircle2 size={48} color="#10b981" />
            <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>
              ส่งรายงานสำเร็จเรียบร้อยแล้ว
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              เราได้รับรายงานแล้ว และจะตรวจสอบภายใน 24 ชม.
              หากยืนยันว่าเป็นของปลอมหรือการหลอกลวง คุณจะได้รับเงินคืนตามนโยบาย
            </p>
            <button className="report-modal-btn-primary" onClick={handleCloseModal}>
              เข้าใจแล้ว ปิดหน้าต่าง
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-modal-body">
            {/* Target Item Highlight */}
            <div className="report-target-box">
              <span className="report-target-label">
                {targetType === 'PRODUCT' ? '📦 สินค้าที่ถูกรายงาน:' : targetType === 'STORE' ? '🏪 ร้านค้าที่ถูกรายงาน:' : '🧾 ออเดอร์ที่ถูกรายงาน:'}
              </span>
              <strong className="report-target-name">{targetName}</strong>
              {storeName && storeName !== targetName && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                  ร้านค้า: {storeName} {orderId ? `• เลขที่ออเดอร์: #${orderId}` : ''}
                </div>
              )}
            </div>

            {/* Violation Category Picker */}
            <div className="report-form-group">
              <label className="report-form-label">
                ประเภทรายงาน <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                className="report-form-select"
                value={violationType}
                onChange={e => setViolationType(e.target.value)}
                required
              >
                <option value="FAKE_PRODUCT">🚫 สินค้าปลอมหรือเลียนแบบ</option>
                <option value="MISLEADING_SPECS">📦 สินค้าไม่ตรงปกหรือสเปกเท็จ</option>
                <option value="SCAM_OFFPLATFORM">⚠️ หลอกโอนเงินหรือส่งของไม่ครบ</option>
                <option value="HARASSMENT">💬 ร้านค้าส่งข้อความคุกคาม / หยาบคาย / บล็อกแชท</option>
                <option value="NO_FDA_TISI">🏷️ สินค้าอันตรายหรือไม่มี อย./มอก.</option>
                <option value="REFUND_DENIED">↩️ ร้านค้าปฏิเสธการคืนเงิน</option>
              </select>
            </div>

            {/* Description Textarea */}
            <div className="report-form-group">
              <label className="report-form-label">
                รายละเอียด <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                className="report-form-textarea"
                rows={3}
                placeholder="เล่าเหตุการณ์และความเสียหายที่พบ"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Evidence Image URL */}
            <div className="report-form-group">
              <label className="report-form-label">
                ลิงก์รูปหลักฐาน
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="report-form-input"
                  placeholder="เช่น: https://images.unsplash.com/... หรืออัปโหลดลิงก์รูปภาพ"
                  value={evidenceUrl}
                  onChange={e => setEvidenceUrl(e.target.value)}
                />
              </div>
              <span className="report-form-hint">
                แนบรูปหรือวิดีโอเพื่อช่วยให้ตรวจสอบเร็วขึ้น
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
                    <ShieldCheck size={16} color="#2563eb" /> ขอรับความคุ้มครองและเงินคืน
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginTop: 2 }}>
                    คืน 100% หรือ 200% สำหรับสินค้า Mall เมื่อยืนยันว่าเป็นของปลอม
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
                {isSubmitting ? 'กำลังส่งข้อมูล...' : '🚨 ยืนยันการส่งรายงาน'}
              </button>
              <button
                type="button"
                className="report-modal-btn-cancel"
                onClick={handleCloseModal}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
