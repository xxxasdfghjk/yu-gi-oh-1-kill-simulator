import React from "react";
import type { CardInstance } from "@/types/card";

interface CardActionModalProps {
    cardActionHover: {
        card: CardInstance;
        actions: string[];
        x: number;
        y: number;
    } | null;
    onActionClick: (action: string, card: CardInstance) => void;
    onClose: () => void;
}

export const CardActionModal: React.FC<CardActionModalProps> = ({ cardActionHover, onActionClick, onClose }) => {
    if (!cardActionHover) return null;

    return (
        <div className="fixed inset-0 bg-transparent z-50" onClick={onClose}>
            <div
                className="absolute bg-white border-2 border-gray-300 rounded-lg shadow-lg p-3 min-w-48"
                style={{
                    left: cardActionHover.x - 80,
                    top: cardActionHover.y,
                    zIndex: 60,
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                    // モーダルにマウスが入ったら表示を維持
                }}
                onMouseLeave={() => {
                    // モーダルからマウスが離れたら非表示
                    onClose();
                }}
            >
                <h4 className="text-center font-bold mb-2 text-gray-800 text-sm">
                    {cardActionHover.card.card.card_name}
                </h4>

                <div className="space-y-1">
                    {cardActionHover.actions.includes("summon") && (
                        <button
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-xs"
                            onClick={() => onActionClick("summon", cardActionHover.card)}
                        >
                            召喚
                        </button>
                    )}
                    {cardActionHover.actions.includes("activate") && (
                        <button
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-xs"
                            onClick={() => onActionClick("activate", cardActionHover.card)}
                        >
                            発動
                        </button>
                    )}
                    {cardActionHover.actions.includes("set") && (
                        <button
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-3 rounded text-xs"
                            onClick={() => onActionClick("set", cardActionHover.card)}
                        >
                            セット
                        </button>
                    )}
                    {cardActionHover.actions.includes("effect") && (
                        <button
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-1 px-3 rounded text-xs"
                            onClick={() => onActionClick("effect", cardActionHover.card)}
                        >
                            効果発動
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
