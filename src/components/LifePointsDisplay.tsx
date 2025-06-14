import React, { useEffect, useState } from "react";
import { Tooltip } from "./Tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";

interface LifePointsDisplayProps {
    lifePoints: number;
    label: string;
    tooltipText: string;
    color: "blue" | "red";
}

export const LifePointsDisplay: React.FC<LifePointsDisplayProps> = ({ lifePoints, label, tooltipText, color }) => {
    const colorClass = color === "blue" ? "text-blue-600" : "text-red-600";
    const [displayValue, setDisplayValue] = useState(lifePoints);
    const [isAnimating, setIsAnimating] = useState(false);
    const [changeAmount, setChangeAmount] = useState<number | null>(null);
    const effectQueue = useGameStore((state) => state.effectQueue);
    
    // Check for life change effects in the queue
    useEffect(() => {
        const currentEffect = effectQueue?.[0];
        if (currentEffect?.type === "life_change") {
            const isTargetMatch = 
                (currentEffect.target === "player" && color === "blue") ||
                (currentEffect.target === "opponent" && color === "red");
                
            if (isTargetMatch) {
                const amount = currentEffect.operation === "decrease" ? -currentEffect.amount : currentEffect.amount;
                setChangeAmount(amount);
                setIsAnimating(true);
                
                // Animate the number change
                const duration = 800; // Match the delay in GameBoard
                const steps = 20;
                const stepDuration = duration / steps;
                const stepAmount = (lifePoints - displayValue) / steps;
                
                let currentStep = 0;
                const interval = setInterval(() => {
                    currentStep++;
                    if (currentStep >= steps) {
                        setDisplayValue(lifePoints);
                        clearInterval(interval);
                        setTimeout(() => {
                            setIsAnimating(false);
                            setChangeAmount(null);
                        }, 200);
                    } else {
                        setDisplayValue(prev => Math.round(prev + stepAmount));
                    }
                }, stepDuration);
                
                return () => clearInterval(interval);
            }
        }
    }, [effectQueue, lifePoints, color, displayValue]);
    
    // Update display value when lifePoints changes (non-animated)
    useEffect(() => {
        if (!isAnimating) {
            setDisplayValue(lifePoints);
        }
    }, [lifePoints, isAnimating]);

    return (
        <div className="space-y-2 flex flex-row justify-center relative">
            <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{label}</div>
                <Tooltip content={`${tooltipText}: ${displayValue}`} position="top">
                    <span className={`text-5xl font-bold ${colorClass} cursor-help transition-all duration-200 ${
                        isAnimating ? 'scale-110' : ''
                    }`}>
                        {displayValue}
                    </span>
                </Tooltip>
                
                {/* Damage/Heal animation */}
                <AnimatePresence>
                    {isAnimating && changeAmount !== null && (
                        <motion.div
                            className={`absolute -top-4 left-1/2 transform -translate-x-1/2 text-4xl font-bold ${
                                changeAmount < 0 ? 'text-red-500' : 'text-green-500'
                            }`}
                            initial={{ opacity: 0, y: 0 }}
                            animate={{ opacity: 1, y: -30 }}
                            exit={{ opacity: 0, y: -50 }}
                            transition={{ duration: 0.8 }}
                        >
                            {changeAmount < 0 ? changeAmount : `+${changeAmount}`}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
