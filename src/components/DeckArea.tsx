import React from 'react';
import { useGameStore } from '@/store/gameStore';

export const DeckArea: React.FC = () => {
  const { deck } = useGameStore();

  return (
    <div className="bg-gray-800 dark:bg-gray-900 p-4 rounded-lg">
      <h3 className="text-white mb-2 font-semibold">デッキ</h3>
      <div 
        className="w-20 h-28 bg-red-900 rounded-lg flex items-center justify-center border-2 border-red-700"
      >
        <div className="text-white text-center">
          <div className="text-2xl font-bold">{deck.length}</div>
          <div className="text-xs">枚</div>
        </div>
      </div>
    </div>
  );
};