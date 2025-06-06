import React from "react";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";

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
    handleFieldZoneClick: (zoneType: "monster" | "spell", index: number) => void;
    handleFieldCardClick: (card: CardInstance, event?: React.MouseEvent) => void;
    setShowCardDetail: (card: CardInstance | null) => void;
    setShowGraveyard: (show: boolean) => void;
    setShowExtraDeck: (show: boolean) => void;
}

export const PlayerField: React.FC<PlayerFieldProps> = ({
    field,
    deck,
    extraDeck,
    graveyard,
    turn,
    phase,
    isOpponentTurn,
    bonmawashiRestriction,
    handleFieldZoneClick,
    handleFieldCardClick,
    setShowCardDetail,
    setShowGraveyard,
    setShowExtraDeck,
}) => {
    return (
        <div>
            {/* プレイヤーモンスターゾーン（Grid配置） */}
            <div className="grid grid-cols-7 gap-2 max-w-4xl mx-auto mb-4">
                {/* プレイヤーのフィールド魔法（左側） */}
                <FieldZone
                    card={field.fieldZone}
                    className="w-20 h-28"
                    onClick={() => {}}
                    onCardClick={handleFieldCardClick}
                    onCardRightClick={(card) => setShowCardDetail(card)}
                    type="field"
                />

                {/* 通常モンスターゾーン */}
                {field.monsterZones.map((card, index) => (
                    <FieldZone
                        key={`monster-${index}`}
                        card={card}
                        className="w-20 h-28"
                        onClick={() => handleFieldZoneClick("monster", index)}
                        onCardClick={handleFieldCardClick}
                        onCardRightClick={(card) => setShowCardDetail(card)}
                    />
                ))}
                {/* 墓地 */}
                <div className="text-center">
                    <div
                        className="w-20 h-28 bg-purple-700 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-purple-600 transition-colors"
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
            <div className="grid grid-cols-7 gap-2 max-w-4xl mx-auto mb-8">
                {/* エクストラデッキ */}
                <div className="text-center">
                    <div
                        className="w-20 h-28 bg-green-700 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-green-600 transition-colors border-2 border-green-900"
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
                        className="w-20 h-28"
                        onClick={() => handleFieldZoneClick("spell", index)}
                        onCardClick={handleFieldCardClick}
                        onCardRightClick={(card) => setShowCardDetail(card)}
                    />
                ))}

                {/* デッキ */}
                <div className="text-center">
                    <div className="w-20 h-28 bg-orange-700 rounded flex items-center justify-center text-white font-bold border-2 border-orange-900">
                        <div>
                            <div className="text-xs">DECK</div>
                            <div className="text-lg">{deck.length}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="text-xs text-gray-600 mt-1">Turn {turn}</div>
            <div className="text-xs text-gray-600">
                {isOpponentTurn ? "Opponent " : ""}
                {phase}
            </div>
            {bonmawashiRestriction && <div className="text-xs text-red-600 font-bold">盆回し制限</div>}
        </div>
    );
};