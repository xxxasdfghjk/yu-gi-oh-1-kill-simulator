import React from 'react';
import type { CardInstance, MonsterCard } from '@/types/card';
import { isMonsterCard } from '@/utils/gameUtils';

interface CardDetailProps {
  card: CardInstance | null;
  onClose: () => void;
}

export const CardDetail: React.FC<CardDetailProps> = ({ card, onClose }) => {
  if (!card) return null;

  const isMonster = isMonsterCard(card.card);
  const monsterCard = card.card as MonsterCard;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-800 dark:bg-gray-900 p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-white">{card.card.card_name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-gray-300">
          <div>
            <span className="text-gray-500">カードタイプ:</span> {card.card.card_type}
          </div>

          {isMonster && (
            <>
              {monsterCard.level && (
                <div>
                  <span className="text-gray-500">レベル:</span> {monsterCard.level}
                </div>
              )}
              {monsterCard.rank && (
                <div>
                  <span className="text-gray-500">ランク:</span> {monsterCard.rank}
                </div>
              )}
              {monsterCard.link && (
                <div>
                  <span className="text-gray-500">リンク:</span> {monsterCard.link}
                </div>
              )}
              <div>
                <span className="text-gray-500">属性:</span> {monsterCard.attribute}
              </div>
              <div>
                <span className="text-gray-500">種族:</span> {monsterCard.race}
              </div>
              <div>
                <span className="text-gray-500">攻撃力:</span> {monsterCard.attack}
                {monsterCard.defense !== undefined && (
                  <> / <span className="text-gray-500">守備力:</span> {monsterCard.defense}</>
                )}
              </div>
              {monsterCard.material && (
                <div>
                  <span className="text-gray-500">素材:</span> {monsterCard.material}
                </div>
              )}
            </>
          )}

          <div>
            <span className="text-gray-500">効果:</span>
            <p className="mt-1 text-sm whitespace-pre-wrap">{card.card.text}</p>
          </div>

          <div>
            <span className="text-gray-500">制限:</span> {card.card.limit_status}
          </div>
        </div>
      </div>
    </div>
  );
};