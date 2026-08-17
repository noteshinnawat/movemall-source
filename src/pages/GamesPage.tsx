// src/pages/GamesPage.tsx — Movemall Gamification & Rewards Hub

import { useState, useRef } from 'react';
import { Sparkles, Coins, Gift, CheckCircle, RotateCw, Trophy, Ticket } from 'lucide-react';
import './GamesPage.css';

interface GamesPageProps {
  onRewardWon?: (rewardText: string) => void;
}

const WHEEL_PRIZES = [
  { label: 'โค้ดลด ฿100', color: '#EF4444' },
  { label: '50 Coins', color: '#F59E0B' },
  { label: 'โค้ดส่งฟรี', color: '#10B981' },
  { label: 'ลด 20%', color: '#3B82F6' },
  { label: '100 Coins', color: '#8B5CF6' },
  { label: 'โค้ดลด ฿50', color: '#EC4899' },
  { label: '10 Coins', color: '#6366F1' },
  { label: 'ลด 15%', color: '#14B8A6' },
];

export function GamesPage({ onRewardWon }: GamesPageProps) {
  const [coins, setCoins] = useState<number>(350);
  const [checkedDays, setCheckedDays] = useState<number[]>([1, 2]);
  const [todayClaimed, setTodayClaimed] = useState<boolean>(false);

  // Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);

  // Cards Game
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [cardRewards] = useState(['🎟️ ลด ฿80', '💰 80 Coins', '🚚 โค้ดส่งฟรี']);

  function handleCheckin() {
    if (todayClaimed) return;
    setTodayClaimed(true);
    setCheckedDays(prev => [...prev, 3]);
    setCoins(c => c + 30);
    onRewardWon?.('คุณได้รับ 30 Coins จากการเช็คอินประจำวัน!');
  }

  function handleSpinWheel() {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);

    // Random prize index 0-7
    const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const degreesPerSegment = 360 / WHEEL_PRIZES.length;
    // Calculate final rotation (extra 5 full turns + target segment)
    const extraTurns = 5 * 360;
    const targetDegree = extraTurns + (360 - (prizeIndex * degreesPerSegment + degreesPerSegment / 2));
    const newRotation = rotation + targetDegree;

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = WHEEL_PRIZES[prizeIndex].label;
      setWonPrize(prize);
      if (prize.includes('Coins')) {
        const amt = parseInt(prize, 10) || 50;
        setCoins(c => c + amt);
      }
      onRewardWon?.(`🎉 ยินดีด้วย! คุณได้รับรางวัล "${prize}"`);
    }, 4200);
  }

  function handleFlipCard(index: number) {
    if (flippedCards[index]) return;
    setFlippedCards(prev => ({ ...prev, [index]: true }));
    const reward = cardRewards[index];
    onRewardWon?.(`🎴 เปิดการ์ดสำเร็จ! คุณได้รับ ${reward}`);
  }

  return (
    <main className="games-page">
      {/* Hero */}
      <section className="games-hero">
        <div className="container">
          <h1 className="games-hero__title">🎮 Movemall Games & ศูนย์รวมของรางวัล</h1>
          <p style={{ fontSize: 14, opacity: 0.9 }}>
            เล่นเกมส์ประจำวัน หมุนวงล้อเสี่ยงโชค เช็คอินสะสมเหรียญ Coins นำไปใช้แลกส่วนลดสินค้าได้ทันที!
          </p>

          <div className="games-hero__coins-badge">
            <Coins size={18} style={{ color: '#FCD34D' }} />
            <span>เหรียญ Coins ของฉัน: <strong>{coins.toLocaleString()} Coins</strong> (มูลค่า ฿{coins})</span>
          </div>
        </div>
      </section>

      <div className="container">
        {/* 7-Day Daily Check-in */}
        <section className="daily-checkin-card">
          <div className="daily-checkin__header">
            <h2 className="daily-checkin__title">
              <Gift size={18} style={{ color: 'var(--primary)' }} />
              เช็คอินต่อเนื่อง 7 วัน รับเหรียญ Coins ฟรี
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>เช็คอินติดต่อกัน 7 วัน รับโบนัสพิเศษ 100 Coins!</span>
          </div>

          <div className="daily-grid">
            {[1, 2, 3, 4, 5, 6, 7].map(day => {
              const isClaimed = checkedDays.includes(day);
              const isToday = day === 3;
              const coinReward = day === 7 ? 100 : day * 10;

              return (
                <div
                  key={day}
                  className={`daily-box${isClaimed ? ' daily-box--claimed' : ''}${isToday && !todayClaimed ? ' daily-box--today' : ''}`}
                >
                  <span className="daily-box-day">วันที่ {day}</span>
                  <Coins size={20} style={{ color: isClaimed ? 'var(--success)' : 'var(--warning)' }} />
                  <span className="daily-box-coin">+{coinReward}</span>
                  <span style={{ fontSize: 10, color: isClaimed ? 'var(--success)' : 'var(--text-muted)' }}>
                    {isClaimed ? '✓ รับแล้ว' : isToday ? 'วันนี้' : 'รอรับ'}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            className="daily-checkin-btn"
            onClick={handleCheckin}
            disabled={todayClaimed}
          >
            {todayClaimed ? '✓ เช็คอินวันนี้เรียบร้อยแล้ว (กลับมาใหม่พรุ่งนี้)' : '🎁 กดเช็คอินรับ 30 Coins วันนี้!'}
          </button>
        </section>

        {/* Minigames Grid */}
        <div className="games-grid">
          {/* Lucky Spin Wheel */}
          <section className="wheel-card">
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={18} style={{ color: 'var(--warning)' }} />
              วงล้อหมุนลุ้นโชค (Lucky Spin Wheel)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              หมุนฟรีวันละ 1 ครั้ง ลุ้นรับคูปองส่วนลดและ Coins สูงสุด 100 เหรียญ!
            </p>

            <div className="wheel-wrapper">
              <div className="wheel-pointer" />
              <svg
                className="wheel-canvas"
                viewBox="0 0 200 200"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                {WHEEL_PRIZES.map((prize, idx) => {
                  const angle = (360 / WHEEL_PRIZES.length);
                  const startAngle = idx * angle;
                  const endAngle = startAngle + angle;
                  const x1 = 100 + 100 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                  const y1 = 100 + 100 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                  const x2 = 100 + 100 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                  const y2 = 100 + 100 * Math.sin((Math.PI * (endAngle - 90)) / 180);
                  const textAngle = startAngle + angle / 2;
                  const tx = 100 + 65 * Math.cos((Math.PI * (textAngle - 90)) / 180);
                  const ty = 100 + 65 * Math.sin((Math.PI * (textAngle - 90)) / 180);

                  return (
                    <g key={idx}>
                      <path
                        d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                        fill={prize.color}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <text
                        x={tx}
                        y={ty}
                        fill="#FFFFFF"
                        fontSize="7"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                      >
                        {prize.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {wonPrize && (
              <div style={{ background: 'var(--success-subtle)', border: '1px solid var(--success)', padding: '8px 16px', marginBottom: 12 }}>
                <strong style={{ color: 'var(--success)', fontSize: 14 }}>🎉 คุณได้รับ: {wonPrize}!</strong>
              </div>
            )}

            <button
              className="wheel-spin-btn"
              onClick={handleSpinWheel}
              disabled={isSpinning}
            >
              <RotateCw size={16} style={{ display: 'inline', marginRight: 6 }} />
              {isSpinning ? 'กำลังหมุนลุ้นรางวัล...' : 'หมุนวงล้อทันที!'}
            </button>
          </section>

          {/* Mystery Cards Game */}
          <section className="cards-game-card">
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              เปิดการ์ดลุ้นคูปองลับ (Mystery Cards)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              แตะเลือกการ์ด 1 ใน 3 ใบเพื่อเปิดรับของรางวัลปริศนา
            </p>

            <div className="cards-grid">
              {[0, 1, 2].map(idx => {
                const isFlipped = flippedCards[idx];
                return (
                  <div
                    key={idx}
                    className={`mystery-card${isFlipped ? ' mystery-card--flipped' : ''}`}
                    onClick={() => handleFlipCard(idx)}
                  >
                    <div className="mystery-card-icon">
                      {isFlipped ? '🎁' : '🎴'}
                    </div>
                    <div className="mystery-card-reward">
                      {isFlipped ? cardRewards[idx] : `การ์ดใบที่ ${idx + 1}`}
                    </div>
                    {!isFlipped && (
                      <span style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>แตะเพื่อเปิด</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 'auto' }}>
              💡 สามารถนำ Coins ที่ได้ไปใช้เป็นส่วนลดเงินสดในหน้าชำระเงิน (1 Coin = 1 บาท)
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default GamesPage;
