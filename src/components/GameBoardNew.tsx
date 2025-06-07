import React, { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { Card } from "./Card";
import { CardDetail } from "./CardDetail";
import { ActionListSelector, HandArea } from "./HandArea";
import { PlayerField } from "./PlayerField";
import { ExtraMonsterZones } from "./ExtraMonsterZones";
import { ControlButtons } from "./ControlButtons";
import { isMonsterCard } from "@/utils/gameUtils";
import { canActivateBanAlpha } from "@/utils/summonUtils";
import type { CardInstance } from "@/types/card";
import { MultiCardConditionSelector } from "./MultiCardConditionSelector";
import { MultiOptionSelector } from "./MultiOptionSelector";
import SummonSelector from "./SummonSelector";

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
        gameOver,
        winner,
        selectedCard,
        selectCard,
        nextPhase,
        playCard,
        setCard,
        activateFieldCard,
        activateSetCard,
        activateChickenRaceEffect,
        isOpponentTurn,
        bonmawashiRestriction,
        activateBanAlpha,
        startLinkSummon,
        startXyzSummon,
        activateEruGanma,
        opponentField,
        activateOpponentFieldSpell,
        effectQueue,
        processQueueTop,
        clearQueue,
        activateAruZeta,
    } = useGameStore();

    const [showCardDetail, setShowCardDetail] = useState<CardInstance | null>(null);
    const [showGraveyard, setShowGraveyard] = useState(false);
    const [showExtraDeck, setShowExtraDeck] = useState(false);
    const [chickenRaceHover, setChickenRaceHover] = useState<{ card: CardInstance; x: number; y: number } | null>(null);
    const gameState = useGameStore();

    useEffect(() => {
        initializeGame();
    }, [initializeGame]); // initializeGameを依存配列に追加

    const selectedCardInstance = hand.find((c) => c.id === selectedCard) || null;

    const handleCardRightClick = (e: React.MouseEvent, card: CardInstance) => {
        e.preventDefault();
        setShowCardDetail(card);
    };
    console.log(gameState.field.monsterZones);

    const handleBanAlphaClick = (card: CardInstance) => {
        if (card.card.card_name === "竜輝巧－バンα") {
            // 発動条件をチェック
            if (!canActivateBanAlpha(gameState)) {
                return;
            }

            activateBanAlpha(card);
        }
    };

    const handleCardHoverLeave = () => {
        // マウスがモーダルの方向に移動している場合は非表示にしない
    };

    const isLinkMonster = (card: CardInstance): boolean => {
        return card.card.card_type === "リンクモンスター";
    };

    const canPerformLinkSummon = (linkMonster: CardInstance): boolean => {
        const linkCard = linkMonster.card as { link?: number };
        const requiredMaterials = linkCard.link || 1;
        const availableMaterials = field.monsterZones.filter((c) => c !== null).length;
        return availableMaterials >= requiredMaterials;
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
            const monster = c.card as { rank?: number; level?: number };
            const cardRankOrLevel = monster.rank || monster.level || 0;
            return cardRankOrLevel === requiredRank;
        });

        return availableMaterials.length >= requiredMaterials;
    };

    const handleFieldCardClick = (card: CardInstance, event?: React.MouseEvent) => {
        if (card.position === "facedown") {
            // 伏せカードの場合は発動処理
            activateSetCard(card.id);
        } else if (card.card.card_name === "チキンレース") {
            // チキンレースの場合は選択肢を表示
            if (event) {
                setChickenRaceHover({
                    card: card,
                    x: event.clientX,
                    y: event.clientY,
                });
            }
        } else {
            // その他の表向きカードの場合は既存の効果処理
            activateFieldCard(card.id);
        }
    };

    if (gameOver) {
        return (
            <div className="min-h-screen bg-pink-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg text-center shadow-lg">
                    <h1 className="text-4xl font-bold mb-4">
                        {winner === "player" ? (
                            <span className="text-yellow-600">エクゾディア！勝利！</span>
                        ) : winner === null ? (
                            <span className="text-red-600">敗北...</span>
                        ) : (
                            <span className="text-gray-600">ゲーム終了</span>
                        )}
                    </h1>
                    {winner === null && <p className="text-gray-700 mb-4">ライフポイントが0になりました</p>}
                    <button
                        onClick={initializeGame}
                        className="bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full"
                    >
                        新しいゲームを開始
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200">
            <div className="container mx-auto px-4 py-2 relative">
                <div className=" absolute">
                    <div className="text-xs text-gray-600 mt-1">Turn {turn}</div>
                    <div className="text-xs text-gray-600">
                        {isOpponentTurn ? "Opponent " : ""}
                        {phase}
                    </div>
                    {bonmawashiRestriction && <div className="text-xs text-red-600 font-bold">盆回し制限</div>}
                </div>

                {/* エクストラモンスターゾーン（相手と自分の間） */}
                <ExtraMonsterZones
                    extraMonsterZones={field.extraMonsterZones}
                    handleFieldCardClick={handleFieldCardClick}
                    setShowCardDetail={setShowCardDetail}
                    opponentField={opponentField}
                    activateOpponentFieldSpell={activateOpponentFieldSpell}
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
                    setShowCardDetail={setShowCardDetail}
                    setShowGraveyard={setShowGraveyard}
                    setShowExtraDeck={setShowExtraDeck}
                />

                {/* 手札エリア */}
                <HandArea
                    hand={hand}
                    selectedCard={selectedCard}
                    lifePoints={lifePoints}
                    selectCard={selectCard}
                    playCard={playCard}
                    setCard={setCard}
                    activateBanAlpha={activateBanAlpha}
                    onCardRightClick={handleCardRightClick}
                    onCardHoverLeave={handleCardHoverLeave}
                    activateEruGanma={activateEruGanma}
                    activateAruZeta={activateAruZeta}
                />
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
                <button className="block bg-sky-400 hover:bg-sky-500 text-white px-4 py-2 rounded">HOW TO PLAY</button>
                <button className="block bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded">
                    不具合を報告
                </button>
            </div>

            <CardDetail card={showCardDetail} onClose={() => setShowCardDetail(null)} />

            {/* 効果キューモーダル - 新しい統一システム */}
            {effectQueue.length > 0 &&
                (() => {
                    const currentEffect = effectQueue[0];
                    console.log(currentEffect);
                    // 通常のカード選択
                    switch (currentEffect.type) {
                        case "option":
                            return (
                                <MultiOptionSelector
                                    state={gameState}
                                    title={`${currentEffect.cardInstance.card.card_name}: ${currentEffect.effectName}`}
                                    onSelect={(option) => processQueueTop({ type: "option", option: [option] })}
                                    onCancel={currentEffect.canCancel ? () => clearQueue() : undefined}
                                    optionList={currentEffect.option}
                                />
                            );

                        case "select":
                            return (
                                <MultiCardConditionSelector
                                    condition={currentEffect.condition}
                                    getAvailableCards={currentEffect.getAvailableCards}
                                    state={gameState}
                                    title={`${currentEffect.cardInstance.card.card_name}: ${currentEffect.effectName}`}
                                    onSelect={(card) => processQueueTop({ type: "cardSelect", cardList: card })}
                                    onCancel={currentEffect.canCancel ? () => clearQueue() : undefined}
                                    type={"single"}
                                />
                            );

                        case "multiselect":
                            return (
                                <MultiCardConditionSelector
                                    title={`${currentEffect.cardInstance.card.card_name}: ${currentEffect.effectName}`}
                                    onSelect={(card) => processQueueTop({ type: "cardSelect", cardList: card })}
                                    onCancel={() => clearQueue()}
                                    filterFunction={currentEffect.filterFunction}
                                    type={"multi"}
                                    state={gameState}
                                    getAvailableCards={currentEffect.getAvailableCards}
                                    condition={currentEffect.condition}
                                />
                            );
                        case "summon":
                            return (
                                <SummonSelector
                                    optionPosition={currentEffect.optionPosition}
                                    cardInstance={currentEffect.cardInstance}
                                    onSelect={(zone, position) => processQueueTop({ type: "summon", zone, position })}
                                    state={gameState}
                                ></SummonSelector>
                            );
                        default:
                            return null;
                    }
                })()}

            {/* おろかな埋葬効果のカード選択 - 現在はキューシステムで処理 */}

            {/* エクストラデッキのカード選択 */}

            {/* モンスター召喚選択 */}
            {/* 墓地確認モーダル */}
            {showGraveyard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">墓地 ({graveyard.length}枚)</h3>
                            <button
                                onClick={() => setShowGraveyard(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {graveyard.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">墓地にカードはありません</div>
                        ) : (
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {graveyard.map((card, index) => (
                                    <div
                                        key={`${card.id}-${index}`}
                                        className={`relative cursor-pointer transition-transform hover:scale-105 hover:ring-2 hover:ring-purple-300 ${
                                            card.card.card_name === "竜輝巧－バンα"
                                                ? canActivateBanAlpha(gameState)
                                                    ? "ring-2 ring-blue-300"
                                                    : "ring-2 ring-gray-400 opacity-60"
                                                : ""
                                        }`}
                                        onClick={() => {
                                            if (
                                                card.card.card_name !== "竜輝巧－バンα" &&
                                                !canActivateBanAlpha(gameState)
                                            ) {
                                                setShowCardDetail(card);
                                            }
                                        }}
                                    >
                                        <Card card={card} size="small"></Card>
                                        {card.card.card_name === "竜輝巧－バンα" && (
                                            <ActionListSelector
                                                card={card}
                                                actions={["effect"]}
                                                onSelect={() => {
                                                    handleBanAlphaClick(card);
                                                    setShowGraveyard(false);
                                                }}
                                            ></ActionListSelector>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => setShowGraveyard(false)}
                                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded font-bold"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* エクストラデッキ確認モーダル */}
            {showExtraDeck && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">エクストラデッキ ({extraDeck.length}枚)</h3>
                            <button
                                onClick={() => setShowExtraDeck(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {extraDeck.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">エクストラデッキにカードはありません</div>
                        ) : (
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {extraDeck.map((card, index) => (
                                    <div
                                        key={`${card.id}-${index}`}
                                        className={`cursor-pointer transition-transform hover:scale-105 hover:ring-2 ${
                                            isLinkMonster(card) && canPerformLinkSummon(card)
                                                ? "hover:ring-blue-400 ring-2 ring-blue-200"
                                                : "hover:ring-green-300"
                                        }`}
                                        onClick={() => {
                                            if (isLinkMonster(card) && canPerformLinkSummon(card)) {
                                                startLinkSummon(card);
                                                setShowExtraDeck(false);
                                            } else if (isXyzMonster(card) && canPerformXyzSummon(card)) {
                                                startXyzSummon(card);
                                                setShowExtraDeck(false);
                                            } else {
                                                setShowCardDetail(card);
                                            }
                                        }}
                                    >
                                        <Card card={card} size="small" />
                                        <div className="text-xs text-center mt-1 truncate">{card.card.card_name}</div>
                                        <div className="text-xs text-center text-gray-600">{card.card.card_type}</div>
                                        {isLinkMonster(card) && (
                                            <div className="text-xs text-center text-blue-600 font-bold">
                                                {canPerformLinkSummon(card) ? "リンク召喚可能" : "素材不足"}
                                            </div>
                                        )}
                                        {isXyzMonster(card) && (
                                            <div className="text-xs text-center text-purple-600 font-bold">
                                                {canPerformXyzSummon(card) ? "エクシーズ召喚可能" : "素材不足"}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => setShowExtraDeck(false)}
                                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded font-bold"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
    );
};
