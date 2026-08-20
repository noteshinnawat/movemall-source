// src/components/VisualSearchModal.tsx — Movemall AI Visual Search / Lens Modal

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Search,
  Maximize2,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  Tag,
  Palette,
} from 'lucide-react';
import { VISUAL_SEARCH_SAMPLES, type VisualSample } from '../data/visualSearchSamples';
import { products } from '../data/products';
import { getStoreById } from '../data/stores';
import { getProductUrl } from '../utils/seo';
import type { Product } from '../types';
import './VisualSearchModal.css';

export interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string | null;
  onAddToCart?: (product: Product) => void;
}

type InputTab = 'upload' | 'camera' | 'samples';

interface DetectedObject {
  id: string;
  label: string;
  category: string;
  confidence: number;
  box: { top: number; left: number; width: number; height: number };
  suggestedKeywords: string[];
}

export function VisualSearchModal({
  isOpen,
  onClose,
  initialImage,
  onAddToCart,
}: VisualSearchModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<InputTab>('samples');
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [onlyMall, setOnlyMall] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with initialImage if provided
  useEffect(() => {
    if (initialImage) {
      setSelectedImage(initialImage);
      processImage(initialImage);
    }
  }, [initialImage]);

  // Reset or stop camera when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  // Stop camera stream cleanly
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraError(null);
  }

  // Start webcam
  async function startCamera() {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('เปิดกล้องไม่ได้ โปรดอนุญาตสิทธิ์หรืออัปโหลดรูปแทน');
      setCameraActive(false);
    }
  }

  // Capture frame from webcam
  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();
      setSelectedImage(dataUrl);
      processImage(dataUrl);
    }
  }

  // Handle file input change
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        processImage(result);
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle Drag & Drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        processImage(result);
      };
      reader.readAsDataURL(file);
    }
  }

  // Select Sample Demo
  function handleSelectSample(sample: VisualSample) {
    setSelectedImage(sample.thumbnail);
    setIsScanning(true);
    setTimeout(() => {
      setDetectedObjects(sample.detectedObjects);
      setSelectedObjectId(sample.detectedObjects[0]?.id || null);
      setDominantColors(sample.dominantColors);
      setCategoryFilter(sample.category);
      setIsScanning(false);
    }, 1200);
  }

  // Generic Image Processing Simulation with AI Scanner
  function processImage(imgSrc: string) {
    setIsScanning(true);
    setDetectedObjects([]);
    setSelectedObjectId(null);

    // Check if matching any preset sample
    const foundSample = VISUAL_SEARCH_SAMPLES.find(s => s.thumbnail === imgSrc);

    setTimeout(() => {
      if (foundSample) {
        setDetectedObjects(foundSample.detectedObjects);
        setSelectedObjectId(foundSample.detectedObjects[0]?.id || null);
        setDominantColors(foundSample.dominantColors);
        setCategoryFilter(foundSample.category);
      } else {
        // Synthesize dynamic AI bounding boxes & colors for uploaded/captured image
        const syntheticObjects: DetectedObject[] = [
          {
            id: 'obj-gen-1',
            label: 'วัตถุหลักที่ตรวจพบ (Primary Subject)',
            category: 'all',
            confidence: 0.96,
            box: { top: 15, left: 15, width: 70, height: 70 },
            suggestedKeywords: ['ยอดนิยม', 'คุณภาพสูง', 'ของแท้', 'พร้อมส่ง'],
          },
        ];
        setDetectedObjects(syntheticObjects);
        setSelectedObjectId('obj-gen-1');
        setDominantColors(['#2563EB', '#111827', '#F3F4F6']);
        setCategoryFilter('all');
      }
      setIsScanning(false);
    }, 1400);
  }

  // Reset Search
  function handleReset() {
    setSelectedImage(null);
    setDetectedObjects([]);
    setSelectedObjectId(null);
    setDominantColors([]);
    setSelectedColor(null);
    setCategoryFilter('all');
    stopCamera();
  }

  // Get active detected object
  const activeObject = detectedObjects.find(o => o.id === selectedObjectId);

  // Compute matched products with Visual Similarity Score
  const matchedProducts = useMemo(() => {
    if (!selectedImage) return [];

    let list = [...products];

    // Filter by category if selected
    if (categoryFilter !== 'all') {
      list = list.filter(p => p.category === categoryFilter);
    }

    // Filter Mall
    if (onlyMall) {
      list = list.filter(p => {
        const store = p.storeId ? getStoreById(p.storeId) : undefined;
        return store?.badge === 'official';
      });
    }

    // Calculate score based on keyword relevance & category
    const scoredList = list.map((p, idx) => {
      let score = 75; // base score

      if (categoryFilter === p.category) {
        score += 15;
      }

      if (activeObject?.suggestedKeywords) {
        activeObject.suggestedKeywords.forEach(kw => {
          if (
            p.name.toLowerCase().includes(kw.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(kw.toLowerCase()))
          ) {
            score += 4;
          }
        });
      }

      // Add deterministic natural variance
      score = Math.min(99, Math.max(68, score + ((p.name.length * 7 + idx * 3) % 9)));
      const store = p.storeId ? getStoreById(p.storeId) : undefined;

      return {
        ...p,
        visualMatchScore: score,
        isMall: store?.badge === 'official',
        storeName: store?.name || 'ร้านค้าทางการ Movemall',
      };
    });

    // Sort by Visual Match Score descending
    scoredList.sort((a, b) => b.visualMatchScore - a.visualMatchScore);

    return scoredList;
  }, [selectedImage, categoryFilter, onlyMall, activeObject]);

  if (!isOpen) return null;

  return (
    <div className="vsearch-overlay" onClick={onClose}>
      <div
        className="vsearch-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="ค้นหาด้วยรูปภาพ Movemall AI Lens"
      >
        {/* ── Header ── */}
        <div className="vsearch-header">
          <div className="vsearch-header-title">
            <div className="vsearch-icon-badge">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="vsearch-title">Movemall AI Lens — ค้นหาด้วยรูปภาพ</h2>
              <p className="vsearch-subtitle">
                ถ่ายหรืออัปโหลดรูปเพื่อค้นหาสินค้า
              </p>
            </div>
          </div>
          <button className="vsearch-close-btn" onClick={onClose} aria-label="ปิดหน้าต่าง">
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="vsearch-body">
          {/* Left Column: Image Input & Scanning Stage */}
          <div className="vsearch-stage">
            {!selectedImage ? (
              <div className="vsearch-input-container">
                {/* Mode Tabs */}
                <div className="vsearch-tabs">
                  <button
                    className={`vsearch-tab ${activeTab === 'samples' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('samples');
                      stopCamera();
                    }}
                  >
                    <Sparkles size={16} /> ภาพตัวอย่างยอดนิยม
                  </button>
                  <button
                    className={`vsearch-tab ${activeTab === 'upload' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('upload');
                      stopCamera();
                    }}
                  >
                    <Upload size={16} /> อัปโหลดรูปภาพ
                  </button>
                  <button
                    className={`vsearch-tab ${activeTab === 'camera' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab('camera');
                      startCamera();
                    }}
                  >
                    <Camera size={16} /> ถ่ายจากกล้องสด
                  </button>
                </div>

                {/* Tab: Samples */}
                {activeTab === 'samples' && (
                  <div className="vsearch-samples-grid">
                    <p className="vsearch-samples-hint">
                      หรือเลือกรูปตัวอย่าง
                    </p>
                    <div className="vsearch-samples-list">
                      {VISUAL_SEARCH_SAMPLES.map(sample => (
                        <div
                          key={sample.id}
                          className="vsearch-sample-card"
                          onClick={() => handleSelectSample(sample)}
                        >
                          <img
                            src={sample.thumbnail}
                            alt={sample.title}
                            className="vsearch-sample-img"
                          />
                          <div className="vsearch-sample-overlay">
                            <span className="vsearch-sample-tag">{sample.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: Upload File */}
                {activeTab === 'upload' && (
                  <div
                    className="vsearch-dropzone"
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                    <div className="vsearch-drop-icon">
                      <Upload size={36} />
                    </div>
                    <h3 className="vsearch-drop-title">ลากไฟล์รูปภาพมาวางที่นี่ หรือคลิกเพื่ออัปโหลด</h3>
                    <p className="vsearch-drop-desc">
                      รองรับไฟล์ JPG, PNG, WEBP (ความละเอียดสูงสุด 10MB)
                    </p>
                    <button type="button" className="vsearch-browse-btn">
                      เลือกรูปภาพจากเครื่อง
                    </button>
                  </div>
                )}

                {/* Tab: Live Camera */}
                {activeTab === 'camera' && (
                  <div className="vsearch-camera-stage">
                    {cameraError ? (
                      <div className="vsearch-camera-error">
                        <p>{cameraError}</p>
                        <button className="vsearch-retry-btn" onClick={startCamera}>
                          <RefreshCw size={14} /> ลองเปิดกล้องใหม่อีกครั้ง
                        </button>
                      </div>
                    ) : (
                      <div className="vsearch-viewfinder">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="vsearch-video-feed"
                        />
                        <div className="vsearch-target-box" />
                        <div className="vsearch-camera-bar">
                          <button
                            type="button"
                            className="vsearch-shutter-btn"
                            onClick={capturePhoto}
                            aria-label="ถ่ายรูป"
                          >
                            <div className="vsearch-shutter-inner" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Selected / Processing Image Viewfinder with Interactive Bounding Boxes */
              <div className="vsearch-preview-container">
                <div className="vsearch-preview-frame">
                  <img
                    src={selectedImage}
                    alt="Visual Search Query"
                    className="vsearch-preview-img"
                  />

                  {/* AI Laser Sweep Effect */}
                  {isScanning && (
                    <div className="vsearch-laser-container">
                      <div className="vsearch-laser-line" />
                      <div className="vsearch-scan-status">
                        <Sparkles size={16} className="spin-icon" /> AI กำลังวิเคราะห์ลักษณะสินค้าและตรวจจับวัตถุ...
                      </div>
                    </div>
                  )}

                  {/* Detected Object Bounding Boxes */}
                  {!isScanning &&
                    detectedObjects.map(obj => (
                      <div
                        key={obj.id}
                        className={`vsearch-bounding-box ${selectedObjectId === obj.id ? 'active' : ''}`}
                        style={{
                          top: `${obj.box.top}%`,
                          left: `${obj.box.left}%`,
                          width: `${obj.box.width}%`,
                          height: `${obj.box.height}%`,
                        }}
                        onClick={() => {
                          setSelectedObjectId(obj.id);
                          if (obj.category && obj.category !== 'all') {
                            setCategoryFilter(obj.category);
                          }
                        }}
                      >
                        <div className="vsearch-box-tag">
                          <span>{obj.label}</span>
                          <span className="vsearch-box-conf">
                            {Math.round(obj.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* AI Feature Inspection Bar */}
                {!isScanning && (
                  <div className="vsearch-features-bar">
                    <div className="vsearch-features-header">
                      <div className="vsearch-features-left">
                        <Tag size={14} />
                        <span className="vsearch-features-title">วัตถุที่ตรวจพบ:</span>
                      </div>
                      <button className="vsearch-change-btn" onClick={handleReset}>
                        <RefreshCw size={12} /> สแกนรูปอื่น
                      </button>
                    </div>

                    {/* Detected Object Tags */}
                    <div className="vsearch-tags-row">
                      {detectedObjects.map(obj => (
                        <button
                          key={obj.id}
                          className={`vsearch-object-pill ${selectedObjectId === obj.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedObjectId(obj.id);
                            if (obj.category && obj.category !== 'all') {
                              setCategoryFilter(obj.category);
                            }
                          }}
                        >
                          <Check size={12} className="vsearch-pill-check" />
                          <span>{obj.label}</span>
                          <span className="vsearch-pill-pct">
                            {Math.round(obj.confidence * 100)}%
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Color Palette Swatches */}
                    {dominantColors.length > 0 && (
                      <div className="vsearch-colors-row">
                        <Palette size={14} className="vsearch-color-icon" />
                        <span className="vsearch-color-label">โทนสีหลัก:</span>
                        <div className="vsearch-swatches">
                          {dominantColors.map((color, cIdx) => (
                            <button
                              key={cIdx}
                              className={`vsearch-swatch ${selectedColor === color ? 'selected' : ''}`}
                              style={{ backgroundColor: color }}
                              onClick={() =>
                                setSelectedColor(selectedColor === color ? null : color)
                              }
                              title={`โทนสี ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Search Results */}
          <div className="vsearch-results-panel">
            {/* Filter Bar */}
            <div className="vsearch-filter-bar">
              <div className="vsearch-filter-title">
                <SlidersHorizontal size={14} />
                <span>
                  ผลการค้นหา {matchedProducts.length > 0 ? `(${matchedProducts.length} รายการ)` : ''}
                </span>
              </div>
              <div className="vsearch-filter-actions">
                <label className="vsearch-mall-toggle">
                  <input
                    type="checkbox"
                    checked={onlyMall}
                    onChange={e => setOnlyMall(e.target.checked)}
                  />
                  <span>👑 เฉพาะ Mall แท้</span>
                </label>
              </div>
            </div>

            {/* Results List */}
            {isScanning ? (
              <div className="vsearch-loading-state">
                <div className="vsearch-spinner" />
                <p>กำลังค้นหาสินค้าที่ใกล้เคียง...</p>
              </div>
            ) : !selectedImage ? (
              <div className="vsearch-empty-prompt">
                <div className="vsearch-empty-icon">📷</div>
                <h3>เลือกรูปภาพเพื่อเริ่มการค้นหา</h3>
                <p>
                  เปรียบเทียบรูปทรง สไตล์ และโทนสี
                </p>
              </div>
            ) : matchedProducts.length === 0 ? (
              <div className="vsearch-no-results">
                <Search size={32} />
                <h3>ไม่พบสินค้าที่ใกล้เคียงกับเงื่อนไขนี้</h3>
                <p>ลองปิดตัวกรอง หรือเลือกสแกนรูปภาพอื่น</p>
                <button
                  className="vsearch-clear-filter-btn"
                  onClick={() => {
                    setCategoryFilter('all');
                    setOnlyMall(false);
                  }}
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div className="vsearch-products-grid">
                {matchedProducts.map(prod => {
                  const store = prod.storeId ? getStoreById(prod.storeId) : undefined;
                  const isMall = store?.badge === 'official';
                  return (
                    <div key={prod.id} className="vsearch-prod-card">
                      {/* Visual Match Badge */}
                      <div className="vsearch-match-badge">
                        <Sparkles size={11} />
                        <span>{prod.visualMatchScore}% ตรงกัน</span>
                      </div>

                      {isMall && <div className="vsearch-mall-badge">MALL</div>}

                      <div
                        className="vsearch-prod-thumb-wrap"
                        onClick={() => {
                          onClose();
                          navigate(getProductUrl(prod));
                        }}
                      >
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="vsearch-prod-thumb"
                        />
                      </div>

                      <div className="vsearch-prod-details">
                        <div className="vsearch-prod-store">{store?.name || 'Movemall Store'}</div>
                      <h4
                        className="vsearch-prod-title"
                        title={prod.name}
                        onClick={() => {
                          onClose();
                          navigate(getProductUrl(prod));
                        }}
                      >
                        {prod.name}
                      </h4>

                      <div className="vsearch-prod-price-row">
                        <div className="vsearch-price-wrap">
                          <span className="vsearch-prod-price">฿{prod.price.toLocaleString()}</span>
                          {prod.originalPrice && (
                            <span className="vsearch-prod-orig-price">
                              ฿{prod.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="vsearch-prod-rating">★ {prod.rating.toFixed(1)}</span>
                      </div>

                      <div className="vsearch-prod-actions">
                        <button
                          type="button"
                          className="vsearch-add-cart-btn"
                          onClick={() => {
                            if (onAddToCart) {
                              onAddToCart(prod);
                            }
                          }}
                        >
                          <ShoppingBag size={13} /> ใส่ตะกร้า
                        </button>
                        <button
                          type="button"
                          className="vsearch-view-btn"
                          onClick={() => {
                            onClose();
                            navigate(getProductUrl(prod));
                          }}
                        >
                          ดูสินค้า <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
