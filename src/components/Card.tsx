import React from "react";
import { useSetAtom } from "jotai";
import type { CardInstance } from "@/types/card";
import { isMonsterCard, isSpellCard, isTrapCard } from "@/utils/gameUtils";
import { CARD_SIZE } from "@/const/card";
import { hoveredCardAtom } from "@/store/hoveredCardAtom";

interface CardProps {
    card: CardInstance;
    size?: "small" | "medium" | "large";
    onClick?: () => void;
    selected?: boolean;
    faceDown?: boolean;
    customSize?: string;
    reverse?: boolean;
    forceAttack?: boolean;
}

export const Card: React.FC<CardProps> = ({
    card,
    size = "medium",
    onClick,
    forceAttack,
    selected = false,
    faceDown = false,
    customSize = undefined,
}) => {
    const setHoveredCard = useSetAtom(hoveredCardAtom);
    // カードが伏せ状態かどうかをチェック
    const isFaceDown = faceDown || card.position === "facedown" || card.position === "facedown_defense";
    const sizeClasses = {
        small: CARD_SIZE.SMALL,
        medium: CARD_SIZE.MEDIUM,
        large: CARD_SIZE.LARGE,
    };

    const getCardColor = () => {
        if (isFaceDown) return "bg-gray-700";

        const cardType = card.card.card_type;
        if (isMonsterCard(card.card)) {
            if (cardType.includes("通常モンスター")) return "bg-yellow-500";
            if (cardType.includes("効果モンスター")) return "bg-orange-500";
            if (cardType.includes("儀式")) return "bg-blue-500";
            if (cardType === "融合モンスター") return "bg-purple-500";
            if (cardType === "シンクロモンスター") return "bg-gray-300";
            if (cardType === "エクシーズモンスター") return "bg-gray-800";
            if (cardType === "リンクモンスター") return "bg-blue-700";
        } else if (isSpellCard(card.card)) {
            return "bg-green-500";
        } else if (isTrapCard(card.card)) {
            return "bg-pink-500";
        }
        return "bg-gray-500";
    };

    // 画像パスを取得
    const getImagePath = () => {
        if (isFaceDown && !forceAttack) {
            return `/card_image/reverse.jpg`; // 裏面はフォールバック表示を使用
        }
        if (card.card.image) {
            const imageName = card.card.image;
            return `/card_image/${imageName}`;
        }
        return null;
    };
    const imagePath = getImagePath();
    return (
        <div
            className={`
        ${customSize ?? sizeClasses[size]} 
        ${selected ? "ring-4 ring-yellow-400" : ""}
        z-50 rounded cursor-pointer hover:scale-105 transition-transform
        shadow-md border border-gray-600 overflow-hidden
        ${!imagePath ? getCardColor() + " flex flex-col items-center justify-center p-1 text-white" : "bg-transparent"}
        ${(card.position === "defense" || card.position === "facedown_defense") && !forceAttack ? " -rotate-90" : ""}
      `}
            onClick={onClick}
            onMouseEnter={() => setHoveredCard(card)}
            onMouseLeave={() => {}}
        >
            {imagePath ? (
                <img
                    src={imagePath}
                    alt={isFaceDown ? "Card Back" : card.card.card_name}
                    className="w-full h-full object-contain"
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
                        {isMonsterCard(card.card) && "attack" in card.card && (
                            <div className="text-xs mt-auto">
                                ATK: {card.card.attack}
                                {card.card.defense !== undefined && ` / DEF: ${card.card.defense}`}
                            </div>
                        )}
                    </>
                )}
                {isFaceDown && <div className="text-xs text-gray-400">???</div>}
            </div>
        </div>
    );
};
