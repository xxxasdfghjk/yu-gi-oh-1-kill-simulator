import React from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
interface HandAreaProps {
    hand: CardInstance[];
    lifePoints: number;
}

export type Action = "summon" | "activate" | "set" | "effect";

export const HandArea: React.FC<HandAreaProps> = ({ hand, lifePoints }) => {
    return (
        <div className="flex justify-center items-center gap-4">
            <div className="flex gap-1 overflow-x-auto">
                {hand.map((card) => (
                    <div
                        key={card.id}
                        className={`cursor-pointer transition-transform hover:-translate-y-2 
                        `}
                    >
                        <Card card={card} size="medium" />
                    </div>
                ))}
            </div>

            {/* ライフポイント */}
            <div className="text-center ml-8">
                <span className="text-5xl font-bold text-blue-600">{lifePoints}</span>
            </div>
        </div>
    );
};
