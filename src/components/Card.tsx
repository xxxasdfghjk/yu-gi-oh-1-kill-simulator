import React from 'react';
import type { CardInstance } from '@/types/card';
import { isMonsterCard, isSpellCard, isTrapCard } from '@/utils/gameUtils';

interface CardProps {
  card: CardInstance;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  selected?: boolean;
  faceDown?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  size = 'medium', 
  onClick, 
  selected = false,
  faceDown = false 
}) => {
  // カードが伏せ状態かどうかをチェック
  const isFaceDown = faceDown || card.position === 'facedown';
  const sizeClasses = {
    small: 'w-16 h-24',
    medium: 'w-20 h-28',
    large: 'w-24 h-32',
  };

  const getCardColor = () => {
    if (isFaceDown) return 'bg-gray-700';
    
    const cardType = card.card.card_type;
    if (isMonsterCard(card.card)) {
      if (cardType.includes('通常モンスター')) return 'bg-yellow-500';
      if (cardType.includes('効果モンスター')) return 'bg-orange-500';
      if (cardType.includes('儀式')) return 'bg-blue-500';
      if (cardType === '融合モンスター') return 'bg-purple-500';
      if (cardType === 'シンクロモンスター') return 'bg-gray-300';
      if (cardType === 'エクシーズモンスター') return 'bg-gray-800';
      if (cardType === 'リンクモンスター') return 'bg-blue-700';
    } else if (isSpellCard(card.card)) {
      return 'bg-green-500';
    } else if (isTrapCard(card.card)) {
      return 'bg-pink-500';
    }
    return 'bg-gray-500';
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${getCardColor()}
        ${selected ? 'ring-4 ring-yellow-400' : ''}
        rounded cursor-pointer hover:scale-105 transition-transform
        flex flex-col items-center justify-center p-1
        text-white shadow-md border border-gray-600
      `}
      onClick={onClick}
    >
      {!isFaceDown && (
        <>
          <div className="text-xs font-bold text-center line-clamp-2">
            {card.card.card_name}
          </div>
          {isMonsterCard(card.card) && 'attack' in card.card && (
            <div className="text-xs mt-auto">
              ATK: {card.card.attack}
              {card.card.defense !== undefined && ` / DEF: ${card.card.defense}`}
            </div>
          )}
        </>
      )}
      {isFaceDown && (
        <div className="text-xs text-gray-400">???</div>
      )}
    </div>
  );
};