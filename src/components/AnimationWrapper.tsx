import { type ComponentProps, type ReactNode, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CardInstance } from "@/types/card";

type Props = ComponentProps<typeof motion.div> & { 
    children: ReactNode;
    card?: CardInstance | null;
    enableTokenFadeOut?: boolean;
    enableFlipAnimation?: boolean;
};

const AnimationWrapper = ({ children, card, enableTokenFadeOut = false, enableFlipAnimation = false, ...rest }: Props) => {
    const previousPositionRef = useRef<string | undefined>(card?.position);
    
    // Helper function to determine if position is face down
    const isFaceDown = (position: string | undefined) => {
        return position === "back" || position === "back_defense";
    };
    
    // Detect position changes for flip animation
    const shouldFlip = enableFlipAnimation && card && 
        previousPositionRef.current !== undefined &&
        isFaceDown(previousPositionRef.current) !== isFaceDown(card.position);
    
    useEffect(() => {
        if (card?.position !== undefined) {
            previousPositionRef.current = card.position;
        }
    }, [card?.position]);
    
    // Handle flip animation
    if (enableFlipAnimation && card) {
        const currentIsFaceDown = isFaceDown(card.position);
        return (
            <motion.div
                layout
                animate={{ 
                    opacity: 1, 
                    x: 0, 
                    y: 0, 
                    rotate: 0, 
                    scale: 1,
                    rotateY: currentIsFaceDown ? 180 : 0
                }}
                transition={{ 
                    duration: shouldFlip ? 0.6 : 0.5,
                    rotateY: { duration: 0.6, ease: "easeInOut" }
                }}
                style={{ transformStyle: "preserve-3d" }}
                {...rest}
            >
                {children}
            </motion.div>
        );
    }
    
    if (enableTokenFadeOut) {
        return (
            <AnimatePresence mode="wait">
                {card && (
                    <motion.div
                        key={card.id}
                        layout
                        animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                        exit={
                            card.isToken 
                                ? { opacity: 0, scale: 0.8, transition: { duration: 1, ease: "easeOut" } }
                                : { x: 0, y: 0, opacity: 1, scale: 1 }
                        }
                        transition={{ duration: 0.5 }}
                        {...rest}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    return (
        <motion.div
            layout // 自動的に位置調整
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            {...rest}
        >
            {children}
        </motion.div>
    );
};

export default AnimationWrapper;
