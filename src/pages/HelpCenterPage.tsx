// src/pages/HelpCenterPage.tsx — Help Center, How to Order, Shipping, Returns & Contact Us

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HelpCircle,
  ShoppingBag,
  Truck,
  RotateCcw,
  Mail,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import './HelpCenterPage.css';

interface HelpCenterPageProps {
  initialTab?: 'help' | 'how-to-order' | 'shipping' | 'returns' | 'contact';
}

export function HelpCenterPage({ initialTab = 'help' }: HelpCenterPageProps) {
  const location = useLocation();

  // Determine active tab from URL path
  const getTabFromPath = () => {
    if (location.pathname.includes('how-to-order')) return 'how-to-order';
    if (location.pathname.includes('shipping')) return 'shipping';
    if (location.pathname.includes('returns')) return 'returns';
    if (location.pathname.includes('contact')) return 'contact';
    return initialTab;
  };

  const [activeTab, setActiveTab] = useState<'help' | 'how-to-order' | 'shipping' | 'returns' | 'contact'>(getTabFromPath());
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Contact Form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('สอบถามการสั่งซื้อ');
  const [contactMessage, setContactMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  function handleSendContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setIsSent(true);
  }

  const faqs = [
    {
      q: 'Movemall มีระบบเก็บเงินปลายทาง (COD) หรือไม่?',
      a: 'มีครับ! Movemall รองรับการชำระเงินปลายทาง (COD) รวมถึงการโอนผ่านพร้อมเพย์/QR Code, บัตรเครดิต/เดบิต และ Mobile Banking ทุกธนาคาร',
    },
    {
      q: 'สินค้าจัดส่งใช้เวลากี่วันถึงมือผู้รับ?',
      a: 'สำหรับการจัดส่งในเขตกรุงเทพฯ และปริมณฑล ใช้เวลา 1-2 วันทำการ สำหรับต่างจังหวัดใช้เวลา 2-3 วันทำการ โดยมีบริการจัดส่งด่วน Express Delivery ในวันถัดไป',
    },
    {
      q: 'สามารถเปลี่ยนหรือขอคืนสินค้าได้อย่างไร?',
      a: 'คุณสามารถกดขอคืนสินค้าได้ภายใน 30 วันนับจากวันที่ได้รับพัสดุ ผ่านเมนู "ประวัติการสั่งซื้อ" หรือติดต่อฝ่ายบริการลูกค้า สินค้าต้องอยู่ในสภาพสมบูรณ์และมีบรรจุภัณฑ์เดิม',
    },
    {
      q: 'ต้องการสมัครเป็นผู้ขายบน Movemall ต้องทำอย่างไร?',
      a: 'คุณสามารถคลิกที่ปุ่ม "🏪 ศูนย์ผู้ขาย (Seller Centre)" บนแถบเมนูด้านบน เพื่อเปิดร้านค้าและลงขายสินค้าได้ฟรีโดยไม่มีค่าธรรมเนียมแรกเข้า',
    },
    {
      q: 'โค้ดส่งฟรีและคูปองส่วนลดใช้งานอย่างไร?',
      a: 'คุณสามารถกดเก็บโค้ดส่วนลดได้จากหน้าศูนย์รวมคูปองหรือหน้าร้านค้า เมื่ออยู่ในหน้าชำระเงิน (Checkout) ระบบจะคำนวณและหักส่วนลดให้อัตโนมัติ',
    },
  ];

  return (
    <main className="help-page">
      {/* Hero */}
      <section className="help-hero">
        <div className="container">
          <h1 className="help-hero__title">ศูนย์บริการและช่วยเหลือผู้ใช้งาน</h1>
          <p className="help-hero__subtitle">
            ค้นหาคำตอบ วิธีการสั่งซื้อ นโยบายการจัดส่ง คืนสินค้า หรือติดต่อฝ่ายบริการลูกค้า Movemall
          </p>

          <nav className="help-nav" aria-label="Help topics">
            <Link
              to="/help"
              className={`help-nav__item${activeTab === 'help' ? ' help-nav__item--active' : ''}`}
              onClick={() => setActiveTab('help')}
            >
              <HelpCircle size={15} />
              คำถามที่พบบ่อย (FAQ)
            </Link>
            <Link
              to="/how-to-order"
              className={`help-nav__item${activeTab === 'how-to-order' ? ' help-nav__item--active' : ''}`}
              onClick={() => setActiveTab('how-to-order')}
            >
              <ShoppingBag size={15} />
              วิธีสั่งซื้อสินค้า
            </Link>
            <Link
              to="/shipping"
              className={`help-nav__item${activeTab === 'shipping' ? ' help-nav__item--active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              <Truck size={15} />
              การจัดส่งสินค้า
            </Link>
            <Link
              to="/returns"
              className={`help-nav__item${activeTab === 'returns' ? ' help-nav__item--active' : ''}`}
              onClick={() => setActiveTab('returns')}
            >
              <RotateCcw size={15} />
              นโยบายการคืนสินค้า
            </Link>
            <Link
              to="/contact"
              className={`help-nav__item${activeTab === 'contact' ? ' help-nav__item--active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              <Mail size={15} />
              ติดต่อเรา
            </Link>
          </nav>
        </div>
      </section>

      <div className="container help-content">
        {/* ── FAQ TAB ── */}
        {activeTab === 'help' && (
          <div className="help-card">
            <h2 className="help-card__title">
              <HelpCircle size={18} />
              คำถามที่พบบ่อย (Frequently Asked Questions)
            </h2>
            <div className="faq-list">
              {faqs.map((faq, idx) => (
                <div key={idx} className="faq-item">
                  <button
                    className="faq-question"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    {openFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openFaq === idx && <div className="faq-answer">{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HOW TO ORDER TAB ── */}
        {activeTab === 'how-to-order' && (
          <div className="help-card">
            <h2 className="help-card__title">
              <ShoppingBag size={18} />
              ขั้นตอนการสั่งซื้อสินค้าบน Movemall
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              ช้อปสินค้าคุณภาพได้อย่างง่ายดายและปลอดภัยใน 4 ขั้นตอน:
            </p>

            <div className="help-steps">
              <div className="help-step-box">
                <div className="help-step-num">1</div>
                <h3 className="help-step-title">เลือกชมสินค้า</h3>
                <p className="help-step-desc">
                  ค้นหาสินค้าจากช่องค้นหา หรือเลือกหมวดหมู่ที่สนใจ พร้อมตรวจสอบคะแนนรีวิวจากผู้ซื้อจริง
                </p>
              </div>

              <div className="help-step-box">
                <div className="help-step-num">2</div>
                <h3 className="help-step-title">เพิ่มลงตะกร้า</h3>
                <p className="help-step-desc">
                  เลือกจำนวนสินค้าที่ต้องการ แล้วกดปุ่ม "เพิ่มลงตะกร้า" หรือ "ซื้อเลย"
                </p>
              </div>

              <div className="help-step-box">
                <div className="help-step-num">3</div>
                <h3 className="help-step-title">กรอกที่อยู่จัดส่ง</h3>
                <p className="help-step-desc">
                  ระบุชื่อ ที่อยู่ เบอร์โทรศัพท์ และเลือกช่องทางการจัดส่งที่ต้องการ
                </p>
              </div>

              <div className="help-step-box">
                <div className="help-step-num">4</div>
                <h3 className="help-step-title">ชำระเงิน</h3>
                <p className="help-step-desc">
                  เลือกวิธีชำระเงิน (พร้อมเพย์, บัตรเครดิต หรือเก็บเงินปลายทาง) แล้วกดยืนยันคำสั่งซื้อ
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
              <Link
                to="/shop"
                style={{
                  display: 'inline-block',
                  padding: '10px 24px',
                  background: 'var(--primary)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                เริ่มช้อปปิ้งเลยตอนนี้ →
              </Link>
            </div>
          </div>
        )}

        {/* ── SHIPPING TAB ── */}
        {activeTab === 'shipping' && (
          <div className="help-card">
            <h2 className="help-card__title">
              <Truck size={18} />
              ข้อมูลและการจัดส่งสินค้า (Shipping & Delivery)
            </h2>

            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                🚚 นโยบายจัดส่งฟรี
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                เมื่อคุณมียอดสั่งซื้อสินค้าครบ <strong>฿299 ขึ้นไป</strong> Movemall มอบสิทธิ์จัดส่งฟรีมาตรฐานทั่วประเทศไทยทันทีโดยไม่ต้องใช้โค้ดส่วนลด!
              </p>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              📦 พันธมิตรผู้ให้บริการขนส่ง
            </h3>
            <div className="shipping-carriers">
              <div className="carrier-card">
                <div style={{ fontSize: 24, marginBottom: 4 }}>⚡</div>
                <div className="carrier-card__name">Flash Express</div>
                <div className="carrier-card__time">1-2 วันทำการ</div>
              </div>

              <div className="carrier-card">
                <div style={{ fontSize: 24, marginBottom: 4 }}>🟧</div>
                <div className="carrier-card__name">Kerry Express</div>
                <div className="carrier-card__time">1-2 วันทำการ</div>
              </div>

              <div className="carrier-card">
                <div style={{ fontSize: 24, marginBottom: 4 }}>📮</div>
                <div className="carrier-card__name">ไปรษณีย์ไทย (EMS)</div>
                <div className="carrier-card__time">2-3 วันทำการ</div>
              </div>
            </div>
          </div>
        )}

        {/* ── RETURNS TAB ── */}
        {activeTab === 'returns' && (
          <div className="help-card">
            <h2 className="help-card__title">
              <RotateCcw size={18} />
              นโยบายการคืนสินค้าและคืนเงิน (30 Days Money Back)
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--success-subtle)', border: '1px solid hsla(142, 71%, 45%, 0.3)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <ShieldCheck size={28} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: 14, color: 'var(--success)' }}>รับประกันความพึงพอใจ 30 วัน</strong>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  หากได้รับสินค้าชำรุด เสียหาย หรือไม่ตรงตามคำสั่งซื้อ สามารถส่งคืนเพื่อเปลี่ยนสินค้าใหม่หรือขอรับเงินคืนเต็มจำนวนได้ฟรี
                </p>
              </div>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              ขั้นตอนการขอคืนสินค้า:
            </h3>
            <div className="help-steps">
              <div className="help-step-box">
                <div className="help-step-num">1</div>
                <h4 className="help-step-title">แจ้งขอคืนสินค้า</h4>
                <p className="help-step-desc">เข้าไปที่เมนูประวัติการสั่งซื้อ แล้วกดปุ่ม "ขอคืนสินค้า" พร้อมแนบรูปถ่าย</p>
              </div>
              <div className="help-step-box">
                <div className="help-step-num">2</div>
                <h4 className="help-step-title">พนักงานเข้ารับพัสดุ</h4>
                <p className="help-step-desc">บริการเข้ารับพัสดุคืนถึงหน้าบ้านฟรี ไม่มีค่าใช้จ่าย</p>
              </div>
              <div className="help-step-box">
                <div className="help-step-num">3</div>
                <h4 className="help-step-title">รับเงินคืน</h4>
                <p className="help-step-desc">เงินคืนจะโอนเข้าบัญชีเดิมของคุณภายใน 1-3 วันทำการหลังร้านค้าตรวจรับ</p>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTACT US TAB ── */}
        {activeTab === 'contact' && (
          <div className="help-card">
            <h2 className="help-card__title">
              <Mail size={18} />
              ติดต่อฝ่ายบริการลูกค้า Movemall
            </h2>

            <div className="contact-grid">
              <div className="contact-info-list">
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  ทีมงาน Movemall พร้อมดูแลและช่วยเหลือทุกปัญหาของคุณทุกวัน จันทร์ - อาทิตย์
                </p>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><Phone size={18} /></div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700 }}>ศูนย์บริการลูกค้า (Call Center)</h3>
                    <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>02-123-4567</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ทุกวัน 08:30 - 20:00 น.</span>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><Mail size={18} /></div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700 }}>อีเมลติดต่อฝ่ายสนับสนุน</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>support@movemall.local</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ตอบกลับภายใน 24 ชั่วโมง</span>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><MessageCircle size={18} /></div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700 }}>LINE Official Account</h3>
                    <p style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>@MovemallOfficial</p>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>แชทสอบถามแอดมินแบบเรียลไทม์</span>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                {isSent ? (
                  <div style={{ background: 'var(--surface-hover)', border: '1px solid var(--success)', padding: 'var(--space-6)', textAlign: 'center' }}>
                    <CheckCircle2 size={40} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                      ส่งข้อความของคุณเรียบร้อยแล้ว!
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                      เจ้าหน้าที่ฝ่ายบริการลูกค้าจะติดต่อกลับไปยังอีเมล <strong>{contactEmail}</strong> โดยเร็วที่สุดครับ
                    </p>
                    <button
                      className="contact-form__btn"
                      onClick={() => {
                        setIsSent(false);
                        setContactName('');
                        setContactEmail('');
                        setContactMessage('');
                      }}
                    >
                      ส่งข้อความใหม่
                    </button>
                  </div>
                ) : (
                  <form className="contact-form" onSubmit={handleSendContact}>
                    <input
                      type="text"
                      className="contact-form__input"
                      placeholder="ชื่อ-นามสกุลของคุณ *"
                      required
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                    />
                    <input
                      type="email"
                      className="contact-form__input"
                      placeholder="อีเมลของคุณ *"
                      required
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                    />
                    <select
                      className="contact-form__input"
                      value={contactSubject}
                      onChange={e => setContactSubject(e.target.value)}
                    >
                      <option value="สอบถามการสั่งซื้อ">สอบถามการสั่งซื้อสินค้า</option>
                      <option value="ติดตามสถานะพัสดุ">ติดตามสถานะพัสดุ / ขนส่ง</option>
                      <option value="แจ้งเคลมคืนสินค้า">แจ้งเปลี่ยน / คืนสินค้า</option>
                      <option value="สมัครร้านค้าผู้ขาย">ติดต่อเปิดร้านค้าผู้ขาย (Merchant)</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                    <textarea
                      className="contact-form__textarea"
                      placeholder="ระบุข้อความหรือปัญหาที่คุณต้องการสอบถาม... *"
                      required
                      value={contactMessage}
                      onChange={e => setContactMessage(e.target.value)}
                    />
                    <button type="submit" className="contact-form__btn">
                      ส่งข้อความถึงทีมงาน
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default HelpCenterPage;
