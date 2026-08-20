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
  Sparkles,
  Radio
} from 'lucide-react';
import { stores } from '../data/stores';
import { fetchApi } from '../utils/api';
import {
  getChatSocket,
  joinChatRoom,
  emitChatMessage,
  emitTypingStatus,
  getStoredChatHistory,
  saveStoredChatHistory,
} from '../utils/chatSocket';
import './ChatPage.css';

interface Message {
  id: string;
  sender: 'me' | 'store';
  senderId?: string;
  recipientId?: string;
  text: string;
  time: string;
  image?: string;
  createdAt?: string;
}

interface ConversationMeta {
  unreadCount: number;
  lastActive: string;
  isOnline: boolean;
}

/** ห้องแชทจริงจาก API — ร้านที่ผู้ใช้คนนี้เคยคุยด้วยเท่านั้น */
interface ApiConversation {
  storeId: string;
  lastMessage: string;
  lastMessageFromMe: boolean;
  lastMessageAt: string;
  lastMessageTime: string;
  unreadCount: number;
  storeName?: string;
  storeLogo?: string;
  isMall?: boolean;
}

/** ข้อมูลที่ใช้วาดรายการหนึ่งแถว ไม่ว่าร้านนั้นจะมีใน static data หรือไม่ */
interface ConversationView {
  id: string;
  name: string;
  logo: string;
  isMall: boolean;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
}

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const storeParam = searchParams.get('store');
  // ไม่มี ?store= ก็ยังไม่เลือกห้องใด — รอรายการจริงโหลดเสร็จแล้วค่อยเลือกห้องล่าสุด
  // เดิม default เป็น stores[0] ทำให้เปิดหน้าแชทแล้วเจอร้านที่ไม่เคยคุยด้วย
  const initialStoreId = stores.find(s => s.id === storeParam)?.id || storeParam || '';

  // ผู้ใช้ที่ล็อกอินอยู่ (ต้องมีเสมอ เพราะ /chat อยู่หลัง ProtectedRoute)
  const currentUser = (() => {
    try {
      const uStr = localStorage.getItem('movemall_user');
      return uStr ? JSON.parse(uStr) : null;
    } catch {
      return null;
    }
  })();

  // ตัวตนผู้ใช้มาจากบัญชีที่ล็อกอินเท่านั้น — เดิม fallback เป็น guest id ที่ client
  // สร้างเอง ซึ่งใครก็เดา/ปลอมเพื่อเปิดห้องแชทของคนอื่นได้ (IDOR)
  // เส้นทาง /chat ถูกครอบด้วย ProtectedRoute แล้ว จึงมี currentUser เสมอเมื่อมาถึงตรงนี้
  const [myUserId] = useState<string>(() => currentUser?.id || '');

  const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId);

  // ── Source Tracking: write source info to localStorage so seller CRM can display it ──
  useEffect(() => {
    const sourceType = searchParams.get('source'); // 'product' | 'store' | 'live' | 'video'
    const refId = searchParams.get('ref');
    const refName = searchParams.get('refName') || searchParams.get('storeId') || '';
    if (sourceType && selectedStoreId && myUserId) {
      const labelMap: Record<string, string> = {
        product: `สินค้า: ${decodeURIComponent(refName || refId || '')}`,
        store: `หน้าร้าน: ${decodeURIComponent(refName || '')}`,
        live: `ไลฟ์สด: ${decodeURIComponent(refName || refId || '')}`,
        video: `คลิปสั้น: ${decodeURIComponent(refName || refId || '')}`,
      };
      const sourceEntry = {
        source: sourceType,
        label: labelMap[sourceType] || decodeURIComponent(refName || sourceType),
        openedAt: new Date().toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }),
      };
      // Write per-store source map: movemall_chat_source_{storeId}
      try {
        const key = `movemall_chat_source_${selectedStoreId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        existing[myUserId] = sourceEntry;
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {}
    }
  }, [selectedStoreId, myUserId]); // run once per store selection

  const [mobileView, setMobileView] = useState<'list' | 'chat'>(storeParam ? 'chat' : 'list');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'official'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [isStoreTyping, setIsStoreTyping] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // ประวัติแชทจริง — เริ่มจาก cache ในเครื่อง แล้วให้ API/socket เติมของจริงทับ
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => getStoredChatHistory());

  // สถานะห้องสนทนา — ยังไม่มีแหล่งข้อมูลจริง (presence/unread ฝั่งผู้ซื้อ)
  // จึงเริ่มจากว่างเปล่า แล้วนับ unread จากข้อความที่เข้ามาจริงผ่าน socket
  const [convMeta, setConvMeta] = useState<Record<string, ConversationMeta>>({});

  // Sync total unread count to LocalStorage & Navbar
  useEffect(() => {
    const total = Object.values(convMeta).reduce((sum, m) => sum + (m.unreadCount || 0), 0);
    try {
      localStorage.setItem('movemall_chat_unread_count', String(currentUser ? total : 0));
      window.dispatchEvent(new Event('movemall_chat_change'));
    } catch {
      // Ignore
    }
  }, [convMeta, currentUser]);

  // Save to LocalStorage whenever messages change
  useEffect(() => {
    saveStoredChatHistory(messages);
  }, [messages]);

  // Connect WebSocket & Register Socket listeners
  useEffect(() => {
    const socket = getChatSocket();

    const handleConnect = () => {
      setIsSocketConnected(true);
      if (selectedStoreId) joinChatRoom(selectedStoreId, myUserId);
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    const handleReceiveMessage = (msg: any) => {
      if (!msg || !msg.text) return;
      const targetStoreId = msg.storeId || selectedStoreId;

      const formattedMsg: Message = {
        id: msg.id || `msg-${Date.now()}`,
        sender: msg.sender === 'store' || msg.senderId === targetStoreId ? 'store' : 'me',
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        text: msg.text,
        time: msg.time || new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        createdAt: msg.createdAt,
      };

      setMessages(prev => {
        const storeMsgs = prev[targetStoreId] || [];
        // Prevent duplicate message IDs or identical recent messages
        const isDuplicate = storeMsgs.some(m =>
          m.id === formattedMsg.id ||
          (m.sender === formattedMsg.sender && m.text === formattedMsg.text && m.time === formattedMsg.time)
        );
        if (isDuplicate) return prev;

        // นับ unread จากข้อความที่เข้ามาจริง แทนตัวเลขที่เคย hardcode ไว้
        if (formattedMsg.sender === 'store' && targetStoreId !== selectedStoreId) {
          setConvMeta(meta => ({
            ...meta,
            [targetStoreId]: {
              ...(meta[targetStoreId] || { lastActive: '', isOnline: false }),
              unreadCount: (meta[targetStoreId]?.unreadCount || 0) + 1,
            },
          }));
        }

        return {
          ...prev,
          [targetStoreId]: [...storeMsgs, formattedMsg],
        };
      });

      setIsStoreTyping(false);
    };

    const handleUserTyping = (data: { storeId: string; userId: string; isTyping: boolean; sender: string }) => {
      if (data.storeId === selectedStoreId && data.sender === 'store') {
        setIsStoreTyping(data.isTyping);
      }
    };

    if (socket.connected) {
      setIsSocketConnected(true);
      if (selectedStoreId) joinChatRoom(selectedStoreId, myUserId);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive_chat_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive_chat_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [selectedStoreId, myUserId]);

  // รายการห้องแชทจริงของผู้ใช้คนนี้
  const [apiConversations, setApiConversations] = useState<ApiConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      try {
        const res = await fetchApi<{ success: boolean; conversations: ApiConversation[] }>(
          '/api/chat/my-conversations'
        );
        if (!cancelled && res?.conversations) {
          setApiConversations(res.conversations);
          setConvMeta(prev => {
            const next = { ...prev };
            for (const conv of res.conversations) {
              next[conv.storeId] = {
                ...(next[conv.storeId] || { lastActive: '', isOnline: false }),
                unreadCount: conv.unreadCount,
              };
            }
            return next;
          });
        }
      } catch {
        // ออฟไลน์หรือ API ล่ม — คงรายการเท่าที่ cache ไว้ ไม่แสดงร้านปลอมมาแทน
      } finally {
        if (!cancelled) setIsLoadingConversations(false);
      }
    }

    loadConversations();
    return () => { cancelled = true; };
  }, [myUserId]);

  // เลือกห้องที่คุยล่าสุดให้อัตโนมัติ เมื่อเข้ามาที่ /chat โดยไม่ได้ระบุร้าน
  // ห้องที่ถูกเปิดค้างไว้ถือว่าอ่านแล้ว จึงต้องเคลียร์ unread ด้วย
  useEffect(() => {
    if (!selectedStoreId && apiConversations.length > 0) {
      const latest = apiConversations[0].storeId;
      setSelectedStoreId(latest);
      if (apiConversations[0].unreadCount > 0) markConversationRead(latest);
    }
  }, [apiConversations, selectedStoreId]);

  // Fetch real historical messages from Backend API whenever active store changes
  useEffect(() => {
    if (!selectedStoreId) return;
    joinChatRoom(selectedStoreId, myUserId);

    async function loadApiMessages() {
      try {
        const res = await fetchApi<{ success: boolean; messages: any[] }>(
          `/api/chat/messages?storeId=${selectedStoreId}&userId=${myUserId}`
        );
        if (res?.messages && res.messages.length > 0) {
          setMessages(prev => {
            const currentList = prev[selectedStoreId] || [];
            // Merge unique messages
            const existingIds = new Set(currentList.map(m => m.id));
            const newFromApi = res.messages.filter((m: any) => !existingIds.has(m.id));
            if (newFromApi.length === 0) return prev;
            return {
              ...prev,
              [selectedStoreId]: [...currentList, ...newFromApi],
            };
          });
        }
      } catch (err) {
        // Backend API offline or local mode — fallback gracefully
        console.debug('Backend chat API offline, operating in local sync mode');
      }
    }

    loadApiMessages();
  }, [selectedStoreId, myUserId]);

  // Handle URL param changes
  useEffect(() => {
    if (storeParam) {
      const found = stores.find(s => s.id === storeParam);
      if (found) {
        setSelectedStoreId(found.id);
        setMobileView('chat');
        markConversationRead(found.id);
      }
    }
  }, [storeParam]);

  // Keep window at top when switching chat on mobile
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [mobileView]);

  // Auto-scroll to bottom of message list
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, selectedStoreId, mobileView, isStoreTyping]);

  const staticActiveStore = stores.find(s => s.id === selectedStoreId);

  /** เคลียร์ unread ทั้งในหน้าจอและฝั่งเซิร์ฟเวอร์ */
  function markConversationRead(storeId: string) {
    setConvMeta(prev => ({
      ...prev,
      [storeId]: { ...prev[storeId], unreadCount: 0 }
    }));

    fetchApi(`/api/chat/conversations/${encodeURIComponent(storeId)}/read`, {
      method: 'PATCH',
    }).catch(() => {
      // ออฟไลน์ — ตัวเลขจะกลับมาเมื่อโหลดรายการใหม่ ซึ่งถูกต้องกว่าการกลืนไว้เงียบ ๆ
    });
  }

  function handleSelectConversation(storeId: string) {
    setSelectedStoreId(storeId);
    setMobileView('chat');
    setSearchParams({ store: storeId });
    markConversationRead(storeId);
  }

  function handleBackToList() {
    setMobileView('list');
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputVal(e.target.value);

    // Emit user typing status via WebSocket
    emitTypingStatus({
      storeId: selectedStoreId,
      userId: myUserId,
      isTyping: true,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStatus({
        storeId: selectedStoreId,
        userId: myUserId,
        isTyping: false,
      });
    }, 1500);
  }

  async function handleSend(e?: React.FormEvent, customText?: string) {
    if (e) e.preventDefault();
    const textToSend = customText || inputVal;
    if (!textToSend.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'me',
      senderId: myUserId,
      recipientId: selectedStoreId,
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. Optimistic Local State Update
    const currentStoreMsgs = messages[selectedStoreId] || [];
    setMessages(prev => ({
      ...prev,
      [selectedStoreId]: [...currentStoreMsgs, newMsg],
    }));
    setInputVal('');

    // 2. Real-time WebSocket Broadcast with unique ID
    emitChatMessage({
      id: newMsg.id,
      storeId: selectedStoreId,
      userId: myUserId,
      text: textToSend.trim(),
    });

    // 3. Persist to Backend REST API (Async)
    try {
      fetchApi('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({
          storeId: selectedStoreId,
          recipientId: selectedStoreId,
          text: textToSend.trim(),
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  const quickQuestions = [
    '📦 มีสินค้าพร้อมส่งไหมครับ?',
    '📸 ขอดูรูปสินค้าจริงเพิ่มเติม',
    '🧾 ขอใบกำกับภาษีได้ไหม?',
    '🎟️ มีโค้ดส่วนลดพิเศษไหมครับ?',
  ];

  // ── รายการห้องแชท ──
  // เดิมสร้างจาก static store list ทั้งหมด ทำให้โชว์ทุกร้านในระบบเป็นห้องแชท
  // ตอนนี้มาจากห้องที่คุยจริง แล้วเติมร้านที่กำลังเปิดอยู่เข้าไปด้วย
  // เพื่อให้ทักครั้งแรกจากหน้าสินค้า/หน้าร้านยังเห็นห้องของตัวเอง
  const conversationViews: ConversationView[] = (() => {
    const byId = new Map<string, ConversationView>();

    const resolveDisplay = (storeId: string, conv?: ApiConversation) => {
      const staticStore = stores.find(st => st.id === storeId);
      return {
        name: staticStore?.name || conv?.storeName || 'ร้านค้า',
        logo: staticStore?.logo || conv?.storeLogo || '',
        isMall: staticStore ? staticStore.badge === 'official' : Boolean(conv?.isMall),
      };
    };

    for (const conv of apiConversations) {
      const localMsgs = messages[conv.storeId] || [];
      const lastLocal = localMsgs[localMsgs.length - 1];
      byId.set(conv.storeId, {
        id: conv.storeId,
        ...resolveDisplay(conv.storeId, conv),
        lastMessage: lastLocal?.text || conv.lastMessage,
        lastTime: lastLocal?.time || conv.lastMessageTime,
        unreadCount: convMeta[conv.storeId]?.unreadCount ?? conv.unreadCount,
      });
    }

    // ห้องที่มีแต่ใน cache ในเครื่อง (ส่งไปแล้วแต่ API ยังไม่ทัน/ออฟไลน์)
    for (const storeId of Object.keys(messages)) {
      if (byId.has(storeId) || (messages[storeId] || []).length === 0) continue;
      const localMsgs = messages[storeId];
      const lastLocal = localMsgs[localMsgs.length - 1];
      byId.set(storeId, {
        id: storeId,
        ...resolveDisplay(storeId),
        lastMessage: lastLocal?.text || '',
        lastTime: lastLocal?.time || '',
        unreadCount: convMeta[storeId]?.unreadCount || 0,
      });
    }

    // ร้านที่กำลังเปิดอยู่ แม้ยังไม่เคยส่งข้อความ
    if (selectedStoreId && !byId.has(selectedStoreId)) {
      byId.set(selectedStoreId, {
        id: selectedStoreId,
        ...resolveDisplay(selectedStoreId),
        lastMessage: 'เริ่มการสนทนา',
        lastTime: '',
        unreadCount: 0,
      });
    }

    return Array.from(byId.values());
  })();

  const activeDisplay = conversationViews.find(c => c.id === selectedStoreId) || {
    id: selectedStoreId,
    name: staticActiveStore?.name || 'ร้านค้า',
    logo: staticActiveStore?.logo || '',
    isMall: staticActiveStore?.badge === 'official',
    lastMessage: '',
    lastTime: '',
    unreadCount: 0,
  };

  const filteredConversations = conversationViews.filter(conv => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = conv.name.toLowerCase().includes(query) ||
      (messages[conv.id] || []).some(m => m.text.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (filterTab === 'unread') return conv.unreadCount > 0;
    if (filterTab === 'official') return conv.isMall;
    return true;
  });

  const totalUnread = conversationViews.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
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
              {isSocketConnected && (
                <span className="chat-live-badge" title="WebSocket Live Connected">
                  <Radio size={10} className="chat-live-icon" /> สด
                </span>
              )}
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
                ทั้งหมด ({conversationViews.length})
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
            {isLoadingConversations ? (
              <div className="chat-conv-empty">
                <p>กำลังโหลดรายการแชท...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="chat-conv-empty">
                <p>{conversationViews.length === 0 ? 'ยังไม่มีการสนทนากับร้านค้า' : 'ไม่พบรายการแชทที่ตรงกับเงื่อนไข'}</p>
                {conversationViews.length === 0 && (
                  <Link to="/stores" className="chat-browse-stores-link">เลือกดูร้านค้า</Link>
                )}
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.id === selectedStoreId;

                return (
                  <div
                    key={conv.id}
                    className={`chat-conv-item${isSelected ? ' chat-conv-item--active' : ''}`}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <div className="chat-avatar-wrapper">
                      <img src={conv.logo} alt={conv.name} className="chat-conv-avatar" />
                    </div>

                    <div className="chat-conv-info">
                      <div className="chat-conv-name">
                        <span className="chat-store-name-text">
                          {conv.name}
                          {conv.isMall && <span className="chat-badge-official">Mall</span>}
                        </span>
                        <span className="chat-conv-time">{conv.lastTime}</span>
                      </div>
                      <div className="chat-conv-preview-row">
                        <span className={`chat-conv-preview ${conv.unreadCount > 0 ? 'chat-conv-preview--unread' : ''}`}>
                          {conv.lastMessage}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="chat-item-unread-badge">{conv.unreadCount}</span>
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
          {!selectedStoreId ? (
            <div className="chat-no-selection">
              <p className="chat-no-selection__title">เลือกห้องสนทนาทางซ้ายเพื่อเริ่มแชท</p>
            </div>
          ) : (
            <>
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
                  <img src={activeDisplay.logo} alt={activeDisplay.name} className="chat-conv-avatar" />
                </div>

                <div>
                  <div className="chat-header-title-row">
                    <strong className="chat-header-name">{activeDisplay.name}</strong>
                    {activeDisplay.isMall && (
                      <span className="chat-badge-official">Official Mall</span>
                    )}
                    {isSocketConnected && (
                      <span className="chat-live-badge">
                        <Radio size={9} /> เชื่อมต่อสด
                      </span>
                    )}
                  </div>
                  <div className="chat-header-sub">
                    {staticActiveStore && (
                      <span className="chat-response-rate">● ตอบแชท {staticActiveStore.responseRate}</span>
                    )}
                    {convMeta[selectedStoreId]?.lastActive && (
                      <>
                        <span className="chat-status-divider">•</span>
                        <span className="chat-last-active">{convMeta[selectedStoreId]?.lastActive}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="chat-header-actions">
                <Link to={`/store/${selectedStoreId}`} className="chat-visit-store-btn">
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

              {currentMsgs.length === 0 && (
                <div className="chat-empty-thread">
                  <p className="chat-empty-thread__title">ยังไม่มีข้อความกับร้านนี้</p>
                  <p className="chat-empty-thread__hint">ทักไปได้เลย ร้านค้าจะเห็นข้อความของคุณทันที</p>
                </div>
              )}

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

              {isStoreTyping && (
                <div className="chat-bubble-wrap chat-bubble-wrap--them">
                  <div className="chat-typing-bubble">
                    <span className="chat-typing-dot" />
                    <span className="chat-typing-dot" />
                    <span className="chat-typing-dot" />
                  </div>
                  <span className="chat-time">กำลังพิมพ์...</span>
                </div>
              )}
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
              <button
                type="button"
                className="chat-tool-btn"
                title="แนบรูปภาพ"
                onClick={() => handleSend(undefined, '📸 [ส่งรูปภาพสินค้าตัวอย่าง]')}
              >
                <ImageIcon size={18} />
              </button>
              <button
                type="button"
                className="chat-tool-btn"
                title="อีโมจิ"
                onClick={() => setInputVal(prev => prev + ' 😊')}
              >
                <Smile size={18} />
              </button>
              <input
                type="text"
                className="chat-input"
                placeholder={`พิมพ์ข้อความถึง ${activeDisplay.name}...`}
                value={inputVal}
                onChange={handleInputChange}
              />
              <button type="submit" className="chat-send-btn">
                <Send size={15} />
                <span>ส่ง</span>
              </button>
            </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default ChatPage;
