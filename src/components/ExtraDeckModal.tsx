import React from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
import ModalWrapper from "./ModalWrapper";
import { isLinkMonster, isXyzMonster } from "@/utils/cardManagement";

interface ExtraDeckModalProps {
    isOpen: boolean;
    onClose: () => void;
    extraDeck: CardInstance[];
    canPerformLinkSummon: (card: CardInstance) => boolean;
    canPerformXyzSummon: (card: CardInstance) => boolean;
    startLinkSummon: (card: CardInstance) => void;
    startXyzSummon: (card: CardInstance) => void;
}

export const ExtraDeckModal: React.FC<ExtraDeckModalProps> = ({
    isOpen,
    onClose,
    extraDeck,
    canPerformLinkSummon,
    canPerformXyzSummon,
    startLinkSummon,
    startXyzSummon,
}) => {
    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="relative -m-6 mb-4">
                <div className="px-6 py-4 bg-gradient-to-b from-white via-white to-transparent">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">エクストラデッキ ({extraDeck.length}枚)</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                            ×
                        </button>
                    </div>
                </div>
            </div>

            {extraDeck.length === 0 ? (
                <div className="text-center py-8 text-gray-500">エクストラデッキにカードはありません</div>
            ) : (
                <div className="grid grid-cols-5 gap-2 max-h-[640px]  overflow-y-scroll">
                    {extraDeck.map((card, index) => (
                        <div
                            key={`${card.id}-${index}`}
                            className={`cursor-pointer transition-transform hover:scale-105 hover:ring-2 rounded ${
                                isLinkMonster(card.card) && canPerformLinkSummon(card)
                                    ? "hover:ring-blue-400 ring-2 ring-blue-200"
                                    : "hover:ring-green-300"
                            }`}
                            onClick={() => {
                                if (isLinkMonster(card.card) && canPerformLinkSummon(card)) {
                                    startLinkSummon(card);
                                    onClose();
                                } else if (isXyzMonster(card.card) && canPerformXyzSummon(card)) {
                                    startXyzSummon(card);
                                    onClose();
                                }
                            }}
                        >
                            <Card card={card} size="small" customSize="w-30" />
                            <div className="text-xs text-center mt-1 truncate">{card.card.card_name}</div>
                            <div className="text-xs text-center text-gray-600">{card.card.card_type}</div>
                            {isLinkMonster(card.card) && (
                                <div className="text-xs text-center text-blue-600 font-bold">
                                    {canPerformLinkSummon(card) ? "リンク召喚可能" : "召喚不能"}
                                </div>
                            )}
                            {isXyzMonster(card.card) && (
                                <div className="text-xs text-center text-purple-600 font-bold">
                                    {canPerformXyzSummon(card) ? "エクシーズ召喚可能" : "素材不足"}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-center mt-6">
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded font-bold"
                >
                    閉じる
                </button>
            </div>
        </ModalWrapper>
    );
};
