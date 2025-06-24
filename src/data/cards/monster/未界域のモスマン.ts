import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withDraw,
    withTurnAtOneceEffect,
    withDelay,
    withNotification,
} from "@/utils/effectUtils";
import { sendCardToGraveyardByEffect } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { getCardInstanceFromId } from "@/utils/gameUtils";

export default {
    card_name: "未界域のモスマン",
    card_type: "モンスター" as const,
    text: "このカード名の②の効果は１ターンに１度しか使用できない。①：手札のこのカードを相手に見せて発動できる。自分の全ての手札の中から、相手がランダムに１枚選び、自分はそのカードを捨てる。それが「未界域のモスマン」以外だった場合、さらに手札から「未界域のモスマン」１体を特殊召喚し、自分はデッキから１枚ドローする。②：このカードが手札から捨てられた場合に発動できる。お互いはそれぞれデッキから１枚ドローする。その後、ドローしたプレイヤーは自身の手札を１枚選んで捨てる。",
    image: "card100276920_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "闇" as const,
    race: "昆虫" as const,
    attack: 1800,
    defense: 400,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return card.location === "Hand";
            },
            effect: (state, card) => {
                // ①の効果：手札のこのカードを相手に見せて発動
                const handCards = state.hand;

                if (handCards.length === 0) return;

                // ランダムに1枚選択（相手がランダムに選ぶのを簡略化）
                const randomIndex = Math.floor(Math.random() * handCards.length);
                const selectedCard = handCards[randomIndex];
                const selectedCardId = selectedCard.id;
                withNotification(
                    state,
                    card,
                    {
                        message: `相手がランダムに選んだカード: ${selectedCard.card.card_name}`,
                    },
                    (state, card) => {
                        const selected = getCardInstanceFromId(state, selectedCardId)!;
                        // 選ばれたカードを捨てる
                        sendCardToGraveyardByEffect(state, selected, card);

                        // 選ばれたカードが「未界域のモスマン」以外だった場合
                        if (selected.card.card_name !== "未界域のモスマン") {
                            withDelay(state, card, { delay: 500 }, (state, card) => {
                                // 手札から「未界域のモスマン」を特殊召喚
                                const mothmanInHand = (state: GameStore) =>
                                    new CardSelector(state)
                                        .hand()
                                        .getNonNull()
                                        .filter((c) => c.card.card_name === "未界域のモスマン");

                                if (mothmanInHand.length > 0) {
                                    withUserSelectCard(
                                        state,
                                        card,
                                        mothmanInHand,
                                        {
                                            select: "single",
                                            message: "特殊召喚する「未界域のモスマン」を選択してください",
                                        },
                                        (state, card, selected) => {
                                            if (selected.length > 0) {
                                                withUserSummon(
                                                    state,
                                                    card,
                                                    selected[0],
                                                    {
                                                        canSelectPosition: true,
                                                        optionPosition: ["attack", "defense"],
                                                    },
                                                    (state, card) => {
                                                        // 1枚ドロー
                                                        withDraw(state, card, { count: 1 });
                                                    }
                                                );
                                            }
                                        }
                                    );
                                } else {
                                    // モスマンがいない場合でも1枚ドロー
                                    withDraw(state, card, { count: 1 });
                                }
                            });
                        }
                    }
                );
            },
        },
        onHandToGraveyard: (state, card) => {
            // ②の効果：このカードが手札から捨てられた場合
            withTurnAtOneceEffect(
                state,
                card,
                (state, card) => {
                    withDraw(state, card, { count: 1 }, (state, card) => {
                        // その後、ドローしたプレイヤーは自身の手札を1枚選んで捨てる
                        const handCards = (state: GameStore) => state.hand;

                        if (handCards.length > 0) {
                            withUserSelectCard(
                                state,
                                card,
                                handCards,
                                {
                                    select: "single",
                                    message: "手札から1枚選んで捨ててください",
                                },
                                (state, _card, selected) => {
                                    if (selected.length > 0) {
                                        sendCardToGraveyardByEffect(state, selected[0], _card);
                                    }
                                }
                            );
                        }
                    });
                },
                "Mothman_HandDiscard"
            );
        },
    },
} satisfies LeveledMonsterCard;
