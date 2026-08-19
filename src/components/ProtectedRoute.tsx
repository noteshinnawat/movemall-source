// src/components/ProtectedRoute.tsx
// ── ป้องกันเส้นทางที่สงวนไว้สำหรับผู้ดูแลระบบและผู้ขาย ──
//
// ⚠️ สำคัญ: นี่เป็นการป้องกันระดับ UX เท่านั้น ไม่ใช่ขอบเขตความปลอดภัยจริง
// ผู้ใช้แก้ค่าใน localStorage ให้ผ่านหน้านี้ได้เสมอ — ด่านจริงอยู่ที่ API ฝั่งเซิร์ฟเวอร์
// ที่ตรวจ role จาก JWT (requireRole) และตรวจความเป็นเจ้าของข้อมูล (ownership middleware)
// หน้าที่ของคอมโพเนนต์นี้คือไม่แสดงหน้าจอที่ผู้ใช้ใช้งานไม่ได้ และพาไปล็อกอินให้ถูกที่

import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface StoredUser {
  role?: string;
  name?: string;
}

function readCurrentUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('movemall_user');
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

function hasToken(): boolean {
  return Boolean(localStorage.getItem('movemall_jwt_token'));
}

export interface ProtectedRouteProps {
  children: ReactNode;
  /** role ที่เข้าถึงได้ — ไม่ระบุ = แค่ต้องล็อกอิน */
  allowedRoles?: string[];
  /** หน้าที่จะพาไปเมื่อไม่มีสิทธิ์ */
  fallbackPath?: string;
}

export function ProtectedRoute({ children, allowedRoles, fallbackPath = '/login' }: ProtectedRouteProps) {
  const location = useLocation();
  const user = readCurrentUser();

  if (!user || !hasToken()) {
    // ส่งเส้นทางเดิมไปด้วย เพื่อให้ล็อกอินเสร็จแล้วกลับมาที่เดิมได้
    return <Navigate to={fallbackPath} state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = (user.role || '').toUpperCase();
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
