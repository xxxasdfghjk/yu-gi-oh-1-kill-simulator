import React from "react";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";
import { CARD_SIZE, getLocationVectorWithPosition } from "@/const/card";
import AnimationWrapper from "./AnimationWrapper";
import { useGameStore } from "@/store/gameStore";
import { Card } from "./Card";

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
    const monsterInitial =
        currentTo.location === "MonsterField" ? getLocationVectorWithPosition(currentTo, currentFrom) : {};
    const opponentFieldInitial =
        currentTo.location === "OpponentField"
            ? { ...getLocationVectorWithPosition(currentTo, currentFrom), rotate: 180 }
            : {};
    return (
        <div className="mb-2">
            <div className="flex flex-row space-x-2">
                {/* 空のスペース */}
                <div className={`${cardSizeClass}`}></div>
                <div className={`${cardSizeClass}`}></div>

                {/* 左のエクストラモンスターゾーン */}
                <FieldZone
                    className={`${cardSizeClass} border-4 border-red-400`}
                    type={"extra_zone"}
                    hasCard={!!extraMonsterZones[0]}
                >
                    <AnimationWrapper 
                        card={extraMonsterZones[0]}
                        enableTokenFadeOut={true}
                        initial={{ ...monsterInitial }}
                    >
                        <Card card={extraMonsterZones[0]} />
                    </AnimationWrapper>
                </FieldZone>

                <div className={`${cardSizeClass}`}></div>

                {/* 右のエクストラモンスターゾーン */}
                <FieldZone
                    className={`${cardSizeClass} border-4 border-red-400`}
                    type={"extra_zone"}
                    hasCard={!!extraMonsterZones[1]}
                >
                    <AnimationWrapper 
                        card={extraMonsterZones[1]}
                        enableTokenFadeOut={true}
                        initial={{ ...monsterInitial }}
                    >
                        <Card card={extraMonsterZones[1]} />
                    </AnimationWrapper>
                </FieldZone>

                <div className={`${cardSizeClass}`}></div>
                {/* 相手のフィールド魔法（右側） */}
                <FieldZone
                    rotate={true}
                    type="field"
                    hasCard={!!opponentField?.fieldZone}
                    className={`${CARD_SIZE.MEDIUM} rotate-180`}
                >
                    <AnimationWrapper initial={opponentFieldInitial} key={opponentField?.fieldZone?.id ?? 1}>
                        <Card rotate={true} card={opponentField?.fieldZone || null} />
                    </AnimationWrapper>
                </FieldZone>
            </div>
        </div>
    );
};
