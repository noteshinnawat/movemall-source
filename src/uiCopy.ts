export const UI_COPY = {
  cart: {
    added: (quantity: number) => `เพิ่มลงตะกร้าแล้ว · ${quantity} ชิ้น`,
    removed: 'ลบสินค้าออกจากตะกร้าแล้ว',
    cleared: 'ล้างตะกร้าแล้ว',
  },
  wishlist: {
    added: 'บันทึกสินค้าแล้ว',
    removed: 'นำออกจากรายการโปรดแล้ว',
  },
} as const;
