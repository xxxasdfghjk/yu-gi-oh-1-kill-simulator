import React, { useState } from 'react';
import type { CardInstance } from '@/types/card';
import { Card } from './Card';
import { CardDetail } from './CardDetail';
import { useGameStore } from '@/store/gameStore';

interface HandProps {
  cards: CardInstance[];
}

export const Hand: React.FC<HandProps> = ({ cards }) => {
  const { selectedCard, selectCard } = useGameStore();
  const [detailCard, setDetailCard] = useState<CardInstance | null>(null);

  const handleCardClick = (card: CardInstance) => {
    selectCard(card.id);
  };

  const handleCardRightClick = (e: React.MouseEvent, card: CardInstance) => {
    e.preventDefault();
    setDetailCard(card);
  };

  return (
    <>
      <div className="bg-gray-800 dark:bg-gray-900 p-4 rounded-lg shadow-inner">
        <h3 className="text-white mb-2 font-semibold">手札 ({cards.length}枚)</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {cards.map((card) => (
            <div
              key={card.id}
              onContextMenu={(e) => handleCardRightClick(e, card)}
            >
              <Card
                card={card}
                size="medium"
                selected={selectedCard === card.id}
                onClick={() => handleCardClick(card)}
              />
            </div>
          ))}
          {cards.length === 0 && (
            <div className="text-gray-500 italic">手札がありません</div>
          )}
        </div>
      </div>
      <CardDetail card={detailCard} onClose={() => setDetailCard(null)} />
    </>
  );
};