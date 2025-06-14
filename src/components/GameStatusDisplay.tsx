import React from "react";
import { motion } from "framer-motion";

interface GameStatusDisplayProps {
    turn: number;
    phase: string;
    isOpponentTurn: boolean;
    onDebugClick?: () => void;
}

const phaseDisplayNames: Record<string, string> = {
    draw: "ドローフェイズ",
    standby: "スタンバイフェイズ",
    main1: "メインフェイズ1",
    battle: "バトルフェイズ",
    main2: "メインフェイズ2",
    end: "エンドフェイズ",
};

const phaseColors: Record<string, string> = {
    draw: "from-blue-500 to-blue-600",
    standby: "from-purple-500 to-purple-600",
    main1: "from-green-500 to-green-600",
    battle: "from-red-500 to-red-600",
    main2: "from-green-500 to-green-600",
    end: "from-gray-500 to-gray-600",
};

export const GameStatusDisplay: React.FC<GameStatusDisplayProps> = ({ turn, phase, isOpponentTurn, onDebugClick }) => {
    const phaseColor = phaseColors[phase] || "from-gray-500 to-gray-600";
    const phaseName = phaseDisplayNames[phase] || phase;

    return (
        <motion.div
            className="z-30 pl-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[250px] relative">
                {/* デバッグボタン */}
                {onDebugClick && (
                    <button
                        onClick={onDebugClick}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Debug State"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </button>
                )}
                
                {/* ターン表示 */}
                <div className="mb-3">
                    <div className="text-sm text-gray-600 mb-1">TURN</div>
                    <div className="flex items-center gap-2">
                        <div className="text-4xl font-bold text-gray-800">{turn}</div>
                        {isOpponentTurn && (
                            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">OPPONENT</div>
                        )}
                    </div>
                </div>

                {/* フェーズ表示 */}
                <div>
                    <div className="text-sm text-gray-600 mb-2">PHASE</div>
                    <motion.div
                        key={phase}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`bg-gradient-to-r ${phaseColor} text-white rounded-md py-2 px-3 text-center font-bold shadow-md`}
                    >
                        {phaseName}
                    </motion.div>
                </div>

                {/* フェーズインジケーター */}
                <div className="mt-3 flex gap-1">
                    {Object.keys(phaseDisplayNames).map((p) => (
                        <div
                            key={p}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                p === phase ? "bg-gradient-to-r " + phaseColor : "bg-gray-300"
                            }`}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
