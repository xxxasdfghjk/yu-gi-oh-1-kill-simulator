import React, { useRef, useEffect } from "react";
import { Tooltip } from "./Tooltip";
import { motion, useSpring, useMotionValue } from "framer-motion";

interface LifePointsDisplayProps {
    lifePoints: number;
    label: string;
    tooltipText: string;
    color: "blue" | "red";
}

const AnimateNumber: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(value);
    const springValue = useSpring(motionValue, {
        damping: 30,
        stiffness: 100,
    });

    useEffect(() => {
        motionValue.set(value);
    }, [motionValue, value]);

    useEffect(() => {
        const unsubscribe = springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Math.round(latest).toString();
            }
        });

        // 初期値を即座に設定
        if (ref.current) {
            ref.current.textContent = value.toString();
        }

        return unsubscribe;
    }, [springValue, value]);

    return <span className={className} ref={ref} style={{ fontVariantNumeric: "tabular-nums" }} />;
};

export const LifePointsDisplay: React.FC<LifePointsDisplayProps> = ({ lifePoints, label, tooltipText, color }) => {
    const colorClass = color === "blue" ? "text-blue-600" : "text-red-600";

    return (
        <div className="space-y-2 flex flex-row justify-center relative">
            <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{label}</div>
                <Tooltip content={`${tooltipText}: ${lifePoints}`} position="top">
                    <motion.div
                        className={`text-5xl font-bold ${colorClass} cursor-help transition-all duration-200`}
                        transition={{ duration: 0.3 }}
                    >
                        <AnimateNumber value={lifePoints} className={`${colorClass}`} />
                    </motion.div>
                </Tooltip>
            </div>
        </div>
    );
};
