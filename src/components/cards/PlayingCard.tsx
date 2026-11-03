import React from 'react';
import { Card, Suit } from '../../types/cards';

interface PlayingCardProps {
  card?: Card;
  isFaceDown?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLButtonElement>) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isFaceDown = false,
  isSelected = false,
  isPlayable = true,
  onClick,
  onDragStart,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-14 text-xs',
    md: 'w-14 h-20 sm:w-16 sm:h-24 text-sm',
    lg: 'w-20 h-28 sm:w-24 sm:h-32 text-base',
  };

  const getSuitSymbol = (suit: Suit) => {
    switch (suit) {
      case 'spades': return '♠';
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
    }
  };

  const getSuitColor = (suit: Suit) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-rose-600' : 'text-slate-900';
  };

  if (isFaceDown || !card) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-950 border-2 border-amber-400/40 shadow-md flex items-center justify-center select-none overflow-hidden relative shrink-0 ${className}`}
      >
        <div className="absolute inset-1 rounded border border-amber-400/20 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border border-amber-400/30 flex items-center justify-center">
            <span className="text-[10px] text-amber-400/60 font-serif">🂠</span>
          </div>
        </div>
      </div>
    );
  }

  const symbol = getSuitSymbol(card.suit);
  const colorClass = getSuitColor(card.suit);

  return (
    <button
      type="button"
      disabled={!isPlayable}
      onClick={onClick}
      draggable={isPlayable}
      onDragStart={e => {
        if (card && isPlayable) {
          e.dataTransfer.setData('text/plain', card.id);
          e.dataTransfer.effectAllowed = 'move';
          onDragStart?.(e);
        }
      }}
      className={`${sizeClasses[size]} rounded-lg bg-white border border-slate-300 shadow-md flex flex-col justify-between p-1 select-none transition-all duration-150 shrink-0 relative active:cursor-grabbing ${colorClass} ${
        isSelected
          ? '-translate-y-3 ring-2 ring-amber-400 shadow-xl z-20 scale-105'
          : 'hover:-translate-y-1'
      } ${!isPlayable ? 'opacity-60 cursor-not-allowed' : 'cursor-grab active:scale-95'} ${className}`}
    >
      {/* Top Left Rank & Suit */}
      <div className="flex flex-col items-center leading-none text-left">
        <span className="font-bold tracking-tighter text-xs sm:text-sm">{card.rank}</span>
        <span className="text-[10px] sm:text-xs leading-none">{symbol}</span>
      </div>

      {/* Center Large Suit Symbol */}
      <div className="my-auto self-center text-lg sm:text-2xl leading-none opacity-85 select-none pointer-events-none">
        {symbol}
      </div>

      {/* Bottom Right Inverted Rank & Suit */}
      <div className="flex flex-col items-center leading-none rotate-180 self-end">
        <span className="font-bold tracking-tighter text-xs sm:text-sm">{card.rank}</span>
        <span className="text-[10px] sm:text-xs leading-none">{symbol}</span>
      </div>
    </button>
  );
};
