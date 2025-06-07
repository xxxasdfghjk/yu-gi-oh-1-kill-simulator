import React, { useState } from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
import { CARD_SIZE } from "@/const/card";

interface GraveyardAreaProps {
    cards: CardInstance[];
    title: string;
}

export const GraveyardArea: React.FC<GraveyardAreaProps> = ({ cards, title }) => {
    const [showCards, setShowCards] = useState(false);

    return (
        <>
            <div className="bg-gray-800 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-white mb-2 font-semibold">{title}</h3>
                <div
                    onClick={() => setShowCards(!showCards)}
                    className={`${CARD_SIZE.MEDIUM} bg-purple-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-purple-800 transition-colors border-2 border-purple-700`}
                >
                    <div className="text-white text-center">
                        <div className="text-2xl font-bold">{cards.length}</div>
                        <div className="text-xs">枚</div>
                    </div>
                </div>
            </div>

            {showCards && cards.length > 0 && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
                    onClick={() => setShowCards(false)}
                >
                    <div
                        className="bg-gray-800 dark:bg-gray-900 p-6 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">
                                {title} ({cards.length}枚)
                            </h2>
                            <button
                                onClick={() => setShowCards(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                            {cards.map((card) => (
                                <Card key={card.id} card={card} size="small" />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
