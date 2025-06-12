import React from "react";
import { Tooltip } from "./Tooltip";

interface ControlButtonsProps {
    isOpponentTurn: boolean;
    nextPhase: () => void;
    initializeGame: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({ isOpponentTurn, nextPhase, initializeGame }) => {
    return (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-4">
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

            <Tooltip content="初期盤面に戻します" position="bottom">
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
