import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { FieldZone } from "./FieldZone";
import { useEffect, useState } from "react";
type Props = {
    state: GameStore;
    cardInstance: CardInstance;
    onSelect: (zone: number) => void;
    onCancel?: () => void;
};
const getLinkMonsterSummonalble = (state: GameStore) => {
    const extraMonsters = state.field.extraMonsterZones
        .map((e, index) => ({ elem: e, index: index + 5 }))
        .filter(({ elem }) => elem !== null).length;

    const linkMonsters = [...state.field.monsterZones, ...state.field.extraMonsterZones]
        .map((e, zone) => ({ ...e, zone: zone === 5 ? 6 : zone === 6 ? 8 : zone }))
        .filter((e) => e !== null)
        .filter((e) => e.card?.card_type === "リンクモンスター")
        .map((e) => {
            return { directions: (e.card! as { link_markers: string }).link_markers!.split("、"), zone: e.zone };
        })
        .map(({ directions, zone: index }) => {
            const result: number[] = [];
            if (directions.includes("上")) {
                result.push(index + 5);
            }
            if (directions.includes("右上")) {
                result.push(index + 6);
            }
            if (directions.includes("右")) {
                result.push(index + 1);
            }
            if (directions.includes("右下")) {
                result.push(index - 4);
            }
            if (directions.includes("下")) {
                result.push(index - 5);
            }
            if (directions.includes("左下")) {
                result.push(index - 6);
            }
            if (directions.includes("左")) {
                result.push(index - 1);
            }
            if (directions.includes("左上")) {
                result.push(index + 4);
            }
            return result;
        })
        .flat()
        .filter((e) => (e >= 0 && e <= 4) || e === 6 || e === 8)
        .map((e) => (e === 6 ? 5 : e === 8 ? 6 : e));
    if (extraMonsters === 0) {
        return Array.from(new Set([...linkMonsters, 5, 6]));
    } else {
        return Array.from(new Set(linkMonsters));
    }
};

const SummonSelector = ({ cardInstance, state, onSelect, onCancel }: Props) => {
    const cardSizeClass = "w-20 h-32";
    const summonable =
        cardInstance.card.card_type === "リンクモンスター"
            ? getLinkMonsterSummonalble(state)
            : [
                  ...state.field.monsterZones.map((e, index) => ({ ...e, index })).filter((e) => e === null),
                  ...state.field.extraMonsterZones
                      .map((e, index) => ({ ...e, index: index + 5 }))
                      .filter((e) => e === null),
              ];
    console.log(summonable);
    const [zone, setZone] = useState<number>(0);
    useEffect(() => {
        setZone(summonable[0]);
    }, []);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
            <div className="bg-white rounded-lg p-6 max-w-[40vw] w-full mx-4">
                <h3 className="text-lg font-bold mb-4 text-center">リンク召喚</h3>
                <div className="mb-4 p-4 bg-blue-100 rounded text-center">
                    <p className="font-bold">{cardInstance.card.card_name}</p>
                    <p className="text-sm text-gray-600 mt-2">
                        素材: {cardInstance.materials.map((m) => m.card.card_name).join(", ")}
                    </p>
                </div>
                <p className="text-center mb-6">召喚する場所を選択してください</p>

                <div className="grid grid-cols-5 gap-4 max-w-6xl">
                    {/* 空のスペース */}
                    <div className={`${cardSizeClass}`}></div>

                    {/* 左のエクストラモンスターゾーン */}
                    <FieldZone
                        card={state.field.extraMonsterZones[0]}
                        className={`${cardSizeClass}`}
                        onClick={() => {
                            if (summonable.includes(5)) setZone(5);
                        }}
                        type={"extra_zone"}
                        disabled={!summonable.includes(5)}
                        selected={zone === 5}
                        customSize={cardSizeClass}
                    />

                    <div className={`${cardSizeClass}`}></div>

                    {/* 右のエクストラモンスターゾーン */}
                    <FieldZone
                        card={state.field.extraMonsterZones[1]}
                        className={`${cardSizeClass}`}
                        onClick={() => {
                            if (summonable.includes(6)) setZone(6);
                        }}
                        type={"extra_zone"}
                        disabled={!summonable.includes(6)}
                        selected={zone === 6}
                        customSize={cardSizeClass}
                    />

                    <div className={`${cardSizeClass}`}></div>
                </div>

                <div className="grid grid-cols-5 gap-4 max-w-6xl mt-6">
                    {state.field.monsterZones.map((card, index) => (
                        <FieldZone
                            key={`monster-${index}`}
                            card={card}
                            className={cardSizeClass}
                            onClick={() => {
                                if (summonable.includes(index)) setZone(index);
                            }}
                            disabled={!summonable.includes(index)}
                            selected={zone === index}
                            customSize={cardSizeClass}
                        />
                    ))}
                </div>

                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => onSelect(zone)}
                        disabled={zone < 0}
                        className={"px-6 py-3 rounded font-bold bg-blue-500 hover:bg-blue-600 text-white"}
                    >
                        確定
                    </button>
                    {onCancel && (
                        <button
                            onClick={() => onCancel()}
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

export default SummonSelector;
