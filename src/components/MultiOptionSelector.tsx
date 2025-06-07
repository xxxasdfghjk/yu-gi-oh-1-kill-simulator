import type { GameStore } from "@/store/gameStore";
import ModalWrapper from "./ModalWrapper";

interface MultiOptionSelectorProps {
    state: GameStore;
    title: string;
    onSelect: (selectedOption: { name: string; value: string }) => void;
    onCancel?: () => void;
    optionList: { name: string; value: string }[];
    isOpen?: boolean;
}

export const MultiOptionSelector = ({ title, onSelect, onCancel, optionList, isOpen = true }: MultiOptionSelectorProps) => {
    const handleConfirm = (selectedOption: { name: string; value: string }) => {
        onSelect(selectedOption);
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onCancel}>
            <div className="mb-4">
                <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
            </div>

            <div className="flex flex-row items-center justify-center">
                {optionList.map((e) => (
                    <div className="flex flex-row items-center justify-between">
                        <button
                            onClick={() => handleConfirm(e)}
                            className={`px-6 py-3 mx-6 rounded font-bold
                                    bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                            style={{ color: "white" }}
                        >
                            {e.name}
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 justify-center mt-3">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-bold"
                    >
                        キャンセル
                    </button>
                )}
            </div>
        </ModalWrapper>
    );
};
