import React from "react";
import type { CardInstance } from "@/types/card";
import { useGameStore } from "@/store/gameStore";
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
} from "@/utils/summonUtils";

interface ControlButtonsProps {
    selectedCardInstance: CardInstance | null;
    selectedCard: string | null;
    isOpponentTurn: boolean;
    nextPhase: () => void;
    playCard: (cardId: string) => void;
    setCard: (cardId: string) => void;
    initializeGame: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
    selectedCardInstance,
    selectedCard,
    isOpponentTurn,
    nextPhase,
    playCard,
    setCard,
    initializeGame,
}) => {
    const gameState = useGameStore();

    return (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 space-y-4">
            {/* アクションボタン */}
            {selectedCardInstance && (
                <div className="mb-6 p-4 bg-white rounded-lg shadow-lg">
                    <p className="text-gray-800 text-sm mb-2 font-semibold">
                        選択中: {selectedCardInstance.card.card_name}
                    </p>
                    <div className="space-y-2">
                        {isMonsterCard(selectedCardInstance.card) &&
                            canNormalSummon(gameState, selectedCardInstance) && (
                                <button
                                    onClick={() => {
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
                                    Jack: {canActivateJackInHand(gameState) ? "Can Activate" : "Cannot Activate"}
                                </div>
                            )}
                            {selectedCardInstance.card.card_name === "おろかな埋葬" && (
                                <div className="text-red-600 font-bold">
                                    Foolish: {canActivateFoolishBurial(gameState) ? "Can Activate" : "Cannot Activate"}
                                </div>
                            )}
                            {selectedCardInstance.card.card_name === "金満で謙虚な壺" && (
                                <div className="text-red-600 font-bold">
                                    Extravagance:{" "}
                                    {canActivateExtravagance(gameState) ? "Can Activate" : "Cannot Activate"}
                                    <div className="text-xs">
                                        EX Deck: {gameState.extraDeck.length} | Drawn by Effect:{" "}
                                        {gameState.hasDrawnByEffect ? "Yes" : "No"} | Extravagance Used:{" "}
                                        {gameState.hasActivatedExtravagance ? "Yes" : "No"}
                                    </div>
                                </div>
                            )}
                            {selectedCardInstance.card.card_name === "ワン・フォー・ワン" && (
                                <div className="text-red-600 font-bold">
                                    OneForOne: {canActivateOneForOne(gameState) ? "Can Activate" : "Cannot Activate"}
                                </div>
                            )}
                            {selectedCardInstance.card.card_name === "高等儀式術" && (
                                <div className="text-red-600 font-bold">
                                    AdvancedRitual:{" "}
                                    {canActivateAdvancedRitual(gameState) ? "Can Activate" : "Cannot Activate"}
                                    <div className="text-xs">
                                        {(() => {
                                            const ritualMonsters = gameState.hand.filter(
                                                (c) =>
                                                    isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
                                            );
                                            const normalMonsters = gameState.deck.filter(
                                                (c) => isMonsterCard(c.card) && c.card.card_type === "通常モンスター"
                                            );
                                            const minRitualLevel =
                                                ritualMonsters.length > 0
                                                    ? Math.min(
                                                          ...ritualMonsters.map(
                                                              (c) => (c.card as { level?: number }).level || 0
                                                          )
                                                      )
                                                    : 0;
                                            const totalNormalLevel = normalMonsters.reduce(
                                                (sum, c) => sum + ((c.card as { level?: number }).level || 0),
                                                0
                                            );
                                            return `Ritual: ${ritualMonsters.length} (Min Lv${minRitualLevel}) | Normal: ${totalNormalLevel}Lv total`;
                                        })()}
                                    </div>
                                    <div className="text-xs">EffectQueue: {gameState.effectQueue.length}</div>
                                    <div className="text-xs">
                                        AdvancedRitualState: {gameState.advancedRitualState?.phase || "null"}
                                    </div>
                                </div>
                            )}
                            {selectedCardInstance.card.card_name === "竜輝巧－ファフニール" && (
                                <div className="text-red-600 font-bold">
                                    Fafnir: {canActivateFafnir(gameState) ? "Can Activate" : "Cannot Activate"}
                                    <div className="text-xs">
                                        {(() => {
                                            const drytronSpellTraps = gameState.deck.filter((c) => {
                                                const isSpellOrTrap =
                                                    c.card.card_type.includes("魔法") ||
                                                    c.card.card_type.includes("罠");
                                                const isDrytron =
                                                    c.card.card_name.includes("竜輝巧") ||
                                                    c.card.card_name.includes("ドライトロン");
                                                const isNotFafnir = c.card.card_name !== "竜輝巧－ファフニール";
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
                    // Manual state check for debugging if needed
                    useGameStore.getState();
                }}
                className="block w-32 bg-red-400 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-full shadow-lg"
            >
                CHECK STATE
            </button>
        </div>
    );
};
