import type { MagicCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { withDraw, withSendToGraveyard } from "@/utils/effectUtils";

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
            effect: (state, card, _, resolve) => {
                const handCard = new CardSelector(state).hand().filter().excludeId(card.id).nonNull().get();
                withSendToGraveyard(state, card, handCard, (state, card) =>
                    withDraw(state, card, { count: handCard.length }, (state, card) => {
                        resolve?.(state, card);
                    })
                );
            },
        },
    },
} satisfies MagicCard;
