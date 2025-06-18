import type { MagicCard, CardInstance } from "@/types/card";
import { hasLevelMonsterFilter } from "@/utils/cardManagement";
import { withUserSelectCard, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

const card = {
    card_name: "ジャック・イン・ザ・ハンド",
    card_type: "魔法" as const,
    magic_type: "通常魔法" as const,
    text: "このカード名のカードは1ターンに1枚しか発動できない。①：デッキからカード名が異なるレベル1モンスター3体を相手に見せ、相手はその中から1体を選んで自身の手札に加える。自分は残りのカードの中から1体を選んで手札に加え、残りをデッキに戻す。",
    image: "card100204881_1.jpg",
    effect: {
        onSpell: {
            condition: (state, card) =>
                withTurnAtOneceCondition(state, card, (state) => {
                    // Get all level 1 monsters from deck
                    const level1Monsters = state.deck.filter(
                        (e) => hasLevelMonsterFilter(e.card) && e.card.level === 1
                    );
                    // Check if we have at least 3 different card names
                    const uniqueNames = new Set(level1Monsters.map((e) => e.card.card_name));
                    return uniqueNames.size >= 3;
                }),
            effect: (state, card, _, resolve) =>
                withTurnAtOneceEffect(state, card, () => {
                    // Player selects from remaining 2 cards
                    withUserSelectCard(
                        state,
                        card,
                        (state) =>
                            state.deck
                                .filter((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1)
                                .reduce<CardInstance[]>(
                                    (prev, cur) =>
                                        prev.find((e) => e.card.card_name === cur.card.card_name)
                                            ? prev
                                            : [...prev, cur],
                                    []
                                ),
                        {
                            select: "multi",
                            condition: (cards) => cards.length === 3,
                            message: "デッキから異なるレベル1モンスター3体を選択してください",
                        },
                        (state, _cardInstance, selected) => {
                            const rand = Math.floor(Math.random() * 3);
                            const option = selected.filter((_, i) => i !== rand);
                            withUserSelectCard(
                                state,
                                _cardInstance,
                                () => option,
                                { select: "single", message: "手札に加えるレベル1モンスターを選択してください" },
                                (state, card, selected) => {
                                    sendCard(state, selected[0], "Hand");
                                    resolve?.(state, card);
                                }
                            );
                        }
                    );
                }),
        },
    },
} satisfies MagicCard;

export default card;
