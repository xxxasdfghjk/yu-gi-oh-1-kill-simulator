import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withDelay, withUserSelectCard } from "@/utils/effectUtils";

export default {
    card_name: "天使の施し",
    card_type: "魔法" as const,
    text: "デッキからカードを３枚引き、その後手札からカードを２枚捨てる。",
    image: "card100161246_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                return new CardSelector(state).deck().len() >= 2;
            },
            effect: (state, card) => {
                withDelay(state, card, { delay: 500 }, (state, card) => {
                    for (let i = 0; i < 3; i++) {
                        withDelay(state, card, { delay: 30 * i, order: -3 }, (state) => {
                            sendCard(state, state.deck[0], "Hand");
                        });
                    }
                    withDelay(state, card, { delay: 200, order: 0 }, (state, card) => {
                        withUserSelectCard(
                            state,
                            card,
                            (state) => new CardSelector(state).hand().getNonNull(),
                            {
                                select: "multi",
                                condition: (list) => list.length === 2,
                            },
                            (state, card, selected) => {
                                for (let i = 0; i < 2; i++) {
                                    withDelay(state, card, { delay: 20 * i }, (state) => {
                                        sendCard(state, selected[i], "Graveyard");
                                    });
                                }
                            }
                        );
                    });
                });
            },
        },
    },
} satisfies MagicCard;
