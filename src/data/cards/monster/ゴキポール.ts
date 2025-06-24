import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceEffect,
    withUserConfirm,
    withTurnAtOneceCondition,
} from "@/utils/effectUtils";
import { sendCard, destroyByEffect } from "@/utils/cardMovement";
import { getAttack, getCardInstanceFromId } from "@/utils/gameUtils";
import type { LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { monsterFilter } from "../../../utils/cardManagement";

export default {
    card_name: "ゴキポール",
    card_type: "モンスター" as const,
    text: "このカード名の効果は１ターンに１度しか使用できない。 ①：このカードが墓地へ送られた場合に発動できる。デッキからレベル４の昆虫族モンスター１体を手札に加える。この効果で通常モンスターを手札に加えた場合、さらにそのモンスターを手札から特殊召喚できる。その後、この効果で特殊召喚したモンスターの攻撃力以上の攻撃力を持つ、フィールドのモンスター１体を選んで破壊できる。",
    image: "card100110945_1.jpg",
    monster_type: "効果モンスター",
    level: 3,
    element: "地" as const,
    race: "昆虫" as const,
    attack: 1000,
    defense: 1200,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onAnywhereToGraveyard: (state, card) => {
            if (!withTurnAtOneceCondition(state, card, () => true)) {
                return;
            }
            // デッキからレベル4の昆虫族モンスターを検索
            const level4InsectInDeck = (state: GameStore) =>
                new CardSelector(state).deck().filter().monster().level(4).race("昆虫").get();

            const availableMonsters = level4InsectInDeck(state);

            if (availableMonsters.length > 0) {
                withUserSelectCard(
                    state,
                    card,
                    level4InsectInDeck,
                    {
                        select: "single",
                        message: "手札に加えるレベル4の昆虫族モンスターを選択してください",
                        canCancel: true,
                    },
                    (state, card, selected) => {
                        const selectedId = selected[0].id;
                        withTurnAtOneceEffect(state, card, (state, card) => {
                            const selectedMonster = getCardInstanceFromId(state, selectedId)!;
                            sendCard(state, selectedMonster, "Hand");
                            // 通常モンスターかチェック
                            if (
                                monsterFilter(selectedMonster.card) &&
                                selectedMonster.card.monster_type === "通常モンスター"
                            ) {
                                withUserConfirm(
                                    state,
                                    card,
                                    {
                                        message: `「${selectedMonster.card.card_name}」を特殊召喚しますか？`,
                                    },
                                    (state, card) => {
                                        withUserSummon(
                                            state,
                                            card,
                                            selectedMonster,
                                            {
                                                canSelectPosition: true,
                                                optionPosition: ["attack", "defense"],
                                            },
                                            (state, card) => {
                                                // 特殊召喚したモンスターの攻撃力を取得
                                                const summonedAttack = getAttack(selectedMonster);

                                                // フィールドのモンスターで攻撃力が同じかそれ以上のものを検索
                                                const destroyableMonsters = new CardSelector(state)
                                                    .allMonster()
                                                    .filter()
                                                    .nonNull()
                                                    .get()
                                                    .filter((m) => getAttack(m) >= summonedAttack);

                                                if (destroyableMonsters.length > 0) {
                                                    withUserConfirm(
                                                        state,
                                                        card,
                                                        {
                                                            message: "フィールドのモンスターを破壊しますか？",
                                                        },
                                                        (state, card) => {
                                                            withUserSelectCard(
                                                                state,
                                                                card,
                                                                () => destroyableMonsters,
                                                                {
                                                                    select: "single",
                                                                    message: "破壊するモンスターを選択してください",
                                                                },
                                                                (state, _card, selected) => {
                                                                    if (selected.length > 0) {
                                                                        destroyByEffect(state, selected[0]);
                                                                    }
                                                                }
                                                            );
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    }
                                );
                            }
                        });
                    }
                );
            }
        },
    },
} satisfies LeveledMonsterCard;
