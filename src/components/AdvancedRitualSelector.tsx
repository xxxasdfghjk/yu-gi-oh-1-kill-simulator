import React, { useState } from "react";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";

interface AdvancedRitualSelectorProps {
    normalMonsters: CardInstance[];
    requiredLevel: number;
    onSelect: (selectedMonsters: CardInstance[]) => void;
    onCancel: () => void;
}

export const AdvancedRitualSelector: React.FC<AdvancedRitualSelectorProps> = ({
    normalMonsters,
    requiredLevel,
    onSelect,
    onCancel,
}) => {
    const [selectedMonsters, setSelectedMonsters] = useState<CardInstance[]>([]);

    const getCurrentLevel = () => {
        return selectedMonsters.reduce((sum, monster) => {
            const level = (monster.card as any).level || 0;
            return sum + level;
        }, 0);
    };

    const handleMonsterClick = (monster: CardInstance) => {
        const isSelected = selectedMonsters.some((m) => m.id === monster.id);

        if (isSelected) {
            // 選択解除
            setSelectedMonsters((prev) => prev.filter((m) => m.id !== monster.id));
        } else {
            // 選択追加
            const monsterLevel = (monster.card as any).level || 0;
            const currentLevel = getCurrentLevel();

            // 必要レベルを超えない場合のみ追加
            if (currentLevel + monsterLevel <= requiredLevel) {
                setSelectedMonsters((prev) => [...prev, monster]);
            }
        }
    };

    const canConfirm = getCurrentLevel() === requiredLevel;
    const currentLevel = getCurrentLevel();

    return (
        <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded">
                <div className="flex justify-between items-center">
                    <span className="font-bold">現在のレベル合計: {currentLevel}</span>
                    <span className="font-bold">必要レベル: {requiredLevel}</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                    <div
                        className={`h-2 rounded-full transition-all ${
                            currentLevel === requiredLevel
                                ? "bg-green-500"
                                : currentLevel > requiredLevel
                                ? "bg-red-500"
                                : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min((currentLevel / requiredLevel) * 100, 100)}%` }}
                    />
                </div>
                {currentLevel > requiredLevel && (
                    <p className="text-red-600 text-sm mt-1">レベル合計が必要レベルを超えています</p>
                )}
                {canConfirm && <p className="text-green-600 text-sm mt-1">レベル合計が一致しました！</p>}
            </div>

            <div className="grid  lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto">
                {normalMonsters.map((monster) => {
                    const isSelected = selectedMonsters.some((m) => m.id === monster.id);
                    const monsterLevel = (monster.card as any).level || 0;
                    const wouldExceed = getCurrentLevel() + monsterLevel > requiredLevel;

                    return (
                        <div
                            key={monster.id}
                            className={`cursor-pointer transition-all duration-200 border-2 rounded p-2 ${
                                isSelected
                                    ? "border-blue-500 bg-blue-100 transform scale-105"
                                    : wouldExceed && !isSelected
                                    ? "border-red-300 bg-red-50 opacity-50 cursor-not-allowed"
                                    : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                            }`}
                            onClick={() => (isSelected || !wouldExceed) && handleMonsterClick(monster)}
                        >
                            <Card card={monster} size="small" />
                            <div className="text-xs text-center mt-1 truncate font-semibold">
                                {monster.card.card_name}
                            </div>
                            <div className="text-xs text-center text-gray-600">Lv.{monsterLevel}</div>
                        </div>
                    );
                })}
            </div>

            {selectedMonsters.length > 0 && (
                <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-bold mb-2">選択中のモンスター:</h4>
                    <div className="flex flex-wrap gap-2">
                        {selectedMonsters.map((monster) => (
                            <div key={monster.id} className="bg-white p-2 rounded border text-sm">
                                {monster.card.card_name} (Lv.{(monster.card as any).level || 0})
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-center space-x-4">
                <button
                    onClick={() => onSelect(selectedMonsters)}
                    disabled={!canConfirm}
                    className={`px-6 py-3 rounded font-bold ${
                        canConfirm
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    儀式召喚を実行
                </button>
                <button
                    onClick={onCancel}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-bold"
                >
                    キャンセル
                </button>
            </div>
        </div>
    );
};
