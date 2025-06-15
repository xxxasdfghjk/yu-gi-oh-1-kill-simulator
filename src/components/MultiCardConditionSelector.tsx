import React, { useState, useEffect, useCallback } from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
import type { GameStore } from "@/store/gameStore";
import ModalWrapper from "./ModalWrapper";
import { GraveyardModal } from "./GraveyardModal";
import { ExtraDeckModal } from "./ExtraDeckModal";

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
    const [showGraveyardLocal, setShowGraveyardLocal] = useState(false);
    const [showExtraDeckLocal, setShowExtraDeckLocal] = useState(false);
    const [isTransparent, setIsTransparent] = useState(false);
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
    const handleConfirm = useCallback(() => {
        if (canConfirm) {
            onSelect(selectedCards);
            setSelectedCards([]);
        }
    }, [canConfirm, onSelect, selectedCards]);

    // Handle Enter key press
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === "Enter" && canConfirm && isOpen) {
                handleConfirm();
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    }, [canConfirm, isOpen, handleConfirm]);

    return (
        <>
            <ModalWrapper isOpen={isOpen} onClose={onCancel} isTransparent={isTransparent}>
                <div className="flex flex-col h-full -m-6">
                {/* Fixed header */}
                <div className="px-6 py-4 bg-white border-b">
                    <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
                    <p className="text-center text-gray-600">{selectedCards.length} 枚選択中</p>
                </div>

                {/* Scrollable card area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[700px]">
                    <div className="grid grid-cols-5 gap-y-4 gap-x-2">
                        {cards
                            .filter((e) => {
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
                                        <Card
                                            card={card}
                                            size="small"
                                            customSize="w-32 h-48"
                                            forceAttack
                                            disableActivate
                                        />
                                        <div className="text-xs text-center mt-1 w-32 truncate">
                                            {card.card.card_name}
                                        </div>
                                        <div className="text-xs text-center mt-1 truncate">{card.location}</div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Fixed footer with buttons */}
                <div className="px-6 py-4 bg-white border-t relative">
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
                    
                    {/* View icons in bottom-right */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                            onClick={() => setIsTransparent(!isTransparent)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                isTransparent ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }`}
                            title="盤面確認"
                        >
                            👁️
                        </button>
                        <button
                            onClick={() => setShowGraveyardLocal(true)}
                            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-gray-700"
                            title="墓地確認"
                        >
                            ⚰️
                        </button>
                        <button
                            onClick={() => setShowExtraDeckLocal(true)}
                            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold text-gray-700"
                            title="エクストラデッキ確認"
                        >
                            🎴
                        </button>
                    </div>
                </div>
                </div>
            </ModalWrapper>
            
            {/* 既存のGraveyardModalを使用 */}
            <GraveyardModal 
                graveyard={state.graveyard}
                gameState={state}
                isOpen={showGraveyardLocal}
                onClose={() => setShowGraveyardLocal(false)}
            />
            
            {/* 既存のExtraDeckModalを確認のみモードで使用 */}
            <ExtraDeckModal 
                isOpen={showExtraDeckLocal}
                onClose={() => setShowExtraDeckLocal(false)}
                extraDeck={state.extraDeck}
                viewOnly={true}
            />
        </>
    );
};
