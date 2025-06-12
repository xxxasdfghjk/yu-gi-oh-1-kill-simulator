import type { CardInstance } from "@/types/card";

export const ActionListSelector = ({
    actions,
    onSelect,
    rotate,
}: {
    actions: string[];
    card: CardInstance;
    onSelect: (action: string) => void;
    rotate?: boolean;
}) => {
    const actionList = actions.map((e) => {
        switch (e) {
            case "summon":
                return { key: "summon", label: "召喚" };
            case "activate":
                return { key: "activate", label: "発動" };
            case "set":
                return { key: "set", label: "セット" };
            case "effect":
                return { key: "effect", label: "効果発動" };
            default:
                return { key: e, label: e };
        }
    });

    return (
        <div
            className={`absolute rounded z-20 flex flex-col items-center text-center w-full justify-center h-full hover:bg-black hover:bg-opacity-60 text-[18px] text-white ${
                rotate ? "rotate-180" : ""
            }`}
        >
            {actionList.map((action) => (
                <button
                    key={action.key}
                    onClick={() => onSelect(action.key)}
                    className="block w-full px-4 py-2 hover:bg-black hover:bg-opacity-50 text-center bg-opacity-90 flex-1"
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
};
