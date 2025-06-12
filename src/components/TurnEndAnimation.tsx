import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TurnEndAnimationProps {
    show: boolean;
    onComplete?: () => void;
}

export const TurnEndAnimation: React.FC<TurnEndAnimationProps> = ({ show, onComplete }) => {
    const [showOpponentTurn, setShowOpponentTurn] = useState(false);
    const [showTurnEnd, setShowTurnEnd] = useState(false);

    useEffect(() => {
        if (show) {
            setShowTurnEnd(true);
            setShowOpponentTurn(false);
        }
    }, [show]);
    const handleTurnEndComplete = () => {
        setShowTurnEnd(false);
        setShowOpponentTurn(true);
    };

    const handleOpponentTurnComplete = () => {
        setShowOpponentTurn(false);
        onComplete?.();
    };

    return (
        <>
            {/* 操作ブロック用のオーバーレイ */}
            <AnimatePresence>
                {(showTurnEnd || showOpponentTurn) && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-[99]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />
                )}
            </AnimatePresence>

            {/* TURN END アニメーション */}
            <AnimatePresence>
                {showTurnEnd && (
                    <motion.div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none overflow-hidden">
                        <motion.div
                            className="text-white text-8xl font-bold tracking-wider"
                            initial={{ x: "-100%", opacity: 0 }}
                            animate={{
                                x: ["-100%", "0%", "0%", "100%"],
                                opacity: [0, 1, 1, 0],
                            }}
                            transition={{
                                duration: 1.5,
                                times: [0, 0.2, 0.5, 0.8],
                                ease: "easeInOut",
                            }}
                            onAnimationComplete={handleTurnEndComplete}
                            style={{
                                textShadow:
                                    "0 0 30px rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 255, 255, 0.6), 0 0 90px rgba(255, 255, 255, 0.3)",
                                background: "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            TURN END
                        </motion.div>

                        {/* 動的な背景ライン */}
                        <motion.div
                            className="absolute inset-0 -z-10"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ duration: 1.5, ease: "linear" }}
                        >
                            <div className="w-full h-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OPPONENT TURN アニメーション */}
            <AnimatePresence>
                {showOpponentTurn && (
                    <motion.div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none overflow-hidden">
                        <motion.div
                            className="text-white text-7xl font-bold tracking-wider"
                            initial={{ x: "-100%", opacity: 0 }}
                            animate={{
                                x: ["-100%", "0%", "0%", "100%"],
                                opacity: [0, 1, 1, 0],
                            }}
                            transition={{
                                duration: 2,
                                times: [0, 0.25, 0.5, 0.8],
                                ease: "easeInOut",
                            }}
                            onAnimationComplete={handleOpponentTurnComplete}
                            style={{
                                textShadow:
                                    "0 0 30px rgba(255, 100, 100, 0.9), 0 0 60px rgba(255, 50, 50, 0.6), 0 0 90px rgba(255, 0, 0, 0.3)",
                                background: "linear-gradient(90deg, #ff6b6b 0%, #ff4444 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            OPPONENT TURN
                        </motion.div>

                        {/* 動的な背景ライン - 赤系 */}
                        <motion.div
                            className="absolute inset-0 -z-10"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ duration: 2, ease: "linear" }}
                        >
                            <div className="w-full h-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
