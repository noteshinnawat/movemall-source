// src/data/liveStreams.ts — Realistic Multi-Store Live Streams & Affiliate Creator Videos

export interface LiveStreamChannel {
  id: string;
  type: 'live' | 'video'; // 'live' stream or affiliate short 'video'
  storeId: string;
  channelName: string;
  storeLogo: string;
  streamerAvatar: string;
  streamerName: string;
  caption: string;
  hashtags: string[];
  soundTitle: string;
  category: string;
  viewers: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  videoUrl: string;
  coverImage: string;
  badge: string;
  pinnedProduct: {
    id: string;
    name: string;
    image: string;
    price: number;
    originalPrice: number;
    discountPct: number;
    commissionRate?: number;
    commissionAmount?: number;
  };
  comments: { user: string; text: string; time: string; badge?: string }[];
}

export const mockLiveStreams: LiveStreamChannel[] = [
  {
    id: 'live-techpro',
    type: 'live',
    storeId: 's1',
    channelName: 'TechPro Official Store',
    storeLogo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&q=80',
    streamerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    streamerName: 'น้องแพรว • Tech Specialist',
    caption: '🔥 มหกรรมไอทีลด 50% แจกคูปองลับ ฿500 ทุก 15 นาที! หูฟัง Pro ANC ตัดเสียงรบกวนเทพมาก',
    hashtags: ['#TechProLive', '#หูฟังบลูทูธ', '#ไอทีลดราคา', '#MovemallLive'],
    soundTitle: 'เสียงต้นฉบับ - TechPro Official Studio 🎵',
    category: 'electronics',
    viewers: '2.4k',
    likesCount: 14200,
    commentsCount: 342,
    sharesCount: 128,
    videoUrl: '/videos/live-streamer-1.mp4',
    coverImage: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&q=80',
    badge: '👑 OFFICIAL MALL',
    pinnedProduct: {
      id: 'el-1',
      name: 'หูฟังไร้สาย Pro Noise Cancelling ANC แบต 40 ชม.',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
      price: 990,
      originalPrice: 1990,
      discountPct: 50,
      commissionRate: 10,
      commissionAmount: 99,
    },
    comments: [
      { user: 'กิตติชัย', text: 'หูฟังตัวนี้เสียงเบสแน่นมากไหมครับ', time: 'เมื่อสักครู่' },
      { user: 'ศิริพร', text: 'กดซื้อทันแล้วค่ะ คูปองลด 50% คุ้มมาก!', time: '1 นาทีที่แล้ว', badge: 'ผู้ซื้อตัวจริง' },
      { user: 'Tanawat', text: 'ส่งฟรีทั่วประเทศเลยไหมครับ', time: '1 นาทีที่แล้ว' },
      { user: 'Admin TechPro', text: 'ส่งฟรี 0 บาททุกออเดอร์ในไลฟ์ค่า 🎉', time: '2 นาทีที่แล้ว', badge: 'ร้านค้า' },
    ],
  },
  {
    id: 'video-affiliate-1',
    type: 'video',
    storeId: 's2',
    channelName: 'มินนี่ ป้ายยาของดี (Affiliate)',
    storeLogo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    streamerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
    streamerName: 'Minnie Review ✨',
    caption: '👗 ป้ายยาเดรสเกาหลีที่ทุกคนถามหา! ใส่แล้วหุ่นเพรียวมาก ผ้าไม่บาง ตะกร้าสีเหลืองด้านล่างเลยน้าา',
    hashtags: ['#ป้ายยาช้อปปิ้ง', '#เดรสสไตล์เกาหลี', '#ของดีบอกต่อ', '#MovemallCreator'],
    soundTitle: 'เพลงฮิตติดชาร์ต TikTok 2026 🎶',
    category: 'fashion',
    viewers: '8.9k วิว',
    likesCount: 24500,
    commentsCount: 512,
    sharesCount: 890,
    videoUrl: '/videos/live-streamer-2.mp4',
    coverImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80',
    badge: '🌟 CREATOR PICKS',
    pinnedProduct: {
      id: 'fa-1',
      name: 'เดรสแฟชั่นสไตล์มินิมอล ใส่สบาย ดีไซน์นำสมัย',
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&q=80',
      price: 490,
      originalPrice: 990,
      discountPct: 51,
      commissionRate: 15,
      commissionAmount: 73,
    },
    comments: [
      { user: 'น้องเบล', text: 'คนสูง 160 ใส่แล้วยาวประมาณไหนคะ', time: 'เมื่อสักครู่' },
      { user: 'Aommy', text: 'กดในตะกร้าแล้วค่า เนื้อผ้าดีมากก', time: '1 นาทีที่แล้ว', badge: 'แฟนตัวยง' },
      { user: 'พิชญา', text: 'ส่งไวมาก สั่งเมื่อวานได้วันนี้เลย', time: '2 นาทีที่แล้ว' },
    ],
  },
  {
    id: 'live-beautyglow',
    type: 'live',
    storeId: 's3',
    channelName: 'BeautyGlow Cosmetics',
    storeLogo: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&q=80',
    streamerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    streamerName: 'หมอฟ้า • Beauty Influencer',
    caption: '✨ สกินแคร์ลดสิว & บูสต์ผิวใส ซื้อเซรั่มแถมฟรีครีมกันแดด 1 แถม 1!',
    hashtags: ['#BeautyGlow', '#หน้าใสไร้สิว', '#สกินแคร์เกาหลี'],
    soundTitle: 'เสียงบรรยายสด - หมอฟ้าพาผิวสวย 🎙️',
    category: 'beauty',
    viewers: '3.1k',
    likesCount: 28400,
    commentsCount: 620,
    sharesCount: 240,
    videoUrl: '/videos/live-streamer-3.mp4',
    coverImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
    badge: '⭐ ร้านค้าแนะนำ',
    pinnedProduct: {
      id: 'be-1',
      name: 'เซรั่มฟื้นฟูผิวเข้มข้น Vitamin C + Hyaluron 30ml',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&q=80',
      price: 390,
      originalPrice: 890,
      discountPct: 56,
      commissionRate: 12,
      commissionAmount: 46,
    },
    comments: [
      { user: 'ดวงใจ', text: 'ผิวแพ้ง่ายใช้ได้ไหมคะหมอฟ้า', time: 'เมื่อสักครู่' },
      { user: 'หมอฟ้า (Host)', text: 'ใช้ได้แน่นอนค่ะ สูตรอ่อนโยน 0% แอลกอฮอล์', time: '1 นาทีที่แล้ว', badge: 'ผู้จัดไลฟ์' },
    ],
  },
  {
    id: 'video-affiliate-2',
    type: 'video',
    storeId: 's4',
    channelName: 'โค้ชบอย วิ่งมาราธอน (Affiliate)',
    storeLogo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80',
    streamerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    streamerName: 'Coach Boy Running 🏃',
    caption: '👟 แกะกล่องรองเท้าวิ่ง Nike Air Max 2026 ซัพพอร์ตดีดเด้ง วิ่ง 10km ไม่เจ็บเข่า กดปุ่มเหลืองซื้อได้เลย',
    hashtags: ['#รองเท้าวิ่ง', '#NikeThailand', '#ป้ายยานักวิ่ง', '#ติดตะกร้า'],
    soundTitle: 'Energy Workout Beat - High Bass 🎧',
    category: 'sports',
    viewers: '14.2k วิว',
    likesCount: 42100,
    commentsCount: 890,
    sharesCount: 1540,
    videoUrl: '/videos/live-streamer-4.mp4',
    coverImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&q=80',
    badge: '👑 OFFICIAL NIKE',
    pinnedProduct: {
      id: 'sp-1',
      name: 'รองเท้าวิ่ง Air Max Boost 2026 ซัพพอร์ตเท้าเยี่ยม',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
      price: 2190,
      originalPrice: 4500,
      discountPct: 51,
      commissionRate: 10,
      commissionAmount: 219,
    },
    comments: [
      { user: 'วรพล', text: 'ไซส์ 42.5 มีของไหมครับ', time: 'เมื่อสักครู่' },
      { user: 'RunnerThai', text: 'รุ่นนี้ใส่วิ่งมาราธอนดีมากครับ นุ่มเด้ง สั่งตามคลิปแล้ว', time: '1 นาทีที่แล้ว' },
    ],
  },
  {
    id: 'live-smarthome',
    type: 'live',
    storeId: 's5',
    channelName: 'Dyson & Smart Gadgets',
    storeLogo: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=100&q=80',
    streamerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    streamerName: 'กอล์ฟ Smart Home 🏠',
    caption: '🏠 สาธิตเครื่องดูดฝุ่นไร้สาย Cyclone Pro ดูดไรฝุ่นสะอาดหมดจด แจกส่วนลด 50%!',
    hashtags: ['#เครื่องดูดฝุ่นไร้สาย', '#SmartHome', '#ของใช้ในบ้าน'],
    soundTitle: 'เสียงบรรยายสด - Dyson Studio 🎙️',
    category: 'home',
    viewers: '1.2k',
    likesCount: 8900,
    commentsCount: 180,
    sharesCount: 65,
    videoUrl: '/videos/live-streamer-5.mp4',
    coverImage: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80',
    badge: '👑 OFFICIAL MALL',
    pinnedProduct: {
      id: 'hm-1',
      name: 'เครื่องฟอกอากาศและดูดฝุ่นอัจฉริยะ Cyclone Pro',
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&q=80',
      price: 3490,
      originalPrice: 6990,
      discountPct: 50,
      commissionRate: 10,
      commissionAmount: 349,
    },
    comments: [
      { user: 'สุพรรณี', text: 'เสียงเครื่องเงียบไหมคะ', time: 'เมื่อสักครู่' },
      { user: 'กอล์ฟ Host', text: 'เงียบมากครับ ระดับเสียงแค่ 45dB', time: '1 นาทีที่แล้ว', badge: 'ผู้จัดไลฟ์' },
    ],
  },
  {
    id: 'live-unboxing-deals',
    type: 'live',
    storeId: 's1',
    channelName: 'Movemall Mega Unboxing',
    storeLogo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100&q=80',
    streamerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    streamerName: 'เจนนี่ แกะกล่องพัสดุ 🎁',
    caption: '📦 แกะกล่องของขวัญ & กิฟต์เซ็ตยอดฮิต ลดพิเศษเฉพาะในไลฟ์เท่านั้น!',
    hashtags: ['#แกะกล่อง', '#ของขวัญ', '#Unboxing', '#FlashDeals'],
    soundTitle: 'Unboxing Delight Chill Hop 🎵',
    category: 'electronics',
    viewers: '4.8k',
    likesCount: 35100,
    commentsCount: 780,
    sharesCount: 310,
    videoUrl: '/videos/live-streamer-6.mp4',
    coverImage: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80',
    badge: '🔥 HOT LIVE',
    pinnedProduct: {
      id: 'el-2',
      name: 'กล่องของขวัญเซ็ตพรีเมียม Movemall Exclusive',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&q=80',
      price: 1290,
      originalPrice: 2590,
      discountPct: 50,
      commissionRate: 12,
      commissionAmount: 154,
    },
    comments: [
      { user: 'น้ำฝน', text: 'แพ็กเกจสวยมาก สั่งเป็นของขวัญวันเกิดเพื่อนแล้วค่า', time: 'เมื่อสักครู่' },
      { user: 'เจนนี่ Host', text: 'ขอบคุณมากค่า แถมการ์ดอวยพรฟรีทุกกล่องน้า 🎉', time: '1 นาทีที่แล้ว', badge: 'ผู้จัดไลฟ์' },
    ],
  }
];
