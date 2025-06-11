import { type ComponentProps, type ReactNode } from "react";
import { motion } from "framer-motion";
type Props = ComponentProps<typeof motion.div> & { children: ReactNode };
const AnimationWrapper = ({ children, ...rest }: Props) => {
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
