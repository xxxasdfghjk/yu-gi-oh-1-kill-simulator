import React from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";

interface FieldZoneProps {
    card: CardInstance | null;
    onClick?: () => void;
    onCardClick?: (card: CardInstance) => void;
    label?: string;
    className?: string;
    type?: "deck" | "extra_deck" | "banished" | "graveyard" | "field" | "extra_zone";
    disabled?: boolean;
    selected?: boolean;
    customSize?: string;
    reverse?: boolean;
}

export const FieldZone: React.FC<FieldZoneProps> = ({
    card,
    onClick,
    onCardClick,
    label,
    className = "",
    type,
    disabled,
    selected,
    customSize,
}) => {
    const handleClick = () => {
        if (card && onCardClick) {
            onCardClick(card);
        } else if (onClick) {
            onClick();
        }
    };

    const textColor = selected ? "text-red-400" : "text-blue-400";
    const borderColor = selected ? "border-red-400" : "border-blue-400";
    const bgColor = selected ? "bg-red-100" : "";

    return (
        <div className={`relative ${className}`}>
            {label && <div className="absolute -top-5 left-0 text-xs text-gray-600">{label}</div>}
            <div
                className={`border-2 ${borderColor} ${textColor} rounded bg-white/20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors h-full ${bgColor} ${
                    disabled ? "opacity-50" : ""
                }`}
                onClick={handleClick}
            >
                {card ? (
                    <Card 
                        card={card} 
                        size="medium" 
                        customSize={customSize} 
                    />
                ) : type === "deck" ? (
                    <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>Deck</div>
                ) : type === "extra_deck" ? (
                    <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>EX Deck</div>
                ) : type === "graveyard" ? (
                    <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>GY</div>
                ) : type === "field" ? (
                    <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>Field</div>
                ) : type === "extra_zone" ? (
                    <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>EX Zone</div>
                ) : (
                    <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>Empty</div>
                )}
            </div>
        </div>
    );
};
