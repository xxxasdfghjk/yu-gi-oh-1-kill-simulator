import React, { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { Card } from "./Card";
import { CardDetail } from "./CardDetail";
import { FieldZone } from "./FieldZone";
import { CardSelector } from "./CardSelector";
import { MultiCardSelector } from "./MultiCardSelector";
import { AdvancedRitualSelector } from "./AdvancedRitualSelector";
import { isMonsterCard, isSpellCard, isTrapCard } from "@/utils/gameUtils";
import {
    canNormalSummon,
    canActivateSpell,
    canSetSpellTrap,
    canActivateJackInHand,
    canActivateFoolishBurial,
    canActivateExtravagance,
    canActivateOneForOne,
    canActivateAdvancedRitual,
    canActivateFafnir,
    canActivateBanAlpha,
} from "@/utils/summonUtils";
import type { CardInstance } from "@/types/card";

export const GameBoardNew: React.FC = () => {
    const {
        hand,
        field,
        opponentField,
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
        summonMonster,
        activateFieldCard,
        activateSetCard,
        searchingEffect,
        selectFromDeck,
        summonSelecting,
        jackInHandState,
        selectForJackInHand,
        selectPlayerCardFromJack,
        extravaganceState,
        selectExtravaganceCount,
        selectCardFromRevealedCards,
        selectNormalMonstersForRitual,
        advancedRitualState,
        activateChickenRaceEffect,
        isOpponentTurn,
        pendingTrapActivation,
        activateTrapCard,
        declineTrapActivation,
        selectHokyuyoinTargets,
        selectBonmawashiCards,
        activateOpponentFieldSpell,
        bonmawashiRestriction,
        activateBanAlpha,
        linkSummonState,
        startLinkSummon,
        selectLinkMaterials,
        summonLinkMonster,
    } = useGameStore();

    const [showCardDetail, setShowCardDetail] = useState<CardInstance | null>(null);
    const [showGraveyard, setShowGraveyard] = useState(false);
    const [showExtraDeck, setShowExtraDeck] = useState(false);
    const [chickenRaceHover, setChickenRaceHover] = useState<{card: CardInstance, x: number, y: number} | null>(null);
    const gameState = useGameStore();

    // 相手ターン中で補充要員の確認がない場合、3秒後に自動でターンエンド
    useEffect(() => {
        if (isOpponentTurn && !pendingTrapActivation) {
            const timer = setTimeout(() => {
                nextPhase();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpponentTurn, pendingTrapActivation, nextPhase]);

    // 別の方法でsearchingEffectを取得してテスト
    const alternativeSearchingEffect = useGameStore((state) => state.searchingEffect);
    const alternativeExtravaganceState = useGameStore((state) => state.extravaganceState);

    useEffect(() => {
        initializeGame();
    }, []); // 空の依存配列：コンポーネントマウント時のみ実行

    const selectedCardInstance = hand.find((c) => c.id === selectedCard);

    const handleCardRightClick = (e: React.MouseEvent, card: CardInstance) => {
        e.preventDefault();
        setShowCardDetail(card);
    };

    const handleBanAlphaClick = (card: CardInstance) => {
        if (card.card.card_name === "竜輝巧－バンα") {
            console.log("竜輝巧－バンα clicked from:", card.location);
            
            // 発動条件をチェック
            if (!canActivateBanAlpha(gameState)) {
                console.log("Cannot activate 竜輝巧－バンα: conditions not met");
                return;
            }
            
            activateBanAlpha(card);
        }
    };

    const handleFieldZoneClick = (zoneType: "monster" | "spell", index: number) => {
        if (linkSummonState && linkSummonState.selectedMaterials && linkSummonState.selectedMaterials.length > 0) {
            // リンク召喚のゾーン選択
            if (zoneType === "monster" && (index === 5 || index === 6)) {
                summonLinkMonster(index);
            }
        } else if (selectedCard) {
            playCard(selectedCard, index);
        }
    };

    const isLinkMonster = (card: CardInstance): boolean => {
        return card.card.card_type === "リンクモンスター";
    };

    const canPerformLinkSummon = (linkMonster: CardInstance): boolean => {
        const linkCard = linkMonster.card as { link?: number };
        const requiredMaterials = linkCard.link || 1;
        const availableMaterials = field.monsterZones.filter(c => c !== null).length;
        return availableMaterials >= requiredMaterials;
    };

    const handleFieldCardClick = (card: CardInstance, event?: React.MouseEvent) => {
        console.log("Field card clicked:", card.card.card_name, "Position:", card.position);

        if (card.position === "facedown") {
            // 伏せカードの場合は発動処理
            activateSetCard(card.id);
        } else if (card.card.card_name === "チキンレース") {
            // チキンレースの場合は選択肢を表示
            if (event) {
                setChickenRaceHover({
                    card: card,
                    x: event.clientX,
                    y: event.clientY
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

    // デバッグ情報を追加
    console.log("=== GameBoardNew Debug ===");
    console.log("searchingEffect:", searchingEffect);
    console.log("alternativeSearchingEffect:", alternativeSearchingEffect);
    console.log("extravaganceState:", extravaganceState);
    console.log("alternativeExtravaganceState:", alternativeExtravaganceState);
    console.log("jackInHandState:", jackInHandState);
    console.log("Are searchingEffect equal?", searchingEffect === alternativeSearchingEffect);
    console.log("Are extravaganceState equal?", extravaganceState === alternativeExtravaganceState);
    console.log("========================");

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200">
            <div className="container mx-auto px-4 py-8">
                {/* 対戦相手エリア */}
                <div className="mb-4">
                    {/* ライフポイント */}
                    <div className="text-center mb-4">
                        <span className="text-5xl font-bold text-red-500">8000</span>
                    </div>

                    {/* 魔法・罠ゾーン（相手は上段、鏡写し） */}
                    <div className="flex justify-center gap-2 mb-4">
                        <div className="w-20" /> {/* スペーサー */}
                        {[4, 3, 2, 1, 0].map((index) => (
                            <FieldZone key={`opp-spell-${index}`} card={opponentField.spellTrapZones[index]} />
                        ))}
                        <div className="w-20" /> {/* スペーサー（フィールド魔法分） */}
                    </div>

                    {/* 対戦相手モンスターゾーンとフィールドゾーン（下段、向かい合うように） */}
                    <div className="flex justify-center gap-2 mb-4">
                        <div className="flex gap-2 items-center">
                            {/* モンスターゾーン（鏡写し：4,3,2,1,0） */}
                            {[4, 3, 2, 1, 0].map((index) => (
                                <FieldZone key={`opp-monster-${index}`} card={opponentField.monsterZones[index]} />
                            ))}
                            
                            {/* 相手のフィールド魔法（右側、プレイヤーから見て） */}
                            <FieldZone 
                                card={opponentField.fieldZone} 
                                label="Field" 
                                onCardClick={(card, event) => {
                                    if (card.position === "facedown") {
                                        // 相手のフィールド魔法を表側にする
                                        activateOpponentFieldSpell();
                                    } else if (card.card.card_name === "チキンレース") {
                                        // チキンレースの効果を使用（相手フィールドからでも使用可能）
                                        if (event) {
                                            setChickenRaceHover({
                                                card: card,
                                                x: event.clientX,
                                                y: event.clientY
                                            });
                                        }
                                    } else {
                                        // その他のフィールド魔法の効果（必要に応じて追加）
                                        console.log("Opponent field spell clicked:", card.card.card_name);
                                    }
                                }}
                                onCardRightClick={(card) => setShowCardDetail(card)}
                            />
                        </div>
                    </div>
                </div>

                {/* 中央エリア - 共有エクストラモンスターゾーン */}
                <div className="mb-4">
                    {/* 共有エクストラモンスターゾーン */}
                    <div className="flex justify-center gap-2">
                        <div className="flex gap-2">
                            {/* 空のスペース（ゾーン0の上） */}
                            <div className="w-20 h-28"></div>
                            
                            {/* エクストラモンスターゾーン（左：ゾーン1の上） */}
                            <FieldZone 
                                card={field.extraMonsterZones[0]} 
                                label="EX" 
                                className="border-4 border-red-400"
                                onClick={() => handleFieldZoneClick("monster", 5)}
                                onCardClick={handleFieldCardClick}
                                onCardRightClick={(card) => setShowCardDetail(card)}
                            />

                            {/* 空のスペース（ゾーン2の上） */}
                            <div className="w-20 h-28"></div>

                            {/* エクストラモンスターゾーン（右：ゾーン3の上） */}
                            <FieldZone 
                                card={field.extraMonsterZones[1]} 
                                label="EX" 
                                className="border-4 border-red-400"
                                onClick={() => handleFieldZoneClick("monster", 6)}
                                onCardClick={handleFieldCardClick}
                                onCardRightClick={(card) => setShowCardDetail(card)}
                            />

                            {/* 空のスペース（ゾーン4の上） */}
                            <div className="w-20 h-28"></div>
                        </div>
                    </div>
                </div>

                {/* プレイヤーエリア */}
                <div>
                    {/* モンスターゾーンとフィールドゾーン */}
                    <div className="flex justify-center gap-2 mb-4">
                        <div className="flex gap-2 items-center">
                            {/* プレイヤーのフィールド魔法（左側） */}
                            <FieldZone
                                card={field.fieldZone}
                                label="Field"
                                onClick={() => {}}
                                onCardClick={handleFieldCardClick}
                                onCardRightClick={(card) => setShowCardDetail(card)}
                            />
                            
                            {/* 通常モンスターゾーン */}
                            {field.monsterZones.map((card, index) => (
                                <FieldZone
                                    key={`monster-${index}`}
                                    card={card}
                                    onClick={() => handleFieldZoneClick("monster", index)}
                                    onCardClick={handleFieldCardClick}
                                    onCardRightClick={(card) => setShowCardDetail(card)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 魔法・罠ゾーンとゲーム要素（下段） */}
                    <div className="flex justify-center gap-2 mb-8">
                        <div className="w-20" /> {/* スペーサー（フィールド魔法分） */}
                        {field.spellTrapZones.map((card, index) => (
                            <FieldZone
                                key={`spell-${index}`}
                                card={card}
                                onClick={() => handleFieldZoneClick("spell", index)}
                                onCardClick={handleFieldCardClick}
                                onCardRightClick={(card) => setShowCardDetail(card)}
                            />
                        ))}
                        
                        {/* デッキ、エクストラデッキ、墓地エリア */}
                        <div className="flex gap-2 ml-4">
                            {/* デッキ */}
                            <div className="text-center">
                                <div className="w-16 h-20 bg-orange-700 rounded flex items-center justify-center text-white font-bold border-2 border-orange-900">
                                    <div>
                                        <div className="text-xs">DECK</div>
                                        <div className="text-lg">{deck.length}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    Turn {turn}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {isOpponentTurn ? "Opponent " : ""}{phase}
                                </div>
                                {bonmawashiRestriction && (
                                    <div className="text-xs text-red-600 font-bold">
                                        盆回し制限
                                    </div>
                                )}
                            </div>

                            {/* エクストラデッキ */}
                            <div className="text-center">
                                <div 
                                    className="w-16 h-20 bg-green-700 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-green-600 transition-colors border-2 border-green-900"
                                    onClick={() => setShowExtraDeck(true)}
                                >
                                    <div>
                                        <div className="text-xs">EX</div>
                                        <div className="text-lg">{extraDeck.length}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 墓地 */}
                            <div className="text-center">
                                <div 
                                    className="w-16 h-20 bg-purple-700 rounded flex items-center justify-center text-white font-bold cursor-pointer hover:bg-purple-600 transition-colors"
                                    onClick={() => setShowGraveyard(true)}
                                >
                                    <div>
                                        <div className="text-xs">GY</div>
                                        <div className="text-lg">{graveyard.length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 手札エリア */}
                    <div className="flex justify-center items-center gap-4">
                        <div className="flex gap-1">
                            {hand.map((card) => (
                                <div
                                    key={card.id}
                                    onContextMenu={(e) => handleCardRightClick(e, card)}
                                    className={`cursor-pointer transition-transform hover:-translate-y-2 ${
                                        selectedCard === card.id ? "ring-4 ring-yellow-400 -translate-y-4" : ""
                                    } ${
                                        card.card.card_name === "竜輝巧－バンα" 
                                            ? canActivateBanAlpha(gameState)
                                                ? "ring-2 ring-blue-300" 
                                                : "ring-2 ring-gray-400 opacity-60"
                                            : ""
                                    }`}
                                    onClick={(e) => {
                                        if (e.shiftKey && card.card.card_name === "竜輝巧－バンα") {
                                            handleBanAlphaClick(card);
                                        } else {
                                            selectCard(card.id);
                                        }
                                    }}
                                >
                                    <Card card={card} size="medium" />
                                    {card.card.card_name === "竜輝巧－バンα" && (
                                        <div className="text-xs text-center text-blue-600 font-bold mt-1">
                                            Shift+Click: 効果発動
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ライフポイント */}
                        <div className="text-center ml-8">
                            <span className="text-5xl font-bold text-blue-600">{lifePoints}</span>
                        </div>
                    </div>
                </div>

                {/* コントロールボタン */}
                <div className="fixed right-8 top-1/2 -translate-y-1/2 space-y-4">
                    {/* アクションボタン */}
                    {selectedCardInstance && (
                        <div className="mb-6 p-4 bg-white/90 rounded-lg shadow-lg">
                            <p className="text-gray-800 text-sm mb-2 font-semibold">
                                選択中: {selectedCardInstance.card.card_name}
                            </p>
                            <div className="space-y-2">
                                {isMonsterCard(selectedCardInstance.card) &&
                                    canNormalSummon(gameState, selectedCardInstance) && (
                                        <button
                                            onClick={() => {
                                                console.log(
                                                    "Preparing summon for monster:",
                                                    selectedCardInstance.card.card_name
                                                );
                                                playCard(selectedCard!);
                                            }}
                                            className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                                        >
                                            召喚準備
                                        </button>
                                    )}
                                {isSpellCard(selectedCardInstance.card) &&
                                    canActivateSpell(gameState, selectedCardInstance.card) && (
                                        <button
                                            onClick={() => {
                                                console.log("Activating spell:", selectedCardInstance.card.card_name);
                                                console.log("Card type:", selectedCardInstance.card.card_type);
                                                console.log("Is spell card:", isSpellCard(selectedCardInstance.card));
                                                console.log(
                                                    "Can activate:",
                                                    canActivateSpell(gameState, selectedCardInstance.card)
                                                );
                                                console.log("Before playCard - searchingEffect:", searchingEffect);
                                                console.log("Before playCard - extravaganceState:", extravaganceState);
                                                if (
                                                    selectedCardInstance.card.card_name === "ジャック・イン・ザ・ハンド"
                                                ) {
                                                    console.log(
                                                        "Can activate ジャック・イン・ザ・ハンド:",
                                                        canActivateJackInHand(gameState)
                                                    );
                                                }
                                                playCard(selectedCard!);
                                            }}
                                            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                                        >
                                            発動
                                        </button>
                                    )}
                                {(isSpellCard(selectedCardInstance.card) || isTrapCard(selectedCardInstance.card)) &&
                                    canSetSpellTrap(gameState, selectedCardInstance.card) && (
                                        <button
                                            onClick={() => {
                                                console.log("Setting card:", selectedCardInstance.card.card_name);
                                                console.log("Card type:", selectedCardInstance.card.card_type);
                                                console.log(
                                                    "Can set:",
                                                    canSetSpellTrap(gameState, selectedCardInstance.card)
                                                );
                                                setCard(selectedCard!);
                                            }}
                                            className="block w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
                                        >
                                            セット
                                        </button>
                                    )}
                                {/* デバッグ情報 */}
                                <div className="text-xs text-gray-700">
                                    <div>Type: {selectedCardInstance.card.card_type}</div>
                                    <div>Is Monster: {isMonsterCard(selectedCardInstance.card) ? "Yes" : "No"}</div>
                                    <div>Is Spell: {isSpellCard(selectedCardInstance.card) ? "Yes" : "No"}</div>
                                    <div>Is Trap: {isTrapCard(selectedCardInstance.card) ? "Yes" : "No"}</div>
                                    <div>Phase: {gameState.phase}</div>
                                    {selectedCardInstance.card.card_name === "ジャック・イン・ザ・ハンド" && (
                                        <div className="text-red-600 font-bold">
                                            Jack:{" "}
                                            {canActivateJackInHand(gameState) ? "Can Activate" : "Cannot Activate"}
                                        </div>
                                    )}
                                    {selectedCardInstance.card.card_name === "おろかな埋葬" && (
                                        <div className="text-red-600 font-bold">
                                            Foolish:{" "}
                                            {canActivateFoolishBurial(gameState) ? "Can Activate" : "Cannot Activate"}
                                        </div>
                                    )}
                                    {selectedCardInstance.card.card_name === "金満で謙虚な壺" && (
                                        <div className="text-red-600 font-bold">
                                            Extravagance:{" "}
                                            {canActivateExtravagance(gameState) ? "Can Activate" : "Cannot Activate"}
                                            <div className="text-xs">
                                                EX Deck: {gameState.extraDeck.length} | 
                                                Drawn by Effect: {gameState.hasDrawnByEffect ? "Yes" : "No"} |
                                                Extravagance Used: {gameState.hasActivatedExtravagance ? "Yes" : "No"}
                                            </div>
                                        </div>
                                    )}
                                    {selectedCardInstance.card.card_name === "ワン・フォー・ワン" && (
                                        <div className="text-red-600 font-bold">
                                            OneForOne:{" "}
                                            {canActivateOneForOne(gameState) ? "Can Activate" : "Cannot Activate"}
                                        </div>
                                    )}
                                    {selectedCardInstance.card.card_name === "高等儀式術" && (
                                        <div className="text-red-600 font-bold">
                                            AdvancedRitual:{" "}
                                            {canActivateAdvancedRitual(gameState) ? "Can Activate" : "Cannot Activate"}
                                            <div className="text-xs">
                                                {(() => {
                                                    const ritualMonsters = gameState.hand.filter(c => 
                                                        isMonsterCard(c.card) && c.card.card_type === '儀式・効果モンスター'
                                                    );
                                                    const normalMonsters = gameState.deck.filter(c => 
                                                        isMonsterCard(c.card) && c.card.card_type === '通常モンスター'
                                                    );
                                                    const minRitualLevel = ritualMonsters.length > 0 ? 
                                                        Math.min(...ritualMonsters.map(c => (c.card as any).level || 0)) : 0;
                                                    const totalNormalLevel = normalMonsters.reduce((sum, c) => 
                                                        sum + ((c.card as any).level || 0), 0);
                                                    return `Ritual: ${ritualMonsters.length} (Min Lv${minRitualLevel}) | Normal: ${totalNormalLevel}Lv total`;
                                                })()}
                                            </div>
                                            <div className="text-xs">
                                                SearchingEffect: {gameState.searchingEffect?.effectType || 'null'}
                                            </div>
                                            <div className="text-xs">
                                                AdvancedRitualState: {gameState.advancedRitualState?.phase || 'null'}
                                            </div>
                                        </div>
                                    )}
                                    {selectedCardInstance.card.card_name === "竜輝巧－ファフニール" && (
                                        <div className="text-red-600 font-bold">
                                            Fafnir:{" "}
                                            {canActivateFafnir(gameState) ? "Can Activate" : "Cannot Activate"}
                                            <div className="text-xs">
                                                {(() => {
                                                    const drytronSpellTraps = gameState.deck.filter(c => {
                                                        const isSpellOrTrap = c.card.card_type.includes('魔法') || c.card.card_type.includes('罠');
                                                        const isDrytron = c.card.card_name.includes('竜輝巧') || c.card.card_name.includes('ドライトロン');
                                                        const isNotFafnir = c.card.card_name !== '竜輝巧－ファフニール';
                                                        return isSpellOrTrap && isDrytron && isNotFafnir;
                                                    });
                                                    return `Drytron Spell/Trap: ${drytronSpellTraps.length} available`;
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={nextPhase}
                        disabled={isOpponentTurn}
                        className={`block w-32 font-bold py-3 px-6 rounded-full shadow-lg ${
                            isOpponentTurn 
                                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                : "bg-cyan-400 hover:bg-cyan-500 text-white"
                        }`}
                    >
                        {isOpponentTurn ? "OPPONENT TURN..." : "TURN END"}
                    </button>
                    <button className="block w-32 bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-full shadow-lg">
                        GAME END
                    </button>
                    <button
                        onClick={initializeGame}
                        className="block w-32 bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-full shadow-lg"
                    >
                        RESET
                    </button>
                    <button
                        onClick={() => {
                            console.log("=== Manual State Check ===");
                            const fullState = useGameStore.getState();
                            console.log("Full store state:", fullState);
                            console.log("extravaganceState from store:", fullState.extravaganceState);
                            console.log("searchingEffect from store:", fullState.searchingEffect);
                            console.log("========================");
                        }}
                        className="block w-32 bg-red-400 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-full shadow-lg"
                    >
                        CHECK STATE
                    </button>
                </div>

                {/* リンク */}
                <div className="fixed bottom-4 right-8 space-y-2">
                    <button className="block bg-sky-400 hover:bg-sky-500 text-white px-4 py-2 rounded">
                        HOW TO PLAY
                    </button>
                    <button className="block bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded">
                        不具合を報告
                    </button>
                </div>
            </div>

            <CardDetail card={showCardDetail} onClose={() => setShowCardDetail(null)} />

            {/* サーチ効果のカード選択 */}
            {searchingEffect && 
             searchingEffect.effectType !== "foolish_burial_select" && 
             searchingEffect.effectType !== "jack_in_hand_select_three" &&
             searchingEffect.effectType !== "hokyuyoin_multi_select" &&
             searchingEffect.effectType !== "bonmawashi_select" && (
                <CardSelector
                    cards={searchingEffect.availableCards}
                    title={`${searchingEffect.cardName}の効果で選択してください`}
                    onSelect={(card) => selectFromDeck(card)}
                    onCancel={() => {
                        // キャンセル処理（サーチ効果を無効にする）
                        useGameStore.setState((state) => ({
                            ...state,
                            searchingEffect: null,
                        }));
                    }}
                />
            )}

            {/* おろかな埋葬効果のカード選択 */}
            {searchingEffect && searchingEffect.effectType === "foolish_burial_select" && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-center">おろかな埋葬</h3>
                        <p className="text-center mb-6">デッキからモンスター1体を選んで墓地へ送ってください：</p>
                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
                            {searchingEffect.availableCards.map((card) => (
                                <div
                                    key={card.id}
                                    className="cursor-pointer transition-transform hover:scale-105 hover:ring-2 hover:ring-blue-300"
                                    onClick={() => selectFromDeck(card)}
                                >
                                    <Card card={card} size="small" />
                                    <div className="text-xs text-center mt-1 truncate">{card.card.card_name}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={() => {
                                    useGameStore.setState((state) => ({
                                        ...state,
                                        searchingEffect: null,
                                    }));
                                }}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-bold"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* モンスター召喚選択 */}
            {summonSelecting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 text-center">召喚方法を選択してください</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    summonMonster(summonSelecting.cardId, "attack");
                                }}
                                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded"
                            >
                                攻撃表示で召喚
                            </button>
                            <button
                                onClick={() => {
                                    summonMonster(summonSelecting.cardId, "facedown_defense");
                                }}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded"
                            >
                                セット（裏側守備表示）
                            </button>
                            <button
                                onClick={() => {
                                    useGameStore.setState((state) => ({
                                        ...state,
                                        summonSelecting: null,
                                    }));
                                }}
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ジャック・イン・ザ・ハンド効果 */}
            {jackInHandState &&
                jackInHandState.phase === "select_three" &&
                searchingEffect?.effectType === "jack_in_hand_select_three" && (
                    <MultiCardSelector
                        cards={searchingEffect.availableCards.filter((c) => {
                            if (!isMonsterCard(c.card)) return false;
                            const monster = c.card as { level?: number };
                            return monster.level === 1;
                        })}
                        title="ジャック・イン・ザ・ハンド: 異なるレベル1モンスター3体を選択してください"
                        maxSelections={3}
                        onSelect={(selectedCards) => {
                            selectForJackInHand(selectedCards);
                        }}
                        onCancel={() => {
                            useGameStore.setState((state) => ({
                                ...state,
                                searchingEffect: null,
                                jackInHandState: null,
                            }));
                        }}
                        filterFunction={(card, alreadySelected) => {
                            // 異なるカード名のモンスターのみ選択可能
                            return !alreadySelected.some((selected) => selected.card.card_name === card.card.card_name);
                        }}
                    />
                )}

            {/* 補充要員効果 */}
            {searchingEffect?.effectType === "hokyuyoin_multi_select" && (
                <MultiCardSelector
                    cards={searchingEffect.availableCards}
                    title="補充要員: 効果モンスター以外の攻撃力1500以下のモンスターを3体まで選択してください"
                    maxSelections={3}
                    onSelect={(selectedCards) => {
                        selectHokyuyoinTargets(selectedCards);
                    }}
                    onCancel={() => {
                        useGameStore.setState((state) => ({
                            ...state,
                            searchingEffect: null,
                        }));
                    }}
                />
            )}

            {/* 盆回し効果 - 2枚選択 */}
            {searchingEffect?.effectType === "bonmawashi_select" && (
                <MultiCardSelector
                    cards={searchingEffect.availableCards}
                    title="盆回し: 異なるフィールド魔法2枚を選択してください"
                    maxSelections={2}
                    onSelect={(selectedCards) => {
                        selectBonmawashiCards(selectedCards);
                    }}
                    onCancel={() => {
                        useGameStore.setState((state) => ({
                            ...state,
                            searchingEffect: null,
                            bonmawashiState: null,
                        }));
                    }}
                />
            )}

            {/* 竜輝巧－バンα効果 - リリース対象選択 */}
            {searchingEffect?.effectType === "ban_alpha_release_select" && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-center">竜輝巧－バンα</h3>
                        <p className="text-center mb-6">
                            リリースするドライトロンモンスターまたは儀式モンスターを選択してください：
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                            {searchingEffect.availableCards.map((card) => (
                                <div
                                    key={card.id}
                                    className="cursor-pointer transition-transform hover:scale-105 hover:ring-2 hover:ring-blue-300 border-2 border-gray-200 rounded p-2"
                                    onClick={() => selectFromDeck(card)}
                                >
                                    <Card card={card} size="small" />
                                    <div className="text-xs text-center mt-2 truncate font-semibold">
                                        {card.card.card_name}
                                    </div>
                                    <div className="text-xs text-center text-gray-600">
                                        {card.location === "hand" ? "手札" : "フィールド"}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={() => {
                                    useGameStore.setState((state) => ({
                                        ...state,
                                        searchingEffect: null,
                                        banAlphaState: null,
                                    }));
                                }}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-bold"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 竜輝巧－バンα効果 - 儀式モンスター選択 */}
            {searchingEffect?.effectType === "ban_alpha_ritual_select" && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-center">竜輝巧－バンα</h3>
                        <p className="text-center mb-6">
                            手札に加える儀式モンスターを選択してください：
                        </p>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                            {searchingEffect.availableCards.map((card) => (
                                <div
                                    key={card.id}
                                    className="cursor-pointer transition-transform hover:scale-105 hover:ring-2 hover:ring-green-300 border-2 border-gray-200 rounded p-2"
                                    onClick={() => selectFromDeck(card)}
                                >
                                    <Card card={card} size="small" />
                                    <div className="text-xs text-center mt-2 truncate font-semibold">
                                        {card.card.card_name}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={() => {
                                    useGameStore.setState((state) => ({
                                        ...state,
                                        searchingEffect: null,
                                        banAlphaState: null,
                                    }));
                                }}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-bold"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {jackInHandState && jackInHandState.phase === "player_selects" && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 text-center">ジャック・イン・ザ・ハンド</h3>
                        <div className="mb-4 p-4 bg-red-100 rounded">
                            <p className="text-center text-red-800 mb-2">相手が次のカードをランダムに選択しました:</p>
                            <div className="flex justify-center">
                                <div className="text-center">
                                    <Card card={jackInHandState.opponentCard!} size="medium" />
                                    <p className="text-sm mt-1">{jackInHandState.opponentCard!.card.card_name}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mb-6">
                            <p className="text-center mb-4">残りのカードから1枚を選んで手札に加えてください:</p>
                            <div className="flex justify-center gap-4">
                                {jackInHandState.remainingCards?.map((card) => (
                                    <div
                                        key={card.id}
                                        className="cursor-pointer transition-transform hover:scale-105"
                                        onClick={() => selectPlayerCardFromJack(card)}
                                    >
                                        <Card card={card} size="medium" />
                                        <p className="text-sm text-center mt-1">{card.card.card_name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 金満で謙虚な壺効果 - 除外枚数選択 */}
            {extravaganceState && extravaganceState.phase === "select_count" && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 text-center">金満で謙虚な壺</h3>
                        <p className="text-center mb-6">EXデッキから何枚除外しますか？</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => selectExtravaganceCount(3)}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded"
                            >
                                3枚除外（デッキから3枚めくる）
                            </button>
                            <button
                                onClick={() => selectExtravaganceCount(6)}
                                disabled={extraDeck.length < 6}
                                className={`w-full font-bold py-3 px-4 rounded ${
                                    extraDeck.length >= 6
                                        ? "bg-purple-500 hover:bg-purple-600 text-white"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                            >
                                6枚除外（デッキから6枚めくる）
                                {extraDeck.length < 6 && <div className="text-xs">（EXデッキが不足）</div>}
                            </button>
                            <button
                                onClick={() => {
                                    useGameStore.setState((state) => ({
                                        ...state,
                                        extravaganceState: null,
                                    }));
                                }}
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 金満で謙虚な壺効果 - カード選択 */}
            {extravaganceState && extravaganceState.phase === "select_card_from_deck" && extravaganceState.revealedCards && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-center">金満で謙虚な壺</h3>
                        <p className="text-center mb-6">めくったカードから1枚を選んで手札に加えてください：</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                            {extravaganceState.revealedCards.map((card, index) => (
                                <div
                                    key={`${card.id}-${index}`}
                                    className="cursor-pointer transition-transform hover:scale-105 hover:ring-2 hover:ring-blue-300 border-2 border-gray-200 rounded p-2"
                                    onClick={() => {
                                        const remainingCards = extravaganceState.revealedCards!.filter((_, i) => i !== index);
                                        selectCardFromRevealedCards(card, remainingCards);
                                    }}
                                >
                                    <Card card={card} size="small" />
                                    <div className="text-xs text-center mt-2 truncate font-semibold">
                                        {card.card.card_name}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-center text-sm text-gray-600">
                            残りの{extravaganceState.revealedCards.length - 1}枚のカードはデッキの一番下に戻されます
                        </div>
                    </div>
                </div>
            )}

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
                            <div className="text-center py-8 text-gray-500">
                                墓地にカードはありません
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {graveyard.map((card, index) => (
                                    <div
                                        key={`${card.id}-${index}`}
                                        className={`cursor-pointer transition-transform hover:scale-105 hover:ring-2 hover:ring-purple-300 ${
                                            card.card.card_name === "竜輝巧－バンα" 
                                                ? canActivateBanAlpha(gameState)
                                                    ? "ring-2 ring-blue-300" 
                                                    : "ring-2 ring-gray-400 opacity-60"
                                                : ""
                                        }`}
                                        onClick={(e) => {
                                            if (e.shiftKey && card.card.card_name === "竜輝巧－バンα") {
                                                handleBanAlphaClick(card);
                                                setShowGraveyard(false);
                                            } else {
                                                setShowCardDetail(card);
                                            }
                                        }}
                                    >
                                        <Card card={card} size="small" />
                                        <div className="text-xs text-center mt-1 truncate">
                                            {card.card.card_name}
                                            {card.card.card_name === "竜輝巧－バンα" && (
                                                <div className="text-blue-600 font-bold">Shift+Click</div>
                                            )}
                                        </div>
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
                            <div className="text-center py-8 text-gray-500">
                                エクストラデッキにカードはありません
                            </div>
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
                                            } else {
                                                setShowCardDetail(card);
                                            }
                                        }}
                                    >
                                        <Card card={card} size="small" />
                                        <div className="text-xs text-center mt-1 truncate">
                                            {card.card.card_name}
                                        </div>
                                        <div className="text-xs text-center text-gray-600">
                                            {card.card.card_type}
                                        </div>
                                        {isLinkMonster(card) && (
                                            <div className="text-xs text-center text-blue-600 font-bold">
                                                {canPerformLinkSummon(card) ? "リンク召喚可能" : "素材不足"}
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

            {/* 高等儀式術効果 - 通常モンスター選択 */}
            {advancedRitualState && advancedRitualState.phase === "select_normal_monsters" && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4 text-center">高等儀式術</h3>
                        <div className="mb-4 p-4 bg-blue-100 rounded">
                            <p className="text-center text-blue-800 mb-2">
                                選択された儀式モンスター: {advancedRitualState.selectedRitualMonster?.card.card_name}
                            </p>
                            <p className="text-center text-blue-800">
                                必要レベル: {advancedRitualState.requiredLevel}
                            </p>
                        </div>
                        <p className="text-center mb-6">
                            デッキから通常モンスターを選択してください（選択したモンスターは墓地へ送られます）：
                        </p>
                        <AdvancedRitualSelector
                            normalMonsters={advancedRitualState.availableNormals || []}
                            requiredLevel={advancedRitualState.requiredLevel || 0}
                            onSelect={(selectedMonsters: CardInstance[]) => {
                                selectNormalMonstersForRitual(selectedMonsters);
                            }}
                            onCancel={() => {
                                useGameStore.setState((state) => ({
                                    ...state,
                                    advancedRitualState: null,
                                }));
                            }}
                        />
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
                            zIndex: 60
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="text-center font-bold mb-3 text-gray-800">チキンレース効果選択</h4>
                        <p className="text-xs text-center mb-3 text-gray-600">
                            コスト: 1000LP支払い
                            {chickenRaceHover.card.location === "field_spell_trap" && 
                             gameState.opponentField.fieldZone?.id === chickenRaceHover.card.id && (
                                <span className="block text-blue-600 font-semibold">（相手フィールドから使用）</span>
                            )}
                        </p>
                        
                        <div className="space-y-2">
                            <button
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                                onClick={() => {
                                    activateChickenRaceEffect("draw");
                                    setChickenRaceHover(null);
                                }}
                                disabled={lifePoints <= 1000 || gameState.hasActivatedExtravagance || gameState.hasActivatedChickenRace}
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

            {/* リンク召喚素材選択 */}
            {searchingEffect?.effectType === "link_summon_select_materials" && linkSummonState && (
                <MultiCardSelector
                    cards={searchingEffect.availableCards}
                    title={`${linkSummonState.linkMonster?.card.card_name}: リンク素材を${linkSummonState.requiredMaterials}体選択してください`}
                    maxSelections={linkSummonState.requiredMaterials || 1}
                    onSelect={(selectedMaterials) => {
                        selectLinkMaterials(selectedMaterials);
                    }}
                    onCancel={() => {
                        useGameStore.setState((state) => ({
                            ...state,
                            searchingEffect: null,
                            linkSummonState: null,
                        }));
                    }}
                />
            )}

            {/* リンク召喚ゾーン選択指示 */}
            {linkSummonState && linkSummonState.selectedMaterials && linkSummonState.selectedMaterials.length > 0 && !searchingEffect && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 text-center">リンク召喚</h3>
                        <div className="mb-4 p-4 bg-blue-100 rounded text-center">
                            <p className="font-bold">{linkSummonState.linkMonster?.card.card_name}</p>
                            <p className="text-sm text-gray-600 mt-2">
                                素材: {linkSummonState.selectedMaterials.map(m => m.card.card_name).join(", ")}
                            </p>
                        </div>
                        <p className="text-center mb-6">エクストラモンスターゾーン（中央の赤枠、相手と共有）をクリックしてリンク召喚してください</p>
                        <div className="flex justify-center">
                            <button
                                onClick={() => {
                                    useGameStore.setState((state) => ({
                                        ...state,
                                        linkSummonState: null,
                                    }));
                                }}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-bold"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 補充要員発動確認モーダル */}
            {pendingTrapActivation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-4 text-center">罠カード発動確認</h3>
                        <div className="mb-4 p-4 bg-blue-100 rounded text-center">
                            <div className="mb-2">
                                <Card card={pendingTrapActivation} size="medium" />
                            </div>
                            <p className="font-bold">{pendingTrapActivation.card.card_name}</p>
                            <p className="text-sm text-gray-600 mt-2">{pendingTrapActivation.card.text}</p>
                            {pendingTrapActivation.card.card_name === "補充要員" && (
                                <div className="mt-3 p-2 bg-green-100 rounded">
                                    <p className="text-xs text-green-800 mb-1">
                                        墓地のモンスター: {graveyard.filter(c => isMonsterCard(c.card)).length}体
                                        (発動条件: 5体以上)
                                    </p>
                                    <p className="text-xs text-green-800">
                                        選択可能なモンスター: {graveyard.filter(c => {
                                            if (!isMonsterCard(c.card)) return false;
                                            const monster = c.card as { card_type?: string; attack?: number };
                                            return monster.card_type !== '効果モンスター' && (monster.attack || 0) <= 1500;
                                        }).length}体
                                        (効果モンスター以外で攻撃力1500以下)
                                    </p>
                                </div>
                            )}
                        </div>
                        <p className="text-center mb-6">このカードを発動しますか？</p>
                        
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => activateTrapCard(pendingTrapActivation)}
                                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded font-bold"
                            >
                                発動する
                            </button>
                            <button
                                onClick={declineTrapActivation}
                                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-bold"
                            >
                                発動しない
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
