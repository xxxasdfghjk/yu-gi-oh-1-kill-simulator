import React, { useState } from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
import type { GameStore } from "@/store/gameStore";
import ModalWrapper from "./ModalWrapper";

interface MultiCardConditionSelectorProps {
    type: "multi" | "single";
    state: GameStore;
    getAvailableCards: (state: GameStore) => CardInstance[];
    title: string;
    onSelect: (selectedCards: CardInstance[]) => void;
    onCancel?: () => void;
    condition: (selectedCards: CardInstance[], state: GameStore) => boolean;
    filterFunction?: (card: CardInstance) => boolean;
    isOpen?: boolean;
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
    isOpen = true,
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
                setSelectedCards((prev) => [...prev, card]);
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

    const canConfirm = condition(selectedCards, state);
    const handleConfirm = () => {
        if (canConfirm) {
            onSelect(selectedCards);
            setSelectedCards([]);
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onCancel}>
            <div className="mb-4">
                <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
                <p className="text-center text-gray-600">{selectedCards.length} 枚選択中</p>
            </div>

            <div className="grid grid-cols-5  mb-6 gap-y-4 gap-x-2">
                {cards
                    .filter((e) => {
                        console.log(e);
                        return filterFunction?.(e) ?? true;
                    })
                    .map((card) => {
                        const isSelected = selectedCards.some((c) => c.id === card.id);
                        const isSelectable = true;
                        return (
                            <div
                                key={card.id}
                                className={`mx-auto justify-center cursor-pointer transition-all ${
                                    isSelected
                                        ? "ring-4 ring-blue-500 scale-105 bg-blue-200 rounded"
                                        : isSelectable
                                        ? "hover:scale-105 hover:ring-2 hover:ring-gray-300 rounded"
                                        : "opacity-50 rounded cursor-not-allowed"
                                }`}
                                onClick={() => isSelectable && handleCardClick(card)}
                            >
                                <Card card={card} size="small" customSize="w-32 h-48" forceAttack disableActivate />
                                <div className="text-xs text-center mt-1 w-32 truncate">{card.card.card_name}</div>
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
        </ModalWrapper>
    );
};
