import React from "react";
import { Card } from "./Card";
import AnimationWrapper from "./AnimationWrapper";
import type { CardInstance } from "@/types/card";
import { CARD_SIZE, getLocationVectorWithPosition } from "@/const/card";
import { useGameStore } from "@/store/gameStore";

interface BanishedZoneProps {
    banished: CardInstance[];
    onShowBanished: () => void;
}

export const BanishedZone: React.FC<BanishedZoneProps> = ({ banished, onShowBanished }) => {
    const cardSizeClass = CARD_SIZE.MEDIUM;
    const { currentTo, currentFrom } = useGameStore();
    const banishedInitial =
        currentTo.location === "Exclusion" ? getLocationVectorWithPosition(currentTo, currentFrom) : {};

    return (
        <div className="text-center relative">
            {/* スペース確保用の透明な要素 */}
            <div className={`${cardSizeClass}`}></div>

            <div
                className={`${cardSizeClass} bg-indigo-700 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-indigo-600 transition-colors z-20 absolute top-0 opacity-80`}
                onClick={onShowBanished}
            >
                <div>
                    <div className="text-xs">Exclusion</div>
                    <div className="text-lg">{banished.length}</div>
                </div>
            </div>

            {banished.map((e) => (
                <div key={e.id} className={`absolute top-0 z-10 ${cardSizeClass}`}>
                    <AnimationWrapper initial={{ ...banishedInitial }}>
                        <Card key={e.id} card={e} />
                    </AnimationWrapper>
                </div>
            ))}
        </div>
    );
};
