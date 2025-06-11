import type { GameStore } from "@/store/gameStore";
import type { CardInstance, LinkMonsterCard } from "@/types/card";
import { FieldZone } from "./FieldZone";
import { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import type { Position } from "@/utils/effectUtils";
import { isLinkMonster, monsterFilter } from "@/utils/cardManagement";
import { Card } from "./Card";
type Props = {
    state: GameStore;
    cardInstance: CardInstance;
    onSelect: (zone: number, position: Exclude<Position, undefined>) => void;
    optionPosition: Exclude<Position, undefined>[];
    onCancel?: () => void;
    isOpen?: boolean;
    popQueue: () => void;
};

const except = (a: number[], b: number[]) => {
    const bSet = new Set(b);
    return a.filter((e) => !bSet.has(e));
};

export const getLinkMonsterSummonalble = (
    extraMonsterZones: (CardInstance | null)[],
    monsterZones: (CardInstance | null)[]
) => {
    const extraMonsters = extraMonsterZones
        .map((e, index) => ({ elem: e, index: index + 5 }))
        .filter(({ elem }) => elem !== null).length;
    const existing = [...monsterZones, ...extraMonsterZones]
        .map((e, zone) => ({ elem: e, zone: zone === 5 ? 6 : zone === 6 ? 8 : zone }))
        .filter(({ elem }) => elem !== null)
        .map(({ zone }) => (zone === 6 ? 5 : zone === 8 ? 6 : zone));
    const linkMonsters = [...monsterZones, ...extraMonsterZones]
        .map((e, zone) => ({ ...e, zone: zone === 5 ? 6 : zone === 6 ? 8 : zone }))
        .filter((e) => e !== null)
        .filter((e) => e?.card && isLinkMonster(e.card))
        .map((e) => {
            return { directions: (e.card as LinkMonsterCard).linkDirection, zone: e.zone };
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
        return except(Array.from(new Set([...linkMonsters, 5, 6])), existing);
    } else {
        return except(Array.from(new Set(linkMonsters)), existing);
    }
};

const SummonSelector = ({
    cardInstance,
    state,
    onSelect,
    onCancel,
    optionPosition,
    isOpen = true,
    popQueue,
}: Props) => {
    const cardSizeClass = "w-20 h-32";
    const positionSizeClass = "w-20 h-32";
    const isLink = isLinkMonster(cardInstance.card);

    const summonable = isLink
        ? getLinkMonsterSummonalble(state.field.extraMonsterZones, state.field.monsterZones)
        : monsterFilter(cardInstance.card) &&
          (cardInstance.card.monster_type === "エクシーズモンスター" ||
              cardInstance.card.monster_type === "シンクロモンスター")
        ? [
              ...state.field.monsterZones.map((e, index) => ({ elem: e, index })).filter(({ elem }) => elem === null),
              ...state.field.extraMonsterZones
                  .map((e, index) => ({ elem: e, index: index + 5 }))
                  .filter(({ elem }) => elem === null),
          ].map((e) => e.index)
        : [...state.field.monsterZones.map((e, index) => ({ elem: e, index })).filter(({ elem }) => elem === null)].map(
              (e) => e.index
          );
    const [zone, setZone] = useState<number>(-1);
    const [position, setPosition] = useState<Exclude<Position, undefined>>("attack");
    const dummyCardInstance = { ...cardInstance, position: "back_defense" as const };
    useEffect(() => {
        setZone(summonable?.[0] ?? -1);
        setPosition(optionPosition[0]);
    }, []);
    return (
        <ModalWrapper isOpen={isOpen}>
            {isLink && <h3 className="text-lg font-bold mb-4 text-center">リンク召喚</h3>}
            <div className="mb-4 p-4 bg-blue-100 rounded text-center">
                <p className="font-bold">{cardInstance.card.card_name}</p>
                {cardInstance.materials.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                        素材: {cardInstance.materials.map((m) => m.card.card_name).join(", ")}
                    </p>
                )}
            </div>
            <p className="text-center mb-6">召喚する場所を選択してください</p>

            <div className="grid grid-cols-5 gap-4 max-w-6xl">
                {/* 空のスペース */}
                <div className={`${cardSizeClass}`}></div>

                {/* 左のエクストラモンスターゾーン */}
                <FieldZone
                    className={`${cardSizeClass}`}
                    onClick={() => {
                        if (summonable.includes(5)) setZone(5);
                    }}
                    type={"extra_zone"}
                    disabled={!summonable.includes(5)}
                    selected={zone === 5}
                    customSize={cardSizeClass}
                    disableActivate={true}
                >
                    <Card card={state.field.extraMonsterZones[0]} customSize={positionSizeClass}></Card>
                </FieldZone>

                <div className={`${cardSizeClass}`}></div>

                {/* 右のエクストラモンスターゾーン */}
                <FieldZone
                    className={`${cardSizeClass}`}
                    onClick={() => {
                        if (summonable.includes(6)) setZone(6);
                    }}
                    type={"extra_zone"}
                    disabled={!summonable.includes(6)}
                    selected={zone === 6}
                    customSize={cardSizeClass}
                    disableActivate={true}
                >
                    <Card card={state.field.extraMonsterZones[1]} customSize={positionSizeClass}></Card>
                </FieldZone>

                <div className={`${cardSizeClass}`}></div>
            </div>

            <div className="grid grid-cols-5 gap-4 max-w-6xl mt-6">
                {state.field.monsterZones.map((card, index) => (
                    <FieldZone
                        key={`monster-${index}`}
                        className={cardSizeClass}
                        onClick={() => {
                            if (summonable.includes(index)) setZone(index);
                        }}
                        disabled={!summonable.includes(index)}
                        selected={zone === index}
                        customSize={cardSizeClass}
                        disableActivate={true}
                    >
                        <Card card={card} disableActivate={true} customSize={positionSizeClass}></Card>
                    </FieldZone>
                ))}
            </div>

            <div className="flex mt-6 items-center justify-around">
                <div className="mr-2">{"表示形式を選択してください"}</div>
                {optionPosition.includes("attack") && (
                    <FieldZone
                        className={`${positionSizeClass}`}
                        onClick={() => {
                            setPosition("attack");
                        }}
                        selected={position === "attack"}
                        customSize={positionSizeClass}
                    >
                        <Card card={cardInstance} customSize={positionSizeClass} disableActivate={true}></Card>
                    </FieldZone>
                )}
                {optionPosition.includes("defense") && (
                    <FieldZone
                        className={`${positionSizeClass} -rotate-90`}
                        onClick={() => {
                            setPosition("defense");
                        }}
                        selected={position === "defense"}
                        customSize={positionSizeClass}
                    >
                        <Card card={cardInstance} disableActivate={true} customSize={positionSizeClass}></Card>
                    </FieldZone>
                )}

                {optionPosition.includes("back_defense") && (
                    <FieldZone
                        className={`${positionSizeClass} `}
                        onClick={() => {
                            setPosition("back_defense");
                        }}
                        selected={position === "back_defense"}
                        reverse={true}
                    >
                        <Card card={dummyCardInstance} customSize={positionSizeClass} disableActivate={true}></Card>
                    </FieldZone>
                )}
            </div>

            <div className="flex justify-center mt-6">
                <button
                    onClick={() => onSelect(zone, position)}
                    disabled={zone < 0}
                    className={"px-6 py-3 rounded font-bold bg-blue-500 hover:bg-blue-600 text-white"}
                >
                    確定
                </button>
                {(onCancel || summonable.length === 0) && (
                    <button
                        onClick={() => {
                            if (onCancel) {
                                onCancel();
                            } else {
                                popQueue();
                            }
                        }}
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded font-bold"
                    >
                        キャンセル
                    </button>
                )}
            </div>
        </ModalWrapper>
    );
};

export default SummonSelector;
