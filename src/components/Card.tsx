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
    faceDown?: boolean;
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
    faceDown = false,
    customSize = undefined,
    disableActivate = false,
    rotate = false,
}) => {
    const setHoveredCard = useSetAtom(hoveredCardAtom);
    const setGraveyardModalOpen = useSetAtom(graveyardModalAtom);
    // カードが伏せ状態かどうかをチェック
    const isFaceDown = faceDown || card?.position === "back" || card?.position === "back_defense";
    const sizeClasses = {
        small: CARD_SIZE.SMALL,
        medium: CARD_SIZE.MEDIUM,
        large: CARD_SIZE.LARGE,
    };

    const getCardColor = () => {
        if (isFaceDown) return "bg-gray-700";
    };

    // 画像パスを取得
    const getImagePath = () => {
        if (isFaceDown && !forceAttack) {
            return `/card_image/reverse.jpg`; // 裏面はフォールバック表示を使用
        }
        if (card?.card.image) {
            const imageName = card.card.image;
            return `/card_image/${imageName}`;
        }
        return null;
    };
    const [actionList, setActionList] = useState<string[]>([]);
    const [hoveringCard, setHoveringCard] = useState<CardInstance | null>(null);

    const imagePath = getImagePath();
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
        ${!imagePath ? getCardColor() + " flex flex-col items-center justify-center p-1 text-white" : "bg-transparent"}
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
            style={{ backfaceVisibility: "hidden" }}
        >
            {!disableActivate && hoveringCard?.id === card.id && actionList.length > 0 && (
                <ActionListSelector
                    rotate={rotate}
                    actions={actionList}
                    onSelect={(action) => {
                        if (action === "summon") {
                            console.log("aaa");
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
            {imagePath ? (
                <img
                    src={imagePath}
                    alt={isFaceDown ? "Card Back" : card.card.card_name}
                    className={`w-full h-full object-contain`}
                    style={{
                        filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
                        backgroundColor: "transparent",
                    }}
                    onError={(e) => {
                        // 画像読み込みエラー時はフォールバック表示
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                />
            ) : null}

            {/* フォールバック表示（画像がない場合や読み込みエラー時） */}
            <div
                className={`${
                    imagePath ? "hidden" : ""
                } w-full h-full ${getCardColor()} flex flex-col items-center justify-center p-1 text-white`}
            >
                {!isFaceDown && (
                    <>
                        <div className="text-xs font-bold text-center line-clamp-2">{card.card.card_name}</div>
                        {monsterFilter(card.card) && "attack" in card.card && (
                            <div className="text-xs mt-auto">
                                ATK: {card.card.attack}
                                {card.card.hasDefense ? ` / DEF: ${(card.card as DefensableMonsterCard).defense}` : ""}
                            </div>
                        )}
                    </>
                )}
                {isFaceDown && <div className="text-xs text-gray-400">???</div>}
            </div>
        </div>
    );
};
