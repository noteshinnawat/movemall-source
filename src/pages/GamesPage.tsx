// src/pages/GamesPage.tsx — Movemall Gamification & Rewards Hub

import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Sparkles, Coins, Gift, RotateCw, Trophy } from 'lucide-react';
import { formatCurrency, formatNumber } from '../i18n/formatters';
import { resolveRootLocale } from '../i18n/locales';
import './GamesPage.css';

interface GamesPageProps {
  onRewardWon?: (rewardText: string) => void;
}

type WheelPrize =
  | { kind: 'discountCode'; amount: number; color: string }
  | { kind: 'coins'; amount: number; color: string }
  | { kind: 'freeShipping'; color: string }
  | { kind: 'percentOff'; amount: number; color: string };

const WHEEL_PRIZES: WheelPrize[] = [
  { kind: 'discountCode', amount: 100, color: '#EF4444' },
  { kind: 'coins', amount: 50, color: '#F59E0B' },
  { kind: 'freeShipping', color: '#10B981' },
  { kind: 'percentOff', amount: 20, color: '#3B82F6' },
  { kind: 'coins', amount: 100, color: '#8B5CF6' },
  { kind: 'discountCode', amount: 50, color: '#EC4899' },
  { kind: 'coins', amount: 10, color: '#6366F1' },
  { kind: 'percentOff', amount: 15, color: '#14B8A6' },
];

export function GamesPage({ onRewardWon }: GamesPageProps) {
  const { t, i18n } = useTranslation(['engagement']);
  const locale = resolveRootLocale(i18n.resolvedLanguage ?? i18n.language);
  const money = (value: number) => formatCurrency(value, locale);

  function prizeLabel(prize: WheelPrize) {
    if (prize.kind === 'freeShipping') return t('engagement:games.wheel.prizes.freeShipping');
    if (prize.kind === 'discountCode') return t('engagement:games.wheel.prizes.discountCode', { amount: money(prize.amount) });
    if (prize.kind === 'coins') return t('engagement:games.wheel.prizes.coins', { amount: prize.amount });
    return t('engagement:games.wheel.prizes.percentOff', { amount: prize.amount });
  }

  const [coins, setCoins] = useState<number>(350);
  const [checkedDays, setCheckedDays] = useState<number[]>([1, 2]);
  const [todayClaimed, setTodayClaimed] = useState<boolean>(false);

  // Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrizeLabel, setWonPrizeLabel] = useState<string | null>(null);

  // Cards Game
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const cardRewards = t('engagement:games.cards.rewards', { returnObjects: true }) as string[];

  function handleCheckin() {
    if (todayClaimed) return;
    setTodayClaimed(true);
    setCheckedDays(prev => [...prev, 3]);
    setCoins(c => c + 30);
    onRewardWon?.(t('engagement:games.checkin.toast'));
  }

  function handleSpinWheel() {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrizeLabel(null);

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
      const prize = WHEEL_PRIZES[prizeIndex];
      const label = prizeLabel(prize);
      setWonPrizeLabel(label);
      if (prize.kind === 'coins') {
        setCoins(c => c + prize.amount);
      }
      onRewardWon?.(t('engagement:games.wheel.toast', { prize: label }));
    }, 4200);
  }

  function handleFlipCard(index: number) {
    if (flippedCards[index]) return;
    setFlippedCards(prev => ({ ...prev, [index]: true }));
    const reward = cardRewards[index];
    onRewardWon?.(t('engagement:games.cards.toast', { reward }));
  }

  return (
    <main className="games-page">
      {/* Hero */}
      <section className="games-hero">
        <div className="container">
          <h1 className="games-hero__title">{t('engagement:games.heroTitle')}</h1>
          <p style={{ fontSize: 14, opacity: 0.9 }}>
            {t('engagement:games.heroSubtitle')}
          </p>

          <div className="games-hero__coins-badge">
            <Coins size={18} style={{ color: '#FCD34D' }} />
            <span>
              <Trans
                i18nKey="games.myCoins"
                ns="engagement"
                values={{ coins: formatNumber(coins, locale), amount: money(coins) }}
                components={{ b: <strong /> }}
              />
            </span>
          </div>
        </div>
      </section>

      <div className="container">
        {/* 7-Day Daily Check-in */}
        <section className="daily-checkin-card">
          <div className="daily-checkin__header">
            <h2 className="daily-checkin__title">
              <Gift size={18} style={{ color: 'var(--primary)' }} />
              {t('engagement:games.checkin.title')}
            </h2>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('engagement:games.checkin.goal')}</span>
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
                  <span className="daily-box-day">{t('engagement:games.checkin.dayLabel', { day })}</span>
                  <Coins size={20} style={{ color: isClaimed ? 'var(--success)' : 'var(--warning)' }} />
                  <span className="daily-box-coin">+{formatNumber(coinReward, locale)}</span>
                  <span style={{ fontSize: 10, color: isClaimed ? 'var(--success)' : 'var(--text-muted)' }}>
                    {isClaimed
                      ? t('engagement:games.checkin.claimed')
                      : isToday
                        ? t('engagement:games.checkin.today')
                        : t('engagement:games.checkin.pending')}
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
            {todayClaimed ? t('engagement:games.checkin.buttonClaimed') : t('engagement:games.checkin.buttonClaim')}
          </button>
        </section>

        {/* Minigames Grid */}
        <div className="games-grid">
          {/* Lucky Spin Wheel */}
          <section className="wheel-card">
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={18} style={{ color: 'var(--warning)' }} />
              {t('engagement:games.wheel.title')}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {t('engagement:games.wheel.subtitle')}
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
                        {prizeLabel(prize)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {wonPrizeLabel && (
              <div style={{ background: 'var(--success-subtle)', border: '1px solid var(--success)', padding: '8px 16px', marginBottom: 12 }}>
                <strong style={{ color: 'var(--success)', fontSize: 14 }}>
                  {t('engagement:games.wheel.won', { prize: wonPrizeLabel })}
                </strong>
              </div>
            )}

            <button
              className="wheel-spin-btn"
              onClick={handleSpinWheel}
              disabled={isSpinning}
            >
              <RotateCw size={16} style={{ display: 'inline', marginRight: 6 }} />
              {isSpinning ? t('engagement:games.wheel.spinning') : t('engagement:games.wheel.spin')}
            </button>
          </section>

          {/* Mystery Cards Game */}
          <section className="cards-game-card">
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              {t('engagement:games.cards.title')}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {t('engagement:games.cards.subtitle')}
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
                      {isFlipped ? cardRewards[idx] : t('engagement:games.cards.cardLabel', { index: idx + 1 })}
                    </div>
                    {!isFlipped && (
                      <span style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>{t('engagement:games.cards.tapToOpen')}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 'auto' }}>
              {t('engagement:games.cards.footnote', { amount: money(1) })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default GamesPage;
