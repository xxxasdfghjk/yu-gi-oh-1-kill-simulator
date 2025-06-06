import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { isMonsterCard, isSpellCard } from '@/utils/gameUtils';
import { canNormalSummon, canActivateSpell } from '@/utils/summonUtils';

export const ActionPanel: React.FC = () => {
  const { selectedCard, hand, playCard, initializeGame } = useGameStore();
  const gameState = useGameStore();
  
  const selectedCardInstance = hand.find(c => c.id === selectedCard);

  const handleSummon = () => {
    if (selectedCard && selectedCardInstance) {
      playCard(selectedCard);
    }
  };

  const getActionButtons = () => {
    if (!selectedCardInstance) return null;

    const buttons = [];

    if (isMonsterCard(selectedCardInstance.card)) {
      if (canNormalSummon(gameState, selectedCardInstance)) {
        buttons.push(
          <button
            key="summon"
            onClick={handleSummon}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            通常召喚
          </button>
        );
      }
    } else if (isSpellCard(selectedCardInstance.card)) {
      if (canActivateSpell(gameState, selectedCardInstance.card)) {
        buttons.push(
          <button
            key="activate"
            onClick={handleSummon}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            発動
          </button>
        );
      }
    }

    return buttons;
  };

  return (
    <div className="bg-gray-800 dark:bg-gray-900 p-4 rounded-lg">
      <h3 className="text-white mb-2 font-semibold">アクション</h3>
      
      {selectedCardInstance && (
        <div className="mb-4">
          <p className="text-gray-300 text-sm mb-2">
            選択中: {selectedCardInstance.card.card_name}
          </p>
          <div className="flex gap-2">
            {getActionButtons()}
          </div>
        </div>
      )}

      <button
        onClick={initializeGame}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        ゲームをリセット
      </button>
    </div>
  );
};