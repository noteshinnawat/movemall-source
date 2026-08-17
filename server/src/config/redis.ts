import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Connection สำหรับ Client ปกติ (มี Fallback หากไม่ได้เปิด Redis Daemon)
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy(times: number) {
    if (times > 3) return null; // หยุด retry เมื่อลองเกิน 3 ครั้ง เพื่อไม่ให้บล็อกเซิร์ฟเวอร์
    return Math.min(times * 100, 3000);
  },
});

let redisConnected = false;

redis.on('error', (err: { message: string }) => {
  if (redisConnected) {
    console.warn('⚠️ Redis Connection Lost:', err.message);
  }
  redisConnected = false;
});

redis.on('connect', () => {
  redisConnected = true;
  console.log('⚡ Redis Connected successfully');
});

/**
 * Cache-Aside Helper Function
 * ดึงจาก Redis ก่อน ถ้าไม่เจอดึงจาก database แล้วบันทึกลง cache ทันที
 */
export async function getCachedOrFetch<T>(
  cacheKey: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    console.warn(`Redis get warning for key ${cacheKey}:`, (err as Error).message);
  }

  // Cache Miss -> ดึงข้อมูลต้นฉบับ
  const data = await fetchFn();

  if (data !== null && data !== undefined) {
    try {
      await redis.set(cacheKey, JSON.stringify(data), 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`Redis set warning for key ${cacheKey}:`, (err as Error).message);
    }
  }

  return data;
}

/**
 * Invalidate Pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`Redis invalidate warning for pattern ${pattern}:`, (err as Error).message);
  }
}
