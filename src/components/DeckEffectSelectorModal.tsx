import { useGameStore, type GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import React from "react";

export interface DeckEffect {
    id: string;
    name: string;
    card: CardInstance;
    canActivate: (state: GameStore) => boolean;
    activate: (state: GameStore) => void;
}

interface DeckEffectSelectorModalProps {
    effects: DeckEffect[];
    onSelect: (effect: DeckEffect) => void;
    onCancel: () => void;
}

export const DeckEffectSelectorModal: React.FC<DeckEffectSelectorModalProps> = ({ effects, onSelect, onCancel }) => {
    const state = useGameStore();
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold mb-4">デッキ効果を選択</h3>
                <div className="space-y-2">
                    {effects
                        .filter((e) => e.canActivate(state))
                        .map((effect) => (
                            <button
                                key={effect.id}
                                onClick={() => onSelect(effect)}
                                className="w-full text-left p-3 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                            >
                                {effect.name}
                            </button>
                        ))}
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        </div>
    );
};
