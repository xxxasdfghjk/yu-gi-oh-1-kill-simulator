import { type ComponentProps, type ReactNode, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CardInstance } from "@/types/card";

type Props = ComponentProps<typeof motion.div> & {
    children: ReactNode;
    card?: CardInstance | null;
    enableTokenFadeOut?: boolean;
};

const AnimationWrapper = ({ children, card, enableTokenFadeOut = false, ...rest }: Props) => {
    const previousPositionRef = useRef<string | undefined>(card?.position);

    useEffect(() => {
        if (card?.position !== undefined) {
            previousPositionRef.current = card.position;
        }
    }, [card?.position]);

    if (enableTokenFadeOut) {
        return (
            <AnimatePresence mode="wait">
                {card && (
                    <motion.div
                        key={card.id}
                        layout
                        animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                        style={{ transformStyle: "preserve-3d" }}
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
            key={card?.id ?? 2}
            layout // 自動的に位置調整
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.5 }}
            style={{ transformStyle: "preserve-3d" }}
            {...rest}
        >
            {children}
        </motion.div>
    );
};

export default AnimationWrapper;
