import React, { useCallback, useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSetAtom } from "jotai";
import { graveyardModalAtom } from "@/store/graveyardModalAtom";
import { HandArea } from "./HandArea";
import { PlayerField } from "./PlayerField";
import { ExtraMonsterZones } from "./ExtraMonsterZones";
import { ControlButtons } from "./ControlButtons";
import { searchCombinationLinkSummon, searchCombinationXyzSummon } from "@/utils/gameUtils";
import type { CardInstance } from "@/types/card";
import { HoveredCardDisplay } from "./HoveredCardDisplay";
import { GraveyardModal } from "./GraveyardModal";
import { ExtraDeckModal } from "./ExtraDeckModal";
import { EffectQueueModal } from "./EffectQueueModal";
import { isXyzMonster } from "@/utils/cardManagement";

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
        sendSpellToGraveyard,
        nextPhase,
        checkExodiaWin,
        endGame,
        judgeWin,
        draw,
    } = gameState;

    const setShowGraveyard = useSetAtom(graveyardModalAtom);
    const [showExtraDeck, setShowExtraDeck] = useState(false);

    const reset = useCallback(() => {
        initializeGame();
        setTimeout(() => draw(), 100);
        setTimeout(() => draw(), 200);
        setTimeout(() => draw(), 300);
        setTimeout(() => draw(), 400);
        setTimeout(() => draw(), 500);
    }, [initializeGame, draw]);

    useEffect(() => {
        reset();
    }, [reset]);

    const startSpecialSummon = (monster: CardInstance, summonType: "link" | "xyz" | "synchro" | "fusion") => {
        if (summonType === "link" && gameState.startLinkSummon) {
            gameState.startLinkSummon(monster);
        } else if (summonType === "xyz" && gameState.startXyzSummon) {
            gameState.startXyzSummon(monster);
        }
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

    const canPerformXyzSummon = (xyzMonster: CardInstance): boolean => {
        if (!isXyzMonster(xyzMonster.card)) return false;

        return searchCombinationXyzSummon(xyzMonster, gameState.field.extraMonsterZones, gameState.field.monsterZones);
    };
    useEffect(() => {
        const func = async () => {
            const currentEffect = effectQueue?.[0];
            if (currentEffect?.type === "notify") {
                if (currentEffect.effectType === "judge") {
                    judgeWin();
                } else if (currentEffect.effectType === "delay") {
                    // Process delay effects automatically
                    await new Promise((resolve) => setTimeout(resolve, currentEffect.delay ?? 50));
                    processQueueTop({ type: "delay" });
                }
            } else if (currentEffect?.type === "spell_end") {
                processQueueTop({ type: "spellend" });
            }
        };
        func();
    }, [effectQueue, popQueue, gameState, sendSpellToGraveyard, processQueueTop, judgeWin]);
    console.log(effectQueue);
    useEffect(() => {
        checkExodiaWin();
    }, [checkExodiaWin, hand]);

    useEffect(() => {
        if (phase === "main1" && turn === 2) {
            checkExodiaWin();
            endGame();
        }
    }, [checkExodiaWin, endGame, phase, turn]);

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
                            <HoveredCardDisplay />
                            <div className="mr-44">
                                {/* エクストラモンスターゾーン（相手と自分の間） */}
                                <ExtraMonsterZones
                                    extraMonsterZones={field.extraMonsterZones}
                                    opponentField={opponentField}
                                />

                                {/* プレイヤーエリア */}
                                <PlayerField
                                    field={field}
                                    deck={deck}
                                    extraDeck={extraDeck}
                                    graveyard={graveyard}
                                    setShowGraveyard={setShowGraveyard}
                                    setShowExtraDeck={setShowExtraDeck}
                                />
                            </div>
                        </div>

                        {/* 手札エリア */}
                        <HandArea hand={hand} />
                        {/* ライフポイント */}
                    </div>
                </div>

                {/* コントロールボタン */}
                <ControlButtons isOpponentTurn={isOpponentTurn} nextPhase={nextPhase} initializeGame={reset} />

                {/* リンク */}
                <div className="fixed bottom-4 right-8 space-y-2">
                    <div className="text-center ml-8">
                        <span className="text-5xl font-bold text-blue-600">{lifePoints}</span>
                    </div>
                </div>

                {/* 効果キューモーダル - 新しい統一システム */}
                <EffectQueueModal
                    effectQueue={effectQueue}
                    gameState={gameState}
                    processQueueTop={processQueueTop}
                    popQueue={popQueue}
                />

                {/* モーダル */}
                <GraveyardModal graveyard={graveyard} gameState={gameState} />

                <ExtraDeckModal
                    isOpen={showExtraDeck}
                    onClose={() => setShowExtraDeck(false)}
                    extraDeck={extraDeck}
                    canPerformLinkSummon={canPerformLinkSummon}
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
