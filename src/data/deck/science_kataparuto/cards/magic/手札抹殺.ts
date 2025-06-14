import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withDelay, withDelayRecursive } from "@/utils/effectUtils";

export default {
    card_name: "手札抹殺",
    card_type: "魔法" as const,
    text: "お互いの手札を全て捨てた後、それぞれ自分のデッキから捨てた枚数分だけカードを引く。",
    image: "card100014788_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state, card) => {
                return new CardSelector(state).hand().filter().excludeId(card.id).len() > 0;
            },
            effect: (state, card) => {
                withDelay(state, card, { delay: 500 }, (state, card) => {
                    const handCard = new CardSelector(state).hand().filter().excludeId(card.id).nonNull().get();
                    withDelayRecursive(
                        state,
                        card,
                        { delay: 100 },
                        handCard.length,
                        (state, _card, depth) => {
                            sendCard(state, handCard[depth - 1], "Graveyard");
                        },
                        (state, card) => {
                            withDelayRecursive(state, card, { delay: 100 }, handCard.length, (state, _card, depth) => {
                                sendCard(state, state.deck[depth - 1], "Hand");
                            });
                        }
                    );
                });
            },
        },
    },
} satisfies MagicCard;
