import type { Element, FusionMonsterCard, MonsterCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { withOption, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";

export default {
    card_name: "沼地のドロゴン",
    card_type: "モンスター" as const,
    text: "同じ属性で種族が異なるモンスター×２\n①：このカードがモンスターゾーンに存在する限り、相手はこのカード及びこのカードと同じ属性を持つフィールドのモンスターを効果の対象にできない。 ②：１ターンに１度、属性を１つ宣言して発動できる。 このカードはターン終了時まで宣言した属性になる。この効果は相手ターンでも発動できる。",
    image: "card100099272_1.jpg",
    monster_type: "融合モンスター",
    level: 4,
    element: "水" as const,
    race: "幻竜" as const,
    attack: 1900,
    defense: 1600,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    materialCondition: (card) => {
        if (card.length !== 2) {
            return false;
        }
        const elementNum = Array.from(
            new Map(card.map((e) => (monsterFilter(e.card) && [e.card.element, e.card.element]) || ["", ""])).values()
        ).length;
        const raceNum = Array.from(
            new Map(card.map((e) => (monsterFilter(e.card) && [e.card.race, e.card.race]) || ["", ""])).values()
        ).length;
        return elementNum === 1 && raceNum === 2;
    },
    filterAvailableMaterials: () => true,
    effect: {
        onIgnition: {
            condition: (state, card) =>
                withTurnAtOneceCondition(
                    state,
                    card,
                    (_state, card) => {
                        return card.location === "MonsterField";
                    },
                    card.id,
                    true
                ),
            effect: (state, card) => {
                const options = ["地", "水", "炎", "風", "闇", "光"] as Element[];
                withOption(
                    state,
                    card,
                    options.map((e) => ({ name: e, condition: () => true })),
                    (state, card, selected) => {
                        withTurnAtOneceEffect(
                            state,
                            card,
                            (state, card) => {
                                for (let i = 0; i < 5; i++) {
                                    if (
                                        state.field.monsterZones[i]?.id === card.id &&
                                        monsterFilter(state.field.monsterZones[i]!.card)
                                    ) {
                                        (state.field.monsterZones[i]!.card! as MonsterCard).element =
                                            selected[0] as Element;
                                    }
                                }
                                for (let i = 0; i < 2; i++) {
                                    if (
                                        state.field.extraMonsterZones[i]?.id === card.id &&
                                        monsterFilter(state.field.extraMonsterZones[i]!.card)
                                    ) {
                                        (state.field.extraMonsterZones[i]!.card! as MonsterCard).element =
                                            selected[0] as Element;
                                    }
                                }
                            },
                            card.id,
                            true
                        );
                    },
                    true
                );
            },
        },
    },
} satisfies FusionMonsterCard;
