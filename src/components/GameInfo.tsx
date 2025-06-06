import React from 'react';
import { useGameStore } from '@/store/gameStore';

const phaseNames = {
  draw: 'ドローフェイズ',
  standby: 'スタンバイフェイズ',
  main1: 'メインフェイズ1',
  battle: 'バトルフェイズ',
  main2: 'メインフェイズ2',
  end: 'エンドフェイズ',
};

export const GameInfo: React.FC = () => {
  const { turn, phase, lifePoints, deck, graveyard, banished, extraDeck, nextPhase } = useGameStore();

  return (
    <div className="bg-gray-800 dark:bg-gray-900 p-4 rounded-lg text-white">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-gray-400">ターン:</span> {turn}
        </div>
        <div>
          <span className="text-gray-400">LP:</span> {lifePoints}
        </div>
        <div>
          <span className="text-gray-400">デッキ:</span> {deck.length}枚
        </div>
        <div>
          <span className="text-gray-400">墓地:</span> {graveyard.length}枚
        </div>
        <div>
          <span className="text-gray-400">除外:</span> {banished.length}枚
        </div>
        <div>
          <span className="text-gray-400">EXデッキ:</span> {extraDeck.length}枚
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-1">フェイズ</div>
        <div className="text-lg font-bold">{phaseNames[phase]}</div>
      </div>
      
      <button
        onClick={nextPhase}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        次のフェイズへ
      </button>
    </div>
  );
};