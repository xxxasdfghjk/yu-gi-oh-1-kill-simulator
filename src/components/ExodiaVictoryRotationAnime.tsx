import { CommonMonsterMap } from "@/data/cards";
import type { CardInstance } from "@/types/card";
import { createCardInstance } from "@/utils/cardManagement";
import { motion } from "motion/react";
import { useEffect } from "react";
import { Card } from "./Card";

export const ExodiaVictoryRotationAnime = ({ isVisible }: { isVisible: boolean }) => {
    useEffect(() => {
        if (!isVisible) return;
        // const interval = setInterval(() => {
        //     setRotation((prev) => prev + 0.02); // ラジアンで増加
        // }, 10);

        // return () => clearInterval(interval);
    }, [isVisible]);

    const exodiaOrder = [
        "封印されしエクゾディア",
        "封印されし者の左腕",
        "封印されし者の左足",
        "封印されし者の右足",
        "封印されし者の右腕",
    ] as const;

    const a = CommonMonsterMap;
    const exodia = exodiaOrder.map((e) => createCardInstance(a[e], "Hand"));

    const sortedExodiaPieces = exodiaOrder
        .map((name) => exodia.find((piece) => piece.card.card_name === name))
        .filter(Boolean) as CardInstance[];

    if (sortedExodiaPieces.length === 0) {
        return null;
    }

    return (
        <div className="absolute top-[390px] left-[-80px]">
            <motion.div
                animate={{ rotate: 360, scale: "1" }}
                transition={{
                    duration: 3, // 2秒で1回転
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{
                    transformOrigin: "54% 12%", // 中55555555心を軸に（デフォルト）
                }}
            >
                <div className="relative w-screen h-screen">
                    {" "}
                    {/* 画面全体に */}
                    {sortedExodiaPieces.map((piece, index) => {
                        // 星型の頂点計算（上から時計回り）
                        const angle = index * ((2 * Math.PI) / 5) + (3 * Math.PI) / 2;
                        const radius = 360; // 半径を小さく
                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);

                        return (
                            <motion.div
                                key={piece.id}
                                className="absolute"
                                style={{
                                    left: "50%",
                                }}
                                initial={{
                                    x: x,
                                    y: y,
                                }}
                                animate={{
                                    x: x,
                                    y: y,
                                }}
                                transition={{
                                    duration: 0.1,
                                    ease: "linear",
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
