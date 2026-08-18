// src/pages/ComparePage.tsx — Movemall Responsive Product Comparison Tool

import { useState, useMemo } from 'react';
import { 
  Scale, 
  ShoppingBag, 
  Star, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  ArrowLeftRight, 
  Search, 
  X, 
  Share2, 
  Check, 
  Sparkles, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { categories } from '../data/products';
import { allMarketplaceProducts } from '../data/mockProductsData';
import { stores } from '../data/stores';
import type { Product } from '../types';
import './ComparePage.css';

interface ComparePageProps {
  onAddToCart: (product: Product) => void;
}

export function ComparePage({ onAddToCart }: ComparePageProps) {
  // Category state
  const [selectedCat, setSelectedCat] = useState<string>('electronics');
  
  // Products currently in comparison (Max 4)
  const defaultItems = useMemo(() => {
    const items = allMarketplaceProducts.filter(p => p.category === 'electronics');
    return items.slice(0, 3);
  }, []);

  const [compareItems, setCompareItems] = useState<Product[]>(defaultItems);
  
  // Mobile View Mode: 'dual' (1 vs 1) or 'table' (All items scrollable)
  const [mobileMode, setMobileMode] = useState<'dual' | 'table'>('dual');
  const [dualIndexA, setDualIndexA] = useState<number>(0);
  const [dualIndexB, setDualIndexB] = useState<number>(1);

  // Filters & Options
  const [highlightDiff, setHighlightDiff] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  
  // Add Product Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [modalCatFilter, setModalCatFilter] = useState<string>('all');
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  // Switch category updates comparison list if empty
  function handleSelectCategory(catId: string) {
    setSelectedCat(catId);
    const newItems = allMarketplaceProducts.filter(p => p.category === catId);
    setCompareItems(newItems.slice(0, 3));
    setDualIndexA(0);
    setDualIndexB(Math.min(1, newItems.length - 1));
  }

  // Remove an item
  function handleRemoveItem(id: string) {
    if (compareItems.length <= 1) {
      alert('ต้องมีสินค้าอย่างน้อย 1 รายการสำหรับการเปรียบเทียบ');
      return;
    }
    const updated = compareItems.filter(p => p.id !== id);
    setCompareItems(updated);
    setDualIndexA(0);
    setDualIndexB(Math.min(1, updated.length - 1));
  }

  // Swap dual mode items
  function handleSwapDual() {
    const temp = dualIndexA;
    setDualIndexA(dualIndexB);
    setDualIndexB(temp);
  }

  // Open modal to add or replace
  function openAddModal(indexToReplace: number | null = null) {
    setReplaceIndex(indexToReplace);
    setModalCatFilter(selectedCat);
    setModalSearchQuery('');
    setIsModalOpen(true);
  }

  // Add selected product to comparison
  function handleAddProduct(product: Product) {
    if (replaceIndex !== null) {
      const updated = [...compareItems];
      updated[replaceIndex] = product;
      setCompareItems(updated);
    } else {
      if (compareItems.some(p => p.id === product.id)) {
        alert('สินค้านี้อยู่ในรายการเปรียบเทียบแล้ว');
        return;
      }
      if (compareItems.length >= 4) {
        alert('สามารถเปรียบเทียบสินค้าได้สูงสุด 4 รายการพร้อมกัน');
        return;
      }
      setCompareItems([...compareItems, product]);
    }
    setIsModalOpen(false);
  }

  // Share comparison
  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  }

  // Modal filtered products
  const availableModalProducts = useMemo(() => {
    return allMarketplaceProducts.filter(p => {
      const matchCat = modalCatFilter === 'all' || p.category === modalCatFilter;
      const matchQuery = !modalSearchQuery || 
        p.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(modalSearchQuery.toLowerCase()));
      const notAlreadyIn = !compareItems.some(item => item.id === p.id);
      return matchCat && matchQuery && notAlreadyIn;
    });
  }, [modalCatFilter, modalSearchQuery, compareItems]);

  // Determine Highlights / Winners
  const lowestPriceId = useMemo(() => {
    if (compareItems.length === 0) return null;
    return [...compareItems].sort((a, b) => a.price - b.price)[0].id;
  }, [compareItems]);

  const highestRatingId = useMemo(() => {
    if (compareItems.length === 0) return null;
    return [...compareItems].sort((a, b) => b.rating - a.rating)[0].id;
  }, [compareItems]);

  const highestDiscountId = useMemo(() => {
    if (compareItems.length === 0) return null;
    const withDisc = compareItems.filter(p => p.originalPrice && p.originalPrice > p.price);
    if (withDisc.length === 0) return null;
    return withDisc.sort((a, b) => {
      const discA = ((a.originalPrice! - a.price) / a.originalPrice!) * 100;
      const discB = ((b.originalPrice! - b.price) / b.originalPrice!) * 100;
      return discB - discA;
    })[0].id;
  }, [compareItems]);

  // Active items for Dual View (Mobile)
  const dualItemA = compareItems[dualIndexA] || compareItems[0];
  const dualItemB = compareItems[dualIndexB] || compareItems[1] || compareItems[0];

  return (
    <main className="compare-page">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="compare-toast">
          <Check size={16} /> คัดลอกลิงก์เปรียบเทียบเรียบร้อยแล้ว!
        </div>
      )}

      <div className="compare-container">
        {/* Header Section */}
        <div className="compare-header">
          <div className="compare-header-left">
            <div className="compare-badge-pill">
              <Scale size={14} /> Smart Comparison Tool
            </div>
            <h1 className="compare-title">
              เปรียบเทียบสเปกสินค้า (Product Comparison)
            </h1>
            <p className="compare-subtitle">
              เปรียบเทียบคุณสมบัติ ราคา รีวิว และความคุ้มค่าแบบข้างต่อข้าง ช่วยให้คุณตัดสินใจได้แม่นยำที่สุด
            </p>
          </div>

          <div className="compare-header-actions">
            <button 
              className={`compare-tool-btn ${highlightDiff ? 'compare-tool-btn--active' : ''}`}
              onClick={() => setHighlightDiff(!highlightDiff)}
              title="ไฮไลท์เฉพาะแถวที่มีสเปกต่างกัน"
            >
              <SlidersHorizontal size={14} />
              <span>{highlightDiff ? 'แสดงทุกข้อมูล' : 'เน้นจุดต่าง'}</span>
            </button>
            <button className="compare-tool-btn" onClick={handleShare}>
              <Share2 size={14} />
              <span>แชร์ผลเทียบ</span>
            </button>
          </div>
        </div>

        {/* Category Selector Bar */}
        <div className="compare-cat-bar">
          <span className="compare-cat-label">หมวดหมู่:</span>
          <div className="compare-cat-scroll">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`compare-cat-chip ${selectedCat === cat.id ? 'compare-cat-chip--active' : ''}`}
                onClick={() => handleSelectCategory(cat.id)}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View Toggle Tabs (Visible on screens < 768px) */}
        <div className="compare-mobile-controls">
          <div className="compare-mode-switch">
            <button 
              className={`compare-mode-btn ${mobileMode === 'dual' ? 'compare-mode-btn--active' : ''}`}
              onClick={() => setMobileMode('dual')}
            >
              ⚡ เทียบคู่ 1 vs 1 (อ่านง่าย)
            </button>
            <button 
              className={`compare-mode-btn ${mobileMode === 'table' ? 'compare-mode-btn--active' : ''}`}
              onClick={() => setMobileMode('table')}
            >
              📊 ตารางรวม ({compareItems.length} ชิ้น)
            </button>
          </div>

          {mobileMode === 'dual' && compareItems.length >= 2 && (
            <div className="compare-dual-selectors">
              <div className="compare-dual-select-group">
                <label>สินค้าฝั่งซ้าย (A):</label>
                <select 
                  value={dualIndexA} 
                  onChange={(e) => setDualIndexA(Number(e.target.value))}
                  className="compare-select"
                >
                  {compareItems.map((item, idx) => (
                    <option key={item.id} value={idx} disabled={idx === dualIndexB}>
                      {idx + 1}. {item.name.substring(0, 20)}...
                    </option>
                  ))}
                </select>
              </div>

              <button className="compare-swap-btn" onClick={handleSwapDual} title="สลับตำแหน่ง">
                <ArrowLeftRight size={16} />
              </button>

              <div className="compare-dual-select-group">
                <label>สินค้าฝั่งขวา (B):</label>
                <select 
                  value={dualIndexB} 
                  onChange={(e) => setDualIndexB(Number(e.target.value))}
                  className="compare-select"
                >
                  {compareItems.map((item, idx) => (
                    <option key={item.id} value={idx} disabled={idx === dualIndexA}>
                      {idx + 1}. {item.name.substring(0, 20)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* MOBILE 1 vs 1 DUAL VIEW */}
        {mobileMode === 'dual' && (
          <div className="compare-dual-container">
            {/* Sticky Dual Header Bar */}
            <div className="compare-dual-header-grid">
              {[dualItemA, dualItemB].map((product, sideIdx) => {
                if (!product) return null;
                const isLowest = product.id === lowestPriceId;
                const isTopRating = product.id === highestRatingId;
                const isTopDisc = product.id === highestDiscountId;
                return (
                  <div key={product.id} className="compare-dual-card">
                    {/* Image with Overlaid Badges */}
                    <div className="compare-img-box">
                      <img src={product.images[0]} alt={product.name} className="compare-dual-img" />
                      <div className="compare-card-badges-overlay">
                        {isLowest && <span className="badge-best-price">🏷️ คุ้มสุด</span>}
                        {isTopRating && <span className="badge-best-rating">⭐️ ดีสุด</span>}
                        {isTopDisc && <span className="badge-best-disc">🔥 ลดแรง</span>}
                      </div>
                    </div>

                    <h3 className="compare-dual-name" title={product.name}>{product.name}</h3>
                    
                    <div className="compare-dual-price-box">
                      <span className="compare-dual-price">฿{(product.price ?? 0).toLocaleString()}</span>
                      {product.originalPrice && (
                        <span className="compare-dual-orig-price">฿{(product.originalPrice ?? 0).toLocaleString()}</span>
                      )}
                    </div>

                    <button className="compare-buy-btn" onClick={() => onAddToCart(product)}>
                      <ShoppingBag size={13} /> ใส่ตะกร้า
                    </button>
                    
                    <button 
                      className="compare-sub-btn" 
                      onClick={() => openAddModal(sideIdx === 0 ? dualIndexA : dualIndexB)}
                    >
                      เปลี่ยนสินค้า
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Spec Rows for Dual View */}
            <div className="compare-dual-specs">
              <div className="compare-spec-section-title">📊 สรุปข้อมูล & สเปกเปรียบเทียบ</div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">คะแนนรีวิว</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val">
                    <span className="star-rating"><Star size={13} fill="#F59E0B" /> {dualItemA?.rating}</span>
                    <span className="sub-text">({dualItemA?.reviewCount} รีวิว)</span>
                  </div>
                  <div className="compare-spec-val">
                    <span className="star-rating"><Star size={13} fill="#F59E0B" /> {dualItemB?.rating}</span>
                    <span className="sub-text">({dualItemB?.reviewCount} รีวิว)</span>
                  </div>
                </div>
              </div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">ส่วนลดโปรโมชั่น</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val">
                    {dualItemA?.originalPrice ? (
                      <span className="discount-tag">
                        ลด {Math.round(((dualItemA.originalPrice - dualItemA.price) / dualItemA.originalPrice) * 100)}%
                      </span>
                    ) : <span className="muted-text">ราคามาตรฐาน</span>}
                  </div>
                  <div className="compare-spec-val">
                    {dualItemB?.originalPrice ? (
                      <span className="discount-tag">
                        ลด {Math.round(((dualItemB.originalPrice - dualItemB.price) / dualItemB.originalPrice) * 100)}%
                      </span>
                    ) : <span className="muted-text">ราคามาตรฐาน</span>}
                  </div>
                </div>
              </div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">การรับประกันสินค้า</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val highlight-green">
                    <ShieldCheck size={14} /> ประกันศูนย์ไทย 1 ปี
                  </div>
                  <div className="compare-spec-val highlight-green">
                    <ShieldCheck size={14} /> ประกันศูนย์ไทย 1 ปี
                  </div>
                </div>
              </div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">การจัดส่ง</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val highlight-green">✓ จัดส่งฟรี 0 บาท</div>
                  <div className="compare-spec-val highlight-green">✓ จัดส่งฟรี 0 บาท</div>
                </div>
              </div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">แท็กและคุณสมบัติเด่น</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val tags-val">
                    {(dualItemA?.tags || []).map(t => (
                      <span key={t} className="feature-tag">#{t}</span>
                    ))}
                  </div>
                  <div className="compare-spec-val tags-val">
                    {(dualItemB?.tags || []).map(t => (
                      <span key={t} className="feature-tag">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="compare-spec-row">
                <div className="compare-spec-row-label">คำอธิบายรายละเอียด</div>
                <div className="compare-spec-row-values">
                  <div className="compare-spec-val desc-val">{dualItemA?.description}</div>
                  <div className="compare-spec-val desc-val">{dualItemB?.description}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULL MULTI-COLUMN TABLE VIEW (Default on Desktop, Optional on Mobile) */}
        <div className={`compare-table-wrapper ${mobileMode === 'dual' ? 'hide-on-mobile' : ''}`}>
          <table className="compare-table">
            <thead>
              <tr className="compare-sticky-header">
                <th className="compare-corner-cell">
                  <div className="corner-label">
                    <span>สินค้า ({compareItems.length}/4)</span>
                    {compareItems.length < 4 && (
                      <button className="corner-add-btn" onClick={() => openAddModal(null)}>
                        <Plus size={12} /> เพิ่มสินค้า
                      </button>
                    )}
                  </div>
                </th>
                {compareItems.map((p, idx) => {
                  const isLowest = p.id === lowestPriceId;
                  const isTopRating = p.id === highestRatingId;
                  const isTopDisc = p.id === highestDiscountId;
                  const store = stores.find(s => s.id === p.storeId);

                  return (
                    <td key={p.id} className="compare-product-col">
                      <div className="compare-col-header">
                        <button 
                          className="compare-remove-icon-btn" 
                          onClick={() => handleRemoveItem(p.id)}
                          title="ลบออก"
                        >
                          <Trash2 size={13} />
                        </button>

                        <div className="compare-img-box">
                          <img src={p.images[0]} alt={p.name} className="compare-product-img" />
                          <div className="compare-card-badges-overlay">
                            {isLowest && <span className="badge-best-price">🏷️ คุ้มสุด</span>}
                            {isTopRating && <span className="badge-best-rating">⭐️ ดีสุด</span>}
                            {isTopDisc && <span className="badge-best-disc">🔥 ลดแรง</span>}
                          </div>
                        </div>
                        
                        {store && (
                          <div className="compare-store-pill">
                            <span>👑 {store.name}</span>
                          </div>
                        )}

                        <h3 className="compare-product-name" title={p.name}>{p.name}</h3>
                        
                        <div className="compare-product-price-box">
                          <span className="compare-product-price">฿{(p.price ?? 0).toLocaleString()}</span>
                          {p.originalPrice && (
                            <span className="compare-product-orig">฿{(p.originalPrice ?? 0).toLocaleString()}</span>
                          )}
                        </div>

                        <button className="compare-buy-btn" onClick={() => onAddToCart(p)}>
                          <ShoppingBag size={14} /> ใส่ตะกร้า
                        </button>

                        <button 
                          className="compare-change-btn" 
                          onClick={() => openAddModal(idx)}
                        >
                          <ArrowLeftRight size={12} /> สลับสินค้า
                        </button>
                      </div>
                    </td>
                  );
                })}

                {/* Empty Slot if less than 4 items */}
                {compareItems.length < 4 && (
                  <td className="compare-empty-col">
                    <button className="compare-empty-slot" onClick={() => openAddModal(null)}>
                      <div className="empty-slot-circle">
                        <Plus size={24} />
                      </div>
                      <span className="empty-slot-title">+ เพิ่มสินค้าเปรียบเทียบ</span>
                      <span className="empty-slot-sub">เลือกจากแคตตาล็อก 160+ ชิ้น</span>
                    </button>
                  </td>
                )}
              </tr>
            </thead>

            <tbody>
              {/* Category Spec Header */}
              <tr className="compare-section-divider">
                <td colSpan={compareItems.length + (compareItems.length < 4 ? 2 : 1)}>
                  ⭐️ สถิติและการให้คะแนนผู้ซื้อ
                </td>
              </tr>

              <tr className={highlightDiff ? 'row-highlight' : ''}>
                <th className="compare-spec-label">คะแนนรีวิวเฉลี่ย</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell center">
                    <div className="rating-box">
                      <Star size={15} fill="#F59E0B" color="#F59E0B" />
                      <strong>{p.rating}</strong> / 5.0
                    </div>
                    <div className="review-count">({(p.reviewCount ?? 0).toLocaleString()} รีวิว)</div>
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              <tr className={highlightDiff ? 'row-highlight' : ''}>
                <th className="compare-spec-label">โปรโมชั่น & ส่วนลด</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell center">
                    {p.originalPrice ? (
                      <span className="discount-tag">
                        ลด {Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%
                      </span>
                    ) : (
                      <span className="muted-text">ราคามาตรฐาน</span>
                    )}
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              {/* Service & Guarantee Specs */}
              <tr className="compare-section-divider">
                <td colSpan={compareItems.length + (compareItems.length < 4 ? 2 : 1)}>
                  🛡️ การการันตีและบริการจัดส่ง
                </td>
              </tr>

              <tr>
                <th className="compare-spec-label">การรับประกัน</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell center highlight-green">
                    <ShieldCheck size={16} /> ประกันศูนย์ไทย 1 ปีเต็ม
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              <tr>
                <th className="compare-spec-label">บริการจัดส่ง</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell center highlight-green">
                    ✓ ส่งฟรีทั่วไทย (0 บาท)
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              <tr>
                <th className="compare-spec-label">นโยบายการคืนสินค้า</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell center">
                    คืนเงิน/สินค้าฟรีใน 15 วัน
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              {/* Features & Detailed Specs */}
              <tr className="compare-section-divider">
                <td colSpan={compareItems.length + (compareItems.length < 4 ? 2 : 1)}>
                  💻 สเปกและจุดเด่นสินค้า
                </td>
              </tr>

              <tr>
                <th className="compare-spec-label">แท็กฟีเจอร์สำคัญ</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell">
                    <div className="tags-container">
                      {(p.tags || []).map(t => (
                        <span key={t} className="feature-tag">#{t}</span>
                      ))}
                    </div>
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>

              <tr>
                <th className="compare-spec-label">คำอธิบายและสเปก</th>
                {compareItems.map(p => (
                  <td key={p.id} className="compare-val-cell desc-text">
                    {p.description}
                  </td>
                ))}
                {compareItems.length < 4 && <td className="empty-cell"></td>}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Comparison Bottom Tips */}
        <div className="compare-footer-card">
          <div className="compare-footer-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h4>💡 ทริปการช้อปอย่างคุ้มค่าบน Movemall</h4>
            <p>
              สินค้าแท้ 100% ทุกรายการได้รับการรับรองความปลอดภัย คุณสามารถใช้ <strong>Movemall Coins</strong> ร่วมกับโค้ดส่งฟรี 
              เพื่อรับส่วนลดเงินสดสูงสุดถึง 25% ในขั้นตอนชำระเงิน
            </p>
          </div>
        </div>
      </div>

      {/* ADD / SEARCH PRODUCT MODAL */}
      {isModalOpen && (
        <div className="compare-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="compare-modal" onClick={e => e.stopPropagation()}>
            <div className="compare-modal-header">
              <h3>
                <Plus size={18} />
                {replaceIndex !== null ? 'เลือกสินค้าใหม่มาแทนที่' : 'เพิ่มสินค้าเข้าตารางเปรียบเทียบ'}
              </h3>
              <button className="compare-modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="compare-modal-filters">
              <div className="compare-search-input-wrap">
                <Search size={16} />
                <input 
                  type="text"
                  placeholder="ค้นหาชื่อสินค้า แบรนด์ หรือสเปก..."
                  value={modalSearchQuery}
                  onChange={e => setModalSearchQuery(e.target.value)}
                  className="compare-modal-input"
                  autoFocus
                />
              </div>

              <select 
                value={modalCatFilter} 
                onChange={e => setModalCatFilter(e.target.value)}
                className="compare-modal-select"
              >
                <option value="all">ทุกหมวดหมู่</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Modal Product List */}
            <div className="compare-modal-list">
              {availableModalProducts.length === 0 ? (
                <div className="compare-modal-empty">
                  <Info size={32} />
                  <p>ไม่พบสินค้าที่ตรงกับคำค้นหา หรือสินค้านี้ถูกเพิ่มไปแล้ว</p>
                </div>
              ) : (
                availableModalProducts.map(product => (
                  <div key={product.id} className="compare-modal-item">
                    <img src={product.images[0]} alt={product.name} className="compare-modal-item-img" />
                    <div className="compare-modal-item-info">
                      <div className="compare-modal-item-name">{product.name}</div>
                      <div className="compare-modal-item-meta">
                        <span className="price">฿{(product.price ?? 0).toLocaleString()}</span>
                        <span className="rating">⭐️ {product.rating ?? 5} ({product.reviewCount ?? 0})</span>
                      </div>
                    </div>
                    <button 
                      className="compare-modal-select-btn"
                      onClick={() => handleAddProduct(product)}
                    >
                      เลือกชิ้นนี้
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ComparePage;
