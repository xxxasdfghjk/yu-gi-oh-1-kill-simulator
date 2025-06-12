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
    const handleConfirm = () => {
        if (canConfirm) {
            onSelect(selectedCards);
            setSelectedCards([]);
        }
    };

    return (
        <>
            <ModalWrapper isOpen={isOpen} onClose={onCancel}>
                <div className={`flex flex-col h-full -m-6 transition-opacity duration-300 ${isTransparent ? 'opacity-30' : ''}`}>
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
            
            {/* Local Graveyard Modal */}
            <ModalWrapper isOpen={showGraveyardLocal} onClose={() => setShowGraveyardLocal(false)}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">墓地 ({state.graveyard.length}枚)</h3>
                    <button onClick={() => setShowGraveyardLocal(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                        ×
                    </button>
                </div>

                {state.graveyard.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">墓地にカードはありません</div>
                ) : (
                    <div className="grid grid-cols-5 gap-3 overflow-y-scroll max-h-[600px]">
                        {state.graveyard.map((card, index) => (
                            <div
                                key={`${card.id}-${index}`}
                                className={`relative cursor-pointer transition-transform hover:scale-105 hover:ring-2 hover:ring-purple-300 rounded`}
                            >
                                <Card card={card} size="small" customSize="w-30" disableActivate />
                                <div className="text-xs text-center mt-1 truncate w-30">{card.card.card_name}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => setShowGraveyardLocal(false)}
                        className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded font-bold"
                    >
                        閉じる
                    </button>
                </div>
            </ModalWrapper>
            
            {/* Local Extra Deck Modal */}
            <ModalWrapper isOpen={showExtraDeckLocal} onClose={() => setShowExtraDeckLocal(false)}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">エクストラデッキ ({state.extraDeck.length}枚)</h3>
                    <button onClick={() => setShowExtraDeckLocal(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                        ×
                    </button>
                </div>

                {state.extraDeck.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">エクストラデッキにカードはありません</div>
                ) : (
                    <div className="grid grid-cols-5 gap-2 max-h-[640px] overflow-y-scroll">
                        {state.extraDeck.map((card, index) => (
                            <div
                                key={`${card.id}-${index}`}
                                className="cursor-pointer transition-transform hover:scale-105 hover:ring-2 hover:ring-green-300 rounded"
                            >
                                <Card card={card} size="small" customSize="w-30" disableActivate />
                                <div className="text-xs text-center mt-1 truncate">{card.card.card_name}</div>
                                <div className="text-xs text-center text-gray-600">{card.card.card_type}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => setShowExtraDeckLocal(false)}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded font-bold"
                    >
                        閉じる
                    </button>
                </div>
            </ModalWrapper>
        </>
    );
};
