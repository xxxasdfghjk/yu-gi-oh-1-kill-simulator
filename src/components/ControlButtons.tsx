import React from "react";
import { Tooltip } from "./Tooltip";
import type { Deck } from "@/data/deckUtils";

interface ControlButtonsProps {
    isOpponentTurn: boolean;
    nextPhase: () => void;
    initializeGame: () => void;
    selectedDeck: Deck | null;
    onChangeDeck: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({ 
    isOpponentTurn, 
    nextPhase, 
    initializeGame, 
    selectedDeck, 
    onChangeDeck 
}) => {
    return (
        <div className="flex flex-col justify-center space-y-4 items-center">
            {/* デッキ情報表示 */}
            {selectedDeck && (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-center min-w-[200px]">
                    <div className="text-xs text-gray-600 mb-1">CURRENT DECK</div>
                    <div className="text-sm font-bold text-gray-800 mb-2">{selectedDeck.deck_name}</div>
                    <Tooltip content="別のデッキに変更してリセットします" position="top">
                        <button
                            onClick={onChangeDeck}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-lg shadow-md transition-colors text-sm"
                        >
                            CHANGE DECK
                        </button>
                    </Tooltip>
                </div>
            )}

            <Tooltip content={isOpponentTurn ? "押すと負けます" : "相手にターンを回します"} position="top">
                <button
                    onClick={nextPhase}
                    className={`block w-32 font-bold py-3 px-6 rounded-full shadow-lg ${
                        isOpponentTurn
                            ? "bg-red-700  hover:bg-red-900 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white transition-colors"
                    }`}
                >
                    {isOpponentTurn ? "NEXT PHASE" : "TURN END"}
                </button>
            </Tooltip>

            <Tooltip content="現在のデッキで初期盤面に戻します" position="bottom">
                <button
                    onClick={initializeGame}
                    className="block w-32 bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-colors"
                >
                    RESET
                </button>
            </Tooltip>
        </div>
    );
};
