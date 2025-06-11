import React from "react";
import type { CardInstance } from "@/types/card";
import { AnimatePresence } from "framer-motion";
import { FieldZone } from "./FieldZone";
import { CARD_SIZE, getLocationVector } from "@/const/card";
import { useGameStore } from "@/store/gameStore";
import AnimationWrapper from "./AnimationWrapper";
interface HandAreaProps {
    hand: CardInstance[];
}

export type Action = "summon" | "activate" | "set" | "effect";

export const HandArea: React.FC<HandAreaProps> = ({ hand }) => {
    const { currentFrom, currentTo } = useGameStore();
    const cardSizeClass = CARD_SIZE.MEDIUM;
    const initial = currentTo.location === "Hand" ? getLocationVector(currentTo, currentFrom) : {};
    return (
        <div className="flex space-x-2 justify-center items-center mt-2 min-w-full">
            <div className="flex space-x-2 mb-2 overflow-visible">
                <AnimatePresence mode={"popLayout"}>
                    {hand.map((card) => (
                        <AnimationWrapper
                            key={card.id}
                            layout // 自動的に位置調整
                            initial={{ ...initial }}
                        >
                            <FieldZone card={card} className={cardSizeClass} />
                        </AnimationWrapper>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
