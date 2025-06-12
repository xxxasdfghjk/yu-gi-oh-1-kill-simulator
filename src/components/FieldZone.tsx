import React, { type ReactNode } from "react";

interface FieldZoneProps {
    onClick?: () => void;
    label?: string;
    className?: string;
    type?: "deck" | "extra_deck" | "banished" | "graveyard" | "field" | "extra_zone";
    disabled?: boolean;
    selected?: boolean;
    customSize?: string;
    reverse?: boolean;
    disableActivate?: true;
    rotate?: boolean;
    children?: ReactNode;
    hasCard?: boolean; // カードの存在を明示的に指定
}

export const FieldZone: React.FC<FieldZoneProps> = ({
    onClick,
    label,
    className = "",
    type,
    disabled,
    selected,
    children,
}) => {
    const textColor = selected ? "text-red-400" : "text-blue-400";
    const borderColor = selected ? "border-red-400" : "border-blue-400";
    const bgColor = selected ? "bg-red-100" : "";

    return (
        <div className={`relative ${className} z-3`}>
            {label && <div className="absolute -top-5 left-0 text-xs text-gray-600">{label}</div>}
            <div
                className={`border-2 ${borderColor} ${textColor} rounded ${type === "extra_zone" ? "bg-blue-500/30" : "bg-white/20"} flex items-center justify-center cursor-pointer ${type === "extra_zone" ? "hover:bg-blue-500/40" : "hover:bg-white/30"} transition-colors h-full ${bgColor} ${
                    disabled ? "opacity-50" : ""
                } relative`}
                onClick={onClick}
            >
                {/* カード部分 - 上層 */}
                <div className="absolute z-20">{children}</div>
                <div className="absolute z-0 font-bold">
                    {type === "deck" ? (
                        <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>
                            Deck
                        </div>
                    ) : type === "extra_deck" ? (
                        <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>
                            EX Deck
                        </div>
                    ) : type === "graveyard" ? (
                        <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>GY</div>
                    ) : type === "field" ? (
                        <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>
                            Field
                        </div>
                    ) : type === "extra_zone" ? (
                        <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>
                            EX Zone
                        </div>
                    ) : (
                        <div className={`flex items-center justify-center ${textColor} text-xs w-full h-full`}>
                            Empty
                        </div>
                    )}
                </div>
                <div
                    className={`absolute z-0
         rounded cursor-pointer transition-transform
        shadow-md border border-gray-600 overflow-hidden
                 "bg-transparent"
      `}
                >
                    <img
                        src={`/card_image/reverse.jpg`}
                        alt={"dummy"}
                        className={`w-full h-full object-contain opacity-40`}
                        style={{
                            filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
                            backgroundColor: "transparent",
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
