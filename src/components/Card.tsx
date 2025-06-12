import React, { useState } from "react";
import { useSetAtom } from "jotai";
import type { CardInstance, DefensableMonsterCard } from "@/types/card";
import { CARD_SIZE } from "@/const/card";
import { hoveredCardAtom } from "@/store/hoveredCardAtom";
import { graveyardModalAtom } from "@/store/graveyardModalAtom";
import { monsterFilter } from "@/utils/cardManagement";
import { useGameStore } from "@/store/gameStore";
import { ActionListSelector } from "./ActionListSelector";
import { motion } from "framer-motion";
import { getCardActions } from "@/utils/effectUtils";

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

    const [actionList, setActionList] = useState<string[]>([]);
    const [hoveringCard, setHoveringCard] = useState<CardInstance | null>(null);

    const sizeClasses = {
        small: CARD_SIZE.SMALL,
        medium: CARD_SIZE.MEDIUM,
        large: CARD_SIZE.LARGE,
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
                rounded cursor-pointer hover:scale-105 transition-transform
                shadow-md border border-gray-600 overflow-hidden
                relative
                ${
                    (card.position === "defense" || card.position === "back_defense") && !forceAttack
                        ? " -rotate-90"
                        : ""
                }
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
                perspective: "1000px", // 親要素にperspectiveを設定
            }}
        >
            {/* 3D回転コンテナ */}
            <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                transition={{ duration: disableActivate ? 0 : 0.6, ease: "easeInOut" }}
                animate={{ rotateY: card.position === "back" || card.position === "back_defense" ? 180 : 0 }}
            >
                {/* 表面 */}
                <div className="absolute inset-0 w-full h-full rounded" style={{ backfaceVisibility: "hidden" }}>
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

                    {/* 表面のフォールバック */}
                    <div
                        className={`${
                            card.card.image ? "hidden" : ""
                        } w-full h-full bg-gray-700 flex flex-col items-center justify-center p-1 text-white`}
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

                {/* 裏面 */}
                <div
                    className="absolute inset-0 w-full h-full rounded"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)", // 初期状態で180度回転
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
            </motion.div>

            {/* ActionListSelectorを3D変形の外に配置 */}
            {!disableActivate && hoveringCard?.id === card.id && actionList.length > 0 && (
                <div className="absolute inset-0 z-50">
                    {/* z-50で最前面に */}
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
                </div>
            )}
        </div>
    );
};
