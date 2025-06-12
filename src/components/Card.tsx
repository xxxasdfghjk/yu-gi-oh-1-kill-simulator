import React, { useState } from "react";
import { useSetAtom } from "jotai";
import type { CardInstance, DefensableMonsterCard } from "@/types/card";
import { CARD_SIZE } from "@/const/card";
import { hoveredCardAtom } from "@/store/hoveredCardAtom";
import { graveyardModalAtom } from "@/store/graveyardModalAtom";
import { hasEmptySpellField, isMagicCard, isTrapCard, monsterFilter } from "@/utils/cardManagement";
import { useGameStore, type GameStore } from "@/store/gameStore";
import { canNormalSummon } from "@/utils/summonUtils";
import { ActionListSelector } from "./ActionListSelector";

interface CardProps {
    card: CardInstance | null | undefined;
    size?: "small" | "medium" | "large";
    onClick?: () => void;
    selected?: boolean;
    customSize?: string;
    reverse?: boolean;
    forceAttack?: boolean;
    disableActivate?: true;
    rotate?: boolean;
}

export const getCardActions = (gameState: GameStore, card: CardInstance): string[] => {
    const actions: string[] = [];
    if (monsterFilter(card.card) && canNormalSummon(gameState, card) && card.location === "Hand") {
        actions.push("summon");
    }
    if (
        (isMagicCard(card.card) &&
            card.card.effect.onSpell?.condition(gameState, card) &&
            (hasEmptySpellField(gameState) || card.location === "SpellField") &&
            (card.location === "Hand" || card.location === "SpellField") &&
            !(card.card.magic_type === "フィールド魔法" && gameState.isFieldSpellActivationProhibited)) ||
        (isTrapCard(card.card) &&
            card.card.effect.onSpell?.condition(gameState, card) &&
            card.location === "SpellField" &&
            (card?.setTurn ?? 999999) < gameState.turn)
    ) {
        actions.push("activate");
    }
    if (
        (isTrapCard(card.card) || (isMagicCard(card.card) && card.card.magic_type !== "フィールド魔法")) &&
        hasEmptySpellField(gameState) &&
        card.location === "Hand"
    ) {
        actions.push("set");
    }
    if (card.card.effect.onIgnition?.condition(gameState, card)) {
        actions.push("effect");
    }

    return actions;
};

export const Card: React.FC<CardProps> = ({
    card,
    size = "medium",
    onClick,
    forceAttack,
    selected = false,
    customSize = undefined,
    disableActivate = false,
    rotate = false,
}) => {
    const setHoveredCard = useSetAtom(hoveredCardAtom);
    const setGraveyardModalOpen = useSetAtom(graveyardModalAtom);

    // 状態管理
    const [actionList, setActionList] = useState<string[]>([]);
    const [hoveringCard, setHoveringCard] = useState<CardInstance | null>(null);

    // カードが伏せ状態かどうかをチェック
    const isFaceDown = card?.position === "back" || card?.position === "back_defense";
    const sizeClasses = {
        small: CARD_SIZE.SMALL,
        medium: CARD_SIZE.MEDIUM,
        large: CARD_SIZE.LARGE,
    };

    const getCardColor = () => {
        if (isFaceDown) return "bg-gray-700";
    };

    const gameState = useGameStore();

    if (card === null || card === undefined) {
        return null;
    }

    return (
        <div
            className={`
        ${customSize ?? sizeClasses[size]} 
        ${selected ? "ring-4 ring-yellow-400" : ""}
        z-50 rounded cursor-pointer hover:scale-105 transition-transform
        shadow-md border border-gray-600 overflow-hidden
        relative
        ${(card.position === "defense" || card.position === "back_defense") && !forceAttack ? " -rotate-90" : ""}
      `}
            onClick={onClick}
            onMouseEnter={() => {
                setHoveringCard(card);
                setHoveredCard(card);
                const cardActions = getCardActions(gameState, card);
                setActionList(cardActions);
            }}
            onMouseLeave={() => {
                setHoveringCard(null);
            }}
            style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
        >
            {/* Card Inner Container for 3D flip */}
            <div
                className="absolute inset-0 w-full h-full"
                style={{
                    transformStyle: "preserve-3d",
                    transform: "rotateY(0deg)",
                    transition: "transform 0.8s ease-in-out",
                }}
            >
                {/* Card Front Face */}
                <div
                    className="absolute inset-0 w-full h-full rounded"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: isFaceDown && !forceAttack ? "rotateY(-180deg)" : "rotateY(0deg)",
                    }}
                >
                    {card.card.image ? (
                        <img
                            src={`/card_image/${card.card.image}`}
                            alt={card.card.card_name}
                            className="w-full h-full object-contain"
                            style={{
                                filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
                                backgroundColor: "transparent",
                            }}
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove("hidden");
                            }}
                        />
                    ) : null}

                    {/* Front Fallback */}
                    <div
                        className={`${
                            card.card.image ? "hidden" : ""
                        } w-full h-full ${getCardColor()} flex flex-col items-center justify-center p-1 text-white`}
                    >
                        <div className="text-xs font-bold text-center line-clamp-2">{card.card.card_name}</div>
                        {monsterFilter(card.card) && "attack" in card.card && (
                            <div className="text-xs mt-auto">
                                ATK: {card.card.attack}
                                {card.card.hasDefense ? ` / DEF: ${(card.card as DefensableMonsterCard).defense}` : ""}
                            </div>
                        )}
                    </div>
                </div>

                {/* Card Back Face */}
                <div
                    className="absolute inset-0 w-full h-full rounded"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: isFaceDown && !forceAttack ? "rotateY(0deg)" : "rotateY(180deg)",
                    }}
                >
                    <img
                        src="/card_image/reverse.jpg"
                        alt="Card Back"
                        className="w-full h-full object-contain"
                        style={{
                            filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
                            backgroundColor: "transparent",
                        }}
                    />
                </div>
            </div>
            {!disableActivate && hoveringCard?.id === card.id && actionList.length > 0 && (
                <ActionListSelector
                    rotate={rotate}
                    actions={actionList}
                    onSelect={(action) => {
                        if (action === "summon") {
                            gameState.playCard(card);
                        } else if (action === "set") {
                            gameState.setCard(card);
                        } else if (action === "activate") {
                            gameState.playCard(card);
                        } else if (action === "effect") {
                            gameState.activateEffect(card);
                            setGraveyardModalOpen(false);
                        }
                        setHoveringCard(null);
                    }}
                    card={card}
                />
            )}
        </div>
    );
};
