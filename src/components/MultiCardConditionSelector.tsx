import React, { useState } from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
import type { GameStore } from "@/store/gameStore";

interface MultiCardConditionSelectorProps {
    type: "multi" | "single";
    state: GameStore;
    getAvailableCards: (state: GameStore) => CardInstance[];
    title: string;
    onSelect: (selectedCards: CardInstance[]) => void;
    onCancel?: () => void;
    condition: (selectedCards: CardInstance[]) => boolean;
    filterFunction?: (card: CardInstance, alreadySelected: CardInstance[]) => boolean;
}

export const MultiCardConditionSelector: React.FC<MultiCardConditionSelectorProps> = ({
    type,
    state,
    getAvailableCards,
    title,
    onSelect,
    onCancel,
    filterFunction,
    condition,
}) => {
    const [selectedCards, setSelectedCards] = useState<CardInstance[]>([]);
    const cards = getAvailableCards(state);
    const handleCardClick = (card: CardInstance) => {
        if (type === "multi") {
            const isSelected = selectedCards.some((c) => c.id === card.id);
            if (isSelected) {
                // カードの選択を解除
                setSelectedCards((prev) => prev.filter((c) => c.id !== card.id));
            } else {
                if (!filterFunction || filterFunction(card, selectedCards)) {
                    setSelectedCards((prev) => [...prev, card]);
                }
            }
        } else {
            const isSelected = selectedCards.some((c) => c.id === card.id);
            if (isSelected) {
                // カードの選択を解除
                setSelectedCards((prev) => prev.filter((c) => c.id !== card.id));
            } else {
                setSelectedCards([card]); // シングル選択の場合、選択されたカードを上書き
            }
        }
    };

    // フィルター関数に基づいて利用可能なカードを決定
    const availableCards = cards.filter((card) => {
        const isAlreadySelected = selectedCards.some((c) => c.id === card.id);
        if (isAlreadySelected) return true; // 既に選択されているカードは表示

        if (!filterFunction) return true;
        return filterFunction(card, selectedCards);
    });

    const canConfirm = condition(selectedCards);
    const handleConfirm = () => {
        if (canConfirm) {
            onSelect(selectedCards);
            setSelectedCards([]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
                    <p className="text-center text-gray-600">{selectedCards.length} 枚選択中</p>
                </div>

                <div className="grid grid-cols-6 md:grid-cols-6 lg:grid-cols-8  mb-6">
                    {availableCards.map((card) => {
                        const isSelected = selectedCards.some((c) => c.id === card.id);
                        const isSelectable = !filterFunction || filterFunction(card, selectedCards) || isSelected;

                        return (
                            <div
                                key={card.id}
                                className={`cursor-pointer transition-all ${
                                    isSelected
                                        ? "ring-4 ring-blue-500 scale-105"
                                        : isSelectable
                                        ? "hover:scale-105 hover:ring-2 hover:ring-gray-300"
                                        : "opacity-50 cursor-not-allowed"
                                }`}
                                onClick={() => isSelectable && handleCardClick(card)}
                            >
                                <Card card={card} size="small" forceAttack />
                                <div className="text-xs text-center mt-1 truncate">{card.card.card_name}</div>
                                <div className="text-xs text-center mt-1 truncate">{card.location}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className={`px-6 py-3 rounded font-bold ${
                            canConfirm
                                ? "bg-blue-500 hover:bg-blue-600 text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        確定 ({selectedCards.length})
                    </button>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-bold"
                        >
                            キャンセル
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
