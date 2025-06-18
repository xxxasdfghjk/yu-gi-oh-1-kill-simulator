import type { MagicCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { withDelay, withDraw, withSendToGraveyard, withUserSelectCard } from "@/utils/effectUtils";

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
            effect: (state, card, _, resolve) => {
                withDraw(state, card, { count: 3 }, (state, card) => {
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
                                withSendToGraveyard(state, card, selected, (state, card) => {
                                    withDelay(state, card, {}, (state, card) => {
                                        resolve?.(state, card);
                                    });
                                });
                            }
                        );
                    });
                });
            },
        },
    },
} satisfies MagicCard;
