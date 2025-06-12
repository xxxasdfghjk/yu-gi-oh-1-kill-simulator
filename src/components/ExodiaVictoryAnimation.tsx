import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./Card";
import type { CardInstance } from "@/types/card";

interface ExodiaVictoryAnimationProps {
    isVisible: boolean;
    exodiaPieces: CardInstance[];
    onAnimationComplete: () => void;
}

// 星型の5つの頂点の座標を計算する関数
const getStarPoints = (centerX: number, centerY: number, radius: number) => {
    const points = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2; // -90度から開始して時計回り
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        points.push({ x, y });
    }
    return points;
};

// 星型のSVGパスを生成する関数
const createStarPath = (centerX: number, centerY: number, outerRadius: number, innerRadius: number) => {
    const points = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        points.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
    }
    points.push("Z");
    return points.join(" ");
};

export const ExodiaVictoryAnimation: React.FC<ExodiaVictoryAnimationProps> = ({
    isVisible,
    exodiaPieces,
    onAnimationComplete,
}) => {
    const [animationPhase, setAnimationPhase] = useState<"cards" | "star" | "complete">("cards");
    const [showStar, setShowStar] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 1920, height: 1080 });

    // コンテナサイズを動的に取得
    useEffect(() => {
        const updateSize = () => {
            setContainerSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    // コンテナ内での中央座標を計算
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    const starRadius = 200;
    const starPoints = getStarPoints(centerX, centerY, starRadius);
    const starPath = createStarPath(centerX, centerY, starRadius, starRadius * 0.4);

    // エグゾディアパーツの順序を定義
    const exodiaOrder = [
        "封印されしエクゾディア",
        "封印されし者の右腕",
        "封印されし者の左腕",
        "封印されし者の右足",
        "封印されし者の左足",
    ];

    // 順序に従ってソートされたエグゾディアパーツ
    const sortedExodiaPieces = exodiaOrder
        .map((name) => exodiaPieces.find((piece) => piece.card.card_name === name))
        .filter(Boolean) as CardInstance[];

    useEffect(() => {
        if (!isVisible) return;

        // アニメーションの段階的実行
        const timer1 = setTimeout(() => {
            setShowStar(true);
        }, 500);

        const timer2 = setTimeout(() => {
            setAnimationPhase("star");
        }, 3000); // カードが星の位置に移動完了後

        const timer3 = setTimeout(() => {
            setAnimationPhase("complete");
            onAnimationComplete();
        }, 6000); // 星の回転アニメーション完了後

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [isVisible, onAnimationComplete]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-30 bg-black bg-opacity-80 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* 背景の星型 */}
                {showStar && (
                    <motion.svg
                        className="absolute"
                        width={containerSize.width}
                        height={containerSize.height}
                        viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: 0.3,
                            scale: 1,
                            rotate: animationPhase === "star" ? 360 : 0,
                        }}
                        transition={{
                            duration: animationPhase === "star" ? 3 : 1,
                            ease: [0.4, 0, 0.2, 1], // カスタムイージング
                        }}
                    >
                        <path d={starPath} fill="gold" stroke="yellow" strokeWidth="4" />
                    </motion.svg>
                )}

                {/* エグゾディアカード */}
                {sortedExodiaPieces.map((piece, index) => {
                    const targetPoint = starPoints[index];
                    const isMainBody = piece.card.card_name === "封印されしエクゾディア";

                    return (
                        <motion.div
                            key={piece.id}
                            className="absolute"
                            style={{
                                transformOrigin: "center center",
                            }}
                            initial={{
                                x: Math.random() * containerSize.width,
                                y: Math.random() * containerSize.height,
                                scale: 0.8,
                                rotate: Math.random() * 360,
                            }}
                            animate={{
                                x: targetPoint.x - 80, // カード幅の半分を引いて中央揃え (w-40 = 160px / 2 = 80px)
                                y: targetPoint.y - 112, // カード高さの半分を引いて中央揃え (h-56 = 224px / 2 = 112px)
                                scale: isMainBody ? 1.2 : 1,
                                rotate: 0,
                            }}
                            transition={{
                                duration: 2,
                                delay: index * 0.3,
                                ease: "backOut",
                            }}
                        >
                            <motion.div
                                animate={
                                    animationPhase === "star"
                                        ? {
                                              scale: [1, 1.1, 1],
                                              boxShadow: [
                                                  "0 0 20px rgba(255, 215, 0, 0.5)",
                                                  "0 0 40px rgba(255, 215, 0, 0.8)",
                                                  "0 0 20px rgba(255, 215, 0, 0.5)",
                                              ],
                                          }
                                        : {}
                                }
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                <Card card={piece} size="medium" forceAttack={true} disableActivate={true} />
                            </motion.div>
                        </motion.div>
                    );
                })}

                {/* 勝利テキスト */}
                <motion.div
                    className="absolute top-1/4 text-center"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 4, duration: 1 }}
                >
                    <motion.h1
                        className="text-6xl font-bold text-yellow-400 mb-4"
                        animate={{
                            textShadow: [
                                "0 0 20px rgba(255, 215, 0, 0.8)",
                                "0 0 40px rgba(255, 215, 0, 1)",
                                "0 0 20px rgba(255, 215, 0, 0.8)",
                            ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        EXODIA
                    </motion.h1>
                    <motion.p
                        className="text-2xl text-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 4.5, duration: 1 }}
                    >
                        OBLITERATE!
                    </motion.p>
                </motion.div>

                {/* パーティクル効果 */}
                {animationPhase === "star" && (
                    <div className="absolute inset-0 pointer-events-none">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                initial={{
                                    x: centerX,
                                    y: centerY,
                                    opacity: 1,
                                }}
                                animate={{
                                    x: centerX + (Math.random() - 0.5) * 800,
                                    y: centerY + (Math.random() - 0.5) * 600,
                                    opacity: 0,
                                    scale: [1, 0.5, 0],
                                }}
                                transition={{
                                    duration: 3,
                                    delay: Math.random() * 2,
                                    ease: "circOut",
                                }}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
