// src/pages/NotificationsPage.tsx — Movemall Notification Center Hub

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Sparkles, LogIn, Inbox } from 'lucide-react';
import {
  fetchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type ApiNotification,
} from '../utils/api';
import './NotificationsPage.css';

interface NotificationDisplayItem {
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

function getCategoryIcon(category: string): { icon: string; iconBg: string } {
  switch (category) {
    case 'orders':
      return { icon: '📦', iconBg: '#DBEAFE' };
    case 'promos':
      return { icon: '⚡', iconBg: '#FEE2E2' };
    case 'live':
      return { icon: '🔴', iconBg: '#FEF3C7' };
    case 'vouchers':
      return { icon: '🎟️', iconBg: '#E0E7FF' };
    default:
      return { icon: '🔔', iconBg: '#F3F4F6' };
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'เมื่อสักครู่';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} วันที่แล้ว`;
  } catch {
    return 'เมื่อเร็วๆ นี้';
  }
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'promos' | 'live' | 'vouchers'>('all');
  const [notifications, setNotifications] = useState<NotificationDisplayItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('movemall_jwt_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      const token = localStorage.getItem('movemall_jwt_token');
      if (!token) {
        setIsLoggedIn(false);
        setNotifications([]);
        return;
      }

      setIsLoggedIn(true);
      setLoading(true);
      try {
        const response = await fetchUserNotifications(activeTab);
        if (response && Array.isArray(response.notifications)) {
          const mapped: NotificationDisplayItem[] = response.notifications.map((n: ApiNotification) => {
            const iconData = getCategoryIcon(n.category);
            return {
              id: n.id,
              category: n.category as 'orders' | 'promos' | 'live' | 'vouchers',
              icon: iconData.icon,
              iconBg: iconData.iconBg,
              title: n.title,
              body: n.body,
              time: formatRelativeTime(n.createdAt),
              link: n.link || '/notifications',
              unread: !n.isRead,
            };
          });
          setNotifications(mapped);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error('Could not load notifications from API:', err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [activeTab]);

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeTab);

  const unreadCount = notifications.filter(n => n.unread).length;

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead(activeTab);
      window.dispatchEvent(new Event('movemall_notif_change'));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }

  async function handleItemClick(id: string) {
    try {
      await markNotificationAsRead(id);
      window.dispatchEvent(new Event('movemall_notif_change'));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)));
  }

  return (
    <main className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-card">
          <div className="notifications-header">
            <div>
              <h1 className="notifications-title">
                <Bell size={20} style={{ color: 'var(--primary)' }} />
                การแจ้งเตือนของฉัน {isLoggedIn && unreadCount > 0 && <span style={{ color: 'var(--primary)', fontSize: 14 }}>({unreadCount} ข้อความใหม่)</span>}
              </h1>
              {isLoggedIn && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: 'var(--success, #10B981)', fontWeight: 600 }}>
                  <Sparkles size={12} /> เชื่อมต่อกับระบบแจ้งเตือนฐานข้อมูลจริง (Live Sync)
                </div>
              )}
            </div>

            {isLoggedIn && unreadCount > 0 && (
              <button className="notifications-mark-read" onClick={handleMarkAllRead}>
                <CheckCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* Category Tabs */}
          {isLoggedIn && (
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
          )}

          {/* Notifications List */}
          <div className="notifications-list">
            {!isLoggedIn ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#EFF6FF',
                    color: 'var(--primary, #2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Bell size={28} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
                  เข้าสู่ระบบเพื่อดูการแจ้งเตือน
                </h3>
                <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                  ดูออเดอร์ พัสดุ และสิทธิพิเศษ
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      background: 'var(--primary, #2563EB)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-md, 6px)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <LogIn size={16} /> เข้าสู่ระบบ
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    style={{
                      background: '#F3F4F6',
                      color: '#374151',
                      border: '1px solid #E5E7EB',
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-md, 6px)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    สมัครสมาชิก
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
                กำลังโหลดการแจ้งเตือน...
              </div>
            ) : filtered.length > 0 ? (
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
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Inbox size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, fontSize: 15, color: '#374151', margin: '0 0 4px' }}>
                  ยังไม่มีการแจ้งเตือน
                </p>
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
                  รายการใหม่จะแสดงที่นี่
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default NotificationsPage;
