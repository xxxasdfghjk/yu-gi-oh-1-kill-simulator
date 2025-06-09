import React from "react";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";
import { CARD_SIZE } from "@/const/card";

interface ExtraMonsterZonesProps {
    extraMonsterZones: (CardInstance | null)[];
    handleFieldCardClick: (card: CardInstance) => void;
    opponentField: {
        monsterZones: (CardInstance | null)[];
        spellTrapZones: (CardInstance | null)[];
        fieldZone: CardInstance | null;
    };
}

export const ExtraMonsterZones: React.FC<ExtraMonsterZonesProps> = ({
    extraMonsterZones,
    handleFieldCardClick,
    opponentField,
}) => {
    const cardSizeClass = CARD_SIZE.MEDIUM;

    return (
        <div className="my-2">
            <div className="grid grid-cols-7 gap-2 max-w-6xl">
                {/* 空のスペース */}
                <div className={`${cardSizeClass}`}></div>
                <div className={`${cardSizeClass}`}></div>

                {/* 左のエクストラモンスターゾーン */}
                <FieldZone
                    card={extraMonsterZones[0]}
                    className={`${cardSizeClass} border-4 border-red-400`}
                    onCardClick={handleFieldCardClick}
                    type={"extra_zone"}
                />

                <div className={`${cardSizeClass}`}></div>

                {/* 右のエクストラモンスターゾーン */}
                <FieldZone
                    card={extraMonsterZones[1]}
                    className={`${cardSizeClass} border-4 border-red-400`}
                    onCardClick={handleFieldCardClick}
                    type={"extra_zone"}
                />

                <div className={`${cardSizeClass}`}></div>
                {/* 相手のフィールド魔法（右側） */}
                <FieldZone
                    type="field"
                    card={opponentField?.fieldZone || null}
                    className={CARD_SIZE.MEDIUM}
                    onCardClick={handleFieldCardClick}
                />
            </div>
        </div>
    );
};
