import React from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
import ModalWrapper from "./ModalWrapper";
import { isLinkMonster, isXyzMonster, isSynchroMonster } from "@/utils/cardManagement";

interface ExtraDeckModalProps {
    isOpen: boolean;
    onClose: () => void;
    extraDeck: CardInstance[];
    // 確認のみモード（召喚機能を使わない場合）
    viewOnly?: boolean;
    canPerformLinkSummon?: (card: CardInstance) => boolean;
    canPerformXyzSummon?: (card: CardInstance) => boolean;
    canPerformSynchroSummon?: (card: CardInstance) => boolean;
    startLinkSummon?: (card: CardInstance) => void;
    startXyzSummon?: (card: CardInstance) => void;
    startSynchroSummon?: (card: CardInstance) => void;
}

export const ExtraDeckModal: React.FC<ExtraDeckModalProps> = ({
    isOpen,
    onClose,
    extraDeck,
    viewOnly = false,
    canPerformLinkSummon,
    canPerformXyzSummon,
    canPerformSynchroSummon,
    startLinkSummon,
    startXyzSummon,
    startSynchroSummon,
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
                            className={`${
                                !viewOnly ? "cursor-pointer" : "cursor-default"
                            } transition-transform hover:scale-105 hover:ring-2 rounded ${
                                !viewOnly && isLinkMonster(card.card) && canPerformLinkSummon?.(card)
                                    ? "hover:ring-blue-400 ring-2 ring-blue-200"
                                    : !viewOnly && isXyzMonster(card.card) && canPerformXyzSummon?.(card)
                                    ? "hover:ring-purple-400 ring-2 ring-purple-200"
                                    : !viewOnly && isSynchroMonster(card.card) && canPerformSynchroSummon?.(card)
                                    ? "hover:ring-green-400 ring-2 ring-green-200"
                                    : "hover:ring-green-300"
                            }`}
                            onClick={() => {
                                if (viewOnly) return;
                                if (isLinkMonster(card.card) && canPerformLinkSummon?.(card) && startLinkSummon) {
                                    startLinkSummon(card);
                                    onClose();
                                } else if (isXyzMonster(card.card) && canPerformXyzSummon?.(card) && startXyzSummon) {
                                    startXyzSummon(card);
                                    onClose();
                                } else if (isSynchroMonster(card.card) && canPerformSynchroSummon?.(card) && startSynchroSummon) {
                                    startSynchroSummon(card);
                                    onClose();
                                }
                            }}
                        >
                            <div className="relative w-32 h-48">
                                <Card card={card} size="small" customSize="w-32 h-48" />
                            </div>
                            <div className="text-xs text-center mt-1 truncate">{card.card.card_name}</div>
                            <div className="text-xs text-center text-gray-600">{card.card.card_type}</div>
                            {!viewOnly && isLinkMonster(card.card) && canPerformLinkSummon && (
                                <div className="text-xs text-center text-blue-600 font-bold">
                                    {canPerformLinkSummon(card) ? "リンク召喚可能" : "召喚不能"}
                                </div>
                            )}
                            {!viewOnly && isXyzMonster(card.card) && canPerformXyzSummon && (
                                <div className="text-xs text-center text-purple-600 font-bold">
                                    {canPerformXyzSummon(card) ? "エクシーズ召喚可能" : "召喚不能"}
                                </div>
                            )}
                            {!viewOnly && isSynchroMonster(card.card) && canPerformSynchroSummon && (
                                <div className="text-xs text-center text-green-600 font-bold">
                                    {canPerformSynchroSummon(card) ? "シンクロ召喚可能" : "召喚不能"}
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
