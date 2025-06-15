import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Deck } from "@/data/deckUtils";
import type { Card } from "@/types/card";
import { monsterFilter, isMagicCard } from "@/utils/cardManagement";

interface DeckSelectionModalProps {
    isOpen: boolean;
    availableDecks: Deck[];
    onSelectDeck: (deck: Deck) => void;
    onClose: () => void;
}

interface DeckPreviewProps {
    deck: Deck;
    isSelected: boolean;
    onSelect: () => void;
}

const DeckPreview: React.FC<DeckPreviewProps> = ({ deck, isSelected, onSelect }) => {
    const [showDetails, setShowDetails] = useState(false);

    const monsterCount = deck.main_deck.filter((card) => monsterFilter(card)).length;
    const spellCount = deck.main_deck.filter((card) => isMagicCard(card)).length;
    const trapCount = deck.main_deck.filter((card) => card.card_type === "罠").length;
    const extraCount = deck.extra_deck.length;

    const groupCardsByType = (cards: Card[]) => {
        const grouped: Record<string, { card: Card; count: number }> = {};

        cards.forEach((card) => {
            if (grouped[card.card_name]) {
                grouped[card.card_name].count++;
            } else {
                grouped[card.card_name] = { card, count: 1 };
            }
        });

        return Object.values(grouped);
    };

    const groupedMainDeck = groupCardsByType(deck.main_deck);
    const groupedExtraDeck = groupCardsByType(deck.extra_deck);

    return (
        <motion.div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-md"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSelect}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-800">{deck.deck_name}</h3>
                <button
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDetails(!showDetails);
                    }}
                >
                    {showDetails ? "詳細を閉じる" : "詳細を見る"}
                </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                <div>モンスター: {monsterCount}</div>
                <div>魔法: {spellCount}</div>
                <div>罠: {trapCount}</div>
                <div>エクストラ: {extraCount}</div>
            </div>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden border-t pt-3"
                    >
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">
                                    メインデッキ ({deck.main_deck.length}枚)
                                </h4>
                                <div className="max-h-48 overflow-y-auto text-xs">
                                    {groupedMainDeck.map(({ card, count }) => (
                                        <div key={card.card_name} className="flex justify-between py-1">
                                            <span className="text-gray-700">{card.card_name}</span>
                                            <span className="text-gray-500">×{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {extraCount > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">
                                        エクストラデッキ ({extraCount}枚)
                                    </h4>
                                    <div className="max-h-48 overflow-y-auto text-xs">
                                        {groupedExtraDeck.map(({ card, count }) => (
                                            <div key={card.card_name} className="flex justify-between py-1">
                                                <span className="text-gray-700">{card.card_name}</span>
                                                <span className="text-gray-500">×{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isSelected && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-center">
                    <span className="text-blue-600 font-semibold">このデッキが選択されています</span>
                </motion.div>
            )}
        </motion.div>
    );
};

export const DeckSelectionModal: React.FC<DeckSelectionModalProps> = ({
    isOpen,
    availableDecks,
    onSelectDeck,
    onClose,
}) => {
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

    const handleConfirmSelection = () => {
        if (selectedDeck) {
            onSelectDeck(selectedDeck);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
            animate={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
            exit={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
        >
            <motion.div
                className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">デッキを選択</h2>
                    <p className="text-gray-600">使用するデッキを選んでゲームを開始しましょう</p>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        {availableDecks.map((deck) => (
                            <DeckPreview
                                key={deck.deck_name}
                                deck={deck}
                                isSelected={selectedDeck?.deck_name === deck.deck_name}
                                onSelect={() => setSelectedDeck(deck)}
                            />
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                    <button className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors" onClick={onClose}>
                        キャンセル
                    </button>
                    <button
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                            selectedDeck
                                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                        onClick={handleConfirmSelection}
                        disabled={!selectedDeck}
                    >
                        ゲーム開始
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
