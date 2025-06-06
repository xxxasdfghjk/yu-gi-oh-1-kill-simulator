import React from 'react';
import type { CardInstance } from '@/types/card';
import { Card } from './Card';
import { useGameStore } from '@/store/gameStore';

interface FieldProps {
  monsterZones: (CardInstance | null)[];
  spellTrapZones: (CardInstance | null)[];
  fieldZone: CardInstance | null;
}

export const Field: React.FC<FieldProps> = ({ monsterZones, spellTrapZones, fieldZone }) => {
  const { selectedCard, selectCard, playCard } = useGameStore();

  const handleZoneClick = (_zoneType: 'monster' | 'spell', index: number) => {
    if (selectedCard) {
      playCard(selectedCard, index);
    }
  };

  return (
    <div className="bg-gray-700 dark:bg-gray-800 p-4 rounded-lg">
      <div className="grid gap-4">
        {/* 魔法・罠ゾーン */}
        <div>
          <h4 className="text-white text-sm mb-2">魔法・罠ゾーン</h4>
          <div className="flex gap-2">
            {spellTrapZones.map((card, index) => (
              <div
                key={`spell-${index}`}
                className="w-20 h-28 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400"
                onClick={() => handleZoneClick('spell', index)}
              >
                {card ? (
                  <Card
                    card={card}
                    size="medium"
                    selected={selectedCard === card.id}
                    onClick={() => selectCard(card.id)}
                  />
                ) : (
                  <span className="text-gray-500 text-xs">空</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* モンスターゾーン */}
        <div>
          <h4 className="text-white text-sm mb-2">モンスターゾーン</h4>
          <div className="flex gap-2">
            {monsterZones.map((card, index) => (
              <div
                key={`monster-${index}`}
                className="w-20 h-28 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400"
                onClick={() => handleZoneClick('monster', index)}
              >
                {card ? (
                  <Card
                    card={card}
                    size="medium"
                    selected={selectedCard === card.id}
                    onClick={() => selectCard(card.id)}
                  />
                ) : (
                  <span className="text-gray-500 text-xs">空</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* フィールドゾーン */}
        <div className="absolute top-4 right-4">
          <h4 className="text-white text-sm mb-2">フィールド</h4>
          <div className="w-20 h-28 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center">
            {fieldZone ? (
              <Card
                card={fieldZone}
                size="medium"
                selected={selectedCard === fieldZone.id}
                onClick={() => selectCard(fieldZone.id)}
              />
            ) : (
              <span className="text-gray-500 text-xs">空</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};