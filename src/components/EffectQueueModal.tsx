import React, { useState, useEffect } from "react";
import { MultiCardConditionSelector } from "./MultiCardConditionSelector";
import { MultiOptionSelector } from "./MultiOptionSelector";
import SummonSelector from "./SummonSelector";
import type { EffectQueueItem, GameStore, ProcessQueuePayload } from "@/store/gameStore";
import ModalWrapper from "./ModalWrapper";
import { type LinkMonsterCard } from "../types/card";
import { canLinkSummonAfterRelease, canXyzSummonAfterRelease } from "@/utils/gameUtils";
import { getChainableCards } from "@/utils/effectUtils";

interface EffectQueueModalProps {
    effectQueue: EffectQueueItem[];
    gameState: GameStore;
    processQueueTop: (payload: ProcessQueuePayload) => void;
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
                effect.type === "chain_check"
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
                <ModalWrapper isOpen={!isClosing}>
                    <h3 className="text-lg font-bold mb-4">{currentEffect.cardInstance.card.card_name}</h3>
                    <p className="mb-6">{currentEffect.effectName}</p>
                    <div className="flex justify-end space-x-3">
                        {currentEffect.canCancel && (
                            <button
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                onClick={() =>
                                    handleClose(() => {
                                        processQueueTop({ type: "confirm", confirmed: false });
                                    })
                                }
                            >
                                キャンセル
                            </button>
                        )}
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() =>
                                handleClose(() => {
                                    processQueueTop({ type: "confirm", confirmed: true });
                                })
                            }
                        >
                            発動
                        </button>
                    </div>
                </ModalWrapper>
            );

        case "material_select":
            return (
                <MultiCardConditionSelector
                    condition={(selectedCards, state) => {
                        const effect = currentEffect;
                        const canSummon =
                            currentEffect.summonType === "link"
                                ? canLinkSummonAfterRelease(
                                      selectedCards,
                                      state.field.extraMonsterZones,
                                      state.field.monsterZones
                                  )
                                : canXyzSummonAfterRelease(
                                      selectedCards,
                                      state.field.extraMonsterZones,
                                      state.field.monsterZones
                                  );
                        return (
                            (effect.targetMonster.card as LinkMonsterCard).materialCondition(selectedCards) && canSummon
                        );
                    }}
                    getAvailableCards={currentEffect.getAvailableCards}
                    state={gameState}
                    title={`${currentEffect.targetMonster.card.card_name}: 素材選択`}
                    onSelect={(selectedMaterials) => {
                        // Add perform_summon job to queue with selected materials

                        handleClose(() => processQueueTop({ type: "cardSelect", cardList: selectedMaterials }));
                    }}
                    onCancel={() => handleClose(() => popQueue())}
                    type={"multi"}
                    isOpen={!isClosing}
                />
            );

        case "chain_check": {
            const chainableCards = getChainableCards(gameState, currentEffect.chain ?? []);
            
            return (
                <ModalWrapper isOpen={!isClosing}>
                    <h3 className="text-lg font-bold mb-4">チェーン確認</h3>
                    <p className="mb-4">チェーンするカードを選択してください</p>

                    <div className="grid grid-cols-2 gap-3 mb-6 max-h-64 overflow-y-auto">
                        {chainableCards.map((card) => (
                            <button
                                key={card.id}
                                className="p-3 border rounded hover:bg-blue-50 text-left"
                                onClick={() =>
                                    handleClose(() => {
                                        processQueueTop({ type: "chain_select", selectedCard: card });
                                    })
                                }
                            >
                                <div className="font-medium">{card.card.card_name}</div>
                                <div className="text-sm text-gray-600">{card.card.card_type}</div>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            onClick={() =>
                                handleClose(() => {
                                    processQueueTop({ type: "chain_select" });
                                })
                            }
                        >
                            チェーンしない
                        </button>
                    </div>
                </ModalWrapper>
            );
        }

        default:
            return null;
    }
};
