import React from "react";
import ModalWrapper from "./ModalWrapper";
import { useGameStore, type GameStore } from "@/store/gameStore";

interface DebugStateModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameState: GameStore;
}

export const DebugStateModal: React.FC<DebugStateModalProps> = ({ isOpen, onClose, gameState }) => {
    const { deckTopToGraveyard } = useGameStore();
    const formatState = (obj: any, depth = 0): string => {
        const indent = "  ".repeat(depth);
        if (obj === null) return "null";
        if (obj === undefined) return "undefined";
        if (typeof obj === "function") return "[Function]";
        if (obj instanceof Array) {
            if (obj.length === 0) return "[]";
            if (depth > 2) return `[Array(${obj.length})]`;
            return `[\n${obj.map((item) => `${indent}  ${formatState(item, depth + 1)}`).join(",\n")}\n${indent}]`;
        }
        if (typeof obj === "object") {
            if (obj.card_name) return `Card: ${obj.card_name}`;
            if (obj.id && obj.card) return `CardInstance: ${obj.card.card_name}`;
            const keys = Object.keys(obj);
            if (keys.length === 0) return "{}";
            if (depth > 2) return "{...}";
            return `{\n${keys
                .map((key) => `${indent}  ${key}: ${formatState(obj[key], depth + 1)}`)
                .join(",\n")}\n${indent}}`;
        }
        if (typeof obj === "string") return `"${obj}"`;
        return String(obj);
    };

    const stateInfo = {
        // Game State
        turn: gameState.turn,
        phase: gameState.phase,
        lifePoints: gameState.lifePoints,
        opponentLifePoints: gameState.opponentLifePoints,

        // Cards in zones
        handCount: gameState.hand.length,
        deckCount: gameState.deck.length,
        graveyardCount: gameState.graveyard.length,
        extraDeckCount: gameState.extraDeck.length,

        // Field state
        monsterZones: gameState.field.monsterZones.map((m) => (m ? m.card.card_name : "empty")),
        spellTrapZones: gameState.field.spellTrapZones.map((s) => (s ? s.card.card_name : "empty")),
        fieldZone: gameState.field.fieldZone?.card.card_name || "empty",

        // Flags
        hasNormalSummoned: gameState.hasNormalSummoned,
        hasSpecialSummoned: gameState.hasSpecialSummoned,
        isOpponentTurn: gameState.isOpponentTurn,
        isProcessing: gameState.isProcessing,
        gameOver: gameState.gameOver,
        winner: gameState.winner,

        // Effect Queue
        effectQueueLength: gameState.effectQueue.length,
        effectQueue: gameState.effectQueue.map((e) => ({
            type: e.type,
            card: e.cardInstance.card.card_name,
            effectType: e.effectType,
        })),

        // Chain
        cardChain: gameState.cardChain.map((c) => c.card.card_name),

        // Turn restrictions
        turnOnceUsedEffects: Object.keys(gameState.turnOnceUsedEffectMemo || {}),
    };

    return (
        <ModalWrapper isOpen={isOpen}>
            <div className="max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Debug State</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                    <pre className="bg-gray-100 p-4 rounded text-xs font-mono whitespace-pre-wrap">
                        {formatState(stateInfo, 0)}
                    </pre>
                </div>

                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                        閉じる
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};
