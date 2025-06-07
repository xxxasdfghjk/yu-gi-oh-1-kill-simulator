import React, { useState, useEffect } from "react";
import { MultiCardConditionSelector } from "./MultiCardConditionSelector";
import { MultiOptionSelector } from "./MultiOptionSelector";
import SummonSelector from "./SummonSelector";
import type { GameStore } from "@/store/gameStore";

interface EffectQueueModalProps {
    effectQueue: any[];
    gameState: GameStore;
    processQueueTop: (action: any) => void;
    popQueue: () => void;
}

export const EffectQueueModal: React.FC<EffectQueueModalProps> = ({
    effectQueue,
    gameState,
    processQueueTop,
    popQueue,
}) => {
    const [currentEffect, setCurrentEffect] = useState<any>(null);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (effectQueue.length > 0 && !isClosing) {
            const effect = effectQueue[0];
            if (effect.type === "option" || effect.type === "select" || effect.type === "multiselect" || effect.type === "summon") {
                setCurrentEffect(effect);
            } else {
                setCurrentEffect(null);
            }
        }
    }, [effectQueue, isClosing]);

    const handleClose = (callback?: () => void) => {
        setIsClosing(true);
        setTimeout(() => {
            if (callback) callback();
            setCurrentEffect(null);
            setIsClosing(false);
        }, 300); // Match animation duration
    };

    if (!currentEffect) return null;

    switch (currentEffect.type) {
        case "option":
            return (
                <MultiOptionSelector
                    state={gameState}
                    title={`${currentEffect.cardInstance.card.card_name}: ${currentEffect.effectName}`}
                    onSelect={(option) => handleClose(() => processQueueTop({ type: "option", option: [option] }))}
                    onCancel={currentEffect.canCancel ? () => handleClose(() => popQueue()) : undefined}
                    optionList={currentEffect.option}
                    isOpen={!isClosing}
                />
            );

        case "select":
            return (
                <MultiCardConditionSelector
                    condition={currentEffect.condition}
                    getAvailableCards={currentEffect.getAvailableCards}
                    state={gameState}
                    title={`${currentEffect.cardInstance.card.card_name}: ${currentEffect.effectName}`}
                    onSelect={(card) => handleClose(() => processQueueTop({ type: "cardSelect", cardList: card }))}
                    onCancel={currentEffect.canCancel ? () => handleClose(() => popQueue()) : undefined}
                    type={"single"}
                    isOpen={!isClosing}
                />
            );

        case "multiselect":
            return (
                <MultiCardConditionSelector
                    title={`${currentEffect.cardInstance.card.card_name}: ${currentEffect.effectName}`}
                    onSelect={(card) => handleClose(() => processQueueTop({ type: "cardSelect", cardList: card }))}
                    onCancel={currentEffect.canCancel ? () => handleClose(() => popQueue()) : undefined}
                    filterFunction={currentEffect.filterFunction}
                    type={"multi"}
                    state={gameState}
                    getAvailableCards={currentEffect.getAvailableCards}
                    condition={currentEffect.condition}
                    isOpen={!isClosing}
                />
            );

        case "summon":
            return (
                <SummonSelector
                    optionPosition={currentEffect.optionPosition}
                    cardInstance={currentEffect.cardInstance}
                    onSelect={(zone, position) =>
                        handleClose(() => processQueueTop({ type: "summon", zone, position }))
                    }
                    state={gameState}
                    isOpen={!isClosing}
                />
            );

        default:
            return null;
    }
};