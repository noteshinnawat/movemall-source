// src/pages/SellerRegisterPage.tsx — Merchant Onboarding & Store Registration Wizard

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  UserCheck,
  Building2,
  MapPin,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Globe,
  Upload,
  Trash2,
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import { generateSlug } from '../utils/slug';
import { validateStoreLogoFile } from './SellerRegisterPage.behavior';
import './SellerRegisterPage.css';

export function SellerRegisterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [category, setCategory] = useState('อิเล็กทรอนิกส์ & ไอที');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoError, setLogoError] = useState('');

  // KYC & Tax State
  const [sellerType, setSellerType] = useState<'individual' | 'corporate'>('individual');
  const [idCardNo, setIdCardNo] = useState('');
  const [taxId, setTaxId] = useState('');
  const [isVatRegistered, setIsVatRegistered] = useState(false);
  const [taxCompanyName, setTaxCompanyName] = useState('');
  const [taxBranchCode, setTaxBranchCode] = useState('00000');

  // Warehouse State
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [postalCode, setPostalCode] = useState('');

  // Payout Bank State
  const [bankName, setBankName] = useState('ธนาคารกสิกรไทย (KBANK)');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmitStoreRegistration() {
    setIsSubmitting(true);
    const finalSlug = storeSlug || generateSlug(storeName || 'store');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await fetchApi<{ message: string; store: any }>('/api/stores/register', {
        method: 'POST',
        body: JSON.stringify({
          name: storeName.trim() || 'ร้านค้าใหม่ของผู้ขาย',
          slug: finalSlug,
          description,
          logo: logoUrl,
          sellerType,
          idCardNo,
          taxId: taxId || idCardNo,
          isVatRegistered,
          taxCompanyName: taxCompanyName || storeName,
          taxBranchCode,
          bankName,
          bankAccountNo,
          accountName,
          addressLine: `${warehouseAddress} ${province} ${postalCode}`,
        }),
      });

      if (res && res.store) {
        localStorage.setItem('movemall_custom_store_name', res.store.name);
        localStorage.setItem('movemall_store_slug', finalSlug);
        localStorage.setItem('movemall_seller_store_id', res.store.id);
        const uStr = localStorage.getItem('movemall_user');
        if (uStr) {
          try {
            const u = JSON.parse(uStr);
            u.role = 'SELLER';
            u.storeId = res.store.id;
            u.storeSlug = finalSlug;
            localStorage.setItem('movemall_user', JSON.stringify(u));
          } catch {
            // Ignore
          }
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/seller');
      }, 1500);
    } catch {
      localStorage.setItem('movemall_custom_store_name', storeName || 'ร้านค้าใหม่ของผู้ขาย');
      localStorage.setItem('movemall_store_slug', finalSlug);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/seller');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="seller-reg-page">
      {/* Registration Header */}
      <header className="seller-reg-header">
        <h1 className="seller-reg-title">🚀 ลงทะเบียนเปิดร้านค้าบน Movemall</h1>
        <p className="seller-reg-sub">
          เริ่มต้นขายสินค้าเข้าถึงฐานผู้ช้อปปิ้งกว่า 100,000+ ราย พร้อมระบบไลฟ์สดและยิงโฆษณาฟรี
        </p>
      </header>

      {/* 4-Step Stepper Bar */}
      <div className="seller-stepper">
        <div className={`seller-step-item ${currentStep === 1 ? 'seller-step-item--active' : currentStep > 1 ? 'seller-step-item--completed' : ''}`}>
          <div className="seller-step-num">1</div>
          <span className="seller-step-lbl">ข้อมูลร้านค้า</span>
        </div>
        <div className={`seller-step-item ${currentStep === 2 ? 'seller-step-item--active' : currentStep > 2 ? 'seller-step-item--completed' : ''}`}>
          <div className="seller-step-num">2</div>
          <span className="seller-step-lbl">ยืนยันตัวตน KYC</span>
        </div>
        <div className={`seller-step-item ${currentStep === 3 ? 'seller-step-item--active' : currentStep > 3 ? 'seller-step-item--completed' : ''}`}>
          <div className="seller-step-num">3</div>
          <span className="seller-step-lbl">คลังสินค้า</span>
        </div>
        <div className={`seller-step-item ${currentStep === 4 ? 'seller-step-item--active' : currentStep > 4 ? 'seller-step-item--completed' : ''}`}>
          <div className="seller-step-num">4</div>
          <span className="seller-step-lbl">บัญชีรับเงินโอน</span>
        </div>
      </div>

      {/* Form Card Body */}
      <div className="seller-reg-card">
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>🎉 ลงทะเบียนเปิดร้านค้าสำเร็จ!</h2>
            <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
              ยินดีต้อนรับเข้าสู่ศูนย์ผู้ขาย Movemall Seller Centre กำลังนำคุณเข้าสู่หน้าแดชบอร์ด...
            </p>
          </div>
        ) : (
          <div>
            {/* Step 1: Store Basic Profile */}
            {currentStep === 1 && (
              <div>
                <h2 className="seller-reg-step-title">🏪 ขั้นตอนที่ 1: ตั้งชื่อและหมวดหมู่ร้านค้า</h2>
                <div className="seller-form-group">
                  <label className="seller-label">ชื่อร้านค้า (Store Name) *</label>
                  <input
                    type="text"
                    required
                    className="seller-input"
                    placeholder="เช่น TechPro Official Store 🇹🇭"
                    value={storeName}
                    onChange={e => {
                      const val = e.target.value;
                      setStoreName(val);
                      if (!isSlugCustomized) {
                        setStoreSlug(generateSlug(val));
                      }
                    }}
                  />
                </div>

                <div className="seller-form-group">
                  <label className="seller-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Globe size={14} color="#2563EB" /> ลิงก์หน้าร้านค้า (SEO Store URL Slug) *
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: '#6B7280', background: '#F3F4F6', padding: '9px 12px', borderRadius: 6, border: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>
                      movemall.pages.dev/store/
                    </span>
                    <input
                      type="text"
                      required
                      className="seller-input"
                      placeholder="techpro-official"
                      value={storeSlug}
                      onChange={e => {
                        setIsSlugCustomized(true);
                        setStoreSlug(generateSlug(e.target.value));
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 11.5, color: '#10B981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✨ URL ที่กระชับและมีความหมายจะช่วยให้ Google Index และจัดอันดับร้านค้าของคุณอยู่อันดับแรกๆ
                  </p>
                </div>

                <div className="seller-grid-2">
                  <div className="seller-form-group">
                    <label className="seller-label">หมวดหมู่สินค้าหลัก *</label>
                    <select className="seller-input" value={category} onChange={e => setCategory(e.target.value)}>
                      <option>อิเล็กทรอนิกส์ & ไอที</option>
                      <option>แฟชั่น & เสื้อผ้า</option>
                      <option>ความงาม & สกินแคร์</option>
                      <option>บ้าน & เครื่องใช้ไฟฟ้า</option>
                      <option>อาหาร & เครื่องดื่ม</option>
                    </select>
                  </div>
                  <div className="seller-form-group">
                    <label className="seller-label">โลโก้ร้านค้า (Shop Logo)</label>
                    <div className="seller-logo-upload">
                      {logoUrl ? (
                        <img className="seller-logo-upload__preview" src={logoUrl} alt="ตัวอย่างโลโก้ร้านค้า" />
                      ) : (
                        <div className="seller-logo-upload__placeholder" aria-hidden="true">🏪</div>
                      )}
                      <div className="seller-logo-upload__content">
                        <label className="seller-logo-upload__button">
                          <Upload size={14} /> {logoUrl ? 'เปลี่ยนรูปโลโก้' : 'อัปโหลดรูปโลโก้'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={event => {
                              const file = event.target.files?.[0];
                              if (!file) return;

                              const validation = validateStoreLogoFile(file);
                              if (!validation.valid) {
                                setLogoError(validation.error);
                                event.target.value = '';
                                return;
                              }

                              const reader = new FileReader();
                              reader.onload = () => {
                                setLogoUrl(reader.result as string);
                                setLogoError('');
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        {logoUrl && (
                          <button
                            type="button"
                            className="seller-logo-upload__remove"
                            onClick={() => {
                              setLogoUrl('');
                              setLogoError('');
                            }}
                          >
                            <Trash2 size={14} /> ลบรูป
                          </button>
                        )}
                        <p className="seller-logo-upload__hint">รองรับ JPG, PNG, WEBP • ไม่เกิน 3 MB</p>
                        {logoError && <p className="seller-logo-upload__error" role="alert">{logoError}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="seller-form-group">
                  <label className="seller-label">สโลแกนหรือคำอธิบายร้านค้า</label>
                  <textarea
                    rows={3}
                    className="seller-input"
                    placeholder="อธิบายจุดเด่นของร้านค้า สินค้าของแท้ 100% จัดส่งด่วน..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: KYC Verification */}
            {currentStep === 2 && (
              <div>
                <h2 className="seller-reg-step-title">🪪 ขั้นตอนที่ 2: ประเภทผู้ขาย & เอกสารยืนยันตัวตน KYC</h2>

                <div className="seller-type-selector">
                  <div
                    className={`seller-type-card ${sellerType === 'individual' ? 'seller-type-card--selected' : ''}`}
                    onClick={() => setSellerType('individual')}
                  >
                    <UserCheck size={32} color={sellerType === 'individual' ? '#2563eb' : '#6b7280'} />
                    <h3 className="seller-type-title">บุคคลธรรมดา (Individual)</h3>
                    <p className="seller-type-desc">สำหรับผู้ขายทั่วไป เปิดร้านเร็ว อนุมัติทันทีใน 1 นาที</p>
                  </div>
                  <div
                    className={`seller-type-card ${sellerType === 'corporate' ? 'seller-type-card--selected' : ''}`}
                    onClick={() => setSellerType('corporate')}
                  >
                    <Building2 size={32} color={sellerType === 'corporate' ? '#2563eb' : '#6b7280'} />
                    <h3 className="seller-type-title">นิติบุคคล / แบรนด์ (Corporate)</h3>
                    <p className="seller-type-desc">ยื่นขออนุมัติตราป้ายแดง 👑 Official Brand Mall</p>
                  </div>
                </div>

                {sellerType === 'individual' ? (
                  <div className="seller-form-group">
                    <label className="seller-label">เลขประจำตัวประชาชน 13 หลัก *</label>
                    <input
                      type="text"
                      maxLength={13}
                      className="seller-input"
                      placeholder="x-xxxx-xxxxx-xx-x"
                      value={idCardNo}
                      onChange={e => setIdCardNo(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="seller-form-group">
                    <label className="seller-label">เลขประจำตัวผู้เสียภาษี / เลขทะเบียนนิติบุคคล 13 หลัก *</label>
                    <input
                      type="text"
                      maxLength={13}
                      className="seller-input"
                      placeholder="0-xxxx-xxxxx-xx-x"
                      value={taxId}
                      onChange={e => setTaxId(e.target.value)}
                    />
                  </div>
                )}

                {/* VAT Status Selection Section */}
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>🧾 สถานะการจดทะเบียนภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: isVatRegistered ? '#DCFCE7' : '#F1F5F9', color: isVatRegistered ? '#15803D' : '#64748B', fontWeight: 600 }}>
                          {isVatRegistered ? 'จด ภ.พ.20 แล้ว' : 'ยังไม่ได้จด VAT'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
                        {isVatRegistered
                          ? 'ร้านค้าจะได้รับระบบ e-Tax Invoice อัตโนมัติ และแสดงป้าย "ออกใบกำกับภาษีได้" บนสินค้า'
                          : 'ร้านค้าออกได้เฉพาะใบเสร็จรับเงิน (Receipt) ทั่วไป โดยไม่มีการคำนวณ VAT 7%'}
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={isVatRegistered}
                        onChange={e => setIsVatRegistered(e.target.checked)}
                        style={{ width: '1.25rem', height: '1.25rem', accentColor: '#2563EB', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>ร้านนี้จด VAT</span>
                    </label>
                  </div>

                  {isVatRegistered && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #CBD5E1' }}>
                      <div>
                        <label className="seller-label" style={{ fontSize: '0.8rem' }}>ชื่อจดทะเบียนภาษี / บริษัท *</label>
                        <input
                          type="text"
                          className="seller-input"
                          style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                          placeholder="เช่น บจก. เทคโปร ดีเวลลอปเมนท์"
                          value={taxCompanyName}
                          onChange={e => setTaxCompanyName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="seller-label" style={{ fontSize: '0.8rem' }}>รหัสสาขา (Branch Code) *</label>
                        <input
                          type="text"
                          maxLength={5}
                          className="seller-input"
                          style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                          placeholder="00000 (สำนักงานใหญ่)"
                          value={taxBranchCode}
                          onChange={e => setTaxBranchCode(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Warehouse Return Address */}
            {currentStep === 3 && (
              <div>
                <h2 className="seller-reg-step-title">📍 ขั้นตอนที่ 3: ที่อยู่คลังสินค้า & การเข้ารับพัสดุ</h2>
                <div className="seller-form-group">
                  <label className="seller-label">ที่อยู่คลังสินค้า / จุดส่งคืนพัสดุ *</label>
                  <input
                    type="text"
                    className="seller-input"
                    placeholder="อาคาร เลขที่ ซอย ถนน แขวง/ตำบล"
                    value={warehouseAddress}
                    onChange={e => setWarehouseAddress(e.target.value)}
                  />
                </div>
                <div className="seller-grid-2">
                  <div className="seller-form-group">
                    <label className="seller-label">จังหวัด *</label>
                    <input
                      type="text"
                      className="seller-input"
                      value={province}
                      onChange={e => setProvince(e.target.value)}
                    />
                  </div>
                  <div className="seller-form-group">
                    <label className="seller-label">รหัสไปรษณีย์ *</label>
                    <input
                      type="text"
                      className="seller-input"
                      placeholder="10xxx"
                      value={postalCode}
                      onChange={e => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Bank Payout Account */}
            {currentStep === 4 && (
              <div>
                <h2 className="seller-reg-step-title">💳 ขั้นตอนที่ 4: บัญชีธนาคารสำหรับรับเงินโอน (Payouts)</h2>
                <div className="seller-form-group">
                  <label className="seller-label">ธนาคาร *</label>
                  <select className="seller-input" value={bankName} onChange={e => setBankName(e.target.value)}>
                    <option>ธนาคารกสิกรไทย (KBANK)</option>
                    <option>ธนาคารไทยพาณิชย์ (SCB)</option>
                    <option>ธนาคารกรุงเทพ (BBL)</option>
                    <option>ธนาคารกรุงไทย (KTB)</option>
                    <option>ธนาคารกรุงศรีอยุธยา (BAY)</option>
                  </select>
                </div>
                <div className="seller-grid-2">
                  <div className="seller-form-group">
                    <label className="seller-label">เลขที่บัญชี *</label>
                    <input
                      type="text"
                      className="seller-input"
                      placeholder="xxx-x-xxxxx-x"
                      value={bankAccountNo}
                      onChange={e => setBankAccountNo(e.target.value)}
                    />
                  </div>
                  <div className="seller-form-group">
                    <label className="seller-label">ชื่อบัญชี (ตรงตามบัตรประชาชน/นิติบุคคล) *</label>
                    <input
                      type="text"
                      className="seller-input"
                      placeholder="นาย/นาง/บจก. ..."
                      value={accountName}
                      onChange={e => setAccountName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Actions */}
            <div className="seller-reg-actions">
              {currentStep > 1 ? (
                <button className="seller-btn-outline" onClick={() => setCurrentStep((prev) => (prev - 1) as any)}>
                  <ArrowLeft size={16} /> ย้อนกลับ
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button className="seller-btn-primary" onClick={() => setCurrentStep((prev) => (prev + 1) as any)}>
                  ถัดไป <ArrowRight size={16} />
                </button>
              ) : (
                <button className="seller-btn-primary" disabled={isSubmitting} onClick={handleSubmitStoreRegistration}>
                  {isSubmitting ? 'กำลังส่งข้อมูลเปิดร้าน...' : 'ยืนยันสมัครเปิดร้านค้าฟรี 🚀'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default SellerRegisterPage;
