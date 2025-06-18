import type { LeveledMonsterCard, CardInstance, MagicCard } from "@/types/card";
import { monsterFilter, hasLevelMonsterFilter } from "@/utils/cardManagement";
import { sendCardById } from "@/utils/cardMovement";
import { withTurnAtOneceCondition, withUserSelectCard, withUserSummon, withDelayRecursive } from "@/utils/effectUtils";
import { hasEmptyMonsterZone, getLevel, getCardInstanceFromId } from "@/utils/gameUtils";

export default {
    card_name: "高等儀式術",
    card_type: "魔法" as const,
    magic_type: "儀式魔法" as const,
    text: "儀式モンスターの降臨に必要。①：レベルの合計が儀式召喚するモンスターと同じになるように、デッキから通常モンスターを墓地へ送り、手札から儀式モンスター１体を儀式召喚する。",
    image: "card1001286_1.jpg",
    effect: {
        onSpell: {
            condition: (state, instance) => {
                return withTurnAtOneceCondition(state, instance, (state) => {
                    const ritualMonsters = [...state.hand]
                        .filter((e) => monsterFilter(e.card) && e.card.monster_type === "儀式モンスター")
                        .map((e) => e.card) as LeveledMonsterCard[];
                    const materials = [...state.deck]
                        .filter(
                            (e): e is CardInstance =>
                                e !== null && monsterFilter(e.card) && e.card.monster_type === "通常モンスター"
                        )
                        .map((e) => e.card) as LeveledMonsterCard[];
                    const summonableLevel = materials.reduce(
                        (prev, cur) => {
                            const noAdd = prev;
                            const added = prev.map((e) => e + cur.level);
                            return Array.from(new Set([...noAdd, ...added]));
                        },
                        [0]
                    );
                    const summonableRitualMonster = ritualMonsters.filter((e) => summonableLevel.includes(e.level));
                    return (
                        ritualMonsters.length > 0 &&
                        materials.length > 0 &&
                        summonableRitualMonster.length > 0 &&
                        hasEmptyMonsterZone(state)
                    );
                });
            },
            effect: (state, card, _, resolve) => {
                withUserSelectCard(
                    state,
                    card,
                    (state) => {
                        const ritualMonsters = [...state.hand].filter(
                            (e) => monsterFilter(e.card) && e.card.monster_type === "儀式モンスター"
                        );
                        const materials = [...state.deck]
                            .filter(
                                (e): e is CardInstance =>
                                    e !== null && monsterFilter(e.card) && e.card.monster_type === "通常モンスター"
                            )
                            .map((e) => e.card) as LeveledMonsterCard[];
                        const summonableLevel = materials.reduce(
                            (prev, cur) => {
                                const noAdd = prev;
                                const added = prev.map((e) => e + cur.level);
                                return Array.from(new Set([...noAdd, ...added]));
                            },
                            [0]
                        );
                        return ritualMonsters.filter(
                            (e) => hasLevelMonsterFilter(e.card) && summonableLevel.includes(e.card.level)
                        );
                    },
                    { select: "single", message: "儀式召喚する儀式モンスターを選択してください" },
                    (state, card, ritualMonster) => {
                        withUserSelectCard(
                            state,
                            card,
                            (state) =>
                                [...state.deck].filter(
                                    (e): e is CardInstance =>
                                        e !== null && monsterFilter(e.card) && e.card.monster_type === "通常モンスター"
                                ),
                            {
                                select: "multi",
                                condition: (cardList) => {
                                    return (
                                        cardList.reduce((prev, cur) => prev + getLevel(cur), 0) ===
                                        getLevel(ritualMonster[0])
                                    );
                                },
                                message: "儀式素材として墓地に送る通常モンスターを選択してください",
                            },
                            (state, card, selected) => {
                                const selectedIds = selected.map((e) => e.id);
                                const ritualMonsterId = ritualMonster[0].id;
                                const cardId = card.id;
                                withDelayRecursive(
                                    state,
                                    card,
                                    {},
                                    selected.length,
                                    (state, _, depth) => {
                                        sendCardById(state, selectedIds[depth - 1], "Graveyard");
                                    },
                                    (state, card) => {
                                        const ritualMonster = getCardInstanceFromId(state, ritualMonsterId)!;
                                        withUserSummon(state, card, ritualMonster, {}, (state) => {
                                            const card = getCardInstanceFromId(state, cardId)!;
                                            resolve?.(state, card);
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            },
        },
    },
} satisfies MagicCard;
