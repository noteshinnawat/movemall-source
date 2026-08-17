// src/pages/PrivacyPolicyPage.tsx — Official PDPA Privacy Policy

import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, UserCheck, ArrowLeft } from 'lucide-react';

export function PrivacyPolicyPage() {
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
            <Shield size={26} style={{ color: 'var(--primary)' }} />
            <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              นโยบายความเป็นส่วนตัว (Privacy Policy & PDPA)
            </h1>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
            มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2569 • สอดคล้องตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
          </p>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                1. ข้อมูลส่วนบุคคลที่เราเก็บรวบรวม
              </h2>
              <p>Movemall เก็บรวบรวมข้อมูลส่วนบุคคลที่จำเป็นสำหรับการให้บริการช้อปปิ้งออนไลน์ ดังนี้:</p>
              <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                <li><strong>ข้อมูลระบุตัวตน:</strong> ชื่อ-นามสกุล, เบอร์โทรศัพท์, อีเมล</li>
                <li><strong>ข้อมูลการจัดส่ง:</strong> ที่อยู่จัดส่งพัสดุ, รหัสไปรษณีย์</li>
                <li><strong>ข้อมูลการชำระเงิน:</strong> สลิปโอนเงิน PromptPay, บันทึกการทำธุรกรรม (เราไม่มีการจัดเก็บหมายเลขบัตรเครดิตเต็มบนเซิร์ฟเวอร์ของเรา)</li>
                <li><strong>ข้อมูลการใช้งาน:</strong> ประวัติคำสั่งซื้อ, สินค้าที่ถูกใจ, รายการรีวิว และคุกกี้เพื่อปรับปรุงระบบ</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                2. วัตถุประสงค์ในการประมวลผลข้อมูล
              </h2>
              <ul style={{ paddingLeft: 20 }}>
                <li>เพื่อดำเนินการสั่งซื้อและจัดส่งพัสดุไปยังที่อยู่ของคุณผ่านพันธมิตรขนส่ง (Flash Express, Kerry, J&T)</li>
                <li>เพื่อตรวจสอบและยืนยันการชำระเงิน และดำเนินการคืนเงินกรณีสินค้ามีปัญหา</li>
                <li>เพื่อติดต่อประสานงาน แจ้งเตือนสถานะพัสดุสดผ่าน SMS หรือ Push Notification</li>
                <li>เพื่อป้องกันการทุจริตและรักษาความปลอดภัยของบัญชีผู้ใช้งาน</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                3. การเปิดเผยข้อมูลแก่บุคคลภายนอก
              </h2>
              <p>
                เราจะไม่จำหน่ายหรือเปิดเผยข้อมูลส่วนบุคคลของคุณแก่บุคคลภายนอก เว้นแต่พันธมิตรที่จำเป็นต่อการให้บริการ เช่น บริษัทขนส่งพัสดุ และผู้ให้บริการเกตเวย์การชำระเงินที่ได้รับใบอนุญาตจากธนาคารแห่งประเทศไทยเท่านั้น
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                4. สิทธิของเจ้าของข้อมูลส่วนบุคคล (Data Subject Rights)
              </h2>
              <p>ตามกฎหมาย PDPA คุณมีสิทธิดังต่อไปนี้:</p>
              <ul style={{ paddingLeft: 20, marginTop: 6 }}>
                <li>สิทธิในการเข้าถึงและขอรับสำเนาข้อมูลส่วนบุคคลของคุณ</li>
                <li>สิทธิในการขอแก้ไขข้อมูลส่วนบุคคลให้ถูกต้อง เป็นปัจจุบัน</li>
                <li>สิทธิในการขอลบ ทำลาย หรือระงับการใช้ข้อมูลส่วนบุคคล</li>
                <li>สิทธิในการถอนความยินยอมในการประมวลผลข้อมูล</li>
              </ul>
              <p style={{ marginTop: 8 }}>
                หากต้องการใช้สิทธิดังกล่าว สามารถติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO) ได้ที่อีเมล: <strong>dpo@movemall.com</strong>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default PrivacyPolicyPage;
