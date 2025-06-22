import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withDraw,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withOption,
    withSendToGraveyard,
} from "@/utils/effectUtils";
import { addBuf, sendCardToGraveyardByEffect } from "@/utils/cardMovement";
import { getAttack, getLevel } from "@/utils/gameUtils";
import { monsterFilter } from "@/utils/cardManagement";
import { CardInstanceFilter } from "@/utils/CardInstanceFilter";
import type { XyzMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "No.60 刻不知のデュガレス",
    card_type: "モンスター" as const,
    text: "レベル４モンスター×２ このカード名の効果は１ターンに１度しか使用できない。①：このカードのX素材を２つ取り除き、以下の効果から１つを選択して発動できる。 ●自分はデッキから２枚ドローし、その後手札を１枚選んで捨てる。次の自分ドローフェイズをスキップする。 ●自分の墓地からモンスター１体を選んで守備表示で特殊召喚する。次の自分メインフェイズ１をスキップする。 ●自分フィールドのモンスター１体を選び、その攻撃力をターン終了時まで倍にする。次の自分ターンのバトルフェイズをスキップする。",
    image: "card100322907_1.jpg",
    monster_type: "エクシーズモンスター",
    rank: 4,
    element: "炎" as const,
    race: "悪魔" as const,
    attack: 1200,
    defense: 1200,
    hasDefense: true as const,
    hasLevel: false as const,
    hasRank: true as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        return card.materials.length >= 2;
                    },
                    "Dugares_Effect"
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        // X素材を2つ取り除く
                        if (card.materials.length >= 2) {
                            // ユーザーに2つの素材を選択させる
                            withUserSelectCard(
                                state,
                                card,
                                () => card.materials,
                                {
                                    select: "multi",
                                    message: "墓地に送るX素材を2つ選択してください",
                                    condition: (selected) => selected.length === 2,
                                },
                                (state, card, selected) => {
                                    if (selected.length === 2) {
                                        // 選択した素材を取り除く
                                        console.log(selected);
                                        withSendToGraveyard(state, card, selected, (state, card) => {
                                            withOption(
                                                state,
                                                card,
                                                [
                                                    {
                                                        name: "デッキから2枚ドロー、手札1枚捨てる（次のドローフェイズスキップ）",
                                                        condition: () => true,
                                                    },
                                                    {
                                                        name: "墓地からモンスター1体を守備表示で特殊召喚（次のメインフェイズ1スキップ）",
                                                        condition: (state) =>
                                                            new CardSelector(state)
                                                                .graveyard()
                                                                .filter()
                                                                .monster()
                                                                .len() > 0,
                                                    },
                                                    {
                                                        name: "フィールドのモンスター1体の攻撃力を倍にする（次のバトルフェイズスキップ）",
                                                        condition: (state) =>
                                                            new CardSelector(state)
                                                                .allMonster()
                                                                .filter()
                                                                .nonNull()
                                                                .len() > 0,
                                                    },
                                                ],
                                                (state, card, option) => {
                                                    if (
                                                        option ===
                                                        "デッキから2枚ドロー、手札1枚捨てる（次のドローフェイズスキップ）"
                                                    ) {
                                                        // ドロー効果
                                                        withDraw(state, card, { count: 2 }, (state, card) => {
                                                            const handCards = (state: GameStore) =>
                                                                new CardSelector(state).hand().getNonNull();

                                                            withUserSelectCard(
                                                                state,
                                                                card,
                                                                handCards,
                                                                {
                                                                    select: "single",
                                                                    message: "捨てる手札を1枚選択してください",
                                                                },
                                                                (state, card, selected) => {
                                                                    if (selected.length > 0) {
                                                                        sendCardToGraveyardByEffect(
                                                                            state,
                                                                            selected[0],
                                                                            card
                                                                        );
                                                                    }
                                                                    // 次のドローフェイズスキップ（フラグ設定は省略）
                                                                }
                                                            );
                                                        });
                                                    } else if (
                                                        option ===
                                                        "墓地からモンスター1体を守備表示で特殊召喚（次のメインフェイズ1スキップ）"
                                                    ) {
                                                        // 蘇生効果
                                                        const graveyardMonsters = (state: GameStore) =>
                                                            new CardSelector(state)
                                                                .graveyard()
                                                                .filter()
                                                                .monster()
                                                                .get();

                                                        withUserSelectCard(
                                                            state,
                                                            card,
                                                            graveyardMonsters,
                                                            {
                                                                select: "single",
                                                                message: "特殊召喚するモンスターを選択してください",
                                                            },
                                                            (state, card, selected) => {
                                                                if (selected.length > 0) {
                                                                    withUserSummon(
                                                                        state,
                                                                        card,
                                                                        selected[0],
                                                                        {
                                                                            canSelectPosition: false,
                                                                            optionPosition: ["defense"],
                                                                        },
                                                                        () => {}
                                                                    );
                                                                }
                                                                // 次のメインフェイズ1スキップ（フラグ設定は省略）
                                                            }
                                                        );
                                                    } else if (
                                                        option ===
                                                        "フィールドのモンスター1体の攻撃力を倍にする（次のバトルフェイズスキップ）"
                                                    ) {
                                                        // 攻撃力倍化効果
                                                        const fieldMonsters = (state: GameStore) =>
                                                            new CardSelector(state)
                                                                .allMonster()
                                                                .filter()
                                                                .nonNull()
                                                                .get();

                                                        withUserSelectCard(
                                                            state,
                                                            card,
                                                            fieldMonsters,
                                                            {
                                                                select: "single",
                                                                message: "攻撃力を倍にするモンスターを選択してください",
                                                            },
                                                            (state, _card, selected) => {
                                                                if (selected.length > 0) {
                                                                    const targetMonster = selected[0];
                                                                    const currentAttack = getAttack(targetMonster);
                                                                    // 攻撃力を倍にする（ターン終了時まで）
                                                                    addBuf(state, targetMonster, {
                                                                        attack: currentAttack,
                                                                        defense: 0,
                                                                        level: 0,
                                                                    });
                                                                }
                                                                // 次のバトルフェイズスキップ（フラグ設定は省略）
                                                            }
                                                        );
                                                    }
                                                }
                                            );
                                        });
                                    }
                                }
                            );
                        }
                    },
                    "Dugares_Effect"
                );
            },
        },
    },
    filterAvailableMaterials: (card) => {
        return monsterFilter(card.card) && card.card.hasLevel && getLevel(card) === 4;
    },
    materialCondition: (cards) => {
        return cards.length === 2 && new CardInstanceFilter(cards).level(4).len() === 2;
    },
} satisfies XyzMonsterCard;
