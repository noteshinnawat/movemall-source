// src/data/brands.ts — Famous Brands & Official Mall Data

export interface Brand {
  id: string;
  name: string;
  logo: string;
  banner: string;
  category: string;
  discountText: string;
  tagline: string;
  followers: number;
  isSuperBrand?: boolean;
}

export const famousBrands: Brand[] = [
  {
    id: 'apple',
    name: 'Apple Flagship Store',
    logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #1C1917 0%, #374151 100%)',
    category: 'electronics',
    discountText: 'ลดสูงสุด 20%',
    tagline: 'นวัตกรรมระดับโลก ของแท้ศูนย์ไทย 100%',
    followers: 2_400_000,
    isSuperBrand: true,
  },
  {
    id: 'samsung',
    name: 'Samsung Official',
    logo: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
    category: 'electronics',
    discountText: 'ลดสูงสุด 40%',
    tagline: 'สมาร์ทโฟนและเครื่องใช้ไฟฟ้าระดับพรีเมียม',
    followers: 1_900_000,
    isSuperBrand: true,
  },
  {
    id: 'sony',
    name: 'Sony Audio & Visual',
    logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #000000 0%, #18181B 100%)',
    category: 'electronics',
    discountText: 'ลดสูงสุด 30%',
    tagline: 'ระบบเสียงและภาพระดับไฮเอนด์',
    followers: 850_000,
  },
  {
    id: 'nike',
    name: 'Nike Official Store',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #18181B 0%, #E11D48 100%)',
    category: 'sports',
    discountText: 'ลดสูงสุด 50%',
    tagline: 'Just Do It. รองเท้าและชุดกีฬาของแท้',
    followers: 3_100_000,
    isSuperBrand: true,
  },
  {
    id: 'adidas',
    name: 'adidas Thailand',
    logo: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #09090B 0%, #27272A 100%)',
    category: 'sports',
    discountText: 'ลดสูงสุด 45%',
    tagline: 'Impossible is Nothing',
    followers: 2_800_000,
  },
  {
    id: 'dyson',
    name: 'Dyson Official',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #831843 0%, #DB2777 100%)',
    category: 'home',
    discountText: 'รับคูปอง ฿2,000',
    tagline: 'เทคโนโลยีดูดฝุ่นและจัดแต่งทรงผมชั้นนำ',
    followers: 920_000,
  },
  {
    id: 'loreal',
    name: "L'Oréal Paris",
    logo: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #701A75 0%, #C026D3 100%)',
    category: 'beauty',
    discountText: 'ซื้อ 1 แถม 1',
    tagline: 'เพราะคุณคู่ควร เครื่องสำอางและสกินแคร์ระดับโลก',
    followers: 1_700_000,
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi Authorized',
    logo: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=300&auto=format&fit=crop&q=80',
    banner: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)',
    category: 'electronics',
    discountText: 'ลดสูงสุด 55%',
    tagline: 'นวัตกรรมเพื่อทุกคน สมาร์ทโฮมและแก็ดเจ็ต',
    followers: 2_100_000,
  },
];
