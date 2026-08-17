import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Send,
  Store,
  ShieldCheck,
  CheckCheck,
  ArrowLeft,
  Search,
  Image as ImageIcon,
  Smile,
  ExternalLink,
  MoreVertical,
  Check,
  Sparkles
} from 'lucide-react';
import { stores } from '../data/stores';
import { fetchApi } from '../utils/api';
import './ChatPage.css';

interface Message {
  id: string;
  sender: 'me' | 'store';
  text: string;
  time: string;
  image?: string;
}

interface ConversationMeta {
  unreadCount: number;
  lastActive: string;
  isOnline: boolean;
}

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const storeParam = searchParams.get('store');
  const initialStoreId = stores.find(s => s.id === storeParam)?.id || stores[0].id;

  const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(storeParam ? 'chat' : 'list');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'official'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputVal, setInputVal] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Initial messages across multiple shops
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'store-techpro': [
      { id: 'm1', sender: 'store', text: 'สวัสดีครับ! ยินดีต้อนรับสู่ TechPro Official Store มีอะไรให้แอดมินดูแลสอบถามได้เลยครับ 😊', time: '10:15' },
      { id: 'm2', sender: 'me', text: 'หูฟัง Premium Pro X มีของพร้อมส่งไหมครับ?', time: '10:16' },
      { id: 'm3', sender: 'store', text: 'สินค้ามีพร้อมจัดส่งทันทีครับ สั่งซื้อวันนี้ก่อน 14:00 น. จัดส่งออกให้รอบวันนี้เลยครับผม 🚀', time: '10:17' },
    ],
    'store-fashionista': [
      { id: 'm4', sender: 'store', text: 'Fashionista Studio สวัสดีค่ะ สอบถามไซส์หรือสีเสื้อผ้าเพิ่มเติมได้นะคะ ✨', time: '11:30' },
      { id: 'm5', sender: 'store', text: 'พิเศษวันนี้! มีโปรโมชั่น ซื้อ 2 ชิ้นลดเพิ่ม 10% พร้อมส่งฟรีค่ะ 👗', time: '11:31' },
    ],
    'store-beautyglow': [
      { id: 'm6', sender: 'store', text: 'BeautyGlow Official ยินดีให้บริการค่ะ สินค้าของแท้ 100% มีใบรับรองทุกชิ้นค่ะ 💖', time: 'เมื่อวาน' },
    ],
    'store-sportmax': [
      { id: 'm7', sender: 'store', text: 'SportMax Thailand สวัสดีครับ รองเท้าวิ่งรุ่นใหม่เข้าสต็อกครบทุกไซส์แล้วนะครับ 🏃‍♂️', time: '2 วันที่แล้ว' },
    ],
  });

  // Conversation status (unread count, online status)
  const [convMeta, setConvMeta] = useState<Record<string, ConversationMeta>>({
    'store-techpro': { unreadCount: 0, lastActive: 'ออนไลน์', isOnline: true },
    'store-fashionista': { unreadCount: 2, lastActive: 'ออนไลน์เมื่อ 5 นาทีที่แล้ว', isOnline: true },
    'store-beautyglow': { unreadCount: 1, lastActive: 'ออนไลน์เมื่อ 1 ชม. ที่แล้ว', isOnline: false },
    'store-sportmax': { unreadCount: 0, lastActive: 'ออนไลน์เมื่อ 3 ชม. ที่แล้ว', isOnline: false },
  });

  // Handle URL param changes
  useEffect(() => {
    if (storeParam) {
      const found = stores.find(s => s.id === storeParam);
      if (found) {
        setSelectedStoreId(found.id);
        setMobileView('chat');
        // Clear unread
        setConvMeta(prev => ({
          ...prev,
          [found.id]: { ...prev[found.id], unreadCount: 0 }
        }));
      }
    }
  }, [storeParam]);

  // Keep window at top when switching chat on mobile
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [mobileView]);

  // Auto-scroll to bottom of message list isolated within the chat box (never scrolls window/page)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, selectedStoreId, mobileView]);

  const activeStore = stores.find(s => s.id === selectedStoreId) || stores[0];

  function handleSelectConversation(storeId: string) {
    setSelectedStoreId(storeId);
    setMobileView('chat');
    setSearchParams({ store: storeId });
    // Mark as read
    setConvMeta(prev => ({
      ...prev,
      [storeId]: { ...prev[storeId], unreadCount: 0 }
    }));
  }

  function handleBackToList() {
    setMobileView('list');
  }

  function handleSend(e?: React.FormEvent, customText?: string) {
    if (e) e.preventDefault();
    const textToSend = customText || inputVal;
    if (!textToSend.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentStoreMsgs = messages[selectedStoreId] || [];
    setMessages(prev => ({
      ...prev,
      [selectedStoreId]: [...currentStoreMsgs, newMsg],
    }));
    setInputVal('');

    // Automated simulated smart reply
    setTimeout(() => {
      let replyText = `ขอบคุณสำหรับข้อความครับ ร้าน ${activeStore.name} ได้รับคำถามแล้ว แอดมินจะรีบดูแลให้ทันทีครับ! 😊`;

      if (textToSend.includes('พร้อมส่ง') || textToSend.includes('ของไหม')) {
        replyText = `มีสินค้าพร้อมส่งสต็อกแน่นๆ เลยครับผม สั่งซื้อตอนนี้จัดส่งรอบวันนี้ได้ทันทีครับ 📦⚡`;
      } else if (textToSend.includes('รูป') || textToSend.includes('ขอดู')) {
        replyText = `ภาพถ่ายสินค้าจริงจากสต็อกตามรูปนี้เลยครับ มั่นใจได้เลยว่าของแท้ 100% สวยตรงปกแน่นอนครับ ✨`;
      } else if (textToSend.includes('ภาษี')) {
        replyText = `ทางร้านสามารถออกใบกำกับภาษีเต็มรูปแบบได้ครับ เพียงกรอกข้อมูล Tax ID ในขั้นตอนชำระเงินได้เลยครับ 🧾`;
      } else if (textToSend.includes('โค้ด') || textToSend.includes('ส่วนลด')) {
        replyText = `มีโค้ดลดพิเศษ 10% หน้าร้านค้า เก็บโค้ดหน้าร้านแล้วนำมากดสั่งซื้อได้เลยครับผม 🎟️`;
      }

      const autoReply: Message = {
        id: `reply-${Date.now()}`,
        sender: 'store',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => ({
        ...prev,
        [selectedStoreId]: [...(prev[selectedStoreId] || []), autoReply],
      }));
    }, 1100);
  }

  const quickQuestions = [
    '📦 มีสินค้าพร้อมส่งไหมครับ?',
    '📸 ขอดูรูปสินค้าจริงเพิ่มเติม',
    '🧾 ขอใบกำกับภาษีได้ไหม?',
    '🎟️ มีโค้ดส่วนลดพิเศษไหมครับ?',
  ];

  // Filter conversations
  const filteredStores = stores.filter(store => {
    const meta = convMeta[store.id] || { unreadCount: 0, isOnline: false };
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (messages[store.id] || []).some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterTab === 'unread') return meta.unreadCount > 0;
    if (filterTab === 'official') return store.badge === 'official';
    return true;
  });

  const totalUnread = Object.values(convMeta).reduce((sum, m) => sum + (m.unreadCount || 0), 0);
  const currentMsgs = messages[selectedStoreId] || [];

  return (
    <main className="chat-page">
      <div className={`chat-container chat-container--mobile-${mobileView}`}>
        {/* Sidebar / Conversation List */}
        <aside className={`chat-sidebar ${mobileView === 'list' ? 'chat-sidebar--show-mobile' : ''}`}>
          <div className="chat-sidebar__header">
            <div className="chat-sidebar__title-row">
              <button
                type="button"
                className="chat-inbox-back-btn"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }}
                aria-label="ย้อนกลับ"
                title="ย้อนกลับ"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="chat-sidebar__title">
                💬 กล่องข้อความแชท
                {totalUnread > 0 && <span className="chat-badge-count">{totalUnread}</span>}
              </h1>
            </div>

            {/* Search Input */}
            <div className="chat-search-wrap">
              <Search size={14} className="chat-search-icon" />
              <input
                type="text"
                placeholder="ค้นหาร้านค้า หรือข้อความ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="chat-search-input"
              />
            </div>

            {/* Filter Tabs */}
            <div className="chat-filter-tabs">
              <button
                className={`chat-filter-tab ${filterTab === 'all' ? 'chat-filter-tab--active' : ''}`}
                onClick={() => setFilterTab('all')}
              >
                ทั้งหมด ({stores.length})
              </button>
              <button
                className={`chat-filter-tab ${filterTab === 'unread' ? 'chat-filter-tab--active' : ''}`}
                onClick={() => setFilterTab('unread')}
              >
                ยังไม่อ่าน {totalUnread > 0 && `(${totalUnread})`}
              </button>
              <button
                className={`chat-filter-tab ${filterTab === 'official' ? 'chat-filter-tab--active' : ''}`}
                onClick={() => setFilterTab('official')}
              >
                ร้าน Mall 👑
              </button>
            </div>
          </div>

          <div className="chat-conv-list">
            {filteredStores.length === 0 ? (
              <div className="chat-conv-empty">
                <p>ไม่พบรายการแชทที่ตรงกับเงื่อนไข</p>
              </div>
            ) : (
              filteredStores.map(store => {
                const storeMsgs = messages[store.id] || [];
                const lastMsg = storeMsgs[storeMsgs.length - 1];
                const isSelected = store.id === selectedStoreId;
                const meta = convMeta[store.id] || { unreadCount: 0, isOnline: false };

                return (
                  <div
                    key={store.id}
                    className={`chat-conv-item${isSelected ? ' chat-conv-item--active' : ''}`}
                    onClick={() => handleSelectConversation(store.id)}
                  >
                    <div className="chat-avatar-wrapper">
                      <img src={store.logo} alt={store.name} className="chat-conv-avatar" />
                      {meta.isOnline && <span className="chat-online-dot" title="ออนไลน์" />}
                    </div>

                    <div className="chat-conv-info">
                      <div className="chat-conv-name">
                        <span className="chat-store-name-text">
                          {store.name}
                          {store.badge === 'official' && (
                            <span className="chat-badge-official">Mall</span>
                          )}
                        </span>
                        <span className="chat-conv-time">{lastMsg?.time || ''}</span>
                      </div>
                      <div className="chat-conv-preview-row">
                        <span className={`chat-conv-preview ${meta.unreadCount > 0 ? 'chat-conv-preview--unread' : ''}`}>
                          {lastMsg ? lastMsg.text : 'เริ่มการสนทนา'}
                        </span>
                        {meta.unreadCount > 0 && (
                          <span className="chat-item-unread-badge">{meta.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Chat Thread */}
        <section className={`chat-main ${mobileView === 'chat' ? 'chat-main--show-mobile' : ''}`}>
          {/* Chat Room Header */}
          <div className="chat-main__header">
            <div className="chat-header-left">
              {/* Back to list button on mobile */}
              <button
                className="chat-back-btn"
                onClick={handleBackToList}
                title="กลับหน้ารวมแชท"
                aria-label="ย้อนกลับไปหน้ารวมแชท"
              >
                <ArrowLeft size={18} />
                <span className="chat-back-text">แชททั้งหมด</span>
              </button>

              <div className="chat-avatar-wrapper">
                <img src={activeStore.logo} alt={activeStore.name} className="chat-conv-avatar" />
                {convMeta[activeStore.id]?.isOnline && <span className="chat-online-dot" />}
              </div>

              <div>
                <div className="chat-header-title-row">
                  <strong className="chat-header-name">{activeStore.name}</strong>
                  {activeStore.badge === 'official' && (
                    <span className="chat-badge-official">Official Mall</span>
                  )}
                </div>
                <div className="chat-header-sub">
                  <span className="chat-response-rate">● ตอบแชท {activeStore.responseRate}</span>
                  <span className="chat-status-divider">•</span>
                  <span className="chat-last-active">{convMeta[activeStore.id]?.lastActive || 'ออนไลน์'}</span>
                </div>
              </div>
            </div>

            <div className="chat-header-actions">
              <Link to={`/store/${activeStore.id}`} className="chat-visit-store-btn">
                <Store size={14} />
                <span className="chat-visit-text">หน้าร้าน</span>
              </Link>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="chat-messages" ref={messagesContainerRef}>
            <div className="chat-secure-banner">
              <ShieldCheck size={14} className="chat-secure-icon" />
              <span>การสนทนาได้รับการปกป้องโดย Movemall Buyer Protection ห้ามโอนเงินนอกระบบ</span>
            </div>

            {currentMsgs.map(msg => (
              <div
                key={msg.id}
                className={`chat-bubble-wrap chat-bubble-wrap--${msg.sender === 'me' ? 'me' : 'them'}`}
              >
                <div className={`chat-bubble chat-bubble--${msg.sender === 'me' ? 'me' : 'them'}`}>
                  {msg.text}
                </div>
                <span className="chat-time">
                  {msg.time} {msg.sender === 'me' && <CheckCheck size={12} className="chat-check-icon" />}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Questions Strip */}
          <div className="chat-quick-questions">
            <span className="chat-quick-label">
              <Sparkles size={12} /> ถามด่วน:
            </span>
            <div className="chat-quick-chips">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chat-quick-chip"
                  onClick={() => handleSend(undefined, q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <form className="chat-input-bar" onSubmit={handleSend}>
            <button type="button" className="chat-tool-btn" title="แนบรูปภาพ" onClick={() => handleSend(undefined, '📸 [ส่งรูปภาพสินค้าตัวอย่าง]')}>
              <ImageIcon size={18} />
            </button>
            <button type="button" className="chat-tool-btn" title="อีโมจิ" onClick={() => setInputVal(prev => prev + ' 😊')}>
              <Smile size={18} />
            </button>
            <input
              type="text"
              className="chat-input"
              placeholder={`พิมพ์ข้อความถึง ${activeStore.name}...`}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
            />
            <button type="submit" className="chat-send-btn">
              <Send size={15} />
              <span>ส่ง</span>
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default ChatPage;

