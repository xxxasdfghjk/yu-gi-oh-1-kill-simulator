import React from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";

interface FieldZoneProps {
    card: CardInstance | null;
    onClick?: () => void;
    onCardClick?: (card: CardInstance, event?: React.MouseEvent) => void;
    onCardRightClick?: (card: CardInstance) => void;
    label?: string;
    className?: string;
    type?: "deck" | "extra_deck" | "banished" | "graveyard" | "field" | "extra_zone";
}

export const FieldZone: React.FC<FieldZoneProps> = ({
    card,
    onClick,
    onCardClick,
    onCardRightClick,
    label,
    className = "",
    type,
}) => {
    const handleClick = (event: React.MouseEvent) => {
        if (card && onCardClick) {
            onCardClick(card, event);
        } else if (onClick) {
            onClick();
        }
    };

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (card && onCardRightClick) {
            onCardRightClick(card);
        }
    };

    return (
        <div className={`relative ${className}`}>
            {label && <div className="absolute -top-5 left-0 text-xs text-gray-600">{label}</div>}
            <div
                className={`border-2 border-blue-400 rounded bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors h-full`}
                onClick={handleClick}
                onContextMenu={handleRightClick}
            >
                {card ? (
                    <Card card={card} size="medium" />
                ) : type === "deck" ? (
                    <div className="flex items-center justify-center text-blue-400 text-xs w-full h-full block">
                        Deck
                    </div>
                ) : type === "extra_deck" ? (
                    <div className="flex items-center justify-center text-blue-400 text-xs w-full h-full block">
                        EX Deck
                    </div>
                ) : type === "graveyard" ? (
                    <div className="flex items-center justify-center text-blue-400 text-xs w-full h-full block">GY</div>
                ) : type === "field" ? (
                    <div className="flex items-center justify-center text-blue-400 text-xs w-full h-full block">
                        Field
                    </div>
                ) : type === "extra_zone" ? (
                    <div className="flex items-center justify-center text-blue-400 text-xs w-full h-full block">
                        EX Zone
                    </div>
                ) : (
                    <div className="text-blue-400 text-xs w-full h-full block">Empty</div>
                )}
            </div>
        </div>
    );
};
