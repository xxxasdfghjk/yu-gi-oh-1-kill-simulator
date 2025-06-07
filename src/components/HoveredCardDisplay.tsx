import React from "react";
import { useAtom } from "jotai";
import { hoveredCardAtom } from "@/store/hoveredCardAtom";
import { isMonsterCard } from "@/utils/gameUtils";

export const HoveredCardDisplay: React.FC = () => {
    const [hoveredCard] = useAtom(hoveredCardAtom);
    return (
        <div className="flex-[0.9] mx-auto h-[640px] mt-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-4 border-2 border-gray-300 h-full">
                {hoveredCard ? (
                    <>
                        {/* カード画像 */}
                        <div className="flex justify-center mb-4">
                            <img
                                src={
                                    hoveredCard.card.image
                                        ? `/card_image/${hoveredCard.card.image.replace(/\.(jpg|jpeg)$/i, ".png")}`
                                        : ""
                                }
                                alt={hoveredCard.card.card_name}
                                className="w-48 h-auto rounded-lg shadow-md"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                        </div>

                        {/* カード情報 */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-800 text-center">
                                {hoveredCard.card.card_name}
                            </h3>

                            <div className="text-sm text-gray-600 text-center">{hoveredCard.card.card_type}</div>

                            {/* モンスターカードの場合 */}
                            {isMonsterCard(hoveredCard.card) && (
                                <div className="text-sm text-gray-700 text-center">
                                    <div className="flex flex-row justify-center">
                                        <div
                                            className={`${
                                                hoveredCard.buf.level > 0
                                                    ? "text-blue-600"
                                                    : hoveredCard.buf.level < 0
                                                    ? "text-red-500"
                                                    : ""
                                            }`}
                                        >
                                            {"level" in hoveredCard.card &&
                                                hoveredCard.card.level &&
                                                `レベル: ${hoveredCard.card.level + hoveredCard.buf.level} `}
                                        </div>
                                        <div>
                                            {"rank" in hoveredCard.card &&
                                                hoveredCard.card.rank &&
                                                `ランク: ${hoveredCard.card.rank} `}
                                        </div>
                                        {"link" in hoveredCard.card &&
                                            hoveredCard.card.link &&
                                            `リンク: ${hoveredCard.card.link} `}
                                    </div>
                                    {"attribute" in hoveredCard.card &&
                                        hoveredCard.card.attribute &&
                                        `属性: ${hoveredCard.card.attribute} `}
                                    {"race" in hoveredCard.card &&
                                        hoveredCard.card.race &&
                                        `種族: ${hoveredCard.card.race}`}
                                    <div className="flex flex-row justify-center">
                                        <div
                                            className={`px-2 ${
                                                hoveredCard.buf.attack > 0
                                                    ? "text-blue-600"
                                                    : hoveredCard.buf.attack < 0
                                                    ? "text-red-500"
                                                    : ""
                                            }`}
                                        >
                                            {"attack" in hoveredCard.card &&
                                                hoveredCard.card.attack !== undefined &&
                                                `ATK: ${hoveredCard.card.attack + hoveredCard.buf.attack} `}
                                        </div>
                                        <div
                                            className={`px-2 ${
                                                hoveredCard.buf.defense > 0
                                                    ? "text-blue-600"
                                                    : hoveredCard.buf.defense < 0
                                                    ? "text-red-500"
                                                    : ""
                                            }`}
                                        >
                                            {"defense" in hoveredCard.card &&
                                                hoveredCard.card.defense !== undefined &&
                                                `DEF: ${hoveredCard.card.defense + hoveredCard.buf.defense}`}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* カードテキスト */}
                            <div className="text-[14px] text-gray-600 max-h-48 overflow-y-auto border-t pt-2 whitespace-pre-wrap">
                                {hoveredCard.card.text}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 text-lg">カードの情報を表示します</p>
                    </div>
                )}
            </div>
        </div>
    );
};
