import React from "react";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";

interface ExtraMonsterZonesProps {
    extraMonsterZones: (CardInstance | null)[];
    handleFieldZoneClick: (zoneType: "monster" | "spell", index: number) => void;
    handleFieldCardClick: (card: CardInstance, event?: React.MouseEvent) => void;
    setShowCardDetail: (card: CardInstance | null) => void;
}

export const ExtraMonsterZones: React.FC<ExtraMonsterZonesProps> = ({
    extraMonsterZones,
    handleFieldZoneClick,
    handleFieldCardClick,
    setShowCardDetail,
}) => {
    return (
        <div className="my-6">
            <div className="grid grid-cols-7 gap-2 max-w-4xl mx-auto">
                {/* 空のスペース */}
                <div className="w-20 h-28"></div>
                <div className="w-20 h-28"></div>
                
                {/* 左のエクストラモンスターゾーン */}
                <FieldZone
                    card={extraMonsterZones[0]}
                    label="EX"
                    className="w-20 h-28 border-4 border-red-400"
                    onClick={() => handleFieldZoneClick("monster", 5)}
                    onCardClick={handleFieldCardClick}
                    onCardRightClick={(card) => setShowCardDetail(card)}
                />
                
                <div className="w-20 h-28"></div>
                
                {/* 右のエクストラモンスターゾーン */}
                <FieldZone
                    card={extraMonsterZones[1]}
                    label="EX"
                    className="w-20 h-28 border-4 border-red-400"
                    onClick={() => handleFieldZoneClick("monster", 6)}
                    onCardClick={handleFieldCardClick}
                    onCardRightClick={(card) => setShowCardDetail(card)}
                />
                
                <div className="w-20 h-28"></div>
                <div className="w-20 h-28"></div>
            </div>
        </div>
    );
};