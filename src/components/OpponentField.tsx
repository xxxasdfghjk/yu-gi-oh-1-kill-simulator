import React from "react";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";
import { CARD_SIZE } from "@/const/card";

interface OpponentFieldProps {
    opponentField: {
        monsterZones: (CardInstance | null)[];
        spellTrapZones: (CardInstance | null)[];
        fieldZone: CardInstance | null;
    };
}

export const OpponentField: React.FC<OpponentFieldProps> = ({
    opponentField,
}) => {
    return (
        <div className="mb-2 relative">
            {/* ライフポイント */}
            <div className="text-center mb-4 absolute right-2">
                <span className="text-5xl font-bold text-red-500 ">8000</span>
            </div>

            {/* 対戦相手モンスターゾーン（Grid配置） */}
            <div className="grid grid-cols-7 gap-2 max-w-4xl mx-auto">
                <FieldZone card={null} className={CARD_SIZE.MEDIUM} type={"graveyard"} />
                {/* モンスターゾーン（鏡写し：4,3,2,1,0） */}
                {[4, 3, 2, 1, 0].map((index) => (
                    <FieldZone
                        key={`opp-monster-${index}`}
                        card={opponentField.monsterZones[index]}
                        className={CARD_SIZE.MEDIUM}
                    />
                ))}
            </div>
        </div>
    );
};
