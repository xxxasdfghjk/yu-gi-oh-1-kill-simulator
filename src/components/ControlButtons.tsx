import React from "react";

interface ControlButtonsProps {
    isOpponentTurn: boolean;
    nextPhase: () => void;
    initializeGame: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({ isOpponentTurn, nextPhase, initializeGame }) => {
    return (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 space-y-4">
            <button
                onClick={nextPhase}
                className={`block w-32 font-bold py-3 px-6 rounded-full shadow-lg ${
                    isOpponentTurn ? "bg-gray-400 text-gray-600" : "bg-cyan-400 hover:bg-cyan-500 text-white"
                }`}
            >
                {isOpponentTurn ? "NEXT PHASE" : "TURN END"}
            </button>
            <button
                onClick={initializeGame}
                className="block w-32 bg-cyan-400 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-full shadow-lg"
            >
                RESET
            </button>
        </div>
    );
};
