import React from "react";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";
import { CARD_SIZE } from "@/const/card";

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
    turn: number;
    phase: string;
    isOpponentTurn: boolean;
    bonmawashiRestriction: boolean;
    handleFieldCardClick: (card: CardInstance, event?: React.MouseEvent) => void;
    setShowGraveyard: (show: boolean) => void;
    setShowExtraDeck: (show: boolean) => void;
}

export const PlayerField: React.FC<PlayerFieldProps> = ({
    field,
    deck,
    extraDeck,
    graveyard,
    handleFieldCardClick,
    setShowGraveyard,
    setShowExtraDeck,
}) => {
    const cardSizeClass = CARD_SIZE.MEDIUM;

    return (
        <div>
            {/* プレイヤーモンスターゾーン（Grid配置） */}
            <div className="grid grid-cols-7 gap-2 max-w-6xl mb-2">
                {/* プレイヤーのフィールド魔法（左側） */}
                <FieldZone
                    card={field.fieldZone}
                    className={cardSizeClass}
                    onClick={() => {}}
                    onCardClick={handleFieldCardClick}
                    type="field"
                />

                {/* 通常モンスターゾーン */}
                {field.monsterZones.map((card, index) => (
                    <FieldZone
                        key={`monster-${index}`}
                        card={card}
                        className={cardSizeClass}
                        onCardClick={handleFieldCardClick}
                            />
                ))}
                {/* 墓地 */}
                <div className="text-center">
                    <div
                        className={`${cardSizeClass} bg-purple-700 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-purple-600 transition-colors`}
                        onClick={() => setShowGraveyard(true)}
                    >
                        <div>
                            <div className="text-xs">GY</div>
                            <div className="text-lg">{graveyard.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 魔法・罠ゾーン（Grid配置） */}
            <div className="grid grid-cols-7 gap-2 max-w-6xl mb-2">
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
                    <FieldZone
                        key={`spell-${index}`}
                        card={card}
                        className={cardSizeClass}
                        onCardClick={handleFieldCardClick}
                            />
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
