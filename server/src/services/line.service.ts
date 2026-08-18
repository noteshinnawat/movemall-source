// server/src/services/line.service.ts — Real LINE Messaging API & LINE Login Client

export interface LineFlexMessage {
  type: 'flex';
  altText: string;
  contents: Record<string, any>;
}

export class LineService {
  private static get messagingAccessToken(): string {
    return process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN || '';
  }

  private static get loginChannelId(): string {
    return process.env.LINE_LOGIN_CHANNEL_ID || '';
  }

  private static get loginChannelSecret(): string {
    return process.env.LINE_LOGIN_CHANNEL_SECRET || '';
  }

  /**
   * ส่งข้อความ Push Message (Flex Message) ไปยังผู้ใช้ LINE รายบุคคล
   */
  public static async pushMessage(toLineUserId: string, messages: (LineFlexMessage | { type: 'text'; text: string })[]) {
    const token = this.messagingAccessToken;
    if (!token) {
      console.warn('[LINE Service] No LINE_MESSAGING_CHANNEL_ACCESS_TOKEN configured, running in simulation mode');
      return { simulated: true, success: true };
    }

    try {
      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: toLineUserId,
          messages,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error('[LINE Service] Push message failed:', response.status, errBody);
        return { success: false, error: errBody };
      }

      return { success: true };
    } catch (error) {
      console.error('[LINE Service] Error sending push message:', error);
      return { success: false, error };
    }
  }

  /**
   * ส่ง Flex Message แจ้งเตือนสถานะการจัดส่งพัสดุ (Flash Express)
   */
  public static async sendShippingAlert(toLineUserId: string, data: {
    orderId: string;
    trackingNumber: string;
    carrierName?: string;
    statusText: string;
    productName: string;
    productImage?: string;
    totalAmount: number;
    trackingUrl: string;
  }) {
    const flexCard: LineFlexMessage = {
      type: 'flex',
      altText: `🚚 พัสดุของคุณ (${data.orderId}) กำลังอยู่ระหว่างจัดส่ง!`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#1E40AF',
          paddingAll: '16px',
          contents: [
            {
              type: 'text',
              text: 'MOVEMALL LOGISTICS',
              color: '#93C5FD',
              size: 'xs',
              weight: 'bold',
              letterSpacing: '1px',
            },
            {
              type: 'text',
              text: '🚚 พัสดุของคุณอยู่ระหว่างจัดส่ง!',
              color: '#FFFFFF',
              size: 'md',
              weight: 'bold',
              margin: 'sm',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '16px',
          spacing: 'md',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'หมายเลขคำสั่งซื้อ:', color: '#6B7280', size: 'xs', flex: 2 },
                { type: 'text', text: data.orderId, color: '#111827', size: 'xs', weight: 'bold', flex: 3, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'เลขพัสดุ:', color: '#6B7280', size: 'xs', flex: 2 },
                { type: 'text', text: data.trackingNumber, color: '#2563EB', size: 'xs', weight: 'bold', flex: 3, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'สถานะล่าสุด:', color: '#6B7280', size: 'xs', flex: 2 },
                { type: 'text', text: data.statusText, color: '#059669', size: 'xs', weight: 'bold', flex: 3, align: 'end' },
              ],
            },
            { type: 'separator', margin: 'md' },
            {
              type: 'box',
              layout: 'horizontal',
              spacing: 'md',
              margin: 'md',
              contents: [
                ...(data.productImage ? [{
                  type: 'image',
                  url: data.productImage,
                  size: 'xxs',
                  aspectRatio: '1:1',
                  aspectMode: 'cover',
                  flex: 1,
                }] : []),
                {
                  type: 'box',
                  layout: 'vertical',
                  flex: 4,
                  contents: [
                    { type: 'text', text: data.productName, size: 'xs', weight: 'bold', color: '#111827', wrap: true },
                    { type: 'text', text: `รวม ฿${data.totalAmount.toLocaleString()}`, size: 'xxs', color: '#6B7280', margin: 'xs' },
                  ],
                },
              ],
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          paddingAll: '12px',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              color: '#06C755',
              height: 'sm',
              action: {
                type: 'uri',
                label: '📍 ติดตามพัสดุสดแบบ GPS',
                uri: data.trackingUrl,
              },
            },
          ],
        },
      },
    };

    return this.pushMessage(toLineUserId, [flexCard]);
  }

  /**
   * แลกเปลี่ยน OAuth Authorization Code จาก LINE Login เป็น Access Token & Profile
   */
  public static async verifyLoginCode(code: string, redirectUri: string) {
    if (!this.loginChannelId || !this.loginChannelSecret) {
      throw new Error('LINE Login credentials are not configured in environment variables');
    }

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.loginChannelId,
        client_secret: this.loginChannelSecret,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`LINE Token Exchange Failed: ${err}`);
    }

    const tokenData = await tokenRes.json() as { access_token: string; id_token?: string };

    // Fetch user profile from LINE
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      throw new Error('Failed to fetch LINE profile');
    }

    const profile = await profileRes.json() as {
      userId: string;
      displayName: string;
      pictureUrl?: string;
      statusMessage?: string;
    };

    return {
      lineUserId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || '',
      statusMessage: profile.statusMessage || '',
    };
  }
}
