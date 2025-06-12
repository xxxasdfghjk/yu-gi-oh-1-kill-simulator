import { motion } from "motion/react";
import { useEffect } from "react";
import { Card } from "./Card";
import { useGameStore } from "@/store/gameStore";
import { getLocationVectorWithPosition } from "@/const/card";

export const ExodiaVictoryRotationAnime = ({ isVisible }: { isVisible: boolean }) => {
    const { currentFrom, currentTo, throne, animationExodiaWin } = useGameStore();
    const exodiaInitial = currentTo.location === "Throne" ? getLocationVectorWithPosition(currentTo, currentFrom) : {};

    useEffect(() => {
        if (!isVisible) return;
        setTimeout(() => animationExodiaWin(), 200);
    }, [isVisible]);

    const ROTATION_DELAY_OFFSET = 2.5;
    return (
        <div className="absolute top-[390px] left-[-80px]">
            <motion.div
                animate={{ rotate: 360, scale: 1, opacity: 1 }}
                initial={{ opacity: 0, scale: 1 }}
                transition={{
                    opacity: { delay: 1, duration: 1 },
                    scale: { delay: ROTATION_DELAY_OFFSET, duration: 1 },
                    rotate: {
                        delay: ROTATION_DELAY_OFFSET + 2,
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                    },
                }}
                style={{
                    transformOrigin: "54% 12%", // 中55555555心を軸に（デフォルト）
                }}
            >
                <div className="relative w-screen h-screen">
                    {/* 画面全体に */}
                    {throne.map((piece, index) => {
                        // 星型の頂点計算（上から時計回り）
                        const angle = index * ((2 * Math.PI) / 5) + (3 * Math.PI) / 2;
                        const radius = 360; // 半径を小さく
                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);

                        return (
                            <motion.div
                                key={piece?.id ?? index}
                                className="absolute"
                                style={{
                                    left: "50%",
                                }}
                                initial={
                                    exodiaInitial
                                        ? exodiaInitial
                                        : {
                                              x: x,
                                              y: y,
                                          }
                                }
                                animate={{
                                    x: x,
                                    y: y,
                                }}
                                transition={{
                                    duration: 1.8,
                                    ease: "easeOut",
                                }}
                            >
                                <Card card={piece} size="medium" disableActivate={true} />
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};
