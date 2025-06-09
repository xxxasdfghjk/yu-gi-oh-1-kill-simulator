import React, { useEffect, useState, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import { HandArea } from "./HandArea";
import { PlayerField } from "./PlayerField";
import { ExtraMonsterZones } from "./ExtraMonsterZones";
import { ControlButtons } from "./ControlButtons";
import { isMonsterCard, searchCombinationLinkSummon, searchCombinationXyzSummon } from "@/utils/gameUtils";
import type { CardInstance } from "@/types/card";
import { HoveredCardDisplay } from "./HoveredCardDisplay";
import { GraveyardModal } from "./GraveyardModal";
import { ExtraDeckModal } from "./ExtraDeckModal";
import { EffectQueueModal } from "./EffectQueueModal";

export const GameBoard: React.FC = () => {
    const gameState = useGameStore();
    const {
        hand,
        field,
        deck,
        graveyard,
        extraDeck,
        lifePoints,
        phase,
        turn,
        initializeGame,
        effectQueue,
        processQueueTop,
        popQueue,
        gameOver,
        winner,
        isOpponentTurn,
        opponentField,
    } = gameState;

    const [showGraveyard, setShowGraveyard] = useState(false);
    const [showExtraDeck, setShowExtraDeck] = useState(false);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    // Game logic functions
    const nextPhase = () => {
        // Implement phase transition logic
        // This would need to be added to gameStore
    };

    const playCard = useCallback(
        (_cardId: string) => {
            // Implement card playing logic via gameStore
            if (gameState.playCard) {
                gameState.playCard(_cardId);
            }
        },
        [gameState]
    );

    const setCard = (cardId: string | null) => {
        setSelectedCard(cardId);
    };

    // Removed individual card effect handler - using generic handleEffect instead

    const startSpecialSummon = (monster: CardInstance, summonType: "link" | "xyz" | "synchro" | "fusion") => {
        // Generic special summon handler
        // Use the effect system for special summons
        if (summonType === "link" && gameState.startLinkSummon) {
            gameState.startLinkSummon(monster);
        } else if (summonType === "xyz" && gameState.startXyzSummon) {
            gameState.startXyzSummon(monster);
        }
    };

    const sendToGraveyard = useCallback(
        (cardInstance: CardInstance) => {
            // Use gameStore's sendSpellToGraveyard
            if (gameState.sendSpellToGraveyard) {
                gameState.sendSpellToGraveyard(cardInstance);
            }
        },
        [gameState]
    );

    const checkExodiaWin = () => {
        // Implement exodia win check logic
        // This would need to be added to gameStore
    };

    const endGame = () => {
        // Implement end game logic
        // This would need to be added to gameStore
    };

    const judgeWin = () => {
        // Implement judge win logic
        // This would need to be added to gameStore
    };

    const selectedCardInstance = hand.find((c) => c.id === selectedCard) || null;

    const isLinkMonster = (card: CardInstance): boolean => {
        return isMonsterCard(card.card) && (card.card as { monster_type?: string }).monster_type === "リンクモンスター";
    };

    const canPerformLinkSummon = (linkMonster: CardInstance): boolean => {
        // アウローラドンの効果でリンク召喚制限がある場合
        if (gameState.isLinkSummonProhibited) {
            return false;
        }

        return searchCombinationLinkSummon(
            linkMonster,
            gameState.field.extraMonsterZones,
            gameState.field.monsterZones
        );
    };

    const isXyzMonster = (card: CardInstance): boolean => {
        return (
            isMonsterCard(card.card) && (card.card as { monster_type?: string }).monster_type === "エクシーズモンスター"
        );
    };

    const canPerformXyzSummon = (xyzMonster: CardInstance): boolean => {
        if (!isXyzMonster(xyzMonster)) return false;

        return searchCombinationXyzSummon(xyzMonster, gameState.field.extraMonsterZones, gameState.field.monsterZones);
    };

    const handleEffect = (card: CardInstance) => {
        // Generic effect handler - check card's effect conditions and push to queue
        if (card.card.effect?.onIgnition) {
            const canActivate = card.card.effect.onIgnition.condition(gameState, card);
            if (canActivate) {
                // Push effect activation to queue instead of direct execution
                gameState.addEffectToQueue({
                    id: card.id + "_ignition",
                    type: "activate_spell",
                    cardInstance: card,
                    effectType: "card_effect_activation",
                });
            }
        }
    };

    const handleFieldCardClick = (card: CardInstance) => {
        // Generic field card click handler - push to queue instead of direct activation
        if (card.card.effect?.onIgnition) {
            const canActivate = card.card.effect.onIgnition.condition(gameState, card);
            if (canActivate) {
                // Push effect activation to queue instead of direct execution
                gameState.addEffectToQueue({
                    id: card.id + "_field_ignition",
                    type: "activate_spell",
                    cardInstance: card,
                    effectType: "field_card_effect_activation",
                });
            }
        }
    };

    useEffect(() => {
        const currentEffect = effectQueue?.[0];
        if (currentEffect?.type === "activate_spell") {
            // Execute the card's effect when activate_spell is processed
            if (
                currentEffect.effectType === "card_effect_activation" ||
                currentEffect.effectType === "field_card_effect_activation" ||
                currentEffect.effectType === "spell_activation"
            ) {
                const card = currentEffect.cardInstance;
                if (card.card.effect?.onIgnition) {
                    // Execute the effect directly here since it's now properly queued
                    card.card.effect.onIgnition.effect(gameState, card);
                }
                popQueue();
            }
        }
        if (currentEffect?.type === "spell_end") {
            sendToGraveyard(currentEffect.cardInstance);
            popQueue();
        }
        if (currentEffect?.type === "notify") {
            if (currentEffect.effectType === "judge") {
                judgeWin();
            }
        }
    }, [effectQueue, popQueue, sendToGraveyard, gameState]);

    useEffect(() => {
        checkExodiaWin();
    }, [hand]);

    useEffect(() => {
        if (phase === "draw") {
            endGame();
        }
    }, [phase]);

    return (
        <div className="min-h-screen min-w-[1920px] bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200">
            <div>
                <div className="px-4 py-2 relative">
                    <div className=" absolute right-10">
                        <div className="text-xs text-gray-600 mt-1">Turn {turn}</div>
                        <div className="text-xs text-gray-600">
                            {isOpponentTurn ? "Opponent " : ""}
                            {phase}
                        </div>
                    </div>

                    <div>
                        <div className=" flex justify-between">
                            <HoveredCardDisplay state={gameState} />
                            <div className="mr-44">
                                {/* エクストラモンスターゾーン（相手と自分の間） */}
                                <ExtraMonsterZones
                                    extraMonsterZones={field.extraMonsterZones}
                                    handleFieldCardClick={handleFieldCardClick}
                                    opponentField={opponentField}
                                />

                                {/* プレイヤーエリア */}
                                <PlayerField
                                    field={field}
                                    deck={deck}
                                    extraDeck={extraDeck}
                                    graveyard={graveyard}
                                    turn={turn}
                                    phase={phase}
                                    isOpponentTurn={isOpponentTurn}
                                    handleFieldCardClick={handleFieldCardClick}
                                    setShowGraveyard={setShowGraveyard}
                                    setShowExtraDeck={setShowExtraDeck}
                                />
                            </div>
                        </div>

                        {/* 手札エリア */}
                        <HandArea
                            hand={hand}
                            selectedCard={selectedCard}
                            lifePoints={lifePoints}
                            playCard={playCard}
                            setCard={setCard}
                            onCardHoverLeave={() => 1}
                            handleEffect={handleEffect}
                        />
                    </div>
                </div>

                {/* コントロールボタン */}
                <ControlButtons
                    selectedCardInstance={selectedCardInstance}
                    selectedCard={selectedCard}
                    isOpponentTurn={isOpponentTurn}
                    nextPhase={nextPhase}
                    playCard={playCard}
                    setCard={setCard}
                    initializeGame={initializeGame}
                />

                {/* リンク */}
                <div className="fixed bottom-4 right-8 space-y-2">
                    <button className="block bg-sky-400 hover:bg-sky-500 text-white px-4 py-2 rounded">
                        HOW TO PLAY
                    </button>
                    <button className="block bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded">
                        不具合を報告
                    </button>
                </div>

                {/* 効果キューモーダル - 新しい統一システム */}
                <EffectQueueModal
                    effectQueue={effectQueue}
                    gameState={gameState}
                    processQueueTop={processQueueTop}
                    popQueue={popQueue}
                />

                {/* モーダル */}
                <GraveyardModal
                    isOpen={showGraveyard}
                    onClose={() => setShowGraveyard(false)}
                    graveyard={graveyard}
                    gameState={gameState}
                    handleEffect={handleEffect}
                />

                <ExtraDeckModal
                    isOpen={showExtraDeck}
                    onClose={() => setShowExtraDeck(false)}
                    extraDeck={extraDeck}
                    isLinkMonster={isLinkMonster}
                    canPerformLinkSummon={canPerformLinkSummon}
                    isXyzMonster={isXyzMonster}
                    canPerformXyzSummon={canPerformXyzSummon}
                    startLinkSummon={(monster) => startSpecialSummon(monster, "link")}
                    startXyzSummon={(monster) => startSpecialSummon(monster, "xyz")}
                />

                {/* YOU WIN オーバーレイ */}
                {gameOver && winner === "player" && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                        <div className="text-center">
                            <h1 className="text-8xl font-bold text-yellow-400 mb-4 animate-pulse">YOU WIN</h1>
                            <p className="text-2xl text-white">エクゾディアの5つのパーツが揃いました！</p>
                        </div>
                    </div>
                )}
                {gameOver && winner === "timeout" && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                        <div className="text-center">
                            <h1 className="text-8xl font-bold text-yellow-400 mb-4 animate-pulse">YOU LOSE</h1>
                            <p className="text-2xl text-white">あなたの負けです！</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
