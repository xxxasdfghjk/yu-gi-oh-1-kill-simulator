import React from "react";
import type { CardInstance } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { useAtom } from "jotai";
import { graveyardModalAtom } from "@/store/graveyardModalAtom";
import { CardListModal } from "./CardListModal";

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
        <CardListModal
            isOpen={isOpen}
            onClose={onClose}
            cards={graveyard}
            title="墓地"
            emptyMessage="墓地にカードはありません"
            accentColor="purple"
        />
    );
};
