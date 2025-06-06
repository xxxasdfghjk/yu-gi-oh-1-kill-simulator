import React from 'react';
import type { CardInstance } from '@/types/card';
import { Card } from './Card';

interface FieldZoneProps {
  card: CardInstance | null;
  onClick?: () => void;
  onCardClick?: (card: CardInstance, event?: React.MouseEvent) => void;
  onCardRightClick?: (card: CardInstance) => void;
  label?: string;
  className?: string;
}

export const FieldZone: React.FC<FieldZoneProps> = ({ card, onClick, onCardClick, onCardRightClick, label, className = '' }) => {
  const handleClick = (event: React.MouseEvent) => {
    if (card && onCardClick) {
      onCardClick(card, event);
    } else if (onClick) {
      onClick();
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (card && onCardRightClick) {
      onCardRightClick(card);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <div className="absolute -top-5 left-0 text-xs text-gray-600">{label}</div>
      )}
      <div
        className="w-20 h-28 border-2 border-blue-400 rounded bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
        onClick={handleClick}
        onContextMenu={handleRightClick}
      >
        {card ? (
          <Card card={card} size="medium" />
        ) : (
          <div className="text-blue-400 text-xs">Empty</div>
        )}
      </div>
    </div>
  );
};