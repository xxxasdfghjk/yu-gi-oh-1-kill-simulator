import React, { useState, useEffect } from "react";
import { MultiCardConditionSelector } from "./MultiCardConditionSelector";
import { MultiOptionSelector } from "./MultiOptionSelector";
import SummonSelector from "./SummonSelector";
import type { EffectQueueItem, GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";

interface EffectQueueModalProps {
    effectQueue: EffectQueueItem[];
    gameState: GameStore;
    processQueueTop: (payload:
        | { type: "cardSelect"; cardList: CardInstance[] }
        | { type: "option"; option: { name: string; value: string }[] }
        | { type: "summon"; zone: number; position: "attack" | "defense" | "facedown" | "facedown_defense" }
        | { type: "confirm"; confirmed: boolean }
    ) => void;
    popQueue: () => void;
}

export const EffectQueueModal: React.FC<EffectQueueModalProps> = ({
    effectQueue,
    gameState,
    processQueueTop,
    popQueue,
}) => {
    const [currentEffect, setCurrentEffect] = useState<EffectQueueItem | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (effectQueue.length > 0 && !isClosing) {
            const effect = effectQueue[0];
            if (
                effect.type === "option" ||
                effect.type === "select" ||
                effect.type === "multiselect" ||
                effect.type === "summon" ||
                effect.type === "confirm" ||
                effect.type === "material_select" ||
                effect.type === "perform_summon"
            ) {
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
                    popQueue={popQueue}
                    optionPosition={currentEffect.optionPosition}
                    cardInstance={currentEffect.cardInstance}
                    onSelect={(zone, position) =>
                        handleClose(() => processQueueTop({ type: "summon", zone, position }))
                    }
                    state={gameState}
                    isOpen={!isClosing}
                />
            );

        case "confirm":
            return (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4">
                            {currentEffect.cardInstance.card.card_name}
                        </h3>
                        <p className="mb-6">
                            {currentEffect.effectName}
                        </p>
                        <div className="flex justify-end space-x-3">
                            {currentEffect.canCancel && (
                                <button
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    onClick={() => handleClose(() => processQueueTop({ type: "confirm", confirmed: false }))}
                                >
                                    キャンセル
                                </button>
                            )}
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                onClick={() => handleClose(() => processQueueTop({ type: "confirm", confirmed: true }))}
                            >
                                確認
                            </button>
                        </div>
                    </div>
                </div>
            );

        case "material_select":
            return (
                <MultiCardConditionSelector
                    condition={(selectedCards) => {
                        const effect = currentEffect as any;
                        const materialCondition = effect.targetMonster.card.materialCondition;
                        if (materialCondition && selectedCards.length > 0) {
                            return materialCondition(selectedCards);
                        }
                        return selectedCards.length >= effect.requiredCount;
                    }}
                    getAvailableCards={() => (currentEffect as any).availableMaterials}
                    state={gameState}
                    title={`${(currentEffect as any).targetMonster.card.card_name}: 素材選択`}
                    onSelect={(selectedMaterials) => {
                        // Add perform_summon job to queue with selected materials
                        gameState.addEffectToQueue({
                            id: (currentEffect as any).targetMonster.id + "_perform_summon",
                            type: "perform_summon",
                            cardInstance: (currentEffect as any).targetMonster,
                            effectType: "execute_special_summon",
                            targetMonster: (currentEffect as any).targetMonster,
                            selectedMaterials: selectedMaterials,
                            summonType: (currentEffect as any).summonType
                        });
                        handleClose(() => popQueue());
                    }}
                    onCancel={() => handleClose(() => popQueue())}
                    type={"multi"}
                    isOpen={!isClosing}
                />
            );

        case "perform_summon":
            return (
                <SummonSelector
                    popQueue={popQueue}
                    optionPosition={["attack", "defense"]}
                    cardInstance={(currentEffect as any).targetMonster}
                    onSelect={(zone, position) => {
                        // Execute the actual summon
                        const effect = currentEffect as any;
                        const targetMonster = effect.targetMonster;
                        const selectedMaterials = effect.selectedMaterials;
                        
                        // Remove materials from field
                        selectedMaterials.forEach((material: CardInstance) => {
                            const monsterIndex = gameState.field.monsterZones.findIndex(z => z?.id === material.id);
                            if (monsterIndex !== -1) {
                                gameState.field.monsterZones[monsterIndex] = null;
                            } else {
                                const extraIndex = gameState.field.extraMonsterZones.findIndex(z => z?.id === material.id);
                                if (extraIndex !== -1) {
                                    gameState.field.extraMonsterZones[extraIndex] = null;
                                }
                            }
                        });
                        
                        // Place the summoned monster
                        targetMonster.location = "MonsterField";
                        targetMonster.position = position;
                        if (effect.summonType === "xyz") {
                            targetMonster.materials = selectedMaterials;
                        }
                        
                        // Find appropriate zone
                        if (effect.summonType === "link" || effect.summonType === "xyz") {
                            // Extra monsters go to extra monster zone or main monster zone
                            const emptyExtraIndex = gameState.field.extraMonsterZones.findIndex(z => z === null);
                            if (emptyExtraIndex !== -1) {
                                gameState.field.extraMonsterZones[emptyExtraIndex] = targetMonster;
                            } else {
                                const emptyMainIndex = gameState.field.monsterZones.findIndex(z => z === null);
                                if (emptyMainIndex !== -1) {
                                    gameState.field.monsterZones[emptyMainIndex] = targetMonster;
                                }
                            }
                        }
                        
                        handleClose(() => popQueue());
                    }}
                    state={gameState}
                    isOpen={!isClosing}
                />
            );

        default:
            return null;
    }
};
