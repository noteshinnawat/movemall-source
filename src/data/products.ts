// src/data/products.ts — 160+ Realistic Marketplace Products (20 items per category)

import type { Product, Category, Banner } from '../types';
import { allMarketplaceProducts } from './mockProductsData';

export const categories: Category[] = [
  {
    id: 'electronics',
    name: 'อิเล็กทรอนิกส์ & ไอที',
    icon: '💻',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=240&q=80',
    tag: 'ลดสูงสุด 70%',
    productCount: 20,
    color: 'hsl(220, 80%, 60%)',
  },
  {
    id: 'fashion',
    name: 'แฟชั่น & เครื่องแต่งกาย',
    icon: '👗',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=240&q=80',
    tag: 'ฮิตติดเทรนด์',
    productCount: 20,
    color: 'hsl(330, 75%, 60%)',
  },
  {
    id: 'beauty',
    name: 'ความงาม & ของใช้ส่วนตัว',
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=240&q=80',
    tag: 'ของแท้ 100%',
    productCount: 20,
    color: 'hsl(280, 70%, 65%)',
  },
  {
    id: 'home',
    name: 'บ้านและเครื่องใช้ไฟฟ้า',
    icon: '🏠',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=240&q=80',
    tag: 'ดีลบ้านสุดคุ้ม',
    productCount: 20,
    color: 'hsl(160, 65%, 45%)',
  },
  {
    id: 'sports',
    name: 'กีฬา & กิจกรรมกลางแจ้ง',
    icon: '⚽',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=240&q=80',
    tag: 'สปอร์ตแบรนด์ดัง',
    productCount: 20,
    color: 'hsl(25, 85%, 55%)',
  },
  {
    id: 'food',
    name: 'อาหาร & เครื่องดื่ม',
    icon: '🍜',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=240&q=80',
    tag: 'อร่อยส่งไว',
    productCount: 20,
    color: 'hsl(45, 90%, 55%)',
  },
  {
    id: 'mom-baby',
    name: 'แม่และเด็ก',
    icon: '🍼',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=240&q=80',
    tag: 'แม่ลูกปลอดภัย',
    productCount: 20,
    color: 'hsl(340, 80%, 65%)',
  },
  {
    id: 'pets',
    name: 'สัตว์เลี้ยง',
    icon: '🐾',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=240&q=80',
    tag: 'อาหาร & ของเล่น',
    productCount: 20,
    color: 'hsl(200, 75%, 50%)',
  },
];

export const banners: Banner[] = [
  {
    id: 'b1',
    title: 'Tech Mega Expo 2026',
    subtitle: 'รวมสุดยอดสมาร์ทโฟน แล็ปท็อป และอุปกรณ์ไอทีลดสูงสุด 70% + ผ่อน 0% นาน 10 เดือน',
    cta: 'ช้อปดีลไอทีเลย',
    ctaLink: '/shop?category=electronics',
    gradient: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #3B82F6 100%)',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000&q=80',
  },
  {
    id: 'b2',
    title: 'Super Brand Day — Nike x Dyson',
    subtitle: 'ดีลเด็ดแบรนด์ดังระดับโลก ลดแรงทะลุพิกัด 60% การันตีของแท้ 100% คืนเงิน 2 เท่า',
    cta: 'ช้อปแบรนด์ดัง',
    ctaLink: '/mall',
    gradient: 'linear-gradient(135deg, #831843 0%, #BE185D 60%, #EC4899 100%)',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&q=80',
  },
  {
    id: 'b3',
    title: 'Mid-Month Payday Sale',
    subtitle: 'ช้อปสนั่นวันเงินเดือนออก! แจกคูปองลดเพิ่ม ฿2,000 + โค้ดส่งฟรีทั่วไทย 0 บาท',
    cta: 'เก็บคูปองลดด่วน',
    ctaLink: '/vouchers',
    gradient: 'linear-gradient(135deg, #065F46 0%, #059669 60%, #10B981 100%)',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&q=80',
  },
];

export const subBanners = [
  {
    id: 'sub1',
    title: 'Mall แบรนด์ดังแท้ 100%',
    subtitle: 'คืนเงิน 2 เท่า • คืนฟรี 30 วัน',
    tag: '👑 SUPER BRAND',
    link: '/mall',
    bg: 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)',
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80',
  },
  {
    id: 'sub2',
    title: 'ส่งฟรีทั่วไทย 0 บาท',
    subtitle: 'ช้อปครบ ฿99 แจก Coins คืน 50%',
    tag: '🚚 FREE SHIPPING',
    link: '/vouchers',
    bg: 'linear-gradient(135deg, #7C2D12 0%, #EA580C 100%)',
    img: 'https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?w=600&q=80',
  },
];

export const products: Product[] = allMarketplaceProducts;

export const featuredProducts = products.slice(0, 8);
export const newArrivals = products.filter(p => p.badge === 'new' || p.badge === 'hot');
export const saleProducts = products.filter(p => p.badge === 'sale' || p.originalPrice);
