import React, { useState } from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";

interface CardSelectorProps {
    cards: CardInstance[];
    title: string;
    onSelect: (card: CardInstance) => void;
    onCancel: () => void;
    maxSelections?: number;
}

export const CardSelector: React.FC<CardSelectorProps> = ({ cards, title, onSelect, onCancel, maxSelections = 1 }) => {
    const [selectedCards, setSelectedCards] = useState<string[]>([]);

    const handleCardClick = (card: CardInstance) => {
        if (maxSelections === 1) {
            onSelect(card);
        } else {
            if (selectedCards.includes(card.id)) {
                setSelectedCards(selectedCards.filter((id) => id !== card.id));
            } else if (selectedCards.length < maxSelections) {
                setSelectedCards([...selectedCards, card.id]);
            }
        }
    };

    const handleConfirm = () => {
        const selected = cards.filter((c) => selectedCards.includes(c.id));
        if (selected.length > 0) {
            onSelect(selected[0]); // 複数選択の場合は後で対応
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 dark:bg-gray-900 p-6 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white text-2xl">
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                    {cards.map((card) => (
                        <div key={card.id} className={selectedCards.includes(card.id) ? "ring-4 ring-yellow-400" : ""}>
                            <Card
                                card={card}
                                size="small"
                                onClick={() => handleCardClick(card)}
                                selected={selectedCards.includes(card.id)}
                            />
                        </div>
                    ))}
                </div>

                {maxSelections > 1 && (
                    <div className="flex justify-between items-center">
                        <p className="text-gray-300">
                            選択: {selectedCards.length} / {maxSelections}
                        </p>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedCards.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded"
                        >
                            確定
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
