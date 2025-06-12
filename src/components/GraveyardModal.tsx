import React from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
import type { GameStore } from "@/store/gameStore";
import ModalWrapper from "./ModalWrapper";
import { useAtom } from "jotai";
import { graveyardModalAtom } from "@/store/graveyardModalAtom";

interface GraveyardModalProps {
    graveyard: CardInstance[];
    gameState: GameStore;
    // ローカル状態オーバーライド用 (指定時はjotaiを使わない)
    isOpen?: boolean;
    onClose?: () => void;
}

export const GraveyardModal: React.FC<GraveyardModalProps> = ({
    graveyard,
    isOpen: isOpenProp,
    onClose: onCloseProp,
}) => {
    const [isOpenAtom, setIsOpenAtom] = useAtom(graveyardModalAtom);

    // Props指定時はpropsを使用、そうでなければjotaiを使用
    const isOpen = isOpenProp !== undefined ? isOpenProp : isOpenAtom;
    const onClose = onCloseProp || (() => setIsOpenAtom(false));

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">墓地 ({graveyard.length}枚)</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                    ×
                </button>
            </div>

            {graveyard.length === 0 ? (
                <div className="text-center py-8 text-gray-500">墓地にカードはありません</div>
            ) : (
                <div className="grid grid-cols-5 gap-3 overflow-y-scroll max-h-[600px]">
                    {graveyard.map((card, index) => (
                        <div
                            key={`${card.id}-${index}`}
                            className={`relative cursor-pointer transition-transform hover:scale-105 hover:ring-2 hover:ring-purple-300 rounded`}
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
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded font-bold"
                >
                    閉じる
                </button>
            </div>
        </ModalWrapper>
    );
};
