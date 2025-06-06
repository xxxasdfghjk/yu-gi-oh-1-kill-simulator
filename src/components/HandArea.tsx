import React, { useState } from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
import { useGameStore } from "@/store/gameStore";
import { isMonsterCard, isSpellCard, isTrapCard } from "@/utils/gameUtils";
import { canNormalSummon, canActivateSpell, canSetSpellTrap, canActivateBanAlpha } from "@/utils/summonUtils";
import { getCardEffect } from "../utils/cardEffects";

interface HandAreaProps {
    hand: CardInstance[];
    selectedCard: string | null;
    lifePoints: number;
    selectCard: (cardId: string) => void;
    playCard: (cardId: string) => void;
    setCard: (cardId: string) => void;
    activateBanAlpha: (card: CardInstance) => void;
    onCardRightClick: (e: React.MouseEvent, card: CardInstance) => void;
    onCardHover: (event: React.MouseEvent, card: CardInstance) => void;
    onCardHoverLeave: (event: React.MouseEvent) => void;
    onSelectCardAction: (action: string, card: CardInstance) => void;
    cardAction: { card: CardInstance; actions: string[] } | null;
}

export type Action = "summon" | "activate" | "set" | "effect";

const ActionListSelector = ({
    actions,
    onSelect,
}: {
    actions: string[];
    card: CardInstance;
    onSelect: (action: string) => void;
}) => {
    const actionList = actions.map((e) => {
        switch (e) {
            case "summon":
                return "召喚";
            case "activate":
                return "発動";
            case "set":
                return "セット";
            case "effect":
                return "効果発動";
            default:
                return e;
        }
    });
    return (
        <div className="absolute bg-white shadow-lg rounded z-10 text-[12px]flex flex-col items-center text-center w-full justify-center h-full">
            {actionList.map((action) => (
                <button
                    key={action}
                    onClick={() => onSelect(action)}
                    className="block w-full px-4 py-2 hover:bg-gray-200 text-center bg-opacity-10 flex-1"
                >
                    {action}
                </button>
            ))}
        </div>
    );
};

export const HandArea: React.FC<HandAreaProps> = ({
    hand,
    selectedCard,
    lifePoints,
    selectCard,
    playCard,
    setCard,
    activateBanAlpha,
    onCardRightClick,
    onCardHover,
    onCardHoverLeave,
    onSelectCardAction,
}) => {
    const gameState = useGameStore();
    const [actionList, setActionList] = useState<string[]>([]);
    const [hoveringCard, setHoveringCard] = useState<CardInstance | null>(null);

    const getCardActions = (card: CardInstance): string[] => {
        const actions: string[] = [];

        if (isMonsterCard(card.card) && canNormalSummon(gameState, card)) {
            actions.push("summon");
        }
        if (isSpellCard(card.card) && canActivateSpell(gameState, card.card)) {
            actions.push("activate");
        }
        if ((isSpellCard(card.card) || isTrapCard(card.card)) && canSetSpellTrap(gameState, card.card)) {
            actions.push("set");
        }
        if (card.card.card_name === "竜輝巧－バンα" && canActivateBanAlpha(gameState)) {
            actions.push("effect");
        }

        return actions;
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

    return (
        <div className="flex justify-center items-center gap-4">
            <div className="flex gap-1">
                {hand.map((card) => (
                    <div
                        key={card.id}
                        onContextMenu={(e) => onCardRightClick(e, card)}
                        onMouseEnter={() => {
                            const cardActions = getCardActions(card);
                            setActionList(cardActions);
                            setHoveringCard(card);
                        }}
                        onMouseLeave={(e) => {
                            onCardHoverLeave(e);
                            setHoveringCard(null);
                        }}
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
                            // Shift+Clickでバンアルファの効果発動
                            if (e.shiftKey && card.card.card_name === "竜輝巧－バンα") {
                                handleBanAlphaClick(card);
                                return;
                            }

                            const actions = getCardActions(card);
                            if (actions.length === 1 && actions[0] === "summon") {
                                // 召喚のみの場合は直接実行
                                playCard(card.id);
                            } else if (actions.length === 0) {
                                // アクションがない場合は選択のみ
                                selectCard(card.id);
                            } else {
                                // 複数アクションがある場合はホバーで表示済み
                                selectCard(card.id);
                            }
                        }}
                    >
                        {hoveringCard?.id === card.id && actionList.length > 0 && (
                            <ActionListSelector
                                actions={actionList}
                                onSelect={(action) => {
                                    if (action === "summon") {
                                        playCard(card.id);
                                    } else if (action === "set") {
                                        setCard(card.id);
                                    } else if (action === "activate") {
                                        const effect = getCardEffect(card);
                                        if (effect) {
                                            effect(gameState, card);
                                        }
                                    } else if (action === "effect") {
                                        handleBanAlphaClick(card);
                                    }
                                }}
                                card={card}
                            ></ActionListSelector>
                        )}
                        <Card card={card} size="large" />
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
    );
};
