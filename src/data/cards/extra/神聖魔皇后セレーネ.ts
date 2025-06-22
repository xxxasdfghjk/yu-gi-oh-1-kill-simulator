import { getSummonableIndexLink } from "@/components/SummonSelector";
import type { LinkMonsterCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { putMagicCounter } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import {
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withUserSelectCard,
    withUserSummon,
} from "@/utils/effectUtils";

export default {
    card_name: "神聖魔皇后セレーネ",
    card_type: "モンスター" as const,
    text: "魔法使い族モンスターを含むモンスター２体以上 ①：このカードがリンク召喚に成功した場合に発動する。お互いのフィールド・墓地の魔法カードの数だけこのカードに魔力カウンターを置く。②：フィールドに「エンディミオン」カードが存在する限り、相手はこのカードを攻撃対象に選択できない。③：１ターンに１度、自分・相手のメインフェイズに、自分フィールドの魔力カウンターを３つ取り除いて発動できる。自分の手札・墓地から魔法使い族モンスター１体を選び、このカードのリンク先となる自分フィールドに守備表示で特殊召喚する。",
    image: "card100291230_1.jpg",
    monster_type: "リンクモンスター",
    link: 3,
    linkDirection: ["左下", "下", "右下"] as const,
    element: "光" as const,
    race: "魔法使い" as const,
    attack: 1850,
    hasDefense: false as const,
    hasLevel: false as const,
    hasRank: false as const,
    hasLink: true as const,
    canNormalSummon: false as const,
    filterAvailableMaterials: () => true,
    materialCondition: (selected) => {
        if (selected.length < 2) {
            return false;
        }
        return !!selected.find((e) => monsterFilter(e.card) && e.card.race === "魔法使い");
    },
    effect: {
        onSummon: (state, card) => {
            const counterNum =
                new CardSelector(state)
                    .allFieldSpellTrap()
                    .filter()
                    .magic()
                    .get()
                    .filter((e) => e.position !== "back").length +
                new CardSelector(state).graveyard().filter().magic().get().length;
            putMagicCounter(state, card, counterNum);
        },
        onIgnition: {
            condition: (state, card) =>
                withTurnAtOneceCondition(state, card, (state, card) => {
                    const direction = (card.card as LinkMonsterCard).linkDirection;
                    let zone = -1;
                    for (let i = 0; i < 2; i++) {
                        if (state.field.extraMonsterZones[i]?.id === card.id) {
                            zone = i === 0 ? 6 : 8;
                        }
                    }
                    for (let i = 0; i < 5; i++) {
                        if (state.field.monsterZones[i]?.id === card.id) {
                            zone = i;
                        }
                    }
                    const index = getSummonableIndexLink(direction, zone)
                        .filter((e) => e === 6 || e === 8 || (e <= 4 && e >= 0))
                        .map((e) => (e === 6 ? 5 : e === 8 ? 6 : e));
                    let summonable = false;
                    for (let i = 0; i < index.length; i++) {
                        if (index[i] <= 4) {
                            if (state.field.monsterZones[index[i]] === null) {
                                summonable = true;
                            }
                        } else {
                            if (state.field.extraMonsterZones[index[i] - 5] === null) {
                                summonable = true;
                            }
                        }
                    }

                    return (
                        (card?.magicCounter ?? 0) >= 3 &&
                        card.location === "MonsterField" &&
                        new CardSelector(state).hand().graveyard().filter().race("魔法使い").len() > 0 &&
                        summonable
                    );
                }),
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    const direction = (card.card as LinkMonsterCard).linkDirection;
                    let zone = -1;
                    for (let i = 0; i < 2; i++) {
                        if (state.field.extraMonsterZones[i]?.id === card.id) {
                            zone = i === 0 ? 6 : 8;
                        }
                    }
                    for (let i = 0; i < 5; i++) {
                        if (state.field.monsterZones[i]?.id === card.id) {
                            zone = i;
                        }
                    }
                    const index = getSummonableIndexLink(direction, zone)
                        .filter((e) => e === 6 || e === 8 || (e <= 4 && e >= 0))
                        .map((e) => (e === 6 ? 5 : e === 8 ? 6 : e));
                    putMagicCounter(state, card, -3);
                    withUserSelectCard(
                        state,
                        card,
                        (state) => new CardSelector(state).hand().graveyard().filter().race("魔法使い").get(),
                        { select: "single" },
                        (state, card, selected) => {
                            withUserSummon(
                                state,
                                card,
                                selected[0],
                                {
                                    optionPosition: ["defense"],
                                    canSelectPosition: false,
                                    summonType: "Special",
                                    placementMask: index,
                                },
                                () => {}
                            );
                        }
                    );
                });
            },
        },
    },
} satisfies LinkMonsterCard;
