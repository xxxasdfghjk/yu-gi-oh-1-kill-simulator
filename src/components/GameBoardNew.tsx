import React, { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { HandArea } from "./HandArea";
import { PlayerField } from "./PlayerField";
import { ExtraMonsterZones } from "./ExtraMonsterZones";
import { ControlButtons } from "./ControlButtons";
import { isMonsterCard, searchCombinationLinkSummon } from "@/utils/gameUtils";
import {
    canActivateAruZeta,
    canActivateBanAlpha,
    canActivateEruGanma,
    canActivateBeatrice,
    canActivatePtolemyM7,
    canActivateAuroradon,
    canActivateUnionCarrier,
    canActivateMeteorKikougunGraveyard,
} from "@/utils/summonUtils";
import type { CardInstance } from "@/types/card";
import { HoveredCardDisplay } from "./HoveredCardDisplay";
import { GraveyardModal } from "./GraveyardModal";
import { ExtraDeckModal } from "./ExtraDeckModal";
import { EffectQueueModal } from "./EffectQueueModal";
import { getLevel } from "../utils/gameUtils";
import { getLinkMonsterSummonalble } from "./SummonSelector";

export const GameBoardNew: React.FC = () => {
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
        selectedCard,
        nextPhase,
        playCard,
        setCard,
        activateChickenRaceEffect,
        isOpponentTurn,
        bonmawashiRestriction,
        startLinkSummon,
        startXyzSummon,
        opponentField,
        effectQueue,
        processQueueTop,
        sendSpellToGraveyard,
        popQueue,
        activateDreitrons,
        activateBeatriceEffect,
        activatePtolemyM7Effect,
        activateAuroradonEffect,
        activateUnionCarrierEffect,
        activateMeteorKikougunGraveyardEffect,
    } = useGameStore();

    const [showGraveyard, setShowGraveyard] = useState(false);
    const [showExtraDeck, setShowExtraDeck] = useState(false);
    const [chickenRaceHover, setChickenRaceHover] = useState<{ card: CardInstance; x: number; y: number } | null>(null);
    const gameState = useGameStore();

    useEffect(() => {
        initializeGame();
    }, [initializeGame]); // initializeGameを依存配列に追加

    const selectedCardInstance = hand.find((c) => c.id === selectedCard) || null;

    const isLinkMonster = (card: CardInstance): boolean => {
        return card.card.card_type === "リンクモンスター";
    };

    const canPerformLinkSummon = (linkMonster: CardInstance): boolean => {
        return searchCombinationLinkSummon(
            linkMonster,
            gameState.field.extraMonsterZones,
            gameState.field.monsterZones
        );
    };

    const isXyzMonster = (card: CardInstance): boolean => {
        return card.card.card_type === "エクシーズモンスター";
    };

    const canPerformXyzSummon = (xyzMonster: CardInstance): boolean => {
        if (!isXyzMonster(xyzMonster)) return false;

        const xyzCard = xyzMonster.card as { rank?: number };
        const requiredRank = xyzCard.rank || 0;
        const requiredMaterials = 2; // 基本的に2体

        const availableMaterials = field.monsterZones.filter((c): c is CardInstance => {
            if (!c || !isMonsterCard(c.card)) return false;
            const cardLevel = getLevel(c) || 0;
            return cardLevel === requiredRank;
        });

        return availableMaterials.length >= requiredMaterials;
    };

    const handleEffect = (card: CardInstance) => {
        if (card.card.card_name === "竜輝巧－バンα") {
            // 発動条件をチェック
            if (!canActivateBanAlpha(gameState)) {
                return;
            }
            activateDreitrons(card);
        } else if (card.card.card_name === "竜輝巧－エルγ") {
            // 発動条件をチェック
            if (!canActivateEruGanma(gameState)) {
                return;
            }
            activateDreitrons(card);
        } else if (card.card.card_name === "竜輝巧－アルζ") {
            if (!canActivateAruZeta(gameState)) {
                return;
            }
            activateDreitrons(card);
        } else if (card.card.card_name === "流星輝巧群") {
            if (!canActivateMeteorKikougunGraveyard(gameState)) {
                return;
            }
            activateMeteorKikougunGraveyardEffect(card);
        }
    };

    const handleFieldCardClick = (card: CardInstance, event?: React.MouseEvent) => {
        if (card.card.card_name === "チキンレース") {
            // チキンレースの場合は選択肢を表示
            if (event) {
                setChickenRaceHover({
                    card: card,
                    x: event.clientX,
                    y: event.clientY,
                });
            }
        } else if (card.card.card_name === "永遠の淑女 ベアトリーチェ" && canActivateBeatrice(gameState)) {
            // ベアトリーチェの効果発動
            activateBeatriceEffect(card);
        } else if (card.card.card_name === "セイクリッド・トレミスM7" && canActivatePtolemyM7(gameState)) {
            // トレミスM7の効果発動
            activatePtolemyM7Effect(card);
        } else if (card.card.card_name === "幻獣機アウローラドン" && canActivateAuroradon(gameState)) {
            // アウローラドンの効果発動
            activateAuroradonEffect(card);
        } else if (card.card.card_name === "ユニオン・キャリアー" && canActivateUnionCarrier(gameState)) {
            // ユニオン・キャリアーの効果発動
            activateUnionCarrierEffect(card);
        }
    };
    useEffect(() => {
        const currentEffect = effectQueue?.[0];
        console.log(currentEffect);
        console.log(effectQueue);
        if (currentEffect?.type === "activate_spell") {
            processQueueTop({ type: "activate_spell" });
        }
        if (currentEffect?.type === "spell_end") {
            sendSpellToGraveyard(currentEffect.cardInstance);
            popQueue();
        }
    }, [effectQueue, gameState.effectQueue, popQueue, processQueueTop, sendSpellToGraveyard]);

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
                        {bonmawashiRestriction && <div className="text-xs text-red-600 font-bold">盆回し制限</div>}
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
                                    setChickenRaceHover={setChickenRaceHover}
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
                                    bonmawashiRestriction={bonmawashiRestriction}
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

                {/* おろかな埋葬効果のカード選択 - 現在はキューシステムで処理 */}

                {/* エクストラデッキのカード選択 */}

                {/* モンスター召喚選択 */}
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
                    startLinkSummon={startLinkSummon}
                    startXyzSummon={startXyzSummon}
                />

                {/* チキンレース効果選択モーダル */}
                {chickenRaceHover && (
                    <div className="fixed inset-0 bg-transparent z-50" onClick={() => setChickenRaceHover(null)}>
                        <div
                            className="absolute bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 min-w-64"
                            style={{
                                left: chickenRaceHover.x - 100,
                                top: chickenRaceHover.y - 50,
                                zIndex: 60,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h4 className="text-center font-bold mb-3 text-gray-800">チキンレース効果選択</h4>
                            <p className="text-xs text-center mb-3 text-gray-600">
                                コスト: 1000LP支払い
                                {chickenRaceHover.card.location === "field_spell_trap" &&
                                    gameState.opponentField.fieldZone?.id === chickenRaceHover.card.id && (
                                        <span className="block text-blue-600 font-semibold">
                                            （相手フィールドから使用）
                                        </span>
                                    )}
                            </p>

                            <div className="space-y-2">
                                <button
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        activateChickenRaceEffect("draw");
                                        setChickenRaceHover(null);
                                    }}
                                    disabled={
                                        lifePoints <= 1000 ||
                                        gameState.hasActivatedExtravagance ||
                                        gameState.hasActivatedChickenRace
                                    }
                                >
                                    ● デッキから1枚ドローする
                                    {gameState.hasActivatedExtravagance && (
                                        <div className="text-xs">（金満で謙虚な壺発動済み）</div>
                                    )}
                                    {gameState.hasActivatedChickenRace && (
                                        <div className="text-xs">（このターン発動済み）</div>
                                    )}
                                </button>

                                <button
                                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        activateChickenRaceEffect("destroy");
                                        setChickenRaceHover(null);
                                    }}
                                    disabled={lifePoints <= 1000 || gameState.hasActivatedChickenRace}
                                >
                                    ● このカードを破壊する
                                    {gameState.hasActivatedChickenRace && (
                                        <div className="text-xs">（このターン発動済み）</div>
                                    )}
                                </button>

                                <button
                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    onClick={() => {
                                        activateChickenRaceEffect("heal");
                                        setChickenRaceHover(null);
                                    }}
                                    disabled={lifePoints <= 1000 || gameState.hasActivatedChickenRace}
                                >
                                    ● 相手は1000LP回復する
                                    {gameState.hasActivatedChickenRace && (
                                        <div className="text-xs">（このターン発動済み）</div>
                                    )}
                                </button>
                            </div>

                            {(lifePoints <= 1000 || gameState.hasActivatedChickenRace) && (
                                <p className="text-red-500 text-xs text-center mt-2">
                                    {lifePoints <= 1000 ? "ライフポイントが不足しています" : ""}
                                    {gameState.hasActivatedChickenRace ? "このターンは既に効果を発動済みです" : ""}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
