import React, { useState } from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";
import { useGameStore } from "@/store/gameStore";
import { isMonsterCard, isSpellCard, isTrapCard } from "@/utils/gameUtils";
import {
    canNormalSummon,
    canActivateSpell,
    canSetSpellTrap,
    canActivateBanAlpha,
    canActivateEruGanma,
    canActivateAruZeta,
} from "@/utils/summonUtils";

interface HandAreaProps {
    hand: CardInstance[];
    selectedCard: string | null;
    lifePoints: number;
    selectCard: (cardId: string) => void;
    playCard: (cardId: string) => void;
    setCard: (cardId: string) => void;
    activateBanAlpha: (card: CardInstance) => void;
    activateEruGanma: (card: CardInstance) => void;
    activateAruZeta: (card: CardInstance) => void;
    onCardRightClick: (e: React.MouseEvent, card: CardInstance) => void;
    onCardHoverLeave: () => void;
}

export type Action = "summon" | "activate" | "set" | "effect";

export const ActionListSelector = ({
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
                return { key: "summon", label: "召喚" };
            case "activate":
                return { key: "activate", label: "発動" };
            case "set":
                return { key: "set", label: "セット" };
            case "effect":
                return { key: "effect", label: "効果発動" };
            default:
                return { key: e, label: e };
        }
    });

    return (
        <div className="absolute rounded z-10 flex flex-col items-center text-center w-full justify-center h-full hover:bg-black hover:bg-opacity-60 text-[18px] text-white">
            {actionList.map((action) => (
                <button
                    key={action.key}
                    onClick={() => onSelect(action.key)}
                    className="block w-full px-4 py-2 hover:bg-black hover:bg-opacity-50 text-center bg-opacity-90 flex-1"
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
};

export const HandArea: React.FC<HandAreaProps> = ({
    hand,
    selectedCard,
    lifePoints,
    playCard,
    setCard,
    activateBanAlpha,
    activateEruGanma,
    activateAruZeta,
    onCardRightClick,
    onCardHoverLeave,
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
        if (card.card.card_name === "竜輝巧－エルγ" && canActivateEruGanma(gameState)) {
            actions.push("effect");
        }
        if (card.card.card_name === "竜輝巧－アルζ" && canActivateAruZeta(gameState)) {
            actions.push("effect");
        }

        return actions;
    };

    const handleEffect = (card: CardInstance) => {
        if (card.card.card_name === "竜輝巧－バンα") {
            // 発動条件をチェック
            if (!canActivateBanAlpha(gameState)) {
                return;
            }
            activateBanAlpha(card);
        } else if (card.card.card_name === "竜輝巧－エルγ") {
            // 発動条件をチェック
            if (!canActivateEruGanma(gameState)) {
                return;
            }
            activateEruGanma(card);
        } else if (card.card.card_name === "竜輝巧－アルζ") {
            if (!canActivateAruZeta(gameState)) {
                return;
            }
            activateAruZeta(card);
        }
    };

    return (
        <div className="flex justify-center items-center gap-4">
            <div className="flex gap-1 overflow-x-auto">
                {hand.map((card) => (
                    <div
                        key={card.id}
                        onContextMenu={(e) => onCardRightClick(e, card)}
                        onMouseEnter={() => {
                            const cardActions = getCardActions(card);
                            setActionList(cardActions);
                            setHoveringCard(card);
                        }}
                        onMouseLeave={() => {
                            onCardHoverLeave();
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
                                        playCard(card.id);
                                    } else if (action === "effect") {
                                        handleEffect(card);
                                    }
                                    setHoveringCard(null);
                                }}
                                card={card}
                            />
                        )}
                        <Card card={card} size="medium" />
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
