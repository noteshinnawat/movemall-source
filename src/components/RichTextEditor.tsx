// src/components/RichTextEditor.tsx — Lightweight rich text editor with toolbar, quick templates & live preview

import React, { useState, useRef } from 'react';
import {
  Bold, Italic, List, ListOrdered, Tag, Minus, Sparkles,
  Eye, Edit3, ShieldCheck, Truck, Package, Check
} from 'lucide-react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: number;
}

export function parseRichText(text: string): React.ReactNode[] {
  if (!text) return [];

  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();

    // Divider
    if (trimmed === '---' || trimmed === '***') {
      return <hr key={lineIdx} className="rich-desc-hr" />;
    }

    // Heading 3 / Section Title
    if (trimmed.startsWith('### ')) {
      const headingContent = trimmed.slice(4);
      return (
        <h4 key={lineIdx} className="rich-desc-h4">
          {renderInlineFormatting(headingContent)}
        </h4>
      );
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      const headingContent = trimmed.slice(3);
      return (
        <h3 key={lineIdx} className="rich-desc-h3">
          {renderInlineFormatting(headingContent)}
        </h3>
      );
    }

    // Checkmark List
    if (trimmed.startsWith('✓ ') || trimmed.startsWith('✔ ')) {
      return (
        <div key={lineIdx} className="rich-desc-item rich-desc-item--check">
          <span className="rich-desc-icon--check">✓</span>
          <span>{renderInlineFormatting(trimmed.slice(2))}</span>
        </div>
      );
    }

    // Bullet List
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <div key={lineIdx} className="rich-desc-item rich-desc-item--bullet">
          <span className="rich-desc-icon--bullet">•</span>
          <span>{renderInlineFormatting(trimmed.slice(2))}</span>
        </div>
      );
    }

    // Numbered List
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <div key={lineIdx} className="rich-desc-item rich-desc-item--num">
          <span className="rich-desc-icon--num">{numMatch[1]}.</span>
          <span>{renderInlineFormatting(numMatch[2])}</span>
        </div>
      );
    }

    // Empty line
    if (!trimmed) {
      return <div key={lineIdx} className="rich-desc-empty-line" />;
    }

    // Normal paragraph
    return (
      <p key={lineIdx} className="rich-desc-p">
        {renderInlineFormatting(line)}
      </p>
    );
  });
}

function renderInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\])/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      parts.push(<strong key={match.index} className="rich-bold">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      parts.push(<em key={match.index} className="rich-italic">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('[') && token.endsWith(']') && token.length > 2) {
      parts.push(<span key={match.index} className="rich-tag-badge">{token.slice(1, -1)}</span>);
    } else {
      parts.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'พิมพ์รายละเอียดสินค้า...',
  label,
  minHeight = 160,
}: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertFormatting(prefix: string, suffix: string = '', defaultText: string = '') {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + prefix + defaultText + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  }

  function appendTemplate(templateText: string) {
    const trimmed = value.trim();
    const newValue = trimmed ? `${trimmed}\n\n${templateText}` : templateText;
    onChange(newValue);
    setActiveTab('edit');
  }

  return (
    <div className="rich-editor">
      {label && <label className="rich-editor__label">{label}</label>}

      <div className="rich-editor__container">
        {/* Top Header Bar */}
        <div className="rich-editor__header">
          {/* Format Tools */}
          <div className="rich-editor__tools">
            <button
              type="button"
              className="rich-tool-btn"
              title="ตัวหนา (Bold)"
              onClick={() => insertFormatting('**', '**', 'ข้อความหนา')}
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              className="rich-tool-btn"
              title="ตัวเอียง (Italic)"
              onClick={() => insertFormatting('*', '*', 'ข้อความเอียง')}
            >
              <Italic size={14} />
            </button>
            <span className="rich-tool-divider" />
            <button
              type="button"
              className="rich-tool-btn"
              title="หัวข้อย่อย (Heading)"
              onClick={() => insertFormatting('### ', '', 'หัวข้อรายละเอียด')}
            >
              <strong>H</strong>
            </button>
            <button
              type="button"
              className="rich-tool-btn"
              title="รายการจุด (Bullet List)"
              onClick={() => insertFormatting('• ', '', 'จุดเด่นของสินค้า')}
            >
              <List size={14} />
            </button>
            <button
              type="button"
              className="rich-tool-btn"
              title="รายการลำดับตัวเลข (Numbered List)"
              onClick={() => insertFormatting('1. ', '', 'ขั้นตอนที่ 1')}
            >
              <ListOrdered size={14} />
            </button>
            <button
              type="button"
              className="rich-tool-btn"
              title="รายการเช็คถูก (Checkmark)"
              onClick={() => insertFormatting('✓ ', '', 'ของแท้ 100% ประกันศูนย์')}
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              className="rich-tool-btn"
              title="แท็กไฮไลท์ (Tag Badge)"
              onClick={() => insertFormatting('[', ']', '🔥 แนะนำ')}
            >
              <Tag size={14} />
            </button>
            <button
              type="button"
              className="rich-tool-btn"
              title="เส้นแบ่งส่วน (Divider)"
              onClick={() => insertFormatting('\n---\n', '')}
            >
              <Minus size={14} />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="rich-editor__mode-switch">
            <button
              type="button"
              className={`rich-mode-btn ${activeTab === 'edit' ? 'rich-mode-btn--active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              <Edit3 size={12} /> เขียน
            </button>
            <button
              type="button"
              className={`rich-mode-btn ${activeTab === 'preview' ? 'rich-mode-btn--active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={12} /> พรีวิวผลลัพธ์
            </button>
          </div>
        </div>

        {/* Quick Templates Ribbon */}
        <div className="rich-editor__templates-bar">
          <span className="rich-editor__templates-label">
            <Sparkles size={12} /> ใส่แม่แบบสำเร็จรูป:
          </span>
          <button
            type="button"
            className="rich-template-chip"
            onClick={() =>
              appendTemplate(
                '### 📦 คุณสมบัติและสเปกสินค้า:\n• แบรนด์: Movemall Official\n• รุ่น / ขนาด: \n• วัสดุการผลิต: พรีเมียมเกรดสูง\n• สีที่มีให้เลือก: '
              )
            }
          >
            <Package size={11} /> + สเปกสินค้า
          </button>
          <button
            type="button"
            className="rich-template-chip"
            onClick={() =>
              appendTemplate(
                '### 🛡️ การรับประกันและการบริการ:\n✓ สินค้าของแท้ 100% การันตีคืนเงิน 2 เท่า\n✓ รับประกันศูนย์ไทย 1 ปีเต็ม\n✓ เปลี่ยนเครื่องใหม่ทันทีภายใน 7 วันหากมีปัญหา'
              )
            }
          >
            <ShieldCheck size={11} /> + การรับประกัน
          </button>
          <button
            type="button"
            className="rich-template-chip"
            onClick={() =>
              appendTemplate(
                '### 🚚 ข้อมูลการจัดส่ง:\n• จัดส่งสินค้ารวดเร็วทุกวัน จันทร์ - เสาร์ (ตัดรอบ 12:00 น.)\n• มีบริการเก็บเงินปลายทาง (COD)\n• บรรจุห่อกันกระแทกอย่างดี ปลอดภัย 100%'
              )
            }
          >
            <Truck size={11} /> + ข้อมูลจัดส่ง
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'edit' ? (
          <textarea
            ref={textareaRef}
            className="rich-editor__textarea"
            style={{ minHeight: `${minHeight}px` }}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        ) : (
          <div className="rich-editor__preview-area" style={{ minHeight: `${minHeight}px` }}>
            {value.trim() ? (
              parseRichText(value)
            ) : (
              <div className="rich-editor__preview-empty">ยังไม่มีข้อความ (คลิกแท็บ "เขียน" เพื่อเพิ่มรายละเอียด)</div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="rich-editor__footer">
          <span className="rich-editor__char-count">
            {value.length} ตัวอักษร {value.trim() ? `• ${value.trim().split(/\s+/).length} คำ` : ''}
          </span>
          <span className="rich-editor__hint">
            💡 รองรับการจัดรูปแบบตัวหนา, หัวข้อ, เช็คลิสต์ และแท็กไฮไลท์
          </span>
        </div>
      </div>
    </div>
  );
}
