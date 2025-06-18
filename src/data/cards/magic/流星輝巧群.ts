import type { CardInstance, MagicCard, MonsterCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { sendCard, addBuf } from "@/utils/cardMovement";
import {
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
} from "@/utils/effectUtils";
import {
    hasEmptyMonsterZone,
    getAllMonsterInMonsterZones,
    getAttack,
    hasEmptyMonsterZoneWithExclude,
    getCardInstanceFromId,
} from "@/utils/gameUtils";

export default {
    card_name: "流星輝巧群",
    card_type: "魔法" as const,
    magic_type: "儀式魔法" as const,
    text: "儀式モンスターの降臨に必要。このカード名の②の効果は１ターンに１度しか使用できない。①：攻撃力の合計が儀式召喚するモンスターの攻撃力以上になるように、自分の手札・フィールドの機械族モンスターをリリースし、自分の手札・墓地から儀式モンスター１体を儀式召喚する。②：このカードが墓地に存在する場合、自分フィールドの「ドライトロン」モンスター１体を対象として発動できる。そのモンスターの攻撃力を相手ターン終了時まで１０００ダウンし、このカードを手札に加える。",
    image: "card100206549_1.jpg",
    effect: {
        onSpell: {
            condition: (state) => {
                {
                    const ritualMonsters = [...state.hand, ...state.graveyard]
                        .filter((e) => monsterFilter(e.card) && e.card.monster_type === "儀式モンスター")
                        .map((e) => e.card) as MonsterCard[];
                    const minRitualMonstersAttack = ritualMonsters.reduce(
                        (prev, cur) => Math.min(prev, cur.attack),
                        9999999999999
                    );

                    const extraMaterialCandidate = [...state.field.monsterZones, ...state.field.extraMonsterZones]
                        .filter(
                            (e): e is CardInstance =>
                                e !== null &&
                                monsterFilter(e.card) &&
                                e.card.canUseMaterilForRitualSummon === true &&
                                e.materials !== undefined
                        )
                        .map((e) => e.materials)
                        .flat();
                    const materials = [
                        ...state.hand,
                        ...state.field.monsterZones,
                        ...state.field.extraMonsterZones,
                        ...extraMaterialCandidate,
                    ]
                        .filter((e): e is CardInstance => e !== null && monsterFilter(e.card) && e.card.race === "機械")
                        .map((e) => e.card) as MonsterCard[];
                    const sumOfMaterialsAttack = materials.reduce((prev, cur) => prev + cur.attack, 0);
                    if (
                        !(
                            ritualMonsters.length > 0 &&
                            materials.length > 0 &&
                            sumOfMaterialsAttack >= minRitualMonstersAttack
                        )
                    ) {
                        return false;
                    }
                    if (hasEmptyMonsterZone(state)) {
                        return true;
                    } else {
                        const monsters = getAllMonsterInMonsterZones(state, false);
                        if (
                            monsters.find(
                                (e) =>
                                    monsterFilter(e.card) &&
                                    e.card.race === "機械" &&
                                    getAttack(e) > minRitualMonstersAttack
                            )
                        ) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            },
            effect: (state, card, _, resolve) => {
                const spellId = card.id;
                withUserSelectCard(
                    state,
                    card,
                    (state) => {
                        return [...state.hand, ...state.graveyard].filter(
                            (e) => monsterFilter(e.card) && e.card.monster_type === "儀式モンスター"
                        );
                    },
                    { select: "single", message: "儀式召喚する儀式モンスターを選択してください" },
                    (state, card, ritual) => {
                        withUserSelectCard(
                            state,
                            card,
                            (state) => {
                                const extraMaterialCandidate = [
                                    ...state.field.monsterZones,
                                    ...state.field.extraMonsterZones,
                                ]
                                    .filter(
                                        (e): e is CardInstance =>
                                            e !== null &&
                                            monsterFilter(e.card) &&
                                            e.card.canUseMaterilForRitualSummon === true &&
                                            e.materials !== undefined
                                    )
                                    .map((e) => e.materials)
                                    .flat();
                                return [
                                    ...state.hand,
                                    ...state.field.monsterZones,
                                    ...state.field.extraMonsterZones,
                                    ...extraMaterialCandidate,
                                ].filter(
                                    (e): e is CardInstance =>
                                        e !== null && monsterFilter(e.card) && e.card.race === "機械"
                                );
                            },
                            {
                                select: "multi",
                                condition: (cardList, state) => {
                                    const ritualMonster = ritual[0].card as MonsterCard;
                                    const monsterList = cardList.map((e) => e.card) as MonsterCard[];
                                    const sumOfAttack = monsterList.reduce((prev, cur) => prev + cur.attack, 0);
                                    return (
                                        sumOfAttack >= ritualMonster.attack &&
                                        monsterList.every((e) => sumOfAttack - e.attack < ritualMonster.attack) &&
                                        hasEmptyMonsterZoneWithExclude(state, cardList)
                                    );
                                },
                                message: "儀式素材として使用する機械族モンスターを選択してください",
                            },
                            (state, card, selected) => {
                                for (const select of selected) {
                                    sendCard(state, select, "Graveyard");
                                }
                                withUserSummon(state, card, ritual[0], {}, (state) => {
                                    resolve?.(state, getCardInstanceFromId(state, spellId)!);
                                });
                            }
                        );
                    }
                );
            },
        },
        onIgnition: {
            condition: (state, instance) => {
                return withTurnAtOneceCondition(
                    state,
                    instance,
                    (state, instance) =>
                        instance.location === "Graveyard" &&
                        [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                            (e): e is CardInstance =>
                                e !== null && e.card.card_name.includes("竜輝巧") && getAttack(e) >= 1000
                        ).length > 0
                );
            },
            effect: (state, instance) => {
                withTurnAtOneceEffect(state, instance, (state, instance) => {
                    withUserSelectCard(
                        state,
                        instance,
                        (state) =>
                            [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                                (e): e is CardInstance =>
                                    e !== null && e.card.card_name.includes("竜輝巧") && getAttack(e) >= 1000
                            ),
                        {
                            select: "single",
                            message: "攻撃力を下げる対象のドライトロンモンスターを選択してください",
                        },
                        (state, instance, selected) => {
                            addBuf(state, selected[0], { attack: -1000, defense: 0, level: 0 });
                            sendCard(state, instance, "Hand");
                        }
                    );
                });
            },
        },
    },
} satisfies MagicCard;
