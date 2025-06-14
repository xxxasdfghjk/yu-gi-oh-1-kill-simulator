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
import type { Deck } from "@/data/deckUtils";
import { HoveredCardDisplay } from "./HoveredCardDisplay";
import { GraveyardModal } from "./GraveyardModal";
import { ExtraDeckModal } from "./ExtraDeckModal";
import { EffectQueueModal } from "./EffectQueueModal";
import { DeckSelectionModal } from "./DeckSelectionModal";
import { isXyzMonster } from "@/utils/cardManagement";
import { ExodiaVictoryRotationAnime } from "./ExodiaVictoryRotationAnime";
import { TurnEndAnimation } from "./TurnEndAnimation";
import { GameStatusDisplay } from "./GameStatusDisplay";
import { Tooltip } from "./Tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationBanner } from "./NotificationBanner";

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
        // Deck selection
        selectedDeck,
        availableDecks,
        isDeckSelectionOpen,
        selectDeck,
        setDeckSelectionOpen,
        originDeck,
    } = gameState;

    const setShowGraveyard = useSetAtom(graveyardModalAtom);
    const [showExtraDeck, setShowExtraDeck] = useState(false);
    const [showTurnEndAnimation, setShowTurnEndAnimation] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [currentNotification, setCurrentNotification] = useState<{
        message: string;
        duration: number;
    } | null>(null);

    const drawInitial = useCallback(() => {
        setTimeout(() => draw(), 10);
        setTimeout(() => draw(), 20);
        setTimeout(() => draw(), 30);
        setTimeout(() => draw(), 40);
        setTimeout(() => draw(), 50);
        if (originDeck?.rules.includes("start_six_hand")) {
            setTimeout(() => draw(), 60);
        }
    }, [draw, originDeck]);

    const reset = useCallback(() => {
        if (selectedDeck) {
            initializeGame(selectedDeck);
            drawInitial();
        }
    }, [initializeGame, selectedDeck, drawInitial]);

    const handleGameReset = useCallback(() => {
        if (isResetting) return; // 連打防止
        setIsResetting(true);
        reset();

        // 2秒後にボタンを再度有効化
        setTimeout(() => {
            setIsResetting(false);
        }, 2000);
    }, [reset, isResetting]);

    // Handle deck selection
    const handleDeckSelect = useCallback(
        (deck: Deck) => {
            selectDeck(deck);
            initializeGame(deck);
            drawInitial();
            setHasInitialized(true); // Mark as initialized after deck change
        },
        [selectDeck, initializeGame, drawInitial]
    );

    // Only initialize when a deck is first selected (not when modal is opened/closed)
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (selectedDeck && !isDeckSelectionOpen && !hasInitialized) {
            reset();
            setHasInitialized(true);
        }
    }, [selectedDeck, isDeckSelectionOpen, reset, hasInitialized]);

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
        if (gameState.phase !== "main1") {
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
        if (gameState.phase !== "main1") {
            return false;
        }

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
            } else if (currentEffect?.type === "notification") {
                // Show notification banner
                setCurrentNotification({
                    message: currentEffect.message,
                    duration: currentEffect.duration ?? 2000,
                });

                // Auto-process notification after showing
                setTimeout(() => {
                    processQueueTop({ type: "delay" });
                }, 100);
            } else if (currentEffect?.type === "spell_end") {
                processQueueTop({ type: "spellend" });
            }
        };
        func();
    }, [effectQueue, popQueue, gameState, sendSpellToGraveyard, processQueueTop, judgeWin]);
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
                    <div>
                        <div className=" flex justify-end">
                            <HoveredCardDisplay />
                            <div>
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
                            <div className="w-72 flex flex-col itmes-center justify-between">
                                {/* 新しいゲーム状態表示 */}
                                <GameStatusDisplay turn={turn} phase={phase} isOpponentTurn={isOpponentTurn} />

                                {/* コントロールボタン */}
                                <ControlButtons
                                    isOpponentTurn={isOpponentTurn}
                                    nextPhase={() => {
                                        if (phase === "main1") {
                                            // ターンエンド時にアニメーション表示
                                            setShowTurnEndAnimation(true);
                                        }
                                        nextPhase();
                                    }}
                                    initializeGame={reset}
                                    selectedDeck={selectedDeck}
                                    onChangeDeck={() => setDeckSelectionOpen(true)}
                                />
                                {/* ライフポイント表示 */}
                                <div className="space-y-2">
                                    <div className="text-center ml-8">
                                        <div className="text-sm text-gray-600 mb-1">LIFE POINTS</div>
                                        <Tooltip content={`現在のライフポイント: ${lifePoints}`} position="top">
                                            <span className="text-5xl font-bold text-blue-600 cursor-help">
                                                {lifePoints}
                                            </span>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 手札エリア */}
                        <HandArea hand={hand} />
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
                <AnimatePresence>
                    {gameOver && winner === "player" && (
                        <motion.div
                            className="fixed inset-0 z-50"
                            initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                            animate={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
                            exit={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                        >
                            {/* エクゾディアアニメーション（背景） */}
                            <div className="absolute inset-0 z-10">
                                <ExodiaVictoryRotationAnime isVisible={true} />
                            </div>

                            {/* テキストとボタン（前景） */}
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <motion.div
                                    className="text-center"
                                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{
                                        delay: 4,
                                        duration: 0.8,
                                        ease: "easeOut",
                                        type: "spring",
                                        stiffness: 100,
                                    }}
                                >
                                    <motion.h1
                                        className="text-8xl font-bold text-yellow-400 mb-4"
                                        animate={{
                                            textShadow: [
                                                "0 0 20px rgba(255, 255, 0, 0.8)",
                                                "0 0 40px rgba(255, 255, 0, 1)",
                                                "0 0 20px rgba(255, 255, 0, 0.8)",
                                            ],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        YOU WIN
                                    </motion.h1>
                                    <motion.p
                                        className="text-2xl text-white mb-8"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 4.6, duration: 0.6 }}
                                    >
                                        エクゾディアの5つのパーツが揃いました！
                                    </motion.p>
                                    <motion.button
                                        className={`font-bold py-4 px-8 rounded-full text-xl shadow-lg transition-colors ${
                                            isResetting
                                                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 5.2, duration: 0.6 }}
                                        whileHover={!isResetting ? { scale: 1.05 } : {}}
                                        whileTap={!isResetting ? { scale: 0.95 } : {}}
                                        onClick={handleGameReset}
                                        disabled={isResetting}
                                    >
                                        {isResetting ? "リセット中..." : "最初から始める"}
                                    </motion.button>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {gameOver && winner === "timeout" && (
                        <motion.div
                            className="fixed inset-0 flex items-center justify-center z-50"
                            initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                            animate={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
                            exit={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                        >
                            <motion.div
                                className="text-center"
                                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.8,
                                    duration: 0.8,
                                    ease: "easeOut",
                                    type: "spring",
                                    stiffness: 100,
                                }}
                            >
                                <motion.h1
                                    className="text-8xl font-bold text-red-400 mb-4"
                                    animate={{
                                        textShadow: [
                                            "0 0 20px rgba(255, 100, 100, 0.8)",
                                            "0 0 40px rgba(255, 50, 50, 1)",
                                            "0 0 20px rgba(255, 100, 100, 0.8)",
                                        ],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                >
                                    YOU LOSE
                                </motion.h1>
                                <motion.p
                                    className="text-2xl text-white mb-8"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.2, duration: 0.6 }}
                                >
                                    あなたの負けです！
                                </motion.p>
                                <motion.button
                                    className={`font-bold py-4 px-8 rounded-full text-xl shadow-lg transition-colors ${
                                        isResetting
                                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                            : "bg-red-600 hover:bg-red-700 text-white"
                                    }`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.8, duration: 0.6 }}
                                    whileHover={!isResetting ? { scale: 1.05 } : {}}
                                    whileTap={!isResetting ? { scale: 0.95 } : {}}
                                    onClick={handleGameReset}
                                    disabled={isResetting}
                                >
                                    {isResetting ? "リセット中..." : "最初から始める"}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ターンエンドアニメーション */}
                <TurnEndAnimation show={showTurnEndAnimation} onComplete={() => setShowTurnEndAnimation(false)} />

                {/* デッキ選択モーダル */}
                <DeckSelectionModal
                    isOpen={isDeckSelectionOpen}
                    availableDecks={availableDecks}
                    onSelectDeck={handleDeckSelect}
                    onClose={() => setDeckSelectionOpen(false)}
                />

                {/* 通知バナー */}
                {currentNotification && (
                    <NotificationBanner
                        message={currentNotification.message}
                        duration={currentNotification.duration}
                        isVisible={!!currentNotification}
                        onComplete={() => setCurrentNotification(null)}
                    />
                )}
            </div>
        </div>
    );
};
