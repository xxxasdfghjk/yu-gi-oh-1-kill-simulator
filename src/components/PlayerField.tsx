import React, { useState } from "react";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";
import { CARD_SIZE, getLocationVectorWithPosition } from "@/const/card";
import { useGameStore } from "@/store/gameStore";
import AnimationWrapper from "./AnimationWrapper";
import { Card } from "./Card";
import { DeckEffectSelectorModal } from "./DeckEffectSelectorModal";

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
    const { currentFrom, currentTo, deckEffects, activateDeckEffect } = useGameStore();
    const [showDeckEffectModal, setShowDeckEffectModal] = useState(false);
    const gameState = useGameStore();

    const cardSizeClass = CARD_SIZE.MEDIUM;
    const fieldZoneInitial =
        currentTo.location === "FieldZone" ? getLocationVectorWithPosition(currentTo, currentFrom) : {};

    const spellInitial =
        currentTo.location === "SpellField" ? getLocationVectorWithPosition(currentTo, currentFrom) : {};
    const monsterInitial =
        currentTo.location === "MonsterField" ? getLocationVectorWithPosition(currentTo, currentFrom) : {};
    const graveyardInitial =
        currentTo.location === "Graveyard" ? getLocationVectorWithPosition(currentTo, currentFrom) : {};
    const extraDeckInitial =
        currentTo.location === "ExtraDeck" ? getLocationVectorWithPosition(currentTo, currentFrom) : {};
    const deckInitial = currentTo.location === "Deck" ? getLocationVectorWithPosition(currentTo, currentFrom) : {};

    return (
        <div>
            {/* プレイヤーモンスターゾーン（Grid配置） */}
            <div className="flex space-x-2 mb-2">
                {/* プレイヤーのフィールド魔法（左側） */}
                <FieldZone className={cardSizeClass} type="field" hasCard={!!field.fieldZone}>
                    <AnimationWrapper key={field.fieldZone?.id ?? "empty-field"} initial={{ ...fieldZoneInitial }}>
                        <Card card={field.fieldZone} />
                    </AnimationWrapper>
                </FieldZone>

                {/* 通常モンスターゾーン */}
                {field.monsterZones.map((card, index) => (
                    <FieldZone key={`monster-${index}`} className={cardSizeClass} hasCard={!!card}>
                        <AnimationWrapper card={card} enableTokenFadeOut={true} initial={{ ...monsterInitial }}>
                            <Card card={card} />
                        </AnimationWrapper>
                    </FieldZone>
                ))}
                {/* 墓地 */}
                <div className="text-center relative">
                    {/* スペース確保用の透明な要素 */}
                    <div className={`${cardSizeClass}`}></div>

                    <div
                        className={`${cardSizeClass} bg-purple-700 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-purple-600 transition-colors z-20 absolute top-0 opacity-80`}
                        onClick={() => setShowGraveyard(true)}
                    >
                        <div>
                            <div className="text-xs">GY</div>
                            <div className="text-lg">{graveyard.length}</div>
                        </div>
                    </div>

                    {graveyard.map((e) => (
                        <div key={e.id} className={`absolute top-0 z-10 ${cardSizeClass}`}>
                            <AnimationWrapper initial={{ ...graveyardInitial }}>
                                <Card key={e.id} card={e} />
                            </AnimationWrapper>
                        </div>
                    ))}
                </div>
            </div>

            {/* 魔法・罠ゾーン（Grid配置） */}
            <div className="flex space-x-2">
                {/* エクストラデッキ */}
                <div className="text-center relative">
                    {/* スペース確保用の透明な要素 */}
                    <div className={`${cardSizeClass}`}></div>

                    <div
                        className={`${cardSizeClass} bg-green-700 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-green-600 transition-colors z-20 absolute top-0 opacity-80 border-2 border-green-900`}
                        onClick={() => setShowExtraDeck(true)}
                    >
                        <div>
                            <div className="text-xs">EX</div>
                            <div className="text-lg">{extraDeck.length}</div>
                        </div>
                    </div>

                    {extraDeck.map((e, index) => (
                        <div key={e.id} className={`absolute top-0 z-10 ${cardSizeClass}`}>
                            <AnimationWrapper initial={{ ...extraDeckInitial }}>
                                <Card
                                    key={e.id}
                                    card={index === extraDeck.length - 1 ? { ...e, position: "back" as const } : e}
                                    disableActivate={true}
                                />
                            </AnimationWrapper>
                        </div>
                    ))}
                </div>

                {/* 魔法・罠ゾーン */}
                {field.spellTrapZones.map((card, index) => (
                    <FieldZone key={`spell-${index}`} className={cardSizeClass} type="spell_trap" hasCard={!!card}>
                        <AnimationWrapper key={card?.id ?? index} card={card} initial={{ ...spellInitial }}>
                            <Card card={card}></Card>
                        </AnimationWrapper>
                    </FieldZone>
                ))}

                {/* デッキ */}
                <div className="text-center relative">
                    {/* スペース確保用の透明な要素 */}
                    <div className={`${cardSizeClass}`}></div>

                    <div
                        className={`${cardSizeClass} bg-orange-700 rounded flex items-center justify-center text-white font-bold z-20 absolute top-0 opacity-80 border-2 border-orange-900 ${
                            deckEffects.filter((e) => e.canActivate(gameState)).length > 0
                                ? "cursor-pointer hover:opacity-100"
                                : ""
                        }`}
                        onClick={() => {
                            const activableEffects = deckEffects.filter((e) => e.canActivate(gameState));
                            if (activableEffects.length > 0) {
                                // If only one effect, activate it directly
                                if (activableEffects.length === 1) {
                                    activateDeckEffect(activableEffects[0]);
                                } else {
                                    // Multiple effects - show selection modal
                                    setShowDeckEffectModal(true);
                                }
                            }
                        }}
                    >
                        <div>
                            <div className="text-xs">DECK</div>
                            <div className="text-lg">{deck.length}</div>
                            {deckEffects.filter((e) => e.canActivate(gameState)).length > 0 && (
                                <div className="text-xs text-yellow-300">★</div>
                            )}
                        </div>
                    </div>

                    {deck.map((e) => (
                        <div key={e.id} className={`absolute top-0 z-10 ${cardSizeClass}`}>
                            <AnimationWrapper initial={{ ...deckInitial }}>
                                <Card key={e.id} card={{ ...e, position: "back" as const }} disableActivate={true} />
                            </AnimationWrapper>
                        </div>
                    ))}
                </div>
            </div>

            {showDeckEffectModal && (
                <DeckEffectSelectorModal
                    effects={deckEffects}
                    onSelect={(effect) => {
                        activateDeckEffect(effect);
                        setShowDeckEffectModal(false);
                    }}
                    onCancel={() => setShowDeckEffectModal(false)}
                />
            )}
        </div>
    );
};
