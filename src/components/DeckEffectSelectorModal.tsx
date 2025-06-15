import { useGameStore, type GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import React from "react";
import { MultiCardConditionSelector } from "./MultiCardConditionSelector";

export interface DeckEffect {
    id: string;
    name: string;
    card: CardInstance;
    canActivate: (state: GameStore) => boolean;
    activate: (state: GameStore, card: CardInstance) => void;
}

interface DeckEffectSelectorModalProps {
    effects: DeckEffect[];
    onSelect: (effect: DeckEffect) => void;
    onCancel: () => void;
}

export const DeckEffectSelectorModal: React.FC<DeckEffectSelectorModalProps> = ({ effects, onSelect, onCancel }) => {
    const state = useGameStore();
    
    // アクティブなエフェクトのみをフィルター
    const activeEffects = effects.filter((e) => e.canActivate(state));
    
    // DeckEffectのカード情報を取得
    const availableCards = activeEffects.map((effect) => effect.card);
    
    return (
        <MultiCardConditionSelector
            type="single"
            state={state}
            getAvailableCards={() => availableCards}
            title="デッキ効果を選択"
            condition={(selectedCards) => selectedCards.length === 1}
            onSelect={(selectedCards) => {
                // 選択されたカードに対応するエフェクトを見つける
                const selectedCard = selectedCards[0];
                const selectedEffect = activeEffects.find((effect) => effect.card.id === selectedCard.id);
                if (selectedEffect) {
                    onSelect(selectedEffect);
                }
            }}
            onCancel={onCancel}
        />
    );
};
