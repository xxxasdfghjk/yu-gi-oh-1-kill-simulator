import React from "react";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";
import { CARD_SIZE, getLocationVector } from "@/const/card";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import AnimationWrapper from "./AnimationWrapper";
import { Card } from "./Card";

interface PlayerFieldProps {
    field: {
        monsterZones: (CardInstance | null)[];
        spellTrapZones: (CardInstance | null)[];
        fieldZone: CardInstance | null;
        extraMonsterZones: (CardInstance | null)[];
    };
    deck: CardInstance[];
    extraDeck: CardInstance[];
    graveyard: CardInstance[];
    setShowGraveyard: (show: boolean) => void;
    setShowExtraDeck: (show: boolean) => void;
}

export const PlayerField: React.FC<PlayerFieldProps> = ({
    field,
    deck,
    extraDeck,
    graveyard,
    setShowGraveyard,
    setShowExtraDeck,
}) => {
    const { currentFrom, currentTo } = useGameStore();

    const cardSizeClass = CARD_SIZE.MEDIUM;
    const fieldZoneInitial = currentTo.location === "FieldZone" ? getLocationVector(currentTo, currentFrom) : {};

    const spellInitial = currentTo.location === "SpellField" ? getLocationVector(currentTo, currentFrom) : {};
    const monsterInitial = currentTo.location === "MonsterField" ? getLocationVector(currentTo, currentFrom) : {};
    const graveyardInitial = currentTo.location === "Graveyard" ? getLocationVector(currentTo, currentFrom) : {};

    return (
        <div>
            {/* プレイヤーモンスターゾーン（Grid配置） */}
            <div className="flex space-x-2 mb-2">
                {/* プレイヤーのフィールド魔法（左側） */}
                <AnimationWrapper initial={{ ...fieldZoneInitial }}>
                    <FieldZone card={field.fieldZone} className={cardSizeClass} onClick={() => {}} type="field" />
                </AnimationWrapper>

                {/* 通常モンスターゾーン */}
                {field.monsterZones.map((card, index) => (
                    <AnimationWrapper key={card?.id ?? index} initial={{ ...monsterInitial }}>
                        <FieldZone key={`monster-${index}`} card={card} className={cardSizeClass} />
                    </AnimationWrapper>
                ))}
                {/* 墓地 */}
                <AnimationWrapper>
                    <div className="text-center relative">
                        <div
                            className={`${cardSizeClass} bg-purple-700 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-purple-600 transition-colors z-10 absolute opacity-80`}
                            onClick={() => setShowGraveyard(true)}
                        >
                            <div className="-z-10">
                                <div className="text-xs">GY</div>
                                <div className="text-lg">{graveyard.length}</div>
                            </div>
                        </div>

                        {graveyard.map((e) => (
                            <div key={e.id} className={"absolute"}>
                                <AnimationWrapper initial={{ ...graveyardInitial }}>
                                    <Card key={e.id} card={e} />
                                </AnimationWrapper>
                            </div>
                        ))}
                    </div>
                </AnimationWrapper>
            </div>

            {/* 魔法・罠ゾーン（Grid配置） */}
            <div className="flex space-x-2">
                {/* エクストラデッキ */}
                <div className="text-center">
                    <div
                        className={`${cardSizeClass} bg-green-700 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-green-600 transition-colors border-2 border-green-900`}
                        onClick={() => setShowExtraDeck(true)}
                    >
                        <div>
                            <div className="text-xs">EX</div>
                            <div className="text-lg">{extraDeck.length}</div>
                        </div>
                    </div>
                </div>

                {/* 魔法・罠ゾーン */}
                {field.spellTrapZones.map((card, index) => (
                    <AnimationWrapper key={card?.id ?? index} initial={{ ...spellInitial }}>
                        <FieldZone key={`spell-${index}`} card={card} className={cardSizeClass} />
                    </AnimationWrapper>
                ))}

                {/* デッキ */}
                <div className="text-center">
                    <div
                        className={`${cardSizeClass} bg-orange-700 rounded flex items-center justify-center text-white font-bold border-2 border-orange-900`}
                    >
                        <div>
                            <div className="text-xs">DECK</div>
                            <div className="text-lg">{deck.length}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
