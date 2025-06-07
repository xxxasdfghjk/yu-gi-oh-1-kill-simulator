import type { GameStore } from "@/store/gameStore";

interface MultiOptionSelectorProps {
    state: GameStore;
    title: string;
    onSelect: (selectedOption: { name: string; value: string }) => void;
    onCancel?: () => void;
    optionList: { name: string; value: string }[];
}

export const MultiOptionSelector = ({ title, onSelect, onCancel, optionList }: MultiOptionSelectorProps) => {
    const handleConfirm = (selectedOption: { name: string; value: string }) => {
        onSelect(selectedOption);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                            >
                                {e.name}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 justify-center">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-bold"
                        >
                            キャンセル
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
