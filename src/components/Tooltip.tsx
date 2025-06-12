import React, { type ReactNode } from "react";

interface TooltipProps {
    children: ReactNode;
    content: string;
    position?: "top" | "bottom" | "left" | "right";
    show?: boolean;
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    children,
    content,
    position = "top",
    show = true,
    className = "",
}) => {
    const getPositionClasses = () => {
        switch (position) {
            case "top":
                return "bottom-full mb-2 left-1/2 transform -translate-x-1/2";
            case "bottom":
                return "top-full mt-2 left-1/2 transform -translate-x-1/2";
            case "left":
                return "right-full mr-2 top-1/2 transform -translate-y-1/2";
            case "right":
                return "left-full ml-2 top-1/2 transform -translate-y-1/2";
            default:
                return "bottom-full mb-2 left-1/2 transform -translate-x-1/2";
        }
    };

    const getArrowClasses = () => {
        switch (position) {
            case "top":
                return "absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black";
            case "bottom":
                return "absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-black";
            case "left":
                return "absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-black";
            case "right":
                return "absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-black";
            default:
                return "absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black";
        }
    };

    if (!show) {
        return <>{children}</>;
    }

    return (
        <div className={`relative group ${className}`}>
            {children}
            <div
                className={`absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${getPositionClasses()} px-3 py-2 bg-black text-white text-sm rounded-lg whitespace-nowrap z-50`}
            >
                {content}
                <div className={getArrowClasses()}></div>
            </div>
        </div>
    );
};
