import React, { useEffect } from 'react';
import { Hand } from './Hand';
import { Field } from './Field';
import { GameInfo } from './GameInfo';
import { DeckArea } from './DeckArea';
import { GraveyardArea } from './GraveyardArea';
import { ActionPanel } from './ActionPanel';
import { useGameStore } from '@/store/gameStore';

export const GameBoard: React.FC = () => {
  const { hand, field, graveyard, banished, initializeGame, gameOver, winner } = useGameStore();

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  if (gameOver) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-4">
            {winner === 'player' ? 'エクゾディア！勝利！' : 'ゲーム終了'}
          </h1>
          <button
            onClick={initializeGame}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
          >
            新しいゲームを開始
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 左サイドバー - ゲーム情報 */}
        <div className="lg:col-span-1 space-y-4">
          <GameInfo />
          <ActionPanel />
          <DeckArea />
          <GraveyardArea cards={graveyard} title="墓地" />
          <GraveyardArea cards={banished} title="除外" />
        </div>

        {/* メインゲームエリア */}
        <div className="lg:col-span-4 space-y-4">
          {/* フィールド */}
          <Field
            monsterZones={field.monsterZones}
            spellTrapZones={field.spellTrapZones}
            fieldZone={field.fieldZone}
          />

          {/* 手札 */}
          <Hand cards={hand} />
        </div>
      </div>
    </div>
  );
};