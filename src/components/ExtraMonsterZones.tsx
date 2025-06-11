import React from "react";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";
import { CARD_SIZE, getLocationVector } from "@/const/card";
import AnimationWrapper from "./AnimationWrapper";
import { useGameStore } from "@/store/gameStore";

interface ExtraMonsterZonesProps {
    extraMonsterZones: (CardInstance | null)[];
    opponentField: {
        monsterZones: (CardInstance | null)[];
        spellTrapZones: (CardInstance | null)[];
        fieldZone: CardInstance | null;
    };
}

export const ExtraMonsterZones: React.FC<ExtraMonsterZonesProps> = ({ extraMonsterZones, opponentField }) => {
    const cardSizeClass = CARD_SIZE.MEDIUM;
    const { currentTo, currentFrom } = useGameStore();
    const monsterInitial = currentTo.location === "MonsterField" ? getLocationVector(currentTo, currentFrom) : {};
    console.log(monsterInitial);
    const opponentFieldInitial =
        currentTo.location === "OpponentField" ? getLocationVector(currentTo, currentFrom) : {};

    return (
        <div className="mb-2">
            <div className="flex flex-row space-x-2">
                {/* 空のスペース */}
                <div className={`${cardSizeClass}`}></div>
                <div className={`${cardSizeClass}`}></div>

                {/* 左のエクストラモンスターゾーン */}
                <AnimationWrapper initial={monsterInitial}>
                    <FieldZone
                        card={extraMonsterZones[0]}
                        className={`${cardSizeClass} border-4 border-red-400`}
                        type={"extra_zone"}
                    />
                </AnimationWrapper>

                <div className={`${cardSizeClass}`}></div>

                {/* 右のエクストラモンスターゾーン */}
                <AnimationWrapper initial={monsterInitial}>
                    <FieldZone
                        card={extraMonsterZones[1]}
                        className={`${cardSizeClass} border-4 border-red-400`}
                        type={"extra_zone"}
                    />
                </AnimationWrapper>

                <div className={`${cardSizeClass}`}></div>
                {/* 相手のフィールド魔法（右側） */}
                <AnimationWrapper initial={opponentFieldInitial}>
                    <FieldZone
                        rotate={true}
                        type="field"
                        card={opponentField?.fieldZone || null}
                        className={CARD_SIZE.MEDIUM}
                    />
                </AnimationWrapper>
            </div>
        </div>
    );
};
