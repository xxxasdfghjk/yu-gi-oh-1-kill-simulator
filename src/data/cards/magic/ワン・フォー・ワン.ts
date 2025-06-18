import type { MagicCard } from "@/types/card";
import { monsterFilter, hasLevelMonsterFilter } from "@/utils/cardManagement";
import { withUserSelectCard, withUserSummon } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { getCardInstanceFromId, hasEmptyMonsterZone } from "@/utils/gameUtils";

const card = {
    card_name: "ワン・フォー・ワン",
    card_type: "魔法" as const,
    magic_type: "通常魔法" as const,
    text: "①：手札からモンスター１体を墓地へ送って発動できる。手札・デッキからレベル１モンスター１体を特殊召喚する。",
    image: "card100013349_1.jpg",
    effect: {
        onSpell: {
            condition: (state) => {
                if (state.hand.filter((e) => monsterFilter(e.card)).length === 0) {
                    return false;
                }
                if (
                    [...state.deck, ...state.hand].filter((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1)
                        .length === 0
                ) {
                    return false;
                }
                // 手札にレベル1モンスター一体かつ手札コストとして払えるのがそれだけかつデッキに１コスがない場合NG
                if (
                    state.deck.filter((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1).length === 0 &&
                    state.hand.filter((e) => monsterFilter(e.card)).length === 1 &&
                    state.hand.filter((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1).length === 1
                ) {
                    return false;
                }
                if (!hasEmptyMonsterZone(state)) {
                    return false;
                }
                return true;
            },
            effect: (state, card, _, resolve) =>
                withUserSelectCard(
                    state,
                    card,
                    (state) => state.hand.filter((e) => monsterFilter(e.card)),
                    {
                        select: "single",
                        message: "手札から墓地に送るモンスターを選択してください",
                        condition: (cardList, state) => {
                            const targetList = [...state.hand, ...state.deck].filter(
                                (e) => hasLevelMonsterFilter(e.card) && e.card.level === 1
                            );
                            if (targetList.length >= 2) {
                                return true;
                            }
                            if (targetList.length === 1) {
                                return targetList[0].id !== cardList[0].id;
                            } else {
                                return false;
                            }
                        },
                    },
                    (state, card, select) => {
                        const cardId = card.id;

                        sendCard(state, select[0], "Graveyard");
                        withUserSelectCard(
                            state,
                            card,
                            (state) =>
                                [...state.hand, ...state.deck].filter(
                                    (e) => hasLevelMonsterFilter(e.card) && e.card.level === 1
                                ),
                            {
                                select: "single",
                                message: "特殊召喚するレベル1モンスターを選択してください",
                            },
                            (state, card, selected) => {
                                withUserSummon(state, card, selected[0], {}, (state) => {
                                    resolve?.(state, getCardInstanceFromId(state, cardId)!);
                                });
                            }
                        );
                    }
                ),
        },
    },
} satisfies MagicCard;

export default card;
