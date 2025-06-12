import React from "react";
import type { CardInstance } from "@/types/card";
import { AnimatePresence } from "framer-motion";
import { getLocationVectorWithPosition } from "@/const/card";
import { useGameStore } from "@/store/gameStore";
import AnimationWrapper from "./AnimationWrapper";
import { Card } from "./Card";
import { isExodia } from "@/utils/cardManagement";
interface HandAreaProps {
    hand: CardInstance[];
}

export type Action = "summon" | "activate" | "set" | "effect";

export const HandArea: React.FC<HandAreaProps> = ({ hand }) => {
    const { currentFrom, currentTo } = useGameStore();
    const initial = currentTo.location === "Hand" ? getLocationVectorWithPosition(currentTo, currentFrom) : {};
    return (
        <div
            className={`relative flex space-x-2 justify-center items-center mt-2 min-w-full 
            `}
        >
            <div className="flex space-x-2 mb-2 overflow-visible">
                <AnimatePresence mode={"popLayout"}>
                    {hand.map((card) => (
                        <AnimationWrapper
                            key={card.id}
                            layout // 自動的に位置調整
                            initial={{ ...initial }}
                        >
                            <Card card={card} size="medium"></Card>
                        </AnimationWrapper>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
