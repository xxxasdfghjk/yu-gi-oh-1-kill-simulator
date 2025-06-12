import React from "react";
import { motion } from "framer-motion";

interface GameStatusDisplayProps {
    turn: number;
    phase: string;
    isOpponentTurn: boolean;
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

export const GameStatusDisplay: React.FC<GameStatusDisplayProps> = ({ turn, phase, isOpponentTurn }) => {
    const phaseColor = phaseColors[phase] || "from-gray-500 to-gray-600";
    const phaseName = phaseDisplayNames[phase] || phase;

    return (
        <motion.div
            className="absolute top-4 right-4 z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[250px]">
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
