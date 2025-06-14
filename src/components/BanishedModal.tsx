import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CardInstance } from "@/types/card";
import { Card } from "./Card";

interface BanishedModalProps {
    isOpen: boolean;
    onClose: () => void;
    banished: CardInstance[];
}

export const BanishedModal: React.FC<BanishedModalProps> = ({ isOpen, onClose, banished }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 背景のオーバーレイ */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={onClose}
                    />

                    {/* モーダル本体 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div
                            className="bg-gray-900 rounded-lg shadow-xl p-6 max-w-6xl max-h-[80vh] overflow-hidden pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* ヘッダー */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-indigo-400">
                                    除外ゾーン ({banished.length}枚)
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white transition-colors text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>

                            {/* カードリスト */}
                            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
                                {banished.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        除外されたカードはありません
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-6 gap-4">
                                        {banished.map((card) => (
                                            <div key={card.id} className="w-[120px] h-[174px]">
                                                <Card card={card} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};