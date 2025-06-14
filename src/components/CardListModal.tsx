import React from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
import ModalWrapper from "./ModalWrapper";

interface CardListModalProps {
    isOpen: boolean;
    onClose: () => void;
    cards: CardInstance[];
    title: string;
    emptyMessage?: string;
    accentColor?: string; // デフォルトは purple
}

export const CardListModal: React.FC<CardListModalProps> = ({
    isOpen,
    onClose,
    cards,
    title,
    emptyMessage = "カードはありません",
    accentColor = "purple",
}) => {
    // Tailwindの動的クラス生成を避けるため、事前定義されたクラスマップを使用
    const colorClasses = {
        purple: {
            ring: "hover:ring-purple-300",
            bg: "bg-purple-500",
            bgHover: "hover:bg-purple-600",
        },
        indigo: {
            ring: "hover:ring-indigo-300",
            bg: "bg-indigo-500",
            bgHover: "hover:bg-indigo-600",
        },
    };

    const colors = colorClasses[accentColor as keyof typeof colorClasses] || colorClasses.purple;

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                    {title} ({cards.length}枚)
                </h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                    ×
                </button>
            </div>

            {cards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{emptyMessage}</div>
            ) : (
                <div className="grid grid-cols-5 gap-3 overflow-y-scroll max-h-[600px]">
                    {cards.map((card, index) => (
                        <div
                            key={`${card.id}-${index}`}
                            className={`relative cursor-pointer transition-transform hover:scale-105 hover:ring-2 ${colors.ring} rounded`}
                        >
                            <Card card={card} size="small" customSize="w-32 h-48" />
                            <div className="text-xs text-center mt-1 truncate w-32">{card.card.card_name}</div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-center mt-6">
                <button
                    onClick={onClose}
                    className={`px-6 py-3 ${colors.bg} ${colors.bgHover} text-white rounded font-bold`}
                >
                    閉じる
                </button>
            </div>
        </ModalWrapper>
    );
};