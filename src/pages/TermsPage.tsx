// src/pages/TermsPage.tsx — Terms of Service & Conditions

import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckSquare } from 'lucide-react';

export function TermsPage() {
  return (
    <main style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-6))', minHeight: '100vh', background: 'var(--background)', paddingBottom: 'var(--space-16)' }}>
      <div className="container" style={{ maxWidth: 860, margin: '0 auto', padding: '0 var(--space-4)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> กลับสู่หน้าแรก
          </Link>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <FileText size={26} style={{ color: 'var(--primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              ข้อกำหนดและเงื่อนไขการใช้บริการ (Terms of Service)
            </h1>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
            ปรับปรุงล่าสุด: 16 สิงหาคม 2569 • Movemall Marketplace Platform
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                1. การยอมรับข้อกำหนด
              </h2>
              <p>
                การเข้าถึงหรือใช้งานแพลตฟอร์ม Movemall ถือว่าคุณได้อ่าน เข้าใจ และตกลงที่จะผูกพันตามข้อกำหนดและเงื่อนไขทั้งหมดเหล่านี้ หากคุณไม่ยอมรับข้อกำหนดเหล่านี้ กรุณาระงับการใช้งานแพลตฟอร์ม
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                2. บัญชีผู้ใช้งานและความปลอดภัย
              </h2>
              <p>
                ผู้ใช้งานมีหน้าที่รักษาความปลอดภัยของชื่อผู้ใช้และรหัสผ่าน และต้องรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของตนเอง หากพบการเข้าถึงโดยไม่ได้รับอนุญาตต้องแจ้งทีมงานทันที
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                3. การสั่งซื้อ การชำระเงิน และการจัดส่ง
              </h2>
              <p>
                คำสั่งซื้อจะถือว่าสมบูรณ์เมื่อระบบได้รับการยืนยันการชำระเงิน (PromptPay / บัตรเครดิต) หรือได้รับการยืนยันการเลือกเก็บเงินปลายทาง (COD) สินค้าจะถูกจัดส่งตามที่อยู่ที่ระบุไว้ในระบบ
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                4. นโยบายการคืนสินค้าและการันตี Movemall Mall
              </h2>
              <p>
                สินค้าในหมวด Movemall Mall ได้รับการการันตีของแท้ 100% (คืนเงิน 2 เท่าหากพบของปลอม) และสามารถส่งคำขอคืนสินค้าได้ภายใน 30 วันนับจากวันที่ได้รับสินค้าตามเงื่อนไขที่กำหนด
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default TermsPage;
