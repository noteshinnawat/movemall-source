// server/src/services/sms.service.ts — ThaiBulkSMS Smart OTP API Integration

interface StoredOtpSession {
  token?: string;
  refno?: string;
  code?: string;
  expiresAt: number;
}

// In-memory OTP Store (5-minute TTL)
const otpStore = new Map<string, StoredOtpSession>();

// Cleanup expired OTP sessions every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of otpStore.entries()) {
    if (item.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}, 2 * 60 * 1000);

export class ThaiBulkSmsService {
  private static get apiKey(): string {
    return process.env.THAIBULKSMS_API_KEY || process.env.THAIBULKSMS_APP_KEY || '';
  }

  private static get apiSecret(): string {
    return process.env.THAIBULKSMS_API_SECRET || process.env.THAIBULKSMS_APP_SECRET || '';
  }

  public static isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiSecret);
  }

  /**
   * Format phone number to 10-digit local format (e.g. 0812345678)
   */
  public static sanitizePhone(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.startsWith('66') && digitsOnly.length === 11) {
      return `0${digitsOnly.slice(2)}`;
    }
    return digitsOnly;
  }

  /**
   * Request real SMS OTP via ThaiBulkSMS Smart OTP API
   */
  public static async sendOtp(phone: string): Promise<{
    success: boolean;
    message: string;
    refno?: string;
    otpDemo?: string;
    isRealSms: boolean;
    error?: string;
  }> {
    const targetPhone = this.sanitizePhone(phone);

    if (this.isConfigured()) {
      try {
        const formData = new URLSearchParams();
        formData.append('key', this.apiKey);
        formData.append('secret', this.apiSecret);
        formData.append('msisdn', targetPhone);

        const response = await fetch('https://otp.thaibulksms.com/v2/otp/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: formData.toString(),
        });

        const resJson: any = await response.json();

        if (response.ok && resJson.status === 'success' && resJson.token) {
          console.log(`[ThaiBulkSMS Smart OTP] Dispatched real SMS to ${targetPhone} (Ref: ${resJson.refno})`);
          
          // Store token for 5 minutes verification
          otpStore.set(targetPhone, {
            token: resJson.token,
            refno: resJson.refno,
            expiresAt: Date.now() + 5 * 60 * 1000,
          });

          return {
            success: true,
            isRealSms: true,
            refno: resJson.refno,
            message: `ส่งรหัส SMS OTP จริงไปยังเบอร์ ${targetPhone} เรียบร้อยแล้ว (รหัสอ้างอิง: ${resJson.refno})`,
          };
        } else {
          console.error('[ThaiBulkSMS Smart OTP] Request failed:', resJson);
          return {
            success: false,
            isRealSms: true,
            message: resJson?.message || resJson?.error?.description || 'ไม่สามารถส่งข้อความ SMS ได้',
            error: resJson?.message || 'Smart OTP request failed',
          };
        }
      } catch (err: any) {
        console.error('[ThaiBulkSMS Smart OTP] HTTP Request Error:', err);
      }
    }

    // Demo/Development fallback
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const demoRef = Math.random().toString(36).substring(2, 7).toUpperCase();

    otpStore.set(targetPhone, {
      code: otpCode,
      refno: demoRef,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return {
      success: true,
      isRealSms: false,
      refno: demoRef,
      message: `ส่งรหัส OTP ไปยัง ${targetPhone} เรียบร้อยแล้ว (Demo Mode - Ref: ${demoRef})`,
      otpDemo: otpCode,
    };
  }

  /**
   * Verify entered OTP code with ThaiBulkSMS Smart OTP Verify API
   */
  public static async verifyOtp(phone: string, enteredOtp: string): Promise<{ success: boolean; message: string; code?: 'OTP_INVALID' | 'OTP_EXPIRED' }> {
    const targetPhone = this.sanitizePhone(phone);
    const pin = enteredOtp.trim();

    // Master test code สำหรับ QA — ใช้ได้เฉพาะนอก production เท่านั้น
    // เดิมเปิดใช้ทุก environment ทำให้ใครก็ล็อกอินเป็นเจ้าของเบอร์ใดก็ได้ด้วยรหัส 123456
    if (pin === '123456' && process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  ใช้รหัส OTP ทดสอบ 123456 (dev only)');
      return { success: true, message: 'ยืนยันรหัส OTP สำเร็จ' };
    }

    const stored = otpStore.get(targetPhone);
    if (!stored) {
      return { success: false, message: 'รหัส OTP หมดอายุ หรือยังไม่ได้กดขอรหัส', code: 'OTP_EXPIRED' };
    }

    if (stored.expiresAt < Date.now()) {
      otpStore.delete(targetPhone);
      return { success: false, message: 'รหัส OTP หมดอายุแล้ว กรุณากดขอรหัสใหม่อีกครั้ง', code: 'OTP_EXPIRED' };
    }

    // If real ThaiBulkSMS token exists, verify with ThaiBulkSMS server
    if (stored.token && this.isConfigured()) {
      try {
        const formData = new URLSearchParams();
        formData.append('key', this.apiKey);
        formData.append('secret', this.apiSecret);
        formData.append('token', stored.token);
        formData.append('pin', pin);

        const response = await fetch('https://otp.thaibulksms.com/v2/otp/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: formData.toString(),
        });

        const resJson: any = await response.json();

        if (response.ok && resJson.status === 'success') {
          console.log(`[ThaiBulkSMS Smart OTP] Verified successfully for ${targetPhone}`);
          otpStore.delete(targetPhone);
          return { success: true, message: 'ยืนยันรหัส OTP ถูกต้องเรียบร้อยแล้ว' };
        } else {
          console.warn(`[ThaiBulkSMS Smart OTP] Verify failed for ${targetPhone}:`, resJson);
          return { success: false, message: resJson?.message || 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ', code: 'OTP_INVALID' };
        }
      } catch (err: any) {
        console.error('[ThaiBulkSMS Smart OTP] Verify API Error:', err);
        return { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบรหัส OTP', code: 'OTP_INVALID' };
      }
    }

    // Demo mode local code validation
    if (stored.code && stored.code === pin) {
      otpStore.delete(targetPhone);
      return { success: true, message: 'ยืนยันรหัส OTP ถูกต้องเรียบร้อยแล้ว' };
    }

    return { success: false, message: 'รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', code: 'OTP_INVALID' };
  }
}
