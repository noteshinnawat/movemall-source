// src/pages/NotificationsPage.tsx — Movemall Notification Center Hub

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Package, Zap, Radio, Ticket, CheckCheck } from 'lucide-react';
import './NotificationsPage.css';

interface NotificationItem {
  id: string;
  category: 'orders' | 'promos' | 'live' | 'vouchers';
  icon: string;
  iconBg: string;
  title: string;
  body: string;
  time: string;
  link: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n0',
    category: 'orders',
    icon: '🚨',
    iconBg: '#DBEAFE',
    title: 'พนักงานจัดส่งอยู่ห่างจากคุณอีกประมาณ 1.8 กม.!',
    body: 'พัสดุ #MM-2026-0891 กำลังเดินทางมาถึงในอีก 12 นาที กรุณาเตรียมรับสายโทรศัพท์',
    time: '2 นาทีที่แล้ว',
    link: '/tracking/MM-2026-0891',
    unread: true,
  },
  {
    id: 'n1',
    category: 'orders',
    icon: '🚚',
    iconBg: '#DBEAFE',
    title: 'พัสดุของคุณอยู่ระหว่างนำส่ง!',
    body: 'คำสั่งซื้อ #MM-2026-0891 (หูฟัง Pro ANC) พนักงานจัดส่ง Flash กำลังนำจ่ายถึงคุณวันนี้',
    time: '15 นาทีที่แล้ว',
    link: '/tracking/MM-2026-0891',
    unread: true,
  },
  {
    id: 'n2',
    category: 'promos',
    icon: '⚡',
    iconBg: '#FEE2E2',
    title: 'Flash Sale รอบ 18:00 น. เริ่มแล้ว!',
    body: 'สินค้าไอทีและสมาร์ทวอทช์ลดราคาสูงสุด 70% จับจองก่อนของจะหมด',
    time: '1 ชั่วโมงที่แล้ว',
    link: '/flash-sale',
    unread: true,
  },
  {
    id: 'n3',
    category: 'live',
    icon: '🔴',
    iconBg: '#FEF3C7',
    title: 'TechPro Official เริ่มไลฟ์สดแล้ว',
    body: 'ร่วมชมไลฟ์แจกโค้ดส่วนลด 50% เฉพาะในไลฟ์ และลุ้นรับรางวัลฟรี',
    time: '2 ชั่วโมงที่แล้ว',
    link: '/live',
    unread: true,
  },
  {
    id: 'n4',
    category: 'vouchers',
    icon: '🎟️',
    iconBg: '#E0E7FF',
    title: 'คุณได้รับโค้ดส่งฟรี ฿0',
    body: 'คูปองส่งฟรีทั่วประเทศประจำเดือนพร้อมใช้งานแล้ว กดใช้ได้ทันทีตอนชำระเงิน',
    time: '5 ชั่วโมงที่แล้ว',
    link: '/vouchers',
    unread: false,
  },
  {
    id: 'n5',
    category: 'orders',
    icon: '📦',
    iconBg: '#D1FAE5',
    title: 'คำสั่งซื้อได้รับการยืนยันแล้ว',
    body: 'ร้านค้า TechPro ได้รับออเดอร์ของคุณแล้ว กำลังดำเนินการแพ็คสินค้า',
    time: '1 วันที่แล้ว',
    link: '/orders',
    unread: false,
  },
];

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'promos' | 'live' | 'vouchers'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeTab);

  const unreadCount = notifications.filter(n => n.unread).length;

  function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }

  function handleItemClick(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  }

  return (
    <main className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-card">
          <div className="notifications-header">
            <h1 className="notifications-title">
              <Bell size={20} style={{ color: 'var(--primary)' }} />
              การแจ้งเตือนของฉัน {unreadCount > 0 && <span style={{ color: 'var(--primary)', fontSize: 14 }}>({unreadCount} ข้อความใหม่)</span>}
            </h1>
            {unreadCount > 0 && (
              <button className="notifications-mark-read" onClick={handleMarkAllRead}>
                <CheckCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="notifications-tabs">
            <button
              className={`notifications-tab-btn${activeTab === 'all' ? ' notifications-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              ทั้งหมด
            </button>
            <button
              className={`notifications-tab-btn${activeTab === 'orders' ? ' notifications-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              📦 ออเดอร์
            </button>
            <button
              className={`notifications-tab-btn${activeTab === 'promos' ? ' notifications-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('promos')}
            >
              ⚡ โปรโมชั่น
            </button>
            <button
              className={`notifications-tab-btn${activeTab === 'live' ? ' notifications-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('live')}
            >
              🔴 ไลฟ์สด
            </button>
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {filtered.length > 0 ? (
              filtered.map(item => (
                <Link
                  key={item.id}
                  to={item.link}
                  className={`notification-item${item.unread ? ' notification-item--unread' : ''}`}
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="notification-icon-box" style={{ background: item.iconBg }}>
                    {item.icon}
                  </div>
                  <div className="notification-body">
                    <div className="notification-heading">
                      <span>{item.title}</span>
                      {item.unread && <span className="notification-unread-dot" />}
                    </div>
                    <p className="notification-text">{item.body}</p>
                    <span className="notification-time">{item.time}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
                ไม่มีการแจ้งเตือนในหมวดหมู่นี้
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default NotificationsPage;
