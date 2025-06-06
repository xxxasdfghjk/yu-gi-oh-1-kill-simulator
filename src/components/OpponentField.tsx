import React from "react";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";

interface OpponentFieldProps {
    opponentField: {
        monsterZones: (CardInstance | null)[];
        spellTrapZones: (CardInstance | null)[];
        fieldZone: CardInstance | null;
    };
    activateOpponentFieldSpell: () => void;
    setChickenRaceHover: (hover: { card: CardInstance; x: number; y: number } | null) => void;
    setShowCardDetail: (card: CardInstance | null) => void;
}

export const OpponentField: React.FC<OpponentFieldProps> = ({
    opponentField,
    activateOpponentFieldSpell,
    setChickenRaceHover,
    setShowCardDetail,
}) => {
    return (
        <div className="mb-8">
            {/* ライフポイント */}
            <div className="text-center mb-4">
                <span className="text-5xl font-bold text-red-500">8000</span>
            </div>

            {/* 対戦相手のフィールド（Grid配置） */}
            <div className="grid grid-cols-7 gap-2 max-w-4xl mx-auto mb-4">
                <FieldZone type={"deck"} card={null} className="w-20 h-28"></FieldZone>

                {/* 魔法・罠ゾーン（相手は上段、鏡写し） */}
                {[4, 3, 2, 1, 0].map((index) => (
                    <FieldZone
                        key={`opp-spell-${index}`}
                        card={opponentField.spellTrapZones[index]}
                        className="w-20 h-28"
                    />
                ))}
                <FieldZone type={"extra_deck"} card={null} className="w-20 h-28"></FieldZone>
            </div>

            {/* 対戦相手モンスターゾーン（Grid配置） */}
            <div className="grid grid-cols-7 gap-2 max-w-4xl mx-auto">
                <FieldZone card={null} className="w-20 h-28" type={"graveyard"} />
                {/* モンスターゾーン（鏡写し：4,3,2,1,0） */}
                {[4, 3, 2, 1, 0].map((index) => (
                    <FieldZone
                        key={`opp-monster-${index}`}
                        card={opponentField.monsterZones[index]}
                        className="w-20 h-28"
                    />
                ))}
                {/* 相手のフィールド魔法（右側） */}
                <FieldZone
                    type="field"
                    card={opponentField.fieldZone}
                    className="w-20 h-28"
                    onCardClick={(card, event) => {
                        if (card.position === "facedown") {
                            activateOpponentFieldSpell();
                        } else if (card.card.card_name === "チキンレース") {
                            if (event) {
                                setChickenRaceHover({
                                    card: card,
                                    x: event.clientX,
                                    y: event.clientY,
                                });
                            }
                        } else {
                            console.log("Opponent field spell clicked:", card.card.card_name);
                        }
                    }}
                    onCardRightClick={(card) => setShowCardDetail(card)}
                />
            </div>
        </div>
    );
};