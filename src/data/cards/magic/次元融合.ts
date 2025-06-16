import type { MagicCard } from "@/types/card";
import {
    withUserSelectCard,
    withUserSummon,
    withLifeChange,
    withDelayRecursive,
    getPayLifeCost,
} from "@/utils/effectUtils";
import { CardSelector } from "@/utils/CardSelector";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "次元融合",
    card_type: "魔法" as const,
    text: "２０００ライフポイントを払う。お互いに除外されたモンスターをそれぞれのフィールド上に可能な限り特殊召喚する。",
    image: "card100002260_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state, card) => {
                // ライフポイントが2000以上あり、除外ゾーンに召喚可能なモンスターがいることが条件
                const banishedMonsters = new CardSelector(state).banished().filter().noSummonLimited().get();
                const lifeCosts = getPayLifeCost(state, card, 2000);
                return state.lifePoints >= lifeCosts && banishedMonsters.length > 0;
            },
            effect: (state, card) => {
                const lifeCosts = getPayLifeCost(state, card, 2000);
                withLifeChange(
                    state,
                    card,
                    {
                        target: "player",
                        amount: lifeCosts,
                        operation: "decrease",
                    },
                    (state, card) => {
                        // 除外ゾーンの召喚可能なモンスターを取得
                        const availableMonsters = new CardSelector(state).banished().filter().noSummonLimited().get();

                        if (availableMonsters.length === 0) {
                            return;
                        }

                        // フィールドの空きスペースを計算
                        const emptyMainZones = state.field.monsterZones.filter((zone) => zone === null).length;

                        if (availableMonsters.length <= emptyMainZones) {
                            // 全てのモンスターを召喚可能
                            const monsterIds = availableMonsters.map((monster) => monster.id);

                            withDelayRecursive(
                                state,
                                card,
                                { delay: 100 },
                                availableMonsters.length,
                                (state, card, depth) => {
                                    const targetId = monsterIds[depth - 1];
                                    const targetMonster = state.banished.find((m) => m.id === targetId);

                                    if (targetMonster) {
                                        withUserSummon(
                                            state,
                                            card,
                                            targetMonster,
                                            {
                                                canSelectPosition: true,
                                                optionPosition: ["attack", "defense"],
                                            },
                                            () => {}
                                        );
                                    }
                                }
                            );
                        } else {
                            // フィールドの空きより多いモンスターがいるので選択させる
                            const getAvailableMonsters = (state: GameStore) =>
                                new CardSelector(state).banished().filter().noSummonLimited().get();

                            withUserSelectCard(
                                state,
                                card,
                                getAvailableMonsters,
                                {
                                    select: "multi",
                                    condition: (selected) => selected.length === emptyMainZones,
                                    message: `フィールドに特殊召喚するモンスターを選択してください（${emptyMainZones}体）`,
                                    canCancel: false,
                                },
                                (state, card, selectedMonsters) => {
                                    if (selectedMonsters.length > 0) {
                                        const monsterIds = selectedMonsters.map((monster) => monster.id);

                                        withDelayRecursive(
                                            state,
                                            card,
                                            { delay: 100 },
                                            selectedMonsters.length,
                                            (state, card, depth) => {
                                                const targetId = monsterIds[depth - 1];
                                                const targetMonster = state.banished.find((m) => m.id === targetId);
                                                if (targetMonster) {
                                                    withUserSummon(
                                                        state,
                                                        card,
                                                        targetMonster,
                                                        {
                                                            canSelectPosition: true,
                                                            optionPosition: ["attack", "defense"],
                                                        },
                                                        () => {}
                                                    );
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    }
                );
            },
        },
    },
} satisfies MagicCard;
